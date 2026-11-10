# 04. Natural experiments: curve changes and how players reacted

Angle: documented changes to difficulty, learning or power curves in games that share Hearthguard's conditions
(co-op wave or horde defense, hero defense, tower defense with heroes, horde survival, ARPG scaling, MOBA-control PvE),
each paired with the player reaction. Tool budget used: about 32 calls. Tags follow `CONTEXT.md`
([V/I/U/K] plus E1-E4). Source keys like [N3] point to the Sources list at the end.

Why these twins. Diablo 3/4 and Path of Exile 2 share the ARPG power curve (levels, talents, gear against
monster scaling) and the hero-per-player control. Helldivers 2, Back 4 Blood, Vermintide 2 and Deep Rock Galactic
share co-op 1-4 horde defense with a fixed loss condition. Elden Ring Nightreign and Monster Hunter share solo/co-op
scaling of one shared threat. Kingdom Rush and Aghanim's Labyrinth share tower or hero defense with numbered
difficulty tiers. Risk of Rain 2 is the horde-survival control case where sentiment and difficulty separated.

## Experiments table

| # | Game | When | Change (before -> after) | Reaction | Grade | Lesson |
|---|---|---|---|---|---|---|
| 1 | Diablo 3 | 19 Jun 2012, patch 1.0.3 | Inferno Acts II-IV monster damage and health cut, Act I untouched. Per-player monster damage bonus in groups reduced. Exact % not found. | Launch Inferno read as a wall. Blizzard called group damage scaling "a major barrier" to playing with friends. | [V, E2] change; [U] numbers | A spike at the last tier blocks the whole audience. Co-op scaling that punishes grouping kills co-op. |
| 2 | Diablo 3 | Aug 2012, patch 1.0.4 | Inferno Act I elite HP -11%. Act II normals HP +4%, elites -8%, damage -8%. Acts III-IV normals HP +10%, elites -2.5%, damage -15%. Normal monsters drop magic/rare items about 4x more. | Accepted as the fix that made Inferno farmable. No measured data found. | [V, E2] | Cut damage spikes, keep or raise trash HP, and pay the player more for the time. Reward rate is a curve knob. |
| 3 | Diablo 3 | Oct 2012, patch 1.0.5 | Added Monster Power 1-10, a player-chosen difficulty slider inside each difficulty. Inferno MP damage values reduced. | Well received as a way out of the fixed tier. | [V, E2] change; [I] reception | A player-steered ladder replaces one fixed top tier. |
| 4 | Diablo 3 | 25 Feb 2014, patch 2.0.1 (Loot 2.0) | Normal/Nightmare/Hell/Inferno plus MP1-10 -> Normal, Hard, Expert, Master, Torment I-VI. Monster level now scales with the character. | Press framed it as the game's revival ("harder, better, faster"). | [V, E3] | Decouple difficulty from campaign progress. Let any tier be chosen at any level, with loot scaled to the tier. |
| 5 | Diablo 4 | 18 Jul 2023, patch 1.1.0 (pre-Season 1) | Vulnerable damage cut about 65%. Critical damage nerfs. Helltide Tortured Gift cost raised. | Metacritic review bombing. Devs said they "don't plan on doing a patch like this ever again". | [V, E2] quote; [V, E3] reaction | Cutting the power curve at a season start is felt as theft. Lower difficulty instead, or buff the weak options. |
| 6 | Diablo 4 | 8 Aug 2023, patch 1.1.1 | Nightmare Dungeon and Helltide density up. Bosses above level 60 tougher, +50% HP at level 80. 3 Nightmare affixes removed. Nightmare Dungeon reward 1 -> 3 rares. | Calmed the 1.1.0 backlash. Response leaned on more mobs and more loot. | [V, E2] | Players accept more enemies when the mow returns. More density reads as more power. |
| 7 | Diablo 4 | 8 Oct 2024, Season 6 / Vessel of Hatred | World Tiers 1-4 -> Normal, Hard, Expert, Penitent, then Torment I-IV gated by Pit tier 20/35/50/65. | Curve roughly linear T1-T3, big jump at T3 -> T4. One reviewer spent the whole campaign on Normal. | [V, E3]; [V, E4] review | A gate tied to a measured clear (Pit tier) is a readiness check. Uneven step sizes create a spike the ladder was meant to hide. |
| 8 | Helldivers 2 | 6 Aug 2024, Escalation of Freedom | Added Difficulty 10 (Super Helldive). Fire damage nerfed, enemy time to kill up. | 671 negative Steam reviews on 6 Aug alone, about 3,000 in three days. CEO "disappointed", director "didn't hit our target". | [V, E1] review counts as reported by press | Adding a top tier while nerfing player power doubles the felt jump. The top tier also changes how players judge the lower ones. |
| 9 | Helldivers 2 | 17 Sep 2024, patch 01.001.100 (60-day plan) | Railgun 60 -> 225 damage per shot. Stratagems deal more damage. Most enemies lost health and armor. | Steam concurrents nearly tripled to about 60k-68k the next day (SteamDB via press). Later Heart of Democracy update peaked near 164k, highest since April 2024. | [V, E1] secondhand; peaks conflict | Raising player power, not adding mode options, was what brought players back. |
| 10 | Path of Exile 2 | 4 Apr 2025, 0.2.0 Dawn of the Hunt | Nerfs to player and minion health and power, buffs to enemy survivability. | Steam recent reviews fell to 39% (Mostly Negative). Director: nerfs and enemy buffs "both went way too far". Emergency patch 11 Apr. | [V, E1] review %; [V, E2] quote | Changing both sides of the ratio at once overshoots. Move one side, measure, then move the other. |
| 11 | Path of Exile 2 | 29 Aug 2025, 0.3.0 The Third Edict | Shift from nerfs to broad buffs. Removed the Cruel replay of the campaign (acts no longer repeated at higher difficulty). | Reception described as overwhelmingly positive, Cruel removal named in praise. About 150k players at hotfix time. | [V, E3] | Repeating finished content at a higher multiplier reads as padding. Players welcome removing it. |
| 12 | Path of Exile 2 | Jan 2025, 0.1.1 | Arbiter of Ash pinnacle boss gets 6 respawn attempts (was one life). | Part of a patch press called the fix for a boring endgame. | [V, E2] change; [U] reaction | Lower the cost of failure on the hardest beat with a fixed retry budget, not lower stats. |
| 13 | Elden Ring Nightreign | ~2 Jun 2025, patch 1.01.1 | Solo only. One automatic revive per night boss fight on Days 1-2. More runes from kills all session. | Press headline "makes solo runs viable". | [V, E2] change; [V, E3] reaction | A co-op-first game needs a solo patch. Add a revive and more income instead of cutting boss stats. |
| 14 | Elden Ring Nightreign | 11 Sep 2025, Deep of Night (patch 1.02) | New ranked mode, 5 depths, rating moves you up and down. Endless horde fight between depths 4 and 5. Patch 1.02.3 (7 Oct 2025) adjusted it and reportedly added voluntary demotion. | Welcomed by the core ("finally, a worthy opponent"). An aggregator claims 43.2% peak negative ratio for overtuning. | [V, E3]; [U] ratio and demotion | A rating-driven ladder is player-steered by results. Players asked for an exit (demotion), not only a climb. |
| 15 | Risk of Rain 2 | 27 Aug 2024, Seekers of the Storm | Expansion plus base-game patch, many bugs, pricing complaints. Not mainly a difficulty change. | DLC 21-34% positive, base recent reviews to Mixed. Yet concurrents hit a record 75,406 on 28 Aug. | [V, E1] secondhand | Control case. Player counts can peak while sentiment crashes. Track both, and separate curve complaints from bug complaints. |
| 16 | Back 4 Blood | 16 Dec 2021, update 1.04 | Recruit, Veteran and Nightmare rebalanced to "decrease the disparity" between tiers. Nightmare Abomination HP readjusted. Offline solo progression added. | Press read it as making all tiers easier. Nightmare had been "unmanageable for most players". | [V, E2] goal; [V, E3] reaction | Big gaps between named tiers strand players between them. Close the gaps before adding tiers. |
| 17 | Vermintide 2 | Aug 2019, Winds of Magic | Added Cataclysm above Legend, unlocked by beating all Helmgart lords on Legend. Added Weaves mode. | DLC Steam reviews Mostly Negative (2,144). Complaints centred on Weaves, not Cataclysm. | [V, E3] | A top tier gated by a clear is accepted. A new mode with its own curve can sink the same release. |
| 18 | Monster Hunter Wilds | Feb-Aug 2025, launch -> TU1, v1.011 (May), v1.021 | Launch HP scale 100% solo / 163% duo / 200% trio / 234% four (community-measured). Players: monsters die in under 10 min. Capcom raised HP and wound resistance, added 8-star then 9-star Tempered monsters. | Praise for longer hunts. Capcom admitted the endgame leaned on one Tempered monster. | [U, E3] HP table; [V, E2] Capcom; [V, E3] praise | A curve can fail by being too easy. Short fights remove the peak. Compare MH World's reported flat 2.6x for 2-4 players [U, E4]. |
| 19 | Dota 2 Aghanim's Labyrinth | 28 Aug 2020 update | Added Apex Mage as the 5th tier above Grand Magus. Higher damage and HP. Buffs per encounter 3 -> 4. | Stratz data via GosuGamers: fewest games played of all tiers, low win rates for every comp. | [V, E1] secondhand, sparse | Each new top tier is played by a shrinking fraction. Build it last and cheaply. |
| 20 | Kingdom Rush 6 Genesis | 2025, patch 1 (exact date not found) | Casual +20% gold per enemy, Normal/Veteran/Impossible unchanged. Impossible now unlocks after stage 18. A later balance post trimmed Normal/Veteran/Impossible but left Casual alone. | Mixed. Some players call recent updates too easy, others say Impossible is uneven. | [V, E3] fan changelog; [V, E2] Ironhide post | Tune the easy mode through income, not enemy stats. Gate the hardest mode behind campaign progress. |
| 21 | Deep Rock Galactic | Season 5 (date not confirmed) | Hazard 5+ modifiers on top of Hazard 5. Aggressive up to x2 attack rate and x1.32 move speed. More Enemies up to x1.5 count. Player Vulnerability up to x2 damage. Tough Enemies x1.5 resistance on large and elite. | Core players adopted it as the post-Haz 5 ladder. No measured data found. | [V, E3] values; [U] date, reaction | Split "harder" into named, separate knobs the host picks. Each knob is one multiplier. |

