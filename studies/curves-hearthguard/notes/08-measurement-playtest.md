# 08. Measurement and playtest protocol for a 5-person collective

Scope. How studios and twins measured difficulty, learning and interest curves, what 5 players can and cannot show, which derived metrics Hearthguard's existing Supabase telemetry already supports, and a concrete per-session protocol with decision rules. Grades follow CONTEXT.md. Facts about Hearthguard come from `notes/01-current-build.md` and the repo at `kingsfoil-heartguard/` (main b509a56) and are tagged [K].

Tool budget used: about 32 calls. Several primary sources were paywalled or only available as summaries (Kim et al. 2008 full text, Medlock et al. 2002 white paper, King's GDC 2024 slides, Mega Crit's GDC 2019 slides). Those are flagged in Gaps.

## Takeaways

1. Every studio in this note measured the same short list. Win or pass rate per stage with attempts as the denominator, where players die, how long a stage takes, and where they quit. King adds "time to abandon" as its fun signal. Hearthguard already logs enough for all four except quit reason and run index. [V, E2] [K, E1]
2. Five players are enough to find the large problems in a chapter and too few to tune a number. Nielsen's 85% figure assumes each problem hits 31% of users. At 10% it drops to 41%. Use the collective for RITE-style "find and fix" rounds and use the sim_bot for numbers. [V, E3] [I]
3. With 10 attempts at a chapter, a 3/10 win rate has a 95% interval of 11% to 60%. Decision rules for 5 players must use wide bands (below 20%, above 80%) and repeat across two sessions, not a single threshold. [I, E1 arithmetic]
4. Short self-report is enough. One 1-7 difficulty item per chapter (Valve used 1-7 per enemy in Left 4 Dead surveys), a drawn interest curve after the run (Schell), and the 11-item miniPXI at most once per build. The 33-item GEQ has a disputed factor structure; skip it. [V, E2/E1]
5. The cheapest stack is the one already in place. Supabase SQL views plus the existing Netlify dashboard. Add Metabase (AGPL) only if the team wants ad-hoc charts. PostHog and GameAnalytics duplicate what `play_events` already holds. [V, E3] [I]

## Q1. How did twins and studios measure curves?

### Takeaway
Studios measure a funnel of stages (floor, level, chapter), a win or pass rate per stage, and where and why players fail. They pair those numbers with direct observation, because the numbers say where and observation says why.

