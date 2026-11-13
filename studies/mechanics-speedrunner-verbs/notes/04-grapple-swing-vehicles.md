# 04. Grapple, swing, rope and hook verbs, plus temporary verb swaps (vehicles, items)

Researcher 04. Scope: SpeedRunners' hook and swing, LBP's grab-and-swing and LBP2 Grappling Hook, Bionic Commando,
Worms' Ninja Rope, Spider-Man 2's swing (Fristrom), Ghostrunner, Terraria hooks, Umihara Kawase, Spelunky's rope and
whip, Mario Maker's Lakitu Cloud and Clear Pipe, Jetpack Joyride vehicles, Doodle Jump items, LBP3 power-ups and
characters. Then the minimal rope simulation and whether the samurai should have a grapple at all.

Tags: [C] cited finding, [I] inference, [V] vendor or press claim, [K] Kingsfoil fact from `01-current-build.md`,
[S4] settled in Mechanics #1. Numbers in SpeedRunner units: 1 BL = 46 u, maxRun 420 u/s, gravity 2500 u/s², jumpVel 830.

Research conditions: Fandom (LBP, Spelunky, Doodle Jump) returned 402, worms2d.info and the Jetpack Joyride wiki sit
behind Anubis bot protection, AppGamer and Prima returned 403, Hardcore Gaming 101 is mid-migration. Where a game's
exact numbers were unreachable this file says so and gives the ratio from a reachable game instead. Terraria's wiki.gg
hook table is the one complete numeric dataset here, and it is the backbone of the feel numbers below.

---

## 1. SpeedRunners (DoubleDutch Games / tinyBuild, early access 26 Aug 2013, 1.0 19 Apr 2016)

### Takeaway
SpeedRunners is the one game on the list where the hook is a race verb, not a traversal puzzle. It is a 4-player
elimination race: the camera follows the leader, fall off the back of the screen and you are out, the screen shrinks
after each elimination [C1]. The hook exists to let the trailing players catch up through the air, and the Golden Hook
item turns the same verb into a positional swap. Everything about its aim is automatic so the player's only decisions
are "when to fire" and "when to let go".

### Cited findings
- Format: four players, local or online; "keep up with the fastest racer or fall off-screen" [C2]. Last one standing
  wins a round; 3 round wins per match (teams of 2 need 4 and share a Sprinting Meter) [C1].
- Verbs listed by the publisher: run, jump, swing; weapons and pick-ups include missiles, mines, grappling hooks,
  rockets, bombs; "grapple onto opponents to knock them off the screen" [C2]. "Controller compatible (and
  recommended!)" [C2]; no button map published on the store page.
- Trails become visible at "super-speed" [C2], which is the boost state the Sprinting Meter feeds [I].
- Golden Hook: a pick-up that grabs the player in front and pulls them behind you (press: "grabs the player at the front
  of the pack, dragging them backwards and flinging you ahead", the game's blue shell) [C3]. Fan guides say a held Shield
  blocks it and a dropped Crate intercepts it [C4, low-quality source].
- Fan guides describe a "short swing" (release early for forward speed, late for height) and a "wall-hook" (wall jump
  into an immediate hook) as the two advanced techniques [C4, unverified].

### Inferences (from play memory and the sources above; no frame data found)
- Input: one button, held. The hook fires on a fixed up-forward diagonal in the facing direction (about 45°), there is
  no manual aim. It attaches to ceilings and any hookable solid above (not to walls or floors), so levels are built with
  long ceilings over gaps. Release is on button up. Momentum is kept, which is where the "swing to pass" comes from.
- The rope is fixed-length from the moment of attach (no reel) and the swing is a plain pendulum; the hook travels
  quickly enough that the attach feels instant at race speed.
- Race effect: because every player has the same hook and the same ceilings, the hook is a pure timing test, so the
  skill ceiling is in release timing and in chaining hook into slide into boost, not in aiming. The Golden Hook is
  the only "aimed" hook and it is aimed by the game.

### Gaps
No frame data, hook speed, rope length or release boost were found in a primary source. The SpeedRunners Fandom and
Steam guides were not reachable this session. Hook length and arc are best measured from a video frame-step.

See it: https://store.steampowered.com/app/207140/SpeedRunners/ (trailer) [C2]; https://en.wikipedia.org/wiki/SpeedRunners [C1].

---

## 2. LittleBigPlanet: grab-and-swing (LBP1, 2008) and the Grappling Hook (LBP2, Jan 2011)

### Takeaway
LBP's base swing is "hold R1 on sponge". The LBP2 Grappling Hook turns that into a ranged grab with a reel: it fires
along the aim stick, sticks only to grabbable material, and the stick reels the rope in and out. It is a creator tool,
so its rope length is a level-design knob (keep the rope short to avoid the electrified floor) [C6].

### Cited findings
- The LBP2 hook "grabs hard-to-reach areas", pulls two- and three-way switches, and can drag other characters or
  objects toward the player [C5, snippet only; page 402].
- Preview: fired with a shoulder button, it "sticks almost instantly" and pulls the player along at considerable speed [C7].
- A walkthrough tells the player to keep the rope short in one section to avoid electrified areas [C6], so length is
  player-controlled. Other walkthroughs describe climbing and descending the rope and pulling up to reach items [C8].
- Media Molecule's LBP2 "Sackzan" featurette (Sept 2010) is the designer-facing demo of the hook [C9].

### Inferences
- Grab (LBP1): hold R1 while touching sponge, Sackboy hangs from the point of contact, swing momentum comes from
  stick input while hanging, release on R1 up keeps velocity. Fixed length (the contact point), any sponge.
- Grappling Hook (LBP2): R1 fires toward the left stick direction (any angle), the rope attaches only to grabbable
  material (the creator paints what is hookable), stick up/down reels in and out, jump or release lets go.
  The reel is what makes it a puzzle verb: climbing the rope is a slow vertical, reeling in during a swing adds speed.

### Gaps
Rope max length, reel speed and swing damping are not published. Media Molecule has no technical write-up of the hook.

See it: https://gematsu.com/2010/09/new-littlebigplanet-2-trailer-shows-off-grappling-hook [C9].

---

## 3. Bionic Commando (Capcom, NES 1988) and Bionic Commando Rearmed (GRIN, 2008)

### Takeaway
The clearest case of "the hook is the only vertical verb". Spencer cannot jump; the arm fires up, diagonally up, or
forward, latches to overhead solids, and the swing-and-release is how every ledge is reached. GRIN kept this in Rearmed
on purpose and called it the identity of the series; Rearmed 2 (2011) added a jump and then shipped a mode that turns it
off again [C10, C11].

### Cited findings
- Viklund (GRIN): the arm was "such an unconventional movement mechanic", "the fact that you couldn't jump, but needed
  to use the arm"; Rearmed keeps "exactly the same movement" and players still find it hard to adjust to [C10].
- Capcom producer on Rearmed 2: "Bionic Commando is defined by the hook and the arm and traversal", so adding a jump
  was accepted, with a no-jump mode after you beat the game [C11].
- A Worth Playing interview says the swing was hard to master "from a design standpoint" and was heavily focus-tested [C12].
- Critical Gaming: releasing into a swing-jump is done by holding a direction, not by the grapple button [C13].
- GRIN's 3D game blocks hooking with glowing cracks on surfaces so designers can forbid a climb without invisible
  walls, and has no fall damage so a missed swing only costs the climb back [C10].

### Inferences
- Input: one button plus the d-pad direction at press (up, up-forward, forward). Startup is the arm's travel (a few
  frames on NES); the arm's reach is about 2.5 tiles (NES) [I, uncited]. Fixed-length rope, no reel, three fixed angles.