## Per-experiment notes

### 1-4. Diablo 3 from Inferno to Torment (2012-2014)
- [V, E2] 1.0.3 cut Inferno Acts II-IV monster damage and health and reduced per-player damage scaling, which designers
  called a barrier to grouping [N1][N2]. The exact percentages were not found in reachable sources. The Diablo Wiki page
  returned 403. [U]
- [V, E2] 1.0.4 numbers above come from the reproduced official notes [N3] and Blizzard's preview, which gave normal HP
  +5-10% and magic/rare drops x4 [N4].
- [V, E2] 1.0.5 added Monster Power 1-10 [N5]. [V, E3] 2.0.1 replaced the difficulty set and MP with Normal to Torment I-VI
  and scaled monster level to the character [N6][N7]. Sources disagree on Torment I-VI vs I-X at launch; the weight is six.
- [I] The sequence went from one fixed top tier, to a patched-down top tier with more rewards, to a player-chosen
  slider, to free choice of tier at any level. Each step moved control from the designer's curve to the player.

### 5-7. Diablo 4 (2023-2024)
- [V, E2] 1.1.0 cut Vulnerable about 65% [N8]. [V, E3] Metacritic user ratings dropped after review bombing [N9].
  [V, E2] Campfire Chat promise not to repeat such a patch [N10].
