# Figure plan for mechanics-speedrunner (shared by two figure agents)

The study weighs FEEL, READABILITY, RUN FIT, CHEAPNESS and EVIDENCE together. Every figure must feel good to poke at
and read as SpeedRunner's art: ink on paper. Figures are drawn as VECTOR (Canvas2D paths, anti-aliased, crisp lines),
white or paper background, black solids, one red accent (#d0281f), grey for ghosts and annotations. No pixel art,
no bitmap font: use `ctx.fillText` with the page's system font stack, and no `image-rendering: pixelated` on this
study's canvases (Agent R removes that rule from `style.css` for `.stage canvas` and sets the stage background to paper).
Canvases are 640x360 (or 640x200 for charts) and scale to the stage width with `aspect-ratio`. Where a technique has a cost or a
byte count, show a live readout measured with `performance.now()` or computed for real, labelled measured or illustrative.

Figure names are FIXED. Each `<!--FIG name-->…<!--/FIG-->` block lives in the file listed, and its demo is registered
with `reg('name', …)` in the matching demos file. Markup follows `studies/feel-loot-pickup/figs1.html` exactly
(`<figure class="fig" data-demo="name" id="fig-name">`, `.fig-h` with `Fig. @N`, title, `.illu` label when numbers are
illustrative, canvases, controls, figcaption). Figures use only facts in `studies/mechanics-speedrunner/report.md`
(and `notes/01-current-build.md` for the game's constants); label illustrative numbers. Animations run through the
core.js demo runner (`requestAnimationFrame`, paused offscreen). A figure plays on its own when nobody touches it; one that
waits for a press auto-plays after about 2 s idle and hands control back on a click. Loops never run out (the runner
restarts the course). Audio only after a gesture, off by default. Every figure works at 390 px phone width without
horizontal overflow and with zero console errors. Many figures should offer a 0.25x slow-motion toggle. Captions follow
the user's style: plain words, no em dashes, no colons as mid-sentence connectors, straight quotes.

Each agent uses its own scratch folder: Agent R `notes/scratch-figR/`, Agent F `notes/scratch-figF/`. Never write in the other's folder.

Shared helpers (Agent R puts them in core.js FIRST, within its first 20 minutes, and keeps the API stable; Agent F may
start with a local copy inside demos2.js of the same signatures if they are not there yet, then switch):
- `SR.PHYS` the game's constants (from 01-current-build), `SR.step(P, input, dt, opts)` a faithful port of the game's
  movement and AABB collision (coyote, buffer, jump cut, apex band, fall mult, wall stick/slide/jump, roll, one-way tiles,
  movers on a clock) with every forgiveness feature switchable through `opts`; `SR.makeCourse(seed|spec)` small level
  builders; `SR.drawSolids(ctx, solids, cam)`, `SR.drawSamurai(ctx, pose, x, y, facing, o)` the stick samurai rig
  (port the game's `drawSamurai` / `katanaBlade` / pose blending from `notes/scratch-sandbox/speedrunner-served-2026-11-13.js`,
  simplified), `SR.targetPose(P)`, `SR.blend(pose, target, k)`, `SR.dust(...)` particles, `SR.cam(...)` the camera modes,
  `SR.sfx(name)` the synth sounds, `SR.ink` colours, `SR.text(ctx, str, x, y, o)`.
- A scrolling mini-course renderer so a figure can show a runner on a course with a camera.

## Agent R (recipe owner): build.py, hero.html, core.js, style.css, study.css, figs1.html + demos1.js, figs3.html + demos3.js
The recipe is `studies/mechanics-speedrunner/build.py` (cloned from feel-loot-pickup, still asserting that study's counts).
Agent R adapts it to this report: 40 profiles A1-H5 (families [6,5,5,4,6,5,4,5]), 5 generations, 50 index rows, 218
sources, 9 layers, criteria `RLAB = ['Feel', 'Readability', 'Run fit', 'Cheapness', 'Evidence']`, §6 table headers
(6a `| Game | Jump height | Apex time | Fall gravity | Coyote | Buffer | Corner correction | Source |`, 6b, 6c
`| Game | Death to control | Level unit | Medal or par ratios | Source |`, 6d `| Method | Rate | Bytes per minute | Verifiable by re-simulation | Survives a physics patch | Source |`,
6e `| Layer | What it stops | Cost | Who does it | Source |`; read 6b's header from the report), FAMSUB / DEEPSUB labels,
stack subtitles, index quick-filter chips (named games, precision platformers, runners, makers and party, time attack),
the Context split sentence (the anchor is `**Five equal priorities.**`), title, meta description, CTA and sandbox copy
("Play the SpeedRunner Mechanics Sandbox"), the sandbox link `mechanics-speedrunner-sandbox.html`, footer "Mechanics #1",
byline November 2026, the series nav from the catalog. Page theme stays the library's dark page; the figure stages are paper.
figs1.html / demos1.js
- `hero` (hero.html; demo in demos1.js): a live mini course that loops. The samurai runs, jumps a gap, wall-jumps a chimney,
  lands on a mover, finishes, restarts instantly; a grey ghost of the previous loop; a timer and a split delta. Buttons
  "Today", "Recommended", "No forgiveness", "Floaty"; a live ms readout.
- `timeline`: the §3 generations, clickable.
- `jumparc` (A1): the jump arc with sliders jumpVel, gravity, fallMult, apexMult, jumpCut; overlay the 6a arcs of Celeste,
  SMB1 and N++ in body lengths; readouts height in BL, apex ms, fall ms; hold/release demo for the variable jump.
- `forgiveness` (A2): a runner leaving a ledge with a press-timing slider (-150 to +150 ms around the edge); coyote and
  buffer windows drawn as bands; success or fall; corner correction toggle with a ceiling corner and a ledge lip (8 u).
- `momentum` (A3): speed over time under the accel, turn, friction and overspeed decay numbers; air control; jump boost
  and lift boost toggles; a readout of time to cross one screen.
- `wallkit` (A4): wall stick vs slide ramp, wall jump away vs climb jump, same-wall penalty; wall coyote band.
- `speedtech` (A5): the roll-jump hyper vs a plain jump side by side, time saved per gap; dash reference (Celeste numbers).
- `inputchain` (A6): the input latency chain (key event, 120 Hz step, 60 Hz frame, present) as an animated timeline with
  a slider for the render rate; touch layout mock (one-thumb mode) for a phone.
- `rig` (B1): the procedural rig: pose targets (idle, run, rise, apex, fall, wall, land, roll) blended with a slider for
  the 38 ms time constant; foot planting toggle; kimono spring.
- `squash` (B2): jump stretch (0.6, 1.4) and landing squash scaled by fall speed, dust gate at 575 u/s, trails; toggles.
- `camera` (B3): a scrolling course with camera modes lock + look-ahead / lerp / platform snap; dead zone and killbox clamp overlays; a blind-drop case.
- `audio` (B4): buttons for the synth sounds with pitch jitter; a death with "music keeps playing" vs "music restarts".
- `uimotion` (B5): countdown digits, split deltas in LiveSplit colours, results bars, an input display strip.
figs3.html / demos3.js
- `score` (§5): the sortable scorecard with a radar (copy feel-loot-pickup's score pattern).
- `matrix` (§5): feel vs cost scatter: (Feel + Readability + Run fit) against (Cheapness + Evidence); family colours; click shows the profile.
- `restartcost` (6c): death-to-control seconds per game as a bar chart with SpeedRunner's 3.4 s and the 0.5 s target line.
- `bytes` (6d): ghost bytes per minute per method on a log scale (the Sandbox's measured numbers and the game today).
- `stack` is generated by build.py from §7 (9 layers).

## Agent F: figs2.html + demos2.js only (never edit build.py, core.js, hero.html, figs1/3, demos1/3, style.css, study.css)
- `spring` (C1): spring launch at 1.45x with auto-jump semantics vs a plain jump; side booster; compressed frame.
- `clock` (C2): movers, wheels and timed blocks driven by a level clock; a scrub slider for time; "every attempt sees the same" shown by two runners started at different wall times.
- `telegraph` (C3): a timed block's pre-shake and the 1 s warning rule; spike silhouettes; toggle warnings off to feel the unfairness.
- `routes` (C4 and E3): a map with a safe line and a designed skip; sliders for skip save (s) and fail chance; shows when the skip pays with the 3.4 s and 0.5 s restart costs.
- `checkpoints` (C5): splits only vs respawn vs Trackmania's both; death at section 3 and what each mode costs.
- `patroller` (D1): a clock patroller with hitbox inset and the 2-step contact rule; slow motion.
- `chaser` (D2): a chaser at 0.85 x maxRun spawned 1.5 s after a split; the pace margin bar; a slow player gets caught.
- `stomp` (D3): the stomp bounce at full jumpVel and a refund; a shell-as-platform case.
- `slash` (D4): the 100 ms slash (17 wind-up, 33 active, 50 recovery), 50x40 u hitbox, cancel by jump, momentum kept; frame strip.
- `medals` (E1): the medal ladder from an author time slider (x1.06, x1.2, x1.5) over the four maps' run lengths.
- `teach` (E2): the four maps as a structure diagram (teach, develop, twist, resolve) with the skills each section introduces.
- `readability` (E4): gaps and platforms in body lengths against the jump arc; blind-drop framing rule.
- `daily` (E5): a seeded chunk generator: rhythm first, tagged chunks, a bot-proof pass; a seed input and a Generate button.
- `maker` (E6): UCH's one piece per round growing a level; the 20 s Mario Maker speedrun level format.
- `restart` (F1): cost of failure over 50 attempts: countdown vs instant; minutes lost; "deaths before quitting" illustrative.
- `ramp` (F2): the campaign ladder and the inside-level sawtooth with the hard part early and a sprint finish.
- `troll` (F3): honest expert vs troll: a learned-once trap vs an execution test; attempts to clear and time on record.
- `telemetry` (F5): deaths by section heatmap and funnel from a tiny simulated cohort of 5 testers.
- `boards` (G1): friends-first, around-me and percentile boards from the same data; a season column over a permanent board.
- `rivals` (G2): a pickable shadow with owner colours and the rival toast.
- `share` (G4): a share card and course code; the two-tier (verified / unverified) board.
- `ghostbytes` (H2): a live encoder: record a scripted run, show bytes for input log RLE, 15 Hz track, 30 Hz JSON, delta.
- `validate` (H3): the plausibility ladder and server re-simulation: tamper with a time or a PHYS constant and watch each check fail.
- `plumbing` (H5): live ghost race plumbing: polling vs WebSocket vs WebRTC with latency and bytes per second sliders.

## Figure -> section map (Agent R puts this in build.py)
Place each figure after the profile it explains (AFTER_PROFILE, ids in parentheses above; `routes` after C4). `restartcost`
goes in 6c, `bytes` in 6d, `score` and `matrix` after §5, `timeline` in §3, `stack` in §7, `hero` at the top.
Count: Agent R 17 (hero, timeline, jumparc, forgiveness, momentum, wallkit, speedtech, inputchain, rig, squash, camera, audio,
uimotion, score, matrix, restartcost, bytes) + Agent F 24 (spring, clock, telegraph, routes, checkpoints, patroller, chaser, stomp,
slash, medals, teach, readability, daily, maker, restart, ramp, troll, telemetry, boards, rivals, share, ghostbytes, validate,
plumbing) = 41 figures plus the stack.
