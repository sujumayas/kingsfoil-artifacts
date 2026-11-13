# 12. Gap research: controls, input and missing feel data

Agent 12, 13 Nov 2026. Fills the gaps left by notes 02 to 11 on touch, gamepad, published movement numbers
(Super Meat Boy, N++, Hollow Knight), restart latency, the browser input chain and input display. Labels: [C] cited
from the source listed, [I] inference or computation from cited numbers, [U] unverified (known but the page was not
reached this session), [E] estimate, [K] Kingsfoil build fact from 01-current-build.md, [G] gap.

---

## Q1. Touch and phone controls for side-view platformers and runners

### Takeaway
Every shipped mobile platformer with a time component gave up at least one axis of input. Nintendo built Super
Mario Run around "one hand", portrait, tap to jump and hold to jump higher, and let Mario run and vault on his own.
Team Meat cut Super Meat Boy to two buttons (jump and slide, no direction) for Forever and ported that to phones.
Jetpack Joyride and Geometry Dash are one finger. A keyboard time attack with a full movement kit cannot be
transplanted onto a phone without a redesign, and the designers who tried all chose auto-run plus one or two
buttons rather than a virtual d-pad. For SpeedRunner the honest phone build is a separate "one-thumb" mode with
its own leaderboard (auto-run, tap jump, hold for height, second thumb for wall grab or roll), not a shrunk
keyboard.

### Cited findings
- Super Mario Run (2016). Miyamoto: the premise was "a Mario game that you play one-handed"; "just press, you
  don't have to swipe up to make him jump"; tap jumps, press and hold jumps higher; portrait because most people
  hold a phone in one hand, so the stage design went vertical (climb and drop) within a narrow width; spiny
  enemies were drawn a little bigger so they are easier to see [C, S1 S2 S3]. The official site states Mario
  runs forward on his own and vaults small enemies and gaps automatically [U, S4].
- Super Meat Boy Forever (2020, mobile 20 Apr 2023 at 0.99). Refenes: the goal was to "simplify the controls
  down to two buttons" and still "feel and play like Super Meat Boy"; controls are "the biggest and most
  noticeable change"; two inputs give jump and slide with no directional control; levels are assembled from
  "40 to 50 individually designed mini levels per level" ranked by difficulty [C, S5]. The project began as a
  one-button Meat Boy prototyped in a GDC hotel room in 2011 and started as a mobile concept [C, S6 S7]. Refenes
  rejected the "mobile game" label ("It's a two-button game") [C, S8].
- Jetpack Joyride (2011): one finger, hold to thrust, release to fall; Luke Muscat's GDC 2012 talk "Depth in
  Simplicity" frames it as a 1-button game built for short sessions [C, S9] (also cited in note 02 Q5).
- Doodle Jump (2009): tilt (accelerometer) to steer, tap to shoot; Geometry Dash (2013): tap or hold to jump, auto
  scroll; Alto's Adventure (2015): tap to jump, hold to backflip, auto-run downhill [U, S10 S11 S12].
- Tap delay. Mobile browsers used to wait 300 to 350 ms after `touchend` before firing `click` to detect a
  double tap. Chrome 32 (2014) removed it for pages with `<meta name="viewport" content="width=device-width">`;
  `touch-action: manipulation` on `html` is the CSS fallback; iOS 9.3 (Mar 2016) got the same fix. A game should
  never drive jumps from `click` anyway; use `pointerdown` or `touchstart` [C, S13].
- Hit targets. Apple HIG asks for at least 44 x 44 pt per control [U, S14]; Material asks for 48 x 48 dp with 8 dp
  between targets [U, S15]. Both pages returned only a title to the fetcher this session.
- Haptics. `navigator.vibrate()` is "Limited availability", not Baseline, because it is missing in some widely
  used browsers (Safari and iOS WebKit do not implement it); it needs sticky user activation; patterns that run
  too long are truncated at an implementation-defined length; silent and Do Not Disturb modes may suppress it
  [C, S16]. So web haptics exist on Android Chrome and Firefox only [I].
- Touch latency on phones end to end (finger moves to first screen update, scroll, 240 fps camera, rounded to
  10 ms): iPad Pro 10.5 70 ms, iPhone 6s 70, iPhone 8 80, iPhone X 80, iPhone 5 90, Pixel 2 XL 110, Galaxy S7 120
  [C, S17]. These include the OS compositor, so a web game cannot get below them [I].