- [V, E2] 1.1.1 (live 8 Aug 2023) added density, boss HP above 60 (+50% at 80), removed 3 affixes, 3 rares per Nightmare
  Dungeon [N11][N12].
- [V, E3] Season 6 ladder and Pit gates [N13][N14]. [V, E4] Forbes reviewer stayed on Normal for the whole campaign [N15].

### 8-9. Helldivers 2 (2024)
- [V, E1] Review counts via press: 671 negatives on 6 Aug, about 3,000 in three days [N16][N17]. [V, E2] Director and CEO
  statements [N17][N18].
- [V, E2] 01.001.100 Railgun 60 -> 225, enemy HP/armor down [N19][N20]. [V, E1] Next-day peak 60k-68k, nearly triple,
  per SteamDB via press [N21]. Sources conflict on the exact peak. [V, E1] Heart of Democracy peak near 164k [N22].
- [U] A record low of 10,230 concurrents is reported but undated [N23].
- [I] Arrowhead's own framing of the plan was about fun and power fantasy, but this was not verified in sources found.

### 10-12. Path of Exile 2 (2025)
- [V, E1] 39% recent reviews after 0.2.0 [N24]. [V, E2] Mark Roberts quotes and emergency patch date [N25].
- [V, E3] 0.3.0 reception and Cruel removal [N26][N27]. Note a search premise that 0.3.0 was review-bombed was false.
  The bombing was 0.2.0.
- [V, E2] 0.1.1 Arbiter respawns [N28].

