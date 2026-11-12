# Sandbox issues

Todo list from the review of all 15 sandboxes on 2026-11-12. Each sandbox got a code read, a driven browser
session, zoomed screenshots and frame-cost measurements at 1x and 6x CPU throttle.

How to use this file:

- Tick the box when a fix lands. Refer to issues by number in commits ("Fix #1, #26").
- Line numbers refer to `studies/<slug>/sandbox.html` as of commit `6fa09b3`. They drift once fixes land.
- After each fix, copy the sandbox to `site/<slug>-sandbox.html` (`site/<slug>-lab.html` for the curves labs).
- Priority tags: `P1` crash or freeze, `P2` shared template fix, `P3` soft lock or broken behaviour,
  `P4` visible visual defect, `P5` readout or text that disagrees with the code, `P6` perf and polish.
- `(taste)` marks a judgement call. `(suspected)` means it comes from code reading and was not reproduced.
  Everything else was reproduced or seen in a screenshot by the reviewer.
- Re-checked by a second run: #1 (paused and in normal play), #24 and #116.

## Shared across sandboxes

- [x] **1.** `P1` feel-combat-juice. Cooldown sweep crash. `SWEEP[Math.min(15,Math.floor((1-rem/tot)*16))]` (`:808`)
  gets index -1 when `(now+cd)-now` rounds above `cd`. It happens when a cast and the next render share the same
  clock value: a queued cast fired inside `step()` (`:866`), or any cast while paused. The rounding only occurs
  when `now+cd` crosses a power of two, so the risky moments are just before 4.1 s, 8.2 s, 16.4 s, 32.8 s and
  65.5 s of play. Fix: `Math.max(0,...)` on the index.
- [x] **2.** `P1` All canvas sandboxes. One exception freezes the page for good, because `render()` runs before
  `requestAnimationFrame(loop)`. Seen in combat juice (`:875`), loot pickup (`:868`) and acid. Fix: request the
  next frame first, or wrap step and render in try/finally.
- [x] **3.** `P2` Keyboard dies after touching a slider. The keydown handler returns for `INPUT` targets and range
  inputs keep focus. Affects water (`:487`), fire (`:496`), fog (`:457`), grass (`:790`), magic (`:739`) and
  npc-dialog (`:1011`). Fix: blur range inputs on `change` and `pointerup`, or only skip text inputs.
- [x] **4.** `P2` Key handler swallows keys everywhere. No target or modifier check, so arrow keys never reach
  sliders or selects, and Cmd/Ctrl+S, A, D are blocked. No window `blur` reset, so a held key stays down.
  Affects light (`:331`), forest (`:354`), acid (`:397`), rain (`:363`, suspected) and snow (`:385`, suspected).
  Fix: return early for input and select targets or when a modifier is held, and clear `keys` on blur. Fog's
  handler (`:457`, `:465`) already does both.
- [x] **5.** `P2` Non-integer canvas scale. `fit()` reads `main.clientWidth` including 36 px of padding, so
  viewports 640 to 677 and 960 to 997 px give 1.94x or 2.94x. Affects combat juice (`:954`), npc-dialog (`:1026`),
  grass (`:799`) and magic (`:750`). Water, fire and acid (`:20`) use `width:100%` with no fit at all (3.76x at
  1280). Fog only snaps at 640 px and above (`:466`). Fix: subtract the padding, give the three older sandboxes
  the same `fit()`, and use 1x below 640.
  Done: one `fit()` in 12 sandboxes, including loot pickup, light, rain and snow, which had the same defect.
  Scale is 1x up to a 677 px viewport, 2x from 678 and 3x from 998. Forest is tracked as #181.
- [x] **6.** `P2` Tap-to-walk onto a blocked spot makes the character walk in place forever. Grass (`:558`, `:560`),
  magic (`:575`) and fog (`:298`, suspected). Fix: set the moving flag only when the position changed, and clear
  the walk target when blocked. Acid handles this case correctly.
- [x] **7.** `P6` Full render continues while paused and while the canvas is off-screen in every sandbox. Paused
  costs about the same as running.
  Done: a frame gate at the top of each loop skips step and render while the canvas is off-screen. While
  paused, only the 12 frames after an input or resize run. Forest and light have no pause, so they only get
  the off-screen half.
- [x] **8.** `P6` At 390 px the HUD covers the canvas. Rain (top 38 px), light (top quarter), forest (top third),
  acid (43%, `:21`). On desktop the fog HUD covers the tower and its beacon (taste). Fix: fog's
  `@media (max-width:640px){.hud{position:static}}` rule everywhere, and move the fog HUD below the canvas.
  Done: the rule is in every sandbox with an overlay HUD, at `max-width:677px` to match the 1x canvas range
  from #5. The fog HUD sits below the canvas at every width.

## feel-combat-juice

- [x] **9.** `P3` Showcase leaves a broken world. After unpausing, a prop lance hangs in mid-air until Reset
  (`:916`, `speed:0,range:999`), and every mob and ally has `cd=now+99999` so nobody attacks for about 100 s
  (`:910` to `:912`). Movement and skill keys do not leave the frozen frame (`:932` vs `:945`). Fix: call `reset()`
  when leaving `frozenShow`, and clear it on any keydown.
  Done: leaving the frame calls reset(). Pause, P, a click on the canvas, a touch skill button, and the
  movement, skill, Tab, Esc and Space keys all leave it. V and M do not, so the x-ray views can still
  inspect the frame. Showcase settings (juice 100%, 5 allies) stay, as after any preset.
- [x] **10.** `P4` Cleave smear and sword arc point in only 4 directions while the hit cone is free-aim (`:284` to
  `:287`, `:706`, `:736`). Card 4 says they rotate freely. Fix: bake the smear for 8 or 16 angles, or change the
  card.
  Done: the swing and its smear follow the action's aim in 16 steps of 22.5°. Smears are baked on first
  use and cached, 96 small canvases at most. The lance throw pose uses the exact aim angle. Card 4 now
  says 16 steps.
- [x] **11.** `P4` Quake aim indicator and range ring are squashed by `*.75` (`:759`, impact ring `:771`). The
  decal and hitbox are round (`:436`, `:520`). Fix: drop the factor.
- [x] **12.** `P3` WHIFF shows and sounds twice on a near miss with prediction on (`:678` and `:433`). Fix: skip
  `clWhiff` for own projectiles when `PRED!=='wait'`.
- [x] **13.** `P5` Tibia classic preset. The hotbar shows skills ready while the 2 s group cooldown still blocks
  them. `:807` ignores `CCD['g_'+sk.grp]`.
- [x] **14.** `P4` (taste) The brawl jams against the back wall and right edge within 10 s. Goblins spawn on the
  edge strips (`:366`, `:406`) and ally slot radius exceeds the goblin stand-off (`:451`, `:454`).
  Done: the cause was a chase. An ally wanted to stand 16 to 26 px from a goblin that wanted to stand 12
  px from the ally, so the pair walked until a wall stopped them. Allies whose target fights back now hold
  position (ranged) or stand 14 px to the goblin's side (melee). Melee rings are 14 to 20 px, and slots
  are clamped to the floor. Goblins spawn 1 to 3 tiles off the walls. Share of melee units within a tile
  of a wall over 90 s, 4 seeds: 81% to 22% with 4 allies, 65% to 24% with 12, 63% to 32% with 30. An even
  spread would give about 31%. Goblin kills per minute did not drop: 11 before and 14 after with 4
  allies, 33 and 37 with 12.
- [x] **15.** `P4` X-ray panels cover what they explain. The server panel hides the dummy and a pillar. The
  timeline caption sits on the server lane (`:837`). Cost view rows alternate 7 and 8 px (`:841`).
  Done: the server panel left the canvas. Its counters are an extra line in the readout under the arena
  while Server truth is on, with the cyan and yellow legend. Timeline lanes are 12 px apart, so the
  caption sits below the server lane. Cost rows are 8 px apart. The cost panel still covers the lower left
  pillar. It is the only legend for the outline colours, so it stays.
