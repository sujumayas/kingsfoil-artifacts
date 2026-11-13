# 03. Ground and body verbs: crouch, slide, long jump, dive, pound, ledge, wall run, climb, spin, charge, grab

Research agent 03 for `mechanics-speedrunner-verbs`. Tags: [V] verified against a primary source, [K] Kingsfoil fact from
`01-current-build.md`, [S4] settled in Mechanics #1, [U] unverified or community recollection, [I] my inference.
SpeedRunner units: hero 20x46 u, 1 BL = 46 u, maxRun 420 u/s, jumpVel 830, gravity 2500, apex 138 u = 3.0 BL, step 1/120 s [K].
Conversions used: Celeste hitbox 8x11 px so 1 BL = 11 px, tile 8 px, 60 Hz [V1]. SM64 standing hitbox 160 u, 30 Hz,
gravity 4 u/frame², terminal 75 u/frame, run cap 32 u/frame [V2, V6, V4]. Pizza Tower and Odyssey figures are in their
wikis' px/frame or u/frame at 60 Hz [V7, V9].

What #1 already settled and I do not reopen: the roll after a 230 u fall and the roll-jump hyper (A5), the wall kit (A4),
the dash as a reference only (A5), the slash at 100 ms and 50x40 u with momentum kept (D4), the stomp bounce at a full
jumpVel (D3). Where a verb below touches those I say how it chains, not how they work.

Note on sources: Ukikipedia (SM64) sits behind a Cloudflare challenge for scripted fetches, so every SM64 number comes
from the n64decomp source instead, with file and line. Fandom pages were not fetched; the Spelunky figures come from
search snippets and are marked [U].

---

## 1. Crouch and crawl

**Takeaway.** A crouch is a hitbox swap plus a speed cap, and both shipped games that use it well shrink the body to
55 to 63% of standing height and refuse to stand up while something is overhead. On a course without low ceilings it
is dead weight; with them it is the cheapest new verb there is, because Down is already a free direction.

**Cited findings.**
- Celeste swaps `normalHitbox (8, 11)` for `duckHitbox (8, 6)` and `normalHurtbox (8, 9)` for `duckHurtbox (8, 4)`
  (Player.cs lines 263 to 266): the body loses 5 px of 11, 45% of its height, 0.45 BL; the hurtbox loses 5 of 9 [V1].
- `CanUnDuck` (line 2136) swaps the standing collider in, runs `CollideCheck<Solid>()` and swaps back; `Solid` only,
  so jump-throughs do not pin the player down [V1]. `DuckFriction 500` px/s² (line 40) decelerates a crouch, half of
  `RunAccel 1000`; `DuckCorrectCheck 4` and `DuckCorrectSlide 50` (lines 41, 42) nudge a ducking player up to 4 px
  sideways at 50 px/s when a dash into a low gap is 1 to 4 px off (lines 2842 to 2851) [V1].
- Every launch in Celeste clears the crouch: `Ducking = false` in `WallJump` (line 1738), `SuperWallJump` (1786) and the
  super jump (1713), and the duck-super keeps x1.25 horizontal for x0.5 height (lines 45, 46, 1714, 1715) [V1; S4 A5].
- Super Mario 64 sets `hitboxHeight = 100` for any action with `ACT_FLAG_SHORT_HITBOX` and 160 otherwise (mario.c lines
  1649 to 1652): the crouch is 62.5% of standing [V2]. `act_crouching` (mario_actions_stationary.c line 528) ends when Z
  is released (line 549) [V5].
- Pizza Tower: crouching moves at "4 speed" from a walk or standstill; crouching and sliding "shrink Peppino's hitbox"
  (no dimensions); releasing DOWN cancels the crouch instantly into Standing or Dashing [V9].
- Super Meat Boy Forever is two buttons, jump and a left-side "fast fall button or duck/slide action", so the duck shares
  a button with the fast fall [V27, V28].

**Inferences.** For SpeedRunner: crouch hitbox 20x26 u (57%, between Celeste's 55% and SM64's 62.5%), feet fixed, head
drops 20 u; crawl cap about 120 u/s (0.29 maxRun) if a crawl exists at all; Pizza Tower's 4 against a Mach run of 12 or
more suggests a third or less. Hold Down on the ground to crouch, release to stand only if the 46 u box is free at the
current x, else keep crawling and try the A2 corner correction of 8 u sideways first [I].

**Gaps.** Pizza Tower's crouch hitbox size and its walk speed in the same units [U]. Whether any time-attack game uses a
slow crawl on the main line; I found none, which is itself a signal [I].

---

## 2. Crouch-slide and slide-jump

