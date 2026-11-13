# 11. Gems: field-validated open-source code, tools and data

Scope: things that save the Kingsfoil team time on a hand-written Canvas2D JS time-attack platformer with a 1/120 s
fixed step, a Vercel `/api/lb` function and localStorage ghosts (see `01-current-build.md`). Everything below was
checked on 13 Nov 2026. Licence and maturity figures come from the GitHub REST API (`license.spdx_id`, stars,
`pushed_at`) and the npm registry (`license`, latest version, publish date, `unpackedSize`) unless the entry says
otherwise. "Stars" are GitHub stars; "pushed" is the last push date. Flags: **Low** = MIT/BSD/Apache/CC0/ISC/
Unlicense, **LGPL**, **Copyleft** = GPL/AGPL/CC BY-SA/CC BY-NC-SA, **None** = no licence file found (all rights
reserved by default; read-only reference, do not copy code), **Custom** = vendor licence, read it.

Method notes: GitHub reports `NOASSERTION` when a LICENSE file is non-standard; for those I read the LICENSE text
(scratch-11/). Repos without a LICENSE file are flagged None even when the npm package says MIT (the npm metadata
is the licence that applies to the published package, I say which in the entry).

---

## 1. Platformer controllers and feel references

**Takeaway.** The single most valuable reference is the MIT-licensed `Player.cs` that Maddy Thorson and Noel Berry
published from Celeste (5471 lines). Its constants map almost one to one onto the constants already in SpeedRunner.
For JS, LittleJS (MIT) and Kaplay (MIT) ship platformer examples with one-way platforms; `collision-2d` (MIT) has a
swept AABB routine. The Mario reimplementations are mostly unlicensed or Unlicense, so use them as reading, not as
copy sources.

### Cited findings
- **Celeste `Player.cs`** (NoelFB/Celeste, MIT, 4002 stars, archived Oct 2022). README: "the MIT License only applies
  to the code in this repo and does not include the actual commercial Celeste game or assets." [S1]
  Constants read from `Source/Player/Player.cs` (Celeste runs 60 fps, 8 px tiles, Madeline is 8x11 px hitbox):
  `MaxRun 90` px/s, `RunAccel 1000`, `RunReduce 400` (friction), `AirMult 0.65` (air control is 65% of ground),
  `Gravity 900`, `HalfGravThreshold 40` (half gravity within 40 px/s of apex while jump held, the apex hang),
  `MaxFall 160`, `FastMaxFall 240` (holding down), `JumpSpeed -105`, `JumpHBoost 40` (jump adds 40 px/s horizontal),
  `VarJumpTime 0.2` s (variable jump window), `CeilingVarJumpGrace 0.05`, `JumpGraceTime 0.1` s (coyote, 6 frames),
  `UpwardCornerCorrection 4` px, `DashCornerCorrection 4` px, `DashHJumpThruNudge 6` px, `DashVFloorSnapDist 3` px,
  `WallSpeedRetentionTime 0.06` s, `WallJumpForceTime 0.16` s (air control lock after wall jump),
  `WallJumpHSpeed = MaxRun + JumpHBoost = 130`, `WallSlideStartMax 20`, `WallSlideTime 1.2` s, `SuperJumpH 260`,
  `DashSpeed 240`, `EndDashSpeed 160`, `DashTime 0.15` s, `DashCooldown 0.2` s, `DashRefillCooldown 0.1` s,
  `DashAttackTime 0.3`, `ClimbMaxStamina 110`, `ClimbUpCost 100/2.2`, `ClimbJumpCost 110/4`, `LiftYCap -130`. [S2]
  Compare SpeedRunner: coyote 0.10 s (same), wall lock 0.15 vs 0.16 s, apex band 90 u/s vs 40 px/s, no corner
  correction yet (Celeste nudges 4 px upward and sideways).
- **Celestefall** (bennyfrancis/Celestefall, MIT, 25 stars, pushed Nov 2025): GameMaker "move and collide engine
  with moving platforms" based on Celeste. Small but the only MIT port with movers I found. [S3]
- **Unity-2D-Celeste-Game-Player-Controller** (Biebras, MIT, 18 stars, last push Feb 2022). C#, readable. [S4]
- **Mari0** (Stabyourself/mari0, Lua/LÖVE, 785 stars, pushed 13 Nov 2026): no LICENSE file in the repo (GitHub
  reports none). Treat as read-only reference for SMB-faithful physics and the in-game editor. Flag None. [S5]
- **meth-meth-method/super-mario** (vanilla JS, 684 stars, pushed Nov 2025): no LICENSE file. Good read for a
  pure-JS fixed-step loop and tile collision; do not copy. Flag None. [S6]
- **mariohtml5** (robertkleffner, Unlicense, 534 stars, pushed Dec 2022): Infinite Mario in Canvas JS. Public
  domain, so copyable; old code (no modules). [S7]
- **Phaser** (MIT, 40707 stars, npm 4.2.1, Jul 2026, 112 MB unpacked). Examples repo phaserjs/examples is MIT,
  1670 stars; the code search for a one-way platform example did not return a direct hit (arcade bodies use
  `checkCollision.down = false` for one-way, see Phaser docs). Too big to vendor into a single-file game; use
  for reading. [S8]
- **Kaplay** (kaplayjs/kaplay, MIT, 1828 stars, pushed 13 Nov 2026; npm 3001.0.19, Jun 2025, 4.0 MB).
  `examples/platformer.js` and `examples/platformEffector.js` (one-way platform effector). [S9]
- **LittleJS** (KilledByAPixel/LittleJS, MIT, 4383 stars, pushed 13 Nov 2026; npm littlejsengine 1.30.1).
  `examples/platformer` is a complete platformer with tile collision and movers, no dependencies. The closest
  "engine-free" reference to SpeedRunner's architecture. [S10]
- **Excalibur** (BSD-2-Clause, 2366 stars, npm 1.0.1, 13 Nov 2026). `excaliburjs/sample-platformer` exists but has
  no LICENSE file (flag None for the sample, Low for the engine). [S11]
- **melonJS** (MIT, 6505 stars, npm 20.15.0, 13 Nov 2026). Has a platformer tutorial and Tiled loader. [S12]
- **collision-2d** (mreinstein, MIT, 142 stars, pushed Aug 2026): 2D collision routines including swept AABB
  (`aabb-aabb-swept`) in plain JS, small enough to copy one function. [S13]