- The three fixed angles are what make it readable and deterministic. A free-aim hook would have been much harder on
  the NES pad and would have made the puzzle rooms ambiguous.

See it: https://www.gamedeveloper.com/game-platforms/interview-grin-s-viklund-on-rearming-capcom-s-i-bionic-commando-i- [C10].

---

## 4. Worms: the Ninja Rope (Team17, Worms 2 1997, Armageddon 1999)

### Takeaway
The community's reference pendulum. Fire at an angle, the rope latches to terrain, left/right pumps the swing,
up/down retracts and extends, release at the right moment and fire again mid-air. "It's simply a pendulum" is the
community's own description of the physics [C14], and the depth comes from retract speed changing the swing radius
(shorter rope, faster angular speed) and from bouncing off terrain at full extension [C15].

### Cited findings
- Community attempt to replicate the rope: "It's simply a pendulum" with a force-based engine, and the naive version
  had problems [C14].
- The classic trick: "extend the rope fully, smack into a solid surface, and then retract", which maximises the speed
  boost from bouncing off the wall [C15].
- Worms Armageddon restricts the firing angle by the power setting and cannot fire below the horizontal; Worms 2 had
  higher acceleration and a wider arc, which the RubberWorm mod's "Improved rope" option restores [C16].
- Scheme files expose Maximum rope speed (0 to 255) and the editor exposes Retreat Time, Number of Shoots, Range [C17, C18].
- XBLA port thread: the worm "is much heavier and falls very rapidly", "It takes a lot more time to get momentum" [C19].

### Gaps
Default rope length in pixels, retract speed per frame and the speed cap in px/frame were not reachable (worms2d.info
blocked). Roping is a whole competitive scheme ("Rope Race", "Shopper") and would need its own study.

See it: https://worms2d.info/Rope_Knocking_(scheme) [C20]; https://www.pcgamer.com/uk/why-i-love-the-grappling-hook [C15].

---

## 5. Spider-Man 2 (Treyarch, 2004): Jamie Fristrom's swing

### Takeaway
The most-quoted design lesson for any swing: anchor the rope to real geometry, not the sky, so the player is a true
pendulum, and crank gravity to about 10x Earth so the pendulum is fast enough to be exciting [C21]. Fristrom's own
tutorial gives the exact constraint maths used in Spider-Man 2 and Energy Hook, reproduced in section 14 [C22].

### Cited findings
- "Gravity in Spider-Man 2 is about 10 times Earth normal", the only way to make the speed feel exciting [C21].
- He rejected webs attached to the sky. The first system anchored to building corners; more anchors reduced confusion,
  so the team extended it to all surfaces with rays "like feelers" to find swing points [C21].
