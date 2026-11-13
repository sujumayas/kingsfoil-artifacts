# 02. Dash and air verbs

Researcher 02. Scope: dash (ground, air, 2/4/8 directions), air-dash-only, double and triple jump, glide and float,
the Celeste tech that falls out of the dash, Dustforce, Mega Man X, Hollow Knight, Ori, Rayman Legends, Celeste's
feather, Neon White's card verbs, Sonic's drop dash and homing attack, Pizza Tower's mach run and super jump.
Not repeated here: jump, forgiveness, momentum, wall kit, roll-jump hyper (Mechanics #1 profiles A1 to A5, [S4]).

Conventions. [V] cited finding, [I] inference, [K] Kingsfoil build fact from `01-current-build.md`. Celeste numbers
are quoted from the MIT-licensed `Player.cs` (5471 lines, `NoelFB/Celeste` master, downloaded 13 Nov 2026 into
`scratch-02/Player.cs`); "L75" means line 75 of that file. Celeste units are px/s at 8 px per tile; Madeline's
standing hitbox is 8x11 px, so 1 Celeste BL = 11 px (the convention #1 used). SpeedRunner units: 1 BL = 46 u,
maxRun 420 u/s, jumpVel 830, gravity 2500 rising and 4125 falling [K].

Fetch log: speedrun.com guides, hollowknight.wiki, raymanpc.com, tvtropes, pizzatower.wiki.gg and info.sonicretro.org
all returned 401/402/403 or an Anubis bot wall to the fetcher, so Hollow Knight, Rayman and Sonic rest on search
snippets and are flagged. A curl with a browser user agent was refused by the harness, so I did not retry.

---

## 1. Celeste's dash, from the source

**Takeaway.** One 8-direction dash of 240 px/s for 0.15 s (36 px, 4.5 tiles, 3.3 BL), 2.67x run speed, with a
0.2 s cooldown, a ground-only refill locked out for 0.1 s after the dash starts, a 50 ms hitstop, two afterimages,
a screen shake, and hair that changes colour with the dash count. Every piece of famous tech is one constant
interacting with the jump.

**Cited findings (Player.cs line numbers).**
- Constants: `MaxRun = 90f` (L30), `RunAccel = 1000f` (L31), `RunReduce = 400f` (L32), `AirMult = .65f` (L33),
  `Gravity = 900f` (L24), `MaxFall = 160f` (L23), `JumpSpeed = -105f` (L49), `JumpHBoost = 40f` (L50),
  `VarJumpTime = .2f` (L51), `JumpGraceTime = 0.1f` (L48).
- Dash: `DashSpeed = 240f` (L75), `EndDashSpeed = 160f` (L76), `EndDashUpMult = .75f` (L77), `DashTime = .15f`
  (L78), `DashCooldown = .2f` (L79), `DashRefillCooldown = .1f` (L80), `DashHJumpThruNudge = 6` (L81),
  `DashCornerCorrection = 4` (L82), `DashVFloorSnapDist = 3` (L83), `DashAttackTime = .3f` (L84).
- Super and hyper: `SuperJumpSpeed = JumpSpeed` (L68), `SuperJumpH = 260f` (L69), `DuckSuperJumpXMult = 1.25f`
  (L45), `DuckSuperJumpYMult = .5f` (L46), `DodgeSlideSpeedMult = 1.2f` (L44).
- Wall: `WallJumpHSpeed = MaxRun + JumpHBoost` = 130 (L58), `WallJumpForceTime = .16f` (L57), `SuperWallJumpSpeed
  = -160f` (L70), `SuperWallJumpH = MaxRun + JumpHBoost * 2` = 170 (L73), `SuperWallJumpVarTime = .25f` (L71).
- Input and direction: `lastAim = Input.GetAimVector(Facing)` (L797); the coroutine reads `dir = lastAim` (L3552)
  and sets `Speed = dir * DashSpeed` (L3556 to L3559), keeping `beforeDashSpeed.X` when it is already faster in
  the same direction (L3557). `CanDash` needs `Input.Dash.Pressed && dashCooldownTimer <= 0 && Dashes > 0` (L3381).
  `StartDash` does `Dashes = Math.Max(0, Dashes - 1)` (L3361).
- Startup and feel: `DashBegin` freezes the game for 0.05 s (`Celeste.Freeze(.05f)`, L3449), zeroes `Speed` (L3462),
  adds a displacement burst (L3454), strong rumble (L3458), sets `dashAttackTimer = DashAttackTime` 0.3 s (L3460).
  The coroutine yields one frame first (L3550), then `DirectionalShake(DashDir, .2f)` (L3565), `SlashFx.Burst`
  and `CreateTrail()` with `dashTrailTimer = .08f` (L3591 to L3593), waits `DashTime` (L3614), draws a second trail
  (L3616) and sets `AutoJump = true` (L3618).
- Recovery: if `DashDir.Y <= 0` the speed drops to `DashDir * EndDashSpeed` (160, L3621); an upward component is
  then multiplied by 0.75 (120 px/s up, L3626). Downward dashes keep 240 px/s. Horizontal overspeed then bleeds
  at `RunReduce` 400 px/s² in `NormalUpdate`, so 160 to 90 takes 0.175 s [I from L32].
- Refill (L727 to L739): while `dashRefillCooldownTimer` runs nothing refills; otherwise `RefillDash()` fires in
  water, or when `onGround` and standing on a `Solid`, `NegaBlock` or `JumpThru` and not inside `Spikes`. Bounces
  (L1554, L1857, L1892, L1930) and refill crystals call `RefillDash()` too. `RefillDash` sets `Dashes = MaxDashes`
  (L2002 to L2006); `MaxDashes` returns `Inventory.Dashes` (1 normally, 2 in chapter 9 and Assist).
- Dash floor snap: when airborne, dash-attacking and horizontal, the player is pulled down up to 3 px onto a floor
  (L918 to L923). Dash corner correction is 4 px, jump-thru nudge 6 px.
- Dash slide (L3576 to L3585): a diagonal-down dash on the ground becomes a horizontal dash with `Speed.X *=
  DodgeSlideSpeedMult` (1.2, 288 px/s) and `Ducking = true`. Landing from a diagonal-down dash also does `Speed.X *=
  1.2f` (L2301), which the community calls the ultra [I on the L2301 context; the constant is cited].
- Read: hair `NormalHairColor AC3232` (red, L276), `UsedHairColor 44B7FF` (blue, L278), `FlashHairColor White`
  (L279), `TwoDashesHairColor ff6def` (pink, L280); the hair flashes white for a frame when `lastDashes != Dashes`
  (L1136 to L1143); with two dashes the hair has 5 segments instead of 4 (L867). Trails use the hair colour
  (L1087). Sounds `char_mad_dash_red_left/right` and `char_mad_dash_pink_left/right` (L3412 to L3421).
- Feather (`StStarFly`, L4313 to L4329): `StarFlyTime = 2f`, `StarFlyStartSpeed = 250f`, `StarFlyTargetSpeed =
  140f`, `StarFlyMaxSpeed = 190f`, `StarFlySlowSpeed = 91` (0.65 x 140), `StarFlyRotateSpeed = 320 deg/s`,
  `StarFlyEndFlashDuration = 0.5f`, exit caps `StarFlyMaxExitX = 140`, `StarFlyExitUp = -100`.

**Derived numbers [I].** Dash distance 36 px (4.5 tiles, 3.3 BL) in 9 frames at 60 Hz; dash is 2.67x run; super
`Speed.X = 260` (L1705) is 2.9x run; hyper 325 x -52.5 (L1711 to L1715) is 3.6x run at half jump speed; ultra adds
x1.2 on top. Wall jump 130 px/s is 1.44x run; super wall jump 170 x -160 is 1.9x run at 1.5x jump speed. A super
needs `jumpGraceTimer > 0` inside `DashUpdate` (L3503), so it also works for 0.1 s after a ground dash leaves a
ledge. A super wall jump only exists when `DashDir` is straight up (L3511).

**How the tech falls out.**
- Super: ground dash plus jump inside 0.15 s. Hyper: the same while ducking (down-forward dash). Extended hyper:
  wait until the dash refills (hair red) before the jump so the dash is kept [V, Celeste Wiki via search].
  Wavedash: jump, dash down-diagonal, jump on landing; works on a single tile [V, same]. The 0.1 s
  `DashRefillCooldown` is why a wavedash close to the ground gives the dash back late [V, speedrun.com thread;
  I on the constant]. Demodash: crouch and dash within 4 frames (0.066 s) to dash with the 8x6 ducking hitbox and
  slip between spikes [V, Vice 2021 quoting the Fandom wiki]. Version 1.4 added an in-game Crouch Dash bind
  [V, speedrun.com guide title; page 403].

**Designer statements.** Thorson, ACMI Melbourne International Games Week, 6 Oct 2025: she wished the dash had
four directions instead of eight, and would do that in a Celeste 2; "corner boosting emerged from systems we didn't
plan"; the demodash "lets you dash with a smaller hitbox" [V, explosionnetwork.com]. Vice, 18 Feb 2021: "Our goal
isn't to make the game faster or slower for speedrunners per se but more fun for them"; "Usually we just try to
remove unnecessary friction" [V].

**Speedrun effect.** Any% record 24:58 (Aftermath, updated Oct 2025); the named tech list is "super, hyper, wave,
extended, ultra, and demo dashes", bunnyhop, wall boost, neutral jump, corner boost [V]. Moderators: tech
restriction categories "are very unlikely to be added at any point"; Dashless 1A was floated and rejected
[V, speedrun.com forum]. So the dash is never banned; it defines the game.

**Gaps.** Exact frame timing of the hyper window relative to `DashTime` and `jumpGraceTimer` in the TAS docs; the
`OnCollideV` context of L2301; Celeste's dash-attack hitbox size.

**See it.** https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs ·
https://www.speedrun.com/celeste ·
https://www.vice.com/en/article/how-celeste-found-success-in-embracing-speedrunners-who-broke-the-game/

---

## 2. Dustforce: dash, air dash, double jump and the air charge

**Takeaway.** One shared "air charge" buys either an air jump or an air dash; landing or killing an enemy restores
it; down-dashes and wall jumps are free. A dashjump is a dash and a jump on the same frame and costs the charge.

**Cited findings.**
- Air charge "lets you jump or dash while airborne. Landing or killing an enemy restores it, and downdashes and
  wall jumps don't spend it" [V, r/dustforce wiki terms via search; mirror returned a loading page].
- Dashjumps "combine a dash and a jump in the same frame while airborne, and they need an air charge"; not possible
  while attacking [V, same].
- "Smashing an object restores your double jump even if you double jumped into it" [V, TV Tropes via search].
- Dash input: an option for "double tap dash" exists [V, TASVideos Riokaii page]. A downdash exists and is not
  taught by the tutorial [V, czyys guide snippet].
- Dustforce DX has an open scripting API (dustapi) whose example restores the air charge counter when dust is
  cleared [V, dustapi.readthedocs.io].

**Inferences.** The air charge is the cleanest "one resource, two verbs" rule in the canon: a player picks jump
or dash in the air, never both, and the refund on hits turns enemies into refuel stations (links to #1's D3).

**Gaps.** Dash speed, dash frames, double jump height. Dustforce physics are not documented in any page the fetcher
could read; the community guide at gh.r-mj.com did not resolve.

**See it.** https://tasvideos.org/HomePages/Riokaii · https://dustapi.readthedocs.io/en/latest/

---

## 3. Mega Man X: dash and dash-jump

**Takeaway.** Forward-only ground dash at about 3.5 px/frame (about 210 px/s, 2.3x walk speed, one X height per
0.15 s), and a jump during the dash keeps dash speed for the whole air time. In X2 and X3 an air dash is allowed
once per jump and not after a dash-jump.

**Cited findings.**
- "the Ride Armor ... dashes 4 pixels per frame, compared to X's ~3.5px/f" [V, TASVideos forum post 434799; a
  casual measurement].
- Jump initial speed 5.0 px/frame, kept in the air until interrupted [V, TASVideos MMX physics notes via search].
- "Normally, you can only air-dash if you don't dash jump, and only air-dash once during the jump"; "X's dash
  hitbox is shorter than his standing hitbox"; the dash state persists "including jumping after dashing, and
  dashing off a ledge" [V, tasvideos.org/GameResources/SNES/MegaManX].
- Wall kick is possible "within a few pixels (around 5 or 6) of the wall" [V, same].

**Inferences.** X's sprite is about 34 px tall, so 3.5 px/f is about 6 BL/s and a dash-jump covers roughly 4.5 BL
in a 0.7 s jump. Walk speed (about 1.5 px/f, 90 px/s) is unverified. The dash-jump is the direct ancestor of
Celeste's super and of #1's roll-jump hyper: speed earned on the ground, spent in the air.

**Gaps.** Dash duration in frames, walk speed, air dash distance in X2/X3. TASVideos' RAM map lists velocity
addresses but no table.

**See it.** https://tasvideos.org/GameResources/SNES/MegaManX · https://tasvideos.org/Forum/Posts/434799

---

## 4. Hollow Knight: Mothwing Cloak and Monarch Wings

**Takeaway.** Forward-only dash, one in the air, refilled on landing or on a wall, cooldown about 0.6 s (0.4 s
with Dashmaster); a double jump that refills on landing or on a wall. Both are ability unlocks, so Any% routing is
about when you get them.

**Cited findings (secondary, pages 403 to the fetcher).**
- Dashmaster "shortens the Mothwing Cloak cooldown by roughly 40% (from 0.6 to 0.4 seconds)" and "unlocks a
  downward dash" [V, rogueranker.com citing the wiki; another page on the same site says 33%].
- Crystal Heart (super dash) "Charge time ~1.4 seconds" [V, rogueranker.com].
- The Shade Cloak variant adds a damage-pass dash with its own longer cooldown [I, common knowledge, unverified].

**Inferences.** Hollow Knight's dash has no end-speed bleed into the run: the Knight returns to run speed at once,
which is why it reads as a reposition and not a speed tool. The wall refill of both verbs is what makes its chimney
climbs skippable.

**Gaps.** `HeroController` constants (`DASH_SPEED`, `DASH_TIME`, `DOUBLE_JUMP_SPEED`) were not found in any
indexable page; the modding community reads them from `Assembly-CSharp.dll`.

**See it.** https://hollowknight.wiki/w/Mothwing_Cloak · https://hollowknight.wiki/w/Monarch_Wings

---

## 5. Ori: bash, dash, double and triple jump, glide

**Takeaway.** Bash is an aimed launch off any projectile or enemy with a 20-frame windup; releasing all input
after a horizontal bash keeps the speed (bash glide). Jumping on the first frame after landing does not restore
the double or triple jump.

**Cited findings.**
- "Bash has a 20 frame 'windup' delay during which it cannot be released"; "Upon releasing a Bash, Ori is given a
  very large amount of speed in the aimed direction"; bash glide keeps horizontal speed while gravity applies;
  double bash by releasing on one frame and re-pressing the next [V, SDA knowledge base].
- "the game allows you to jump normally but will not restore your double or triple jump" (the "firsty"); every
  third jump is a front flip with no height change; double and triple jumps usable during a bash glide; Kuro's
  Feather usable and releasable at will during a glide [V, same].
- Design: the prototype "already had the double-jump and an early implementation of the Bash"; Mahler: the team
  "aims to develop abilities not usually seen in 2D games" [V, Edge via search; Xbox Wire 2014].

**Inferences.** Bash slows time while aiming (unverified here but visible in any clip); that aim step is why it
does not fit a 2-button time attack. The firsty rule is a refill rule with a 1-frame hole, the opposite of
Celeste's 0.1 s lockout, and a trap for determinism.

**Gaps.** Dash and charge dash numbers (Definitive Edition), glide fall speed, bash launch speed.

**See it.** https://kb.speeddemosarchive.com/Ori/Techniques_and_Glitches ·
https://news.xbox.com/en-us/2014/08/14/gamescom-ori-preview/

---

## 6. Rayman Legends hover and glide

**Takeaway.** Hold jump in the air to hover (the "helicopter"), a slow fall that is default in Legends; air kick
cancels into hover for stalls and chains.

**Cited findings.** "from Rayman Legends onward the heroes can glide by default"; the helicopter lets heroes
"glide over obstacles and lift them if they use it in an air current" [V, RayWiki via search]. Speedrun guide:
canceling an air kick "quickly after using it with a hover opens up many uses, such as air kick stalling" [V,
speedrun.com guide qcfu4 via search].

**Gaps.** Hover fall speed, duration, whether it is toggleable mid-fall. Pages returned 403.

**See it.** https://raymanpc.com/wiki/en/Helicoper · https://www.speedrun.com/rayman_legends/guide/qcfu4

---

## 7. Neon White: card verbs

**Takeaway.** Each weapon card has a Discard that is a movement verb; the card is a one-shot resource placed by the
level, so routing is a puzzle about where you spend it.

**Cited findings [V, TheGamer guide].** Elevate (pistol, 9 ammo): "Boosts you into the air vertically, acting as a
double jump if you're already airborne." Godspeed (rifle, 4): "Launches you forward with tremendous force."
Stomp (Uzi, 30): "Violently slam into the ground below you." Fireball (shotgun, 4): "an air dash that you can aim
before executing". Dominion (RPG, 4): "A grappling hook". Purify (MG, 35): sticky grenade. Cards are "a finite
resource, turning each stage into a puzzle"; "every level ... is expertly crafted with specific Cards in mind".

**Inferences.** Godspeed is a forward-only horizontal dash, Elevate a double jump, Stomp a ground pound, each as a
pickup rather than a loadout. This is the cleanest model for a map-placed dash in SpeedRunner: the verb is
authored into the map, the map decides where it is available.

**Gaps.** Distances and speeds of each discard (the wiki returned 402).

**See it.** https://www.thegamer.com/neon-white-soul-cards-tips-tricks-guide/ · https://en.wikipedia.org/wiki/Neon_White

---

## 8. Sonic: drop dash and homing attack

**Takeaway.** Drop dash is a landing accelerator: hold jump in the air for 20 frames and the landing sets ground
speed to at least 8 px/frame (12 max), combining with carried speed. Homing attack is a 3D lock-on verb and was
pruned.

**Cited findings.** "drpspd 8 The base speed for a drop dash. drpmax 12 The top speed for a drop dash"; Super 12
and 13; "the dash will take 20 frames to charge" (another passage says 30); "If the jump button is released before
Sonic hits the ground, the move is cancelled" [V, Sonic Physics Guide via search; page is behind an Anubis wall].
Sonic Retro calls it a "midair Spin Dash" introduced in Sonic Mania (2017) [V].

**Inferences.** At 60 fps 8 px/f is 480 px/s, Sonic's top run speed is 6 px/f, so the drop dash is 1.33x top speed
on landing, 2x when maxed. SpeedRunner's roll is already a drop dash with no input: a fall over 230 u keeps at
least 280 u/s [K]. The drop dash version would be "hold jump while falling to land rolling at 1.3x maxRun".

**Gaps.** Homing attack numbers (Sonic Advance 2 and Sonic 4 are the 2D cases); exact speed formula on slopes.

**See it.** https://info.sonicretro.org/SPG:Special_Abilities · https://info.sonicretro.org/Drop_Dash

---

## 9. Pizza Tower: mach run and super jump

**Takeaway.** Running is a four-stage speed ladder (6 to 20 units, probably px/frame) reached by holding dash, with
grab and slide shortcuts that start at stage 2 or 3; the super jump is a mach-gated vertical launch that cancels
into a shoulder bash.

**Cited findings [V, Pizza Tower speedrunning wiki, units unstated].** Walking 0-8, Mach 1 6-8, Mach 2 8-12, Mach 3
12-16, Mach 4 16-20. "It takes 20 frames to reach Mach 2 from a standstill." Mach 3 "Accelerates slower than at
other speeds (1/4 the usual acceleration)". Mach 4 only while holding DASH and FORWARD. Wall run "up to 19.50
speed"; slopes "up to 18 speed". Grab slide starts at 12; jump grab at 10. "coyote time doesn't work properly at
Mach 2 speed." Super jump available at Mach 3 in the wiki's text; a Steam comment says the final game moved it to
Mach 2 [V, conflict]. Pressing Run or Grab while super-jumping "cancels the jump into a shoulder-bash, instantly
giving back the Mach 2 speed" [V, TV Tropes via search].

**Inferences.** If the units are px/frame at 60 fps and Peppino is about 64 px tall, Mach 4 is about 19 BL/s, twice
SpeedRunner's 9.1 BL/s. The ladder is a hold-to-charge verb, not a tap, so it is a different control family.

**Gaps.** Super jump charge frames and vertical speed; units.

**See it.** https://pizzatowerspeedrunning.wiki.gg/wiki/Speed_(Simplified) ·
https://www.gamedeveloper.com/design/how-speedy-implementation-high-paced-platformer-pizza-tower

---

## 10. Double and triple jump, glide and float across the set

- Hollow Knight, Ori, Dustforce and Neon White each give exactly one extra air jump per airtime (Ori two with
  Triple Jump), refilled by ground or wall contact, by a kill (Dustforce), or by a card (Neon White) [V, sections
  2, 4, 5, 7].
- Celeste never has a double jump; its only air verb is the dash, which is why the dash reads [I].
- Glide and float are hold verbs that cut fall speed (Rayman hover, Ori feather, Celeste's feather is a 2 s
  steerable flight at 140 to 190 px/s, L4314 to L4317). They remove the fall from the clock and make every gap a
  question of height, which is why no time attack in the set makes them the default verb [I].

---

## 11. Answers for SpeedRunner

### How many dash directions does a side-view time attack need?

Two. Forward and back along the facing or held direction, as Mega Man X, Hollow Knight and Neon White's Godspeed
do. Celeste's 8 directions exist for a puzzle platformer and its author now wishes it were 4 [V, section 1]. In
SpeedRunner the vertical axis belongs to the jump, the wall kit and the roll; an up-dash would compete with the
3.0 BL jump and a down-dash with the roll. A 4-direction variant (add up) is worth one sandbox toggle; diagonals
are not, because the only payoff is the wavedash, which exists to bypass Celeste's ground refill [I].

Proposed numbers, scaled from Celeste's ratios [I from section 1 and K]:
- `dashSpeed` 2.67 x maxRun = 1120 u/s, `dashTime` 0.15 s: 168 u = 3.65 BL, 18 physics steps, gravity off.
- `dashCooldown` 0.2 s. Startup 1 step (8.3 ms) so the input is readable on replay; Celeste yields one frame.
- End speed: Celeste exits at 160/240 = 0.67 of dash speed, which would be 747 u/s here. SpeedRunner bleeds
  overspeed at only 500 u/s² (Celeste 400 px/s² against a 90 run, 4.4 runs per second; SpeedRunner 1.2 runs per
  second), so 747 would carry for 0.65 s. Exit at 1.3 x maxRun = 546 u/s instead, the same ceiling as #1's
  roll-jump hyper, so the two tools share one overspeed economy.
- Dash-jump (super): a jump inside the dash leaves at 546 x 830; a jump inside a roll-dash at 1.56 x maxRun =
  655 x 622 (0.75 jumpVel) if the team wants a hyper. Cap the whole set at 1.6 x maxRun.

### What refill rule keeps a run deterministic and readable?

Celeste's rule, copied: one dash; it refills only on ground contact (solid or the top of a one-way tile, not in
spikes), and never within 0.1 s of the dash start [V, L727 to L739, L80]. Do not refill on walls (Hollow Knight
does, and it is what turns chimneys into skips [I]); do not refill on kills unless D3's resource refunds are
adopted together. Determinism is already given by the 1/120 step and the one-shot key flag [K]; the rule adds two
timers and one integer, all stepped. Readability comes from the body: Celeste flips hair from red to blue when
the dash is spent and flashes white on refill [V, L276 to L280, L1136]; SpeedRunner's analogue is the kimono or
the katana sheath tint, plus two afterimages (dash start and end, L3591 and L3616) and a 50 ms hitstop on start
(L3449) that also marks the input on a replay. Hair-colour state is a two-colour read that a 10% alpha ghost
still shows.

A map-placed alternative is Neon White's: the dash is a pickup that grants one charge, so maps opt in [V, section
7]. That keeps the four existing maps valid and makes the SAMURAI TRIAL the dash map.

### What a dash does to a map set built for a 3.0 BL jump

Baseline [I from K]: a full jump at maxRun rises 332 ms to 138 u and falls 138 u at 4125 u/s² in 259 ms, about
0.59 s in the air and 248 u = 5.4 BL of flat gap (a little more with the apex band). One horizontal air dash adds
0.15 s of zero-gravity travel (168 u) and exits at 546 u/s, so the same jump clears about 248 + 168 + 0.26 s x
about 500 u/s = 545 u, about 11.8 BL. Every gap under 12 BL becomes trivial; m1's "momentum gap" and "3 narrow
platforms over a void" collapse into one dash; m2's pillar run and sky run lose their rhythm; the cave with a low
ceiling ("small hops only") is crossed by dashing under it. Vertical: with 2 directions nothing changes, which is
the point; with an up-dash of 168 u plus the 0.75 exit, a jump plus up-dash reaches about 6.5 BL, so m2's 600 u
(13 BL) wall-jump climb loses two wall jumps and m3's 550 to 800 u needle-capped climbs (12 to 17 BL) lose their
spike timing. A ground dash alone (no air use) changes only the clock: 168 u at 1120 instead of 420 saves 0.25 s
per use, about 1.5 s on a 16 s map at a dash every 2 s, with no gap changes; that is the safe variant for the
existing maps. Rule of thumb for E4-style maps: gap sizes 7 to 11 BL become the dash tier; 5 to 6 BL remains the
jump tier; anything over 12 BL still needs a mover or a wall.

---

## 12. Candidate technique profiles

| Profile | One line | Games | Key numbers |
|---|---|---|---|
| Horizontal dash, ground and air | Tap for 0.15 s at 2.67x run, 1 charge, ground refill with 0.1 s lockout, 0.2 s cooldown | Celeste, Mega Man X, Hollow Knight, Neon White Godspeed | 240 px/s, 36 px, 3.3 BL (Celeste); 3.5 px/f (X); 0.6 s cooldown (HK) |
| Dash-jump (super and hyper) | Jump inside the dash keeps the dash's speed in the air | Celeste, Mega Man X | 260 and 325 px/s, 2.9x and 3.6x run; 0.1 s grace |
| Dash refill as a readable state | Hair colour, white flash, two afterimages, 50 ms hitstop | Celeste | AC3232 / 44B7FF / ff6def, 0.08 s trail, 0.05 s freeze |
| Air charge | One shared resource for air jump or air dash, refunded by landing or a kill | Dustforce | 1 charge; downdash and wall jump free |
| Double jump with wall refill | One extra jump per airtime, refilled on ground or wall | Hollow Knight, Ori | Ori "firsty" 1-frame hole |
| Map-placed verb | The dash is a pickup; the level decides where you can dash | Neon White | 4 Godspeed rounds, 9 Elevate |
| Drop dash | Hold jump while falling to land at a set roll speed | Sonic Mania | 8 to 12 px/f, 20 frames charge |
| Speed ladder | Hold dash to climb four speed tiers | Pizza Tower | 6-8, 8-12, 12-16, 16-20; 20 frames to Mach 2 |
| Hover and glide (pruned) | Hold to fall slowly or fly | Rayman Legends, Ori feather, Celeste feather | Celeste 2 s, 140 to 190 px/s |
| Bash (pruned) | Aimed launch off a projectile with a 20-frame windup | Ori | 20 frames |

---

## Sources

1. NoelFB/Celeste, `Source/Player/Player.cs` (MIT), https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs (raw copy in `scratch-02/Player.cs`, 5471 lines)
2. Explosion Network, Celeste: In Conversation with Maddy Thorson and Noel Berry, ACMI MIGW, 6 Oct 2025, https://explosionnetwork.com/?p=119685
3. Vice, How Celeste Found Success in Embracing Speedrunners Who Broke the Game, 18 Feb 2021, https://www.vice.com/en/article/how-celeste-found-success-in-embracing-speedrunners-who-broke-the-game/
4. Aftermath, Celeste speedrun history (updated 27 Oct 2025), https://aftermath.site/celeste-speedrun-gdq-any-history-of-speedrunning.md
5. speedrun.com Celeste forum, new categories thread (Dashless remark, moderator reply), https://www.speedrun.com/posts/9kg7h
6. speedrun.com, Celeste 1.4 Binding Changes Explanation, https://www.speedrun.com/celeste/guide/02hpu (403 to fetcher)
7. speedrun.com, Why can't I get wave dash to work?, https://www.speedrun.com/posts/41mls
8. Celeste Wiki, Wave hyper, https://celestegame.fandom.com/wiki/File:Wave_hyper.gif
9. r/dustforce wiki, Mechanics, Tricks and Terminology (mirror), https://axebps-redlib.hf.space/r/dustforce/wiki/terms
10. TASVideos, Riokaii home page (Dustforce DX), https://tasvideos.org/HomePages/Riokaii
11. TV Tropes, Dustforce, https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/DustForce
12. dustapi docs, https://dustapi.readthedocs.io/en/latest/
13. TASVideos, Mega Man X game resources, https://tasvideos.org/GameResources/SNES/MegaManX
14. TASVideos forum post 434799 (X dash 3.5 px/f), https://tasvideos.org/Forum/Posts/434799
15. TASVideos, Mega Man X RAM map, https://tasvideos.org/GameResources/SNES/MegaManX/RAMMap
16. Rogue Ranker, Dashmaster guide, https://rogueranker.com/dashmaster-hollow-knight/
17. Rogue Ranker, Crystal Heart guide, https://rogueranker.com/crystal-heart-hollow-knight/
18. Hollow Knight wiki, Mothwing Cloak, https://hollowknight.wiki/w/Mothwing_Cloak (403 to fetcher)
19. SDA knowledge base, Ori Techniques and Glitches, https://kb.speeddemosarchive.com/Ori/Techniques_and_Glitches
20. Xbox Wire, gamescom 2014 Ori preview, https://news.xbox.com/en-us/2014/08/14/gamescom-ori-preview/
21. speedrun.com, Ori WotW Movement and Tech Guide, https://www.speedrun.com/ori_wotw/guides/i70ul (403)
22. RayWiki, Helicopter, https://raymanpc.com/wiki/en/Helicoper (403)
23. speedrun.com, Rayman Legends Basic Movement Tutorial Series, https://www.speedrun.com/rayman_legends/guide/qcfu4
24. TheGamer, Neon White Soul Cards guide, https://www.thegamer.com/neon-white-soul-cards-tips-tricks-guide/
25. Sonic Physics Guide, Special Abilities, https://info.sonicretro.org/SPG:Special_Abilities (Anubis wall; snippets)
26. Sonic Retro, Drop Dash, https://info.sonicretro.org/Drop_Dash
27. Pizza Tower speedrunning wiki, Speed (Simplified), https://pizzatowerspeedrunning.wiki.gg/wiki/Speed_(Simplified)
28. TV Tropes, Pizza Tower, https://www.tvtropes.org/pmwiki/pmwiki.php/Videogame/PizzaTower
29. Game Developer, How speedy implementation shaped Pizza Tower, https://www.gamedeveloper.com/design/how-speedy-implementation-high-paced-platformer-pizza-tower
30. Mechanics #1 report [S4], `studies/mechanics-speedrunner/report.md`, profiles A1 to A5 and E4
