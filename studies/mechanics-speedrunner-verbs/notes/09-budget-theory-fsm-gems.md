# 09. Verb budgets, theory, state machines, input design, replays and gems

Scope: how many verbs a precision platformer can carry, what the designers and theorists say about limiting them, how
shipped code structures verbs (Celeste's `Player.cs` read line by line, Game Programming Patterns), how to put 6 to 10
verbs on three buttons plus a direction, how extra verb bits enter the Mechanics #1 input log, and open-source verb code
with licences. Checked 13 Nov 2026. Everything from `Player.cs` is read from the MIT source in NoelFB/Celeste (5471
lines, 60 fps, 8 px tiles, Madeline 8x11 px) [S1]. SpeedRunner facts are [K] from `01-current-build.md`. Licence and
maturity figures come from the GitHub REST API (`license.spdx_id`, stars, `pushed_at`) in `scratch-09/gh-repos.txt`.
Gems already in Mechanics #1 (`studies/mechanics-speedrunner/notes/11-gems.md`: Player.cs constants, LittleJS, Kaplay,
Phaser, livesplit-core, BizHawk `.bk2`, Loenn, Everest, LDtk, PRNGs) are not repeated; this file adds verb-specific ones.

---

## Q1. Verb budget and readability

**Takeaway.** The great precision platformers spend one to four action buttons on top of a direction, and the designers
who write about it (Crawford, Anthropy, Berbank Green, Metanet via GDC write-ups) all argue the same way: fewer verbs,
each deepened by context, hold, release and direction. Crawford's bound is explicit, "fewer than ten verbs" for the
cleanest games. Celeste's own history is the cautionary tale for adding a verb late: the crouch dash became a fourth
button in v1.4 (29 Mar 2021) only because speedrunners were already binding it with Joy2Key. No controlled experiment on
button count versus learnability was found; treat the "N buttons" argument as designer consensus, not measured data.

### Cited findings
- **Button counts** (primary sources where found, otherwise marked):
  | Game | Action buttons (plus direction) | Verbs they carry | Source |
  |---|---|---|---|
  | N++ | 1 (jump) | jump, wall jump, wall slide (direction into wall), variable jump | GDC 2016 write-up: "three buttons controlling left and right movement, and the jump" [S2] |
  | Super Meat Boy | 2 (jump, run) | jump, wall slide, wall jump, run modifier | inference from play, not fetched |
  | Celeste | 3 (jump, dash, grab) + optional Crouch Dash since 1.4 | jump, dash in 8 directions, climb, climb jump, wall jump, crouch (down), super, hyper, wavedash, demo dash | `Player.cs` Input.Jump / Input.Dash / Input.Grab [S1]; 1.4 changelog [S3] |
  | Dustforce | one aerial action per jump (double jump OR air dash), wall and ceiling run | double jump, air dash, wall run, ceiling run, light and heavy attack (buttons not confirmed by the fetched source) | Bycer 2012 analysis: "resets only when they touch ground" [S4] |
  | Neon White | 3 (jump, fire, discard) | every movement verb is a card discard: double jump, dash, grapple, fireball | Esposito interviews: discard "immediately grants a movement ability" [S5] |
  | Mario (SMB1 to SMW) | 2 to 3 (run/fire, jump, spin jump in SMW) | run, jump, duck, fireball, spin, cape glide | general knowledge, SMW disassembly listed in gems; not fetched |
  | Hollow Knight | 4 core (jump, attack, dash, focus/cast) plus dream nail, super dash, quick map | pogo, dash, double jump, wall cling, shade dash | inference, modding docs not reachable (see gaps) |
  | SpeedRunner today | 1 (jump) | run, jump, wall slide, wall jump, roll, flip | [K] |
- **Chris Crawford**: in *The Art of Interactive Design* and *Chris Crawford on Interactive Storytelling* choice is a
  selection among actions, so design starts by listing the verbs; "the cleanest, simplest, easiest-to-learn games have
  fewer than ten verbs", large strategy games several dozen [S6][S7].
- **Anna Anthropy and Naomi Clark, *A Game Design Vocabulary* (2014)**: Chapter 2 "Verbs and Objects". Objects
  complete the sentence a verb starts (Mario jumps on a Goomba). Anthropy advises against adding many new verbs and for
  deepening existing ones; Clark adds that resources (ammo, dash count) are rewards that enable verbs [S8][S9].
- **Berbank Green, "One-Button Games" (Game Developer, 2 Jun 2005)**: a single button is loaded by press, hold, release
  and held duration; the article lists 8 ways to map two actions A and B onto one button (context-sensitive, overlapping,
  eclipsing), 6 jump systems and 5 jump modifiers. Consistency beats simplicity: a toggle that changes meaning per press
  confuses without feedback [S10].
- **Daniel Cook, skill atoms (2007)**: each atom is an action, simulation, feedback loop that updates the player's model;
  atoms chain (Tetris: move and rotate before stacking). Cited through a 2020 AAAI tutorial-generation paper because the
  Lost Garden post was not fetched [S11].
