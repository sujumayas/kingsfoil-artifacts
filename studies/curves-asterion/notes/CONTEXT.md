# Shared context for all ASTERION CURVES researchers

## The user and project
- Indie game dev, Kingsfoil Studios. Small team, a collective of about 5 friends who playtest every build.
  Godot 4 client (desktop and web), Go server. Esen is the designer and lead.
- This is the third study of the series **Curves: difficulty and learning curves**, one Kingsfoil game per study.
  Curves #1 is Hearthguard (co-op hero defense, https://kingsfoil-artifacts.netlify.app/curves-hearthguard) and
  Curves #2 is MatchRPG (match-3 dungeon runner, https://kingsfoil-artifacts.netlify.app/curves-matchrpg).
  Read the §7 card list of both reports before you start (`studies/curves-hearthguard/report.md`,
  `studies/curves-matchrpg/report.md`) so you do not re-research what they covered: the L4D director, Celeste
  assists, Hades God Mode, Risk of Rain 2 difficulty over time, PvZ onboarding, Juul's punishment types, hidden
  mercy, opt-in ladders, mastery tiers. Cite them from those studies' notes when they matter here.
- What is new in this study: a **persistent MMORPG** with no run, no restart and no end. The curve is weeks and
  months long, progression is skill by use, and the cost of failure is a death penalty with a corpse run.
- A second deliverable sits inside the study page: the **Asterion Atlas**, a tab with picture-led cards for every
  creature, item and spell of the game (specified in `ATLAS-SPEC.md`). Researchers do not build it, but they may
  refer to creatures, items and spells by their in-game Spanish names, which the Atlas will explain.

## The game: Asterion
- A 2D top-down tile MMORPG in the spirit of **Tibia 7.x** (2002 to 2005 era), built for a small group of friends,
  in Spanish. Live at https://play.asterion.online. Authoritative Go server, 50 ms tick, whole world in RAM;
  Godot 4 "dumb terminal" client. Persistence in SQLite.
