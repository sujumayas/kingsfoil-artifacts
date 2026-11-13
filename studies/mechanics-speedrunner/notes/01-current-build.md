# 01. Current build: SpeedRunner as served on 13 Nov 2026

Read from the single-file bundle at https://speedrunner-tau.vercel.app/ (script about 115 KB, header
"SPEEDRUNNER — single-file build (v0.1: Map 1 + full movement kit)"). No repo access. Every number below is a
[K] Kingsfoil fact from that bundle. Units are world units (u); the hero is 20 u wide and 46 u tall, so
1 body length (BL) = 46 u. The view is 1280x720 at zoom 1.32, so about 970x545 u are visible on a 16:9 screen.

## Simulation
- Fixed physics step `DT = 1/120` s with an accumulator; frame delta clamped to 0.1 s; render interpolates with `acc / DT`.
- Input: `keys` map plus a one-shot `jumpPressed` flag consumed by the next physics step. Keys: A/D or arrows move,
  Space/W/Up jump, R restart, Esc pause, F fullscreen, M mute. Window blur pauses the run. No gamepad, no touch.
- Test hook `window.__sr` exposes `PHYS`, `P`, `game`, `tick`, `step`, `startRun`, `MAPS`. `?fps` shows an FPS and draw-ms meter.
  `?map=<id|n>` jumps straight into a map.

## Movement constants (`PHYS`)
| Name | Value | Meaning |
|---|---|---|
| maxRun | 420 u/s | top ground speed (9.1 BL/s; crosses the 970 u view in 2.3 s) |
| groundAccel | 2700 u/s² | 0 to maxRun in 156 ms (about 19 physics steps) |
| turnAccel | 5200 u/s² | reversing direction on the ground |
| groundFric | 3000 u/s² | no input: maxRun to 0 in 140 ms |
| overspeedDecay | 500 u/s² | bleed when above maxRun (after a roll or wall jump) |
| airAccel | 1900 u/s² | air control; never clamps below the speed you already carry |
| airDrag | 160 u/s² | no input in the air |
| gravity | 2500 u/s² | rising |
| fallMult | 1.65 | falling gravity 4125 u/s² |
| apexMult / apexBand | 0.55 / 90 u/s | gravity x0.55 while jump is held and vy is within 90 u/s of the apex |
| maxFall | 1150 u/s | terminal velocity (25 BL/s) |
| jumpVel | 830 u/s | full jump: apex at 830²/(2·2500) = 138 u = 3.0 BL, time to apex 332 ms (without the apex band) |
| jumpCut | 0.45 | releasing jump early multiplies vy by 0.45 (minimum jump about 0.6 BL if cut at once) |
| coyote | 0.10 s | 12 physics steps of grace after leaving a ledge |
| buffer | 0.13 s | a jump press is kept for 130 ms until it can fire |
| wallSlideMax | 115 u/s | slide speed on a wall |
| wallStick | 0.10 s | first touch of a wall: vy capped to 25 u/s for 100 ms |
| wallCoyote | 0.08 s | wall memory: a wall jump still fires 80 ms after leaving the wall |
| wallJumpX / wallJumpY | 440 / 790 u/s | wall jump away from the wall |
| wallJumpSameY | 330 u/s | jumping the same wall twice in a row gives less height |
| wallClimbX / wallClimbLock | 190 u/s / 0.07 s | holding into the wall: a climb jump, more up, less out |
| wallLock | 0.15 s | air control locked after a wall jump |
| rollFall / rollTime / rollMinSpeed | 230 u / 0.42 s / 280 u/s | landing after a 230 u (5 BL) fall rolls for 420 ms and keeps at least 280 u/s |
| flipTime / flipMinSpeed | 0.46 s / 250 u/s | a jump at speed flips (after 100 ms of hold) |

