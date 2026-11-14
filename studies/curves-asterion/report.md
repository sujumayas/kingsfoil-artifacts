# Asterion difficulty and learning curves: skill by use, the death penalty and the long curve of a Tibia-like MMORPG

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is the third study in our Curves series. Each one takes a Kingsfoil game and asks a narrow question. What made difficulty and learning feel good in older games that share this game's conditions, and what is the smallest set of rules that recreates that feeling here? Curves #1 covered Hearthguard, a co-op hero defense, and built the series glossary and method [K, S1]. Curves #2 covered MatchRPG, a match-3 dungeon runner, and added real player telemetry to the method [K, S2]. Where a pattern was settled there (the Left 4 Dead director, Celeste's assists, Hades God Mode, Risk of Rain 2 difficulty over time, Plants vs. Zombies onboarding, Juul's punishment types, hidden mercy, opt-in ladders, mastery tiers, co-op stat scaling), this study cites those reports and does not research it again.

What is new here is the shape of the game. Asterion is a persistent MMORPG with no run, no restart and no end. The curve is weeks and months long, progression is skill by use, and the cost of failure is a death penalty with a corpse run. Hearthguard's run lasted 25 minutes and MatchRPG's 3. Asterion's sword skill reaches 100 after about 707 hours of play [K, E1, S10].

Asterion in six lines:

1. A 2D top-down tile MMORPG in the spirit of Tibia 7.x (2002 to 2005), in Spanish, built for a collective of about five friends who playtest every build. Live at play.asterion.online [K, S3]. Authoritative Go server, 50 ms tick, Godot 4 client for desktop and web [K, S4].
2. Four worlds. Akron is the homeworld, with the start town La Tortuga Coja and creature bands from level 1 to about 35. Isla de Ingwen covers 35 to 100, Gorothland 100 and up, and Boggland sits beside Gorothland with 88 species. Boats link them, and geography is the level ladder by decision D147 [K, E2, S5].
3. No classes and no cap. Level comes from a cubic exp table copied from Tibia. Four skills (sword, distance, shielding, fishing) rise by use. Magic level rises with mana spent. "You are what you practise" [K, S5, S6].
4. Death takes 10 % of total experience, drops the whole backpack onto the corpse and rolls each of nine worn slots at 10 %. Skills and magic level are untouched. The corpse lasts 30 minutes and anyone can loot it. The character respawns at the town temple, which heals for free [K, E1, S4].
5. The design assumes adult sessions of 30 to 60 minutes, not Tibia's three-hour marathons. "Slowness lives in travel, progression, economy and discovery; not in combat padding, downtime or UI." No daily rewards, no FOMO, progress waits for you [K, E2, S6].
6. Combat is one attack every 2 s for everyone, narrow damage bands and flat mitigation. Parties split kill exp equally among members who dealt damage, plus a flat 20 % [K, E1, S4].

This study has no player telemetry. Asterion's server can record a full event stream (session, kill, death, level, damage, consume, loot, shop, gold, quest, ferry, equip) but the flag is off on the live server, so there is no `02-telemetry` note and no aggregates file [K, E1, S8]. In its place we used the game's own balance harness, `server/cmd/balance`, which drives the real combat code on a synthetic clock. Three runs (8 levels, 15 kits, 183 creatures, 60 trials each, plus a skill curve and an economy pass) give the exp per hour, time to kill, death risk and gold per hour that every curve in §4 rests on [K, E1, S7, S10]. The harness models a fight and nothing else. Travel, food, potions, groups and geography are outside it, so every hour it prints is a floor on real hours and every death cost is a floor on real minutes.

A second deliverable sits inside this page. Every creature, item and spell named in the text has a card in the Asterion Atlas tab, reached from the tab strip under the hero or with `#atlas` in the address. The Atlas holds 240 creatures (48 on Akron, 44 on Ingwen, 20 on Gorothland, 88 on Boggland, 40 with no spawn), 369 items and 45 spells, each with its role on the curve and its numbers [K, E1, S11]. Spanish in-game names stay as they are in the game: rata parda, oso pardo, enano aldeano, agallas rojas, piedra de campana, La Tortuga Coja.

Four facts in the brief were wrong and the research corrected them, with the lead's own checks [K, S4; V, S28, S33, S88]. Tibia's offline training arrived in July 2012, not 2011. Exercise weapons arrived on 24 April 2018, not in 2019. Tibia's starter island changed again on 21 October 2025, when Newhaven replaced Dawnport. And the brief's walk speed numbers (280 base, +5 a level, beats at 5, 12, 20, 31 and 45) were the GDD's stale copy. The code says 300, +4, and beats at 10, 20, 34 and 51 [K, E1, S4]. §16 lists the rest.

---

## 1. Executive summary

1. **The exp curve is cubic on the bar and nearly flat on the clock.** Since decision D69 (31 July 2026) a creature's exp is derived from the same cubic, `exp = (exp(L+1) − exp(L)) / 100` with `L` its farm level, so a hundred kills of your own band's creature is one level at any level [K, E1, S4, S5]. In the harness a character fighting its band creature levels in 0.26 h at level 1, 0.41 h at level 8, 0.74 h at 25, 0.56 h at 50 and 1.06 h at 120 [K, E1, S10]. The weeks and months the vision asks for are not in the exp table. They have to come from travel, food, death and finding the next band, none of which the harness models [I].

2. **Death cost grows linearly with level while hours per level do not.** Loss is a flat 10 % of total exp (`corpse.go:43`), and because exp(L) is about L/3 times the step to the next level, a death at the bottom of level L costs about L/30 of the hours one level takes [K, E1, S4]. On the harness clock that is 5 minutes at level 8, 31 at level 30, 53 at 50, 176 at 100 and 249 at 120. With a 3× overhead for walking, eating and looting it is 14, 92, 158, 528 and 747 minutes [K, E1, S10; I on the 3×]. The design's "about one session" holds to roughly level 30 to 50 and is three to twelve sessions past level 80. Tibia met the same wall and bent the curve in update 8.41 (2009), exactly where a death started costing hours [V, E2, S21].

3. **The skill ladder is one slope of 1.08, and it is priced.** Since D149 (30 August 2026) `tries = base × 1.08^(level − 10)` with bases 50, 30 and 100 for sword, distance and shielding, and every combat reader sees half a rung per level through `skillRung = 10 + (L − 10)/2` [K, E1, S4]. The harness gives sword 50 in 14.4 hours of session, 70 in 69.6 hours and 100 in 707 hours. Shielding costs exactly twice sword at every rung. A Tibia knight at 1.1 needs 2,656,011 total tries for sword 100 against Asterion's 636,150, about four times as many [V, E1, S16; K, E1, S10].

4. **Magic level is the steepest curve in the game and gold is its accelerator.** `mana_to_next = 1600 × 1.4^ml`, the Tibia paladin's constant for everyone [K, E1, S4; V, E1, S16]. Food regen gives 600 mana an hour, so magic level 5 is 29 fed hours and level 10 is 186. A mana potion is 60 gold for 55 to 75 mana, so magic level 10 bought in potions is about 103,000 gold. The wand gates at magic level 10, 15 and 20 therefore cost 186, 1,445 and 7,800 fed hours, or 103,000, 800,000 and 4.3 million gold, before the wands' own 1,200, 8,000 and 24,000 gold prices [K, E1, S10, S13].

5. **The corpse clock is as long as the median session.** The own corpse lasts 15 minutes as a corpse and 15 as bones (`corpse.go:29-30`) [K, E1, S4]. The only published session medians for persistent worlds are about 26 minutes in Lineage II and under 10 minutes for half of one WoW realm's sessions [V, E1, S149]. Tibia 7.x ran the same 30 minutes against three-hour sessions. Asterion kept the window and shrank the session, so a death after a session's midpoint produces a corpse the player cannot reach before logging off [I].

6. **The death penalty's three knobs have not moved since July. Everything around them has.** `deathExpLoss` 0.10 (13 July), `gearDropChance` 0.10 and the 30-minute corpse (D38, 28 July) stand. The heartstone cooldown went from 30 to 5 minutes (D113), the temple heals for free (D30), food HP regen doubled, and a level 1 character walks a tile in 500 ms instead of 600 (D137, D138) [K, E1, E2, S5]. The sting was kept and the recovery was made faster. Nine of the fourteen curve decisions in the log came from one playtest sentence, four from the harness, none from a measured player reaction [K, E2, S5].

7. **Every twin that touched its death penalty only softened it, and each softening became the floor.** OSRS stretched its ground timer from 3 minutes (2013) to 60 (2015), then in June 2020 polled its players, who chose a 15-minute grave with a legible fee and "a small increase in risk" [V, E2, S88]. RS3 cut its reclaim fee from 15 % to 0.1 % between 2015 and 2023 [V, E3, S77]. FFXI capped the loss at 2,400 exp in 2005 [V, E2, S116]. Tibia bent its percentage in 2009 [V, E2, S21]. The one counter-example is the OSRS poll, and it worked because the fee was a table players could read [I].

8. **The first death is in hour two or three, from the creature standing next to the right one.** The censo chain pays 360 exp and 40 gold across five steps and lands the player at level 3 inside the first session [K, E1, S13]. On the band ladder the character is level 5 to 7 by minute 120. At level 5 in leather, oso pardo (band 12, spawned six times on Akron) kills the harness character 100 % of the time, while esqueleto (band 10) is the safe target [K, E1, S10]. The first playtest reported "the early levels punish one bad fight for a very long time". The answer (D30) was a free temple heal, not a softer oso pardo [K, E2, S5]. Every classic twin switched the penalty on only after the first hours: EverQuest below level 11, Asheron's Call below 5, Diablo II on Normal, Dawnport below 8 [V, E3, S65, S79, S81, S27].

9. **The same minutes framed as a bonus are welcomed and framed as a penalty are hated.** WoW's beta cut exp 50 % after a few hours and testers revolted. Blizzard doubled every exp requirement and shipped the same curve as rested exp at 200 % [V, E2, S111, S112]. Prospect theory says losses weigh about twice as much as equal gains [V, E1, S139]. Asterion keeps the loss framing on purpose (pillar P2, "death matters") [K, E2, S6]. If playtests show the level 8 cost reads as unfair, change the frame before the number [I].