- Wall-sticking was turned off, one of the biggest changes from the prototype [C21].
- Some playtesters ran at street level instead of swinging; Bruce Campbell's voice-over mocked them back into the
  air: "We found that you could make fun of your players" [C21].
- The tutorial: Euler integration, a sphere constraint (`testPosition = (testPosition - tetherPoint).Normalized() *
  tetherLength`), velocity recomputed from the corrected move (`avatar.velocity = (testPosition - avatar.position)/deltaT`),
  attach via raycast against world geometry, wrapping by raycasting along the rope every frame, and three distance bands
  in Spider-Man 2: too close breaks the web, mid-range wraps, far away passes through [C22].
- For elastic webs: `tetherLength = (avatar.position - tetherPoint).Length()` removes slack each frame; a
  `desiredLength` that `currentLength` approaches over time gives a soft reel; shorten the rope when the attach point
  is low so the avatar does not snap upward [C22].
- GDC 2019 "Classic Game Design Postmortem: Swinging with Spider-Man" [C23]; GDC preview: swinging mechanics
  "tend to err on the side of *too* challenging" [C24].

See it: https://gdcvault.com/play/1025725/Classic-Game-Design-Postmortem-Swinging [C23].

---

## 6. Ghostrunner (One More Level, 2020) and Ghostrunner 2 (2023)

### Takeaway
Hook points, not surfaces. The grapple fires only at sky-blue orbs placed by the designer, works from ground or air,
pulls (zips) rather than swings in GR1, and GR2 adds a swinging "gap-jammer" on cranes plus shuriken that create hook
points on marked walls or on a large enemy [C25, C26, C27]. Levels are built around the orbs, so the grapple is a
routing signpost: see an orb, that is the way.

### Cited findings
- "Aiming at sky-blue orbs ... lets the player zip to them and swing" [C25]. Works from the ground or mid-air and
  can rescue a fall [C26].
- GR2: swings from cranes, attaches to certain surfaces, shuriken create grapple points on specific walls [C27];
  throwing a shuriken at a large enemy turns it into a grapple point [C28].

### Inference
A fixed hook point is the cheapest way to make a grapple deterministic and readable: no aim, no ray, no wrapping.
It costs level authoring (one orb per intended swing) and removes the "any ceiling" improvisation of SpeedRunners.

See it: https://www.gamesradar.com/ghostrunner-has-some-amazing-traversal-skills-for-exploring-its-cyberpunk-city [C26].

---

## 7. Terraria hooks (Re-Logic, 2011 onward): the one complete numeric table