**Takeaway.** The slide is the crouch at speed: the body shrinks, the speed is kept and decays, and a jump out of it is a
long low jump. SM64's long jump (x1.5 speed, 0.7 BL height) and Celeste's duck-super (x1.25, half height) are the same
rule in two games; SpeedRunners sold a whole multiplayer game on it.

**Cited findings.**
- Pizza Tower: DOWN while "running at any speed" slides or rolls, keeping the speed held before the slide, "not
  accelerating"; a Grab Slide "instantly sets Peppino to 12 speed" and "lasts for a minimum of 25 frames" (417 ms at 60
  Hz) during which he is inactionable; sliding off a ledge in that window dives; release DOWN to stand instantly [V9].
- SM64 `act_crouch_slide` (mario_actions_moving.c line 1452): for the first 30 frames (1.0 s at 30 Hz) an A press with
  `forwardVel > 10` gives `ACT_LONG_JUMP` (line 1463); after that A is a normal jump; B at 10 or more is a slide kick [V4].
- Celeste's slide is the duck at speed decelerating at `DuckFriction 500` px/s² (line 2881): from `MaxRun 90` to 0 in
  0.18 s, 8.1 px, under 1 tile; the speed tech comes from dashing while ducked, not from the slide itself [V1].
- SpeedRunners players report the slide-jump keeps more momentum; the game's wiki is the see-it URL [S4 A5, U].

**Inferences.** SpeedRunner spec: Down at 280 u/s or more (reuse `rollMinSpeed`) starts a slide with the 20x26 u box and
a slide friction of 600 u/s² (a fifth of `groundFric 3000`, same ratio as Celeste's 500 against 1000 run accel is half; I
pick the gentler fifth so a 420 u/s slide travels 147 u = 3.2 BL in 0.7 s); minimum 120 ms (not Pizza Tower's 417 ms,
which that wiki calls a bonk hazard); release stands if free. Jump during a slide = slide-jump: the same leaving speed and
arc as the A5 roll-jump hyper (546 u/s, vy 622) so the course has one "low body plus jump" rule, not two. The roll already
shrinks the drawn body; a slide should share its pose [I].

**Gaps.** SpeedRunners' slide and slide-jump numbers; the game has no public physics doc [U]. Whether the slide should be
allowed to start in the air (Pizza Tower says DOWN in the air is a Bodyslam or Dive instead) [I].

---

## 3. Long jump, backflip, side flip (SM64 and Odyssey)

**Takeaway.** SM64's three crouch jumps are one constant each: long jump 30 up and x1.5 forward capped at 48, backflip
62 up and 16 back, side flip 62 up and 8 forward. Against a 42 normal jump the flips are 2.2x the height and the long jump
is 1.5x the distance; that is the whole design, and it only reads because each has its own animation.

**Cited findings.**
- `set_mario_action_airborne` (mario.c): `ACT_JUMP` 42 + 0.25 x forwardVel (line 824); `ACT_DOUBLE_JUMP` 52 + 0.25 x
  (786); `ACT_TRIPLE_JUMP` 69 (797); `ACT_BACKFLIP` forwardVel = -16, vy 62 (790 to 793); `ACT_SIDE_FLIP` vy 62,
  forwardVel = 8 (837 to 839); `ACT_WALL_KICK_AIR` 62 (830); `ACT_LONG_JUMP` vy 30, `forwardVel *= 1.5` capped at 48,
  "slow" flag if forwardVel was 16 or less (863 to 873). The comment on line 868 names the BLJ: the cap "misses backwards
  longs allowing high negative speeds" [V2].
- Gravity 4 u/frame², terminal -75 (mario_step.c lines 513, 540, 576 to 578) [V6]. Run cap 48 only in special cases, 32
  for the normal run (mario_actions_moving.c 1605, 458) [V4]. Heights by v0²/2g: jump 42 gives 220 u = 1.4 BL standing
  and 50 at full run gives 312 u = 2.0 BL; backflip and side flip 480 u = 3.0 BL; triple 595 u = 3.7 BL; long jump 112 u
  = 0.7 BL while moving at 1.5x run [V2; I].
- Landing: `act_long_jump_land` (moving.c 1847) eats the A press unless Z is held (lines 1855 to 1857), so chaining
  long jumps requires holding Z; `common_landing_cancels` lets a jump leave the landing early (1858) [V4]. Backflip and
  side flip land through the triple-jump landing animation; the backflip's stop lasts until frame 6 of its animation or Z
  release (stationary.c 914) [V5].
- Odyssey crouch roll: 20 u/frame minimum, 35 u/frame cap on the ground, reverts to a crouch under 17 u/frame; a roll
  boost fires every 16 to 17 frames flat and launches 10.5 u/frame up under 1.5 u/frame² gravity for 42 u of height;
  standing up takes 10 frames; ground-pound roll gives 30 u/frame at once; roll cancel at 9 frames after a boost [V7].
  Mario Wiki: the roll is faster downhill and "can struggle to roll up slopes" [V from search snippet, mariowiki Roll].