### 13-14. Elden Ring Nightreign (2025)
- [V, E2] 1.01.1 official notes, revive and runes [N29][N30]. [V, E3] Reaction [N31].
- [V, E3] Deep of Night launch and design [N32][N33]. [U] 43.2% peak negative and voluntary demotion come from a
  low-reliability aggregator [N34].

### 15. Risk of Rain 2 Seekers of the Storm (2024)
- [V, E1] Review percentages and the 75,406 record from press [N35][N36]. Sources disagree (21% vs 34% positive).
- [I] This case is mostly bugs and price. Keep it as a reminder that a curve change shipped in a buggy patch cannot be
  judged from reviews.

### 16. Back 4 Blood (2021)
- [V, E2] Turtle Rock goal quote and scope [N37][N38]. [V, E3] "Nerfs all difficulties" reading came from Reddit plus
  Discord confirmation [N39]. No numbers for Veteran/Nightmare were found.

### 17. Vermintide 2 Winds of Magic (2019)
- [V, E3] Cataclysm unlock and DLC review state [N40][N41]. No Fatshark completion stats found.

### 18. Monster Hunter Wilds (2025)
- [U, E3] HP table is community-measured, reported by Gfinity [N42]. [V, E2] Capcom endgame admission and v1.021 focus [N43].
  [V, E3] Praise for tougher monsters [N44]. [U, E4] MH World 2.6x for 2-4 players is a 2018 Reddit comment [N45].

### 19. Aghanim's Labyrinth (2020)
- [V, E3] Apex Mage addition, buffs 3 -> 4 [N46][N47]. [V, E1] Sparse play and low win rate, Stratz via GosuGamers [N48].

### 20. Kingdom Rush (2024-2025)
- [V, E3] Genesis patch 1 summary from a fan-run changelog [N49]. [V, E2] Ironhide balance post leaving Casual untouched
  [N50]. [V, E4] Player reactions are scattered posts [N51].

### 21. Deep Rock Galactic Hazard 5+
- [V, E3] Hazard 1-5 and Hazard 5+ multipliers from the wiki [N52]. This fills the gap noted in `00b-glossary-practice.md`.
  Hazard 1-5 per player count (1/2/3/4 players):

  | Hazard | Enemy damage | Enemy count | Normal resistance | Friendly fire |
  |---|---|---|---|---|
  | 1 | 0.50 all | 0.15/0.25/0.45/0.65 | 0.70 | 0.10 |
  | 2 | 0.70/0.80/0.90/1.00 | 0.25/0.35/0.65/0.80 | 1.00 | 0.20 |
  | 3 | 1.20/1.30/1.40/1.50 | 0.50/0.50/0.80/1.10 | 1.10 | 0.30 |
  | 4 | 2.00/2.15/2.30/2.50 | 0.75/0.75/1.15/1.35 | 1.20 | 0.40 |
  | 5 | 2.80/3.00/3.20/3.40 | 0.85/0.85/1.25/1.50 | 1.20 | 0.70 |

- [I] Note DRG scales count far more than damage with players (H5 count 0.85 -> 1.50, damage 2.80 -> 3.40), and solo
  and duo share the same count. That is a co-op scaling recipe worth copying.

## Key questions

