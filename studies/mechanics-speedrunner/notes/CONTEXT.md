# Shared context for all SPEEDRUNNER MECHANICS researchers

## The user and project
- Indie game dev collective, Kingsfoil Studios ("Kingsfoils Collective"), about 5 friends who playtest every build.
  Web-first games, also mobile and desktop. Small team, no budget for middleware.
- This is study #1 of a new series, **Game mechanics** (`mechanics`): the whole mechanical kit of one Kingsfoil
  game per study. Format `mechanics-playable` (docs/formats/mechanics-playable.md). The library is at
  https://kingsfoil-artifacts.netlify.app. Related earlier studies, link instead of repeating:
  - Curves #1 Hearthguard and #2 MatchRPG (difficulty and learning curve method, glossary in docs/formats/design-curves.md:
    sawtooth, skill atom, teach-test-twist, cost of failure, time to retry, assist mode, failure as information).
  - Feel #2 Combat juice (hitstop, screen shake, hit flash, trauma shake, WebAudio synth voices).
  - VFX studies (particles, dust, light) cover render recipes.

## The game: SpeedRunner
- Live: https://speedrunner-tau.vercel.app/ . A single-file Canvas2D JavaScript game (no framework, no engine),
  about 115 KB of script, served from Vercel with a `/api/lb` leaderboard function. No local repo is available
  to us; `notes/01-current-build.md` holds the constants read from the served bundle on 13 Nov 2026.
- Loop: a 2D side-view precision platformer time attack. Pick a map, 3-2-1 countdown, run left to right to the flag
  as fast as possible. Any death (spikes, falling below `deathY`) restarts the whole map after 0.38 s. `R` restarts
  at any time. Checkpoints (4 per map) are split markers only, they do not respawn you. The timer shows the split
  against your personal best at every checkpoint. On the flag your "shadow" (your best run, recorded at 30 Hz)
  appears and a 3.7 s automatic samurai duel plays: beat your record and you cut the shadow's head, otherwise it
  cuts yours (exact tie: both bow). Then a results screen with per-section times vs best, and the online leaderboard.
- Visual style: ink on paper. White background, black solids, one red kimono. Hero is a procedurally posed stick
  samurai (20x46 world units) with a katana and a kimono flap spring; dust particles; grass that gets cut; bamboo,
  rocks, trees, Japanese roof tiles as one-way platforms. Menu is a "lobby level": the title and buttons are solid
  words you can stand on and wall-jump off.
- Physics: fixed step 1/120 s, accumulator, render interpolation. 1280x720 view at zoom 1.32 (about 970x545 world units
  visible). Full movement kit already built: run with accel, turn accel and friction; jump with variable height (jump
  cut), coyote time 100 ms, jump buffer 130 ms, apex hang (gravity x0.55 within 90 u/s of the apex while held), fall
  gravity x1.65, max fall 1150; wall slide with 100 ms stick, wall coyote 80 ms, wall jump (away or "climb" variant
  when holding into the wall), same-wall penalty; landing roll after a 230 u fall (0.42 s, keeps 280 u/s), flip
  animation on fast jumps; moving platforms and wheels driven by run time so every attempt is deterministic.
- Content: 4 maps (FIRST STEPS easy, ROCKY MOUNTAIN medium, THE DUNGEON hard, STAIRWAY OF CLOUDS hard) and one locked
  card (SAMURAI TRIAL expert). Elements so far: ground, bushes, trees, one-way roof tiles, moving platforms, wheels
  with 4 tiles, floor and ceiling spikes, checkpoints, finish flag. No enemies, no items, no editor.
- Social: username claim with a device token, per-map online leaderboard (top list paged by 7, your rank), world
  record shown, seasons (season 2 wipes scores and local ghosts), run start/submit handshake with a server run id
  and a sanity check (time over 6 s, steps valid). Customize hat and kimono colours. Local ghost toggle.
- Platform: desktop browser with keyboard today (WASD/arrows + Space/W/Up jump). No touch controls yet. Phones later.

## Scope (the user's request, 13 Nov 2026)
Research "smooth and great mechanics" in games like Getting Over It, Doodle Jump, Jetpack Joyride, Solipskier,
LittleBigPlanet, Cat Mario (Syobon Action), Fall Guys, Super Mario Maker, Ultimate Chicken Horse and other
speedrunner-style platformers. Focus areas, each a family in the report:
1. **Animations**: character animation for a procedurally posed runner, squash and stretch, anticipation, landing,
   dust, trails, death and respawn, finish celebration, UI motion. Vector and stick-figure rigs welcome.
2. **Elements**: obstacles, items, interactive elements, moving parts, one-way platforms, springs, boosts, portals,
   breakable and timed blocks, hazards, collectibles, and how they are telegraphed.
3. **Enemies**: enemy patterns in runners and precision platformers, when a time-attack game should have them at all,
   enemies as timing puzzles, deterministic enemies, bosses in speed games.
4. **Movement mechanics**: the platformer feel canon (jump curves, coyote time, buffers, apex control, corner
   correction, ledge forgiveness, momentum, wall mechanics, dashes), physics-based movement (Getting Over It,
   Solipskier, Jetpack Joyride), speed tech (bunny hops, slides), input latency and fixed-step physics.
5. **Map design**: level structure for time attack (routes, shortcuts, risk-reward lines, checkpoints as splits),
   teach-test-twist, Mario Maker and Ultimate Chicken Horse level grammar, procedural layouts (Doodle Jump,
   Jetpack Joyride), endless vs fixed, readability of hazards, camera.