### Inferences
- [I] One-button auto-run keeps the time attack honest: every input is a timing decision, and a level stays a
  deterministic timing puzzle. SpeedRunner's kit already has the needed pieces for a one-thumb mode: auto-run at
  `maxRun` 420 u/s, tap = jump with `jumpCut` 0.45 release, hold through the apex band for the full 3.0 BL, wall
  contact auto-sticks (100 ms `wallStick`) and a tap while on a wall = wall jump. Rolls are automatic already.
- [I] The cheapest two-zone layout for landscape play: left 40 % of the screen is direction (touch left half of
  the zone = left, right half = right, slide thumb to switch, no deadzone needed because direction is binary),
  right 60 % is jump anywhere. That satisfies 44 pt targets trivially because the targets are screen halves.
  Thumb zones on a 6.1 in phone in landscape are the lower outer thirds; put nothing time-critical in the top
  middle.
- [I] Tilt (Doodle Jump) does not fit a side-view runner with walls: tilt has about 100 ms of filter latency and
  no neutral detent, which destroys wall-jump direction flips. Swipe gestures fail for the same reason, a swipe
  is recognised after 50 to 150 px of travel, so it is a delayed input [E].
- [I] What a time attack loses on touch: direction reversal speed (a thumb slide is slower than a key tap), jump
  cut precision (touch release jitter), and the 3 to 5 ms keyboard polling floor. Compensation seen in the
  canon: auto-run (Mario Run, SMBF), bigger forgiveness windows (SMBF has no direction so there is no turn to
  miss), separate leaderboards per input device ([I], see Q2 for how speedrun.com handles it).

### Gaps
- [G] No Nintendo statement on the auto-vault rule for small enemies beyond the official site text [U, S4].
- [G] Dead Cells mobile and Sonic Dash control schemes were not researched this session.
- [G] Apple and Material pages returned no body text; the 44 pt and 48 dp figures are from memory [U].
- [G] No measured browser-specific touch-to-paint latency for Safari vs Chrome (only whole-device numbers [S17]).

---

## Q2. Gamepad and keyboard on the web, rebinding, and how speedrun communities treat input devices

### Takeaway
The Gamepad API is polled, not evented, which matches a fixed-step game: read `navigator.getGamepads()` once per
physics step, map through the W3C "standard" layout, apply a radial dead zone, and treat it as another source for
the same `keys` map. speedrun.com does not split Celeste or Super Meat Boy boards by keyboard vs controller; it
splits by game version and by category rules, and bans turbo by default and one-to-many macros everywhere, while
allowing many-to-one bindings. A web leaderboard should copy that: record the input device as metadata, do not
create separate boards until the data shows a gap.

### Cited findings
- Gamepad API (MDN): `gamepadconnected` fires on `window`; if a pad was already plugged in it fires on the first
  button press or axis move; Firefox hides pads until the user interacts with one while the page is visible
  (fingerprinting defence). Poll `navigator.getGamepads()` every frame and index by `gamepad.index` rather than
  keeping a stale reference. `buttons[i].pressed` (bool) and `.value` (0.0 to 1.0 for analog triggers); `axes`
  are -1.0 to 1.0; `mapping === "standard"` when the browser remapped to the standard layout; `timestamp` is a
  `DOMHighResTimeStamp` (not in Firefox). Baseline "Widely available" since Mar 2017 [C, S18].
- W3C standard mapping: buttons 0 to 3 face (0 bottom, 1 right, 2 left, 3 top), 4/5 bumpers, 6/7 triggers, 8/9
  select/start, 10/11 stick clicks, 12 to 15 d-pad up/down/left/right, 16 home; axes 0/1 left stick, 2/3 right
  stick [U, S19].
- speedrun.com site rules: "Turbo is by default disallowed for runs unless otherwise specified in the game rules";
  if a game allows it, track it with a variable; controllers "with non-native functions are disallowed by
  default" [C, S20]. Community rule of thumb on macros: binding several buttons to one action is fine, one button
  to several actions is a macro and banned ("If it's 1 button for multiple inputs, then it's a macro") [C, S21
  S22]. A Celeste demodash button built with controller macro software was questioned on the forum; a one-frame
  down+dash then right emulation "that's a macro and not allowed" (community member, not a moderator) [C, S23].
