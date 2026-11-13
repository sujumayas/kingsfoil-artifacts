# 03. Animation, camera, feedback and audio for a stick-samurai time attack

Research agent 03, 13 Nov 2026. About 27 tool calls. Tags: [C] cited with URL, [I] inference, [K] Kingsfoil fact from
`01-current-build.md`, [G] gap. Primary source that paid off most: Celeste's published `Player.cs` (MIT, NoelFB/Celeste
repo, path `Source/Player/Player.cs`) [S1]. The Sonic Retro physics guide was behind an Anubis bot wall this session,
so Sonic camera numbers come from a search snippet of that page plus memory flagged as inference.

Celeste units: the game renders at 320x180 px, Madeline's speeds are in px/s (MaxRun 90, MaxFall 160, FastMaxFall 240).
SpeedRunner units: world units (u), hero 20x46 u, view about 970x545 u.

---

## Q1. Character animation in runners

### Takeaway
Shipped precision platformers use very few animation frames and lean on three procedural layers instead: a scale
squash/stretch of about ±40% on jump and landing that decays over 200 to 350 ms, speed-driven frame timing for the run
cycle, and a colour or secondary-motion state indicator (Celeste's hair). Wind-up frames are absent because every one
costs input latency. A stick rig can copy all of this directly since it already poses procedurally.

### Cited findings
- Celeste jump stretch: `Sprite.Scale = (0.6, 1.4)` on `Jump()`, `ClimbJump()`, `WallJump()` and `SuperWallJump()`,
  so 40% narrower and 40% taller on the launch frame [S1].
- Celeste landing squash scales with fall speed: `squish = min(Speed.Y / FastMaxFall, 1)` with `FastMaxFall = 240`,
  then `Scale.X = lerp(1, 1.6, squish)`, `Scale.Y = lerp(1, 0.4, squish)`. Full squash (160% wide, 40% tall) only at
  fast-fall terminal velocity; a normal landing at `MaxFall` 160 gives 67% of that (about 1.4 x 0.6) [S1].
- Celeste recovery: `Calc.Approach(Sprite.Scale, 1, 1.75 * dt)`, i.e. 1.75 scale units per second. From 1.4 back to 1
  takes 229 ms; from 0.4 to 1 takes 343 ms [S1].
- Celeste duck: `Scale = (1.4, 0.6)` [S1]. Temple fall landing: `Scale.Y = 0.7` plus a 0.5 s directional shake [S1].
- Celeste hair as state: `NormalHairColor #AC3232` (dash ready), `UsedHairColor #44B7FF` (no dash), `TwoDashesHairColor
  #FF6DEF` (pink, two dashes), `FlyPowerHairColor #F2EB6D`, and `FlashHairColor = White` for `hairFlashTimer = 0.12 s`
  whenever the dash count changes [S1]. Community sources agree red means dash ready, blue/cyan spent, pink two dashes
  [S10][S11]. No source supports a "white" two-dash state; white is only the 120 ms flash.
- Celeste dash feedback bundle, from `DashBegin`/`DashCoroutine`: `Celeste.Freeze(0.05)` (50 ms hit-stop, skipped when
  `TimeRate <= 0.25`), `DirectionalShake(DashDir, 0.2 s)`, a displacement burst 0.4 s long growing radius 8 to 64 px,
  `SlashFx.Burst`, an after-image trail every `dashTrailTimer = 0.08 s`, FG particles every 0.02 s, rumble
  Strong/Medium [S1].
- Super Mario Bros. (NES) run cycle: RAM `$070C` is the walk animation delay in frames (60 Hz): 5 for slow walk, 3 at
  full walk speed, 2 at running speed; `$070D` cycles 3 frames (0,1,2). So one full cycle is 15, 9 or 6 frames (250,
  150, 100 ms) [S7].
- Super Meat Boy: "the action never stop, even when the player was killed"; death and respawn are "almost
  instantaneous"; the end-of-level replay shows "past 40-plus attempts all playing at once"; more than 150 light-world
  and 150 dark-world levels [S6].
- Celeste death: `Die()` calls `level.Shake()`, rumbles Light/Medium, zeroes speed, drops the held object and swaps the
  player for a `PlayerDeadBody` entity. Intro respawn tween is 0.6 s with `char_mad_revive` [S1].
- Rain World animates every creature from a procedural skeleton of points with hand-drawn parts layered on top (GDC
  2016 Animation Bootcamp, Joar Jakobsson and James Therrien; free video) [S12][S13].

### Inferences
- [I] SpeedRunner's 130 ms land squash [K] is shorter than Celeste's 230 to 340 ms recovery. For a stick rig the squash
  should be applied as a rig-level scale about the feet (scale Y 0.6 to 0.7 at `maxFall` 1150 u/s, X 1.3 to 1.4) and
  decayed with the existing pose lerp or `1.75/s` approach. Map `squish = min(vy / maxFall, 1)` as Celeste does.
- [I] Jump stretch (0.6, 1.4) for one frame then decay is cheap in Canvas2D: one `ctx.scale` around the hip pivot before
  drawing the limbs. It also sells the jump without any wind-up, which matters because SpeedRunner's jump fires on the
  same physics step as the press (buffer consumed next step) and a wind-up would add 2 to 4 frames of latency.
- [I] SMB's run cycle at 10 Hz full cycle (6 frames) is faster than SpeedRunner's 2.8 strides/s [K]. If one "stride" in
  the build is a full two-step cycle, that is 5.6 footfalls/s, close to a sprint and fine. If it is one footfall the
  legs will read as slow at 420 u/s. Worth checking in the build.
- [I] Celeste's hair colour is a 1-bit resource display read at a glance. SpeedRunner has no dash, but the same trick can
  show "roll available" (fall over 230 u) or "wall coyote active" with the kimono or hat colour and a 120 ms white flash
  on state change.
- [I] Death animations in these games are short and keep the body on screen as information (SMB blood, Celeste shatter
  that emits a burst and a 0.6 s revive). With the build's 0.38 s dead time [K], a 0.3 s ragdoll or ink-splash of the
  stick figure fits.

### Gaps
- [G] Exact frame counts and squash amounts for Super Meat Boy, Pizza Tower, Rayman Legends, Katana ZERO, Dustforce,
  Jump King, N++ ninja: no primary source found this session. The Metanet N++ blog did not surface.
- [G] Celeste `DeathEffect` duration and death-to-control ms are in `Level.cs`/`PlayerDeadBody.cs`, not in the
  published `Player.cs`.
- [G] Sonic animation frame-duration formula (`SPG:Animations`) blocked by the bot wall.

---

## Q2. Procedural animation and stick-figure/vector rigs

### Takeaway
Three numbers to carry: Celeste's 80 ms after-image interval for a trail, its 1.75/s scale recovery, and a wall-slide dust
emitter of 1 particle per 10 ms. Secondary motion in shipped 2D games is a short chain of lerped points (hair, cloth)
rather than a physics sim; the build's kimono spring (stiffness 160, damping 14) [K] is already that.

### Cited findings
- Celeste dash trail: `CreateTrail()` then `dashTrailTimer = 0.08`, so an after-image every 80 ms during the dash [S1].
- Celeste wall slide particles: emitted only while `wallSlideTimer / WallSlideTime > 0.65` (the first 35% of the slide
  window), `Scene.OnInterval(0.01)` so 1 dust particle every 10 ms, offset (±5, 4) px from the player, `Dust.Burst(at,
  Up, 1)` [S1].
- Celeste camera and sprite use the same smoothing idiom: `1 - pow(0.01, dt)` closes 99% of the gap per second [S1].
- Rain World: limbs are "cosmetic additions drawn over a procedural base" animated from player input; Jakobsson "never
  really set out to do procedural animation" [S12][S13].
- Keren notes lerp smoothing can lag behind "very large, fast characters" [S2].

### Inferences
- [I] `1 - pow(0.01, dt)` has a time constant of 1/ln(100) = 217 ms (half-life 150 ms). SpeedRunner's pose lerp
  `1 - exp(-26 dt)` [K] has a 38 ms time constant, about 6x snappier, right for limbs; the camera's rate 5/s (200 ms
  time constant) [K] is almost exactly Celeste's.