### Takeaway
Terraria publishes reach, launch, retract and pull speed for 27 hooks. It is a pull (zip) hook, not a swing, but the
ratios are the best public reference for how fast a hook projectile and pull should be relative to the player. The
player is 3 tiles tall and walks at 15 mph (wiki.gg's movement page baseline), so the table converts to body lengths
and run speeds directly [C29].

### Cited findings (wiki.gg, 1.4.4) [C29]
| Hook | Reach (tiles) | Reach (BL, 3 tiles = 1 BL) | Launch mph | Pull mph |
|---|---|---|---|---|
| Grappling Hook (first) | 18.75 | 6.25 | 59 | 56 |
| Diamond Hook | 28.125 | 9.4 | 64 | 56 |
| Bat Hook | 31.25 | 10.4 | 69 | 72 |
| Dual Hook | 27.5 | 9.2 | 74 | 64 |
| Static Hook (no pull) | 37.5 | 12.5 | 82 | 31 |
| Lunar Hook (4 hooks) | 34.375 | 11.5 | 92 | 82 |
| Hook of Dissonance | 31.25 | 10.4 | 82 | teleports |

- Launch is the hook projectile speed, Pull is the player's speed toward the latched point; most hooks pull at 56 mph [C29].
- Latching: immune to gravity and knockback; resets fall damage, extra jumps and wing flight time; jumping releases;
  firing again releases a single hook; multi-hooks suspend you between two latched points; the Anti-Gravity Hook holds
  you about 12.5 tiles from the point instead of pulling [C29].
- Hooks auto-disengage after 10 minutes (Dissonance 2.5) [C29].

### Inference: the ratios
Walk 15 mph, first hook launch 59 mph, pull 56 mph: hook projectile about 4x run speed, pull about 3.7x run speed,
first reach about 6 BL, late-game reach 10 to 12 BL. In SpeedRunner units: projectile 1700 u/s, pull 1550 u/s,
reach 290 u (6.25 BL) for a starter hook. Those are the starting values in section 15.

See it: https://terraria.wiki.gg/wiki/Hooks [C29].

---

## 8. Umihara Kawase (Kiyoshi Sakai, TNN, Super Famicom 1994)

### Takeaway
The canonical elastic rope platformer. Kawase casts a fishing line with a rubber lure; it hooks "most surfaces and
enemy fish", supports her weight, lets her swing, lower herself or swing up, and "stretching the line to its limit can
catapult her long distances" [C30]. The line is a spring, not a rod, so the skill is in loading the spring, and the
community's "one- and two-step rocket jumps" are spring launches [C30].

### Cited findings
- Wikipedia: "uncompromising physics model" that makes graceful swinging hard to learn and rewards skilled players with
  one- and two-step rocket jumps; developer Kiyoshi Sakai, illustrator Toshinobu Kondo; 1994 SFC [C30].
- Fields linked by doors, multiple routes and exits (the time-attack structure the series is known for) [C30].

### Inferences
- Input: cast on a button along 8 directions (d-pad at press), reel in and out with up/down while hooked, jump to
  release. The lure is a projectile with its own arc, so cast angle plus distance set the anchor.
- Elastic model: rest length set at the attach, tension proportional to stretch, with a cap on the stretch. Reeling in
  while swinging adds energy, reeling out while under tension stores it. The "rocket jump" is reel-in to load, release
  at the right phase.
- This is the most expressive rope on the list and the hardest to make deterministic and readable in 46 u of hero.

### Gaps
No numeric spring constant, cast speed or max stretch found (HG101 and the fan wiki unreachable).

See it: https://en.wikipedia.org/wiki/Umihara_Kawase [C30].

---

## 9. Spelunky (Mossmouth): rope and whip

### Takeaway
The rope is a placed climbable, not a swing: a consumable thrown straight up (or dropped down while crouching) that
unrolls into a vertical ladder. Spelunky 2's rope reaches 6 tiles up or down (Classic reached 8) [C31, C32]. It is a
deterministic one-button vertical that costs a resource, which is the opposite philosophy of a free swing.

### Cited findings
- Spelunky 2: "up to six tiles downward while crouching, or up to six tiles upward when thrown directly above" [C31].
  Classic: eight tiles each way [C32]. A second rope thrown at the same spot doubles the length [C33].
- The whip is a melee verb with "priority" (attack on the right frame beats the enemy); whipping while hanging from a
  ledge gives a 2-tile low-angle hop [C33, C34]. No published frame data found.

### Inference for the samurai
The whip is already covered by the settled slash (D4, 100 ms, 50x40 u) [S4]. The rope's lesson is "a consumable
vertical with a fixed reach is readable and replay-safe", which argues against a free rope.

See it: https://spelunky.fandom.com/wiki/Spelunky_2:Rope [C31].

---

## 10. Super Mario Maker: Lakitu's Cloud and Clear Pipe as transport verbs

### Takeaway
Two transport verbs with opposite control models. The cloud gives free omnidirectional flight on a timer and ignores
solid collision (the cloud, not the rider), then flickers and despawns [C35]. The Clear Pipe is a rail: enter it and
you travel its path with no control except direction at junctions; it exists only in the 3D World style [C36].

### Cited findings
- Lakitu's Cloud in SMM/SMM2: "free omnidirectional movement"; despawns after a while unless attached to a track or
  occupied by something other than the player; not in the 3D World style [C35]. In SMW the cloud ignores solid
  collision but the rider cannot pass through, so a cloud can get stuck in a wall [C35]. The cloud keeps moving at
  constant speed after the player jumps off [C35].
- Clear Pipe: 3D World style only; enemies and fireballs travel through them; dying inside one freezes the held item
  in the pipe (listed glitch) [C36, C37].

### Inferences
- The cloud's despawn timer in SMM2 is on the order of 10 s [I, uncited]. Its routing value is skipping terrain; its
  skill ceiling is near zero, which is why the cloud is a level item, not a player verb.
- The Clear Pipe is pure authored routing. For a time attack it is a cutscene with a timer: fine as a map element, not
  a verb.

See it: https://www.mariowiki.com/Lakitu%27s_Cloud [C35]; https://www.mariowiki.com/Clear_Pipe [C36].

---

## 11. Jetpack Joyride (Halfbrick, 2011): vehicles as temporary verb swaps

### Takeaway
The whole game is one input (touch = thrust up, release = fall; forward speed is constant) [C38]. A vehicle pick-up
keeps the one input but remaps what it does, and the vehicle "lasts until he hits an obstacle" [C38], so it is also a
one-hit shield. This is the cleanest model of a temporary verb swap: same button, new physics, lost on contact.

### Cited findings
- One-touch control, constant forward speed, vertical only [C38]. Rainbow gear boxes grant a vehicle that lasts until
  hit [C38]. Vehicles: Lil' Stomper (mech), Profit Bird (plane that ejects banknotes), Crazy Freaking Teleporter,
  Gravity Suit ("gravitational reversing"), Bad As Hog (chopper), Mr. Cuddles (mecha dragon), Wave Rider (jet ski),
  Strong Arm Machine (deflects missiles with its arm; unlocks via a daily puzzle) [C38]. 2013 update press: Lil'
  Stomper, Profit Bird and Teleporter "all controlled with one touch" [C39]. Gadgets: two equipped, three with a
  Stash item [C38].

### Inferences (control details, from play; the vehicle wiki was unreachable)
- Lil' Stomper: tap to jump, hold to jet-hover briefly, lands and stomps. Profit Bird: tap to flap (Flappy Bird
  model, each tap an impulse). Crazy Freaking Teleporter: tap to teleport to a random height. Gravity Suit: tap to flip
  gravity (ceiling or floor, no in-between). Bad As Hog: hold to wheelie-jump, release to drop. Mr. Cuddles: hold to
  rise like the jetpack but heavier, breathes fire. Wave Rider: hold to ride a wave up, release to dive.
