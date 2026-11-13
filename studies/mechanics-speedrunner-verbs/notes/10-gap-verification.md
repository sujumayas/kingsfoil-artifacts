# 10. Gap verification: recovering the numbers the blocked wikis held

Second pass over the "Gaps" lists of notes 02 to 08. Fandom, speedrun.com HTML pages, hollowknight.wiki, TVTropes,
Ukikipedia and Reddit were still blocked (402/403), and web.archive.org is unreachable from this tool. Everything below
comes from sources that did answer: decompiled or mirrored game code on GitHub, mod repositories, TASVideos, the
speedrun.com REST API (which is not blocked even though the site is), developer changelogs and press.

Legend. **P** = primary (game code, decompile, developer statement). **C** = community measurement or wiki.
**I** = my inference from a primary number; the assumption is stated. [U] = still unverified.

Unit conversions use this study's hero: 1 BL = 46 u, 1 tile = 16 px in SNES games.

---

## 1. Hollow Knight, HeroController constants

The constants are `public float` fields on `HeroController` that Unity serialises in the Knight prefab, so the decompiled
C# alone (`AminSedaghaty/HK-Source`, `ayushpaharia/hollow-knight-code`, `hk-modding/api` patches) declares them without
values. The values live in a prefab. The WeaverCore modding framework ships a `Demo Player.prefab` that mirrors the
Knight's HeroController fields; it is maintained by a Hollow Knight modder and is the closest thing to the shipped
prefab that is indexable. Treat its numbers as P-adjacent (copied from the game's serialised data by a modder), and the
decompile as P for how each one is used.

| Field | Value | Unit | How the decompile uses it | Source | Kind |
|---|---|---|---|---|---|
| RUN_SPEED | 8.3 | u/s | horizontal run velocity | [1] | P-adj |
| RUN_SPEED_CH | 10 | u/s | Sprintmaster charm run | [1] | P-adj |
| JUMP_SPEED | 16.65 | u/s | rb2d.velocity.y while jump is held | [1] | P-adj |
| JUMP_STEPS / JUMP_STEPS_MIN | 9 / 4 | fixed steps | jump hold window; min hold | [1][2] | P-adj |
| DOUBLE_JUMP_STEPS | 9 | fixed steps | Monarch Wings hold window | [1][2] | P-adj |
| Double jump velocity | JUMP_SPEED x 1.1 = 18.3 | u/s | held for DOUBLE_JUMP_STEPS | [3] docstring; not re-read in [2] | C |
| DASH_SPEED | 20 | u/s | Mothwing Cloak horizontal speed | [1] | P-adj |
| DASH_TIME | 0.25 | s | dash duration | [1] | P-adj |
| Dash distance | 20 x 0.25 = **5 u** | u | DASH_SPEED x DASH_TIME | derived | I |
| DASH_SPEED_SHARP | 28 | u/s | Sharp Shadow charm | [1] | P-adj |
| DASH_COOLDOWN / DASH_COOLDOWN_CH | 0.6 / 0.4 | s | ground dash cooldown; with Dashmaster | [1] | P-adj |
| SHADOW_DASH_SPEED / TIME / COOLDOWN | 20 / 0.25 / 1.5 | u/s, s, s | Shade Cloak | [1] | P-adj |
| DASH_QUEUE_STEPS | 10 | fixed steps | dash input buffer | [1] | P-adj |
| WALLSLIDE_SPEED | -8 | u/s | clamp: `if (velocity.y < WALLSLIDE_SPEED) velocity.y = WALLSLIDE_SPEED` (line 1441 to 1452) | [1][2] | P-adj |
| WJ_KICKOFF_SPEED | 16 | u/s | wall-jump horizontal kick | [1] | P-adj |
| WJLOCK_STEPS_SHORT / LONG | 5 / 10 | fixed steps | wall-jump input lock | [1] | P-adj |
| WALL_STICKY_STEPS | 3 | fixed steps | stick to wall before sliding | [1] | P-adj |
| BOUNCE_VELOCITY (nail pogo) | 12 | u/s | `rb2d.velocity = new Vector2(x, BOUNCE_VELOCITY)` at line 1366 | [1][2] | P-adj |
| BOUNCE_TIME | 0.25 | s | pogo rise is held this long | [1] | P-adj |
| RECOIL_HOR_VELOCITY | 3.75 | u/s | horizontal nail-hit recoil | [1] | P-adj |
| RECOIL_VELOCITY / RECOIL_DURATION | 15 / 0.2 | u/s, s | damage knockback | [1] | P-adj |
| ATTACK_DURATION / _CH | 0.35 / 0.28 | s | nail swing; Quick Slash | [1] | P-adj |
| ATTACK_COOLDOWN_TIME / _CH | 0.41 / 0.25 | s | nail cooldown; Quick Slash | [1] | P-adj |
| NAIL_CHARGE_TIME_DEFAULT | 1.35 | s | Nail Art charge | [1] | P-adj |
| DEFAULT_GRAVITY | 0.79 | Rigidbody2D gravityScale | gravity multiplier | [1] | P-adj |
| MAX_FALL_VELOCITY | 20 | u/s | terminal fall | [1] | P-adj |
| BIG_FALL_TIME | 1.1 | s | fall before hard landing | [1] | P-adj |
| Decompile-only private constants | JUMP_QUEUE_STEPS 2, DOUBLE_JUMP_QUEUE_STEPS 10, ATTACK_QUEUE_STEPS 5, LANDING_BUFFER_STEPS 5, LEDGE_BUFFER_STEPS 2, HEAD_BUMP_STEPS 3, BUMP_VELOCITY 4, BUMP_VELOCITY_DASH 5 | steps, u/s | initialised in code | [2] lines 182 to 206 | P |

Inferences. Quick Slash cuts the swing-plus-cooldown cycle from 0.76 s to 0.53 s, a 30% cut (the earlier "32%" snippet
is close). Dash covers 5 u in 0.25 s and the Knight's capsule is about 1.25 u tall per the prefab's collider (not
re-checked), so a dash is roughly 4 body heights [I]. A pogo (12 u/s) is 72% of a full jump (16.65 u/s). Wall slide
(8 u/s) is 40% of terminal fall (20 u/s). "Fixed steps" are Unity FixedUpdate ticks; the decompile does not set
`fixedDeltaTime`, so I do not convert them to ms here.

Still open for HK: the shipped Knight prefab itself (WeaverCore is a modder's copy); the fixed step length.

## 2. Jump King, charge curve

Two independent mod repos quote `JumpKing.PlayerValues` and `JumpState.CHARGE_TIME`.

| Quantity | Value | Unit | Source | Kind |
|---|---|---|---|---|
| CHARGE_TIME (full charge) | **0.6** | s | [4] `CHARGE_TIME = 0.6f // seconds to fully charge`; [5] `Strength = min(1, TimerSeconds / 0.6f)` | P (extracted constants) |
| Intensity | `min(1, timer / CHARGE_TIME)`; `velocity.Y = PlayerValues.JUMP * intensity` | linear | [6] JumpChargeCalc.FakeJump | P (Harmony patch of JumpState) |
| PlayerValues.JUMP | -8.742858 | px/frame at full charge, Y down | [4] | P |
| PlayerValues.SPEED | 3.5 | px/frame horizontal during a jump, clamped to +-SPEED | [4][6] | P |
| PlayerValues.GRAVITY | 0.2571429 | px/frame^2 | [4] | P |
| MAX_FALL | 10 | px/frame | [4] | P |
| Charge quantisation | 60 steps/s stock; min 2 steps, max 36 steps; hold step 0.017 s | frames | [5] `MinimumStep = 2; MaximumStep = 36; StockStepsPerSecond = 60` | P (mod constants matching the game's timer) |
| Snow block | charge below 0.3 clamps to 0.3 if above 0.2, else no jump | fraction | [6] | P |
| Max height | 8.742858^2 / (2 x 0.2571429) = **148.6 px** | px | derived | I |
| Time to apex | 8.74 / 0.257 = 34 frames (0.57 s) | frames | derived | I |
| Full arc, flat landing | 68 frames x 3.5 = **238 px** horizontal | px | derived | I |
| Height in body heights | body hitbox centre (9, 13) implies an 18 x 26 px body; 148.6 / 26 = **5.7 body heights** | BL | [4] BodyCenter; derived | I |
| Min jump (2 steps) | intensity 2/36 = 0.056; vY = 0.49 px/frame; height about 0.5 px | px | derived | I |

Jump angles: the game has no angle input. Direction is `dpad.X` at release, giving vX = +-3.5 px/frame or 0; the arc
is fixed by charge only [6]. So the "angles" in the earlier gap are really three launch options (left, up, right).

## 3. Katana ZERO and Ghostrunner

| Quantity | Value | Source | Kind |
|---|---|---|---|
| Katana ZERO roll cadence | "normal rolls ... performed every 22 frames" | [7] Bar0ti, speedrun.com guide akw9e (search snippet; page is 403) | C |
| c-roll loop | start c-roll, slash after 10 frames, roll again after 12 frames | [7] snippet | C |
| Crouch roll | faster movement, same cooldown as a normal roll | [7] snippet | C |
| Roll invulnerability | "invincibility-granting roll" (no frame count) | [8] Prima/Bleeding Cool preview | C |
| IL timing rule | ILs submit in-game time from the pause or results screen, two decimals; full-game "All Stages" times from the first bullet deflect in Factory to the summary screen | [9] speedrun.com API | P (board rules) |
| Slow-mo time scale, meter seconds, refill | [U] | | |
| Roll i-frames and distance in px | [U] | | |
| Slash startup/active/recovery | [U] | | |
| Ghostrunner dash length, Sensory Boost scale and meter, Blink range, Tempest cooldown | [U]; the only mirror that search found (shapes.inc fandom mirror) returned 404 | | |
| Ghostrunner 2 upgrade deltas | Artificial Senses "reduce the cost of sensory boost by 25%"; Hydraulics Adjustment "dashing use 15% less stamina" | [10][11] | C |

## 4. Fall Guys

| Quantity | Value | Source | Kind |
|---|---|---|---|
| Dive distance, dive height, jump height | [U]; no outlet publishes figures | | |
| Grab duration on players | [U] | | |
| Patch 1.06 (Aug 2020) | grabbing obstacles removed in Slime Climb | [12] | P (patch notes via press) |
| Free for All update 1.08 (Jun 2022) | "You can now Dive Grab Tails and Crowns"; auto ledge grab on for new players, off by default for veterans | [13][14] | P via press |
| Update 1.29 (Nov) | fixed auto-grab being force-enabled | [15] | P via press |
| Controls | PC: Space jump, Ctrl dive, Shift grab; dive works on ground or midair, lands prone, then gets up | [16] | C |

## 5. Doodle Jump

| Quantity | Value | Source | Kind |
|---|---|---|---|
| Item points (proxy for height) | spring shoes about 500/jump; propeller 1,200 to 1,500; jetpack 2,800 to 3,000; rocket 6,000 to 7,000 (space theme only) | [17] | C |
| Trampoline vs spring | "4x height boost", more air time than a spring | [18] low reliability | C |
| Propeller | "sustained upward flight for several seconds", invulnerable to monsters while flying | [18] | C |
| Heights in px, durations in s, tilt sensitivity | [U] | | |

## 6. Super Mario World, spin jump and cape

The jump routine is in bank 00 of the SMWDisX disassembly [19]. `CODE_00D630`: X = (|PlayerXSpeed| >> 2) & $FE; if the
spin button (`axlr0000Frame` negative) and not carrying, set `SpinJumpFlag`, play `!SFX_SPIN`, and `INX`. Then
`LDA DATA_00D2BD,X ; STA PlayerYSpeed+1`. So the table is eight (normal, spin) pairs indexed by horizontal speed bucket.

`DATA_00D2BD: db $B0,$B6,$AE,$B4,$AB,$B2,$A9,$B0, $A6,$AE,$A4,$AB,$A1,$A9,$9F,$A6` [19] (P)

| |xspeed| bucket (X) | Normal jump Y speed | Spin jump Y speed | Spin / normal |
|---|---|---|---|
| 0 to 7 (standing) | $B0 = -80 | $B6 = -74 | 0.925 |
| 8 to 15 | $AE = -82 | $B4 = -76 | |
| 16 to 23 | $AB = -85 | $B2 = -78 | |
| 24 to 31 | $A9 = -87 | $B0 = -80 | |
| 32 to 39 | $A6 = -90 | $AE = -82 | |
| 40 to 47 | $A4 = -92 | $AB = -85 | |
| 48 to 55 (P-speed is 48) | $A1 = -95 | $A9 = -87 | 0.916 |
| 56+ | $9F = -97 | $A6 = -90 | |

Units: SMW speeds are signed bytes in 1/16 px per frame (I; standard SMW RAM-map convention, not re-verified here).
Inferences: a spin jump always launches 6 to 8 units (0.4 to 0.5 px/frame) slower than a normal jump at the same run
speed, so it peaks about **14 to 16% lower** ((74/80)^2 = 0.86). A P-speed spin jump (-87) launches faster than a
standing normal jump (-80), which is what StrategyWiki's "spin jump at top speed is slightly higher than a normal jump
standing still" means [20]. If held-jump gravity is 3 units/frame [I, unverified], standing normal jump peaks at
80^2 / (2 x 3) / 16 = 67 px (4.2 tiles) and standing spin at 57 px (3.6 tiles). Also from the routine: a spin jump
cannot start while carrying an item; the spin fireball timer `DATA_00D5F0` is $1C / $0C by facing.

Open: the spin-jump enemy-bounce Y speed and the cape dive-bomb speed table (they are elsewhere in bank 00/01 and I
did not trace them in budget). The gist that search offered as an "SMW table" (Noki Doki: single 42, double 52, spin
70 + 0.25 x spd) is Super Mario 64, not SMW [21]; it is useful for note 03's SM64 gap instead.

## 7. Super Mario Maker 2 tags and speedrun.com rules

| Quantity | Value | Source | Kind |
|---|---|---|---|
| Official tag list | Not confirmed in full. Mario Wiki only says courses "can also be searched by tags ... such as 'Puzzle-solving' and 'Autoscroll'" [22]. Community threads use Short and Sweet, Puzzle-solving, Themed, Single player [23]; a community guide names Autoscroll, Music, Shoot-'em-up, Automatic, Puzzle [24]; Vice confirms the tags "are written by Nintendo" and names "autoscroll" and "speedrun" [25] | | C |
| The 15-tag list in the brief (Standard ... Link) | [U] as a complete official list; 9 of the 15 names are attested in [22] to [25] | | |
| speedrun.com SMM2 categories | Story Mode (Any%) with mandatory variable Luigi Assist = {No Luigi Assist (default), Luigi Assist}; Clear (per level, in-game time, "Luigi and starting from a checkpoint are not allowed"); Story Mode (All Jobs); Endless Mode by difficulty (Easy/Normal/Expert 16 levels, Super Expert 6; "Clear Animation Skip" allowed, "Repeat Level" glitch banned); All Ninjis (Legacy 20, Current 21); 2019 Invitational Courses | [26] speedrun.com API | P (board rules) |
| "No power-up" rule | none; no power-up variable exists on the SMM2 board | [26] | P (absence) |

## 8. Ultimate Chicken Horse placement rules

| Quantity | Value | Source | Kind |
|---|---|---|---|
| Placement timer | introduced July 2016; "if the time is up and you haven't placed, you lose your chance"; added "to avoid the Mexican stand-off" where a bomb holder waits; optional "but most games will have it" | [27] Clever Endeavour blog | P |
| Placement timer range | 5 to 60 s, or None | fandom Rules page via search snippet [28] | C |
| Default timer | [U] | | |
| Party Box modes | V1.6.040 (2019-03-04): Standard, Disabled, Auto-Pick; "Double Party Box can now be enabled for any number of players"; V1.4.161 (2017-12-12): two-player games get an extra party box each round; V1.13.13 (2026-05-19): True Random option | [29] changelog | P |
| Pieces offered per player count | [U] | | |
| Rotation and flip | V1.6.040: "Many blocks can now be both rotated AND flipped"; hold Sprint while pressing flip/rotate for the other transform | [29] | P |
| Goal blocking | V1.6.040 fixed Start and Goal zones overlapping in Free Play; V1.6.050 "fixed bug that allowed some blocks to be attached to the endzone"; V1.6.061 prevented goal/end blocks being placed unselectably | [29] | P |
| Snap grid | [U]; changelog never mentions a grid | | |
| Default preset | 5 points, 12 rounds, all blocks | [28] snippet | C |
| Run Time Limit | exists (V1.8.22 fix); default [U] | [29] | P |

## 9. SpeedRunners, Umihara Kawase, Worms

| Quantity | Value | Source | Kind |
|---|---|---|---|
| SpeedRunners item roll, boost fill | [U]; every search returned other games | | |
| Umihara Kawase rope-out speed | "rope travels at 4 pixels per second" (page units; likely per frame) | [30] TASVideos | C (TAS measurement) |
| Umihara return speed | 8 px per "second" | [30] | C |
| Umihara max rope length | about 104 px, then it returns | [30] | C |
| Umihara rope force | `xspeed += sin(angle) * (stretch - len) * 2`; max rope acceleration 60 | [30] | C |
| Umihara reel in / release | 2 per step each | [30] | C |
| Umihara gravity, run cap, jump | y += 18 per frame; horizontal cap 96; jump -256 (fixed-point) | [30] | C |
| Worms rope speed cap | 16 px/frame for worms on ropes (2006 forum post, as quoted by search; the thread I fetched only had qualitative posts) | [31] | C, weak |
| Worms rope length, retract px/frame | [U]; worms2d.info Ninja_Rope still blocked | | |

## 10. Mega Man X dash

| Quantity | Value | Source | Kind |
|---|---|---|---|
| Walk | 1.5 px/frame | [32] TASVideos | C (TAS) |
| Dash | **3.5 px/frame** (2.33x walk) | [32] | C |
| Jump launch | 5.0 px/frame up | [32] | C |
| Gravity / terminal | 0.25 px/frame^2 / 5.75 px/frame | [32] | C |
| Ladder | 1.5 px/frame | [32] | C |
| Dash frames | [U]; RAM 7E0BFA "Dash, frames remaining" (X1), 7E0A2A (X2/X3), no start value published | [32] | |
| Dash carry | dash speed carries into the air until X touches a surface or air-dashes | [32] | C |
| Wall kick | within about 5 or 6 px of the wall; turnaround kick = jump the frame after left+right | [33][34] | C |
| Ride Armor (X2) | 43 frames to enter, dashes 4 px/frame, breaks even after 4 to 5 s | [34] | C |
| Jump height | 5.0^2 / (2 x 0.25) = 50 px = 3.1 tiles; apex at 20 frames | derived | I |

## Still unverified (after this pass)

- Hollow Knight: the shipped Knight prefab values (WeaverCore mirror used); Unity fixed step length for the "steps".
- Katana ZERO: roll i-frames, roll distance, slow-mo time scale, meter seconds and refill, slash frames. Only the 22-frame roll cadence and the 10/12-frame c-roll loop survive, from a search snippet.
- Ghostrunner: every number (dash, Sensory Boost scale and meter, Blink, Tempest).
- Fall Guys: dive distance and height, jump height, grab hold duration. Only patch facts recovered.
- Doodle Jump: item heights and durations, tilt sensitivity. Points ladder only.
- SMW: spin-jump enemy bounce Y speed; cape dive-bomb table; the 1/16 px unit and 3/frame gravity assumptions.
- SMM2: the complete official tag list (9 of 15 names attested, none from Nintendo).
- UCH: default placement timer, pieces per Party Box by player count, snap grid.
- SpeedRunners: item roll rule, boost meter fill.
- Worms: rope length and retract rate in px/frame.
- Mega Man X: dash duration in frames; X2/X3 air dash distance.
- Umihara Kawase: the TASVideos page is marked work in progress and its "per second" rates are probably per frame.

## Sources

1. WeaverCore Demo Player prefab (HeroController fields serialised): https://github.com/nickc01/WeaverCore/blob/0b713e0e0791b42649d8cfe9c8191c737ec7a7aa/WeaverCore.Editor/Assets/Prefabs/Demo%20Player.prefab
2. Decompiled HeroController.cs (Hollow Knight 1.5): https://github.com/AminSedaghaty/HK-Source/blob/f516282143970c48bcb25b695489ec0855b3b837/CSharp/HeroController.cs (also https://github.com/hk-modding/api/blob/master/Assembly-CSharp/Patches/HeroController.cs)
3. hk-psx hero simulation notes: https://github.com/EBonura/hk-psx/blob/5423e26ec995b3c907f8934bdfd46a2f06e73dd6/shared/hk-sim/src/lib.rs
4. jump-king-parabole, constants "extracted from JumpKing.PlayerValues": https://github.com/qequ/jump-king-parabole/blob/main/src/JumpParabola.cs
5. Subframe Charge mod, ChargeQuantizer.cs: https://github.com/anyalink99/jump-king-mods/blob/main/mods/subframe-charge/src/ChargeQuantizer.cs
6. JumpKingPlus Workshop, JumpChargeCalc.cs (Harmony patch on JumpState): https://github.com/JumpKingPlus/Workshop/blob/master/WorkshopPlus/JumpKingJumpArch/Models/JumpChargeCalc.cs
7. Bar0ti, "Moving techniques in the game" (speedrun.com guide, 403; quoted from search snippet): https://www.speedrun.com/katana_zero/guide/akw9e
8. Katana ZERO preview (Bleeding Cool via Prima): https://primagames.com/featured/katana-zero-preview-bleeding-cool
9. speedrun.com API, Katana ZERO categories: https://www.speedrun.com/api/v1/games/katana_zero/categories?embed=variables
10. Ghostrunner 2 upgrades (Gamer Guides): https://www.gamerguides.com/ghostrunner-2/reviews/review
11. Best Ghostrunner 2 upgrades (GameSpot): https://gamespot.com/articles/best-ghostrunner-2-upgrades-and-skills/1100-6518679/
12. Fall Guys 1.06 patch notes (MP1st): https://mp1st.com/?p=131283
13. Fall Guys Free for All update patch notes (Nintendo Life, Jul 2022): https://www.nintendolife.com/news/2022/07/fall-guys-gets-an-update-here-are-the-full-patch-notes
14. Fall Guys 1.08 (MP1st): https://mp1st.com/news/fall-guys-update-1-08-drops-for-free-for-all-new-content-this-june-21
15. Fall Guys 1.29 (MP1st): https://mp1st.com/title-updates-and-patches/fall-guys-update-1-29-released-this-november-7
16. Fall Guys controls (Shacknews): https://shacknews.com/article/119827/fall-guys-ultimate-knockout-controls-and-keybindings
17. Doodle Jump item points (GameRevolution): https://www.gamerevolution.com/guides/56951-doodle-jump-how-much-points-you-get-with-special-items
18. Doodle Jump mobile guide (low reliability): https://sophiecress.com/blog/doodle-jump-mobile-your-guide
19. SMWDisX bank_00.asm (CODE_00D630, DATA_00D2BD): https://github.com/IsoFrieze/SMWDisX/blob/master/bank_00.asm
20. StrategyWiki, SMW controls: https://strategywiki.org/wiki/Super_Mario_World/Controls
21. JpepWasTaken gist (Noki Doki SM64 jump table): https://gist.github.com/JpepWasTaken/e8c2eec244e919f527f651f8fe4bdb29
22. Super Mario Wiki, Super Mario Maker 2 (Course World): https://www.mariowiki.com/Super_Mario_Maker_2
23. Nintendo Life level-sharing thread (tag usage): https://www.nintendolife.com/forums/nintendo-switch/super_mario_maker_2_level_sharing?start=1160
24. GameSkinny SMM2 tag guide: https://gameskinny.com/?p=32298
25. Vice, "20 second gauntlets of death": https://www.vice.com/en/article/20-second-gauntlets-of-death-are-the-hottest-trend-in-mario-maker-levels/
26. speedrun.com API, SMM2 categories and variables: https://www.speedrun.com/api/v1/games/smm2/categories?embed=variables
27. Clever Endeavour, "New placement timer" (2016-07-07): https://www.cleverendeavourgames.com/blog/2016/7/7/new-placement-timer-bug-tracking-and-summer-sale-results
28. UCH fandom Rules page (402; quoted from search snippet): https://ultimate-chicken-horse.fandom.com/wiki/Rules
29. Clever Endeavour changelog (all platforms): https://www.cleverendeavourgames.com/changelog
30. TASVideos, Umihara Kawase physics (work in progress): https://tasvideos.org/GameResources/SNES/UmiharaKawase/Physics
31. Team17 forum, roping mechanics thread (16 px/frame cap quoted by search; fetched page had no numbers): https://t17forum.worms2d.info/index.php/t-31870.html
32. TASVideos, Mega Man X data (speeds, RAM): https://tasvideos.org/GameResources/SNES/MegaManX/Data
33. TASVideos, Mega Man X game resources: https://tasvideos.org/GameResources/SNES/MegaManX
34. TASVideos forum post 434799 (Ride Armor, wall slide): https://tasvideos.org/Forum/Posts/434799
