# Figure plan for vfx-grass (shared by three figure agents)

The study has two equal goals, ARTISTIC QUALITY and RUNTIME EFFICIENCY. Every figure must look good as pixel art. Wherever the technique has a cost, it must also show a live cost readout. That is either ms measured in the demo with performance.now(), or the report's measured figure from §6a, labelled as one or the other. Comparison figures put the pretty-but-expensive and cheap-but-ugly options side by side.

Figure names are FIXED. Each `<!--FIG name-->…<!--/FIG-->` block lives in the file listed below. Its demo is registered with `reg('name', …)` in the matching demos file. Markup follows studies/vfx-fog/figs*.html exactly: `<figure class="fig" data-demo="name" id="fig-name">`, `.fig-h` with `Fig. @N`, the title, an `.illu` label when numbers are illustrative, canvases, controls and a figcaption.

Content rules:
- Figures use only facts from studies/vfx-grass/report.md, and illustrative numbers carry a label.
- No images and no game art. Draw original abstract pixel art in code.
- Animate through the core.js demo runner, which uses requestAnimationFrame and pauses offscreen.
- Lock motion and dither to whole world pixels.
- Every figure must work at 390 px phone width, with no horizontal overflow and zero console errors.
- core.js is minified one-liners. Never add a `//` comment mid-line, because it comments out the rest of the line.

The recipe to copy is studies/vfx-fog/build.py, the newest one with the same report layout. The scaffolded studies/vfx-grass/build.py and core.js were cloned from vfx-light and are stale, so Agent R rebuilds them from the fog recipe.

Report facts the recipe needs:
- 40 profiles, A1-H5, five per family across eight families.
- 40 scorecard rows.
- 4 generations.
- 26 rows in the §11 index.
- 168 sources.
- 9 layers in §7.
Read the report for the exact headings.

## Agent R (recipe owner): build.py, core.js, hero.html, style.css, study.css, figs1.html + demos1.js
R also wires `FIGFILES = ['figs1.html','figs2.html','figs3.html']` and the full AFTER_PROFILE map below, and makes `python -m studykit build vfx-grass` pass even while figs2 and figs3 are still in progress. It does that by tolerating missing figures only during development, and the final build must have all of them.

figs1.html / demos1.js:
- `hero` (in hero.html, demo in demos1.js): a live meadow with a gust wave crossing tall grass and wheat, a walker leaving a trampled trail, butterflies by day and fireflies at dusk. Buttons "Breeze", "Gust", "Walk", "Dusk", plus a small live ms readout.
- `timeline`: the §3 generations, clickable.
- `emerald` (A1): the Pokémon rustle, frames 1-4 then rest, 10 ticks each (about 0.83 s), and lower-body cover by the priority bit from the second step on. Step through it and toggle cover.
- `zeldacut` (A2): cut grass. A tile swap, a debris puff and throttled drops (two 50% rolls, fewer than 4 sprites active).
- `tibiadecay` (A3): grass as items with decay timers (wheat 240 s + 240 s, jungle grass 300 s). Use a compressed clock and show the item ids changing.
- `stardew` (A4): four tufts per tile with seeded offset, flip and phase. Still until touched, then a lean of up to 22.5° that settles in about 0.73 s. Smooth rotation vs 3 baked whole-pixel lean frames.
- `highgrass` (A5): roguelike high grass that blocks sight. Step on it and it tramples to short grass, and the FOV opens.
- `hashvar` (B1): tile variants and flips by position hash, plus a meadow mood map. Toggle the hash off to show the visible grid.
- `cornerset` (B2): a 16-tile corner set for grass to dirt and water. Paint cells and watch the edges resolve.
- `tuftcover` (B3): tuft sprites y-sorted with a walker, with the grass-front strip over the lower body.
- `fieldlayer` (B4): per-tuft sprites vs one field layer (row bands) vs pixel writes. Live ms with a tuft count slider, plus the measured §6a numbers next to it.
- `flowers` (B5): flower patches by Poisson scatter vs pure random, with a daily open/close cycle.
- `rowshear` (C1/C5): whole-pixel row shear vs the smooth sub-pixel anti-pattern (zoomed), and stepped sway at 5 fps as a toggle.
- `cosinewave` (C2): Terraria's cosine wave with phase x*0.5 per column, a wind gate, and period 3.0 s calm to 0.6 s storm. Plot the crest moving downwind.
- `gusts` (C3/C4): two scrolling noise tables (slow strong gust, fast weak flutter), with per-tuft stiffness 0.25-2.0 and per-tuft variation.