- **Game Programming Patterns, "State"**: booleans per verb let impossible pairs happen, "`isJumping_` and `isDucking_`
  should never both be true"; the fix is an enum or state objects [S12].
- **Celeste 1.4.0.0 (29 Mar 2021)**: added an "Advanced: Crouch Dash" bind with two modes, "Press" (one button does the
  crouch dash) and "Hold" (held modifier plus the normal dash button); also "Advanced: Directionals" (movement-only or
  dash-only directions), Grab Mode as a toggle, pause input buffered 0.1 s, control rebinds reset on update [S3].
  Before 1.4 runners used Joy2Key for the same bind; the crouch dash was discovered by players, not designed [S13].
  Community threads say binding demo to the main dash loses dash crystals and super dashes, so most keep a separate
  button [S14][S15].
- **Metanet on N**: Sheppard says "it's your vertical velocity that determines jump height", combined with wall jumping
  [S2]; Metanet's blog notes wall jumping "used to be quite rare, invariably stiff and de-emphasized" [S16]. No Metanet
  essay saying "one button" was found; the one-button fact comes from the GDC write-up above.
- **Research**: no CHI PLAY/FDG paper measuring button count against learnability surfaced. Nearest: Rogers, Bowman and
  Oliver 2015 (motion versus push-button controllers, motion worse on mapping, performance and frustration) and a CHI
  2017 Fitts' law pilot on Steam Controller inputs [S17][S18]. Game-wisdom's design essay argues "the more buttons for
  someone to learn, the longer it takes" without data [S19].

### Inferences
- A samurai time attack with run, jump, wall kit, roll and slash already has 6 verbs on 1 button plus direction.
  Adding dash and one more (crouch-slide or grab) lands at 8 to 9 verbs on 3 buttons, inside Crawford's bound and at
  Celeste's button count.
- Celeste's lesson for a game with deterministic replays: decide the hidden-input verbs (down+dash) before the
  leaderboard opens. A late bind change splits categories or forces a season wipe.

### Gaps
- Dustforce's button layout (light/heavy attack as separate buttons) was not confirmed by the fetched source; Hitbox
  Team's blog did not surface a controls post. Super Meat Boy and Hollow Knight counts are from play, not documents.
- No measured study of button count versus enjoyment.

---

## Q2. The verb state machine in shipped code

**Takeaway.** Celeste's `Player` owns a `StateMachine(23)` with 23 numbered states; each state registers up to four
callbacks (update, coroutine, begin, end). Only four states matter for a time attack: `StNormal 0`, `StClimb 1`,
`StDash 2`, `StRedDash 5`. Verbs are not states by themselves: jump, wall jump, super and hyper are methods called from
inside a state's update, and the order of the checks inside `NormalUpdate` is the cancel table (grab, then dash, then
duck, then jump). Timers do the rest: `dashCooldownTimer`, `dashRefillCooldownTimer`, `jumpGraceTimer`, `varJumpTimer`.
Game Programming Patterns gives the three structural options: enum switch, concurrent machines (movement and equipment),
hierarchical or pushdown for "return to whatever I was doing".

### Cited findings
- **State ids** (`Player.cs` lines 140 to 162): `StNormal 0, StClimb 1, StDash 2, StSwim 3, StBoost 4, StRedDash 5,
  StHitSquash 6, StLaunch 7, StPickup 8, StDreamDash 9, StSummitLaunch 10, StDummy 11, StIntroWalk 12 ... StStarFly 19,
  StTempleFall 20, StCassetteFly 21, StAttract 22`. Constructor: `StateMachine = new StateMachine(23)` then one
  `SetCallbacks(StDash, DashUpdate, DashCoroutine, DashBegin, DashEnd)` per state [S1].
- **Dash as a state with a coroutine**: `StartDash()` sets `wasDashB = Dashes == 2`, `Dashes = max(0, Dashes - 1)`,
  returns `StDash`. `DashCoroutine` waits one frame (`yield return null`, the freeze frame), reads `lastAim`, sets
  `Speed = dir * DashSpeed` (240 px/s) but keeps the old horizontal speed if it was already higher in the same
  direction, shakes the screen 0.2 s, and if on the ground with a downward diagonal it flattens the dash and sets
  `Ducking = true` (this is the crouch dash path). Then `yield return DashTime` (0.15 s) and `DashEnd` [S1].
- **Cancels out of dash** live in `DashUpdate`: grab while dashing enters `StClimb` if a wall is there; with
  `DashDir.Y == 0`, `Input.Jump.Pressed && jumpGraceTimer > 0` calls `SuperJump()` and returns `StNormal` (the super,
  `SuperJumpH 260`; while `Ducking` it is the hyper: `Speed.X *= 1.25`, `Speed.Y *= 0.5`); with a straight-up dash, jump
  near a wall gives `SuperWallJump`; otherwise `WallJump` [S1].
