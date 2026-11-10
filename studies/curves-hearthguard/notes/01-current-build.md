# 01. Our current build (Hearthguard as built)

Scope. Hearthguard's difficulty, learning and power curves as the code builds them today, at main b509a56 (build 0.2.0). Sources are the repo at `kingsfoil-heartguard/` (paths below are relative to it), four headless bot runs made for this note, and the playtest dashboard data fetched on 2026-11-09. Every fact is [K]. Grades follow CONTEXT.md. Code reads are E1 (they are the rules), bot runs are E1 for a floor player, and the dashboard is E1 but n=1 player.

Raw data saved outside the repo, in the session scratchpad.
- Bot logs `/private/tmp/claude-501/-Users-esenespinosa-Development-personal-games-kingsfoil-artifacts/fda5c70a-1356-4359-989d-6f3c3baa200a/scratchpad/bot/*.txt`
- Dashboard JSON `/private/tmp/claude-501/-Users-esenespinosa-Development-personal-games-kingsfoil-artifacts/fda5c70a-1356-4359-989d-6f3c3baa200a/scratchpad/dash/`
- Curve model `/private/tmp/claude-501/-Users-esenespinosa-Development-personal-games-kingsfoil-artifacts/fda5c70a-1356-4359-989d-6f3c3baa200a/scratchpad/curves.py`

## Takeaways

1. The sawtooth the README promises exists only in chapter 1. The hero-vs-mob ratio (hero damage multiplier over mob HP multiplier) climbs 1.00 to 1.27 across chapter 1, sits flat near 0.92 to 1.00 in chapter 2, and falls inside chapters 3 and 5. Across the run it slides from 1.0 to 0.6. [K, E1] (model below, from `scripts/data/chapter_defs.gd:21-24`, `scripts/game/hero_stats.gd:10`, `scripts/data/class_defs.gd:19`)
2. The cause is the XP table. `xp_to_next` grows with level squared, so a solo hero gains 6 levels in chapter 1, 6 in chapter 2, then only 4 to 5 per chapter. Four levels give 1.09^4 = 1.41x damage against the 1.35x that `WAVE_STEP` adds over six waves, so later chapters never "mow". [K, E1] [I] on the felt effect
3. The chapter-start pushback shrinks each time. The ratio drops 28% into chapter 2, 19% into chapter 3, 8% into chapter 4 and 3% into chapter 5. The biggest felt step comes early, the late steps are near flat. [K, E1]
4. A full solo run takes 24 to 27 minutes for the bot (1,450 to 1,622 s), not 15. Each chapter takes 5 to 6.5 minutes. [K, E1] (bot runs)
5. The Hearth does not scale with chapters. It stays at 6,500 HP solo (`scripts/game/sim.gd:23`) while mob attack grows 5.9x by chapter 5 wave 5. Every leak costs about 6x more Hearth late than early. Every bot loss is a Hearth loss in chapter 3 to 5. [K, E1]
6. The Town is the late-game lever and nothing teaches it. The bot that builds wins solo as a Mage. The Fighter bot that never builds dies at Astaroth holding 15,027 unspent gold. Maxing all nine buildings costs 20,741 gold against about 15,800 gold a solo run earns. [K, E1]
7. Minute 2 is the densest learning moment. The first talent choice (level 4) lands inside the first Horde (wave 4), right after the first elite and the first potion loot. The one player in the logs picked the talent at 2:09 to 2:10 in both runs, mid-Horde. [K, E1, n=1]
8. Playtest data is thin. The dashboard holds 11 plays from one account (P1) on 2026-11-08, build 0.2.0. Only 3 plays last over a minute. The furthest reached chapter 2 wave 2. Deaths (5) cluster on chapter 1 elites and the boss. [K, E1, n=1]

## Q1. What are the curves, chapter by chapter and wave by wave?

### Takeaway
Mob HP grows faster than hero damage after chapter 1. Hero toughness against mob attack also slides, from 1.0 to 0.71. Hits to kill an average mob with a plain attack rise from 1.8 to about 4.8.

### Cited findings