## Agent F: figs2.html + demos2.js only
Never edit build.py, core.js, hero.html, figs1/figs3, demos1/demos3, style.css or study.css.
- `windgrid` (D1): Terraria WindGrid, a timestamp plus direction per visible tile. A push peaks at 3.5 px and fades in 20 frames.
- `trailmap` (D2): the 80x45 byte map stamped by walkers (decay before stamp, no stamp while standing), shown beside the grass it bends. Live ms.
- `crush` (D3): Jahrmann crush and recovery, eta linear fade, recovery keeping a 10% floor. Plot tip height over time.
- `rustle` (D4): an entry rustle with frames, a 4-leaf burst and a sound cue indicator.
- `desire` (D5): Helbing trail model, dG/dt = (G0-G)/T + I(1-G/Gmax). Many walkers between points form paths. Sliders for T and I, plus the step-counter variant (20 steps to dirt, 50 to path).
- `randomtick` (E1): random ticks and spread on a grid vs a full scan. Picks per tick slider, mean time to regrow, and ms.
- `stages` (E2/E3): a stage ladder (tall, trampled, cut, burnt, regrowing) with lazy `changed_at` evaluation, and bytes sent per change (9 B) vs sending every flatten.
- `hiding` (E4): the server vision rule (same patch, adjacent, party, a 2000 ms reveal on attack, a hide delay), with what each client receives, and how the owner sees themselves (dither/outline).
- `tfsleak` (E5): the TFS invisibility anti-pattern. The packet still carries position with an empty outfit, vs our rule that sends nothing.
- `butterfly` (F1): the Stardew flap-hop (upward kick 0.375-1.875 px/frame, gravity, 4-6 frames of 45-80 ms, 200 ms rest), plus landing on flowers and fleeing. Compare with a random-walk anti-pattern.
- `pondlife` (F2/F3/F4): bees hopping between flowers (median about 2 s), a dragonfly darting and hovering, and a midge swarm held by a spring.
- `moths` (F5): moths orbiting, stalling and inverting at a lamp because they tilt their back to the light, vs the "fly straight at it" myth.
- `fireflies` (G1): P. pyralis solo blinks (about 5.9 s) vs P. carolinus bursts with pulse coupling (48 px, 0.035). Count slider, naive vs grid vs mean field, live ms.
- `halos` (G2): pre-drawn halo sprites vs a per-pixel radial loop vs one light per firefly (Godot Compatibility allows 15 per item). Off-palette colour count and ms.
- `critters` (G3): rabbit, frog and cricket. Flee radius rings, hops (frog 0.8 s, about 1.1 tiles high), threat check every 200 ms, crickets flushed from cut grass.
- `seeds` (G4): dandelion seeds (0.39 m/s fall) and pollen drifting with the wind, and petals wrapping the screen.
- `spawn` (G5): spawn tables by biome, season, hour and weather, with anchors (flowers, reeds, lamps), pools and caps (10, or 20 in summer, none in rain except frogs), and despawn out of range.

## Agent H: figs3.html + demos3.js only
Never edit build.py, core.js, hero.html, figs1/figs2, demos1/demos2, style.css or study.css.
- `drawcalls` (H4): batching. N separate draws vs one instanced draw vs MultiMesh rows. The measured §6a bars, with the Godot limits (16,384 canvas commands, 15 lights per item).
- `seasons` (H1): season palettes with per-tile phenology offsets so the field turns gradually. Scrub the date.
- `wetsnow` (H2): dry, wet (more saturated, glints), frost and snow grass with tips poking through.
- `biomecolor` (H3): biome colour from a temperature x moisture table (the Minecraft colormap idea). Drag a point on the table.
- `reducemotion` (H5): reduce motion, plus separate toggles for decoration, wind and walker reaction, and a creature density slider.
- `costs` (6a): the measured cost tables as log-scale bars (GPU M4 at 320x180 and 720p, SwiftShader, CPU M4, CPU 6x throttle) with the 16.7 ms frame line. Toggles for the config, with source labels.
- `matrix` (6b): the pretty-vs-cheap matrix as an interactive scatter, Speed vs Pixel taste + Mood from the §5 ratings. Hover or click shows the profile.
- `score`: the §5 scorecard, sortable, with a radar for the selected row. Copy vfx-fog's score figure pattern.
- `stack` is generated by build.py from §7 (9 layers).

## Figure -> section map (Agent R puts this in build.py)
Place each figure after the profile it explains (AFTER_PROFILE, ids in parentheses above; for a range like C1/C5 place it after the first id). `costs` goes in §6a, `matrix` in §6b, `score` after §5, `timeline` in §3, `stack` in §7. Total: 40 figures plus the stack (hero, timeline, 13 more in figs1, 17 in figs2, 8 in figs3).