- Design pattern worth keeping: every vehicle maps to the same one button, so the swap is a physics swap, not a
  control swap. The read is the vehicle sprite itself, no HUD needed, and a hit ejects you back to the base verb.

See it: https://en.wikipedia.org/wiki/Jetpack_Joyride [C38].

---

## 12. Doodle Jump (Lima Sky, 2009): propeller hat, jetpack, rocket

### Takeaway
Three timed vertical boosts of increasing length, with invulnerability while active [C40]. Since score is height, the
points-per-item guides give a relative height: propeller about 1200 to 1500, jetpack 2800 to 3000, rocket 6000 to 7000
(space theme only) [C41, C42]. So jetpack is about 2x the propeller and the rocket about 2.2x the jetpack. Springs are
quoted at 2x a normal jump and trampolines at 4x [C40, low-quality source].

### Inferences
- All three are passive while active (tilt still steers), so they are items, not verbs. Their lesson for a time attack
  is the ratio ladder (1 : 2 : 4.5) and the invulnerability-while-boosted rule that stops the boost from killing you.

See it: https://www.gamerevolution.com/guides/56951-doodle-jump-how-much-points-you-get-with-special-items [C41].

---

## 13. LittleBigPlanet 3 (Sumo Digital, 2014): power-ups and the three characters

### Takeaway
LBP3's Sackpocket lets Sackboy carry several power-ups and switch between them, and each is one button (R1) with a
different physics [C43]. The three new characters are fixed verb kits: OddSock is "the speediest" and wall-jumps,
Toggle switches big (weighs down platforms) and small (walks on water), Swoop flies and carries [C44, C45].

### Cited findings
- Pumpinator: hat that blows and sucks air to move light objects; chosen from the Sackpocket [C43].
- Blink Ball: fires a ball at blue Blink Panels and teleports Sackboy there; also kills enemies [C43, C45].
- Hook Hat: latch onto red rails and ride them with a tap of R1 [C43].
- Boost Boots: R1 boosts in the left-stick direction; described as a double jump by most, a dash by one [C43, C45].
- Hero Cape: DC Comics Premium Level Pack, glide and swoop [C43].
- OddSock wall-jumps and is the fastest; Swoop flies; Toggle changes size, weighing down platforms when big or
  walking on water when small [C44, C45]. PS Blog lists Illuminator as the fifth new power-up [C44].

### Inferences
- Hook Hat is a rail grind, so it is Clear Pipe with a release button: authored routing, zero aim.
- Toggle's size switch is the only one of these that is a pure state toggle with no travel, and it is the most
  interesting for a deterministic time attack (a different hitbox and mass on one button, no projectile).

See it: https://blog.playstation.com/archive/2014/11/24/everything-need-know-littlebigplanet-3-week [C44].

---

## 14. The minimal rope simulation (what a 2D canvas game needs)

### Model: a point mass on a hard distance constraint (Fristrom's method [C22], position-based)
One line of maths. With anchor `a`, rope length `L`, position `p`, velocity `v`, step `dt`, gravity `g` down:

```
p' = p + v·dt + g·dt²                       // free step
if |p' - a| > L:  p' = a + (p' - a) / |p' - a| · L     // project back onto the circle
v = (p' - p) / dt                            // velocity from the corrected move (kills the radial part)
p = p'
```

That is the whole pendulum: no angles, no trig, no joints. It works with the existing 1/120 s step and the existing
AABB solver (run the rope projection before the collision pass; a collision then wins). The projection only pulls in,
never pushes out, so the rope goes slack when the hero is inside the circle, which is correct for a rope.

### Energy check (how fast a swing can get)
Tangential speed at the bottom from an entry at angle θ from vertical with entry speed v0: `v² = v0² + 2·g·L·(1 - cos θ)`.
With g = 2500 u/s² (rising gravity, no fallMult while hooked) and L = 276 u (6 BL):
- entry at 45° at maxRun (420): v = sqrt(420² + 2·2500·276·0.293) = 762 u/s = 1.8x maxRun
- entry at 90° (hook straight above the edge, drop in): v = sqrt(420² + 1,380,000) = 1250 u/s, above maxFall (1150)
So the rope needs a release cap or the maxFall cap applied to speed on release, otherwise a straight-down drop beats
every running route. Period of a 276 u pendulum: 2π·sqrt(276/2500) = 0.66 s, so a quarter swing is 165 ms, which fits
the 100 to 130 ms forgiveness scale of the kit [K].

### Four extensions, each a few lines
1. Pump: while hooked, left/right adds a tangential acceleration `aT` (900 u/s² proposed, a third of groundAccel) so a
   player can add energy but not steer. Worms has this [C14].
2. Reel: `L += reelSpeed·dt·input`, clamp to [Lmin, Lmax]. Reeling in during a swing raises speed (angular momentum
   kept). LBP2 and Worms have this [C6, C16]. Fristrom: approach a `desiredLength` over time so it does not snap [C22].
3. Elastic (Umihara): replace the hard projection with `F = -k·(|p - a| - L)` when stretched, cap the stretch [C30].
4. Wrap: raycast from `a` to `p` each step; on hit, push a new anchor at the hit point and shorten `L` [C22]. Not needed
   with convex hook points.

