# SpeedRunner Verbs Sandbox spec (shared by the report writer and the sandbox builder)

The sandbox plays the recommended architecture of the report's §7. The report's §8 describes it. Both follow this file.
If research shows a number below is wrong, the report writer corrects it in the report and notes the change at the end of
this file under "Changes from research"; the sandbox builder follows the corrected number. Numbers marked (start) are
starting values the builder uses until research lands; keep them in the `TUNING` object so they are easy to change.

## Starting point
`studies/mechanics-speedrunner-verbs/sandbox.html` starts as a copy of Mechanics #1's sandbox (the course, the 9 layers,
the toggles, the ghost, the validation panel, the friends board, the HUD). Read `studies/mechanics-speedrunner/notes/SANDBOX-SPEC.md`
(including its "Changes from research" and "As built") to know what it does. Keep all of it working. The page title becomes
"SpeedRunner Verbs Sandbox", the byline "Mechanics series #2", the study link `mechanics-speedrunner-verbs.html`.

## What this sandbox adds: a Verbs panel
A new control group "VERBS (LAYER 2b)" with one toggle per verb the report recommends or compares, each with its input shown
on the button, its key numbers in a tooltip or sub-line, and a visible effect on the course. Every verb is OFF in the
"SpeedRunner today" preset, the recommended set is ON in "Recommended", and a "Kitchen sink" preset turns everything on.
The reader should be able to feel each verb alone. Candidate verbs (start list; the report writer fixes the final list and
numbers in "Changes from research"):
- **Dash** (Celeste reference): X or Shift, 8 directions from input, speed (start) 2.4 x maxRun for 150 ms, no gravity during
  the dash, 1 dash refilled on landing, 200 ms cooldown; dash into a wall jump keeps speed; a wavedash/hyper toggle.
- **Air dash only** variant (Dustforce / Mega Man X style, horizontal, keeps momentum after).
- **Double jump** (second jump in the air at (start) 0.85 x jumpVel; refilled on landing or wall).
- **Crouch and crawl** (Down: hitbox 20x24 u, speed (start) 0.4 x maxRun; passes under low ceilings on the course; a low
  corridor is added to the course where a crawl is faster than the slow hop route).