**Inferences.** In a 2D rightward course the long jump is the slide-jump of section 2. The backflip is a vertical verb
that costs forward speed (-16 u/frame in SM64) and the side flip needs a turn, so both are route tools for a course that
goes up, not along; SpeedRunner's wall climb jump (`wallClimbX 190`, "more up, less out") already fills that slot [K; I].
Odyssey's rhythm roll (a boost every 270 ms) is a one-button mash for speed, the thing #1's decay model avoids [I].

**Gaps.** Side flip speed threshold for the turn; Ukikipedia has it and was blocked [U]. Odyssey dive speed and distance;
smo.wiki's Roll page defers to its Dive page, not fetched [U].

---

## 4. Dive and belly flop (Fall Guys, Odyssey, SM64, Pizza Tower)

**Takeaway.** A dive is a horizontal burst that trades the upright body for a prone one and a landing penalty. SM64 adds
15 u/frame capped at 48, Fall Guys only in the facing direction after a jump, and Fall Guys' is famous because the
landing is a ragdoll, which a clock cannot afford.

**Cited findings.**
- SM64 `ACT_DIVE`: forwardVel + 15, capped at 48 (mario.c 856 to 860), so from a 32 run the dive is x1.47 and from a
  standstill 15 [V2]. `act_dive` (airborne.c 725) lands into `act_dive_slide` (moving.c 1557), a prone slide with A giving a
  rollout [V3, V4].
- Fall Guys: the dive needs a jump first and "will only dive in the direction they're facing" [V19]. Mediatonic's Jeff
  Tanton: "fully networked physics, with 60 players all at once" [V16]. Diving is also the way to break a grab or slip a
  crowd, per guides [V18].
- Pizza Tower: DOWN in the air is a Bodyslam or a Dive depending on jump state; a Grab Slide off a ledge dives and rolls on
  landing with the 25-frame inactionable window still applying [V9].
- Super Meat Boy Forever's second button is "a jump attack, a dive, and a slide" on one input [V29].

**Inferences.** SpeedRunner already has a cosmetic flip and a roll; a dive would be Down in the air giving +60 u/s
(x1.14, SM64's ratio scaled) and the 20x26 box, landing straight into the roll if the fall was 230 u or more. That is a
third overspeed source next to the roll and the wall jump, and A5's warning stands: canon gains are 20 to 60%, and E4's
gaps were sized for 420 u/s. The ragdoll part does not transfer; the clock punishes a 1 s stand-up more than any
course does [I].

**Gaps.** Fall Guys dive distance and landing recovery in seconds; no public figures [U]. Odyssey dive numbers [U].

---

## 5. Ground pound, butt stomp, pogo and gunboots

**Takeaway.** Down in the air splits into two verbs with different jobs: a fast fall that lands sooner (routing) and a
pound that hits what is below (destruction and the D3 bounce). SM64 hovers for a beat, then falls at a fixed 50 u/frame
with zero forward speed; Shovel Knight's pogo gives back the height of a jump.

**Cited findings.**
- SM64 `act_ground_pound` (airborne.c 918 to 944): state 0 lifts Mario by 20, 18, ..., 2 u over the first 10 frames
  (110 u total, if the ceiling allows), holds `vel[1] = -50` and `forwardVel = 0` every frame, and leaves the state when
  the animation's `loopEnd + 4` frames have passed; state 1 falls at -50 u/frame, two thirds of the 75 terminal [V3, V6].
  Landing goes through `act_ground_pound_land` (stationary.c 1037) into a landing animation then `ACT_BUTT_SLIDE_STOP`;
  a stomp on a slope becomes a butt slide [V5].
- Odyssey: a ground-pound roll starts at 30 u/frame against the crouch roll's 20, "only 1 or 2 frames faster" on flat
  ground, and its boost window opens after 32 frames instead of 16 [V7].
- Shovel Knight bounces "~4.5 tiles" off certain objects on top of a ~4.5 tile jump; "Everything in Shovel Knight was
  built on a grid! The levels were tuned to his mobility!" (Yacht Club) [V12].
- Hollow Knight's down slash bounces off spikes, enemies and objects and refreshes mid-air abilities (the Silksong wiki
  states it for the Knight's original pogo) [V30]. Celeste `Bounce` is -140, 1.33x jump [S4 D3].
- Pizza Tower's taunt stalls the fall for 20 frames (section 11), the inverse verb [V8].

**Inferences.** For SpeedRunner the stomp is a fast fall: Down in the air sets vy to at least 700 u/s and keeps the 1.65
fall multiplier, so a 3 BL jump lands about 150 ms sooner; it counts toward the 230 u roll trigger, so stomp into roll into
roll-jump hyper is a deliberate chain and the first routing use of Down in the air. SM64's hover (10 frames, 110 u) is for
aiming in 3D and should be zero here. The pound as destruction needs breakable floors, which the build lacks [K; I].
Gunboots: Downwell's shoot-down slows the fall and recharges on landing or stomp, cited in #1 as a pacing fix [S4 D3]; a
katana cannot shoot, so the verb that fits is the stomp, not the gun [I].

**Gaps.** SM64's exact hover frame count (depends on the animation's `loopEnd`, which lives in the animation data, not
the C) and the landing lag in frames [U]. Hollow Knight's HeroController recoil constants; #1 also marked them unsourced [U].