- [I] A 2-link leg IK for a stick figure is two `atan2`/law-of-cosines calls per leg; the build already stores thigh and
  shin angles so a foot-planting pass (lock the foot on the ground during the stance half of the cycle, solve the knee)
  costs a few lines and removes foot sliding, the most visible stick-figure flaw.
- [I] Speed trail for the samurai: redraw the last N poses from the ghost-style sample buffer the build already keeps
  (18 numbers at 30 Hz [K]) at falling alpha. Celeste's 80 ms spacing at 240 px/s dash speed gives after-images 19 px
  apart (about 2.4 Madeline widths). At 420 u/s, 80 ms gives 34 u spacing, 1.7 body widths, visually similar.
- [I] Ragdoll on death: the rig already has 10 joint angles; a death ragdoll can be "angles get angular velocity from
  impact direction, gravity on the hip, damping 6 to 10/s" for 300 ms, no physics engine needed.

### Gaps
- [G] Celeste `PlayerHair.cs` is not in the public repo (404); node count and per-node follow rate unverified.
- [G] Spelunky rope and Solipskier trail implementation details: no primary source reached.
- [G] Sonic after-image rules (Sonic 2 Super Sonic, Sonic CD): blocked page.

---

## Q3. World feedback (dust, shake, hit-stop, flash)

