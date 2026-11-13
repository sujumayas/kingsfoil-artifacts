# SpeedRunner Mechanics Sandbox spec (shared by the report writer and the sandbox builder)

The sandbox plays the recommended architecture of the report's §7. The report's §8 describes it. Both follow
this file. If research shows a number below is wrong, the report writer corrects it in the report and notes the
change at the end of this file under "Changes from research"; the sandbox builder follows the corrected number.
Numbers marked (start) are starting values the builder uses until research lands; keep them in one `TUNING`
object at the top of the script so they are easy to change.

The study weighs FEEL, READABILITY, RUN FIT (a restart-heavy time attack with a leaderboard), CHEAPNESS (a tiny
team, hand-written Canvas2D JavaScript) and EVIDENCE. The sandbox must feel great to run in, let the reader switch
each technique off to feel what it does, and show the race loop (timer, splits, ghost, restart) as well as the movement.

## Page
- `studies/mechanics-speedrunner/sandbox.html`, one hand-written file, no external assets, fonts or images.
  Everything is drawn in code. The one exception is the shared top bar: `<script src="nav.js" defer></script>` before `</body>`.
- Native canvas `<canvas id="c" width="640" height="360">`, drawn as vector ink (SpeedRunner's look: white paper,
  black solids, one red kimono, grey ghost). Not pixelated. Scaled to the stage width with `aspect-ratio: 16/9`.
  Works at 390 px phone width, no horizontal overflow, no console errors. Touch: left/right and jump zones on the
  canvas plus on-screen buttons (`body.coarse` shows them, as in `studies/feel-loot-pickup/sandbox.html`).
- Copy the page chrome, HUD style, control layout and keyboard handling from `studies/feel-loot-pickup/sandbox.html`
  (read it first), but use a light theme: paper background, ink text, one red accent, so the sandbox looks like the game.
- Title: "SpeedRunner Mechanics Sandbox". Links back to `mechanics-speedrunner.html` and `index.html`.

## World units
The game's units: the hero is 20x46 world units (1 body length BL = 46 u), ground at y 600, view 970x545 u at
1280x720. The sandbox canvas is 640x360, so draw the world at scale 640/970 = 0.66 (the hero is about 13x30 px on
the canvas). Keep all simulation numbers in world units so they equal the game's `PHYS` and can be copied back.

## The level
One hand-placed map about 20 s long at top speed, left to right, that contains every element the study recommends,
in teach-test-twist order:
1. Flat start with a rock to jump (teaches jump), a gap (coyote time), rising steps (jump buffer).
2. A spring (launches to jumpVel x 1.35 (start)), a row of one-way roof tiles, a moving platform on level time (period 3 s).
3. A chimney (wall slide and wall jump), a ledge drop that rolls.
4. A timed block cycle (visible 1.5 s, gone 1.0 s (start), telegraphed by a 0.3 s shake), ceiling spikes above a low corridor.
5. One patrolling enemy on level time that can be slashed without stopping (one button, 120 ms slash, momentum kept) or
   bounced on, and one chaser that starts at the previous checkpoint and runs at 0.85 x maxRun (start), so a slow
   section costs the run visibly. Both are deterministic in level time.
6. A finish flag. 4 split checkpoints along the way. A kill plane below.
A second, tiny "practice room" (one gap, one wall) is reachable from a button for the movement toggles alone.

## Layers (must match report §7, bottom to top; the writer may rename but keeps the count and order)
1. **Fixed-step simulation and input.** 1/120 s step, accumulator, render interpolation, one-shot press flags,
   a level clock that drives every mover and enemy, a seeded RNG for cosmetics only. Toggle: 60 Hz step (to feel the difference).
2. **Movement kit.** The game's PHYS numbers (start): maxRun 420, groundAccel 2700, turnAccel 5200, groundFric 3000,
   airAccel 1900, gravity 2500, fallMult 1.65, apexMult 0.55 / band 90, jumpVel 830, jumpCut 0.45, coyote 0.10 s,
   buffer 0.13 s, wall slide 115, wall stick 0.10 s, wall coyote 0.08 s, wall jump 440/790, roll after 230 u.
   Per-technique toggles: coyote, buffer, variable jump, apex hang, fall gravity, corner correction (new, start 8 u
   nudge), wall stick, wall coyote, roll. Sliders: jumpVel, gravity, maxRun, coyote ms, buffer ms.
