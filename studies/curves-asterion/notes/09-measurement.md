# 09. Measurement: how twins measured long curves, deaths and skill by use, and what five players can measure in Asterion

Research agent 7 (measurement), Curves #3 Asterion. Written 2026-11-13. Rules of `CONTEXT.md` apply: tags [V]/[I]/[U]/[K], grades E1 to E4, a URL per claim, quotes under 15 words.

Blocked this session: `tibia.fandom.com` (HTTP 402 on every page), `tibiawiki.com.br` (403), `uo.stratics.com` (403), `dotesports.com` (403), `web.archive.org` (not reachable from this tool). Where a blocked page is the only source, the claim carries [U] and the URL so a later pass can verify it.

Reading order for the editor: Q5 (what five players can measure) and the pattern cards are the deliverable. Q1 to Q4 and Q6 are the evidence that the metrics in Q5 are the ones the twins and researchers actually used.

---

## Q1. Public E1 data on level distributions and pace

**Takeaway.** The only full level distributions ever published for a Tibia-like game are CipSoft's own 2009 census (average level 16.5, 0.93% of 6.54 million characters at level 100+) and third-party scrapes of the top-1000 highscores per server. Every other "distribution" (OSRS 99 counts, WoW census, PoE ladders) is a count of the top of the pyramid with no denominator. The measurable lesson for Asterion is the shape: a long tail where most characters never leave the first world, and a time-to-milestone that nobody publishes officially, so communities estimate it from scrapes.

**Cited findings.**
- Tibia, May 2009 census (CipSoft featured article, reposted on OTLand): 6.54 million characters; "approximately 16.5" average level; "over 500,000 level 1 characters"; "1.8 million characters have not even reached level 8"; "Almost 5 million characters" at level 20 or below (76%); 61,021 at 100+ (0.93%); 2,582 at 200+; 57 at 300+; 3 at 400+; about 2.5 characters per account; "approximately 1.7 million characters do not even have a vocation yet" (they never left Rookgaard) [V, E1]. https://otland.net/threads/jun-02-2009-statistics.34540/latest
- Tibia, 2024 (NabBot Discord bot, about 700,000 registered characters, reported by MeinMMO): 36% of registered characters at level 200+, 1.48% at 1,000+ [V, E1 secondary, strong selection bias: Discord-registered active players] https://mein-mmo.de/en/player-of-a-german-mmorpg-sells-his-character-for-the-equivalent-of-about-41000-euros,1218610
- Guildstats collection method: experience data covers "characters in top 1000 for each vocation on server" (4,000 per server); "one server every 20 minutes, so every server gets new data every day"; deaths stored for characters "+100 level and are in any guild or any highscore list"; online time stored from level 25 [V, E1 method] https://guildstats.eu/info
- TibiaData API v5 (open source, scrapes tibia.com): `GET /v5/highscores/:world/:category/:vocation/:page`, `GET /v5/character/:name`, `GET /v5/killstatistics/:world`; category aliases such as `magiclevel` [V, E1 method] https://raw.githubusercontent.com/TibiaData/tibiadata-api-go/main/README.md ; character deaths were reshaped from an object to an array with `killers` and `assists` per entry (pull request history) [V] https://github.com/TibiaData/tibiadata-api-go
- Tibia Watch publishes worlds by players online, guilds by average level and top characters "refreshed in real time" from public CipSoft data [V, E3] https://www.tibiawatch.com/rankings
- OSRS, counts of level 99 per skill from the hiscores (wiki, read 2026-11-13): Hitpoints 769,416; Strength 821,198; Ranged 707,674; Agility 138,040; Runecraft 130,557; Sailing 108,560 (released 19 Nov 2025). Maxed accounts (all 99s): 59,847 as of 1 Nov 2026 (general), 10,633 Ironman as of 11 May 2026. Level 99 needs 13,034,431 exp. First 2277 total: Jebrim IV, 27 Oct 2013, "248 days after release" [V, E1] https://oldschool.runescape.wiki/w/Skill_mastery
- OSRS has no published denominator. Record concurrency is about 240,851 players (Reddit screenshots reported by GamesRadar) [V, E3] https://www.gamesradar.com/games/mmo/with-a-new-record-240-000-players-online-old-school-runescape-is-roughly-8x-bigger-than-its-sister-mmo-and-would-be-the-fourth-biggest-game-on-all-of-steam-if-not-for-a-technicality ; Jagex does not release counts of maxed accounts [V, E3] https://cyberpost.co/how-many-maxed-runescape-accounts/
- WoW, WarcraftRealms census (player-uploaded Census+ addon data, characters level 10+ seen in the last 30 days, about 20,000 per server) [V, E3] https://progression-annexe.blogspot.com/2016/04/how-many-players-was-there-on-vanilla.html ; Ten Ton Hammer analysed the 18 Jul 2006 census for skew and kurtosis of the level distribution (table not readable in the fetched copy) [V, E3] https://www.tentonhammer.com/articles/wow-census-stats-article-7-19-06
- WoW, Pittman and GauthierDickey 2007 (NetGames): measured one realm for 5 weeks, "April 13th, 2007 to May 20th, 2007", with a modified Census+ addon issuing `/who` queries split by level, class and first letter to get around the 50-result cap; census every 15 minutes; "over 32,000 individual playing sessions"; "50% of the sessions were less than 10 minutes"; most sessions under 200 minutes, a handful near 24 hours; session lengths and zone populations look power-law; "approximately 75% of the zones have fewer than 10 people" [V, E1] https://www.cs.du.edu/~chrisg/publications/pittman-netgames07.pdf
- WoW leveling time: no Blizzard statement found. Community estimates for Classic 1 to 60 are 6 to 10 days of `/played` (144 to 240 hours); the speedrun record about 117 hours [V, E3] https://www.warcrafttavern.com/news/how-long-does-it-take-to-get-to-level-60-in-wow-classic-an-objective-look/ ; the "30 days of playing time" figure is one speedrunner's 2013 claim [V, E4] same URL.
- PoE: GGG publishes class shares at level cutoffs per league, not distributions. Blight league, PC, level 90+: Necromancer "42.36% of all characters" [V, E1] https://devtrackers.gg/pathofexile/p/b3ef19ca-blight-statistics-challenges-and-ascendancy-classes ; Harbinger, level 90+: Berserker about 22.6%, no-ascendancy "less than 0.02%" [V, E1] https://www.pathofexile.com/forum/view-thread/2008293
- Albion: Sandbox Interactive publishes infographics per server launch. Albion East, May 2023: players "killed each other 12 million times" in six weeks [V, E1 vendor] https://mmos.com/news/albion-online-east-server-may-2023-infographic