- **`CanDash`** is a predicate, not a state: `Input.Dash.Pressed && dashCooldownTimer <= 0 && Dashes > 0` [S1].
- **Order of verb checks in `NormalUpdate`** (relative lines): grab/pickup/climb first, `if (CanDash) return StartDash()`
  second, duck toggles third, `if (Input.Jump.Pressed)` last with the branch `Jump()` / `ClimbJump()` /
  `SuperWallJump()` / `WallJump()` [S1]. So on the same frame, dash beats jump.
- **Climb exits** (`ClimbUpdate`): jump pressed gives `WallJump(-facing)` or `ClimbJump()` and returns `StNormal`; dash
  pressed returns `StartDash()`; releasing grab returns `StNormal`; stamina drains with `ClimbUpCost 100/2.2` per second,
  `ClimbStillCost 100/10`, `ClimbJumpCost 110/4`; tired below `ClimbTiredThreshold 20` [S1].
- **Crouch as a flag with two hitboxes**: `normalHitbox (8, 11)` and `duckHitbox (8, 6)`; `Ducking` swaps the collider
  and `CanUnDuck` tests the tall box before standing [S1].
- **Input buffering** is in Monocle's `VirtualButton` (`Input.Jump.Pressed`, `Input.Jump.ConsumeBuffer()`,
  `Input.Dash.ConsumeBuffer()`); `Input.cs` is not in the public repo (fetch returned 0 lines), so the buffer length is
  not read here [S1].
- **Game Programming Patterns**: state objects with `handleInput()` (returns the next state or null), `update()`,
  `enter()`; "have two separate state machines" for movement and equipment; hierarchical states pass unhandled input up;
  a pushdown automaton pops back to the previous state when a one-shot (firing) ends; a plain FSM "isn't even Turing
  complete" [S12].

### JS idiom for a 120 Hz step (inference, modelled on the above)

```js
// Verb frame data as a table, in physics steps (1 step = 1/120 s).
const VERB = {
  dash:  { startup: 1, active: 18, recovery: 6, cooldown: 24, uses: 1,  // 150 ms active like Celeste
           cancelInto: { jump: 'active', wallJump: 'active', slash: 'recovery' } },
  slash: { startup: 2, active: 12, recovery: 10, cooldown: 0, uses: Infinity,  // 100 ms active per #1 D4
           cancelInto: { jump: 'any', dash: 'recovery' } },
  slide: { startup: 0, active: 36, recovery: 6, cooldown: 0, uses: Infinity,
           cancelInto: { jump: 'any', dash: 'any' } },
};
// Per-verb press buffers, consumed when the verb fires (Celeste: Input.X.ConsumeBuffer()).
const buf = { jump: 0, dash: 0, slash: 0 };          // steps remaining, 130 ms = 16 steps
const S = { state: 'normal', t: 0, dashes: 1, cd: { dash: 0 }, dir: 1 };

function step(input) {                                // input is the 1-byte log entry for this step
  for (const k in buf) { if (input.pressed[k]) buf[k] = 16; else if (buf[k] > 0) buf[k]--; }
  for (const k in S.cd) if (S.cd[k] > 0) S.cd[k]--;
  const next = STATES[S.state].update(input);         // returns a state name or null, like Celeste's int return
  if (next && next !== S.state) { STATES[S.state].end?.(); S.state = next; S.t = 0; STATES[next].begin?.(input); }
  S.t++;
}

const STATES = {
  normal: { update(i) {
    if (buf.dash && S.cd.dash === 0 && S.dashes > 0) return 'dash';     // dash beats jump, same as NormalUpdate
    if (buf.slash) return 'slash';
    if (i.down && onGround() && Math.abs(P.vx) > 250) return 'slide';
    if (buf.jump && (coyote > 0 || wallMemory > 0)) { doJump(); buf.jump = 0; }
    return null; } },
  dash: {
    begin(i) { S.dashes--; S.cd.dash = VERB.dash.cooldown; S.dir = aim8(i); P.vx = 1100 * S.dir.x; P.vy = 1100 * S.dir.y; },
    update(i) {
      const v = VERB.dash, phase = S.t < v.startup ? 'startup' : S.t < v.startup + v.active ? 'active' : 'recovery';
      if (phase !== 'startup' && buf.jump && v.cancelInto.jump === 'active' && onGround()) { superJump(); buf.jump = 0; return 'normal'; }
      if (phase === 'recovery' && buf.slash) return 'slash';
      if (S.t >= v.startup + v.active + v.recovery) return 'normal';
      return null; },
    end() { P.vx = clampSpeed(P.vx, 420 * 1.6); } },        // Celeste EndDashSpeed = 2/3 DashSpeed
};
function onLand() { S.dashes = 1; stamina = MAX; }            // Celeste RefillDash()/RefillStamina() on ground
```

The table form matters for two reasons: the sandbox can edit numbers live, and the replay verifier can hash the table
with the input log so a run is bound to the frame data it was made with.