Other movement facts: a jump needs `buffer > 0` and `coyote > 0`; wall jumps use the wall memory. Horizontal and
vertical collision are resolved separately with a bounded loop (6 iterations) against AABB solids. One-way "tiles"
(roof tiles and every mover) are landable from above only when `vy > 0` and the feet are within 3 u of the top
(plus the platform's rise this step). Movers carry the player (`carryVx`) and push them out when they move into them;
leaving a mover gives no extra speed. A wall probe 2 u wide over the middle 30 u of the body sets `wallDir`.
Landing after a fall over 50 u plays a 130 ms land squash and dust; death spawns 22 dust particles.

## Camera
- Horizontal: locked to the player, no lag, with a fixed 120 u look-ahead toward the right (`VW·0.36` from the left edge).
- Vertical: follows a reference that updates on landing, wall slide or when falling below it; climbing moves it only
  when the feet rise 60 u above it (dead zone). Lerp rate 5 per second, 9 on walls. Clamped to the map's `top` and
  to `floorView`.

## Maps
Solids are `[x, y, w, h, tag]`, ground top at y 600. Four maps plus one locked card.

| Map | Difficulty | Width (u) | Vertical span | Checkpoints (x) | Finish x | Hazards | Teaching notes in the source |
|---|---|---|---|---|---|---|---|
| m1 FIRST STEPS | Easy | 6830 | top -320, death 650 | 1130, 2120, 3040, 4500 | 5880 | 2 spike strips (120, 100 u) | rock "big enough to need a real jump", steps, a momentum gap, a chimney (wall jumps), a high drop (roll), 3 narrow platforms over a void, a ledge |
| m2 ROCKY MOUNTAIN | Medium | 8700 | top -700 | 2930, 4100, 4460, 6030 | 7750 | 2 spike strips | "SKILL 1 rising steps", pillar run over the void, a cave with a low ceiling and hanging rocks ("small hops only"), a 600 u wall-jump climb, a sky run, a drop chain (roll twice) |
| m3 THE DUNGEON | Hard | 4580 | top -1350, death 1250 | 4 checkpoints at the top of each climb | 3630 at y -300 | 9 spike strips, 4 of them on ceilings ("needle-capped climbs" 550 to 800 u) | generated: halls plus 4 climbs, each exits through a doorway and 2 drops |
| m4 STAIRWAY OF CLOUDS | Hard | 6550 | top -1250, death 900 | 4 | 5600 at y -830 | 1 spike strip, movers, wheels | a maze of one-way roof tiles with several routes, 3 moving platforms (periods 2.6 to 3.2 s), 3 wheels (radius 92, 4 tiles each, periods 3.6 to 4.2 s) |
| 5 SAMURAI TRIAL | Expert | locked | | | | | |

At 420 u/s a 6830 u map is at least 16 s of pure running; a fresh player's first clear is unknown (no telemetry seen).
Death: spikes are 16 u tall hitboxes inset 4 u on each side; falling below `deathY` kills. Dead for 0.38 s, then the
whole map restarts with a 3 s countdown (so death to control is about 3.4 s, plus the restart on `R` which also
goes through the countdown).

## Race loop, ghost and duel
- Timer starts after the 3-2-1 countdown (`game.time` from 0). Checkpoints record `splits[i]` in ms and show the
  delta against `pbSplits` for the map. Results list per-section times and the delta per section (green minus, red plus).
- Ghost: recorded at 30 Hz as 18 numbers per frame (x, y, facing, rotation, pivot, scale x/y, kimono flap, 10 pose
  angles), values rounded to 0.1 u or 0.01 rad, stored in `localStorage` as `sr_ghost_<map>`. Only the fastest run
  is kept as the shadow. Drawn at 10% alpha during a run (toggle), 37.5% in the duel. Interpolated between samples.
  Size: a 60 s run is 1800 frames x 18 numbers, about 100 KB as JSON text.
- Duel: 3.7 s cutscene after the flag (walk 0.65 s, stance, jump at 0.75 s, blades cross at 1.33 s, land at 1.9 s,
  head at 2.25 s, fall, sheathe, victory pose). Tie: 2.4 s, both bow. The timer has already stopped.
- Validation: `ms > 6000 && game.validSteps`; the run is registered with the server at start (`action: start`,
  returns a run id) and submitted with that id (`action: submit`). Names 3 to 16 chars, claimed with a random
  16-byte device token; rename supported; 409 when taken. `SEASON = 2` wipes local records when it changes.
- Leaderboard: GET `/api/lb?map=&start=&name=` returns `top` (page of 7), `wr`, and the player's own rank.

## Audio
WebAudio synth only, no samples: jump 420 to 760 Hz triangle 90 ms, wall jump square plus noise, land noise 80 ms,
roll noise 220 ms, die sawtooth 300 to 70 Hz 300 ms, checkpoint 880 to 1320 Hz sine 120 ms, finish a 4-note arpeggio
(523, 659, 784, 1046 Hz) at 80 ms spacing, countdown beeps, slash and sheath for the duel. Muted until a user gesture.

## Animation
Procedural rig: hip height, lean, two thigh, two shin, two upper-arm, two forearm angles, blended toward a target
pose with `1 - exp(-26·dt)` (about 38 ms time constant). Poses: idle breathing, run cycle driven by `phase +=
|vx|·dt·0.042` (a stride every 150 u, about 2.8 strides per second at top speed), rising, apex, falling, wall slide,
land crouch 130 ms, roll, flip (rotation over 0.46 s). Kimono flap is a spring (stiffness 160, damping 14) driven by
speed and vy. Hand grips the katana except on walls, flips and rolls. Dust: 7 particles on jump, 9 on wall jump,
6 on land, 10 on roll, 1 every 90 ms minus speed/10000 while running over 260 u/s.

## Not instrumented, not built
- No deaths-per-map, attempts-per-clear, or time-to-first-clear telemetry (the server sees only starts and finishes).
- No enemies, no collectibles, no springs, no breakable or timed blocks, no touch controls, no gamepad, no input
  display, no friends board, no live race, no level editor, no replays beyond the local shadow, no assist options.
- Restart costs about 3.4 s because every attempt replays the 3 s countdown.
