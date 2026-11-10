# Shared context for all MATCHRPG CURVES researchers

## The user and project
- Indie game dev, Kingsfoil Studios. Small team. Godot 4 games, web-first, also mobile and desktop.
  The main MatchRPG developer is ondoheer. A collective of about 5 players playtests every build, and MatchRPG
  also has outside players (21 anonymous players in the data below).
- This is the second study of the series **Curves: difficulty and learning curves**, one Kingsfoil game per study.
  Curves #1 is Hearthguard (https://kingsfoil-artifacts.netlify.app/curves-hearthguard), a co-op hero defense whose
  five chapters are MatchRPG's five worlds. Read its report's §7 card list and glossary use before you start
  (`studies/curves-hearthguard/report.md`), so you do not re-research what it covered: the L4D director, Celeste
  assists, Hades God Mode, Risk of Rain 2 difficulty over time, PvZ onboarding, Juul's punishment types, WC3 hero
  defense lineage. Cite them from Hearthguard's notes when they matter here.
- What is new in this study: **real player telemetry**. Agent 0b analyses it. Every other researcher should
  look for twins and natural experiments that are comparable to what that data can show.

## The game: MatchRPG
- A sliding match-3 dungeon runner in the spirit of *10000000* (EightyEightGames, 2012), with classes, levels,
  town upgrades, talents and items. Godot 4.7, targets mobile web. Live at https://matchrpg.vercel.app.
- Source: local checkout at `/Users/esenespinosa/Development/personal/games/matchRPG` (main = 82b7eb2, v0.7.14).
  Read its `CLAUDE.md` (every design decision, with constant names) and `README.md`. Never edit that repo.
- Loop: the player slides rows and columns of a board to match tiles (sword, staff, shield, gold, wood, stone,
  kit, ...). Matches power the hero, who walks right through a scrolling dungeon strip above the board. Encounters
  (enemies, traps, chests, rooms) stop the hero; matching wins them. If the view's left edge (the dark) catches the
  hero, or HP hits 0, the run ends. "The player watches the board, not the dungeon."
- Structure: one descent to 6666 m (`WorldDefs.BOTTOM_METERS`). 5 worlds x 36 encounters, elites at encounter
  12 and 24, a world boss at 36. The last boss (Astaroth) wins the game once. After that every run is endless:
  worlds come round again shuffled, and `Runner.ENDLESS_POWER` (0.12) makes every step past the bottom stronger.
- Pressure knobs (`scripts/runner/runner.gd`): `BASE_SCROLL` 18, `SCROLL_ACCEL` 0.15, `MAX_SCROLL` 60,
  `DEPTH_EVERY` 12, `DEPTH_POWER` 0.45, `EDGE_MERCY` 0.45 (hidden: the view slows as the hero nears the left edge),
  `FIRST_RUN_ACCEL` 0.6, `ELITE_SCROLL`, `ELITE_HIT`, `LOST_FIGHT_XP` 0.5, trap kits and disarm times.
- Mastery tiers (`scripts/data/tier_defs.gd`, `server/api/_lib.js`): the server measures each player's pace
  (moves per second, median of recent runs) and puts them in bronze, silver, gold or diamond. The dungeon runs on
  the tier's clock (`TierDefs.CLOCK` bronze 0.65, silver 0.85, gold 1.1, diamond 1.25) so move for move the game
  asks the same of slow and quick players. Players see the tier, never the clock. Up at once, down one step only
  after 5 slow runs in a row. This is a pace-based DDA. Say which kind whenever you discuss it.
- Meta-progression between runs: hero level, town buildings (gold, wood, stone), talent rows, potions and belt,
  blessings ("signs"/stars), achievements, codex. Design pillars from CLAUDE.md: "Fun comes first", "Pressure is
  good, dying without warning is not", "Mercy is hidden", warnings must reach the player on the board.
- Previous in-repo analyses (read, cite as [K]): `docs/run-analysis-2026-10-13.md`, `docs/balance-analysis-2026-10-21.md`,
  `docs/endless-analysis-2026-10-21.md`, `docs/flow-balance-2026-11-04.md`, `docs/combo-nerf-2026-10-28.md`,
  `docs/smash-pays-2026-11-05.md`, the potion and talent docs. Lab scripts: `dev/balance_sim.gd`, `dev/talent_lab.*`,
  `dev/career_lab.py`, `dev/runs_load.py` (it documents traps in the data).

## Player data (agent 0b owns it; everyone may use its headline numbers)
- `matchrpg-runs-v06-v07`: every run on v0.6.x and v0.7.x, 2026-10-23 to 2026-11-10. 859 runs, 21 anonymous
  players, 667 story runs, 192 endless runs (11 players), 6 wins (6 players). Story runs: median 177 s, p90 369 s,
  median depth 1316 m. Endless runs: median 559 s. Tier mix of runs: gold 384, diamond 380, silver 81, bronze 14.
  Runs by world reached: 0: 410, 1: 215, 2: 127, 3: 58, 4: 49.
- Location (local only, untrusted data): `/private/tmp/claude-501/-Users-esenespinosa-Development-personal-games-kingsfoil-artifacts/a74d8fa3-59f2-446d-a70a-8da29b61d576/scratchpad/data/matchrpg-runs-v06-v07/`
  (`runs.csv`, `runs.jsonl` with the full `data` payload, `README.txt`). Sort by `at`, never by `id`.