### Gaps
- Monocle's `VirtualButton` buffer time (likely 0.08 s from memory, not verified) was not read.
- Hollow Knight's `HeroControllerStates` boolean list (`dashing`, `wallSliding`, `onGround`, ...) could not be fetched;
  the hk-modding docs URL returned 404 and GitHub code search needs auth. The modding API repo itself is MIT [S20].

---

## Q3. Input design: 6 to 10 verbs on 3 buttons plus a direction

**Takeaway.** Three buttons (Jump, Dash, Action) plus a 4-way or 8-way direction cover ten verbs if four of them are
context verbs (down+jump, down+dash, air versus ground, hold versus tap). The risks are accidental verbs on a diagonal and
the Celeste problem where a direction-plus-button chord becomes a competitive advantage people want on its own button.
Touch ports of verb-rich platformers (Dead Cells by Playdigious) survive by making one verb automatic (Auto-Hit) and
offering swipe-to-dodge, floating or fixed pads and full remapping; Celeste and Hollow Knight have no phone versions.

### Cited findings
- Berbank Green's 8 loadings of two actions on one button and his warning that a context toggle without feedback is
  confusing [S10].
- Celeste 1.4: a chord (down + dash while grounded, the "crouch dash") got its own optional button with Press and Hold
  modes; "Advanced: Directionals" separates movement directions from dash directions so a stick deadzone cannot send a
  dash the wrong way; Grab can be a toggle [S3]. Runners argued about demo-on-dash costing dash crystals and supers [S14].
- Dustforce gives one aerial action per jump, either double jump or air dash, reset on landing, and reviewers reported
  inputs that "weren't going off when I wanted them to" in fast sections [S4][S21].
- Dead Cells mobile (Playdigious, iOS 2019, Android 2020): "Auto-Hit" performs melee attacks on enemies in range and the
  developers "ended up preferring it themselves"; options include Swipe to Dodge, custom controls, floating or fixed pad,
  Bluetooth controllers; forum players report some attacks cannot be avoided with Auto-Hit on [S22][S23][S24].
- Dadish (Thomas K. Young): Android Central calls its touch controls "deceptively simple" and among the easiest
  touchscreen platformer controls; App Store reviewers ask to move the left/right buttons on tall phones; a Dadish 3D
  update "removed the right joystick" for swipe camera [S25][S26].
- Celeste 1.4 added 0.1 s of input buffering to Pause, which shows the buffer-per-verb pattern reaches even menus [S3].

### Inferences (proposed mapping for SpeedRunner)
| Chord | Ground | Air | Wall |
|---|---|---|---|
| Jump tap | jump (variable) | (buffered 130 ms) | wall jump away or climb jump (hold into wall) |
| Jump + down | drop through one-way | fast fall | let go (slide) |
| Dash | ground dash (8-way or 4-way) | air dash, 1 per airtime | wall-kick dash away |
| Dash + down (ground) | crouch slide | dive | none |
| Action tap | slash (100 ms, D4) | air slash | none |
| Action hold | charge | none | none |
| Down hold | crouch | fast fall | none |

Rules that keep it readable: a verb that changes the hitbox (crouch, slide) is a hold, never a toggle; a verb that spends
a resource (dash) is a tap with a visible counter; every chord has a non-chord fallback so a 4-way d-pad or a two-thumb
touch pad can still play Any%. Celeste's history says add the dedicated bind on day one, and name the category rules
before the first season.

### Gaps
- No fetched Hollow Knight or Celeste statement about phones; both are absent from app stores as far as platform lists
  show, but that was not verified this session.

---

## Q4. Determinism and replays when verbs grow

**Takeaway.** Mechanics #1 settled a 1-byte-per-step RLE input log with 5 bits (left, right, jump held, jump pressed,
spare). Three new verbs need three new press bits, which fills the byte; a down bit for crouch and an up bit for 8-way
dash aim push it to 9 or 10 bits, so widen to 2 bytes per step or keep the RLE byte and add a second "verb byte" only on
steps where a verb bit changes. CelesteTAS already uses this shape as text: one line per run of identical input,
`frames,actions`, e.g. `123,R,J`. Resources (dash count, stamina) are not logged; they are derived state and must be
reset by the same code path at run start and on respawn, as Celeste does with `RefillDash()` and `RefillStamina()`.

### Cited findings
- **CelesteTAS `.tas` format**: a plain text file, each line a frame count followed by held actions, example `123,R,J`
  (123 frames holding Right and Jump); action letters R L U D J (jump) X (dash) G (grab) S (start) Q (quick reset) F
  (feather aim) N (journal); `***` is a breakpoint, `***10` runs at 10x; commands `Read`, `Play`, `Set`, `AutoInput`,
  `SkipInput`, `SaveAndQuitReenter`. EverestInterop repo is MIT, 85 stars, pushed Aug 2026 [S27][S28][S29].