### Cited findings
- Mega Crit (Slay the Spire). A metric server logged every decision from the prototype on. Per card it tracked pick rate when offered, what it was picked over, presence in winning decks, and average damage taken from each enemy by players holding it. Graphs grew from 3 to at least 90. Changes from data include Dual Wield (rarely picked, reworked, then too strong, then limited to Skills) and The Awakened One (cut strength gain after players with many Powers struggled). Giovannetti said acting on the data was not "mathematical". Game Developer, 27 Feb 2018. https://gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder [V, E2]
- Mega Crit's stated balance goal is "reasonably viable", not equal. GDC 2019 talk "Metrics Driven Design and Balance" (summary only). https://gdcvault.com/play/1025731/contactUs [V, E2]
- Community win-rate tables for Slay the Spire (fan A15 spreadsheet) warn that win rate is a poor predictor of card strength, since strong players pick differently. https://docs.google.com/spreadsheets/d/1U8YT9N6sFcIdJJR0NTrnbMaQsKOcanr1gnX8dXgj1Ys/edit [V, E3]. Slay the Spire 2 community sites (MetaBot, BrokenBuilds) state their win rates are community aggregates, not Mega Crit telemetry. https://metabot.gg/en/slay-the-spire-2/cards/win-rate [V, E3]
- King (Candy Crush Saga). Difficulty is the pass rate, or average attempts before a player passes or gives up (Vince Darley, Business of Software). Level 65 churned 50% of players who reached it. https://businessofsoftware.org/talks/how-to-make-sense-of-big-data/ [V, E2]
- King at GDC 2024 (Wedekind, Guardiola). "Time to abandon" and "time to pass" measure whether a level is engaging, separate from difficulty. Harder levels should be shorter. Skill profiles come from wins, losses and attempts per level. The 100 least-fun levels were reworked for "a very significant uplift". No numeric targets published. mobilegamer.biz, 27 Mar 2024. https://mobilegamer.biz/how-king-defines-a-good-candy-crush-saga-level-and-why-it-constantly-prunes-the-bad-ones/ [V, E2]
- King uses bots to predict pass rates and find outliers, but says bots miss how a level feels, so humans stay in the loop (AP, May 2025). https://wtop.com/national/2025/05/how-candy-crush-uses-ai-to-keep-players-coming-back-to-its-puzzles/ [V, E2]
- Microsoft Games User Research (Halo 3). Pagulayan's lab analysed over 3,000 hours of play by about 600 players, tracking weapon use and death locations. Wired, Aug 2007 (mirror). https://wirednews.pages.dev/2007/08/ff-halo-2 [V, E2]. The public Halo 3 death heatmaps on Bungie.net came from online match data after launch, not the lab. https://primagames.com/news/halo-3-heatmaps-released [V, E3]
- TRUE (Tracking Real-Time User Experience). Kim, Gunn, Schuh, Phillips, Pagulayan and Wixon, CHI 2008, pp. 443-452. It pairs logged behaviour with attitudinal prompts and video so a spike in deaths can be replayed. DOI 10.1145/1357054.1357126, https://www.microsoft.com/en-us/research/?p=588775 [V, E1 bibliographic; method summary only, full text not read]
- Valve (Ambinder, GDC 2009). Playtests aim at fun, "not game balancing". Methods are direct observation, think-aloud, Q&A (survey, then individual, then group), stat collection (deaths, level times, TF2 death heatmaps), design experiments, surveys. Example L4D survey item rates each special infected on a 1-7 challenge scale. Warnings include "averages hide extreme examples" and illusory patterns. https://cdn.fastly.steamstatic.com/apps/valve/2009/GDC2009_ValvesApproachToPlaytesting.pdf [V, E2]
- Valve (Ambinder, GDC 2011). Skin conductance and heart rate fed the L4D2 director in an experiment. PC Gamer reported survey enjoyment doubled; single press account. https://cdn.cloudflare.steamstatic.com/apps/valve/2011/ValveBiofeedback-Ambinder.pdf , https://www.pcgamer.com/2011/03/03/breaking-watch-portal-2-eye-tracking-now/ [V, E2; doubling U, E4]
- Steam achievements as a public funnel. An academic study of Steam achievement data found main-game completion rates from 0% to 56%, mean 14%, median 10%. Steam counts owners, not starters, so these are floors. https://link.springer.com/chapter/10.1007/978-3-319-66715-7_65 (as summarised in search) [V, E1]

### Inferences
- [I] Every studio here used attempts, not players, as the denominator, which matches the glossary's "win rate by stage". Hearthguard's stage is the chapter (and the wave inside it).
- [I] King's "time to abandon" maps cleanly to Hearthguard. Time from a run start to an outcome of `quit` or tab close, per chapter reached. Today `quit` carries no reason.
- [I] Riot, Supercell, Rovio and Dota or WC3 stats sites were not researched within budget. They add scale, not method; the method above is enough for a 5-person collective.

### Gaps
- No published numeric pass-rate targets from King. Mega Crit's GDC 2019 slides and figures not read. Kim et al. 2008 full text not read.
- spirelogs (the old public Slay the Spire run dashboard) not checked.

## Q2. What can 5 players show?

### Takeaway
Five players find most problems that hit about a third of players. They will not detect a 10-point change in win rate. The RITE method fits a collective that plays every build: fix what you see, then check the fix on the next player or session.