---

## 6. Ledge grab, mantle, climb-up

**Takeaway.** Two models exist. Spelunky's grab is a hang (stop, then climb), which saves a life and costs time. Celeste's
climb-hop is an automatic launch at the top of a wall, 1.14x the jump speed upward and 100 px/s forward, which costs
nothing. A time attack wants the second.

**Cited findings.**
- Celeste `ClimbHopY -120`, `ClimbHopX 100`, `ClimbHopForceTime 0.2`, `ClimbHopNoWindTime 0.3` (Player.cs 115 to 119):
  reaching a wall top during a climb launches the player up at 120 px/s (jump is 105) and 100 px/s onto the ledge, forced
  for 0.2 s [V1]. `ClimbCheckDist 2` px is the probe distance (line 106); `ClimbGrabYMult 0.2` (line 114) cuts vy to 20%
  when a wall is grabbed, so a grab is a near-stop, not a hang [V1].
- Spelunky: catching a ledge cancels fall damage "from any height" (community posts) [U21]; Spelunky 2 fall damage tiers
  are 1 HP at 8 to 15 tiles, 2 at 16 to 23, 4 at 24 to 31, death at 32 or more (Spelunky wiki via search) [U20].
- Pizza Tower: an air grab that touches a wall starts a Wall Run; a ground grab into a wall is a bonk, "airborne for
  about 19 frames" with every jump option available [V10].
- Mirror's Edge: a wallrun kick places "a small invisible platform" that resets fall distance; the kick glitch leaves it
  solid "for 3 frames" to jump off, a double jump worth about 10 s on one route [V22, V23, V24].

**Inferences.** SpeedRunner mantle: when the 2 u wall probe reports a wall and the wall's top is between the head and 16
u above it (a third of a body), and the player holds toward it or is rising under 200 u/s, snap the feet to the top and
give vy -300 and vx 200 toward the ledge for 100 ms with a hand-plant pose. No button, no hang. This is A2's corner
correction extended from 8 u to a third of a body, and it kills the "clipped the lip at 420 u/s" death that A2 names.
Mantling onto a one-way tile top must use the same 3 u landing rule as a landing [K; I].

**Gaps.** Spelunky HD or 2 ledge-grab frames (the hang entry window, the climb-up duration); no primary source reached,
and the fandom wiki was not fetched [U]. Mirror's Edge mantle timings [U].

---

## 7. Wall run and ceiling run

**Takeaway.** A wall run is a fixed-distance ride along a surface that converts speed into position. Dustforce makes it a
hold (Up), bans the jump during a ceiling run, and lets corners extend it; Mirror's Edge makes the shortest possible
wall run the fastest, which is a tell that duration limits are the design.

**Cited findings.**
- Dustforce: holding Up on a wall or ceiling runs along it "for a fixed distance, usually a few character lengths"; "you
  cannot jump while doing a ceiling run"; a corner boost (wall jump into a ceiling run at the corner) makes the run
  "longer and faster"; a corner cuddle turns a ceiling run into a wall climb [V25]. TAS notes: ceiling slides start faster
  than dash speed and lose speed over the cling; ground boosts are about 50% over dash speed and need a dash about 4.5
  times a second (the wiki says "approximately 288 bpm") [V26, V25].
- Mirror's Edge: "a very brief wallrun, jumping off while facing almost directly into the wall" gives extra speed (wall
  boost); the kick glitch is "almost impossible" on console [V22, V23].
- Pizza Tower: an air grab into a wall starts a Wall Run, and a grab counts as dashing, which "allows wall runs" [V10].
- Ghostrunner, Rayman Legends and Prince of Persia are 3D or automatic wall runs scripted to the level; nothing numeric
  was found and they are not pursued [U].

