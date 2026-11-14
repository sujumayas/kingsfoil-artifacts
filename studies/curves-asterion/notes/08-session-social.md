# 08. Sessions, social and small-group conditions

Agent 6 notes for Curves #3 (Asterion). Angle: an MMORPG played by about 5 friends in 30 to 60 minute sessions, Tibia-era slowness kept in travel, progression, economy and discovery, refused in combat padding, downtime and UI, an anti-compulsion stance, and a later opening to strangers.

Access note. tibia.fandom.com (HTTP 402), tibiawiki.com.br (403), wiki.project1999.com (403), wiki.albiononline.com (403), massivelyop.com (403) and web.archive.org (blocked by the tool) could not be fetched in this session. Where a claim rests on one of those pages I give the URL so a reader can open it and I grade it [U]. warcraft.wiki.gg, wiki.eveuniversity.org, wiki.guildwars2.com, Wikipedia, Engadget, Ten Ton Hammer and nickyee.com were read directly.

Hearthguard already settled co-op stat scaling (cards D1 and D2 in `studies/curves-hearthguard/report.md`). Q7 cites them and does not re-research them.

---

## Q1. Session length: what 45 minutes buys

**Takeaway.** A 45-minute Tibia 7.x session is one trip: walk out, hunt until the bag or the supplies run out, walk back, bank. The walk is the price, and 7.x had no mechanism that made a short trip "complete". The twins that serve people who play little did it in two ways, and both are cheap: (a) a bounded task with a visible end and a return (Slayer tasks, hunting tasks, Albion expeditions), and (b) progress that keeps moving while you are away, framed as a bonus and never as a penalty (WoW rested exp, Tibia offline training, EVE's queue, Albion learning points). The WoW beta is the strongest natural experiment in this family: the same numbers, framed as a penalty for long play, were rejected by testers; framed as a bonus for coming back, they became the standard. Asterion already has the task half (hunting contracts, censo chain); it has nothing in the away half, and its stance forbids the login-streak version of it.

**Cited findings.**
- WoW rested experience (2004). While rested, kill exp is doubled. One "bubble" (10 % of the current level) accrues per 16 hours resting in an inn or city, a quarter of that speed (one bubble per 64 hours) when logged out elsewhere; the cap is 15 bubbles, 150 % of a level; a full level of rest takes 160 hours (6.67 days) and the cap about 10 days in an inn. In the beta the mechanic did not exist: experience was cut by 50 % after a few hours of play, testers disliked it, and Blizzard flipped it to 200 % for a few hours, later calling these the same numbers seen from opposite sides. [V, E3 for the numbers, E2 for the beta story] https://warcraft.wiki.gg/wiki/Rested
- Tibia offline training. Implemented 11 July 2012 with the summer update (not 2011 as the brief says), premium only, statues in the training schools of all major cities, a bed option from the Autumn Patch 2012. Up to 12 consecutive hours of offline training per character; the pool refills one second per second spent online. Official teaser says it is "less effective than training skills online"; no fraction is published. [V, E3 on dates and the 12 h cap via fan-site revisions and the OTLand teaser thread; U on the rate] https://otland.net/threads/teaser-2-hone-your-skills-offline.161140/ and https://tibiaqa.com/revisions/14440 ; the wiki page is https://tibia.fandom.com/wiki/Offline_Training (blocked).
- EVE Online skills train in real time, logged in or not. SP per minute = primary + 0.5 × secondary (Omega), half that for Alpha; a default Omega earns 29 to 30 SP per minute. A rank 1 skill needs 250 / 1,414 / 8,000 / 45,255 / 256,000 total SP for levels I to V, so level I takes about 8 minutes and level V about 142 hours (5.9 days) of wall-clock time at 30 SP per minute. The wiki gives "40 minutes or so" for level I of a rank 5 skill and "nearly 25 days" for IV to V. [V, E3] https://wiki.eveuniversity.org/Skills_and_learning . The skill queue itself (24 h limit from Apocrypha 1.1 in 2009, unlimited for Omega since 2016) was not reachable in this session. [U, E3] https://wiki.eveuniversity.org/Skill_queue
- Albion Online learning points. Premium accounts generate learning points per day whether you play or not: older guides say 20 per day, current store copy says 30; free players get 10 from daily challenges. Points never expire (player report of a 9,999 cap) and are spent to finish a destiny-board node instantly once it has reached a set share of progress. This is a bank of catch-up progress for people who play little. Fame itself does not accrue offline. [V, E3 on 30 per day via the Epic store FAQ; E4 on the cap] https://store.epicgames.com/p/albion-online-faq-009365 and https://steamcommunity.com/app/761890/discussions/0/3726075043715334696
- Yee (Daedalus Project, 2003 to 2009): MMORPG players averaged 22 hours a week in game; EQ 22.4 h (N = 1,216), WoW 22.7 h (SD 14.1), all MMORPGs 21.0 h (N = 1,996). Age was not correlated with hours except in summer. The 2004 split, under 23 vs over 22, was 23.2 vs 21.2 h (p = .01), which Yee calls trivial. Self-selected online samples from the 2000s. [V, E1 survey data] https://nickyee.com/daedalus/archives/print/000758.php and https://nickyee.com/daedalus/archives/2004_02.php and https://nickyee.com/daedalus/gateway_demographics.html
- Project Gorgon monster exp drops about 10 % per level of difference, which cancels the roughly 10 % per level exp increase, so a player earns about the same exp from a monster up to 25 levels above (developer post). This lets a short session go anywhere a friend can carry you without wasting it. [V, E2 developer post via search snippet] https://forum.projectgorgon.com/archive/index.php/t-2465.html

**Inferences.**
- Yee's 22 h/week is about 3 h a day. Asterion's 30 to 60 minute adult session is 3 to 6 times shorter than the population the twins were built for. Every twin number quoted in hours should be divided by about 4 to read it in Asterion sessions (sword 50 in about 14 hours is about 20 sessions; sword 100 in about 707 hours is about 900 sessions, roughly 4 years at 4 sessions a week). [I]
- The bounded-task family is the one that makes 45 minutes feel complete, and it works in a Tibia frame because it ends with a walk home and a payout. Asterion's hunting contracts are that pattern; the knob to set is the count so that one contract fits one session at the level band it is offered. [I]
- The away-progress family splits on framing, and the WoW beta shows which side to stand on. A "rested" bonus that refills to a cap, never decays below zero and never asks you to log in daily does not violate the anti-compulsion stance. A streak that resets does. [I]

**Gaps.** No published session-length telemetry for Tibia 7.x, OSRS, Albion, Valheim or Project Gorgon was found. Newer hours-by-age survey numbers (post-2015) were not reached in this session. The offline-training rate relative to online training is unpublished.

---

## Q2. Level gaps between friends

**Takeaway.** Twins fall into two families. Range gates (Tibia 2/3 rule, EQ's group range) keep exp sharing fair but exclude the friend who falls behind, exactly the person the group most needs to keep. Scaling (GW2 downlevelling 2012, WoW Party Sync 2019, FFXIV level sync) lets the strong friend come down with real-level rewards. For 5 friends where one plays 10 times more, the second family holds the group together; the first splits it within weeks. The cheapest version for Asterion is not stat scaling at all but exp scaling the Project Gorgon way: pay the low-level friend full exp for monsters far above them and let the high-level friend's body be the protection.

**Cited findings.**
- Tibia shared experience: all members must be within a level band where the lowest is at least 2/3 of the highest (a level 100 shares with level 67 and up), be within 30 squares and on the same or an adjacent floor, and have participated. Shared exp gives a flat bonus (20 % at introduction; later raised to 20 / 30 / 60 / 100 % by number of distinct vocations in the party). Asterion's own 20 % flat is the 2008-era value. [U, E3; the page could not be fetched] https://tibia.fandom.com/wiki/Party
- EverQuest classic: group exp carries a size bonus and is split by level; a group may form at any level gap, but exp from a monster that cons green to a member gives nothing. Resurrection returns a share of lost exp by spell rank (90 % and 96 % for the top cleric spells). [U, E3; wiki blocked] https://wiki.project1999.com/Experience
- WoW Party Sync, patch 8.2.5, 24 September 2019: higher-level players sync down to the lowest member's level, within expansion brackets (a level 21 member sets the group to 60, a level 83 member to 90); synced players replay completed quests for level-appropriate rewards; works with dungeon and battleground queues, not raids. [V, E3] https://warcraft.wiki.gg/wiki/Party_Sync
- Guild Wars 2 dynamic level adjustment: a character above a zone's level is set to the zone maximum plus one (a level 50 in a level 10 area becomes 11), attributes drop, skills and equipment stay, and rewards stay comparable to the real level. Stated rationale: high levels cannot trivialise or steal rewards, low content stays challenging, scaled characters still earn. A beta "sidekicking" (scaling up) was removed before release. [V, E3 with E2 rationale] https://wiki.guildwars2.com/wiki/Dynamic_level_adjustment
- Project Gorgon: no formal group level gate; exp per monster flattens across 25 levels of difference (Q1). Players on the forum report that splitting exp discourages grouping and that level and gear gaps complicate it. [V, E2 and E3] https://forum.projectgorgon.com/archive/index.php/t-2465.html
- RuneScape (Classic, RS2, OSRS) has no party exp and no level gate on who may hunt beside whom; exp goes to whoever deals the damage. Albion Online shares fame among party members in range with no level concept, since the destiny board replaces levels. [U, E3] https://oldschool.runescape.wiki/w/Experience and https://wiki.albiononline.com/wiki/Fame
- FFXIV level sync (2013): a player entering a duty above its level cap is synced down to it. [U, E3] https://ffxiv.consolegameswiki.com/wiki/Level_Sync

**Inferences.**
- Asterion's cubic exp curve makes the 2/3 rule bite hard: a level 60 friend (exp about 356,000) and a level 40 friend (about 101,000) are inside the band, but the moment the heavy player reaches 61 and the light one is still at 40, the party stops sharing. With a 10-to-1 play ratio that happens in the first month. [I]
- Because Asterion has no classes and damage is narrow-band, a high-level friend already "scales down" socially: they tank and the low-level friend gets the kill exp. The cheap rule is exp flattening (Gorgon) plus no range gate on sharing, with the strong friend's share paid in something other than exp (gold, contract progress, titles) so that carrying is never a loss for them. [I]
- Stat downscaling (GW2) is the wrong tool for Asterion: it costs a second stat pipeline and fights the "you are what you practise" pillar. [I]

**Gaps.** The exact Tibia shared-exp introduction version and the vocation-bonus version were not verifiable here. No telemetry on how often friend groups split by level in any twin.

---

## Q3. Death in a group

**Takeaway.** In EverQuest the corpse run was a social institution because three roles existed around a corpse: the friend who drags it (with consent), the necromancer who summons it, and the cleric who resurrects it and returns most of the lost exp. Tibia 7.x had none of these roles; a friend could only loot your corpse and hand the items back, which is itself a trust mechanic. Asterion sits at the Tibia end (anyone may loot for 30 minutes, no resurrection) and this is defensible for a friend group, where "anyone" means your friends. It stops being defensible the day strangers arrive (Q5).

**Cited findings.**
- EQ corpse mechanics: a corpse follows a player who runs while issuing `/corpse`; the owner must `/consent <name>` another player to drag it; the necromancer spell Summon Corpse pulls the target's corpse to the caster (needs the owner targetable and in range); later live added the Call to Corpse AA and dropped the Soulstone requirement in the November 2021 patch. [V, E3] https://wiki.project1999.com/Advanced_Techniques_Guide and https://everquest.allakhazam.com/wiki/eq:Call_to_Corpse
- Community account (Ten Ton Hammer, 14 May 2013): parties fought back out to escort the dead to their corpse, sometimes for hours; necromancers were needed by nearly everyone so "it paid to be friendly and polite"; the norm was "you didnt leave anyone behind"; reckless players faced social consequences. The author also warns "no one system can elicit the changes we need". [V, E4, single article] https://www.tentonhammer.com/articles/everquest-next-why-we-need-corpse-runs
- Pantheon forum recollection: a wipe meant dragging corpses or finding a necromancer to summon them. [V, E4] https://seforums.pantheonmmo.com/content/forums/topic/2903/the-value-of-corpses
- Tibia: in the 7.x era any player could open a player corpse. Later Tibia restricted a player corpse to its owner and killer for the first 10 minutes. The brief records Asterion's rule as anyone, 30 minutes (15 as corpse, 15 as bones). [K for Asterion; U, E3 for Tibia] https://tibia.fandom.com/wiki/Corpse

**Inferences.**
- The three EQ roles map onto Asterion without new systems: the dragger is "a friend loots the bag and brings it to the depot" (already possible, zero cost); the necromancer is the heartstone used by a friend standing on your corpse (not possible today, small cost: let a party member "mark" a corpse so the owner's temple map shows it); the cleric is a resurrection-like exp refund (does not exist; Juul's setback punishment is the whole point of P2, so I would not add it). [I]
- The rescue run has a timer in Asterion (30 minutes) and a 5-minute heartstone cooldown. With 50 ms ticks and walk speed 280 at level 1, the 15-minute corpse window is the real budget; the bones window is the mercy. Telemetry should log who looted whose corpse and whether the items came back. [I]

**Gaps.** No measured data on how often friends in Tibia return looted items; no Asterion telemetry (off by default).

---

## Q4. Low population

**Takeaway.** The first things that break with 5 to 50 players are the player market (no counterparty) and respawn contention running the other way (nobody competes for spawns, so the world feels empty and every hunting ground is free). The fixes that small Open Tibia servers and Haven & Hearth-style games use are an NPC price floor for everything, an asynchronous market, and exp stages that soften the dead early stretch. Asterion already has the NPC economy floor and a shared depot; it should treat "every spawn is free" as the intended state and tune respawn for 1 to 5 hunters, not for competition.

**Cited findings.**
- OTLand poll on whether low-rate RPG servers can hold a population: 14 yes, 10 no, 24 voters. A low-rate server developer planned a small exp boost for low levels reaching 1x at level 20; another poster says low rates "feel boring at low levels" and drive early leaving. [V, E3 and E4] https://otland.net/threads/help-with-testing-low-rate-heavy-rpg-server-popularity.259456/
- A 7.4-era custom server advertises an offline player market so buyers can purchase while sellers are logged out, a direct response to thin populations. [V, E4] https://otland.net/threads/usa-7-4-dura-a-harder-tibia-massively-customized-new-meta-long-term-regular-updates-never-reset-for-skilled-players.273335/post-2760789
- An OTLand poster states that evo and war servers are hard to sustain without an investor "especially with a consistently low player count". [V, E4] https://otland.net/goto/post?id=2744762
- Haven & Hearth on Steam: 56 online, 72 peak in 24 h, all-time Steam peak 991 (tracker.gg, Steam only; the native client is not counted). The game runs for years at this size with a full player economy. [V, E1 vendor tracker] https://tracker.gg/population/steam/3051280
- A r/TibiaMMO thread on low-population server experience (asks about supply and gear progression) was found but its mirror returned an expired certificate. [U] https://www.reddit.com/r/TibiaMMO/comments/1gtirw2/low_population_server_playing_experience

**Inferences.**
- With 5 players, player trade is not an economy, it is gifting among friends. The NPC price floor is the economy. The design question is only whether NPC buy prices make hunting pay at every level band, which `cmd/balance` already computes as gold per hour. [I]
- Exp stages are how OT servers rescue the dead early stretch on a thin server; Asterion's censo chain (5 × 72 exp) is the same move in quest form. [I]
- "What breaks first" ranked for Asterion: (1) rare drops never circulate because no one else hunts the creature; (2) bosses on timers go unkilled or are farmed by one player; (3) shared depot becomes a guild bank with no accounting. Shared depot plus a GM mitigates (3) at zero cost. [I]

**Gaps.** No Project Gorgon or Wurm economy numbers at low population were reached. No OT server telemetry.

---

## Q5. Opening to strangers later

**Takeaway.** UO's Renaissance (May 2000) is the clearest natural experiment: unrestricted PvP drove away over 70 % of new players, Trammel doubled the playerbase, and only about 5 % of the players who had already left ever came back. The lesson for Asterion is sequence: build the safe facet first and never ask former players to return. Tibia solved the same problem by server type (Optional PvP from 2004) plus protection zones and skull rules; Albion by zone colour. A small-group curve must already contain the protection zone, a level or zone gate on PvP and a loss tier that differs for PvP deaths, or the arrival of strangers rewrites the death penalty overnight.

**Cited findings.**
- UO subscribers: 100,000 (Dec 1998, 12,500 average simultaneous), 150,000 (Feb 2000), 165,000 (Mar 2000), 250,000 (Oct 2000, five months after Trammel), peak about 250,000 (Jul 2003), about 100,000 (2008). Renaissance split the world into mirrored Trammel (consensual PvP only) and Felucca (open PvP). [V, E3] https://en.wikipedia.org/wiki/Ultima_Online
- Gordon Walton (UO executive producer, 2015 interview): over 70 % of new players were driven away by PvP; Trammel doubled the playerbase; about 5 % of former customers returned to try it and very few stayed; "I regret some (but not all) of the outcome"; "it's really hard to change a brand". [V, E2] https://www.engadget.com/2015-02-02-crowfalls-gordon-walton-on-how-trammel-impacted-classic-ultima.html
- Tibia game world types: Optional PvP worlds exist since late 2004 (Celesta listed as Optional PvP, 24 November 2004; Secura named the first); Open PvP divides kills into justified (marked targets) and unjustified, with skull escalation; Hardcore PvP has "no restrictions whatsoever on player killing"; new PvP rules announced 5 June 2013; Retro Hardcore PvP worlds added Summer Update 2017. Protection zones (temples, depots) forbid combat on every world type. [V, E3 on the dates via search; U on protection-zone detail] https://tibia.fandom.com/wiki/Optional_PvP and https://tibiavip.app/home/news?id=6364 and https://www.tibiaqa.com/218/what-is-a-retro-pvp-world
- Albion zones: blue (no PvP), yellow (PvP with knockdown, no loot), red (full loot, reputation loss), black (full loot, no reputation). Death cost rises with zone colour, not level. [U, E3; wiki blocked] https://wiki.albiononline.com/wiki/Zones

**Inferences.**
- Asterion's death penalty (−10 % exp, whole bag, 10 % per slot, anyone loots for 30 minutes) is calibrated against creatures. A PvP death with the same rules is a full-loot game with a 30-minute public corpse, which is Felucca. The curve must contain a PvP loss tier before strangers arrive: bag protected from non-killers, or a shorter public window, or Albion-style zone colour on the four worlds (Akron blue, Ingwen yellow, Gorothland and Boggland opt-in). [I]
- Level-gated PvP (no attacks on players under a level) is the cheapest guard for the Akron band, since geography is already the level ladder (D147). [I]
- Walton's 5 % return rate argues that Asterion should open with the protections in place rather than patch them in after the first griefing wave. [I]

**Gaps.** Trammel vs Felucca population split was not found in a primary source. Tibia's exact PvP level restrictions by world type were not verifiable here.

---

## Q6. The anti-compulsion stance

**Takeaway.** Tibia added the full retention kit in 2016 and 2017 (prey, daily reward streaks, jokers, exp events) and never published its effect. The strongest published evidence on the other side is the WoW beta (Q1): the same numbers, framed as a bonus, were accepted. Games that refuse streaks (Project Gorgon, Haven & Hearth, Valheim, OSRS's polled design) survive on small, stable populations, and Yee's data says adults were never the short-session population the kit was built for anyway. Asterion's stance costs it nothing measurable because the measured gains of streaks are unpublished for MMORPGs and come from F2P mobile.

**Cited findings.**
- Tibia Daily Reward System: introduced with the Summer Update 2017; reward shrines in temples and depots; a 7-slot lane that resets after reward 7 and does not advance on skipped days; the Reward Streak rises when a reward is taken between server saves and resets to 1 after a miss; streak bonuses are regeneration in resting areas (fan answers place stamina regeneration at streak 4, premium only); one streak-protection joker per character per month. [V, E3 via tibiaqa and TibiaBR feedback thread; U on the day-by-day table] https://tibia.fandom.com/wiki/Daily_Reward_System and https://forums.tibiabr.com/threads/512050-Feedback-Daily-Reward and https://www.tibiaqa.com/24571/how-to-use-daily-reward-joker
- Tibia prey system (Winter Update 2016, 11.00): per-creature bonuses (damage, defence, loot, exp up to 40 %) on rerollable slots with a wildcard economy. [U, E3] https://tibia.fandom.com/wiki/Prey
- Elder Game (Project Gorgon's developer) reportedly rolled out a login reward system that counts total logins so there is "no penalty for missing a day" (MassivelyOP item, date not retrieved, page 403). [U, E3] https://massivelyop.com/?p=604069
- Frommel and Mandryk (2024) describe daily login rewards, repeatable challenges and seasonal rewards as a "dual experience" that can be "potentially detrimental". [V, E1 academic, via secondary summary] https://www.universityxp.com/research/2024/2/24/daily-quests-or-daily-pests-the-benefits-and-pitfalls-of-engagement-rewards-in-games
- Game Developer on F2P daily rewards: the retention case for streaks is made for free-to-play. [V, E2 industry] https://www.gamedeveloper.com/business/the-science-craft-of-designing-daily-rewards-and-why-ftp-games-need-them
- MassivelyOP's "problem with MMO dailies" roundtable (31 Oct 2019) records player pushback against dailies as obligation. [V, E3] https://massivelyop.com/2019/10/31/massively-overthinking-the-problem-with-mmo-dailies/
- Yee: 22 h/week, age not correlated (Q1). [V, E1] https://nickyee.com/daedalus/archives/print/000758.php
- Haven & Hearth keeps a steady 50 to 70 concurrent Steam players with no login rewards (Q4). [V, E1 vendor tracker] https://tracker.gg/population/steam/3051280

**Inferences.**
- The one retention mechanic compatible with the stance is a capped rest bonus that only ever adds (Q1). Everything with a reset is a loss-aversion trigger and belongs to the kit Asterion refuses. [I]
- Gorgon's "count total logins" is the middle path if the team ever wants a visible reward for coming back: it rewards attendance without punishing absence. [I]
- For 5 adult friends, the retention mechanism is the calendar invite, not the streak. Design for a weekly expedition and let the game remember where the group left off. [I]

**Gaps.** No A/B or before-and-after numbers for Tibia's 2016 and 2017 retention features. No post-2015 hours-by-age survey reached. Valheim and OSRS retention curves were not pulled in this session (steamcharts.com/app/892970 for Valheim is the place to look).

---

## Q7. Co-op difficulty scaling without a director

**Takeaway.** A Tibia-like has no director and should not want one; the brief's pacing lives in geography, respawn and loot rules. Hearthguard's D1 and D2 already settled the stat side: scale the pool every player drains linearly, scale the focused enemy sublinearly, never scale normal enemies per player, and make rescue pay. For Asterion the "pool" is the hunting ground's respawn and the "focused enemy" is the boss. The remaining knobs are respawn rate per spawn, spawn density per ground, boss timers and loot split, and all four are data in YAML already.

**Cited findings.**
- Hearthguard D1 (from `studies/curves-hearthguard/report.md`, Family D): lineage Diablo 2 `X × n` (2000) to 1.10 `(n+1)/2` (2003), Diablo 3 +75 % per player cut to +50 % in 1.0.8, Dungeon Defenders II +50 % cut to +25 %, Deep Rock Galactic scales count not HP. Rule: drained pool linear, focused enemy `1 + 0.5(n − 1)`, lane mobs unscaled. Ratings fun 4, evidence 4, cheapness 5. [V from the report]
- Hearthguard D2: catching a leak from another lane pays full gold, not 30 %; log the leak by lane; Juul's players who blamed themselves rated the game higher (p < 0.016). Ratings fun 3, evidence 3, cheapness 3. [V from the report]
- Tibia 7.x scales nothing per player: respawn timers are fixed per spawn, and a party simply clears faster and walks further. Albion and OSRS likewise scale by count of players present only through contention. [U, E3 general knowledge; no fetched source]

**Inferences.**
- Mapping D1: when a party of 5 hunts a ground tuned for 1, the pool (respawn) is drained 5 times faster and the session becomes walking between empty spawns. The linear-pool rule says respawn should be faster per hunter present, or grounds should be sized by party size (density knob), which is a YAML change per ground. The boss is the focused enemy and should grow HP sublinearly with party size present at pull, or not at all if it is already tuned for a party. [I]
- Mapping D2: the leak in an MMORPG is the friend who dies. Paying the rescuer (exp or gold on bag return, a title on first rescue) is the D2 rule and costs an event in the loot code. [I]
- Loot split: equal exp split plus 20 % (K) mirrors Tibia; with D1's logic the share for non-killers should be high enough that tanking for a low friend is not a loss (Q2). [I]

**Gaps.** No published respawn or density tables for Tibia 7.x hunting grounds by party size.

---

## Pattern cards

### P1. Rested bonus, never a fatigue penalty
- Lineage: WoW beta −50 % after hours (rejected, 2004) -> WoW live 200 % rested, 10 % per 16 h, cap 150 % (2004) -> Tibia stamina (2006) and offline training (2012) -> Albion learning points per day (2017). Why: the same numbers framed as a gift are accepted; framed as a cut they are not.
- Feeling: Submission (the game waits for you), with a touch of Fellowship when it lets you catch up to friends.
- Mechanism: `rest += r per hour offline, rest = min(rest, cap)`; spend as `exp × 2` until rest hits 0. Never negative, never resets.
- Works when: sessions are short and irregular, population is adult. Breaks when: the bonus is large enough that playing feels wasted once rest is spent (WoW players log off to "farm rest").
- Evidence: [V, E2/E3] warcraft.wiki.gg Rested; [V, E3] EVE SP formulas; [V, E3] Albion LP per day.
- Cost S. Knobs: rate per hour, cap in levels, whether skills (tries) also rest, whether rest applies to the whole party when the leader has it.
- Asterion: a skill-tries rest pool fits "you are what you practise" better than an exp pool; cap it at about one session of progress so it mirrors the death calibration (one session lost, one session regained).

### P2. The bounded expedition
- Lineage: EQ camp (1999) -> RuneScape Slayer tasks (2005) -> Tibia tasks (Grizzly Adams, 2008) -> Albion expeditions (15 to 20 min instances, 2017) -> Asterion hunting contracts. Why: a counter with a return gives a session a visible end.
- Feeling: Challenge resolved into Narrative (the trip has a shape).
- Mechanism: `contract(count, creature, reward)`, count tuned so `count × TTK + travel ≈ 45 min` at the band's level.
- Works when: travel is part of the price (Tibia). Breaks when: the count exceeds a session, or rewards make contracts the only efficient play.
- Evidence: [U, E3] OSRS Slayer wiki https://oldschool.runescape.wiki/w/Slayer ; [U, E3] Tibia Killing in the Name of https://tibia.fandom.com/wiki/Killing_in_the_Name_of..._Quest ; [U, E3] Albion expeditions https://wiki.albiononline.com/wiki/Expeditions
- Cost S (exists). Knobs: count per band, reward shape, whether contracts are shared across the party.
- Asterion: use `cmd/balance` TTK and `ferry` telemetry to set counts so one contract is one session per band.

### P3. Exp flattening instead of level gates
- Lineage: EQ con colours (1999) -> Tibia 2/3 party rule (2008) -> Project Gorgon 10 % per level flattening (2015) -> WoW Party Sync (2019). Why: a gate protects fairness, flattening protects the group.
- Feeling: Fellowship.
- Mechanism: `exp(player, mob) = base(mob) × 0.9^max(0, mob.level − player.level)` with no party level gate; killer and party share as today.
- Works when: no classes and a strong friend can tank. Breaks when: a low friend can be dragged to end-game content for full exp without risk (needs the death penalty to bite, which Asterion has).
- Evidence: [V, E2] Gorgon developer post; [U, E3] Tibia Party page.
- Cost S. Knobs: the per-level factor, the 25-level horizon, whether the carrying friend is paid in gold or titles.
- Asterion: replaces the 2/3 rule before it ever ships; keep the 20 % party bonus.

### P4. The rescue pays
- Lineage: EQ corpse drag, Summon Corpse, resurrection (1999) -> Hearthguard D2 "catch the leak" (2026). Why: when helping the fallen is rewarded, death becomes a group event instead of a solo chore.
- Feeling: Fellowship, and Fiero for the rescuer.
- Mechanism: on `loot(corpse, looter ≠ owner)` then `return(bag, owner)` inside the 30-minute window, grant the looter a small reward and the owner a shortened walk (party corpse marker on the map).
- Works when: the group is friends. Breaks when: strangers arrive and the public corpse becomes theft (pair with Q5 loss tier).
- Evidence: [V, E4] Ten Ton Hammer 2013; [V, E3] P99 consent and drag; Hearthguard D2 [V].
- Cost S to M. Knobs: reward size, marker visibility, window.
- Asterion: log `loot` with looter and owner today; add the return event.

### P5. Safe facet before strangers
- Lineage: UO murder counts (1997 to 1998) -> Trammel (May 2000) -> Tibia Optional PvP worlds (2004) -> Albion zone colours (2017). Why: more than 70 % of new players left under open PvP, and the 5 % return rate shows the fix must precede the harm.
- Feeling: Submission and Discovery for the majority; Challenge opt-in for the few.
- Mechanism: zone or world colour sets `pvp_allowed`, `loss_tier` (bag public window, slot drop chance) and `min_pvp_level`.
- Works when: safe and dangerous content are both worth visiting. Breaks when: the dangerous facet is empty (Felucca).
- Evidence: [V, E2] Walton; [V, E3] Wikipedia subscriber series; [V, E3] Tibia world-type dates.
- Cost M. Knobs: which worlds are which colour, PvP level floor, PvP death loss tier.
- Asterion: decide colours per world now, ship the fields in YAML before PvP exists.

### P6. Linear pool, sublinear boss, no per-player mob scaling (Hearthguard D1, reused)
- Mapped to Asterion as respawn per hunter present and boss HP `1 + 0.5(n − 1)`; evidence and ratings in `studies/curves-hearthguard/report.md`. Cost S (YAML). Knobs: respawn per hunter, boss factor, density per ground.

---

## Glossary additions
- **Rested exp**: a bonus to exp that accrues while away, capped, and is spent on return at a multiplier; WoW 2004 flipped a beta fatigue penalty into it. Source: https://warcraft.wiki.gg/wiki/Rested
- **Corpse run**: the walk from the respawn point back to one's corpse to recover what dropped; in EQ a social act with dragger, summoner and resurrector roles. Source: https://wiki.project1999.com/Advanced_Techniques_Guide
- **Offline training**: skill or magic progress banked while logged out, at a lower rate than play; Tibia, 11 July 2012, 12-hour cap. Source: https://otland.net/threads/teaser-2-hone-your-skills-offline.161140/
- **Login streak**: a reward lane that advances on consecutive daily logins and resets on a miss; Tibia Summer Update 2017. Source: https://forums.tibiabr.com/threads/512050-Feedback-Daily-Reward
- **Facet**: a mirrored copy of the world with different PvP rules (UO Trammel and Felucca, 2000). Source: https://en.wikipedia.org/wiki/Ultima_Online
- **Exp stages**: Open Tibia convention of an exp multiplier that falls with level to shorten the early stretch. Source: https://otland.net/threads/help-with-testing-low-rate-heavy-rpg-server-popularity.259456/

---

## "See it in action" URLs
- Tibia 7.x party and corpse rules: https://tibia.fandom.com/wiki/Party and https://tibia.fandom.com/wiki/Corpse (not fetched)
- WoW rested exp: https://warcraft.wiki.gg/wiki/Rested
- WoW Party Sync: https://warcraft.wiki.gg/wiki/Party_Sync
- Guild Wars 2 downlevelling: https://wiki.guildwars2.com/wiki/Dynamic_level_adjustment
- EVE skills: https://wiki.eveuniversity.org/Skills_and_learning
- EverQuest corpse dragging: https://wiki.project1999.com/Advanced_Techniques_Guide
- Ultima Online Renaissance: https://www.uoguide.com/Renaissance
- Albion zones and learning points: https://wiki.albiononline.com/wiki/Zones and https://store.epicgames.com/p/albion-online-faq-009365
- Project Gorgon grouping discussion: https://forum.projectgorgon.com/archive/index.php/t-2465.html
- Haven & Hearth population: https://tracker.gg/population/steam/3051280
- Open Tibia low-rate server discussion: https://otland.net/threads/help-with-testing-low-rate-heavy-rpg-server-popularity.259456/

---

## Sources
1. WoW Rested, warcraft.wiki.gg. https://warcraft.wiki.gg/wiki/Rested
2. WoW Party Sync, warcraft.wiki.gg. https://warcraft.wiki.gg/wiki/Party_Sync
3. EVE University, Skills and learning. https://wiki.eveuniversity.org/Skills_and_learning
4. EVE University, Skill queue (not fetched). https://wiki.eveuniversity.org/Skill_queue
5. Guild Wars 2 Wiki, Dynamic level adjustment. https://wiki.guildwars2.com/wiki/Dynamic_level_adjustment
6. Wikipedia, Ultima Online. https://en.wikipedia.org/wiki/Ultima_Online
7. Engadget, Gordon Walton on how Trammel impacted classic UO (2 Feb 2015). https://www.engadget.com/2015-02-02-crowfalls-gordon-walton-on-how-trammel-impacted-classic-ultima.html
8. UOGuide, Renaissance. https://www.uoguide.com/Renaissance
9. Ten Ton Hammer, Why we need corpse runs (14 May 2013). https://www.tentonhammer.com/articles/everquest-next-why-we-need-corpse-runs
10. Project 1999 wiki, Advanced Techniques Guide (corpse drag, consent). https://wiki.project1999.com/Advanced_Techniques_Guide
11. Allakhazam, Call to Corpse. https://everquest.allakhazam.com/wiki/eq:Call_to_Corpse
12. Pantheon forums, The value of corpses. https://seforums.pantheonmmo.com/content/forums/topic/2903/the-value-of-corpses
13. Project 1999 wiki, Experience (blocked). https://wiki.project1999.com/Experience
14. Nick Yee, Hours of play per week. https://nickyee.com/daedalus/archives/print/000758.php
15. Nick Yee, February 2004 archive (age vs hours). https://nickyee.com/daedalus/archives/2004_02.php
16. Nick Yee, gateway demographics. https://nickyee.com/daedalus/gateway_demographics.html
17. Project Gorgon forum, Group play vs solo play (exp flattening). https://forum.projectgorgon.com/archive/index.php/t-2465.html
18. MassivelyOP, Elder Game login rewards (blocked). https://massivelyop.com/?p=604069
19. MassivelyOP, The problem with MMO dailies (31 Oct 2019). https://massivelyop.com/2019/10/31/massively-overthinking-the-problem-with-mmo-dailies/
20. UniversityXP summary of Frommel and Mandryk 2024. https://www.universityxp.com/research/2024/2/24/daily-quests-or-daily-pests-the-benefits-and-pitfalls-of-engagement-rewards-in-games
21. Game Developer, The science and craft of designing daily rewards. https://www.gamedeveloper.com/business/the-science-craft-of-designing-daily-rewards-and-why-ftp-games-need-them
22. TibiaWiki, Daily Reward System (blocked). https://tibia.fandom.com/wiki/Daily_Reward_System
23. TibiaBR, Feedback Daily Reward thread. https://forums.tibiabr.com/threads/512050-Feedback-Daily-Reward
24. TibiaQA, daily reward joker. https://www.tibiaqa.com/24571/how-to-use-daily-reward-joker
25. TibiaQA, reward streak resting bonus. https://www.tibiaqa.com/9648/what-depots-will-the-reward-streak-resting-bonus-not-work-in
26. OTLand, Teaser 2: hone your skills offline (2012). https://otland.net/threads/teaser-2-hone-your-skills-offline.161140/
27. TibiaQA revision with offline training date. https://tibiaqa.com/revisions/14440
28. TibiaWiki, Offline Training (blocked). https://tibia.fandom.com/wiki/Offline_Training
29. TibiaWiki, Party (blocked). https://tibia.fandom.com/wiki/Party
30. TibiaWiki, Corpse (blocked). https://tibia.fandom.com/wiki/Corpse
31. TibiaWiki, Optional PvP. https://tibia.fandom.com/wiki/Optional_PvP
32. TibiaVIP news, PvP rules 5 June 2013. https://tibiavip.app/home/news?id=6364
33. TibiaQA, what is a retro PvP world. https://www.tibiaqa.com/218/what-is-a-retro-pvp-world
34. Albion wiki, Zones (blocked). https://wiki.albiononline.com/wiki/Zones
35. Epic Games Store, Albion Online FAQ (30 learning points per day). https://store.epicgames.com/p/albion-online-faq-009365
36. Steam Community, Albion learning points thread. https://steamcommunity.com/app/761890/discussions/0/3726075043715334696
37. OTLand, low-rate heavy RPG server popularity poll. https://otland.net/threads/help-with-testing-low-rate-heavy-rpg-server-popularity.259456/
38. OTLand, 7.4 Dura server post (offline market). https://otland.net/threads/usa-7-4-dura-a-harder-tibia-massively-customized-new-meta-long-term-regular-updates-never-reset-for-skilled-players.273335/post-2760789
39. OTLand post on sustaining low-population servers. https://otland.net/goto/post?id=2744762
40. tracker.gg, Haven & Hearth Steam population. https://tracker.gg/population/steam/3051280
41. r/TibiaMMO, low population server experience (mirror failed). https://www.reddit.com/r/TibiaMMO/comments/1gtirw2/low_population_server_playing_experience
42. OSRS Wiki, Slayer. https://oldschool.runescape.wiki/w/Slayer
43. FFXIV wiki, Level Sync. https://ffxiv.consolegameswiki.com/wiki/Level_Sync
44. Kingsfoil, Curves #1 Hearthguard report, cards D1 and D2. `studies/curves-hearthguard/report.md` and https://kingsfoil-artifacts.netlify.app/curves-hearthguard
