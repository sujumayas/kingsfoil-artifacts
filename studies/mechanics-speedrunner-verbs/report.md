# SpeedRunner verbs: dash, crawl, grapple, dive, draw and the other mechanics the great runners added, and which ones fit a samurai time attack

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #2 of the **Game mechanics** series in our library [S1] and the complement of Mechanics #1 [S4]. That study covered SpeedRunner's whole kit and settled what is not reopened here: the jump at 3.0 BL and 332 ms, forgiveness windows within 17 ms of Celeste and N++, corner correction at 8 u, the wall kit, the roll-jump hyper at 1.3x maxRun, the stomp bounce at a full jump, the 100 ms slash at 50x40 u that never touches vx, the 1-byte-per-step input log and its re-simulating validator, the countdown-free restart [S4]. Where a verb below touches the kit, this study says how it chains in, not how the kit works.

SpeedRunner today has six verbs on one button plus a direction: run, a variable jump with a 0.45 cut, a wall slide at 115 u/s after a 100 ms stick, a wall jump away (440/790 u/s) or up the wall (190 u/s out, more height), a roll after a 230 u fall keeping at least 280 u/s, and a cosmetic flip [K]. Down and Up do nothing. The katana is drawn only in the 3.7 s duel after the flag [K].

The user asked for the mechanics the same games added that #1 did not cover: "new mechanics from the same games, dash, crawl, what you find, as toggles in the Sandbox". The games are Getting Over It, Doodle Jump, Jetpack Joyride, Solipskier, LittleBigPlanet, Cat Mario (Syobon Action), Fall Guys, Super Mario Maker and Ultimate Chicken Horse, plus the twins that publish numbers: Celeste, Super Meat Boy and Forever, N and N++, Dustforce, SpeedRunners, Mirror's Edge, Neon White, Sonic, Pizza Tower, Rayman Legends, Shovel Knight, Hollow Knight, Katana ZERO, Ghostrunner, Ori, Mega Man X and Zero, Spelunky, Super Mario 64 and Odyssey, Jump King, Bionic Commando, Worms and Umihara Kawase.

A **verb** here is something the player does on purpose with an input and that the simulation treats as its own state: dash, air dash, double jump, crouch, crawl, crouch-slide, long jump, dive, ground pound, fast fall, ledge grab and mantle, wall run, climb with stamina, grapple and swing, hook, glide, jetpack thrust, charged jump, drawn ground, hammer, grab and throw, spin jump, pogo, parry, slow time, placing a block. Items that act without an input are elements and belong to #1. The anti-verbs of the named games (Cat Mario's fakes, UCH's traps, Fall Guys' grab) teach the same lesson from the other side. Every verb found became a profile; the good ones became toggles in the SpeedRunner Verbs Sandbox [S3], which extends #1's Sandbox with a Verbs panel and a third map.

**Five equal priorities.**
- **Feel.** How good the verb is in the hands at 60 fps rendering over a 120 Hz step. Timing in ms and physics steps, distances in body lengths.
- **Readability.** How fast a player, and a spectator watching a 10% alpha ghost, understands the verb on first sight at 420 u/s in black ink on white paper.
- **Run fit.** How well the verb serves a restart-heavy, deterministic time attack with a leaderboard and an input-log ghost. A verb that voids the four shipped maps scores low.
- **Cheapness.** What it costs a five-person collective writing hand-rolled Canvas2D JavaScript with no engine, measured in buttons as much as in lines.
- **Evidence.** How strong the sources are. Source code or a designer statement scores 5, community consensus 3, a single post 1.

**Targets.**
- The live game at `speedrunner-tau.vercel.app` [S2], keyboard today, two or three buttons plus a direction, with a 1/120 s step and input replays that must stay deterministic.
- World units u, 1 body length (BL) = 46 u, maxRun 420 u/s, jumpVel 830 u/s, gravity 2500 u/s² rising and 4125 falling [K].
- A reader who opens the Sandbox [S3], plays the recommended verb set on the Verbs gym, and switches each verb off to feel what it does.

**Sources.** Eight research notes, a verification note, a gap note and the Sandbox [S3]. The hardest numbers come from code: Celeste's MIT `Player.cs` for the dash, the duck, the climb and the state machine, the Super Mario 64 decompilation for the long jump, dive and ground pound, the SMW TAS tables and disassembly for the cape and spin jump, Jump King's extracted constants, a Hollow Knight prefab mirror, Terraria's hook table and Fristrom's swing constraint. Fandom, speedrun.com pages, Sonic Retro and several wikis returned 402 and 403 on 13 Nov 2026, so community frame data for Katana ZERO, Ghostrunner, Fall Guys and SpeedRunners is marked [U] and listed in §12. Every Sandbox number comes from a JavaScript prototype, not from the game.

---

## 1. Executive summary

**Dash and air verbs.**

1. **The canon dash is one tap, 2.67x run for 150 ms, one charge, refilled on the ground.** Celeste's `DashSpeed 240` for `DashTime 0.15` s covers 36 px (4.5 tiles, 3.3 BL), exits at `EndDashSpeed 160`, cools down 0.2 s and refuses a refill for 0.1 s; Mega Man X dashes at 3.5 px per frame, 2.33x its walk, carried through the jump; Hollow Knight's `DASH_SPEED 20` for 0.25 s cools down 0.6 s [V, S7, S131, S21]. Scaled to SpeedRunner the plain dash is 1120 u/s for 18 steps, 168 u = 3.65 BL, exit clamped to 546 u/s so it shares the roll-jump hyper's overspeed economy [I].
2. **Two directions, not eight.** Thorson said at ACMI in October 2025 that she wished the dash had four directions, per one recap; Mega Man X, Hollow Knight and Neon White's Godspeed are forward-only [V, S33, S34, S16, S50, S64]. In a side-view time attack the vertical axis belongs to the jump, the wall kit and the roll, so the Sandbox dash is two-way with a four-way toggle [I].
3. **A dash is a map rewrite.** A full jump at maxRun clears about 248 u = 5.4 BL (246 to 248 u stepped); one horizontal air dash adds 168 u of zero-gravity travel and a 546 u/s exit, so the same jump clears about 545 u = 11.8 BL and m1's momentum gap, its three narrow platforms, m2's pillar run, sky run and "small hops only" cave all collapse [K; I]. A ground-only dash changes the clock alone, about 0.25 s per use [I].

**Ground and body verbs.**

4. **The crouch is a hitbox swap to 55 to 63% and a refusal to stand under a ceiling.** Celeste swaps `normalHitbox (8, 11)` for `duckHitbox (8, 6)` and `CanUnDuck` tests only `Solid`; SM64 sets `hitboxHeight` to 100 of 160 [V, S7, S9]. SpeedRunner's crouch is 20x26 u (57%) with the feet fixed and a 120 u/s crawl, dead weight until a map has a 32 u gap [I].
5. **The slide-jump and the roll-jump hyper are one rule.** SM64's long jump is x1.5 forward capped at 48 with 30 up (0.7 BL) against a 42 jump; Celeste's duck-super is x1.25 at half height [V, S9, S7]. A SpeedRunner slide at 600 u/s² friction travels 147 u = 3.2 BL from maxRun in 0.7 s, and a jump out of it leaves at the hyper's 546 x 622 u/s [I].
6. **Down in the air is a fast fall, not a pound.** SM64's pound hovers 10 frames, 110 u, then falls at 50 u per frame with zero forward speed [V, S10, S13]. A stomp that sets vy to at least 700 u/s and keeps vx lands a 3 BL jump about 150 ms sooner and feeds the 230 u roll; dive and belly flop (SM64 +15, Fall Guys' facing-only dive) add a third overspeed source and a prone landing, so they fit only a map built for them [K; V, S9, S135; I].

**Wall, rope and flight verbs.**

7. **Mantle automatically, never hang.** Celeste's `ClimbHopY -120` and `ClimbHopX 100` launch a climber over a wall top at 1.14x jump speed for 0.2 s; Spelunky's grab is a stop that saves a life [V, S7; U, S111]. SpeedRunner's mantle snaps the feet up when the wall top is within a third of a body above the head, vy -300 and vx 200 for 100 ms, no button; climb with stamina (110 points, 45.45 per second, 45 px/s) and the wall run are course changes [V, S7; I].
8. **A swing is three lines of maths and a release cap.** Fristrom projects the free step back onto the rope circle and recomputes velocity; at L = 276 u (6 BL) and g = 2500 the period is 2π sqrt(L/g) = 2.09 s, a 45° entry at maxRun leaves at 762 u/s and a 90° drop-in at 1175 u/s, above maxFall [V, S19; I]. The ring hook is Up + Katana in the air, 45° fixed, authored rings only, reach 300 u = 6.5 BL from Terraria's 6.25 BL starter hook, release capped at 760 u/s [V, S18, S99, S108; I].
9. **Jetpack thrust, glide and the charged jump remove the jump.** Jetpack Joyride is one touch with vehicles remapping it, the SMW cape climbs 80 frames at 6% above sprint, Jump King's `CHARGE_TIME` is 0.6 s with a linear curve to 5.7 body heights [V, S112, S15, S44]. Each fits as a section or a pickup, none as a default verb on a clock [I].

**Katana and kit verbs.**

10. **Three katana verbs on one button, deflect as a property.** Katana ZERO deflects any bullet that enters the slash and its gold-medal guides set hitpause to 0%; Mega Man Zero puts dash-slash, air slash and down thrust on one attack button; Ninja Gaiden II roots the grounded slash for 20 frames [V, S152, S158, S164, S165]. SpeedRunner's set is tap for the settled slash, Down + tap in the air for a pogo at 830 u/s, and hold 200 ms then release for an iai dash-slash at 840 u/s for 100 to 150 ms, 1.8 to 2.7 BL of kill line; a 300 ms whiff lockout is rejected [S4; I].
11. **The level hands the verb and the level is the rule.** Mario Maker's power-ups are kits of 2 to 7 verbs per style, Neon White prices movement in ammo (Godspeed 4, Elevate 9), and the SMM2 Clear board bans Luigi, never a power-up [V, S69, S64, S28]. A per-map `verbs` mask plus pickups keeps the four shipped maps valid and makes SAMURAI TRIAL the verb map [I].
12. **Placing a block is a party verb that survives async.** UCH places one piece per player under a 5 to 60 s shared clock [V, S142, S146]. SpeedRunner's version is one trap after a finished run, map state hashed into the board key, chain capped at 12, reset weekly; Getting Over It's hammer and Solipskier's slope stay figures because a pointer path is replayable but never comparable [V, S118, S127; I].

**Budget and determinism.**

13. **Eight to nine verbs on three buttons is the agreed ceiling.** Crawford's bound is "fewer than ten verbs", N++ has one button, Celeste three plus the Crouch Dash bind added in v1.4.0.0 on 29 Mar 2021 because runners were binding it with Joy2Key [V, S173, S172, S14, S41]. SpeedRunner's recommended set is 15 verbs on Move, Jump and Katana with Down and Up as modifiers, nine of them context verbs [I].
14. **The input log grows by three bits and the state machine is a table.** Celeste's `StateMachine(23)` checks dash before jump in `NormalUpdate`, and CelesteTAS writes `123,R,J` per run of identical input [V, S7, S20]. SpeedRunner's log becomes one byte of eight held bits, `L R U D Jump Katana DashPress Climb`, with every press read as the edge of its held bit, plus a varint run length, 288 B per minute measured on the course, and the validator hashes `VERBS` with `PHYS` [V, S3; I].

**Recommendation for SpeedRunner** [I]. Keep three inputs, Move, Jump and Katana, and add eight verbs that need no new button. On Down, a crouch (20x26 u, crawl 120 u/s) that becomes a slide above 280 u/s with 600 u/s² friction, a slide-jump at 546 x 622 u/s, and a stomp in the air that sets vy to at least 700 u/s and feeds the roll. An automatic mantle when a wall top sits within 16 u above the head. On Katana, a pogo (Down + Katana in the air, 40x50 u below the feet, bounce 830 u/s, refunds the dash-slash), an iai dash-slash (hold 200 ms, release, 840 u/s for 12 to 18 steps, projectile i-frames, exit 546 u/s, one per airtime), and the deflect as a property of the slash. On Up + Katana in the air, a ring hook to authored rings with a 760 u/s release cap. This is the Sandbox's "Recommended" preset. Keep the plain dash, double jump, climb, wall run, glide, jetpack, charged jump, dive, ground pound and any-ceiling hook as comparison toggles and kits for the Verbs gym; keep slow time, the hammer and the drawn slope out of the ranked run; gate verbs per map with a `verbs` mask so the four shipped boards survive, and open SAMURAI TRIAL as the first verb map.

**The top five of the backlog, one sentence each** [I]. The Down verbs (crouch, slide, slide-jump, stomp) add four verbs for one hitbox swap, one friction constant and two poses, and they fit every map today. The automatic mantle kills the lip death A2 named at 420 u/s for about 30 lines and no input. The per-map verb mask lets the boards of m1 to m4 survive the new verbs untouched. The pogo gives the katana its first job in a run for the cost of a second hitbox orientation, and turns m3's spike floors into steps. The deflect as a property of the slash buys a 14 to 17-step parry window for free and keeps the rejected 300 ms lockout out of the game.

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: code, docs, wiki or article. "[V, vendor]" and "[V, self-reported]" mark figures reported by their own authors. |
| **[I]** | Author inference or design proposal. Untested unless it says "Sandbox", and then tested only in our JavaScript prototype. |
| **[U]** | Unverified: memory, a search snippet, a single secondary source, or a page that could not be fetched. Treat it as a lead. |
| **[K]** | Kingsfoil fact read from SpeedRunner's served bundle on 13 Nov 2026 (`notes/01-current-build.md`). |