- [x] **16.** `P5` "HIT CHECKS n/S" counts frames with a check, so it tops out at 60 (`:871`). (suspected)
  Done: confirmed in the code. The log stored one entry per frame that had a check. It now stores the
  count, and the readout sums the last second. One lance in flight reads 140 to 220 checks/s.
- [x] **17.** `P5` Card 6 says the warden slam adds 0.6 trauma. The code passes .5 (`:685`) and
  `TUNING.shake.slam` is unused. (suspected)
  Done: confirmed in the code. The slam now reads TUNING.shake.slam, which is 0.6 as in the report and
  card 6.
- [x] **18.** `P5` Card 5 promises an 8-frame freeze on a kill, but the death flash and squash keep running
  during the victim's hitstop (`:691`). (suspected)
  Done: confirmed by tracing the timers. The death clock ran through the victim's hitstop, so the corpse
  appeared the frame the freeze ended. The clock now waits for the hitstop, and the victim holds its
  struck pose with the hit flash until then. A kill at 100% juice takes 133 ms of freeze, then the 133 ms
  death animation.
- [x] **19.** `P6` Debris ground height `gy` is never read (`:598` to `:604`), so chips bounce at chest height.
  (suspected)
  Done: confirmed in the code. Every chip stored gy and bounced at z = 0 on its spawn row, 7 px above the
  feet (10 px on the warden). One chip() helper now puts the ground point at gy and starts the chip gy - y
  above it. The first frame draws at the same pixel as before.
- [x] **20.** `P6` The canvas is never cleared and the background is drawn with the shake offset (`:847`), so the
  uncovered edge strip keeps old pixels. (suspected)
  Done: confirmed in the code, not seen on screen. render() paints the frame ink before the shaken
  background whenever the camera offset is not zero. The arena's side borders are ink already, so the
  stale pixels could only show as a 1 to 2 px strip on the bottom row.
- [x] **21.** `P6` Telegraph decal cache holds a 305 x 305 canvas per angle per fill step, cleared only above 900
  entries (`:319`). Worst case is a few hundred MB. (suspected)
  Done: confirmed in the code. A line decal was a 305 x 305 canvas whatever its angle, and the cache was
  cleared by entry count, so 900 entries could hold 335 MB. Line and aim decals are now baked in the
  bounding box of the rotated strip, 9.1 times fewer pixels on average. The cache is cleared when it
  passes 2 million px, which is 8 MB. All 2,056 decals compared (64 angles, both shapes, both teams, 4
  fill steps, with and without colour-blind patterns, plus the circles) are pixel-identical to the old
  ones.
- [x] **22.** `P6` The HUD total under-reports by about a quarter in heavy mode. It leaves out the x-ray draw and
  the DOM write.
  Done: render() times the x-ray overlay and the loop times the readout's own DOM write, averaged over the
  9 frames in 10 that skip it. Both are in the total, in the readout line and in a seventh row of the cost
  panel. With 30 allies the x-ray draw is 0.16 ms of 1.37 in Cost view and 0.25 ms of 1.29 in Server
  truth. The write is 0.01 ms. Style, layout and paint after the write happen outside script and are still
  not counted.

## feel-loot-pickup

- [x] **23.** `P1` Crash. PvP plus Round robin plus a container corpse style (the "Tibia classic" preset, or
  "Bosses and deaths spill" off) freezes the sandbox about 5 s in. `corpse.tiers[1]` is undefined for a PvP
  kill (`:476`, tiers replaced at `:437`). Fix: `corpse.tiers&&corpse.tiers[1]?corpse.tiers[1][1]:[it.owner]`.
  Done: the second ownership stage of a round robin item is the corpse's last tier, not tiers[1]. A goblin
  corpse still gives the owner 15 s and the helpers until 20 s. A PvP corpse gives the owner 15 s, then the
  priority group until 60 s, which matches the corpse's own timer.
- [x] **24.** `P3` "Clear items" cancels every pending respawn, including your own. `SV.pend.length=0` (`:904`)
  wipes the shared server timer list. Fix: tag rain timers and remove only those.
  Done: timers that add a ground item (rain and spills) carry a drop flag, and Clear items removes only
  those. A goblin killed before the click respawns 5 s after its death, and 200 rain items still in the air
  are cancelled.
- [x] **25.** `P4` Legendary beam is upside down. Solid at the top, fading to nothing at the item (`:349` to
  `:351`). Fix: `up=y/h`.
  Done: up=y/h. Checked in a zoomed screenshot. The beam is solid at the item and dithers out at the top.
- [x] **26.** `P4` Spill scatter is lopsided. A third of items land 6 to 9 px too high because of a signed shift
  on a uint32 hash (`:468`). Fix: `(h>>>4)%3`.
  Done: h>>>4. Over 12 boss drops, 257 of 793 items sat 6 or 9 px above their tile's centre row before.
  After the change all 817 sit at -3, 0 or +3 px, about a third each.
- [x] **27.** `P3` Full prediction plus Loot all leaves ghost items and an inflated bag count. The client
  predicts without an ownership check (`:581`) and the server skips silently (`:494`). Fix: roll back
  unanswered predicted items in `clResult`, or filter with `canLoot` on the client.
  Done: both halves. The client predicts only window items that pass canLoot. Each Loot all stores its
  predicted items by request number, and clResult rolls back every one the answer lists as neither taken nor
  rejected. On another player's goblin corpse the window kept its items and the bag stayed at 0. With the
  client's ownership data forced wrong, 2 predicted items came back and the pending count returned to 0.
- [x] **28.** `P3` With the default spill setting, PvP enemies never loot your death pile. PvP bots only look at
  corpses with items (`:540` to `:547`).
  Done: items spilled from your body carry a death flag, and a PvP bot with nobody to hunt takes the nearest
  one it may loot. Killed by VEX with 77 gold and a backpack of 6, both were gone within 24 s and the chat
  said who took them. Before, both lay there until they despawned. If you die with no killer, the enemies
  are outsiders and still wait out the 60 s. The 1.5 s search channel applies to the body only, not to
  spilled items.
- [x] **29.** `P4` PvP enemies respawn twice, at 5 s and again at 6 s (`:454` and `:538`).
  Done: svKill skips its 5 s monster respawn for PvP enemies. The 6 s respawn in hitEnt, which places them
  on the right side of the map, is the only one left. Traced one kill before and after. It came back at 4.9
  s and jumped at 5.9 s before, and comes back once at 5.9 s now.
- [x] **30.** `P3` After Showcase the allies never move (`:921`, `think=now+1e9`) and a staged gold pile stays as
  a permanent ghost (`:925`, `:934`). Latency, Juice and "Alt: all labels" also stay changed after Reset.
  Done: leaving the frame restores latency and Alt labels to their values before Showcase, sets juice to the
  Asterion preset's 80% and calls reset(). Pause, P, Reset, a click on the canvas, the touch buttons except
  Alt, and the movement, Space, E, R, B and Esc keys leave it. V and M do not, so the x-ray views can still
  inspect the frame. Checked four exits with latency set to 200 ms beforehand. Each came back to 200 ms, 80%
  and labels off, all 3 allies moved, and no staged item was left. The other showcase settings (Asterion
  preset, PvE, 3 allies, tick 100) stay, as after any preset.
- [x] **31.** `P3` A pickup in flight when you die stays pending forever (`:488` returns before the reply).
  Done: a dead player's request is answered, with a reject for a single take. The death message clears each
  item's prediction mark, so the late rollback cannot take the pending count below 0. Died one frame after a
  grab in three cases. Cosmetic: the dots clear. Full prediction: the item comes back. Loot all with 9
  predicted items: all 9 come back. All three were stuck before.