### Cited findings
- Nielsen and Landauer's model is found = N(1-(1-L)^n). At L = 31%, 5 users find about 85%. Nielsen limits it to "comparable users" using the product in similar ways. Secondary summaries: https://www.netguru.com/blog/usability-testing-guide , https://www.humanfactors.com/newsletters/enough_is_enough.html [V, E3]
- Arithmetic of that model at n = 5: L 0.31 gives 84%, 0.20 gives 67%, 0.10 gives 41%, 0.05 gives 23%. [I, E1 arithmetic]
- Critiques. Spool and Schroeder (2001) found the first 5 users revealed 35% of problems on large sites. Simulations put 5-user coverage between 55% and nearly 100%. https://www.humanfactors.com/newsletters/enough_is_enough.html [V, E3]
- RITE (Medlock, Wixon, Terrano, Romero, Fulton 2002, Microsoft, Age of Empires II tutorial). Change the design as soon as a problem is seen and agreed, then verify the fix with the next participants. The abstract reports a high ratio of problems found to fixes made, with fixes empirically verified. https://en.wikipedia.org/wiki/RITE_Method [V, E3; white paper not read]
- Think-aloud gives "why" in real time but distracts the player and changes play (Valve 2009 slides, link above). [V, E2]
- Schell's interest curve lens asks whether designer intuition matches players' drawn curves. https://gamefroot-developer.gitbooks.io/jesse-schell-the-art-of-game-design-lenses-1-to-1/content/061.html (summary; lens number varies by edition) [V, E2]
- miniPXI (Haider et al. 2022, CHI PLAY). 11 items, one per PXI construct. Built with 15 experts and 628 players across three studies. Single-item reliability .51 to .83, mean .68. Validity confirmed for 9 of 11 constructs. https://researchr.org/publication/HaiderHJBMENGA22/bibtex [V, E1]. A 2024 test-retest study found mixed reliability and warns against single items for long-term tracking of complex constructs. https://arxiv.org/html/2407.19516v1 [V, E1]
- GEQ core has 33 items on a 0-4 scale in 7 subscales. Its factor structure is only partly supported (Johnson, Gardner and Perry 2018); the original validation was never published. https://game-evaluation.github.io/questionnaires/repository/geq.html [V, E1]
- CORGIS has 30 items in 4 subscales (performative, emotional, cognitive, decision-making), 1-7 scale, EFA with N = 394 and validation with about 1,000 players. Published as Denisova, Cairns, Guckelsberger and Zendle 2020, IJHCS 137. https://www-users.york.ac.uk/~pc530/pubs/Denisova_IJHCS_20.pdf [V, E1]

### Inferences
- [I] For a game, "problems" include felt-difficulty spikes, not only usability bugs. A spike that only 1 in 10 players hits (say, a Broodmother death spiral with a specific hero) will be seen by 5 players with only 41% probability per session. Run two sessions per build before calling a chapter clean.
- [I] The collective is not naive after build 1. They are "comparable users" only for first-time questions in their first session. After that, measure learning (attempts to clear, deaths per chapter over runs), not onboarding. Bring in one fresh outside player per build when testing onboarding.
- [I] Retrospective beats think-aloud for Hearthguard. Real-time MOBA input leaves no spare attention. Use a screen recording and a 2-minute replay of the worst moment (the `death` record gives the timestamp) instead.
- [I] A 1-7 single item per chapter is the right size. It copies Valve's L4D survey format and fits the 25 s campfire.

### Gaps
- PENS item count not verified within budget (commonly cited as 21; [U]).
- No study found on small-N reliability of drawn interest curves.

## Q3. Telemetry design for curves

### Takeaway
Hearthguard's `play_events` already supports win rate by chapter, time to die, damage taken per wave, potions per wave, deaths per chapter and the Hearth HP curve. Four small additions close the gaps: a run index, a quit reason, input mode, and a one-tap difficulty rating.

### Cited findings
- Logged today. `plays` has outcome (victory, defeat, quit, disconnected), mode, party_size, hero_class, platform, build, furthest chapter and wave, duration_s, level, kills, deaths, damage, gold, hearth_frac, final. `play_events` has seq, t, kind, chapter, wave, slot, data jsonb. Kinds: death (last 6 s of hits, full hero state, potions left), respawn, level, learn, talent, loot, buy, drink (hp_frac, mobs_near), build, road_fire, dark, hero_wave (kills, dmg_done, dmg_taken, taken_by, deaths, dead_s, gold_earned, levels, casts per skill, drinks, hp_frac), wave_start (mobs, hp_mult, atk_mult, players, levels, early_calls, hearth_frac, mobs_carried), wave_end (how, dur_s, hearth_lost, hearth_hits, hearth_frac, mobs_left), game_over. `supabase/migrations/20261108060000_play_logs.sql`, `scripts/game/telemetry.gd:1-20` [K, E1]
- Not logged today. Run index and first-session flag, quit reason, retries per sitting, time from talent unlock to pick, UI opens, telegraph outcomes, fire relight attempts, time in the dark, Hearth damage by mob kind and lane, real time-to-kill per mob kind, input mode, a difficulty or fun rating, gold at campfire end. `notes/01-current-build.md`, "Not instrumented yet" [K, E1]
- Valve compared conditions with t-tests and regressions on stat data, and warned of illusory patterns. (Valve 2009 slides) [V, E2]