### Takeaway
Shipped counts are small: Celeste bursts 4 dust particles on a jump, 8 on a hard landing (and only when fall speed is at
least half of max), 1 per 10 ms on a wall slide. Hit-stop is 50 ms on a dash and shake is directional and 200 ms.
SpeedRunner's counts (7 jump, 9 wall jump, 6 land, 10 roll, 22 death) [K] are already on the generous side.

### Cited findings
- Celeste `Dust.Burst(BottomCenter, Up, 4)` on jump; 4 on each wall jump; landing `Dust.Burst(..., 8)` gated by
  `Speed.Y >= MaxFall / 2` (80 px/s of 160) [S1].
- Celeste dash: 50 ms freeze, 0.2 s directional shake toward the dash, displacement ripple 8 to 64 px over 0.4 s [S1].
- Celeste death: `level.Shake()` (default length) and Light/Medium rumble [S1].
- GMTK camera essay: Celeste "shakes in the direction of Madeline's dash"; Katana Zero's hit-stop freezes the action
  "a split second" while camera shake and particles keep running; Hollow Knight's camera stalls "a long time" on a hit so
  the player registers the mistake [S5].
- Keren: the earliest camera shake he found is Mario Bros. (1983) [S2].

### Inferences
- [I] The landing dust gate in SpeedRunner (fall over 50 u) [K] fires on almost every hop. Celeste's rule (vy at least
  half of terminal) would be `vy >= 575 u/s`, roughly a 2 BL drop, which keeps dust for meaningful landings only.
- [I] Running dust in the build (1 particle per 90 ms above 260 u/s) [K] is a good proxy for a speed indicator; a second
  tier (per 45 ms above 480 u/s, i.e. post-roll overspeed) would read as "you are carrying bonus speed".
- [I] Death hit-stop: freeze the sim 50 to 80 ms, then run the 0.3 s death. Combat juice (Feel #2) has the hit-stop and
  trauma shake profiles; link rather than repeat.
- [I] "GO" flash and finish flash: a 2 frame white screen on GO and a 120 ms flash on the flag match Celeste's hair-flash
  scale. Longer flashes conflict with a timer that is already running.

### Gaps
- [G] No published particle counts for Super Meat Boy, Pizza Tower, Dustforce, N++ this session.

---

## Q4. Camera for side-view runners and precision platformers

### Takeaway
Keren's taxonomy names what SpeedRunner already does: horizontal position lock with a static forward focus (120 u, 12%
of view) and vertical platform snapping with a 60 u dead zone and a 200 ms lerp [K]. Shipped games put the forward
focus at 15 to 25% of the view, lerp both axes with a 150 to 220 ms time constant, and clamp the camera so death zones
stay off screen.