- [x] **32.** `P3` Reduce motion or Arcs off makes fresh drops reject as "early", then hop and shake. The client
  `landT` (`:594`, `:657`) disagrees with the server `pickAt` (`:473`). Fix: gate on `ci.pickAt`.
  Done: click pickup, Loot all prediction and the magnet all wait for the later of the server's pickAt and
  the local landing plus 400 ms. The 60 ms head start on click pickup is gone, so an early reject can no
  longer happen for the player. Boss drop at your feet with Reduce motion on, then with Arcs off: one item
  shook on an early reject in each run before, none after.
- [x] **33.** `P5` Ownership view never shows the yellow public countdown. `TUNING.owner.groundPublicS` does not
  exist (`:831`). The legend text also overflows its box (`:832`).
  Done: the public pie divides by the item's own public span, despawnAt minus ownUntil, which is 120 s for a
  spill and 180 s for rain. Public items showed an empty black pie before and a yellow one now, checked in a
  screenshot with 40 rain items. The legend box takes its width from the text.
- [x] **34.** `P5` Server truth panel says "CORPSE 10 S OWNED" (`:827`). TUNING, the spec and card 2 say 15 s.
  Done: the line is built from TUNING.owner.corpseS and reads CORPSE 15 S OWNED.
- [x] **35.** `P6` Race demo places the ring and bot with no bounds check (`:906`), off-canvas near the right
  edge.
  Done: the ring and the bot go on the first side (right, left, down, up) where both spots are open ground.
  From x 312 the ring was at x 328 and the bot at 344 before. They are at 296 and 280 now, and the race
  still resolves.
- [x] **36.** `P5` "Label filter" buttons do nothing in the default preset, and the Alt path ignores the filter
  (`:756`).
  Done: with Labels off, Alt shows the items you may take that pass the filter. With Labels on nothing
  changes: the filter applies all the time and Alt overrides it to show every label. Counted labels over 120
  rain items with Labels off and Alt held. Before: 108 for every filter. After: 108 for Show all, 91 for
  Hide junk, 10 for Only rare+. Card 7 describes both cases.
- [x] **37.** `P6` Loot window title is cut to 9 characters, "GOBLIN CH" (`:800`).
  Done: the name is drawn in full. When it is wider than the 38 px left of ALL, the title bar grows to the
  left by the difference, 9 px for GOBLIN CHIEF. The slots, ALL and X stay where they were, so the click
  targets did not move. Checked in a screenshot.
- [x] **38.** `P6` Preset button stays highlighted after changing party mode, pickup mode, tiers, magnet radius
  or filter (`:878` to `:883`).
  Done: party loot, pickup mode, tier shapes, magnet radius, label filter and other players' drops now clear
  the highlight, as drop style, effects and juice already did. The last one was not in the review, but
  presets set it too. X-ray view and server tick are not part of a preset and leave it lit.
- [x] **39.** `P6` Holding B spawns a boss drop on every key repeat (`:969`).
  Done: the handler returns on key repeats for everything except movement. Holding B through 8 repeats gave
  9 boss drops before and 1 now. P, M, V, E, R and Space had the same repeat and are covered. Space still
  stops the page from scrolling while held.
- [x] **40.** `P6` Phone control buttons are 30 px tall.
  Done: buttons in the control panels get min-height 44 px under body.coarse, the class fit() sets for a
  coarse pointer or a viewport under 700 px. Measured at 390 px: every button was 30 px and is 44 px now.
  The panels grow from 1,715 to 2,107 px. Desktop buttons stay at 30 px.
- [x] **41.** `P3` (suspected) Lowering the Allied players slider removes live goblins with `gs.pop()` (`:377`),
  leaving stale targets.
  Done: confirmed. Attacked a goblin, lowered the slider so it was removed, and the player hit it twice
  more, killed it and got a corpse from a goblin that was not on screen. A removed goblin, ally or PvP enemy
  is now marked dead on the server before it leaves the list, which the attack target, the bots' hunt tasks
  and svAction already check. Same test after: no hits, no corpse. Goblins waiting to respawn are removed
  before live ones.
- [x] **42.** `P3` (suspected) Magnet "far" rejects are meant to be silent, but `s.req=false` (`:618`) runs before
  the `!s.req` test (`:623`), so "TOO FAR" pops and the magnet retries each frame.
  Done: confirmed. The text test now reads s.mag, which sendAct sets for magnet and walk-over requests, so a
  far reject on those is silent. A clicked item still says TOO FAR. After any reject the magnet waits
  TUNING.retryMs, 300 ms, before asking for that item again. Stepping away from a coin each time the request
  was in flight gave 10 requests in 2 s and stacked TOO FAR texts before, and 4 requests and no text after.

## feel-npc-dialog

- [x] **43.** `P3` Showcase leads to a dialog that hangs on "..." after Accept or Decline. The fake session
  lacks `wait:'offer'` (`:997`, server check at `:609`).
  Done: the fake session carries wait:'offer' and q:'herbs'. Accept now sets q1 to 1 and plays the accept
  line, Decline plays the decline line. Before, both left the box on "..." for good.
- [x] **44.** `P3` Toggling Large text or dialog style mid-line blanks the box. `relayout()` keeps the old page
  index (`:704`).
  Done: relayout(true) finds the page that holds the first glyph of the page being read. On the elder's
  Spanish greeting, page 2 of 2 in Large text became page 2 of 1 with 0 glyphs when Large text went off. Now
  it lands on page 1 of 1 with all 56 glyphs.
- [x] **45.** `P4` Letter "j" has a 2 px gap on its left, "cajas" reads "ca jas" (`:124`, glyph `40444444o`).
  Done: glyph is now 80888888g, 2 px wide. The gap between the a and the j stem in "cajas" went from 3 px to
  2 px, the same as any other letter pair with a 1 px side bearing. Checked in a 3x screenshot.
- [x] **46.** `P4` Bubble style. The advance arrow covers the last character (`:879`, width at `:872`).
  Done: the bubble is at least 15 px wider than the last line of the page. Over the 112 pages of elder and
  Mara lines in both languages and both text sizes, the arrow overlapped the last row on 50 before and on 0
  after.
- [x] **47.** `P4` (taste) Bubble style. The choice menu covers the NPC you are talking to (`:881`).
  Done: the menu opens 12 px to the side of the player, away from the NPC. Tested from every tile you can
  talk from, for the elder and Mara in both languages. The menu covered the NPC in 14 of 14 positions before
  and the player in 12. After, it covers neither in all 14 and stays on the canvas.
- [x] **48.** `P4` The quest tracker runs under the trade panel (`:889` to `:899`).
  Done: the tracker is not drawn while the trade panel is open. With two quest rows active, "Tell the elder"
  started at x 246, y 15 and ran under the panel edge at x 272. The panel keeps its own gold counter.
- [x] **49.** `P4` The Sell tab overflows with 7 item kinds. The 7th row draws over the gold counter (`:903`).
  Done: the panel is 153 px tall instead of 140 and starts 5 px higher. With all 7 kinds in the bag the last
  row ended at y 146, 8 px past the separator at y 138. Now it ends at y 141 and the separator is at y 146.
- [x] **50.** `P3` Crowd "wait your turn" never plays out. `s.heard` is read (`:791`) and never written.
  Done: kwSay tags the reply with its entry and the simulated player stores it on arrival, in shared and
  private focus. A player who gave up the wait and is still within 3 tiles also resumes when called. Over 10
  minutes with 30 players, queued players sent 1,385 keywords the server ignored and none ever waited.
  After, 0 ignored keywords, 29 of 30 players were seen waiting, and 68 of 73 players called with "your
  turn" finished their talk, up from 62 of 137.