- speedrun.com Celeste (API, 13 Nov 2026): variables are Dashless, Version (1.4.0.0 down to Pre-1.2.1.0, 54
  values), Full Clear / All Red Berries / Heart+Cassette, Moon Berry, Dash Trigger Skip. No input-device
  variable. IL rules: in-game timer on, or LiveSplit showing chapter time to hundredths; retry to skip gameplay
  banned in 7A, 7B, 8A, 8C; save and quit to alter cycles banned [C, S24].
- speedrun.com Super Meat Boy (API): Any% ("clear light Dr. Fetus", time starts on "Start Game", ends on the
  first all-white frame of the final cutscene; runs better than 18m30s need streamed or recorded attempts),
  106 % (all levels plus 100 bandages), Dark Ending. No keyboard vs controller split [C, S25].

### Inferences
- [I] Dead zone: use a radial dead zone of 0.2 to 0.25 on the left stick for direction, and treat the d-pad
  (buttons 12 to 15) as digital. For a binary-direction runner, map stick x below -0.5 to left and above 0.5 to
  right, which removes the drift problem entirely [E].
- [I] Rebinding UI pattern seen across PC indies: a list of actions, click a row, "press a key" state with a 5 s
  timeout and Esc to cancel, conflict detection that swaps or blocks, "Reset to defaults", store in
  `localStorage` as `{action: [codes]}` using `KeyboardEvent.code` (layout independent, so AZERTY players get
  physical WASD). Allow several keys per action (many-to-one is legal in speedrun rules), never one key to
  several actions.
- [I] For SpeedRunner's board, store `inputDevice: keyboard | gamepad | touch` on submit, and show it as an
  icon on the row. Only split boards if the touch mode is a different game (it is, see Q1), in which case the
  one-thumb mode gets its own map ids and its own board.

### Gaps
- [G] The Gamepad API browser compat table (Safari 10.1+, Chrome 21+) was not in the fetched page text [U].
- [G] No official Celeste or SMB rule text mentions input devices at all; absence is the finding.

---

## Q3. Published movement numbers still missing (Super Meat Boy, N++, Hollow Knight)

### Takeaway
N++ is the win here. The open nclone reimplementation (Python, 60 fps, pixel units, 24 px tiles, 10 px ninja
radius) publishes the ninja constants: fall gravity 0.0667 px/f², held-jump gravity 0.0111 px/f² for up to 45
frames, max run 3.33 px/f (200 px/s, 8.3 tiles/s), floor jump impulse 2 px/f up, wall jump 1 out and 1.4 up (slide
wall jump 0.67 out and 1 up), and 5-frame (83 ms) jump, floor and wall buffers. Hollow Knight's HeroController
only hard-codes timing fields (2-step jump queue, 10-step double-jump queue, 2.85 s DEATH_WAIT); the speed
constants are serialized in the Unity prefab, so the widely quoted 16.65 jump and 20 dash are [U]. Super Meat Boy
has no published constants; the only developer number is a 1/20 s grace after leaving a wall.

### Cited findings
N++ (nclone `nsim.py`, SimonV42, class Ninja, 60 physics frames per second, 1 tile = 24 px, RADIUS = 10 px) [C, S26]:

| Constant | Value | Reading |
|---|---|---|
| GRAVITY_FALL | 0.0667 px/f² | 240 px/s², 10 tiles/s² |
| GRAVITY_JUMP | 0.0111 px/f² | while jump held, 40 px/s² (6x weaker than fall) |
| MAX_JUMP_DURATION | 45 frames | hold gravity lasts at most 750 ms |
| MAX_HOR_SPEED | 3.333 px/f | 200 px/s, 8.3 tiles/s, 10 ninja diameters/s |
| DRAG_REGULAR | 0.9933 per frame | air drag on both axes (0.99^(2/3)) |
| FRICTION_GROUND | 0.9459 per frame | run friction (0.92^(2/3)) |
| FRICTION_WALL | 0.9113 per frame | wall slide friction (0.87^(2/3)) |
| floor jump (flat) | jx 0, jy -2 px/f | 120 px/s up, position also nudged 2 px |
| floor jump (slope, forward) | jy -1.4 | or (2/3 dx, 2 dy) along the normal when perpendicular |
| wall jump (regular) | jx 1, jy -1.4 | 60 px/s out, 84 px/s up |
| wall jump (sliding, holding into wall) | jx 2/3, jy -1 | |
| jump_buffer, floor_buffer, wall_buffer | 5 frames | 83 ms jump buffer, 83 ms coyote, 83 ms wall memory |
| launch_pad_buffer | 4 frames | 67 ms |
| states | 0 immobile, 1 running, 2 ground slide, 3 jumping, 4 falling, 5 wall sliding | |