### Derived metrics (computable now unless marked)

| Metric | Definition | Source rows |
|---|---|---|
| Win rate by chapter | attempts that clear chapter c / attempts that start it | `wave_start` where wave=0 per play, `wave_end` how=cleared at wave 5 |
| Win rate by wave | same per (chapter, wave) | `wave_end.how` |
| Hearth HP curve | `hearth_frac` at each `wave_end`, plotted over chapter.wave | `wave_end` |
| Hearth leak per wave | `hearth_lost` / 6,500 | `wave_end` |
| Damage taken per wave | `dmg_taken`, and top 3 of `taken_by` | `hero_wave` |
| Potions per wave | `drinks` | `hero_wave` |
| Deaths per chapter | sum `deaths` | `hero_wave` |
| Time to die | t(death) minus t(previous respawn or wave start) | `death`, `respawn`, `wave_start` |
| Wave clear time | `dur_s` vs bot `dur_s` for the same chapter.wave | `wave_end` |
| Time to kill (proxy) | wave mob HP total / `dur_s`, or `dmg_done` / `kills` | `wave_start.hp_mult`, `hero_wave` |
| Attempts to clear chapter c | runs per player before the first clear of c | `plays` ordered by started_at per user |
| Quit point | (chapter, wave, t) of plays with outcome quit or null | `plays` |
| Time to abandon | duration_s of quit or null plays, by furthest chapter | `plays` |
| Talent pick delay | needs unlock event (not logged) | add `talent_offer` |
| Unspent gold at campfire | gold at last `wave_end` of chapter minus `buy`/`build` in campfire | derivable, add field |

### Bots vs humans
- [K, E1] The seeded `sim_bot` gives a floor. 24-27 min full runs; every non-building bot loses at the Hearth in chapters 3-5.
- [I] Use the bot as the paired baseline. For each build, run the bot on the same seeds per class (3 classes x 3 seeds, headless) and store its plays with `build` and a `bot` flag. A human chapter that is much harder than the bot's (human win rate far below bot win rate on the same chapter) points at a skill or learning problem, not a number problem. A chapter the bot also fails is a number problem.

### Comparing builds with tiny N
- [I, E1 arithmetic] 95% Wilson intervals: 1/5 is 4-62%, 3/10 is 11-60%, 5/10 is 24-76%, 8/10 is 49-94%, 10/20 is 30-70%. Ten attempts cannot separate 30% from 50%.
- [I, E1 arithmetic] Within-subject paired design. Each player plays both builds A and B in one session, order alternated (players 1, 3, 5 play A first). A sign test on "which felt better" needs 5/5 agreement for one-sided p = 0.03; 4/5 gives p = 0.19.
- [I] Use continuous per-wave metrics (Hearth leak, damage taken, clear time) for A/B. A chapter yields 6 waves per attempt, so 5 players x 2 attempts give 60 paired wave rows. That has far more resolution than win rate.
- [I] Sequential caveat. Checking the dashboard after every play and stopping when the number looks good inflates false positives. Fix the stopping rule in advance (two sessions per build), and treat the bot run as the confirmation.
- [I] Learning confounds within-subject runs. Players improve between runs, so build B always benefits if played second. Counterbalancing order fixes most of it.

### Gaps
- No public example found of a small studio publishing A/B results with N under 10.
- Riot and Supercell telemetry methods not researched.

## Q4. Tools fit for a Godot web game with Supabase

### Takeaway
Keep Supabase as the store. Add SQL views for the metrics table above and show them in the existing Netlify dashboard. Metabase is the only tool worth adding for ad-hoc queries. Event SaaS (PostHog, GameAnalytics) would duplicate `play_events` and add a second schema.