- [x] **51.** `P3` Stack clutter mode pushes bubbles off the top of the canvas and still counts them (`:852`).
  Priority mode never clears `b.capped` (`:848`), so a bubble capped once stays hidden.
  Done: a bubble stacked above y 1 is hidden and counted in "hidden". The capped flag is removed. With 30
  players over 50 s, Stack mode drew 6.4 bubbles per frame fully above the canvas, the highest at y -204.
  Now 0. In Priority mode 738 of 2,999 frames had free slots while capped bubbles stayed hidden. Now 0.
- [x] **52.** `P4` Chat ranges view prints the SAY and YELL labels on top of each other (`:920`).
  Done: YELL is placed first, then SAY, then WHISPER, each at least 8 px under the one before. From the
  start tile, YELL and SAY both drew at y 2. Now YELL is at y 2 and SAY at y 10.
- [x] **53.** `P4` Server sessions view prints "?" for "@". The small font has no `@` (`:925`).
  Done: the line reads "YOU: ELDER AT ELDER.OFFER". A 3 by 5 pixel @ would not be readable, so the font
  stays as it is.
- [x] **54.** `P3` "Wait for server" mode repeats the dialog when E is pressed more than once in flight (`:723`).
  Done: talk() keeps the time of the request in flight and clears it when the reply lands. At 400 ms
  latency, 3 presses sent 3 requests and the elder said his 3 opening lines 3 times, 9 lines before the
  offer. Now 1 request and 3 lines. The keyword sailor is not gated, saying "hi" twice is chat and has its
  own rate limit.
- [x] **55.** `P6` Pause does not pause popups and emotes. They add a fixed 1/60 per frame (`:829`, `:833`, `:892`,
  `:894`, `:899`, `:908`), so they also run 2x fast at 120 Hz.
  Done: the six timers add the frame's dt. Paused with the pointer moving for 600 ms, each advanced 0.65 s
  before and 0 after. Half a second of game time stepped at 1/120 s advanced them 1.0 s before and 0.5 s
  after.
- [x] **56.** `P6` A long word with no spaces overflows the chat log and bubble (`:166` to `:168`).
  Done: layout() breaks at the glyph that crosses the limit when the line has no space. 48 W's made a bubble
  287 px wide against a limit of 84, and a log line of about 290 px against 204. Now the bubble is 83 px on
  4 lines and the log line 203 px.
