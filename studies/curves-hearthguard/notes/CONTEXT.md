# Shared context for all HEARTHGUARD CURVES researchers

## The user and project
- Indie game dev, Kingsfoil Studios. Small team. Godot 4 games, web-first, also mobile and desktop.
  A "collective" of about 5 players playtests every build.
- This is the first study of a new series, **Curves: difficulty and learning curves**. One Kingsfoil game per
  study. Later studies: MatchRPG, SpeedRunner, Merge Arena, Asterion (Tibia-like MMORPG).
- Earlier study that matters here: **Enemy AI for a Hero Defense RTS**
  (https://kingsfoil-artifacts.netlify.app/rts-enemy-ai-study). Hearthguard implements its build order up to step 8
  (flow field, mob FSM, attack tokens, director that paces but never adjusts stats, boss phases, threat). Do not
  re-research enemy AI. Reference it where pacing and AI touch the curve.

## The game: Hearthguard
- Live build: https://kingsfoil-hearthguard.netlify.app (web, solo for now; co-op 1-3 players on desktop host).
- Playtest dashboard (every logged play): https://kingsfoil-hearthguard-dashboard.netlify.app
- Source: local checkout at `/Users/esenespinosa/Development/personal/games/kingsfoil-heartguard`
  (GitHub sujumayas/hearthguard, main = b509a56). Read its `README.md` first; it documents every number.
- Loop: co-op hero defense, WC3 Hero Defense lineage with a MOBA control scheme (right-click, QWER, A-move).
  Each player holds one corridor to the Hearth. 5 chapters (one per MatchRPG world) x 6 waves: 2 plain waves,
  elite (w3), Horde (w4, three surges faster than they can be cleared), elite (w5), world boss with adds (w6).
  25 s campfire between chapters (full heal, shop, half the Hearth back). 12 s gap between waves; Space calls
  the next wave early for 2 gold per second skipped.
- Progression: levels give QWER ranks (WC3 style), talents at 4/8/12/16/20 (3 choices per row, MatchRPG talent
  rows). Hero damage +9% per level, faster than mobs inside a chapter, so "a chapter ends in a mow and the next
  one's first wave pushes back". Mob HP scale per chapter [1.0, 2.3, 4.6, 8.0, 13.0], attack [1.0, 1.6, 2.4, 3.3, 4.4],
  +7% per wave inside a chapter. Execute line: any hit under 8% HP kills. Town: 9 shared buildings, 5 levels,
  cost x1.7 per level. Road fires (heal ring, relight by holding the ring 5 s) and "the dark" when all fires are out;
  chapters 4-5 are always dark. Death: respawn timer from the Dota 2 preset; losing = the Hearth falls.
- Telemetry already exists: Supabase `plays` and `play_events` (death with last 6 s of hits and full hero state,
  per-wave per-hero summaries, wave_start/end, level, learn, talent, buy, drink, respawn, game_over). A headless
  seeded `sim_bot` plays the whole game (`godot --headless --path . res://tests/sim_bot.tscn -- --cls=archer`);
  its results are a floor for a person.
- Session length: a full solo bot run takes 24-27 minutes (`notes/01-current-build.md`). Real players so far
  (11 plays, one player) never got past chapter 2.
- Current-build findings every researcher should know (details in `notes/01-current-build.md`): the sawtooth only
  exists in chapter 1, and the hero-vs-mob ratio slides from 1.0 to 0.6 over the run. The Hearth stays at 6,500 HP
  while mob attack grows 5.9x, and every bot loss is the Hearth falling in chapters 3-5. Bots that never build the
  Town lose with 13k-25k gold unspent. The first talent choice lands during the first Horde, around minute 2.

## Structural conditions (choose twins by these, not by genre)
- Input: real-time, mouse (MOBA scheme) or touch; one hero per player; skill shots and positioning matter.
- Session: one run of 5 chapters, roughly 15-40 minutes, no meta-progression between runs yet.
- Randomness: low. Fixed waves and rosters, seeded sim; talent choice is a fixed menu, not a random draft.
- Cost of failure: high. The Hearth falls = the run ends, restart from chapter 1. Hero death = timer, not loss.
- Social: solo or co-op 1-3, each player owns a lane (shared Town, shared loss).
- Platform: browser and phone, short sessions, a casual-to-midcore audience of friends.
- Starting twin candidates (confirm, prune, extend): WC3 custom maps (Hero Defense, Hero Siege, Footman Frenzy,
  Element/Green TD lineage, Survival Chaos), Kingdom Rush, Orcs Must Die, Diablo-style monster level scaling,
  plus anything that matches the conditions better (Dota 2 custom games, Vampire Survivors-likes for the power
  curve, Risk of Rain difficulty-over-time, Left 4 Dead director, Deep Rock Galactic hazard levels, Gauntlet).

## Scope
Find out what made difficulty and learning curves fun in games that share Hearthguard's conditions, and turn it
into small, reusable patterns Hearthguard can use. Grounded in research, built on what worked before, judged by taste.
Covers: the difficulty curve (inside a wave, a chapter, the run), the learning curve (controls, abilities,
talents, Town, fires, the dark), the power curve (hero vs mobs), cost of failure and retry, co-op scaling for
1-3 players, difficulty modes and assists, pacing (build-up, peak, relax), and how to measure all of it.

## Research principles (series rules)
1. **Structural twins, not genre lists.** Pick reference games by shared conditions (above). Say why each twin was chosen.
2. **Trace lineage.** For every key pattern: where it first appeared, how later games refined it, and why.
3. **Natural experiments are the best evidence.** Patch notes plus player reaction, difficulty reworks, mode
   additions, published telemetry, postmortems, GDC talks, designer interviews.
4. **Theory as a lens, not filler.** Flow (Csikszentmihalyi), Koster's A Theory of Fun, Juul's The Art of Failure,
   DDA and player-modelling papers, Hunicke's MDA, skill atoms and learnability. Use it only where it explains a case.
5. **Efficiency.** The minimum rule, formula or table that produces the feeling. Prefer patterns that are cheap
   to build, tune and test with 5 players.
6. **Record taste.** Fun hypotheses ("players of X should feel Y at minute Z because of pattern P") and
   anti-patterns (ways twins made curves feel unfair, grindy or boring).

## Evidence
Every claim keeps the library's verification tag and also gets an evidence grade:
- Verification: [V] verified from a cited source, [I] inference, [U] unverified or contested, [K] Kingsfoil fact
  (from the Hearthguard repo or dashboard).
- Grade (strength): **E1** data or telemetry (published numbers, stats sites, A/B results, our own logs);
  **E2** designer statement (postmortem, GDC talk, interview, official patch note rationale);
  **E3** community consensus (wiki, large forum threads, review aggregates, Reddit megathreads);
  **E4** anecdote (single post, single video).
- Write both, for example `[V, E2]` with the URL. A natural experiment is a change (patch, rework, mode) plus the
  measured or widely reported reaction. Record the date, the version, the before and after numbers when known.

## Pattern card (the unit every researcher collects)
- Name
- Lineage: first seen -> refined by -> (why)
- Feeling it produces (mastery, tension, relief, "one more try", ...)
- Mechanism: the minimal rule, formula or table
- Conditions where it works / breaks
- Evidence (graded) + sources
- Implementation cost (S/M/L) + tuning knobs
- How it maps to Hearthguard

## Vocabulary
Read the Glossary section of `/Users/esenespinosa/Development/personal/games/kingsfoil-artifacts/kingsfoil-artifacts/docs/formats/design-curves.md`
before starting (research behind it: `notes/00a-glossary-theory.md`, `notes/00b-glossary-practice.md`). Use its words with
its meanings and do not redefine them. Key rules: say which kind of DDA (stat, supply, pacing); a pacing director is
not DDA; name the MDA aesthetic instead of "fun"; name the set when you say sawtooth. If a term is missing, add it to
your notes under "Glossary additions".
Already covered, do not re-research: L4D director numbers, Celeste assist options, Hades God Mode numbers,
Risk of Rain 2 difficulty formula, PvZ onboarding tips, Juul's punishment types (all in the glossary notes; cite them from there).

## Rules for every researcher
- Cite a URL for every claim. Give concrete numbers: percentages, seconds, HP multipliers, win rates, player counts,
  dates, patch versions.
- Separate cited findings from inferences. List gaps honestly instead of guessing. Flag vendor-reported figures.
- Never copy or download images. Collect a "see it in action" URL (wiki, article, devlog or video page) for every game example.
- Quotes under 15 words.
- If a site is blocked, say so and try mirrors (archive.org, author pages, GitHub READMEs, liquipedia, fandom wikis,
  Hive Workshop and EpicWar for WC3 maps, Game Developer / Gamasutra archives, GDC Vault free talks).
- Notes structure: per key question, Takeaway / Cited findings / Inferences / Gaps. Then pattern cards found.
  End with Sources.
- Save to the path you are given. Stop at about 25-35 tool calls, then reply with a summary of at most 200 words.