**Inferences.** SpeedRunner has a wall slide at 115 u/s down and a climb jump; a wall run would be the slide reversed:
hold toward the wall at 300 u/s or more to run up for a fixed 2 BL (92 u) over 250 ms, then slide. That rewrites A4's
same-wall penalty and the m2 600 u chimney, so it is a course change, not a toggle. A ceiling run needs ceilings the
maps have only in m2's cave and m3's needle-capped climbs, and those ceilings carry spikes [K; I].

**Gaps.** Dustforce's wall run distance in tiles and its speed floor; the wiki says "a few character lengths" [U].

---

## 8. Climb with stamina (Celeste)

**Takeaway.** Celeste's climb is a budget of 110 that pays 45.45 per second going up, 10 per second holding still and
27.5 per climb-jump, at 45 px/s upward, half run speed. Full to empty is 2.42 s of climbing or 4 climb-jumps, and the last
20 points flash red. The budget is why wall jumps stay the fast line.

**Cited findings** (all Player.cs [V1]).
- `ClimbMaxStamina 110` (line 102); `ClimbUpCost 100 / 2.2f` = 45.45 per s (103); `ClimbStillCost 100 / 10f` = 10 per s
  (104); `ClimbJumpCost 110 / 4f` = 27.5 (105); `ClimbTiredThreshold 20` (109); `ClimbNoMoveTime 0.1` s after a grab (108).
- Speeds: `ClimbUpSpeed -45` px/s (110) = 4.1 BL/s or 5.6 tiles/s; `ClimbDownSpeed 80` (111); `ClimbSlipSpeed 30` (112)
  once tired; `ClimbAccel 900` (113, from context of the block). `ClimbCheckDist 2` px probe (106).
- Costs apply only in the air: `ClimbJump()` subtracts `ClimbJumpCost` when `!onGround` (lines 1813 to 1817); a jump off a
  wall with no direction held gets `ClimbJumpBoostTime 0.2` s of boost away from the wall (lines 1823 to 1826, 118).
- Refill: `Stamina = ClimbMaxStamina` on the ground (line 2027), on a dash refill (607, 705); `IsTired` reads
  `CheckStamina < ClimbTiredThreshold` where `CheckStamina` adds the jump cost back during a climb jump (3031 to 3043).
- `WallSlideTime 1.2` s (61): the slide speed ramps from `WallSlideStartMax` to `MaxFall` over 1.2 s (lines 2946, 2947).

Derived: full stamina = 2.42 s up = 109 px = 9.9 BL = 13.6 tiles of climbing, or 11 s hanging, or 4 climb-jumps; a mix of
1 s climbing and 2 jumps leaves 9.5 [I from V1].

**Inferences.** A stamina climb is a slow verb (half run speed) that exists to make a wall a puzzle. SpeedRunner's walls
are chimneys solved by wall jumps at 440/790 in under a second each, and A4 settled that. If a climb ever enters, copy
Celeste's ratios against maxRun: climb 210 u/s, budget 2.4 s, jump cost a quarter, 20% tired band, and refill on the
ground only. For a two-button game, hold toward the wall plus jump already means "climb jump", so the only new input is
"hold toward the wall without jumping", which today starts the 115 u/s slide [K; I].

**Gaps.** None on the numbers. Open design question whether a slow verb belongs on a clock at all [I].

---

## 9. Spin jump (Super Mario World)

**Takeaway.** The spin jump trades height for safety: lower than a normal jump, it kills most stompables outright and
bounces off spiked enemies, and that bounce is the route tool (Spinies, Lava Bubbles, Grinders in SMW only).

**Cited findings.**
- Super Mario Wiki: the spin jump "offers less height than a standard jump", can "instantly defeat most stompable
  enemies", lets Mario "bounce on unstompable enemies such as Spinies and Lava Bubbles", gains height when bouncing with
  the button held (amount unstated); Mario Maker's SMW style keeps block breaking and the spiked-enemy bounce except
  Grinders; NSMBW's version "no longer protects"; 3D World's is "the highest jump" [V13].
- Wikibooks SMW Moves: a spin jump at top speed is slightly higher than a normal jump from a standstill [U15].
- TASVideos SMW resource: Y-speed thresholds in subpixels per frame (corner boost at 50, wall jump at 33), the takeoff
  meter at 80 frames after a sprinting jump, P-meter peak 112; the page has no spin jump height [V14].

**Inferences.** The spin jump is a second jump button with a different body: smaller hitbox on top (the spinning body),
lower arc, and a stomp that always lands. In a two-button samurai game the slash is already the "safe contact" verb
(D4), so a spin jump would duplicate it [I].

**Gaps.** The SMW jump Y-speed tables for normal against spin jumps from the disassembly; not reached in budget [U].

---

## 10. Charged jump (Jump King, Pogostuck, SMB2's crouching high jump)