### Cited findings
- PostHog. MIT (expat) outside `ee/`; a FOSS-only mirror `posthog-foss` exists. 40.7k GitHub stars. Hobby self-host needs 4 GB RAM and handles about 100k events per month, unsupported. Cloud free tier has 1M events per month and 1,500 survey responses. https://github.com/PostHog/posthog [V, E1 vendor-reported]
- Metabase. Core AGPL-3.0, enterprise directory commercial. About 48.5k stars. https://www.github.com/metabase/metabase/blob/master/LICENSE.txt , https://www.opentechhub.io/metabase/ [V, E1]
- Grafana. Relicensed from Apache 2.0 to AGPLv3 on 20 Apr 2021; plugins stayed Apache. https://grafana.com/blog/2021/04/20/grafana-loki-tempo-relicensing-to-agplv3 [V, E2]
- GameAnalytics has an official Godot SDK. Web export needs a JS script in the HTML template; older docs needed a rebuilt export template. A Godot 4.2-era forum thread reports Godot 4 support trouble. https://docs.gameanalytics.com/integrations/sdk/godot , https://forum.godotengine.org/t/analytics-library-on-godot-4-2/77083 [V, E3]
- Talo. Open-source self-hostable game backend; Godot plugin MIT, listed on the Godot Asset Library (asset 2936), with stats, leaderboards and a dashboard. https://www.godotengine.org/asset-library/asset/2936 [V, E3]
- Godot analytics plugin with a PostHog provider (queue, batching, offline storage, tested on Godot 4.3+). https://titangstudio.itch.io/posthog-provider-godot-analytics [V, E4]

### Tools table

| Name | URL | Licence | Maturity | Good for |
|---|---|---|---|---|
| Supabase SQL views + existing dashboard | https://kingsfoil-hearthguard-dashboard.netlify.app | Supabase Apache-2.0 (platform); own code | In use [K] | All derived metrics above, zero new infra |
| Metabase (OSS) | https://github.com/metabase/metabase | AGPL-3.0 core | ~48.5k stars, mature | Ad-hoc charts on Postgres; connect read-only to Supabase |
| Grafana OSS | https://grafana.com/licensing/ | AGPL-3.0 since 2021 | Mature, ops-oriented | Time series; weaker for funnels; skip unless already used |
| PostHog | https://github.com/PostHog/posthog | MIT outside `ee/` | 40.7k stars, mature | Funnels, session replay, surveys; duplicates `play_events` |
| GameAnalytics | https://docs.gameanalytics.com/integrations/sdk/godot | Proprietary SaaS, free tier | Mature on mobile; Godot 4 web setup fiddly | Progression funnels with no SQL; vendor benchmarks |
| Talo | https://www.godotengine.org/asset-library/asset/2936 | MIT plugin, open backend | Active, small | Player stats and leaderboards if Supabase is ever dropped |
| sim_bot | `kingsfoil-heartguard/tests/sim_bot.tscn` | own code | In use [K] | Seeded floor baseline per build |

## Protocol proposal