10. **Four written numbers are stale against the code, and nothing is measured.** GDD §6 still lists skill multipliers 1.8, 1.8 and 1.6 (code 1.08), base speed 280 with +5 (code 300 with +4), "35 spells" (45 files), and the calibration test prices a rat at 8 exp when D69 made it 2 [K, E1, S4, S5, S9]. The test still passes because its criterion is "under one hour at level 4". Telemetry is a flag, off by default, and the events that exist would answer every question in this study for five players within a few sessions [K, E1, S8].

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read, such as a wiki page, patch note, designer talk, paper or article. "Snippet" or "blocked" in the source list means only a search excerpt was read. |
| **[I]** | Inference or design proposal by the author or a researcher. Untested unless it says "model" or "harness", and then tested only in the balance harness or the curve lab, not in play. |
| **[U]** | Unverified or contested. A lead, a single post, a blocked page, or sources that disagree. |
| **[K]** | Kingsfoil fact from the Asterion repo at main 8836106a (PR #183, 11 September 2026), its docs, or three runs of its balance harness. The text gives file:line relative to that repo. |

| Grade | Meaning |
|---|---|
| **E1** | Data or telemetry. Published numbers, census figures, stats sites, our own harness output and code reads. Code is E1 because it is the rule. |
| **E2** | Designer statement. Postmortem, GDC talk, interview, dev blog, the rationale in an official patch note or in Asterion's own decisions log. For papers, the authors' argument rather than their measured result. |
| **E3** | Community consensus. Wikis, large forum threads, review aggregates, press summaries. |
| **E4** | Anecdote. One post, one video, one answer. |

Ratings on each pattern card are author judgement, 1 to 5, in this order:

- **Fun impact.** How much the pattern should change what players feel in Asterion, named as an MDA aesthetic where possible.
- **Evidence.** How strong and how direct the evidence is that it worked in a twin.
- **Cheapness.** How little code and tuning it costs. 5 is a one-line constant or a YAML column.
- **Fit.** How well it matches Asterion's conditions: a slow 2 s beat, 30 to 60 minute sessions, low randomness, a high but recoverable cost of failure, five friends on a shared world, desktop and web.
- **Testability.** How easily five players, the harness and the telemetry that exists can show whether it works.

[S#] points to §17. File paths are relative to the Asterion repo. "Band creature" means a creature whose `max_farm_level` is at or just above the player's level. "Band ladder" is the harness's median exp per hour against the safe band creatures at each level with a realistic kit, interpolated between the eight levels run. "Band ×3" multiplies the harness's 10 s per-kill overhead into a session with walking, eating and looting; the 3 is a guess the first telemetry pull will replace. Hours of "session" for skills assume half the time swinging, the harness default. Minutes lost by a death are always exp lost divided by exp per hour at that level, the series' cost of failure in a persistent game.

Terms this study adds to the series glossary, one line each:

- **Corpse run.** The walk from the respawn temple back to one's own corpse to recover the bag and any dropped slot, inside the corpse window (30 minutes here). A setback punishment with distance and minutes lost [V, E2, S62; K, S4].
- **Death cost (minutes).** Exp lost divided by the player's own exp per hour, plus recovery time and the value of items lost at the player's gold per hour. The series' cost of failure for a persistent game [K, S9].
- **Exp stages.** A per-level-band multiplier on exp gained, the Open Tibia pacing knob. It rescales exp per hour and the price of a death by the same factor [V, E1, S44].
- **Exp debt.** A death cost owed and repaid from future gains instead of removed from the bar. Same minutes as exp loss, opposite reference point [V, E3, S79, S122].
- **Blessing.** A prepaid, per-level gold purchase consumed on death that reduces exp loss and, since Tibia 8.41, item loss. Insurance priced to level [V, E3, S20].
- **Skill rung.** The combat weight of a skill level, `10 + (L − 10)/2` in Asterion, as opposed to the level shown on the sheet [K, S4].
- **Framing flip.** Presenting a rule the opposite way without changing its math. WoW's beta fatigue became rested exp [V, E2, S111].
- **Friction factor.** Measured session exp per hour divided by the harness's mechanical exp per hour for the same level, kit and creature. Travel, respawn waits and potions live in the gap [I].
- **Newbie fix.** A level below which death carries almost no penalty. Every commercial world Klastrup surveyed had one by 2007 [V, E2, S135].
- **Beat boundary.** A level at which the quantised step duration changes (10, 20, 34, 51, 76, 114 here) [K, S4].

---

## 3. Design intent and fun hypotheses

Asterion's vision document says it in six pillars. Death matters (P2). Slowness lives in travel, progression, economy and discovery, never in combat padding or UI. Death is calibrated to "about one session of progress". There are no daily rewards and no FOMO; progress waits for you [K, E2, S6]. The decisions log adds a rule of its own, move the price or move the value, never both (D87) [K, E2, S5]. These hypotheses turn that intent into claims the §13 protocol can check with five players [I].

| # | Players should feel | When | Because of | How we test it |
|---|---|---|---|---|
| H1 | The first death is a lesson, not a wall | Hour two or three, levels 5 to 8, two screens from La Tortuga Coja | E1 newbie fix, C5 post-death grace | Death cost (M3) under 15 minutes at level 8 or below; no tester quits within 10 minutes of a first death; survey item 9 names the creature |
| H2 | Death costs about one session, at every band they hunt | Any death from level 8 to 50 | C1 bent percent, C3 recoverable share | M3 median between 30 and 90 minutes at every band the five hunt; today the harness says 14 at level 8 and 158 at 50 |
| H3 | Visible growth every session | The last ten minutes of a 45-minute session, from session 1 to 50 | B1 one slope with half rungs, B2 guaranteed rung, E2 milestone-dense levels | Rungs per session (M9) median at least 1 across level, skill and magic at every level under 50; survey item 10 "visible progress" yes in 4 of 5 |
| H4 | The corpse run is a group event with fiero on the pickup | Within 30 minutes of a death, with a friend online | C3 recoverable share, C4 paused timer, D2 flatten the party share | Corpse recovery rate (M4) at least 4 of 5 deaths; share of corpses opened by a friend who returned the bag |
| H5 | Dying never ends the night | The ten minutes after respawn at the temple | C4 paused timer, C5 grace, E2 a death screen that names the cause | Quit-after-death (M5) in fewer than 1 of 5 players per week; time to retry under 5 minutes median |
| H6 | The friend who plays once a week stays in the party | Weeks 3 to 6, when one friend plays ten times more than another | D1 rested tries pool, D2 flattening instead of a 2/3 gate | Level gap (M11) under 10 at week 6; party exp per member per hour at least solo for the lower member |
| H7 | Each world is a step up and a new place, not a cliff | The first session on Ingwen (about level 35) and on Gorothland (about 100) | A1 flat hour per level, A2 exp stages by world, E2 boat and gear gates | Felt difficulty 5 or 6 on the first Ingwen session and 3 or 4 a week later; M6 exp per hour on Ingwen within 2× of Akron at the same band |
| H8 | Slowness lives in travel and discovery, not in the hour per level | Sessions 10 to 50 | A1 derived exp, F1 friction factor | Friction factor between 0.5 and 0.7 at every ground the five use; under 0.4 flags a travel problem, not a creature problem |
| H9 | The team decides from numbers, not from one sentence | Every curve change after week 6 | F1 telemetry beside the harness | Every decision in GDD §9 after the protocol cites a metric from M1 to M11 and a harness run |

---

## 4. Our current build: minute 5, 30 and 120

This section comes from one note, `01-current-build.md`, which read the repo at 8836106a, its GDD §6 and §9, the vision document and the content YAML, and ran the balance harness three times: `-skills`, `-levels 1,5,8,15,25,50,80,120 -trials 60` and `-economy -trials 40` [K, E1, S4, S7, S10]. Code reads are E1 because they are the rules. Harness output is E1 on the rules and [I] on its assumptions, which are a fight started at full HP beside the creature, 10 s of overhead per kill, half the session spent swinging and a 240 s fight limit (`balance.go:128-129`). It runs melee only, so distance and wand characters have no ladder yet.

### The exp curve: cubic on the bar, flat on the clock

The exp table is Tibia's cubic, `exp(L) = (((L − 6)·L + 17)·L − 12) / 6 × 100` with integer division (`stats.go:15-25`). Level 2 is 100, level 8 is 4,200, level 50 is 1,847,300 and level 100 is 15,694,800, the same values Tibia and Tibiantis publish [K, E1, S4; V, E1, S15, S45]. Max HP is `145 + 5L`, max mana `100 + 10L` (`stats.go:46`, `game.go:280`). Max level is 255, one byte on the wire, not a design number [K, E1, S4].

| Level | Exp | Step to next | Max HP | Max mana | Speed | Beat ms |
|---|---|---|---|---|---|---|
| 1 | 0 | 100 | 150 | 110 | 300 | 500 |
| 5 | 800 | 700 | 170 | 150 | 316 | 500 |
| 8 | 4,200 | 2,200 | 185 | 180 | 328 | 500 |
| 10 | 9,300 | 3,700 | 195 | 200 | 336 | 450 |
| 20 | 98,800 | 17,200 | 245 | 300 | 376 | 400 |
| 35 | 601,800 | 56,200 | 320 | 450 | 436 | 350 |
| 50 | 1,847,300 | 117,700 | 395 | 600 | 496 | 350 |
| 80 | 7,915,800 | 308,200 | 545 | 900 | 616 | 250 |
| 100 | 15,694,800 | 485,200 | 645 | 1,100 | 696 | 250 |
| 120 | 27,393,800 | 702,200 | 745 | 1,300 | 776 | 200 |
| 150 | 54,042,300 | 1,102,700 | 895 | 1,600 | 896 | 200 |

The cubic is only half the curve. Decision D69 (31 July 2026) replaced 36 hand-chosen creature exp values with a derived one: `exp = (exp(L+1) − exp(L)) / 100` where `L` is the creature's `max_farm_level`, a sheet column the server never reads (`docs/GDD.md:411`, `content/creatures/rata_parda.yaml:7-8`) [K, E2, S5]. A rata parda has farm level 3 and gives 2 exp; agallas rojas has farm level 105 and gives 5,357; Goroth el último, the highest creature, has farm level 175 and gives 15,052 [K, E1, S11]. A hundred kills of your band's creature is one level, at any level. The result is a table that is cubic on the exp bar and nearly flat on the clock.

| Reach level | Band ladder (h) | Band ×3 (h) | At the harness's 1,500 exp/h (h) | 45-minute sessions (band ×3) |
|---|---|---|---|---|
| 5 | 0.7 | 2.2 | 1 | 3 |
| 8 | 1.7 | 5.2 | 3 | 7 |
| 10 | 2.5 | 7.6 | 6 | 10 |
| 20 | 7.2 | 21.6 | 66 | 29 |
| 35 (Ingwen) | 16.4 | 49.3 | 401 | 66 |
| 50 | 24.4 | 73.2 | 1,232 | 98 |
| 80 | 43.8 | 131.5 | 5,277 | 175 |
| 100 (Gorothland) | 60.3 | 181.0 | 10,463 | 241 |
| 120 | 79.9 | 239.8 | 18,263 | 320 |
| 150 | 115.8 | 347.4 | 36,028 | 463 |

Hours for one level at the key levels: 0.39 h at level 10, 0.56 at 30, 0.56 at 50, 0.91 at 100 on the band ladder [K, E1, S10]. The third column is what the same cubic costs at a fixed 1,500 exp an hour, the number the harness was written with and roughly what a level 8 character earns on Akron with walking. The gap between the two columns is the whole question of this study. The content is tuned so that each band's creature is a flat hour; the weeks and months in the vision (§2.4, `docs/vision-es.md:81-87`) have to come from the overhead between kills [K, E2, S6; I].

@@FIG:expcurve@@

### Skills by use: one slope of 1.08

Four skills start at 10 and rise by tries. Sword counts one try per melee swing, distance one per shot, hit or miss, shielding one per melee hit received including a clean block since 30 August, fishing one per hook and two per catch (`skills.go:30-45`, `docs/GDD.md:223,494`) [K, E1, S4]. Tries to the next rung are `base × mult^(L − 10)` with bases 50, 30, 100 and 20 and multipliers 1.08, 1.08, 1.08 and 1.1 (`skills.go:101-106,171-176`). Every combat reader sees `rung(L) = 10 + (L − 10)/2`, half a Tibia rung per level; fishing reads the raw level (`skills.go:119-121`) [K, E1, S4]. The skill ladder is the one curve the log has moved three times: 2.0/2.0/1.5 to 1.8/1.8/1.6 on 28 July (F-003), a knee at 40 on 3 August (D87), one slope of 1.08 with half rungs on 30 August (D149) [K, E2, S5].

| Skill level | Sword tries this rung | Sword cumulative | Sword h of session | Distance h | Shielding h | Fishing h |
|---|---|---|---|---|---|---|
| 20 | 99 | 720 | 0.8 | 0.5 | 1.6 | 0.4 |
| 30 | 215 | 2,277 | 2.5 | 1.5 | 5.1 | 1.3 |
| 40 | 465 | 5,648 | 6.3 | 3.8 | 12.6 | 3.6 |
| 50 | 1,005 | 12,932 | 14.4 | 8.6 | 28.8 | 9.8 |
| 60 | 2,171 | 28,663 | 31.8 | 19.1 | 63.7 | 25.8 |
| 70 | 4,687 | 62,631 | 69.6 | 41.7 | 139.2 | 67.4 |
| 80 | 10,120 | 135,967 | 151.1 | 90.6 | 302.2 | 175.2 |
| 90 | 21,849 | 294,306 | 327.0 | 196.2 | 654.1 | 454.9 |
| 100 | 47,171 | 636,150 | 706.8 | 424.1 | 1,413.7 | 1,180.4 |
| 120 | 219,866 | 2,967,521 | 3,297.2 | 1,978.3 | 6,594.6 | 7,942.7 |

Hours of session assume half the time swinging at one swing per 2 s, 900 tries an hour (`balance.go:129`) [K, E1, S7]. Hours double every nine rungs. Read against the level table, a character that reaches level 35 in 16 to 49 hours has sword 50 to 62 and shielding 40 to 50. The harness's own estimate (`SkillAtFrom`, `balance.go:136-157`) gives a level 30 character sword 86, because 368,300 exp at 1,500 an hour is 245 hours of play; on the band ladder it is 14 hours and sword 50. The creature roster was sized against skill about equal to level (`skills.go:97-100`), so the two readings differ by 36 rungs [K, E1, S10; I on the consequence].

@@FIG:skilltries@@

### Magic level: the steepest curve, paid in gold

Magic level counts mana spent, `mana_to_next(ml) = 1600 × 1.4^ml` (`skills.go:249-251`), Tibia's paladin constant applied to everyone; D10 rejected the vocation-less 4.0 because "the pillar is slow, not impossible" in 45-minute sessions [K, E2, S5; V, E1, S16]. Food regen gives 1 mana per 6 s, 600 an hour (`game.go:157`). A vara de la chispa fires 3 mana every 2 s, 5,400 an hour. A poción de maná costs 60 gold at Tomás for 55 to 75 mana (`tomas.yaml:110`) [K, E1, S4].

| Magic level | Mana for this level | Cumulative | Hours fed, no potions | Hours at the wand rate | Gold if potion-fed |
|---|---|---|---|---|---|
| 1 | 1,600 | 1,600 | 2.7 | 0.3 | 1,477 |
| 5 | 6,146 | 17,511 | 29.2 | 3.2 | 16,164 |
| 6 (Maera's ceiling) | 8,605 | 26,116 | 43.5 | 4.8 | 24,107 |
| 8 (Ubbo's floor) | 16,866 | 55,029 | 91.7 | 10.2 | 50,796 |
| 10 (first wand) | 33,057 | 111,698 | 186.2 | 20.7 | 103,106 |
| 11 (last spell) | 46,280 | 157,978 | 263.3 | 29.3 | 145,826 |
| 15 (second wand) | 198,000 | 867,175 | 1,445 | 161 | 800,469 |
| 20 (third wand) | 1,338,692 | 4,681,414 | 7,802 | 867 | 4,321,305 |

Hours double every two magic levels. The three masters teach 42 lessons: Maera 17, the first several free then 25 to 30 gold; Vero 18 at 60 to 200 gold; Ubbo 7 at 400 to 1,000 gold, five requiring the small version of the spell (`content/npcs/maera.yaml`, `vero.yaml`, `ubbo.yaml`) [K, E1, S4]. By `min_magic_level` the 45 spells sit at 1 (6 spells), 2 (2), 3 (3), 4 (8), 5 (5), 6 (7), 7 (3), 8 (3), 9 (3), 10 (3) and 11 (1) [K, E1, S11]. Gold is the accelerator and the risk. Ten creatures drop cristal, a 10,000-gold coin; cochinilla farolera (band 20) drops it at 20 % for 1 to 2, an expected 3,000 gold a kill, which would pay for magic level 10 in 35 kills [K, E1, S10]. It lives on Ingwen, which the harness does not know.

@@FIG:magiclevel@@

### The walk beat: the levels you can feel

Walk speed is `300 + 4 × (L − 1)` against friction 150, and a step lasts `ceil(1000 × 150 / speed / 50) × 50` ms, a whole number of 50 ms ticks (`game.go:89,100,123`) [K, E1, S4]. So the walk changes at six levels and nowhere else.

| Levels | Speed | Beat per tile | Tiles per minute |
|---|---|---|---|
| 1 to 9 | 300 to 332 | 500 ms | 120 |
| 10 to 19 | 336 to 372 | 450 ms | 133 |
| 20 to 33 | 376 to 428 | 400 ms | 150 |
| 34 to 50 | 432 to 496 | 350 ms | 171 |
| 51 to 75 | 500 to 596 | 300 ms | 200 |
| 76 to 113 | 600 to 748 | 250 ms | 240 |
| 114 to 175 | 752 to 996 | 200 ms | 300 |

The botas de siete leguas add 55 speed at level 15 for 2,500 gold, sized to cross exactly one beat at levels 15 to 30 (`docs/GDD.md:211`, `tomas.yaml:10`) [K, E1, S4]. Tibia quantises the same way, to 50 ms through tile friction, with base speed `109 + level` since 9.8 [V, E1, S39]. A level 1 character crosses the 459 steps to step 7 of the black iron chain in 3.8 minutes; a level 51 in 2.3 [K, E1, S10]. The wishlist item F-095 ("se siente, pero podría ser un poquito más notorio") found that the beat boundaries, not the constant, make a level felt [K, E2, S14]. Between boundaries a level buys 5 HP and 10 mana against a pool of `145 + 5L`, under 2 % each past level 45 [I].

@@FIG:walkbeat@@

### The death penalty: L/30 of an hour per level

Death removes 10 % of total exp and recomputes the level; HP and mana refill; skills, tries and spent mana are untouched (`corpse.go:43,364-383`). The container slot always drops whole; each of the other nine worn slots drops independently at 10 %; quest-sealed pieces never roll (`equipment.go:473,486-505`). With nine slots at 10 %, 39 % of deaths lose no gear and most of the rest lose one piece. The own corpse lasts 900 s plus 900 s as bones; a creature corpse 4 plus 4 minutes; anyone may loot either (`corpse.go:29-30,69-74`). Respawn is at the town temple, quest items are destroyed, `reset_on_death` chains reset (`corpse.go:385-390`). The heartstone (piedra de campana) is free from Sila, recalls to the temple out of combat on a 5-minute cooldown and is destroyed by death (`recall.go:43,61,117`). The temple heals HP and mana to full for nothing (`npc.go:234-249`) [K, E1, S4].

`TestDeathPenaltyCalibration` prices a death at about 10 minutes at level 4 and 52 at level 8 while hunting rats at 480 exp an hour (`phase5_test.go:36-57`) [K, E1, S9]. The harness prices the same deaths on real creatures.

| Level | Exp lost (bottom of level) | Minutes at 480 exp/h (the test) | Band ladder | Band ×3 | At 1,500 exp/h |
|---|---|---|---|---|---|
| 4 | 40 | 5 (10 at the top, the test's first point) | 1 | 4 | 2 |
| 8 | 420 | 52 (the test's second point) | 5 | 14 | 17 |
| 10 | 930 | 116 | 6 | 18 | 37 |
| 20 | 9,880 | 1,235 | 21 | 62 | 395 |
| 30 | 36,830 | 4,604 | 31 | 92 | 1,473 |
| 50 | 184,730 | | 53 | 158 | 7,389 |
| 80 | 791,580 | | 116 | 347 | 31,663 |
| 100 | 1,569,480 | | 176 | 528 | 62,779 |
| 120 | 2,739,380 | | 249 | 747 | 109,575 |

Dying at the top of a level costs up to twice the bottom figure; the test calls this "the classic 7.x sting for banking exp" [K, E1, S9]. The shape is the point. Because exp(L) is about L/3 times the step to the next level and a level is a flat hour, a death costs about L/30 of an hour-per-level, a coffee break at level 8, a session at level 50, a weekend at level 120 [I]. The "one session" target of vision §2.5 is a moving target under a flat percent. Tibia's own 8.41 formula, `((L + 50)/100) × 50(L² − 5L + 8)` above level 23, is drawn beside it in the figure [V, E1, S19, S21].

@@FIG:deathcost@@

### Worlds, bands and the bestiary

Creatures are spread evenly across 175 levels of band; the worlds are not. The 240 creature files give 19 species in band 1 to 10, 20 in 11 to 20, 24 in 21 to 35, 38 in 36 to 50, 16 in 51 to 70, 42 in 71 to 100, 41 in 101 to 130 and 40 in 131 to 175 [K, E1, S10]. Spawn entries: Akron 103 entries of 24 species in bands 0 to 90, Ingwen 197 entries of 44 species in bands 10 to 120, Gorothland 381 entries of 29 species in bands 1 to 175, Boggland 428 entries of 88 species in bands 75 to 175 (`maps/spawns.json`, `maps/worlds/*`) [K, E1, S4]. Akron's most spawned creatures are rata parda (11 spawns), troll de la cantera and esqueleto (9 each), araña de cueva (8) and lobo cinza (7). Thirty-three creatures are flagged boss in the Atlas and 40 have no spawn at all, most of them quest mini-bosses such as la tejedora de la sima, ordo el capataz and ulric del cinto rojo [K, E1, S11].

The harness finds two things on its first pass. Death risk is a cliff, not a slope. A creature either kills the harness character 0 % or 100 % of the time, with very few in between, because mitigation is flat and damage bands are narrow (D8) [K, E1, S10; I]. And at every level there is one safe creature that out-earns the band by two to five times. Enano aldeano (HP 120, damage 4 to 5, farm level 40, exp 742) is the best exp per hour for every kit from level 1 to 25 and kills nobody [K, E1, S10]. It lives on Gorothland.

| Level | Kit | Safe creatures / always die (of 183) | Best exp/h (creature) | Best band creature (farm level, exp/h) | Notable risks |
|---|---|---|---|---|---|
| 1 | inicial | 7 / 174 | 1,350 (sapo de cueva) | lobo cinza (5, 914) | esqueleto 20 %; oso pardo, troll de la cantera 100 % |
| 5 | cuero | 18 / 154 | 11,405 (enano aldeano) | esqueleto (10, 4,617) | oso pardo 100 % |
| 8 | cuero | 37 / 141 | 29,631 (enano aldeano) | arquero goblin (14, 12,801) | berserker orco 67 %; comehuesos 100 % |
| 15 | raben | 84 / 96 | 123,800 (ordo el capataz, boss) | vigía de hueso (18, 29,982) | none in band |
| 25 | campanas | 99 / 82 | 166,498 (ordo el capataz) | cerdoso el porfiado (30, 68,202) | none in band |
| 50 | juramento | 143 / 32 | 588,777 (el invocador) | la tejedora de la sima (50, 254,486) | none in band |
| 80 | banda C | 143 at 10 % | 491,610 (el ojón) | el ojón (86) | one band creature always kills |
| 120 | banda D | 6 of 11 band safe | 827,470 (abrojo naranja) | abrojo naranja (120) | reptante del umbral, araña de sebo, coronado de púas 100 % |

The level 15 shop kit already kills Akron's named bosses, and Akron has nothing left to threaten a level 25 in its shop kit. Ingwen's 35 is a soft wall by geography, not by danger [I].

@@FIG:bestiary@@

### Gear and magic gates

131 of the 369 items carry a `min_level`, and 61 of those sit between levels 11 and 20: the raben tier at 15, the boots at 15, the campanas tier at 20 and 25 [K, E1, S10]. Past 35 there are 18 gated items in 85 levels: fosas 37, juramento 40, espada glacial 55, hoja de ámbar 62, colmillo del sol 70, filo de amatista 78, mandoble de jade 86, colmillo del invierno and grebas de cristal at 100, devoradora carmesí at 120 [K, E1, S11]. A character changes gear five times between 36 and 120, so the power curve there is almost all skill rungs and HP, and felt progression has to come from the creature roster and the worlds [I]. Wands gate on magic level, not character level: vara de la chispa at 10 (1,200 gold at Maera), vara del ojo carmesí at 15 (8,000 at Vero), vara del oráculo at 20 (24,000 at Ubbo); the two high gates were lowered from 25 and 50 on 11 September [K, E1, S13]. Gold on Akron at levels 1 to 8 is 450 to 4,100 an hour against a leather set at 210, a bag at 20, potions at 45 and 60, boots at 2,500 and the first wand at 1,200 [K, E1, S10].

@@FIG:gearladder@@

### Minute 5, 30 and 120

**Minute 0 to 5.** A welcome card (75 s, closes on "Ya voy"), say `censo` to Elba in the temple, walk to the spot south of town, hand in: 72 exp and 8 gold (`docs/systems/onboarding.md`, `content/quests/censo_tortuga_coja.yaml`) [K, E1, S13]. A rata parda is 15 HP and 1 to 3 damage, 8.8 s to kill with the starting sword and shield, and 34 rats fit in one HP bar at level 1. The walk beat is 500 ms. The MDA aesthetic is Discovery with Submission. Follow the chain, learn the town [I].

**Minute 30.** The five censo steps pay 360 exp and 40 gold, level 3 with 40 to spare toward level 4 (400). Step 3 sends the player to Tomás for a torch (10 gold), step 5 to Sila for the heartstone. The leather set is 210 gold, the bag 20, meat 8 gold for 180 s of regen and 60 HP (`tomas.yaml:10,110-112`, `game.go:150-156`). At 450 gold an hour from rats, leather is a half-hour purchase [K, E1, S10, S13].

**Minute 120.** On the band ladder the character is level 5 to 7 (800 to 2,800 exp). At level 5 in leather, oso pardo (band 12, six spawns on Akron) kills the harness character 100 % of the time two screens from town; esqueleto (band 10) is the safe target and was itself a 20 % death at level 1 [K, E1, S10]. The first death costs 80 to 280 exp (10 to 20 minutes), the bag, a 10 % roll on each worn slot and a walk of at most 4 minutes at the 500 ms beat; the corpse waits 30 minutes; the temple heals for free; the dead character carries a four-slot Saco del Templo until a bag is bought [K, E1, S4]. This is the first Challenge beat and the first Fellowship moment if a friend walks the corpse run with you [I]. It is also the cliff the first playtest named ("the early levels punish one bad fight for a very long time", `docs/GDD.md:372`), which D30 answered with a free heal and faster food rather than a softer oso pardo [K, E2, S5].

@@FIG:onboarding@@

### Session 1, 10 and 50

**Session 1 (45 min).** Level 3 to 4, censo done, torch and heartstone in hand [K, E1, S10].

**Session 10 (7.5 h).** Level 10 to 15 on the band ladder, 8 to 10 with the 3× overhead; sword 40 to 47; the first beat change (level 10, 450 ms) arrives here; Maera's free lessons and Aliento vital at magic level 1 (1,600 mana, 2.7 fed hours) [K, E1, S10; I].

**Session 50 (37.5 h).** Level 28 to 45 on the band ladder, 25 to 30 with 3×; Ingwen's 35 falls between session 40 and 65; sword 60 to 65; magic level 5 to 6 on food alone, 8 if about 50,000 gold went into potions [K, E1, S10; I]. By now the player has left the content the design documents describe in detail, and the gear ladder has five rungs left. Sessions 10 to 50 are Challenge with a thin Expression layer [I].

### Asterion's own natural experiments

Fourteen dated changes in the decisions log touch the curves; §6 dates them all and §9 grades three. Nine came from a playtest sentence, four from the harness, one from a bug measurement. Every one moved a single constant and left the others, which is D87's stated rule, "move the price or move the value, never both" (`skills.go:43-45`) [K, E2, S5]. The five that move the curves most:

| Id | Date | What changed | Why (the designer's stated reason) | Before and after |
|---|---|---|---|---|
| D9 | 13 Jul 2026 | Death = flat 10 % exp, corpse, temple respawn; skills and mana spared | Calibrated to "about one session" rather than to a percent | 10 %; 10 min at level 4, 52 min at level 8 at 480 exp/h |
| D30 | 26 Jul 2026 | Temple heals free; HP regen 6 s to 3 s per point | First group playtest: early levels punish one bad fight for a long time; meat heals slowly | one meat 30 HP to 60 HP; mana regen left at 6 s |
| D69 | 31 Jul 2026 | Creature exp derived from farm level: 100 kills per level | 36 hand-chosen exp numbers were incomparable | rat 8 exp to 2 exp (the test still says 8) |
| D87 | 3 Aug 2026 | Skill knee at 40: ×1.25 below, F-003 slopes above | "a partir de nivel 18 no vale la pena subir skill"; level 18 cost 7.6 h for two damage points | espada 18: 7.6 h to 66 min; 40: 179 h; but 45 to 46 became 763,000 swings |
| D149 | 30 Aug 2026 | One slope 1.08, no knee; `skillRung` halves a rung; gates 25/30/40 to 40/50/70 | 45 to 46 was 424 h in the air; a veteran was 40 to 50 because 50 was unreachable | espada 40: 179 h to 6.3 h; 50: 14.4 h; 100: 707 h |

D87 to D149 is the cleanest natural experiment in the set. A player sentence about level 18 produced a knee, the knee produced a wall nobody saw for 27 days, and the fix was to return to Tibia's shape with a gentler slope. A request about the first ten hours must be priced at hour 500 as well [I]. The 3 August playtest produced D85, D87 and D108 on one day, and the only one with before-and-after numbers is D87, from the harness. No change in the log has a measured player reaction after it [K, E2, S5].

### Not instrumented yet

Nothing is measured on the live server. Recording is server-side JSONL behind `-telemetry <path>`; an empty path disables it and the live deploy leaves it unset ("APAGADA por defecto", `deploy/pull-telemetry.sh:14`) [K, E1, S8]. The documented events are `session_start`, `session_end` (duration, net exp), `kill` (creature, exp, fight duration, position), `death` (source, exp lost, level, position), `level`, `damage_taken`, `damage_dealt`, `heal`, `mana`, `consume`, `loot_take`, `item_destroy`, `shop_buy`, `shop_sell`, `gold`, the `quest_*` family with `quest_step` carrying the time since the previous step, `ferry`, `equip` and `unequip`. The code also emits `hole`, `teleporter`, `melee`, `distance`, `conjure`, `rune_spell`, `reagent`, `item_gained` and `field_animation`, which the telemetry doc does not list [K, E1, S4, S8]. The `kill` record carries the killer's share only, not every party member's.

Not measured anywhere: the level distribution over time, session lengths, exp per hour in play, deaths by level and place, the corpse recovery rate, time between censo steps, potion and food spend per hour, party exp share [K, E1, S8]. The one live data source is the `/ranking` page, which publishes level, exp, magic level, the four skills, kills and deaths from SQLite; a weekly scrape of it would give the level distribution without turning telemetry on [K, E1, S4; I]. §13 says what to turn on and what to add.

---

## 5. Structural twins

A twin shares Asterion's conditions, not its genre label. The conditions are input (click or keyboard to move and target, a slow 2 s beat, no reflexes), session (30 to 60 minutes, persistent character, no run and no restart), randomness (low: damage bands, loot rolls, spawn timing), cost of failure (high but recoverable: exp loss, a bag drop, a corpse run, free respawn), social (co-op hunting in a group of about five on a shared world, PvP later) and platform (desktop and web, pixel art, text chat) [K, S4, S6]. The research notes screened about 25 candidates and kept 14. Mortal Online 2 (a hard 1,100-point skill cap), Pax Dei, Black Desert, Ashes of Creation, FFXI, Haven & Hearth (50 to 70 Steam players for years) and Meridian 59 appear in the lineage and the experiments but not here; their evidence was thin, blocked or carried one mechanism each [U, S84, S85, S117, S122; V, E3, S120; V, E1, S124]. Tibia 7.x is the direct ancestor and sits first.

| Twin | Input | Session | Randomness | Cost of failure | Social | Platform | Why chosen |
|---|---|---|---|---|---|---|---|
| Tibia 7.x (2002–05) | ● click or keyboard, 2 s beat, no reflexes | ○ three-hour marathons; slowness in regen and travel | ● damage bands, loot rolls, fixed respawn | ● 10 % exp, whole backpack, 10 % per slot; also 10 % of skills and mana, which Asterion drops | ● small groups, shared exp from 8.1, open PvP on most worlds | ● 2D tile, desktop, text chat | The direct ancestor; its 2009 bend of the death percent and its 2012 and 2018 training shortcuts are the best-documented changes to this exact rule set |
| Ultima Online (1997) | ● click to move and target, no reflexes | ◐ persistent, no run; marathons common | ● dice per hit and per skill use | ◐ no exp; the whole corpse lootable by anyone, ghost walk back | ◐ shared world, open PvP from day one, no group exp | ◐ desktop 2D isometric, text chat | The first use-based skill MMO at scale; GGS (2002), Trammel (2000) and insurance (2003) are three natural experiments on one game |
| EverQuest (1999) | ◐ click target, auto-attack, hotkeys; slow beat | ◐ persistent; sessions were hours; the camp was the unit | ● low | ● about 10 % of a level and a naked corpse run; nothing below level 11 | ● forced grouping, group bonus, six-player groups | ○ 3D desktop | Defined corpse-run culture, hell levels and the newbie fix; its rez spells are the oldest recoverable share |
| RuneScape 2 and Old School (2004, 2013) | ● click to move and target, 0.6 s tick | ● short browser sessions were the norm; afk grinds of hours later | ● low | ◐ items only, three kept, no exp loss; a 15-minute grave with a fee since 2020 | ◐ shared world, no group exp, Wilderness PvP | ● browser 2D tile, pixel art, text chat | Closest session and platform match; a 1.104 constant-ratio table, a visible 99, and 13 years of polled death-penalty changes |
| Asheron's Call (1999) | ◐ 3D but slow, click target | ◐ persistent | ● low | ● vitae debt plus half the coins plus items by level; corpse 5 min per level | ◐ shared world, fellowships | ○ 3D desktop | The first documented exp debt instead of exp loss; a penalty graded by level from day one |
| Diablo II (2000) | ◐ click, faster beat | ○ act-based, but a persistent character | ◐ random loot, fixed maps | ● 5 % or 10 % of the next level, 75 % back at the corpse | ◐ eight-player games, no shared world | ◐ desktop 2D isometric | The cleanest formula for exp loss as a share of the next level and for a recoverable share |
| Wurm Online (2006) | ◐ timed actions, no reflexes | ◐ persistent, long actions | ● low | ◐ items on the corpse | ● small settlements, player economy | ○ 3D desktop | The slowest skill-by-use curve ever shipped; gain scaled by action time is the anti-afk rule |
| Albion Online (2017) | ◐ WASD or click, cooldown combat, some reflexes | ● short expeditions; mobile client since 2021 | ● low | ● graded by zone colour, from a 3-minute knockdown to full loot | ◐ guild-scale PvP, small groups viable | ● desktop and mobile top-down | Graded loss by zone and the destiny board, practice redirected as fame credits |
| Project Gorgon (2018 EA) | ● tab target, slow | ◐ persistent | ● low | ○ near zero; dying is a skill that pays exp | ● a tiny shared population, about 250 online [V, E1, S99] | ◐ 3D desktop | The control case: no classes, skill by use, death almost free, and 10 % per level exp flattening for mixed groups |
| Valheim (2021 EA) | ○ third-person action combat | ● one-hour co-op nights, 2 to 10 friends | ◐ procedural map, fixed rules | ● corpse run, 5 % of every skill, a 10-minute grace, a server preset | ● a group of friends on their own server | ◐ desktop | The only twin built around a five-friend dedicated server; grace timer and death presets |
| Path of Exile 2 (2024 EA) | ○ action combat | ◐ 10 to 15 minute maps | ○ procedural | ◐ 10 % of the level bar, only from level 71 | ○ mostly solo | ◐ desktop | The live 2025 debate on exp loss as a signal rather than a punishment, and two penalties stacked on one death |
| Dark Souls lineage (2009–22) | ○ action combat | ◐ sittings of an hour, persistent character | ● fixed encounters | ◐ a recoverable drop with one chance, plus an insurance consumable | ○ mostly solo | ○ console and desktop 3D | The recoverable single-chance drop refined to a marker and a buyable save |
| World of Warcraft (2004) | ◐ tab target, hotkeys | ● one- to two-hour sessions | ● low | ○ durability and sickness only; the walk back is the cost | ● groups, guilds, party sync | ○ 3D desktop | The soft end of the lineage; rested exp is the framing flip, the 2020 squish is the level-meaning test |
| Open Tibia 7.x revivals (Tibiantis 2020, Tibiara 2025) | ● the same client and beat | ◐ veterans' marathons | ● low | ● the 7.x rule, blessings on exp only | ● a few hundred online, guilds | ● 2D tile, desktop | Exp stages and rate votes are the OT scene's pacing knobs; Tibiantis proves a ×1 7.4 curve holds a few hundred players for six years |

Four twins share four or more conditions outright: Tibia 7.x, RuneScape and Old School, Albion and Project Gorgon, with Ultima Online and the OT revivals close behind. Valheim fails on input and is kept because it is the only one built for Asterion's real social shape. The rest are kept for one mechanism each, and their cards say which [I]. The figure counts the marks.

---

## 6. Lineage: a timeline

Five generations. The first found that full loss empties a world; the second insured it, staged it and, at WoW, softened it to a walk; the third sold the grind back as items and shortcuts; the fourth asked the players and built for the friend server; the fifth is Asterion's own log, which has run the same experiments in nine weeks.

**Gen 1: Full loss and the naked corpse run (1996–2001)**

- **1996** Meridian 59 launches with every item dropped, one permanent max HP and 1 to 2 % of every skill lost per death, the harshest rule set in the lineage [U, E4, S84; V, E3, S83]
- **1997** Ultima Online ships use-based skills with a 700-point cap and a corpse anyone can loot; Koster later lists the macroing and "8×8" exploits the dice produced; the cap rose to 720 in 2013 [V, E2, S61; V, E3, S58]
- **1999** EverQuest: about 10 % of a level and a naked corpse run from level 11, nothing below; hell levels at 30, 35, 40 and 45 at twice the width [V, E3, S65, S66]
- **1999** Asheron's Call replaces exp loss with vitae, a debt worked off by earning exp; nothing lost below level 5 [V, E3, S79]
- **1999** Tibia's Rookgaard (5.2): a beginner island with a level 8 door that never moved in 26 years [V, E3, S25]
- **May 2000** Ultima Online Renaissance splits the world into Trammel and Felucca; subscribers 150,000 in February to 250,000 in October; Walton later says open PvP had driven off over 70 % of new players [V, E1, S59; V, E2, S60]
- **2000** Diablo II: 5 % on Nightmare and 10 % on Hell of the exp to the next level, 75 % refunded at the corpse, never a de-level [V, E3, S81]
- **Jan 2001** EverQuest's producer letter raises the group bonus to 2, 6, 10, 14 and 20 % for two to six members [V, E2, S69]
- **Jan 2001** RuneScape Classic: keep three items, the rest lie on the ground about 10 minutes; exp per level grows 10.4 % a level [V, E3, S76, S73]
- **Sep 2001** Dark Age of Camelot patches 1.06 and 1.08 cut constitution loss on PvP deaths and exp loss above level 30 within two weeks of launch [U, E3, S85]

**Gen 2: Insurance, stages and the soft end (2002–2009)**

- **2002** Tibia 7.x: a flat 10 % of exp, skill tries and spent mana at every level, the whole backpack and 10 % per equipped item; the rule Asterion copies minus the skills [V, E3, S19]
- **Jul 2002** Ultima Online Publish 16 ships the Guaranteed Gain System: a server-clock timer that awards 0.1 skill when the dice have not, built for "those who play infrequently" [V, E2, S53, S54]
- **Sep 2002** RuneScape's Tutorial Island opens; Jagex replaces it in 2008, 2009 and 2013 and reinstates it in 2018 [V, E2, S75]
- **Sep 2002** EverQuest smooths levels 50 to 60 so 51, 54 and 59 stop being hell levels at the same total exp [V, E2, S67]
- **Feb 2003** Ultima Online Age of Shadows adds item insurance at 750 gold per item, cut to 600 in Publish 18 that May; Siege Perilous refuses it [V, E2, S56, S57]
- **2003** Tibia 7.2 adds five blessings, each cutting exp loss 10 %, and the Amulet of Loss at 50,000 gold [V, E3, S20, S22]
- **May 2003** EverQuest raises the group bonus to 20 to 80 % as its low zones empty [V, E2, S70]
- **Apr 2004** World of Warcraft's beta cuts exp 50 % after a few hours of play; testers revolt and Blizzard flips the same curve into rested exp at 200 % [V, E2, S111, S112]
- **Nov 2004** WoW 1.1.0 replaces exp loss with resurrection sickness; 1.1.1 caps it at 10 minutes and 25 % durability ten days later [V, E3, S109]
- **Nov 2004** Tibia opens Optional PvP worlds, protection zones and skull rules on the rest [V, E3, S40]
- **Apr 2005** Final Fantasy XI: from level 25, 8 % of the exp to the next level, never more than 2,400; nothing at or below 30 [V, E2, S116]
- **Dec 2005** EverQuest's Monster Missions apply hell-level modifiers "to smooth out the experience curve" [V, E2, S68]
- **2006** Tibia 7.8 stamina: a 42-hour pool with a bonus window; Wurm Online ships gain scaled by action time [V, E3, S35, S82]
- **Oct 2007** RuneScape hides dropped items for one minute, then ships gravestones of 3 to 15 minutes in December [V, E3, S77, S78]
- **Dec 2007** Tibia 8.1 adds shared party exp with a 2/3 level rule and 8.2 the Island of Destiny, where a new character chooses a vocation [V, E3, S34, S26]
- **2008** The Forgotten Server's `stages.xml` makes exp stages (7, 6, 5, 4, 5 by band) the OT scene's default knob, disabled by default [V, E1, S44]
- **Apr 2009** Tibia 8.41: above level 23 the exp loss shrinks to one level at 50 and half a level more every 50; blessings now protect items 30 to 100 % and are priced `200 × (L − 20)`; CipSoft's census the same spring puts 76 % of 6.54 million characters at level 20 or below [V, E2, S21; V, E1, S29]

**Gen 3: Buying time, compressing the grind (2010–2019)**

- **Dec 2010** Tibia adds Twist of Fate, a blessing lost only on a PvP death; one note dates it to 9.4 in 2012 [U, E3, S24, S41]
- **2011** Dark Souls drops souls at the spot of death, recoverable once [V, E3, S107]
- **Jul 2012** Tibia 9.6 offline training: 12 hours banked, refilled a second per second online, about half efficiency [V, E3, S31, S32]
- **Oct 2013** Old School RuneScape: dropped items invisible to others for 3 minutes; 30 minutes from October 2014; 60 from May 2015, all unpolled [V, E2, S86, S88]
- **Sep 2014** Tibia 10.55 Dawnport replaces Rookgaard: try each vocation on a pedestal, leave at 8, forced out at 20, no item loss below 8 [V, E3, S27]
- **May 2015** RuneScape 3 Death's Office: items held 24 hours, fee 15 % down to 0.5 %; cut to 0.1 % in January 2023 [V, E3, S77]
- **Dec 2016** Tibia prey and store exp boosts; the Daily Reward lane follows in summer 2017 [V, E3, S37, S36]
- **Jul 2017** Albion Online launches with zone colours from knockdown to full loot and a destiny board that turns practice into fame [V, E3, S92, S94]
- **Mar 2018** Project Gorgon enters early access with no classes, skill by use and a death that costs nothing [V, E3, S97]
- **Apr 2018** Tibia 11.73 exercise weapons: 500 charges, 16 min 40 s, two hours of training for 347,222 gold or 25 Tibia Coins [V, E3, S33]
- **Sep 2019** WoW 8.2.5 Party Sync lets a high-level friend sync down to the lowest member [V, E3, S110]

**Gen 4: The polled middle ground and the friend server (2020–2025)**

- **Apr 2020** Tibiantis launches an exact 7.4 recreation at ×1 and holds a few hundred online six years later [V, E2, S45]
- **Jun 2020** Old School RuneScape's death rework, polled: three items kept, a 15-minute grave that pauses offline, loot from seven tiles, free under 100,000 gold, 5 % above at Death's Office; the survey found "many players supportive of a small increase in risk" [V, E2, S88, S87]
- **Oct 2020** WoW Shadowlands squishes 120 levels to 60 after Hazzikostas said levelling "simply doesn't feel meaningful" [V, E2, S113, S114]
- **Feb 2021** Valheim: 5 % of every skill on death, a 10-minute No Skill Drain grace, a tombstone that holds the inventory [V, E3, S100, S102]
- **Feb 2022** Elden Ring adds the Sacrificial Twig, a consumable spent instead of the dropped runes [V, E3, S107]
- **2023** Valheim's world modifiers make the death penalty a server preset from Casual to Hardcore [V, E3, S101]
- **Dec 2024** Path of Exile 2 early access: 10 % of the level bar on death from about level 71, plus the lost portal; forum threads run to hundreds of pages [V, E3, S103; U on the 10 %]
- **Jan 2025** Jonathan Rogers defends the loss as a signal the player is in content above their level, "the whole death actually mattering thing is important" [V, E2, S105]
- **Oct 2025** Tibia 15.12 Newhaven replaces Dawnport: a level 8 door to a one-way boat, capped at 20; rooking is removed [V, E2, S28]

**Gen 5: Asterion's own log (2026)**

- **Jul 2026** D9 and D10 on 13 July: a flat 10 % exp loss calibrated to "one session", magic multiplier 1.4; D30 on 26 July: a free temple heal after the first playtest; F-003 and D38 on 28 July: skill slopes 1.8 and a 30-minute corpse; D44 on 29 July: the heartstone; D69 on 31 July: creature exp derived from farm level [K, E2, S5]
- **Aug 2026** D85 and D87 on 3 August: a 2 s potion clock and a skill knee at 40; D113 on 12 August: heartstone cooldown 30 to 5 minutes; D137 and D138 on 21 August: a 50 ms tick and a 500 ms step; D147 on 29 August: geography as the level ladder; D149 on 30 August: one slope of 1.08 with half rungs [K, E2, S5]
- **Sep 2026** The two high wand gates drop from magic level 25 and 50 to 15 and 20 on 11 September, the last curve change before this study [K, E1, S13]

---

## 7. Pattern cards

Fourteen cards in six families, merged from about 55 candidate cards across nine research notes. Each card gives the minimal rule, graded evidence, the cost (S, M or L) and the Asterion constant to change, with file:line from the repo at 8836106a. Where a pattern has a figure, it sits right after its card.

- **A.** Level curve and exp
- **B.** Skills by use
- **C.** Death and the corpse run
- **D.** Sessions and the group
- **E.** Onboarding and gates
- **F.** Measurement

### Family A: Level curve and exp

### A1. Farm-level derived exp, a flat hour per level

*Lineage.* Tibia's cubic exp table (1997 to today) → EverQuest's `level² × zone modifier` kill exp (1999) → Asterion D69 (31 July 2026): creature exp derived from the creature's farm level so that a hundred kills of your band is one level (why: 36 hand-chosen exp numbers were incomparable, and a derived table makes every band the same length).

*Feeling.* Challenge paced as Submission. The cubic shows on the exp bar, not on the clock; every band is a comfortable hour, and the felt rise comes from the creature, the place and the walk.

*Mechanism.*

```
exp(L)        = (((L − 6)·L + 17)·L − 12) / 6 × 100        # stats.go:15-25, Tibia's table
creature_exp  = (exp(F + 1) − exp(F)) / DIVISOR            # F = max_farm_level, DIVISOR = 100 (D69)
hours_per_lvl ≈ DIVISOR × (TTK + overhead) / 3600          # TTK 10-30 s, overhead 10 s in the harness
```

*Works when / breaks when.* Works when every band has a reachable creature and time to kill stays between 10 and 30 s, so the hour per level is honest. Breaks when the overhead between kills is the whole curve and nobody has measured it, which is where Asterion's slowness has to live. Breaks the other way when a creature of a high band is safe and reachable early (enano aldeano at band 40 kills nobody and is the best exp per hour from level 1 to 25) [K, E1, S10].

*Evidence.* Tibia's table is unchanged since 7.x and Tibiantis publishes the same values [V, E1, S15, S45]. Modern Tibia reaches level 100 in about four days with boosts and a team, by one answer [V, E4, S43], and NabBot's 2024 sample of 700,000 registered characters had 36 % at level 200 or above, a biased sample of active players [V, E1, S42]. CipSoft's 2009 census shows where a cubic with a fixed exp per creature ends for most players: average level 16.5, 76 % of characters at level 20 or below [V, E1, S29]. Schreiber's rule is that each level should take "a little bit longer than the last" and that frequent small gains beat rare big ones; D69 makes each level take the same time and leaves the rise to the content [V, E2, S134]. In the harness, hours per level sit between 0.26 and 1.06 from level 1 to 120 [K, E1, S10].

*Cost and knobs.* S, already live. The `/100` divisor in the balance sheet formula (not in code), `max_farm_level` per creature (`content/creatures/*.yaml`), spawn density and placement (`maps/spawns.json`, `maps/worlds/<w>/z*.json`).

*In Asterion.* Live since D69 (`docs/GDD.md:411`, `content/creatures/rata_parda.yaml:7-8`) [K, E1, S4, S5]. The flat hour is a property of the rule, not a tuning accident. If the group wants levels in weeks at the harness's kill rates, the knob is the overhead between kills (travel distance to the band, spawn density, food) or the divisor, never the cubic [I]. Measure the friction factor first (F1); the band ladder and the 1,500 exp/h column in §4 differ by a factor of 20 at level 50, and the truth is somewhere between them.

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 4 · Cheapness 5 · Fit 5 · Testability 4

### A2. Exp stages by world, not by level

*Lineage.* The Forgotten Server's `stages.xml` (about 2008; 7, 6, 5, 4, 5 by level band) → every Open Tibia server since → EverQuest's 2005 Monster Mission modifiers that defused hell levels with a multiplier → WoW's 2020 squish and heirloom multipliers (why: a static rate "was either too high or too low", and a multiplier table is cheaper than a new curve).

*Feeling.* Discovery early, Challenge later. Friends can catch up without the game feeling faster at the top.

*Mechanism.*

```
exp_gain = creature_exp × STAGE[world]            # a 4-row table, default 1.0 everywhere
STAGE    = {akron: 1.0, ingwen: 1.0, gorothland: 1.0, boggland: 1.0}
candidate if M2 shows Akron too slow: akron 1.5, ingwen 1.2, others 1.0
```

The key is the world, not the level band, because geography is already the ladder (D147) [K, E2, S5].

*Works when / breaks when.* Works for a new server that must get players past the early wall, and for a group where one friend joins late. Breaks when the drop between stages is felt as a cliff at the boat, or when players prize a "serious" ×1 (the low-rate 7.4 crowd) [V, E3, S47, S48]. Breaks silently if applied before exp per hour is measured, because the harness already says the hour per level is flat.

*Evidence.* TFS ships the table disabled by default [V, E1, S44]. An otland poll of 97 votes went 69 % for stages; another thread holds that stages "wreck a server's seriousness" [V, E3, S47, S50]. A low-rate server developer planned a boost for low levels reaching ×1 at level 20 to fix "boring at low levels" [V, E3, S49]; Tibiara's 2025 beta runs ×10 exp, skills and magic [V, E4, S46]. EverQuest removed its hell-level plateaus with multipliers at the same total exp [V, E2, S67, S68]. WoW's squish made levelling 50 to 70 % faster and drew a backlash over levels "meaning nothing" [V, E3, S114].

*Cost and knobs.* S. One table keyed by world in the server config or in `maps/worlds.json`; the four multipliers and whether a party member's world or the kill's world applies.

*In Asterion.* Not present. The nearest knob is `max_farm_level` per creature, which moves one creature at a time [K, E1, S4]. Keep the table at 1.0 and ship the field, so the collective can run the natural experiment in week 5 of the protocol if M2 shows Akron costing more than two sessions a level with the real friction factor [I]. The curve lab draws the long curve with and without the table.

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 3 · Cheapness 5 · Fit 4 · Testability 4

### Family B: Skills by use

### B1. One slope with half-weight rungs, shown to the player

*Lineage.* RuneScape's constant-ratio exp table, 2^(1/7) ≈ 1.104 a level with a visible 99 (2001) → Tibia 7.x skill tries `A × b^(skill − 10)` with b 1.1 for a knight's sword (2002) → Asterion D87's knee at 40 (3 August 2026) → D149 one slope of 1.08 with `skillRung = 10 + (L − 10)/2` (30 August 2026) (why: a knee produced a wall nobody saw for 27 days; a gentler slope with half-weight rungs keeps the bar moving every session without making a rung worth too much).

*Feeling.* Submission with landmarks. The bar moves every session until about sword 100; each rung is 8 % longer than the last, so gains slow but never stop. RuneScape's "92 is halfway to 99" is the folk statement of the same geometry.

*Mechanism.*

```
tries(S → S+1) = BASE × MULT^(S − 10)      # BASE 50 / 30 / 100 / 20, MULT 1.08 (fishing 1.1)
rung(S)        = 10 + (S − 10) / 2         # what damage, block and miss read
hours double every ln 2 / ln 1.08 ≈ 9 rungs
show: "tries to next rung" on the skill sheet, as RuneScape shows exp since 13 Aug 2001
```

*Works when / breaks when.* Works because every combat reader uses the same rung function. Breaks if a reader reads the raw level (fishing does, by design) or if a content gate is set in raw skill points without pricing it in hours (the D87 knee made 45 to 46 cost 763,000 swings). Breaks as a feeling after the learning ends: Koster's fun-as-learning says the player's model of kiting and the 2 s beat is complete by hour 10, while sword 100 is hour 707, so the later rungs run on Fellowship and Discovery, not Challenge [V, E2, S61, S64].

*Evidence.* RuneScape's table and the 92-is-half property are on the wiki; the first 99 took seven months from launch [V, E3, S73, S74]. Tibia's constants are community-derived and reproduced by TFS [V, E1, S16, S17]; the 7.x melee law `0.06 × skill × attack` had no level term, so level bought only HP, mana and speed until 8.0 [V, E3, S18]. Old School RuneScape's 59,847 maxed accounts and its 771-hour max record (2,000 to 2,500 hours is the realistic figure) show what a visible 99 does to a long curve [V, E1, S89; V, E3, S91]. Albion turns surplus practice into fame credits spendable on other nodes, the modern fix for a skill practised too late [V, E3, S93]. Practice curves fall as a power law or an exponential (Heathcote et al. 2000, 40 datasets, 7,910 series); a geometric try count makes the skill number logarithmic in practice, the same visual shape [V, E1, S143, S144]. A Tibia knight needs 2,656,011 tries to sword 100 against Asterion's 636,150, and Asterion halves each rung's weight, so felt power per hour is close to the knight's [V, E1, S16; K, E1, S10; I]. D87 to D149 is the in-house experiment. Espada 40 went from 179 h to 6.3 h and 50 to 14.4 h [K, E2, S5].

*Cost and knobs.* S, live. `skillBase` (`skills.go:102`), `skillMult` (`skills.go:106`), `skillRung` (`skills.go:119-121`), and the skill gates in points (`min_skill` 40 on the golem, achievements at 50 and 70, `shieldingCleanBlock` 50 at `game.go:214`). The display of tries to next is a client string, S.

*In Asterion.* Live since D149 [K, E1, S4]. Sword 50 in 14.4 h of session, 70 in 69.6, 100 in 707; shielding exactly twice sword at every rung because its base is 100 against 50 [K, E1, S10]. Two things are missing. The player cannot see tries to the next rung, so a session that banks 900 tries toward a 10,120-try rung at sword 80 shows nothing (M9 in §13 measures this). And the roster was sized against skill about equal to level while the band ladder gives a level 30 sword 50; the harness `-skills` print should take the measured exp per hour (F1) [K, E1, S10; I].

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 4 · Cheapness 5 · Fit 5 · Testability 4

### B2. A guaranteed rung on a clock

*Lineage.* Ultima Online "power hour" (before 2001) → Guaranteed Gain System, Publish 16, 23 July 2002: a server-clock timer per skill that awards 0.1 when the dice have not → Tibia offline training (2012) and exercise weapons (2018) as the paid version (why: dice-based gain punished infrequent and unlucky players and rewarded macroing; the UO team named "those who play infrequently" as the audience).

*Feeling.* Submission with a floor. A 45-minute session always banks something visible, and the zero-rung session disappears.

*Mechanism.*

```
per skill: T(rung) grows with the rung       # UO at 700 total: 5 min at 0-5, 2.3 h at 50-55, 27 h at 95-100
if now − last_rung_at ≥ T(rung) and a qualifying use happens: grant the rung
the timer runs on the server clock, offline included
the use-based tries keep counting in parallel; heavy players still gain faster
```

For Asterion, where tries are deterministic, the equivalent is a credit. The first N hits of a session count double, or a timer banks tries while offline up to a cap [I].

*Works when / breaks when.* Works at high rungs where a rung is thousands of tries. Breaks when the timer is the only gain and players call the guarantee fake (UO forum complaints above skill 70) [U, E4, S52]. Breaks if the timer is short enough to replace practice, which turns skill by use into skill by calendar.

*Evidence.* The Publish 16 text and the GGS timer table are on uo.com [V, E2, S52, S53, S54]. The 2001 team comment proposed GGS to replace power hour, citing "modest benefit to casual players" [U, E2, S55; blocked page, snippet]. Koster's own account lists every anti-macro fix UO tried and why each was farmed [V, E2, S61]. Tibia's offline training works at about 50 % efficiency for 12 banked hours and exercise weapons compress two hours of training into 16 min 40 s for 347,222 gold [V, E3, S31, S33].

*Cost and knobs.* S to M. A per-skill timestamp per character and a table of T by rung; which skills; whether offline time counts; the cap.

*In Asterion.* Not present. Tries are deterministic (`skills.go:30-45`), so the pattern is a floor, not a dice fix [K, E1, S4]. At sword 100 a rung needs 47,171 hits, about 52 hours of swinging at one per 2 s; a timer of a few hours would guarantee one visible tick per week [K, E1, S10; I]. The anti-compulsion stance allows it in one form only, a pool that fills while away, caps, and never resets (see D1). Rate it after M9 shows whether the zero-rung session exists at the levels the five hunt.

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 4 · Cheapness 4 · Fit 4 · Testability 4

### Family C: Death and the corpse run

### C1. A flat percent that spares skills, bent above a level

*Lineage.* Meridian 59 (1996) and Tibia 7.x (2002): exp, skills and items all lost → EverQuest (1999): about 10 % of a level, skills kept → Tibia 8.41 (April 2009): above level 23 the loss shrinks to one level at 50 and half a level more every 50 → FFXI (April 2005): 8 % of the next level, never more than 2,400 → Asterion D9 (July 2026): a flat 10 % of exp, skills and magic spared, the bag always, 10 % per slot (why: a flat percent of a cubic costs minutes at level 8 and hours at level 50, and the designers who kept a loss all bent or capped it where it started costing sessions).

*Feeling.* Challenge with a known price, and the fiero of the kill you took at the edge. Fellowship when a friend escorts the walk back. Dread, the anti-pattern, when the price is a weekend.

*Mechanism.*

```
current:   loss(L) = 0.10 × exp(L)                                   # corpse.go:43,367
proposed:  loss(L) = 0                                  for L < 8     # E1
           loss(L) = 0.10 × exp(L)                      for 8 ≤ L ≤ 30
           loss(L) = min(0.10 × exp(L), (L + 50)/100 × step(L))  for L > 30   # Tibia 8.41 shape
bag drops whole; each of 9 worn slots at 0.10; skills, tries, spent mana untouched
```

At level 30 the bend is nearly continuous (32,560 against 36,830). At 50 it is one level's worth, 117,700 against 184,730; at 100 it is 1.5 levels, 727,800 against 1,569,480 [I, model from the §4 table].

*Works when / breaks when.* Works below about level 30 as it stands, where a death is under one session. Breaks past 50 under the flat rule, where the harness prices a death at 158 minutes with the 3× overhead and 528 at level 100, three to twelve sessions. The bent rule still leaves level 100 at about four hours ×3; pair it with C3 to halve it, or cap it in minutes the FFXI way. Breaks as a feeling if the bar moving backward is the problem rather than the minutes, in which case the frame is the knob, not the percent (prospect theory, losses weigh about twice gains) [V, E1, S139].

*Evidence.* Tibia's 7.x rule and its 8.41 replacement are on the Death page; TFS implements the same line, `lossPercent = (L + 50) × 50 × (L² − 5L + 8) / experience` [V, E3, S19; V, E1, S23]. The 8.41 teaser gives the levels-lost table as the whole explanation; no fuller CipSoft rationale was reachable [U, E2, S21]. FFXI's 2005 notice sets the 8 % and the 2,400 cap [V, E2, S116]. Klastrup's 2007 survey of commercial worlds found every one softened its penalty over time and none still let a player lose a level [V, E2, S135]. Players want the stake to exist even when they do not enjoy it: 1,704 DayZ players overwhelmingly supported permadeath while reporting negative emotion, and 270 million ArcheAge beta records showed no behaviour change when all long-term stakes vanished [V, E3, S137; V, E1, S138]. Loss aversion holds for virtual gold in three experiments [V, E1, S140]. Schubert (SWTOR) wanted a sting like a bumblebee's rather than a jellyfish's because a bounded penalty lets designers make fights harder [V, E2, S125, S126]. Rogers (PoE 2) calls the loss a signal, not a punishment [V, E2, S105]. Asterion's own numbers: 5, 31, 53, 176 and 249 minutes at levels 8, 30, 50, 100 and 120 on the harness clock [K, E1, S10].

*Cost and knobs.* S. `deathExpLoss` (`corpse.go:43`) becomes a function of level; the bend level, the 8.41 slope, the newbie floor (E1). `gearDropChance` (`equipment.go:473`) and which slots roll stay as they are.

*In Asterion.* The three death constants have not moved since July while everything around them did [K, E1, S4]. The calibration test (`phase5_test.go:36-57`) checks two points at level 4 and 8 and prices a rat at 8 exp when D69 made it 2; it should take the band ladder and check level 30 and 50 too [K, E1, S9]. The lab draws the flat line, the bent line and the "one session" band together. Ship the bend only after M3 has a median at a band the five actually hunt, since the harness floor may be off by the friction factor [I].

*Ratings 1–5 (author judgement):* Fun impact 5 · Evidence 4 · Cheapness 5 · Fit 5 · Testability 4

### C2. A blessing as prepaid insurance

*Lineage.* Tibia 7.2 (2003): five blessings from five NPCs, each cutting exp loss 10 %, plus the Amulet of Loss at 50,000 gold → Ultima Online Age of Shadows (February 2003): per-item insurance at 750 then 600 gold → Tibia 8.41 (2009): blessings also protect items, 30/55/75/90/100 %, priced `200 × (L − 20)` → Twist of Fate (2010 or 2012) for PvP deaths → Tibia 11.30 (2017) blessing charges sold for Tibia Coins (why: a prepaid, level-indexed premium turns dread into a routine gold sink and a ritual before each expedition).

*Feeling.* Submission turned into Expression. The player chooses what to protect and pays before the trip; the fear is bought down, not removed.

*Mechanism.*

```
price(L)   = max(2,000, 200 × (L − 20)) gold, bought at the temple, consumed on death
effect     : GEAR_DROP 0.10 → 0.05 per slot; exp loss −8 %; the bag is never covered
```

Tibia's full table: container loss 100/70/45/25/10/0 % and equipment 10/7/4.5/2.5/1/0 % for zero to five blessings [V, E1, S20].

*Works when / breaks when.* Works when gold has a sink problem and death is frequent enough to make the purchase routine; all five blessings cost 30,000 gold at level 50, about one level's hunting profit [V, E1, S20; I]. Breaks when the price is trivial (a tax, not a choice), when it covers everything (UO's Siege players refused insurance "in any form"), or when it is sold for cash. It only works if the penalty was real before it; UO shipped insurance six years after launch, when gear had become the progression [V, E2, S56].

*Evidence.* Blessing prices and protection tables [V, E1, S20, S21]. The Amulet of Loss [V, E3, S22]. Publish 18's insurance prices and the Siege exclusion [V, E2, S56, S57]. Promotion sold partly as "losing 30 % less experience and skills upon death" [V, E3, S38]. The 7.4-style OT Exordion keeps the 7.x rule, blessings on exp and skills only [V, E3, S51]. Albion's head of operations calls risk against reward the issue under "almost every design decision", and its 2025 Abyssal Depths lose inventory but keep equipped gear, the same shape as Asterion's bag rule [V, E2, S96, S131]. No measured retention before and after any of these [U].

*Cost and knobs.* M. A temple NPC line, a flag per character, a price formula; the slope, how many slots it covers, whether the bag is ever covered.

*In Asterion.* Not present. The only insurance is the heartstone and the free temple heal [K, E1, S4]. A single temple blessing that halves `gearDropChance` and leaves the bag alone adds a gold sink (Akron gold is 450 to 4,100 an hour against a 210-gold leather set, so there is little to buy after boots) and a pre-expedition ritual without softening the corpse run [K, E1, S10; I]. Decide after C1. If the bend lands, the blessing is the gold sink; if the flat rule stays, the blessing is the mercy.

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 4 · Cheapness 3 · Fit 4 · Testability 3

### C3. A recoverable share at the corpse

*Lineage.* EverQuest resurrection spells (1999): 10 % to 96 % of the lost exp back by spell tier, so a cleric friend is the recovery → Diablo II (2000): 75 % back by touching your own corpse → Demon's Souls and Dark Souls (2009, 2011): the whole drop back, once, with a marker → Elden Ring (2022): a consumable spent instead of the drop (why: a walk back needs a reward beyond the gear, and a share that depends on reaching the body makes the corpse run the mechanic rather than the chore).

*Feeling.* Challenge resolved into relief, and fiero on the pickup. Fellowship when a friend reaches the body first and brings it home.

*Mechanism.*

```
on death:   corpse.exp_held = REFUND × exp_lost        # REFUND 0.5
on open by owner within the window: exp += corpse.exp_held; exp_held = 0
on open by a party member: mark the corpse on the owner's map; the owner still collects
```

*Works when / breaks when.* Works when the walk is short enough to try in the same session (Akron: at most 4 minutes at level 1) and the corpse outlives the median session (C4). Breaks when the corpse lies where you died (chain death) and there is no other route or no friend. Breaks if the refund is large enough that death becomes a free teleport, Klastrup's Star Wars Galaxies case [V, E2, S135].

*Evidence.* EverQuest's rez table and corpse culture [V, E3, S65]. Diablo II's 75 % [V, E3, S81]. Elden Ring's runes and Sacrificial Twig [V, E3, S107]. Miyazaki on soul loss: if souls could be recovered at any time "there would be no suspense or sense of accomplishment", and on Sekiro, "we don't want to numb the player to death" [V, E2, S127, S128]. Pantheon's 2014 design put part of the lost exp on the corpse, with a god who summons it for an exp fee [V, E2, S129]. Koster on why corpse runs worked in MUDs and soured in 3D. The run back was quick, populations small enough to ask for help, gear replaceable [V, E2, S62]. Toh's coding of sunk cost in play predicts players walk back even when the bag is worth less than the minutes [V, E3, S141].

*Cost and knobs.* S to M. A field on the player corpse, two hooks in the corpse loot path (`corpse.go:88-92`); the refund share, the window, whether a party member can trigger it.

*In Asterion.* The corpse already lasts 30 minutes and holds the bag, so the mechanic is two lines in `corpse.go` and a map marker [K, E1, S4]. With REFUND 0.5 a level 50 death that reaches its corpse costs 79 minutes ×3 instead of 158, and a level 100 death 264 instead of 528 [I, model]. Combined with C1 the level 100 death lands near two hours ×3. The telemetry event `corpse_recovered` (F1) measures the recovery rate, which no twin ever published [I].

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 3 · Cheapness 4 · Fit 5 · Testability 4

### C4. A corpse timer that pauses offline, and loot from a few tiles

*Lineage.* RuneScape gravestones (December 2007), 3 to 15 minutes → RuneScape 3 Death's Office (May 2015), items held with no race → Old School RuneScape death rework (June 2020): a 15-minute grave whose timer pauses on logout or inactivity, loot from up to seven tiles, "enough time to reach most newbie areas" (why: bad connections and lag deaths were the loudest complaint, and a disconnect should not be a double death).

*Feeling.* Challenge kept, the sense of unfairness removed. The appointment is gone. The bag waits for you, as the vision says progress does.

*Mechanism.*

```
corpse_remaining_ms decreases only while owner.online and owner.active_in_last_60s
owner may open own corpse from ≤ REACH tiles          # REACH 2
others may still loot while the owner is offline, or not: pick one
```

*Works when / breaks when.* Works in any game with a corpse timer. Breaks if the corpse is also meant as a loot opportunity for others, since pausing hides it from them; Asterion's "lootable by anyone" and a paused timer conflict unless the public window is separate. Breaks if remote loot lets the player skip the danger that killed them, which is why REACH is two tiles, not seven.

*Evidence.* Jagex's 2020 news post gives the pause, the seven tiles and the reason in its own words [V, E2, S88]. The OSRS survey found players split and "many players supportive of a small increase in risk"; two hotfix rounds followed within 48 hours [V, E2, S88]. Session medians: about 26 minutes in Lineage II, half of a WoW realm's sessions under 10 minutes, so a 30-minute real-time clock is as long as the typical session [V, E1, S149]. Zagal's "playing by appointment" names a rule that decides when the player must play as a dark pattern when it serves the creator [V, E2, S151]. Alexandrovsky et al. find players plan their exits from the game's structure and want self-determined stops [V, E1, S152].

*Cost and knobs.* S. `playerCorpseDecay` and `playerBonesDecay` (`corpse.go:29-30`) tick on the owner's online time; the pause conditions, REACH, whether others may loot while paused.

*In Asterion.* The 30-minute corpse ticks in real time whether or not the owner is online [K, E1, S4]. A death at minute 40 of a 45-minute session leaves a corpse that is bones at the next login. Pausing it while the owner is offline removes the "disconnected and lost the bag" case and makes the pillar consistent. Progress waits for you, and so does your bag [I]. Show "your corpse is safe until you return" on the death screen, which also turns an involuntary exit into a designed one [I, S152].

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 4 · Cheapness 5 · Fit 4 · Testability 4

### C5. A post-death grace period

*Lineage.* EverQuest's low-level respawn with gear (1999) → Tibia Dawnport's no item loss below 8 and the Adventurer's Blessing to level 21 (2014) → Valheim's No Skill Drain, about 10 minutes after respawn (February 2021) → OSRS's grave timer that resets on a second death (2020) (why: the second death happens on the way back to the first corpse, and charging full price for it is the spiral that ends the night).

*Feeling.* Challenge without the death spiral. The corpse run is a risk to the body you are fetching, not to the level you just lost.

*Mechanism.*

```
if now − last_death < GRACE then exp_loss = 0; the bag still drops; slots still roll
GRACE = 15 min                                   # Valheim 10 min; sized to Asterion's walk plus the heartstone cooldown
```

*Works when / breaks when.* Works for any corpse-run game. Breaks if the window can be farmed as free aggression; Valheim accepts the suicide-teleport it allows. Keep the bag drop inside the grace so a second death still costs the bag you were fetching.

*Evidence.* Valheim's buff is described by guides dated 12 February 2021, ten days after early access, so it was a launch feature; the 600 s check is documented by server hosts [V, E3, S100, S102]. The world modifier later let hosts pick the death penalty from 0 to 100 % [V, E3, S101]. Yee's respondents describe a group spending 15 minutes assigning blame after an exp-loss wipe and dissolving, the failure mode a grace removes [V, E3, S136]. PoE 2's complaint volume comes from two penalties on one death, the exp and the lost portal [V, E3, S103, S106].

*Cost and knobs.* S. One timestamp per character; GRACE; what is waived.

*In Asterion.* Not present. The heartstone is destroyed by death, so the walk back is the most dangerous moment and the second trip is slower, not safer [K, E1, S4]. Fifteen minutes covers any Akron walk twice and the 5-minute heartstone cooldown once [K, E1, S10; I]. This is the cheapest change in the study that touches the death penalty, and it does not move the headline 10 %.

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 3 · Cheapness 5 · Fit 5 · Testability 4

### Family D: Sessions and the group

### D1. The rested framing flip, as a capped tries pool

*Lineage.* WoW beta (April 2004): exp cut 50 % after a few hours, hated → WoW launch (November 2004): every requirement doubled and the first hours shown as 200 % rested exp, loved → Tibia stamina (2006) and offline training (2012) → EVE's offline skill queue → Albion's learning points per day (2017) (why: the same numbers framed as a gift are accepted and framed as a cut are not, and a pool that fills while away pays the friend who plays less).

*Feeling.* Submission, the game waits for you, and Fellowship, the once-a-week friend stays within reach of the party.

*Mechanism.*

```
rest += RATE per hour offline;  rest = min(rest, CAP)        # CAP ≈ one session of tries
while rest > 0 and swinging: each try counts 1.5, rest −= 0.5
never negative, never resets, never tied to a calendar day
```

Apply it to skill tries rather than exp, because the hour per level is already flat (A1) and tries are the slow curve [I].

*Works when / breaks when.* Works for short, irregular adult sessions. Breaks if the bonus is shown decaying mid-session or if players log off "to farm rest", which WoW's 150 % cap limits. Breaks the anti-compulsion pillar only in its streak form; a pool that caps and never expires is not a login reward [K, E2, S6; I].

*Evidence.* Pardo via Remo: "It's EXACTLY the same as it was before"; Game Developer's GDC 2010 account; USgamer on players "literally never logging off" [V, E2, S111, S112, S132]. Rested numbers: 5 % of a level per 8 hours in an inn, cap 150 % [V, E3, S108]. Tibia's offline training banks 12 hours at about half efficiency [V, E3, S31]. Albion's 30 learning points a day never expire [V, E3, S95]. EVE trains skills in real time, logged in or not, at about 30 skill points a minute, and a clone contract costs 900,000 ISK [V, E3, S119, S118]. Yee's surveys put MMORPG players at about 22 hours a week in the 2000s, three to six times Asterion's target, so every twin hour should be read divided by about four [V, E1, S153]. Debeauvais et al. (n = 2,865): 23 % of WoW players kept paying through six months of not playing; breaks are the default [V, E1, S148]. No paper studies rested exp as a mechanic [U].

*Cost and knobs.* S to M. One timestamp and one float per character; RATE, CAP, the multiplier, whether exp also rests, whether the party shares it.

*In Asterion.* Not present, and the vision refuses daily rewards [K, E2, S6]. A tries pool capped at one session mirrors the death calibration (one session lost, one session regained) and narrows the gap between a friend at three sessions a week and one at one [I]. Frame it as rest in the client. Hold it until M11 shows the gap matters; Debeauvais says the social tie retains, not the curve [V, E1, S148].

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 4 · Cheapness 4 · Fit 3 · Testability 3

### D2. Flatten the party share, never gate it

*Lineage.* EverQuest's group bonus (2001: 2 to 20 %; 2003: 20 to 80 %) and con colours → Tibia 8.1 shared exp with a 2/3 level rule and a vocation bonus of 20/35/70/100 % (2007, 2014) → Project Gorgon's 10 % per level exp flattening over 25 levels (2015) → Guild Wars 2 downlevelling (2012) and WoW Party Sync (2019) (why: a range gate protects fairness and excludes the friend who fell behind, the one the group most needs to keep).

*Feeling.* Fellowship. The expedition is the unit of play, and five friends at five levels can take one.

*Mechanism.*

```
share(member) = 1.2 × kill_exp / n          # today, members within 30 tiles who dealt damage
no level gate on sharing (keep it that way)
exp(player, creature) = creature_exp × 0.9^max(0, F − L)   # Gorgon flattening, optional, F = farm level
the carrying friend is paid in gold, contract progress or a title, never less exp
contracts sized so count × TTK + travel ≈ 45 min at the band
```

*Works when / breaks when.* Works with no classes, where a strong friend tanks and the low friend takes the kill. Breaks when a low friend can be dragged to high content for full exp at no risk, which the death penalty prevents here. Tibia's 2/3 rule would split a level 61 and a level 40 friend in the first month at a 10-to-1 play ratio [I, S34].

*Evidence.* EverQuest's two bonus tables [V, E2, S69, S70]. Tibia's party page (blocked, read through the API) [U, E3, S34]. The Gorgon developer post on flattening and the forum complaint that splitting exp discourages grouping [V, E2, S98]. GW2's stated rationale for downlevelling [V, E3, S123]. Hearthguard D1 and D2: scale the pool every player drains linearly, the focused enemy sublinearly, and make catching the leak pay [V, S1]. Koster: corpse runs were "a powerful social force" when help was one shout away [V, E2, S62]. EverQuest's dragger, summoner and resurrector roles made the run a group act; one veteran's rule was "you didnt leave anyone behind" [V, E3, S71; V, E4, S72]. RuneScape's Slayer tasks (2005) are the bounded expedition in its oldest form [V, E3, S90].

*Cost and knobs.* S. `partySharedExpBonusPct` and `partyShareRange` (`party.go:63,68`); the flattening factor and horizon; the rescuer's reward; the contract counts in `content/quests`.

*In Asterion.* The flat 20 % is EverQuest's 2001 six-person value for any group size, the right era to copy for five friends with no population problem [K, E1, S4; I]. There is no level gate today; keep it absent. The harness cannot show two attackers (`party.go:57-62`), so party exp per hour is unmeasured; A8 in §13 adds `party_size` to the kill event [K, E1, S4]. The rescue (a friend opens the corpse and returns the bag) already pays nothing; a `corpse_recovered` event with the looter's name is the first step, a title the second [I]. Hunting contracts on Ingwen and Gorothland (five deliveries, five counted hunts of 1 to 10 kills, one boss each) are the bounded expedition already; set the counts from measured TTK [K, E1, S13].

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 3 · Cheapness 4 · Fit 5 · Testability 3

### Family E: Onboarding and gates

### E1. The newbie fix: no exp loss below level 8

*Lineage.* EverQuest (1999): no exp loss and gear kept below level 11 → Asheron's Call (1999): nothing lost below 5 → Diablo II (2000): nothing on Normal → FFXI (2005): nothing at or below 30 → Tibia Dawnport (2014): no item loss below 8, the Adventurer's Blessing to 21 → PoE (2013 on): nothing in the campaign (why: the first deaths are learning, not failure, and every commercial world Klastrup surveyed had the rule by 2007).

*Feeling.* Discovery first, Challenge after. The first evening cannot be lost.

*Mechanism.*

```
if L < 8: exp_loss = 0; the bag still drops (the corpse run is the lesson)
if L < 5: gear_drop = 0
```

*Works when / breaks when.* Works with a visible threshold that matches a place, here the censo chain and the Akron ring around town. Breaks when the gate is where the content gets hard (EverQuest's level 10 was also the exit from the newbie zone) or when players die on purpose to travel [V, E2, S135].

*Evidence.* EverQuest's and Asheron's Call's tables [V, E3, S65, S79]. Diablo II [V, E3, S81]. Dawnport's rule and its 25,000 to 55,000 exp per hour [V, E3, S27]. Klastrup: "until levels 6-10, players will hardly experience any penalty" across the worlds she surveyed [V, E2, S135]. CipSoft's 2009 census: 1.8 million of 6.54 million characters never reached level 8 [V, E1, S29]. Asterion's own test puts a level 4 death at 10 minutes, so in minutes the fix already half exists [K, E1, S9].

*Cost and knobs.* S. One comparison in `corpse.go:367`; the threshold; which components switch on at which level.

*In Asterion.* Not present. The first death is likely in hour two or three, at level 5 to 7, from oso pardo two screens from town [K, E1, S10]. Eighty to 280 exp is 10 to 20 minutes on the band ladder, which is small, but the bag, the roll on nine slots and the 4-minute walk arrive on the same evening the player learned what a corpse is [I]. Waiving the exp below 8 keeps the corpse run as the lesson and costs the design nothing it values; the censo chain ends at level 3 and the band 10 creature arrives at level 8.

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 4 · Cheapness 5 · Fit 4 · Testability 4

### E2. Milestone-dense levels and legible gates

*Lineage.* Bartle's levels as "clear regular feedback" in MUD1 → Koster's laws: milestones "clear and visible and significant", never a sense of running out of them → Wurm's titles at 50, 70, 90 and 100 → RuneScape's visible 99 → Hazzikostas (2019): levelling "simply doesn't feel meaningful", then the 2020 squish (why: a level that buys only 5 HP is a number, and players notice).

*Feeling.* Challenge and Discovery. Each level opens something, and the player knows what the next one opens.

*Mechanism.*

```
list every level that changes only HP and mana
for every stretch longer than one session with no unlock, attach one: a gate, a spell, a boat, a title
show the next gate on the level-up line, and the death screen names the creature and the exp in minutes
```

*Works when / breaks when.* Works when unlocks are cheap content data (`min_level`, `min_magic_level`, a ferry rule). Breaks when unlocks are new systems or when gates are set in raw points nobody priced (D87).

*Evidence.* Koster's laws and "Do levels suck?" [V, E2, S63, S64]. Bartle 1996 [V, E2, S147]. Blizzard Watch on Hazzikostas and the squish [V, E2, S113]. Schreiber: in MMOs without an endpoint "more progression just isn't meaningful" [V, E2, S134]. Wurm titles [V, E3, S82]. Asterion's own F-095: the beat boundaries, not the constant, make a level felt [K, E2, S14].

*Cost and knobs.* S to M. `min_level` on items (`content/items/*.yaml`, 131 items), wand and spell `min_magic_level`, `edible`, the ferry rules, a client string per level.

*In Asterion.* The walk changes at 10, 20, 34, 51, 76 and 114 and nowhere else; the gear ladder has 61 gated items between 11 and 20 and 18 past 35; past 45 a level buys under 2 % of HP and mana [K, E1, S4, S10, S11; I]. Levels 36 to 120 are the thin stretch: five gear changes in 85 levels. Attach the boat to Ingwen and Gorothland to a visible level line, name the skill rungs the Wurm way at 50, 70 and 100, and let the death screen say "agallas rojas, 5,357 exp, about 40 minutes" [I].

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 3 · Cheapness 4 · Fit 4 · Testability 3

### Family F: Measurement

### F1. Telemetry beside the harness

*Lineage.* Community exp-per-hour tables (TibiaWiki, OSRS wiki) → Tibia's in-client Analytics (2017) → Pittman's census-driven player model (2007) and Pfau et al.'s bots trained on Aion logs (2020) → MatchRPG's "run the bot before the session" (2026) → Asterion's `cmd/balance` beside a switched-on JSONL stream (why: the harness is the mechanical ceiling, the stream is the lived curve, and their ratio is the one number this study could not compute).

*Feeling.* None for players. For the team it turns a playtest sentence into a priced change, which F-003, D87 and D149 already did with the harness alone.

*Mechanism.*

```
friction  = session_exph / harness_exph(level, kit, creature)      # per ground; 0.5-0.7 expected
death_min = exp_lost / exph(player, last 3 sessions) × 60 + recovery_min + drop_value / goldph × 60
rungs_per_session = count(skill_up + magic_level + level) per session with ms > 600,000
run cmd/balance -levels <current> -kit <in use> before every collective session; store beside the JSONL
```

*Works when / breaks when.* Works for the grounds the five actually use. Breaks when the bot's assumed 1,500 exp/h is left in place once real rates are known, when a session mixes grounds (use kill cells), or when a mean hides one high-level death (medians, per player first).

*Evidence.* `balance.md` defines exp per hour as `creature exp × 3,600 / (TTK + overhead)` and lists what the harness omits [K, E1, S7]. Pittman built a WoW census to drive a player model and found half of sessions under 10 minutes [V, E1, S149]. Pfau et al. balanced an MMORPG with models of real Aion players [V, E1, S157]. Guildstats and TibiaData show what a Tibia-like can scrape, top-1000 highscores and public death lists, and what it cannot: recovery rate and minutes lost [V, E1, S159, S160]. OSRS exp tables state gear assumptions but no method, and the wiki documents idling per method without an afk share [V, E3, S162, S163]. Tibia moved the instrument into the client in 2017 and third-party analysers import those sessions [V, E3, S161]. CCP has published raw economic CSVs monthly since 2016, Blizzard tuned StarCraft II with a prototyping tool and spreadsheets, and its Classic Hardcore infographic counted 2,000,000 deaths with hunters a fifth of them [V, E1, S164; V, E2, S165; V, E1, S166]. Nielsen: five users give an interval of about ±50 % of the mean [V, E1, S156; I on the arithmetic].

*Cost and knobs.* S. The `-telemetry` flag, nine one-line `emit` calls (§13), a DuckDB file; the harness flags `-exp-per-hour`, `-swing-duty`, `-overhead`.

*In Asterion.* The stream exists and is off; the harness exists and assumes 1,500 exp/h and 10 s of overhead, the single most load-bearing unmeasured number in this study [K, E1, S7, S8, S10]. One evening with the flag on gives M1 to M10 in §13 from real play. Add `corpse_recovered`, `skill_up` and `party_size` first; they unlock H3, H4 and H6.

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 4 · Cheapness 4 · Fit 5 · Testability 5

---

## 8. Comparison scorecard

Five ratings per card, author judgement, 1 to 5, in the §2 order. Sum out of 25.

| # | Pattern | Fun | Evid. | Cheap | Fit | Test | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Farm-level derived exp, a flat hour per level | 3 | 4 | 5 | 5 | 4 | 21 |
| A2 | Exp stages by world, not by level | 4 | 3 | 5 | 4 | 4 | 20 |
| B1 | One slope with half-weight rungs, shown to the player | 4 | 4 | 5 | 5 | 4 | 22 |
| B2 | A guaranteed rung on a clock | 3 | 4 | 4 | 4 | 4 | 19 |
| C1 | A flat percent that spares skills, bent above a level | 5 | 4 | 5 | 5 | 4 | 23 |
| C2 | A blessing as prepaid insurance | 4 | 4 | 3 | 4 | 3 | 18 |
| C3 | A recoverable share at the corpse | 4 | 3 | 4 | 5 | 4 | 20 |
| C4 | A corpse timer that pauses offline, and loot from a few tiles | 3 | 4 | 5 | 4 | 4 | 20 |
| C5 | A post-death grace period | 4 | 3 | 5 | 5 | 4 | 21 |
| D1 | The rested framing flip, as a capped tries pool | 4 | 4 | 4 | 3 | 3 | 18 |
| D2 | Flatten the party share, never gate it | 4 | 3 | 4 | 5 | 3 | 19 |
| E1 | The newbie fix: no exp loss below level 8 | 4 | 4 | 5 | 4 | 4 | 21 |
| E2 | Milestone-dense levels and legible gates | 3 | 3 | 4 | 4 | 3 | 17 |
| F1 | Telemetry beside the harness | 3 | 4 | 4 | 5 | 5 | 21 |

**Reading the table.** The death family carries the study. C1 scores highest because it is one function on one constant, the twins ran the experiment for 17 years, and the harness already shows where the flat rule stops matching the vision. C5 and E1 are a line each and touch the two moments a new player is most likely to quit, the first death and the second. B1 and A1 are live and score well because they are right; their work is display and measurement, not rules. The lowest scores are the ones that need a system (C2's NPC, D1's pool) or whose evidence is thin for a five-player group (D2, E2). F1 scores on testability alone: nothing else in the table can be judged until the flag is on. The radar in the figure shows the same thing from the other side; the proposals cluster on cheapness and fit, and the spread is in evidence.

---

## 9. Natural experiments

A natural experiment is a change plus the reaction to it, with the date, the version and the numbers when known. Twenty-two cases, oldest first; the last three are Asterion's own, from the decisions log, where the "after" is a harness number because no player reaction was ever measured. Grades refer to the strongest evidence in the row.

| # | Game | When | Change | Reaction | Grade | Lesson |
|---|---|---|---|---|---|---|
| 1 | Ultima Online | 4 May 2000, Renaissance | Trammel: a PvE copy of the world beside Felucca | Subscribers 150,000 in Feb to 250,000 in Oct (vendor); Walton: PvP had driven off over 70 % of new players, and about 5 % of leavers returned | E1 [V, E1, S59; V, E2, S60] | Who can kill you weighs more than any percentage; build the safe facet before strangers arrive |
| 2 | Ultima Online | 23 Jul 2002, Publish 16 | Guaranteed Gain System replaces power hour: a server-clock timer awards a skill tick near your level | Power hour faded; GGS is still in the game; later complaints above skill 70 | E2 [V, E2, S53, S54] | A guaranteed trickle beats a daily burst for infrequent players |
| 3 | EverQuest | Sep 2002 | Levels 50 to 60 smoothed; 51, 54 and 59 stop being hell levels at the same total exp | Hell levels remembered fondly by a minority, hated by most | E2 [V, E2, S67] | A plateau that costs the same total exp but shows no progress feels worse than a uniform grind |
| 4 | Ultima Online | 11 Feb 2003 and May 2003 | Item insurance at 750 then 600 gold per item; Siege Perilous excluded | Accounts peaked near 250,000 after AoS (vendor); Siege players refused it "in any form" | E2 [V, E2, S56; V, E1, S59] | Insurance only works where the penalty was real first; keep one world without it |
| 5 | World of Warcraft | Apr to Nov 2004 | Beta fatigue, exp cut 50 % after hours of play, inverted into rested exp at 200 % | Beta revolt (Penny Arcade, 16 Apr 2004); rested exp became the genre standard | E2 [V, E2, S111, S112, S133] | The same curve framed as a bonus is loved and framed as a penalty is hated |
| 6 | World of Warcraft | 7 and 17 Nov 2004, 1.1.0 and 1.1.1 | Resurrection sickness replaces exp loss; capped at 10 minutes and 25 % durability ten days later | Death became a time cost, not a progress cost; the genre followed | E3 [V, E3, S109] | A time penalty with a visible alternative is accepted where a progress penalty is not |
| 7 | Final Fantasy XI | 15 Apr 2005 | From level 25, death costs 8 % of the exp to next level, never more than 2,400; nothing at or below 30 | Raise II returns 75 %, Raise III 90 %; the rule stands | E2 [V, E2, S116, S115] | Cap the loss in absolute exp so the cost in minutes stops growing |
| 8 | EverQuest | 7 Dec 2005 | Monster Mission exp applies hell-level modifiers "to smooth out the experience curve" | Hell levels effectively ended; fan analysis says the base modifiers never changed | E2 [V, E2, S68, S66] | A plateau can be removed with a multiplier instead of a new curve |
| 9 | RuneScape | 16 Oct and 10 Dec 2007 | One minute of hidden drops, then gravestones of 3 to 15 minutes | Gravestones outlived every later rework | E3 [V, E3, S77, S78] | A short private window removes the humiliation of a bystander's loot |
| 10 | Tibia | Apr 2009, 8.41 | Exp loss above level 23 shrinks with level: one level at 50, 1.5 at 100, 2.5 at 200; blessings protect items 30 to 100 % and are priced by level | Still live 17 years later; blessings became the default state above about level 50 | E2 [V, E2, S21; V, E3, S19, S20] | Scale the penalty to the time it costs, not to the number; let players prepay it |
| 11 | Tibia | 11 Jul 2012, 9.6 | Offline training: 12 hours banked, refilled a second per second online, about 50 % efficiency | Premium feature kept; OT servers reimplemented it within months | E3 [V, E3, S31, S32] | Offline progress is the honest form of rested exp for a skill-by-use game |
| 12 | Old School RuneScape | Oct 2013 to May 2015 | Ground timer stretched: 3 minutes invisible, then 30, then 60 | Jagex later called the changes "unpolled" and "only ever meant to be temporary" | E2 [V, E2, S88, S86] | Each softening becomes the new baseline |
| 13 | Tibia | 15 Sep 2014, 10.55 | Dawnport replaces Rookgaard: try each vocation, leave at 8, out at 20, no item loss below 8; the Adventurer's Blessing to level 21 | Rookgaard kept for old accounts; Dawnport itself replaced by Newhaven in 2025 | E3 [V, E3, S27, S20] | A free grace period for the first hours costs nothing in retention |
| 14 | RuneScape 3 | 26 May 2015; 9 Jan 2023 | Death's Office holds items 24 hours; fee 15 % of value down to 0.5 %; cut to 0.1 % in 2023 | Each cut permanent; the sacrifice option removed | E3 [V, E3, S77] | A fee as a slice of wealth is the only penalty that scales with the economy, and it only ever shrinks |
| 15 | Tibia | 24 Apr 2018, 11.73 | Exercise weapons: 500 charges, 16 min 40 s, two hours of training for 347,222 gold or 25 Tibia Coins | Durable and Lasting tiers added in 2020; a split between convenience and highscore integrity | E3 [V, E3, S33; U, E4, S30] | Selling the grind as an item converts time into a cash-shop line; skill by use stops meaning use |
| 16 | Old School RuneScape | 25 Jun 2020 | Polled rework: three items kept, a 15-minute grave that pauses offline, loot from seven tiles, free under 100,000 gold, 5 % above at Death's Office | Survey "mixed", "many players supportive of a small increase in risk"; hotfixes within 48 hours | E2 [V, E2, S88, S87] | Players will vote for more risk if the risk is capped and legible |
| 17 | World of Warcraft | Oct 2020, Shadowlands | Level squish 120 to 60; new accounts 10 to 50 in one expansion | Levelling 50 to 70 % faster; backlash over levels "meaning nothing" | E3 [V, E3, S114, S113] | Compressing the curve helps newcomers and devalues veterans' numbers at once |
| 18 | Valheim | Feb 2021; 2023 | 5 % of every skill on death with a 10-minute No Skill Drain grace; later a server preset from Casual to Hardcore | The grace was a launch feature (guides dated 12 Feb 2021); hosts document the presets | E3 [V, E3, S102, S100, S101] | Make the second death free; the corpse run itself is the punishment |
| 19 | Path of Exile 2 | Dec 2024 to 2025 | 10 % of the level bar from about level 71, plus the lost map portal | Forum threads to hundreds of pages; Rogers: the loss is a signal, "isn't for everyone"; an older note shows PoE 1's Merciless penalty cut from 20 % to 15 %, so the number has only ever fallen | E2 [V, E2, S105; V, E3, S103, S106; V, E4, S104; U on the 10 %] | Stacking two penalties on one death multiplies the complaints; the number alone was tolerated in PoE 1 for 12 years |
| 20 | Asterion (ours) | 26 Jul 2026, D30 | Temple heals free; food HP regen 6 s to 3 s per point, after "the early levels punish one bad fight for a very long time" | Meat heals 60 HP instead of 30; oso pardo still kills a level 5 in leather 100 % in the harness | E1 [K, E1, E2, S5, S10] | A recovery fix does not move the cliff; the creature next to the right one is still the first death |
| 21 | Asterion (ours) | 3 to 30 Aug 2026, D87 to D149 | A knee at skill 40 after "a partir de nivel 18 no vale la pena subir skill"; then one slope of 1.08 with half rungs after 45 to 46 priced at 763,000 swings | Espada 40: 179 h to 6.3 h; 50: 14.4 h; 100: 707 h; a level 30 harness character went from sword 41 to 86 | E1 [K, E1, E2, S5, S10] | A request about hour 10 must be priced at hour 500; the harness, not a second sentence, found the wall |
| 22 | Asterion (ours) | 29 Jul to 12 Aug 2026, D44 and D113 | Heartstone: free recall, 30-minute cooldown, destroyed by death; cooldown cut to 5 minutes | The out-of-combat gate, not the length, protects the corpse run; thirty minutes "bought dead time" | E2 [K, E2, S5] | The return trip you chose can be short; the one things forced on you stays a walk |

@@FIG:experiments@@

Two cautions. No twin published before-and-after telemetry for a death-penalty change; the quantified reactions are UO's subscriber table (vendor) and the OSRS survey wording [U]. And Asterion's own rows have a harness after and no player after; the protocol in §13 exists to add the second half [I].

### Recurring lessons

1. Every twin that touched its death penalty only softened it, and each softening became the floor (#6, #12, #14). The one counter-example, OSRS 2020, polled for a capped, legible increase (#16) [I].
2. A fixed percent of total progress fails at scale; the fixes were a shrinking curve (#10), an absolute cap (#7) or a slice of wealth (#14). Asterion's flat 10 % is pre-2009 Tibia [I].
3. Prepaid protection turns dread into a gold sink and only works where the penalty is real (#4, #10) [I].
4. Two penalties on one death draw the loudest reaction, and the grace that calms it is cheap (#18, #19) [I].
5. The same curve framed as a bonus is welcomed and framed as a penalty is rejected (#5, #11) [I].
6. Plateaus were removed with multipliers, not new curves (#3, #8, #17). A stage table is enough [I].
7. A fix answered where the sentence was spoken moves nothing at the cliff (#20); a curve tuned at hour 10 must be priced at hour 500 (#21) [I].

---

## 10. Anti-patterns

Ways the twins, and Asterion's own log, made curves feel unfair, grindy or boring. Each names a case.

### X1. A flat percent of a cubic

Ten percent of total exp costs minutes at level 8 and a weekend at level 120 because exp grows as L³ and the hour per level does not. Tibia ran it for seven years and bent it in 8.41 [V, E2, S21]. Asterion runs it today [K, E1, S4].

### X2. Two penalties on one death

PoE 2 stacks exp loss and a lost portal and draws hundreds of forum pages where PoE 1's exp loss alone drew yearly campaigns [V, E3, S103]. Asterion stacks exp, the bag, nine slot rolls and a destroyed heartstone, then charges the second death at full price [K, E1, S4].

### X3. A corpse clock longer than the session

Tibia's 30 minutes against three-hour sessions was a race; the same 30 minutes against a 26-minute median session is an appointment [V, E1, S149; I]. Zagal calls a rule that decides when you must play a dark pattern when it serves the creator [V, E2, S151].

### X4. Skill loss on death

Meridian 59 took 1 to 2 % of every skill and Tibia 7.x 10 % of skill tries; both punished the slowest curve the hardest and made months reversible [U, E4, S84; V, E3, S19]. Asterion dropped it on purpose, a choice with 30 years of lineage behind it [K, E2, S5].

### X5. Hell levels and visible knees

EverQuest's doubled levels earned a name and were smoothed away; Asterion's D87 knee at skill 40 made 45 to 46 cost 763,000 swings and lasted 27 days [V, E3, S66; K, E2, S5]. A smooth curve never earns a name, which is good for fairness and bad for landmarks; put the landmarks in content, not in the slope.

### X6. Selling the grind

Exercise weapons compress two hours into 16 minutes for 347,222 gold or 25 coins; a long-time player links the wand era to "most of my friends started to bot" [V, E3, S33; U, E4, S30]. Skill by use that can be bought is a shop, and highscores lose their meaning.

### X7. A range gate that splits friends

Tibia's 2/3 level rule stops a level 61 and a level 40 friend sharing; at a 10-to-1 play ratio that happens in the first month [U, E3, S34; I]. Gorgon flattens exp instead and keeps the group [V, E2, S98].

### X8. The fatigue frame

WoW's beta cut exp after two hours and testers hated it; the identical numbers shipped as rested exp were loved [V, E2, S111]. Any Asterion rule that shows a reduced rate will be read as a penalty whatever its math.

### X9. Dailies and streaks

Tibia's 2017 Daily Reward lane resets on a missed day; CipSoft never published its effect, the retention case for streaks is made for free-to-play, and Frommel and Mandryk call engagement rewards a "dual experience" that can be detrimental [V, E3, S36; V, E2, S167; V, E1, S158]. Asterion refuses them by pillar, at no measurable cost [K, E2, S6].

### X10. A tutorial richer than one sentence

Jagex replaced Tutorial Island with three more cinematic tutorials and came back to the island in 2018 [V, E2, S75]. The censo chain is already in the plain family; do not enrich it.

### X11. Tuning the curve where the sentence was spoken

D30 answered "the early levels punish one bad fight" with a free heal, and oso pardo still kills a level 5 in leather 100 % of the time two screens from town [K, E1, E2, S5, S10]. D87 answered a sentence about level 18 and built a wall at 45. Price every change at the level where the sentence came from and at hour 500.

### X12. Open PvP under PvE death rules

A 10 % loss, a public bag and a 30-minute corpse calibrated against creatures becomes Felucca the day strangers arrive; UO lost over 70 % of its new players to that and 5 % came back [V, E2, S60]. Black Desert dropped the exp loss for PvP victims at non-negative karma in 2016 and players called it a "Gamebreaker" for the PvP meta [V, E3, S121]. Decide the PvP loss tier before PvP ships.

### Cost of failure, in minutes

Juul splits failure into energy, life, setback and termination punishment [V, E2, S142]. Castronova's lens turns the penalty into a price. Time is the currency, an EverQuest hour produced goods worth about USD 3.42, so a death is a tax on hours [V, E1, S146]. Asterion has energy punishment in fights, no life layer, two stacked setback punishments (the exp and the bag) and no termination. The minutes, on the harness clock with the 3× overhead for a real session: 4 at level 4, 14 at level 8, 62 at level 20, 92 at 30, 158 at 50, 347 at 80, 528 at 100 and 747 at 120, plus a walk of at most 4 minutes on Akron and a 30-minute window to make it [K, E1, S10; I on the 3×]. Time to retry is the respawn, a free heal and the walk; the heartstone is gone. The design target is one session of 30 to 60 minutes [K, E2, S6]. The flat rule meets it between about level 15 and 40 and misses it on both sides: too cheap to teach at level 4, three to twelve sessions past level 80. The number of deaths is not the problem, since death risk in the harness is a cliff a player learns once per creature. The price of the one death at the wrong level is [I].

---

## 11. Curve Spec for Asterion

The Curve Spec is the smallest set of rules that should produce the feelings in §3. It is a design proposal, tested so far only in the balance harness and the curve lab [I]. Lower layers set the frame for the upper ones; change them first and least often. "Now" values come from the repo at 8836106a with file:line [K, E1, S4].

**Layers, bottom to top.**
1. **The exp table and the divisor.** Tibia's cubic stays. Creature exp is derived from farm level with a divisor of 100, so a band is a flat hour in the harness; the divisor and `max_farm_level` are the only exp knobs (A1).
2. **Hours per level and the friction factor.** The real hour per level is the harness hour divided by the friction factor, which travel, spawn density and food set. Measure it before touching any exp number; a per-world stage table ships at 1.0 (A2, F1).
3. **Skills by use.** One slope of 1.08 on bases 50, 30 and 100 with half-weight rungs; tries to the next rung shown on the sheet; a capped rest pool and a guaranteed rung timer held until M9 says the zero-rung session exists (B1, B2, D1).
4. **Magic level and its gold price.** 1.4 per level, 600 mana an hour on food, 60 gold per 65 mana in potions; the wand gates at 10, 15 and 20 are the visible rungs; the cristal droppers are the leak to watch (A1).
5. **Levels you can feel.** The walk beat changes at 10, 20, 34, 51, 76 and 114; every stretch longer than a session without a gate gets one, and the death screen names the creature and the minutes (E2).
6. **The death penalty.** No exp loss below level 8, a flat 10 % from 8 to 30, the Tibia 8.41 bend above 30; the bag always drops, nine slots at 10 %, skills and magic never; a 15-minute grace after a death waives the exp, not the bag (C1, C5, E1).
7. **The corpse run.** Thirty minutes that tick only while the owner is online; half the lost exp held on the corpse and returned when the owner opens it; a friend who opens it marks it on the owner's map; loot from two tiles (C3, C4).
8. **Insurance.** A temple blessing priced `200 × (L − 20)` gold, minimum 2,000, that halves the slot drop and never covers the bag (C2).
9. **Sessions and the group.** The expedition is the unit, with hunting contracts sized to 45 minutes at the band; party share stays an equal split plus 20 % with no level gate, with Gorgon flattening as the fallback; the carrying friend is paid in gold or titles (D2).
10. **Measurement.** Telemetry on for the collective, nine added events, the harness run before every collective session, and every decision in the log citing a metric (F1).

**Formulas.**

Current, from the repo [K, E1, S4]:

    exp(L)            = (((L − 6)·L + 17)·L − 12) / 6 × 100      # stats.go:15-25; L2 = 100, L8 = 4,200
    creature_exp(F)   = (exp(F + 1) − exp(F)) / 100              # F = max_farm_level (D69)
    max_hp(L)         = 145 + 5L ;  max_mana(L) = 100 + 10L       # stats.go:46, game.go:280
    tries(S → S+1)    = BASE × 1.08^(S − 10)                      # BASE 50 / 30 / 100; fishing 20 × 1.1^(S − 10)
    rung(S)           = 10 + (S − 10) / 2                         # skills.go:119-121
    dmg_max           = attack × rung(sword) × 0.075 + L × 0.3    # combat.go:627; roll uniform in [0.75, 1.25] × dmg_max / 2
    mana_to_next(ml)  = 1600 × 1.4^ml                             # skills.go:250
    speed(L)          = 300 + 4(L − 1); step_ms = ceil(1000 × 150 / speed / 50) × 50
    death             : exp −= 0.10 × exp; bag drops; each of 9 slots drops at 0.10; corpse 900 s + 900 s
    death_cost_h(L)   ≈ 0.10 × exp(L) / exph(L) ≈ (L / 30) × hours_per_level(L)
    party_share       = 1.2 × kill_exp / n                        # party.go:63,68; members within 30 tiles who dealt damage

Proposed [I, model]:

    loss(L)           = 0                                  if L < 8
                      = 0.10 × exp(L)                      if 8 ≤ L ≤ 30
                      = min(0.10 × exp(L), (L + 50)/100 × step(L))   if L > 30    # Tibia 8.41 shape
    grace             : loss = 0 if now − last_death < 15 min; the bag still drops
    corpse_timer      : ticks only while the owner is online and active
    refund            = 0.5 × exp_lost, held on the corpse, returned when the owner opens it in the window
    blessing_price(L) = max(2,000, 200 × (L − 20)); GEAR_DROP 0.10 → 0.05 while held; consumed on death
    stage(world)      = 1.0 for every world until M2 is measured
    rest              : += RATE per hour offline, cap one session of tries; each try counts 1.5 while rest > 0
    party_exp(player) = creature_exp × 0.9^max(0, F − L) if flattening is on; no level gate on sharing

In the model the bend leaves a level 50 death at 101 minutes ×3 instead of 158 and a level 100 death at 245 instead of 528; with the refund collected, 50 and 122 [I, model]. Trust the harness over the model and the telemetry over both.

| Knob | Where | Now | Proposed | Range | Moves |
|---|---|---|---|---|---|
| `EXP_SCALE` | `stats.go:20` (the ÷6 × 100 cubic) | 1.0 | 1.0 | 0.5–2.0 | Every exp number and, through D69, every creature's exp |
| `EXP_STAGES` | new table keyed by world; today `max_farm_level` per creature | off | off, field shipped; candidate Akron 1.5, Ingwen 1.2 | ×0.5–×3 per world | Hours per level per world (A2) |
| `HP_PER_LEVEL` | `stats.go:46` | 5 | 5 | 3–10 | Kills per HP bar; the death-risk cliff |
| `MANA_PER_LEVEL` | `game.go:280` | 10 | 10 | 5–20 | Spell sustain; passive magic rate |
| `SKILL_MULT` | `skills.go:106` | 1.08 (fishing 1.1) | 1.08 | 1.04–1.20 | Doubling time of skill hours, 9 rungs at 1.08 (B1) |
| `SKILL_BASE` | `skills.go:102` | 50 / 30 / 100 | 50 / 30 / 100 | 20–200 | The first evening's skill pace; shielding at 2× sword |
| `SWING_DUTY` | `balance.go:129` (harness) | 0.5 | measured by A7 | 0.2–0.9 | Tries per session hour |
| `SWINGS_PER_MIN` | `game.go:143` (2,000 ms) | 30 | 30 | 20–60 | Tries per hour; time to kill |
| `ML_MULT` | `skills.go:250` | 1.4 | 1.4 | 1.1–4.0 | Doubling time of magic hours, 2 levels at 1.4 |
| `MANA_PER_HOUR` | `game.go:157` (1 per 6 s fed) | 600 fed; 5,400 at the wand | measured by `mana` events | 0–20,000 | Magic hours against gold |
| `DEATH_EXP_LOSS` | `corpse.go:43` | 0.10 flat | 0 below 8; 0.10 to 30; 8.41 bend above | 0–0.25 | Minutes per death at every level (C1, E1) |
| `GEAR_DROP` | `equipment.go:473` | 0.10 per slot | 0.10; 0.05 under a blessing | 0–0.5 | The gear stake; 39 % of deaths lose nothing today |
| `BAG_DROPS` | `equipment.go:486` | on | on | on/off | Whether the corpse run has an object |
| `CORPSE_MIN` | `corpse.go:29-30` | 30 (15 + 15), real time | 30, owner's online time (C4) | 5–60 | The window against the median session |
| `HEARTSTONE_CD_MIN` | `recall.go:43` | 5 | 5 | 1–30 | The return trip you chose |
| `GRACE_MIN` (new) | `corpse.go:367` | none | 15 | 0–30 | The second death's price (C5); added because the heartstone dies with you |
| `CORPSE_EXP_REFUND` (new) | `corpse.go:88-92` | none | 0.5 | 0–0.75 | The reward for reaching the body (C3); added because the window otherwise holds only the bag |
| `BLESSING_COST` | new temple NPC line | none | `max(2,000, 200 × (L − 20))` | 0–50,000 | A gold sink and a pre-expedition ritual (C2) |
| `WALK_MS_PER_TILE` | `game.go:89,100,123` | 500 at level 1, derived | derived, read only | 200–500 | Corpse-run length; the beat levels |
| `SESSION_MIN` | design assumption, `docs/vision-es.md` | 45 | 45 | 20–180 | Everything measured "per session" |
| `SESSIONS_PER_WEEK` | design assumption | 3 | 3 | 1–14 | Weeks to a level or a rung |
| `PARTY_SIZE` | collective | 1–5 | 1–5 | 1–5 | Party panel |
| `PARTY_BONUS` | `party.go:63` | 0.20 | 0.20 | 0–0.5 | Grouping's exp per hour (D2) |
| `SHARE_RANGE` | `party.go:68` (30 tiles, no level rule) | none | none; Gorgon flattening instead | off, 2/3 rule, flattening | Whether friends at different levels share (D2) |
| `EXP_PER_HOUR` ladder | harness `levels.txt` | 384 at 1, 5,409 at 8, 37,617 at 25, 210,981 at 50, 660,520 at 120 | × measured friction factor | editable table | Hours to every level and minutes per death |

---

## 12. The curve lab

The curve lab, `curves-asterion-lab.html`, plots the Curve Spec with one slider for each knob in the §11 table [K, S12]. It is a model of the game's constants and of the harness's exp-per-hour ladder, not the game. Its math lives in a few pure functions at the top of the script (`expForLevel`, `skillTries`, `manaForML`, `speedForLevel`, `stepMs`, `deathCostMin`), ported from the Go code quoted in §4 and checked against the repo's test values: level 2 is 100 exp, level 8 is 4,200, a rat-hunting death costs about 10 minutes at level 4 and 52 at level 8 [K, E1, S9]. Every "Now" matches `01-current-build.md`; where this page and that note disagree, the note wins.

The knobs are the §11 table in four groups: level curve (`EXP_SCALE`, the `EXP_STAGES` table, `HP_PER_LEVEL`, `MANA_PER_LEVEL`), skills by use (`SKILL_MULT` with Tibia's 1.1 and 1.2 marked, `SKILL_BASE`, `SWING_DUTY`, `SWINGS_PER_MIN`, `ML_MULT` with the knight's 3.0, the paladin's 1.4 and the mage's 1.1 marked, `MANA_PER_HOUR`), death (`DEATH_EXP_LOSS` with the Tibia 8.x toggle, `GEAR_DROP`, `BAG_DROPS`, `CORPSE_MIN`, `HEARTSTONE_CD_MIN`, `BLESSING_COST`) and session and group (`SESSION_MIN`, `SESSIONS_PER_WEEK`, `PARTY_SIZE`, `PARTY_BONUS`, `SHARE_RANGE`, the editable `EXP_PER_HOUR` ladder). Each knob has Now, Proposed and Reset; a Tibia 7.x preset sets the twin's values; a status line names what the last change moved. Three §11 proposals are not modelled in the lab yet, `GRACE_MIN` and `CORPSE_EXP_REFUND`: they change what a death pays back or costs up front, which the harness cannot price without play data, so the lab leaves them to the playtest protocol in §13.

It draws seven panels. Summary cards: hours to level 20, 50 and 100 at the ladder, sessions to each, death cost at levels 8, 30 and 60, sword skill and magic level after 100 hours. The long curve: hours of play on x (linear or log to 2,000 h), level, sword skill and magic level on y, Tibia 7.x dashed, the beat levels and the wand and `min_level` gates ticked. Death cost: minutes lost by one death against level under the flat 10 %, the 8.x bend and the proposal, the corpse-run walk both ways at the level's beat, the expected gear lost, and the vision's "one session" band. A session at level L: a stacked bar of walk out, hunt, walk back and a buffer for a death, with exp as a share of the level, tries gained and expected deaths at the harness's risk. Corpse-run odds: distance from the temple against the 30-minute window at the player's beat, with the heartstone rule and a friend's walk when `PARTY_SIZE` is above 1. Party share: exp per member per hour for one to five members with the 20 %, splitting when a `SHARE_RANGE` rule is on and the gap grows. Exp stages: the long curve with and without the table.

@@FIG:session@@

What to watch [I]:

1. **The three curves on one axis.** With Now, level climbs fastest, sword lands at 50 near hour 14 and magic level crawls; if the session panel shows no rung and no level in a 45-minute bar at a level the five hunt, H3 fails before anyone plays.
2. **Where the death line leaves the band.** Under the flat 10 % the minutes-per-death line crosses 60 near level 30 on the band ladder and near level 15 at ×3; the bend and the refund should hold it inside the band to about level 100.
3. **The corpse-run region.** On Akron every distance is inside 30 minutes at any beat; on Boggland the shaded region shrinks, and the friend's walk is what saves it.
4. **Shielding against sword.** Shielding costs exactly twice at every rung; a shielding base of 50 would make them equal, which the roster was not sized for.
5. **Magic level against gold.** Moving `MANA_PER_HOUR` to the wand rate collapses the magic curve from 186 to 21 hours at level 10; the cristal droppers do the same thing with gold.
6. **The party lines.** With flattening on and a 20-level gap, the low friend's exp per hour should stay at or above solo; a 2/3 rule drops it to zero at the gap.

To use it, pick one hypothesis from §3, move one knob until its panel hits the target, run `go run ./cmd/balance` with the matching flags on the current levels and kits, and trust the harness if it disagrees with the lab by more than one level band. Then ship the value for the collective alone, read the §13 metric for two collective sessions, and keep it only if the sign holds in four of five players [I].

---

## 13. Instrumentation and playtest protocol

Asterion's stream already carries more than most indie telemetry: an envelope with `at`, `kind`, `char`, `build`, `sid`, `world`, and events for session start and end (duration, net exp), kill (creature, the killer's exp share, fight duration, position), death (source, exp lost, level, position), level, damage, heal, mana, consume, loot, item destroy, shop, gold with a reason, every quest step with the time since the previous one, ferry, equip and unequip [K, E1, S8]. It supports a censo funnel, hours per level, exp per hour by ground, death cost in minutes and the gold and potion flows today. Nine additions close the rest. All nine are one `emit` call at an existing site and none adds a client message [K, E1, S8; I].

### Events to add

| # | Event or field | Fields | Metric it unlocks | Cost |
|---|---|---|---|---|
| A1 | `corpse_recovered` | `ms` since the death, `count` items taken, `source` owner or other, position, `amount` gold value taken | M4 recovery rate and time; loot taken by others | S |
| A2 | `death` gains `count` items dropped and `amount2` value dropped | item slugs, value | M3 full death cost: exp, gear, bag | S |
| A3 | `skill_up` | `source` skill, `level` new rung, `count` tries since the last rung, `ms` since the last rung | M9 minutes per rung, tries per hour | S |
| A4 | `magic_level` | new level, mana spent since the last | M9 for magic | S |
| A5 | `spell_learned` | spell slug, gold paid, level and magic level at purchase | gate timing, gold sinks | S |
| A6 | `heartstone_use` | position, `ms` since the last use, `source` recall or destroyed on death | travel saved, M5 time to retry | S |
| A7 | `session_end` gains `active_ms` | ms with any input in the trailing 60 s | afk share; corrects every per-hour rate | S |
| A8 | `kill` gains `count` party size and `source` party or solo | | M7 party share without reconstructing from timestamps | S |
| A9 | `survey` (written by a script) | `sid`, ten answers 1 to 7 | felt against measured | S |

### Derived metrics and views

Load the JSONL into DuckDB with `read_json_auto('telemetry*.jsonl')` or filter with `jq -c`. `at` is ISO time, `ms` milliseconds. Position field names are placeholders until read from the Go struct [K, S8].

**M1 Censo funnel.** Share of characters reaching each step and the median seconds between steps. A churn point is a step whose drop is larger than the previous step's.

    SELECT count, count(DISTINCT char) AS chars, median(ms)/1000 AS med_s
    FROM t WHERE kind='quest_step' AND source LIKE 'censo%' GROUP BY count ORDER BY count;

**M2 Hours per level per player.** Session time between consecutive `level` events (a window join of `level` on `session_end`), compared with the cubic divided by the harness ladder. Report per player, then the median.


**M3 Death cost in minutes.** Exp lost divided by the same player's exp per hour over the previous three sessions, plus recovery minutes (M4) and the gold value dropped (A2) over gold per hour. The vision's target is 30 to 60 minutes; the level where the median crosses 60 is where the flat 10 % stops matching the design.

    WITH rate AS (SELECT char, amount::DOUBLE/(ms/3600000.0) AS exph, at FROM t WHERE kind='session_end' AND ms > 600000)
    SELECT d.char, d.level, d.amount AS xp_lost,
      d.amount / (SELECT avg(exph) FROM (SELECT exph FROM rate r WHERE r.char = d.char AND r.at < d.at ORDER BY r.at DESC LIMIT 3)) * 60 AS minutes
    FROM t d WHERE d.kind = 'death';

A quick look: `jq -c 'select(.kind=="death") | {char, level, xp_lost: .amount, source}' telemetry.jsonl`.

**M4 Corpse recovery rate and time.** `corpse_recovered` with `source = 'owner'` within 30 minutes of a death, over deaths; the median `ms`; the share of deaths where someone else looted first.

**M5 Time to retry and quit after death.** Seconds from a death to the same character's next kill; the share of deaths followed by `session_end` within 10 minutes with no kill between.


**M6 Exp per hour by ground, and the friction factor.** A ground is a world plus a 64 by 64 tile cell of the kill position. Report the mechanical rate (as the harness defines it) and the session rate (`session_end.amount / ms`); their ratio is the friction factor.

    SELECT world, floor(x/64) AS cx, floor(y/64) AS cy, sum(amount) AS xp,
      sum(amount) / (count(*) * median(ms)/3600000.0 + 10.0 * count(*)/3600) AS xph_mech
    FROM t WHERE kind = 'kill' GROUP BY 1, 2, 3 ORDER BY xp DESC;

**M7 Party share.** With A8, exp per member per hour in a party against solo on the same ground. Without it, kills of the same creature within 2 s and 10 tiles by different characters.

**M8 Potion and gold flows.** `consume` per hour by item; `gold` by reason per session, bank moves excluded; potion gold per 1,000 exp.

    SELECT char, source, sum(amount) AS gold FROM t WHERE kind = 'gold' AND source NOT LIKE 'bank%' GROUP BY 1, 2;

**M9 Skill curve as lived.** With A3, `ms` per rung by skill and rung, tries per active hour, and the median rungs per session (skill, magic and level together) for sessions over 10 minutes. Compare with `cmd/balance -skills`.

**M10 Session shape.** Duration median, p25 and p75 per player, sessions per week, deaths per session, afk share. Exclude sessions under 10 minutes from every per-hour rate; half of one WoW realm's sessions were that short, and session lengths are heavy-tailed in every trace studied, so report medians [V, E1, S149, S150].

**M11 Level gap in the group.** Weekly max minus min level among the five, and the share of party kills where the gap exceeds 10.

@@FIG:dashboard@@

### Six-week protocol for five players

Run a test server with `-telemetry /var/asterion/telemetry.jsonl -telemetry-daily`, or turn it on in production with the five players' consent, since the files hold names and positions [K, E1, S8]. Fresh characters in week 1 so the funnel and the first deaths are observed. Pull with `deploy/pull-telemetry.sh` after every collective session. Before each week, write one hypothesis with a number and the harness prediction for it. One collective 60-minute session a week, screen-recorded, no think-aloud during fights, plus solo sessions at will. The survey takes 3 minutes at the end of every session [I].

| Week | Play | Measure | Hypothesis to write down |
|---|---|---|---|
| 1 | Censo chain, La Tortuga Coja, rats | M1, M10, first M3 | Censo completion 5 of 5; a death at level 8 or below costs under 60 minutes (H1) |
| 2 | Akron hunting solo and in pairs | M2, M6, M8, M9 | Friction factor between 0.5 and 0.7 (H8) |
| 3 | First group expedition; first ferry to Ingwen | M7, M11, M4 | Recovery rate at least 4 of 5 deaths; party exp per member at least solo (H4, H6) |
| 4 | Ingwen at levels 20 to 35 | M3 by level, M5 | Death cost at level 25 under 90 minutes; no quit within 10 minutes of a death (H2, H5) |
| 5 | Switchback week, only if a rule below fired: one knob, all five | the metric that fired | The sign of the change in 5 of 5 players |
| 6 | Free play, no instructions | M10, M2, M9 | Sessions still 30 to 60 minutes; one rung per session in at least one skill (H3) |

The ten-item survey, 1 to 7 unless noted. Items 1 to 4 paraphrase the PENS subscales, 5 to 8 the four CORGIS challenge types, 9 and 10 are the series' own [V, E1, S154, S155; K, S1, S2].

1. Competence: "I felt capable and effective playing today."
2. Autonomy: "I did what I wanted to do today, not what the game made me do."
3. Relatedness: "I felt connected to the others I played with."
4. Presence: "I lost track of time at least once."
5. Performative challenge: "Fights demanded quick or precise action."
6. Cognitive challenge: "I had to think hard about where to hunt or how to survive."
7. Emotional challenge: "Something today felt tense or risky."
8. Decision-making challenge: "I faced choices with real trade-offs (route, risk, gold)."
9. If you died: "The loss was my fault, the game's, or luck." Then: "How many minutes did that death cost you?" A number, to compare with M3.
10. "Did you make visible progress this session?" Yes, a little, no. Then: "Will you log in tomorrow?" Yes, maybe, no.

### Decision rules

A rule fires only when it holds in two collective sessions on the same build and the sign is the same in at least 4 of 5 players [I].

| # | Signal | Threshold | Knob |
|---|---|---|---|
| R1 | M1 censo funnel | Any step with fewer than 4 of 5 completers, or a median gap over 10 minutes | That step's text or distance, not its reward |
| R2 | M3 death cost, median at a band the five hunt | Above 90 minutes | C1's bend for that band, or `EXP_STAGES`; recheck M2 |
| R3 | M3 death cost, median | Under 15 minutes at a band above level 10 | Death is noise; raise `GEAR_DROP`, not the exp |
| R4 | M4 recovery rate | Under 3 of 5 deaths recovered by the owner | Pause the timer (C4), lengthen it, or shorten the heartstone cooldown |
| R5 | M5 quit within 10 minutes of a death | 2 or more of 5 players in a week | Clarity and recovery first (where is the corpse, how far); the penalty last |
| R6 | M6 friction factor | Under 0.4 at a ground the five keep using | Travel or respawn at that ground; a spawn or an anchor, not creature exp |
| R7 | M9 rungs per session | Median 0 in every skill for 2 weeks under level 50 | The skill base for that skill before `SKILL_MULT`; then B2 |
| R8 | Survey item 9 felt minutes against M3 | Felt at least 2× measured | Make the cost legible on the death screen before changing it |
| R9 | Survey item 10 "no progress" | 3 of 5 in a session where M2 or M9 shows a gain | A feedback problem; the gain happened and was not seen |
| R10 | M11 level gap | Over 10 levels for 2 weeks | D2 flattening or a catch-up ground, not the exp curve |

### What five players can and cannot show

Five players are a qualitative sample. Nielsen's rule gives ±19 % of the mean at a 90 % interval for 20 users and ±27 % for 10; with his SD of 52 % of the mean and n = 5, the interval is about ±50 % [V, E1, S156; I on the arithmetic]. So M3 on five players says "about an hour, between 30 and 90 minutes", never "52 minutes". Sessions cluster by player, so report every metric per player first and then the median of five, the rule MatchRPG's protocol also states [K, S2]. Use medians for every per-session quantity, because one level 30 death outweighs ten at level 8 in a mean; use means only for flows that add up (gold, potions, exp per week). Direction is testable and size is not. Five of five moving the same way is a one-sided sign test at p = 0.031, four of five at 0.19, so the rules ask for four as "look again" and five as "act" [I]. Five friends of the designer can show the funnel, whether a plateau exists, the order of magnitude of a death, the friction factor and every "why". They cannot show retention, any share below 20 %, a difference under about half in any per-hour rate, or anything about players unlike themselves. Any published number carries "n = 5 friends" in its caption.

---

## 14. Backlog: ranked by fun impact ÷ cost

Fun impact is 1 to 5, author judgement; cost S, M or L counts as 1, 2 or 3; score is impact divided by cost, one decimal. Ties are broken by dependency: measurement first, then the rules that need no number from it.

| Rank | Change | Cards | Fun impact | Cost | Score | Hypothesis |
|---|---|---|---|---|---|---|
| 1 | Turn `-telemetry` on for the collective; add `corpse_recovered`, `skill_up` and `party_size` on kills | F1 | 5 | S | 5.0 | H8, H9 |
| 2 | No exp loss below level 8; no slot roll below 5; the bag still drops | E1 | 4 | S | 4.0 | H1 |
| 3 | The corpse timer ticks only while the owner is online | C4 | 4 | S | 4.0 | H5 |
| 4 | A 15-minute grace after a death that waives the exp, not the bag | C5 | 4 | S | 4.0 | H1, H5 |
| 5 | The death screen names the creature, the exp lost and its minutes; the sheet shows tries to the next rung | E2, B1 | 4 | S | 4.0 | H3, H5 |
| 6 | Fix the four stale numbers: GDD §6 skill and speed rows, "35 spells", the rat's 8 exp in the calibration test, and add level 30 and 50 points to it | F1 | 3 | S | 3.0 | H9 |
| 7 | Bend `DEATH_EXP_LOSS` above level 30 to the Tibia 8.41 shape, after M3 has a median at a band the five hunt | C1 | 5 | M | 2.5 | H2 |
| 8 | Hold half the lost exp on the corpse and return it when the owner opens it | C3 | 4 | M | 2.0 | H2, H4 |
| 9 | Ship a per-world exp multiplier table at 1.0 for the week 5 switchback | A2 | 4 | M | 2.0 | H7 |
| 10 | Gorgon flattening on party exp with no level gate; pay the rescuer with a title | D2 | 4 | M | 2.0 | H4, H6 |
| 11 | A temple blessing at `200 × (L − 20)` gold that halves the slot drop | C2 | 3 | M | 1.5 | H2 |
| 12 | A guaranteed-rung timer above sword 60, only if M9 shows the zero-rung session | B2 | 3 | M | 1.5 | H3 |
| 13 | A capped rest pool on skill tries, framed as rest | D1 | 4 | L | 1.3 | H6 |
| 14 | Named rung titles at 50, 70 and 100 and a gate review of levels 36 to 120 | E2 | 3 | L | 1.0 | H3, H7 |

The first six rows cost a day between them and change no headline number. Rows 7 to 10 are the Curve Spec's death and group layers and each needs one metric from row 1 before it ships. Rows 11 to 14 are systems, and the twins' evidence for them in a five-friend group is the thinnest in the study [I].

---

## 15. "See it in action" index

One link per idea, for the reader who wants the twin's own page rather than our summary. Every creature, item and spell named in this study has its card in the Asterion Atlas tab (`#atlas`).

| # | Game | Curve idea | URL |
|---|---|---|---|
| 1 | Asterion | The live game, La Tortuga Coja and the censo chain | https://play.asterion.online |
| 2 | Tibia | Experience formula and table, the cubic Asterion copies | https://tibia.fandom.com/wiki/Experience_Formula |
| 3 | Tibia | Death rules by version, the 8.41 bend | https://tibia.fandom.com/wiki/Death |
| 4 | Tibia | Blessing prices by level and protection table | https://tibia.fandom.com/wiki/Blessings |
| 5 | Tibia | Rookgaard, the level 8 door | https://tibia.fandom.com/wiki/Rookgaard |
| 6 | Tibia | Dawnport, vocation pedestals and no item loss below 8 | https://tibia.fandom.com/wiki/Dawnport |
| 7 | Tibia | Newhaven, the 2025 one-way boat | https://tibia.fandom.com/wiki/Newhaven |
| 8 | Tibia | Offline training, 12 banked hours | https://tibia.fandom.com/wiki/Offline_Training |
| 9 | Tibia | Exercise weapons, two hours in 16 min 40 s | https://tibia.fandom.com/wiki/Exercise_Weapons |
| 10 | Tibia | Party share, the 2/3 rule and vocation bonus | https://tibia.fandom.com/wiki/Party |
| 11 | Tibia | The 2009 census, 76 % at level 20 or below | https://otland.net/threads/jun-02-2009-statistics.34540/ |
| 12 | Tibiantis | A 7.4 recreation at ×1, six years on | https://tibiantis.online/ |
| 13 | The Forgotten Server | Exp stages, the OT pacing knob | https://raw.githubusercontent.com/otland/forgottenserver/master/data/XML/stages.xml |
| 14 | Ultima Online | Guaranteed Gain System, Publish 16 | https://uo.com/?p=11189 |
| 15 | Ultima Online | GGS timer table by skill | https://uo.com/wiki/ultima-online-wiki/skills/skill-gain/ |
| 16 | Ultima Online | Item insurance, Publish 18 | https://uo.com/?p=11298 |
| 17 | Ultima Online | Trammel and what it did to the player base | https://www.engadget.com/2015-02-02-crowfalls-gordon-walton-on-how-trammel-impacted-classic-ultima.html |
| 18 | EverQuest | Death, corpse runs and the rez table | https://paullynch.org/Everquest/Death |
| 19 | EverQuest | Hell levels and the exp modifiers | https://wiki.project1999.com/Experience_Modifier |
| 20 | RuneScape | The constant-ratio exp table | https://runescape.wiki/w/Experience |
| 21 | RuneScape | Tutorial Island's five swaps | https://runescape.wiki/w/Tutorial_Island |
| 22 | RuneScape Classic | Three items kept, ten minutes on the ground | https://classic.runescape.wiki/w/Death |
| 23 | Old School RuneScape | The 2020 death rework, polled | https://oldschool.runescape.wiki/w/Update:Death_Changes |
| 24 | Asheron's Call | Vitae, exp debt instead of loss | https://loresraat.org/wiki/Recovering_from_Death |
| 25 | Diablo II | 75 % back at the corpse | https://maxroll.gg/d2/resources/death |
| 26 | Albion Online | Zone colours and graded loss | https://albionfreemarket.com/articles/view/albion-online-guide-to-zones-and-flagging |
| 27 | Albion Online | The destiny board | https://devtrackers.gg/albion/p/bbd3aa41-guide-the-destiny-board |
| 28 | Project Gorgon | Dying as a skill | https://wiki.projectgorgon.com/wiki/Dying |
| 29 | Valheim | Skill drain and the No Skill Drain grace | https://help.freakhosting.com/games/valheim/configuring-skill-drain-on-death |
| 30 | Valheim | World modifiers, death as a server preset | https://xgamingserver.com/docs/valheim/world-modifiers |
| 31 | Path of Exile 2 | The exp loss debate | https://fr.pathofexile.com/forum/view-thread/3827556 |
| 32 | Elden Ring | Runes and the Sacrificial Twig | https://eldenring.wiki.fextralife.com/Runes |
| 33 | World of Warcraft | Rested exp, the framing flip | https://warcraft.wiki.gg/wiki/Rested |
| 34 | Final Fantasy XI | Exp loss capped at 2,400 | https://www.bg-wiki.com/ffxi/Experience_Points |
| 35 | Haven & Hearth | Inheritance on permadeath | https://ringofbrodgar.com/wiki/Death |
| 36 | Raph Koster | Why corpse runs went bad | https://www.raphkoster.com/2008/11/17/why-are-corpse-runs-bad/ |
| 37 | Raph Koster | Use-based systems and their exploits | https://www.raphkoster.com/?p=592 |

---

## 16. What remains unverified (and corrections)

### Corrections made during the study

- **Four stale numbers in the Asterion docs.** GDD §6 lists skill multipliers 1.8, 1.8 and 1.6 (`docs/GDD.md:222`); the code has 1.08, 1.08, 1.08 and 1.1 since D149 (`skills.go:106`). The movement table lists base 280, +5 a level, 550 ms at level 1 and beats at 5, 12, 20, 31 and 45 (`docs/GDD.md:209-210`); the code has 300, +4, 500 ms and beats at 10, 20, 34 and 51 since D137 and D138 (`game.go:89,123`), and `docs/GDD.md:204` already has the right numbers two rows above. The GDD says "35 spells" (`docs/GDD.md:273`); there are 45 files and 42 lessons. `TestDeathPenaltyCalibration` prices a rat at 8 exp (`phase5_test.go:25`) when D69 made it 2; the test passes because its criterion is "under one hour" [K, E1, S4, S5, S9]. The study uses the code.
- **The brief's walk speed.** `CONTEXT.md` repeated the GDD's 280 and +5 and the 5/12/20/31/45 beats; corrected to the code's values in this report [K, E1, S4].
- **Tibia offline training** arrived with the summer update on 11 July 2012, not in 2011 [V, E3, S31, S32].
- **Tibia exercise weapons** arrived on 24 April 2018 (11.73), not in 2019; 500 charges per weapon in the 2018 announcement, with one answer saying 250 at launch [V, E3, S33; U on the launch count].
- **Tibia's starter island** changed again: Newhaven replaced Dawnport on 21 October 2025 (15.12), capped at level 20, with a level 8 door; rooking was removed with it [V, E2, S28].
- **The OSRS death rework** is the 25 June 2020 update; Jagex's news post is dated 24 June and revised 26 June [V, E2, S88].
- **Path of Exile 2's 10 %** is a community figure; GGG's public statements (Rogers, January 2025) defend the loss without stating the number [V, E2, S105; U, S103].
- **Valheim's No Skill Drain** was a launch feature (guides dated 12 February 2021), not the 0.148.6 patch the brief guessed [V, E3, S102].
- **Twist of Fate.** One note dates it to 8.62 (December 2010), another to 9.4 (2012); the report keeps both and tags the date [U, S24, S41].
- **Tibia blessings** were implemented in 7.2 (2003) per the Blessings and Amulet of Loss pages; one note had "c. 2006/07" [V, E3, S20, S22].

### Still unverified

- **The 3× overhead.** The harness adds 10 s per kill and no travel, food, potions, respawn waits or groups; the 3 that turns its hours into session hours is a guess, and it is the single most load-bearing number in the study. The first telemetry pull replaces it [K, E1, S10; I].
- **The band ladder** interpolates between eight harness levels and assumes a melee kit at every level; distance and wand characters have no ladder [K, E1, S10].
- **Session medians for Tibia-likes** do not exist in the literature; Lineage II's 26 minutes (2005) and one WoW realm (2007) are the proxies [V, E1, S149].
- **Tibia's skill constants** are community-derived and reproduced by TFS from observation, never published by CipSoft [U, S16, S17].
- **CipSoft's rationale for 8.41** is the levels-lost table in its teaser; no fuller statement was reachable [U, S21]. **Stephan Vogler's** "death meant the end" quotes come from blocked pages and are not used as claims [U, S130].
- **Asheron's Call's 5 % vitae per death** rests on one Slashdot thread [U, E4, S80]. **Meridian 59's** numbers rest on one fan wiki snippet [U, E4, S84]. **DAoC's** 2001 patches rest on a third-party re-upload [U, S85].
- **Albion's** 30 % trash and durability figures are community-reported; the official wiki was blocked [U, E3, S92]. **Project Gorgon's** 10 % per level flattening is a developer forum post read as a snippet [V, E2, S98].
- **Offline training's 50 % efficiency** is a wiki statement, not CipSoft's [U, E3, S31].
- **UO's subscriber numbers** are vendor figures in a Wikipedia table whose peak dates conflict [U, E1, S59].

### Blocked sources

tibia.fandom.com returned HTTP 402 to most agents; one read it through the MediaWiki API and another through a text proxy, which is how the Death, Blessings, Dawnport and Exercise Weapons pages were read. tibiawiki.com.br, uo.stratics.com, uoguide.com, wiki.project1999.com, wiki.albiononline.com, valheim.fandom.com, en.uesp.net, poewiki.net, massivelyop.com, dotesports.com, the TibiaLatina and Portal Tibia Vogler interviews and the Project Gorgon forum returned 402, 403 or a bot wall. web.archive.org and tibia.com's news archive were unreachable. Claims that rest on those pages carry [U] and the URL [K].

### Open gaps

- No twin published a corpse recovery rate or minutes lost per death; Asterion's telemetry would be the first in this set with the number [I].
- No paper measures churn against a death-penalty change with telemetry; the natural experiments live in patch histories [V, E2, S135; I].
- No paper studies rested exp, offline training or exp stages as mechanics [I]. Linehan's method for coding when each skill is introduced, practised and combined has only been applied to puzzle games; a Rookgaard play-through coded the same way would be a cheap E3 artefact [V, E1, S145; I].
- No group-size study exists for persistent worlds under 50 players; the WoW and EverQuest work assumes thousands [I].
- The harness cannot show two attackers, so party exp per hour, the one number H6 needs, is unmeasured until A8 ships [K, E1, S4].
- Whether the five would walk back for a bag worth less than the minutes, Toh's sunk-cost prediction, is a survey question nobody has asked them [I].

---

## 17. Sources

Numbered for the [S#] references. All URLs come from the research notes. "Blocked" or "snippet" marks a page read only through a search excerpt, an API or a proxy. Asterion repo paths are relative to the local checkout at main 8836106a, read-only.

**Series and Kingsfoil**

1. Hearthguard difficulty and learning curves (Curves #1), with the series glossary and its sources on Juul, Linehan, Booth, Chen, Cook and Schell: https://kingsfoil-artifacts.netlify.app/curves-hearthguard
2. MatchRPG difficulty and learning curves (Curves #2), with the five-player protocol and the per-player reporting rule: https://kingsfoil-artifacts.netlify.app/curves-matchrpg
3. Asterion, live web build: https://play.asterion.online
4. Asterion repo at main 8836106a (PR #183, 11 September 2026): `server/internal/game/stats.go`, `skills.go`, `game.go`, `combat.go`, `corpse.go`, `equipment.go`, `recall.go`, `party.go`, `npc.go`; `content/creatures`, `content/items`, `content/spells`, `content/npcs`, `content/quests`; `maps/spawns.json`, `maps/worlds/*`; `CLAUDE.md` (local checkout, read-only)
5. Asterion `docs/GDD.md`, §6 "The decided numeric framework" (lines 195 to 285) and §9 decisions log (339 to 515): D9, D10, D30, D38, D44, D57, D69, D85, D87, D113, D137, D138, D147, D149 (local, read-only)
6. Asterion `docs/vision-es.md`, pillars P1 to P6, §2.3 anti-compulsion, §2.4 where slowness lives, §2.5 death calibration (local, read-only)
7. Asterion `docs/systems/balance.md` and `server/cmd/balance`, the combat harness: `-skills`, `-levels`, `-economy`, `-baseline`; defaults 1,500 exp/h, 50 % swing duty, 10 s overhead (local, read-only)
8. Asterion `docs/systems/telemetry.md`, `deploy/pull-telemetry.sh` and `server/cmd/sessionreport`: the JSONL event stream, off by default (local, read-only)
9. Asterion `server/internal/game/phase5_test.go`, `TestDeathPenaltyCalibration` (lines 15 to 57): 10 minutes at level 4, 52 at level 8, at 480 exp/h on rats (local, read-only)
10. Harness runs for this study, 13 November 2026: `notes/harness/skills.txt`, `levels.txt` (8 levels, 15 kits, 183 creatures, 60 trials), `economy.txt` (40 trials); the curve model `model.py`, `hours.py`, `band.py`, `best.py`; summarised in `notes/01-current-build.md`
11. Asterion Atlas data, `atlas/data.json` and `atlas/data.summary.json`: 240 creatures, 369 items, 45 spells extracted from the repo's content YAML and sprite atlas
12. The curve lab, curves-asterion-lab.html (companion page)
13. Asterion `docs/systems/onboarding.md`, `high-tier-items.md`, `hunting-contracts.md`; `content/quests/censo_tortuga_coja.yaml`; `content/npcs/tomas.yaml`, `maera.yaml`, `vero.yaml`, `ubbo.yaml`, `sila.yaml` (local, read-only)
14. Asterion `docs/BACKLOG.md`, F-095 (speed per level, line 7400) and F-100 (heartstone, line 1599) (local, read-only)

**Tibia, the ancestor**

15. TibiaWiki, Experience Formula (read via the MediaWiki API): https://tibia.fandom.com/wiki/Experience_Formula
16. TibiaWiki, Formula: skills, magic level, damage per level, HP and mana, speed (API): https://tibia.fandom.com/wiki/Formula
17. The Forgotten Server, data/XML/vocations.xml: https://raw.githubusercontent.com/otland/forgottenserver/master/data/XML/vocations.xml
18. Peonso, Game mechanics through time, otland: https://otland.net/threads/game-mechanics-through-time.216072/
19. TibiaWiki, Death (API and text proxy): https://tibia.fandom.com/wiki/Death
20. TibiaWiki, Blessings (API and text proxy): https://tibia.fandom.com/wiki/Blessings
21. TibiaWiki, Updates/8.41, quoting tibia.com news 944 and 945 (API): https://tibia.fandom.com/wiki/Updates/8.41
22. TibiaWiki, Amulet of Loss (API): https://tibia.fandom.com/wiki/Amulet_of_Loss
23. The Forgotten Server, src/player.cpp, getLostPercent: https://raw.githubusercontent.com/otland/forgottenserver/master/src/player.cpp
24. TibiaWiki, Twist of Fate (API): https://tibia.fandom.com/wiki/Twist_of_Fate
25. TibiaWiki, Rookgaard (API): https://tibia.fandom.com/wiki/Rookgaard
26. TibiaWiki, Island of Destiny (API): https://tibia.fandom.com/wiki/Island_of_Destiny
27. TibiaWiki, Dawnport (API and text proxy): https://tibia.fandom.com/wiki/Dawnport
28. TibiaWiki, Newhaven (API; confirmed by the lead): https://tibia.fandom.com/wiki/Newhaven
29. otland repost of tibia.com "Statistics", 2 June 2009, CipSoft's census: https://otland.net/threads/jun-02-2009-statistics.34540/
30. TibiaWiki, Training (API), and an otland post linking the wand era to botting (E4): https://tibia.fandom.com/wiki/Training and https://otland.net/goto/post?id=2634199
31. TibiaWiki, Offline Training (API; blocked for other agents): https://tibia.fandom.com/wiki/Offline_Training
32. otland, Teaser 2: Hone your skills offline (2012): https://otland.net/threads/teaser-2-hone-your-skills-offline.161140/
33. TibiaWiki, Exercise Weapons (API and text proxy): https://tibia.fandom.com/wiki/Exercise_Weapons
34. TibiaWiki, Party (API; blocked for other agents): https://tibia.fandom.com/wiki/Party
35. TibiaWiki, Stamina (API): https://tibia.fandom.com/wiki/Stamina
36. TibiaWiki, Daily Reward System (API; blocked for other agents): https://tibia.fandom.com/wiki/Daily_Reward_System
37. TibiaWiki, Prey (API; bot check for other agents): https://tibia.fandom.com/wiki/Prey
38. TibiaWiki, Promotion (API): https://tibia.fandom.com/wiki/Promotion
39. TibiaWiki, Speed (API): https://tibia.fandom.com/wiki/Speed
40. TibiaWiki, Optional PvP, with TibiaVIP's 2013 PvP rules news: https://tibia.fandom.com/wiki/Optional_PvP and https://tibiavip.app/home/news?id=6364
41. TibiaQA, how does Twist of Fate work: https://www.tibiaqa.com/17944/how-does-twist-of-fate-bless-work-in-tibia
42. MeinMMO, a Tibia character sold for about 41,000 euros, with NabBot level data (biased sample): https://mein-mmo.de/en/player-of-a-german-mmorpg-sells-his-character-for-the-equivalent-of-about-41000-euros,1218610
43. TibiaQA, how long would it take to get to a certain level (E4): https://www.tibiaqa.com/34763/how-long-would-it-take-to-get-to-a-certain-level

**Open Tibia servers and 7.x revivals**

44. The Forgotten Server, data/XML/stages.xml: https://raw.githubusercontent.com/otland/forgottenserver/master/data/XML/stages.xml
45. Tibiantis Online, home and exp table: https://tibiantis.online/
46. otland, Tibiara 7.4 RealOTS-engine beta (2025): https://otland.net/threads/usa-7-4-tibiara-realots-engine-7-4-beta-test-world-smooth-client.291088/
47. otland, experience rates poll (97 votes): https://otland.net/threads/experience-rates.29446/latest
48. otland, low rate long term vs mid-high rate short term: https://otland.net/threads/low-rate-long-term-v-s-mid-high-rate-short-term.291062/
49. otland, help with testing low-rate heavy RPG server popularity (poll, 24 voters): https://otland.net/threads/help-with-testing-low-rate-heavy-rpg-server-popularity.259456/
50. otland, discussion about exp stages: https://otland.net/threads/discussion-about-exp-stages.152476/
51. Exordion wiki (7.4-style OT), Blessings: https://exordion.gitbook.io/exordion-wiki/en/gameplay/blessings

**Classic twins**

52. uo.com, Skill gain and the Guaranteed Gain System timer table: https://uo.com/wiki/ultima-online-wiki/skills/skill-gain/
53. uo.com, Publish 16, 23 July 2002, Guaranteed Gain System: https://uo.com/?p=11189
54. uo.com, Publish 16 part 2, 23 July 2002: https://uo.com/wiki/ultima-online-wiki/technical/previous-publishes/2002-2/2002-publish-16-part-2-23rd-july/
55. UO Stratics, Team Comment on skills and stat gain, 20 September 2001 (blocked, snippet): https://uo.stratics.com/content/interviews/evocare.shtml
56. uo.com, Publish 18, May 2003, insurance price and the Siege exclusion: https://uo.com/?p=11298
57. uo.com, Insurance: https://uo.com/wiki/ultima-online-wiki/player/insurance/
58. UOGuide, Skill Cap (blocked, snippet): https://uoguide.com/Skill_Cap
59. Wikipedia, Ultima Online, subscriber table (vendor figures): https://en.wikipedia.org/wiki/Ultima_Online
60. Engadget, Gordon Walton on how Trammel impacted classic Ultima (2 February 2015): https://www.engadget.com/2015-02-02-crowfalls-gordon-walton-on-how-trammel-impacted-classic-ultima.html
61. Raph Koster, Use-based systems (18 July 2006): https://www.raphkoster.com/?p=592
62. Raph Koster, Why are corpse runs bad? (17 November 2008): https://www.raphkoster.com/2008/11/17/why-are-corpse-runs-bad/
63. Raph Koster, The Laws of Online World Design: https://www.raphkoster.com/games/laws-of-online-world-design/the-laws-of-online-world-design/
64. Raph Koster, Do levels suck? (16 December 2005) and part II: https://www.raphkoster.com/2005/12/16/do-levels-suck/
65. EverQuest, On Death and Dying (2002 to 2003 guide): https://paullynch.org/Everquest/Death
66. EQEmulator forums, hell levels and the exp formula (snippet): https://www.eqemulator.org/forums/showthread.php?p=269803
67. Project 1999 wiki, Experience Modifier, with the September 2002 patch text (blocked for most agents): https://wiki.project1999.com/Experience_Modifier
68. RedGuides, EverQuest patch message, 7 December 2005: https://www.redguides.com/community/threads/patch-message-december-7th-2005.7702/latest
69. EverQuest producer letter, January 2001, group bonus (snippet): https://everquest.allakhazam.com/editorial/011401_EQ_Producers_letter.html
70. EverQuest, New group bonuses being tested, May 2003 (snippet): https://everquest.allakhazam.com/story.html?story=1654
71. Project 1999 wiki, Advanced Techniques Guide, corpse dragging and consent: https://wiki.project1999.com/Advanced_Techniques_Guide
72. Ten Ton Hammer, EverQuest Next: why we need corpse runs (14 May 2013, E4): https://www.tentonhammer.com/articles/everquest-next-why-we-need-corpse-runs
73. RuneScape Wiki, Experience: https://runescape.wiki/w/Experience
74. RuneScape Wiki, Skill mastery (first 99s): https://runescape.wiki/w/Skill_mastery
75. RuneScape Wiki, Tutorial Island: https://runescape.wiki/w/Tutorial_Island
76. RuneScape Classic Wiki, Death: https://classic.runescape.wiki/w/Death
77. RuneScape Wiki, Death (mechanic), with the 2007, 2015 and 2023 changes: https://runescape.wiki/w/Death_(mechanic)
78. RuneScape Wiki, Gravestone: https://runescape.wiki/w/Gravestone
79. Asheron's Call handbook mirror, Recovering from Death: https://loresraat.org/wiki/Recovering_from_Death
80. Slashdot, 50 First Deaths, on designing MMO respawning (5 March 2004, E4): https://games.slashdot.org/story/04/03/05/0356252/50-first-deaths---on-designing-mmo-respawning
81. Maxroll, Diablo II death: https://maxroll.gg/d2/resources/death
82. Wurmpedia, Skills: https://www.wurmpedia.com/index.php/Skills
83. Massively OP, The Game Archaeologist: Meridian 59: https://massivelyop.com/2016/02/27/the-game-archaeologist-meridian-59/
84. Tropedia, Meridian 59 (snippet, E4): https://tropedia.fandom.com/wiki/Meridian_59
85. Dark Age of Camelot patch notes 1.06 and 1.08, September 2001 (third-party re-upload): https://www.scribd.com/doc/313688314/Patchnotes

**Modern twins**

86. Old School RuneScape Wiki, Death, update history 2013 to 2026: https://oldschool.runescape.wiki/w/Death
87. Old School RuneScape Wiki, Death's Office: https://oldschool.runescape.wiki/w/Death%27s_Office
88. Jagex via the OSRS Wiki, Update: Death Changes, 24 June 2020 (confirmed by the lead): https://oldschool.runescape.wiki/w/Update:Death_Changes
89. Old School RuneScape Wiki, Skill mastery, 99 and max counts: https://oldschool.runescape.wiki/w/Skill_mastery
90. Old School RuneScape Wiki, Slayer: https://oldschool.runescape.wiki/w/Slayer
91. Inkl, the 771-hour max speedrun: https://www.inkl.com/news/this-mmo-is-the-only-place-you-d-see-a-record-setting-771-hour-speedrun
92. Albion Free Market, guide to zones and flagging (community figures): https://albionfreemarket.com/articles/view/albion-online-guide-to-zones-and-flagging
93. Albion dev tracker, fame credits explained: https://devtrackers.gg/albion/p/a815039d-everything-you-need-to-know-about-fame-credits-yellow-fame-with-a-quick-summary-and-detailed-explanation-number-crunching
94. Albion dev tracker, guide to the destiny board: https://devtrackers.gg/albion/p/bbd3aa41-guide-the-destiny-board
95. Epic Games Store, Albion Online FAQ, 30 learning points a day: https://store.epicgames.com/p/albion-online-faq-009365
96. MMOBomb, Christoph Hombergs on Albion's past, present and future (2023): https://www.mmobomb.com/albion-online-talks-past-present-future
97. Project Gorgon Wiki, Dying: https://wiki.projectgorgon.com/wiki/Dying
98. Project Gorgon forum, group play vs solo play, exp flattening (developer post, snippet): https://forum.projectgorgon.com/archive/index.php/t-2465.html
99. Steam Charts, Project: Gorgon: https://steamcharts.com/app/342940
100. Freakhosting, configuring skill drain on death (Valheim): https://help.freakhosting.com/games/valheim/configuring-skill-drain-on-death
101. XGamingServer, Valheim world modifiers reference: https://xgamingserver.com/docs/valheim/world-modifiers
102. Gamer Tweak, Valheim No Skill Drain buff explained (12 February 2021): https://gamertweak.com/valheim-no-skill-drain-buff-explained
103. Path of Exile 2 forum, Experience gain and loss in Path of Exile 2: https://fr.pathofexile.com/forum/view-thread/3827556
104. Path of Exile forum, Experience penalty on death, quoting an older patch note: https://pathofexile.com/forum/view-thread/3720475/page/2
105. Digital Trends, Jonathan Rogers on the PoE 2 death penalty (14 January 2025): https://digitaltrends.com/?p=3828963
106. Mein-MMO, Path of Exile 2 punishes players too harshly: https://mein-mmo.de/en/path-of-exile-2-punishes-players-too-harshly-preventing-them-from-taking-more-risks,1223404
107. Fextralife, Elden Ring Runes: https://eldenring.wiki.fextralife.com/Runes
108. Warcraft Wiki, Rested: https://warcraft.wiki.gg/wiki/Rested
109. Warcraft Wiki, Resurrection Sickness: https://warcraft.wiki.gg/wiki/Resurrection_Sickness
110. Warcraft Wiki, Party Sync: https://warcraft.wiki.gg/wiki/Party_Sync
111. Psychology of Games, Framing and World of Warcraft's rest system (March 2010), Pardo via Chris Remo: https://www.psychologyofgames.com/2010/03/framing-and-world-of-warcrafts-rest-system/
112. Game Developer, GDC: Blizzard's core game design concepts (Pardo, 2010): https://www.gamedeveloper.com/game-platforms/gdc-blizzard-s-core-game-design-concepts
113. Blizzard Watch, Level squish inevitable, Hazzikostas Q&A (22 March 2019): https://blizzardwatch.com/2019/03/22/level-squish-inevitable/
114. MMOGames, How Shadowlands fixes leveling: https://www.mmogames.com/articles/archives/wow-wednesday-how-shadowlands-fixes-leveling
115. BG Wiki, Final Fantasy XI Experience Points: https://www.bg-wiki.com/ffxi/Experience_Points
116. BlueGartr, An important notice regarding experience system revisions (Square Enix, April 2005): https://www.bluegartr.com/threads/31997-An-Important-Notice-Regarding-Experience-System-Revisions
117. Ring of Brodgar, Haven & Hearth Death and inheritance: https://ringofbrodgar.com/wiki/Death
118. EVE University Wiki, Clones: https://wiki.eveuniversity.org/Clones
119. EVE University Wiki, Skills and learning: https://wiki.eveuniversity.org/Skills_and_learning
120. Mortal Online map, skill guide, the 1,100 to 1,200 point cap: https://www.mortalonlinemap.info/guides/31
121. Mein-MMO, Black Desert karma patch, exp loss removed for karma at or above 0 (3 June 2016): https://mein-mmo.de/en/black-desert-pvp-patch-karma-aenderungen,84434
122. Ashes of Creation forums, death penalty and experience debt thread (E4): https://forums.ashesofcreation.com/discussion/46082
123. Guild Wars 2 Wiki, Dynamic level adjustment: https://wiki.guildwars2.com/wiki/Dynamic_level_adjustment
124. tracker.gg, Haven & Hearth Steam population: https://tracker.gg/population/steam/3051280

**Designer sources**

125. The Escapist, Schubert on the SWTOR death penalty (2011): https://escapistmagazine.com/?p=81623
126. GameBanshee, SWTOR forum activity repost, Schubert's "bumblebee" posts: https://gamebanshee.com/k9caf
127. Game Informer, Demon's Souls director discusses difficulty (5 November 2009): https://gameinformer.com/games/demons_souls/b/ps3/archive/2009/11/05/feature-demon-s-souls-director-discusses-difficulty-sequels-and-more
128. Game Informer, Hidetaka Miyazaki on Sekiro (21 August 2018): https://gameinformer.com/interview/2018/08/21/hidetaka-miyazaki-on-sekiro-shadows-die-twice
129. Ten Ton Hammer, Pantheon discusses its death penalty mechanic (14 February 2014): https://www.tentonhammer.com/news/pantheon-discusses-death-penalty-mechanic
130. TibiaLatina, Interview with Steve (Stephan Vogler) (blocked, 402): https://tibialatina.fandom.com/wiki/Interview_with_Steve
131. Massively OP, Albion Online's head of ops on the newbie experience (22 July 2025): https://massivelyop.com/2025/07/22/interview-albion-onlines-head-of-ops-on-the-newbie-experience-streamlined-leveling-and-more/
132. USgamer, How World of Warcraft was made: https://www.usgamer.net/articles/how-world-of-warcraft-was-made-the-inside-story
133. Penny Arcade, 16 April 2004 (the beta fatigue strip): https://www.penny-arcade.com/comic/2004/04/16
134. Ian Schreiber, Game Balance Concepts, Level 7: Advancement, progression and pacing (18 August 2010): https://gamebalanceconcepts.wordpress.com/2010/08/18/level-7-advancement-progression-and-pacing/

**Papers and theory**

135. Klastrup, L. "Why Death Matters: Understanding Gameworld Experience." Journal of Virtual Reality and Broadcasting 4 (2007), no. 3: https://www.jvrb.org/jvrb/article/view/4.2007.3
136. Yee, N. "Social Architectures in MMOs." The Daedalus Project, 10 June 2008, page 4: https://nickyee.com/daedalus/archives/001625.php?page=4
137. Allison, F., Carter, M., Gibbs, M. "Good Frustrations: The Paradoxical Pleasure of Fearing Death in DayZ." OzCHI 2015, 1,704 responses: https://minerva-access.unimelb.edu.au/bitstream/handle/11343/57076/AllisonCarterGibbs%20DayZ%202015%20OzCHI%20CAMERA%20READY.pdf
138. Kang, A. R. et al. ArcheAge closed-beta behaviour, 270 million records. WWW 2017 companion: https://arxiv.org/abs/1703.01500
139. Kahneman, D., Tversky, A. "Prospect Theory: An Analysis of Decision under Risk." Econometrica 47(2), 1979 (paywalled): https://doi.org/10.2307/1914185
140. Mushtaq, A. "Presence and Effects of Loss Aversion in an Adventure Video Game." MSc thesis, University of Saskatchewan, 2021: https://harvest.usask.ca/handle/10388/13478
141. Toh, W. Player decision-making and economic concepts. Game Studies 21(3), 2021: https://gamestudies.org/2103/articles/toh
142. Juul, J. "Fear of Failing? The Many Meanings of Difficulty in Video Games." 2009: https://www.jesperjuul.net/text/fearoffailing/
143. Heathcote, A., Brown, S., Mewhort, D. J. K. "The power law repealed: The case for an exponential law of practice." Psychonomic Bulletin and Review 7(2), 2000: https://doi.org/10.3758/BF03212979
144. Newell and Rosenbloom's law of practice (1981), summary: https://en.wikipedia.org/wiki/Power_law_of_practice
145. Linehan, C. et al. "Learning curves: analysing pace and challenge in four successful puzzle games." CHI PLAY 2014: https://doi.org/10.1145/2658537.2658695
146. Castronova, E. "Virtual Worlds: A First-Hand Account of Market and Society on the Cyberian Frontier." CESifo Working Paper 618, 2001: https://www.cesifo.org/DocDL/cesifo_wp618.pdf
147. Bartle, R. "Hearts, Clubs, Diamonds, Spades: Players Who Suit MUDs." 1996: https://mud.co.uk/richard/hcds.htm
148. Debeauvais, T. et al. "If you build it they might stay: retention mechanisms in World of Warcraft." FDG 2011, n = 2,865: https://www.artifex.org/~bonnie/WoW_retention_04_24_11.pdf
149. Pittman, D., GauthierDickey, C. "A Measurement Study of Virtual Populations in Massively Multiplayer Online Games." NetGames 2007, citing Kim et al. on Lineage II: https://www.cs.du.edu/~chrisg/publications/pittman-netgames07.pdf
150. Chen, K.-T., Huang, P., Lei, C.-L. ShenZhou Online session traces. INFOCOM 2006: https://people.cs.nycu.edu.tw/~chuang/pubs/pdf/2006infocom.pdf
151. Zagal, J. P., Björk, S., Lewis, C. "Dark Patterns in the Design of Games." FDG 2013: https://gup.ub.gu.se/file/101018
152. Alexandrovsky, D. et al. "Disengagement From Games: Characterizing the Experience and Process of Exiting Play Sessions." Proc. ACM HCI (CHI PLAY) 2024: https://doi.org/10.1145/3677066
153. Yee, N. Hours of play per week, The Daedalus Project: https://nickyee.com/daedalus/archives/print/000758.php
154. Ryan, R. M., Rigby, C. S., Przybylski, A. "The Motivational Pull of Video Games: A Self-Determination Theory Approach." Motivation and Emotion 30, 2006 (PENS): https://link.springer.com/article/10.1007/s11031-006-9051-8
155. Denisova, A., Cairns, P., Guckelsberger, C., Zendle, D. "Measuring perceived challenge in digital games." IJHCS 2020 (CORGIS): https://doi.org/10.1016/j.ijhcs.2019.102383
156. Nielsen, J. "Quantitative Studies: How Many Users to Test?" Nielsen Norman Group: https://www.nngroup.com/articles/quantitative-studies-how-many-users/
157. Pfau, J., Liapis, A., Volkmar, G., Yannakakis, G. N., Malaka, R. "Dungeons & Replicants: Automated Game Balancing via Deep Player Behavior Modeling." 2020: https://antoniosliapis.com/papers/dungeons_replicants_automated_game_balancing_across_multiple_difficulty_dimensions_via_deep_player_behavior_modeling.pdf
158. Frommel, J., Mandryk, R. L. "Daily Quests or Daily Pests? The Benefits and Pitfalls of Engagement Rewards in Games." CHI PLAY 2022 (not read): https://doi.org/10.1145/3549489

**Measurement tools and data**

159. Guildstats, info page, collection method: https://guildstats.eu/info
160. TibiaData API v5, README: https://raw.githubusercontent.com/TibiaData/tibiadata-api-go/main/README.md
161. Hunt Analyser changelog, 15 February 2024: https://world.hey.com/huntanalyser/feb-15-2024-enhanced-sorting-for-hunt-sessions-and-report-d5df2e89
162. Old School RuneScape Wiki, Pay-to-play melee training: https://oldschool.runescape.wiki/w/Pay-to-play_melee_training
163. Old School RuneScape Wiki, Idle and AFKing: https://oldschool.runescape.wiki/w/Idle
164. EVE Online forums, Monthly Economic Report, February 2021, sinks and faucets CSV: https://forums.eveonline.com/t/monthly-economic-report-february-2021/302188
165. GameSpot, Blizzard balances StarCraft II: https://www.gamespot.com/articles/blizzard-balances-starcraft-ii/1100-6282912/
166. MeinMMO, WoW Classic Hardcore: more than 2,000,000 dead heroes (30 September 2023, vendor): https://mein-mmo.de/en/wow-hc-more-than-2000000-dead-heroes-every-5th-is-a-hunter,1041820
167. Game Developer, The science and craft of designing daily rewards, and why F2P games need them: https://www.gamedeveloper.com/business/the-science-craft-of-designing-daily-rewards-and-why-ftp-games-need-them
