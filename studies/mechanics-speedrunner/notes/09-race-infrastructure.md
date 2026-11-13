# 09. Race infrastructure: timers, splits, ghosts, replays, determinism, validation

Research agent 09, 13 Nov 2026. Scope: the plumbing of a time-attack game with an online board, for a hand-written
Canvas2D JS game with a 1/120 s fixed step, a Vercel function and localStorage. Agent 08 covers the social design.
Tags: [K] Kingsfoil fact from 01-current-build.md, [C] cited this session, [R] recalled from training and not
fetched this session (treat as a lead, verify before publishing), [I] inference.

Budget note: about 30 tool calls. Several requested details (Geometry Dash incidents, Steam leaderboard trust model,
Super Meat Boy and Celeste restart frame counts, Trackmania restart countdown, Ably and PartyKit tiers, LiveSplit
timer precision) were not reached and are listed as gaps rather than guessed.

---

## Q1. Timing: RTA, IGT, load-removed, and what a web game should store

### Takeaway
Store the run as an integer step count, display it as milliseconds. With `DT = 1/120` a run of N steps is
`N * 1000 / 120` ms (8.333 ms per step), so the displayed time is frame-rate independent by construction and the
stored value is exact. This is the in-game time (IGT) model; RTA is irrelevant to a browser game that controls its
own clock, and load removal is unnecessary because there is nothing to load mid-run. Keep `game.time += DT` for
movers, but derive the timer from the step counter, not from the float accumulator.

### Cited findings
- speedrun.com has no site-wide definition; terms are set per game. Community guides describe them as: RTA is start
  to finish with no pausing; load-removed time (LRT) is "run time minus all the loading screens"; IGT is either the
  game's own timer or a timing program that stops during loads. Several game boards default to RTA even when a load
  remover exists, because load times "vary dramatically based on hardware". [C] (S1, S2, S3)
- Celeste: the community rules page lists "IGT (In-Game Time) as shown on the file select screen" as the timing
  method; dashes, crystals and bounces "freeze the stage and the in-game timer for several frames", so IGT and RTA
  optimisation differ. The TAS submission notes loads happen outside levels where IGT is paused. The "Speedrun Clock"
  option has modes Off / Chapter / File; TAS runs must use File because it "allows to skip level completion
  animations". [C] (S4, S5)
- Celeste stores time as a 64-bit count of 100 ns ticks (`<Time>864000000000</Time>` = 24:00:00.000; divide by
  10,000 for ms). [C] (S6) A 61 fps bug thread confirms a build running at 61 fps "doesnt affect IGT" but changes
  physics feel, which is consistent with the timer advancing per fixed frame rather than per wall-clock second. [C] (S7)
- Trackmania: community posts state all versions run a 100 Hz physics tick (10 ms). One commenter claims modern TM
  interpolates the finish to the thousandth; this is a user claim, not a Nadeo statement. Replays store inputs, not
  positions, and the engine is described as deterministic. [C] (S8, S9)
- LiveSplit split files are XML; the PB sits in `SplitTime name="Personal Best"` under each `Segment`; attempt
  history and per-segment history are stored separately (livesplit-core). [C] (S10, S11)

### Inferences
- [I] Display two decimals during the run (the eye cannot read the third digit at 60 fps) and three on the results
  screen and the board, where ties matter. Store the integer step count plus the DT it was recorded with
  (`{steps: 2941, dt: 120}`), so a future 240 Hz step would not corrupt old times.
- [I] Summing a float `1/120` 7,200 times drifts by about 1e-12 s, harmless for display but the integer is the
  canonical value and the one to compare and sort on the server.