### Release velocity rules seen
- Pure physics: keep `v` (Fristrom, Worms, Umihara). With a 1.8x maxRun cap and `overspeedDecay` 500 u/s² the
  carried speed bleeds back to maxRun in about 0.7 s [K], which is what the roll-jump hyper already does [S4].
- Release plus jump: a jump press on release adds a reduced hop (proposal: 0.6·jumpVel = 500 u/s), as Critical Gaming
  reports Bionic Commando's "direction held = swing-jump" [C13].
- Pull hooks (Terraria, Ghostrunner GR1) have no release velocity question: you arrive at the point and are gravity-
  immune until you jump [C29].

---

## 15. Should a samurai time attack have a grapple at all?

### Judgement
Not as a global free-anchor rope. Yes as a map-element verb: a one-button kusarigama hook that fires on a fixed
up-forward diagonal (SpeedRunners' auto aim, Bionic Commando's fixed angles) and attaches only to authored hook rings
(Ghostrunner's orbs, GRIN's "no invisible walls" logic). Reasons:
1. The kit already has a 2-button vertical (wall slide, wall jump, climb jump) rated settled in A2 and A3 [S4]. A rope
   that latches to any ceiling makes every chimney and every roof tile in m3 and m4 a shortcut, so the four shipped
   maps would need re-tuning (the m2 cave has a low ceiling and hanging rocks: "small hops only" [K]).
2. Input budget is two or three buttons and the katana button is still unused [K]. A fixed-angle hook on one button
   with no aim stays inside the budget; a free-aim hook needs a stick or mouse and breaks keyboard parity.
3. Deterministic replays are unaffected by the projection above (no randomness, fixed step), but a free-anchor hook
   multiplies the state the ghost must record (anchor point, L) and the routes a map has to be validated against.
4. The race argument from SpeedRunners does not transfer: there the hook exists so laggards catch up and the camera
   follows the leader [C1]. A solo time attack has no laggard. What transfers is the release-timing skill and the
   "swing to pass" read, both of which authored hook rings keep.

### Feel numbers for the sandbox toggle (proposals, [I] unless marked)
| Parameter | Value | Why |
|---|---|---|
| Fire angle | 45° up-forward, facing direction, no aim | SpeedRunners / Bionic Commando fixed angles |
| Hook projectile speed | 1700 u/s (4x maxRun) | Terraria launch/walk ratio 59/15 [C29] |
| Max reach | 300 u (6.5 BL) | Terraria first hook 6.25 BL, Spelunky rope 6 tiles [C29, C31] |
| Time to attach at max reach | 176 ms | 300 / 1700; the pull-in window a player feels |
| Anchor | hook rings only, radius 20 u, snap within 30 u of the ray | Ghostrunner orbs [C25]; snap hides the fixed angle |
| Rope length | fixed at attach distance, min 90 u (2 BL), no reel in v1 | avoids the LBP2 reel input |
| Gravity while hooked | 2500 u/s², no fallMult, no airDrag | pendulum needs symmetric gravity to conserve energy |
| Pump accel | 900 u/s² tangential from left/right | Worms-style energy add, a third of groundAccel |
| Release | button up; keep v, cap |v| at 760 u/s (1.8x maxRun), then overspeedDecay 500 | 45° entry at maxRun gives 762 u/s naturally; the cap removes the drop-in exploit |
| Release + jump (buffer 130 ms) | add vy = -500 u/s (0.6 jumpVel) | Bionic Commando direction-release hop [C13] |
| Re-hook | allowed after release, no cooldown, one ring per ring (no re-grab of the ring you left until you land) | keeps chains possible, forbids hovering |
| Coyote | hook press buffered 130 ms, ring stays valid 80 ms after leaving the ray | matches buffer and wallCoyote [K] |
| Animation | hero rotates to the rope normal (myUp = p - a) [C22], arm extended, katana sheathed; rope 2 px line, ring glows on valid | read is the ring, not the hero |
| Audio | whoosh 60 ms on fire, click on attach, rising noise with |v| | fits the WebAudio synth kit [K] |
| Cost | about 60 lines plus a `rings` array per map | the projection is 3 lines; most cost is the ring art and tuning |

A second toggle, "any ceiling" (SpeedRunners mode), reuses the same code with the anchor set by the AABB hit of the
hook ray against any solid's underside. Ship it in the sandbox for comparison, not in the game.

### Rating (author, 1 to 5)
| Verb | Feel | Readability | Run fit | Cheapness | Evidence | Total |
|---|---|---|---|---|---|---|
| Ring hook with pendulum swing (fixed angle) | 4 | 4 | 3 | 4 | 3 | 18 |
| Any-ceiling hook (SpeedRunners) | 5 | 3 | 2 | 4 | 2 | 16 |
| Elastic line (Umihara) | 5 | 2 | 2 | 3 | 2 | 14 |
| Pull/zip hook (Terraria, GR1) | 3 | 4 | 3 | 5 | 4 | 19 |
| Reel rope (LBP2, Worms) | 4 | 3 | 2 | 3 | 2 | 14 |
| Placed rope (Spelunky) | 2 | 5 | 2 | 4 | 3 | 16 |
| Rail / Clear Pipe / Hook Hat | 2 | 5 | 3 | 4 | 3 | 17 |
| Temporary verb swap, same button (Jetpack Joyride vehicle) | 4 | 5 | 2 | 3 | 3 | 17 |
| Timed boost item (Doodle Jump jetpack) | 3 | 5 | 2 | 5 | 2 | 17 |
| Size toggle (LBP3 Toggle) | 3 | 4 | 3 | 4 | 2 | 16 |