**Takeaway.** A charge converts time into height on purpose, and the games built on it have no clock on the input, only
on the route. On a timer it is a cost with no refund.

**Cited findings.**
- Jump King: height depends on charge duration (DGMI mechanic wiki); released May 2019 by Nexile; Guinness lists a PC
  any% at 4:24.7 on 11 March 2020 [V31, V from search]. No primary source for the charge time or the max height was
  reached; community recollection puts the full charge near 0.6 s with no air control [U].
- Super Mario Bros. 2's Power Squat Jump (crouching high jump): hold Down until the sprite flashes, then jump higher [U,
  mariowiki Power_Squat_Jump from search].

**Inferences.** Every charged jump is a held button with a visible meter, which breaks the one-shot `jumpPressed`
model [K]. The one place a charge survives a clock is as a trade: stand still 300 ms for a 1.5x jump only where a wall
jump cannot reach, and no map today needs it [I].

**Gaps.** Jump King's charge curve and max height in blocks; Pogostuck's charge [U].

---

## 11. The Fall Guys grab and push, Pizza Tower's grab-and-throw and taunt parry

**Takeaway.** Grabs are content only when there is someone to grab. Fall Guys' is a 60-player interruption verb with a
physics "break" its own lead designer called unpredictable; Pizza Tower's grab is a 39-frame lunge that doubles as an
acceleration and a wall-run starter; the taunt is a 20-frame freeze that parries anything that would hurt during it.

**Cited findings.**
- Fall Guys: holding the grab on a carried item for about 2 to 3 s makes the carrier drop it [V18]; a grabbed player gets
  out by mashing jump [V18]; the lead designer on Reddit: the grabber lets go or a grab break pushes both apart, and
  "this 'force' can be a bit unpredictable currently" [U17]. "Fully networked physics, with 60 players all at once" [V16].
- Pizza Tower grab: below 8 speed it sets 8 then adds 0.5 per frame to 10, faster speed is kept; lasts 39 frames (650 ms)
  unless cancelled; jump cancels into a Long Jump, BACK cancels into Walk ("Mach Cancel"); holding DASH when it ends
  kickstarts a Dash; a ground grab into a wall bonks for about 19 frames, an air grab into a wall starts a Wall Run;
  holding an enemy forbids dashing; the throw destroys everything until a wall; a spin grab at Mach 2 or more loses 0.25
  speed per frame [V10].
- Pizza Tower taunt: freezes for 20 frames (333 ms), then restores the previous state and both speed components; "cannot
  be canceled into anything"; if Peppino would be hurt during it he retaliates instead, reflecting projectiles; the
  exceptions list is long (electricity, water, several boss moves); taunting on the same frame as another action skips 0
  to 10 random frames of it; the Supertaunt needs a 10 combo [V8]. speedrun.com forum asks about taunt cancels [V11].
- Designer statement: Ground Pound, Mach Dash and Grab Dash "came from Wario Land 4" (from the wiki.gg pages via search)
  [U from search snippet].

**Inferences.** With no other players and no enemies in the build, the grab has nothing to hold. The taunt parry is a
20-frame freeze: on a clock it is 333 ms lost unless the course throws projectiles, and D4's slash already deflects at
full speed. Random 0 to 10 frame skips would break deterministic replays unless seeded [K; I].

**Gaps.** Fall Guys grab duration on players in seconds; none published [U].

---

## 12. Answers for a two- or three-button samurai time attack

Inputs today: left/right, jump [K]. Down and Up are free directions, and the slash is the settled third button (D4).

**Have (no new button, fits every map).**
1. Crouch and crouch-slide on Down, with the 20x26 u box and slide friction 600 u/s². Pizza Tower and SM64 both make
   Down the body-change key [V9, V4]. Cost: a hitbox swap, a friction constant, a pose.
2. Slide-jump as the long low jump, with the A5 hyper's numbers (546 u/s, vy 622) so there is one rule for "low body plus
   jump" [S4 A5; I]. SM64's x1.5 at 0.7 BL and Celeste's x1.25 at half height bracket it [V2, V1].