3. **Collision and elements.** AABB solids, one-way tiles (land from above only), movers and wheels on level time
   that carry the player, springs, timed blocks, spikes (floor and ceiling), checkpoints, flag, kill plane.
   Every element telegraphs: a pre-shake before a timed block vanishes, a compressed spring frame, spike silhouettes.
4. **Enemies on level time.** Patroller (speed 160 u/s (start), turns at edges), chaser (starts at the last split,
   speed 0.85 x maxRun), both reset with the run. Slash: one button, 120 ms, kills within 40 u ahead, never stops
   the run; bounce: landing on a patroller gives jumpVel x 0.8. Toggle enemies off to compare times.
5. **Camera.** Horizontal lock with 120 u look-ahead (game default); alternatives to toggle: speed-based look-ahead,
   lerp follow; vertical platform-snap with a 60 u dead zone. Toggle a "camera window" overlay that draws the dead zone.
6. **Animation and feedback.** The procedural stick samurai (hip, lean, 8 limb angles blended with `1 - exp(-26 dt)`),
   squash on land (130 ms), stretch on jump, roll and flip, dust (7 jump, 6 land, 10 roll, 1 per 90 ms while running),
   speed lines above 0.9 x maxRun, death burst, "GO" flash. Per-layer toggles and a master Juice slider.