Hollow Knight (`HeroController.cs` decompile mirror) [C, S27]:
- Hard-coded: `JUMP_QUEUE_STEPS = 2`, `JUMP_RELEASE_QUEUE_STEPS = 2`, `DOUBLE_JUMP_QUEUE_STEPS = 10`,
  `DEATH_WAIT = 2.85f`, `HAZARD_DEATH_CHECK_TIME = 3f`, `BUMP_VELOCITY = 4f`, `BUMP_VELOCITY_DASH = 5f`,
  `MANTIS_CHARM_SCALE = 1.35f`, `LOOK_DELAY = 0.85f`. Steps are Unity FixedUpdate ticks (50 Hz default [U]), so
  the jump input queue is 40 ms and the double-jump queue 200 ms [I].
- Declared public without values (set in the prefab, not in code): `RUN_SPEED`, `RUN_SPEED_CH`,
  `RUN_SPEED_CH_COMBO`, `WALK_SPEED`, `JUMP_SPEED`, `JUMP_STEPS`, `JUMP_STEPS_MIN`, `DOUBLE_JUMP_STEPS`,
  `WJLOCK_STEPS_SHORT`, `WJLOCK_STEPS_LONG`, `WJ_KICKOFF_SPEED`, `DASH_SPEED`, `DASH_SPEED_SHARP`, `DASH_TIME`,
  `DASH_COOLDOWN`, `DASH_QUEUE_STEPS`, `BACK_DASH_SPEED`, `BACK_DASH_TIME`, `SHADOW_DASH_SPEED/TIME/COOLDOWN`,
  `WALLSLIDE_SPEED`, `WALLSLIDE_DECEL`, `DEFAULT_GRAVITY`, `MAX_FALL_VELOCITY`, `BIG_FALL_TIME`,
  `HARD_LANDING_TIME`, `RECOIL_DURATION`, `INVUL_TIME` [C, S27].
- Community-quoted prefab values, not verified this session: RUN_SPEED 8.3 u/s, JUMP_SPEED 16.65 u/s, DASH_SPEED
  20 u/s, DASH_TIME 0.25 s, WALLSLIDE_SPEED 5 u/s, MAX_FALL_VELOCITY 25 u/s, DEFAULT_GRAVITY 0.79 (gravity
  scale) [U]. The Knight's collider is about 1.0 x 1.3 Unity units [U].
- Super Meat Boy: Refenes added "a delay of about 1/20 of a second" (50 ms) after the player leaves a wall slide
  because players kept failing wall jumps [C, S28]. Meat Boy's standing jump covers about what Mario's run jump
  covers, and the wall slide carries the same upward momentum whether or not you ran first [C, S29]. Mary Rose
  Cook borrowed from SMB the rule that blocks the jump while clinging so the wall acts as a "glass ceiling", and
  SMB auto-launches the character away from the wall [C, S30]. McMillen (note 03 S6): respawn "almost
  instantaneous".

### Inferences
- [I] N++ jump heights, computed from the table (ignoring drag, which shaves a few percent): minimum jump
  (release at once) = 2²/(2·0.0667) = 30 px = 1.25 tiles, 1.5 ninja diameters, apex at 30 frames (0.5 s). Full
  held jump: 45 frames at 0.0111 leaves 1.5 px/f and 78.75 px climbed, then 1.5²/(2·0.0667) = 16.9 px more, so
  about 96 px = 4.0 tiles = 4.8 ninja diameters, apex at 67.5 frames (1.125 s). N's floatiness is a 6:1 gravity
  ratio held for 0.75 s, the opposite of SpeedRunner's 0.55 apex band within 90 u/s of the apex [K].
- [I] N++ wall jump geometry: regular wall jump leaves at 60 px/s out and 84 px/s up (angle 54 degrees above
  horizontal), the slide wall jump at 40 out and 60 up. Both nudge the position by the impulse for one frame so
  the ninja clears the wall collider immediately, a cheap corner-correction trick worth copying.
- [I] N++ grace windows are all 5 frames (83 ms). Celeste uses 6 frames (100 ms) coyote, SpeedRunner 100 ms
  coyote, 130 ms buffer, 80 ms wall coyote [K]. Three unrelated games landed within 17 ms of each other.
- [I] Hollow Knight's 2-step jump queue at 50 Hz is a 40 ms buffer, the shortest in this study; its 10-step
  double-jump queue (200 ms) shows the designers widening the window for the ability players spam.