3. Stomp as fast fall on Down in the air: vy at least 700, feeds the 230 u roll, chains into the roll-jump [K; I].
4. Automatic mantle (Celeste's climb hop: 1.14x jump up, 100 px/s in) when the wall top is within a third of a body
   above the head; replaces the lip death at 420 u/s [V1; S4 A2; I].

**Have only if the course is built for it.** Dive (a third overspeed source; only with E4's gaps re-sized). Backflip and
side flip (vertical courses; the wall climb jump already covers it). Wall run (rewrites A4 and the chimneys).

**Do not have.** Climb with stamina (half run speed, 2.4 s budget; walls are already solved by wall jumps at under a
second each) [V1; K]. Spin jump (the slash is the safe-contact verb). Charged jump (a held meter on a clock). Grab, push,
throw, taunt parry (no one to grab, nothing to parry; random frame skips fight replays) [V8, V10].

**Only make sense with a low-ceiling course.** Crouch, crawl and the slide's hitbox change (a gap of 26 to 45 u forces
them; 46 u or more passes standing; m2's cave is the only low ceiling today and it says "small hops only") [K]. Ceiling
run (needs ceilings without spikes; m3's are spiked) [K]. The pound as destruction (needs breakable floors). Mantle and
stomp do not need ceilings. Spec for a crouch gap: 32 u tall and at least 2 BL long, so a 420 u/s slide (3.2 BL in 0.7 s at
600 u/s² friction) clears it with margin and a crawl does not; place the first one after a checkpoint [I].

**Crouch hitbox against one-way tiles and the wall probe.**
- One-way landing checks `vy > 0` and feet within 3 u of the top [K]. The crouch shrinks from the head down with the
  feet fixed, so landings are unchanged; only `CanUnDuck` must test the 46 u box against solids and ignore one-way tiles
  (Celeste tests `Solid` only) [V1; I].
- Down on a one-way tile is a conflict: crouch or drop-through. m4 is a maze of one-way roof tiles with several routes;
  drop-through would re-route it and void its medals, so Down is crouch everywhere and drop-through is not a verb [K; I].
- The wall probe is 2 u wide over the middle 30 u of the body (y 8 to 38 of 46) [K]. A 26 u body has no "middle 30 u", so
  the probe must derive from the live hitbox (middle 60%: 5 to 21 u). Safer: no wall kit while crouched, as Celeste clears
  `Ducking` on every wall jump and checks the standing collider for climbs (lines 1738, 1786, 2779) [V1]. A slide into a
  wall is a bonk that stands the player up and stops (Pizza Tower: 19 frames) rather than a wall stick that caps vy at 25
  u/s for 100 ms, which would read as the wall grabbing a sliding body [K; V10; I].
- Standing up under a lip: keep sliding crouched and try the A2 8 u sideways correction first (Celeste's `DuckCorrect`
  4 px at 50 px/s); if a jump is pressed while pinned, buffer it 130 ms and fire on the first free step [S4 A2; V1; K; I].
- Mantle onto a one-way top uses the 3 u rule; the ghost needs no new field since pose angles and hip height are recorded,
  and input replays need Down in the recorded key set, which today holds only move and jump [K; I].

---

## Candidate technique profiles

| Profile | One line | Games | Key numbers |
|---|---|---|---|
| Crouch and slide on Down | Hitbox 46 to 26 u, speed kept, friction 600 u/s², release stands if free | Celeste, SM64, Pizza Tower, SMB Forever | Celeste 11 to 6 px, DuckFriction 500; SM64 160 to 100; PT grab slide 12 speed, 25 frames min |
| Slide-jump (long jump) | Jump from a slide leaves low and fast, same rule as the roll-jump hyper | SM64, Celeste, SpeedRunners | SM64 x1.5 speed cap 48, vy 30 (0.7 BL); Celeste x1.25, x0.5 height |
| Stomp as fast fall | Down in air sets vy 700+, feeds the 230 u roll | SM64, Odyssey, SMB Forever | SM64 -50 u/frame fixed, forwardVel 0, 110 u hover; Odyssey pound roll 30 vs 20 u/frame |
| Automatic mantle | Wall top within a third of a body: snap up, vy -300, vx 200, 100 ms | Celeste climb hop, Mirror's Edge | ClimbHopY -120 (1.14x jump), ClimbHopX 100, forced 0.2 s |
| Dive (reference) | +60 u/s burst into a prone body, lands into the roll | SM64, Fall Guys, Pizza Tower | SM64 +15 capped 48; Fall Guys facing only, after a jump |
| Wall run (reference) | Hold in at speed to run up a fixed 2 BL, then slide | Dustforce, Mirror's Edge, Pizza Tower | Dustforce "a few character lengths", no jump on ceilings; ME kick 3 frames |
| Stamina climb (reference) | Budget 110, up 45.45/s, still 10/s, jump 27.5, speed 45 px/s | Celeste | Player.cs 102 to 119; 2.42 s or 4 jumps per refill |
| Taunt parry (anti-profile) | 20-frame freeze that parries, restores speed, random 0 to 10 frame skip | Pizza Tower | 333 ms; non-deterministic skip |
| Grab and push (anti-profile) | Interruption verb that needs other bodies; break force "unpredictable" | Fall Guys, Pizza Tower | 60 players; PT grab 39 frames, 8 to 10 speed |

## Sources

1. Celeste `Player.cs` (MIT release): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
2. SM64 decomp `src/game/mario.c`: https://github.com/n64decomp/sm64/blob/master/src/game/mario.c
3. SM64 decomp `mario_actions_airborne.c`: https://github.com/n64decomp/sm64/blob/master/src/game/mario_actions_airborne.c
4. SM64 decomp `mario_actions_moving.c`: https://github.com/n64decomp/sm64/blob/master/src/game/mario_actions_moving.c
5. SM64 decomp `mario_actions_stationary.c`: https://github.com/n64decomp/sm64/blob/master/src/game/mario_actions_stationary.c
6. SM64 decomp `mario_step.c`: https://github.com/n64decomp/sm64/blob/master/src/game/mario_step.c
7. SMO wiki, Roll: https://smo.wiki/Roll (and Roll cancel hovering: https://smo.wiki/Roll_cancel_hovering)
8. Pizza Tower speedrunning wiki, Taunt: https://pizzatowerspeedrunning.wiki.gg/wiki/Taunt
9. Pizza Tower speedrunning wiki, Slide: https://pizzatowerspeedrunning.wiki.gg/wiki/Slide
10. Pizza Tower speedrunning wiki, Grab (revision of 16 July 2023): https://pizzatowerspeedrunning.wiki.gg/wiki/Grab
11. speedrun.com Pizza Tower forum, "Taunt Cancel?": https://www.speedrun.com/pizza_tower/forums/0kyvi
12. Yacht Club Games, Plague Knight mobility design: https://yachtclubgames.com/blog/plague-knight-mobility-design
13. Super Mario Wiki, Spin Jump: https://www.mariowiki.com/Spin_Jump
14. TASVideos, Super Mario World game resources: https://tasvideos.org/GameResources/SNES/SuperMarioWorld
15. Wikibooks, Super Mario World/Moves: https://en.wikibooks.org/wiki/Super_Mario_World/Moves
16. GamesRadar, Mediatonic interview on Fall Guys: https://www.gamesradar.com/fall-guys-interview
17. r/FallGuysGame, "How do grabs work?" (lead designer reply, mirror): https://redlib.hackliberty.org/r/FallGuysGame/comments/i6vh3v/how_do_grabs_work/
18. Twinfinite, Fall Guys tips: https://twinfinite.net/guides/fall-guys-tips-tricks-win/
19. GamesRadar, how to dive in Fall Guys: https://www.gamesradar.com/how-to-dive-in-fall-guys-ps4-pc
20. Spelunky wiki, Fall Damage: https://spelunky.fandom.com/wiki/Fall_Damage
21. itch.io post on Spelunky ledge grabs: https://itch.io/post/7475890
22. Mirror's Edge wiki, Speedrunning: https://mirrorsedge.fandom.com/wiki/Speedrunning
23. SDA knowledge base, Mirror's Edge: https://kb.speeddemosarchive.com/Mirror%27s_Edge
24. speedrun.com, The Ultimate Mirror's Edge Speedrun Guide: https://www.speedrun.com/me/guides/95xzf
25. Dustforce community wiki, Mechanics, Tricks and Terminology (mirror): https://axebps-redlib.hf.space/r/dustforce/wiki/terms
26. TASVideos forum, Dustforce DX notes: https://tasvideos.org/Forum/Posts/369448
27. PCGamesInsider, Super Meat Boy Forever two buttons: https://www.pcgamesinsider.biz/indie-interview/66238/we-wanted-it-to-have-two-buttons-and-still-feel-and-play-like-super-meat-boy/
28. Game Informer, SMB Forever touchscreen: https://gameinformer.com/games/super_meat_boy_forever/b/ios/archive/2014/08/29/dodging-saw-blades-on-a-touchscreen
29. VideoGamer, Tommy Refenes interview: https://www.videogamer.com/?p=126417
30. Hollow Knight wiki, Needle-bounce: https://hollowknight.wiki/w/Needle-bounce
31. DGMI mechanic wiki, Jump: https://dgmiwiki.wpi.edu/mechanic/jump
32. Mechanics #1 report [S4]: https://kingsfoil-artifacts.netlify.app/mechanics-speedrunner.html
33. Current build [K]: https://speedrunner-tau.vercel.app/ (notes/01-current-build.md)
34. Ukikipedia (blocked for scripted fetch; see-it only): https://ukikipedia.net/wiki/Long_Jump , https://ukikipedia.net/wiki/Backflip , https://ukikipedia.net/wiki/Ground_Pound
35. Super Mario Wiki, Power Squat Jump (SMB2 charged jump): https://www.mariowiki.com/Power_Squat_Jump
36. Super Mario Wiki, Roll (Odyssey): https://mariowiki.com/Roll