- **Crouch-slide** (Down while running above 0.6 x maxRun: 400 ms slide, friction halved, hitbox low, cancel into jump,
  SpeedRunners / Mirror's Edge reference).
- **Long jump** (jump out of a slide or crouch run: lower arc, 1.3 x horizontal, Mario 64 reference).
- **Dive** (Fall Guys / Odyssey: jump button in the air a second time without double jump: a forward lunge (start) 1.2 x
  maxRun with a 250 ms belly-flop recovery on landing; cancels into roll on a 230 u fall).
- **Ground pound** (Down in the air: stop, 100 ms hang, fall at maxFall, breaks a "crate" block added to the course, 150 ms
  landing recovery; Mario reference).
- **Ledge grab and mantle** (near a ledge top within 10 u while falling: grab, 120 ms mantle; toggle versus corner correction).
- **Wall run** (holding toward a wall above 0.8 x maxRun: run up (start) 120 u over 300 ms before the slide starts; Mirror's
  Edge / Dustforce reference).
- **Climb with stamina** (Celeste: Z held on a wall: climb up at 100 u/s, stamina 110 units (start, Celeste's number as a
  reference), drained by climbing and climb-jumps; a stamina bar).
- **Grapple and swing** (SpeedRunners / LBP: aim up-forward, a hook point on the course's ceiling blocks; rope length fixed at
  grab, pendulum swing, release keeps velocity; 1 hook point per section of the course).
- **Glide / float** (hold jump at the apex: fall at 0.3 x maxFall; LBP / Rayman / Ori reference).
- **Jetpack thrust** (hold jump: upward acceleration (start) 1.6 x gravity while held, fuel 1.5 s refilled on ground; Jetpack
  Joyride reference; turns a section of the course into a one-button corridor).
- **Charged jump** (Jump King: hold to charge up to 600 ms, release for 0.5 to 1.4 x jumpVel; no air control while charged).
- **Slope drawing** (Solipskier: a mode button; the mouse or finger draws a ground line under the samurai for one section of
  the course; speed from slope). Optional if cheap; otherwise a figure only.
- **Hammer / pole** (Getting Over It): figure only, not a sandbox toggle (say so in the report).
- **Place a block** (UCH): in the practice room, click to place one of three blocks before a run; the placed block persists
  for the session and is part of the input log and the replay. Optional if cheap.
- **Katana verbs** (extension of #1's slash): a dash-slash (dash that kills on the way), a pogo slash (Down + slash in the air
  bounces off an enemy or a spike-topped block), a parry window (120 ms) that reflects a projectile. These are the samurai's
  own verbs and the report's main proposal. Numbers (start): dash-slash = dash numbers plus the slash hitbox; pogo bounce
  0.9 x jumpVel; parry 120 ms window, 300 ms recovery on a miss.

Every verb must: be deterministic in the fixed step, be recorded in the input log (add bits for verb buttons; keep the RLE
encoder working and show its bytes per minute), work with the ghost and the replay validation (PASS after a run that used
every verb), have a pose or an obvious visual (trail, squash, a rope, a stamina bar) and a synth sound, and show its cost in
the HUD. Add a "verb budget" readout: how many buttons the current set needs (2, 3 or 4) and how many verbs share a button.

## Course changes
Add to the end of the practice room, or as a third map "Verbs gym" (start: a third map), one short section per verb where that
verb saves time or is required with the toggle on and has a slower safe route with it off: a low corridor (crawl, slide), a
tall wall (climb, wall run, grapple), a wide gap (dash, double jump, long jump, glide), a crate (ground pound), a projectile
turret (parry), a pit of enemies on spikes (pogo slash), a one-button corridor (jetpack), a high ledge (charged jump). Keep
the first course unchanged so Mechanics #1's numbers stay valid.

## Layers (must match report §7, bottom to top; the writer may rename but keeps the count and order)
1. **Fixed-step simulation and input** (from #1) plus a verb input layer: buttons 1 to 3 with press, hold and release, a verb
   state machine with startup/active/recovery per verb and a cancel table.
2. **Movement kit** (from #1, unchanged).
3. **Verb set** (new): the verbs above as data (a table of numbers per verb), the resources (dash count, stamina, fuel), the
   cancel table, and the pose per verb state.
4. **Collision and elements** (from #1) plus the new course pieces (low corridor, crate, hook point, turret, spike-topped block).
5. **Enemies on the level clock** (from #1) plus the turret projectile and the pogo targets.
6. **Camera** (from #1).
7. **Animation and feedback** (from #1) plus per-verb poses, trails, the rope, the stamina and fuel bars.
8. **Audio** (from #1) plus one synth sound per verb.
9. **Race loop, leaderboard and trust** (from #1): the input log gains verb bits, the board shows which verb set a time used
   (the "category" idea from speedrun.com), replay validation covers every verb.

## Master controls
- Presets: "SpeedRunner today" (no verbs), "Recommended" (the report's set), "Kitchen sink" (every verb), "Celeste kit"
  (dash, climb, crouch), "Mario kit" (crouch, slide, long jump, ground pound, dive), "Runner kit" (jetpack, glide, charged jump).
- Everything from #1 stays (juice, camera, restart modes, ghost, views, assists).
- Keyboard: A/D or arrows, Space/W/Up jump, X or J slash, C or K dash, Down crouch/crawl/slide/ground pound, Z or L climb/grab,
  R restart, P pause, M slow motion, V views, G ghost. Touch: one more button row for verbs.

## Efficiency HUD
As in #1, plus a "verbs" timing slot, the verb budget readout, the input log bytes per minute with verb bits.

## Thumbnail
`study.yaml` grabs canvas `#c` after clicking `button[data-demo="showcase"]`: a frozen frame mid dash-slash through an enemy
on the Verbs gym, red dash trail, a rope hanging from a hook point behind, a stamina bar, the timer and a green split delta,
black ink on white.

## Changes from research
(the report writer appends here, dated)

**13 Nov 2026, report writer.** Numbers the report settled that differ from the (start) values above, with the profile that settles each. The builder's "As built" section below records what the Sandbox then did.
- Dash (comparison toggle): 2.67 x maxRun = 1120 u/s for 150 ms (18 steps), 168 u = 3.65 BL (was 2.4x); two directions along the held or facing direction with a four-direction sub-toggle, no diagonals (was 8); startup 1 step; cooldown 200 ms (24 steps); one charge, refilled on a solid or a one-way top only, never within 100 ms (12 steps) of the dash start, never on walls; exit clamped to 546 u/s (1.3 x maxRun, the roll-jump hyper's ceiling); gravity off during the dash; a dash-jump sub-toggle leaves at 546 x 830. Off in "Recommended". Report A1, A2, A5.
- Air dash only: same numbers, air only, one per airtime, horizontal, momentum kept after. Off in "Recommended". Report A3.
- Double jump: 0.85 x jumpVel = 705 u/s (2.2 BL) kept; refilled on the ground only (was "landing or wall"). Off in "Recommended". Report A4.
- Crouch and crawl: hitbox 20x26 u with the feet fixed (was 20x24), crawl 120 u/s = 0.29 x maxRun (was 0.4x); release stands only if the 46 u box is free against solids (never against one-way tiles), otherwise keep crawling and try the 8 u sideways correction; a jump pressed while pinned is buffered 130 ms; Down on a one-way tile is a crouch, never a drop-through; no wall stick or wall jump while crouched. Report B1, C4.
- Crouch-slide: starts on Down at 280 u/s or more (rollMinSpeed; was 0.6 x maxRun), friction 600 u/s² (was "halved"), minimum 120 ms (no fixed 400 ms duration), release stands if free, jump cancels at any time, a slide into a wall is a 100 ms stand-up stop (not a wall stick). From maxRun a slide travels 147 u = 3.2 BL in 0.7 s. Report B2.
- Slide-jump (long jump): leaves at 546 u/s horizontal and 622 u/s up (0.75 jumpVel), the same pair as #1's roll-jump hyper (the spec's "1.3x horizontal" is the same 546). Report B2, B3.
- Dive (comparison toggle): a second Jump press in the air (Fall Guys bind), 120 ms startup, vx set to 600 u/s (1.43 x maxRun; was 1.2x), vy clamped to 0 at start, the 20x26 u body horizontal, 250 ms prone on landing unless the fall was 230 u or more, in which case it chains into the roll. Off in "Recommended". Report B4.
- Stomp (new, recommended): Down in the air sets vy to at least 700 u/s, keeps vx and the 1.65 fall multiplier, counts toward the 230 u roll trigger. Report B5.
- Ground pound (comparison toggle, replaces the stomp when on): no hang (was 100 ms), fall at maxFall 1150 u/s with vx 0, 150 ms landing recovery, breaks the crate. Report B5.
- Ledge grab and mantle: automatic, no button and no 120 ms hang. When the 2 u wall probe reports a wall whose top sits between the head and 16 u above it, and the hero holds toward it or is rising under 200 u/s, snap the feet to the top and give vy -300 and vx 200 toward the ledge for 100 ms (12 steps) with a hand-plant pose. Toggle beside corner correction. Report C1.
- Wall run: hold toward the wall at 300 u/s or more (was 0.8 x maxRun) to run up 92 u = 2 BL over 250 ms (was 120 u over 300 ms), then slide. Off in "Recommended". Report C2.
- Climb with stamina: climb at 210 u/s (was 100), budget worth 2.4 s of climbing (Celeste's 110 at 45.45 per second scaled), a climb jump costs a quarter of the budget, tired below 20%, refill on the ground only; stamina bar. Off in "Recommended". Report C3.
- Grapple: a ring hook on Up + Katana pressed in the air with a ring in reach (no aim, no separate button); fires at 45° up-forward in the facing direction at 1700 u/s, reach 300 u = 6.5 BL (176 ms to attach at full reach); rings only, radius 20 u, snap within 30 u of the ray; rope length fixed at the attach distance, minimum 90 u, no reel; gravity 2500 with no fallMult and no airDrag while hooked; left and right pump at 900 u/s² tangential; release on Katana up keeps velocity capped at 760 u/s (1.8 x maxRun), then overspeedDecay; a Jump within 130 ms of release adds vy -500; re-hook allowed at once but not the ring just left until landing; press buffered 130 ms, a ring stays valid 80 ms after leaving the ray. Period at L = 276 u is 0.66 s. A second toggle "any ceiling" (SpeedRunners mode) anchors to the first solid underside on the ray, comparison only. The zip variant (pull at 1550 u/s, hang gravity-free, Jump to leave) is the fallback if the swing tests badly. One ring per gym section. Report D1, D2.
- Glide: hold Jump after the apex to fall at 0.25 x maxFall = 288 u/s (was 0.3x) with full air control. Off in "Recommended". Report A6.
- Jetpack: a corridor section where Jump becomes thrust at 3500 u/s² (1.4 g; was 1.6 x gravity) while held, terminal 600 u/s up and down, auto-scroll at maxRun, ceiling and floor spikes; no fuel (the corridor is the limit; was 1.5 s). Off in "Recommended". Report D4.
- Charged jump: hold Jump while standing still (|vx| under 20 u/s) for 0 to 600 ms, release for 0.6 to 1.5 x jumpVel (was 0.5 to 1.4), linear (Jump King's curve), direction locked at release, no air control. Off in "Recommended". Report D5.
- Slope drawing: figure only, not a toggle. Report E2.
- Hammer and pole: figure only. Report E1.
- Place a block: optional, in the practice room; click to place one of three pieces (a 16 u spike strip, a 40x40 solid, a mover with a 3 s period), snapped to 20 u, forbidden within 200 u of the start, a checkpoint or the finish and over a solid; persists for the session; placement happens between runs so the input log is unchanged and the replay header carries the map state hash (and `placed[]` for self-contained replays); the board key shows `map:hash`. Report G4.
- Katana verbs: the dash-slash is the release of the iai hold, not a fourth button. Tap = the settled slash (2 / 4 / 6 steps, 50x40 u); Katana held 24 steps (200 ms) arms, 36 steps (300 ms) is full charge; release fires the dash-slash: 2 startup, 12 active at arm to 18 at full (100 to 150 ms), 6 recovery with air control locked, 840 u/s (2.0 x maxRun), 84 to 126 u = 1.8 to 2.7 BL, swept hitbox 154 to 196 x 40 u tested as the 50x40 box each active step, projectile-only i-frames during active, exit 546 u/s, one per airtime refunded by a kill or a pogo, jump cancels the recovery only, a wall touch ends it into a slide. Read: a one-frame smear, afterimages every 2 steps, no world hitstop (hero-only 2-step flash). Report F1, F4.
- Pogo slash: Down held + Katana pressed in the air; hitbox 40 u wide x 50 u tall below the feet; held up to 24 steps, then the 12-step re-press cadence; bounce vy = -830 (full jumpVel, 3.0 BL; was 0.9 x jumpVel), apex band if Jump is held, jump cut applies, vx untouched, no i-frames; targets are enemies, floor spike strips and the spike-capped block (not springs or movers; ceiling spikes stay deadly); a pogo refunds the dash-slash and resets wallJumpSameY. Report F2.
- Parry: rejected as a separate verb (the spec's 120 ms window with a 300 ms miss recovery is not built as the recommended verb). The deflect is a property of the slash: any turret shot that enters the active 50x40 box reverses along its line at 1.5x speed and kills the turret; at a shot speed of 600 u/s the effective window is 14 steps (117 ms); shot speed is a slider (300 to 1200 u/s); miss cost is the slash's own 6 recovery steps. Keep a "parry stance" comparison toggle that shows the rejected 120 ms window and 300 ms lockout. Report F3.
- Slow time: Sandbox toggle only, air only, 0.3x world speed, a 1.0 s meter refilled 1 s per 3 s on the ground, applied inside the fixed step, the clock counts real steps, the run is flagged assisted and the board rejects it. Report F5.
- Hitstop: 0 world steps for every verb; a 2-step hero-only flash instead. Report F5.
- Input log: two bytes per RLE pair, byte 0 run length 1 to 255, byte 1 bits L R U D Jh Jp Kh Dp (katana held, dash pressed; the katana press is the edge of its held bit; the hook needs no bit because it is Up + Katana). Header adds hash(VERBS table + PHYS) and the map state hash; the validator checks the hashes before re-simulating and must PASS after a run that used every verb. Report H3, H4.
- Verb budget readout: "Recommended" reads 3 buttons (Jump, Katana, plus Move) and 15 verbs (run, jump, wall slide, wall jump, climb jump, roll, crouch, slide, slide-jump, stomp, mantle, slash, pogo, dash-slash, hook); "Kitchen sink" reads 4 (adds the Dash button and the climb button). Report H1.
- Verbs gym sections (one per verb, each with a slower safe route when the verb is off): a 32 u low corridor at least 2 BL long after a checkpoint (slide clears it, crawl does not); a tall wall with a hook ring and a run-up; a wide gap in the 7 to 11 BL tier with a mover as the safe route; a crate; a turret firing 600 u/s shots; a pit of enemies on spikes with a spike-capped block; a one-button corridor; a high ledge a wall jump cannot reach; a lip a few units above the next floor. #1's course stays unchanged. Report §8.
- Presets: "SpeedRunner today" (no verbs), "Recommended" (below), "Kitchen sink" (everything, the pound replacing the stomp), "Celeste kit" (dash with four directions, climb with stamina, crouch), "Mario kit" (crouch, slide, slide-jump, ground pound, dive), "Runner kit" (jetpack corridor, glide, charged jump).

**Final "Recommended" preset (report §1, the Sandbox must match it):** crouch and crawl · crouch-slide · slide-jump · stomp (fast fall) · automatic mantle · pogo slash · iai dash-slash (hold 200 ms, release) · ring hook (Up + Katana near a ring). The deflect comes with the slash and has no toggle. Everything Mechanics #1 settled stays on. Off: dash, air dash only, double jump, dive, ground pound, wall run, climb with stamina, glide, jetpack corridor, charged jump, any-ceiling hook, parry stance, slow time, place a block.

**13 Nov 2026, report writer, after the figure agents' port.** Corrections to the list above: the pendulum period at L = 276 u is 2.09 s (not 0.66 s) and a 90° drop-in reaches 1175 u/s (not 1250); the deflect window is 14 steps for a point shot and about 17 steps for the Sandbox's 14 u wide shot at 600 u/s; stamina is stated in Celeste's points (110, 45.45 per second up, 10 still, 27.5 per climb jump, tired below 20); the input log is one byte of held bits in the built order L R U D Jump Katana DashPress Climb with presses as edges and a varint run, as built; the stomp never fires inside a pogo bounce arc; the slide-jump covers about 241 u of flat gap, less than the plain jump's 248 u, so it is faster, not longer.

## As built (measured by the sandbox builder, 13 Nov 2026, after the research changes above; headless Chromium on an Apple M4 Pro, autopilot runs, per-minute figures extrapolated)
- File: `sandbox.html`, 169 KB, single file, system fonts. Zero console errors; scrollWidth 390 at a 390 px viewport; 106 buttons, every enabled one clicked once in the test. The first course is unchanged: the Mechanics #1 autopilot finishes it in 17.483 s as before, replay PASS. Test: `notes/scratch-sandbox/test_sandbox.py` with `gym.js` (the gym autopilot) and `autopilot.js` (the course autopilot from #1); one screenshot per verb in `notes/scratch-sandbox/shot-verb-*.png`.
- Verb panel: 19 verb toggles, 2 dash sub-toggles (four directions, dash-jump) and 2 disabled "figure only" buttons (slope drawing, place a block). Each button carries its input and its numbers. BASE (the "Recommended" preset) is the report's final set: crouch and crawl, crouch-slide, slide-jump, stomp, automatic mantle, pogo slash, iai dash-slash, ring hook. Kitchen sink is everything with the pound replacing the stomp; Celeste kit is dash with four directions, climb, crouch; Mario kit is crouch, slide, slide-jump, pound, dive; Runner kit is the jetpack corridor, glide, charged jump. A verb kit preset also selects the Verbs gym.
- Numbers used (the settled ones): dash 2.67x maxRun = 1120 u/s for 150 ms, 1 step of startup, 200 ms cooldown, one charge refilled on a floor only and only 100 ms or more after the dash started, exit clamp 546, dash-jump 546 x 830 behind a sub-toggle; air dash the same numbers, air only, horizontal, momentum kept; double jump 0.85x refilled on the ground only; crouch 20x26 at 120 u/s, stands only when the 46 u box is free against solids, a jump while pinned stays buffered 130 ms; slide from 280 u/s with friction 600, 120 ms minimum, ends on release or at a stop, a wall is a 100 ms stand-up stop; slide-jump 546 x 622; dive with a 120 ms startup, 600 u/s lunge, vy clamped to 0, 250 ms prone unless the fall rolls; stomp vy 700; pound at maxFall with vx 0 and a 150 ms landing, breaks the crate; mantle when a wall top sits between the head and 16 u above it while holding toward it or rising under 200 u/s, feet snap to the top with vy -300 and vx 200 for 100 ms; wall run from 300 u/s, 92 u over 250 ms; climb 210 u/s up and 160 down on 110 stamina draining 45.45 per second, 27.5 per climb jump, red under 20%, refill on the ground; ring hook on Up + Katana along the 45 degree ray within 300 u, 1700 u/s to attach, rings of radius 20 snapped within 30 u of the ray, rope fixed at the attach distance (minimum 90), base gravity and no air drag while hooked, pump 900 u/s² with left and right, release on Katana up capped at 760 u/s, a Jump within 130 ms adds vy -500, the ring just left is not valid until a landing; glide 0.25x terminal; jetpack corridor with thrust 3500 u/s², terminal 600, auto-scroll at maxRun, no fuel; charged jump from a standstill (|vx| under 20) for up to 600 ms, 0.6 to 1.5x jumpVel, 0.75x maxRun sideways in the held direction, no air control; iai dash-slash armed at 200 ms of katana hold and full at 300, 2 steps startup, 12 to 18 active at 840 u/s with the 50x40 slash box tested every step, 6 steps of recovery with air control locked, exit 546, projectile immunity while active, one per airtime refunded by a kill or a pogo, afterimages every 2 steps; pogo box 40x50 under the feet, held up to 24 steps, bounce 830 with the apex band and the jump cut, vx untouched; turret shots at 600 u/s (slider 300 to 1200) every 1.2 s, deflected by any active slash at 1.5x; the parry stance stays as the rejected comparison (120 ms window, 300 ms miss).
- Input log: one byte per step with eight held bits (left, right, up, down, jump, katana, dash press, climb); a press is the edge of its held bit, taken inside the fixed step, and a bit already held on the first step is not a press. Run-length encoded as (byte, varint run) pairs. Bytes per minute: the first course 288 (84 B over 17.48 s; #1 measured 369 with separate press bits), the gym with no verbs 343, the recommended set 373, the kitchen sink 448, the air dash set 322. A tap shorter than a step still counts: the one-shot flags force the held bit on for that step.
- Replay validation: PASS on every run in the test, including a kitchen-sink run that used 16 verbs and a second run that used the other 3 (air dash, glide, stomp), 2,098 to 2,671 inputs re-simulated headless in 5 to 11 ms. New checks: a hash of PHYS, the verb numbers and the verb toggles taken at the start and compared at the finish (a toggle flipped mid-run fails it instead of producing a replay mismatch), and a speed cap that follows the verb set (dash 1130, iai 850, dive 610, hook 1060 u/s). The board stores the verb set as the run's category and shows it beside the name.
- Frame cost in live play: 0.25 ms total (simulation 0.01, verbs 0.007, collision and elements 0.014, enemies 0.009, camera and animation 0.013, render 0.16 of which solids 0.07 and hero 0.07, UI 0.05, audio 0.005). Restart in place 0.1 to 0.5 ms; countdown replay 3400 ms as in #1.
- Gym times by the autopilot (it plays every verb for coverage and takes the safe routes at full speed with perfect jumps, so it is not a fair race between routes): no verbs 17.50 s, recommended set 19.48 s, Celeste kit 19.42 s, Mario kit 19.11 s, Runner kit 19.63 s, kitchen sink 21.58 s. The verb routes cost the autopilot time because it demonstrates each verb where it fits, not where it pays; a human comparison is the report's job.
- Gym layout (9 sections, 7000 u): a 32 u low corridor 260 u long with a floating step as the slow route; a crate that is the floor over a tunnel under a 300 u wall with three steps as the slow route; a 300 u wall with a hanging wall facing it (wall jumps are the slow route, wall run and climb the fast ones); a 340 u gap (7.4 BL) with a ring on the 45 degree ray, a mover and a pit as the slow routes; a 400 u pit of two enemies on spikes with a spike-capped block and a ring above, a step and one-way tiles as the slow route; a turret that wakes within 700 u; a one-button corridor with floor and ceiling spikes; a 240 u ledge above a wall-jump chimney for the charged jump; a 190 u lip whose top sits a few units above the head at the apex of a jump, with a one-way tile beside it as the slow route, for the mantle. The chaser spawns at checkpoint 4 and never climbs a wall over 150 u, so the chimney is not a death sentence.
- Deviations kept, with the reason:
  - The ground pound fires on a neutral Down press in the air; Down with a direction held is the stomp (or the pogo stance with the katana). Otherwise the pogo is unreachable with the pound on, which the kitchen sink needs.
  - Climb goes up on its own while the climb button is held (Down climbs down), because Up is a jump key in SpeedRunner and a held Up would fire wall jumps.
  - The hook has no 80 ms ray memory, no 130 ms press buffer, no "any ceiling" mode and no zip fallback. Rings sit over the gap and the pit, not on the tall wall: a fixed-length rope cannot swing a body through the wall it is meant to clear, so the wall keeps the climb, the wall run and the mantle.
  - The dash's 1 step of startup is one frozen step; the dive's 120 ms startup keeps the current velocity under gravity, then lunges.
  - Crouch has no 8 u sideways correction when pinned under a ceiling; the hero keeps crawling until the box is free.
  - The input byte order is L R U D Jump Katana DashPress Climb rather than the report's L R U D Jh Jp Kh Dp: the jump press is the edge of the held bit like the katana press, and the climb button needs a bit of its own. The header hash covers PHYS, the verb table and the toggles; there is no map state hash because block placing is not built.
  - Not built: place a block, slow time, hitstop (none, as settled; the sash flash stands in), the "slide clears the corridor but the crawl does not" rule (the crawl clears it, slower).
  - The high ledge's slow route is a two-wall chimney; a single wall jump cannot reach it, two can.
  - The camera clamp uses the map's lowest floor so the tunnel under the crate stays in view.
  - The dash-slash kill box is the slash box ahead of the hero tested every active step, not a swept 154 to 196 u rectangle; at 840 u/s over 100 to 150 ms the steps cover the same span.