6. **Difficulty curve**: ramp across maps and inside a map, death cost, instant restart, assist options, troll
   difficulty (Cat Mario, I Wanna Be the Guy, kaizo), skill ceilings for speedrunners, telemetry.
7. **Social mechanics**: leaderboards, ghosts, splits, seasons, friends boards, asynchronous and live races,
   duels, replays, sharing, level sharing and curation (Mario Maker, LBP), party modes (Fall Guys, UCH),
   cheating and verification, identity and cosmetics.
Added by the study (the user asked us to add what we think fits):
8. **Race infrastructure**: timers (RTA vs in-game time), split logic, ghost recording formats and sampling,
   deterministic replays, input recording, restart latency, run validation, anti-cheat for web leaderboards.
9. **Camera, feedback and audio** (inside Animations and Movement where they fit): look-ahead, dead zones,
   screen shake limits, SFX synthesis, music that follows pace.
10. **Controls and input**: keyboard, gamepad, touch for a phone build, remapping, input display.

## Reference games (confirm, prune, extend)
User list: Getting Over It with Bennett Foddy, Doodle Jump, Jetpack Joyride, Solipskier, LittleBigPlanet 1-3,
Cat Mario (Syobon Action), Fall Guys, Super Mario Maker 1-2, Ultimate Chicken Horse.
Extend with the structural twins of a restart-heavy side-view time attack: Super Meat Boy, Celeste, N / N+ / N++,
Dustforce, SpeedRunners (DoubleDutch, 2013), Trackmania (ghosts and time attack), Neon White, VVVVVV, Jump King,
Pogostuck, Only Up, Canabalt, Tiny Wings, Alto's Adventure, Geometry Dash, BIT.TRIP Runner, Rayman Legends
(Kung Foot and the daily challenges), Sonic (momentum), Mirror's Edge (flow), Ghostrunner, Pizza Tower, Hollow Knight
(not a runner, but wall tech), Mario games (Super Mario Bros. physics, Mario 64 speedrun culture), Kaizo Mario and
I Wanna Be the Guy (troll lineage), Happy Wheels and Line Rider (physics UGC), Super Mario Bros. 35 and Mario Royale
(race platformers), Towerfall and Duck Game (party platformers), Shovel Knight, Downwell, Katana ZERO (samurai
feel and restart), Hotline Miami (instant restart), OlliOlli (momentum and chaining), Trials (physics time attack
with ghosts and leaderboards), Mario Kart ghosts, Spelunky daily challenge, Hades (assist), Super Mario Odyssey
(movement kit). Prune anything that does not fit; say why each twin matters.

## Rating criteria for this study (author judgement, 1 to 5)
**Feel** (how good it is in the hands) · **Readability** (understood on first sight) · **Run fit** (serves a
restart-heavy, time-attack, leaderboard game) · **Cheapness** (cost for a tiny team in hand-written Canvas2D JS)
· **Evidence** (strength of sources: telemetry or designer statement 5, community consensus 3, single post 1).

## Report shape (so you know what to collect)
Technique profiles with "In plain words", "How it works (technical)", "Cost / performance", "Games that used it"
(with URL), "How it feels", "Risks", ratings. Collect concrete parameters: jump height in body lengths and in
tiles, time to apex in ms, gravity multipliers, coyote and buffer windows in frames and ms, corner correction in
px, wall slide speeds, dash lengths and cooldowns, restart time in ms (death to control), checkpoint rules, ghost
sample rates and sizes in bytes, leaderboard sizes and anti-cheat rules, level lengths in seconds for a world record
and for a first clear, death counts per level in published telemetry, element timings (spring launch velocity,
moving platform periods, timed block cycles), enemy speeds, camera look-ahead in px and dead zone sizes, UI
timings, player counts, dates, versions.

## Rules for every researcher
- Cite a URL for every claim. Give concrete numbers (ms, frames, px, tiles, body lengths, seconds, counts, dates, versions).
- Separate cited findings from inferences. List gaps honestly instead of guessing. Flag vendor-reported figures.
- Never copy or download images. For every game example collect a "see it in action" URL (wiki page, article,
  devlog, GDC Vault page, or video page).
- Quotes under 15 words.
- Fan wikis (Fandom) often return 402/403 and archive.org may be blocked. Prefer open-source code and primary
  sources: Celeste's published Player.cs movement constants (Maddy Thorson's posts and the decompiled constants
  widely quoted), the Super Mario Bros. physics documents (SMB disassembly, the "Mario physics" wikis), N++
  developer blogs (Metanet), Super Meat Boy and Dustforce talks, Bennett Foddy's writing and talks, Doodle Jump and
  Jetpack Joyride postmortems (Halfbrick GDC talks), Solipskier (Mikengreg) interviews, Media Molecule and Nintendo
  interviews, speedrun.com rules pages and forum threads, TASVideos, Trackmania ghost and leaderboard docs,
  LiveSplit docs, GDC Vault free talks, GMTK and other analysis videos (as E3/E4), Godot and Phaser platformer
  sources for reference implementations, GitHub READMEs with licence files.
- Notes structure: per key question -> Takeaway / Cited findings / Inferences / Gaps. Then a list of candidate
  technique profiles (name, one line, games, key numbers). End with "Sources" (numbered, with URLs).
- Scratch files go only in `studies/mechanics-speedrunner/notes/scratch-<your-file-number>/`. Never write outside
  your notes file and that folder.
- Stop at about 25-35 tool calls. Save notes as markdown to the path you are given, then reply with a SHORT summary
  (at most 200 words) listing your 8-12 most useful numbers, each with the label it came from.