The pull/zip hook scores highest on cheapness and evidence (the whole Terraria table) and is the deterministic
fallback if the swing tests badly: fire, arrive at the ring at 1550 u/s, hang gravity-free until jump.

---

## Candidate technique profiles (for the report)
1. **Ring hook swing.** One button, 45° fixed angle, authored rings, hard pendulum, release keeps speed to 1.8x maxRun.
   Games: SpeedRunners, Bionic Commando, Ghostrunner. Numbers: reach 300 u, projectile 1700 u/s, L min 90 u, cap 760 u/s.
2. **Zip hook.** Same input, pull at 1550 u/s to the ring, gravity-immune hang, jump to leave. Games: Terraria, GR1.
3. **Any-ceiling swing (sandbox only).** Ring hook with anchor = first solid underside on the ray. Game: SpeedRunners.
4. **Elastic line.** Spring rope, reel to load, rocket jump. Game: Umihara Kawase. Reference only.
5. **Reel rope.** Up/down changes L at 300 u/s. Games: LBP2, Worms. Reference only (needs a third input).
6. **Rail ride.** Enter a rail, travel at a fixed speed, release on jump. Games: Clear Pipe, Hook Hat. Map element.
7. **Vehicle swap.** Pick-up remaps the jump button to new physics until hit. Game: Jetpack Joyride. Map element.
8. **Timed boost ladder.** 1 : 2 : 4.5 vertical boosts with invulnerability. Game: Doodle Jump. Map element.
9. **Size toggle.** One button swaps hitbox 20x46 to 20x23 and back with a mass change. Game: LBP3 Toggle. Candidate.
10. **Placed rope.** Consumable 6-tile vertical. Game: Spelunky. Reference for "readable consumable vertical".

## Gaps (honest list)
- SpeedRunners: no primary numbers for hook speed, arc, reach, release boost, or the Sprinting Meter. Needs a frame-step.
- LBP2 Grappling Hook: controls and reel speed inferred; Fandom 402.
- Worms: default rope length and retract speed in px/frame not reached (worms2d.info blocked).
- Umihara Kawase: spring constant, stretch cap, cast speed not found.
- Jetpack Joyride: per-vehicle controls are from play memory; the wiki and AppGamer pages were blocked.
- Doodle Jump: durations in seconds not found; points ladder used as a proxy.
- Lakitu Cloud despawn time in SMM2 not published on the wiki page read.
- No speedrun.com category for any of these games bans or requires the hook in a way that transfers to this project.