- [x] **57.** `P6` Typed text is parsed as markup. `[wave]` and `[c=key]` typed by the player take effect (`:726`).
  Done: esc() doubles every [ in typed text and parseRich reads [[ as a literal bracket. "[wave]hi[/wave]
  [c=key]job[/c] [shake]x" showed as "hi job x" with 3 animated glyphs and 3 keyword links. Now it shows as
  typed with none. The server still gets the raw text.
- [x] **58.** `P6` Spanish accents are missing in capitals and in all small-font text, "MISION", "MANANA"
  (`:124`, `:125`, `:131`).
  Done: each font builds Á É Í Ó Ú Ü Ñ from the base letter and a mark drawn in 2 new rows above the cap
  line, so capitals keep their full height. The atlas cell grows 2 px, from 7x11 to 7x13 in the main font.
  All 7 fell back to the bare letter in both fonts before, none do now. With an outline, a mark can touch a
  descender on the line above.
- [x] **59.** `P4` (taste) Canvas fillText comparison mode places vector glyphs at bitmap advances, so words
  split. `ctx.font` is set per glyph (`:147`), which inflates that mode's cost.
  Done: in fillText mode every glyph advances by the vector font's width rounded up, 6 px for the main font,
  and switching renderer re-flows the dialog, the log and the bubbles. The advance was off by up to 3.42 px
  per glyph before, 1.49 px on average, and is off by 0.58 px now. Text is wider in this mode, so lines wrap
  sooner. ctx.font is set only when it changes. With 30 players and the elder's box open, a frame took 0.551
  ms for 334 glyphs before and 0.498 ms for 297 after, in headless Chromium.

## vfx-magic

- [x] **60.** `P3` Monster telegraphs, cast circles and missiles vanish when your own effects fill the 96 cap.
  At spawn the telegraph competes with priority 399 (`:259` to `:261`) and only gets 999 once alive (`:263`).
  Fix: use 999 at spawn for type 11.
  Done: the telegraph asks with 999 at spawn. With 96 own effects alive, a monster cast showed 0 telegraphs
  before and 1 after, and one own spark is evicted for it. The monster's own cast circle and missile still
  lose to own effects, which is the report's order (own, hostile, party, others).
- [x] **61.** `P4` Ribbon trails and afterimages take one sample per frame (`:410`), so they halve at 120 Hz and
  shrink to a stub in Slow motion. Fix: sample every 1/60 s of sim time.
  Done: one trail point per 1/60 s of sim time, interpolated along the frame's move, plus a closing segment
  from the newest point to the head. Ice shard trail measured mid-flight: 49.4 px at 60 Hz before, 25.4 at
  120 Hz, 98.4 at 30 Hz and 12.4 in Slow motion. Now 49.4 px in all four.
- [x] **62.** `P6` Animations driven by the `frame` counter ignore slow motion and run 2x at 120 Hz. Shocked
  arcs (`:540`), beam end orb (`:488`), meteor tail (`:508`), dummy shake (`:548`), brazier light (`:634`).
  (suspected)
  Done: confirmed and fixed. All five read simT at their 60 Hz rate (arcs 20/s, beam orb 15/s, meteor tail
  60/s, dummy shake 30/s, brazier 7.5/s). Dummy shake flips per second of sim time: 30 at 60 Hz and 60 at
  120 Hz before, 30 and 29 after. In Slow motion it flipped 30 times per real second, now 7.
- [x] **63.** `P3` Recasting on a field extends its duration but keeps its age, so it stays shrunk (`:380`).
  Fix: `f.t=0;f.dur=dur`.
  Done: as suggested. A 12 s poison field recast at 10 s: stage 1 of 0 to 2 (shrunk) with age 10 of 22
  before, stage 0 with age 0 of 12 after.
- [x] **64.** `P4` Server events view draws area boxes one tile too big, 8x8 for the 7x7 meteor (`:370`, `:377`,
  `:672`).
  Done: the box is the centre tile plus the radius in whole tiles and ends on the last pixel of the mask.
  Meteor box 129 x 118 px before (x 144 to 272), 112 x 112 after (x 144 to 255, y 32 to 143), the mask
  exactly. Poison 65 x 65 before, 48 x 48 after.
- [x] **65.** `P4` Holding Beam while paused draws it to the top-left corner (`:396`, `:483`).
  Done: the aim and ray code is now beamRay(), called by the step and once by beamStart. Beam started while
  paused with a dummy targeted at 200,67: end point 0,0 before, 196,67 after.
- [x] **66.** `P4` Shock particles keep jittering while paused and at full speed in slow motion (`:286`).
  Done: a zap particle hops once per 1/60 s of its own life. Hops in 30 paused frames: 30 before, 0 after.
  Per real second in Slow motion: 60 before, 15 after. Per sim second at 120 Hz: 120 before, 61 after. 60 Hz
  is unchanged at 60.
- [x] **67.** `P3` Each tap of Beam while paused stacks another beam effect (`:396`, `:413`).
  Done: beamStop kills the caster's beam effect itself. Six taps of Beam while paused: 6 live beam effects
  before, 1 after.
- [x] **68.** `P3` The Beam button drops the beam while held if you tap, then press again within 600 ms. A stale
  timer fires (`:717`).
  Done: the button tracks its held state and clears the pending timer on press. Tap, press again after 300
  ms and hold: the beam was off 500 ms later before, and stays on now. It still stops after release.
- [x] **69.** `P4` Residue toggle leaves scorch and frost decals for up to 12 s (`:317` has no `residue` check).
  Done: drawDecals skips drawing while Residue is off and keeps ageing the decals. A scorch decal with
  Residue off: 123 px drawn before, 0 after. Switched back on, the 123 px return.
- [x] **70.** `P4` (taste) Meteor rune circle is a 108 x 54 ellipse centred on the mage. The blast is 112 x 112
  centred on the tile (`:448`, `:372`).
  Done: an area spell's cast circle is now a true circle of 56 px radius centred on the caster's tile, so it
  covers the mask. With the mage at 100,100 the circle measured 109 x 56 px centred on 100,99.5 before. Now
  113 x 114 centred on 104,104.5, against a blast of 112 x 112 centred on 103.5,103.5. Reduced and minimal
  tiers keep the small ellipse. Card 3 updated.
- [x] **71.** `P6` Beam damage numbers stack into an unreadable column (`:314`, `:600`).
  Done: a beam tick adds to the live number on its target and restarts the rise. After 1 s of beam on a
  dummy: three 5s at y 41, 45 and 48 before, one 25 after. Other damage keeps one number per hit.
- [x] **72.** `P6` Haste button stays lit after the timer runs out (`:703`).
  Done: the aura update syncs the button when the player's haste ends, and clamps the timer at 0 (it stopped
  at -0.017 before). Button lit after expiry: yes before, no after.
- [x] **73.** `P5` HUD "evicted" also counts refused spawns, and "particles refused" counts overwritten live
  particles (`:261`, `:274`).
  Done: four counters now: evicted, refused, particles refused, overwritten. A spawn that loses at a full
  cap counted as 1 evicted before, now 0 evicted and 1 refused. Ten particles written over live ones in a
  full range counted as 10 refused before, now 10 overwritten. A real eviction still counts 1 evicted, and
  10 particles over the cap still count 10 refused.
- [x] **74.** `P6` `lightQ` calls for level up (`:704`) and heal (`:368`) are cleared before render, so those
  lights never show.
  Done: the aura pass queues both lights each frame while the effect plays, fading with it. At night, holy
  lights in the queue one frame after the cast: 0 before, 1 after for each. Brightness gain around the mage:
  level up 16,053 before and 116,181 after, heal 17,166 and 47,003.
- [x] **75.** `P6` Colour-blind mode leaves hostile impact particles and damage numbers in the element colour
  (`:256`, `:375`, `:338`).
  Done: part() and the damage number in hurt() apply the same hostile rule as spawn(). A hostile arcane hit
  with the palette on: 10 arcane particles and an arcane number before, 10 in the orange danger ramp and an
  orange number after.
- [x] **76.** `P6` Reset does not unpause or clear the note, and the first haste afterimages flash at pre-reset
  positions (`:720` to `:722`).
  Done: Reset unpauses, syncs the Pause button and zeroes each actor's afterimage sample count. Paused after
  Reset: yes before, no after. Stale samples after a hasted walk and Reset: 12 before (at 148,100, home is
  88,100), 0 after. The note was already cleared by reset().

## vfx-grass

- [x] **77.** `P4` Trample trails are near-black. The ground is darkened two steps (`:665`) on top of ground
  already darkened (`:339`, `:340`). Card 5 says one step. Fix: one step, clamped at G1.
  Done: one step at every crush level, never below G1 and never the outline black. A 2 s walk through tall
  grass, 410 trail pixels: 211 black and 132 G0 before, 2 black and 63 G0 after (those were G0 or outline
  already). Mean luminance 34.7 before, 60 after, against 69 untrampled.
- [x] **78.** `P3` Frogs marked for despawn freeze forever and fill the 5 slots. The `LST===9` test sits inside
  `if(LST[j]===0)` (`:535`). Rabbits have a rarer version (`:523` to `:532`).
  Done: a marked frog leaps to the pond and a marked rabbit runs off, like scared ones. spawnTick only marks
  resting frogs and rabbits. 5 frogs and 5 rabbits, then winter (targets 0 and 1), 30 s: 5 frogs and 4
  rabbits left, all frozen in state 9 before. 0 frogs and 1 resting rabbit after.
- [x] **79.** `P4` Butterflies never bob and their wings freeze about half the time. `threat()` writes the flee
  direction into `LVZ` and `LB` (`:428`), which butterflies use for vertical velocity and rest flag. `LPH` is
  advanced while perched (`:468`). The same overwrite flattens some rabbit hops. Fix: give `threat()` its own
  outputs (`TAX`, `TAY` at `:424` are declared and unused).
  Done: threat() writes LAX and LAY per creature. Butterflies and rabbits read those. The flap loop was
  rewritten, since the 200 ms rest branch could not run, and the flap timer starts near 0 on spawn and
  take-off. 10 butterflies for 20 s: height range 3 to 4 px, 0.1 up-kicks per second and the same wing
  frame held for 2.4 to 6.7 s before. Range 12 px, 2.9 kicks per second and 0.2 s at most (the rest)
  after. They still perch, 33% of the time against 42%.
- [x] **80.** `P3` "One field layer" goes stale after Reset, for as long as the sim ran before it. `fieldBakeT`
  is not reset (`:656`, `:755`). Cuts made while paused in this mode do not show either.
  Done: Reset clears fieldBakeT, and a dirty field rebakes at once while paused. After a 30 s run and Reset the
  field stayed stale for 30.3 s before, 0 s after. A cut while paused: not shown before, shown after
  (34,481 to 34,409 field pixels).
- [x] **81.** `P4` The hidden traveller in wheat is a headless dithered torso, and the overlay draws over trees
  and sheep in front (`:678`, mask at `:575`).
  Done: the overlay covers all 11 sprite rows and only replaces grass and wheat colours, so trees, sheep and
  flower heads in front stay on top. In wheat: 0 head pixels shown before, 6 after (body 11 both). Player
  pixels drawn over the tree canopy: 3 before, 0 after. Over a sheep in front: 3 before, 0 after.
- [x] **82.** `P4` (taste) Field-layer mode crops 6 of 11 sprite rows, leaving a floating head (`:613`, `:614`).
  Done: the crop is 3 rows (legs and hem), for the traveller and the villager. Rows drawn in tall grass: 5 of
  11 before, 8 of 11 after.
- [x] **83.** `P4` Grass freezes mid-lean with gust sheen stuck on when wind drops to Calm or Reduce motion
  turns on. The settled shortcut returns a non-upright cached key (`:584`).
  Done: the settled shortcut only reuses a cached key that is upright with no sheen. 3,068 tufts, Gusty then
  Calm: 2,715 leaning and 678 with sheen before, 12 leaning (crushed by the sheep) and 0 with sheen after.
  Gusty then Reduce motion: 2,772 and 200 before, 4 and 0 after.
- [x] **84.** `P4` Changing season mid-transition pops to the full previous season in one frame (`:736`).
  Done: a pick during a turn is queued. The running turn finishes at 3x speed, then the queued one starts.
  Winter picked halfway through summer to autumn: 920 of 920 cells changed look in one frame before, 0
  after. Winter is complete 9.4 s after the click, 8 s before.
- [x] **85.** `P4` A firefly halo darkens lamp light where they overlap. `setL` keeps the higher level number,
  not the brighter mix (`:574`, `:681`).
  Done: setL and ring() compare LMIX, so the brighter mix wins. A lit firefly at the lamp head at night: 33 of
  81 lamp-lit pixels got darker before, 0 after.
- [x] **86.** `P3` Showcase forces the interaction map on without syncing its button (`:759`).
  Done: showcase() calls the button's sync function. Map off, then Showcase: map on with the button dark
  before, map on with the button lit after.
- [x] **87.** `P5` HUD total leaves out `windUpdate`, the x-ray overlay and `putImageData`. Card 11 says "near
  1 ms even with a 6x throttle". Measured default is 2.6 ms at 6x.
  Done: windUpdate() is timed into "tufts+wind", and a new "x-ray+present" figure covers the overlay and
  putImageData. Step plus render at 6x throttle, 600 frames: 2.29 ms measured against a HUD total of 2.07
  before, 2.27 against 2.20 after. With the wind x-ray on: 2.62 against 2.14 before, 2.52 against 2.48
  after. Card 11 now says about 0.4 ms on a desktop and 2.3 to 2.6 ms at 6x.
- [x] **88.** `P5` (suspected) HUD says "you: hidden, villager gets 0 B" even when the villager is adjacent or in
  the same patch (`:673`).
  Done: reproduced with the villager one cell away, the HUD read "hidden, villager gets 0 B". It now reads
  "hidden, but the villager is close and still gets you" when the villager is adjacent or in the same
  patch, and keeps the 0 B line when the villager is away.
- [x] **89.** `P5` A hidden villager is "not sent", yet the client keeps stamping its trail and rustle (`:384`).
  Done: while the villager is not sent, its stamps add wear only (server truth) and the rustle is skipped.
  threat() ignores it too, so critters do not flee from it. 0.5 s hidden and not sent: crush up to 1.0, 2
  rustling cells and 8 leaf bits before. All 0 after, with wear still added (76 units).
- [x] **90.** `P6` (taste) Winter arrives as scattered single white pixels. Dawn and dusk snow is a flat salmon.
  Burnt ground is fully covered by snow (`:345`).
  Done: snow on grass arrives in patches (75% value noise, 25% hash). Isolated snow pixels 30% into the turn:
  35% of 8,906 before, 13% of 3,108 after. Burnt ground takes less snow: 100% covered before, 34% after.
  Under a warm sky the snow ramp gets green and blue back, most in the shadow tone. Dusk at 17:45, S0 to
  S2: (135,113,131) (178,144,153) (206,163,165) before, (135,120,156) (178,152,168) (206,173,175) after.

## vfx-water

- [x] **91.** `P3` Logs jam on the banks and under the bridge and are drawn over the bridge planks. They follow
  the 8-direction cell flow (`:321` to `:327`, `:236`). Draw order at `:411`, `:412`. Fix: steer with the per-pixel
  tangent `RTX/RTY` and blit logs before the deck.
  Done: logs steer with `RTX/RTY` times the segment speed, get pushed to mid-stream near a bank and leave
  the plunge pool by its outlet. They are drawn before the posts and the planks. 8 logs dropped from above
  the falls down to the mouth, 60 s: 1 reached the sea before, 8 after, the slowest in 14.7 s. A log
  under the bridge covered 35 deck pixels before, 0 after.
- [x] **92.** `P3` Flow field at the river mouth is a radial starburst over dry beach, pointing upstream in
  places (`:235`).
  Done: the mouth flow follows the last river segment and fans out up to 35 degrees to each side, on sea
  bed that the high tide covers. The flow view skips cells that are dry at the current tide. Sea flow
  cells: 61 with 22 pointing upstream before, 35 with 0 upstream after. Arrows drawn on dry cells at tide
  0, 128 and 255: 35, 26 and 14 before, none after.
- [x] **93.** `P4` Palette-cycle highlights drift out to sea while the swash comes in (`:134`, `:143`). Fix:
  `ramp[(k+step)&3]`.
  Done: `ramp[(k+step)&3]`. Highlight stripe per cycle step, where a higher stripe is further out to sea:
  3, 0, 1, 2 before, 3, 2, 1, 0 after.
- [x] **94.** `P3` The boat strands on sand at low tide and cannot be moved (`:315`).
  Done: while the hull has less than 10 of water the boat heads down the beach at 14 px/s, and steps
  that do not lose depth are allowed. Parked at the shallow limit at tide 200, then tide 40: stuck on dry
  sand at (194,150) for 25 s with a target set before. After, it floats again within 5 s and reaches the
  target. Auto tide from 255 down to 1 with the boat parked: aground for 3,500 of 3,600 frames and still
  aground before, 419 frames in short slides and afloat at the end after.
- [x] **95.** `P4` (taste) Pond heightfield shows large light and dark rectangles. The slope thresholds are
  tiny next to the poke size (`:373`, `:287`).
  Done: the slope is filtered per pixel with a Bayer dither, the thresholds went from 0.5 and 2 to 1.1 and
  3.2, and the wave runs at about 22 px/s (42 before) with more damping. A stone now draws a ring with a
  lit and a dark flank that fades in about 1.5 s. Pond pixels shaded 1 s after a stone, less the 6% that
  lily pads and reflections always cover: 32% before, 9% after. Wading and fish pokes went from 2.5 and 3
  to 4 and 5 so they still show.
- [x] **96.** `P6` (taste) Animated tiles still read as a fixed 8 px lattice with phase offset on (`:140`).
  Done: with the offset on, tile rows slide sideways by a hashed 0 to 7 px, and each tile gets a hashed
  row shift and keeps both dashes or one. Baked into two byte arrays at load. Chance that a lit pixel has
  a lit pixel 8 px to the right, 8 px below and 16 px to the right, on deep sea with a base rate near
  12%: 35%, 50% and 31% before, 18%, 30% and 10% after. Sync tile phase still shows the aligned grid.
- [x] **182.** `P4` (found by the owner in review of PR #13) The walker faces the wrong way when it
  walks east or west.
  Done: `walkSpr()` looked the sprite up with `'durl'[wk.dir]`, while `wk.dir` is 0 down, 1 up, 2 left,
  3 right. The string is now `'dulr'`. Sprite used for left, right, up and down: r, l, u, d before and
  l, r, u, d after. The fishing line already read 2 as left.

## vfx-fire

- [x] **97.** `P4` Heat haze shreds the flames into 1 px row slices. It is on by default and runs after the
  flame pass (`:426` to `:428`, flames at `:402`). Fix: move the haze block before the flames.
  Done: the haze block runs after the smoke and before the flames. Blaze demo, flame pixels inside the
  haze area that the haze pass changed: 2,423 of 4,203 before, 0 after. Sparks, rain and damage numbers
  are no longer shifted either.
- [x] **98.** `P3` Tools hit the ground cell behind the object you clicked. Clicking a tree crown ignites the
  grass north of it (`:484`). Fix: use `OWN[]` for the clicked pixel.
  Done: useTool() takes the cell from `OWN[]` when a standing object owns the clicked pixel. Object pixels
  that lie over another cell: 6,151 on trees and 1,350 on houses. Ignite clicks on them that hit the
  object: 0 before, all 7,501 after. A click on a crown at (8,0) lit the grass cell north of the tree
  before and lights the tree after.
- [x] **99.** `P4` Ground flames draw on top of houses and trees that stand in front of them (`:402` to `:404`).
  Done: the object pass stores the depth row of each drawn object pixel in `OCC[]` (a house counts as
  its front row). Each flame carries the row of its source cell and skips pixels where a deeper object
  stands. The DOOM buffer carries the depth in `DZ[]` next to the heat. Test: burn each of the 59
  ground cells that lie directly north of a tree or house, one at a time. Flame pixels drawn over
  objects in front: 2,664 before and 0 after with sprites, 3,232 before and 0 after with DOOM. Flame
  pixels elsewhere are unchanged (474 and 11,638).
- [x] **100.** `P3` Budget cap makes fire spread only north-west. The 3 ignitions per tick go to the lowest cell
  indices (`:236`). Fix: sort candidates by a hash.
  Done: candidates are sorted by `hash(cell, tick, 11, seed)`, index as tie-break, so every client
  still picks the same 3. Test on an all-grass map, no wind, one ignition at the centre, 40 ticks with
  the cap on. Burnt cells north and south of the start: 86 and 17 before, 51 and 51 after. Mean row
  offset: -4.31 cells before, 0.09 after. The bias was to the north. West and east were already even
  (47 and 53 before).
- [x] **101.** `P4` "Active cells" view flashes every cell that ever ignited. `FLASH` only decays inside the
  x-ray draw (`:201`, `:439`).
  Done: the countdown moved from the x-ray draw to `step60()`. Blaze demo plus 20 ticks in the Normal
  view: cells with a pending flash went from 237 (every cell that ever ignited) to 0 one tick after the
  last ignition. A flash still lasts 12 frames.
- [x] **102.** `P3` Pause freezes the fire grid but not the sheep or fireballs (`:455` to `:457`, `:312`).
  Done: the loop skips `step60()` while paused. Step tick and N run 15 frames of the 60 Hz layer and
  then the tick, so one step moves the whole scene 0.25 s. Test: 60 paused frames with an input on
  each. Sheep moved 14.75 px before and 0 after. A fireball cast while paused flew and landed before.
  Now it waits and flies on resume or step. One step moves the sheep 3.75 px (0 before).
- [x] **103.** `P4` DOOM style shows no flame on the bottom cell row (`:279`).
  Done: `doomStep()` clamps flame seeds below the canvas to the last pixel row, where it used to drop
  them. Test: burn each of the 38 ground cells of row 22 alone and count heat pixels above it after 40
  buffer steps. Cells with no flame: 20 before, 0 after. Mean heat pixels: 28.8 before, 122.3 after
  (row 21 has 97.8).
- [x] **104.** `P4` Explosion ring fades in vertical stripes. It reads `BY` where it should read `BAY` (`:418`).
  Done: the ring fade reads `BAY[]`. Ring pixels at explosion age 20, 22 and 24: 64, 29 and 28 before,
  with columns x mod 4 = 1 and 3 empty from age 22 on. After: 48, 29 and 13, spread over all four
  columns at age 22 and thinned in rows and columns alike at age 24.
- [x] **105.** `P6` Light from the burning sheep and the fireball hops 8 px, one cell at a time (`:350`).
  Done: `glowAt()` splits the glow of the sheep, the fireball and the explosion over the 4 nearest
  cells. Test: move the source 1 px at a time and track the centre of its blurred glow. Before, the
  centre stood still for 7 steps and jumped 8 px on the 8th. After, it moves 1 px per px (0.25 px per
  quarter px for the sheep). Largest change of the light on a fixed pixel per 1 px of fireball travel:
  0.045 before, 0.006 after.
- [x] **106.** `P6` Fuel view calls `px('...')` three times per pixel (`:443`), 17.4 ms median at 6x. Hoist the
  constants.
  Done: the three `px()` colours are constants and the fuel colour is computed once per cell into
  `XC[]`, 920 times a frame where it was 57,600. `xray()` in the fuel view after the Blaze demo,
  median: 3.2 ms before and 0.5 ms after at 6x CPU throttle, 0.56 ms and 0.08 ms at 1x. The frame
  hashes to the same value before and after.
- [x] **107.** `P6` `Math.exp` runs for each of 57,600 pixels every frame, also when idle or paused (`:364`).
  Done: a 4,096-entry table `GLUT[]` holds 1-e^-v in steps of 1/512 and the pixel loop reads it.
  `render()` median at 6x CPU throttle: idle scene 6.1 ms before and 5.0 ms after, Blaze demo 6.8 ms
  and 5.6 ms. At 1x: 1.07 ms and 0.86 ms idle. Largest change on any colour channel, day and night
  frames of the Blaze demo with palette lock off: 1 of 255. Paused frames were already cut to the 12
  after an input by #7.

## vfx-fog

- [ ] **108.** `P4` Alpha blend mode paints full-brightness fog over explored ground that should be dimmed
  (`:361`, `:390`).
- [ ] **109.** `P4` Lamp halos and fog holes are centred at `L.y-9` for every lamp kind (`:343`, `:277`). The cave
  torch halo sits 3 px above its flame and the tower beacon halo is off the canvas.
- [ ] **110.** `P4` (taste) The traveller walks over house roofs and the cliff, and always draws on top of trees
  (`:293`, `:199`, `:372`).
- [ ] **111.** `P3` Field of view can be one cell stale while walking vertically. The trigger uses `P.y` and the
  cast uses `P.y-2` (`:300`, `:290`).
- [ ] **112.** `P6` Cloud shadows pop on and off at `TP.s<.15` where card 5 says they fade (`:328`).
- [ ] **113.** `P6` (suspected) A wall placed on the stream still gets water sparkles (`:379`).
- [ ] **114.** `P6` (suspected) The coastal fog front keeps advancing with Reduce motion on (`:304`).
- [ ] **115.** `P6` (suspected) Cost view allocates a 57,600-entry array and a Float32Array every frame (`:404`).

## vfx-acid

- [ ] **116.** `P1` Crash. Killing a small slime with the sword writes NaN into the acid buffer. The HUD reads
  "acid NaN u", and the canvas freezes once an item touches that pixel. `s.mass-=8` (`:270`) goes negative,
  `rad()` takes its square root (`:235`), `spill()` adds NaN (`:186`), and `matIdx` indexes with it (`:193`). The
  starting small slime triggers it every time. Fix: `Math.sqrt(Math.max(0,s.mass))` and clamp `si` in `matIdx`.
- [ ] **117.** `P3` Standing on the NaN pixel locks the traveller in place (`:267`, `:280`). Fixed by #116.
- [ ] **118.** `P4` All four flasks shatter on the first frame. The support check tests the gap between the table
  legs (`:380`). Fix: test row `fl.y+4`.
- [ ] **119.** `P3` "You dissolved…" stays on screen forever after Repair gear or Reset room during the death
  pause (`:262`, `:277`).
- [ ] **120.** `P3` Fumes pile up at the gate once the bars melt, and survive Reset room. Border cells are never
  blurred or decayed (`:224`, `:197`), and reset clears `G` but not `G2`.
- [ ] **121.** `P6` Spawn slime on a wall leaves it stuck inside the wall (`:395`, `:238`).
- [ ] **122.** `P6` Dragging Pour acid above the canvas flashes "acid NaN u" (`:392`, `:383`).
- [ ] **123.** `P6` (suspected) While paused the HUD runs every frame or never (`:382`). The spawn tool has no
  slime cap.
- [ ] **124.** `P6` 8x speed with the room flooded costs 29 ms median at 6x throttle.

## vfx-rain

- [ ] **125.** `P3` The villager gets stuck on the fountain about 15 s after load and never moves again. A
  waypoint leg passes through the fountain centre (`:177`, `:249`, `:259`).
- [ ] **126.** `P4` (partly taste) Storm spray mist buries the plaza, the house and the player under a dense
  checkerboard with hard rectangular edges (`:230`, `:329`).
- [ ] **127.** `P3` Rain never fully stops after the first shower. 60 streaks keep falling because `I` never
  returns to exactly 0 (`:283`, `:345`). Fix: `I>.02`.
- [ ] **128.** `P4` The pond shows a 4 px dot lattice in sunshine that never fades. Water never dries and keeps
  feeding evaporation mist (`:185`, `:115`, `:229`, `:231`).
- [ ] **129.** `P3` The "dry" floor under the awning gets soaked, 96% wet after 60 s of storm (`:213`, `:214`,
  awning `SHL` at `:146`).
- [ ] **130.** `P4` Streaks travel at twice the angle they are drawn at. Wind is applied to the ground point
  (`:285`) and again from height (`:324`). Fix: delete the line at `:285`.
- [ ] **131.** `P3` Thunder shake never stops while paused (`:335`, `:349`).
- [ ] **132.** `P6` Sim speed 8 in a storm costs 82 ms per frame at 6x throttle. The catch-up loop allows 16
  steps (`:348`).
- [ ] **133.** `P4` (suspected) Rain curtains jump when the wind changes, more the longer the page is open
  (`:180`, `wind*t*42`). Fix: integrate an offset.
- [ ] **134.** `P6` The Intensity readout and HUD do not update while paused.

## vfx-snow

- [ ] **135.** `P3` Footprints appear on the roof, tree canopies and rock tops when the player or fox walks
  behind them. `stamp()` and `depthAt()` accept any snow-holding pixel (`:222`, `:262`). Fix: require
  `cls(S[i])===1`.
- [ ] **136.** `P4` Snow on the top and bottom canvas rows never melts (`:243`).
- [ ] **137.** `P4` Snow shading compares depth across surface boundaries, so the lit flank of every pine gets
  the darkest shadow colour (`:336`). Fix: only use a neighbour of the same class.
- [ ] **138.** `P3` Manual Heavy snow reaches the depth cap everywhere in under 2 minutes and flattens the scene
  (`:220`, `MAXD` at `:144`).
- [ ] **139.** `P6` The last fence post is 1 px wide (`:178`). Use `x<=201`.
- [ ] **140.** `P6` (taste) Fence rails vanish under any snow, and rock caps have no edge against ground snow.
- [ ] **141.** `P6` Walk bob is dead code, the terms cancel (`:325`).
- [ ] **142.** `P6` "Add snow" ignores the canopy cap of 14 (`:229`). Shovel never exposes ground.
- [ ] **143.** `P6` The HUD writes `textContent` every frame (`:362`).
- [ ] **144.** `P6` Speed 16 in heavy snow costs 35 ms at 6x throttle. The loop allows 32 steps (`:372`).
- [ ] **145.** `P6` (suspected) Depth can pass `MAXD` through the sandpile and wind passes (205 measured) in a
  Uint8Array.

## vfx-light

- [ ] **146.** `P4` Every object and both characters are in permanent sun shadow. A caster stamps its own base
  row (`:217`, shading at `:302`, characters at `:263`).
- [ ] **147.** `P4` Sunlight snaps off at 18:00 and on at 06:00, moonlight at about 18:23 and 05:37 (`:208`,
  `:210`). With the default start it happens about 4 s after load. Fix: ramp by elevation.
- [ ] **148.** `P3` Indoors with Light shadows on, the candle lights nothing and furniture acts like walls. The
  candle (`:184`) sits inside the table occluder (`:138`), and the bed occluder (`:136`) beats the fireplace
  threshold (`:198`).
- [ ] **149.** `P4` The magic crystal shadows its own glow (`:188`, `:168`). The brazier has the same setup.
- [ ] **150.** `P4` Placed lights have no sprite, only a glow (`:330`). `RUNE` is defined and never drawn.
- [ ] **151.** `P4` Fireplace and candle flames burn all day while their lights are off (`:269`, `:247`), and the
  room is near black at noon (`:301`).
- [ ] **152.** `P4` House fronts and roofs are lit in vertical stripes at night (`:299`, `:303`).
- [ ] **153.** `P4` Lamp post and fence shadows are dashed at low sun. The stamp is 2 px wide and the step is
  2.48 px (`:217`).
- [ ] **154.** `P3` Indoor sun patches freeze when Sun shadows is off. The early return at `:213` skips
  `SUNP.fill(0)` at `:219`.
- [ ] **155.** `P5` "Your light's rays" view shows stale rays when Light shadows is off (`:284`, `:310`).
- [ ] **156.** `P4` The carried lantern and torch handle draw through roofs and tree crowns (`:276` to `:278`).
- [ ] **157.** `P4` (suspected) The moon glint is on the wrong side of the pond (`:291`).
- [ ] **158.** `P6` String-light bulbs ignore the computed `sag` (`:190`). The lamp glass sits 1 px below the
  cage hole (`:271`). Fireflies drift at about 0.6 px/s and read as static. Noon cobbles clip to white (taste).

## vfx-forest

- [ ] **159.** `P4` Winter bare trees are poles with a flat bar on top. Branches overflow the sprite and `y|0`
  piles them into row 0 (`:136`, `:123`).
- [ ] **160.** `P6` Each season change freezes the frame for 60 ms, 382 ms at 6x throttle. `genGround` redoes
  1280 x 960 pixels (`:276`, `:211` to `:229`). Auto year hits it every 40 s. Fix: bake the four grounds once.
- [ ] **161.** `P4` Moving the Wind slider makes the canopy thrash, more the longer the page is open (`:245`,
  phase is `time*wind`). Fix: accumulate a gust phase.
- [ ] **162.** `P3` Perched birds walk off their tree over time (`:259`). Fix: clamp to the crown width.
- [ ] **163.** `P3` Crows and parrots only change after a teleport. Bird colour is chosen in `spawnBirds` only
  (`:253`, `:256`, `:351`).
- [ ] **164.** `P4` Snowflakes fall over the rainforest and savanna in winter (`:287`, `:321`, ground test at
  `:220`).
- [ ] **165.** `P6` (suspected) Bushes and ferns shift their base row in wind (`:313`). `shake` only decays for
  visible trees (`:285`). Shadows pop at the top edge (`:299`). The minimap rectangle is antialiased (`:326`).
- [ ] **166.** `P6` (suspected) Per-frame garbage. 4 arrays per tree (`:313`) and a hex string per litter pixel
  and particle (`:301`, `:320`). The HUD writes on about 6 of every 18 frames (`:339`).
- [ ] **167.** `P6` The Wind slider has no value readout.
- [ ] **181.** `P2` Non-integer canvas scale, the same defect as #5 (3.10x at 1280, 1.10x at 390). Found while
  fixing #5. The stage sits in a `1fr 200px` grid next to the minimap (`:19`), so the shared `fit()` needs the
  grid cell width, not `main`.

## curves-hearthguard

- [ ] **168.** `P5` "Proposed sawtooth" does not reproduce the report. Chapter 4 starts at 0.85, the report says
  0.92. The lab scales boss time by reference damage over current damage (`:140`), which
  `notes/curves_model.py` does not. Fix: drop the factor, or regenerate the report numbers from the lab.
- [ ] **169.** `P5` The Players slider changes hero level and run length (25.5 to 36.2 min at 3 players),
  against the caption "Per-hero XP equals solo in co-op" (`:124`, `:140` to `:142`).
- [ ] **170.** `P5` Dmg / lvl readout rounds to whole percent on a 0.005 step, so 0.085 and 0.09 both read "9%"
  (`:190`, `:166`).
- [ ] **171.** `P5` Report §12 lists sliders and plots the lab does not have (`waveGapS`, a per-chapter Hearth
  term, mob counts, a target line).
- [ ] **172.** `P6` "Current (b509a56)" stays highlighted when knobs it does not cover are changed (`:226`,
  `:242`).
- [ ] **173.** `P6` Hand-edited localStorage can blank the page. The load check accepts any 5-long array (`:186`).

## curves-matchrpg

- [ ] **174.** `P5` "Endless doubles every" card hardcodes 12 and ignores the Every slider (`:464`). Fix: use
  `S.every`.
- [ ] **175.** `P4` Scroll chart labels collide. "p90 369 s" sits on the boss labels on Diamond, unreadable at
  390 px, and the "600 s" axis label is cut at the right edge (`:391`, `:367`, `:390`, `:359`).
- [ ] **176.** `P5` Landing follows `n % S.every` (`:173`) while walls stay at 12, 24 and 36. The report defines
  it by `n mod 12`. Depends on intent.
- [ ] **177.** `P5` Landing watch text does not match the chart (`:114`).
- [ ] **178.** `P5` Lab and report disagree by 0.01 on the proposal's scroll share, 0.35 and 0.82 against 0.34
  and 0.81 (`:155`).
- [ ] **179.** `P6` "row 1" label hidden behind lines at 390 px. Elite circles have no legend entry (`:109`,
  `:422`). XP_PAST_LEVEL reads "9/24" at the 3/8 stop (`:255`). `REACH` is unused (`:160`).
- [ ] **180.** `P6` (suspected) localStorage values are accepted without range checks (`:224`), so `every:0`
  would print NaN.

## Not covered by the review

- Real touch input on a phone, audio output, Firefox and Safari, displays above 60 Hz (120 Hz findings come
  from stepping the sim at 1/120 s).
