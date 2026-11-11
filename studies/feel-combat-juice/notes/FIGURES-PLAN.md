# Figure plan for feel-combat-juice (shared by two figure agents)

The study weighs FEEL AND PIXEL ART, MMO PROBLEMS, IMPLEMENTATION and RUNTIME COST together. Every figure must look good as pixel art and feel good to poke at: snappy timings, crisp bitmap numbers, sound where noted. Where a technique has a cost, show a live readout (measured with performance.now() in the demo, or the report's measured figure from §6d, labelled which is which).

Figure names are FIXED. Each `<!--FIG name-->…<!--/FIG-->` block lives in the file listed, and its demo is registered with `reg('name', …)` in the matching demos file. Markup follows studies/feel-npc-dialog/figs*.html exactly (`<figure class="fig" data-demo="name" id="fig-name">`, `.fig-h` with `Fig. @N`, title, `.illu` label when numbers are illustrative, canvases, controls, figcaption). Figures use only facts in studies/feel-combat-juice/report.md; label illustrative numbers. No images, no game art: original pixel drawings in code and the shared bitmap font and glyph-atlas helper in core.js (already there from feel-npc-dialog; Agent R adds a shared tiny-knight/goblin sprite helper, a pre-baked white-silhouette helper and a damage-number helper so every figure looks the same). Animations via the core.js demo runner (requestAnimationFrame, paused offscreen). Audio only after a user gesture, off by default. Every figure works at 390 px phone width without horizontal overflow and with zero console errors. Many figures should offer a 0.25x slow-motion toggle so readers can see frames. Captions follow the user's style: plain words, no em dashes, no colons as mid-sentence connectors.

Each agent uses its own scratch folder: Agent R `notes/scratch-figR/`, Agent F `notes/scratch-figF/`. Never write in the other's folder.

The recipe is studies/feel-combat-juice/build.py (cloned from feel-npc-dialog, still asserting that study's counts). Agent R adapts it to this report: 40 profiles A1-H5 (families A6, B7, C4, D5, E5, F5, G3, H5), 5 generations, 34 index rows, 182 sources, 9 layers, criteria `RLAB = ['Impact', 'Clarity', 'MMO fit', 'Fairness', 'Speed']`, §6 table headers (6a-6e), FAMSUB / DEEPSUB labels, stack subtitles, index quick-filter chips, Context split sentence, title, meta, CTA and sandbox copy, byline November 2026.

## Agent R (recipe owner): build.py, hero.html, core.js, style.css, study.css, figs1.html + demos1.js, figs3.html + demos3.js
figs1.html / demos1.js
- `hero` (hero.html; demo in demos1.js): a live mini arena. The knight fights goblins with hitstop, flash, numbers, shake; buttons "Targeted", "Aimed", "Crowd", "No juice"; live ms readout.
- `timeline`: the §3 generations, clickable.
- `swing` (A1): sword / spear / hammer swings with the report's per-frame ms (sword 100/50/50/50/100/50); frame strip with the strike frames marked; slider for anticipation and hold; slow motion.
- `smear` (A2): swing with smear frame on/off, the hitbox arc sweeping with the smear; slow motion.
- `directions` (A3): 4 vs 8 vs 4 with mirroring; body and weapon layers; live art-cost counter (frames per attack) from the report's table.
- `rhythm` (A4): auto-attack every 2000 ms; "swing on the hit" vs "swing at the start" vs Tibia (no swing, effect only); combat idle between.
- `cancel` (A5): recovery cancelled into movement locally; startup cancel judged by the server with a latency slider.
- `cast` (A6): raise, hold loop, release on the castpoint; cast bar with interruptible vs not (shield) and a server timestamp.
- `hitstop` (B1): two knights trading hits while other players walk past. Per-entity vs global hitstop toggle (global freezes everyone: shows why it breaks a shared screen); frames slider; the report's frame table (normal 3, heavy 5, crit 6, kill 8, cap 8); Smash formula curve with the ramp to 0.75.
- `flash` (B2): white 2 frames + 4-frame fade (100 ms), Heroes of Hammerwatch red 50% overlay over 100 ms, purple invulnerable pulse; a cost toggle "baked silhouette vs per-frame source-atop" with a live ms readout over 100 sprites.
- `knockback` (B3): server knockback (1 tile over 150 ms, tile-snapped) vs cosmetic recoil (px out 3 frames, back 3); squash on/off.
- `reaction` (B5): a crowd of small hits; flinch only above max HP / 16 or crit (slider for the divisor), shows how constant flinching looks vs thresholded.
- `trauma` (B6/B7): hit buttons add trauma; live graph of trauma and shake = trauma² (toggle ³); noise vs white random; positional mode with a draggable slam source and 6-tile linear falloff; whole-pixel offsets.
- `numbers` (C1): Tibia rules live (1000 ms life, 48 px rise at 32 px scale shown at the figure's scale, fade from 833 ms, merge within 400 ms, stack 12 px under 250 ms); a hits-per-second slider.
- `aggregate` (C2): many attackers on one target; aggregation on/off, caps 4 per target and 64 on screen; counters (alive, merged) and live ms.
- `crit` (C3): crit emphasis stack (bigger digits, 2x pop for 3 frames, 1200 ms life, extra hitstop, kick, sound); Diablo III big-hit rule (orange only if above the last orange, bar drops 3% per second) with a live bar.
- `misses` (C4): mine vs others tiers (others dimmed or hidden); MISS / DODGE / IMMUNE / BLOCK texts.
figs3.html / demos3.js
- `costs` (6d): the measured benchmark as a log-scale bar chart (GPU / 6x CPU throttle / SwiftShader) with the 16.7 ms frame line; machine info label (M4 Pro, Chromium 153).
- `score` (§5): the scorecard, sortable, with a radar for the selected row (copy feel-npc-dialog's score pattern).
- `matrix` (§5): feel vs cost scatter, each profile at (Impact + Clarity) against (MMO fit + Fairness + Speed); family colour; hover/click shows the profile.
- `stack` is generated by build.py from §7 (9 layers).

## Agent F: figs2.html + demos2.js only (never edit build.py, core.js, hero.html, figs1/3, demos1/3, style.css, study.css)
Use the helpers Agent R puts in core.js; if they aren't there yet, put a local copy inside demos2.js with the same look.
- `targetui` (D1/D5): click targeting with Tibia's battle list (sort orders), the red target square and black attacker square, target ring, target frame and target of target.
- `tabcycle` (D2): Tab cycling by Chebyshev distance, ties by clockwise angle from facing then lowest id; combat lock and "players first in PvP" toggles; numbers show the cycle order.
- `softlock` (D3): aimed skill with a snap cone slider (0-90, PvE 15, PvP 0); start direction snaps, never curves after release.
- `tapdrag` (D4): mobile-MOBA controls; tap fires at the auto pick (Closest / Lowest HP / Lowest HP %), drag aims, drag back cancels; the edge-of-range flip with and without 1-tile hysteresis.
- `castmodes` (E1): normal cast, quick cast, quick cast with indicator; count presses and time-to-fire.
- `skillshot` (E2): line skillshot at the report's tiles/s, width and range; tail that shows direction in a still frame; hitbox vs visual toggle.
- `groundaoe` (E3): ground circle that resolves when the marker ends (lead slider; trash 500, caster 1200, elite 2500 ms; minimum 400); dodge by walking out; "resolve on explosion" wrong-way toggle to feel the unfairness.
- `nearmiss` (E4): projectiles past a dodger; whiff cue within 0.5 tile, only after the projectile passed; dodger and caster see it.
- `predict` (F1/F2): latency slider 0-400 ms; modes wait for server / predict animation / predict animation + effects / predict numbers (phantom numbers on rejection); targeted bolt launches locally and lands on confirm.
- `favour` (F3): two clients with ping; favour the target (server checks positions now) vs favour the shooter (rewind); who feels cheated in each.
- `ticks` (F4): 600 ms tick (OSRS) vs 100 ms step vs per-entity scheduling (Tibia 2000 ms swings, creatures in 100 ms buckets); press timing vs fire timing.
- `tiers` (F5/H1): 30 players in one fight; effect tiers own / party / others with full / reduced / off; hostile always on; source tags OWN / OTHERS / CREATURES; particle and number counters with live ms.
- `queue` (G1): the same button mashing under WoW queue window (slider 0-400, last press wins), Tibia exhaust (rejected, "You are exhausted"), OSRS tick, FFXIV lock (500 ms client, about 600 ms server plus ping); timeline of presses vs fires.
- `pvp` (G2/G3): crowd-control DR timeline (100%, 50%, immune, 20 s reset, 6 s cap) and knockback immunity; PvP damage × 0.5 and asymmetric reactions (no hitstop on the victim player).
- `voices` (H2/H3): a WebAudio voice pool (16 voices, 3 per sound id, 40 ms between starts) with priority stealing; jsfxr-style hit synth within the report's ranges, pitch ±5%; hits-per-second slider; counters playing / stolen / dropped. Muted until a click.
- `critstack` (H4): crit and overkill feedback stack, each layer toggleable (number, hitstop, flash, kick, sound, sparks), to feel which layers carry the crit.
- `death` (H5): kill confirmation: 2-frame flash, squash 1.2 × 0.8 with dither fade, corpse at about 133 ms; corpse rot stages (compressed, labelled); Tibia-style instant corpse toggle.

## Figure -> section map (Agent R puts this in build.py)
Place each figure after the profile it explains (AFTER_PROFILE, ids in parentheses above; for a pair like D1/D5 place it after the first). `costs` goes in §6d, `score` and `matrix` after §5, `timeline` in §3, `stack` in §7, `hero` at the top.
Count: Agent R 20 (hero, timeline, swing, smear, directions, rhythm, cancel, cast, hitstop, flash, knockback, reaction, trauma, numbers, aggregate, crit, misses, costs, score, matrix) + Agent F 17 (targetui, tabcycle, softlock, tapdrag, castmodes, skillshot, groundaoe, nearmiss, predict, favour, ticks, tiers, queue, pvp, voices, critstack, death) = 37 figures plus the stack.
