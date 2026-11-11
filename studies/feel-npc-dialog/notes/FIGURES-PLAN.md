# Figure plan for feel-npc-dialog (shared by two figure agents)

The study weighs four things together: FEEL AND PIXEL ART, MMO PROBLEMS, AUTHORING, RUNTIME COST. Every figure must look good as pixel art and feel good to poke at (timing, sound where noted, crisp bitmap text). Wherever a technique has a cost, show a live readout (measured ms with performance.now() in the demo, or the report's measured figure from §6d, labelled which is which).

Figure names are FIXED. Each `<!--FIG name-->…<!--/FIG-->` block lives in the file listed, and its demo is registered with `reg('name', …)` in the matching demos file. Markup follows studies/vfx-fog/figs*.html exactly (`<figure class="fig" data-demo="name" id="fig-name">`, `.fig-h` with `Fig. @N`, title, `.illu` label when numbers are illustrative, canvases, controls, figcaption). Figures use only facts in studies/feel-npc-dialog/report.md; label illustrative numbers. No images, no game art, no copied fonts: original pixel drawings and a small hand-made bitmap font in code (share one font + glyph-atlas helper through core.js so every figure uses the same crisp text). Animations via the core.js demo runner (requestAnimationFrame, paused offscreen). Audio only after a user gesture, off by default. Every figure must work at 390 px phone width without horizontal overflow and with zero console errors. Writing in captions follows the user's style: plain words, no em dashes, no colons as mid-sentence connectors.

The recipe is the scaffolded studies/feel-npc-dialog/build.py (cloned from studies/vfx-fog/build.py, same report layout). It still asserts the fog counts and fog-specific parts: Agent R adapts it to this report (40 profiles A1-H6, 5 generations, 34 index rows, 209 sources, 9 layers, criteria `RLAB = ['Clarity', 'Charm', 'MMO fit', 'Authoring', 'Speed']`, §6 table headers, index quick-filter chips, Context split sentence, title, meta, CTA and sandbox copy, byline November 2026).

## Agent R (recipe owner): build.py, hero.html, core.js, style.css, study.css, figs1.html + demos1.js, figs3.html + demos3.js
figs1.html / demos1.js
- `hero` (hero.html; demo in demos1.js): a live mini town square, an NPC mid-conversation with a portrait box typing, bubbles over villagers, a gold `?` marker bobbing; buttons "Box + portrait", "Bubbles", "Keyword chat", "Crowd"; small live ms readout.
- `timeline`: the §3 generations, clickable.
- `keyword` (A1): Tibia-style keyword NPC. Click chips or type hi / name / job / trade / bye; 3-tile talk radius drawn on a grid (drag the player out to end the talk); 1 s reply delay; idle timer (compressed, labelled); cyan NPC reply text; `{keyword}` braces become clickable chips.
- `printers` (A4): the same line typed side by side at Pokémon Emerald's real 9/5/2 frames per glyph (slow/mid/fast), Crystal's values and ALttP; frame counter; advance arrow bob 0,1,2,1 at 9 frames per step.
- `tilepinned` (B1): OTClient style. A walking speaker leaves text on the tile where it was said; lifetime `max(3 s, 60 ms × chars)`, doubled for yells; chars slider; wrap at the report's width scaled to the figure.
- `pushup` (B2): greedy push-up stacking (RuneScape), N speakers in a row; margin 2 px; toggle off to see overlap.
- `stream` (B3): the Habitat/Habbo upward stream: every bubble scrolls up 15 px on a timer; interval selector 3/6/12 s.
- `clutter` (B4): crowd of 0-60 chatters around an NPC conversation; strategy none / stack / priority + caps (3 per speaker, 12 visible) / overflow to log; counters (alive, hidden, logged) and live ms.
- `offscreen` (B5): drag a speaker past the view edge; the body clamps 4 px inside, the tail slides to stay over the speaker, then an edge chip with an arrow.
- `typewriter` (C1/C2): cps presets (Slow/Normal/Fast/Instant per §7), punctuation pauses on/off (comma 250 ms, stop 500 ms at Normal), hold to fast-forward, blip toggle.
- `guard` (C3): mash test. Press repeatedly; with guard 0 ms lines get skipped unread, with press-to-complete + 200 ms guard they don't; counter of lines skipped unread.
- `tags` (C4): an editable tag string (`[c=key]`, `[wave]`, `[shake]`, `[p=12]`, `[spd=2]`) rendered live in a box; tags never count as glyphs.
- `ninepatch` (C5): 9-slice frame drawn stretched vs tiled; drag the box size and see stretch artefacts at odd sizes; 8-frame open animation replay.
- `choices` (C6): a choice menu where the default cursor and cancel land on the safe answer; Emerald's 5-frame input ignore at open; B/Escape = No.
- `autoadvance` (C7): Ren'Py `1.5 s + 0.06 s/char` vs Dialogic `1.0 s + 0.1 s/char` as two curves with a line-length slider; a small log panel of past lines.
figs3.html / demos3.js
- `costs` (6d): the measured benchmark as a log-scale bar chart (GPU / 6x CPU throttle / SwiftShader; redraw-every-frame vs cached bubbles; per-glyph drawImage vs fillText per line; WebGL instanced) with the 16.7 ms frame line; machine info label.
- `score` (§5): the scorecard, sortable, with a radar for the selected row (copy vfx-fog's score figure pattern).
- `matrix` (§5): feel vs cost scatter. Each profile placed by (Clarity + Charm) against (Authoring + Speed) from §5; hover/click shows the profile; family colour.
- `stack` is generated by build.py from §7 (9 layers).

## Agent F: figs2.html + demos2.js only (never edit build.py, core.js, hero.html, figs1/3, demos1/3, style.css, study.css)
Use the font and helpers Agent R puts in core.js; if they aren't there yet, put a local copy inside demos2.js and keep the same glyph look.
- `portrait` (D1/D2): busts at 32, 48 and 64 px; expression swap (neutral, happy, sad, angry, surprised); 2-frame mouth flap while text types; blink with a ~2 px closed-eye frame (timing labelled as estimate).
- `emotes` (D3): emote balloons `!`, `?`, heart, anger, "..." hopping on integer gravity (start velocity -5, +1 per frame, about 15 px peak, 60-frame life, Emerald values); click an NPC to play one.
- `turnface` (D4): NPC turns to face the talker and restores its old facing after the talk; "direction fix" toggle; first-talker vs latest-talker rule with two players (TFS vs Canary).
- `markers` (E1): marker states `!`, hollow grey `?`, gold `?` with a whole-pixel bob; colour-blind simulation toggle showing why shape must carry the meaning.
- `questflow` (E2): offer → accept → progress → turn-in state machine with the tracker line and a reward popup; click through.
- `hearts` (E3): a renown heart that fills with progress and turns the NPC into a vendor when full.
- `handoff` (F1/F2): one-service NPC skips gossip vs gossip menu (count clicks); keyword "trade" opens the panel and the NPC speaks you back out on close.
- `revalidate` (F3): a forged "buy" packet: the client menu would allow it, the server check rejects it; show the server log.
- `barks` (G1): rule database. Facts as chips (time, weather, player near, quest state); the rule matching the most facts wins, ties at random; cooldowns as facts that expire; history of fired barks.
- `schedule` (G2): a 24 h clock with 8 slots of 3 h; NPCs move between home, shop, tavern; drag the clock.
- `blips` (G3): WebAudio blips on every second glyph, skipping spaces, per-speaker pitch and small random variation; three speakers to compare; muted until a click.
- `access` (G4): text size 1x/2x, speed presets with instant, auto-advance, reduce motion (no wave, shake or bob), keyword colour plus underline.
- `focus` (H1): many players and one NPC. Shared focus + queue (one talker, others told to wait, griefer holds it 120 s compressed) vs multi-focus private sessions; player count slider; waiting time readout.
- `wire` (H2/H3): bytes per NPC line as full text (~86 bytes) vs line id + args (8-20 bytes) over a crowd, plus a chat token bucket (4 tokens, one back every 1.5 s, mute 5n² s); spam button.
- `expansion` (H5): the same line in English, Spanish and German in a fixed bubble and button; text expansion per the IBM table (short strings grow most); pseudolocalization at 0.3.
- `llm` (H6): latency strip comparing a scripted line (one round trip) with the reported on-device LLM exchange (median 1.6 s); labelled with sources from the report.

## Figure -> section map (Agent R puts this in build.py)
Place each figure after the profile it explains (AFTER_PROFILE, ids in parentheses above). `costs` goes in §6d, `score` and `matrix` after §5, `timeline` in §3, `stack` in §7, `hero` at the top.
Count: Agent R 18 (hero, timeline, keyword, printers, tilepinned, pushup, stream, clutter, offscreen, typewriter, guard, tags, ninepatch, choices, autoadvance, costs, score, matrix) + Agent F 16 (portrait, emotes, turnface, markers, questflow, hearts, handoff, revalidate, barks, schedule, blips, access, focus, wire, expansion, llm) = 34 figures plus the stack.
