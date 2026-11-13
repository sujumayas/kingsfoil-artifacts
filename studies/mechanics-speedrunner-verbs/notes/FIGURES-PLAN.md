# Figure plan for mechanics-speedrunner-verbs (shared by two figure agents)

Same rules as Mechanics #1 (`studies/mechanics-speedrunner/notes/FIGURES-PLAN.md`, read it first): vector ink on paper,
no pixel art, canvases 640x360 or 640x200, facts from `studies/mechanics-speedrunner-verbs/report.md` only, illustrative
numbers labelled, auto-play when idle, loops never run out, slow-motion toggles where frames matter, audio gesture-gated
and off by default, zero console errors, no horizontal overflow at 390 px, captions in the user's style (no em dashes, no
colons as connectors, straight quotes, no literal backticks in figcaptions, use `<code>`).

Figure names are FIXED. Markup follows `studies/mechanics-speedrunner/figs1.html` (`<figure class="fig" data-demo="name"
id="fig-name">`, `.fig-h` with `Fig. @N`, `.illu` label, canvases, controls, figcaption), demos registered with
`reg('name', …)`. Each agent uses its own scratch folder: Agent R `notes/scratch-figR/`, Agent F `notes/scratch-figF/`.

Shared helpers: `studies/mechanics-speedrunner-verbs/core.js` is a copy of #1's core.js and already has the `SR` namespace
(SR.PHYS, SR.step with every forgiveness option, SR.makeCourse, SR.drawSolids, SR.drawSamurai, SR.targetPose, SR.blend,
SR.dust, SR.cam, SR.sfx, SR.ink, SR.text, the bot autopilot; signatures in `studies/mechanics-speedrunner/notes/scratch-figR/HELPERS.md`).
Agent R extends `SR.step` with a verb layer in its first 25 minutes: `SR.VERBS` (the report's §7 table), a verb state
machine with startup/active/recovery and the cancel table, resources (dash charge, stamina, fuel) and the verb poses
(crouch, slide, dive, pound, mantle, wall run, climb, swing with a rope, glide, thrust, charge, dash-slash trail, pogo,
iai arm). It writes the final signatures to `notes/scratch-figR/HELPERS.md`. Agent F may start with local copies in
demos2.js under a `local` namespace and switch if cheap; demos2.js must work even if the helpers never land. The
sandbox `studies/mechanics-speedrunner-verbs/sandbox.html` has a working verb state machine to copy from.

## Agent R (recipe owner): build.py, hero.html, core.js, style.css, study.css, figs1.html + demos1.js, figs3.html + demos3.js
The recipe is cloned from #1 and still asserts #1's counts. Adapt it to this report: 39 profiles, families
[6,6,4,5,5,5,4,4], 5 generations, 64 index rows, 197 sources, 9 layers, RLAB unchanged (Feel, Readability, Run fit,
Cheapness, Evidence), §6 headers as in the report (6a `| Game | Dash speed (x run) | Duration | Distance | Directions | Refill | Cooldown | Source |`,
6b `| Game | Verb | Hitbox change | Speed | Minimum or duration | Cancels | Source |`, 6c `| Game | Verb | Reach | Anchor | Release rule | Period or duration | Resource | Source |`,
6d `| Verb | Startup | Active | Recovery | Hitbox | I-frames | Cancels | Bounce or exit | Source |`, 6e `| Game | Action buttons (plus direction) | Verbs | Context inputs | Speedrun categories or rules | Source |`),
FAMSUB and DEEPSUB labels, chips (named games, precision platformers, ropes and flight, katana games, makers and party),
the Context split anchor `**Five equal priorities.**`, title and meta description, CTA "Play the SpeedRunner Verbs Sandbox ↗"
linking `mechanics-speedrunner-verbs-sandbox.html`, footer "Mechanics #2", byline November 2026, AFTER_PROFILE for all
41 figures (including Agent F's 25), EXPECTED with all 42 plus stack. If a count in the report differs, trust the report.
figs1.html / demos1.js
- `hero` (hero.html; demo in demos1.js): the verbs gym on loop. The samurai runs the gym with the Recommended set (crawl
  under the corridor, slide-jump the gap, mantle the ledge, pogo-slash the pit, dash-slash the enemy, hook the ring),
  then the same loop with "Today" (the slow routes), buttons "Today", "Recommended", "Kitchen sink"; a timer, a ghost of
  the other set, a live ms readout.
- `timeline`: the §3 generations, clickable.
- `dash` (A1): the dash arc with sliders for speed multiple, duration, exit speed and refill rule; a gap that only the dash clears; Celeste's numbers as a reference line.
- `dashdirs` (A2): 2, 4 or 8 directions on a wheel over the gym; which gaps each set opens; the author's-regret caption.
- `aircharge` (A3): one air charge spent as an air dash or a double jump; the two arcs over the same gap; refill on landing or wall.
- `doublejump` (A4): refill rules (ground only, wall, enemy) and the double jump at 0.85 x jumpVel; a chain of gaps.
- `dashjump` (A5): super, hyper, wavedash, ultra and the roll-jump hyper as arcs with their speeds, side by side.
- `glide` (A6): fall speed curves (0.25 glide, cape, Rayman hover) against the time attack cost of slow falling.
- `crouch` (B1): the hitbox swap to 57% under a low corridor; "stand only if free"; crawl speed slider.
- `slide` (B2): crouch-slide and slide-jump against the hyper over the same low gap; friction slider.
- `longjump` (B3): SM64's launch table as arcs (jump, backflip, side flip, long jump) converted to BL.
- `dive` (B4): a dive at 600 u/s into a prone landing with the recovery bill; cancel into roll.
- `pound` (B5): ground pound and stomp fast fall; the crate; the 230 u roll feed.
figs3.html / demos3.js
- `score` (§5) sortable scorecard with radar; `matrix` (§5) feel vs cost scatter with family colours.
- `dashchart` (6a): dash distance in BL and speed multiple per game as a dot chart with SpeedRunner's proposal marked.
- `budgetchart` (6e): verbs against action buttons per game as a scatter, with SpeedRunner today and proposed.
- `stack` is generated by build.py from §7 (9 layers).

## Agent F: figs2.html + demos2.js only (never edit build.py, core.js, hero.html, figs1/3, demos1/3, style.css, study.css)
- `spinjump` (B6): spin jump against the normal jump (SMW table), the safer body, the enemy bounce.
- `ledge` (C1): Spelunky's hang against Celeste's climb hop; automatic mantle on the gym ledge; toggle hang.
- `wallrun` (C2): a fixed-distance wall run (92 u over 250 ms) into the slide; speed threshold slider.
- `stamina` (C3): Celeste's 110-point budget as a live bar while climbing, hanging and climb-jumping; the 4 climb-jump rule.
- `crouchwall` (C4): the conflict rules: crouched against a wall (no wall kit), Down on a one-way tile (never drops), the probe heights.
- `swing` (D1): the pendulum constraint in three lines, a ring hook on the gym, the 760 u/s release cap; period readout.
- `hookpoints` (D2 and D3): hook points against any surface, pull hooks, and the reel and elastic references as toggles.
- `jetpack` (D4): a one-button corridor at 3500 u/s² thrust; Flappy time-to-apex comparison; vehicle swaps as a caption.
- `charged` (D5): Jump King's 0.6 s linear charge to 0.6 to 1.5 x jumpVel; hold and release; no air control while charged.
- `hammer` (E1): the hammer as an analog verb: a pot with a hammer following the pointer on a slope (figure only, labelled).
- `drawslope` (E2): draw a slope with the pointer under a skier; speed from slope; lift to jump (figure only).
- `tilt` (E3): tilt steering as a device-orientation or slider input on a rising course with fixed-height item swaps (spring, propeller, jetpack, rocket as height multiples).
- `fallguys` (E4): dive and grab timings against a clock; why the ragdoll costs a time attack.
- `antiverbs` (E5): Cat Mario's trick vocabulary on a comedy map; a toggle "learned once" showing the second attempt's time.
- `dashslash` (F1): the dash-slash kill line (2/12/6 steps, 840 u/s, 84 u) through an enemy; momentum readout.
- `pogoslash` (F2): Down and katana in the air, 40x50 u box, 830 u/s bounce, dash refund; a pit of spike-topped enemies.
- `deflect` (F3): the slash box against a 600 u/s shot: the emergent 14-step window; no stance; compare with a 120 ms parry.
- `iai` (F4): hold to arm at 200 ms, full at 300 ms, release into a longer dash-slash; the whiff recovery bill.
- `slowtime` (F5): slow time as a resource and what it does to the timer, hitstop and smears per verb; "ranked off" toggle.
- `kits` (G1 and G3): power-ups as kits per level (cape, propeller, shell), items and gadgets as temporary verb swaps.
- `cards` (G2): Neon White's discard cards priced in ammo as a route; medal ladder as verb ladder.
- `placeblock` (G4): UCH's place-one-block loop and the async ghost-trap chain; place a block, run, the next ghost runs it.
- `budget` (H1 and H2): verbs per button per game; a mapping board for SpeedRunner's 3 buttons with tap, hold, release and chords.
- `fsm` (H3): the verb state machine with startup, active, recovery and the cancel table, stepped live with an input strip.
- `inputlog` (H4): the two-byte RLE log with verb bits, live bytes per minute, a TAS-style text view, categories on the board.

## Figure -> section map (Agent R puts this in build.py)
Place each figure after the profile it explains (first id for pairs: `hookpoints` after D2, `kits` after G1, `budget` after H1).
`dashchart` in 6a, `budgetchart` in 6e, `score` and `matrix` after §5, `timeline` in §3, `stack` in §7, `hero` at the top.
Count: Agent R 17 (hero, timeline, dash, dashdirs, aircharge, doublejump, dashjump, glide, crouch, slide, longjump, dive,
pound, score, matrix, dashchart, budgetchart) + Agent F 25 (spinjump, ledge, wallrun, stamina, crouchwall, swing, hookpoints,
jetpack, charged, hammer, drawslope, tilt, fallguys, antiverbs, dashslash, pogoslash, deflect, iai, slowtime, kits, cards,
placeblock, budget, fsm, inputlog) = 42 figures plus the stack.