### Gaps
- [G] Super Meat Boy has no published constants. The "Super Meat Boy 3D" wiki numbers found by search describe a
  different (fan) game and were discarded. The Scribd paper that quotes the 1/20 s delay was not opened.
- [G] Hollow Knight prefab values need a `MonoBehaviour` dump from the game's `sharedassets`; not reachable.
- [G] Super Mario Odyssey and 3D World not attempted (not cheap).
- [G] Metanet's own "N physics" page for N v1.4 was not found; nclone is a reverse engineering of N++ at 60 fps
  and the author's comments mark the 2/3 exponents as conversions from the Flash N 40 fps values [I from the
  comments `0.99^(2/3)`].

---

## Q4. Measured restart and respawn times (death to control)

### Takeaway
Only one hard number was reachable in code this session: Hollow Knight waits `DEATH_WAIT = 2.85 s` on a hazard
death before the respawn coroutine. Everything else is a labelled estimate. The pattern in the canon is clear
anyway: games built for restarts sit under 1 s (Super Meat Boy, Celeste, N++, Hotline Miami, Trackmania, Neon
White), while SpeedRunner's 3.4 s (0.38 s death plus a 3 s countdown) [K] is three to six times longer than its
twins. The single cheapest change in this study is a countdown-free restart.

### Cited findings
| Game | Death to control | Source and label |
|---|---|---|
| Hollow Knight (hazard) | `DEATH_WAIT 2.85 s` before `HazardRespawn()`, plus the respawn fade [C, S27]; total about 3 s [E] | decompiled `HeroController.cs` |
| Super Meat Boy | "almost instantaneous" [C, note 03 S6]; about 0.5 s including the splat [E] | McMillen |
| Celeste | death animation then screen wipe; players call it near instant, one Steam thread asks to skip the "about a second" animation [C, S31]; about 1.0 to 1.5 s from death to first input [E] | Steam forum, community |
| N++ | respawn is a level reset with no fade [U]; under 0.5 s [E] | |
| Hotline Miami | `R` restarts the floor immediately, no fade or menu [U]; under 0.5 s [E] | |
| Trackmania (2020) | Backspace/Delete respawns to the last checkpoint or restarts; the car is placed at the start and the run begins on the next input, no 3-2-1 in solo time attack [U]; about 1 s [E] | |
| Neon White | death restarts the level; reset button reloads instantly [C, S32 for the restart rule]; about 1 s [E] | Wikipedia |
| SpeedRunner | 0.38 s dead + 3 s countdown = about 3.4 s [K] | bundle |

### Inferences
- [I] A 3 s countdown on every death at a death rate of one per 20 s of play means 13 % of session time is spent
  watching numbers. For a hard map where a first clear takes 50 attempts, that is 2.5 minutes of countdown.