### Cited findings
- Keren's glossary [S2]: position-locking (Rally-X, Terraria); camera-window (Jump Bug, Rastan, Fez, Sonic);
  position-snapping (Shinobi); platform-snapping, camera moves vertically only on landing (Super Mario World, Rayman,
  Sonic); dual-forward-focus (SMW, Cave Story, Bonanza Bros.); static-forward-focus; projected-focus (extrapolated
  position); lerp-smoothing (Donkey Kong Country, Super Meat Boy); speedup-push-zone (SMB used a point about 25%
  off-center to accelerate the camera before Mario hit the window edge); speedup-pull-zone (Metroid); region-based
  anchors (DKC per-region behaviour); cue-focus; zoom-to-fit; manual look (Spelunky crouch/look up).
- Keren numbers [S2]: Defender focuses about 25% of screen width ahead; Bonanza Bros. switches focus at about double
  the player's speed; Geometry Wars camera moves at half the ship's speed; Rayman's vertical window is "just over the
  height of a jump"; Legend of Kage window is one tree width.
- Celeste camera [S1]: target = player position minus (160, 90) plus the room's `CameraOffset` (set by camera triggers);
  clamped to room bounds; smoothed with `1 - pow(0.01, dt)` (x8 faster during the Temple fall); the red bubble dash adds
  `48 * sign(Speed)` look-ahead (15% of the 320 px view); feather fly adds `0.2 * Speed`; killboxes clamp the camera so
  that `camera.Y <= killbox.Top - 180`, i.e. the death zone never enters the view.
- Sonic (SPG, from a search snippet of the blocked page) [S3]: look up scrolls 104 px at 2 px/step, look down 88 px at
  2 px/step, return at 2 px/step; Sonic 1 starts at once, Sonic CD waits for a second press within 16 steps.
- SMB RAM `$0723` scroll lock stops rightward scrolling (Bowser rooms, warp zones); SMB never scrolls left [S7].
- GMTK essay [S5]: DKC Tropical Freeze ignores jumps until the player lands on a higher platform, then sets a new
  baseline (platform snapping); Rayman Legends tracks vertically only in set zones; Shovel Knight levels are one screen
  tall so the camera only moves horizontally; Cave Story keeps two camera positions, one per facing; Sonic Generations
  look-ahead grows with speed up to a maximum; New Super Mario Bros. U sits right of Mario and swings left after a short
  backtrack; Hollow Knight stalls the camera on damage.

### Inferences
- [I] Widely quoted Sonic 1-3 camera window values (unverified this session because the page was blocked): horizontal
  window 16 px wide, camera x between player x minus 16 and player x; vertical on ground: camera tracks so the player
  sits at a fixed y, max 6 px/step (16 px/step at high speed); in the air a 64 px tall window (32 px above and below);
  max scroll 16 px/step. Treat as community consensus (Evidence 3) until the page is re-read.
- [I] SpeedRunner's hard horizontal lock is the Super Meat Boy / Celeste choice and right for a time attack: any lag
  hides what is ahead at 420 u/s (the view crosses in 2.3 s). The one change worth testing is a speed-based forward focus
  (Sonic Generations rule): 120 u at rest rising to about 200 u (20% of view) at overspeed, lerped with the same 200 ms
  constant so it never jitters.
- [I] Vertical: the build's 60 u climb dead zone with snap on landing is Keren's platform snapping. Celeste's killbox
  clamp (`camera.Y <= killbox.Top - 180`) suggests clamping SpeedRunner's camera so `deathY` stays at or below the bottom
  edge; the current `floorView` clamp does this for the floor only.
- [I] Camera zones (Celeste `CameraOffsetTrigger`, Rayman Legends vertical zones) are cheap to add as `[x, y, w, h,
  offsetX, offsetY]` rectangles in the map array; use them for the roof-tile maze in m4 and the m3 climbs.