- [S#] refers to §14. [S4] is Mechanics #1; a profile id after it ([S4 A5]) names the profile there.
- Ratings (1 to 5) are author judgement, in this order: **Feel · Readability · Run fit · Cheapness · Evidence**.
- **Feel** is how good the verb is in the hands at 60 fps rendering over a 120 Hz physics step. **Readability** is how fast a player understands it on first sight, including from a ghost. **Run fit** is how well it serves a restart-heavy, deterministic time attack with a leaderboard, and how little it voids the shipped maps. **Cheapness** is the cost for a five-person team in hand-written Canvas2D JavaScript, counting buttons as cost. **Evidence** is the strength of the sources. Code or a designer statement scores 5, community consensus 3, a single post 1.
- Units are world units u. The hero is 20x46 u, so 1 body length (BL) = 46 u. Physics steps are at 120 Hz, 8.33 ms each; "12 steps" is 100 ms. Frames are at 60 fps unless stated; SM64 runs at 30 Hz.
- Published values are converted to body lengths so they compare. Celeste's Madeline is 8x11 px on 8 px tiles, so 1 BL = 11 px and 1 tile = 0.73 BL. Mario in SM64 has a 160 u standing hitbox, so 1 BL = 160 u there. Big Mario in SMW is 32 px (2 tiles). Peppino is about 64 px tall. Terraria's player is 3 tiles tall. Mega Man X is about 34 px tall.
- "Startup, active, recovery" are the fighting-game phases of a verb in steps. "Cancel" means a second input ends the verb early and starts another. "Refill" is the rule that restores a spent verb.

---

## 3. Generations: a timeline

**Gen 1: the arm, the dash, the cape and the crouch jumps (1988–1997)**
- **1988** Bionic Commando gives Spencer an arm and no jump; GRIN kept "exactly the same movement" in Rearmed twenty years later [V, S99]. **1990** Super Mario World adds the spin jump, lower than a jump but safe on Spinies, and a cape that climbs for 80 frames on a sprint jump [V, S70, S15].
- **1993** Mega Man X dashes forward at about 3.5 px per frame and keeps the speed through the jump; X2 adds one air dash per jump [V, S17, S16]. **1994** Umihara Kawase casts an elastic fishing line that "can catapult her long distances" [V, S110].
- **1995** Worms ships, and **1997** Worms 2 gives the Ninja Rope its wide arc; the community calls the physics "simply a pendulum" [V, S102, S104]. **1996** Super Mario 64 adds the long jump (x1.5 forward, 30 up), the backflip and side flip (62 up) and the ground pound (hover, then 50 u per frame down) [V, S9, S10].

**Gen 2: one input, one body (2002–2010)**
- **2002** Sexy Hiking puts a hammer on a mouse; Foddy found it in 2007 and "realized how timeless the design was" [V, S119]. **2004** N is "three buttons controlling left and right movement, and the jump" [V, S172]. **2004** Spider-Man 2 anchors every web to real geometry at about 10x Earth gravity [V, S106].
- **Sep 2006** Line Rider lets the player draw the track and press Play [V, S130]. **Feb 2007** Syobon Action breaks every SMB1 promise with run and jump alone [V, S140]. **2008** Mirror's Edge ships the slide, the wall run and a kick that places "a small invisible platform" [V, S177]. **2008** LittleBigPlanet's grab is "hold R1 on sponge" [V, S97; I].
- **2009** Doodle Jump steers by tilt, shoots by tap and sells springs at about 2x and trampolines at about 4x the bounce [V, S116, S117]. **Aug 2010** Solipskier lets the finger draw the slope; lifting it is the jump [V, S127]. **2010** Super Meat Boy has no dash; its 2020 sequel Forever is two buttons, jump and a slide that is also a dive and a fast fall [V, S180].

**Gen 3: hooks, dashes and the handed kit (2011–2016)**
- **Jan 2011** LittleBigPlanet 2's Grappling Hook fires along the stick and reels [V, S93, S92]. **Sep 2011** Jetpack Joyride's vehicles remap the one touch until a hit [V, S112]. **2011** Terraria's first hook reaches 18.75 tiles at 59 mph against a 15 mph walk [V, S18].
- **2012** Dustforce gives one air charge for an air jump or an air dash, refilled by landing or a kill [V, S43]. **2013** SpeedRunners makes the hook a race verb with no aim [V, S87, S88]. **2014** Shovel Knight bounces "~4.5 tiles", its own jump height [V, S163].
- **Mar 2015** Ori's bash has a 20-frame windup [V, S53]. **Sep 2015** Super Mario Maker ships power-ups as kits per style [V, S69]. **Mar 2016** Ultimate Chicken Horse places one piece per player under a shared clock [V, S142]. **2016** Superhot ships two boards, game time and real time [V, S169].

**Gen 4: resources, cards and bodies that fall over (2017–2020)**
- **2017** Getting Over It puts 2.7 M players on a hammer and a pot [V, S118]. **2017** Hollow Knight's Mothwing Cloak cools down about 0.6 s and refills on walls [V, S49, S50]. **Aug 2017** Sonic Mania's drop dash charges 20 frames in the air and lands at 8 to 12 px per frame [V, S56, S57].
- **Jan 2018** Celeste ships `DashSpeed 240`, `DashTime 0.15`, `DashRefillCooldown 0.1`, `ClimbMaxStamina 110` and a crouch dash its author did not plan [V, S7, S33]. **Feb 2019** Pogostuck and **May 2019** Jump King make the held charge the only verb [V, S126, S124]. **Apr 2019** Katana ZERO folds the deflect into the slash and later ships a hitpause slider runners set to 0% [V, S151, S158].
- **Aug 2020** Fall Guys ships jump, dive and grab at "about 80 percent skill and a 20 percent sprinkling of chaos" [V, S133]. **Oct 2020** Ghostrunner's Blink kills along a drawn line; the developers added time and death counters because demo players chased records [V, S160; U].

**Gen 5: binds, discards and the growing level (2021–2026)**
- **Mar 2021** Celeste v1.4.0.0 adds the Crouch Dash bind with Press and Hold modes and separates movement directions from dash directions [V, S14]. **Jun 2022** Neon White prices every movement verb in a card's ammo and ships over 100 levels after scrapping about twice that [V, S64, S66].
- **Jan 2023** Pizza Tower's Mach ladder reaches Mach 2 in 20 frames and its taunt parries for 20 [V, S58, S61]. **Oct 2023** Ghostrunner 2 adds swings from cranes and shuriken that create hook points [V, S109; U].
- **Oct 2025** Thorson tells an ACMI audience she would make the dash four-way in a Celeste 2, per one recap [V, S33, S34]. **May 2026** Ultimate Chicken Horse 1.13.13 adds a True Random Party Box rule [V, S147]. **Nov 2026** this study and its Sandbox [S3].

---

## 4. Technique profiles

There are eight families:

- **A.** Dash and air verbs
- **B.** Ground and body verbs
- **C.** Wall and ledge verbs
- **D.** Rope, hook and flight verbs
- **E.** Physics-input verbs of the named games
- **F.** Katana verbs
- **G.** Verb kits, items and placing
- **H.** Verb budget, inputs and determinism

A to D sort the verbs by where the body is, in the air, on the ground, on a wall, on a rope. E holds the named games whose whole verb is an analog input. F is the samurai's own family and the study's main proposal, since the katana is drawn today only in the duel [K]. G covers verbs the level hands out and takes back, and the placing verb of the party games. H is the budget: verbs per button, the state machine, the input log and the validator. Each profile ends with ratings for **Feel · Readability · Run fit · Cheapness · Evidence** (1 = poor, 5 = excellent; author judgement) and maps its finding onto SpeedRunner's constants [K] in "How it feels" or "Risks", starting "In SpeedRunner".

### Family A: Dash and air verbs

### A1. The horizontal dash: 2.67x run for 150 ms, one charge, refilled only on the ground

*In plain words.* A tap that moves the body at a fixed high speed for a fixed short time with gravity off, then hands the speed back to the run. One charge, returned by the ground.

*How it works (technical).*
- Celeste: `DashSpeed 240` for `DashTime 0.15` s (36 px, 4.5 tiles, 3.3 BL, 9 frames), 2.67x `MaxRun 90`; `EndDashSpeed 160` (0.67 of dash speed), `EndDashUpMult 0.75`; `DashCooldown 0.2`; `DashRefillCooldown 0.1`; `DashCornerCorrection 4` px, `DashHJumpThruNudge 6`, `DashVFloorSnapDist 3`; `DashBegin` freezes 0.05 s, the coroutine yields one frame then sets `Speed = dir * DashSpeed`, keeping `beforeDashSpeed.X` when faster; `RefillDash()` fires on a `Solid`, `NegaBlock` or `JumpThru` outside `Spikes`, on bounces and crystals [V, S7].
- Mega Man X: walk 1.5, dash 3.5 (2.33x), jump 5.0 px per frame, the dash carried "until X touches a surface or air-dashes", a shorter dash hitbox, frame count in RAM and unpublished [V, S131, S16, S17; U]. Hollow Knight: `DASH_SPEED 20` for `DASH_TIME 0.25` (5 u, about 4 body heights), `DASH_COOLDOWN 0.6`, 0.4 with Dashmaster, `DASH_QUEUE_STEPS 10`, Shade Cloak 20 u/s for 0.25 s on a 1.5 s cooldown, no exit bleed back to `RUN_SPEED 8.3` [V, S21, S25]. Godspeed "launches you forward with tremendous force" as a card [V, S64]. Table 6a compares them.
- Celeste bleeds 160 to 90 at `RunReduce 400` in 0.175 s, 4.4 run speeds per second; SpeedRunner's `overspeedDecay 500` is 1.2, so a Celeste-ratio exit of 747 u/s would carry 0.65 s [V, S7; K; I].

*Cost / performance.* One state, two timers, one integer. The Sandbox measures its whole verb layer at 0.007 ms per frame [V, S3].

*Games that used it.*
- Celeste (`DashSpeed`, `DashTime`, `DashRefillCooldown`): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- Mega Man X (3.5 px per frame, carried through the jump): https://tasvideos.org/GameResources/SNES/MegaManX/Data
- Hollow Knight (`DASH_SPEED 20`, `DASH_TIME 0.25`, `DASH_COOLDOWN 0.6`): https://github.com/nickc01/WeaverCore/blob/0b713e0e0791b42649d8cfe9c8191c737ec7a7aa/WeaverCore.Editor/Assets/Prefabs/Demo%20Player.prefab
- Neon White (Godspeed card): https://www.thegamer.com/neon-white-soul-cards-tips-tricks-guide/

*How it feels.* In SpeedRunner the Sandbox dash is 1120 u/s (2.67x) for 18 active steps, 168 u = 3.65 BL, gravity off, 1 startup step (so 19 steps from press to end on a replay), 24-step cooldown, one charge refilled on a solid or one-way top and never within 12 steps of the start, exit clamped to 546 u/s so it shares the roll-jump hyper's economy of [S4 A5] and decays to 420 in about 0.25 s; the §7 knobs hold the ranges [K; I]. The read copies Celeste, a kimono tint while spent, a 2-step flash on refill, two afterimages, no world hitstop (F5) [V, S7; I]. It is a comparison toggle; the dash-slash (F1) does its job inside the katana button [I].

*Risks.* In SpeedRunner a dash is a map rewrite: a full jump at maxRun (332 ms up, 259 down) clears about 248 u = 5.4 BL analytic, 246 to 248 u stepped, one air dash adds 168 u and a 546 u/s exit and the same jump clears about 545 u = 11.8 BL, so m1's momentum gap and three narrow platforms, m2's pillar run, sky run and "small hops only" cave collapse [K; I]. A ground-only dash saves about 0.25 s per use, 1.5 s on a 16 s map; the [S4 E4] tiers become safe at most 4 BL, jump 5 to 6, dash 7 to 11, mover or wall above 12; any dash needs the mask (G1) [I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 4 · Run fit 3 · Cheapness 4 · Evidence 5

### A2. Dash directions: two, four or eight, and the author's regret

*In plain words.* Every direction a dash can go is a route the map must survive. Side-view time attacks keep two.

*How it works (technical).*
- Celeste reads `lastAim = Input.GetAimVector(Facing)` and dashes 8 ways; a diagonal-down dash on the ground becomes horizontal with `Speed.X *= DodgeSlideSpeedMult 1.2` and `Ducking = true`, and landing from one also multiplies by 1.2 (the ultra) [V, S7]. v1.4.0.0 (29 Mar 2021) added "Advanced: Directionals" and a Crouch Dash bind with Press and Hold modes [V, S14].
- Thorson at ACMI, 6 Oct 2025: she wished the dash had four directions and a Celeste 2 would "kinda" do that; "corner boosting emerged from systems we didn't plan". The event is confirmed by ACMI's listing; the remark rests on one recap [V, S33, S34; U].
- Mega Man X, Hollow Knight (until Dashmaster adds a down dash) and Godspeed are forward-only; Dustforce's downdash is a free verb [V, S16, S49, S64, S43]. The payoff of diagonals is the wavedash, which exists to bypass the ground refill, and the 0.1 s `DashRefillCooldown` is why a wavedash near the ground refills late [V, S40, S7].

*Cost / performance.* Reading a direction at press is free. Each extra direction costs a map review.

*Games that used it.*
- Celeste 1.4 changelog (Crouch Dash, Directionals): https://maddymakesgamesinc.itch.io/celeste/devlog/237097/v1400-changelog
- Celeste at ACMI, 6 Oct 2025 (recap): https://explosionnetwork.com/?p=119685
- Mega Man X (forward-only): https://tasvideos.org/GameResources/SNES/MegaManX
- speedrun.com, wave dash thread: https://www.speedrun.com/posts/41mls

*How it feels.* In SpeedRunner the vertical axis is spoken for: the jump owns up (3.0 BL), the roll owns down (the 230 u trigger), the climb jump owns the sideways climb (190 u/s out) [K]. An up-dash of 168 u plus the 0.75 exit lifts a jump to about 6.5 BL, so m2's 600 u (13 BL) chimney loses two wall jumps and m3's 550 to 800 u needle-capped climbs lose their spike timing [K; I]. The Sandbox dash is two-way with a four-way toggle and no diagonals [I].

*Risks.* A late bind is a category split. Celeste's crouch dash shipped as a chord, runners bound it with Joy2Key, and the official bind came three years later [V, S14, S41]. Decide chord verbs before the first season (H2).

*Ratings 1–5 (author judgement):* Feel 4 · Readability 5 · Run fit 4 · Cheapness 5 · Evidence 4

### A3. Air dash and the air charge: one resource, two verbs

*In plain words.* In the air you get one action, a jump or a dash, and the ground gives it back. So does a kill.

*How it works (technical).*
- Dustforce: the air charge "lets you jump or dash while airborne. Landing or killing an enemy restores it, and downdashes and wall jumps don't spend it"; a dashjump is a dash and a jump "in the same frame while airborne"; "smashing an object restores your double jump even if you double jumped into it"; aerial moves reset "only when they touch ground" [V, S43, S197, S45].
- Mega Man X2 and X3: "you can only air-dash if you don't dash jump, and only air-dash once during the jump" [V, S16]. Hollow Knight: one air dash per airtime, refilled on landing or a wall, 0.6 s cooldown [V, S21, S50]. Celeste's `Dashes` integer is the same rule with one verb, `MaxDashes` 1 (2 in chapter 9 and Assist) [V, S7].

*Cost / performance.* One integer and the refill predicate, reused by F1.

*Games that used it.*
- Dustforce (air charge): https://axebps-redlib.hf.space/r/dustforce/wiki/terms
- Mega Man X2 and X3 (one air dash per jump): https://tasvideos.org/GameResources/SNES/MegaManX
- Hollow Knight (dash refilled on walls): https://hollowknight.wiki/w/Mothwing_Cloak

*How it feels.* In SpeedRunner the air charge is the cleanest "one resource, two verbs" rule and what makes an enemy a refuel station, as [S4 D3] asked; the recommended set spends it on the dash-slash (F1), one per airtime, refunded by a kill or a pogo (F2), and the "Air dash only" toggle spends it on A1's dash in the air [I]. No wall refill: Hollow Knight's turns chimneys into skips, and chimneys are the m2 and m3 content [V, S50; K; I].

*Risks.* Dustforce reviewers reported inputs that "weren't going off when I wanted them to" in fast sections [V, S195]. A shared charge needs a visible counter and a 130 ms buffer on both verbs, decremented inside `step()` so the replay sees the same buffer [I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 4 · Run fit 4 · Cheapness 5 · Evidence 4

### A4. Double jump and its refill rules

*In plain words.* A second jump in the air, usually weaker, returned by the ground or a wall. The refill rule decides whether it is a verb or a glitch.

*How it works (technical).*
- Hollow Knight's Monarch Wings hold `JUMP_SPEED x 1.1` for `DOUBLE_JUMP_STEPS 9` against `JUMP_STEPS 9` at 16.65 u/s, `DOUBLE_JUMP_QUEUE_STEPS 10`, refilled on landing or a wall [V, S21, S25, S51]. Ori's double and triple jumps are not restored by a jump on the first frame after landing (the "firsty"); every third jump is a flip with no height change [V, S53]. Neon White's Elevate is "a double jump if you're already airborne", 9 rounds [V, S64]. Super Mario 64's double jump launches at 52 + 0.25 x forwardVel against 42 [V, S9].
- Celeste never has a double jump, which is why its dash reads [I]. N++ is "three buttons controlling left and right movement, and the jump" [V, S172]. Jetpack Joyride's Air Barrys jump "about three times his height", floor only [V, S114].

*Cost / performance.* One integer, one velocity, the jump code.

*Games that used it.*
- Hollow Knight (`DOUBLE_JUMP_STEPS 9`, wall refill): https://hollowknight.wiki/w/Monarch_Wings
- Ori (the "firsty" refill hole): https://kb.speeddemosarchive.com/Ori/Techniques_and_Glitches
- Neon White (Elevate card): https://www.thegamer.com/neon-white-soul-cards-tips-tricks-guide/

*How it feels.* In SpeedRunner the Sandbox double jump leaves at 0.85 x jumpVel = 705 u/s, apex 99 u = 2.2 BL, refilled on the ground only, with the apex band and the 0.45 cut [K; I]. It is a comparison toggle: at a 3.0 BL base it turns every 5 BL gap into a stroll and voids more of the four maps than the dash, and the wall kit already gives the vertical second jump at 440/790 and 190 up [K; I].

*Risks.* Ori's one-frame refill hole is a determinism trap and a category magnet; the refill must be one predicate evaluated once per step [V, S53; I]. If the game ever hands a double jump, hand it as a card (G2) [I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 5 · Run fit 2 · Cheapness 5 · Evidence 4

### A5. The dash-jump lineage: super, hyper, wavedash, ultra, and the roll-jump hyper they share an economy with

*In plain words.* Speed earned on the ground, spent in the air. A jump pressed inside a dash keeps the dash's speed, and a crouch makes the arc low.

*How it works (technical).*
- Celeste: a jump during a grounded dash with `DashDir.Y == 0` and `jumpGraceTimer > 0` is `SuperJump()`, `Speed.X = 260` (`SuperJumpH`, 2.9x run); while `Ducking` the hyper, `Speed.X *= 1.25` (325, 3.6x), `Speed.Y *= 0.5`; a straight-up dash near a wall gives `SuperWallJump` 170 x -160 (1.9x run, 1.5x jump); the 0.1 s grace lets a super fire 100 ms after leaving a ledge; the ultra is x1.2 on landing, the extended hyper waits for the refill [V, S7, S40; I].
- Mega Man X's dash-jump carries 3.5 px per frame through a 5.0 launch, about 50 px = 3.1 tiles high and 4.5 BL long [V, S131, S16; I]. Pizza Tower's Mach ladder: 6 to 8, 8 to 12, 12 to 16 at a quarter acceleration, 16 to 20 only holding dash and forward, "It takes 20 frames to reach Mach 2 from a standstill", and a super jump cancels into a shoulder bash that "instantly" restores Mach 2 [V, S58, S196]. Sonic Mania's drop dash: hold jump 20 frames, land at 8 to 12 px per frame, 1.33x to 2x the 6 px top speed [V, S56, S57; I].

*Cost / performance.* A predicate in the dash state's update.

*Games that used it.*
- Celeste (super, hyper, super wall jump): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- Mega Man X (dash-jump carry): https://tasvideos.org/GameResources/SNES/MegaManX/Data
- Pizza Tower (Mach ladder): https://pizzatowerspeedrunning.wiki.gg/wiki/Speed_(Simplified)
- Sonic Mania (drop dash 8 to 12 px per frame): https://info.sonicretro.org/Drop_Dash

*How it feels.* In SpeedRunner every low-body jump uses the roll-jump hyper's 546 x 622 u/s pair from [S4 A5]: the slide-jump (B2), the Sandbox dash-jump and the dash-slash's exit (F1) cap at 1.3x maxRun, a roll-dash jump could reach 1.56x (655 u/s), 1.6x is the hard cap; canon gains are 20 to 60%, never 200% [K; I]. The drop dash already exists without an input (a 230 u fall keeps 280 u/s); a held-jump version at 1.3x maxRun is one line and was not adopted because the stomp (B5) owns Down in the air [K; I].

*Risks.* Pizza Tower's "coyote time doesn't work properly at Mach 2 speed" is the warning for any overspeed state: grace windows written in steps assume maxRun, and at 546 u/s a 12-step coyote is 55 u of air instead of 42 [V, S58; K; I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 3 · Run fit 5 · Cheapness 5 · Evidence 5

### A6. Glide, float and the cape: why no time attack makes slow falling the default

*In plain words.* Hold a button and fall slowly, or fly for a fixed time. It removes the fall from the clock and turns every gap into a question of height.

*How it works (technical).*
- SMW's cape: a sprint jump sets a takeoff meter to 80 (1.33 s of climb), flight cycles 51 to 47 subpixels per frame, 6% above the 48 sprint, catching air takes 11 frames (3 with press-release-press), the dive bomb is the slam at the end of a dive [V, S15, S72]. In Maker the Cape Feather is attack, ascend, open cape, fly, dive, dive bomb, descend slowly; the Super Acorn glides on B and clings; the Propeller Mushroom flies on a shoulder button [V, S69].
- Celeste's feather: `StarFlyTime 2` s, start 250 px/s, target 140, max 190, slow 91, 320 degrees per second, exit caps 140 and -100 [V, S7]. Rayman Legends glides by default with an air-kick cancel [V, S55; U]; Ori's feather is releasable at will [V, S53]; LBP3's Hero Cape glides and swoops [V, S95]. Doodle Jump's timed flights: propeller 1,200 to 1,500 points, jetpack 2,800 to 3,000, rocket 6,000 to 7,000, a 1 : 2 : 4.5 ladder with invulnerability [V, S117; I].

*Cost / performance.* One gravity multiplier while held. The cape's climb is a second state.

*Games that used it.*
- Super Mario World (cape, 80-frame takeoff): https://tasvideos.org/GameResources/SNES/SuperMarioWorld
- Celeste (feather, `StarFlyTime 2`): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- Rayman Legends (hover, air kick stall): https://www.speedrun.com/rayman_legends/guide/qcfu4
- Doodle Jump (propeller, jetpack, rocket): https://www.gamerevolution.com/guides/56951-doodle-jump-how-much-points-you-get-with-special-items

*How it feels.* In SpeedRunner the Sandbox glide is hold Jump after the apex to fall at 0.25 x maxFall = 288 u/s with full air control, a comparison toggle and a candidate pickup (G1) [K; I]. A 1.3 s flight at maxRun is 550 u = 12 BL on maps 4,580 to 8,700 u wide, so any handed glide is capped to the cape's class with no climb [V, S15; K; I].

*Risks.* Hollow Knight, Ori, Dustforce and Neon White each give one extra air action per airtime, and no time attack in the set makes slow falling the default, because the fall is where the clock is decided [V, S21, S53, S43, S64; I]. A glide breaks the body-length table of [S4 E4] the other way, making gaps longer, not routes faster.

*Ratings 1–5 (author judgement):* Feel 3 · Readability 5 · Run fit 2 · Cheapness 5 · Evidence 4

### Family B: Ground and body verbs

### B1. Crouch and crawl: a hitbox swap to 57% and a refusal to stand

*In plain words.* Hold Down: the body gets shorter and slower, and stands up only when nothing is overhead.

*How it works (technical).*
- Celeste: `normalHitbox (8, 11)` to `duckHitbox (8, 6)`, hurtbox (8, 9) to (8, 4); `CanUnDuck` runs `CollideCheck<Solid>()` with the tall collider, so jump-throughs never pin; `DuckFriction 500` px/s²; `DuckCorrectCheck 4` and `DuckCorrectSlide 50` nudge a ducking dash up to 4 px sideways at 50 px/s; every launch sets `Ducking = false` [V, S7].
- SM64: `hitboxHeight = 100` of 160 (62.5%) for `ACT_FLAG_SHORT_HITBOX` actions; `act_crouching` ends on Z release [V, S9, S12]. Pizza Tower crouches at "4 speed" against a Mach run of 12 or more, release cancels at once [V, S59]. Super Meat Boy Forever's duck is also the fast fall [V, S180]. Maker's Goomba Mask hides on a crouch; Cat Mario "runs at crouching height" [V, S69, S73]. Table 6b compares.

*Cost / performance.* One hitbox swap, one speed cap, one pose. The cheapest new verb in the study.

*Games that used it.*
- Celeste (`duckHitbox`, `CanUnDuck`): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- Super Mario 64 (`ACT_FLAG_SHORT_HITBOX`, 100 of 160): https://github.com/n64decomp/sm64/blob/master/src/game/mario.c
- Pizza Tower (crouch at 4 speed): https://pizzatowerspeedrunning.wiki.gg/wiki/Slide

*How it feels.* In SpeedRunner the crouch is 20x26 u (57%, between Celeste's 55% and SM64's 62.5%), feet fixed, head down 20 u, crawl 120 u/s (0.29 x maxRun) [K; I]. Release stands only if the 46 u box is free; otherwise keep crawling, try the 8 u sideways correction of [S4 A2], and buffer a pinned jump 130 ms [K; I]. The Verbs gym's 32 u corridor, at least 2 BL long after a checkpoint, is cleared by a slide (B2) and not by a crawl [I].

*Risks.* No time attack in the set crawls on its main line; the crouch pays through the slide and the low ceilings, and m2's "small hops only" cave is the only low ceiling today [K; I]. Its rules against one-way tiles and the wall probe are C4.

*Ratings 1–5 (author judgement):* Feel 3 · Readability 5 · Run fit 4 · Cheapness 5 · Evidence 5

### B2. Crouch-slide and slide-jump: the long low jump as the hyper's twin

*In plain words.* Down at speed keeps the speed in a short body; a jump out of the slide is long and low.

*How it works (technical).*
- Pizza Tower: Down "running at any speed" slides, keeping the held speed, "not accelerating"; the Grab Slide sets 12 and "lasts for a minimum of 25 frames" (417 ms) inactionable, diving off a ledge inside it [V, S59, S60]. SM64's `act_crouch_slide` gives `ACT_LONG_JUMP` to A with `forwardVel > 10` in the first 30 frames (1.0 s at 30 Hz) [V, S11]. Celeste's slide is the duck at 500 px/s², 90 to 0 in 0.18 s and 8.1 px; its tech is dashing while ducked [V, S7].
- SpeedRunners players report the slide-jump keeps more momentum and the Golden Hook is dodged by sliding [U, S87; V, S90]; Mirror's Edge slides and coils [V, S178]; Cat Mario adds a crouch slide to the 3D World style [V, S69].

*Cost / performance.* B1's hitbox, one friction constant, one timer; the roll's pose [K; I].

*Games that used it.*
- Pizza Tower (slide keeps speed, grab slide 25 frames): https://pizzatowerspeedrunning.wiki.gg/wiki/Slide
- Super Mario 64 (long jump from the crouch slide, 30 frames): https://github.com/n64decomp/sm64/blob/master/src/game/mario_actions_moving.c
- SpeedRunners (slide and slide-jump): https://en.wikipedia.org/wiki/SpeedRunners
- Mirror's Edge (slide, coil): https://kb.speeddemosarchive.com/Mirror%27s_Edge

*How it feels.* In SpeedRunner Down at 280 u/s or more (`rollMinSpeed`) starts a slide in the 20x26 u box at 600 u/s² friction, a fifth of `groundFric 3000`, so a maxRun slide travels 147 u = 3.2 BL in 0.7 s; the minimum is 14 steps (117 ms, "120 ms" elsewhere), not Pizza Tower's 417, and releasing Down stands if free [K; V, S59; I]. Jump during the slide is the slide-jump at 546 x 622 u/s, the roll-jump hyper's pair from [S4 A5], one "low body plus jump" rule for the course; it covers about 241 u = 5.2 BL of flat gap (0.249 s up, 0.193 s down) against the plain jump's 248 u, so it is faster across a gap, not longer; a slide into a wall is a 100 ms stand-up stop, never a wall stick [I].

*Risks.* The slide is a third overspeed source only through its jump, and E4's gaps were sized for 420 u/s, so the 1.3x cap is load-bearing [K; I]. Pizza Tower's wiki calls its 25-frame inactionable slide a bonk hazard, hence the 120 ms minimum [V, S59].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 4 · Run fit 5 · Cheapness 5 · Evidence 4

### B3. Long jump, backflip and side flip: Super Mario 64's one constant each

*In plain words.* Three crouch jumps, each a pair of numbers. One goes far and low, two go high and backwards or sideways.

*How it works (technical).*
- `set_mario_action_airborne`: `ACT_JUMP` 42 + 0.25 x forwardVel; `ACT_DOUBLE_JUMP` 52 + 0.25 x; `ACT_TRIPLE_JUMP` 69; `ACT_BACKFLIP` forwardVel -16, vy 62; `ACT_SIDE_FLIP` vy 62, forwardVel 8; `ACT_WALL_KICK_AIR` 62; `ACT_LONG_JUMP` vy 30, `forwardVel *= 1.5` capped at 48, a cap that "misses backwards longs allowing high negative speeds" (the BLJ); gravity 4 u per frame², terminal -75, run cap 32 [V, S9, S13, S11]. By v0²/2g: jump 220 u = 1.4 BL standing and 312 u = 2.0 BL running, flips 480 u = 3.0 BL, triple 595 u = 3.7 BL, long jump 112 u = 0.7 BL at 1.5x run [I]. `act_long_jump_land` eats A unless Z is held [V, S11]; Odyssey's roll holds 20 to 35 u per frame with a boost every 16 to 17 frames and stands up in 10 [V, S29]. Table 6b lists them.

*Cost / performance.* Constants. The animation per jump is the real cost.

*Games that used it.*
- Super Mario 64 (`ACT_LONG_JUMP`, `ACT_BACKFLIP`, `ACT_SIDE_FLIP`): https://github.com/n64decomp/sm64/blob/master/src/game/mario.c
- Super Mario 64 (long jump landing, Z-hold chain): https://github.com/n64decomp/sm64/blob/master/src/game/mario_actions_moving.c
- Super Mario Odyssey (roll boosts every 16 to 17 frames): https://smo.wiki/Roll

*How it feels.* In SpeedRunner the long jump is B2's slide-jump; SM64's x1.5 at 0.7 BL and Celeste's x1.25 at half height bracket its 1.3x at 0.75 jumpVel [V, S9, S7; I]. The backflip costs forward speed (-16) and the side flip needs a turn, so both serve a course that goes up, and the climb jump (`wallClimbX 190`, "more up, less out") owns that slot; Odyssey's rhythm roll, a boost every 270 ms, is the one-button mash [S4 A3]'s decay model avoids [K; I].

*Risks.* Three jumps on one button read only because SM64 gives each its own animation, and the rig has two poses and a 38 ms blend [K]. A new jump needs a pose before a constant.

*Ratings 1–5 (author judgement):* Feel 4 · Readability 3 · Run fit 3 · Cheapness 5 · Evidence 5

### B4. Dive and belly flop: a burst into a prone body with a landing bill

*In plain words.* A forward lunge that trades the upright body for a prone one and pays on landing. Fall Guys made it famous because the landing is a ragdoll.

*How it works (technical).*
- SM64's `ACT_DIVE` adds 15 to forwardVel capped at 48 (x1.47 from a run) and lands in `act_dive_slide` with A for a rollout [V, S9, S10, S11]. Pizza Tower's Down in the air is a Bodyslam or a Dive by jump state [V, S59].
- Fall Guys: the dive needs a jump first and goes "only in the direction they're facing"; a second jump press dives on consoles and PC and can be turned off; PC keys Space, Ctrl dive, Shift grab; it lands prone [V, S135, S137, S150]. A developer calls it "essentially a dodge roll" [V, S133; U]. Walsh: "about 80 percent skill and a 20 percent sprinkling of chaos"; "As soon as you lose the ragdoll-ness of the character, you lose the comedy" [V, S133]. Season 3 added dive sliding on slime and ice [V, S139]; no dive distance or recovery is published [U]. Super Meat Boy Forever's second button is "a jump attack, a dive, and a slide" [V, S180; U].

*Cost / performance.* A velocity set, B1's box, a prone timer, a pose.

*Games that used it.*
- Super Mario 64 (`ACT_DIVE` +15 capped 48): https://github.com/n64decomp/sm64/blob/master/src/game/mario.c
- Fall Guys (dive after a jump, facing only): https://www.gamesradar.com/how-to-dive-in-fall-guys-ps4-pc
- Pizza Tower (Bodyslam or Dive by state): https://pizzatowerspeedrunning.wiki.gg/wiki/Slide

*How it feels.* In SpeedRunner the Sandbox dive is a second Jump press in the air, 120 ms startup, vx 600 u/s (1.43x maxRun, SM64's ratio), vy clamped to 0, the 20x26 u box with a prone pose, 250 ms prone unless the fall was 230 u or more, in which case it lands into the roll and keeps speed; that trade is the routing content [K; V, S9; I]. It is a comparison toggle, because the second Jump press belongs to the buffer and the stomp owns Down [I].

*Risks.* The ragdoll does not transfer: SpeedRunner is deterministic and the ghost compares steps, the opposite of Walsh's 20 percent [V, S133; K; I]. A third overspeed source needs E4's gaps re-sized.

*Ratings 1–5 (author judgement):* Feel 4 · Readability 5 · Run fit 3 · Cheapness 4 · Evidence 3

### B5. Ground pound, stomp and fast fall: Down in the air splits into two jobs

*In plain words.* Down in the air either lands you sooner (a fast fall, routing) or hits what is below (a pound, destruction and the bounce).

*How it works (technical).*
- SM64's `act_ground_pound` lifts Mario 20, 18, ..., 2 u over 10 frames (110 u), holds `vel[1] = -50` and `forwardVel = 0`, falls at -50 u per frame (two thirds of 75 terminal) into `act_ground_pound_land` [V, S10, S12, S13]. Odyssey's pound roll starts at 30 u per frame against 20, "only 1 or 2 frames faster" [V, S29].
- Maker has the pound only in NSMBU and 3D World; Neon White's Stomp "violently slam into the ground below you"; Dustforce's downdash is free [V, S69, S64, S43]. Shovel Knight bounces "~4.5 tiles" on a ~4.5 tile jump, "Everything in Shovel Knight was built on a grid!" [V, S163]. Hollow Knight's `BOUNCE_VELOCITY 12` is 72% of its 16.65 jump for `BOUNCE_TIME 0.25` [V, S21]. Tiny Wings holds "to make the bird drop", Solipskier's slope as a button [V, S128, S127]; Sonic Mania's drop dash is the same idea on landing, 20 frames of hold for 8 to 12 px per frame [V, S57]; Downwell's gunboots slow the fall and recharge on landing [S4 D3; U].

*Cost / performance.* A fast fall is one velocity clamp. A pound is a state, a landing lag and breakable tiles the build lacks [K].

*Games that used it.*
- Super Mario 64 (`act_ground_pound`, hover then -50): https://github.com/n64decomp/sm64/blob/master/src/game/mario_actions_airborne.c
- Shovel Knight (bounce = jump height): https://yachtclubgames.com/blog/plague-knight-mobility-design
- Hollow Knight (`BOUNCE_VELOCITY 12`): https://github.com/nickc01/WeaverCore/blob/0b713e0e0791b42649d8cfe9c8191c737ec7a7aa/WeaverCore.Editor/Assets/Prefabs/Demo%20Player.prefab
- Tiny Wings (hold to drop): https://en.wikipedia.org/wiki/Tiny_Wings

*How it feels.* In SpeedRunner the recommended verb is the stomp: Down in the air sets vy to at least 700 u/s, keeps vx and the 1.65 multiplier, lands a 3 BL jump about 150 ms sooner and feeds the 230 u roll trigger, so stomp into roll into roll-jump hyper is a deliberate chain [K; I]. SM64's 10-frame hover aims in 3D and is zero here [V, S10; I]. The pound is a comparison toggle that replaces the stomp: no hang, fall at maxFall 1150 u/s with vx 0, a 150 ms landing recovery, breaks the gym's crate [I]. The stomp never fires during a pogo bounce arc (a `bounced` flag set by the bounce and cleared on landing), or a held Down would cancel every bounce into a 700 u/s fall [I].

*Risks.* Three verbs want Down in the air: the pogo (F2) takes Down + Katana, the stomp takes Down alone, the pound is exclusive with the stomp [I]. A pound on a one-way top must still land, so the 3 u rule applies [K].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 4 · Run fit 5 · Cheapness 5 · Evidence 4

### B6. Spin jump: a second jump button with a safer body

*In plain words.* A jump that is a little lower, kills most things it lands on, and bounces off the spiked ones.

*How it works (technical).*
- SMW's `CODE_00D630` indexes `DATA_00D2BD` by horizontal speed bucket in (normal, spin) pairs: standing -80 against -74, P-speed -95 against -87 in 1/16 px per frame, so a spin launches 6 to 8 units slower and peaks about 14 to 16% lower, and a P-speed spin (-87) out-launches a standing normal jump (-80), which is what "slightly higher than a normal jump standing still" means; a spin cannot start while carrying [V, S30, S194; I].
- The spin jump "offers less height than a standard jump", can "instantly defeat most stompable enemies", bounces on Spinies and Lava Bubbles and breaks Rotating Blocks; NSMBW's "no longer protects"; Maker's SMW style keeps the bounce except Grinders [V, S70, S69]. Syobon Action never adds a second jump [V, S140].

*Cost / performance.* A second jump velocity and a spinning hitbox. The second button is the real price.

*Games that used it.*
- Super Mario World (`DATA_00D2BD` jump table): https://github.com/IsoFrieze/SMWDisX/blob/master/bank_00.asm
- Super Mario Wiki, Spin Jump: https://www.mariowiki.com/Spin_Jump
- Super Mario Maker (spin jump per style): https://www.mariowiki.com/Super_Mario_Maker_2

*How it feels.* In SpeedRunner the slash is already the safe-contact verb at 100 ms and 50x40 u [S4 D4], and the pogo (F2) is the spin jump's bounce rebuilt on the katana with spikes as targets, so the spin jump has no toggle [I].

*Risks.* Two jump buttons double the chord table (H2) for a 14% height difference the player has to feel to use [I].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 4 · Run fit 2 · Cheapness 3 · Evidence 4

### Family C: Wall and ledge verbs

### C1. Ledge grab and mantle: Spelunky's hang against Celeste's climb hop

*In plain words.* A grab that stops you on the lip and lets you climb, or an automatic hop over the top that costs nothing. A time attack wants the second.

*How it works (technical).*
- Celeste: `ClimbHopY -120`, `ClimbHopX 100`, `ClimbHopForceTime 0.2`, `ClimbHopNoWindTime 0.3`, a wall top reached while climbing launching at 120 px/s (jump is 105) and 100 px/s in; `ClimbCheckDist 2`; `ClimbGrabYMult 0.2` [V, S7]. Hollow Knight: `LEDGE_BUFFER_STEPS 2` [V, S25].
- Spelunky's grab cancels fall damage from any height; Spelunky 2's tiers are 1 HP at 8 to 15 tiles, 2 at 16 to 23, death at 32 or more [U, S111]. Fall Guys' 2022 update turned auto ledge grab on for new players, off for veterans [V, S155]. Pizza Tower: an air grab into a wall starts a wall run, a ground grab bonks about 19 frames [V, S60]. Mirror's Edge's kick places "a small invisible platform", solid 3 frames in the glitch [V, S177, S178].

*Cost / performance.* About 30 lines in the collision pass. No new input.

*Games that used it.*
- Celeste (`ClimbHopY`, `ClimbHopX`): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- Spelunky 2 (ledge grab, fall damage tiers): https://spelunky.fandom.com/wiki/Spelunky_2:Rope
- Fall Guys (auto ledge grab setting): https://www.nintendolife.com/news/2022/07/fall-guys-gets-an-update-here-are-the-full-patch-notes
- Mirror's Edge (wallrun kick platform): https://mirrorsedge.fandom.com/wiki/Speedrunning

*How it feels.* In SpeedRunner the mantle is automatic: when the 2 u probe reports a wall whose top sits between the head and 16 u above it (a third of a body) and the hero holds toward it or is rising under 200 u/s, snap the feet to the top and give vy -300 and vx 200 toward the ledge for 100 ms with a hand-plant pose; in practice the hold-toward clause fires, since a jump rises under 200 u/s only near its apex [K; I]. It is [S4 A2]'s corner correction extended from 8 u to a third of a body, and it kills the lip death at 420 u/s A2 named; the Sandbox toggle sits beside corner correction [I].

*Risks.* A hang is a stop, and a stop on a clock is a death by another name. Mantling onto a one-way top uses the 3 u landing rule [K; I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 5 · Run fit 5 · Cheapness 5 · Evidence 4

### C2. Wall run and ceiling run: fixed-distance rides

*In plain words.* Run along a wall or a ceiling for a set distance, converting speed into position. The length limit is the design.

*How it works (technical).*
- Dustforce: Up on a wall or ceiling runs "for a fixed distance, usually a few character lengths"; "you cannot jump while doing a ceiling run"; a corner boost makes it "longer and faster"; ceiling slides start above dash speed and bleed; ground boosts are about 50% over dash speed and need a dash about 4.5 times a second [V, S43, S24]. Pizza Tower's wall run reaches "up to 19.50 speed" from an air grab [V, S58, S60].
- Mirror's Edge: "a very brief wallrun, jumping off while facing almost directly into the wall" gives the wall boost, so the shortest run is the fastest [V, S177, S178]. Ghostrunner's and Rayman's wall runs are scripted; nothing numeric found [U].

*Cost / performance.* A state with a distance counter and a pose; the slide reversed.

*Games that used it.*
- Dustforce (wall and ceiling run, corner boost): https://axebps-redlib.hf.space/r/dustforce/wiki/terms
- Mirror's Edge (wall boost): https://kb.speeddemosarchive.com/Mirror%27s_Edge
- Pizza Tower (wall run from an air grab): https://pizzatowerspeedrunning.wiki.gg/wiki/Grab

*How it feels.* In SpeedRunner the Sandbox wall run is hold toward the wall at 300 u/s or more to run up 92 u (2 BL) over 250 ms, then slide at 115 u/s [K; I]. It is off in the recommended set because it rewrites [S4 A4]'s same-wall penalty and the m2 600 u chimney; a ceiling run needs unspiked ceilings, and the only ceilings today are m2's cave and m3's spiked climbs [K; I].

*Risks.* Dustforce's mastery loop, a dash 4.5 times a second, is a mash on a clock [V, S24; I]. Free height devalues the wall jump's 790 u/s.

*Ratings 1–5 (author judgement):* Feel 4 · Readability 4 · Run fit 2 · Cheapness 4 · Evidence 3

### C3. Climb with stamina: Celeste's 110-point budget

*In plain words.* Hold grab on a wall and climb at half run speed from a budget the ground refills. The budget is why wall jumps stay the fast line.

*How it works (technical).*
- `ClimbMaxStamina 110`; `ClimbUpCost 100 / 2.2` = 45.45 per second; `ClimbStillCost 100 / 10`; `ClimbJumpCost 110 / 4` = 27.5; `ClimbTiredThreshold 20`; `ClimbNoMoveTime 0.1`; `ClimbUpSpeed -45` px/s (4.1 BL/s, half run), `ClimbDownSpeed 80`, `ClimbSlipSpeed 30` when tired, `ClimbAccel 900`; costs apply only in the air; `ClimbJumpBoostTime 0.2` with no direction held; `Stamina = ClimbMaxStamina` on the ground and on a dash refill; the last 20 flash red; `ClimbUpdate` exits on jump (`WallJump(-facing)` or `ClimbJump()`), dash or grab release [V, S7]. Full to empty: 2.42 s of climbing (109 px = 9.9 BL = 13.6 tiles), 11 s hanging, or 4 climb jumps [I]. Maker's Super Bell climbs "briefly"; the Super Acorn clings [V, S73, S69].

*Cost / performance.* A state, a float, a bar. The grab button is the price.

*Games that used it.*
- Celeste (`ClimbMaxStamina`, `ClimbUpCost`, `ClimbJumpCost`): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- Super Mario Maker 2 (Cat Mario's brief climb): https://www.mariowiki.com/Cat_Mario

*How it feels.* In SpeedRunner the Sandbox climb copies Celeste's ratios against maxRun: climb at 210 u/s on Celeste's 110 points draining 45.45 per second (2.42 s of climbing), 10 per second still, 27.5 per climb jump, tired below 20 points, refill on the ground only, a stamina bar [K; I]. It is the "Celeste kit" verb and off in the recommended set; SpeedRunner's chimneys are solved by wall jumps at 440/790 in under a second each, and a slow verb makes a wall a puzzle, not a race [K; S4 A4; I].

*Risks.* Hold toward the wall plus jump already means "climb jump", so the only new input is "hold toward the wall without jumping", which today starts the 115 u/s slide; rebinding that is a controls change for every player [K; I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 4 · Run fit 2 · Cheapness 3 · Evidence 5

### C4. The crouch against the wall kit and the one-way tiles: the conflict rules

*In plain words.* A short body changes what the wall probe sees and what Down means on a roof tile. Four rules keep the kit honest.

*How it works (technical).*
- Celeste clears `Ducking` on every wall jump, checks the standing collider for climbs, and `CanUnDuck` tests `Solid` only [V, S7]. SpeedRunner's one-way landing checks `vy > 0` and feet within 3 u of the top; the wall probe is 2 u wide over the middle 30 u of the body (y 8 to 38 of 46); movers carry and push out [K].
- Pizza Tower's slide into a wall is a bonk, "airborne for about 19 frames" [V, S60]. Hollow Knight's `WALL_STICKY_STEPS 3` and `WALLSLIDE_SPEED -8` (40% of its 20 terminal) are the stick-then-slide shape at another scale [V, S21].

*Cost / performance.* Four predicates in existing code.

*Games that used it.*
- Celeste (`Ducking` cleared on wall jumps): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- Pizza Tower (slide bonk, 19 frames): https://pizzatowerspeedrunning.wiki.gg/wiki/Grab
- Hollow Knight (`WALL_STICKY_STEPS`, `WALLSLIDE_SPEED`): https://github.com/AminSedaghaty/HK-Source/blob/f516282143970c48bcb25b695489ec0855b3b837/CSharp/HeroController.cs

*How it feels.* In SpeedRunner: one, the crouch shrinks from the head down with the feet fixed, so only `canStand` tests the 46 u box, against solids and never one-way tiles [K; V, S7; I]; two, Down on a one-way tile is a crouch, not a drop-through, because m4 is a maze of one-way roof tiles and a drop-through would re-route it and void its medals [K; I]; three, no wall kit while crouched, a crouched body touching a wall gets a 100 ms stand-up stop, not the 25 u/s stick [K; I]; four, standing up under a lip keeps sliding, tries the 8 u sideways correction first and buffers a pinned jump 130 ms [S4 A2; K; I].

*Risks.* The ghost needs no new field, since pose angles and hip height are recorded, but replays need Down and Up in the recorded key set, which today holds only move and jump (H4) [K; I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 4 · Run fit 5 · Cheapness 5 · Evidence 4

### Family D: Rope, hook and flight verbs

### D1. The swing: a pendulum in three lines and a release cap

*In plain words.* Fire a rope, hang from the point, swing, let go with the speed you have. The physics is one constraint; the design is the release rule.

*How it works (technical).*
- Fristrom (Spider-Man 2, Energy Hook): Euler step, then `testPosition = tetherPoint + (testPosition - tetherPoint).Normalized() * tetherLength` outside the circle, then `velocity = (testPosition - position) / deltaT`; attach by raycast, wrap by raycasting along the rope; gravity "about 10 times Earth normal"; webs to the sky rejected [V, S19, S106, S107].
- Worms' Ninja Rope is "simply a pendulum": left and right pump, up and down retract, a bounce at full extension; Armageddon cannot fire below the horizontal; rope speed 0 to 255 in the scheme [V, S102, S103, S104]. SpeedRunners fires on a fixed up-forward diagonal with no aim, attaches overhead, releases on button up, and exists so laggards catch up under a leader camera [V, S87, S88, S89; U]. Bionic Commando's arm fires up, diagonally up or forward with no jump, "the fact that you couldn't jump, but needed to use the arm" [V, S99, S100].
- Energy: `v² = v0² + 2 g L (1 - cos θ)`; at g = 2500 and L = 276 u (6 BL) a 45° entry at maxRun leaves at 762 u/s (1.8x), a 90° drop-in at 1175 u/s (2 x 2500 x 276 = 1,380,000), above maxFall; period 2π sqrt(L/g) = 2.09 s, a quarter swing about 520 ms, so a swing is a committed beat, not a forgiveness-scale event [K; I].

*Cost / performance.* About 60 lines plus a `rings` array per map; the projection is 3 lines, run before the AABB pass so a collision wins [I].

*Games that used it.*
- Spider-Man 2 and Energy Hook (Fristrom's constraint): https://code.tutsplus.com/swinging-physics-for-player-movement-as-seen-in-spider-man-2-and-energy-hook--gamedev-8782t
- Worms (Ninja Rope as a pendulum): https://www.tus-wa.com/?msg=279397
- SpeedRunners (the hook as a race verb): https://www.gamesradar.com/haste-hatred-and-grappling-hooks-you-should-be-playing-speedrunners
- Bionic Commando Rearmed (no jump, the arm): https://www.gamedeveloper.com/game-platforms/interview-grin-s-viklund-on-rearming-capcom-s-i-bionic-commando-i-

*How it feels.* In SpeedRunner the ring hook is Up + Katana in the air with a ring in reach: 45° fixed, projectile 1700 u/s (Terraria's 59 to 15 ratio, D2), reach 300 u = 6.5 BL (176 ms to attach), rope fixed at the attach distance with a 90 u minimum, gravity 2500 with no fallMult or airDrag while hooked, pump 900 u/s², release on button up capped at 760 u/s, a Jump within 130 ms of release adding vy -500 (Bionic Commando's direction-release hop), re-hook at once but not the ring just left until landing, the press buffered 130 ms and the ring valid 80 ms after the ray leaves it [K; V, S18, S125; I]. The hero hangs on the rope normal with the katana sheathed, the ring glows when valid, whoosh, click and a rising noise [V, S19; I]. Table 6c and the §7 knobs carry the numbers.

*Risks.* A rope that latches to any ceiling makes every chimney and roof tile in m3 and m4 a shortcut, so rings are authored and the "any ceiling" SpeedRunners mode is a comparison only [K; I]. The catch-up argument does not transfer to a solo clock; the release-timing skill does, and Umihara Kawase's elastic line is the expressive extreme the ring hook gives up on purpose (D3) [V, S87, S110; I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 4 · Run fit 3 · Cheapness 4 · Evidence 3

### D2. Hook points against any surface, and pull hooks

*In plain words.* A hook that fires only at marked rings is cheap, deterministic and readable. A hook that pulls you to the point is cheaper still.

*How it works (technical).*
- Ghostrunner fires only at designer-placed sky-blue orbs and zips rather than swings; the sequel adds crane swings and shuriken that make hook points [V, S108, S109; U]. GRIN's Bionic Commando marks unhookable surfaces with glowing cracks instead of invisible walls [V, S99]. Dominion is "a grappling hook", 4 rounds [V, S64].
- Terraria's table (6c): the first Grappling Hook reaches 18.75 tiles (6.25 BL), launches at 59 mph and pulls at 56 against a 15 mph walk (4x, 3.7x), Lunar 34.375 tiles with 4 hooks at 92, Static 37.5 with no pull; latching is gravity-immune and resets fall damage, extra jumps and wing time; jumping releases [V, S18]. LBP2's hook "sticks almost instantly" and needs placed grabbable points [V, S92, S94; U].

*Cost / performance.* A lerp to the ring and a gravity-off flag, cheaper than the swing.

*Games that used it.*
- Ghostrunner (hook orbs): https://gamesradar.com/ghostrunner-has-some-amazing-traversal-skills-for-exploring-its-cyberpunk-city
- Terraria (hook reach, launch and pull table): https://terraria.wiki.gg/wiki/Hooks
- LittleBigPlanet 2 (grappling hook trailer): https://gematsu.com/2010/09/new-littlebigplanet-2-trailer-shows-off-grappling-hook

*How it feels.* In SpeedRunner the ring is radius 20 u and snaps within 30 u of the ray so the fixed 45° never feels stiff; the zip variant pulls at 1550 u/s (Terraria's 56 to 15), hangs gravity-free and leaves on Jump, the deterministic fallback if the swing tests badly [V, S18; I]. One ring per gym section; SAMURAI TRIAL would be the first map with rings [K; I].

*Risks.* A ring is a signpost: "see an orb, that is the way" removes improvisation, the price of not re-tuning four maps [I].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 5 · Run fit 3 · Cheapness 5 · Evidence 4

### D3. Reel, elastic and placed ropes: the expressive ropes that stay references

*In plain words.* Three ropes that need a third input or a physics the hero cannot show. Study them, build none.

*How it works (technical).*
- Reel: LittleBigPlanet 2's stick reels in and out ("keep the rope short" to avoid an electrified floor); Worms' up and down retracts and a shorter rope swings faster; Fristrom's soft reel approaches a `desiredLength` [V, S92, S104, S19].
- Elastic: Umihara Kawase's line travels 4 px per tick out and 8 back, maximum about 104 px, force `xspeed += sin(angle) * (stretch - len) * 2` capped at 60, reel 2 per step, gravity 18 per frame, jump -256 in fixed point, from a work-in-progress TAS page whose "per second" is likely per frame [V, S105; U]; "one- and two-step rocket jumps" from an "uncompromising physics model" [V, S110].
- Placed: Spelunky 2's rope is a consumable thrown 6 tiles up or down (Classic 8), doubled by a second rope [V, S111; U]. Mario Maker's Clear Pipe is a rail, 3D World only, entered with the stick [V, S76].

*Cost / performance.* Reel adds an axis; elastic adds a spring and a cap; placed adds a resource and a tile.

*Games that used it.*
- LittleBigPlanet 2 (keep the rope short): https://www.supercheats.com/guides/littlebigplanet-2/gripple-grapple
- Umihara Kawase (TAS physics page): https://tasvideos.org/GameResources/SNES/UmiharaKawase/Physics
- Spelunky 2 (6-tile rope): https://spelunky.fandom.com/wiki/Spelunky_2:Rope

*How it feels.* In SpeedRunner none fits two or three buttons: a reel needs Up and Down while hooked and Down is the crouch; the elastic line is the most expressive rope and the hardest to read in 46 u; a placed rope is a readable consumable vertical, which argues for rings [I]. The Sandbox offers none.

*Risks.* A spring rope's skill is loading the spring, and a 10% alpha ghost cannot show tension [V, S110; I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 2 · Run fit 2 · Cheapness 3 · Evidence 2

### D4. Jetpack thrust and the one-button corridor, and vehicles as temporary verb swaps

*In plain words.* Hold to rise, release to fall, run on rails. A pickup can remap the same button to a new physics until you get hit.

*How it works (technical).*
- Jetpack Joyride: one touch, thrust while held, constant forward speed, chosen because it "would appeal to even the most inexperienced players"; a vehicle "lasts until he hits an obstacle" and keeps the one touch (Lil' Stomper, Profit Bird, Teleporter, Gravity Suit, Bad As Hog, Mr. Cuddles, Wave Rider); jetpacks are cosmetic; Gravity Belt about +50% descent, Turbo Boost about 300 m [V, S112, S115, S114; U].
- The Helicopter game (about 2002 to 2004) is hold to rise through a cave, authorship disputed [U, S171]. Flappy clones agree on gravity 750 to 1000 px/s², a flap of 280 to 400 px/s, apex 0.37 to 0.42 s (SpeedRunner's is 0.33), pipe gap 150 px, a pair every 1.4 s at 220 px/s [V, S132; K; I]. Lakitu's Cloud is free flight that despawns and keeps its speed when the rider jumps [V, S75]; LBP3's Toggle swaps big and small on one button with no travel [V, S95, S96].

*Cost / performance.* An acceleration while held and a terminal speed. The corridor is a map section.

*Games that used it.*
- Jetpack Joyride (one touch, vehicles until hit): https://en.wikipedia.org/wiki/Jetpack_Joyride
- Jetpack Joyride, GDC Depth in Simplicity: https://www.gdcvault.com/play/1015527/Depth-in-Simplicity-The-Making
- Flappy Bird clone constants (gravity 1000, flap 400): https://dev.to/shaishav_patel_271fdcd61a/building-flappy-bird-in-react-canvas-raf-physics-gravity-pipe-generation-and-speed-25fd
- LittleBigPlanet 3 (Toggle's size switch): https://primagames.com/featured/littlebigplanet-3-beginners-tips-toggle-swoop-blink-ball

*How it feels.* In SpeedRunner the Sandbox jetpack is a corridor: Jump becomes thrust at 3500 u/s² (1.4 g) against 2500 down, terminal 600 u/s both ways, auto-scroll at maxRun, ceiling and floor spikes, no fuel because the corridor is the limit [K; I]. The verb-swap pattern is the keeper: same button, new physics, lost on contact, read by the body with no HUD; Toggle's size switch is B1's crouch on a hold [V, S112; I].

*Risks.* As a core verb the jetpack removes the jump and the wall kit [K; I]. A flap variant (vy = -830 per tap, no ground) is harsher and reads worse at 420 u/s [I].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 5 · Run fit 2 · Cheapness 4 · Evidence 4

### D5. Charged jump: Jump King's held meter and the squat jump

*In plain words.* Hold to charge, release to jump higher. Time becomes height on purpose, and on a clock that is a cost with no refund.

*How it works (technical).*
- Jump King: `CHARGE_TIME 0.6` s, intensity `min(1, timer / 0.6)`, `velocity.Y = JUMP * intensity` with `JUMP -8.742858` px per frame, `SPEED 3.5` px per frame locked at release from the d-pad, `GRAVITY 0.2571429`, `MAX_FALL 10`, charge quantised to 2 to 36 steps at 60 per second, a charge under 0.3 on snow clamps to 0.3 or no jump; derived max height 148.6 px = 5.7 body heights (18x26 px body), apex 34 frames, 238 px flat, a 2-step tap about 0.5 px [V, S44, S46, S47; I]. No checkpoints; falls cost "a significant portion of their progress" [V, S124].
- SMB2's Power Squat Jump: hold Down until the sprite flashes, then jump higher; Maker's SMB2 Mushroom brings the crouching "charge jump" [U, S80; V, S69]. Pogostuck: hold to compress, release on contact, "360° powerboosts" [V, S126; U]. Hollow Knight's Crystal Heart charges about 1.4 s (`NAIL_CHARGE_TIME_DEFAULT 1.35`) [V, S21; U].

*Cost / performance.* A hold timer and a meter; it breaks the one-shot `jumpPressed` model [K].

*Games that used it.*
- Jump King (`CHARGE_TIME 0.6`, `JUMP -8.74`): https://github.com/qequ/jump-king-parabole/blob/main/src/JumpParabola.cs
- Jump King (Harmony patch on `JumpState`): https://github.com/JumpKingPlus/Workshop/blob/master/WorkshopPlus/JumpKingJumpArch/Models/JumpChargeCalc.cs
- Super Mario Bros. 2 (Power Squat Jump): https://www.mariowiki.com/Power_Squat_Jump
- Pogostuck (charge and tilt): https://store.steampowered.com/app/688130/Pogostuck_Rage_With_Your_Friends/

*How it feels.* In SpeedRunner the Sandbox charged jump is hold Jump while standing still (|vx| under 20 u/s) for 0 to 600 ms and release for 0.6 to 1.5 x jumpVel (1.1 to 6.7 BL), direction locked, no air control, Jump King's linear curve [V, S44; K; I]. It is a height gate for a map author, the one discrete descendant of Getting Over It's hammer a keyboard can replay (E1), the "Runner kit" verb, and off in the recommended set because no map needs a 6.7 BL standing jump where a wall jump cannot reach [K; I].

*Risks.* Jump King's own board is about not falling, not speed [V, S124; I]. A 600 ms stand-still on a clock is 250 u of running given away.

*Ratings 1–5 (author judgement):* Feel 3 · Readability 4 · Run fit 2 · Cheapness 4 · Evidence 5

### Family E: Physics-input verbs of the named games

### E1. The hammer and the pole: Getting Over It's one analog verb (figure only)

*In plain words.* The cursor is the hammer head and the body is a mass in a pot. Hook, vault, pogo and windmill are patterns inside one mapping.

*How it works (technical).*
- "a mouse or trackpad to move the character's upper body and sledgehammer"; controllers "considerably harder" [V, S118]. Lineage: Sexy Hiking (2002), "the single worst game I have ever played" to Saltsman, and Foddy "realized how timeless the design was"; QWOP's Q, W, O, P [V, S119, S121]. Foddy: progress that "can be taken away and you might have to do it again" adds "a sense of importance and high stakes"; his filmed time was 34 minutes against a best of four and a half hours [V, S120].
- A Godot clone clamps the cursor to a 110-unit reach, moves the head at 0.59 per step, angular damping 100; Foddy's pot mass, joint and motor are unpublished [V, S122; U]. Technique chapters: Swing / Windmill, Simple Repositioning, Pogo, Bounce / Tunnel Climbing; Snake% is a category rule; the board returned 403 [U, S123].

*Cost / performance.* A pointer-driven joint motor on a two-body ragdoll; small, but a different simulation.

*Games that used it.*
- Getting Over It (cursor hammer): https://en.wikipedia.org/wiki/Getting_Over_It_with_Bennett_Foddy
- Foddy on B-games and Sexy Hiking: https://gamedeveloper.com/design/how-b-games-influenced-the-design-of-i-getting-over-it-i-
- Foddy, Design Notes interview (QWOP): https://design.google/library/bennett-foddy-getting-over-it-interview

*How it feels.* In SpeedRunner the hammer is a figure: a pointer path at 120 Hz is replayable but never comparable across players, and the game is keyboard-only [K; I]. What transfers is depth inside one input, which F4's iai hold and H2's chords apply to the katana button, and D5's charged jump is the one discrete descendant [I].

*Risks.* The fall as the cost does not transfer, because SpeedRunner's cost is the clock [S4 A5; I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 3 · Run fit 1 · Cheapness 2 · Evidence 4

### E2. Draw the slope: Solipskier, Tiny Wings and Line Rider (figure only)

*In plain words.* The finger is the level. Speed comes from the slope you draw, and lifting the finger is the jump.

*How it works (technical).*
- Solipskier: draw the slope; gates, tunnels and walls; inclines launch tricks, downhill adds speed, the skier gets faster over time, upcoming gates show required altitude; Boxleiter proposed players could "paint the terrain"; no tutorial [V, S127]. Tiny Wings taps and holds "in order to make the bird drop"; Illiger designed for "a 1.5-year-old child" in about seven months [V, S128]. Line Rider (23 Sep 2006) draws first and presses Play [V, S130]. Alto auto-runs, tap jumps, hold backflips, combos pay in speed [V, S129; U].
- As the clones show it: the foot snaps to the segment under its x, speed grows with gravity's downhill component under a cap that rises with distance, release keeps the launch vector [U]. On a 30° down-slope a hero gains g sin 30° = 1250 u/s², three maxRuns a second, so slopes need a cap [K; I].

*Cost / performance.* Solids are AABB only today [K]; a slope tile set is a collision project before it is a verb.

*Games that used it.*
- Solipskier (draw the slope): https://en.wikipedia.org/wiki/Solipskier
- Tiny Wings (hold to drop, hills for speed): https://en.wikipedia.org/wiki/Tiny_Wings
- Line Rider (draw, then play): https://en.wikipedia.org/wiki/Line_Rider

*How it feels.* In SpeedRunner the drawn slope is a figure, since the player authors the route and times are not comparable [I]. What survives is the slope slide, crouch on a down-ramp to gain g sin θ and release at the lip, paired with B2 once the collision pass learns slopes; Tiny Wings' hold-to-drop is B5's stomp [I].

*Risks.* A drawn line is an authoring tool at runtime; Line Rider shows the difference between a tool and a verb, and a board needs the verb [V, S130; I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 4 · Run fit 1 · Cheapness 2 · Evidence 3

### E3. Tilt steering, the shoot verb and Doodle Jump's items as fixed-height verb swaps

*In plain words.* Steering is analog, jumping is automatic, shooting is the one tap, and every item is a flight of a known height with invulnerability.

*How it works (technical).*
- Doodle Jump: tilt to steer, tap to shoot upward, screen wrap; propeller hats, jetpacks, rockets, springs, trampolines, shields; Pusenjak credited "intuitive and precise tilt controls" [V, S116; S4]. Points as height proxies (6c): propeller 1,200 to 1,500, jetpack 2,800 to 3,000, rocket 6,000 to 7,000 (space theme only); a spring about 2x and a trampoline about 4x, single-source; the item animates, the Doodler does not [V, S117; U]. Tilt adds about 100 ms of filter latency and swipes register after 50 to 150 px [S4 A6; I]; the shoot is the slash of a vertical game [S4 D4].

*Cost / performance.* A spring is one velocity set. A timed flight is a pickup, a timer and a sound loop.

*Games that used it.*
- Doodle Jump (tilt, shoot, items): https://en.wikipedia.org/wiki/Doodle_Jump
- Doodle Jump (item points ladder): https://www.gamerevolution.com/guides/56951-doodle-jump-how-much-points-you-get-with-special-items

*How it feels.* In SpeedRunner the items transfer as elements and pickups: a spring at 2x jumpVel (1660 u/s) reaches 12 BL, a 4x trampoline is a section launch, and the timed flights are propeller (3 s at about 300 u/s, 900 u, full control), jetpack (2 s at 900 u/s, 1800 u, control halved) and rocket (1.5 s at 2700 u/s, 4050 u, none), heights in the points ladder's 1 : 2 : 4.5, each a verb swap whose duration sets the height a map can require [K; I]. A screen-wrap well (x modulo width) fits a vertical map like m3; tilt is no on desktop [K; I].

*Risks.* Items on a ghost race must sit at fixed positions or the ghost and the live run diverge [I].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 5 · Run fit 3 · Cheapness 5 · Evidence 3

### E4. Fall Guys' dive and grab: 80 percent skill and the ragdoll a clock cannot afford

*In plain words.* Three deliberately floppy verbs. The dive extends a jump and lands face down; the grab holds a ledge, an object or another bean.

*How it works (technical).*
- Walsh: "we don't want players who speedrun games to win every single time"; "Everything you simulate with the character multiplies by 60"; Tanton: "Falling over is basically [the characters'] superpower" [V, S133, S134]. Grab is R2, RT, ZR or Shift and "extends the bean's arms in front"; holding it on a carried item about 2 to 3 s forces a drop; the lead designer called the grab-break force "a bit unpredictable currently" [V, S136; U]. Mediatonic "realised that it was funnier to keep in the grab mechanic" [V, S138]. Patch 1.06 removed obstacle grabbing in Slime Climb; 1.08 added dive-grabbing tails and an auto ledge grab for new players [V, S155; U].
- Pizza Tower's grab is a 39-frame lunge that sets 8 and climbs to 10, cancels into a long jump or a Mach cancel, and starts a wall run from the air; its taunt freezes 20 frames, parries anything in the window, and skips 0 to 10 random frames when pressed with another action [V, S60, S61].

*Cost / performance.* A grab needs something to grab; the build has no other bodies and no objects [K].

*Games that used it.*
- Fall Guys (Walsh and Tanton on chaos): https://gamesbeat.com/fall-guys-ultimate-knockout-how-mediatonic-crafted-a-cute-battle-royale/
- Fall Guys (controls, dive and grab): https://shacknews.com/article/119827/fall-guys-ultimate-knockout-controls-and-keybindings
- Pizza Tower (grab, 39 frames): https://pizzatowerspeedrunning.wiki.gg/wiki/Grab
- Pizza Tower (taunt, 20-frame parry): https://pizzatowerspeedrunning.wiki.gg/wiki/Taunt

*How it feels.* In SpeedRunner the dive is B4's comparison toggle and the grab is C1's mantle; grabbing players belongs to a live race that is not built and fights "it was your fault" [K; I]. Pizza Tower's taunt parry is 333 ms lost unless the course throws projectiles, F3 shows the slash already deflects, and its random frame skip would break replays unless seeded [V, S61; K; I].

*Risks.* The imprecision is in the ragdoll's landing, not the input: the same input gives different outcomes, which a ghost cannot carry [V, S133; I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 5 · Run fit 1 · Cheapness 3 · Evidence 3

### E5. Cat Mario's anti-verbs: the trick vocabulary and the comedy map

*In plain words.* No new verb. Run and jump, and a level that breaks every promise the shape makes. Good for one map.

*How it works (technical).*
- Syobon Action (Feb 2007): jump on Z or Up, four stages on the official site; the TAS of the 4-stage version is 1:51.63 at 30 fps, "fastest time for real, no deaths, minor glitch abuse", built on a one-frame wall clip ("turns around for about one frame to clip into a wall") and a one-frame quick turn [V, S23]. speedrun.com runs Any% and "Any% No Spacebar" [U, S141].
- The trick list: a fake solid, a hidden block over a gap, a falling cloud, a hostile power-up, a moving or sinking goal, a betrayed Goomba, a wrong pipe, a falling ceiling, a spike pop, each where SMB1 taught the player to stand [U; S4 F3]. Clear Check proves possibility, not fairness; UCH's "someone must finish and someone must not" proves fairness at the table [V, S69, S142; S4 E6].

*Cost / performance.* Elements with the wrong rule on a familiar shape. Cheap to build, expensive to trust.

*Games that used it.*
- Syobon Action (TAS, wall clip): https://tasvideos.org/Forum/Posts/287303
- Syobon Action: https://en.wikipedia.org/wiki/Syobon_Action
- Ultimate Chicken Horse (Trap points, custom rules): https://cleverendeavourgames.freshdesk.com/support/solutions/articles/32000028991-custom-rules-and-presets

*How it feels.* In SpeedRunner the main maps keep none of it: a deterministic map with a 0.38 s restart makes betrayal cost nothing after one death and teach nothing after the second [K; S4 F1; I]. A comedy map outside the season board uses each trick once with a trap counter, and a build mode (G4) forbids traps wearing a safe element's sprite; the separate-axis collision with 6 iterations exists to prevent the wall clip [K; I].

*Risks.* On a board the surprise is a memory item after the first death; the Syobon TAS gains only on the clip and the turn [V, S23; I].

*Ratings 1–5 (author judgement):* Feel 2 · Readability 2 · Run fit 1 · Cheapness 5 · Evidence 3

### Family F: Katana verbs

### F1. The dash-slash: a kill line of 1.8 to 2.7 BL at 2x run

*In plain words.* A dash that kills everything on its line. The read is the line drawn before release, not the frames.

*How it works (technical).*
- Ghostrunner's Blink kills along a line after a short charge, one hit kills both ways, the dash is the dodge, and the team added "time and death counters" to the May 2020 demo because show-floor players chased records [V, S160; U]. Mega Man Zero: "While dashing, press the attack button to perform a forward-moving slash attack" [V, S164]. Katana ZERO's iaijutsu is unsheathe, strike and sheathe "in less than a second" [V, S152].
- Dustforce: heavy attacks cancel into a dash, a jump, a wall grab or a ceiling run; "jump cancels can be buffered by holding jump through the heavy; dash cancels must be timed"; a hit refreshes the dash and double jump [V, S43; U; S4 D3]. The settled slash is 2 startup, 4 active, 6 recovery steps, 100 ms cadence, 50x40 u, vx untouched [S4 D4].

*Cost / performance.* A1's dash state with the slash's AABB tested each active step, 12 overlapping boxes.

*Games that used it.*
- Ghostrunner (Blink, counters for runners): https://shacknews.com/article/118609/ghostrunner-devs-plan-to-offer-more-support-and-modes-for-speedrunners
- Mega Man Zero (dash-slash): https://almarsguides.com/retro/walkthroughs/GBA/games/MegamanZero/Misc/Controls/
- Katana ZERO (iaijutsu): https://katanazero.wiki.gg/wiki/Zero
- Dustforce (heavy cancels): https://axebps-redlib.hf.space/r/dustforce/wiki/terms

*How it feels.* In SpeedRunner the dash-slash is the release of the iai hold (F4), so Move, Jump and Katana stay the only inputs: 2 startup steps, 12 active at arm to 18 at full (100 to 150 ms), 6 recovery with air control locked like `wallLock`, 840 u/s (2.0x maxRun, 7 u per step) with vy held at 0 every active step so the line is flat, as the dash, 84 to 126 u = 1.8 to 2.7 BL, exit 546 u/s so the decay and every E4 gap stay valid; the swept box is body plus travel plus blade, 154 to 196 u by 40 u, tested as the D4 box each step, with projectile-only i-frames, a jump cancel in recovery only, a wall ending it into a slide, one per airtime refunded by a kill or a pogo (table 6d) [K; S4 A5; I]. Read: a one-frame smear the full length, the hero in a lunge, 10 dust, afterimages every 2 steps, no world hitstop; the duel's sheathe synth on arm, a 40 ms burst sweeping 1.2 to 2.4 kHz on release, an 1.8 kHz ping per kill [K; I].

*Risks.* A free 1.8 BL at 2x speed every airtime puts enemies on the fast line as [S4 D3] wanted, and a corridor of enemies becomes a Ghostrunner All Kills chain, the intended ceiling and the first thing to watch in a death heatmap [I]. Celeste's 2.67x for 0.15 s is the upper bound; 2.0x for 0.10 s is the conservative start [V, S7; I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 4 · Run fit 5 · Cheapness 4 · Evidence 3

### F2. The pogo slash: Down and katana in the air, a fixed bounce of 3.0 BL

*In plain words.* Stab down in the air; hit an enemy or a spike and bounce as high as a jump. Spikes become steps.

*How it works (technical).*
- Hollow Knight: `rb2d.velocity = (x, BOUNCE_VELOCITY 12)` for `BOUNCE_TIME 0.25` s, 72% of the 16.65 jump, regardless of fall speed, off enemies, spikes and some objects; `ATTACK_DURATION 0.35`, `ATTACK_COOLDOWN_TIME 0.41` (0.28 and 0.25 with Quick Slash, a 30% cut) [V, S21, S25, S52]. Shovel Knight bounces "~4.5 tiles", its jump height, with "frustration-free" invulnerability [V, S163; S4 D3]. Zelda II's Downthrust is Down in the air [U]; Mega Man Zero's attack button has an aerial down thrust [V, S164]; Celeste's `Bounce` is -140, 1.33x jump [S4 D3].
- SpeedRunner's settled stomp bounce is a full jumpVel, 830 u/s [S4 D3]; spikes are 16 u tall hitboxes inset 4 u [K].

*Cost / performance.* The D4 box rotated and one velocity set.

*Games that used it.*
- Hollow Knight (`BOUNCE_VELOCITY 12`, `BOUNCE_TIME 0.25`): https://github.com/AminSedaghaty/HK-Source/blob/f516282143970c48bcb25b695489ec0855b3b837/CSharp/HeroController.cs
- Hollow Knight (nail-bouncing on spikes): https://hollowknight.wiki/w/Nail-bouncing
- Shovel Knight (bounce equals jump height): https://yachtclubgames.com/blog/plague-knight-mobility-design

*How it feels.* In SpeedRunner the pogo is Down held plus Katana pressed in the air, the blade held down up to 24 steps (200 ms) then the 12-step cadence, 2 startup, a 40 u wide by 50 u tall box below the feet that reaches a spike top 34 u before the feet, bounce vy -830 (apex 138 u = 3.0 BL) with the apex band if Jump is held and the 0.45 cut, vx untouched, no i-frames [K; S4 D3; I]. Targets are enemies, floor spike strips and the gym's spike-capped block, not springs or movers, ceiling spikes stay deadly, and a pogo refunds the dash-slash and resets `wallJumpSameY` from 330 to 790; read as a vertical stab, a one-frame smear, 6 dust and the jump triangle an octave lower (210 to 380 Hz, 90 ms) [K; I].

*Risks.* m3 has 9 spike strips, 4 on ceilings; floor pogos re-route its halls, so m3 needs the verb mask or a re-timed author run [K; I]. Hollow Knight's fixed bounce is the readable rule, and it means a pogo at the end of a long fall replaces the roll [V, S21; I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 5 · Run fit 4 · Cheapness 5 · Evidence 4

### F3. The slash is the parry: deflect as a property, 14 steps at 600 u/s, no stance, no lockout

*In plain words.* Any shot that enters the slash while it is active turns around. No parry button, no window to time, no whiff penalty beyond the slash's own recovery.

*How it works (technical).*
- Katana ZERO: "deflect bullets with a single katana swing", the bullet ricochets back, slow motion helps "though you can do it without it"; the roll is invulnerable; death and restart are instant [V, S152, S154, S151]. Samurai Gunn deflects "with precise timing"; Sclash's designer, citing it and Nidhogg, said with one-hit death "we couldn't make the attack that fast"; Nidhogg blocks automatically by sword height [V, S166, S168, S167].
- Sekiro's deflect is "12 frames by default (0.2 seconds before the attack hits)", shrinking to 4 or 0 on spam and clearing after 30 frames (another page says 30 shrinking to 7) [V, S162]. Ninja Gaiden II's sword has "a 20 frame cooldown time" and the grounded slash "forces you to stand still" [V, S165].

*Cost / performance.* Zero. A projectile overlapping the active box reverses its velocity.

*Games that used it.*
- Katana ZERO (deflect in the swing): https://katanazero.wiki.gg/wiki/Zero
- Sekiro (12-frame deflect, shrink on spam): https://sekiroshadowsdietwice.wiki.fextralife.com/Deflection
- Nidhogg (automatic height block): https://mechanicsofmagic.com/?p=173
- Ninja Gaiden II (20-frame rooted slash): https://kb.speeddemosarchive.com/Ninja_Gaiden_II:_The_Dark_Sword_of_Chaos/Game_Mechanics

*How it feels.* In SpeedRunner the spec's 120 ms parry with a 300 ms miss recovery is rejected: the D4 box is 50 u deep and active 4 steps, a 600 u/s shot (5 u per step) needs 10 steps to cross it, so the effective window is 14 steps = 117 ms for a point shot with no new input or state; the Sandbox's 14 u wide shot adds 14 / 5 = about 3 steps, so the window is about 17 steps; at 900 u/s the point window is 11 steps, at 450 u/s 17, so shot speed is the slider [K; S4 D4; I]. The miss cost stays D4's 6 recovery steps; the reflected shot returns at 1.5x, kills the turret, with a ping and a 2-step hero-only flash [I].

*Risks.* A 300 ms lockout at 420 u/s is 126 u = 2.7 BL without control, worse than Ninja Gaiden's rooted 20 frames [V, S165; I]. A true parry, if ever wanted, is Katana held with no direction on the ground, a 14-step window, a 12-step whiff recovery, unranked first [I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 4 · Run fit 5 · Cheapness 5 · Evidence 4

### F4. Iai: hold to arm at 200 ms, full at 300 ms, release

*In plain words.* Tap and you slash at once. Keep holding and the samurai sheathes; let go and the dash-slash fires, longer the longer you held.

*How it works (technical).*
- Berbank Green: one button loaded by press, hold, release and duration; 8 ways to map two actions on one button; a toggle without feedback confuses [V, S175]. Katana ZERO's iai is "less than a second" [V, S152]; Jump King caps the hold at 0.6 s and Celeste's dash commits in 0.15 s, so 300 ms to full is the range [V, S44, S7; I]. Dustforce expresses "the one with a longer commitment" with a second button, the heavy [V, S43; I].
- Katana ZERO's roll cadence is "every 22 frames", the c-roll loop a slash 10 frames after a roll and a roll 12 later, a snippet [U, S159].

*Cost / performance.* A hold timer on a button the game already reads. Zero added latency on the tap.

*Games that used it.*
- Berbank Green, One-Button Games (press, hold, release): https://www.gamedeveloper.com/design/one-button-games
- Katana ZERO (iaijutsu under a second): https://katanazero.wiki.gg/wiki/Zero
- Katana ZERO (roll-slash cadence, community guide): https://www.speedrun.com/katana_zero/guide/akw9e

*How it feels.* In SpeedRunner the press always fires the D4 slash at step 0, hold or tap; Katana still held at 24 steps (200 ms) then arms the sheathe, 36 steps (300 ms) is full; release fires F1 with 12 active steps at arm and 18 at full, 84 to 126 u, speed fixed at 840 u/s so the read is "longer", never "faster"; a release before arming adds nothing to the tap [K; I]. While charging, run, jump and the wall kit work, vx is untouched, the charge survives a wall jump and dies on a hit; the duel's 0.75 s stance frame becomes the sheathe pose, with a 2-step white flash at arm and at full and the sheathe synth, because an invisible threshold makes players release early [K; I].

*Risks.* Up + Katana near a ring is the hook (D1), so a hold after a hook press keeps the rope, not the charge; the ring glow disambiguates [I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 3 · Run fit 5 · Cheapness 5 · Evidence 3

### F5. Slow time, hitstop and smears: what stays out of the ranked run

*In plain words.* Slow motion is deterministic and still wrong for the board. Hitstop is a tax runners switch off. The smear is free.

*How it works (technical).*
- Superhot's time advances only with movement or firing; it ships one challenge in game time and a companion in real time, and real-time runners "ignore the game's primary mechanic"; the IGT overlay is lost on replays [V, S169, S170]. Katana ZERO's slow motion is "limited by a meter that refills gradually", its board is in-game time shared by speedrun mode and normal, ILs submit IGT to two decimals, and the gold-medal guides set screenshake 0%, hitpause 0%, response time x1 and Skip Rewind on [V, S151, S157, S63, S158; U]. Ghostrunner's Sensory Boost slows the world only while airborne [U].
- Celeste's `DashBegin` freezes 0.05 s and draws two afterimages 0.08 s apart; the hair flips red to blue when the dash is spent [V, S7].

*Cost / performance.* A per-step world time scale inside the fixed step, a meter, a flag on the board.

*Games that used it.*
- Superhot (two boards, game time and real time): https://www.speedrun.com/superhot/forums/az93t
- Katana ZERO (hitpause 0% in the gold-medal guide): https://speedrun.com/katana_zero/guide/xgaqg
- Celeste (`Celeste.Freeze(.05f)`, two trails): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs

*How it feels.* In SpeedRunner slow time is a Sandbox toggle only: air only at 0.3x world speed, a 1.0 s meter refilled 1 s per 3 s on the ground, the clock on real steps, the run flagged assisted and rejected by the board; it replays bit-identically because the scale is applied inside the 1/120 s step and the button is logged [K; S4 H3; I]. Hitstop is 0 world steps and a 2-step hero-only flash; the smear, the afterimage and the kimono tint are every verb's read [V, S7, S158; I].

*Risks.* Real steps make slow-mo a cost, world steps make it free and the fastest line holds it forever, two boards split five friends in half, so rank on real steps [V, S169; I]. Braid's rewind cannot exist on a ranked clock unless the clock keeps counting through it [U; I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 4 · Run fit 2 · Cheapness 4 · Evidence 4

### Family G: Verb kits, items and placing

### G1. Power-ups as kits per level: Mario Maker's styles, the cape, and the verb gate

*In plain words.* A power-up is a bundle of two to seven verbs, bound to a style, placed by the maker and lost on a hit. The level is the allowed-verbs list.

*How it works (technical).*
- SMM2 (v3.0.0) per style: SMB1 has Super Mushroom, Fire Flower, Superball Flower, Master Sword (swing, dash attack, down thrust, arrow, bomb, shield), SMB2 Mushroom (pick up and throw, charge jump), Big Mushroom, shells, Goomba's Shoe, Dry Bones Shell, Lakitu's Cloud; SMB3 the Super Leaf and Frog Suit; SMW the Cape Feather, Yoshi and P-Balloon; NSMBU the Propeller Mushroom and Super Acorn; 3D World the Super Bell, Super Hammer, Boomerang Flower, Cannon Box, Propeller Box, Goomba Mask and Bullet Bill Mask; only NSMBU and 3D World have the wall jump and ground pound, only SMW, NSMBU and 3D World the spin jump [V, S69]. The P-Meter fills while running and empties on a crouch, a turn or a wall [V, S71].
- The cape needs a sprint run-up, 80 frames of takeoff, flight 6% above sprint [V, S15]. Pizza Tower's transformations (Knight, Firemouth, Ball, Rocket, Barrel) start at a block and end at a wall or timer [U]. LBP places a power-up object to give it and a gate "to forcefully remove any powerups" [V, S94; U]. Jetpack Joyride's vehicle lasts until a hit [V, S112].

*Cost / performance.* One mask byte in the map header, a pickup element, a gate element, one ghost flag per handed verb.

*Games that used it.*
- Super Mario Maker 2 (power-ups per style): https://www.mariowiki.com/Super_Mario_Maker_2
- Super Mario World (cape, takeoff meter 80): https://tasvideos.org/GameResources/SNES/SuperMarioWorld
- LittleBigPlanet (power-up giver and remover): https://littlebigplanet.fandom.com/wiki/Character_Enhancements
- Jetpack Joyride (vehicle until hit): https://en.wikipedia.org/wiki/Jetpack_Joyride

*How it feels.* In SpeedRunner the map header already holds `top`, `floorView`, checkpoints and the finish; add `verbs: ["run","jump","wall","roll"]` and pickups `{x, y, verb, until}` that set and clear a mask, so the replay stays deterministic, m1 to m4 keep their boards with the kit they shipped with, and SAMURAI TRIAL opens as the first verb map [K; I]. A handed glide is capped to the cape's class with no climb: 1.3 s at maxRun is 550 u = 12 BL on maps 4,580 to 8,700 u wide [V, S15; K; I].

*Risks.* SMM2's Clear board bans Luigi, not power-ups, because the maker chose them; a board compares equal kits, so the kit must be in the map, not the player [V, S28; I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 5 · Run fit 5 · Cheapness 5 · Evidence 5

### G2. One-shot movement cards: Neon White's discards priced in ammo, and the medal ladder as a verb ladder

*In plain words.* Each card shoots and, thrown away, moves you once. The level hands out the cards its route needs, so route and kit are one object.

*How it works (technical).*
- Elevate (pistol, 9) is a vertical boost or double jump; Purify (MG, 35) a sticky grenade; Godspeed (rifle, 4) a forward launch; Stomp (SMG, 30) a slam; Dominion (RPG, 4) a grapple; Fireball (shotgun, 4) an aimable air dash; the Katana parries for a speed boost; "Cards are stage-specific, and you can't bring your own deck" [V, S64]. Esposito: random decks "wasn't fun at all", discarding was "risk/reward", "The player always has the right tool for the next encounter", "The shortcut path must only use cards from the main path", "The shortcut path cannot be hidden" [V, S65]. A Bomb card built only for a shortcut was cut, "every card has to have an obvious purpose in the moment that you pick it up"; over 50 iterations on one level, fastest known 9.56 s, over 100 levels shipped and about twice that scrapped [V, S66]. Ace needs "at least one shortcut that saved a significant amount of time even if you didn't execute it perfectly"; Red beats the developer; gold unlocks the shortcut hint [V, S67].

*Cost / performance.* A pickup granting one charge of an existing verb, and a HUD icon.

*Games that used it.*
- Neon White (card table, ammo): https://www.thegamer.com/neon-white-soul-cards-tips-tricks-guide/
- Neon White (Esposito's shortcut rules): https://www.gamedeveloper.com/road-to-igf-2023/-neon-white-and-designing-for-player-creativity
- Neon White (how a level is made): https://gameinformer.com/feature/2022/11/25/how-a-neon-white-level-is-made

*How it feels.* In SpeedRunner a card is the clean way to place a dash or a double jump: one charge, spent by its own input, drawn as a card icon by the timer, placed where the map wants it, and the four maps need none [I]. The medal ladder of [S4 E1] becomes a verb ladder, bronze and silver on the main path, gold with one intended discard, the author's time with all of them, the unplanned route as the Red; Neon White prices movement in ammo (4 rounds on the three strongest cards against 30 to 35), and without guns the cost is the pickup's position off the line [V, S67, S64; I].

*Risks.* "If you just play to win each level without going back to optimize your time, you're not really playing Neon White" [V, S67]. Cards need the gift-after-clear loop that teaches the level first, which is a menu, not a verb [V, S65; I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 5 · Run fit 4 · Cheapness 4 · Evidence 5

### G3. Items against opponents and loadouts: SpeedRunners' pickups, Jetpack Joyride's gadgets, the two-stage item

*In plain words.* Race items hit the other player; loadouts are handicaps chosen before the run. Neither has a target on a solo board, and one pattern survives.

*How it works (technical).*
- SpeedRunners' eight pickups: Golden Hook (swaps positions; dodged by sliding), Homing Missile, Crates (one to three, stun anyone), Time Bomb (place, then a Button detonates), InvinciDrill (the only speed boost), Shockwave, Freeze Ray ("a few seconds"), Fireball; no speeds or durations published; the boost meter's fill is unverified [V, S90; U]. Mario Kart 8 draws from ten distance bands, thresholds 400 to 26,000 units [V, S84]. Mario Royale ran 75 ghosts with no contact and sabotage through broken blocks and kicked shells [V, S86].
- Jetpack Joyride v1.3: 15 gadgets, "mix and match any two"; Gravity Belt about +50% descent, Air Barrys about 3x height, Turbo Boost about 300 m, community figures against Halfbrick's joke blurbs [V, S113, S114]. UCH's Modifiers (high gravity, multiple jumps, dead hops, jetpacks, dance invincibility) are table rules [V, S142].

*Cost / performance.* Nothing to build for a solo board. A two-stage item costs one state.

*Games that used it.*
- SpeedRunners (pickups): https://speedrunners.wiki.gg/wiki/Pickups
- Mario Kart 8 (distance-banded item deck): https://www.mariowiki.com/Mario_Kart_8_item_probability_distributions
- Jetpack Joyride (two gadget slots): https://www.halfbrick.com/blog/in-depth-jetpack-joyride-gadgets
- Mario Royale (indirect sabotage): https://en.wikipedia.org/wiki/Mario_Royale

*How it feels.* In SpeedRunner an item hitting a ghost is meaningless, so none of the eight transfers; the lesson is the two-stage item, place then trigger on one button, the shape of G4's placed trap [V, S90; I]. Loadouts are a self-chosen handicap needing a board tag, like UCH's modifiers; of the three interference families, projectile, field and swap, only the field survives a solo clock, because a field left in the course is a map edit [V, S114, S142; I].

*Risks.* Items as catch-up exist so laggards stay in the race; a solo time attack has no laggard [V, S87; I].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 4 · Run fit 1 · Cheapness 5 · Evidence 3

### G4. Place one block then race: UCH's timed placement, the async ghost-trap chain, and making as playing

*In plain words.* Everyone grabs one piece, places it under one clock, then runs the level they just made worse. The async version is one trap after a finished run, hashed into the board.

*How it works (technical).*
- UCH's Rules menu: Points to Win, Length Limit, Placement Timer ("How long you have to place items"), Run Time Limit, Respawn, Party Box modes, Pieces per Round, points for Goal, Solo, Postmortem, Trap, Coin, Comeback and First to Fourth, per-block probabilities, Modifiers [V, S142]. The timer arrived in July 2016 "to avoid the Mexican stand-off", range 5 to 60 s or None, default 5 points and 12 rounds (snippet) [V, S101; U, S146]. V1.6.040 (4 Mar 2019): "many blocks" "both rotated AND flipped", Double Party Box for any count; V1.13.13 (19 May 2026): True Random; 1.6.050 and 1.6.061 stopped blocks attaching to the end zone [V, S147]. Free Play (27 Oct 2016) builds "without time limits, rules, points, winning, or dying"; custom levels get an 8-digit code and Challenge boards [V, S143; U, S145]; the studio's SMM2 course adds an element per round [V, S144].
- Mario Maker: Tezuka, "so long as we ensure that making feels like playing, anything goes"; Miyamoto, "a game about creative play as much as anything"; the stick "is far slower than tapping the touchscreen" [V, S83, S82; U]. LBP's Popit pops above Sackboy on Square with cursor, Goodies Bag and Tools Bag in the same body as play [V, S179; U]. Trackmania's author rules (respawnable from every checkpoint, no hard speed checks, readable, an Author Medal of at most 20 s) are a publish check [V, S148, S149].

*Cost / performance.* A placement cursor, a deck of three tags, one hash in the board key, one field in the replay header.

*Games that used it.*
- Ultimate Chicken Horse (Rules, Placement Timer): https://cleverendeavourgames.freshdesk.com/support/solutions/articles/32000028991-custom-rules-and-presets
- Ultimate Chicken Horse (placement timer, July 2016): https://www.cleverendeavourgames.com/blog/2016/7/7/new-placement-timer-bug-tracking-and-summer-sale-results
- Super Mario Maker (making feels like playing): https://time.com/4030885/super-mario-maker-nintendo-wii-u
- Trackmania (Weekly Shorts author rules): https://doc.trackmania.com/create/map-review/weekly-shorts-guidelines/

*How it feels.* In SpeedRunner the shape is the async chain: after a finished run the player places one piece from a deck of three tags (a 16 u spike strip, a 40x40 solid, a 3 s mover) under a 15 s timer, snapped to 20 u, never within 200 u of the start, a checkpoint or the finish and never over a solid; it is appended as `[x, y, w, h, tag, {author, t}]`, the state is `base + placed[]`, the board key `map:sha256(base + placed)[0:12]`, the next runner sees "Ana's saw" on death, the chain caps at 12 like UCH's rounds and resets weekly [K; I]. Placement happens between runs, so the log is unchanged and the replay header carries the hash and `placed[]`; the placer must finish the new state first, SMM's Clear Check and UCH's "author also runs"; in the Sandbox it is the practice room's optional click-to-place [V, S69, S142; I].

*Risks.* Chain states fragment the board, hence a key per state and the cap; no telemetry says how often five friends replay a cleared map, which is the whole case for the mode [I]. A trap wearing a safe element's sprite is forbidden by default (E5).

*Ratings 1–5 (author judgement):* Feel 4 · Readability 4 · Run fit 3 · Cheapness 3 · Evidence 4

### Family H: Verb budget, inputs and determinism

### H1. The verb budget: how many verbs on how many buttons

*In plain words.* The great precision platformers spend one to four action buttons on top of a direction. Fewer verbs, each deepened by context.

*How it works (technical).*
- Table 6e holds the counts. N++ is "three buttons controlling left and right movement, and the jump", and "it's your vertical velocity that determines jump height" [V, S172]; Celeste is Jump, Dash and Grab plus the Crouch Dash since 1.4.0.0 [V, S7, S14]; Neon White's discard "immediately grants a movement ability" [V, S65; U]; Dustforce gives one aerial action per jump [V, S45]; Hollow Knight runs four core buttons [U]; Dead Cells on phones made a verb automatic [V, S176]; Katana ZERO has attack, roll on Enter and slow motion on Shift [V, S153]; Fall Guys has jump, dive and grab [V, S150]; SpeedRunner has one [K].
- Crawford: "the cleanest, simplest, easiest-to-learn games have fewer than ten verbs" [V, S173]. Anthropy and Clark argue for deepening verbs over adding them, with resources as rewards that enable verbs [V, S174]. No controlled study of button count against learnability surfaced; the nearest is Rogers, Bowman and Oliver 2015 on motion against push-button controllers [U]. Celeste's crouch dash was discovered by players, bound with Joy2Key, and given a button three years later [V, S14, S41, S35].

*Cost / performance.* A number. The cost is paid later, in categories.

*Games that used it.*
- N++ (one button): https://www.thumbsticks.com/gdc-2016-the-secret-to-nplusplus-level-design/
- Crawford, The Art of Interactive Design: https://ludoscience.com/EN/ressources/bibliographie/801-The-Art-of-Interactive-Design.html
- Anthropy and Clark, A Game Design Vocabulary: https://www.oreilly.com/library/view/a-game-design/9780133155181/ch02.html
- Celeste 1.4.0.0 changelog: https://maddymakesgamesinc.itch.io/celeste/devlog/237097/v1400-changelog

*How it feels.* In SpeedRunner the recommended set is 15 verbs on three buttons and a direction, run, jump, wall slide, wall jump, climb jump, roll, crouch, slide, slide-jump, stomp, mantle (no input), slash, pogo, dash-slash and hook, nine of them context verbs, inside Crawford's bound at Celeste's button count [K; I]. The Sandbox's budget readout shows buttons needed (2, 3 or 4) and how many verbs share each [I].

*Risks.* Decide hidden-input verbs before the leaderboard opens; a late bind change splits categories or forces a season wipe [V, S14; I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 5 · Run fit 5 · Cheapness 5 · Evidence 4

### H2. Context-sensitive inputs: tap, hold, release, direction chords, and the mapping

*In plain words.* One button carries several verbs when press, hold, release, direction and body state pick between them. A few rules keep it readable.

*How it works (technical).*
- Berbank Green: 8 ways to load two actions on one button (context-sensitive, overlapping, eclipsing), 6 jump systems, 5 jump modifiers; a toggle whose meaning changes per press confuses without feedback [V, S175]. Celeste 1.4: Press and Hold modes for the Crouch Dash, movement directions separated from dash directions so a deadzone cannot misfire a dash, Grab as a toggle, pause buffered 0.1 s [V, S14]; runners keep demo on its own button because binding it to dash loses crystals and supers [V, S41].
- Dead Cells on phones: Auto-Hit, which the developers "ended up preferring it themselves", swipe to dodge, floating or fixed pads [V, S176]. Super Meat Boy Forever cut to two buttons [V, S180].

*Cost / performance.* A chord table and a per-verb buffer, each decremented inside `step()`.

*Games that used it.*
- Berbank Green, One-Button Games: https://www.gamedeveloper.com/design/one-button-games
- Celeste 1.4 (Press and Hold modes, Directionals): https://maddymakesgamesinc.itch.io/celeste/devlog/237097/v1400-changelog
- Dead Cells mobile (Auto-Hit): https://playdigious.com/sharpen-your-thumbs-dead-cells-is-now-slaying-foes-on-android

*How it feels.* In SpeedRunner the chord table is: Jump tap is the jump, the wall jump away, or the climb jump when holding in; Down on the ground is crouch or slide by speed; Jump in a slide is the slide-jump; Down in the air is the stomp; Katana tap is the slash; Down + Katana in the air is the pogo; Katana held 200 ms and released is the dash-slash; Up + Katana in the air with a ring in reach is the hook and Katana released lets go; the mantle has no input [I]. Rules: a hitbox-changing verb is a hold, never a toggle; a resource verb has a visible counter; every chord has a non-chord fallback so a 4-way d-pad or a two-thumb pad plays Any%; on a phone the slash becomes automatic in range, Dead Cells' rule [V, S176; I].

*Risks.* Accidental verbs on a diagonal (Down + Jump at a ledge) are the Celeste problem in reverse; the Sandbox's input strip shows which chord fired each step [I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 4 · Run fit 5 · Cheapness 5 · Evidence 4

### H3. The verb state machine: startup, active, recovery and a cancel table, with resources reset by one code path

*In plain words.* Verbs are rows in a table of steps. The state machine reads the row, the cancel table says what interrupts what, and one function resets every resource.

*How it works (technical).*
- Celeste's `Player` owns `StateMachine(23)` with `StNormal 0`, `StClimb 1`, `StDash 2`, `StRedDash 5` and nineteen others, each with update, coroutine, begin and end callbacks; jump, wall jump, super and hyper are methods called inside a state's update, and the order in `NormalUpdate` is the cancel table, grab, then `if (CanDash) return StartDash()`, then duck, then jump, so dash beats jump on the same frame; `CanDash` is `Input.Dash.Pressed && dashCooldownTimer <= 0 && Dashes > 0`; `RefillDash()` and `RefillStamina()` are the only writers of the resources [V, S7].
- Game Programming Patterns: per-verb booleans let impossible pairs happen, "`isJumping_` and `isDucking_` should never both be true"; use an enum or state objects, concurrent machines for movement and equipment, a pushdown automaton for one-shots [V, S32]. Fighting-game communities publish frame data as JSON per move [V, S190].

*Cost / performance.* About 60 lines of JavaScript and a table the Sandbox edits live; no library.

*Games that used it.*
- Celeste (`StateMachine(23)`, `NormalUpdate` order): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- Game Programming Patterns, State: https://gameprogrammingpatterns.com/state.html
- sfx-framedata (frame data as JSON): https://github.com/avivace/sfx-framedata

*How it feels.* In SpeedRunner every verb is a `VERBS` row with `startup`, `active`, `recovery`, `cooldown`, `uses` and a `cancelInto` map of allowed phases (§7): the dash-slash cancels into a jump in recovery only, the slash in any phase, the slide into a jump or a dash at any time, copying Dustforce's jump-buffered, dash-timed asymmetry [V, S43; I]. One `onLand()` resets the dash-slash charge, the pogo and `wallJumpSameY`, and respawn calls it too, Celeste's `RefillDash()` rule [V, S7; I].

*Risks.* Per-verb buffers must be simulated from the log, not wall time, or the replay diverges; the table is also the anti-cheat, since the validator hashes `VERBS` with `PHYS` (H4) [I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 3 · Run fit 5 · Cheapness 5 · Evidence 5

### H4. The input log with verb bits, TAS formats, and categories on the board

*In plain words.* Three new press bits fill the log byte, so it becomes two bytes per run of identical input. The board shows which verb set a time used instead of splitting in two.

*How it works (technical).*
- Mechanics #1 settled a 1-byte-per-step RLE log (left, right, jump held, jump pressed, slash) [S4 H2]. CelesteTAS writes one line per run of identical input, `123,R,J`, letters R L U D J X (dash) G (grab), breakpoints `***` [V, S20]. BizHawk `.bk2` is one line per frame with `.` for unpressed [V, S22]. Celeste 1.4 reset every player's binds on update: the log stores verbs, never keys [V, S14].
- Boards: Celeste's has no dash-restricted category, only the DTS variable, and moderators call tech restrictions "arbitrary and hard to enforce" [V, S27, S38, S37]; SMM2's Clear board says "Luigi and starting from a checkpoint are not allowed", Story Mode carries a Luigi Assist variable, no power-up rule exists [V, S28]; Katana ZERO's board is IGT shared by speedrun mode and normal; Ghostrunner runs Any%, CAKE, All Kills and Boost [V, S157, S161; U]; Superhot's two clocks split its runners (F5) [V, S169].

*Cost / performance.* Three more held bits in the byte and a hash in the header; 288 B per minute measured on the course, 343 to 448 on the gym [V, S3].

*Games that used it.*
- CelesteTAS (`frames,actions` format): https://github.com/EverestAPI/CelesteTAS-EverestInterop
- speedrun.com API, Celeste categories (DTS variable): https://www.speedrun.com/api/v1/games/celeste/categories
- speedrun.com API, SMM2 categories (Luigi rule): https://www.speedrun.com/api/v1/games/smm2/categories
- BizHawk .bk2 (one line per frame): https://tasvideos.org/Bizhawk/BK2Format

*How it feels.* In SpeedRunner each pair is one byte of held bits, `L R U D Jump Katana DashPress Climb`, and a varint run length; every press, jump included, is the edge of its held bit (#1's separate jump-press bit is dropped because it cost one extra pair per jump), the hook is Up + Katana so it needs no bit, and the climb button gets the last one [S4 H2; V, S3; I]. The header stores `hash(VERBS + PHYS)` and the map hash (G4); the validator counts katana and dash inputs to set a tag, so one board filters "Any%" and "No Katana", with "All Kills" later; resources are derived, never logged, and reset by H3's one code path [V, S7; I].

*Risks.* The Sandbox's RLE encoder and bytes-per-minute readout must survive the second byte; the deflated size of about 1 KB per minute from [S4 H2] barely moves [I].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 3 · Run fit 5 · Cheapness 5 · Evidence 5

---

## 5. Comparison scorecard

Author judgement, copied from the profiles: Feel · Readability · Run fit · Cheapness · Evidence.

| # | Technique | Feel | Read. | Run fit | Cheap | Evid. | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Horizontal dash: 2.67x run, 150 ms, ground refill | 5 | 4 | 3 | 4 | 5 | 21 |
| A2 | Dash directions: two, not eight | 4 | 5 | 4 | 5 | 4 | 22 |
| A3 | Air dash and the air charge | 5 | 4 | 4 | 5 | 4 | 22 |
| A4 | Double jump and its refill rules | 4 | 5 | 2 | 5 | 4 | 20 |
| A5 | Dash-jump lineage: super, hyper, drop dash, Mach | 5 | 3 | 5 | 5 | 5 | 23 |
| A6 | Glide, float and the cape | 3 | 5 | 2 | 5 | 4 | 19 |
| B1 | Crouch and crawl: hitbox to 57% | 3 | 5 | 4 | 5 | 5 | 22 |
| B2 | Crouch-slide and slide-jump | 5 | 4 | 5 | 5 | 4 | 23 |
| B3 | Long jump, backflip, side flip (SM64) | 4 | 3 | 3 | 5 | 5 | 20 |
| B4 | Dive and belly flop | 4 | 5 | 3 | 4 | 3 | 19 |
| B5 | Ground pound, stomp and fast fall | 4 | 4 | 5 | 5 | 4 | 22 |
| B6 | Spin jump | 3 | 4 | 2 | 3 | 4 | 16 |
| C1 | Ledge grab and automatic mantle | 5 | 5 | 5 | 5 | 4 | 24 |
| C2 | Wall run and ceiling run | 4 | 4 | 2 | 4 | 3 | 17 |
| C3 | Climb with stamina (Celeste) | 4 | 4 | 2 | 3 | 5 | 18 |
| C4 | Crouch against the wall kit and one-way tiles | 4 | 4 | 5 | 5 | 4 | 22 |
| D1 | The swing: pendulum and release cap, ring hook | 4 | 4 | 3 | 4 | 3 | 18 |
| D2 | Hook points, pull and zip hooks | 3 | 5 | 3 | 5 | 4 | 20 |
| D3 | Reel, elastic and placed ropes | 5 | 2 | 2 | 3 | 2 | 14 |
| D4 | Jetpack thrust, one-button corridor, vehicle swaps | 3 | 5 | 2 | 4 | 4 | 18 |
| D5 | Charged jump (Jump King) | 3 | 4 | 2 | 4 | 5 | 18 |
| E1 | Hammer and pole (Getting Over It), figure only | 5 | 3 | 1 | 2 | 4 | 15 |
| E2 | Draw the slope (Solipskier), figure only | 5 | 4 | 1 | 2 | 3 | 15 |
| E3 | Tilt, shoot and Doodle Jump items | 3 | 5 | 3 | 5 | 3 | 19 |
| E4 | Fall Guys dive and grab | 4 | 5 | 1 | 3 | 3 | 16 |
| E5 | Cat Mario's anti-verbs, comedy map | 2 | 2 | 1 | 5 | 3 | 13 |
| F1 | Dash-slash: 1.8 to 2.7 BL kill line | 5 | 4 | 5 | 4 | 3 | 21 |
| F2 | Pogo slash: fixed 3.0 BL bounce | 5 | 5 | 4 | 5 | 4 | 23 |
| F3 | The slash is the parry | 5 | 4 | 5 | 5 | 4 | 23 |
| F4 | Iai: hold 200 ms, release | 5 | 3 | 5 | 5 | 3 | 21 |
| F5 | Slow time, hitstop and smears | 4 | 4 | 2 | 4 | 4 | 18 |
| G1 | Power-ups as kits per level, verb gate | 4 | 5 | 5 | 5 | 5 | 24 |
| G2 | One-shot movement cards (Neon White) | 4 | 5 | 4 | 4 | 5 | 22 |
| G3 | Items against opponents, loadouts | 3 | 4 | 1 | 5 | 3 | 16 |
| G4 | Place one block then race, ghost-trap chain | 4 | 4 | 3 | 3 | 4 | 18 |
| H1 | Verb budget: verbs per button | 4 | 5 | 5 | 5 | 4 | 23 |
| H2 | Context-sensitive inputs and the chord table | 4 | 4 | 5 | 5 | 4 | 22 |
| H3 | Verb state machine with a cancel table | 4 | 3 | 5 | 5 | 5 | 22 |
| H4 | Input log with verb bits, categories | 3 | 3 | 5 | 5 | 5 | 21 |

**Reading the table.** Run fit does the sorting, because the question was which verbs survive a leaderboard and four shipped maps. The two rows at 24, the verb gate (G1) and the automatic mantle (C1), make everything else safe: one keeps the old boards valid, the other removes a death without adding an input. The rows at 23 are the recommended set's spine: the slide-jump (B2), the pogo (F2), the deflect as a property (F3), the dash-jump economy (A5) and the budget (H1). The katana verbs pay in Readability, since a held button has no shape until the sheathe pose and the smear give it one (F1, F4), which is why §7 spends two feedback layers on them. Cheapness is high almost everywhere because the verbs reuse the jump, the hitbox swap and the slash; the only 2s are the figure-only verbs (E1, E2). Evidence is 5 where code was read (Celeste, SM64, SMW's jump table, Jump King, Hollow Knight's prefab, the state machine) and 2 to 3 where pages sat behind 402 and 403 walls (the ropes, Ghostrunner, Fall Guys, Katana ZERO's frames). The bottom rows, the comedy map (E5), the elastic rope (D3), the hammer and the drawn slope (E1, E2), are verbs the user named, and the answer is a figure, a section or one unranked map [I].

---

## 6. Deep dives

### 6a. Dash numbers across games

Speeds are multiples of each game's run speed; distances are in body lengths with the conversions of §2. SpeedRunner rows are proposals [I] built on [K].

| Game | Dash speed (x run) | Duration | Distance | Directions | Refill | Cooldown | Source |
|---|---|---|---|---|---|---|---|
| Celeste | 240 px/s, 2.67x | 0.15 s, 9 frames | 36 px = 3.3 BL | 8 | ground, bounce, crystal; 0.1 s lockout | 0.2 s | [V, S7] |
| Mega Man X | 3.5 px/f, 2.33x walk | unpublished frames | about 4.5 BL with the jump | forward | ground; X2 and X3 one air dash per jump | none | [V, S131, S16; U] |
| Hollow Knight | 20 u/s, 2.4x run | 0.25 s | 5 u, about 4 body heights | forward; down with Dashmaster | ground or wall | 0.6 s, 0.4 with Dashmaster | [V, S21, S49] |
| Dustforce | unpublished | unpublished | "a few character lengths" wall run | ground, air, down free | landing or a kill (air charge) | none published | [V, S43; U] |
| Neon White Godspeed | "tremendous force" | one shot | unpublished | forward | the card, 4 rounds | none | [V, S64; U] |
| Pizza Tower Mach | 6 to 20 units in four tiers | held | 20 frames to Mach 2 | forward | none, hold-to-charge | none | [V, S58] |
| SpeedRunner Sandbox dash | 1120 u/s, 2.67x | 150 ms, 18 active steps (19 from the press) | 168 u = 3.65 BL | 2 (toggle 4) | ground or one-way top; 100 ms lockout | 200 ms, 24 steps | [K; I] |
| SpeedRunner dash-slash (recommended) | 840 u/s, 2.0x | 100 to 150 ms, 12 to 18 steps | 84 to 126 u = 1.8 to 2.7 BL | forward | one per airtime; kill or pogo refunds | none; iai hold 200 ms | [K; I] |

### 6b. Crouch, slide and ground verbs

| Game | Verb | Hitbox change | Speed | Minimum or duration | Cancels | Source |
|---|---|---|---|---|---|---|
| Celeste | duck | 8x11 to 8x6 px, 55% | friction 500 px/s² | release; `CanUnDuck` tests Solid only | any launch clears it | [V, S7] |
| Celeste | duck-super (hyper) | ducking | x1.25 horizontal, x0.5 height | inside the 0.15 s dash | jump | [V, S7] |
| Super Mario 64 | crouch | 160 to 100 u, 62.5% | 0 | Z held | A gives a long jump in the first 30 frames of a crouch slide | [V, S9, S11] |
| Super Mario 64 | long jump | short hitbox | x1.5 forward capped 48; vy 30 (0.7 BL) | one press | landing eats A unless Z held | [V, S9, S11] |
| Super Mario 64 | dive | prone | +15 capped 48 (x1.47 from a run) | lands in a dive slide | A rolls out | [V, S9, S10] |
| Super Mario 64 | ground pound | short | hover 10 frames (110 u), then -50 u/f, forwardVel 0 | animation `loopEnd + 4` | none | [V, S10, S12] |
| Super Mario World | spin jump | spinning body | launch 6 to 8 units slower than the jump at the same run speed, 14 to 16% lower | one press | none | [V, S30; I] |
| Pizza Tower | crouch and slide | "shrink Peppino's hitbox" | crouch 4; slide keeps held speed | release stands at once | jump | [V, S59] |
| Pizza Tower | grab slide | low | sets 12 at once | 25 frames inactionable | dives off a ledge | [V, S59, S60] |
| Super Mario Odyssey | roll | low | 20 to 35 u/f; boost every 16 to 17 frames | 10 frames to stand | roll cancel at 9 frames after a boost | [V, S29] |
| Jump King | charged jump | none | vy -8.74 px/f x charge; 3.5 px/f sideways | 0.6 s to full, 2 to 36 steps | none; direction locked at release | [V, S44, S46, S47] |
| SpeedRunner | crouch and crawl | 20x46 to 20x26 u, 57% | 120 u/s | Down held; stand only if free | jump buffered 130 ms when pinned | [K; I] |
| SpeedRunner | slide | 20x26 u | keeps speed, friction 600 u/s²; 147 u from maxRun | 14 steps (117 ms) minimum | jump at any time; wall is a 100 ms stop | [K; I] |
| SpeedRunner | slide-jump | low arc | 546 x 622 u/s, the hyper's pair | one press | the jump itself | [K; S4 A5; I] |
| SpeedRunner | stomp | none | vy at least 700 u/s, vx kept | until landing | feeds the 230 u roll | [K; I] |

### 6c. Ropes and flight

| Game | Verb | Reach | Anchor | Release rule | Period or duration | Resource | Source |
|---|---|---|---|---|---|---|---|
| SpeedRunners | hook and swing | unpublished | overhead solids, fixed 45° | button up keeps velocity | unpublished | none | [V, S87, S88; U] |
| Bionic Commando | arm | about 2.5 tiles (NES) | overhead, three fixed angles | direction held gives a swing-jump | n/a | none | [V, S99, S125; U] |
| Worms | Ninja Rope | unpublished length | any terrain | release at will, fire again mid-air | retract changes radius | shots per turn | [V, S102, S104; U] |
| Spider-Man 2 | web swing | ray against buildings | real geometry, never the sky | keep velocity | gravity about 10x Earth | none | [V, S19, S106] |
| Terraria | Grappling Hook (first) | 18.75 tiles = 6.25 BL | any block | jump releases | launch 59 mph, pull 56, walk 15 | none | [V, S18] |
| Terraria | Lunar Hook | 34.375 tiles = 11.5 BL, 4 hooks | any block | jump releases | launch 92, pull 82 | none | [V, S18] |
| Ghostrunner | grapple | orbs only | designer-placed orbs | arrive and zip | n/a | none | [V, S108, S109; U] |
| Umihara Kawase | elastic line | about 104 px | most surfaces and fish | jump; spring load launches | force 2 x stretch, cap 60 | none | [V, S105, S110; U] |
| Spelunky 2 | rope | 6 tiles up or down (Classic 8) | thrown | climb off | n/a | consumable | [V, S111; U] |
| LittleBigPlanet 2 | Grappling Hook | unpublished | grabbable material only | R1 up or jump | stick reels in and out | none | [V, S92, S94; U] |
| Super Mario World | cape flight | 254 px = 16 tiles of climb | n/a | hold back to catch air | 80 frames of climb at 191 px/s | P-speed run-up | [V, S15] |
| Celeste | feather | n/a | n/a | time out or exit cap 140/-100 | 2 s at 140 to 190 px/s | the feather | [V, S7] |
| Jetpack Joyride | thrust | n/a | n/a | release falls | constant forward speed | none; vehicle until hit | [V, S112] |
| Doodle Jump | propeller, jetpack, rocket | about 1,200 : 2,900 : 6,500 points | n/a | time out | 1 : 2 : 4.5 ladder | the item | [V, S117; U] |
| SpeedRunner | ring hook | 300 u = 6.5 BL at 1700 u/s, 176 ms | rings only, radius 20 u, snap 30 u | button up, |v| capped 760 u/s; +jump adds vy -500 | 2.09 s at L = 276 u | none; not the same ring until landing | [K; V, S18; I] |

### 6d. Katana and attack verbs

Steps are 1/120 s. SpeedRunner rows build on [S4 D3] and [S4 D4]; the proposals are [I].

| Verb | Startup | Active | Recovery | Hitbox | I-frames | Cancels | Bounce or exit | Source |
|---|---|---|---|---|---|---|---|---|
| SpeedRunner slash (settled) | 2 | 4 | 6 | 50x40 u ahead | none | jump, any phase | vx untouched | [S4 D4] |
| SpeedRunner deflect (property) | 0 | 14-step window at 600 u/s point shots (10 crossing + 4 active), about 17 for a 14 u shot | 6 | the slash box | none | as the slash | shot returns at 1.5x | [I] |
| SpeedRunner pogo | 2 | up to 24 while held | 0; 12-step re-press | 40x50 u below the feet | none | landing or release | vy -830, 3.0 BL; refunds the dash-slash | [S4 D3; I] |
| SpeedRunner iai arm | 24 steps held to arm, 36 to full | n/a | n/a | n/a | n/a | tap still slashes at step 0 | n/a | [I] |
| SpeedRunner dash-slash | 2 | 12 to 18 | 6, air control locked | 154 to 196 x 40 u swept | projectiles only, active | jump in recovery; wall ends it | 840 u/s, exit 546 | [I] |
| Hollow Knight nail | n/a | `ATTACK_DURATION 0.35` s | `ATTACK_COOLDOWN 0.41` s (0.25 Quick Slash) | n/a | none | none | pogo `BOUNCE_VELOCITY 12`, 72% of jump, 0.25 s | [V, S21] |
| Ninja Gaiden II slash | n/a | n/a | 20 frames rooted on the ground | n/a | 1 s plus landing after damage | air slash keeps momentum | n/a | [V, S165] |
| Sekiro deflect | n/a | 12 frames default, 4 to 0 on spam | penalty clears after 30 frames | n/a | n/a | n/a | n/a | [V, S162] |
| Katana ZERO roll | n/a | "every 22 frames" | n/a | n/a | invulnerable (frames unpublished) | slash 10 frames after a c-roll, roll 12 later | n/a | [V, S154; U, S159] |
| Pizza Tower taunt | 0 | 20 frames frozen | 0, speed restored | whole body | parries anything in the window | none; random 0 to 10 frame skip | n/a | [V, S61] |
| Pizza Tower grab | 0 | 39 frames | bonk 19 frames into a wall | lunge | none | long jump, Mach cancel | sets 8, climbs to 10 | [V, S60] |
| Dustforce heavy | unpublished | unpublished | long, cancelable | n/a | none | dash timed, jump buffered, wall grab, ceiling run | hit refreshes dash and double jump | [V, S43; U] |

### 6e. Verb budgets per game

| Game | Action buttons (plus direction) | Verbs | Context inputs | Speedrun categories or rules | Source |
|---|---|---|---|---|---|
| N++ | 1 | jump, wall jump, wall slide, variable jump | direction into wall | one board, no tech categories | [V, S172] |
| Super Meat Boy | 2 | jump, run, wall slide, wall jump | run modifier | Any%, Dark World | [U] |
| Super Meat Boy Forever | 2 | jump, slide, dive, fast fall, punch | second button by state | n/a | [V, S180] |
| Celeste | 3 (+ Crouch Dash bind since 1.4) | jump, 8-way dash, climb, climb jump, wall jump, duck, super, hyper, wavedash, demodash | down + dash, grab hold | Any%, All Red Berries, 100%; DTS variable; no Dashless | [V, S7, S14, S27, S37] |
| Dustforce | one aerial action per jump plus attacks | dash, air dash, double jump, wall run, ceiling run, light, heavy | Up on a wall | SS ranks per level | [V, S43, S45; U] |
| Neon White | 3 | jump, fire, discard (dash, double jump, grapple, stomp, bomb) | card in hand | medals Bronze to Red; Ace needs a shortcut | [V, S64, S67] |
| Hollow Knight | 4 core | dash, double jump, pogo, wall cling, super dash | down + attack | Any%, 112%; charms | [V, S21; U] |
| Katana ZERO | 3 | slash, roll, slow time, throw, wall kick | deflect inside the slash | IGT board; Normal/Hard, Katana/Lab Swords filters | [V, S151, S153, S157] |
| Pizza Tower | 3 (jump, dash, grab) plus taunt | Mach run, grab, slide, dive, super jump, taunt parry | down by state, hold dash | Any%, 101%, P-ranks | [V, S58, S60, S61; U] |
| Fall Guys | 3 | jump, dive, grab | second jump press dives | none official | [V, S150, S137] |
| Getting Over It | analog pointer | hook, vault, pogo, windmill (discovered) | none | Any%, Snake% | [V, S118; U, S123] |
| Solipskier | one finger drawing | draw, lift to jump | none | score, not time | [V, S127] |
| Jetpack Joyride | 1 | thrust; vehicles remap it | none | distance | [V, S112] |
| Doodle Jump | tilt + 1 tap | steer, shoot; items swap | none | height | [V, S116] |
| Ultimate Chicken Horse | jump, sprint, dance; place between runs | run, jump, wall jump (sprint changes arc), place, rotate, flip | sprint + rotate flips | Challenge-mode fastest times | [V, S142, S147; U] |
| SpeedRunner today | 1 | run, jump, wall slide, wall jump, climb jump, roll (flip cosmetic) | hold into wall | one board per map | [K] |
| SpeedRunner recommended | 3 | the six above plus crouch, slide, slide-jump, stomp, mantle, slash, pogo, dash-slash, hook | Down, Up, hold, release, air or ground | Any% and No Katana as filters; a verb mask per map | [I] |

**What it means.** The dash table says the canon dashes at 2.3x to 2.7x run for 150 to 250 ms over 3 to 4 body lengths, and that the refill rule and the exit speed decide its character: Celeste refills on the ground with a 100 ms lockout and exits at two thirds, Hollow Knight refills on walls and exits at run speed, SpeedRunner caps the exit at the hyper's 546 u/s so every low-body jump, dash-jump and dash-slash shares one overspeed economy. The crouch table says three shipped games picked 55 to 63% of standing height and every launch clears the crouch, so 57% and "stand only if free" are canon. The rope table says the readable hooks fix their angle (Bionic Commando, SpeedRunners) or their anchors (Ghostrunner), that Terraria's 6.25 BL reach and 4x launch ratio are the only complete public numbers, and that a free pendulum at 6 BL reaches 762 u/s from a running entry and 1175 from a drop, which is why the release cap exists. The katana table says the deflect needs no state, because 50 u of box and 4 active steps against a 600 u/s shot is already a 14-step window (about 17 for a 14 u wide shot), and that the only lockouts runners accept are the ones they can switch off. The budget table says the ceiling is three buttons and about ten verbs, that every game above it sells its extra verbs as cards or power-ups, and that no board in the set bans a technique, only a kit [V, S7, S21, S9, S18, S19, S162, S165, S172, S173, S27, S28; K; I].

---

## 7. Combinations: a layered architecture for SpeedRunner (Canvas2D JavaScript, 120 Hz step)

All of this section is design proposal [I], built from the cited parts on the nine layers of Mechanics #1 [S4]. The SpeedRunner Verbs Sandbox (§8) plays it. One file, `PHYS` for the movement constants, a new `VERBS` table for the frame data, a `step(dt)` that reads inputs once, a verb state machine between input and movement, and a `TUNING` object the Sandbox exposes.

**Layers, bottom to top.**
1. **Fixed-step simulation and verb input.** The 1/120 s step, accumulator and interpolation as today, keys sampled once per step. New: three buttons (Jump, Katana, Dash) with press, held and release edges and a 16-step buffer decremented inside `step()`, Down and Up as modifiers, and the verb state machine with startup, active and recovery phases and a cancel table consulted before movement (H2, H3).
2. **Movement kit.** The `PHYS` numbers and every settled addition of #1 unchanged: corner correction 8 u, wall reach 7 u, the roll-jump hyper at 1.3x maxRun, the lift and jump boosts ([S4 A1 to A5]).
3. **Verb set.** The `VERBS` table as data, one row per verb; the resources (dash-slash charge, pogo, stamina and fuel for the kits) reset by one `onLand()`; the crouch hitbox swap with `canStand`; a pose id per verb state; the per-map `verbs` mask and pickups (A1 to A5, B1 to B5, C1, C3, D1, D4, D5, F1 to F4, G1).
4. **Collision and elements.** #1's solids, one-way tiles, movers, springs, timed blocks and switches plus the Verbs gym pieces: a 32 u corridor, a crate, hook rings with a 30 u snap, a turret and its 600 u/s shots, a spike-capped block and spike pit, a one-button corridor, a high ledge, a lip. The rope projection runs before the collision pass so a solid wins (C4, D1, D2).
5. **Enemies and projectiles on the level clock.** #1's patroller, bounce enemy and chaser plus the turret shot the slash reverses at 1.5x and the pogo targets, all on the integer level clock, all refunding the dash-slash when cut ([S4 D1 to D4], F1 to F3).
6. **Camera.** Unchanged from #1; the dash-slash's 840 u/s widens the forward focus toward 200 u ([S4 B3]).
7. **Animation and feedback.** The stick rig plus one pose per verb state (crouch, slide, stab, lunge, sheathe, hand plant, rope hang on the rope normal), a one-frame smear for every active verb, afterimages every 2 steps in a dash-slash, the kimono tint for a spent charge and a 2-step flash on refill, stamina and fuel bars for the kits, a 2 px rope and a glowing ring, never a world hitstop ([S4 B1, B2], F5).
8. **Audio.** #1's synth voices plus one per verb: a sheathe on arm, a 40 ms noise burst with a 1.2 to 2.4 kHz sweep on the dash-slash, an 1.8 kHz ping per kill or deflect, the jump triangle an octave lower for the pogo, a whoosh and click for the hook, a low noise for the slide ([S4 B4]).
9. **Race loop, leaderboard and trust.** #1's step timer, splits, instant restart, medals and friends board, with the input log at two bytes per run-length pair carrying the verb bits, `hash(VERBS + PHYS)` and the map state hash in the header, the validator re-simulating every verb, a verb set tag per time so one board filters Any% and No Katana, and the optional placed-trap chain keyed by map state ([S4 H1 to H5], G4, H4).

**Pseudocode.**

The verb frame data is a table in physics steps, beside `PHYS`, so the Sandbox edits it live and the validator hashes it:
```js
const VERBS = {                 // steps at 120 Hz; speeds in u/s; the recommended set first
  slash:     { startup: 2, active: 4,  recovery: 6,  cadence: 12, box: [50, 40], cancelInto: { jump: 'any' } },
  pogo:      { startup: 2, active: 24, recovery: 0,  cadence: 12, box: [40, 50], bounceVy: -830, cancelInto: { land: 'any' } },   // 'land' and 'stand' below are events, not buffered inputs
  dashSlash: { startup: 2, active: 12, activeFull: 18, recovery: 6, speed: 840, exit: 546, uses: 1,
               armSteps: 24, fullSteps: 36, iframes: 'projectiles', cancelInto: { jump: 'recovery', wall: 'any' } },
  slide:     { startup: 0, minSteps: 14, friction: 600, minSpeed: 280, box: [20, 26], cancelInto: { jump: 'any', stand: 'any' } },
  crouch:    { box: [20, 26], crawl: 120 },
  stomp:     { vyMin: 700 },
  mantle:    { reach: 16, vy: -300, vx: 200, steps: 12 },
  hook:      { angle: 45, speed: 1700, reach: 300, minLen: 90, pump: 900, capV: 760, hopVy: -500, buffer: 16, ringGrace: 10 },
  // comparison kits (off in "Recommended")
  dash:      { startup: 1, active: 18, recovery: 0, cooldown: 24, speed: 1120, exit: 546, uses: 1, refillLock: 12, dirs: 2 },
  doubleJump:{ vy: -705 }, glide: { fallMult: 0.25 }, climb: { speed: 210, stamina: 110, upCost: 45.45, stillCost: 10, jumpCost: 27.5, tired: 20 },   // points, Celeste's units
  wallRun:   { minVx: 300, rise: 92, steps: 30 }, dive: { startup: 14, vx: 600, prone: 30 }, pound: { fall: 1150, land: 18 },
  charged:   { maxHold: 72, mult: [0.6, 1.5] }, jetpack: { thrust: 3500, terminal: 600 }, slowTime: { scale: 0.3, meter: 1.0, refill: 1 / 3 },
};
```

The state machine runs once per step between input and movement. Dash-class verbs beat the jump on the same step, as Celeste's `NormalUpdate` does [V, S7]:
```js
function stepVerbs(g, k) {
  const p = g.player, S = p.verb;                      // S = { state, t, charge, armed, dashes, ... }
  for (const b of ['jump', 'katana', 'dash']) buf[b] = k.pressed[b] ? 16 : Math.max(0, buf[b] - 1);
  const next = STATES[S.state].update(g, k);          // returns a state name or null
  if (next && next !== S.state) { STATES[S.state].end?.(g); S.state = next; S.t = 0; STATES[next].begin?.(g, k); }
  S.t++;
}
const STATES = {
  normal: { update(g, k) {
    const p = g.player, air = !p.onGround, v = VERBS.dashSlash;
    // the iai hold: count held steps outside the pogo and hook states; arm at 24, full at 36, clear on any release
    if (k.katana) { p.charge++; if (p.charge >= v.armSteps) p.armed = true; } else if (k.katanaReleased && !p.armed) p.charge = 0;
    if (k.katanaReleased && p.armed && p.dashes > 0) return 'dashSlash';       // iai release (F4 -> F1), one per airtime
    if (k.katanaReleased) { p.armed = false; p.charge = 0; }
    if (buf.katana && air && k.up && ringInReach(g)) { buf.katana = 0; return 'hook'; }   // Up + Katana near a ring (D1)
    if (buf.katana && air && k.down)                 { buf.katana = 0; return 'pogo'; }   // Down + Katana in the air (F2)
    if (buf.katana)                                  { buf.katana = 0; return 'slash'; }  // the press always slashes (D4); the hold then arms
    if (k.down && !air && Math.abs(p.vx) >= VERBS.slide.minSpeed) return 'slide';
    if (k.down && !air)                              return 'crouch';
    if (k.down && air && !p.bounced && p.vy < VERBS.stomp.vyMin) p.vy = VERBS.stomp.vyMin; // stomp (B5); never inside a pogo bounce arc
    if (buf.jump && (p.coyote > 0 || p.wallMemory > 0)) { doJump(p); buf.jump = 0; }
    return null; } },
  pogo: { /* ... */ onBounce(p) { p.vy = VERBS.pogo.bounceVy; p.bounced = true; p.dashes = 1; p.wallJumpSame = false; } },
  dashSlash: {
    begin(g) { const p = g.player, v = VERBS.dashSlash; p.dashes--; p.active = p.charge >= v.fullSteps ? v.activeFull : v.active;
               p.vx = v.speed * p.facing; p.vy = 0; p.armed = false; p.charge = 0; },
    update(g, k) { const p = g.player, v = VERBS.dashSlash, ph = phase(p.verb.t, v.startup, p.active, v.recovery);
      if (ph === 'active') { p.vy = 0; p.vx = v.speed * p.facing; sweepSlash(g, p); }  // gravity off and speed held every active step; kills refund p.dashes
      if (ph === 'recovery' && buf.jump) { doJump(p); buf.jump = 0; return 'normal'; }
      if (p.wallDir) return 'normal';                                          // a wall ends it into the slide (wallDir is the previous step's, so the exit is one step late and that step still kills)
      return ph === 'done' ? 'normal' : null; },
    end(g) { const p = g.player; p.vx = Math.sign(p.vx) * Math.min(Math.abs(p.vx), VERBS.dashSlash.exit); } },
};
function onLand(p) { p.dashes = 1; p.wallJumpSame = false; p.stamina = VERBS.climb.stamina; p.bounced = false; }   // one code path, as RefillDash() [V, S7]
```

The cancel table is read by `phase()` and by every `cancelInto` lookup; a cancel is allowed when the current phase is listed:
```js
function phase(t, startup, active, recovery) {
  if (t < startup) return 'startup';
  if (t < startup + active) return 'active';
  if (t < startup + active + recovery) return 'recovery';
  return 'done';
}
function canCancel(verb, into, t) {                    // 'any' | a phase name | undefined
  const rule = VERBS[verb].cancelInto?.[into];
  return rule === 'any' || rule === phase(t, VERBS[verb].startup, VERBS[verb].active, VERBS[verb].recovery);
}
```

The pendulum is Fristrom's constraint [V, S19], run before the collision pass, with gravity symmetric while hooked:
```js
function stepHook(p, a, L, k, DT) {                    // a = ring centre, L = rope length fixed at attach, k = this step's keys
  p.vy += PHYS.gravity * DT;                           // no fallMult, no airDrag while hooked
  const rx = p.x - a.x, ry = p.y - a.y, r = Math.hypot(rx, ry) || 1;
  const tx = -ry / r, ty = rx / r;                     // the rope tangent (unit, perpendicular to the rope)
  const dir = (k.right - k.left) * Math.sign(tx || 1); // pump toward the held direction along the tangent
  p.vx += dir * tx * VERBS.hook.pump * DT; p.vy += dir * ty * VERBS.hook.pump * DT;
  let nx = p.x + p.vx * DT, ny = p.y + p.vy * DT;
  const dx = nx - a.x, dy = ny - a.y, d = Math.hypot(dx, dy);
  if (d > L) { nx = a.x + dx / d * L; ny = a.y + dy / d * L; }                 // project back onto the circle
  p.vx = (nx - p.x) / DT; p.vy = (ny - p.y) / DT;                              // velocity from the corrected move
  p.x = nx; p.y = ny;
}
function releaseHook(p) {
  const v = Math.hypot(p.vx, p.vy), cap = VERBS.hook.capV;                     // 760 u/s = 1.8x maxRun
  if (v > cap) { p.vx *= cap / v; p.vy *= cap / v; }
  if (buf.jump) { p.vy += VERBS.hook.hopVy; buf.jump = 0; }                    // the direction-release hop adds vy -500, as D1 says
}
```

The crouch is a hitbox swap with the feet fixed; standing tests solids only, Down on a one-way tile is a crouch, and a crouched body never enters the wall kit (C4):
```js
function setCrouch(p, on) {
  const h = on ? VERBS.crouch.box[1] : 46;
  if (!on && !canStand(p)) return false;             // pinned: keep crawling, try the 8 u sideways correction
  p.y += p.h - h; p.h = h;                             // feet stay where they are
  return true;
}
function canStand(p) {                                 // solids only, never one-way tiles (Celeste: CollideCheck<Solid>) [V, S7]
  for (let n = 0; n <= TUNING.cornerCorrect; n++)
    for (const s of (n ? [n, -n] : [0])) if (!collidesSolids({ x: p.x + s, y: p.y + p.h - 46, w: 20, h: 46 })) { p.x += s; return true; }
  return false;
}
function wallProbe(p) { return p.h < 46 ? 0 : probe2u(p); }                   // crouched: no stick, no wall jump
// one-way landing keeps the existing rule: vy > 0 and feet within 3 u of the top [K]; Down never drops through
```

The input log gains the verb bits as held bits in the Sandbox's byte order; the header binds the run to its tables:
```js
function logByte(k) {                                  // L R U D Jump Katana DashPress Climb: held bits, the Sandbox's order
  return (k.left) | (k.right << 1) | (k.up << 2) | (k.down << 3) |
         (k.jump << 4) | (k.katana << 5) | (k.dashPressed << 6) | (k.climb << 7);
}                                                      // a press is the edge of its held bit, read inside the step; a tap shorter
                                                       // than a step forces the bit on for that step, so no press bits are stored
function encodeInputs(log) {                           // (byte, varint run) pairs
  const out = []; let cur = log[0], run = 0;
  for (const b of log) { if (b === cur) { run++; continue; } out.push(cur); pushVarint(out, run); cur = b; run = 1; }
  out.push(cur); pushVarint(out, run);
  return new Uint8Array(out);                          // measured: 288 B per minute on the course, 343 to 448 on the gym [V, S3]
}
const header = { mapId, mapHash, physHash: hashPhys(PHYS), verbsHash: hashVerbs(VERBS), steps, splits };
// the validator replays with the same VERBS; a Sandbox-tuned table fails on verbsHash before any simulation
```

**Knobs.** The values the Sandbox exposes, with the current build's constants where they exist [K] and the settled value [I].

| Knob | Now | Proposed | Range | What it moves |
|---|---|---|---|---|
| `crouch.box` / `crouch.crawl` | none | 20x26 u / 120 u/s | 20 to 32 u / 60 to 200 u/s | what fits under a ceiling and how slowly |
| `slide.friction` / `slide.minSpeed` / `slide.minSteps` | none | 600 u/s² / 280 u/s / 14 steps | 300 to 1500 / 200 to 420 / 6 to 50 | slide length (147 u from maxRun) and when Down slides instead of crouching |
| slide-jump pair | roll-jump hyper 546 x 622 (#1) | same pair | 1.1 to 1.6x / 0.5 to 1.0 jumpVel | one low-body jump rule |
| `stomp.vyMin` | none | 700 u/s | 500 to 1150 | how much sooner a jump lands (about 150 ms) and whether it feeds the roll |
| `mantle.reach` / `mantle.vy` / `mantle.vx` | corner correction 8 u | 16 u / -300 / 200 for 12 steps | 8 to 23 u | which lips become steps |
| `slash` (settled) | duel only | 2 / 4 / 6 steps, 50x40 u | 60 to 160 ms | the deflect window follows (14 steps at 600 u/s for a point shot, about 17 for a 14 u one) |
| `pogo.box` / `pogo.bounceVy` | none | 40x50 u / -830 | 30 to 60 u / -600 to -900 | which spikes become steps, bounce height (3.0 BL) |
| `dashSlash.speed` / `active` / `exit` | none | 840 u/s / 12 to 18 steps / 546 | 1.5 to 2.67x / 8 to 24 / 1.0 to 1.6x | kill line length (1.8 to 2.7 BL) and the overspeed it leaves |
| `dashSlash.armSteps` / `fullSteps` | none | 24 / 36 | 12 to 48 | how long a hold costs before it pays |
| `hook.reach` / `capV` / `pump` | none | 300 u / 760 u/s / 900 u/s² | 150 to 450 / 546 to 1150 / 0 to 2700 | which rings are reachable, the fastest release, how much a swing can be pumped |
| turret shot speed | none | 600 u/s | 300 to 1200 | the effective deflect window (17 to 8 steps) |
| `dash.speed` / `active` / `dirs` (comparison) | none | 1120 u/s / 18 steps / 2 | 1.5 to 3x / 6 to 30 / 2, 4 | the dash tier of gaps (7 to 11 BL) |
| `doubleJump.vy` / `glide.fallMult` / `climb.speed` (kits) | none | -705 / 0.25 / 210 u/s | 0.5 to 1.0 jumpVel / 0.1 to 0.5 / 100 to 420 | the comparison kits |
| `charged.maxHold` / `jetpack.thrust` (kits) | none | 600 ms / 3500 u/s² | 200 to 1000 ms / 2500 to 5000 | height bought by standing still; the corridor's climb |
| `slowTime.scale` (unranked) | none | 0.3x, air only, 1.0 s meter | 0.1 to 0.5 | what a slowed world looks like with the clock on real steps |
| `verbs` mask per map | none | m1 to m4 as shipped; gym and SAMURAI TRIAL full | any subset | which boards the new verbs touch (none of the old ones) |
| log bytes per pair | 1 byte of 5 bits + run (#1) | 1 byte of 8 held bits + varint run | 1 or 2 | raw bytes per minute (288 measured on the course, 343 to 448 on the gym); the deflated size barely moves |

---

## 8. Reference implementation: the SpeedRunner Verbs Sandbox

`mechanics-speedrunner-verbs-sandbox.html` [S3] is one hand-written page of plain JavaScript, 169 KB with system fonts and no external assets, that starts as a copy of Mechanics #1's Sandbox and keeps all of it working: the 640x360 vector-ink canvas, the nine layers, the first course, the ghost, the validation panel, the friends board and the cost HUD [S4; V, S3]. It runs with zero console errors and no horizontal overflow at a 390 px viewport, has 106 buttons, each enabled one clicked once in the test, and the first course is unchanged: the #1 autopilot finishes it in 17.483 s as before with replay PASS [V, S3]. Its design choices are ours [I], every number is illustrative, and simulation numbers are in world units at a draw scale of 640/970 so constants copy back into the game. The builder's full list is the "As built" section of `notes/SANDBOX-SPEC.md`.

**The Verbs panel (layer 2b).** 19 verb toggles, each carrying its input and its numbers, plus 2 dash sub-toggles (four directions, dash-jump) and 2 disabled "figure only" buttons (slope drawing, place a block) [V, S3]. The verbs are built with the settled numbers of §7: crouch and crawl (20x26 u at 120 u/s, stands only when the 46 u box is free against solids, a pinned jump buffered 130 ms), crouch-slide (from 280 u/s, friction 600, 120 ms minimum, a wall is a 100 ms stand-up stop), slide-jump (546 x 622), stomp (vy 700), automatic mantle (wall top between the head and 16 u above it, feet snap up with vy -300 and vx 200 for 100 ms), pogo slash (40x50 u box under the feet, held up to 24 steps, bounce 830 with the apex band and the cut), iai dash-slash (armed at 200 ms of hold, full at 300, 2 startup, 12 to 18 active at 840 u/s with the 50x40 box tested every step, 6 recovery with air control locked, exit 546, projectile immunity, one per airtime refunded by a kill or a pogo, afterimages every 2 steps), ring hook (Up + Katana along the 45° ray within 300 u, 1700 u/s to attach, rings of radius 20 snapped within 30 u, rope fixed at the attach distance with a 90 u minimum, pump 900 u/s², release capped at 760 u/s, a Jump within 130 ms adding vy -500, the ring just left invalid until a landing), dash (1120 u/s for 150 ms, 1 frozen startup step, 200 ms cooldown, one charge refilled on a floor 100 ms or more after the start, exit 546, dash-jump 546 x 830 behind its sub-toggle), air dash (same, air only), double jump (0.85x, ground refill), dive (120 ms startup under gravity, 600 u/s lunge, vy clamped to 0, 250 ms prone unless the fall rolls), ground pound (maxFall with vx 0, 150 ms landing, breaks the crate), wall run (from 300 u/s, 92 u over 250 ms), climb with stamina (210 u/s up and 160 down on 110 stamina draining 45.45 per second and 27.5 per climb jump, red under 20%, refill on the ground), glide (0.25x terminal), jetpack corridor (thrust 3500 u/s², terminal 600, auto-scroll at maxRun, no fuel), charged jump (from a standstill for up to 600 ms, 0.6 to 1.5x jumpVel, 0.75x maxRun sideways, no air control) [V, S3]. The deflect lives on the slash: turret shots at 600 u/s (slider 300 to 1200) every 1.2 s are deflected by any active slash at 1.5x, and the parry stance stays only as the rejected comparison (120 ms window, 300 ms miss) [V, S3]. Every verb has a pose, afterimages where it moves, the rope and the hook ray, a stamina bar, a flame, one synth sound, and a card in the 9 new explain cards [V, S3].

**Presets.** "SpeedRunner today" (no verbs), "Recommended" (the report's final set: crouch and crawl, crouch-slide, slide-jump, stomp, mantle, pogo, iai dash-slash, ring hook), "Kitchen sink" (everything, the pound replacing the stomp), "Celeste kit" (four-way dash, climb, crouch), "Mario kit" (crouch, slide, slide-jump, pound, dive), "Runner kit" (jetpack corridor, glide, charged jump); a kit preset also selects the Verbs gym [V, S3].

**The Verbs gym.** A third map, 7000 u, 9 sections, each with a slower safe route, #1's course untouched: a 32 u low corridor 260 u long with a floating step as the slow route; a crate that is the floor over a tunnel under a 300 u wall, three steps as the slow route; a 300 u wall with a hanging wall facing it (wall jumps slow, wall run and climb fast); a 340 u gap (7.4 BL) with a ring on the 45° ray, a mover and a pit as the slow routes; a 400 u pit of two enemies on spikes with a spike-capped block and a ring above, a step and one-way tiles as the slow route; a turret that wakes within 700 u; a one-button corridor with floor and ceiling spikes; a 240 u ledge above a two-wall chimney for the charged jump; a 190 u lip whose top sits a few units above the head at the apex of a jump, with a one-way tile beside it, for the mantle [V, S3]. The chaser spawns at checkpoint 4 and never climbs a wall over 150 u [V, S3]. Autopilot times, playing every verb for coverage and the safe routes with perfect jumps, so not a fair race: no verbs 17.50 s, recommended 19.48 s, Celeste kit 19.42 s, Mario kit 19.11 s, Runner kit 19.63 s, kitchen sink 21.58 s; the verb routes cost the autopilot time because it demonstrates each verb where it fits, not where it pays, and a human comparison is still to do [V, S3; I].

**Input log, validation and the board.** One byte per step with eight held bits, left, right, up, down, jump, katana, dash press, climb; a press is the edge of its held bit taken inside the fixed step, a bit already held on the first step is not a press, a tap shorter than a step still counts because the one-shot flags force the bit on for that step; run-length encoded as (byte, varint run) pairs [V, S3]. Bytes per minute: the first course 288 (84 B over 17.48 s, against #1's 369 with separate press bits), the gym with no verbs 343, the recommended set 373, the kitchen sink 448, the air dash set 322 [V, S3]. Replay validation reported PASS on every test run, including a kitchen-sink run using 16 verbs and a second run using the other 3 (air dash, glide, stomp), 2,098 to 2,671 inputs re-simulated headless in 5 to 11 ms; two new checks are a hash of `PHYS`, the verb numbers and the verb toggles taken at the start and compared at the finish (a toggle flipped mid-run fails it), and a speed cap that follows the verb set (dash 1130, iai 850, dive 610, hook 1060 u/s) [V, S3]. The board stores the verb set as the run's category and shows it beside the name; a verb budget readout gives the buttons the current set needs and the verbs per button [V, S3].

**Cost HUD and controls.** Frame cost in live play 0.25 ms total: simulation 0.01, verbs 0.007, collision and elements 0.014, enemies 0.009, camera and animation 0.013, render 0.16 (solids 0.07, hero 0.07), UI 0.05, audio 0.005; restart in place 0.1 to 0.5 ms against 3,400 ms for the countdown replay [V, S3]. Keyboard as in §7 with C or K dash, Z or L climb, Down and Up as modifiers; touch gains a second row of verb buttons [V, S3].

**Deviations from this report, kept with the reason** [V, S3]. The ground pound fires on a neutral Down press in the air, and Down with a direction held is the stomp (or the pogo stance with the katana), otherwise the pogo is unreachable with the pound on. Climb goes up on its own while the climb button is held (Down climbs down), because Up is a jump key and a held Up would fire wall jumps. The hook has no 80 ms ray memory, no 130 ms press buffer, no any-ceiling mode and no zip fallback, and its rings sit over the gap and the pit, not on the tall wall, because a fixed-length rope cannot swing a body through the wall it is meant to clear. The dive's 120 ms startup keeps the current velocity under gravity, then lunges. The crouch has no 8 u sideways correction when pinned; the hero crawls until the box is free, and the crawl clears the low corridor, slower, so "the slide clears it and the crawl does not" is not built. The byte order is L R U D Jump Katana DashPress Climb with every press as an edge, which §7 and H4 now use (the report first proposed a two-byte `Jh Jp Kh Dp` layout); the header hash covers `PHYS`, the verb table and the toggles, and there is no map state hash because block placing is not built. Slow time and hitstop are not built (the sash flash stands in). The high ledge's slow route is a two-wall chimney. The camera clamp uses the map's lowest floor so the tunnel stays in view. The dash-slash kill box is the slash box ahead of the hero tested every active step, not a swept rectangle; at 840 u/s over 100 to 150 ms the steps cover the same 154 to 196 u.

**Simplifications (honest list)** [I]. One page plays client and server; validation re-simulates locally. The friends are seeded names. The gym is one hand-placed map, so its times are the autopilot's and its medals are ratios on the author's run. The rig is a simplified copy of the game's. The turret is the only projectile source. All figures are headless Chromium on an Apple M4 Pro; no phone was measured.

---

## 9. Gem findings

Licences and maturity figures come from the GitHub REST API (`license.spdx_id`, stars, `pushed_at`) on 13 Nov 2026, with LICENSE text read where GitHub reports `NOASSERTION` [V, S6]. Three traps: Celeste's `Player.cs` is MIT for the code only, and is the one gem repeated from #1 because its dash, duck, climb and state machine are this study's primary text [V, S8]; the Hollow Knight constants come from a modder's prefab mirror and a decompile, reading only [V, S21, S25]; half the fighting-game frame-data repos that model a `VERBS` table are GPL. Licences were read from LICENSE files on 13 Nov 2026. **Flags:** **Low** = MIT/BSD/Apache/CC0; **LGPL** = fine as a separate library; **Copyleft** = GPL/AGPL/CC BY-SA, study and re-implement; **None** = no licence, study only.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| Celeste Player.cs (StateMachine, Dash, Climb, Ducking) | https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs | MIT (code only, not assets) | 4,002 stars, archived Oct 2022 | 23 numbered states, the dash coroutine, super and hyper cancel rules, stamina costs, the duck hitbox swap | Low |
| CelesteTAS-EverestInterop | https://github.com/EverestAPI/CelesteTAS-EverestInterop | MIT | 85 stars, pushed Aug 2026 | `frames,actions` text input log, breakpoints, Read and Play commands; the text twin of the RLE log | Low |
| UniversalClassicTas | https://github.com/CelesteClassic/UniversalClassicTas | Zlib | 6 stars, Jan 2022 | TAS tooling for a PICO-8 Celeste, small enough to read whole | Low |
| Hollow Knight Modding API | https://github.com/hk-modding/api | MIT | 347 stars, pushed Jun 2026 | Hooks into HeroController; how a verb-toggle mod attaches | Low |
| HollowKnight.SkillUpgrades | https://github.com/flibber-hk/HollowKnight.SkillUpgrades | LGPL-2.1 | 7 stars, pushed Feb 2026 | A worked example of toggleable verb tweaks (dash, double jump) | LGPL |
| WeaverCore (Demo Player prefab) | https://github.com/nickc01/WeaverCore | MIT (check per file) | modding framework | The serialised HeroController fields: DASH_SPEED 20, DASH_TIME 0.25, BOUNCE_VELOCITY 12 | Low |
| Speedrun-Tricks-Visual-Helper | https://github.com/TheMulhima/Speedrun-Tricks-Visual-Helper | No LICENSE file | 1 star, 2021 | The idea of recolouring the hero when a verb is available | None |
| jump-king-parabole | https://github.com/qequ/jump-king-parabole | check LICENSE | small | `PlayerValues` constants: JUMP -8.74, SPEED 3.5, GRAVITY 0.257, CHARGE_TIME 0.6 | None (read LICENSE) |
| JumpKingPlus Workshop | https://github.com/JumpKingPlus/Workshop | check LICENSE | mod workshop | The Harmony patch that reproduces the linear charge | None (read LICENSE) |
| XState | https://github.com/statelyai/xstate | MIT | 30,458 stars, pushed Nov 2026 | Statechart vocabulary (hierarchical, parallel, history); too big to vendor | Low |
| javascript-state-machine | https://github.com/jakesgordon/javascript-state-machine | MIT | 8,746 stars, pushed Jun 2025 | A tiny FSM with enter and leave hooks | Low |
| robot | https://github.com/matthewp/robot | BSD-2-Clause | 2,204 stars, pushed Oct 2026 | A functional FSM in about 1 KB | Low |
| Game Programming Patterns, State | https://gameprogrammingpatterns.com/state.html ; https://github.com/munificent/game-programming-patterns | Text CC BY-NC-ND, code MIT | 4,578 stars | Enum against state objects, concurrent machines, the pushdown automaton | Copyleft (text), Low (code) |
| Matter.js | https://github.com/liabru/matter-js | MIT | 18,625 stars, pushed Sep 2026 | Constraint chains for a rope prototype; read, do not vendor | Low |
| Planck.js | https://github.com/piqnt/planck.js | MIT | 5,320 stars, pushed Oct 2026 | Box2D RopeJoint and DistanceJoint in JS | Low |
| verlet-js | https://github.com/subprotocol/verlet-js | Non-standard LICENSE (NOASSERTION) | 3,792 stars, last push Oct 2019 | Reading for a 30-line Verlet rope; stale | None (read LICENSE) |
| RopePlatformingPrototype | https://github.com/amongfiish/RopePlatformingPrototype | No LICENSE file | 0 stars, Jun 2025 | An Umihara Kawase style rope prototype, reading only | None |
| sfx-framedata | https://github.com/avivace/sfx-framedata | MIT | 8 stars, Jan 2023 | JSON frame data per move (startup, active, recovery) as the `VERBS` schema model | Low |
| FAT (Frame Assistant Tool) | https://github.com/D4RKONION/FAT | GPL-3.0 | 86 stars, pushed Oct 2026 | A frame data app and its data files, reading only | Copyleft |
| input-overlay (OBS) | https://github.com/univrsal/input-overlay | GPL-2.0 | 4,286 stars, pushed Nov 2026 | A stream input display; build the in-game strip by hand | Copyleft |
| dustmaker | https://github.com/msg555/dustmaker | Apache-2.0 | 7 stars, May 2024 | The Dustforce level and replay reader | Low |
| SMWDisX | https://github.com/IsoFrieze/SMWDisX | No LICENSE file | disassembly | The SMW jump table `DATA_00D2BD` and the cape routines, reading only | None |
| SM64 decompilation | https://github.com/n64decomp/sm64 | No LICENSE (Nintendo code) | 7,000+ stars | `ACT_LONG_JUMP`, `ACT_DIVE`, `act_ground_pound`, the hitbox flag, reading only | None |
| Berbank Green, One-Button Games | https://www.gamedeveloper.com/design/one-button-games | Article | Game Developer, 2 Jun 2005 | The 8 loadings of two actions on one button | None (article) |
| Celeste v1.4.0.0 changelog | https://maddymakesgamesinc.itch.io/celeste/devlog/237097/v1400-changelog | Devlog | 29 Mar 2021 | The Crouch Dash bind, Press and Hold modes, Advanced Directionals | None (devlog) |

---

## 10. Learnings and anti-patterns

1. **Spend verbs on context before buttons.** Three buttons and a direction carry fifteen verbs through tap, hold, release, Down, Up, air and ground [V, S175, S173, S7]. Anti-pattern: Celeste's crouch dash, a chord for three years before its bind [V, S14].
2. **Keep the dash out of the vertical axis.** Two directions, as Mega Man X, Hollow Knight and Godspeed do; the eight-way dash's author wishes it were four [V, S16, S50, S64, S33]. Anti-pattern: an up-dash that turns a 13 BL chimney into two wall jumps [K; I].
3. **Cap every exit at one overspeed ceiling.** Dash, dash-slash, slide-jump and roll-jump hyper leave at 546 u/s and bleed at 500 u/s² [K; S4 A5; I]. Anti-pattern: Celeste's 0.67 exit ratio in a game whose decay is four times slower [V, S7; I].
4. **Refill on the ground, never on walls, never within 100 ms of the spend.** `DashRefillCooldown 0.1`, ground-only `RefillDash()` [V, S7]. Anti-pattern: Hollow Knight's wall refill, which makes chimneys skips [V, S50; I].
5. **A crouch is a hitbox swap with the feet fixed and a refusal to stand under solids only.** 55 to 63% across Celeste and SM64 [V, S7, S9]. Anti-pattern: Down as drop-through on a maze of one-way tiles [K; I].
6. **One low-body jump rule.** SM64's long jump and Celeste's duck-super are one idea; the slide-jump reuses the hyper's pair [V, S9, S7; I]. Anti-pattern: Pizza Tower's 25-frame inactionable grab slide, a bonk hazard by its own wiki [V, S59].
7. **Down in the air is a fast fall, not a hover.** SM64's 10-frame hover aims in 3D [V, S10]. Anti-pattern: a 100 ms hang on a clock [I].
8. **Mantle automatically; never hang on a lip.** Celeste's climb hop at 1.14x jump speed [V, S7]. Anti-pattern: Spelunky's grab-and-climb as the fix for a lip death at 420 u/s [U, S111; I].
9. **Fix the rope's angle or its anchors.** Bionic Commando's three angles, SpeedRunners' 45°, Ghostrunner's orbs [V, S99, S87, S108]. Anti-pattern: a free-aim rope on maps built for wall jumps [K; I].
10. **Project the pendulum, then cap the release.** Three lines and a 1.8x cap, because a drop-in reaches 1175 u/s [V, S19; K; I]. Anti-pattern: an elastic line whose tension a 10% alpha ghost cannot show [V, S110; I].
11. **The slash is the parry.** Any shot inside the active box turns around; the window is active steps plus box depth over shot speed [V, S152; I]. Anti-pattern: a 300 ms whiff lockout, 2.7 BL without control [V, S165; I].
12. **Hitstop is a tax; the smear is free.** Katana ZERO's runners set hitpause to 0% [V, S158]. Anti-pattern: a 50 ms world freeze on every dash in a game ranked on real steps [I].
13. **Rank on real steps; slow time only as an unranked toggle.** Superhot's two boards, Katana ZERO's IGT [V, S169, S157]. Anti-pattern: a world-time clock under which the fastest line holds slow motion forever [I].
14. **Put the kit in the map, not in the player.** Mario Maker, Neon White and LBP hand the verb and take it back; boards ban a kit (Luigi), never a technique [V, S69, S64, S94, S28, S38]. Anti-pattern: a global dash that voids four boards on the day it ships [K; I].

---

## 11. "See it in action" index

| # | Game | Verb idea | URL |
|---|---|---|---|
| 1 | Celeste | Dash 240 px/s for 0.15 s, ground refill with a 0.1 s lockout, 0.2 s cooldown | https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs |
| 2 | Celeste | Duck hitbox 8x6, `CanUnDuck` against solids only, duck-super x1.25 | https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs |
| 3 | Celeste | Climb stamina 110, 45.45 per second, climb hop at 1.14x jump | https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs |
| 4 | Celeste | Crouch Dash bind with Press and Hold modes, v1.4.0.0 | https://maddymakesgamesinc.itch.io/celeste/devlog/237097/v1400-changelog |
| 5 | Celeste | Thorson on four dash directions, ACMI 2025 | https://explosionnetwork.com/?p=119685 |
| 6 | Celeste | No Dashless category, the DTS variable | https://www.speedrun.com/posts/9kg7h |
| 7 | Mega Man X | Dash 3.5 px per frame carried through the jump | https://tasvideos.org/GameResources/SNES/MegaManX/Data |
| 8 | Mega Man Zero | Dash-slash, air slash, down thrust on one button | https://almarsguides.com/retro/walkthroughs/GBA/games/MegamanZero/Misc/Controls/ |
| 9 | Hollow Knight | DASH_SPEED 20, DASH_TIME 0.25, BOUNCE_VELOCITY 12 | https://github.com/nickc01/WeaverCore/blob/0b713e0e0791b42649d8cfe9c8191c737ec7a7aa/WeaverCore.Editor/Assets/Prefabs/Demo%20Player.prefab |
| 10 | Hollow Knight | Nail-bouncing on spikes and enemies | https://hollowknight.wiki/w/Nail-bouncing |
| 11 | Dustforce | Air charge: one air jump or air dash, refilled by landing or a kill | https://axebps-redlib.hf.space/r/dustforce/wiki/terms |
| 12 | Dustforce | Heavy attack cancels, jump buffered and dash timed | https://www.gamedeveloper.com/design/speed-cleaning-an-analysis-of-dustforce |
| 13 | Super Mario 64 | Long jump x1.5, backflip 62, dive +15, from the decompilation | https://github.com/n64decomp/sm64/blob/master/src/game/mario.c |
| 14 | Super Mario 64 | Ground pound hover and -50 fall | https://github.com/n64decomp/sm64/blob/master/src/game/mario_actions_airborne.c |
| 15 | Super Mario World | Spin jump 6 to 8 units slower in the jump table | https://github.com/IsoFrieze/SMWDisX/blob/master/bank_00.asm |
| 16 | Super Mario World | Cape flight, 80-frame takeoff meter | https://tasvideos.org/GameResources/SNES/SuperMarioWorld |
| 17 | Super Mario Maker 2 | Power-ups as kits per style | https://www.mariowiki.com/Super_Mario_Maker_2 |
| 18 | Super Mario Maker 2 | Clear board bans Luigi, not power-ups | https://www.speedrun.com/api/v1/games/smm2/categories |
| 19 | Super Mario Maker | Making feels like playing (Tezuka, Miyamoto) | https://time.com/4030885/super-mario-maker-nintendo-wii-u |
| 20 | Super Mario Odyssey | Roll boosts every 16 to 17 frames | https://smo.wiki/Roll |
| 21 | Sonic Mania | Drop dash, 20 frames to charge, 8 to 12 px per frame | https://info.sonicretro.org/Drop_Dash |
| 22 | Pizza Tower | Mach ladder, 20 frames to Mach 2 | https://pizzatowerspeedrunning.wiki.gg/wiki/Speed_(Simplified) |
| 23 | Pizza Tower | Slide keeps speed, grab slide 25 frames | https://pizzatowerspeedrunning.wiki.gg/wiki/Slide |
| 24 | Pizza Tower | Taunt as a 20-frame parry | https://pizzatowerspeedrunning.wiki.gg/wiki/Taunt |
| 25 | Neon White | Cards: fire verb plus one-shot movement discard | https://www.thegamer.com/neon-white-soul-cards-tips-tricks-guide/ |
| 26 | Neon White | Shortcut rules and the Ace medal | https://www.gamedeveloper.com/road-to-igf-2023/-neon-white-and-designing-for-player-creativity |
| 27 | SpeedRunners | The hook as a race verb, no aim | https://www.gamesradar.com/haste-hatred-and-grappling-hooks-you-should-be-playing-speedrunners |
| 28 | SpeedRunners | Eight pickups against the opponent | https://speedrunners.wiki.gg/wiki/Pickups |
| 29 | Bionic Commando | No jump, three arm angles, kept in Rearmed | https://www.gamedeveloper.com/game-platforms/interview-grin-s-viklund-on-rearming-capcom-s-i-bionic-commando-i- |
| 30 | Worms | Ninja Rope as a pendulum, pump and retract | https://www.tus-wa.com/?msg=279397 |
| 31 | Spider-Man 2 | Fristrom's swing constraint and 10x gravity | https://code.tutsplus.com/swinging-physics-for-player-movement-as-seen-in-spider-man-2-and-energy-hook--gamedev-8782t |
| 32 | Terraria | Hook reach, launch and pull table | https://terraria.wiki.gg/wiki/Hooks |
| 33 | Ghostrunner | Hook orbs, Blink, counters for runners | https://shacknews.com/article/118609/ghostrunner-devs-plan-to-offer-more-support-and-modes-for-speedrunners |
| 34 | Umihara Kawase | Elastic line, rocket jumps | https://tasvideos.org/GameResources/SNES/UmiharaKawase/Physics |
| 35 | Spelunky 2 | Placed 6-tile rope, ledge grab | https://spelunky.fandom.com/wiki/Spelunky_2:Rope |
| 36 | LittleBigPlanet 2 | Grappling Hook with a reel | https://gematsu.com/2010/09/new-littlebigplanet-2-trailer-shows-off-grappling-hook |
| 37 | LittleBigPlanet 3 | Toggle's size switch, Boost Boots, Hook Hat | https://primagames.com/featured/littlebigplanet-3-beginners-tips-toggle-swoop-blink-ball |
| 38 | LittleBigPlanet | Popit: one input from runner to builder | https://primagames.com/eguides/little-big-planet-3-signature-series-strategy-guide/welcome-to-the-popit-academy/popit-cursor |
| 39 | Jetpack Joyride | One touch, vehicles remap it until a hit | https://en.wikipedia.org/wiki/Jetpack_Joyride |
| 40 | Jetpack Joyride | Two gadget slots, Gravity Belt, Air Barrys | https://www.halfbrick.com/blog/in-depth-jetpack-joyride-gadgets |
| 41 | Doodle Jump | Tilt, shoot, items at 1 : 2 : 4.5 | https://www.gamerevolution.com/guides/56951-doodle-jump-how-much-points-you-get-with-special-items |
| 42 | Getting Over It | Cursor hammer, one analog verb | https://en.wikipedia.org/wiki/Getting_Over_It_with_Bennett_Foddy |
| 43 | Getting Over It | Sexy Hiking and QWOP lineage | https://gamedeveloper.com/design/how-b-games-influenced-the-design-of-i-getting-over-it-i- |
| 44 | Jump King | CHARGE_TIME 0.6 s, linear charge, JUMP -8.74 | https://github.com/qequ/jump-king-parabole/blob/main/src/JumpParabola.cs |
| 45 | Solipskier | Draw the slope, lift to jump | https://en.wikipedia.org/wiki/Solipskier |
| 46 | Tiny Wings | Hold to drop, hills for speed | https://en.wikipedia.org/wiki/Tiny_Wings |
| 47 | Line Rider | Draw, then play | https://en.wikipedia.org/wiki/Line_Rider |
| 48 | Fall Guys | Dive, grab, 80 percent skill | https://gamesbeat.com/fall-guys-ultimate-knockout-how-mediatonic-crafted-a-cute-battle-royale/ |
| 49 | Fall Guys | Controls: Space, Ctrl dive, Shift grab | https://shacknews.com/article/119827/fall-guys-ultimate-knockout-controls-and-keybindings |
| 50 | Cat Mario (Syobon Action) | Run and jump only; the one-frame wall clip | https://tasvideos.org/Forum/Posts/287303 |
| 51 | Ultimate Chicken Horse | Placement Timer 5 to 60 s, rules and modifiers | https://cleverendeavourgames.freshdesk.com/support/solutions/articles/32000028991-custom-rules-and-presets |
| 52 | Ultimate Chicken Horse | Rotate and flip since 1.6.040, True Random 1.13.13 | https://www.cleverendeavourgames.com/changelog |
| 53 | Katana ZERO | Deflect inside the slash, iaijutsu | https://katanazero.wiki.gg/wiki/Zero |
| 54 | Katana ZERO | Hitpause 0% in the gold-medal guide | https://speedrun.com/katana_zero/guide/xgaqg |
| 55 | Sekiro | 12-frame deflect that shrinks on spam | https://sekiroshadowsdietwice.wiki.fextralife.com/Deflection |
| 56 | Ninja Gaiden II | 20-frame rooted slash | https://kb.speeddemosarchive.com/Ninja_Gaiden_II:_The_Dark_Sword_of_Chaos/Game_Mechanics |
| 57 | Shovel Knight | Bounce equals jump height | https://yachtclubgames.com/blog/plague-knight-mobility-design |
| 58 | Superhot | Two boards, game time and real time | https://www.speedrun.com/superhot/forums/az93t |
| 59 | Mirror's Edge | Wall boost, kick platform for 3 frames | https://kb.speeddemosarchive.com/Mirror%27s_Edge |
| 60 | N++ | One button, "your vertical velocity determines jump height" | https://www.thumbsticks.com/gdc-2016-the-secret-to-nplusplus-level-design/ |
| 61 | Super Meat Boy Forever | Two buttons, the slide that is a dive and a fast fall | https://www.pcgamesinsider.biz/indie-interview/66238/we-wanted-it-to-have-two-buttons-and-still-feel-and-play-like-super-meat-boy/ |
| 62 | Ori | Bash windup 20 frames, the firsty refill hole | https://kb.speeddemosarchive.com/Ori/Techniques_and_Glitches |
| 63 | Rayman Legends | Hover and air-kick stall | https://www.speedrun.com/rayman_legends/guide/qcfu4 |
| 64 | Dead Cells (mobile) | Auto-Hit, one verb made automatic | https://playdigious.com/sharpen-your-thumbs-dead-cells-is-now-slaying-foes-on-android |

---

## 12. What remains unverified (and corrections)

**Corrections made during research** (checked in the verification note and the gap note)
1. **Thorson's four-direction remark.** The ACMI event of 6 Oct 2025 is confirmed by the venue; the remark rests on one recap, so A2 says so and rates Evidence 4 [V, S34; U, S33].
2. **Celeste's Crouch Dash bind.** Confirmed by the v1.4.0.0 changelog, 29 Mar 2021, Press and Hold modes; press that says "1.04" is wrong and is not cited [V, S14].
3. **Hollow Knight's constants.** Recovered from a modder's serialised prefab and the decompile: DASH_SPEED 20 for DASH_TIME 0.25 (5 u, about 4 body heights), cooldown 0.6 and 0.4, BOUNCE_VELOCITY 12 (72% of the 16.65 jump), ATTACK 0.35 and cooldown 0.41, Quick Slash a 30% cut rather than the snippet's 32% [V, S21, S25]. Used in A1, A3, A4, B5, C4, F2 and 6a to 6d; the shipped prefab and the fixed step length stay open.
4. **Jump King's charge.** Note 05 called 0.6 s memory; two mod repos quote `CHARGE_TIME 0.6`, a linear intensity, `JUMP -8.742858`, `SPEED 3.5`, `GRAVITY 0.2571429`, 2 to 36 steps; the derived maximum is 148.6 px = 5.7 body heights at a 34-frame apex [V, S44, S46, S47; I]. D5 and 6b use it; the "angles" are three launch options.
5. **The SMW spin jump.** The SMWDisX jump table gives (normal, spin) pairs by speed bucket, the spin 6 to 8 units slower and 14 to 16% lower, a P-speed spin out-launching a standing jump [V, S30; I]. B6 uses it; the 1/16 px unit and the 3-per-frame held gravity are assumptions.
6. **Mega Man X.** Walk 1.5, dash 3.5, jump 5.0 px per frame, gravity 0.25, terminal 5.75, so the dash is 2.33x and the jump 50 px = 3.1 tiles; the dash duration is unpublished [V, S131; U]. A1 and 6a say 2.33x.
7. **Umihara Kawase.** The TAS page gives 4 out and 8 back, about 104 px maximum, force 2 x stretch capped at 60, marked work in progress with "per second" probably per frame [V, S105; U]. D3 and 6c quote it with the caveat.
8. **UCH placement.** The timer dates from July 2016 "to avoid the Mexican stand-off"; rotate and flip from 1.6.040 (4 Mar 2019); end-zone fixes in 1.6.050 and 1.6.061; the 5 to 60 s range and 5-point 12-round default remain snippets [V, S101, S147; U, S146]. G4 cites the blog and changelog.
9. **SMM2 rules.** The API confirms "Luigi and starting from a checkpoint are not allowed" on Clear and a Luigi Assist variable on Story Mode; no power-up variable exists, which G1 and H4 state as an absence [V, S28]. The 15-tag official list is unconfirmed; 9 names are attested [U, S85].
10. **Fall Guys.** Patch facts only: obstacle grabbing removed in Slime Climb (1.06), dive-grabbing tails and an auto ledge grab for new players (1.08, 2022), the auto-grab fix (1.29); PC keys Space, Ctrl, Shift [V, S155, S150; U]. Dive distance and recovery remain [U].
11. **Katana ZERO.** The IL rule (IGT to two decimals from the results screen) and the "every 22 frames" roll cadence with the 10 and 12 frame c-roll loop were recovered as a board rule and a snippet [V, S63; U, S159].
12. **Sandbox spec and the Sandbox as built.** This report changes the spec's start values (dash 2.67x and two directions, double jump ground refill only, crouch 20x26 u and 120 u/s, slide at 280 u/s with 600 u/s² and a 120 ms minimum, dive 600 u/s with 250 ms prone, pound without a hang, mantle automatic, wall run 92 u over 250 ms at 300 u/s, climb 210 u/s, hook as Up + Katana at 45° to rings with a 760 u/s cap, glide 0.25 x maxFall, jetpack 3500 u/s² with no fuel, charged jump 0.6 to 1.5 x jumpVel while still, pogo bounce 830, the parry rejected for the deflect property, the dash-slash as the iai release, slow time unranked and air only, the two-byte log); the dated list is at the end of `SANDBOX-SPEC.md`. The built Sandbox then deviated, and §8 lists each with its reason [V, S3]: the pound fires on a neutral Down and a directional Down is the stomp; the climb auto-ascends while held because Up is a jump key; the hook has no ray memory, press buffer, any-ceiling mode or zip and the tall wall has no ring; the log is one byte of eight held bits in the order L R U D Jump Katana DashPress Climb with presses as edges, 288 B per minute on the course, which §7 and H4 now use in place of the two-byte `Jh Jp Kh Dp` layout, and the header hash has no map state because block placing is not built; slow time and hitstop are not built; the crawl clears the low corridor; the high ledge's slow route is a two-wall chimney; the dash-slash tests the slash box per step rather than a swept rectangle.

**Corrections from the figures** (two figure agents ported the §7 pseudocode onto the game's movement code and ran it)
1. The pendulum period at L = 276 u and g = 2500 is 2π sqrt(L/g) = 2.09 s, not 0.66 s (a π was dropped), and a quarter swing is about 520 ms, not 165; D1, §1 and 6c now say so, and the 165 ms "forgiveness scale" remark is gone.
2. A 90° drop-in reaches sqrt(2 x 2500 x 276) = 1175 u/s, not 1250 (1250 would need L = 312 u); the conclusion, above maxFall and so a release cap, stands. D1, §1, §6 and §10 corrected.
3. `STATES.normal` now consumes `buf.katana` when the hook, pogo or slash fires; before, the buffer stayed positive up to 16 steps and a 12-step slash re-fired on its first step back.
4. `p.armed` is now set: held katana steps are counted outside the pogo and hook states, `armed` at 24, cleared on release.
5. The dash-slash transition now requires `p.dashes > 0`, so one per airtime is enforced in code, not only in prose.
6. The dash-slash holds `vy = 0` and its speed on every active step, so the line is flat as the dash's; F1 says so.
7. `stepHook` now receives `k` and `DT` and pumps along the rope tangent toward the held direction; the horizontal pump did nothing at the bottom of the swing and `tangentSign` was undefined.
8. `releaseHook` adds vy -500 (`p.vy += hopVy`) as D1 says, instead of `Math.min`, which gave a rising body nothing.
9. The stomp is exempt during a pogo bounce arc (a `bounced` flag, cleared by `onLand()`); ported literally, a held Down cancelled every bounce into a 700 u/s fall. B5 states the rule.
10. The press always slashes and the hold then arms; F4's prose reads that way now, matching 6d's "tap still slashes at step 0".
11. The slide-jump pair 546 x 622 covers about 241 u = 5.2 BL (0.249 s up, 0.193 s down), less than the plain jump's 248 u, so it is faster across a gap, not longer; B2 says so and §8's gym list no longer puts it among the wide-gap verbs.
12. The input byte keeps held bits only, `L R U D Jump Katana DashPress Climb`, in the Sandbox's order, with every press as an edge; the earlier two-byte layout kept a jump-press bit that cost one extra pair per jump. §1, H4, §7's `logByte`, `encodeInputs` and the knob row, §8 and §12 item 12 agree.
13. The 14-step deflect window assumes a point shot; the Sandbox's 14 u wide shot adds about 3 steps, so about 17; F3, 6d, §6, §13 and the knob table say both.
14. E3's rocket now flies 1.5 s at 2700 u/s (4050 u) against the jetpack's 2 s at 900 u/s (1800 u) and the propeller's 900 u, the 1 : 2 : 4.5 points ladder; the earlier numbers gave the jetpack and the rocket the same 2000 u.
15. Stamina is in Celeste's points everywhere: 110, draining 45.45 per second, 10 still, 27.5 per climb jump, tired below 20; C3, `VERBS.climb` and `onLand()` no longer mix seconds, fractions and points.
16. B4's "the 20x26 u body horizontal" is now "the 20x26 u box with a prone pose"; the box stays 20 wide, as `crouch.box` says.
17. The plain dash's 1 startup step makes a 19-step read from press to end on a replay; A1 and 6a say "18 active steps (19 from the press)".
18. The 248 u = 5.4 BL jump gap is the analytic arc; the stepped simulation lands at 246 to 248 u by launch step, which §1 and A1 now state.
19. The dash-slash's wall exit reads `wallDir` from the previous step, so it ends one step after contact and that step still kills; a comment in §7 says so.
20. `canStand` tested the offset 0 twice at n = 0; fixed. `VERBS.slide.minSteps 14` is 117 ms against the prose's "120 ms"; B2 and 6b say 14 steps (117 ms).
21. `cancelInto.land` and `cancelInto.stand` are events, not buffered inputs; a comment in `VERBS` says so.
22. C1's mantle fires in practice through the hold-toward clause, since a jump rises under 200 u/s only near its apex; the sentence is added.

**Single-source and derived values.** The dash-gap arithmetic (545 u, 11.8 BL) and the pendulum energies (762 and 1175 u/s) and the 2.09 s period derive from `PHYS` [K; I]. Terraria's body-length conversion assumes a 3-tile player [V, S18; I]. Hollow Knight's 1.25 u body comes from the prefab's collider, not re-checked [U]. The Doodle Jump ladder is points, not pixels [V, S117; I]. The deflect window is arithmetic on D4's box and an assumed 600 u/s shot [I]. Every §8 figure is the builder's measurement on one desktop machine [V, S3]; the gym's autopilot times are coverage runs, not a route comparison [I].

**Still unverified [U]**
- Katana ZERO's roll i-frames and distance, slow-motion scale, meter and refill, and slash frames; only the roll cadence survives, from a snippet.
- Every Ghostrunner number (dash length, Sensory Boost scale and meter, Blink range, Tempest cooldown); the one mirror found returned 404.
- Fall Guys' dive distance and height, jump height and grab hold duration.
- Doodle Jump's item heights, durations and tilt sensitivity; the points ladder stands in.
- SpeedRunners' hook speed, arc, reach and release boost, the item roll rule and the boost meter's fill.
- Worms' default rope length and retract rate (worms2d.info blocked); the 16 px per frame cap is a quoted forum number.
- Mega Man X's dash duration in frames and the X2 and X3 air dash distance.
- SMW's spin-jump enemy-bounce speed and cape dive-bomb table; the 1/16 px unit and 3 per frame gravity assumptions.
- SMM2's complete official tag list; UCH's default placement timer, pieces per Party Box and snap grid.
- Umihara Kawase's rates, from a work-in-progress TAS page, probably per frame.
- Hollow Knight's shipped prefab and fixed step; Ori's dash, glide and bash speeds; Rayman's hover fall speed; Dustforce's dash speed, frames and attack frames; Pizza Tower's crouch hitbox and super jump frames; Mirror's Edge mantle timings; Spelunky's ledge-grab frames.
- Fall Guys' dive feel, LBP2's hook controls and reel speed, Jetpack Joyride's per-vehicle controls, Lakitu's Cloud despawn time and Getting Over It's pot mass and joint are play memory where stated.
- Whether Katana ZERO's IGT counts slowed seconds as real seconds; Braid's timing conventions.
- No phone, gamepad, Firefox or Safari run was measured; the Sandbox figures are desktop Chromium.

---

## 13. Prototype roadmap for SpeedRunner: a ranked backlog

Impact is 1 to 5 for the game's feel and its race loop. Cost is S (about a day), M (about a week) or L (several weeks), scored 1, 2, 3. Score is Impact divided by Cost. Author judgement [I].

| Rank | Change | Profiles | Impact | Cost | Score | Why |
|---|---|---|---|---|---|---|
| 1 | The Down verbs: crouch 20x26 u, slide at 280 u/s with 600 u/s² friction, slide-jump at the hyper's pair, stomp at 700 u/s | B1, B2, B5, C4 | 5 | S | 5.0 | Four verbs for one hitbox swap, one constant and two poses; fits every map today  |
| 2 | Automatic mantle when a wall top sits within 16 u above the head | C1 | 4 | S | 4.0 | Kills the lip death A2 named at 420 u/s for about 30 lines, no input  |
| 3 | The verb mask per map header and the pickup element | G1 | 4 | S | 4.0 | Keeps m1 to m4's boards valid on the day any verb ships  |
| 4 | Pogo slash: Down + Katana in the air, 40x50 u, bounce 830, spikes as steps | F2 | 4 | S | 4.0 | The katana's first job in a run; reuses D4's box and D3's bounce  |
| 5 | Deflect as a property of the slash, a turret, shot speed on a slider | F3 | 3 | S | 3.0 | A 14 to 17-step window for free; the rejected parry stays rejected  |
| 6 | `VERBS` table, state machine with phases and the cancel table, `onLand()` as the only resource reset | H3 | 5 | M | 2.5 | Every later verb becomes a data row; the validator hashes the table  |
| 7 | Iai dash-slash: hold 200 ms, release at 840 u/s for 12 to 18 steps, exit 546, one per airtime, kill refunds | F1, F4, A3, A5 | 5 | M | 2.5 | The recommended set's ceiling; enemies on the fast line  |
| 8 | Two-byte input log with verb bits, `verbsHash` in the header, Any% and No Katana as board filters | H4 | 4 | M | 2.0 | The ghost, the share link and the anti-cheat survive the new verbs  |
| 9 | Ring hook: Up + Katana, 45°, rings only, reach 300 u, cap 760 u/s, the zip as fallback | D1, D2 | 4 | M | 2.0 | A swing without re-tuning four maps; SAMURAI TRIAL's signature  |
| 10 | SAMURAI TRIAL as the first verb map, authored with rings, a low corridor, a spike floor and a turret | G1, F2, D1 | 4 | M | 2.0 | The locked card becomes the place the kit is for  |
| 11 | Comparison kits in the Sandbox only: dash, double jump, climb, wall run, glide, charged jump, dive, pound, jetpack | A1, A4, C2, C3, A6, D4, D5, B4 | 3 | M | 1.5 | Playtesters feel why each stayed out before anyone argues  |
| 12 | Verb poses, smears, afterimages, kimono tint and one synth voice per verb | F5, H2 | 3 | M | 1.5 | The iai hold and the dash-slash have no shape without them  |
| 13 | Place one block then race: the async trap chain, map state hashes, author on death, 12-trap cap | G4, E5 | 4 | L | 1.3 | A reason to replay a cleared map; UCH at a table of five, async  |
| 14 | Neon White cards: one-shot dash or double jump as a pickup, the medal ladder as a verb ladder | G2 | 3 | L | 1.0 | Only after the mask, the table and a verb map exist  |

**The first four weeks.** Week one is ranks 1 to 3, the Down verbs, the mantle and the verb mask, with the four boards untouched and a death heatmap before and after on m1. Week two is ranks 4 and 5 and half of rank 6, the pogo, the deflect and the turret on the `VERBS` table they run on. Week three finishes rank 6 and builds rank 8, the state machine, the cancel table, the two-byte log and the hash check, with a CI determinism test replaying an all-verbs run. Week four is rank 7, the iai dash-slash, with its poses and sounds pulled forward from rank 12, and a playtest night on the gym; the hook, SAMURAI TRIAL, the kits and the trap chain follow, each with a Sandbox toggle before a map [I].

---

## 14. Sources

Numbered for [S#] references, all from research notes 00 to 10 of this study. "Snippet" means the page returned 402 or 403 to the fetcher and only its search snippet was read. Code and docs were read on 13 Nov 2026.

**Series and Kingsfoil**
1. Kingsfoil Artifacts library: https://kingsfoil-artifacts.netlify.app
2. SpeedRunner, live build, bundle read 13 Nov 2026: https://speedrunner-tau.vercel.app/
3. SpeedRunner Verbs Sandbox: `mechanics-speedrunner-verbs-sandbox.html` (companion page)
4. Mechanics #1, SpeedRunner mechanics: https://kingsfoil-artifacts.netlify.app/mechanics-speedrunner.html
5. Curves #1 Hearthguard and the Curves glossary: https://kingsfoil-artifacts.netlify.app/curves-hearthguard.html
6. Research notes 00 to 10 of this study (verification, current build, dash and air verbs, ground and body verbs, ropes and vehicles, physics-input verbs, kits and items, placing and sabotage, katana and time verbs, budget and gems, gap verification): `studies/mechanics-speedrunner-verbs/notes/`

**Primary code and data**
7. Celeste `Player.cs` (NoelFB/Celeste, MIT): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
8. NoelFB/Celeste README and licence note: https://github.com/NoelFB/Celeste
9. Super Mario 64 decompilation, `mario.c`: https://github.com/n64decomp/sm64/blob/master/src/game/mario.c
10. Super Mario 64 decompilation, `mario_actions_airborne.c`: https://github.com/n64decomp/sm64/blob/master/src/game/mario_actions_airborne.c
11. Super Mario 64 decompilation, `mario_actions_moving.c`: https://github.com/n64decomp/sm64/blob/master/src/game/mario_actions_moving.c
12. Super Mario 64 decompilation, `mario_actions_stationary.c`: https://github.com/n64decomp/sm64/blob/master/src/game/mario_actions_stationary.c
13. Super Mario 64 decompilation, `mario_step.c`: https://github.com/n64decomp/sm64/blob/master/src/game/mario_step.c
14. Celeste v1.4.0.0 changelog (Crouch Dash bind, 29 Mar 2021): https://maddymakesgamesinc.itch.io/celeste/devlog/237097/v1400-changelog
15. TASVideos, Super Mario World game resources (speeds, takeoff meter): https://tasvideos.org/GameResources/SNES/SuperMarioWorld
16. TASVideos, Mega Man X game resources: https://tasvideos.org/GameResources/SNES/MegaManX
17. TASVideos forum post 434799 (X dash 3.5 px per frame, Ride Armor): https://tasvideos.org/Forum/Posts/434799
18. Terraria Wiki (wiki.gg), Hooks: https://terraria.wiki.gg/wiki/Hooks
19. Fristrom, Swinging Physics for Player Movement (Spider-Man 2 and Energy Hook): https://code.tutsplus.com/swinging-physics-for-player-movement-as-seen-in-spider-man-2-and-energy-hook--gamedev-8782t
20. CelesteTAS-EverestInterop (MIT) and `Docs/Commands.md`: https://github.com/EverestAPI/CelesteTAS-EverestInterop
21. WeaverCore Demo Player prefab (HeroController fields serialised): https://github.com/nickc01/WeaverCore/blob/0b713e0e0791b42649d8cfe9c8191c737ec7a7aa/WeaverCore.Editor/Assets/Prefabs/Demo%20Player.prefab
22. TASVideos, BizHawk .bk2 movie format: https://tasvideos.org/Bizhawk/BK2Format
23. TASVideos, Syobon Action TAS submission thread (post 287303): https://tasvideos.org/Forum/Posts/287303
24. TASVideos forum, Dustforce DX notes (post 369448): https://tasvideos.org/Forum/Posts/369448
25. Decompiled `HeroController.cs` (Hollow Knight 1.5 mirror): https://github.com/AminSedaghaty/HK-Source/blob/f516282143970c48bcb25b695489ec0855b3b837/CSharp/HeroController.cs
26. dustapi documentation (Dustforce DX scripting): https://dustapi.readthedocs.io/en/latest/
27. speedrun.com API, Celeste categories and the DTS variable: https://www.speedrun.com/api/v1/games/celeste/categories
28. speedrun.com API, Super Mario Maker 2 categories and variables (Clear rules, Luigi Assist): https://www.speedrun.com/api/v1/games/smm2/categories?embed=variables
29. SMO wiki, Roll (Super Mario Odyssey): https://smo.wiki/Roll
30. SMWDisX disassembly, `bank_00.asm` (`CODE_00D630`, `DATA_00D2BD`): https://github.com/IsoFrieze/SMWDisX/blob/master/bank_00.asm
31. smw-src (SMW disassembly, no licence): https://github.com/galaxyhaxz/smw-src
32. Nystrom, Game Programming Patterns, State: https://gameprogrammingpatterns.com/state.html

**Celeste, the dash and its speed tech**
33. Explosion Network, Celeste: In Conversation with Maddy Thorson and Noel Berry, ACMI MIGW, 6 Oct 2025 (recap): https://explosionnetwork.com/?p=119685
34. ACMI, Celeste: In Conversation (event listing): https://www.acmi.net.au/whats-on/migw-2025/celeste-in-conversation/
35. Vice, How Celeste found success in embracing speedrunners who broke the game (18 Feb 2021): https://www.vice.com/en/article/how-celeste-found-success-in-embracing-speedrunners-who-broke-the-game/
36. Aftermath, Celeste speedrun history (updated 27 Oct 2025): https://aftermath.site/celeste-speedrun-gdq-any-history-of-speedrunning.md
37. speedrun.com Celeste forum, new categories thread (Dashless rejected): https://www.speedrun.com/posts/9kg7h
38. speedrun.com Celeste forum, dashless category discussion: https://www.speedrun.com/posts/zsk2a
39. speedrun.com, Celeste 1.4 Binding Changes Explanation (403; title and summary): https://www.speedrun.com/celeste/guide/02hpu
40. speedrun.com, Why can't I get wave dash to work?: https://www.speedrun.com/posts/41mls
41. speedrun.com Celeste forum, Is binding a demo button to be your main dash allowed?: https://speedrun.com/celeste/forums/wl3tl
42. Thorson, Celeste and TowerFall Physics (redirect confirmed, not fetched): http://maddymakesgames.com/articles/celeste_and_towerfall_physics/

**Dustforce, Mega Man X, Hollow Knight, Jump King, Ori, Rayman, Sonic, Pizza Tower**
43. r/dustforce wiki, Mechanics, Tricks and Terminology (redlib mirror): https://axebps-redlib.hf.space/r/dustforce/wiki/terms
44. jump-king-parabole, `JumpParabola.cs` (constants from `JumpKing.PlayerValues`): https://github.com/qequ/jump-king-parabole/blob/main/src/JumpParabola.cs
45. Bycer, Speed Cleaning: an analysis of Dustforce (Game Developer, 25 Feb 2012): https://www.gamedeveloper.com/design/speed-cleaning-an-analysis-of-dustforce
46. Jump King Subframe Charge mod, `ChargeQuantizer.cs`: https://github.com/anyalink99/jump-king-mods/blob/main/mods/subframe-charge/src/ChargeQuantizer.cs
47. JumpKingPlus Workshop, `JumpChargeCalc.cs` (Harmony patch on `JumpState`): https://github.com/JumpKingPlus/Workshop/blob/master/WorkshopPlus/JumpKingJumpArch/Models/JumpChargeCalc.cs
48. Wikipedia, Dustforce: https://en.wikipedia.org/wiki/Dustforce
49. Rogue Ranker, Dashmaster guide (cooldown 0.6 to 0.4 s): https://rogueranker.com/dashmaster-hollow-knight/
50. Hollow Knight Wiki, Mothwing Cloak (403; snippet): https://hollowknight.wiki/w/Mothwing_Cloak
51. Hollow Knight Wiki, Monarch Wings (403; snippet): https://hollowknight.wiki/w/Monarch_Wings
52. Hollow Knight Wiki, Nail-bouncing (403; snippet): https://hollowknight.wiki/w/Nail-bouncing
53. SDA knowledge base, Ori Techniques and Glitches: https://kb.speeddemosarchive.com/Ori/Techniques_and_Glitches
54. Xbox Wire, gamescom 2014 Ori preview: https://news.xbox.com/en-us/2014/08/14/gamescom-ori-preview/
55. speedrun.com, Rayman Legends Basic Movement Tutorial Series: https://www.speedrun.com/rayman_legends/guide/qcfu4
56. Sonic Physics Guide, Special Abilities (Anubis wall; snippets): https://info.sonicretro.org/SPG:Special_Abilities
57. Sonic Retro, Drop Dash: https://info.sonicretro.org/Drop_Dash
58. Pizza Tower speedrunning wiki, Speed (Simplified): https://pizzatowerspeedrunning.wiki.gg/wiki/Speed_(Simplified)
59. Pizza Tower speedrunning wiki, Slide: https://pizzatowerspeedrunning.wiki.gg/wiki/Slide
60. Pizza Tower speedrunning wiki, Grab (revision of 16 Jul 2023): https://pizzatowerspeedrunning.wiki.gg/wiki/Grab
61. Pizza Tower speedrunning wiki, Taunt: https://pizzatowerspeedrunning.wiki.gg/wiki/Taunt
62. Game Developer, How speedy implementation shaped Pizza Tower: https://www.gamedeveloper.com/design/how-speedy-implementation-high-paced-platformer-pizza-tower
63. speedrun.com API, Katana ZERO categories and variables (IL timing rule): https://www.speedrun.com/api/v1/games/katana_zero/categories?embed=variables

**Neon White**
64. TheGamer, Neon White Soul Cards guide (card table, ammo): https://www.thegamer.com/neon-white-soul-cards-tips-tricks-guide/
65. Game Developer, Road to IGF 2023, Neon White and designing for player creativity: https://www.gamedeveloper.com/road-to-igf-2023/-neon-white-and-designing-for-player-creativity
66. Game Informer, How a Neon White level is made (25 Nov 2022): https://gameinformer.com/feature/2022/11/25/how-a-neon-white-level-is-made
67. Vice, Neon White's developers being too good at their own game caused real problems: https://www.vice.com/en/article/neon-whites-developers-being-too-good-at-their-own-game-caused-real-problems
68. Wikipedia, Neon White: https://en.wikipedia.org/wiki/Neon_White

**Mario: World, Maker, 64, Odyssey, Bros. 2**
69. Super Mario Wiki, Super Mario Maker 2 (power-ups per style, Course World): https://www.mariowiki.com/Super_Mario_Maker_2
70. Super Mario Wiki, Spin Jump: https://www.mariowiki.com/Spin_Jump
71. Super Mario Wiki, P-Meter: https://www.mariowiki.com/P_Meter
72. Wikibooks, Super Mario World/Caped status: https://en.wikibooks.org/wiki/Super_Mario_World/Caped_status
73. Super Mario Wiki, Cat Mario: https://www.mariowiki.com/Cat_Mario
74. Super Mario Wiki, Ninji Speedruns: https://www.mariowiki.com/Ninji_Speedruns
75. Super Mario Wiki, Lakitu's Cloud: https://www.mariowiki.com/Lakitu%27s_Cloud
76. Super Mario Wiki, Clear Pipe: https://www.mariowiki.com/Clear_Pipe
77. Super Mario Wiki, ON/OFF Switch: https://www.mariowiki.com/ON/OFF_Switch
78. Super Mario Wiki, P Switch: https://www.mariowiki.com/P_Switch
79. Super Mario Wiki, Key: https://www.mariowiki.com/Key
80. Super Mario Wiki, Power Squat Jump (SMB2 charged jump; snippet): https://www.mariowiki.com/Power_Squat_Jump
81. Ukikipedia, Long Jump (Cloudflare challenge; see-it only): https://ukikipedia.net/wiki/Long_Jump
82. TIME, Super Mario Maker interview with Miyamoto and Tezuka (11 Sep 2015): https://time.com/4030885/super-mario-maker-nintendo-wii-u
83. Canadian Press via iNFOnews, Nintendo wants the DIY design of Super Mario Maker 2 to feel like play (2019): https://infonews.ca/news/343779/nintendo-wants-diy-design-aspect-of-super-mario-maker-2-to-feel-like-play
84. Super Mario Wiki, Mario Kart 8 item probability distributions: https://www.mariowiki.com/Mario_Kart_8_item_probability_distributions
85. Vice, 20 second gauntlets of death are the hottest trend in Mario Maker levels (tags written by Nintendo): https://www.vice.com/en/article/20-second-gauntlets-of-death-are-the-hottest-trend-in-mario-maker-levels/
86. Wikipedia, Mario Royale: https://en.wikipedia.org/wiki/Mario_Royale

**Ropes, hooks, vehicles and items**
87. Wikipedia, SpeedRunners: https://en.wikipedia.org/wiki/SpeedRunners
88. Steam store, SpeedRunners: https://store.steampowered.com/app/207140/SpeedRunners/
89. GamesRadar, Haste, hatred and grappling hooks: you should be playing SpeedRunners (2013): https://www.gamesradar.com/haste-hatred-and-grappling-hooks-you-should-be-playing-speedrunners
90. SpeedRunners Wiki (wiki.gg), Pickups: https://speedrunners.wiki.gg/wiki/Pickups
91. LittleBigPlanet Wiki, Grappling Hook (402; snippet): https://littlebigplanet.fandom.com/wiki/Grappling_Hook
92. SuperCheats, LittleBigPlanet 2 Gripple Grapple guide: https://www.supercheats.com/guides/littlebigplanet-2/gripple-grapple
93. Gematsu, New LittleBigPlanet 2 trailer shows off grappling hook (Sep 2010): https://gematsu.com/2010/09/new-littlebigplanet-2-trailer-shows-off-grappling-hook
94. LittleBigPlanet Wiki, Character Enhancements (402; snippets): https://littlebigplanet.fandom.com/wiki/Character_Enhancements
95. PlayStation Blog, Everything you need to know about LittleBigPlanet 3 (24 Nov 2014): https://blog.playstation.com/archive/2014/11/24/everything-need-know-littlebigplanet-3-week
96. Prima Games, LittleBigPlanet 3 beginner tips: Toggle, Swoop, Blink Ball: https://primagames.com/featured/littlebigplanet-3-beginners-tips-toggle-swoop-blink-ball
97. Wikipedia, LittleBigPlanet 2: https://en.wikipedia.org/wiki/LittleBigPlanet_2
98. Wikipedia, LittleBigPlanet 3: https://en.wikipedia.org/wiki/LittleBigPlanet_3
99. Game Developer, Interview: GRIN's Viklund on rearming Capcom's Bionic Commando: https://www.gamedeveloper.com/game-platforms/interview-grin-s-viklund-on-rearming-capcom-s-i-bionic-commando-i-
100. Engadget, Interview: Capcom's Rey Jimenez on Bionic Commando Rearmed 2 (Jun 2010): https://engadget.com/2010/06/17/interview-capcoms-rey-jimenez-on-bionic-commando-rearmed-2
101. Clever Endeavour Games blog, New placement timer, bug tracking and summer sale results (7 Jul 2016): https://www.cleverendeavourgames.com/blog/2016/7/7/new-placement-timer-bug-tracking-and-summer-sale-results
102. TUS forum, rope physics thread ("It's simply a pendulum"): https://www.tus-wa.com/?msg=279397
103. PC Gamer, Why I Love: the grappling hook: https://www.pcgamer.com/uk/why-i-love-the-grappling-hook
104. Worms Knowledge Base, RubberWorm (Explorer09): https://worms2d.info/User:Explorer09/RubberWorm
105. TASVideos, Umihara Kawase physics (work in progress): https://tasvideos.org/GameResources/SNES/UmiharaKawase/Physics
106. Thumbsticks, Fristrom on Spider-Man 2's swing (GDC 2019 write-up): https://www.thumbsticks.com/bruce-campbell-players-swing-spider-man-2/
107. GDC Vault, Classic Game Design Postmortem: Swinging with Spider-Man (2019): https://gdcvault.com/play/1025725/Classic-Game-Design-Postmortem-Swinging
108. Kotaku, Ghostrunner review (2020): https://kotaku.com/ghostrunner-is-actually-the-fall-s-sharpest-cyberpunk-g-1845917183
109. GamesRadar, Ghostrunner has some amazing traversal skills: https://gamesradar.com/ghostrunner-has-some-amazing-traversal-skills-for-exploring-its-cyberpunk-city
110. Wikipedia, Umihara Kawase: https://en.wikipedia.org/wiki/Umihara_Kawase
111. Spelunky Wiki, Spelunky 2: Rope (402; snippet): https://spelunky.fandom.com/wiki/Spelunky_2:Rope
112. Wikipedia, Jetpack Joyride: https://en.wikipedia.org/wiki/Jetpack_Joyride
113. Halfbrick blog, In depth: Jetpack Joyride gadgets: https://www.halfbrick.com/blog/in-depth-jetpack-joyride-gadgets
114. Top Tier Tactics, Get Good: Jetpack Joyride gadgets and gear: https://toptiertactics.com/?p=17687
115. GDC Vault, Depth in Simplicity: The Making of Jetpack Joyride: https://www.gdcvault.com/play/1015527/Depth-in-Simplicity-The-Making
116. Wikipedia, Doodle Jump: https://en.wikipedia.org/wiki/Doodle_Jump
117. GameRevolution, Doodle Jump: how many points you get with special items (403; snippet): https://www.gamerevolution.com/guides/56951-doodle-jump-how-much-points-you-get-with-special-items

**Physics-input games and the party games**
118. Wikipedia, Getting Over It with Bennett Foddy: https://en.wikipedia.org/wiki/Getting_Over_It_with_Bennett_Foddy
119. Game Developer, How B-games influenced the design of Getting Over It: https://gamedeveloper.com/design/how-b-games-influenced-the-design-of-i-getting-over-it-i-
120. Game Developer, Designer interview: the aesthetics of frustration in Getting Over It: https://www.gamedeveloper.com/design/designer-interview-the-aesthetics-of-frustration-in-i-getting-over-it-i-
121. Google Design, Design Notes episode 7, Bennett Foddy (Mar 2018): https://design.google/library/bennett-foddy-getting-over-it-interview
122. itch.io post, Godot Getting Over It clone constants (snippet): https://itch.io/post/14305571
123. speedrun.com, Getting Over It forum, Snake% rule (403; snippet): https://www.speedrun.com/goiwbf/forums/bty9q
124. Wikipedia, Jump King: https://en.wikipedia.org/wiki/Jump_King
125. Critical Gaming, Bionic Commando Rearmed review (Sep 2008): https://critical-gaming.squarespace.com/blog/2008/9/9/bionic-commando-rearmed-review.html
126. Steam store, Pogostuck: Rage With Your Friends: https://store.steampowered.com/app/688130/Pogostuck_Rage_With_Your_Friends/
127. Wikipedia, Solipskier: https://en.wikipedia.org/wiki/Solipskier
128. Wikipedia, Tiny Wings: https://en.wikipedia.org/wiki/Tiny_Wings
129. Wikipedia, Alto's Adventure: https://en.wikipedia.org/wiki/Alto%27s_Adventure
130. Wikipedia, Line Rider: https://en.wikipedia.org/wiki/Line_Rider
131. TASVideos, Mega Man X data (speeds, RAM addresses): https://tasvideos.org/GameResources/SNES/MegaManX/Data
132. dev.to, Building Flappy Bird in React canvas (gravity, impulse, pipe spacing): https://dev.to/shaishav_patel_271fdcd61a/building-flappy-bird-in-react-canvas-raf-physics-gravity-pipe-generation-and-speed-25fd
133. GamesBeat, Fall Guys: Ultimate Knockout, how Mediatonic crafted a cute battle royale (Walsh, Tanton): https://gamesbeat.com/fall-guys-ultimate-knockout-how-mediatonic-crafted-a-cute-battle-royale/
134. GamesRadar, Mediatonic interview on Fall Guys: https://www.gamesradar.com/fall-guys-interview
135. GamesRadar, How to dive in Fall Guys: https://www.gamesradar.com/how-to-dive-in-fall-guys-ps4-pc
136. Android Central, Fall Guys: how to dive and push: https://www.androidcentral.com/fall-guys-ultimate-knockout-how-dive-and-push
137. Epic Games help, Why am I diving when I double jump in Fall Guys (403; title only): https://www.epicgames.com/help/en-US/c-Category_FallGuys/c-FallGuys_Gameplay/why-am-i-diving-when-i-double-jump-in-fall-guys-a000091536
138. GamesRadar, King of the castle: the story behind Fall Guys: https://gamesradar.com/king-of-the-castle-the-story-behind-the-server-smashing-success-of-fall-guys
139. Wikipedia, Fall Guys: https://en.wikipedia.org/wiki/Fall_Guys
140. Wikipedia, Syobon Action: https://en.wikipedia.org/wiki/Syobon_Action
141. speedrun.com, Syobon Action (403; categories from snippet): https://www.speedrun.com/syobonaction

**Builders, placing and curation**
142. Clever Endeavour Games support, Custom rules and presets: https://cleverendeavourgames.freshdesk.com/support/solutions/articles/32000028991-custom-rules-and-presets
143. Clever Endeavour Games blog, Free Play mode, snapshot sharing, more (27 Oct 2016): https://cleverendeavourgames.com/blog/2016/10/27/free-play-mode-snapshot-sharing-more
144. Clever Endeavour Games blog, Ultimate Mario Maker Chicken Horse (Aug 2019): https://cleverendeavourgames.com/blog/2019/8/19/ultimate-mario-maker-chicken-horse
145. Ultimate Chicken Horse fan wiki, Custom Levels (402; snippet): https://ultimate-chicken-horse.fandom.com/wiki/Custom_Levels
146. Ultimate Chicken Horse fan wiki, Rules (402; snippet): https://ultimate-chicken-horse.fandom.com/wiki/Rules
147. Clever Endeavour Games, Ultimate Chicken Horse change log: https://www.cleverendeavourgames.com/changelog
148. Trackmania documentation, What is a Track Of The Day: https://doc.trackmania.com/play/what-is-totd/
149. Trackmania documentation, Weekly Shorts mapping guidelines: https://doc.trackmania.com/create/map-review/weekly-shorts-guidelines/
150. Shacknews, Fall Guys: Ultimate Knockout controls and keybindings: https://shacknews.com/article/119827/fall-guys-ultimate-knockout-controls-and-keybindings

**Katana, attack and time verbs**
151. Wikipedia, Katana Zero: https://en.wikipedia.org/wiki/Katana_Zero
152. Katana ZERO wiki (wiki.gg), Zero: https://katanazero.wiki.gg/wiki/Zero
153. MagicGameWorld, Katana ZERO PC keyboard controls: https://www.magicgameworld.com/?p=32394
154. Prima Games via Bleeding Cool, Katana ZERO preview: https://primagames.com/featured/katana-zero-preview-bleeding-cool
155. Nintendo Life, Fall Guys gets an update, here are the full patch notes (Jul 2022): https://www.nintendolife.com/news/2022/07/fall-guys-gets-an-update-here-are-the-full-patch-notes
156. PC Gamer, Katana Zero adds hard mode and speedrun mode: https://www.pcgamer.com/katana-zero-adds-hard-mode-speedrun-mode-in-latest-update
157. speedrun.com, Katana ZERO board and the IGT thread: https://www.speedrun.com/katana_zero ; https://www.speedrun.com/post/rjao9
158. speedrun.com, A Comprehensive Guide to Golden Ending Speedruns in Katana ZERO (hitpause 0%; snippet): https://speedrun.com/katana_zero/guide/xgaqg
159. speedrun.com, Katana ZERO Moving techniques in the game (403; snippet): https://www.speedrun.com/katana_zero/guide/akw9e
160. Shacknews, Ghostrunner devs plan to offer more support and modes for speedrunners (13 Jun 2020): https://shacknews.com/article/118609/ghostrunner-devs-plan-to-offer-more-support-and-modes-for-speedrunners
161. speedrun.com, Ghostrunner board and beginner guide (403; snippet): https://www.speedrun.com/ghostrunner
162. Fextralife Sekiro wiki, Deflection: https://sekiroshadowsdietwice.wiki.fextralife.com/Deflection
163. Yacht Club Games, Plague Knight mobility design: https://yachtclubgames.com/blog/plague-knight-mobility-design
164. Almar's Guides, Mega Man Zero controls: https://almarsguides.com/retro/walkthroughs/GBA/games/MegamanZero/Misc/Controls/
165. Speed Demos Archive KB, Ninja Gaiden II game mechanics: https://kb.speeddemosarchive.com/Ninja_Gaiden_II:_The_Dark_Sword_of_Chaos/Game_Mechanics
166. Wikipedia, Samurai Gunn: https://en.wikipedia.org/wiki/Samurai_Gunn
167. Mechanics of Magic, Mechanics and Dynamics of Nidhogg: https://mechanicsofmagic.com/?p=173
168. Games Horizon, Sclash designer Bastien Bernand interview: https://gameshorizon.com/gh-picks/sclash-game-designer-bastien-bernand-exclusive-interview/
169. Wikipedia, Superhot: https://en.wikipedia.org/wiki/Superhot
170. speedrun.com Superhot forum, IGT discussion: https://www.speedrun.com/superhot/forums/az93t
171. Other Strangeness, the origins of the Helicopter game: https://otherstrangeness.com/?p=55

**Theory, inputs and ports**
172. Thumbsticks, GDC 2016: the secret to N++ level design: https://www.thumbsticks.com/gdc-2016-the-secret-to-nplusplus-level-design/
173. Crawford, The Art of Interactive Design (Ludoscience entry): https://ludoscience.com/EN/ressources/bibliographie/801-The-Art-of-Interactive-Design.html
174. Anthropy and Clark, A Game Design Vocabulary, ch. 2 Verbs and Objects: https://www.oreilly.com/library/view/a-game-design/9780133155181/ch02.html
175. Berbank Green, One-Button Games (Game Developer, 2 Jun 2005): https://www.gamedeveloper.com/design/one-button-games
176. Playdigious, Sharpen your thumbs: Dead Cells is now slaying foes on Android: https://playdigious.com/sharpen-your-thumbs-dead-cells-is-now-slaying-foes-on-android
177. Mirror's Edge Wiki, Speedrunning: https://mirrorsedge.fandom.com/wiki/Speedrunning
178. SDA knowledge base, Mirror's Edge: https://kb.speeddemosarchive.com/Mirror%27s_Edge
179. Prima Games, LittleBigPlanet 3 guide, Popit Academy, Popit cursor: https://primagames.com/eguides/little-big-planet-3-signature-series-strategy-guide/welcome-to-the-popit-academy/popit-cursor
180. PCGamesInsider, We wanted it to have two buttons and still feel like Super Meat Boy (Forever): https://www.pcgamesinsider.biz/indie-interview/66238/we-wanted-it-to-have-two-buttons-and-still-feel-and-play-like-super-meat-boy/
181. Metanet Software blog, happy 15th Metanet Software inc: https://www.metanetsoftware.com/2019/happy-15th-metanet-software-inc

**Gems (code and references)**
182. hk-modding/api (Hollow Knight Modding API, MIT): https://github.com/hk-modding/api
183. HollowKnight.SkillUpgrades (LGPL-2.1): https://github.com/flibber-hk/HollowKnight.SkillUpgrades
184. XState (MIT): https://github.com/statelyai/xstate
185. javascript-state-machine (MIT): https://github.com/jakesgordon/javascript-state-machine
186. robot (BSD-2-Clause): https://github.com/matthewp/robot
187. Matter.js (MIT): https://github.com/liabru/matter-js
188. Planck.js (MIT): https://github.com/piqnt/planck.js
189. verlet-js (non-standard licence): https://github.com/subprotocol/verlet-js
190. sfx-framedata (MIT, JSON frame data per move): https://github.com/avivace/sfx-framedata
191. FAT, Frame Assistant Tool (GPL-3.0): https://github.com/D4RKONION/FAT
192. input-overlay, OBS plugin (GPL-2.0): https://github.com/univrsal/input-overlay
193. dustmaker (Apache-2.0): https://github.com/msg555/dustmaker
194. StrategyWiki, Super Mario World/Controls (spin jump height note): https://strategywiki.org/wiki/Super_Mario_World/Controls
195. Siliconera, Dustforce: a game that's begging to be mastered: https://www.siliconera.com/dustforce-game-thats-begging-mastered/
196. TV Tropes, Pizza Tower (super jump cancel into shoulder bash): https://www.tvtropes.org/pmwiki/pmwiki.php/Videogame/PizzaTower
197. TV Tropes, Dustforce (smashing an object restores the double jump): https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/DustForce