### Q1. What happens when a top difficulty tier is a wall?
Takeaway. Players treat a wall as a bug, and the fixes that stuck lowered damage spikes and raised rewards instead of
gutting HP (#1, #2). Later, free tier choice replaced the wall (#3, #4).
Cited findings. #1-#4 [V, E2/E3]. #7 T3 -> T4 jump [V, E3]. #19 the top tier is barely played [V, E1].
Inferences. [I] Damage spikes cause deaths the player cannot read. HP raises cause slower clears the player can read.
Hearthguard's mob attack x4.4 by chapter 5 against a 6,500 HP Hearth [K] is a damage-side wall of the #1 kind.
Gaps. No percent numbers for D3 1.0.3. No per-tier completion data for D4 Torment.

### Q2. What happens when the power curve is cut?
Takeaway. Cutting player power is the single most punished change in this set (#5, #8, #10). Adding power back
recovered players fastest (#9, #11).
Cited findings. #5 Vulnerable -65% and the "never again" promise [V, E2]. #8 3,000 negatives in three days [V, E1].
#10 39% recent reviews [V, E1]. #9 concurrents nearly tripled [V, E1].
Inferences. [I] Loss aversion. A nerf takes away power already felt; a mob buff with the same net effect is accepted
more often (#6, #18). When Hearthguard must lower the hero-vs-mob ratio, move mob numbers, not hero numbers.
Gaps. No case found with an A/B of "nerf hero" vs "buff mob" of equal size.

### Q3. How did solo and co-op scaling change?
Takeaway. Co-op-first games needed explicit solo help (#13), and scaling that punishes grouping was patched out (#1).
Good scaling raises count more than damage (#21).
Cited findings. #1 group damage bonus reduced [V, E2]. #13 solo revive and more runes [V, E2]. #18 Wilds 100/163/200/234
[U, E3]. #21 DRG count vs damage table [V, E3].
Inferences. [I] For 1-3 players in separate lanes, Hearthguard can scale per-lane count lightly and give solo a revive
budget, as Nightreign did, instead of a separate stat table.
Gaps. No Hearthguard-like lane-split co-op game with published scaling found.

### Q4. Which difficulty modes and ladders worked?
Takeaway. Ladders gated by a measured clear were accepted (#7 Pit gates, #14, #17). Repeated-content tiers were
removed to applause (#11). Closing gaps between tiers came before adding tiers (#16).
Cited findings. #4, #7, #11, #14, #16, #17, #20, #21.
Inferences. [I] For a 5-chapter run with a casual audience, one easy mode tuned by income (#20) and an opt-in ladder of
named knobs (#21) cover the range. The ladder can wait until the base run is cleared by the playtest group.
Gaps. Kingdom Rush exact patch date. DRG Hazard 5+ release date.

### Q5. What did lowering the cost of failure do?
Takeaway. Retry budgets on the hardest fight (#12) and per-fight revives (#13) were well received and did not change
stats.
Cited findings. #12 six respawns [V, E2]. #13 one revive per night boss on Days 1-2 [V, E2].
Inferences. [I] Hearthguard's loss is the Hearth falling. A one-time "second Hearth" per run for the boss wave, or a
revive budget for the chapter boss, fits this pattern.
Gaps. No measured win-rate change for either patch.

## Recurring lessons
1. Nerfing player power reads as loss and draws the strongest backlash in the set (#5, #8, #10). Prefer moving mob numbers.
2. Change one side of the hero-vs-mob ratio per patch (#10 moved both and overshot).
3. Damage spikes are worse than HP padding. Cut the burst, keep the HP, and raise rewards (#2, #6).
4. Too easy also fails. Fights that end before a peak lose the build up, peak, relax shape (#18).
5. Player-steered difficulty beat fixed tiers every time it was offered (#3, #4, #14).
6. Gate the top tier by a measured clear, and keep step sizes even (#7, #17, #20).
7. Each new top tier reaches fewer players. Build it last (#19).
8. Lower the cost of failure with a retry or revive budget, not lower stats (#12, #13).
9. Co-op scaling should add count before damage, and must not punish grouping (#1, #21).
10. Judge curve changes with two signals, concurrents and recent reviews, and separate bug noise (#9, #15).

## Pattern cards

### PC-NE1. Mob-side correction
- Lineage. D3 1.0.4 (cut monster damage, keep HP, x4 drops) -> D4 1.1.1 (more density, tougher bosses, more loot after a
  player nerf failed) -> Helldivers 2 01.001.100 (enemy HP down rather than player nerfs). Why: player nerfs drew backlash.
- Feeling. Mastery kept; tension tuned without loss.
- Mechanism. When the felt difficulty is off, change mob HP, mob damage or count. Leave hero numbers alone unless a
  single option dominates, and then buff the alternatives.
- Works when players own their power (levels, talents). Breaks when one hero option trivialises everything.
- Evidence. #2, #5, #6, #9, #10 [V, E1-E2].
- Cost S. Knobs: chapter HP and attack arrays, +7% per wave.
- Hearthguard. Fix the chapter 3-5 Hearth losses by lowering the attack array [1.0, 1.6, 2.4, 3.3, 4.4] or raising Hearth HP
  [K], not by touching the +9% hero damage per level.

### PC-NE2. Burst cap, HP pad
- Lineage. D3 1.0.3/1.0.4 (damage -8% to -15%, normal HP +4% to +10%) -> D4 1.1.1 (boss HP +50% at 80).
- Feeling. Readable tension, fewer "what killed me" deaths.
- Mechanism. Cap per-hit mob damage as a share of hero or Hearth HP. Recover lost challenge with HP or count.
- Works for real-time positioning games. Breaks if HP padding makes fights long enough to bore (see PC-NE5).
- Evidence. #2, #6 [V, E2].
- Cost S. Knobs: max hit as % of max HP, HP multiplier.
- Hearthguard. Death telemetry already records the last 6 s of hits [K]. Flag any single hit above a threshold share
  of hero HP per chapter.

### PC-NE3. Clear-gated ladder of named knobs
- Lineage. D3 Monster Power (2012) -> D3 Torment (2014) -> DRG Hazard 5+ (separate knobs) -> D4 Pit-gated Torment (2024)
  -> Nightreign Deep of Night rating (2025).
- Feeling. "One more try", mastery after the first clear.
- Mechanism. After a full clear, unlock a ladder. Each step turns one named knob by one multiplier
  (attack rate x1.5-2, count x1.5, damage x2, elite toughness x1.5). Even step sizes. Allow stepping down.
- Works after a base run most players can clear. Breaks when steps are uneven (D4 T3 -> T4) or the ladder is added
  while the base is too hard (Helldivers 2 #8).
- Evidence. #3, #4, #7, #14, #21 [V, E2-E3].
- Cost M. Knobs: knob list, multiplier per step, unlock condition.
- Hearthguard. Defer until the playtest group clears chapter 5. Then expose "Aggressive / More mobs / Fragile Hearth /
  Tough elites" as host toggles.

### PC-NE4. Retry budget on the peak beat
- Lineage. PoE2 0.1.1 (Arbiter 6 attempts) -> Nightreign 1.01.1 (solo revive per night boss Days 1-2).
- Feeling. Relief and "one more try" without a stat cut.
- Mechanism. On the hardest fight only, grant N retries or revives per run. Do not change boss stats.
- Works when failure cost is high (run restart). Breaks if it applies everywhere and removes tension.
- Evidence. #12, #13 [V, E2].
- Cost S. Knobs: N, which waves, solo-only or all.
- Hearthguard. Give the Hearth one "last ember" per run on wave 6 bosses, or a solo-only revive token for chapter
  bosses, since the Hearth falling restarts at chapter 1 [K].

### PC-NE5. Peak floor (too easy is a failure)
- Lineage. MH Wilds launch fights under 10 min -> TU1 and v1.021 raised HP and added Tempered tiers.
- Feeling. Restores the build up, peak, relax shape.
- Mechanism. Set a minimum wave or boss duration (or a minimum hero HP dip) per chapter. If the median run falls under
  it, raise HP or count.
- Works with telemetry per wave. Breaks if used to justify padding every wave.
- Evidence. #18 [V, E2-E3].
- Cost S. Knobs: target duration per beat.
- Hearthguard. Per-wave summaries exist [K]. Use them to check that waves 4 and 6 each produce a real peak, while
  waves 1-2 can stay mows.

### PC-NE6. Count-first co-op scaling
- Lineage. D3 1.0.3 removed group damage punishment -> DRG count scales 0.85 -> 1.50 while damage scales 2.80 -> 3.40 at H5.
- Feeling. Co-op feels like a bigger fight, not a more lethal one.
- Mechanism. Per added player, scale count or HP; keep per-hit damage close to solo. Solo and duo can share a count.
- Works for shared-loss co-op. Breaks if count exceeds the cap the engine or lane can show.
- Evidence. #1, #21 [V, E2-E3].
- Cost S. Knobs: count multiplier per player.
- Hearthguard. Each player owns a lane. Scale the shared boss and Horde surges by count, not attack.

## Fun hypotheses
- [I] Players of Hearthguard should feel relief, not loss, at the chapter 3 campfire if the next-chapter correction comes
  from mobs (PC-NE1) rather than from a lower hero ratio.
- [I] A solo player on wave 6 of chapter 2 should feel "one more try" after a loss if a retry token exists (PC-NE4).

## Anti-patterns
- Nerfing hero power and buffing mobs in the same build (#10).
- Shipping a new top tier in a patch that also nerfs players (#8).
- Repeating finished chapters at a higher multiplier as content (#11).
- A damage spike as the final gate (#1).

## Glossary additions
- Review signal. Steam "recent reviews" percentage over the patch window, read beside concurrent players. Proposed as the
  default reaction metric for natural experiments. [I]
- Retry budget. A fixed number of revives or retries on a specific beat, separate from difficulty stats. Close to
  "stacking assist" but flat and not failure-driven. [I]

## Gaps
- D3 1.0.3 exact percentages; Diablo Wiki 403. D4 per-tier usage numbers.
- No designer postmortem with win-rate before and after for any entry.
- Orcs Must Die 3, Dungeon Defenders 2, Vampire Survivors, Hades II not covered within budget.
- Kingdom Rush 6 patch date; DRG Hazard 5+ release date; Nightreign 1.02.3 details are aggregator-only.
- Helldivers 2 exact SteamDB numbers (press figures conflict). Fetches of GamesRadar returned headlines only.

## Sources
- [N1] Engadget, D3 1.0.3 design preview. https://www.engadget.com/2012/06/06/diablo-3s-patch-1-0-3-design-preview/
- [N2] Shacknews, D3 1.0.3. https://www.shacknews.com/article/74408/diablo-3-updates-with-large-103-patch
- [N3] GosuGamers, 1.0.4 patch notes. https://www.gosugamers.net/news/20760-patch-1-0-4-official-patch-notes
- [N4] Engadget, 1.0.4 details. https://www.engadget.com/2012-08-10-blizzard-releases-details-for-diablo-iiis-big-1-0-4-patch.html
- [N5] PCGamesN, 1.0.5 notes. https://www.pcgamesn.com/diablo/diablo-3-105-patch-notes-detailed
- [N6] PC Gamer, 2.0.1 impressions. https://www.pcgamer.com/diablo-3-patch-2-0-1-impressions-harder-better-faster
- [N7] Engadget, Loot 2.0 live. https://www.engadget.com/2014-02-26-loot-2-0-comes-to-diablo-3-in-massive-new-patch.html
- [N8] GamesRadar, D4 Vulnerable nerf. https://gamesradar.com/diablo-4-season-1-patch-nerfs-vulnerable-to-make-it-less-of-a-hard-requirement-for-builds
- [N9] Game8, D4 1.1.0 reviews. https://game8.co/articles/latest/706
- [N10] WePC, "never again". https://www.wepc.com/news/diablo-4-patch-feedback-heard/
- [N11] Icy Veins, 1.1.1 notes. https://www.icy-veins.com/d4/news/official-diablo-4-patch-1-1-1-notes/
- [N12] Gfinity, 1.1.1 notes. https://www.gfinityesports.com/article/diablo-4-patch-notes
- [N13] ProGameTalk, Season 6 difficulty. https://progametalk.com/diablo-4/season-6-difficulty-changes-vessel-of-hatred-expansion/
- [N14] Sportskeeda, Torment unlocks. https://www.sportskeeda.com/mmo/diablo-4-vessel-hatred-how-unlock-torment-difficulty
- [N15] Forbes, VoH review. https://www.forbes.com/sites/paultassi/2024/10/04/diablo-4-vessel-of-hatred-review-thatll-do-mephisto-thatll-do/
- [N16] GGRecon, review bomb. https://www.ggrecon.com/articles/helldivers-2-review-bombed-after-escalation-of-freedom-update-nerfs-it-into-oblivion
- [N17] Comicbook, director response. https://comicbook.com/gaming/news/helldivers-2-game-director-responds-to-backlash-over-escalation-of-freedom-update
- [N18] PCGamesN, CEO disappointed. https://www.pcgamesn.com/helldivers-2/ceo-disappointment
- [N19] Shacknews, 01.001.100 notes. https://shacknews.com/article/141454/helldivers-2-version-1001100-patch-notes
- [N20] U.GG, 01.001.100. https://u.gg/hd2/news/helldivers-2-01-001-100-patch-notes
- [N21] GamesRadar, 60-day plan rebound. https://gamesradar.com/games/third-person-shooter/the-first-big-helldivers-2-patch-of-arrowheads-60-day-recovery-plan-kicks-off-a-redemption-arc-with-player-numbers-and-reviews-steadily-improving
- [N22] OpenCritic, highest player count. https://opencritic.com/news/16920/helldivers-2-just-hit-its-highest-player-count-in-a-long-long-time
- [N23] 80.lv, record low. https://origin.80.lv/articles/helldivers-2-s-concurrent-player-numbers-hit-the-record-low
- [N24] The Nerd Stash, PoE2 review bomb. https://thenerdstash.com/path-of-exile-2-review-bombed-for-being-too-hard-game-was-good-before-dawn-of-the-hunt/
- [N25] Kotaku, "blatant f-ups". https://kotaku.com/path-exile-2-poe-nerfs-patch-notes-dawn-hunt-1851775526
- [N26] PCGamesN, Third Edict hotfix. https://www.pcgamesn.com/path-of-exile-2/the-third-edict-hotfix-patch-notes
- [N27] Escapist, 0.3.0b. https://www.escapistmagazine.com/news-path-of-exile-2-third-edict-0-3-0b-patch/
- [N28] PC Gamer, PoE2 first 2025 patch. https://www.pcgamer.com/games/mmo/path-of-exile-2s-first-patch-of-2025-is-coming-later-this-week-with-more-rewarding-endgame-mapping-and-the-rollout-of-respawns-when-fighting-pinnacle-bosses
- [N29] Bandai Namco, Nightreign 1.01.1. https://www.bandainamcoent.com/news/elden-ring-nightreign-patch-notes-version-1-01-1
- [N30] Maxroll, 1.01.1. https://maxroll.gg/elden-ring-nightreign/news/1-01-1-patch-notes-bring-single-player-buffs
- [N31] OpenCritic, solo viable. https://opencritic.com/news/17250/elden-ring-nightreign-s-newest-patch-makes-solo-runs-viable
- [N32] Gematsu, Deep of Night. https://www.gematsu.com/2025/08/elden-ring-nightreign-adds-high-difficulty-expedition-mode-deep-of-night-on-september-11
- [N33] Gamepressure, "worthy opponent". https://www.gamepressure.com/newsroom/finally-a-worthy-opponent-elden-ring-nightreign-adds-a-challenge/zb84f9
- [N34] Aggregator (low reliability). https://exo-website-2026.pages.dev/nightreign_battlecard
- [N35] PC Gamer, SotS hammered. https://pcgamer.com/games/third-person-shooter/gearboxs-first-risk-of-rain-2-expansion-gets-hammered-on-steam-as-developer-admits-the-pc-version-is-in-a-really-bad-place
- [N36] GamesRadar, SotS. https://www.gamesradar.com/games/roguelike/and-you-thought-the-borderlands-movies-dollar90m-flop-was-harsh-gearbox-is-getting-eviscerated-for-botching-the-first-risk-of-rain-2-dlc-its-made-after-buying-the-ip
- [N37] Game Developer, B4B December update. https://www.gamedeveloper.com/press-release/back-4-blood-free-december-update-available-now-incl-solo-offline-campaign-mode-with-progression-holiday-themed-content-and-more
- [N38] MP1st, B4B 1.04 notes. https://mp1st.com/news/back-4-blood-update-1-04-patch-notes-out-for-december-update
- [N39] Mein-MMO, B4B nerfs all difficulties. https://mein-mmo.de/en/back-4-blood-nerfs-all-difficulties-becomes-much-easier,762890
- [N40] Prima Games, Winds of Magic review. https://primagames.com/gaming/warhammer-vermintide-2-winds-of-magic-review-not-quite-the-goat
- [N41] Steam, Winds of Magic store. https://store.steampowered.com/app/1033060
- [N42] Gfinity, Wilds monsters die too fast. https://www.gfinityesports.com/article/monster-hunter-wilds-monsters-are-dropping-too-fast-capcom-needs-to-buff-their-health
- [N43] Automaton, 9-star Tempered. https://automaton-media.com/en/news/monster-hunter-wilds-update-expands-endgame-content-and-ups-the-difficulty-with-new-9-star-tempered-monsters/
- [N44] Gfinity, players loving difficulty. https://www.gfinityesports.com/article/capcom-increases-monster-hunter-wilds-difficulty-why-players-are-loving-it
- [N45] Reddit mirror, MH World 2.6x. https://reddit.birdcat.cafe/r/MonsterHunter/comments/7x9ggi/monster_hunter_world_resources_and_question/dua6vdd
- [N46] EarlyGame, Apex Mage. https://earlygame.com/valve-add-a-new-difficulty-level-and-new-heroes-to-aghanims-labyrinth
- [N47] Hawk Live, new heroes. https://hawk.live/posts/new-heroes-for-aghanims-labyrinth
- [N48] GosuGamers, Apex Mage heroes (Stratz). https://gosugamers.net/dota2/news/55659-aghanim-s-labyrinth-the-best-heroes-to-navigate-through-the-apex-mage-tier
- [N49] Wikily, KR6 patch 1. https://wikily.gg/kingdom-rush-6-genesis/patches/patch-1-is-here-read-the-full-changelog
- [N50] Ironhide, balance post. https://www.ironhidegames.com/News/Details/456
- [N51] Kingdom Rush Wiki, Difficulty (see it in action). https://kingdomrushtd.fandom.com/wiki/Difficulty
- [N52] DRG Wiki, Hazard Level. https://deeprockgalactic.wiki.gg/wiki/Hazard_Level
- Glossary notes cited for already-covered items: `notes/00b-glossary-practice.md` (RoR2 formula, DRG hazard overview).