### Before the session (designer, 10 min)
1. Run the bot. `godot --headless --path . res://tests/sim_bot.tscn -- --cls=X` for archer, fighter, mage on 3 fixed seeds. Store as plays with `bot = true` and the build string. [K]
2. Write one hypothesis per session in the fun-hypothesis form. Example. "Chapter 2 wave 1 should feel like a push-back after the chapter 1 mow; Hearth leak 5-15%."
3. Ship the four telemetry additions once (S cost each).
   - `plays.run_index` (count of the user's earlier plays on this build) and `plays.first_session` bool.
   - `plays.input` ("mouse" or "touch").
   - `quit` event data `{reason}` from a 3-button prompt on quit. "Too hard", "Out of time", "Bored".
   - `rating` event at each campfire and game over, `{q, value}`.

### During the session (5 players, 45-60 min)
- Each player plays solo first (one run, or until 40 min), then co-op if time allows. Solo first gives clean per-player curves.
- Screen-record. No think-aloud. Observers do not help (Valve rule).
- One observer notes timestamps of visible frustration or delight (laugh, swear, lean back). This is the biometric-free arousal proxy. Cross-check against `death` and `wave_end.hearth_lost` spikes.

### Questions (at most 5 per break)

At each campfire (in-game, one tap each, 25 s fits).
1. "How hard was this chapter?" 1 (far too easy) to 7 (far too hard), 4 = about right. [Valve L4D 1-7 format]
2. "Did you want to keep going?" 1-7.
3. "What killed you or hurt the Hearth most?" (pick from the chapter's elites, boss, Horde, "I don't know").

At game over (in-game or form, about 2 min).
1. The same 1-7 difficulty item for the whole run.
2. "Was the loss your fault, the game's, or bad luck?" (fault, game, luck). Juul's failure-as-information test.
3. "Draw how interested you felt across the run" on a 0-10 line over chapters 1-5 (paper or a 5-slider form). Schell's interest curve.
4. "What one thing would you change?" (free text).
5. "Which moment felt best?" (free text).

Once per build (end of session, 2-3 min). The 11-item miniPXI. Compare builds only on constructs with reliability near .8 (Haider et al. 2022), and do not track it over months.

### What to compute after each session (SQL views)
- `v_chapter_attempts`. Per build, chapter. Attempts, clears, win rate, Wilson 95% interval, bot win rate.
- `v_wave_curve`. Per build, chapter, wave. Median Hearth frac at end, Hearth leak, human vs bot clear time ratio, damage taken, drinks, deaths.
- `v_learning`. Per player. Attempts to first clear of each chapter, deaths per chapter by run_index.
- `v_quits`. Quit point, time to abandon, reason.
- `v_ratings`. Median 1-7 difficulty per chapter, against chapter win rate. Perceived vs actual difficulty in one table.

### Decision rules (the collective is 5 players; a rule fires only if it holds in two sessions on the same build)

| # | Signal | Threshold | Action (knob from notes/01) |
|---|---|---|---|
| D1 | Chapter c win rate, humans | below 20% with at least 10 attempts, and bot also fails c | Number problem. Raise `HEARTH_HP` (6,500) per chapter, or lower mob attack scale for c |
| D2 | Chapter c win rate, humans | below 20% with at least 10 attempts, bot clears c | Skill or learning problem. Add a telegraph or a teach beat; do not touch stats |
| D3 | Chapter c win rate | above 80% with at least 10 attempts and median difficulty item at most 3 | Plateau. Raise `WAVE_STEP` (0.07) inside c, or move a later elite in |
| D4 | Hearth leak on one wave | median above 40% of 6,500 across players | Spike on that wave. Check `taken_by` and Hearth hits; retune that wave's roster |
| D5 | Difficulty item vs win rate mismatch | median item 6-7 while win rate above 60% | Felt difficulty from clarity, not numbers. Fix readability before balance |
| D6 | Quit reason "too hard" | 3 of 5 players in the same chapter | Same as D1 or D2 by bot result |
| D7 | Quit reason "bored" or keep-going item at most 3 | 3 of 5 players in a chapter | Pacing. Check the chapter's sawtooth (hero-vs-mob ratio) and the `xp_to_next` curve (80 + 70L + 6L^2) |
| D8 | Attempts to first clear of chapter 1 | median above 3 | Onboarding problem. Test with one fresh outside player before tuning |
| D9 | Unspent gold at campfire 2 | median above 1,000 | Town not learned. Teach the Town (bot losses with 13k-25k unspent support this) |
| D10 | A/B build comparison | per-wave Hearth leak differs by more than 10 points on paired waves, in the same direction for at least 4 of 5 players | Keep the better build; confirm with the bot on the same seeds |

[I] All thresholds are starting points chosen so a 5-player collective can trigger them in one or two sessions. Revisit after three builds.

## Pattern cards

### P1. Attempts-denominated stage funnel
- Lineage. Arcade continue counts -> King's pass rate and attempts per level -> Mega Crit floor and win-in-deck data. Why. Attempts expose retries that a player-based funnel hides.
- Feeling it protects. "One more try" without grind; catches spikes that end runs.
- Mechanism. win_rate(stage) = clears / attempts; plot per stage with a Wilson interval; flag stages outside 20-80%.
- Works when stages are discrete and repeated. Breaks with very few attempts or when strong players self-select into later stages.
- Evidence. King [V, E2], Mega Crit [V, E2], glossary "win rate by stage".
- Cost S. Knobs. Band edges, minimum attempts.
- Hearthguard. Stage = chapter, sub-stage = wave. Computable from `wave_end` now.

### P2. Time to abandon
- Lineage. Web analytics session length -> King GDC 2024 "time to abandon" vs "time to pass".
- Feeling it measures. Engagement versus frustration; long attempts that end in a quit flag boredom or despair.
- Mechanism. For plays ending in quit or no outcome, duration and the furthest chapter; compare with time to clear.
- Works with many short sessions. Breaks when quits are caused by real life (add the reason prompt).
- Evidence. [V, E2] mobilegamer.biz 2024.
- Cost S. Knobs. Reason options.
- Hearthguard. 6 of 11 plays so far are quits; the reason is missing.

### P3. RITE fix-and-verify loop
- Lineage. Microsoft Age of Empires II tutorial (Medlock et al. 2002) -> GUR practice.
- Feeling it protects. Clarity and competence in onboarding.
- Mechanism. Agree a problem after 1-2 sightings, fix before the next player, verify the fix holds for the rest.
- Works for clarity and learning problems. Breaks for balance numbers, where one player's result is noise.
- Evidence. [V, E3] Wikipedia summary of the white paper.
- Cost S. Knobs. How many sightings before a fix.
- Hearthguard. Use within a session for UI and telegraphs; never for HP or damage numbers.

### P4. Bot floor as paired baseline
- Lineage. King bots predicting pass rate -> Hearthguard `sim_bot`.
- Feeling it protects. Separates "unfair numbers" from "not learned yet".
- Mechanism. Same build, fixed seeds, per class; compare human and bot win rate and clear time per chapter.
- Works with a deterministic sim. Breaks if the bot exploits something humans cannot (perfect kiting) or ignores what humans use.
- Evidence. King [V, E2]; Hearthguard bot runs [K, E1].
- Cost S. Knobs. Seeds, classes, bot skill.
- Hearthguard. Rules D1 and D2 depend on it.

### P5. Single-item chapter difficulty rating
- Lineage. Valve L4D per-enemy 1-7 survey -> miniPXI single items (Haider 2022).
- Feeling it measures. Perceived difficulty, to pair with actual difficulty.
- Mechanism. One 1-7 item at each break; median per chapter; compare with win rate.
- Works in breaks that already exist. Breaks if asked mid-fight or over long-term trends.
- Evidence. [V, E2] Valve; [V, E1] miniPXI reliability .51-.83.
- Cost S. Knobs. Anchors, when asked.
- Hearthguard. Fits the 25 s campfire; rule D5.

### P6. Drawn interest curve
- Lineage. Schell 2008 Lens of the Interest Curve.
- Feeling it measures. Hook, rests and climax as players remember them.
- Mechanism. After the run, players draw 0-10 interest over chapters; overlay with the designer's intended curve and the Hearth HP curve.
- Works for pacing questions. Breaks as a number (memory distortion); use it as a shape.
- Evidence. [V, E2] Schell summary.
- Cost S. Knobs. Resolution (per chapter or per wave).
- Hearthguard. Tests whether the chapter-1-only sawtooth is felt.

### P7. Paired within-subject build comparison
- Lineage. Valve design experiments -> standard within-subject GUR practice.
- Feeling it protects. Avoids shipping a change that only looked better by chance.
- Mechanism. Each player plays A and B, order counterbalanced; compare per-wave metrics and a sign test on preference.
- Works when the change is local (one chapter). Breaks with learning effects across long runs.
- Evidence. Valve [V, E2]; arithmetic [I, E1].
- Cost M (two builds live). Knobs. Which waves, order.
- Hearthguard. Rule D10. Use a debug chapter-select to keep sessions short.

## Glossary additions
- Time to abandon. Seconds from the start of an attempt to the player giving up without a win or loss. King (Wedekind 2024).
- Quit point. The (chapter, wave, time) where a play ends with a quit.
- Bot floor. The result of the seeded `sim_bot` on the same build and seed, used as a baseline for human results.
- Note. The glossary cites CORGIS as Denisova et al. 2017. The full 30-item scale was published in IJHCS 2020 (Denisova, Cairns, Guckelsberger, Zendle); the 2017 paper is the earlier conference version.

## Sources
- Game Developer Staff, How Slay the Spire's devs use data, 2018. https://gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder
- GDC Vault, Slay the Spire: Metrics Driven Design and Balance, 2019. https://gdcvault.com/play/1025731/contactUs
- Community A15 Slay the Spire win-rate sheet. https://docs.google.com/spreadsheets/d/1U8YT9N6sFcIdJJR0NTrnbMaQsKOcanr1gnX8dXgj1Ys/edit
- MetaBot STS2 win rates. https://metabot.gg/en/slay-the-spire-2/cards/win-rate
- Darley, How to Make Sense of Big Data (King). https://businessofsoftware.org/talks/how-to-make-sense-of-big-data/
- Long, How King defines a good Candy Crush level, 2024. https://mobilegamer.biz/how-king-defines-a-good-candy-crush-saga-level-and-why-it-constantly-prunes-the-bad-ones/
- GDC 2024 session page, Sugary Statistics. https://schedule.gdconf.com/session/sugary-statistics-what-we-have-learned-about-candy-crush-content-after-10-years-and-over-15000-levels/900207
- AP via WTOP, Candy Crush AI, 2025. https://wtop.com/national/2025/05/how-candy-crush-uses-ai-to-keep-players-coming-back-to-its-puzzles/
- Wired, Halo 3: How Microsoft Labs Invented a New Science of Play, 2007 (mirror). https://wirednews.pages.dev/2007/08/ff-halo-2
- Prima Games, Halo 3 heatmaps released. https://primagames.com/news/halo-3-heatmaps-released
- Kim et al., TRUE, CHI 2008. https://www.microsoft.com/en-us/research/?p=588775
- Ambinder, Valve's Approach to Playtesting, GDC 2009. https://cdn.fastly.steamstatic.com/apps/valve/2009/GDC2009_ValvesApproachToPlaytesting.pdf
- Ambinder, Biofeedback in Gameplay, GDC 2011. https://cdn.cloudflare.steamstatic.com/apps/valve/2011/ValveBiofeedback-Ambinder.pdf
- PC Gamer, Valve biofeedback, 2011. https://www.pcgamer.com/2011/03/03/breaking-watch-portal-2-eye-tracking-now/
- Steam achievement completion study. https://link.springer.com/chapter/10.1007/978-3-319-66715-7_65
- Netguru usability guide (Nielsen formula). https://www.netguru.com/blog/usability-testing-guide
- Human Factors International, Enough is enough. https://www.humanfactors.com/newsletters/enough_is_enough.html
- RITE Method. https://en.wikipedia.org/wiki/RITE_Method
- Schell, Lens of the Interest Curve (summary). https://gamefroot-developer.gitbooks.io/jesse-schell-the-art-of-game-design-lenses-1-to-1/content/061.html
- Haider et al., miniPXI, CHI PLAY 2022. https://researchr.org/publication/HaiderHJBMENGA22/bibtex
- Haider et al., miniPXI test-retest, 2024. https://arxiv.org/html/2407.19516v1
- GEQ repository page. https://game-evaluation.github.io/questionnaires/repository/geq.html
- Denisova et al., CORGIS, IJHCS 2020. https://www-users.york.ac.uk/~pc530/pubs/Denisova_IJHCS_20.pdf
- PostHog repo. https://github.com/PostHog/posthog
- Metabase licence. https://www.github.com/metabase/metabase/blob/master/LICENSE.txt
- Metabase stars snapshot. https://www.opentechhub.io/metabase/
- Grafana relicensing, 2021. https://grafana.com/blog/2021/04/20/grafana-loki-tempo-relicensing-to-agplv3
- GameAnalytics Godot SDK. https://docs.gameanalytics.com/integrations/sdk/godot
- Godot forum, analytics on 4.2. https://forum.godotengine.org/t/analytics-library-on-godot-4-2/77083
- Talo on Godot Asset Library. https://www.godotengine.org/asset-library/asset/2936
- PostHog provider for Godot analytics. https://titangstudio.itch.io/posthog-provider-godot-analytics
- Hearthguard repo `supabase/migrations/20261108060000_play_logs.sql`, `scripts/game/telemetry.gd` [K]
- `notes/01-current-build.md` [K]