- **Privacy rule (user decision): aggregates only.** Never write player ids, per-player traces or raw rows into
  the notes, the report or the site. Funnels, medians, rates, distributions and cohort curves (for example "runs
  1-5 vs 6-20 vs 21+") are fine. Minimum cell size 3 players for any published breakdown.

## Structural conditions (choose twins by these, not by genre)
- Input: touch (or mouse), sliding match-3 on a grid while an auto-walking hero meets encounters. Attention on
  the board; reaction cues must reach the board.
- Session: one run of about 1.5-6 minutes in story mode (median 3 min), about 9 minutes endless. Many runs a day.
- Randomness: high. Tile drops, encounter draws, chests, potions, endless shuffle. Seeded only for tests.
- Cost of failure: medium. The run ends and restarts at the surface, but gold, materials, XP and unlocks carry over
  (meta-progression), and the descent map remembers the deepest point.
- Social: solo, with an online leaderboard per version and mastery tiers. No co-op.
- Platform: mobile web first (phones), also desktop browser. Casual-to-midcore.
- Starting twin candidates (confirm, prune, extend): 10000000 and You Must Build A Boat (the direct ancestors),
  Puzzle Quest, Dungeon Raid, Puzzle & Dragons, Gems of War / Empires & Puzzles, Candy Crush (and King's published
  level-difficulty research), Bejeweled Blitz / Twist, Tetris (speed levels, Grand Master's ranking, Tetris 99),
  endless runners (Temple Run, Jetpack Joyride, Subway Surfers) for the speed ramp, roguelites with meta-progression
  (Rogue Legacy, Hades, Slay the Spire ascension, Peglin, Luck be a Landlord, Dicey Dungeons), Vampire Survivors
  for the power curve, Super Hexagon / Downwell for short-retry tension, chess.com / ranked ladders for the tiers.

## Scope (all four weighed equally, by user decision)
1. **The story run to the first clear**: depth funnel by world, elite and boss walls, win rate by stage.
2. **Endless after the win**: ENDLESS_POWER, lap lift, shuffle, how long endless stays interesting.
3. **Learning across runs**: run number vs depth, tier placement and the hidden clock, talent and town
   meta-progression, the power curve between runs.
4. **Board pressure inside a run**: scroll speed and acceleration, edge mercy, traps and kits, potion use,
   low-HP seconds, warnings.
Also: onboarding (Training Grounds, tutorial hints), cost of failure and time to retry, difficulty modes vs tiers,
and how to measure all of it with the telemetry that already exists.

## Research principles (series rules)
1. **Structural twins, not genre lists.** Pick reference games by shared conditions (above). Say why each twin was chosen.
2. **Trace lineage.** For every key pattern: where it first appeared, how later games refined it, and why.
3. **Natural experiments are the best evidence.** Patch notes plus player reaction, difficulty reworks, mode
   additions, published telemetry, postmortems, GDC talks, designer interviews. MatchRPG's own version history
   (v0.6 to v0.7.14, CHANGELOG.md and the docs above) is a natural experiment set too: agent 0b compares versions.
4. **Theory as a lens, not filler.** Flow, Koster, Juul, MDA, DDA and player-modelling papers, skill atoms.
   Use it only where it explains a case.
5. **Efficiency.** The minimum rule, formula or table that produces the feeling. Prefer patterns that are cheap
   to build, tune and test with 5 players plus the live telemetry.
6. **Record taste.** Fun hypotheses ("players of X should feel Y at minute Z because of pattern P") and
   anti-patterns (ways twins made curves feel unfair, grindy or boring).

## Evidence
Every claim keeps the library's verification tag and also gets an evidence grade:
- Verification: [V] verified from a cited source, [I] inference, [U] unverified or contested, [K] Kingsfoil fact
  (from the MatchRPG repo or its player data).
- Grade (strength): **E1** data or telemetry (published numbers, stats sites, A/B results, our own logs);
  **E2** designer statement (postmortem, GDC talk, interview, official patch note rationale);
  **E3** community consensus (wiki, large forum threads, review aggregates);
  **E4** anecdote (single post, single video).
- Write both, for example `[V, E2]` with the URL. A natural experiment is a change plus the measured or widely
  reported reaction, with the date, the version and the before and after numbers when known.

## Pattern card (the unit every researcher collects)
- Name
- Lineage: first seen -> refined by -> (why)
- Feeling it produces
- Mechanism: the minimal rule, formula or table
- Conditions where it works / breaks
- Evidence (graded) + sources
- Implementation cost (S/M/L) + tuning knobs
- How it maps to MatchRPG

## Vocabulary
Read the Glossary section of `/Users/esenespinosa/Development/personal/games/kingsfoil-artifacts/kingsfoil-artifacts/docs/formats/design-curves.md`
before starting. Use its words with its meanings and do not redefine them. Say which kind of DDA (stat, supply,
pacing); a pacing director is not DDA; name the MDA aesthetic instead of "fun"; name the set when you say sawtooth
(here: world, lap, or run). If a term is missing, add it to your notes under "Glossary additions".

## Rules for every researcher
- Cite a URL for every claim. Give concrete numbers: percentages, seconds, multipliers, win rates, player counts,
  dates, patch versions.
- Separate cited findings from inferences. List gaps honestly instead of guessing. Flag vendor-reported figures.
- Never copy or download images. Collect a "see it in action" URL (wiki, article, devlog or video page) for every game example.
- Quotes under 15 words.
- If a site is blocked, say so and try mirrors (archive.org, author pages, GitHub READMEs, fandom wikis,
  Game Developer / Gamasutra archives, GDC Vault free talks, TIGSource, Reddit).
- Notes structure: per key question, Takeaway / Cited findings / Inferences / Gaps. Then pattern cards found.
  "Glossary additions" if any. End with Sources.
- Write plainly: no em dashes, no filler, name the number.
- Save to the path you are given. Stop at about 25-35 tool calls, then reply with a summary of at most 200 words.