- **Monocle engine** (Celeste's framework) is open source on Bitbucket per the Celeste README; licence not read
  this session. [S1]

### Inferences
- Corner correction is the biggest missing feel feature in SpeedRunner's kit; Celeste's 4 px at 8 px tiles is half
  a tile. At SpeedRunner's scale (20 u wide hero, 1.32 zoom) the equivalent is roughly 4 to 6 u.
- SpeedRunner's existing numbers are in the Celeste band already (coyote 100 ms both; Celeste wall-jump lock 160 ms
  vs 150 ms), so the Player.cs value is validation, not a rewrite.

### Gaps
- Celeste's jump buffer lives in Monocle's `VirtualButton` buffer time, not in Player.cs; not read.
- No MIT JS "Celeste-like" controller with coyote, buffer and corner correction was found by GitHub search; the
  top hits were Unity/C# and GameMaker.
- The "smbc"/jdaster64 SMB physics sheet: web search found only archive copies and the author's site "The Super
  Mario Files"; no stable URL verified. [S14]

---

## 2. Speedrun timing, splits, ghost formats

**Takeaway.** `livesplit-core` (Rust, MIT or Apache-2.0 dual) compiles to WebAssembly with TypeScript bindings and
parses 16 split-file formats including `.lss`; LiveSplit One (MIT) is the web timer built on it. speedrun.com's
REST API is anonymous for reads at 100 requests per minute per IP, data under CC BY-NC 4.0. Trackmania ghost
parsers exist in TS (MIT) and C# (MIT for the header, GPL for LZO bodies).

### Cited findings
- **livesplit-core** (LiveSplit/livesplit-core, 230 stars, pushed 12 Nov 2026). README: dual licensed
  "Apache-2.0 or MIT, at your option"; bindings for "JavaScript + TypeScript for Node.js and WebAssembly"; npm
  badge `livesplit-core` (npm latest 0.10.2 published Sep 2018, MIT in metadata, 4.7 MB; the npm package is stale,
  build from source for current). C API features `parsing`, `timing`, `run-editing`, `layouts`. [S15]
  Parser module lists 16 formats: face_split, flitter, livesplit, llanfair, llanfair_gered, portal2_live_timer,
  shit_split, source_live_timer, speedrun_igt, splits_io, splitterino, splitterz, splitty, time_split_tracker,
  urn, wsplit, plus a `composite` auto-detecting parser. [S16]
- **LiveSplit One** (LiveSplit/LiveSplitOne, MIT, 306 stars, pushed 1 Nov 2026), TypeScript web app at
  one.livesplit.org; the reference UI for splits, comparisons (PB, best segments, average) and layouts. [S17]
- **LiveSplit** (desktop, MIT, 1859 stars, pushed 7 Nov 2026). The `.lss` format is XML; the Rust parser above is
  the clearest spec. [S18]
- **racetime.gg** (racetimeGG/racetime-app, GPL-3.0, 48 stars, pushed Feb 2023). Reference for race rooms, ready
  checks, countdowns and finish ordering. Copyleft, read only. [S19]
- **speedrun.com API** (speedruncomorg/api, docs repo, 380 stars, pushed Oct 2026, no LICENSE file on the docs).
  Base `https://www.speedrun.com/api`, only v1 documented, reads anonymous; "Each IP is allowed to perform 100
  requests per minute", status 420 when exceeded, pagination max 200 per page; content licence CC-BY-NC 4.0. [S20][S21]
- **gbx-ts** (thaumictom/gbx-ts, MIT, 15 stars, pushed Jun 2026): TypeScript GBX parser for Trackmania ghosts and
  replays; small user base. [S22]