### Gaps
- [G] Super Meat Boy and Hollow Knight numeric dead zones and lerp rates: no source.
- [G] Sonic Retro `SPG:Camera` full text (horizontal/vertical borders in px, scroll caps): blocked by Anubis; retry.
- [G] Celeste's `CameraOffsetTrigger` units (community says 48 px steps) are in `Level.cs`, not the published file.

---

## Q5. Audio for speed games

### Takeaway
The audio rule that matters for a restart-heavy game is continuity: Super Meat Boy's design brief was that the action,
and with it the soundtrack, never stops on death. Celeste shipped its whole FMOD project publicly, so its music states
and SFX layering are inspectable. For a no-sample WebAudio game, jsfxr is public domain and its parameter set is the
reference vocabulary.

### Cited findings
- McMillen on SMB: it was "imperative that the action never stop"; respawn "almost instantaneous"; completion screens
  and transitions are sped up so the player cannot dwell on dying [S6].
- Celeste's full FMOD Studio project (every SFX, song, parameter) was released publicly in 2018 by Power Up Audio; FMOD
  ships it as an appendix in its docs [S14][S15]. Sound design by Power Up Audio (Kevin Regamey), music by Lena Raine.
- Celeste `Player.cs` SFX hooks [S1]: `char_mad_revive` on respawn, `char_mad_climb_ledge` on climb hop; stamina rumble
  ticks every 0.2 s while climbing up, 0.8 s while still.
- jsfxr (sfxr.me, Unlicense) parameters [S8]: `wave_type`, duty and duty ramp, envelope `attack/sustain/punch/decay`,
  `base_freq`, `freq_limit`, `freq_ramp`, `freq_dramp`, vibrato strength/speed, arpeggio mod/speed, repeat speed,
  phaser offset/ramp, low-pass freq/ramp/resonance, high-pass freq/ramp, `sound_vol`. Presets: pickupCoin, laserShoot,
  explosion, powerUp, hitHurt, jump, blipSelect, synth, tone, click, random. 44100 Hz, 8 or 16 bit; `sfxr.toAudio()`
  or `toBuffer()` for WebAudio; sounds serialise to a short base58 string.
- SpeedRunner current synth voices [K]: jump 420 to 760 Hz triangle 90 ms, die sawtooth 300 to 70 Hz 300 ms, checkpoint
  880 to 1320 Hz sine 120 ms, finish arpeggio 523/659/784/1046 Hz at 80 ms spacing, land noise 80 ms, roll noise 220 ms.

### Inferences
- [I] Pitch variation: randomise base frequency by ±4% (about 0.7 semitone) per play on jump, land and footsteps; keep
  checkpoint and finish fixed so the ear learns them. This is the standard sfxr-era trick and costs one multiply.
- [I] Footstep cadence: trigger a 20 ms noise burst at each foot plant of the run cycle (the rig knows the phase), and
  drop the pitch 10% when overspeed; cadence then doubles as a speed display.
- [I] Music on restart: never restart the track on death or `R`. Hold a quiet pad in the countdown and let the beat
  re-enter at GO. SMB is the precedent in intent; the music-continuity detail is community consensus, not a quoted
  statement (Evidence 3).
- [I] Silence at the finish: the duel already stops the timer; cutting the music to a single sustained note for the
  3.7 s duel and bringing the arpeggio only on the result lets the results screen land.

### Gaps
- [G] A primary quote that SMB's music keeps playing across deaths (postmortem or Baranowsky interview): not found.
- [G] Celeste FMOD parameter names and music states: the FMOD appendix page returned empty text; needs the FMOD Studio
  project itself.
- [G] Hotline Miami and Trackmania restart audio: not researched (budget).

---

## Q6. UI motion (timers, splits, countdown, results)

### Takeaway
Split colouring follows LiveSplit's defaults: green ahead of the comparison, red behind, gold for a best segment, and
gold overrides green/red because it describes the segment, not the run. SpeedRunner's results already use green minus
and red plus [K]; adding gold per section is the missing convention.