Rules the table is built from.
- Mobs per corridor per wave are `round(base x 1.08)`, base 14+8c, 22+12c, 18+10c, 40+30c, 28+16c for waves 1 to 5 (`scripts/data/chapter_defs.gd:75-88`). Wave 1 uses only the chapter's 2 or 3 "opening" kinds (`scripts/game/director.gd:113-116`). [K, E1]
- Spawn span is 22 s for wave 1, 26 s for the Horde, 28 s otherwise (`scripts/data/chapter_defs.gd:94-99`). The Horde instead comes as three surges 9 s apart, a third each, 0.05 s between mobs (`scripts/game/director.gd:143-148`). Packs are 3-8 mobs plus 2 per chapter (`scripts/game/director.gd:126`). [K, E1]
- HP and attack multipliers are `HP_SCALE[c] x (1 + 0.07w)` and `ATK_SCALE[c] x (1 + 0.07w)` (`scripts/data/chapter_defs.gd:21-24, 102-107`). Base mob stats are MatchRPG's x3.2 HP and x3.6 attack (`scripts/data/mob_defs.gd:17-18`). Elites take x4.5 HP and x1.4 attack on top (`scripts/game/sim.gd:28-29`). Bosses ignore chapter scaling and get +75% HP per extra player (`scripts/game/sim.gd:189`). [K, E1]
- XP per kill is mob xp x (2.4 + 0.65c), split across players, bosses give everyone the whole amount (`scripts/game/sim.gd:295-307, 525-526`). Level-up heals 25% of max HP (`scripts/game/sim.gd:307`). [K, E1]
- Gold per kill is `(1 + int(xp/4)) x (1 + 0.7c) x Mint bonus`. The killer gets all of it and every other hero gets 30% (`scripts/game/sim.gd:197, 276-277, 527-535`). Ualac drops 5x (`scripts/game/sim.gd:529`). [K, E1]
- XP to next level is `80 + 70L + 6L²` (`scripts/data/class_defs.gd:18-19`). Values for L1 to L10 are 156, 244, 344, 456, 580, 716, 864, 1,024, 1,196, 1,380. [K, E1]
- Fighter damage is `32 x 1.09^(L-1) + 2.4(L-1)` (`scripts/game/hero_stats.gd:31`, `scripts/data/class_defs.gd:27`). Fighter HP is 820 + 68 per level and armor 3 + 0.3 per level. Damage taken is divided by `1 + 0.06 x armor` (`scripts/game/sim.gd:321-322`). [K, E1]
- Boss adds come every 5 s, 3 + chapter mobs per corridor, at 0.8x the wave's HP (`scripts/game/director.gd:18, 195-200`). [K, E1]
- A wave ends at 15% of its mobs left or 35 s after its last spawn, so leftovers carry over (`scripts/game/director.gd:16-17, 179-182`). [K, E1]