- [I] Proposal: countdown only on the first attempt after map select; on death or `R`, hold the hero at the start
  with the timer stopped and start the timer on the first horizontal input (Trackmania's rule). Death to control
  becomes the 0.38 s death pause, which is already shorter than Celeste's.
- [I] Keep the determinism contract: movers and wheels are driven by run time [K], so a timer that starts on first
  input keeps every attempt identical.

### Gaps
- [G] No frame-counted videos were analysed. Measuring the Celeste, SMB, N++ and Hotline Miami restarts from
  60 fps gameplay captures is a 30-minute task for the author with a frame stepper.
- [G] Celeste's `PlayerDeadBody.DeathRoutine` timings were not fetched (grep.app returned no JSON).

---

## Q5. Input latency chain in a browser game

### Takeaway
End-to-end keypress-to-photon on a modern laptop is 50 to 200 ms depending on OS and display, about 2.5 frames of
which are display pipeline buffering (Dan Luu's model). The browser adds its own frame: Chrome delivers input
aligned with `requestAnimationFrame`, so a keydown waits up to one frame to be seen, one frame to be drawn, and
one or two more in the compositor and display. SpeedRunner's 120 Hz step with interpolation keeps the simulation's
own share at most 8.3 ms (one step of interpolation lag) plus 0 to 8.3 ms until the next step reads the flag. The
right measurement tool is a 240 fps phone camera (4 ms resolution, Is It Snappy).

### Cited findings
- Keypress-to-screen latency, 240 fps camera, rounded to 10 ms (key starts moving until the screen finishes
  updating): Apple IIe 30 ms (1983), custom Haswell-E at 165 Hz 50 ms, ThinkPad 13 ChromeOS 70 ms, 2014 MacBook
  Pro 100 ms, X1 Carbon Linux 110 ms, X1 Carbon Windows 150 ms, PowerSpec G405 Linux 170 ms, Windows 200 ms
  [C, S17].
- Refresh rate model: moving 24 Hz to 165 Hz gained 90 ms where a no-buffer model predicts 18 ms, so about 2.5
  frames of latency sit in the pipeline whatever the refresh rate; an infinite-Hz display would still show about
  36 ms on that machine [C, S17]. Devices under 40 ms were re-measured with a 1000 fps camera [C, S17].
- Chrome's responsiveness budget for a keyboard interaction is 50 ms (clicks and drags 100 ms); the INP metric
  measures from input event to the next paint [C, S33].
- Is It Snappy (Chad Austin, iOS): records input device and screen together at 240 fps on iPhone 6 and later,
  you mark the input frame and the response frame, "nearly four milliseconds of precision"; measurements swing
  about 10 ms and sometimes 30 ms, so take several [C, S34].
- Browser-only latency tools (rAF click tests) measure only the browser-visible interval, not switch to photon;
  a true measurement needs an external camera [C, S35].
- SpeedRunner reads `keys` plus a one-shot `jumpPressed` flag consumed by the next physics step, 1/120 s step,
  render interpolates with `acc / DT` [K].

### Inferences
- [I] Latency budget for SpeedRunner in Chrome at 60 Hz, best case: keyboard USB poll 1 to 8 ms, OS to browser
  process 1 to 3 ms, wait for the rAF-aligned input dispatch 0 to 16.7 ms (mean 8), physics step pickup 0 to 8.3 ms
  (mean 4), interpolation lag up to 8.3 ms, draw and commit 0 to 16.7 ms, compositor plus display scan-out 16.7 to
  33 ms. Typical total about 60 to 80 ms, floor about 40 ms. A 120 Hz fixed step with 60 Hz render adds at most
  one step (8.3 ms) over a game that steps once per frame, and it halves the quantisation of jump timing.
- [I] Rules already in the build that are correct and should stay: consume presses at the step, not the frame;
  keep `jumpPressed` sticky until a step reads it (so a press between two rAFs is never lost); do not wait for
  `keyup` to act on anything except the jump cut. Add: read `event.code`, never `event.key`; call
  `preventDefault()` on Space and arrows so the page does not scroll; use `performance.now()` on the event for
  the ghost input log, not the frame time.
- [I] Cheap measurement protocol for the collective: film the keyboard and screen together with a phone at
  240 fps, press Space from rest, count frames from key bottom-out to the first frame where the hero's feet leave
  the ground, multiply by 4.17 ms, repeat 10 times, report median. Compare Chrome vs Safari and 60 vs 120 Hz
  monitors. Target under 70 ms; flag anything over 100 ms.

### Gaps
- [G] No published Chrome vs Safari keyboard-to-paint comparison with numbers; the search returned only tools.
- [G] Chromium's "align input with vsync" design doc was not fetched; the one-frame input alignment is [U].

---

## Q6. Input display and input recording on stream

### Takeaway
Input viewers are a commodity for runners: NohBoard (GPL-2, Windows, GDI+, 1.3k stars) is the default keyboard
overlay, and speedrun.com's Celeste resources page ships a "Keyboard Input Display (NohBoard) Starter Kit". TAS
communities display inputs frame by frame (CelesteTAS Info HUD, toggled by double Ctrl). A built-in input display
in SpeedRunner costs one `fillRect` per key per frame and doubles as a cheat and bug report tool when it is
recorded into the ghost.

### Cited findings
- NohBoard: "keyboard visualization program", Windows, C# rewrite rendering with GDI+ (old version C++ DirectX),
  "easily capturable (possibly with chroma key)", layout and style definitions, GPL-2.0, 1.3k stars, 202 forks,
  312 commits; recommended OBS window capture [C, S36]. speedrun.com Celeste resources list a NohBoard starter kit
  [C, S37].
- CelesteTAS Info HUD: an overlay for TASing with entity and state variables, default toggle double press Left
  Control, custom templates loaded from the clipboard (CelesteTAV uses it) [C, S38].
- Akron (Everest mod): in-game HUD widgets for labels, inputs, timers, resources, stats and setup state [C, S39].

### Inferences
- [I] Built-in input display for SpeedRunner: four glyphs (left, right, jump, R) in the lower left corner, 24 px
  squares, filled while held, fading over 120 ms after release, drawn from the `keys` map after the step so what is
  shown is what the simulation saw. Toggle in settings and `I` key. Shown in the duel for both the player and the
  shadow if the ghost format grows an input byte per sample.
- [I] Input recording: one byte per physics step (bit 0 left, 1 right, 2 jump held, 3 jump pressed this step, 4
  restart) is 120 B/s, 7.2 KB per minute uncompressed, compared with the 100 KB/min pose ghost [K]. Run-length
  encoding of held states cuts it to about 1 to 2 KB/min [E]. With deterministic physics this is also a replay
  format and a server-side verification format (note 09 covers validation).

### Gaps
- [G] No source on how Celeste TAS videos render the input strip (the Studio tool's input list is the likely
  origin) [U].

---

## Candidate technique profiles

1. **One-thumb auto-run mode** (Super Mario Run, Super Meat Boy Forever, Jetpack Joyride, Geometry Dash). Auto-run
   at 420 u/s, tap jump, hold for the apex band, tap on wall = wall jump, second zone for roll or wall grab. Its
   own map ids and board. Numbers: Mario Run tap and hold; SMBF 2 buttons, 40 to 50 mini levels per level; tap
   delay 300 to 350 ms killed by `width=device-width` since Chrome 32 and iOS 9.3.
2. **Two-zone landscape touch** (direction half and jump half). Targets are screen halves, so 44 pt (Apple) and
   48 dp (Material) are met; `pointerdown` not `click`; `touch-action: none` on the canvas; haptics only on
   Android via `navigator.vibrate` after sticky activation.
3. **Gamepad through the Gamepad API** (MDN standard mapping). Poll `navigator.getGamepads()` at each physics step,
   d-pad buttons 12 to 15, stick x threshold 0.5 for binary direction, radial dead zone 0.2 to 0.25, bottom face
   button 0 jump, mapping flag check for `"standard"`.
4. **Rebinding with speedrun-legal rules**. `KeyboardEvent.code`, many-to-one allowed, one-to-many refused, press
   to bind, 5 s timeout, conflict swap, reset to defaults, stored in `localStorage`. Matches speedrun.com's
   turbo-off default and macro consensus.
5. **Countdown-free restart** (Trackmania, Hotline Miami, Super Meat Boy, Celeste). Timer starts on first
   horizontal input after a death or `R`; death to control drops from about 3.4 s to 0.38 s. Benchmarks: Hollow
   Knight `DEATH_WAIT` 2.85 s (the slow end), SMB "almost instantaneous", Celeste about 1 s [E].
6. **Step-aligned input and a latency measurement ritual**. Keep the one-shot `jumpPressed` consumed at the step,
   `preventDefault` on Space and arrows, `performance.now()` stamps. Measure with a 240 fps phone video (4.17 ms
   per frame), 10 presses, median; targets under 70 ms, flag over 100 ms. Reference points: 50 to 200 ms laptop
   keypress-to-screen, 2.5 frames of pipeline buffering (Dan Luu), Chrome keyboard budget 50 ms.
7. **Built-in input display and 1-byte-per-step input log**. Four glyphs from the `keys` map after the step, 120 ms
   release fade; input log 120 B/s raw, about 1 to 2 KB/min RLE, usable as replay and verification.
8. **N++ grace triplet as a sanity check**. 5-frame (83 ms) jump buffer, coyote and wall memory, 6:1 held-jump
   gravity ratio for 45 frames, position nudge by the jump impulse to clear the wall collider.

---

## Sources
1. Shacknews, Miyamoto on Super Mario Run (2016): https://www.shacknews.com/article/96686/shigeru-miyamoto-on-super-mario-run-were-not-just-making-a-simple-or-easy-mario-game
2. Pocket-lint, Super Mario Run preview with Miyamoto: https://www.pocket-lint.com/games/news/nintendo/138796-super-mario-run-preview-playing-the-game-with-miyamoto-himself
3. Siliconera, Super Mario Run design and portrait: https://www.siliconera.com/nintendo-super-mario-runs-design-didnt-make-mobile-games-sooner/
4. Nintendo, Super Mario Run official site (how to play): https://supermariorun.com/
5. PCGamesInsider, Refenes interview, 12 Oct 2017: https://www.pcgamesinsider.biz/indie-interview/66238/we-wanted-it-to-have-two-buttons-and-still-feel-and-play-like-super-meat-boy/
6. GamingBolt, Super Meat Boy Forever interview (controls, levels): https://gamingbolt.com/super-meat-boy-forever-interview-controls-levels-story-and-more
7. PocketGamer.biz, SMBF comes to mobile (20 Apr 2023): https://www.pocketgamer.biz/super-meat-boy-forever-finally-makes-the-jump-to-mobile
8. PC Gamer, SMBF is an auto-runner: https://www.pcgamer.com/super-meat-boy-forever-is-an-auto-runner-but-it-might-be-the-best-auto-runner
9. GDC Vault, Luke Muscat, "Depth in Simplicity" (Jetpack Joyride, 2012): https://www.gdcvault.com/play/1015713/Jetpack-Joyride-Depth-in
10. Wikipedia, Doodle Jump: https://en.wikipedia.org/wiki/Doodle_Jump
11. Wikipedia, Geometry Dash: https://en.wikipedia.org/wiki/Geometry_Dash
12. Wikipedia, Alto's Adventure: https://en.wikipedia.org/wiki/Alto%27s_Adventure
13. Chrome Developers, "300ms tap delay, gone away": https://developer.chrome.com/blog/300ms-tap-delay-gone-away
14. Apple HIG, Accessibility (44 x 44 pt hit target): https://developer.apple.com/design/human-interface-guidelines/accessibility
15. Material Design 2, Accessibility (48 x 48 dp, 8 dp spacing): https://m2.material.io/design/usability/accessibility.html
16. MDN, Navigator.vibrate(): https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate
17. Dan Luu, "Computer latency: 1977-2017" (keypress and scroll tables): https://danluu.com/input-lag/
18. MDN, Using the Gamepad API: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
19. W3C Gamepad spec, standard mapping: https://w3c.github.io/gamepad/#remapping
20. speedrun.com, Site Rules (turbo default): https://speedrun.com/support/learn/site-rules
21. speedrun.com forum, "Why not ban all macros?": https://speedrun.com/es-ES/posts/c5un6
22. speedrun.com forum post on macro definition: https://www.speedrun.com/post/9vgf3
23. speedrun.com Celeste forum, demodash button via controller software: https://www.speedrun.com/post/9nndj
24. speedrun.com API, Celeste categories and variables: https://www.speedrun.com/api/v1/games/celeste/categories and https://www.speedrun.com/api/v1/games/celeste/variables
25. speedrun.com API, Super Meat Boy categories: https://www.speedrun.com/api/v1/games/smb/categories
26. nclone (N++ physics reimplementation), `nsim.py`, class Ninja: https://github.com/SimonV42/nclone/blob/master/nsim.py
27. Hollow Knight `HeroController.cs` decompile mirror: https://github.com/AminSedaghaty/HK-Source/blob/f516282143970c48bcb25b695489ec0855b3b837/CSharp/HeroController.cs
28. Scribd, 2D platformer design paper quoting Refenes on the 1/20 s wall grace: https://www.scribd.com/document/624520952/paper-248-1
29. Critical-Gaming, Super Meat Boy pt. 1 (2011): https://critical-gaming.squarespace.com/blog/2011/1/5/super-meat-boy-pt1.html
30. Mary Rose Cook, "Deft and intuitive player character movement in a 2D platformer": https://maryrosecook.com/blog/post/deft-and-intuitive-player-character-movement-in-a-2d-platformer
31. Steam Community, Celeste "Smoll animations after death": https://steamcommunity.com/app/504230/discussions/0/3106888980062841603
32. Wikipedia, Neon White: https://en.wikipedia.org/wiki/Neon_White
33. web.dev, "Feedback wanted: An experimental responsiveness metric" (keyboard 50 ms budget): https://web.dev/articles/responsiveness
34. Is It Snappy? (Chad Austin): https://isitsnappy.com/
35. Hardware test, browser input lag test (rAF, software layer only): https://hardwaretest.vercel.app/input-lag-test/
36. NohBoard (GitHub, GPL-2.0): https://github.com/ThoNohT/NohBoard
37. speedrun.com Celeste resources, Keyboard Input Display (NohBoard) Starter Kit: https://speedrun.com/celeste/resources/tlxxm
38. CelesteTAS-EverestInterop wiki, Info HUD: https://github.com/EverestAPI/CelesteTAS-EverestInterop/wiki/Info-HUD
39. Akron (Everest mod with input widgets): https://github.com/Microck/akron