**Inferences.**
- The 2009 Tibia census is the best E1 picture of a Tibia-like funnel: 26% of characters never reach the vocation choice (Rookgaard exit, level 8), 76% never pass level 20, under 1% pass 100 [I from the numbers above]. Asterion's homeworld band (1 to 35) is where the same funnel will live; the censo chain and the first deaths sit inside it.
- "Share above level X" is a stable metric only when the denominator is all characters. Scrapes of top-1000 highscores (Guildstats, TibiaData) can give per-server pace (levels per day for the top 4,000) but not the median player [I].
- Time to milestone is never official. The communities derive it from exp tables and exp/h guides (OSRS 13,034,431 exp at a stated rate, Tibia exp formula at a hunting ground's exp/h). Asterion can compute it the same way from `cmd/balance` plus the cubic exp formula [I].

**Gaps.** No per-server Tibia level distribution found. No OSRS denominator. The 2006 WarcraftRealms level table was unreadable. No Blizzard leveling-time figure. PoE publishes no absolute counts.

---

## Q2. Community exp/h tables as instruments

**Takeaway.** Exp/h tables are the de facto pacing instrument of every skill-grind MMO, and all of them are player-submitted sessions with the assumptions written in prose (level, gear, prayer, "good stacking"). Tibia moved the instrument into the client in 2017 (Analytics, Cyclopedia), and third-party tools now import those sessions. Asterion's `cmd/balance` already gives the mechanical exp/h; the gap is the real-session exp/h with travel and downtime, which only telemetry gives.

**Cited findings.**
- TibiaWiki "Hunting Places" pages list exp/h and loot/h by level and vocation from player-submitted hunts [U, E3, page blocked with 402 this session] https://tibia.fandom.com/wiki/Hunting_Places
- Tibia's in-game Analytics (Cyclopedia and Analytics Selector widgets) were "introduced in the Summer Update 2017"; the widgets track dropped loot, loot value and supplies used [V, E3 via search summary of the wiki page, page blocked] https://tibia.fandom.com/wiki/Cyclopedia
- Hunt Analyser (third party) imports in-game session reports and since 15 Feb 2024 sorts sessions by "Raw XP/H" as well as Balance and XP Gain [V, E3] https://world.hey.com/huntanalyser/feb-15-2024-enhanced-sorting-for-hunt-sessions-and-report-d5df2e89
- How the in-game XP/h is computed is not documented; one community answer says a 60-minute projection usable after 15 minutes, modified by boosts and prey [U, E4] https://www.tibiaqa.com/16900/how-does-the-exp-per-hour-shown-on-the-hunt-analyser-work
- OSRS wiki, pay-to-play melee training: Sulphur Nagua "75k xp/hr at 60 strength", "up to 130k xp/hr at 75 strength" with Blood Moon set and Piety; Maniacal monkeys "200k xp/hr or more", 300k possible; Scurrius "100k+ exp/hr" at base 70 stats. The page states gear and stat assumptions but no sample size or method, and carries a cleanup tag for "obsolete methods and outdated information" [V, E3] https://oldschool.runescape.wiki/w/Pay-to-play_melee_training
- Asterion `cmd/balance`: "Experience/hour: Creature experience × 3,600 / (mean time to kill + overhead)"; defaults "1,500 experience/hour, 50% attacking time, 200 trials, seed 1337, a 240-second fight limit, and 10 seconds of overhead per kill"; "Hourly rates do not deduct recovery, death, ammunition, or consumable costs"; the harness "does not run movement, food regeneration, player spell choices, potion use, travel, or group encounters" [K] `/Users/esenespinosa/Development/personal/games/mmorpg/docs/systems/balance.md`

**Inferences.**
- Reliability of community tables rests on three things the OSRS and Tibia pages do not record: the session length, whether breaks were cut, and the player's attention (afk or active). An in-game analyser fixes the first two and not the third [I].
- Asterion's `cmd/balance` exp/h is an upper bound on real exp/h (no walking, no respawn wait, no potions) and therefore a lower bound on hours per level. The ratio real ÷ bot is itself a metric: call it the **friction factor**; Tibia communities implicitly estimate it when a wiki exp/h for a spot is far below the kill-rate math [I].

**Gaps.** Could not read the TibiaWiki table columns or sample rows (blocked). No published validation of any exp/h table against server logs.

---

## Q3. Death measurement

**Takeaway.** The twins expose deaths as public lists (Tibia's character page, Albion's killboard API) and as occasional vendor infographics (WoW Classic Hardcore, Albion East). Nobody publishes what Asterion most needs: the corpse-run success rate and the minutes a death costs. Those two numbers need a death event joined to a recovery event and to the player's own exp/h, which only server telemetry can give.

**Cited findings.**
- Tibia: the character page lists recent deaths with killers; TibiaData exposes them in `/v5/character/:name` as an array of deaths with `killers` and `assists` [V, E1 method] https://github.com/TibiaData/tibiadata-api-go ; Guildstats stores deaths of level 100+ characters in guilds or highscores and tracks them daily [V, E1 method] https://guildstats.eu/info ; TibiaData also exposes per-world `killstatistics` (CipSoft's "Kill Statistics" page, kills by and of each creature) [V] https://raw.githubusercontent.com/TibiaData/tibiadata-api-go/main/README.md
- Albion: an official read-only "gameinfo" API covers kills, deaths, players, guilds and battles; community killboards poll it (Albion Battle Hub updates "every 20 seconds") [V, E3] https://guildorder.com/games/albion/wiki/the-public-api-and-killboards , https://albionbattlehub.com/about
- WoW Classic Hardcore: Blizzard infographic on X, 30 Sep 2023: more than 2,000,000 deaths; hunters more than 400,000 (about 20%) [V, E1 vendor] https://mein-mmo.de/en/wow-hc-more-than-2000000-dead-heroes-every-5th-is-a-hunter,1041820 ; a later Blizzard release ranks fall damage first with 74,273 deaths [U, E1 vendor, page blocked, from search summary] https://dotesports.com/wow/news/blizzard-share-staggering-death-statistics-from-wow-classic-hardcore
- Death heatmap as a series term: "A map of where players die" (glossary, `docs/formats/design-curves.md`) [K].
- Asterion's `death` event records "Killing source, XP lost, resulting level/XP and position"; `kill` records the killer's share only, "rather than every party member's award" [K] `/Users/esenespinosa/Development/personal/games/mmorpg/docs/systems/telemetry.md`
- Asterion calibration: `deathExpLoss = 0.10`; "hunting rats (~480 exp/h) a death at level ≤ 4 costs about 10 minutes, at level 8 about 52 minutes" (`TestDeathPenaltyCalibration`) [K] `server/internal/game/corpse.go`, CONTEXT.md

**Inferences.**
- A death list answers "who dies to what, where" (the Kill Statistics page is a death heatmap by creature). It never answers "what did it cost", because cost is exp lost ÷ that player's exp/h, and exp/h is private [I].
- Corpse-run success needs three timestamps per death: death, first return to within N tiles of the corpse, and the corpse's expiry (30 min). Success = returned before expiry and took at least one item. Asterion has the first; the second and third need the `corpse_recovered` event in Q5 [I].
- Death cost in minutes grows with level because the cubic exp curve outruns exp/h: 10% of exp(L) is 420 exp at L8 (52 min at 480 exp/h), 9,880 exp at L20 (about 6.6 h at the `cmd/balance` default 1,500 exp/h, less if real exp/h at 20 is higher), 60,180 exp at L35 (12 h at 5,000 exp/h) [I, arithmetic from the GDD formula; real exp/h at those levels unknown until measured]. The metric M3 below is how the collective will find out whether vision §2.5's "one session" holds past level 15.

**Gaps.** No twin publishes a corpse recovery rate. No public data on Tibia 7.x death frequency per hour hunted. The TibiaWiki Death page (exp loss formula by version, blessings) was blocked: https://tibia.fandom.com/wiki/Death [U].

---

## Q4. Skill-by-use measurement

**Takeaway.** Twins publish skill levels (Tibia skill highscores) but never tries per hour or hours per rung; those numbers are reverse-engineered by players from the tries formula. Asterion is in a better place than any twin: the formula is in the code, `cmd/balance -skills` prints the curve, and a `skill_up` event with tries and elapsed time would make the real curve observable per player.

**Cited findings.**
- Tibia highscores have per-skill categories; TibiaData maps aliases such as `magic`, `mlvl` to `magiclevel` and serves `/v5/highscores/:world/:category/:vocation/:page` [V, E1 method] https://raw.githubusercontent.com/TibiaData/tibiadata-api-go/main/README.md
- Tibia tries formula and exercise-weapon tries per charge: TibiaWiki "Skills" page [U, E3, blocked 402] https://tibia.fandom.com/wiki/Skills ; Asterion keeps Tibia's 1.1 base for fishing and uses 1.08 for the three combat skills since D149 [K] CONTEXT.md.
- Ultima Online: the Guaranteed Gain System and the Rate Over Time System are documented on the official site [V, E2, title and existence only; content not read] https://uo.com/?p=6342 ; the 20 Sep 2001 team comment on skill and stat gain [U, blocked 403] https://uo.stratics.com/content/interviews/evocare.shtml ; Koster's design essay on use-based systems [V, E2] https://www.raphkoster.com/?p=592
- OSRS defines idling as "periods when a player is not actively interacting with the game" and documents per-method AFK intervals (for example a 5-minute Duke mining interval), but no share of hours or exp earned afk [V, E3] https://oldschool.runescape.wiki/w/Idle , https://oldschool.runescape.wiki/w/AFKing
- Asterion: "Skills are estimated from experience needed to reach the character level, assumed experience per hour, time spent attacking, and the actual skill-advancement curve"; `go run ./cmd/balance -skills` prints it [K] balance.md. Stated targets: sword 50 in about 14 hours of session, 100 in about 707 hours [K] CONTEXT.md.

**Inferences.**
- The only skill-by-use statistic that matters for a 45-minute session is **minutes per rung at the player's current rung**, and its complement, rungs per session. If the median session yields zero rungs in any skill past sword 40, the player sees no skill progress for weeks [I]. The `skill_up` event in Q5 measures it directly.
- The "afk share" the twins never published is cheap here: `session_end` can carry `active_ms` (time with input in the last 60 s). Afk share = 1 − active_ms ÷ duration_ms. It also corrects every exp/h in this note [I].

**Gaps.** No E1 on afk share in UO or RuneScape. Tibia tries formula constants unverified this session.

---

## Q5. What five players can measure with Asterion's telemetry

**Takeaway.** The existing JSONL already supports a censo funnel, hours per level, exp/h per hunting ground, death cost in minutes and gold and potion flows. Five events (`corpse_recovered`, `skill_up`, `spell_learned`, `heartstone_use`, an `active_ms` field on `session_end`) and one field (`party_size` on `kill`) close the rest. Five players give medians and "did it happen" evidence, not means or percentages; the protocol below is built for that.

### 5.1 What exists [K]

Envelope: `v: 2`, `at`, `kind`, `char`, `build`, `sid` (per-login session), `world`, `to_world`; fields `creature`, `item`, `source`, `amount`, `count`, `ms`, `level`, `exp`, position. Events: `session_start`, `session_end` (duration, net XP), `kill` (creature, killer's XP, fight ms), `death` (source, XP lost), `level`, `damage_taken`/`damage_dealt`, `heal`, `mana`, `consume`, `loot_take`, `item_destroy`, `shop_buy`/`shop_sell`, `gold` (signed, reason), `quest_*`, `quest_step` (ms since previous step), `ferry`, `equip`/`unequip`. Reader: `go run ./cmd/sessionreport [-char] <file>`. Telemetry is off by default on the live server (`-telemetry <path>` turns it on); a bounded 4096-event queue drops under load and a crash can lose up to five seconds [K] telemetry.md.

### 5.2 Events and fields to add

| # | Event or field | Fields | Metric it unlocks | Cost |
|---|---|---|---|---|
| A1 | `corpse_recovered` | `ms` since the death, `count` items taken, `source` = `owner` or `other`, position, `amount` = gold value of items taken | M4 corpse recovery rate, time to recover, loot stolen | S (hook in corpse loot path) |
| A2 | `death` gains `count` items dropped and `amount2` value dropped (or a second `death_drop` event per item) | item slugs, value | M3 full death cost (exp + gear + bag) | S |
| A3 | `skill_up` | `source` = skill name, `level` new rung, `count` tries since last rung, `ms` since last rung | M9 minutes per rung, tries per hour | S |
| A4 | `magic_level` | new ML, mana spent since last | M9 for magic | S |
| A5 | `spell_learned` | spell slug, gold paid, player level and ML at purchase | gear and spell gates, gold sinks | S |
| A6 | `heartstone_use` | position, `ms` since last use, `source` = `recall` or `destroyed_on_death` | travel time saved, M5 time to retry | S |
| A7 | `session_end` gains `active_ms` | ms with any input in the trailing 60 s | afk share, corrects every per-hour rate | S |
| A8 | `kill` gains `count` = party size and `source` = `party` or `solo` | | M7 party share without reconstructing from timestamps | S |
| A9 | `survey` (written by a script, not the server) | sid, 10 answers 1 to 7 | felt against measured | S |

All nine are one `emit` call each at an existing site. None adds a client message.

### 5.3 Derived metrics and views

The views assume the JSONL is loaded into DuckDB (`read_json_auto('telemetry*.jsonl')`) or filtered with `jq -c`. `at` is ISO time; `ms` is milliseconds.

**M1 Censo funnel.** Share of characters reaching each `quest_step` of `censo` and median seconds between steps.
```sql
SELECT count, count(DISTINCT char) AS chars, median(ms)/1000 AS med_s
FROM t WHERE kind='quest_step' AND source LIKE 'censo%' GROUP BY count ORDER BY count;
```
Churn point: a step where chars drops by more than the previous step's drop.

**M2 Hours per level per player.** Session time between consecutive `level` events.
```sql
WITH lv AS (SELECT char, level, at, lag(at) OVER (PARTITION BY char ORDER BY at) AS prev FROM t WHERE kind='level'),
 ses AS (SELECT char, at AS end_at, at - (ms * INTERVAL '1 millisecond') AS start_at FROM t WHERE kind='session_end')
SELECT lv.char, lv.level, sum(epoch(least(lv.at,ses.end_at) - greatest(lv.prev,ses.start_at)))/3600 AS hours
FROM lv JOIN ses ON lv.char=ses.char AND ses.end_at>lv.prev AND ses.start_at<lv.at
GROUP BY 1,2 ORDER BY 1,2;
```
Compare with the cubic curve ÷ bot exp/h (Q6). Report per player, then the median.

**M3 Death cost in minutes.** `death.amount` (XP lost) ÷ the same player's exp/h over the previous three sessions, × 60, plus recovery minutes (M4) and the gold value dropped (A2) ÷ gold/h.
```sql
WITH rate AS (SELECT char, sid, amount::DOUBLE/(ms/3600000.0) AS exph, at FROM t WHERE kind='session_end' AND ms>600000)
SELECT d.char, d.level, d.amount AS xp_lost,
  d.amount / (SELECT avg(exph) FROM (SELECT exph FROM rate r WHERE r.char=d.char AND r.at<d.at ORDER BY r.at DESC LIMIT 3)) * 60 AS minutes
FROM t d WHERE d.kind='death';
```
jq equivalent for a quick look: `jq -c 'select(.kind=="death") | {char,level,xp_lost:.amount,source}' telemetry.jsonl`.
Target from vision §2.5: about one session (30 to 60 min). Plot minutes against level; the point where the median crosses 60 is the level where the flat 10% stops matching the design.

**M4 Corpse recovery rate and time.** `corpse_recovered` with `source='owner'` within 30 min of a death ÷ deaths. Median `ms`. Also the share of deaths where another player looted first.

**M5 Time to retry and quit-after-death.** Seconds from `death` to the next `kill` by the same `char`; share of deaths followed by `session_end` within 10 minutes with no kill in between.
```sql
SELECT d.char, d.at, min(k.at) - d.at AS retry FROM t d JOIN t k ON k.char=d.char AND k.kind='kill' AND k.at>d.at
WHERE d.kind='death' GROUP BY 1,2;
```

**M6 Exp/h by hunting ground.** Hunting ground = `world` plus a 64×64 tile cell of the kill position (or the dominant creature). Active time = span of kills with gaps under 5 min.
```sql
SELECT world, floor(x/64) AS cx, floor(y/64) AS cy, sum(amount) AS xp,
  sum(amount) / (count(*) * median(ms)/3600000.0 + 10.0*count(*)/3600) AS xph_mech
FROM t WHERE kind='kill' GROUP BY 1,2,3 ORDER BY xp DESC;
```
Report both the mechanical rate (as `cmd/balance` defines it) and the session rate (`session_end.amount ÷ ms`). Their ratio is the friction factor.

**M7 Party share.** With A8: share of kills with `count > 1`; exp per member per hour in party against solo for the same ground. Without A8: kills of the same creature slug within 2 s and 10 tiles by different chars.

**M8 Potion and gold flows.** `consume` per hour by item; `gold` by `source` per session; net gold per hour; potions gold ÷ exp gained (gold per 1,000 exp). Bank movements excluded per telemetry.md.
```sql
SELECT char, source, sum(amount) AS gold FROM t WHERE kind='gold' AND source NOT LIKE 'bank%' GROUP BY 1,2;
```

**M9 Skill curve as lived.** With A3: `ms` per rung by skill and rung; tries per active hour (`count ÷ active_ms`). Compare with `cmd/balance -skills`. Rungs per session, median, is the number the players feel.

**M10 Session shape.** Duration distribution per player (median, p25, p75), sessions per week, deaths per session, afk share (A7). Watch for the Pittman shape, where half of sessions are under 10 minutes (Q1): short logins to check the depot are not play sessions and should be excluded from every per-hour rate (filter `ms > 600000`).

**M11 Level gap in the group.** Weekly max − min level among the five, and the share of party kills where the gap exceeds 10 levels (where the equal split plus 20% starts to over-reward the low member).

### 5.4 Six-week protocol for five players

Setup. Run a test server with `-telemetry /var/asterion/telemetry.jsonl -telemetry-daily` (or turn it on in production with the five players' consent; the files hold names and positions, telemetry.md). Fresh characters in week 1 so the censo funnel and the first deaths are observed. Pull with `deploy/pull-telemetry.sh` after every collective session. Before each week, write one hypothesis with a number and the `cmd/balance` prediction for it.

| Week | Play | Measure | Hypothesis to write down |
|---|---|---|---|
| 1 | Censo chain, La Tortuga Coja, rats | M1, M10, first M3 | Censo completion 5 of 5; death at level ≤ 8 costs under 60 min |
| 2 | Akron hunting solo and in pairs | M2, M6, M8, M9 | Friction factor between 0.5 and 0.7 |
| 3 | First group expedition, first ferry to Ingwen | M7, M11, M4 | Recovery rate ≥ 4 of 5 deaths; party exp/h per member ≥ solo |
| 4 | Ingwen at levels 20 to 35 | M3 by level, M5 | Death cost at level 25 under 90 min; no quit within 10 min after death |
| 5 | Switchback week only if a rule in 5.5 fired: change one knob for all five | repeat the metric that fired | Direction of the change in 5 of 5 players |
| 6 | Free play, no instructions | M10, M2, M9 | Sessions still 30 to 60 min; one rung per session in at least one skill |

Each session: one collective 60-minute session per week plus solo sessions at will. Screen-record the collective session. No think-aloud during fights. The tester fills the survey at the end of every session (A9, 3 minutes).

The 10-question survey (1 to 7 unless noted). Items 1 to 4 paraphrase the PENS subscales (Ryan, Rigby and Przybylski 2006, https://link.springer.com/article/10.1007/s11031-006-9051-8), items 5 to 8 the four CORGIS challenge types (Denisova, Cairns, Guckelsberger and Zendle 2020, https://doi.org/10.1016/j.ijhcs.2019.102383), items 9 and 10 are the series' own, inherited from Hearthguard and MatchRPG (fault attribution, Juul).
1. Competence: "I felt capable and effective playing today."
2. Autonomy: "I did what I wanted to do today, not what the game made me do."
3. Relatedness: "I felt connected to the others I played with."
4. Presence: "I lost track of time at least once."
5. Performative challenge: "Fights demanded quick or precise action."
6. Cognitive challenge: "I had to think hard about where to hunt or how to survive."
7. Emotional challenge: "Something today felt tense or risky."
8. Decision-making challenge: "I faced choices with real trade-offs (route, risk, gold)."
9. If you died: "The loss was my fault / the game's / luck." Then: "How many minutes did that death cost you?" (a number; compare with M3).
10. "Did you make visible progress this session?" Yes / a little / no. Then: "Will you log in tomorrow?" Yes / maybe / no.

### 5.5 Decision rules

A rule fires only when it holds in two collective sessions on the same build and the sign is the same in at least 4 of 5 players (see 5.6).

| # | Signal | Threshold | Knob |
|---|---|---|---|
| R1 | M1 censo funnel | Any step with fewer than 4 of 5 completers, or median gap over 10 min | Step text or distance of that step; not the reward |
| R2 | M3 death cost median at a level band | Above 90 min (1.5 sessions) at a band players actually hunt | `deathExpLoss` 0.10 → 0.08 for that band, or exp stages on creature exp; recheck M2 |
| R3 | M3 death cost median | Under 15 min at a band above level 10 | Death is noise; raise `gearDropChance` or lower the temple heal, not the exp loss |
| R4 | M4 recovery rate | Under 3 of 5 deaths recovered by the owner | Lengthen the 30-min corpse window or shorten the heartstone cooldown (5 min) |
| R5 | M5 quit within 10 min after death | 2 or more of 5 players do it in a week | Clarity and recovery problem first (where is the corpse, how far); only then the penalty |
| R6 | M6 friction factor | Under 0.4 at any ground players keep using | Travel or respawn problem at that ground; move the spawn, add a heartstone anchor, before touching creature exp |
| R7 | M9 rungs per session | Median 0 in every skill for 2 weeks at a level under 50 | Lower the base for that skill (50/30/100/20) before touching 1.08 |
| R8 | Survey item 9 felt minutes against M3 | Felt ≥ 2× measured | Make the cost legible (show exp lost and the minutes it equals on the death screen) before changing it |
| R9 | Survey item 10 "no progress" | 3 of 5 in a session with M2 showing a level or M9 a rung | Feedback problem: the gain happened and was not seen |
| R10 | M11 gap | Over 10 levels for 2 weeks | Party split rule (the flat 20%) or a catch-up ground, not the exp curve |

### 5.6 Small-sample rules

- Five players are a qualitative sample. Nielsen's quantitative rule is 20 users for a 90% interval of about ±19% of the mean with one outlier removed; 10 users give ±27% [V, E1] https://www.nngroup.com/articles/quantitative-studies-how-many-users/ . With his SD of 52% of the mean and n = 5, the 90% interval is about ±50% of the mean [I, arithmetic: t(0.90, 4 df) = 2.13 × 0.52 ÷ √5]. So M3 measured on five players says "about an hour, between 30 and 90 minutes", never "52 minutes".
- Sessions are the unit of play but not independent: one player's sessions cluster. Report every metric per player first, then the median of the five. The MatchRPG protocol states the same rule (§13 "Report one difference per player before any pooled number") [K] `studies/curves-matchrpg/report.md`.
- Median over mean whenever the distribution has a long tail, which is every per-session metric here: Pittman found half of WoW sessions under 10 minutes with a few near 24 hours [V, E1] https://www.cs.du.edu/~chrisg/publications/pittman-netgames07.pdf , and one unlucky death at level 30 can outweigh ten at level 8 in a mean of M3. Use the mean only for flows that add up (gold, potions, exp per week), where the total is the quantity of interest.
- Direction is testable, size is not. A knob change where all five players move the same way has a one-sided sign-test p of 0.031 (0.5^5); four of five gives 0.19 [I, arithmetic]. So R-rules ask for 4 of 5 as a "worth a second look" and 5 of 5 as "act".
- What five players can show: the funnel (did anyone get stuck), the existence of a plateau (did anyone gain a rung), order-of-magnitude death cost, the friction factor, and every "why" (survey, recording). What they cannot show: retention, percentages below 20%, differences under about ±50% in any per-hour rate, and anything about players unlike these five (they are friends of the designer and know the game).
- Hide nothing for privacy inside the group, but any published number from this study carries "n = 5 friends" in the caption.

**Gaps.** Position field names were not read from the Go struct beyond `exp`; the SQL uses `x`, `y` as placeholders. The `quest_step` `source` field for the censo slug must be checked against `content/quests/`. The bounded queue drop counter should be printed in `sessionreport` output so a session with drops is excluded from per-hour rates.

---

## Q6. Bots as a floor

**Takeaway.** `cmd/balance` is a one-on-one fight simulator, so its exp/h is the mechanical ceiling and its hours per level the floor. Published precedents for tuning with simulation or data are thin for Tibia-likes: CCP publishes raw economic data monthly, Blizzard describes prototyping tools and data targets for StarCraft II and Hearthstone, and one academic paper trained bots on real Aion player logs to balance an MMORPG. The pattern worth copying is the pairing: a bot run before every playtest, logged beside the humans.

**Cited findings.**
- `cmd/balance`: one player beside one creature on an open map, 200 trials, death risk, time to kill, exp/h and gold/h per level and kit, with `-baseline` comparison and a CI job at levels 8 and 15 with leather gear and 60 trials [K] balance.md. It omits movement, food regen, spell choice, potions, travel and groups [K].
- EVE Online: the Monthly Economic Report has shipped graphs and CSV dumps since 2016 ("a lot of graphs and csv data dumps") [V, E1] https://forums-archive.eveonline.com/topic/472138/3 ; the February 2021 MER added a "Sinks and Faucets over time" CSV covering three years [V, E1] https://forums.eveonline.com/t/monthly-economic-report-february-2021/302188 ; the November 2024 MER carries an erratum and a raw-data download [V, E1] https://www.eveonline.com/news/view/monthly-economic-report-november-2024 ; CCP's first economist used a chained price index because a fixed basket overstated price changes (2007) [V, E2] https://games.slashdot.org/story/07/11/14/2050259/eve-onlines-first-quarterly-economics-report-published
- StarCraft II balance used tournaments, statistics, a prototyping program "Make Combat" and spreadsheets; Browder said no single tool sufficed [V, E2] https://www.gamespot.com/articles/blizzard-balances-starcraft-ii/1100-6282912/
- Hearthstone Arena: a Blizzard data scientist tuned card appearance rates so the predicted win rate sits "as close as possible to 50% regardless of class" [V, E2] https://www.hearthstonetopdecks.com/hearthstone-developer-insights-arena-balanace-through-data/
- Pfau, Liapis, Volkmar, Yannakakis and Malaka, "Dungeons & Replicants" (2020): automated balancing across several difficulty dimensions using deep models of real player behaviour from the MMORPG Aion, the models standing in for players [V, E1, title and abstract] https://antoniosliapis.com/papers/dungeons_replicants_automated_game_balancing_across_multiple_difficulty_dimensions_via_deep_player_behavior_modeling.pdf
- Pittman 2007 built the WoW census to drive "an accurate player model" for simulations [V, E1] https://www.cs.du.edu/~chrisg/publications/pittman-netgames07.pdf

**Inferences.**
- What the bot misses is exactly what M6's friction factor measures. Once two or three grounds have a measured factor (say 0.55 to 0.7), the bot's exp/h × factor predicts hours per level for untested grounds well enough to place exp stages [I].
- The bot cannot measure death cost in minutes (no recovery) or skill rungs per session (its skill estimate assumes 1,500 exp/h). Add a `-exp-per-hour` taken from M6 so the skill estimate uses the measured rate [I].
- A cheap upgrade in the spirit of Dungeons & Replicants: a second simulator mode that replays a recorded session's walk and kill sequence with changed constants (exp loss, drop chance, skill bases) and reports the new M3 and M9. It is a what-if over real traces, not a new AI [I].

**Gaps.** No CipSoft statement on simulation found. No Blizzard statement on WoW internal sims found (forum speculation only). Dungeons & Replicants was not read beyond its title and abstract.

---

## Pattern cards found (measurement patterns)

### P-M1. Death cost in minutes
- Lineage: Tibia exp-loss arithmetic by players (exp lost ÷ wiki exp/h) -> Asterion `TestDeathPenaltyCalibration` (rats, 480 exp/h) -> this study's M3 per player.
- Feeling it protects: Challenge with Submission; the cost must be felt but recoverable in one sitting.
- Mechanism (metric): `minutes = death.amount ÷ exph(player, last 3 sessions) × 60 + recovery_minutes + drop_value ÷ goldph × 60`.
- Works when exp/h is measured per player; breaks when a mean hides one unlucky high-level death.
- Evidence: [K] calibration test; [V, E1] Pittman on skewed sessions.
- Cost: S (one SQL view; A1 and A2 for the full cost). Knobs: `deathExpLoss`, `gearDropChance`, corpse window.
- Asterion: the chart of M3 against level is the one picture vision §2.5 needs.

### P-M2. Friction factor
- Lineage: community exp/h tables far below kill-rate math (TibiaWiki, OSRS wiki) -> in-game analysers (Tibia 2017) -> here: `session exp/h ÷ cmd/balance exp/h`.
- Feeling: Discovery and Fellowship; the share of a session spent walking and waiting is where "slowness lives" by design.
- Mechanism: `f = (session_end.amount ÷ session hours) ÷ balance_exph(level, kit, creature)`; per ground.
- Works for grounds the five actually use; breaks when a session mixes grounds (use kill cells).
- Evidence: [K] balance.md definitions; [V, E3] OSRS and Tibia tables as the informal precedent.
- Cost: S. Knobs: spawn placement, respawn time, heartstone anchors, ferry.
- Asterion: a factor under 0.4 is a travel problem, not a creature problem (R6).

### P-M3. Corpse recovery rate
- Lineage: Tibia death lists (public, no recovery) -> Albion killboard (kills, no recovery) -> no twin measured recovery; new here.
- Feeling: Challenge resolved into relief; the corpse run is the recoverable part of the penalty.
- Mechanism: `recovered = corpse_recovered(source='owner', ms < 1,800,000) ÷ deaths`; median `ms`.
- Breaks without A1; breaks if the corpse is looted by a friend as a favour (log `source='other'` and the name).
- Evidence: [I]; gap in all twins.
- Cost: S (A1). Knobs: 30-min window, heartstone cooldown, temple placement.

### P-M4. Rungs per session
- Lineage: Tibia skill highscores (levels only) -> player-derived tries formulas -> Asterion `cmd/balance -skills` -> `skill_up` event.
- Feeling: Sensation of growth inside a 45-minute session.
- Mechanism: median count of `skill_up` plus `magic_level` plus `level` events per session with `ms > 600000`.
- Works as a plateau detector; breaks if afk training is allowed (use `active_ms`).
- Evidence: [K] targets sword 50 in 14 h; [V, E3] OSRS idle pages for the afk confound.
- Cost: S (A3, A4, A7). Knobs: bases 50/30/100/20, 1.08, 1.4 for magic.

### P-M5. Bot beside humans
- Lineage: Pittman's census-driven player models (2007) -> Dungeons & Replicants bots trained on Aion logs (2020) -> MatchRPG protocol "run the bot before the session" -> here.
- Feeling: none for players; it is the designer's instrument.
- Mechanism: run `cmd/balance -levels <current levels> -kit <kits in use> -json` before every collective session, store beside the JSONL, join on level and creature.
- Breaks if the bot's assumed exp/h is left at 1,500 once real rates are known.
- Evidence: [V, E1] Pittman; [V, E1] Pfau et al.; [K] balance.md.
- Cost: S. Knobs: `-exp-per-hour`, `-swing-duty`, `-overhead`.

### P-M6. Public death list as a death heatmap
- Lineage: Tibia character deaths and Kill Statistics page (2000s) -> TibiaData and Guildstats scrapes -> Albion killboard API (2016).
- Feeling: Fellowship and Expression; players read each other's deaths as stories.
- Mechanism: a per-world table of deaths by creature and place from the `death` event; publish it on the rankings page.
- Works in a small group as a social artifact; breaks as griefing data once PvP ships.
- Evidence: [V, E1 method] TibiaData, Guildstats; [V, E3] Albion killboards.
- Cost: S to M (a page over the existing `death` event).

---

## Glossary additions

| Term | Meaning | Source |
|---|---|---|
| Death cost (minutes) | Exp lost on death divided by the player's own measured exp/h, plus recovery time and the value of items lost at the player's gold/h. The series' "cost of failure" for a persistent game. | This note, M3; `TestDeathPenaltyCalibration` |
| Corpse recovery rate | Share of deaths where the owner reaches the corpse and takes at least one item before it expires. | This note, M4 |
| Friction factor | Measured session exp/h divided by the simulator's mechanical exp/h for the same level, kit and creature. Travel, respawn waits and potions live in the gap. | This note, M6; balance.md |
| Rungs per session | Count of skill, magic level and character level advances in one session. The plateau detector for skill by use. | This note, M9 |
| Afk share | 1 − active input time ÷ session time. | OSRS wiki "Idle" for the concept; A7 for the field |
| Session exp/h | Net exp gained in a session divided by its hours; distinct from the mechanical exp/h of a creature. | telemetry.md `session_end.amount` |

---

## Sources

1. OTLand repost of CipSoft's June 2009 statistics article: https://otland.net/threads/jun-02-2009-statistics.34540/latest
2. MeinMMO on the 2024 Tibia auction and NabBot statistics: https://mein-mmo.de/en/player-of-a-german-mmorpg-sells-his-character-for-the-equivalent-of-about-41000-euros,1218610
3. Guildstats info page: https://guildstats.eu/info
4. TibiaData API README (v5 routes): https://raw.githubusercontent.com/TibiaData/tibiadata-api-go/main/README.md
5. TibiaData repository (deaths schema history): https://github.com/TibiaData/tibiadata-api-go
6. Tibia Watch rankings: https://www.tibiawatch.com/rankings
7. OSRS wiki, Skill mastery (99 and max counts): https://oldschool.runescape.wiki/w/Skill_mastery
8. GamesRadar on the OSRS 240,851 concurrency record: https://www.gamesradar.com/games/mmo/with-a-new-record-240-000-players-online-old-school-runescape-is-roughly-8x-bigger-than-its-sister-mmo-and-would-be-the-fourth-biggest-game-on-all-of-steam-if-not-for-a-technicality
9. Cyberpost on unpublished maxed-account counts: https://cyberpost.co/how-many-maxed-runescape-accounts/
10. Blog on WarcraftRealms census method: https://progression-annexe.blogspot.com/2016/04/how-many-players-was-there-on-vanilla.html
11. Ten Ton Hammer, WoW census stats, 19 Jul 2006: https://www.tentonhammer.com/articles/wow-census-stats-article-7-19-06
12. Pittman and GauthierDickey, "A Measurement Study of Virtual Populations in MMOGs", NetGames 2007: https://www.cs.du.edu/~chrisg/publications/pittman-netgames07.pdf
13. Warcraft Tavern on time to 60 in Classic: https://www.warcrafttavern.com/news/how-long-does-it-take-to-get-to-level-60-in-wow-classic-an-objective-look/
14. GGG Blight statistics (devtrackers mirror): https://devtrackers.gg/pathofexile/p/b3ef19ca-blight-statistics-challenges-and-ascendancy-classes
15. GGG Harbinger class statistics: https://www.pathofexile.com/forum/view-thread/2008293
16. MMOs.com on the Albion East infographic, May 2023: https://mmos.com/news/albion-online-east-server-may-2023-infographic
17. TibiaWiki Hunting Places (blocked, 402): https://tibia.fandom.com/wiki/Hunting_Places
18. TibiaWiki Cyclopedia (blocked, 402; read via search summary): https://tibia.fandom.com/wiki/Cyclopedia
19. Hunt Analyser changelog, 15 Feb 2024: https://world.hey.com/huntanalyser/feb-15-2024-enhanced-sorting-for-hunt-sessions-and-report-d5df2e89
20. TibiaQA on the Hunt Analyser XP/h: https://www.tibiaqa.com/16900/how-does-the-exp-per-hour-shown-on-the-hunt-analyser-work
21. OSRS wiki, Pay-to-play melee training: https://oldschool.runescape.wiki/w/Pay-to-play_melee_training
22. Asterion balance doc (local, read only): /Users/esenespinosa/Development/personal/games/mmorpg/docs/systems/balance.md
23. Asterion telemetry doc (local, read only): /Users/esenespinosa/Development/personal/games/mmorpg/docs/systems/telemetry.md
24. Asterion corpse.go, `deathExpLoss` (local): /Users/esenespinosa/Development/personal/games/mmorpg/server/internal/game/corpse.go
25. Guild Order on the Albion public API: https://guildorder.com/games/albion/wiki/the-public-api-and-killboards
26. Albion Battle Hub about page: https://albionbattlehub.com/about
27. MeinMMO on WoW Classic Hardcore deaths, 30 Sep 2023: https://mein-mmo.de/en/wow-hc-more-than-2000000-dead-heroes-every-5th-is-a-hunter,1041820
28. Dot Esports on the Hardcore death statistics (blocked, 403): https://dotesports.com/wow/news/blizzard-share-staggering-death-statistics-from-wow-classic-hardcore
29. TibiaWiki Death (blocked, 402): https://tibia.fandom.com/wiki/Death
30. TibiaWiki Skills (blocked, 402): https://tibia.fandom.com/wiki/Skills
31. uo.com, Guaranteed Gain System and Rate Over Time System: https://uo.com/?p=6342
32. UO Stratics team comment on skill and stat gain, 20 Sep 2001 (blocked, 403): https://uo.stratics.com/content/interviews/evocare.shtml
33. Raph Koster, "Use-based systems": https://www.raphkoster.com/?p=592
34. OSRS wiki, Idle: https://oldschool.runescape.wiki/w/Idle
35. OSRS wiki, AFKing: https://oldschool.runescape.wiki/w/AFKing
36. Ryan, Rigby and Przybylski 2006, PENS: https://link.springer.com/article/10.1007/s11031-006-9051-8
37. Denisova, Cairns, Guckelsberger and Zendle 2020, CORGIS: https://doi.org/10.1016/j.ijhcs.2019.102383
38. Nielsen, "Quantitative Studies: How Many Users to Test?": https://www.nngroup.com/articles/quantitative-studies-how-many-users/
39. MatchRPG report §13 (local): /Users/esenespinosa/Development/personal/games/kingsfoil-artifacts/kingsfoil-artifacts/studies/curves-matchrpg/report.md
40. EVE forums archive, MER announcement (2016): https://forums-archive.eveonline.com/topic/472138/3
41. EVE MER February 2021 (sinks and faucets CSV): https://forums.eveonline.com/t/monthly-economic-report-february-2021/302188
42. EVE MER November 2024: https://www.eveonline.com/news/view/monthly-economic-report-november-2024
43. Slashdot, EVE's first Quarterly Economic Report (2007): https://games.slashdot.org/story/07/11/14/2050259/eve-onlines-first-quarterly-economics-report-published
44. GameSpot, "Blizzard balances StarCraft II": https://www.gamespot.com/articles/blizzard-balances-starcraft-ii/1100-6282912/
45. Hearthstone Top Decks, developer insights on Arena balance through data: https://www.hearthstonetopdecks.com/hearthstone-developer-insights-arena-balanace-through-data/
46. Pfau et al. 2020, "Dungeons & Replicants": https://antoniosliapis.com/papers/dungeons_replicants_automated_game_balancing_across_multiple_difficulty_dimensions_via_deep_player_behavior_modeling.pdf
47. Series glossary (local): /Users/esenespinosa/Development/personal/games/kingsfoil-artifacts/kingsfoil-artifacts/docs/formats/design-curves.md