### Cited findings
- LiveSplit Splits component shows split times and how far ahead or behind the run is against the personal best; the
  Possible Time Save component shows how much a segment could still save; Sum of Best is the sum of gold segments [S9].
- Community guides: green, red, gold are LiveSplit's default layout colours for a good split, a bad split and a best
  segment; a best segment "will always be gold whether you're ahead or behind" and says nothing about the full run [S9b].
- Super Meat Boy end-of-level: all past attempts (40+) replay at once, as a reward and a record of improvement [S6].
- Super Meat Boy speeds up completion screens and transitions so the player cannot dwell [S6].

### Inferences
- [I] Delta display rule for the HUD: show the delta for about 1.5 s after a checkpoint then fade; LiveSplit keeps it
  on screen but a running game HUD has less room. Tween the digits with a 100 ms slide, colour by sign, gold if the
  section beat the best section regardless of overall delta.
- [I] Countdown: the 3 s countdown is a restart cost (3.4 s death to control [K]). Keep the beeps but let the player skip
  or shorten it on `R` restarts (Q6 of the difficulty researcher). Visually, scale each digit from 1.4 to 1 over 150 ms
  (the same stretch grammar as the jump).
- [I] Results screen: play per-section bars in under 1 s total (SMB's "speed everything up"), stagger 60 ms per
  section, then hold. A death counter that ticks with a 120 ms white flash borrows the Celeste hair flash.
- [I] Menu-as-level (standing on the title words) [K] has precedents in SpeedRunners' lobby and Celeste's chapter-select
  mountain; no primary source consulted, keep as design note.

### Gaps
- [G] Official LiveSplit colour hex values (default layout file) not fetched.
- [G] SpeedRunners (DoubleDutch) lobby design source: not researched.

---

## Candidate technique profiles (name, one line, games, key numbers)

1. **Launch stretch and landing squash** — one-frame scale (0.6, 1.4) on jump, (1.6, 0.4) x fall-speed fraction on
   land, approach 1 at 1.75/s. Celeste [S1]. Cost: one `ctx.scale`. Feel 5, Readability 5, Run fit 5, Cheapness 5,
   Evidence 5 (source code).
2. **State colour with flash** — hair/kimono colour per movement resource, 120 ms white flash on change. Celeste
   (#AC3232 / #44B7FF / #FF6DEF) [S1][S10]. Evidence 5.
3. **Speed-gated dust** — jump 4, land 8 only when vy >= half max fall, wall slide 1 per 10 ms during the first 35% of
   the slide. Celeste [S1]. Evidence 5.
4. **After-image trail** — redraw past poses every 80 ms at falling alpha. Celeste dash [S1]; Sonic after-images [G].
   Evidence 4.
5. **Micro hit-stop on key events** — 50 ms freeze plus 200 ms directional shake. Celeste dash [S1]; Katana Zero kills
   keep particles running during the freeze [S5]. Evidence 4.
6. **Speed-driven run cycle** — frame delay 5/3/2 frames by speed tier (SMB) [S7]; phase from distance travelled (build)
   [K]. Evidence 5.
7. **Horizontal lock with static forward focus** — no lag, focus 12 to 25% of view ahead (SMB 25% push point, Defender
   25%, Celeste red dash 15%, build 12%) [S2][S1][K]. Evidence 4.
8. **Platform snapping with dead zone** — vertical camera moves on landing only, dead zone about one jump height
   (Rayman), SMW, Sonic, DKC Tropical Freeze [S2][S5]. Build: 60 u dead zone, 200 ms lerp [K]. Evidence 4.
9. **Killbox camera clamp** — camera bottom never below the death line (Celeste `killbox.Top - 180`) [S1]. Evidence 5.
10. **Camera zones** — per-region offsets (Celeste CameraOffset triggers, Rayman Legends vertical zones, DKC regions)
    [S1][S2][S5]. Evidence 4.
11. **Continuous music across deaths** — never restart the track; speed up transitions (SMB) [S6]. Evidence 3 for the
    music detail, 5 for the "action never stops" brief.
12. **Public-domain synth vocabulary** — jsfxr parameter set and presets as the design language for WebAudio SFX, ±4%
    pitch jitter [S8]. Evidence 4.
13. **LiveSplit colouring** — green ahead, red behind, gold best segment overrides [S9][S9b]. Evidence 3 (community
    guides, official component docs for semantics).
14. **All-attempts replay** — SMB plays 40+ attempts at once on level end [S6]. For SpeedRunner, a ghost pile on the
    results screen from the 30 Hz samples [K]. Evidence 5 (designer statement).
15. **Procedural secondary motion** — short lerped chains for cloth and hair, time constants 40 ms (limbs) to 200 ms
    (camera); Rain World's point-skeleton with drawn parts [S12][S13]; build's kimono spring 160/14 [K]. Evidence 3.

---

## Sources

- [S1] Celeste `Player.cs`, published MIT by Maddy Makes Games (NoelFB/Celeste repo). Raw file:
  https://raw.githubusercontent.com/NoelFB/Celeste/master/Source/Player/Player.cs ; repo and licence note:
  https://github.com/NoelFB/Celeste
- [S2] Itay Keren, "Scroll Back: The Theory and Practice of Cameras in Side-Scrollers" (GDC 2015 talk, article 2015):
  https://www.gamedeveloper.com/design/scroll-back-the-theory-and-practice-of-cameras-in-side-scrollers
- [S3] Sonic Retro, Sonic Physics Guide, Camera (blocked by Anubis this session; look up/down numbers from the search
  snippet): https://info.sonicretro.org/SPG:Camera
- [S4] Sonic Retro, SPG Animations (blocked): https://info.sonicretro.org/SPG:Animations
- [S5] GMTK, "How to make a good 2D camera": https://gmtk.substack.com/p/how-to-make-a-good-2d-camera
- [S6] Edmund McMillen, "Super Meat Boy's McMillen explains 'Why so hard?'" (Game Developer):
  https://www.gamedeveloper.com/game-platforms/-i-super-meat-boy-i-s-mcmillen-explains-why-so-hard-
- [S7] Data Crystal, Super Mario Bros. RAM map (`$070C` walk animation delay, `$0723` scroll lock):
  https://datacrystal.tcrf.net/wiki/Super_Mario_Bros./RAM_map ; disassembly: https://6502disassembly.com/nes-smb
- [S8] jsfxr (chr15m fork, Unlicense): https://github.com/chr15m/jsfxr ; web app https://sfxr.me
- [S9] LiveSplit components documentation: https://livesplit.org/components/
- [S9b] Community LiveSplit colour conventions: https://trysdyn.dreamwidth.org/3515.html and
  https://www.speedrun.com/post/58923
- [S10] Source Gaming, "Character Chronicle: Madeline": https://sourcegaming.info/2021/06/03/character-chronicle-madeline/
- [S11] TV Tropes, Celeste characters (hair colours): https://tvtropes.org/pmwiki/pmwiki.php/Characters/Celeste
- [S12] Game Developer, "Video: Animating Rain World and its many squishy, stretchy creatures" (GDC 2016 Animation
  Bootcamp, Joar Jakobsson and James Therrien):
  https://www.gamedeveloper.com/art/video-animating-i-rain-world-i-and-its-many-squishy-stretchy-creatures ; talk video
  https://www.youtube.com/watch?v=sVntwsrjNe4
- [S13] Unity blog, "Exploring procedural design in Rain World: The Watcher":
  https://unity.com/blog/exploring-procedural-design-rain-world
- [S14] Game Developer, "Celeste's audio files are now publicly available for devs":
  https://gamedeveloper.com/audio/-i-celeste-s-i-audio-files-are-now-publicly-available-for-devs
- [S15] FMOD Studio docs, Appendix A: Celeste getting started guide:
  https://www.fmod.com/docs/2.03/studio/appendix-a-celeste.html
- [K] `notes/01-current-build.md` (SpeedRunner bundle read 13 Nov 2026): https://speedrunner-tau.vercel.app/