- **GBX.NET** (BigBang1112/gbx-net, C#, 126 stars, pushed 13 Nov 2026). README: core library is MIT, but the LZO
  body decompressor (`GBX.NET.LZO`) is GPL v3; "Reading only the header also does not infect you with GNU GPL v3".
  GitHub shows no top-level LICENSE file, so flag Mixed. [S23]

### Inferences
- SpeedRunner's splits-against-PB display is a 2-comparison subset of LiveSplit's model (PB, best segments, sum of
  best). Adopting LiveSplit's vocabulary (segment, split, comparison, gold) and exporting runs as `.lss` costs little
  and lets players open their runs in LiveSplit One.

### Gaps
- Mario Kart ghost tooling not surveyed (budget). Auto-splitter frameworks (LiveSplit ASL, livesplit-core
  `auto-splitting` WASM runtime) exist but were not read.

---

## 3. Deterministic simulation and replays in JS

**Takeaway.** Use a tiny public-domain PRNG (bryc's `mulberry32` or `xoshiro128**`, one function each) seeded per
run; `seedrandom` is popular but larger and its repo has no LICENSE file (npm says MIT). MainLoop.js (MIT) is a
documented fixed-timestep accumulator loop if you want to compare against your own. netplayjs (ISC) is the only
maintained JS lockstep/rollback library found.

### Cited findings
- **bryc/code** (public domain per LICENSE.md: "Public domain. Software licenses are annoying.", 345 stars, pushed
  Jan 2026). `jshash/PRNGs.md` has mulberry32 (32-bit state, one line), sfc32, xoshiro128**, alea in JS with
  quality notes. Flag Low (public domain). [S24]
- **seedrandom** (davidbau/seedrandom, 2131 stars, pushed Apr 2024; npm 3.0.5 Sep 2019, MIT in npm metadata,
  374 KB unpacked). No LICENSE file at the repo root. ARC4-based, slower than mulberry32. [S25]
- **pure-rand** (dubzzz, MIT, 119 stars, npm 8.4.2 Jul 2026, 64 KB): xoroshiro128+, xorshift128+, mersenne,
  congruential, TypeScript, used by fast-check. [S26]
- **MainLoop.js** (IceCreamYou, MIT, 549 stars, pushed Jul 2026; npm 1.0.4 May 2017): begin/update/draw/end with a
  fixed `simulationTimestep` and an accumulator, panic handling when behind. [S27]
- **netplayjs** (rameshvarun, ISC, 577 stars, pushed Oct 2024): lockstep and rollback netcode for browser games with
  serializable state; useful as a model for input-stream replays and state checksums. [S28]
- **GGPO** (pond3r/ggpo, MIT, 3626 stars, C++): the rollback reference; not JS. [S29]
- **Fix Your Timestep** (Gaffer on Games) is the canonical accumulator article; URL in sources, not fetched this
  session. [S30]
- **BizHawk `.bk2`** movie format (TASVideos): a zip containing a Header (key-values such as `rerecordCount`,
  `Platform`, `GameName`, `SHA1`), an Input Log where each frame is one text line starting with `|`, pressed buttons
  as a character and unpressed as `.`, analog values as 5-digit numbers, a JSON `SyncSettings` blob, optional
  savestate anchor. Frame count = number of `|` lines. [S31] BizHawk code is MIT per its LICENSE (plus third-party
  cores), 2820 stars. [S32]

### Inferences
- SpeedRunner's physics already run at a fixed 1/120 s with movers driven by run time, so an input-log replay (one
  byte per step: left, right, jump, jumpPressed) is already deterministic on one machine. A 60 s run is 7200 steps,
  under 7.2 KB raw and about 1 KB deflated, versus about 100 KB for the current 30 Hz pose ghost. JS doubles are
  IEEE-754 and `+ - * /` and `Math.sqrt` are deterministic across engines; `Math.sin/cos/exp/pow` are not
  guaranteed bit-identical across engines, so the pose blend `1 - exp(-26 dt)` should stay out of the simulated
  state or use a table.

### Gaps
- No JS library found that packages "record input stream + verify by re-simulation"; it is a 50-line pattern.
- Float determinism across browsers for transcendental functions: widely reported, no single authoritative source
  cited here.

---

## 4. Server-side leaderboard plumbing for Vercel-style serverless

**Takeaway.** Upstash Redis sorted sets over HTTP (`@upstash/redis`, MIT) plus `@upstash/ratelimit` (MIT) is the
smallest working stack for a Vercel function: `ZADD` the time, `ZRANK` for rank, `ZRANGE` for the page of 7. Free
tier is 500K commands per month. For profanity filtering `obscenity` (MIT) handles leetspeak and is maintained;
the LDNOOBW list is CC BY 4.0 (attribution needed). Sign run ids with Web Crypto HMAC, no library needed, or `jose`
(MIT) for JWTs.

### Cited findings
- **@upstash/redis** (upstash/redis-js, MIT, 985 stars, npm 1.41.0 Nov 2026) and **@upstash/ratelimit**
  (upstash/ratelimit-js, MIT, 2052 stars, npm 2.2.1, 12 Nov 2026): sliding window and token bucket for edge
  runtimes. [S33][S34] Upstash Redis free tier (vendor page, 13 Nov 2026): 500K commands/month, 250 MB, 10 GB
  bandwidth/month, 10 MB max request; pay-as-you-go $0.20 per 100K commands. [S35]
- **vercel/examples** (MIT, 5165 stars): `edge-middleware/rate-limit-any-framework` shows rate limiting in a Vercel
  edge function. [S36]
- **Supabase** (Apache-2.0, 114974 stars). Free tier (vendor page, 13 Nov 2026): 500 MB database, 200 realtime
  peak connections, 2M realtime messages/month, 500K edge function invocations, 50K MAU, projects pause after 1 week
  idle, 2 active projects; Pro $25/month. Postgres with row-level security is a fine leaderboard store if the team
  wants SQL and seasons as a column. [S37][S38]
- **rate-limiter-flexible** (ISC, 3603 stars, npm 11.4.1 Nov 2026): rate limiting with Redis, memory or
  Postgres backends; heavier than Upstash's. [S39]
- **jose** (panva/jose, MIT, 7881 stars, npm 6.2.17 Nov 2026, 222 KB): JWS/JWT with Web Crypto, runs in Vercel edge
  and Workers. For a plain HMAC of `runId|map|startTs` the built-in `crypto.subtle.sign('HMAC', ...)` is enough. [S40]
- **obscenity** (jo3-l/obscenity, MIT, 188 stars, npm 0.4.6 Jan 2026, 153 KB): transformer-based matcher that catches
  leetspeak and spacing tricks, English dataset bundled. [S41]
- **bad-words** (web-mech/badwords, MIT, 699 stars, npm 4.1.5 Jul 2026, 39 KB): simple word-list filter. [S42]
- **LDNOOBW list** (CC-BY-4.0, 3482 stars, pushed Aug 2024; npm `naughty-words` 1.2.0, CC-BY-4.0, 69 KB): word
  lists in many languages. Attribution required (CC BY), fine for a credits line. [S43]
- **Nakama** (heroiclabs/nakama, Apache-2.0, 13718 stars, pushed Nov 2026): full game backend with leaderboards,
  tournaments, seasons ("leaderboard reset schedules") and a JS client; requires running a server (Docker), so it is
  the "later" option, not the Vercel-function option. [S44]
- **Cloudflare Workers** (cloudflare/workers-sdk, Apache-2.0, 4724 stars): Durable Objects give one strongly
  consistent object per room or per leaderboard; not Vercel, but the same code shape. [S45]

### Inferences
- The current `start`/`submit` handshake plus `ms > 6000` sanity check can be hardened cheaply with (a) an HMAC on
  the run id with a server secret, (b) a server-side elapsed-time bound (submit no earlier than `ms` after start,
  minus 1 s slack), (c) uploading the input log and re-simulating in a Node function with the same physics file.
  (c) is where a deterministic input replay pays off twice.

### Gaps
- No open-source "replay verification on serverless" repo found for platformers; Trackmania does it server-side
  but closed.

---

## 5. Live race plumbing (two-player live ghost at 10 to 30 Hz)

**Takeaway.** PartyKit's hosted platform shut down on 23 Oct 2026 (team joined Cloudflare, Apr 2024); the
open-source code (MIT) still runs on your own Cloudflare account. For a two-player ghost race with no server,
PeerJS (MIT) over WebRTC data channels is the cheapest; Supabase Realtime Broadcast (Apache-2.0, 200 free
connections, 2M messages/month) is the cheapest hosted relay and the team may already use Supabase. Colyseus (MIT)
and Nakama (Apache-2.0) need a server.

### Cited findings
- **PartyKit** (partykit/partykit, MIT, 5747 stars, pushed Oct 2026; npm partysocket 1.3.0 Jun 2026). Vendor site
  13 Nov 2026: hosted deploys stopped 16 Oct 2026, platform shut down 23 Oct 2026; "PartyKit is joining
  Cloudflare!" dated 5 Apr 2024; commercial use "Free if you deploy to your own Cloudflare account". [S46][S47]
- **PeerJS** (peers/peerjs, MIT, 13515 stars, pushed Feb 2026; npm 1.5.5 Jun 2025, 2.1 MB): WebRTC data channels
  with a free public signalling server (0.peerjs.com) and an open-source PeerServer. [S48]
- **simple-peer** (feross, MIT, 7799 stars, last push Jun 2024; npm 9.11.1 Feb 2022): smaller WebRTC wrapper,
  effectively unmaintained for 2+ years. [S49]
- **Supabase Realtime** (Apache-2.0, 7683 stars, pushed Nov 2026): Broadcast (ephemeral messages), Presence, and
  Postgres changes over WebSockets; free tier numbers in section 4. [S50][S38]
- **Ably** (ably/ably-pubsub-js, Apache-2.0, 369 stars). Pricing page 13 Nov 2026: free tier states 500 MAU, 1
  month message retention; Pro $29/month billed annually for 1K MAU. The page did not show message or connection
  caps in the fetched text. [S51][S52]
- **Liveblocks** (liveblocks/liveblocks, 4771 stars; LICENSE: most packages Apache-2.0, some under a second licence,
  read the `licenses/` folder). Pricing 13 Nov 2026: free 3,000 anonymous connections/month, 10 simultaneous
  connections per room, 500 monthly active rooms, 10 MB storage per room; Pro $30/month ($25 annual). Built for
  documents, not games. [S53][S54]
- **Colyseus** (MIT, 7545 stars, npm 0.18.12 Nov 2026): authoritative rooms with state sync at a configurable
  patch rate (default 20 Hz); needs a Node host. [S55]
- **y-webrtc** (yjs, MIT, 593 stars, last push Apr 2024): CRDT sync over WebRTC; wrong tool for position streams. [S56]

### Inferences
- A live ghost at 20 Hz with the current 18-number pose frame is 18 x 4 bytes x 20 = 1.4 KB/s per player before
  compression; a 60 s race is under 100 KB each way, inside every free tier above. Sending only the input log
  (4 bits per 1/120 s step = 60 bytes/s) and simulating the opponent locally is 25x smaller and exact, since the
  physics are deterministic.

### Gaps
- Ably's free-tier message and connection caps were not visible in the fetched pricing text; check the page by hand.
- Cloudflare Durable Objects pricing not fetched.

---

## 6. Audio

**Takeaway.** ZzFX (MIT, about 1 KB minified) is the right fit for a single-file game that already synthesises
everything with WebAudio; jsfxr (Unlicense) gives a sfxr-compatible designer with URL-shareable presets. Tone.js is
MIT but 5.4 MB unpacked, too large to justify here.

### Cited findings
- **ZzFX** (KilledByAPixel/ZzFX, MIT, 813 stars, pushed 3 Nov 2026; npm zzfx 1.4.0 Oct 2026, 30 KB unpacked, the
  core is a single function). 20-parameter sound designer at killedbyapixel.github.io/ZzFX, same author as LittleJS. [S57]
- **jsfxr** (chr15m/jsfxr, Unlicense, 466 stars, pushed May 2026; npm jsfxr 1.4.1 May 2026 with no licence field,
  50 KB). sfxr port with a web designer and `sfxr.toAudio(preset)`. Public domain, copyable. [S58]
- **Bfxr** (increpare/bfxr, 1028 stars, Flash/AIR, no LICENSE file): the designer many devs use; not a JS library.
  Flag None. [S59]
- **Tone.js** (MIT, 14900 stars, npm 15.1.22 Apr 2025, 5.4 MB): scheduling, synths, effects; overkill unless music
  that follows pace is built. [S60]

### Inferences
- SpeedRunner's existing per-event synth (jump 420 to 760 Hz triangle 90 ms, etc.) is already a hand-rolled ZzFX.
  Adopting ZzFX's parameter vector lets designers tweak sounds in the web designer and paste one array.

### Gaps
- No open-source procedural footstep generator worth citing was found within budget; the Combat juice study's
  WebAudio voices cover impacts (https://kingsfoil-artifacts.netlify.app/feel-combat-juice.html).

---

## 7. Procedural animation and juice

**Takeaway.** For a single-file game, copy one damped-spring function (Ryan Juckett's closed form) and one FABRIK
loop rather than adding a tween library. If a library is wanted, tween.js (MIT, 224 KB unpacked, tree-shakes to a
few KB) or anime.js (MIT). GSAP is now free for commercial use but under a custom Webflow licence, not open source.

### Cited findings
- **tween.js** (tweenjs/tween.js, MIT per LICENSE text with Robert Penner's easing equations, 10152 stars, pushed
  Nov 2026; npm @tweenjs/tween.js 25.0.0 Jul 2024). [S61]
- **anime.js** (juliangarnier/anime, MIT, 74565 stars, npm animejs 4.5.0 Jun 2026, 2.1 MB unpacked; v4 has a
  spring easing). [S62]
- **GSAP** (greensock/GSAP, 30571 stars, npm gsap 3.15.1 Nov 2026, 6.3 MB). Licence field: "Standard 'no charge'
  license". Vendor page: "Commercial usage is covered under the standard license"; prohibited uses include tools that
  "allow users to build visual animations without code" competing with Webflow; Webflow may update terms and
  "continued use counts as acceptance". Flag Custom. [S63][S64]
- **Fullik** (lo-th/fullik, MIT, 479 stars, pushed May 2025): JS port of Caliko FABRIK, 2D and 3D chains with
  constraints. For a stick-figure arm reaching a katana grip, a 20-line two-bone FABRIK is enough. [S65]
- **tsParticles** (MIT, 9088 stars, npm 4.5.4 Nov 2026, 1.2 MB) and **@pixi/particle-emitter** (MIT, 853 stars): both
  larger than SpeedRunner's whole bundle; read their emitter JSON schema for ideas only. [S66][S67]
- **Damped springs**: Ryan Juckett, "Damped Springs" (closed-form critically damped spring step, stable at any dt).
  Not fetched this session, URL in sources. [S68]
- **Trauma shake**: Squirrel Eiserloh, "Math for Game Programmers: Juicing Your Cameras With Math" (GDC 2016).
  Covered in the library's Combat juice study, link above. [S69]

### Inferences
- SpeedRunner's kimono spring (stiffness 160, damping 14) and pose blend `1 - exp(-26 dt)` are already the right
  primitives; the gap is a shared `spring(x, v, target, dt)` helper reused for camera, squash and UI.

---

## 8. Level editors and formats

**Takeaway.** LDtk (MIT) is the editor to recommend: single JSON file, entity fields, auto-layers, a smaller surface
than Tiled. Tiled's app is GPL (libtiled is BSD) and its JSON map format is documented and free to read. For URL
level sharing, `lz-string` (MIT) `compressToEncodedURIComponent` is the one-call option; `fflate` (MIT, 8 KB) gives
real deflate when levels get big. Mario Maker formats are documented by the community under GPL or CC BY-NC-SA.

### Cited findings
- **LDtk** (deepnight/ldtk, MIT, 4921 stars, pushed Nov 2026). JSON schema at ldtk.io/json. [S70]
- **Tiled** (mapeditor/tiled, 13058 stars, pushed Nov 2026). COPYING: "Several independent works are being
  distributed along with Tiled that fall under different licenses"; LICENSE.GPL for the application, LICENSE.BSD for
  libtiled ("Redistribution and use in source and binary forms ... are permitted"), LICENSE.APACHE present. Using
  the editor and reading its JSON is unrestricted; copying app code is GPL. [S71]
- **lz-string** (pieroxy, MIT, 4446 stars, npm 1.5.0 Mar 2023, 176 KB unpacked, core about 4 KB min). [S72]
- **fflate** (101arrowz, MIT, 3085 stars, npm 0.8.3 May 2026): "8kB package", deflate/inflate/zip, sync and async. [S73]
- **pako** (nodeca, MIT AND Zlib, 6137 stars, npm 3.0.3 Oct 2026, 2.5 MB unpacked): the zlib port; bigger. [S74]
- **toost** (TheGreatRambler/toost, MIT, 73 stars, pushed Mar 2026): Super Mario Maker 2 level viewer based on
  JiXiaomai's work; the `level.ksy` Kaitai Struct description of the SMM2 level format ships with the dataset in
  section 10. [S75]
- **SMM-Level-Format-Documentation** (c08oprkiua, GPL-3.0, 0 stars, pushed Nov 2023): Mario Maker 1 `.cdt` layout. [S76]
- **N++ level format**: only a 2016 community forum thread ("Modding N++: Level Format & Tile Data") and a parser
  `sidke/nppy` that no longer resolves on GitHub (404 on 13 Nov 2026). No official documentation found. [S77]
- **Loenn** (CelestialCartographers/Loenn, MIT, 240 stars, pushed Nov 2026): Celeste map editor in Lua/LÖVE; its
  source documents Celeste's `.bin` map format and entity set (Ahorn, the predecessor, is archived and under a
  custom all-rights-reserved licence). **Everest** (EverestAPI, MIT, 523 stars) is the mod loader. [S78][S79][S80]

### Inferences
- SpeedRunner's maps are already `[x, y, w, h, tag]` arrays plus mover and wheel records; an LDtk level with an
  IntGrid layer and an Entities layer exports to that shape in about 40 lines. URL sharing: a 60-solid map as JSON
  is about 2 KB, under 1 KB after lz-string, fits a URL hash.

### Gaps
- Ultimate Chicken Horse level format: nothing open found. Mario Maker 2 course format: the only parser chain is
  JiXiaomai's (Python) and toost; licences of the upstream Python parsers not checked.

---

## 9. Testing

**Takeaway.** Playwright (Apache-2.0) already drives the artifact library; the same harness can drive the game via
the exposed `window.__sr` hook (`step`, `startRun`, `PHYS`), feeding a scripted input log step by step and asserting
positions. That is a TAS-style regression test, in the spirit of BizHawk's `.bk2` (one text line per frame).

### Cited findings
- **Playwright** (microsoft/playwright, Apache-2.0, 100092 stars, npm 1.65.0 Nov 2026). `page.evaluate` can call
  `__sr.step()` deterministically; `page.keyboard.down/up` for real input; `page.evaluate(() =>
  performance.now())` and CDP `Performance.getMetrics` for frame-time. [S81]
- **stats.js** (mrdoob, MIT, 9162 stars, last release 0.17.0 in 2016, stable): FPS and ms panel in 3 lines, the
  same idea as the game's `?fps` meter. [S82]
- **BizHawk `.bk2`** as a format model, see section 3. [S31]

### Inferences
- A "bot run" per map (input log that reaches the flag) is both a regression test and a developer ghost; store it
  as text, one char per 1/120 s step, and replay it in CI through `__sr.step`.

---

## 10. Data

**Takeaway.** The one large open dataset is TheGreatRambler's Mario Maker 2 collection on Hugging Face: 26.5
million levels, 564 million recorded deaths with positions, under CC BY-NC-SA 4.0 (non-commercial, share-alike).
speedrun.com's API (CC BY-NC 4.0, 100 req/min) gives world records for every twin game. Celeste map data is readable
through Loenn/Everest tooling but the maps themselves are Celeste's commercial assets.

### Cited findings
- **Mario Maker 2 dataset** (huggingface.co/datasets/TheGreatRambler/mm2_level and siblings `mm2_level_deaths`,
  `mm2_level_played`, `mm2_user_posted`, `mm2_world_levels`): "564 million level deaths", "26.5 million uploaded
  user levels", full level set about 100 GB (stream it), levels stored as compressed binary parsed with the included
  `level.ksy`; collected over about a month in Feb 2022 via a self-hosted API; licence cc-by-nc-sa-4.0; "no
  intentions to create an updated release". Flag Copyleft (NC-SA). [S83]
- **speedrun.com API**: see section 2 for limits and the CC-BY-NC 4.0 content licence. [S20][S21]
- **Celeste**: `Player.cs` is MIT but "does not include the actual commercial Celeste game or assets". [S1]

### Inferences
- The SMM2 deaths dataset is the only published death-heatmap-scale source found; it answers "where do players die
  relative to element X" for Mario grammar elements, which transfers to spike placement and gap width in SpeedRunner.

### Gaps
- No Super Meat Boy level dump with a clear licence was found within budget. No published death heatmap for Celeste
  or N++ beyond in-game counters.

---

## Candidate technique profiles seeded by this file
1. **Corner correction** (Celeste `UpwardCornerCorrection 4` px, `DashCornerCorrection 4`): nudge up to N units
   sideways when a jump would clip a ceiling corner. Games: Celeste, Hollow Knight. Cost: 20 lines.
2. **Input-log replay as ghost, test and anti-cheat**: one char per 1/120 s step, 7.2 KB per minute raw; `.bk2` as the
   format model; verify server-side by re-simulation. Games: Trackmania (server validation), TAS culture.
3. **LiveSplit vocabulary and `.lss` export**: PB, best segments, sum of best; livesplit-core parses 16 formats.
4. **Sorted-set leaderboard on Upstash** with `ZADD`, `ZRANK`, `ZRANGE`, sliding-window rate limit, HMAC run ids.
5. **ZzFX parameter vectors** for every SFX, tuned in the web designer.
6. **LDtk as the editor**, export to `[x, y, w, h, tag]`, share via lz-string in the URL hash.
7. **Peer-to-peer live ghost** over PeerJS data channels sending input logs (60 bytes/s) rather than poses.

---

## Final table

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| Celeste Player.cs | https://github.com/NoelFB/Celeste | MIT (LICENSE; code only, not game assets) | 4002 stars, archived Oct 2022 | Every movement constant (coyote 0.1 s, corner correction 4 px, apex half-gravity 40 px/s, wall lock 0.16 s) | Low |
| Celestefall | https://github.com/bennyfrancis/Celestefall | MIT | 25 stars, pushed Nov 2025 | Celeste-style move and collide with moving platforms (GML) | Low |
| Unity 2D Celeste controller | https://github.com/Biebras/Unity-2D-Celeste-Game-Player-Controller | MIT | 18 stars, last push Feb 2022 | Readable C# port of Celeste feel | Low |
| Mari0 | https://github.com/Stabyourself/mari0 | No LICENSE file | 785 stars, pushed Nov 2026 | SMB-faithful physics and in-game editor, reading only | None |
| super-mario (meth-meth-method) | https://github.com/meth-meth-method/super-mario | No LICENSE file | 684 stars, pushed Nov 2025 | Vanilla JS fixed-step platformer, reading only | None |
| mariohtml5 | https://github.com/robertkleffner/mariohtml5 | Unlicense | 534 stars, pushed Dec 2022 | Infinite Mario in Canvas JS, copyable | Low |
| LittleJS | https://github.com/KilledByAPixel/LittleJS | MIT | 4383 stars, npm 1.30.1 Nov 2026 | Dependency-free platformer example with tiles and movers | Low |
| Kaplay | https://github.com/kaplayjs/kaplay | MIT | 1828 stars, pushed Nov 2026 | `platformer.js`, `platformEffector.js` one-way platforms | Low |
| Phaser | https://github.com/phaserjs/phaser | MIT | 40707 stars, npm 4.2.1 Jul 2026 | Arcade one-way collision reference | Low |
| Excalibur | https://github.com/excaliburjs/Excalibur | BSD-2-Clause | 2366 stars, npm 1.0.1 Nov 2026 | TS engine; sample-platformer has no licence | Low (sample: None) |
| melonJS | https://github.com/melonjs/melonJS | MIT | 6505 stars, npm 20.15.0 Nov 2026 | Platformer tutorial, Tiled loader | Low |
| collision-2d | https://github.com/mreinstein/collision-2d | MIT | 142 stars, pushed Aug 2026 | Swept AABB function to copy | Low |
| livesplit-core | https://github.com/LiveSplit/livesplit-core | MIT or Apache-2.0 (README) | 230 stars, pushed Nov 2026; npm 0.10.2 stale (2018) | WASM timer, 16 split formats incl. .lss | Low |
| LiveSplit One | https://github.com/LiveSplit/LiveSplitOne | MIT | 306 stars, pushed Nov 2026 | Web timer UI reference, comparisons | Low |
| LiveSplit | https://github.com/LiveSplit/LiveSplit | MIT | 1859 stars, pushed Nov 2026 | .lss, auto-splitters, layouts | Low |
| racetime.gg | https://github.com/racetimeGG/racetime-app | GPL-3.0 | 48 stars, pushed Feb 2023 | Race rooms, ready check, results | Copyleft |
| speedrun.com API | https://github.com/speedruncomorg/api | Docs: no LICENSE; data CC-BY-NC 4.0 | 380 stars, pushed Oct 2026 | WRs of twin games, 100 req/min/IP, 200 per page | Copyleft (NC) |
| gbx-ts | https://github.com/thaumictom/gbx-ts | MIT | 15 stars, pushed Jun 2026 | Trackmania ghost/replay parsing in TS | Low |
| GBX.NET | https://github.com/BigBang1112/gbx-net | MIT core, GPL-3 LZO (README) | 126 stars, pushed Nov 2026 | Trackmania ghost format reference | Mixed |
| bryc PRNGs | https://github.com/bryc/code | Public domain (LICENSE.md) | 345 stars, pushed Jan 2026 | mulberry32, sfc32, xoshiro128** one-liners | Low |
| seedrandom | https://github.com/davidbau/seedrandom | npm MIT; no repo LICENSE file | 2131 stars, npm 3.0.5 (2019) | Seeded ARC4 RNG, larger | Low (npm) |
| pure-rand | https://github.com/dubzzz/pure-rand | MIT | 119 stars, npm 8.4.2 Jul 2026 | xoroshiro128+ in TS | Low |
| MainLoop.js | https://github.com/IceCreamYou/MainLoop.js | MIT | 549 stars, pushed Jul 2026 | Documented fixed-timestep loop | Low |
| netplayjs | https://github.com/rameshvarun/netplayjs | ISC | 577 stars, pushed Oct 2024 | Lockstep/rollback and state checksum patterns | Low |
| GGPO | https://github.com/pond3r/ggpo | MIT | 3626 stars, C++ | Rollback reference | Low |
| BizHawk .bk2 | https://tasvideos.org/Bizhawk/BK2Format | BizHawk MIT (LICENSE) | 2820 stars, pushed Nov 2026 | Text input-log format model | Low |
| @upstash/redis | https://github.com/upstash/redis-js | MIT | 985 stars, npm 1.41.0 Nov 2026 | ZADD/ZRANK leaderboard over HTTP from Vercel | Low |
| @upstash/ratelimit | https://github.com/upstash/ratelimit-js | MIT | 2052 stars, npm 2.2.1 Nov 2026 | Sliding-window limits in edge functions | Low |
| vercel/examples rate-limit | https://github.com/vercel/examples/tree/main/edge-middleware/rate-limit-any-framework | MIT | 5165 stars, pushed Nov 2026 | Vercel edge rate limit sample | Low |
| Supabase | https://github.com/supabase/supabase | Apache-2.0 | 114974 stars; free 500 MB, 200 RT conns, 2M msgs | Postgres leaderboard, Realtime Broadcast | Low |
| rate-limiter-flexible | https://github.com/animir/node-rate-limiter-flexible | ISC | 3603 stars, npm 11.4.1 Nov 2026 | Rate limiting with many stores | Low |
| jose | https://github.com/panva/jose | MIT | 7881 stars, npm 6.2.17 Nov 2026 | JWT/HMAC in edge runtimes | Low |
| obscenity | https://github.com/jo3-l/obscenity | MIT | 188 stars, npm 0.4.6 Jan 2026 | Leetspeak-aware name filter | Low |
| bad-words | https://github.com/web-mech/badwords | MIT | 699 stars, npm 4.1.5 Jul 2026 | Simple word-list filter | Low |
| LDNOOBW / naughty-words | https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words | CC-BY-4.0 | 3482 stars, pushed Aug 2024 | Multilingual word lists, attribution needed | Low (attribution) |
| Nakama | https://github.com/heroiclabs/nakama | Apache-2.0 | 13718 stars, pushed Nov 2026 | Full backend with leaderboards and seasons, needs a server | Low |
| PartyKit | https://github.com/partykit/partykit | MIT | 5747 stars; hosted platform shut 23 Oct 2026 | Rooms on your own Cloudflare account | Low |
| PeerJS | https://github.com/peers/peerjs | MIT | 13515 stars, npm 1.5.5 Jun 2025 | Serverless 2-player ghost race over WebRTC | Low |
| simple-peer | https://github.com/feross/simple-peer | MIT | 7799 stars, last push Jun 2024 | WebRTC wrapper, stale | Low |
| Supabase Realtime | https://github.com/supabase/realtime | Apache-2.0 | 7683 stars, pushed Nov 2026 | Hosted broadcast relay, 200 free connections | Low |
| Ably | https://github.com/ably/ably-pubsub-js | Apache-2.0 (SDK) | 369 stars; free 500 MAU, Pro $29/mo | Hosted pub/sub | Low (SDK) |
| Liveblocks | https://github.com/liveblocks/liveblocks | Apache-2.0 plus second licence (LICENSE) | 4771 stars; free 10 conns/room, 500 rooms | Document realtime, not games | Mixed |
| Colyseus | https://github.com/colyseus/colyseus | MIT | 7545 stars, npm 0.18.12 Nov 2026 | Authoritative rooms, needs Node host | Low |
| y-webrtc | https://github.com/yjs/y-webrtc | MIT | 593 stars, last push Apr 2024 | CRDT over WebRTC, wrong fit | Low |
| ZzFX | https://github.com/KilledByAPixel/ZzFX | MIT | 813 stars, npm 1.4.0 Oct 2026 | Tiny SFX synth, designer, one array per sound | Low |
| jsfxr | https://github.com/chr15m/jsfxr | Unlicense (repo); npm has no licence field | 466 stars, npm 1.4.1 May 2026 | sfxr designer and player | Low |
| Bfxr | https://github.com/increpare/bfxr | No LICENSE file | 1028 stars, Flash | Sound designer only | None |
| Tone.js | https://github.com/Tonejs/Tone.js | MIT | 14900 stars, npm 15.1.22 Apr 2025, 5.4 MB | Music scheduling, too big here | Low |
| tween.js | https://github.com/tweenjs/tween.js | MIT (LICENSE text) | 10152 stars, npm 25.0.0 Jul 2024 | Tweens and Penner easings | Low |
| anime.js | https://github.com/juliangarnier/anime | MIT | 74565 stars, npm 4.5.0 Jun 2026 | Tweens with spring easing | Low |
| GSAP | https://github.com/greensock/GSAP | Webflow "Standard no-charge" licence | 30571 stars, npm 3.15.1 Nov 2026 | Free commercial use but not open source, revocable | Custom |
| Fullik | https://github.com/lo-th/fullik | MIT | 479 stars, pushed May 2025 | FABRIK IK in JS | Low |
| tsParticles | https://github.com/tsparticles/tsparticles | MIT | 9088 stars, npm 4.5.4 Nov 2026 | Particle emitter ideas, too big | Low |
| pixi particle-emitter | https://github.com/pixijs-userland/particle-emitter | MIT | 853 stars, pushed Jan 2026 | Emitter config schema | Low |
| Ryan Juckett damped springs | https://www.ryanjuckett.com/damped-springs/ | Article | Long-standing reference | Closed-form spring step | n/a |
| Juicing Your Cameras (GDC 2016) | https://www.gdcvault.com/play/1023220/Math-for-Game-Programmers-Juicing | Talk | GDC Vault | Trauma shake; see Combat juice study | n/a |
| LDtk | https://github.com/deepnight/ldtk | MIT | 4921 stars, pushed Nov 2026 | Level editor, JSON at ldtk.io/json | Low |
| Tiled | https://github.com/mapeditor/tiled | GPL app, BSD libtiled (COPYING) | 13058 stars, pushed Nov 2026 | Editor and JSON format; app code is GPL | Copyleft (app) |
| lz-string | https://github.com/pieroxy/lz-string | MIT | 4446 stars, npm 1.5.0 Mar 2023 | URL-safe level sharing in one call | Low |
| fflate | https://github.com/101arrowz/fflate | MIT | 3085 stars, npm 0.8.3 May 2026, 8 KB | Deflate for bigger payloads | Low |
| pako | https://github.com/nodeca/pako | MIT AND Zlib | 6137 stars, npm 3.0.3 Oct 2026 | zlib port, heavier | Low |
| toost | https://github.com/TheGreatRambler/toost | MIT | 73 stars, pushed Mar 2026 | SMM2 level viewer and format | Low |
| SMM1 .cdt docs | https://github.com/c08oprkiua/SMM-Level-Format-Documentation | GPL-3.0 | 0 stars, pushed Nov 2023 | Mario Maker 1 level layout | Copyleft |
| Loenn | https://github.com/CelestialCartographers/Loenn | MIT | 240 stars, pushed Nov 2026 | Celeste map format and entity set | Low |
| Everest | https://github.com/EverestAPI/Everest | MIT | 523 stars, pushed Nov 2026 | Celeste mod loader | Low |
| Playwright | https://github.com/microsoft/playwright | Apache-2.0 | 100092 stars, npm 1.65.0 Nov 2026 | Drive `__sr.step` bot runs in CI | Low |
| stats.js | https://github.com/mrdoob/stats.js | MIT | 9162 stars, last release 2016 | FPS/ms panel | Low |
| Mario Maker 2 dataset | https://huggingface.co/datasets/TheGreatRambler/mm2_level | CC-BY-NC-SA-4.0 | 26.5M levels, 564M deaths, Feb 2022 | Death positions vs level grammar | Copyleft (NC-SA) |
| Cloudflare workers-sdk | https://github.com/cloudflare/workers-sdk | Apache-2.0 | 4724 stars, pushed Nov 2026 | Durable Objects rooms (alternative host) | Low |

---

## Sources
1. [S1] NoelFB/Celeste README, https://github.com/NoelFB/Celeste
2. [S2] Celeste Player.cs, https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
3. [S3] https://github.com/bennyfrancis/Celestefall
4. [S4] https://github.com/Biebras/Unity-2D-Celeste-Game-Player-Controller
5. [S5] https://github.com/Stabyourself/mari0
6. [S6] https://github.com/meth-meth-method/super-mario
7. [S7] https://github.com/robertkleffner/mariohtml5
8. [S8] https://github.com/phaserjs/phaser and https://github.com/phaserjs/examples
9. [S9] https://github.com/kaplayjs/kaplay/tree/master/examples
10. [S10] https://github.com/KilledByAPixel/LittleJS/tree/main/examples/platformer
11. [S11] https://github.com/excaliburjs/Excalibur and https://github.com/excaliburjs/sample-platformer
12. [S12] https://github.com/melonjs/melonJS
13. [S13] https://github.com/mreinstein/collision-2d
14. [S14] Web search for the jdaster64 SMB physics sheet; nearest hits https://mitxela.com/projects/console/mario and https://strategywiki.org/wiki/Super_Mario_Bros./Techniques (not verified)
15. [S15] https://github.com/LiveSplit/livesplit-core
16. [S16] https://docs.rs/livesplit-core/latest/livesplit_core/run/parser/index.html
17. [S17] https://github.com/LiveSplit/LiveSplitOne and https://one.livesplit.org
18. [S18] https://github.com/LiveSplit/LiveSplit
19. [S19] https://github.com/racetimeGG/racetime-app
20. [S20] https://github.com/speedruncomorg/api/blob/master/README.md
21. [S21] https://github.com/speedruncomorg/api/blob/master/throttling.md
22. [S22] https://github.com/thaumictom/gbx-ts
23. [S23] https://github.com/BigBang1112/gbx-net (README licence section)
24. [S24] https://github.com/bryc/code/blob/master/jshash/PRNGs.md and LICENSE.md
25. [S25] https://github.com/davidbau/seedrandom and https://www.npmjs.com/package/seedrandom
26. [S26] https://github.com/dubzzz/pure-rand
27. [S27] https://github.com/IceCreamYou/MainLoop.js
28. [S28] https://github.com/rameshvarun/netplayjs
29. [S29] https://github.com/pond3r/ggpo
30. [S30] Glenn Fiedler, Fix Your Timestep, https://gafferongames.com/post/fix_your_timestep/ (not fetched this session)
31. [S31] https://tasvideos.org/Bizhawk/BK2Format
32. [S32] https://github.com/TASEmulators/BizHawk (LICENSE)
33. [S33] https://github.com/upstash/redis-js
34. [S34] https://github.com/upstash/ratelimit-js
35. [S35] https://upstash.com/pricing/redis (13 Nov 2026, vendor figures)
36. [S36] https://github.com/vercel/examples/tree/main/edge-middleware/rate-limit-any-framework
37. [S37] https://github.com/supabase/supabase
38. [S38] https://supabase.com/pricing (13 Nov 2026, vendor figures)
39. [S39] https://github.com/animir/node-rate-limiter-flexible
40. [S40] https://github.com/panva/jose
41. [S41] https://github.com/jo3-l/obscenity
42. [S42] https://github.com/web-mech/badwords
43. [S43] https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words and https://www.npmjs.com/package/naughty-words
44. [S44] https://github.com/heroiclabs/nakama
45. [S45] https://github.com/cloudflare/workers-sdk
46. [S46] https://github.com/partykit/partykit
47. [S47] https://www.partykit.io/ (13 Nov 2026, shutdown notice and Cloudflare post dated 5 Apr 2024)
48. [S48] https://github.com/peers/peerjs
49. [S49] https://github.com/feross/simple-peer
50. [S50] https://github.com/supabase/realtime
51. [S51] https://github.com/ably/ably-pubsub-js
52. [S52] https://ably.com/pricing (13 Nov 2026, vendor figures)
53. [S53] https://github.com/liveblocks/liveblocks (LICENSE)
54. [S54] https://liveblocks.io/pricing (13 Nov 2026, vendor figures)
55. [S55] https://github.com/colyseus/colyseus
56. [S56] https://github.com/yjs/y-webrtc
57. [S57] https://github.com/KilledByAPixel/ZzFX and https://killedbyapixel.github.io/ZzFX/
58. [S58] https://github.com/chr15m/jsfxr
59. [S59] https://github.com/increpare/bfxr
60. [S60] https://github.com/Tonejs/Tone.js
61. [S61] https://github.com/tweenjs/tween.js (LICENSE)
62. [S62] https://github.com/juliangarnier/anime
63. [S63] https://github.com/greensock/GSAP and npm gsap licence field
64. [S64] https://gsap.com/standard-license/
65. [S65] https://github.com/lo-th/fullik
66. [S66] https://github.com/tsparticles/tsparticles
67. [S67] https://github.com/pixijs-userland/particle-emitter
68. [S68] Ryan Juckett, Damped Springs, https://www.ryanjuckett.com/damped-springs/ (not fetched this session)
69. [S69] Squirrel Eiserloh, Math for Game Programmers: Juicing Your Cameras With Math, GDC 2016, https://www.gdcvault.com/play/1023220/Math-for-Game-Programmers-Juicing ; library study https://kingsfoil-artifacts.netlify.app/feel-combat-juice.html
70. [S70] https://github.com/deepnight/ldtk and https://ldtk.io/json/
71. [S71] https://github.com/mapeditor/tiled (COPYING, LICENSE.GPL, LICENSE.BSD) and https://doc.mapeditor.org/en/stable/reference/json-map-format/
72. [S72] https://github.com/pieroxy/lz-string
73. [S73] https://github.com/101arrowz/fflate
74. [S74] https://github.com/nodeca/pako
75. [S75] https://github.com/TheGreatRambler/toost
76. [S76] https://github.com/c08oprkiua/SMM-Level-Format-Documentation
77. [S77] Modding N++: Level Format & Tile Data, https://forum.droni.es/viewtopic.php?p=176593 ; https://github.com/sidke/nppy (404 on 13 Nov 2026)
78. [S78] https://github.com/CelestialCartographers/Loenn
79. [S79] https://github.com/CelestialCartographers/Ahorn (archived, custom licence)
80. [S80] https://github.com/EverestAPI/Everest
81. [S81] https://github.com/microsoft/playwright
82. [S82] https://github.com/mrdoob/stats.js
83. [S83] https://huggingface.co/datasets/TheGreatRambler/mm2_level and https://huggingface.co/datasets/TheGreatRambler/mm2_level_deaths