The table. One solo Fighter that kills everything, no talents, no Town, no early calls. "Ratio" is Fighter damage multiplier at wave start over mob HP multiplier. "Tough" is Fighter effective HP growth over mob attack multiplier. Boss-wave adds assume 150 s for the chapter 1 boss (the bot's time) and 75 to 90 s later. Computed by `curves.py` from the rules above. [K, E1] on the rules, [I] on the kill-everything assumption.

| Ch | W | Mobs per corridor | Span s | HP x | ATK x | XP | Gold | Lv start | Lv end | Dmg x | Ratio | Hits per avg mob | Tough | Gold total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | 15 | 22 | 1.00 | 1.00 | 144 | 25 | 1 | 1 | 1.00 | 1.00 | 1.8 | 1.00 | 25 |
| 1 | 2 | 24 | 28 | 1.07 | 1.07 | 244 | 41 | 1 | 2 | 1.00 | 0.93 | 2.3 | 0.93 | 66 |
| 1 | 3 E | 19 + Ogre King | 28 | 1.14 | 1.14 | 289 | 43 | 2 | 3 | 1.17 | 1.02 | 2.1 | 0.96 | 109 |
| 1 | 4 H | 43 | 3 surges | 1.21 | 1.21 | 437 | 73 | 3 | 4 | 1.34 | 1.11 | 2.0 | 0.99 | 183 |
| 1 | 5 E | 30 + Broodmother | 28 | 1.28 | 1.28 | 401 | 62 | 4 | 5 | 1.52 | 1.19 | 1.8 | 1.02 | 245 |
| 1 | 6 B | Mossback 8,000 + ~87 adds | 0 | 1.35 | 1.35 | 1,844 | 249 | 5 | 7 | 1.71 | 1.27 | | 1.05 | 494 |
| 2 | 1 | 24 | 22 | 2.30 | 1.60 | 342 | 82 | 7 | 8 | 2.13 | **0.92** | 2.5 | 1.02 | 576 |
| 2 | 2 | 37 | 28 | 2.46 | 1.71 | 605 | 135 | 8 | 8 | 2.35 | 0.96 | 2.8 | 1.02 | 711 |
| 2 | 3 E | 30 + Lich | 28 | 2.62 | 1.82 | 612 | 128 | 8 | 9 | 2.35 | 0.90 | 3.0 | 0.96 | 839 |
| 2 | 4 H | 76 | 3 surges | 2.78 | 1.94 | 1,242 | 277 | 9 | 10 | 2.59 | 0.93 | 2.9 | 0.96 | 1,116 |
| 2 | 5 E | 48 + Orc Warlord | 28 | 2.94 | 2.05 | 937 | 197 | 10 | 11 | 2.85 | 0.97 | 2.8 | 0.97 | 1,312 |
| 2 | 6 B | Warden 16,000 + ~68 adds | 0 | 3.10 | 2.16 | 3,246 | 547 | 11 | 13 | 3.12 | 1.00 | | 0.98 | 1,859 |
| 3 | 1 | 32 | 22 | 4.60 | 2.40 | 592 | 154 | 13 | 13 | 3.71 | **0.81** | 2.7 | 0.98 | 2,013 |
| 3 | 2 | 50 | 28 | 4.92 | 2.57 | 1,053 | 268 | 13 | 13 | 3.71 | 0.75 | 3.4 | 0.92 | 2,281 |
| 3 | 3 E | 41 + Crystal Golem | 28 | 5.24 | 2.74 | 1,086 | 258 | 13 | 14 | 3.71 | 0.71 | 3.7 | 0.86 | 2,539 |
| 3 | 4 H | 108 | 3 surges | 5.57 | 2.90 | 2,275 | 578 | 14 | 15 | 4.04 | 0.73 | 3.6 | 0.86 | 3,117 |
| 3 | 5 E | 65 + Matriarch | 28 | 5.89 | 3.07 | 1,591 | 386 | 15 | 15 | 4.39 | 0.75 | 3.5 | 0.85 | 3,503 |
| 3 | 6 B | Deep Wyrm 28,000 + ~70 adds | 0 | 6.21 | 3.24 | 5,544 | 1,037 | 15 | 17 | 4.39 | 0.71 | | 0.81 | 4,540 |
| 4 | 1 | 41 | 22 | 8.00 | 3.30 | 1,159 | 254 | 17 | 18 | 5.17 | **0.65** | 4.0 | 0.88 | 4,795 |
| 4 | 2 | 63 | 28 | 8.56 | 3.53 | 1,899 | 418 | 18 | 18 | 5.60 | 0.65 | 4.5 | 0.86 | 5,213 |
| 4 | 3 E | 52 + Hierophant | 28 | 9.12 | 3.76 | 1,850 | 398 | 18 | 19 | 5.60 | 0.61 | 4.7 | 0.81 | 5,611 |
| 4 | 4 H | 140 | 3 surges | 9.68 | 3.99 | 4,220 | 930 | 19 | 20 | 6.07 | 0.63 | 4.6 | 0.80 | 6,541 |
| 4 | 5 E | 82 + Shoggoth | 28 | 10.24 | 4.22 | 2,754 | 597 | 20 | 21 | 6.57 | 0.64 | 4.5 | 0.79 | 7,139 |
| 4 | 6 B | Sleeper 42,000 + ~84 adds | 0 | 10.80 | 4.46 | 9,057 | 1,724 | 21 | 23 | 7.10 | 0.66 | | 0.78 | 8,862 |
| 5 | 1 | 50 | 22 | 13.00 | 4.40 | 1,500 | 380 | 23 | 23 | 8.31 | **0.64** | 3.8 | 0.86 | 9,242 |
| 5 | 2 | 76 | 28 | 13.91 | 4.71 | 2,660 | 681 | 23 | 24 | 8.31 | 0.60 | 4.7 | 0.80 | 9,923 |
| 5 | 3 E | 63 + Amdusias | 28 | 14.82 | 5.02 | 2,555 | 633 | 24 | 24 | 8.98 | 0.61 | 4.6 | 0.78 | 10,556 |
| 5 | 4 H | 173 | 3 surges | 15.73 | 5.32 | 6,055 | 1,550 | 24 | 25 | 8.98 | 0.57 | 4.9 | 0.74 | 12,105 |
| 5 | 5 E | 99 + Belial | 28 | 16.64 | 5.63 | 3,815 | 955 | 25 | 26 | 9.71 | 0.58 | 4.8 | 0.73 | 13,060 |
| 5 | 6 B | Astaroth 60,000 + ~98 adds | 0 | 17.55 | 5.94 | 13,430 | 2,782 | 26 | 28 | 10.50 | 0.60 | | 0.71 | 15,842 |

The model matches the bots. It predicts levels 7, 13, 17 and 23 at the starts of chapters 2 to 5. The solo Fighter bot was 8, 13, 18 and 23, the Archer 7 and 13, the trio 8, 12, 17 and 23. The Fighter ended with 15,027 gold against a predicted 15,842. [K, E1]

Elite HP per corridor, solo. Chapter 1 has 2,627 and 2,580. Chapter 2 has 4,908 and 7,631. Chapter 3 has 15,103 and 14,414. Chapter 4 has 26,266 and 33,915. Chapter 5 has 40,548 and 50,319 (`scripts/data/mob_defs.gd:118-150`, `scripts/game/sim.gd:28`). The elite jump from chapter 2 to 3 is 2-3x, the largest step in the game. [K, E1]

Where the ratio jumps. [K, E1]

| Boundary | Ratio before, after | Change |
|---|---|---|
| Ch1 w6 to Ch2 w1 | 1.27 to 0.92 | -28% |
| Ch2 w6 to Ch3 w1 | 1.00 to 0.81 | -19% |
| Ch3 w6 to Ch4 w1 | 0.71 to 0.65 | -8% |
| Ch4 w6 to Ch5 w1 | 0.66 to 0.64 | -3% |
| Inside Ch1 | 1.00 to 1.27 | +27% (the mow) |
| Inside Ch2 | 0.92 to 1.00 | +9% |
| Inside Ch3 | 0.81 to 0.71 | -12% |
| Inside Ch4 | 0.65 to 0.66 | flat |
| Inside Ch5 | 0.64 to 0.60 | -6% |

Other curves.
- Respawn is 6 s + 1.5 s per chapter (6, 7.5, 9, 10.5, 12 s). It depends on the chapter, not the hero level (`scripts/game/sim.gd:378`, base `heroRespawnS` at `Dota_2.json:112`). Dashboard respawns all read 6.03 s. [K, E1]
- Hearth HP is 6,500 x (1 + 0.5 per extra player), so 6,500, 9,750, 13,000 (`scripts/game/sim.gd:23, 91`). The Quarry adds 12% per level. A mob at the Hearth deals its full attack, a boss half (`scripts/game/sim.gd:1063`). The campfire returns half the Hearth (`scripts/game/director.gd:227`). [K, E1]
- Road fire HP is 1,400 x the chapter's wave-1 attack multiplier, so 1,400, 2,240, 3,360, 4,620, 6,160 (`scripts/game/sim.gd:1117, 1129-1130`). [K, E1]
- Town costs are base x 1.7^level built. Base 100 gives 100, 170, 289, 491, 835. All nine at level 1 cost 1,100. All nine at level 5 cost 20,741 (`scripts/data/town_defs.gd:14-16, 23-41`). [K, E1]
- Calling early pays 2 gold per second skipped x the chapter gold multiplier. A full 12 s gap is worth 24, 41, 58, 74, 91 gold by chapter. A full 25 s campfire is worth 50 to 190 (`scripts/game/sim.gd:281-289`). [K, E1]
- Co-op. XP is split by players while each corridor feeds the pool, so per-hero XP equals solo. Gold per hero is about 1.6x solo (own lane full plus 30% of two others), and the Town is shared, so team gold is about 4.8x solo. Boss HP is 2.5x for three players, Hearth 2x. [K, E1] on rules, [I] on the multipliers (they assume even kills).

### Inferences
- [I] The power curve is front-loaded. Chapter 1 delivers the promised mow. From chapter 3 on, the hero gets relatively weaker each wave, and the talents, ability ranks, Town and execute line (8%, `scripts/game/sim.gd:27`) carry the player. A player who skips the Town feels a slow grind, not a sawtooth.
- [I] The Horde's three surges of 14 (ch1) to 58 (ch5) mobs 9 s apart are the only within-chapter spike that grows with the run. Plain waves widen in count but keep the same span, so density rises by count alone.

### Gaps
- The ratio ignores cleave, splash, abilities and talents. A per-wave measure of real time-to-kill would need telemetry (see "Not instrumented").

## Q2. What do the headless bots show?

### Takeaway
The bot reproduces the README's results exactly. Solo and team bots that never build die in chapter 3 to 5 with full HP and thousands of gold. The Hearth falls, not the hero.

### Cited findings
Commands run from the repo with a 600 s cap (`perl -e 'alarm 600'`, since macOS has no `timeout`). Seed 7, 60 minutes allowed. Each solo run took about 20 s of wall time at 0.17 ms per tick, the trio 0.52 ms. [K, E1]

| Run | Ends | Time | Ch2 start | Ch3 start | Ch4 start | Ch5 start | Deaths | Final level | Gold left |
|---|---|---|---|---|---|---|---|---|---|
| `--cls=fighter` | Defeat, ch5 boss (Astaroth), Hearth -413 | 1,622 s | 399 s, L8 | 766 s, L13 | 1,096 s, L18 | 1,404 s, L23 | 8 | 26 | 15,027 |
| `--cls=archer` | Defeat, ch3 boss (Deep Wyrm), Hearth -8 | 973 s | 329 s, L7 | 663 s, L13 | | | 4 | 16 | 3,988 |
| `--cls=mage --build` | Victory | 1,450 s | 318 s, L7 | 624 s, L12 | 936 s, L17 | 1,208 s, L23 | 0 | 27 | 13,322 (after building) |
| `--players=3 --cls=fighter,mage,archer` | Defeat, ch5 wave 5 (Belial), Hearth -8 of 13,000 | 1,559 s | 368 s, L8 | 683 s, L12 | 1,020 s, L17 | 1,345 s, L23 | 4 / 10 / 4 | 26 | 21k to 25k each |

Logs in the scratchpad `bot/` folder. Per-chapter times for the solo Fighter are 399, 367, 330, 308 and 218+ s. [K, E1]

- The bot never relights fires (`tests/sim_bot.gd`, README "Tests"). Its fires go out by chapter 1 wave 2. The Archer bot hit the dark in chapter 1 wave 5, as soon as both fires were out. [K, E1]
- The Mage builder's Town at the start of chapter 5 was Alchemist, Woodcutter, Tinker, Armory, Quarry and Mint at 4, Barracks, Tower and Forge at 3. Its Hearth max had grown to 9,620. It never died. [K, E1]
- The trio fell earlier than the solo Fighter. Three corridors leak into one Hearth that only doubles. [K, E1]

### Inferences
- [I] For bots, chapter 3 is the Archer's wall and chapter 5 is everyone's wall without the Town. A person who dodges telegraphs and relights fires should get further. A person who ignores the Town hits the same late Hearth wall.

### Gaps
- No `--rush` or other seeds were run. Run-to-run variance is unknown.

## Q3. What does the playtest dashboard show?

### Takeaway
Not enough to draw a curve. One account, one evening, mostly test starts. The two real runs agree with the model and show where a new player struggles in chapter 1.

### Cited findings
Fetched `dashboard_plays(lim=2000)` and `dashboard_play` for the 9 plays with events, read-only, from https://kingsfoil-hearthguard-dashboard.netlify.app's Supabase project. [K, E1, n=1]
- 11 plays, 1 player (P1), all on 2026-11-08 between 06:03 and 07:10 UTC, build 0.2.0. Not guests.
- Platform is web 4, macOS 7. Mode is solo 9, host 1, join 1 (a 2-player test).
- Heroes are Archer 5, Fighter 4, Mage 2.
- Outcomes are quit 6, defeat 1, disconnected 1, no outcome 3 (tab closed).
- Furthest progress is chapter 2 wave 2 (one play). One play reached chapter 1 boss, one chapter 1 wave 2. Eight plays never left chapter 1 wave 1, and six of those lasted 10 s or less.
- Lengths over a minute are 86 s, 290 s and 409 s.
- 5 deaths in total, all in chapter 1.

| Play | Ch, wave | Killed by (largest share of last 6 s of hits) |
|---|---|---|
| A | 1, 2 | treant_sapling 119, goblin 68 |
| B | 1, 3 (Ogre King) | zone:ogre_king:rock_throw 143, ogre_king 142 |
| C | 1, 5 (Broodmother) | giant_spider 288, dark_gnome 272, broodmother 168 |
| C | 1, 5 (Broodmother) | giant_spider 312, broodmother 168 |
| C | 1, 6 (Mossback) | zone:old_mossback:boulder_toss 190, log_slam 131 |

Wave detail from the two longer runs.
- Wave lengths in chapter 1 were 24-27 s, 26-55 s, 35-48 s, 39-47 s, 38-63 s, then 58 s (defeat) and 184 s (cleared) for the boss. P1 pressed Space to call early on every wave from 1 to 5. [K, E1]
- In run C the Hearth lost 4,954 of 6,500 HP during the Broodmother wave while P1 died twice. It entered the boss at 14.6% and fell 58 s later, at 4:47. [K, E1]
- In run D the Mossback fight took 184 s. P1 took 1,791 damage from boulder_toss and 1,285 from log_slam and drank 6 potions. P1 went from level 5 to 8 inside the fight. [K, E1]
- Wave-start levels match the model. Level 4 at chapter 1 wave 5, 6 at the boss, 8 at chapter 2. [K, E1]
- Both long runs picked the first talent (quickdraw) during the Horde, at 2:09 and 2:10. [K, E1]
- Run C bought potions every wave from wave 3 and ended with 9 gold to 159 gold. Run D spent 372 gold on potions at the first campfire and built nothing (the `build` kind appears twice in all logs). [K, E1]

### Inferences
- [I] Chapter 1's elites are the first real check for a new player. Both elite waves killed P1 or drained the Hearth. Broodmother's spider adds plus giant spider webs (slow) are the worst mix.
- [I] The Mossback fight at 2-3 minutes is long for minute 4 of a first game.

### Gaps
- No data from the other four collective members. No data past chapter 2. Sessions of a real 5-player playtest are needed before any minute-30 or minute-120 claim from telemetry.

## Q4. What must a new player learn, and when?

### Takeaway
The game has no tutorial. It shows a 15-line help panel for 9 seconds, then teaches by encounter. New things arrive one per wave until minute 2, where four land together.

### Cited findings
Times are from P1's run D, which matches the model. [K, E1]

| When (run D) | Wave | New thing | Source |
|---|---|---|---|
| 0:00 | intro | Help panel with 15 lines, auto-hides after 9 s | `scripts/ui/hud.gd:65-66, 696-703` |
| 0:00 | intro | Right-click move and attack, A-move, S, H, camera | README "Controls" |
| 0:00 | intro | Skill point at level 1, learn with Ctrl+QWER or gold + | `scripts/game/skills.gd:681-689` |
| 0:00 | intro | Space calls the wave early for gold | `scripts/game/director.gd:243-258` |
| 0:04 | 1.1 | Melee, ranged and hex mobs (opening roster of 3) | `scripts/data/chapter_defs.gd:30-31` |
| 0:29 | 1.2 | Full roster of 7 (web slow, vine root, Boar charge telegraph) | `scripts/data/mob_defs.gd:26-48` |
| 0:30-1:30 | 1.2-1.3 | Road fires get bashed by mobs within 300 px. Relight by holding the ring 5 s | `scripts/game/sim.gd:1115-1122`. P1's first fire went out at 1:26 |
| 0:38-1:02 | 1.2-1.3 | Ranks gated at levels 1/3/5/7 for QWE | `scripts/data/class_defs.gd:8-10` |
| 0:57 | 1.3 | First elite (Ogre King) and its telegraphed area move. Elites always drop a potion | `scripts/game/sim.gd:556-574` |
| ~1:00 | 1.3 | Potion belt (1-4) and the Alchemist at the Hearth (B) | `scripts/data/potion_defs.gd:1-5`. P1 first bought at 1:24 |
| 1:47 | 1.4 | The Horde, three surges | `scripts/game/director.gd:143-148` |
| 2:05-2:10 | 1.4 | Level 4, first talent row (T), 3 choices | `scripts/data/class_defs.gd:14` |
| 2:27 | 1.5 | Second elite (Broodmother) births spiders | README "Elites" |
| any time | 1.2+ | The dark, if both fires are out | `scripts/game/sim.gd:1225-1228` |
| 3:06 | 1.6 | First boss, phases at 70% and 35%, telegraphs, enrage at 150 s, regen until wounded | `scripts/data/mob_defs.gd:153-155`, README "Bosses" |
| ~3:45 | 1.6 | Level 6, ultimate R unlocks during the boss | `scripts/data/class_defs.gd:15` |
| 6:10 | camp 1 | Campfire (25 s), Town building with F, Alchemist anywhere, fires relit | `scripts/game/director.gd:13, 223-236` |
| 6:17 | 2.1 | Damage types and resists (ghost and skeleton shrug off swords, clamped to 0.6) | `scripts/data/mob_defs.gd:22-23, 52-57` |
| ~6:30 | 2.1 | Level 8, second talent row | `scripts/data/class_defs.gd:14` |
| ~12 min | 3.6 | Deep Wyrm puts out the lights in its last phase | README "The dark" |
| ~18 min | 4.1 | The dark for good, Hierophant ritual to break with 12% of its HP | `scripts/game/sim.gd:1125-1126`, README "Elites" |
| ~22 min | 5.1 | Level 23, last talent row was at 20 (around chapter 4 wave 4) | model |

Times after 6:30 come from the bot and the model, not from players.

Where several things land at once. [K, E1] on timing
- Minute 1:47 to 2:30. The Horde, the first talent menu, the first potions from the elite, the first fire going out and the second elite all arrive within 45 s. The talent menu opens over a live fight. The game pauses only for the Esc menu in solo (README "The menu").
- Minute 3 to 4. The first boss teaches telegraphs, phases and enrage while the ultimate unlocks mid-fight.
- Minute 6. The Town appears for the first time at the campfire, with 25 s to read nine building cards, shop and decide whether to skip.

### Inferences
- [I] The Town comes last but matters most late (Q2). A new player's first contact with it is a 25 s timer that rewards skipping with gold.
- [I] The 9 s help panel shows 15 lines before the first mob, so most of it will be missed.

### Gaps
- Telemetry does not record whether a player opened the help, the talent panel or a building card.

## Friction and fun at minute 5, 30 and 120

Minute 5 is the first game. Minute 30 is a few games in. Minute 120 is many games in. With a 24 to 27 minute full run and losses in chapter 1 at about 5 minutes, minute 30 likely means 2 to 5 runs, and minute 120 means reaching chapters 3 to 5.

### Minute 5 (first game, chapter 1 boss or first campfire)
Cited facts
- The ratio rises 1.00 to 1.27 across chapter 1, the only true mow. [K, E1]
- P1 lost the first real run at 4:47 to Mossback after the Broodmother wave drained the Hearth to 14.6%. [K, E1, n=1]
- Respawn is 6 s. Death costs little time, but the Hearth keeps taking hits while the hero is down. [K, E1]
- Four new systems arrive between 1:47 and 2:30 (Q4). [K, E1]
- A loss restarts from chapter 1. There is no meta-progression (CONTEXT.md). [K]

Inferences
- [I] Fun. Levels every 30-40 s, executes, multikill callouts and a rising ratio make chapter 1 feel strong.
- [I] Friction. The Broodmother wave and Mossback's boulder and log slam are where a new player loses, before seeing the Town at all. Losing at minute 5 means replaying the same 5 minutes.

### Minute 30 (a few games in, chapters 2 to 3)
Cited facts
- Chapter 2 starts 28% harder on the ratio and stays flat, 0.92 to 1.00. Chapter 3 starts 19% lower and falls to 0.71. [K, E1]
- Elite HP jumps 2-3x from chapter 2 to 3. Hits per average mob rise from 2.5 to 3.7. [K, E1]
- The Archer bot dies at the chapter 3 boss without the Town. [K, E1]
- Gold by the end of chapter 2 is about 1,860 solo. Nine buildings at level 1 cost 1,100. [K, E1]

Inferences
- [I] Fun. The Town becomes affordable and talent rows 2 and 3 arrive, so builds start to differ.
- [I] Friction. Each retry replays chapter 1 (5-6 minutes) where the ratio is above 1.0, which a returning player will find easy and slow. Chapter 3 is the first place the hero falls behind inside a chapter, with nothing in the game saying why.

### Minute 120 (many games in, chapters 4 and 5)
Cited facts
- The ratio sits at 0.57 to 0.66. Hero toughness slides to 0.71. [K, E1]
- Chapters 4 and 5 are always dark, and fires are gone for good. [K, E1]
- The Hearth stays at 6,500 while mob attack is 3.3x to 5.9x. [K, E1]
- Every non-building bot dies at the Hearth in chapter 5 with 13k to 25k unspent gold. The building Mage wins. [K, E1]
- A full run takes 24 to 27 minutes. [K, E1]

Inferences
- [I] Fun. Boss fights with phases and the dark are the set pieces. Maxed talents make a build visible.
- [I] Friction. A 25-minute run lost at minute 24 to a Hearth leak is the costliest failure in the game. The win condition shifts from "fight well" to "spend gold on the Town", and the game does not say so.

## Not instrumented yet (what a curve study would want)
- A run index per player and a first-session flag. Today you cannot tell a first game from a tenth without counting rows.
- Session funnel. Menu to start, retries per sitting, time between runs, quit reason (`quit` has no "why").
- Unspent skill points and talent rows over time, and time from talent unlock to pick.
- UI opens. Help panel, talent panel, Alchemist, building cards, with time open during a fight.
- Telegraph outcomes per boss and elite move (hit, dodged, cast while standing in it).
- Fire relight attempts and kindle progress (only lit, out and gone are logged as `road_fire`, `scripts/game/telemetry.gd:87`).
- Time spent in the dark per wave (only on and off is logged, `scripts/game/telemetry.gd:88-89`).
- Hearth damage by mob kind and lane (only totals per wave, `scripts/game/telemetry.gd:139-142`).
- Real time-to-kill per mob kind per wave, which would replace the ratio model.
- Input mode (touch or mouse) on the `plays` row. Platform says web or macOS only.
- A one-question difficulty or fun rating at game over.
- Gold held at each campfire end. It can be derived from `buy` and `build` but is not a field.

## Tuning knobs (as of b509a56)

| Constant | File:line | Current value |
|---|---|---|
| `HP_SCALE` | `scripts/data/chapter_defs.gd:21` | [1.0, 2.3, 4.6, 8.0, 13.0] |
| `ATK_SCALE` | `scripts/data/chapter_defs.gd:22` | [1.0, 1.6, 2.4, 3.3, 4.4] |
| `WAVE_STEP` | `scripts/data/chapter_defs.gd:24` | 0.07 |
| `WAVE_MORE` | `scripts/data/chapter_defs.gd:75` | 1.08 |
| `_base_count` | `scripts/data/chapter_defs.gd:84-88` | 14+8c, 22+12c, 18+10c, 40+30c, 28+16c |
| `wave_span` | `scripts/data/chapter_defs.gd:96-99` | 22, 28, 28, 26, 28, 0 s |
| `HP_MULT`, `ATK_MULT` (mobs) | `scripts/data/mob_defs.gd:17-18` | 3.2, 3.6 |
| `RESIST_MIN`, `RESIST_MAX` | `scripts/data/mob_defs.gd:22-23` | 0.6, 1.5 |
| `ELITE_HP`, `ELITE_ATK` | `scripts/game/sim.gd:28-29` | 4.5, 1.4 |
| Boss HP per extra player | `scripts/game/sim.gd:189` | +0.75 |
| `HEARTH_HP` | `scripts/game/sim.gd:23` | 6,500 |
| Hearth per extra player | `scripts/game/sim.gd:91` | +0.5 |
| Boss damage to Hearth | `scripts/game/sim.gd:1063` | 0.5x |
| `EXECUTE_BASE` | `scripts/game/sim.gd:27` | 0.08 |
| Mob gold | `scripts/game/sim.gd:197` | 1 + int(xp/4) |
| Gold per chapter | `scripts/game/sim.gd:277` | +0.7 per chapter |
| `RUSH_GOLD_PER_S` | `scripts/game/sim.gd:281` | 2.0 |
| Co-op gold share | `scripts/game/sim.gd:532` | 0.3 to non-killers |
| Level-up heal | `scripts/game/sim.gd:307` | 25% max HP |
| XP per chapter | `scripts/game/sim.gd:525` | 2.4 + 0.65c |
| Respawn | `scripts/game/sim.gd:378` | `heroRespawnS` + 1.5 x chapter |
| `heroRespawnS` | `Dota_2.json:112` | 6 |
| `waveGapS` | `Dota_2.json:110` | 12 |
| Armor formula | `scripts/game/sim.gd:322` | dmg / (1 + 0.06 armor) |
| `FIRE_HP` | `scripts/game/sim.gd:1117` | 1,400 x chapter ATK |
| `FIRE_ZONE`, `FIRE_NOTICE` | `scripts/game/sim.gd:1114-1115` | 210, 300 px |
| `FIRE_HEAL`, `FIRE_MEND` | `scripts/game/sim.gd:1120-1121` | 0.03, 0.03 per s |
| `KINDLE_S` | `scripts/game/sim.gd:1122` | 5 s |
| `dark_chapter()` | `scripts/game/sim.gd:1125-1126` | chapter 4 (index 3) |
| `INTRO_TIME` | `scripts/game/director.gd:12` | 5 s |
| `CAMP_TIME` | `scripts/game/director.gd:13` | 25 s |
| `CLEAR_SHARE`, `CLEAR_WAIT` | `scripts/game/director.gd:16-17` | 0.15, 35 s |
| `BOSS_ADDS_EVERY` | `scripts/game/director.gd:18` | 5 s |
| Pack size | `scripts/game/director.gd:126` | 3-8 + 2 x chapter |
| Horde surges | `scripts/game/director.gd:146-148` | 3, 9 s apart |
| Boss adds per corridor | `scripts/game/director.gd:199-200` | 3 + chapter at 0.8 HP |
| Campfire Hearth refill | `scripts/game/director.gd:227` | 0.5 of max |
| `DMG_GROWTH` | `scripts/game/hero_stats.gd:10` | 1.09 per level |
| `ASPD_PER_LEVEL` | `scripts/game/hero_stats.gd:11` | 0.015 |
| `ARMOR_PER_LEVEL` | `scripts/game/hero_stats.gd:12` | 0.3 |
| Base crit | `scripts/game/hero_stats.gd:37` | 0.08 |
| `xp_to_next` | `scripts/data/class_defs.gd:19` | 80 + 70L + 6L² |
| `MAX_LEVEL` | `scripts/data/class_defs.gd:13` | 30 |
| `TALENT_LEVELS` | `scripts/data/class_defs.gd:14` | 4, 8, 12, 16, 20 |
| `R_LEVELS` | `scripts/data/class_defs.gd:15` | 6, 11, 16 |
| Town `MAX`, `COST_GROWTH` | `scripts/data/town_defs.gd:14-16` | 5, 1.7 |
| Building base costs | `scripts/data/town_defs.gd:23-41` | 100 to 150 |
| Potion prices | `scripts/data/potion_defs.gd:9-26` | 40 (heal) to 320 (cataclysm) |
| Mob potion drop chance | `scripts/game/sim.gd:564` | 0.004 (elites and bosses 1.0) |
| Help panel time | `scripts/ui/hud.gd:66` | 9 s |

## Glossary additions
- Hero-vs-mob ratio. Hero damage multiplier over mob HP multiplier at a wave's start, both relative to chapter 1 wave 1 at level 1. Above 1.0 the hero is ahead of the starting balance.

## Sources
- Repo `kingsfoil-heartguard` at b509a56, files and lines as cited above, plus `README.md`.
- Bot runs made 2026-11-09 with `tests/sim_bot.tscn`, logs in the scratchpad `bot/` folder.
- Dashboard https://kingsfoil-hearthguard-dashboard.netlify.app (Supabase RPCs `dashboard_plays`, `dashboard_play`), fetched 2026-11-09, JSON in the scratchpad `dash/` folder.
