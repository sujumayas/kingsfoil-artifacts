# Figure plan for vfx-magic (shared by three figure agents)

The study has two equal goals, ARTISTIC QUALITY and RUNTIME EFFICIENCY. Every figure must look good as pixel art. Wherever the technique has a cost, it must also show a live cost readout. That is either ms measured in the demo with performance.now(), or the report's measured figure from §6a, labelled as one or the other. Comparison figures put the pretty-but-expensive and cheap-but-ugly options side by side.

Figure names are FIXED. Each `<!--FIG name-->…<!--/FIG-->` block lives in the file listed below. Its demo is registered with `reg('name', …)` in the matching demos file. Markup follows studies/vfx-grass/figs*.html exactly: `<figure class="fig" data-demo="name" id="fig-name">`, `.fig-h` with `Fig. @N`, the title, an `.illu` label when numbers are illustrative, canvases, controls and a figcaption.

Content rules:
- Figures use only facts from studies/vfx-magic/report.md. Read the profile a figure belongs to before building it, and take every number from there. Illustrative numbers carry a label.
- Where a figure shows the same thing as the sandbox (studies/vfx-magic/sandbox.html, final), match its numbers: they are listed in notes/SANDBOX-SPEC.md under "Corrections from the report". If the report and the sandbox seem to disagree, grep both before reporting it.
- No images and no game art. Draw original abstract pixel art in code. Spells follow the report's art rules (E1 to E3): ramps of 4 to 5 steps, white only on the peak frame, a dark outline or underlay, whole-pixel motion, shape language per element.
- Animate through the core.js demo runner, which uses requestAnimationFrame and pauses offscreen.
- No figure may flash a large area more than 3 times per second, except the one that demonstrates the limiter, and that one starts with the limiter ON and labels the unlimited mode with a warning.
- Every figure must work at 390 px phone width, with no horizontal overflow and zero console errors.
- core.js is minified one-liners. Never add a `//` comment mid-line, because it comments out the rest of the line.
- Captions and labels are plain prose: no em dashes, no colons joining clauses, sentence case.
- Each agent uses its own scratch folder: notes/scratch-R/, notes/scratch-F/, notes/scratch-H/. Do not run git.
- If you find an error in the report while building (a number that contradicts its own table, a formula with a wrong sign), do not edit report.md. List it in your final reply with the line number.

The recipe to copy is studies/vfx-grass/build.py and core.js, the newest ones with the same report layout. The scaffolded studies/vfx-magic/build.py and core.js were cloned from vfx-light and are stale, so Agent R replaces them from the grass recipe.

Report facts the recipe needs:
- 36 profiles: A1-A7, B1-B7, C1-C5, D1-D5, E1-E3, F1-F4, G1-G2, H1-H3 (families are NOT equal in size).
- 36 scorecard rows. Header `| # | Technique | Simpl. | Speed | Pixel taste | Mood | Readab. | Sum |`. Criteria: Simplicity · Speed · Pixel taste · Mood · Readability.
- 4 generations in §3.
- 28 rows in the §11 index.
- 142 sources in 11 groups.
- 30 gems.
- 9 layers in §7.
- §6 headings: 6a Measured costs, 6b Frame timing across games, 6c Bytes on the wire, 6d What MMOs let players tune, 6e Flash and photosensitivity limits, 6f Element language.
Read the report for the exact headings and table headers.

## Agent R (recipe owner): build.py, core.js, hero.html, style.css, study.css, figs1.html + demos1.js
R also wires `FIGFILES = ['figs1.html','figs2.html','figs3.html']` and the full figure-to-section map below, and makes `python -m studykit build vfx-magic` pass even while figs2 and figs3 are still in progress, by tolerating missing figures only while `FINAL = False`. R leaves `FINAL = False` and says so; the lead sets it to True for the final build. R updates title, meta description, byline month (November 2026), TOC, family list, CTA copy to the Spell Sandbox, the §11 quick-filter chips, and every assert count.