- **BizHawk `.bk2`**: one text line per frame, pressed buttons as characters and `.` for unpressed (see #1 gems) [S30].
- **Celeste resets**: `Stamina = ClimbMaxStamina` (110) and `Dashes = MaxDashes` are set in the constructor and on
  respawn; `RefillDash()` and `RefillStamina()` fire on landing and on refill crystals; `DashRefillCooldown 0.1` s stops a
  landing refill within 100 ms of a dash [S1].
- **Celeste 1.4** reset every player's control binds to defaults on update [S3], a reminder that bind data and replay
  data must be separate: the log stores verbs, never keys.

### Inferences
- Log layout proposal: byte 0 = run length (1 to 255 steps), byte 1 = bits `L R U D Jh Jp Dp Ap` (held left, right, up,
  down; jump held; jump, dash, action pressed). A 60 s run at 120 Hz with about 400 input changes is about 800 bytes raw.
  Verification re-simulates with the same `VERB` table; store `hash(VERB table + PHYS)` in the header so a tuned sandbox
  cannot submit against the live table.
- Per-verb buffers must be simulated from the log, not from real time, so the buffer decrement lives inside `step()`.

### Gaps
- No open-source "verb frame data plus input log" verifier found for platformers; TAS tools replay but do not sign.

---

## Q5. Gems: verb implementations and references

**Takeaway.** For copyable dash and climb logic, `Player.cs` (MIT) remains the only shipped-game source. For the FSM
pattern, XState (MIT, 30458 stars) is the reference statechart library but far too large to vendor; `javascript-state-
machine` (MIT, 8746 stars) and `robot` (BSD-2, 2204 stars) are small; the pseudocode above is 60 lines and needs none of
them. For ropes and swings, Matter.js (MIT, 18625 stars) and Planck.js (MIT, 5320 stars) ship constraint chains; the
popular `verlet-js` has a non-standard licence file and is stale since 2019. Frame-data-as-JSON models come from fighting
game communities (sfx-framedata and sf6-move-data are MIT; FAT is GPL-3). Input viewers for stream overlays are GPL
(input-overlay, NohBoard), so build the in-game input display by hand.

### Cited findings (GitHub API, 13 Nov 2026)
- `statelyai/xstate` MIT, 30458 stars, pushed 13 Nov 2026 [S31]. `jakesgordon/javascript-state-machine` MIT, 8746,
  pushed Jun 2025 [S32]. `matthewp/robot` BSD-2-Clause, 2204, pushed Oct 2026 [S33].
- `EverestAPI/CelesteTAS-EverestInterop` MIT, 85, pushed Aug 2026 [S29]. `CelesteClassic/UniversalClassicTas` Zlib, 6,
  pushed Jan 2022 [S34]. `tbodt/celestetas` no licence, 1 star, 2019 [S35].
- `hk-modding/api` MIT, 347, pushed Jun 2026 (Hollow Knight Modding API) [S20]. `flibber-hk/HollowKnight.SkillUpgrades`
  LGPL-2.1, 7, pushed Feb 2026 (toggleable upgrades to the Knight's skills: a worked example of verb tweaks) [S36].
  `TheMulhima/Speedrun-Tricks-Visual-Helper` no licence, 1 star, 2021 (recolours the Knight when a verb is available) [S37].
- `msg555/dustmaker` Apache-2.0, 7, pushed May 2024 (Dustforce level files) [S38].
- `munificent/game-programming-patterns` NOASSERTION on GitHub (book text CC BY-NC-ND, code MIT per the repo; read the
  LICENSE), 4578 stars [S39].
- Frame data: `D4RKONION/FAT` GPL-3.0, 86, pushed Oct 2026 [S40]; `avivace/sfx-framedata` MIT, 8, 2023 (SFV JSON per
  move) [S41]; `4rays/sf6-move-data` MIT (per search listing, not API-checked) [S42]; `megane42/ggxrd-frames` MIT scraper
  [S42]; `fightcore/frame-data` GPL-3.0, 5, pushed Nov 2026 [S43]; `hohav/ssbm-data` MIT, 1 star [S44];
  `pfirsich/meleeDat2Json` no licence [S45]. sf6-sensei's data is CC BY-SA from SuperCombo Wiki [S42].
- Input viewers: `univrsal/input-overlay` GPL-2.0, 4286, pushed Nov 2026 (OBS plugin) [S46]; `ThoNohT/NohBoard` GPL-2.0,
  1298, Apr 2024 [S47]. `mrmcpowned/gamepadviewer` returned no repo at that path [S48].
- Rope and swing physics: `liabru/matter-js` MIT, 18625, pushed Sep 2026 (Constraint chains, "chains" example) [S49];
  `piqnt/planck.js` MIT, 5320, pushed Oct 2026 (Box2D port with RopeJoint and DistanceJoint) [S50];
  `subprotocol/verlet-js` NOASSERTION, 3792, last push Oct 2019 [S51]; `schteppe/p2.js` NOASSERTION, 2694, 2022 [S52];
  `amongfiish/RopePlatformingPrototype` (Umihara Kawase inspired, no licence, 0 stars, Jun 2025) [S53];
  `RobertoLovece/Rope-Grid` (JS Verlet rope grid, no licence, 8 stars) [S54].
- SMW disassembly: `galaxyhaxz/smw-src` no licence, 60 stars, Feb 2021; `gnaghi/SMWDisC` no licence, 24; the SMWCentral
  RAM map and `all.log` are the community references for cape and spin jump flags (not fetched) [S55][S56].
- Katana ZERO: no frame data sheet with a licence found; the speedrun.com "Moving techniques" guide gives the roll-slash
  loop as a slash 10 frames after a c-roll, next c-roll 12 frames later [S57].

### Inferences
- Nothing in this list is worth vendoring into a single-file Canvas2D game except one Verlet rope function (write it,
  about 30 lines, from the Matter.js or planck examples as reading) and the JSON shape of a frame-data table.
- GitHub search for "celeste clone", "godot 4 platformer dash" and "phaser 3 dash" returned no results in this session
  (search API rate limit hit after the first batch), so the Godot, Unity and Phaser Celeste-like controllers are a gap;
  Mechanics #1 already lists `Biebras/Unity-2D-Celeste-Game-Player-Controller` (MIT) and `bennyfrancis/Celestefall` (MIT).

### Gaps
- Hollow Knight decompiled `HeroController` constants were not read (no legal public source).
- Pendulum swing code with a licence: none found beyond the physics engines above.

---

## Candidate technique profiles seeded by this file
1. **Verb budget of 3 buttons, 8 to 9 verbs** (Crawford under ten; Celeste 3 buttons; N++ 1). Numbers: 1/2/3/3/4 buttons
   across N++, Meat Boy, Celeste, Neon White, Dustforce.
2. **Verb FSM with a frame-data table** (Celeste `StateMachine(23)`, `StDash 2`, `DashTime 0.15`, `DashCooldown 0.2`,
   dash checked before jump in `NormalUpdate`). Numbers at 120 Hz: dash 18 active steps, 24 cooldown, buffer 16 steps.
3. **Cancel windows as data** (fighting-game startup/active/recovery; Celeste super only while `DashDir.Y == 0` and
   `jumpGraceTimer > 0`; hyper from ducking with x1.25 / x0.5).
4. **Chord verbs with a dedicated bind from day one** (Celeste 1.4 Crouch Dash, Press and Hold modes, 29 Mar 2021).
5. **Two-byte RLE input log with 8 verb bits** and a hash of the verb table in the header (CelesteTAS `123,R,J` as the
   text twin).
6. **Resource reset by one code path** (`RefillDash`, `RefillStamina`, `DashRefillCooldown 0.1` s).
7. **Touch: automate one verb** (Dead Cells Auto-Hit), swipe for dash, fixed or floating pad, full remap.

---

## Final table

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| Celeste Player.cs: StateMachine, Dash, Climb, Ducking | https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs | MIT (code only, not assets) | 4002 stars, archived Oct 2022 | 23 numbered states, dash coroutine (freeze frame, 0.15 s), super/hyper cancel rules, stamina costs, duck hitbox swap | Low |
| CelesteTAS-EverestInterop | https://github.com/EverestAPI/CelesteTAS-EverestInterop | MIT | 85 stars, pushed Aug 2026 | `frames,actions` text input log, breakpoints, `Read`/`Play` commands | Low |
| UniversalClassicTas (Celeste Classic) | https://github.com/CelesteClassic/UniversalClassicTas | Zlib | 6 stars, Jan 2022 | TAS tooling for a PICO-8 Celeste, small codebase | Low |
| Hollow Knight Modding API | https://github.com/hk-modding/api | MIT | 347 stars, pushed Jun 2026 | Hooks into HeroController; reference for verb-toggle mods | Low |
| HollowKnight.SkillUpgrades | https://github.com/flibber-hk/HollowKnight.SkillUpgrades | LGPL-2.1 | 7 stars, pushed Feb 2026 | Worked example of toggleable verb tweaks (dash, double jump) | LGPL |
| Speedrun-Tricks-Visual-Helper | https://github.com/TheMulhima/Speedrun-Tricks-Visual-Helper | No LICENSE file | 1 star, 2021 | Idea: recolour the hero when a verb is available | None |
| XState | https://github.com/statelyai/xstate | MIT | 30458 stars, pushed Nov 2026 | Statechart vocabulary (hierarchical, parallel, history); too big to vendor | Low |
| javascript-state-machine | https://github.com/jakesgordon/javascript-state-machine | MIT | 8746 stars, pushed Jun 2025 | Tiny FSM with enter/leave hooks | Low |
| robot | https://github.com/matthewp/robot | BSD-2-Clause | 2204 stars, pushed Oct 2026 | Functional FSM, about 1 KB | Low |
| Game Programming Patterns, State | https://gameprogrammingpatterns.com/state.html | Text CC BY-NC-ND, code MIT (repo LICENSE) | 4578 stars | Enum vs state objects, concurrent machines, pushdown automaton | Copyleft (text) / Low (code) |
| One-Button Games (Berbank Green, 2005) | https://www.gamedeveloper.com/design/one-button-games | Article | Game Developer, 2 Jun 2005 | 8 ways to load two actions on one button, 6 jump systems | n/a |
| Celeste v1.4.0.0 changelog | https://maddymakesgamesinc.itch.io/celeste/devlog/237097/v1400-changelog | Devlog | 29 Mar 2021 | Crouch Dash bind, Press/Hold modes, Advanced Directionals, Grab toggle | n/a |
| Matter.js | https://github.com/liabru/matter-js | MIT | 18625 stars, pushed Sep 2026 | Constraint chains for rope and swing prototypes | Low |
| Planck.js | https://github.com/piqnt/planck.js | MIT | 5320 stars, pushed Oct 2026 | Box2D RopeJoint/DistanceJoint in JS | Low |
| verlet-js | https://github.com/subprotocol/verlet-js | Non-standard LICENSE (NOASSERTION) | 3792 stars, last push Oct 2019 | Reading for a 30-line Verlet rope; stale | None (read LICENSE) |
| RopePlatformingPrototype | https://github.com/amongfiish/RopePlatformingPrototype | No LICENSE file | 0 stars, Jun 2025 | Umihara Kawase style rope prototype, reading only | None |
| sfx-framedata | https://github.com/avivace/sfx-framedata | MIT | 8 stars, Jan 2023 | JSON frame data per move (startup/active/recovery) as a schema model | Low |
| sf6-move-data | https://github.com/4rays/sf6-move-data | MIT (search listing) | not API-checked | Second JSON frame data schema | Low |
| FAT (Frame Assistant Tool) | https://github.com/D4RKONION/FAT | GPL-3.0 | 86 stars, pushed Oct 2026 | Frame data app UI and data files, reading only | Copyleft |
| fightcore/frame-data | https://github.com/fightcore/frame-data | GPL-3.0 | 5 stars, pushed Nov 2026 | Melee frame data JSON/CSV | Copyleft |
| input-overlay (OBS) | https://github.com/univrsal/input-overlay | GPL-2.0 | 4286 stars, pushed Nov 2026 | Stream input display reference; do not copy | Copyleft |
| NohBoard | https://github.com/ThoNohT/NohBoard | GPL-2.0 | 1298 stars, Apr 2024 | Keyboard visualiser layouts | Copyleft |
| dustmaker | https://github.com/msg555/dustmaker | Apache-2.0 | 7 stars, May 2024 | Dustforce level file reader | Low |
| smw-src (SMW disassembly) | https://github.com/galaxyhaxz/smw-src | No LICENSE file | 60 stars, Feb 2021 | Cape and spin jump routines, reading only; pair with SMWCentral RAM map | None |
| Katana ZERO moving techniques | https://www.speedrun.com/katana_zero/guide/akw9e | Community guide | speedrun.com | Roll-slash loop timing (slash at 10 f, roll at 12 f) | n/a |

---

## Sources
1. [S1] NoelFB/Celeste `Source/Player/Player.cs`, https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs (raw copy in scratch-09/Player.cs; lines 140 to 162, 322 to 345, 3358 to 3620)
2. [S2] Thumbsticks, "GDC 2016: the secret to N++ level design", https://www.thumbsticks.com/gdc-2016-the-secret-to-nplusplus-level-design/
3. [S3] Celeste v1.4.0.0 changelog, https://maddymakesgamesinc.itch.io/celeste/devlog/237097/v1400-changelog
4. [S4] Josh Bycer, "Speed Cleaning: an analysis of Dustforce", Game Developer, 25 Feb 2012, https://www.gamedeveloper.com/design/speed-cleaning-an-analysis-of-dustforce
5. [S5] "Neon White and designing for player creativity", Game Developer, https://www.gamedeveloper.com/business/-neon-white-and-designing-for-player-creativity ; Engadget interview https://www.engadget.com/neon-white-switch-steam-ben-esposito-interview-183854914.html
6. [S6] Chris Crawford, *The Art of Interactive Design*, https://ludoscience.com/EN/ressources/bibliographie/801-The-Art-of-Interactive-Design.html
7. [S7] Chris Crawford on Interactive Storytelling, ch. "Verbs and Events", https://www.oreilly.com/library/view/chris-crawford-on/9780133119671/ch16.html
8. [S8] Anthropy and Clark, *A Game Design Vocabulary*, ch. 2 "Verbs and Objects", https://www.oreilly.com/library/view/a-game-design/9780133155181/ch02.html
9. [S9] First Person Scholar review of *A Game Design Vocabulary*, https://www.firstpersonscholar.com/?p=2351
10. [S10] Berbank Green, "One-Button Games", Game Developer, 2 Jun 2005, https://www.gamedeveloper.com/design/one-button-games
11. [S11] AAAI 2020 paper citing Cook's skill atoms, https://cdn.aaai.org/ojs/13040/13040-52-16557-1-2-20201228.pdf ; original Lost Garden post not fetched
12. [S12] Robert Nystrom, Game Programming Patterns, "State", https://gameprogrammingpatterns.com/state.html
13. [S13] Vice, "How Celeste found success in embracing speedrunners who broke the game", https://broadly.vice.com/en/article/88a755/how-celeste-found-success-in-embracing-speedrunners-who-broke-the-game
14. [S14] speedrun.com Celeste forum, "Is binding a demo button to be your main dash allowed?", https://speedrun.com/celeste/forums/wl3tl
15. [S15] speedrun.com Celeste guide, "Celeste 1.4 Binding Changes Explanation", https://www.speedrun.com/celeste/guides/02hpu (403 on fetch; title and summary from search)
16. [S16] Metanet Software blog, "happy 15th metanet software inc", https://www.metanetsoftware.com/2019/happy-15th-metanet-software-inc
17. [S17] Rogers, Bowman and Oliver 2015, motion vs push-button controllers, via https://core.ac.uk/works/40319828
18. [S18] CHI 2017 Fitts' law on Steam Controller inputs, https://www.csit.carleton.ca/~rteather/pdfs/CHI2017_fitts_game_controllers.pdf
19. [S19] Game Wisdom, "The Complexity of Simplified Control Scheme Design", https://game-wisdom.com/?p=6141
20. [S20] https://github.com/hk-modding/api
21. [S21] Siliconera, "Dustforce: a game that's begging to be mastered", https://www.siliconera.com/dustforce-game-thats-begging-mastered/
22. [S22] NME, Dead Cells mobile review, https://www.nme.com/reviews/dead-cells-review-a-good-mobile-port-of-an-excellent-roguelike-game-2699135
23. [S23] Playdigious, "Sharpen your thumbs: Dead Cells is now slaying foes on Android", https://playdigious.com/sharpen-your-thumbs-dead-cells-is-now-slaying-foes-on-android
24. [S24] TouchArcade forum thread on Dead Cells mobile, https://toucharcade.com/community/threads/dead-cells-by-motion-twin-playdigious.400252/
25. [S25] Android Central, "Dadish 2 is a tasty platformer...", https://www.androidcentral.com/dadish-2-android-game-week
26. [S26] App Store, Dadish, https://apps.apple.com/us/app/id1482353224
27. [S27] TASVideos, CelesteTAS emulator resources, https://tasvideos.org/EmulatorResources/CelesteTAS
28. [S28] clementgallet/CelesteTAS README (action letters), https://github.com/clementgallet/CelesteTAS
29. [S29] https://github.com/EverestAPI/CelesteTAS-EverestInterop and Docs/Commands.md
30. [S30] TASVideos BK2 format, https://tasvideos.org/Bizhawk/BK2Format
31. [S31] https://github.com/statelyai/xstate
32. [S32] https://github.com/jakesgordon/javascript-state-machine
33. [S33] https://github.com/matthewp/robot
34. [S34] https://github.com/CelesteClassic/UniversalClassicTas
35. [S35] https://github.com/tbodt/celestetas
36. [S36] https://github.com/flibber-hk/HollowKnight.SkillUpgrades
37. [S37] https://github.com/TheMulhima/Speedrun-Tricks-Visual-Helper
38. [S38] https://github.com/msg555/dustmaker
39. [S39] https://github.com/munificent/game-programming-patterns
40. [S40] https://github.com/D4RKONION/FAT
41. [S41] https://github.com/avivace/sfx-framedata
42. [S42] https://github.com/4rays/sf6-move-data ; https://github.com/megane42/ggxrd-frames ; https://sf6-sensei.pages.dev/en/licenses
43. [S43] https://github.com/fightcore/frame-data
44. [S44] https://github.com/hohav/ssbm-data
45. [S45] https://github.com/pfirsich/meleeDat2Json
46. [S46] https://github.com/univrsal/input-overlay
47. [S47] https://github.com/ThoNohT/NohBoard
48. [S48] https://github.com/mrmcpowned/gamepadviewer (no repo at this path on 13 Nov 2026)
49. [S49] https://github.com/liabru/matter-js
50. [S50] https://github.com/piqnt/planck.js
51. [S51] https://github.com/subprotocol/verlet-js
52. [S52] https://github.com/schteppe/p2.js
53. [S53] https://github.com/amongfiish/RopePlatformingPrototype
54. [S54] https://github.com/RobertoLovece/Rope-Grid
55. [S55] https://github.com/galaxyhaxz/smw-src ; https://github.com/gnaghi/SMWDisC
56. [S56] SMWCentral RAM map, https://www.smwcentral.net/?p=memorymap&game=smw&region=ram (not fetched)
57. [S57] speedrun.com Katana ZERO guide "Moving techniques in the game", https://www.speedrun.com/katana_zero/guide/akw9e
58. [S58] Maddy Thorson, "Celeste & TowerFall Physics", http://maddymakesgames.com/articles/celeste_and_towerfall_physics/ (redirect confirmed, not fetched)