## Sources
- [C1] Wikipedia, SpeedRunners. https://en.wikipedia.org/wiki/SpeedRunners
- [C2] Steam store, SpeedRunners. https://store.steampowered.com/app/207140/SpeedRunners/
- [C3] GamesRadar, "Haste, hatred and grappling hooks: you should be playing SpeedRunners" (2013). https://www.gamesradar.com/haste-hatred-and-grappling-hooks-you-should-be-playing-speedrunners
- [C4] shapes.inc fan guide, SpeedRunners Items & Mechanics (unverified). https://shapes.inc/fandom/speedrunners/items-and-mechanics
- [C5] LittleBigPlanet Wiki, Grappling Hook (snippet; page 402). https://littlebigplanet.fandom.com/wiki/Grappling_Hook
- [C6] SuperCheats, LBP2 Gripple Grapple guide. https://www.supercheats.com/guides/littlebigplanet-2/gripple-grapple
- [C7] Digital Chumps, Impressions: LittleBigPlanet 2 (June 2010). https://digitalchumps.com/2010/06/19/impressions-littlebigplanet-2
- [C8] Gamepressure, LBP2 Da Vinci's Hideout, Gripple Grapple. https://www.gamepressure.com/littlebigplanet2/gripple-grapple/z72aac
- [C9] Gematsu, New LBP2 trailer shows off grappling hook (Sept 2010). https://gematsu.com/2010/09/new-littlebigplanet-2-trailer-shows-off-grappling-hook
- [C10] Game Developer, Interview: GRIN's Viklund on Rearming Capcom's Bionic Commando. https://www.gamedeveloper.com/game-platforms/interview-grin-s-viklund-on-rearming-capcom-s-i-bionic-commando-i-
- [C11] Engadget, Interview: Capcom's Rey Jimenez on Bionic Commando Rearmed 2 (June 2010). https://engadget.com/2010/06/17/interview-capcoms-rey-jimenez-on-bionic-commando-rearmed-2
- [C12] Worth Playing, Bionic Commando developer interview (Dec 2008). https://worthplaying.com/article/2008/12/26/interviews/57634
- [C13] Critical Gaming, Bionic Commando Rearmed review (Sept 2008). https://critical-gaming.squarespace.com/blog/2008/9/9/bionic-commando-rearmed-review.html
- [C14] TUS forum, rope physics thread. https://www.tus-wa.com/?msg=279397
- [C15] PC Gamer, "Why I Love: the grappling hook". https://www.pcgamer.com/uk/why-i-love-the-grappling-hook
- [C16] Worms Knowledge Base, RubberWorm (Explorer09). https://worms2d.info/User:Explorer09/RubberWorm
- [C17] TUS, scheme 3718 (Maximum rope speed 255). https://www.tus-wa.com/schemes/scheme-3718
- [C18] Worms Knowledge Base, Editor Specifics. https://worms2d.info/Editor_Specifics
- [C19] Team17 forum thread on XBLA roping (2007). https://t17forum.worms2d.info/index.php/t-31870.html
- [C20] Worms Knowledge Base, Rope Knocking (scheme). https://worms2d.info/Rope_Knocking_(scheme)
- [C21] Thumbsticks, Fristrom on Spider-Man 2's swing (GDC 2019 write-up). https://www.thumbsticks.com/bruce-campbell-players-swing-spider-man-2/
- [C22] Fristrom, "Swinging Physics for Player Movement (As Seen in Spider-Man 2 and Energy Hook)", Tuts+. https://code.tutsplus.com/swinging-physics-for-player-movement-as-seen-in-spider-man-2-and-energy-hook--gamedev-8782t
- [C23] GDC Vault, Classic Game Design Postmortem: Swinging with Spider-Man (2019). https://gdcvault.com/play/1025725/Classic-Game-Design-Postmortem-Swinging
- [C24] Game Developer, GDC 2019 Spider-Man sessions preview (Dec 2018). https://www.gamedeveloper.com/design/enjoy-deep-dives-into-two-classic-i-spider-man-i-games-one-old-one-new-at-gdc-2019-
- [C25] Kotaku, Ghostrunner review (2020). https://kotaku.com/ghostrunner-is-actually-the-fall-s-sharpest-cyberpunk-g-1845917183
- [C26] GamesRadar, Ghostrunner traversal preview. https://gamesradar.com/ghostrunner-has-some-amazing-traversal-skills-for-exploring-its-cyberpunk-city
- [C27] God is a Geek, Ghostrunner 2 review. https://godisageek.com/reviews/ghostrunner-2-review
- [C28] Gamer Guides, Ghostrunner 2 review. https://www.gamerguides.com/ghostrunner-2/reviews/review
- [C29] Terraria Wiki (wiki.gg), Hooks. https://terraria.wiki.gg/wiki/Hooks
- [C30] Wikipedia, Umihara Kawase. https://en.wikipedia.org/wiki/Umihara_Kawase
- [C31] Spelunky Wiki, Spelunky 2: Rope (snippet; page 402). https://spelunky.fandom.com/wiki/Spelunky_2:Rope
- [C32] Spelunky Wiki, Spelunky Classic: Rope (snippet). https://spelunky.fandom.com/wiki/Spelunky_Classic:Rope
- [C33] TheGamer, Spelunky 2 beginner's guide. https://www.thegamer.com/spelunky-2-beginners-guide/
- [C34] Steamah, Spelunky 2 non-obvious facts. https://steamah.com/spelunky-2-non-obvious-facts-things-you-might-miss/
- [C35] Super Mario Wiki, Lakitu's Cloud. https://www.mariowiki.com/Lakitu%27s_Cloud
- [C36] Super Mario Wiki, Clear Pipe (revision diff). https://www.mariowiki.com/Special:MobileDiff/2887755
- [C37] Super Mario Wiki, List of Super Mario Maker 2 glitches. https://www.mariowiki.com/List_of_Super_Mario_Maker_2_glitches
- [C38] Wikipedia, Jetpack Joyride. https://en.wikipedia.org/wiki/Jetpack_Joyride
- [C39] iClarified, Jetpack Joyride updated with new vehicles (2013). https://www.iclarified.com/36208/jetpack-joyride-is-updated-with-new-vehicles-performance-improvements
- [C40] Heavy, Doodle Jump tips (low quality). https://heavy.com/games/2014/01/doodle-jump-tips-tricks-cheats-ios-android-kinect-mobile-games/
- [C41] GameRevolution, Doodle Jump points per special item. https://www.gamerevolution.com/guides/56951-doodle-jump-how-much-points-you-get-with-special-items
- [C42] RAWG, Doodle Jump wiki entry. https://rawg.io/games/doodle-jump-wiki
- [C43] Prima Games, LBP3 beginner tips: Toggle, Swoop, Blink Ball. https://primagames.com/featured/littlebigplanet-3-beginners-tips-toggle-swoop-blink-ball
- [C44] PlayStation Blog, Everything you need to know about LittleBigPlanet 3 (Nov 2014). https://blog.playstation.com/archive/2014/11/24/everything-need-know-littlebigplanet-3-week
- [C45] LittleBigPlanet Wiki, Character Enhancements (snippet). https://littlebigplanet.fandom.com/wiki/Character_Enhancements
- [S4] Kingsfoil, Mechanics #1 SpeedRunner mechanics report. https://kingsfoil-artifacts.netlify.app/mechanics-speedrunner.html
- [K] `studies/mechanics-speedrunner-verbs/notes/01-current-build.md`