- Source: local checkout at `/Users/esenespinosa/Development/personal/games/mmorpg` (branch main, PR #183 merged,
  2026-09-11 era). Read its `CLAUDE.md` (every design decision, long), `README.md`, `docs/GDD.md` (§6 "The decided
  numeric framework" and §9 decisions log), `docs/systems/*.md` and the Spanish vision doc `docs/vision-es.md`
  (pillars P1 to P6, §2.4 "where slowness lives", §2.5 death calibration). **Never edit that repo.** The GDD can be
  stale in places; the code wins (`server/internal/game/*.go`), and the GDD says so itself.
- Content is data: `content/creatures/*.yaml` (240 creatures across four worlds), `content/items/*.yaml` (369),
  `content/spells/*.yaml` (45), `content/npcs/*.yaml` (83), `content/quests/*.yaml` (36), `content/achievements/`.
  The YAML comments explain the design intent of nearly every entry (in Spanish).
- Worlds and level bands: **Akron** (homeworld, start town La Tortuga Coja, roughly levels 1 to 35), **Isla de
  Ingwen** (35 to 100), **Gorothland** (100+, reached by boat from Ingwen; geography is the level ladder, D147),
  **Boggland** (a fourth world placed beside Gorothland, 88 species). Boats between worlds. 1024×1024 tiles each.
- Progression (from GDD §6 and CLAUDE.md; agent 0 verifies against code):
  - Exp per level: classic cubic `exp(L) = (((L−6)·L + 17)·L − 12) / 6 × 100` (L2 = 100, L8 = 4200).
  - Max HP `145 + 5 × level`, max mana `100 + 10 × level`. No classes, no vocations: "you are what you practise".
  - Four skills trained by use: sword, distance, shielding, fishing. Start at 10. Since D149 (2026-08-30)
    `tries(level→level+1) = base × 1.08^(level−10)` for sword, distance, shielding (fishing keeps 1.1, Tibia's
    number); bases 50/30/100/20. A rung weighs half a Tibia rung in the damage formula through
    `skillRung(L) = 10 + (L−10)/2`. Stated targets: sword 50 in about 14 hours of session, 100 in about 707 hours.
  - Magic level rises with mana spent: `mana_to_next(ml) = 1600 × 1.4^ml` (Tibia's vocation-less value is much
    steeper for knights; 1.4 is "calibrated for 45-minute sessions"). Three spell masters teach all spells for gold.
  - Walk speed `300 + 4 × (level − 1)` against friction 150, quantised to the 50 ms beat, so the walk changes only at
    levels 10, 20, 34 and 51 (then 76, 114). The GDD §6 still says 280/+5 and 5/12/20/31/45; the code wins (01-current-build.md). Combat cadence one attack per 2 s for everyone. Damage narrow-band, mitigation flat.
- Death (pillar P2 "death matters", calibrated in vision §2.5 to "about one session of progress"):
  −10 % experience flat (`deathExpLoss`), level recomputed; skills and magic untouched (7.x takes those too, Asterion
  deliberately does not); the backpack always drops whole onto the corpse; each of the other nine worn slots drops
  independently at 10 % (`gearDropChance`); own corpse lasts 30 min (15 as corpse, 15 as bones), lootable by anyone;
  respawn at the town temple; free full heal at the temple. `TestDeathPenaltyCalibration`: hunting rats (~480 exp/h)
  a death at level ≤ 4 costs about 10 minutes, at level 8 about 52 minutes. Heartstone (piedra de campana): free
  recall to the temple on a 5-minute cooldown, out of combat only, destroyed by death.
- Sessions: the design assumes **30 to 60 minute adult sessions**, not Tibia's 3-hour marathons (vision §tension 2).
  "Slowness lives in travel, progression, economy and discovery; not in combat padding, downtime or UI."
  Anti-compulsion stance (vision §2.3): no daily rewards, no FOMO, progress waits for you.
- Social: parties with exp share (equal split among members who dealt damage, plus a flat 20 %), friends, chat,
  shared depot, a GM. PvP is a designed future, not shipped. Guilds and houses planned.
- Onboarding: optional quest chain "El censo de La Tortuga Coja" (5 steps, 72 exp and 8 gold each) plus a welcome
  card. Hunting contracts (counted hunts) and bosses on Ingwen and Gorothland. Achievements and titles.
- Measurement tools that exist: `server/cmd/balance` (combat simulator: time to kill, death risk, exp/h and gold/h
  per creature, level and kit; `go run ./cmd/balance -skills` prints the skill curve), optional server-side
  telemetry (JSONL events: session, kill, death, level, damage, consume, loot, shop, gold, quest, ferry, equip;
  **off by default on the live server**, so there is no player data for this study), `census/` (counts of saved
  items, no levels), a rankings page. Go 1.26 is installed locally.

## Structural conditions (what a twin must share)
| Condition | Asterion |
|---|---|
| Input | keyboard walk or click-to-move, click to target, typed or clicked spells; slow 2 s combat beat, no reflexes |
| Session | 30 to 60 min, persistent character, no run and no restart |
| Randomness | low: damage bands, loot rolls, spawn timing; no procedural runs |
| Cost of failure | high and recoverable: −10 % exp, bag drops, 10 % per gear slot, 30 min corpse run, free respawn |
| Progression | level by exp (cubic) plus skills by use (geometric), no classes, no cap |
| Social | co-op hunting in a group of about 5, shared world, NPC economy floor, PvP later |
| Platform | desktop and web client, pixel art, text chat |

## Twin candidates (confirm, prune, extend; say why each is kept)
Classic (agent 1 and agent 8): Tibia 7.x (the direct ancestor; agent 8 owns it), Ultima Online (skill by use,
Koster), EverQuest (corpse runs, exp loss, hell levels), RuneScape Classic and RuneScape 2 (skill by use, death
drops), Asheron's Call (vitae penalty), Meridian 59, Diablo II (exp loss and corpse), Wurm Online.
Modern (agent 2): Tibia 8 to 13 (blessings, Twist of Fate, exp loss by level, exercise weapons, Dawnport, charms),
Open Tibia servers and 7.x revivals (Medivia, Tibiantis, RealOTS, exp stages), Old School RuneScape and RS3
(gravestones, Death's office, polls), Albion Online (destiny board, zone-tiered full loot), Project Gorgon,
Mortal Online 2, Pax Dei, Ashes of Creation, Path of Exile and PoE 2 (10 % exp loss debate), Dark Souls and Elden
Ring (recoverable souls as a lineage), Valheim (corpse run, skill by use), Haven & Hearth, EVE Online (clones).
Single-player skill-by-use lineage for the learning curve: Morrowind, Oblivion, Skyrim.

## Scope (weighed in this order)
1. **The long curve**: exp per level, skills by use and magic level as three curves on one axis of hours; where the
   plateaus and dead stretches are; how twins paced months of play; exp stages; what "level" buys (HP, speed, gear gates).
2. **Death penalty and the corpse run**: cost of failure in minutes by level, recoverability, the bag drop, the 30
   minute window, blessings and insurance in the twins, what changed when twins softened or hardened it.
3. **Skill by use**: the learning curve of practising, caps and atrophy, grinding and anti-grind rules (UO GGS,
   Tibia exercise weapons, RuneScape afk training), how skill-by-use feels in a 45-minute session.
4. **Sessions and the small group**: 30 to 60 minute sessions, rested or offline progression, party share,
   level gaps between friends, low population economy, the "expedition" as the unit of play.
Also: onboarding (censo chain, Rookgaard and Dawnport lineage), the no-class decision, gear and level gates
(`min_level` on items, wands at magic level 10/15/20), and how to measure all of it with the telemetry that exists.

## Research principles (series rules)
1. **Structural twins, not genre lists.** Pick reference games by shared conditions (above). Say why each twin was chosen.
2. **Trace lineage.** For every key pattern: where it first appeared, how later games refined it, and why.
3. **Natural experiments are the best evidence.** Patch notes plus player reaction, difficulty reworks, mode
   additions, published telemetry, postmortems, GDC talks, designer interviews. Asterion's own decisions log
   (GDD §9: D10, D38, D57, D87, D113, D137, D149 and others) is a natural experiment set too; agent 0 reads it.
4. **Theory as a lens, not filler.** Flow, Koster, Juul, MDA, loss aversion, power law of practice, Yee and Bartle.
   Use it only where it explains a case.
5. **Efficiency.** The minimum rule, formula or table that produces the feeling. Prefer patterns that are cheap to
   build, tune and test with 5 players and the telemetry that exists.
6. **Record taste.** Fun hypotheses ("players of X should feel Y at hour Z because of pattern P") and
   anti-patterns (ways twins made curves feel unfair, grindy or boring).

## Evidence
Every claim keeps the library's verification tag and also gets an evidence grade:
- Verification: [V] verified from a cited source, [I] inference, [U] unverified or contested, [K] Kingsfoil fact
  (from the Asterion repo).
- Grade (strength): **E1** data or telemetry (published numbers, highscore scrapes, A/B results, our own logs);
  **E2** designer statement (postmortem, GDC talk, interview, official patch note rationale);
  **E3** community consensus (wiki, large forum threads, review aggregates);
  **E4** anecdote (single post, single video).
- Write both, for example `[V, E2]` with the URL. A natural experiment is a change plus the measured or widely
  reported reaction, with the date, the version and the before and after numbers when known.

## Pattern card (the unit every researcher collects)
- Name
- Lineage: first seen -> refined by -> (why)
- Feeling it produces (name the MDA aesthetic)
- Mechanism: the minimal rule, formula or table
- Conditions where it works / breaks
- Evidence (graded) + sources
- Implementation cost (S/M/L) + tuning knobs
- How it maps to Asterion

## Vocabulary
Read the Glossary section of
`/Users/esenespinosa/Development/personal/games/kingsfoil-artifacts/kingsfoil-artifacts/docs/formats/design-curves.md`
before starting. Use its words with its meanings and do not redefine them. Say which kind of DDA (stat, supply,
pacing); name the MDA aesthetic instead of "fun"; name the set when you say sawtooth (here: hunting ground, world,
level band, session); "cost of failure" is always given in minutes lost; "death penalty" is the specific loss.
If a term is missing (candidates: corpse run, exp stages, skill atrophy, rested exp, blessing), add it to your
notes under "Glossary additions" with a one-line meaning and a source.

## Rules for every researcher
- Cite a URL for every claim. Give concrete numbers: percentages, hours, multipliers, level ranges, player counts,
  dates, patch versions.
- Separate cited findings from inferences. List gaps honestly instead of guessing. Flag vendor-reported figures.
- Never copy or download images. Collect a "see it in action" URL (wiki, article, devlog or video page) for every game example.
- Quotes under 15 words.
- If a site is blocked, say so and try mirrors (archive.org, TibiaWiki on fandom, tibia.com news archive,
  RuneScape wiki, UO Stratics or uo.com archives, GDC Vault free talks, Game Developer / Gamasutra archives, Reddit,
  TibiaBR, Tibia-Stats, Guildstats).
- Notes structure: per key question, Takeaway / Cited findings / Inferences / Gaps. Then pattern cards found.
  "Glossary additions" if any. End with Sources.
- Write plainly: no em dashes, no filler, name the number.
- Save to the path you are given. Stop at about 25-35 tool calls, then reply with a summary of at most 200 words.