figs1.html / demos1.js (13 figures):
- `hero` (in hero.html, demo in demos1.js): a live courtyard strip where a mage casts on a rune circle, a fire bolt flies with a ribbon trail and bursts, chain lightning jumps between two dummies, and a heal rises. Buttons "Fire bolt", "Chain", "Heal", "Crowd" (others' spells drawn reduced), plus a small live ms readout.
- `timeline`: the §3 generations, clickable.
- `effectclock` (A1): a Tibia magic effect as an id, a tile and a 75 ms clock. Step through the frames; lifetime = 75 ms x frames; show the event bytes (7 old, 9 to 11 new).
- `missile` (A2): the 3x3 direction sheet picks one of 9 frames; drag the target tile and watch flight time follow `150 x sqrt(tiles)` against the wrong "150 per tile" line, plotted and animated.
- `areamask` (A3): area matrices drawn as tiles: the 37-tile and 73-tile circles, a wave and a beam. One effect per tile, with the byte total per cast (per tile against one mask event).
- `battlescript` (A4): a spell as a short script over shared sprites. A tiny script (create sprite, delay 2, blend, play) runs step by step; a counter shows how many moves reuse one hit sprite (115) and that Flamethrower is 22 copies of one ember.
- `missilechain` (A5): Diablo-style rows that chain: a missile row with a sub-missile on hit and a light radius. Fire one and see the chain and the light on the floor.
- `packets` (A6): packet sizes side by side as byte bars for Tibia, Ultima Online, Ragnarok and RuneScape, and what each extra field buys (hue, blend mode, delay).
- `darkflash` (A7): the palette blend `c + ((target - c) * k >> 4)` with a k slider, and the dark-then-flash beat: dim the scene to 7/16, then the bolt. Toggle dimming to compare readability.
- `dirframes` (B1): 8 and 16 pre-drawn directions against run-time rotation, zoomed, with the outline break and pixel crawl visible in rotation mode.
- `flightpaths` (B2): straight, sine, lob and orbit paths as pure functions of t. Scrub t; the position needs no stored state.
- `homing` (B3): turn-limited homing at 3 to 4 degrees per frame with fixed speed, a moving target, a turn-rate slider, and the blend onto the target over the last 40% of the flight so it lands on the server's clock.
- `lob` (B4): a lobbed arc with fake height and a ground shadow that marks the landing tile. Toggle the shadow off to show why it is needed.

## Agent F: figs2.html + demos2.js only
Never edit build.py, core.js, hero.html, figs1/figs3, demos1/demos3, style.css or study.css. 14 figures:
- `trails` (B5): ribbon from a ring buffer (7 to 9 points, taper), afterimages (5), and a three-layer particle wake (0.1, 0.6, 1.4 s). Same missile, three trails, live ms and pixel writes for each; the ribbon shrinks out after the missile dies.
- `beam` (B6): a beam as stacked lines whose width halves toward a white core, with end caps and a 267 ms life; toggle layers on and off.
- `lightning` (B7): midpoint displacement step by step (generations slider 1 to 5, 32 segments at 5), offset halving, branches at 0.7 length, re-roll every N frames slider, core and halo passes.
- `timing` (E1): the brightness curve of one effect over its life: wind-up, climax in the first frames, tail. Drag the peak position and compare "peak early" with "peak late"; fixed 75 ms frames against the front-loaded spark timing.
- `sparkanatomy` (C1): a hit spark split into its layers: flash frame, core, sparks, smoke. Toggle each layer; step frame by frame; light, medium and strong variants with their frame counts and ms.
- `stateless` (C2): an explosion as a pure function of (seed, t). Scrub t backward and forward; change the seed; show zero stored particles against a stored-particle pool.
- `ringwave` (C3): a tile area fired in phase (Tibia) against ring by ring at 50 to 58 ms per ring; mask size 37 or 73; bytes for each way of sending it.
- `shockwave` (C4): a ring from the midpoint circle that expands and thins over 167 to 200 ms, against a dithered ring, with pixel writes counted.
- `residue` (C5): scorch and frost decals with a cap and a fade in the last part of their life, plus a staged field that steps down. A "spam" button shows the cap evicting the oldest decal.
- `slots` (D1): back, front, start and end overlay slots around a y-sorted sprite. Walk the character behind and in front of a pillar; toggle each slot.
- `orbit` (D2): motes on a flattened ellipse that pass behind and in front of the body by the sign of y, heal sparkles rising, haste afterimages. Sliders for radius and period (illustrative).
- `shield` (D3): a rim-only bubble against a filled bubble that hides the character; a directional hit flash at the impact angle; a break ring. Click around the character to hit the shield.
- `statustint` (D4): one multiply tint per status, one shown by priority, plus a small overlay. Stack several statuses; compare cached pre-tinted sprites with per-frame pixel readback (the measured 9 ms for 30 characters).
- `castcircle` (D5): a procedural rune circle (rings, polygon, rune marks) that draws in by angle over the cast time and turns at 40 degrees per second, sized to the spell's area, in the element's colour; gathering particles and the charge glow climbing the ramp.

## Agent H: figs3.html + demos3.js only
Never edit build.py, core.js, hero.html, figs1/figs2, demos1/demos2, style.css or study.css. 14 figures:
- `ramps` (E2): build an energy ramp: white core, saturated mid, dark hue-shifted edge, 3 to 5 steps. The same bolt on busy ground with and without outline or dark underlay; a value-contrast readout.
- `elements` (E3, 6f): the element language table live: one small looping effect per element showing its ramp, shape and motion; a colour-blind simulation toggle (deuteranopia, protanopia, tritanopia) that shows which pairs collide and how shape keeps them apart. Label it author judgement.
- `tiers` (F1): one scene of 30 casters drawn with tiers: own, party, others, hostile. Three opacity sliders (own, others, monsters) and the full / reduced / minimal preset; hostile telegraphs stay on top.
- `budget` (F2): the cap of 96 live effects with priority eviction and the same-tile merge. A cast-rate slider; counters for evicted, merged and refused; a strip that shows which tier each slot holds.
- `screenfx` (F3): edge tint (up to 50% for about 0.3 s), a low-health pulse at about 0.5 Hz, and one full-screen flash, on a small game view with a health slider.
- `flashlimit` (F4): the flash limiter. A flash-rate slider up to 7.5 Hz (the Zelda 3 Ether rate), the 3 per second line, the small-area exemption box (about 1,600 px at 320x180), reduce flashing turning flashes into a border. Starts with the limiter ON.
- `drawpaths` (G1): draw paths compared as live Canvas2D timings: one drawImage per effect, one pixel buffer, plus the report's measured GPU numbers as labelled bars; a count slider; the Godot notes (every particle node is a draw call, no GPU particle trails in Compatibility).
- `glow` (G2): additive blending, palette-ramp glow with no alpha, and the low-res glow buffer, same scene three ways, with colour count and ms for each.
- `particles` (H1): Reeves-style emission (mean + random x variance) with a struct-of-arrays pool and swap-remove against an array of objects that allocates; live ms and a count slider; emission scaled by tier.
- `feedback` (H2): the feedback buffer (draw, then fade and shift the last frame) giving free trails, a small DOOM-fire aura, and palette cycling, each as a tiny buffer with its cell count per frame.
- `sigil` (H3): procedural sigils from nested polygons and star polygons {n/k} with a seed, and two dissolves (Bayer threshold, fizzlefade LFSR) for the despawn.
- `costs` (6a): the measured cost tables as log-scale bars (CPU M4, CPU 6x throttle, GPU wall at 320x180 and 720p, the 1x / 4x / 16x scene) with the 16.7 ms frame line. Toggles for the config, with source labels; say that throttle6 is a proxy, not a phone.
- `wire` (6c): bytes on the wire for a 30-caster fight. Sliders for casters and casts per second, and a switch between "one effect per tile" and "one area event"; bytes per second per viewer.
- `score`: the §5 scorecard, sortable, with a radar for the selected row. Copy vfx-grass's score figure pattern.
- `stack` is generated by build.py from §7 (9 layers).

## Figure -> section map (Agent R puts this in build.py)
Place each figure after the profile it explains (ids in parentheses above). `costs` goes in §6a, `wire` in §6c, `elements` after E3, `score` after §5, `timeline` in §3, `stack` in §7. Total: 41 figures plus the stack (hero, timeline and 11 more in figs1 = 13; 14 in figs2; 14 in figs3).