7. **Audio.** WebAudio synth only: jump, wall, land, roll, die, checkpoint, finish arpeggio, countdown beeps, slash
   (take the game's frequencies from `notes/01-current-build.md`), pitch ±4% per play, a voice cap of 8. Music is a
   4-bar synth loop that keeps playing across deaths (toggle: restart music on death, to feel why not). Off until a gesture.
8. **Race loop.** Timer in ms from the fixed step (never wall clock). Start modes to toggle: 3-2-1 countdown (game
   today) / timer starts on first input (recommended start value). Restart modes: instant (state reset, under 100 ms,
   R or any death) / countdown replay (3.4 s, game today). Splits at 4 checkpoints with deltas against the session
   best in LiveSplit colours (green ahead, red behind, gold best segment). Ghost of the session best recorded at
   30 Hz (toggle 10 / 20 / 30 / 60 Hz and position-only vs full pose, with the live byte count), drawn grey at 20%.
   Results panel with per-section times and the delta. Medal ladder for the level (bronze, silver, gold, author
   (start): 40 s, 30 s, 24 s, 20 s), shown on the results.
9. **Leaderboard and trust.** A local "friends board" of 5 seeded names with times; the reader's time slots in;
   a "rival beaten" toast when a run passes a friend. Validation panel: shows the plausibility checks a server would
   run (minimum time per split, max speed, step count = time / DT) and an input-replay check (the sandbox records
   inputs per step and re-simulates the run headless at the finish, then compares the final time; shows PASS or
   a mismatch). A share-link button that encodes the run (map id, time, splits) as base64url in the URL hash.

## Master controls
- Presets: "SpeedRunner today" (game defaults, countdown restart, no corner correction, no enemies), "Recommended"
  (the §7 architecture), "No forgiveness" (coyote, buffer, apex, corner correction, wall stick off), "Floaty"
  (LBP-like: gravity x0.6, no fall multiplier), "Heavy" (Meat Boy-like: higher speed and gravity).
- A Juice master slider plus per-effect toggles. Assist toggles: slow motion 0.5x (with the timer scaled so the
  board rejects it, shown as "assisted"), invincible, infinite coyote.
- Views: normal, hitboxes (player, spikes, one-way tops, wall probe, camera dead zone), inputs (an input display
  strip at the bottom like a speedrun stream), cost view.
- Keyboard: A/D or arrows, Space/W/Up jump, X or J slash, R restart, P pause, M slow motion, V cycle views, G ghost on/off.

## Efficiency HUD (required)
Per-layer timing in ms with `performance.now()`, smoothed: simulation, collision and elements, enemies, camera and
animation, render (solids, hero, ghost, particles), UI and HUD, audio, total; a frame budget bar against 16.7 ms.
Counters: physics steps this frame, particles alive, ghost bytes recorded, inputs recorded, replay check status.

## Thumbnail
`study.yaml` grabs canvas `#c` after clicking `button[data-demo="showcase"]`: a frozen frame mid-run, the samurai
mid wall jump off the chimney with dust and speed lines, the grey ghost one step behind, the timer and a green split
delta on screen, a spring and a moving platform in view, black ink on white.

## Changes from research
(the report writer appends here, dated)

**13 Nov 2026, report writer.** Numbers the report settled that differ from the (start) values above. The builder's "As built" section below records what the Sandbox then did.
- Spring: launch at jumpVel x 1.45 (was 1.35), auto-jump semantics (apex band active, no jump cut), compressed frame of about 150 ms. Report C1.
- Timed block: a 0.5 s tick on a 4-tick cycle, 1.0 s visible and 1.0 s gone (was 1.5 s visible, 1.0 s gone), the 0.3 s pre-shake inside the last 0.3 s of visibility, one sequence integer per block. Report C2.
- Patroller: 85 u/s (was 160), hitbox inset 3 u per side, a kill-by-contact needs 2 consecutive overlapping steps. Report D1.
- Chaser: 0.85 x maxRun kept (357 u/s), spawns at the last split 1.5 s after the player passes it (new delay). Report D2.
- Bounce: landing on an enemy gives the full jumpVel (830 u/s) with the apex band active (was jumpVel x 0.8). Report D3.
- Slash: 100 ms total (17 ms wind-up, 33 ms active, 50 ms recovery), hitbox 50 u wide and 40 u tall ahead of the hero (was 120 ms, 40 u), cancelable by jump, vx untouched, usable in the air. Report D4.
- Corner correction: 8 u kept, applied upward into ceilings and sideways onto ledge tops. New: wall reach 7 u, wall speed retention 60 ms, ceiling grace 50 ms on the variable jump. Report A2.
- Wall slide: keep the 100 ms stick as the default and add a toggle for a ramp from 25 to 115 u/s over 0.8 s. Report A4.
- Speed tech: a roll-jump hyper, jump inside the first 100 ms of a roll leaves at 1.3 x maxRun with a lower arc; a lift boost from movers capped at 250 u/s sideways and 130 u/s up; a jump boost of 40 u/s in the move direction. All toggleable. Report A3, A5.
- Camera: forward focus from 120 u at rest to 200 u at overspeed (toggle), downward look-ahead of vy x 0.25 s capped at 200 u while falling, camera clamp so deathY never enters the view. Report B3.
- Feedback: jump stretch scale (0.6, 1.4); landing squash scaled by min(vy / maxFall, 1) toward (1.4, 0.6), recovering at 1.75 scale units per second; landing dust (6) only when vy >= 575 u/s; 120 ms white flash on the kimono when a movement resource changes. Report B2.
- Ghost: the canonical record is the input log at 1 byte per physics step (bits: left, right, jump held, jump pressed, slash), run-length encoded; the drawn ghost is a derived state track at 15 Hz (default) with toggles 10 / 20 / 30 / 60 Hz and position-only vs full pose, each with the live byte count. Report H2.
- Medals: Trackmania ratios on the author run, gold 1.06x, silver 1.2x, bronze 1.5x. For the 20 s author level: gold 21.2 s, silver 24 s, bronze 30 s (was 24 / 30 / 40). Report E1.
- Restart: timer and level clock both start on the first horizontal or jump input (so nothing is gained by waiting at the line); the countdown plays only on the first attempt after map select; the 0.38 s death beat is skippable by any input; R resets in place with no countdown. Report F1, H4.
- Timer: integer step count is the stored value, two decimals shown during the run, three on results and the board. Report H1.
- Validation panel: add the slowdown ratio (wall-clock run duration over simulated duration, flag above 1.05) and the minimum-steps bound (map width / maxRun x 120). Report H3.
- Friends board: show "n of 5" and the gap in ms, a date per row, and the input device. Report G1.

## As built (measured by the sandbox builder, 13 Nov 2026, after the research changes; headless Chromium on an Apple M4 Pro, 17.48 s autopilot run, per-minute figures extrapolated)
- File: `sandbox.html`, 112 KB, single file, system fonts. Zero console errors; scrollWidth 390 at a 390 px viewport; 73 buttons, every one clicked once in the test.
- All 17 research items applied: spring 1.45x auto-jump with the apex band and a 150 ms compressed frame; timed blocks on a 0.5 s tick, 2 ticks on and 2 off, one `seq` integer per block, pre-shake in the last 0.3 s; patroller 85 u/s, 3 u inset, 2-step contact; chaser 0.85x maxRun spawning at checkpoint 4 1.5 s after the split; stomp at full jumpVel with the apex band; slash 100 ms (17/33/50) with a 50x40 u box, air usable, jump cancels it; corner correction 8 u up and sideways, wall reach 7 u, 60 ms wall speed retention, 50 ms ceiling grace; slide ramp 25 to 115 u/s over 0.8 s (toggle, off by default); roll-jump hyper 1.3x, lift boost 250/130, jump boost 40 u/s (toggles); camera focus 120 to 200 u, downward look-ahead vy x 0.25 s capped at 200 u, deathY clamp; stretch (0.6, 1.4), fall-scaled squash recovering at 1.75 per second, land dust only at vy >= 575, 120 ms sash flash; canonical record = input log RLE with a derived 15 Hz drawn track (10/15/20/30/60, position vs pose); medals 30 / 24 / 21.2 / 20 s; timer and level clock start on the first horizontal or jump input, countdown only on the first attempt after a map select, death beat skippable, R resets in place; integer steps stored, 2 decimals in the run, 3 on results and the board; validation adds the slowdown ratio and the minimum-steps bound; board shows "n of N", gap in ms, date and input device.
- Canonical record: the input log of the 17.48 s run is 2,148 steps = 2.1 KB raw, 110 bytes run-length encoded, about 369 bytes per minute.
- Drawn ghost track, bytes per minute (JSON / delta-quantised): 15 Hz position-only 13.5 KB / 3.8 KB, full pose 70.1 KB / 19.1 KB;
  10 Hz position 9.2 / 2.6 KB, full pose 48.0 / 13.5 KB; 20 Hz position 18.3 / 5.2 KB, full pose 95.9 / 24.7 KB;
  30 Hz position 27.7 / 7.6 KB, full pose 143.8 / 35.5 KB; 60 Hz position 55.3 / 14.7 KB, full pose 287 / 69.3 KB.
  (The game today: 30 Hz full pose JSON, about 100 KB per minute.) The input log is about 400x smaller than the 30 Hz JSON track.
- Restart: in-place reset 0.1 to 0.2 ms; countdown-replay mode 3400 ms (the game today).
- Frame cost: 0.2 to 0.5 ms total (simulation and collision under 0.05 each, render 0.15, UI 0.07 to 0.12).
- Input replay validation: PASS at 120 Hz, at 60 Hz and under the "SpeedRunner today" preset (countdown, no enemies, 30 Hz ghost); 2,098 to 2,148 inputs re-simulated headless in about 6.7 ms. Slowdown ratio of the headless run 0.015 (the autopilot runs faster than real time); a real player sits near 1.0.
- Deviations kept: the spring is a touch trigger, not a 20 u solid (a solid blocked the runner); "ceiling grace" is read as a bump in the first 50 ms of a jump keeping vy (the hero slides under the ceiling); "wall speed retention" keeps the pre-impact |vx| for 60 ms and a wall jump in that window leaves at max(wallJumpX, kept speed); the chaser spawn checkpoint is `TUNING.en.chaserCp` (3 = the fourth split); the position-only ghost draws as a grey capsule; slow motion keeps simulated time on the timer, flags the run "assisted" and the board rejects it; the countdown-replay restart mode still replays the countdown on every attempt because that is the game today; the showcase frame forces juice and animation toggles on and restores them afterwards.