- [I] Mid-run freezes (hitstop from Feel #2 if ever added) must not advance the step counter if they should not count,
  as Celeste does; decide this rule before adding any freeze.

### Gaps
- LiveSplit's timer resolution and the auto-splitter (ASL) model were not fetched. [R] ASL scripts read process memory
  in `start`, `split`, `reset`, `isLoading`, `gameTime` blocks; LiveSplit shows hundredths by default. Verify at
  https://github.com/LiveSplit/LiveSplit.AutoSplitters .
- Super Meat Boy and Neon White timer internals: not found this session.
- Whether Trackmania times are 10 ms multiples or interpolated: only community claims. (S8)

---

## Q2. Splits and segments

### Takeaway
Copy the LiveSplit data model and its colour semantics, which the whole speedrun audience already reads: PB splits,
golds (best segment), sum of best, and a four-way delta colour (ahead/behind x gaining/losing) plus a gold flash when a
segment beats its best. SpeedRunner already has per-section times vs best; it is missing golds, sum of best, and the
"losing time while still ahead" shade.

### Cited findings
- Gold split and sum of best, from a speedrun.com guide: the gold is "the best time you ever got on a section" and the
  sum of bests is the total of all golds. [C] (S12)
- .lss structure: XML, `Segments > Segment > SplitTimes > SplitTime name="Personal Best"`, `BestSegmentTime`,
  `SegmentHistory`; livesplit-core keeps `AttemptHistory` at run level ("does not store the actual segment times")
  and segment times inside each segment. Parsers read PersonalBest, BestSegment, PercentRunsPassed. [C] (S10, S11, S13)
- livesplit-core default colours (HSLA in source, converted to RGB): best segment gold (255,213,0); ahead gaining
  (0,204,54); ahead losing (97,209,127); behind gaining (209,97,97); behind losing (204,0,0); personal best
  (20,165,255); not running (171,171,171); paused (122,122,122). Doc comments: ahead gaining means ahead "and gaining
  even more time"; behind losing means behind "and losing even more time". [C] (S14)
- Trackmania checkpoint deltas: the Openplanet "Checkpoint Times" plugin exists and stores its own JSON (not GBX
  data); gbx-ts exposes `getCheckpointTimes(ghost)`, so checkpoint times are part of a ghost record. [C] (S15, S16)
- SpeedRunner today: 4 checkpoints per map, `splits[i]` in ms, delta vs `pbSplits`, results list per-section delta
  (green minus, red plus). [K]

### Inferences
- [I] Minimal data model per map (localStorage key `sr_splits_<map>_<mapHash>`):
  ```
  { v: 1, mapHash, dt: 120,
    pb:    { steps: 2941, cps: [412, 980, 1610, 2300] },   // cumulative step at each checkpoint, then finish
    golds: [412, 560, 620, 690, 641],                      // best segment per section (5 sections)
    hist:  [ { t: 1731500000, steps: 3010, cps: [...] }, ... ]   // last 50 attempts that finished
  }
  ```
  Sum of best = `golds.reduce(+)`. Comparisons: PB (cumulative `pb.cps`), best segments (cumulative sum of golds),
  average (mean of `hist[].cps`). About 1 KB for 50 attempts.
- [I] On a checkpoint: delta = `cum - comparison[i]`; sign gives ahead/behind; `seg - lastSeg` vs comparison segment
  gives gaining/losing; if `seg < golds[i]` flash gold and update the gold even on a run that later dies (LiveSplit
  updates golds on every completed segment, not only on finished runs).
- [I] Deaths-only runs still produce segment data for the sections they completed; this is the cheapest telemetry
  SpeedRunner can add (section death rate = attempts that entered a section minus attempts that left it).

### Gaps
- LiveSplit's exact rules for when a gold is recorded on a reset run were not fetched.
- Mirror's Edge and Trials split display: not reached.

---

## Q3. Ghost recording: formats, sampling, bytes

### Takeaway
SpeedRunner's 100 KB per minute (30 Hz x 18 floats as JSON) is 15 to 100 times heavier than shipped formats. Two
cheaper designs: (a) record inputs per physics step and re-simulate (Trackmania, Mario Kart Wii, Dustforce): about
0.5 to 3 KB per minute; (b) sample position and a pose state (not pose angles) at 10 to 15 Hz in a packed binary
buffer: 4 to 8 KB per minute raw, 3 to 5 KB gzipped. Record the pose by re-running the rig, not by storing angles.

### Cited findings
- Mario Kart Wii RKG ghost: header 0x88 (136) bytes, input section padded to 0x2774 (10,100) bytes, CRC-32, total
  10,240 bytes (0x2800). Inputs are three run-length streams of 2-byte entries (state byte + duration in frames):
  face buttons, direction (nibbles, 0xE forward / 0x7 neutral / 0x0 back), tricks (12-bit duration). Finish time is
  7-bit minutes, 7-bit seconds, 10-bit ms; up to 5 lap splits in the same layout. Online and staff ghosts are Yaz1
  compressed; saves are not. [C] (S17) A 2 to 3 minute race therefore fits in 10 KB of inputs.
- Dustforce (dustmaker schema): 11 per-frame intent streams: X, Y, JUMP, DASH, FALL at 2 bits each, LIGHT, HEAVY,
  TAUNT at 4 bits, plus 16-bit mouse X/Y and an 8-bit mouse state in version 4. Streams "may have length smaller than
  the number of frames". Entity desync data is stored "every 8 frames", positions at 0.1 px, speeds at 0.01 px/s.
  [C] (S18) So Dustforce ships an input replay plus a sparse state track for drift correction.
- Trackmania: replays store "a list of inputs and their timestamps"; steering is a raw value mapped to
  [-65536, 65536]; physics at 100 updates per second; a tool injects the inputs into the live game and in-game
  Validate confirms the result matches the ghost. [C] (S9) GBX.NET's ghost class carries position, rotation,
  velocity and speed samples plus checkpoint times. [C] (S16)
- Celeste and Super Mario Maker have no ghost feature (task premise; no source consulted). TASVideos hosts Celeste TAS
  input files as user files (frame-indexed text). [C] (S5)
- SpeedRunner: 30 Hz, 18 numbers (x, y, facing, rotation, pivot, scale x/y, flap, 10 pose angles), rounded to 0.1 u or
  0.01 rad, JSON in localStorage, about 100 KB for a 60 s run. Pose angles are produced by a procedural rig blending
  toward a target pose with `1 - exp(-26 dt)`. [K]

### Inferences (byte budgets for a 60 s run, 7,200 physics steps)
| Method | What is stored | Raw | After deflate (estimate) | Survives a physics patch |
|---|---|---|---|---|
| A. Current | 1,800 samples x 18 floats as JSON | ~100 KB [K] | ~25 KB [I] | yes |
| B. Packed state, 30 Hz | per sample: dx, dy zigzag varints (14 u max per sample = 140 units at 0.1 u = 2 bytes each), 1 byte state enum, 1 byte run phase, 1 byte flags (facing, flap bucket) | 1,800 x 7 = 12.6 KB | 6 to 8 KB | yes |
| C. Packed state, 10 Hz | same, interpolated on draw | 600 x 7 = 4.2 KB | 2.5 to 3.5 KB | yes |
| D. Input RLE | (state: left/right/jump 3 bits in a byte, duration in steps as varint) per change; a human changes input 2 to 5 times a second | 300 events x 3 B = 0.9 KB | 0.6 to 0.8 KB | no (needs exact physics + map hash) |
| E. Input bitmap | 3 bits per step, bit-packed | 2.7 KB | 0.3 to 0.6 KB (long runs) | no |
- [I] The rig takes (state, vx, vy, phase, onWall, rolling) and produces the 10 angles. If the ghost player feeds the
  rig the recorded state at the recorded speed, the ghost poses itself for free and the recording drops from 18 floats
  to 2 positions plus 3 bytes. The kimono spring and the exp blend run live on the ghost too, so they match.
- [I] Sampling rate: the hero crosses 970 u in 2.3 s at top speed, and the eye reads the ghost at 10 % alpha; 10 Hz
  with linear interpolation gives at most 42 u (0.9 BL) between samples at 420 u/s. 15 Hz halves that. A jump apex is
  332 ms wide, so 10 Hz catches it within 50 ms. Store 15 Hz for the duel (37.5 % alpha, close-up), 10 Hz is enough
  for the race ghost.
- [I] Best design: store inputs (D) as the source of truth, because they are tiny, validate, and can be shared in a
  URL; derive a position track (C) from them once, on the client or the server, so the shadow keeps working after a
  physics patch and old seasons stay playable. Dustforce's "desync data every 8 frames" is the same idea.

### Gaps
- Mario Kart 8 / World ghost sizes, Trials and Mirror's Edge ghost formats: not reached.
- Dustforce byte layout and compression (dustmaker source only shows the schema). (S18)
- Trackmania ghost sample period (often quoted as 100 ms) was not confirmed by any source found.

---

## Q4. Determinism and replays

### Takeaway
A fixed-step JS simulation is deterministic across browsers if it avoids transcendental Math functions in the
simulation path, seeds its own RNG, reads inputs once per step, and iterates objects in a fixed order. Basic IEEE-754
arithmetic (+ - * / sqrt) is bit-exact across engines; `Math.sin/cos/exp/pow` are not. SpeedRunner's wheels and
moving platforms are the risk: if their positions come from `Math.sin(game.time * w)`, a replay can diverge on
Firefox vs Chrome. Fix with a self-implemented sin or by quantising mover positions after the call.

### Cited findings
- ECMAScript does not require correctly rounded `Math.sin`, `cos`, `log`, so engines differ; "Math.sqrt is exactly
  specified by IEEE-754 and agrees across engines". [C] (S19, S20)
- A real divergence report: a per-step integrator using `Math.sin/Math.cos` diverged between Node 20 and a newer
  Chrome, both V8; the author expects a wider gap across SpiderMonkey and JavaScriptCore. [C] (S20)
- The `trigfills` package exists because "differences in trig function output between Firefox and Chrome caused
  simulations to run differently"; refilling trig fixed it. [C] (S21)
- Mozilla's intent to use fdlibm for `Math.cos/sin/tan` cites fingerprinting and notes Chromium/V8 uses fdlibm. [C] (S22)
- Rapier's docs: the WASM build is "fully cross-platform deterministic" but warns that `Math.sin, Math.cos` are not
  cross-platform deterministic. [C] (S23)
- Trackmania: deterministic physics, replays are inputs, in-game Validate re-runs them; the 2021 investigation relied
  on this to inject inputs and compare. [C] (S9) The Revalidate project runs TM2020 and TM2 replay validation through
  a dedicated-server command inside Docker; TMUF and Turbo need the GUI client under a fake X server. [C] (S24)
- A replay-verification guide: legitimate runs fail when "your simulation is not deterministic"; fix with a fixed
  timestep and record inputs, not outcomes, so a divergence "clearly indicates tampering". [C] (S25)
- SpeedRunner: fixed `DT = 1/120`, accumulator, frame delta clamped to 0.1 s, movers and wheels driven by run time,
  `jumpPressed` one-shot consumed by the next step, 6-iteration AABB resolve, hero 20x46 u. [K]

### Inferences: what breaks determinism in this game, ranked
1. [I] `Math.sin/cos` in mover and wheel positions. Replace with a deterministic sin (polynomial or a 4,096-entry
   table with linear interpolation, built with `Math.fround`), or round the result to 1/256 u. The rig's
   `exp(-26 dt)` is render-only and can stay.
2. [I] Input timing. The replay must record the step index at which each key state changed, and the live game must
   apply key changes at step boundaries only (sample `keys` once at the top of `step()`). The `jumpPressed` one-shot
   is already step-aligned. [K]
3. [I] `Math.random` anywhere in the sim (dust is render-only, fine; any gameplay randomness needs a seeded
   mulberry32/xorshift128 seeded per run and stored with the replay).
4. [I] Object iteration order: arrays are fine; `Map`/`Set` preserve insertion order in JS, so they are fine too as
   long as insertion order is itself deterministic (no async loading into the sim).
5. [I] Wall-clock leaks: `performance.now()` or `Date.now()` inside `step()`, or any logic keyed to the render frame
   (interpolation alpha) instead of the step.
6. [I] Float accumulation in `game.time += DT`: harmless for replays if both sides do it identically, but use the
   integer step count for mover phase (`steps / 120`) so a 10-minute idle does not drift movers.
- [I] Test: record 20 runs (inputs) and a per-step hash of `(x, y, vx, vy, state)`; replay them headless in Node
  (same `step()` function, no canvas), then in Chrome, Firefox and Safari via a hidden page; fail CI if any hash
  differs. Cost: one afternoon, and it doubles as the server validator.
- [I] Level-time-driven movers (already done [K]) are the right pattern; never let a mover depend on when the player
  arrived.

### Gaps
- Whether Firefox shipped fdlibm for sin/cos (the intent is dated; the outcome was not confirmed). (S22)
- TASVideos .fm2 and Celeste Studio TAS text formats were not fetched. [R] Celeste TAS lines are `frames,inputs`
  (e.g. `15,R,J`); fm2 is one line per frame with a button bitmap. Verify at https://tasvideos.org/EmulatorResources/Fceux/FM2 .

---

## Q5. Leaderboard validation and anti-cheat on the web

### Takeaway
Nothing a browser sends can be trusted, so the only strong check is server-side re-simulation of the submitted inputs
with the same `step()` code, which the deterministic design in Q4 makes possible and cheap (7,200 steps of AABB
physics is milliseconds of Node CPU). Everything else (run ids, token binding, plausibility bounds, rate limits) is
cheap and worth doing, but only raises the effort for a cheater who can already open devtools and type
`__sr.PHYS.maxRun = 2000`.

### Cited findings
- Neon White, June 2022: within days of launch "every ranking at the top of the leaderboards" held 0.06 s times;
  the developer declined to detail the fix; players built community-adjusted rankings. Steam forum posts asked for
  server-side validation; one user claimed a "Banned from leaderboards" message exists (unconfirmed). [C] (S26, S27)
- Trackmania, 2021: donadigo and Wirtual analysed 19,977 United and about 5,700 Nations replays from TMX (records
  since 2003, footage 2011 to 2020, newest run 7 Dec 2020). TMX requires a replay file, "No live video", so the
  evidence was the stored inputs: steering "spikes per second" (threshold 2,000 of a 65,536 range) averaged 2.9 to
  3.0 for the population and 9 to 19 for the accused; the only reproduction was slowdown software. Seven players were
  named by the authors. The Competition Patch records metadata to detect input injection and speed changes and is
  required for Campaign and Classic boards. [C] (S9, S28)
- Official Trackmania validation is thin: TM2 validates "only Top 10 records", "evaluated in the morning", invalid
  records removed automatically; Turbo validates only the per-platform WR; TMUF boards use no replay validation;
  TM2020 uses an internal flagging system that "probably uses replay validation". Validation of TM2020 and TM2 replays
  is available as a dedicated-server command. [C] (S24)
- An academic framework (Tracer, 2025) proposes detecting fraudulent speedruns from replays. [C] (S29)
- SpeedRunner today: start/submit handshake with a server run id, `ms > 6000 && game.validSteps`, name claimed by a
  random 16-byte device token, `window.__sr` exposes `PHYS`, `P`, `game`, `tick`, `step`, `startRun`, `MAPS`. [K]

### Inferences: defence layers ranked by cost
| Layer | Cost | Stops |
|---|---|---|
| 1. Run id issued at start, submit must quote it, id expires after 30 min, one submit per id | already built [K] | replayed POSTs, fabricated submits |
| 2. Server-side bounds: `steps >= floor(mapWidth / maxRun * 120)`, each checkpoint segment above a per-map minimum, monotonic checkpoints, `wall-clock(submit - start) >= run time - 2 s` | 1 hour | devtools `maxRun` edits, teleports, pasted old runs |
| 3. Strip `window.__sr` from production (keep behind `?debug` with a build flag) | 10 min | copy-paste cheats from forum posts |
| 4. Sign the device token into a server-side HMAC session so names cannot be stolen by editing localStorage | 1 hour | impersonation, not time cheats |
| 5. Rate limit submits per token and per IP (Vercel firewall rules apply per request) | 30 min | spam |
| 6. Submit the input replay (0.6 to 3 KB) and re-simulate on the server with the same `step()`; reject if the finish step differs from the claimed time or the hero does not reach the flag | 1 to 2 days including Q4 determinism work | every client-side physics or speed hack; leaves only input-level cheats (TAS, slowdown) |
| 7. Slowdown detection: compare wall-clock run duration (server start to submit) with simulated duration; flag ratio above 1.05 for review | 1 hour after layer 6 | Cheat Engine style slowdown, the Trackmania 2021 class |
| 8. Input statistics (changes per second, frame-perfect patterns) as a review flag, not an auto-ban | later | TAS-assisted submits |
- [I] Localstorage editing cannot be prevented; treat local PBs and ghosts as personal, and the server copy as truth.
- [I] Layers 1 to 5 are a day. Layer 6 is the one that changes the game and also gives free ghosts and share links.

### Gaps
- Geometry Dash leaderboard history (disabled top board, 2.2 changes) and Steam leaderboard trust model: not reached.
  [R] Steamworks `UploadLeaderboardScore` is a client call with no server validation; verify at
  https://partner.steamgames.com/doc/features/leaderboards .
- Mario Kart ghost validation and speedrun.com verifier workflow: not reached.
- PC Gamer / Kotaku article dates for the Trackmania investigation were not fetched; the 2021 date is from coverage,
  the primary document gives Dec 2020 as its newest data point. (S9, S28)

---

## Q6. Instant restart engineering

### Takeaway
SpeedRunner's death-to-control is about 3.4 s (0.38 s dead + 3 s countdown) [K], against a target under 100 ms.
Drop the countdown on restart and on death, start the timer on the first movement or jump input (the Trackmania start
block model, where the clock runs when the car leaves the block), and reset state in place with no reload. The
countdown can survive as a one-time ceremony when a map is first opened in a session.

### Cited findings
- N++ is listed among games where the player "respawned (or has the option to respawn) immediately following death".
  [C] (S30)
- Players describe wanting "celeste-like fast respawn" in contrast to games where "you have to wait for like
  1 second before trying again". [C] (S31)
- Trackmania bug report: restarting with Enter "before reaching the first checkpoint" placed the player at the finish
  block, which incidentally confirms that Enter restarts in place without a menu. [C] (S32)
- SpeedRunner: dead for 0.38 s, 22 dust particles, whole map restarts with a 3 s countdown; `R` restarts and also
  goes through the countdown. [K]

### Inferences
- [I] Engineering budget: re-initialising a map from its static `MAPS` array (a few hundred AABBs), resetting the
  hero struct, clearing particle arrays by setting `length = 0` (pool), and resetting `steps = 0` is microseconds;
  the only real costs are allocations and GC, so keep the arrays and never `fetch` or rebuild DOM on restart. Death to
  control can be the 0.38 s death beat alone, or less: make the 0.38 s skippable by any input (Hotline Miami style
  "press R to restart now").
- [I] Timer start on first input removes the need for a countdown and makes "waiting at the start" cost nothing,
  which matters when a mover's phase matters (wheels in m4 have 3.6 to 4.2 s periods [K]). With level-time-driven
  movers that run from the restart moment, a player could wait for a favourable phase. Either start mover time at
  first input too (then there is nothing to wait for) or accept the wait as a skill.
- [I] Restart key: tap `R`, no hold, no confirm. A run is at least 16 s and a mistaken tap costs under a second with
  instant restart; a hold-to-restart (300 ms) protects long runs only. Keep `Esc` for pause and never bind restart
  next to movement keys on a phone build.
- [I] Audio: keep the WebAudio context alive across restarts; the countdown beeps become a single short "set" tick on
  first input.

### Gaps
- Measured death-to-control for Super Meat Boy, Celeste (death animation plus room reload), Trackmania 2020 restart
  (whether a 3-2-1 plays after Delete in solo), Hotline Miami, Katana ZERO: none found this session. Measure from
  video frame counts if the report needs them.
- "Timer starts on first input" as a Super Mario Maker community rule: not verified.

---

## Q7. Online race plumbing for friends

### Takeaway
A live ghost race is one-way state broadcast with no interaction, so there is no rollback problem and latency of
100 to 300 ms is invisible if the remote ghost is drawn with a 100 ms interpolation buffer. Payload is tiny: at
10 Hz a racer sends about 60 bytes per second in binary (600 to 1,200 bytes per second as JSON). Vercel Functions
now serve WebSockets natively (public beta June 2026, GA reported Oct 2026), but connections are pinned to one
instance and die at the function's max duration, so a 2-player room still needs a shared store or a room service.
For five friends the cheapest paths are a Cloudflare Durable Object (free tier covers thousands of races a day) or
Supabase Realtime broadcast (200 concurrent connections free). WebRTC via PeerJS costs nothing but needs TURN for
some NATs.

### Cited findings
- Vercel docs (last updated 2026-08-10): "WebSockets are available on all plans"; "A single WebSocket connection is
  pinned to one Vercel Function instance"; connections "close when a Vercel Function reaches its maximum duration";
  state must live in an external store (Redis from the marketplace); requires Fluid compute (default for projects
  created on or after 23 Apr 2025); billed as function duration plus data transfer. [C] (S33) Public beta announced
  22 Jun 2026; a Vercel community weekly for 16 to 23 Oct 2026 lists "WebSocket Support Goes GA"; a third-party test
  saw a 5-minute default cap closing at about 5:10 with no clean close frame. [C] (S34, S35)
- Rivet's changelog (17 Oct 2025) states Vercel Functions had not supported WebSockets until then. [C] (S36)
- Cloudflare Durable Objects pricing (page dated 13 Nov 2026): free plan 100,000 requests/day, 13,000 GB-s/day,
  5 GB SQLite storage; paid plan $5/month minimum with 1M requests and 400,000 GB-s included, then $0.15 per million
  requests and $12.50 per million GB-s. Incoming WebSocket messages bill at 20:1 (100 messages = 5 requests);
  outgoing messages and pings are free; hibernating idle objects are not billed for duration. [C] (S37)
- Supabase Realtime limits (official): free 200 concurrent connections and 100 messages per second; Pro 500
  connections and 500 messages/s; third-party guides add a 2M messages/month free quota (unverified against the
  official page). [C] (S38, S39)
- Ably Pro is listed at $399/month (vendor comparison page). [C] (S40)

### Inferences
- [I] Payload per racer: `{step uint32, x int16 (0.1 u), y int16, state u8, phase u8}` = 10 bytes at 10 Hz = 100 B/s;
  at 30 Hz 300 B/s. A 60 s two-player race moves about 12 KB each way at 10 Hz. On Durable Objects that is 600
  incoming messages per racer per minute, billed as 30 requests, so the free 100,000 requests/day covers roughly
  3,000 two-player races a day; well beyond five friends.
- [I] Polling a Vercel function at 10 Hz is the wrong tool (600 invocations per racer per minute, 100 to 300 ms
  stale), but polling at 1 Hz with the full input delta since the last poll is acceptable for an "asynchronous live"
  race where both players see each other's ghost a second behind. Since the ghost is non-interactive, a 1 s delay is
  tolerable, and inputs are so small that the per-poll payload is under 100 bytes.
- [I] Fairest friend race: both clients download the same seed and start on a server timestamp, each sends its input
  stream; the receiver re-simulates the friend's inputs locally (Q4 determinism) and draws the ghost. No positions
  travel at all, and the race result is verified for free.
- [I] WebRTC DataChannel (PeerJS, free public signalling server) gives the lowest latency and no server bill, but
  roughly 10 to 20 % of home NAT pairs need a TURN relay, which is paid; fine for friends who can retry.

### Gaps
- PartyKit (now part of Cloudflare) and Ably free tiers were not found this session. [R] Ably free: 6M messages per
  month and 200 concurrent channels/connections; verify at https://ably.com/pricing .
- Vercel GA date and the Hobby plan's max duration for WebSockets were not confirmed from Vercel's own changelog.
- PeerJS public server limits: not reached.

---

## Q8. Storage, seasons and share links

### Takeaway
Key every board, split file and ghost by a content hash of the things that change times: the map's solid list,
checkpoints, finish, and the `PHYS` constants. Position ghosts survive a physics patch and stay drawable; input
replays do not, so store inputs as the canonical compact record and derive positions. A 60 s input replay deflates to
under 1 KB and fits a share URL after base64url with room to spare under the 2,000-character practical limit.

### Cited findings
- Trackmania replay and ghost files carry the map reference in the Gbx header; GBX.NET can extract ghosts from
  replays and validation "needs a known map" (Revalidate). [C] (S16, S24)
- Mario Kart Wii ghosts store the course and the time in fixed header fields and a CRC-32 over the whole file. [C] (S17)
- URL length: Safari about 80,000 characters; Chrome about 2 MB "for practical reasons and to avoid causing
  denial-of-service problems in inter-process communication"; the 2,000 to 2,083 figure is the old IE limit and a
  common safe guideline; servers, proxies and CDNs often reject long URLs before browsers do. [C] (S41, S42)
- `CompressionStream` is Baseline "Widely available", "available across browsers since May 2023", supports `gzip`
  (the page's example), and works in Web Workers. [C] (S43) [R] formats `deflate` and `deflate-raw` and first
  versions Chrome 80 / Firefox 113 / Safari 16.4 are recalled, not confirmed on the page.
- SpeedRunner: `splitsVer`, `SEASON = 2` wipes local records on change, ghost key `sr_ghost_<map>`. [K]

### Inferences
- [I] Keys: `mapHash = sha256(JSON(solids, checkpoints, finish, deathY, movers)).slice(0, 12)` and
  `physHash = sha256(JSON(PHYS, DT)).slice(0, 8)`. Board key `${mapId}:${mapHash}:${physHash}:${season}`. A map
  edit or a physics tweak opens a new board automatically; old boards remain readable by listing known keys with
  their dates, no manual season bump needed. `SEASON` stays as the human-facing reset.
- [I] Ghost record: `{ v: 2, mapHash, physHash, dt: 120, steps, inputs: base64url(deflate-raw(rle)), track: { hz: 10,
  data: base64url(packed) } }`. Drop `track` when `physHash` matches (re-simulate instead); keep it when it does not,
  so the shadow still appears after a patch, with a small "recorded on older physics" tag.
- [I] Share link: `https://game/#r=<mapId>.<mapHash>.<base64url(deflate-raw(inputs))>`. A 60 s run is about 700
  bytes raw, 500 bytes deflated, 670 characters in base64url; the whole URL stays under 800 characters. Use the
  fragment so the server never logs it, or a query parameter when the server should re-simulate and show a verified
  badge. A 10 Hz position track (4.2 KB raw, 3 KB deflated, 4 KB base64) is over the 2,000 guideline, so links carry
  inputs only.
- [I] localStorage budget is about 5 MB per origin; today's 100 KB ghost per map is fine, but 50-attempt split
  histories for 5 maps plus 10 Hz tracks is under 50 KB in the proposed format.

### Gaps
- Trackmania's exact map UID field and how Nadeo re-keys boards on a map update: not fetched. [R] The UID is a 27-char
  string in the Gbx header; verify at https://wiki.xaseco.org/wiki/GBX .
- MDN compatibility versions for `deflate-raw`: table did not render. (S43)

---

## Candidate technique profiles

1. **Step-count timer** – store integer physics steps, display ms, never time a run with the float accumulator.
   Games: Celeste (100 ns ticks per fixed frame), Trackmania (100 Hz tick). Numbers: 8.333 ms per step at 120 Hz.
2. **LiveSplit colour grammar** – four delta shades plus gold. Games: LiveSplit, every speedrun stream. Numbers:
   gold (255,213,0), ahead gaining (0,204,54), ahead losing (97,209,127), behind gaining (209,97,97), behind losing
   (204,0,0), PB blue (20,165,255).
3. **Golds and sum of best** – record best segment on every completed section, even on runs that die. Numbers: 5
   sections per map, about 1 KB per 50 attempts.
4. **Input replay as canonical ghost** – RLE (state byte, duration varint). Games: Mario Kart Wii (10,240-byte
   fixed file), Trackmania (inputs with timestamps), Dustforce (11 intent streams). Numbers: 0.6 to 3 KB per minute.
5. **Rig-replayed ghost** – record state + velocity, let the procedural rig pose the ghost. Numbers: 7 bytes per
   sample, 10 to 15 Hz, 4 to 6 KB per minute raw, vs 100 KB today.
6. **Deterministic sin and seeded RNG** – ship your own trig in the sim; a documented V8-vs-V8 divergence exists.
   Games: Rapier (WASM determinism), trigfills. Numbers: `Math.sqrt` exact, `Math.sin` not.
7. **Server re-simulation validator** – same `step()` in Node, reject on finish-step mismatch. Games: Trackmania
   (TM2 Top 10 only, nightly), Revalidate. Numbers: 7,200 steps per minute of run; milliseconds of CPU [I].
8. **Slowdown ratio check** – wall-clock start-to-submit vs simulated time. Games: Trackmania Competition Patch, the
   2021 investigation (spikes per second 9 to 19 vs 3 baseline).
9. **Timer on first input, no countdown** – Trackmania start block model. Numbers: SpeedRunner 3.4 s death to
   control today, target under 0.4 s with a skippable death beat.
10. **Live ghost over Durable Object or Supabase broadcast** – 10 bytes at 10 Hz, 100 ms interpolation buffer, no
    rollback. Numbers: DO free 100,000 requests/day, WS messages billed 20:1; Supabase free 200 connections, 100 msg/s.
11. **Content-hash board keys** – `mapId:mapHash:physHash:season`. Games: Trackmania map UID, MKWii course field.
12. **Deflate-base64url share link** – inputs only. Numbers: about 700 characters for a 60 s run; 2,000-char
    guideline; Safari 80,000; Chrome 2 MB; CompressionStream Baseline since May 2023.

---

## Sources
1. speedrun.com forum, RTA vs IGT definitions: https://www.speedrun.com/forums/speedrunning/1oate
2. speedrun.com World War Z guide, load removal: https://www.speedrun.com/world_war_z/guide/j7afd
3. speedrun.com L4D2 forum, timing methods: https://speedrun.com/l4d2/forums/wlk68
4. Celeste community rules page (IGT, file select): https://challenge-run-community.pages.dev/games/celeste
5. TASVideos submission 6217, Celeste (Speedrun Clock File mode, freezes, loads): https://tasvideos.org/6217S
6. Celeste save file docs, FileTime (100 ns ticks): https://frissyn.gitbook.io/celeste-saves/topics/filetime
7. speedrun.com Celeste forum, 61 fps bug and IGT: https://www.speedrun.com/posts/jo2ud
8. r/TrackMania, why times are not measured to the thousandth (100 Hz tick claims):
   https://lr.eu.psf.lt/r/TrackMania/comments/1jww598/why_dont_trackmania_race_times_measure_to_the
9. donadigo and Wirtual, TMX Replay Investigation (inputs, determinism, spikes per second): https://donadigo.com/tmx1
10. speedrun.com post on .lss XML structure: https://www.speedrun.com/posts/6t0ia
11. livesplit-core run module docs (attempt vs segment history):
    https://docs.rs/livesplit-core/0.13.0/src/livesplit_core/run/mod.rs.html
12. speedrun.com Ori DE LiveSplit guide (gold split, sum of best): https://www.speedrun.com/ori_de/guide/k29yz
13. livesplit-parser (PyPI), fields read from .lss: https://pypi.org/project/livesplit-parser/0.2.3
14. livesplit-core general_settings.rs, default colours:
    https://raw.githubusercontent.com/LiveSplit/livesplit-core/master/src/layout/general_settings.rs
15. Openplanet Checkpoint Times plugin: https://openplanet.dev/plugin/checkpointtimes
16. gbx-ts (getCheckpointTimes) and GBX.NET ghost extraction: https://github.com/thaumictom/gbx-ts ,
    https://github-wiki-see.page/m/BigBang1112/gbx-net/wiki/Extracting-ghosts-from-replays
17. Mario Kart Wii RKG file format: https://mkwiiki.org/wiki/RKG_(File_Format)
18. dustmaker replay module source (Dustforce intent streams):
    https://dustmaker.readthedocs.io/en/stable/_modules/dustmaker/replay.html
19. Stack Overflow, are JavaScript numbers deterministic:
    https://kiwix.lema.org/stackoverflow.com_en_all_2023-11/questions/37557958/are-javascript-numbers-deterministic
20. perplexdotgg/bounce issue 8, simulation diverges between JS engines (Math.sin):
    https://codeberg.org/perplexdotgg/bounce/issues/8
21. trigfills on npm: https://www.npmjs.com/package/trigfills
22. Mozilla dev-platform, intent to use fdlibm for Math.sin/cos/tan:
    https://groups.google.com/a/mozilla.org/g/dev-platform/c/0dxAO-JsoXI
23. Rapier determinism docs: https://rapier.rs/docs/user_guides/javascript/determinism
24. Revalidate README (Trackmania validation by game): https://github.com/BigBang1112/revalidate
25. bugnet.io, replay verification failing from nondeterministic simulation:
    https://bugnet.io/blog/how-to-fix-replay-verification-failing-from-nondeterministic-simulation
26. Kotaku, Neon White speedrunning cheaters (June 2022):
    https://kotaku.com/neon-white-speedrunning-cheaters-annapurna-interactive-1849115456
27. Steam forum, Neon White leaderboard cheating threads:
    https://steamcommunity.com/app/1533420/discussions/0/3418810183124328014
28. PC Gamer, cheating allegations catch up with Trackmania drivers:
    https://www.pcgamer.com/cheating-allegations-catch-up-with-some-of-trackmanias-fastest-drivers
29. Tracer: a forensic framework for detecting fraudulent speedruns from replays (arXiv 2025):
    https://arxiv.org/html/2509.10848v1
30. Giant Bomb, Instant Respawn concept (N++ listed): https://giantbomb.com/wiki/Concepts/Instant_Respawn
31. itch.io community post, Celeste-like fast respawn: https://itch.io/post/12671801
32. Trackmania dev tracker, restarting at finish bug: https://devtrackers.gg/trackmania/p/bc4f851a-restarting-at-finish
33. Vercel docs, WebSockets in Vercel Functions: https://vercel.com/docs/functions/websockets
34. Vercel KB, do Vercel Functions support WebSocket connections:
    https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections
35. Classmethod test of Vercel WebSocket beta (5-minute cap):
    https://dev.classmethod.jp/en/articles/vercel-functions-websocket-public-beta-verification/ ;
    Vercel community weekly 16 to 23 Oct 2026: https://community.vercel.com/t/vercel-weekly-october-26-2026/51439
36. Rivet changelog, Rivet Actors on Vercel Functions (17 Oct 2025):
    https://www.rivet.dev/changelog/2025-10-17-rivet-actors-vercel/
37. Cloudflare Durable Objects pricing: https://developers.cloudflare.com/durable-objects/platform/pricing/
38. Supabase Realtime limits: https://supabase.com/docs/guides/realtime/limits
39. Supabase pricing guide 2026 (third party):
    https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/
40. Ably vs Cloudflare Durable Objects (vendor page): https://ably.com/compare/ably-vs-cloudflare-durable-objects
41. Baeldung, maximum URL length: https://www.baeldung.com/cs/max-url-length
42. Stack Overflow, maximum URL length in different browsers:
    https://hn.jakechampion.name/reader/http://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
43. MDN, CompressionStream: https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream
