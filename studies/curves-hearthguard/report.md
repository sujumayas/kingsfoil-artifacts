# Hearthguard difficulty and learning curves: what made hero defense fun, and the minimum rules that recreate it

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is the first study in our Curves series. Each Curves study takes one Kingsfoil game and asks a narrow question. What made difficulty and learning feel good in older games that share this game's conditions, and what is the smallest set of rules that recreates that feeling here? Later studies will cover MatchRPG, SpeedRunner, Merge Arena and Asterion with the same method and the same words.

The method has six rules. We pick reference games by shared conditions, not genre, and say why. We trace where each pattern started and how later games changed it. We trust natural experiments most, a patch or new mode plus the reaction to it. We use theory only where it explains a case. We prefer the cheapest rule that five players can test. And we write down taste, as fun hypotheses and anti-patterns, so the next build can prove us wrong.

The readers are the Kingsfoil dev team and the collective of about five players who playtest every build. Most of what follows is a change they can try, tied to a constant in the repo and a way to check it.

"Curves" means three things here, and we keep them apart. The difficulty curve is the challenge the game presents over time. The power curve is the player's means over time (levels, talents, the Town). The learning curve is what the player can do and understand over time. Players feel none of these alone. They feel difficulty against power against skill, which the glossary calls felt difficulty.

Hearthguard in five lines:

1. A co-op hero defense in the Warcraft III Hero Defense line, with MOBA controls (right-click, QWER, A-move), live on the web [K, S2].
2. Each of 1-3 players holds one corridor to a shared Hearth. If the Hearth falls, the run ends and restarts from chapter 1 [K, S4].
3. Five chapters of six waves, with two plain waves, an elite, the Horde (three surges), another elite, and a world boss with adds. A 25 s campfire sits between chapters [K, S4].
4. Levels give QWER ranks, talents arrive at levels 4, 8, 12, 16 and 20, and a shared Town of nine buildings is the late-game power source [K, S4].
5. Road fires heal and keep "the dark" away; chapters 4 and 5 are always dark [K, S4].

This study does not cover enemy AI. Our earlier study, Enemy AI for a Hero Defense RTS, did that, and Hearthguard already uses its flow field, mob state machine, attack tokens, boss phases and a director that paces waves but never changes mob stats [K, S1]. We refer to it only where pacing and AI touch the curve.

The chart below places all 30 of Hearthguard's waves on the classic challenge vs skill plane. The horizontal axis is the hero's damage multiplier at the wave's start, and the vertical axis is the mob HP multiplier, both set to 1.0 at chapter 1 wave 1 for a solo Fighter. The shaded band is the flow channel, the zone between anxiety (too hard) and boredom (too easy) [V, E2, S6]. We draw it where the hero-vs-mob ratio sits between about 0.9 and 1.3, which is our reading, not a measured edge [I]. Chapter 1's waves climb through the band from ratio 1.00 to 1.27. Chapter 5's waves sit at 0.57 to 0.64, well toward anxiety [K, E1]. A planned spike outside the band can be good design, and the Horde wave is one on purpose [I]. A whole late run outside it is not.

@@FIG:flow@@

The tables behind this chart are in §4.

---

## 1. Executive summary

1. **The power sawtooth exists only in chapter 1.** The hero-vs-mob ratio climbs from 1.00 to 1.27 across chapter 1, then sits near 0.92 to 1.00 in chapter 2 and falls inside chapters 3 and 5. Across the whole run it slides from 1.0 to 0.6 [K, E1]. The cause is the XP curve, `80 + 70L + 6L²` (`scripts/data/class_defs.gd:19`), which gives a solo hero six levels in each of the first two chapters and four or five after; four levels buy 1.41x damage while `WAVE_STEP` adds 1.35x mob HP per chapter [K, E1]. Three changed constants bring back a rise inside every chapter in our model (§11) [I].

2. **Hearthguard is lost at the Hearth, not by the hero.** The Hearth stays at 6,500 HP solo (`scripts/game/sim.gd:23`) while mob attack grows 5.9x by chapter 5 wave 6, so a late leak costs about six times more than an early one [K, E1]. Every bot loss in our four runs was the Hearth falling in chapters 3 to 5 [K, E1, S4]. Diablo 3 fixed a similar wall by cutting monster damage 8% to 15% while raising trash HP [V, E2, S53].

3. **The cost of failure is the widest gap between Hearthguard and its twins.** A full bot run takes 24 to 27 minutes, and a loss restarts chapter 1 [K, E1]. In Siltbreaker, the closest MOBA-control twin, a wipe could cost "upwards of an hour", and Valve patched it down [V, E3, S75]. Retry budgets on the hardest beat were accepted in Path of Exile 2 and Nightreign [V, E2, S65, S66]. A campfire checkpoint would cut Hearthguard's worst case from about 24 minutes to about 6 [I].

4. **Co-op scaling runs the wrong way.** Each open corridor gets the full wave (`scripts/data/chapter_defs.gd`), but the Hearth grows only 50% per extra player (`sim.gd:91`), so a trio has 4,333 Hearth HP per corridor against 6,500 solo [K, E1]. The boss spawns in one random lane yet grows 75% per extra player (`sim.gd:189`) [K, E1]. The trio bot fell earlier than the solo bot [K, E1]. Twins scale focused HP sublinearly, Diablo 2 at `(n+1)/2` [V, E3, S87], and scale what each player must face by count [V, E3, S82].

5. **When the curve is off, move mob numbers, not hero numbers.** Cutting player power drew the worst reaction in our set of natural experiments. Helldivers 2 took about 3,000 negative Steam reviews in three days in August 2024 [V, E1, S60], and Path of Exile 2's recent reviews fell to 39% after 0.2.0 [V, E1, S63]. Helldivers 2's concurrents nearly tripled the day after its buff patch [V, E1, S61].

6. **The Town decides late runs, and nothing teaches it.** The Mage bot that builds wins solo; the Fighter bot that never builds dies at the last boss holding 15,027 gold [K, E1]. All nine buildings at level 5 cost 20,741 gold against about 15,800 a solo run earns [K, E1]. The one human player in our logs built nothing [K, E1, n=1].

7. **Minute 2 asks too much at once.** The Horde, the first talent menu, the first elite potion, the first fire going out and the second elite all arrive between 1:47 and 2:30 [K, E1]. The one player in our logs picked the first talent at 2:09 and 2:10, mid-Horde, in both long runs [K, E1, n=1]. Linehan et al. measured that good learning curves introduce each skill alone, in a simple setting, before combining it [V, E1, S14].

8. **Player-steered difficulty fits this game better than hidden adjustment.** In a 40-player study most people preferred choosing difficulty by hand [V, E1, S12]. In a co-op Minecraft study, 13 of 23 players hoped mob strength would not change mid-fight [V, E1, S20]. Hearthguard already has a clean player-steered dial, Space to call a wave early for 2 gold per second skipped [K, E1].

9. **Tune one middle mode, add a Casual band now, and leave the ladder for later.** Kingdom Rush shipped with enemy HP at 0.8, 1.0 and 1.2 per mode, and Kingdom Rush 6 still uses a few narrow bands, 70 to 110% [V, E3, S85, S84]. Each new top tier reaches fewer players; Aghanim's Labyrinth's Apex Mage had the fewest games of any tier [V, E1, S73]. Diablo 3 set Inferno on hardcore testers and had to cut it twice in five months [U, E2, S39].

10. **Five players can find large problems, not tune numbers.** Five users find about 85% of problems that hit 31% of players [V, E3, S25]. A 3-in-10 win rate has a 95% interval of 11% to 60% [I]. Pair per-wave metrics with the bot floor and act only on rules that hold in two sessions (§13).

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read, such as a paper, patch note, designer talk, wiki or article. "Excerpt" or "snippet" in the source list means only a search excerpt was read. |
| **[I]** | Inference or design proposal by the author or a researcher. Untested unless it says "model", and then tested only in our curve model, not the game. |
| **[U]** | Unverified or contested. A lead, a single repost, or sources that disagree. |
| **[K]** | Kingsfoil fact from the Hearthguard repo at main b509a56, our bot runs or the playtest dashboard. The text gives file:line. |

| Grade | Meaning |
|---|---|
| **E1** | Data or telemetry. Published numbers, stats sites, A/B results, our own play logs and bot runs. |
| **E2** | Designer statement. Postmortem, GDC talk, interview, the rationale in an official patch note. For papers, the authors' argument rather than their measured result. |
| **E3** | Community consensus. Wikis, large forum threads, review aggregates, press summaries. |
| **E4** | Anecdote. One post, one video, one review. |

Ratings on each pattern card are author judgement, 1 to 5, in this order:

- **Fun impact.** How much the pattern should change what players feel in Hearthguard.
- **Evidence.** How strong and how direct the evidence is that it worked elsewhere.
- **Cheapness.** How little code and tuning it costs. 5 is a one-line constant.
- **Fit.** How well it matches Hearthguard's conditions (lanes, fixed waves, short web sessions, 1-3 players).
- **Testability.** How easily five players and the bot can show whether it works.

[S#] points to §17, and file paths are relative to the Hearthguard repo. "Ratio" means the hero-vs-mob ratio, the hero's damage multiplier at a wave's start over the mob HP multiplier, both relative to chapter 1 wave 1 [K]. "n=1" marks a number from the one player in our logs.

---

## 3. Design intent and fun hypotheses

Hearthguard should feel like a power fantasy that keeps getting interrupted by real danger. Each chapter should end with the hero mowing through a crowd, and the next chapter's first wave should push back hard enough to matter. The Horde and the boss are the planned peaks. The campfire is the planned rest. A loss should teach something and cost minutes, not half an hour. These hypotheses turn that intent into claims the collective can check with the §13 protocol [I].

| # | Players should feel | When | Because of | How we test it |
|---|---|---|---|---|
| H1 | Relief and power, the horde melts | Last two waves of every chapter, around minutes 5, 11, 17, 22 and 26 | A1 power sawtooth | Kill rate per second in wave 5 vs wave 1, at least 1.2x in every chapter |
| H2 | A push-back, not a wall | First wave of chapters 2 to 5, from about minute 6 | A1, B1 | Hearth leak on wave 1 of each chapter between 5% and 15% of max; campfire difficulty item 4 or 5 of 7 |
| H3 | Tension that peaks and then lets go | The Horde (wave 4) and the 12 s gap after it | A2 build up, peak, relax | Deeper hero HP dip in wave 4 than waves 1-3; under 15% of mobs carried into wave 5 in chapters 3-5 |
| H4 | Fiero at the boss kill | Wave 6 of each chapter, first at about minute 4 to 6 | A3 boss peak band | Boss fight length inside 90-150 s for the median player; "best moment" answers name a boss |
| H5 | "I chose this" when calling waves early | Every wave gap from chapter 1 on | B3 player-steered pressure | Share of gaps called early, rising with run index |
| H6 | "One more try" after a late loss | The moment the Hearth falls in chapters 3 to 5 | C1 campfire checkpoint | "Retry chapter" pressed within 10 s and another attempt started in the same sitting |
| H7 | Hope during a bad leak, then a rescue | Any wave where the Hearth drops below 25% | C2 recoverable leak, C3 ember pool | Embers or stolen chunks won back; "my fault" answers outnumber "the game's" |
| H8 | Less Hearth pressure per person in a trio than solo | Chapter 3, about minutes 12 to 18 | D1 drained pool scaling | Hearth leak per corridor in trio vs solo, for humans and for the bot on the same seed |
| H9 | Competence in the first five minutes | Minute 2 (first Horde and first talent) | F1 introduce, practise, combine | Time from talent unlock to pick under 10 s; median attempts to clear chapter 1 at most 3 |
| H10 | Gold has a use, the Town matters | Second campfire, about minute 12 | B2 gold sink, F1 | Median unspent gold at campfire 2 below 1,000 |
| H11 | A first-time player sees chapter 3 | Minutes 12 to 18 of a first or second run | E1 difficulty bands | Furthest chapter on Casual vs Normal for players in their first two runs |

---

## 4. Our current build: minute 5, 30 and 120

Everything in this section comes from `01-current-build.md`, which read the repo at b509a56, ran four headless bot runs on 2026-11-09 and fetched the playtest dashboard the same day [K, S4, S3]. Code reads are E1 because they are the rules. The bot is E1 for a floor player; it never relights fires and does not dodge like a person [K]. The dashboard is E1 but holds one player. Facts and inferences are kept apart below. Minute 5 means a first game, minute 30 a few games in, and minute 120 many games in.

### Power ratio per wave

The formulas are listed in §11. Mob HP and attack scale by `HP_SCALE` [1.0, 2.3, 4.6, 8.0, 13.0] and `ATK_SCALE` [1.0, 1.6, 2.4, 3.3, 4.4] per chapter and by `1 + 0.07w` per wave (`scripts/data/chapter_defs.gd:20-24`); Fighter damage grows 9% per level (`scripts/game/hero_stats.gd:10, 31`); XP to the next level is `80 + 70L + 6L²` (`scripts/data/class_defs.gd:19`) [K, E1]. A wave ends at 15% of its mobs left or 35 s after its last spawn, so leftovers carry over (`scripts/game/director.gd:16-17`) [K, E1].

The model assumes one solo Fighter who kills everything, with no talents, no Town and no early calls [I]. It predicts levels 7, 13, 17 and 23 at the starts of chapters 2 to 5; the solo Fighter bot had 8, 13, 18 and 23 [K, E1].

| Chapter | W1 | W2 | W3 elite | W4 Horde | W5 elite | W6 boss | Rise inside |
|---|---|---|---|---|---|---|---|
| 1 | 1.00 | 0.93 | 1.02 | 1.11 | 1.19 | 1.27 | +27% |
| 2 | 0.92 | 0.96 | 0.90 | 0.93 | 0.97 | 1.00 | +9% |
| 3 | 0.81 | 0.75 | 0.71 | 0.73 | 0.75 | 0.71 | −12% |
| 4 | 0.65 | 0.65 | 0.61 | 0.63 | 0.64 | 0.66 | flat |
| 5 | 0.64 | 0.60 | 0.61 | 0.57 | 0.58 | 0.60 | −6% |

The drops at chapter starts shrink each time. The ratio falls 28% into chapter 2 (1.27 to 0.92), 19% into chapter 3 (1.00 to 0.81), 8% into chapter 4 (0.71 to 0.65) and 3% into chapter 5 (0.66 to 0.64) [K, E1]. Hero damage multipliers at chapter starts are 1.00, 2.13, 3.71, 5.17 and 8.31, and at the boss waves 1.71, 3.12, 4.39, 7.10 and 10.50 [K, E1]. Hits to kill an average mob rise from 1.8 to about 4.8 [K, E1].

The figure plots the 30 ratios against a target sawtooth of our own [I]. The target starts each chapter between 0.90 and 0.95 and climbs at least 15% by the boss, roughly what chapter 1 does today.

@@FIG:ratio@@

What we infer. The power curve is front-loaded [I]. From chapter 3 on, talents, ability ranks, the Town and the execute line (any hit under 8% HP kills, `sim.gd:27`) carry the player [I]. The ratio ignores cleave, splash, abilities and talents, so real time-to-kill needs telemetry [K].

### Mob counts per corridor

| Chapter | W1 | W2 | W3 elite | W4 Horde | W5 elite | W6 boss and adds |
|---|---|---|---|---|---|---|
| 1 | 15 | 24 | 19 + Ogre King | 43 | 30 + Broodmother | Mossback 8,000 HP + ~87 adds |
| 2 | 24 | 37 | 30 + Lich | 76 | 48 + Orc Warlord | Warden 16,000 HP + ~68 adds |
| 3 | 32 | 50 | 41 + Crystal Golem | 108 | 65 + Matriarch | Deep Wyrm 28,000 HP + ~70 adds |
| 4 | 41 | 63 | 52 + Hierophant | 140 | 82 + Shoggoth | Sleeper 42,000 HP + ~84 adds |
| 5 | 50 | 76 | 63 + Amdusias | 173 | 99 + Belial | Astaroth 60,000 HP + ~98 adds |

Counts are `round(base × 1.08)` with bases `14+8c`, `22+12c`, `18+10c`, `40+30c` and `28+16c` (`chapter_defs.gd:75-88`). Spans are 22 s for wave 1 and 28 s for waves 2, 3 and 5; the Horde comes as three surges 9 s apart (`director.gd:143-148`) [K, E1]. Boss adds come every 5 s, assuming a 150 s boss in chapter 1 and 75 to 90 s later [K, E1; I on the times]. Solo elite HP per corridor runs 2,627 and 2,580 in chapter 1, 4,908 and 7,631 in chapter 2, 15,103 and 14,414 in chapter 3, 26,266 and 33,915 in chapter 4, and 40,548 and 50,319 in chapter 5 (`scripts/data/mob_defs.gd:118-150`); the 2-3x jump into chapter 3 is the largest step in the game [K, E1].

The figure shows these counts with a player-count control. With 2 or 3 players every open corridor gets the same full wave [K, E1].

@@FIG:waves@@

What we infer. The Horde's surges, 14 mobs each in chapter 1 and about 58 in chapter 5, are the only spike inside a chapter that grows with the run [I].

### The Hearth's margin

The Hearth has 6,500 HP solo, `6,500 × (1 + 0.5 × (players − 1))` in general (`sim.gd:23, 91`) [K, E1]. A mob at the Hearth deals its full attack and a boss half (`sim.gd:1063`). The campfire returns half the Hearth (`director.gd:227`). The Quarry adds 12% per level [K, E1]. Mob attack multipliers by wave are:

| Chapter | W1 | W2 | W3 | W4 | W5 | W6 |
|---|---|---|---|---|---|---|
| 1 | 1.00 | 1.07 | 1.14 | 1.21 | 1.28 | 1.35 |
| 2 | 1.60 | 1.71 | 1.82 | 1.94 | 2.05 | 2.16 |
| 3 | 2.40 | 2.57 | 2.74 | 2.90 | 3.07 | 3.24 |
| 4 | 3.30 | 3.53 | 3.76 | 3.99 | 4.22 | 4.46 |
| 5 | 4.40 | 4.71 | 5.02 | 5.32 | 5.63 | 5.94 |

Divide the Hearth by that multiplier and you get its size in chapter 1 wave 1 hits. That margin is 6,500 at the start, 4,062 at chapter 2 wave 1, 2,708 at chapter 3, 1,970 at chapter 4, 1,477 at chapter 5 and 1,094 by chapter 5 wave 6 [I, arithmetic on K]. Hero toughness against mob attack slides more gently, from 1.00 to 0.71 [K, E1]. Road fire HP grows with the chapter's attack scale, 1,400, 2,240, 3,360, 4,620 and 6,160 (`sim.gd:1117, 1129-1130`) [K, E1].

The figure plots both lines, mob attack growth and the flat Hearth, and the margin between them.

@@FIG:hearth@@

### Gold, the Town and what goes unspent

Town buildings cost `base × 1.7^level`; a base of 100 gives 100, 170, 289, 491 and 835 per level, all nine at level 1 cost 1,100, and all nine at level 5 cost 20,741 (`scripts/data/town_defs.gd:14-16, 23-41`) [K, E1]. Cumulative solo gold at the end of each chapter is about 494, 1,859, 4,540, 8,862 and 15,842 [K, E1]. Calling a wave early pays 2 gold per second skipped times the chapter gold multiplier, so a full 12 s gap is worth 24, 41, 58, 74 and 91 gold by chapter and a full 25 s campfire 50 to 190 (`sim.gd:281-289`) [K, E1]. In co-op each hero earns about 1.6x solo gold in a trio, and the shared Town receives about 4.8x [K on the rules, I on the multipliers, which assume even kills].

The bots spent almost nothing unless told to build. The solo Fighter ended with 15,027 gold against the model's 15,842 [K, E1]. The trio bots held 21k to 25k each when the Hearth fell [K, E1]. The figure compares Town cost with cumulative income and shows the unspent gold.

@@FIG:gold@@

### What the bots show

Four runs, seed 7, a 60-minute cap, each solo run about 20 s of wall time [K, E1]:

| Run | Ends | Time | Chapter 2, 3, 4, 5 start | Deaths | Final level | Gold left |
|---|---|---|---|---|---|---|
| Fighter | Defeat at the chapter 5 boss, Hearth −413 | 1,622 s | 399, 766, 1,096, 1,404 s | 8 | 26 | 15,027 |
| Archer | Defeat at the chapter 3 boss, Hearth −8 | 973 s | 329, 663 s | 4 | 16 | 3,988 |
| Mage, building | Victory | 1,450 s | 318, 624, 936, 1,208 s | 0 | 27 | 13,322 after building |
| Trio (Fighter, Mage, Archer) | Defeat at chapter 5 wave 5, Hearth −8 of 13,000 | 1,559 s | 368, 683, 1,020, 1,345 s | 4, 10, 4 | 26 | 21k to 25k each |

- A full run takes 24 to 27 minutes, not 15. The solo Fighter's chapters took 399, 367, 330, 308 and 218+ s [K, E1].
- The building Mage reached chapter 5 with six buildings at level 4, three at level 3 and a Hearth max of 9,620 [K, E1].
- The trio fell earlier than the solo Fighter; three corridors leak into one Hearth that only doubles [K, E1].
- The bot never relights fires, and only seed 7 was run [K].

### What the dashboard shows

The dashboard holds 11 plays from one player, all on 2026-11-08 on build 0.2.0 [K, E1, n=1, S3]. Outcomes were 6 quits, 1 defeat, 1 disconnect and 3 closed tabs. Eight plays never left chapter 1 wave 1; only three lasted over a minute (86, 290 and 409 s); the furthest reached chapter 2 wave 2 [K, E1, n=1].

All 5 deaths came in chapter 1, to wave 2 mobs, the Ogre King's rock throw, the Broodmother wave (twice) and Mossback's boulder toss [K, E1, n=1]. In one run the Hearth lost 4,954 of 6,500 HP during the Broodmother wave, entered the boss at 14.6% and fell at 4:47 [K, E1, n=1]. In the other the Mossback fight took 184 s and 6 potions [K, E1, n=1]. The player called every wave early, bought potions from wave 3 on, and built nothing [K, E1, n=1].

What we infer. Chapter 1's elites are the first real check for a new player, and a 184 s boss at minute 4 of a first game is long [I]. One player is not a curve; every claim about minutes 30 and 120 below rests on the code and the bot [K].

### The learning timeline

Hearthguard has no tutorial. A 15-line help panel shows for 9 seconds (`scripts/ui/hud.gd:65-66`), then the game teaches by encounter [K, E1]. Times below come from the player's longest run, which matches the model; times after 6:30 come from the bot and the model [K, E1].

| When | Wave | New thing | Source |
|---|---|---|---|
| 0:00 | intro | Help panel, 15 lines, hides after 9 s; right-click, A-move, S, H, camera; first skill point; Space calls waves early | `hud.gd:65-66`, `director.gd:243-258` |
| 0:04 | 1.1 | Melee, ranged and hex mobs (opening roster of 3) | `chapter_defs.gd:30-31` |
| 0:29 | 1.2 | Full roster of 7 (web slow, vine root, boar charge telegraph) | `mob_defs.gd:26-48` |
| 0:30-1:30 | 1.2-1.3 | Road fires get bashed; relight by holding the ring 5 s; first fire out at 1:26 | `sim.gd:1115-1122` |
| 0:57 | 1.3 | First elite (Ogre King) and its telegraphed area move; elites drop a potion | `sim.gd:556-574` |
| ~1:00 | 1.3 | Potion belt and the Alchemist; first purchase at 1:24 | `potion_defs.gd:1-5` |
| 1:47 | 1.4 | The Horde, three surges | `director.gd:143-148` |
| 2:05-2:10 | 1.4 | Level 4, first talent row, three choices | `class_defs.gd:14` |
| 2:27 | 1.5 | Second elite (Broodmother) births spiders | README |
| 3:06 | 1.6 | First boss, with phases at 70% and 35%, telegraphs and enrage at 150 s | `mob_defs.gd:153-155` |
| ~3:45 | 1.6 | Level 6, the ultimate unlocks during the boss | `class_defs.gd:15` |
| 6:10 | camp 1 | Campfire (25 s), the Town for the first time, fires relit | `director.gd:13, 223-236` |
| 6:17 | 2.1 | Damage types and resists | `mob_defs.gd:22-23, 52-57` |
| ~6:30 | 2.1 | Level 8, second talent row | `class_defs.gd:14` |
| ~12 min | 3.6 | Deep Wyrm puts out the lights in its last phase | README |
| ~18 min | 4.1 | The dark for good; Hierophant ritual | `sim.gd:1125-1126` |
| ~22 min | 5.1 | Level 23; the last talent row came at 20, around chapter 4 wave 4 | model |

Three moments overload. Between 1:47 and 2:30 the Horde, the first talent menu, the first elite potion, the first fire going out and the second elite arrive within 45 s, and the talent menu opens over a live fight, since solo pauses only for the Esc menu [K, E1]. From minute 3 to 4 the first boss teaches telegraphs, phases and enrage while the ultimate unlocks mid-fight [K, E1]. At minute 6 the Town appears for the first time, with 25 s to read nine building cards and a gold reward for skipping [K, E1]. The figure lays these out on one timeline.

@@FIG:learning@@

What we infer. The Town comes last but matters most late, and a new player first meets it on a 25 s timer that pays for skipping [I]. The 9 s panel with 15 lines will be mostly missed [I].

### Minute 5: the first game

Facts. Chapter 1 is the only true mow, 1.00 to 1.27 [K, E1]. The one player lost the first real run at 4:47 [K, E1, n=1]. Respawn is 6 s plus 1.5 s per chapter (`sim.gd:378`), so death is cheap, but the Hearth keeps taking hits while the hero is down [K, E1]. A loss restarts chapter 1 and there is no meta-progression [K].

Inferred. Levels every 30 to 40 s, executes and multikill callouts should make chapter 1 feel strong [I]. The Broodmother wave and Mossback are where a new player loses, before seeing the Town, and a loss replays the same 5 minutes [I].

### Minute 30: a few games in

Minute 30 likely means 2 to 5 runs reaching chapters 2 and 3 [I]. Facts. Chapter 2's ratio stays flat at 0.92 to 1.00; chapter 3 starts at 0.81 and falls to 0.71 [K, E1]. Hits per average mob rise from 2.5 to 3.7 [K, E1]. The Archer bot dies at the chapter 3 boss [K, E1]. Gold by the end of chapter 2 is about 1,860 solo, against 1,100 for all nine buildings at level 1 [K, E1].

Inferred. The Town becomes affordable and talent rows 2 and 3 arrive, so builds start to differ [I]. Each retry replays 5-6 easy minutes of chapter 1 [I]. Chapter 3 is the first place the hero falls behind inside a chapter, and nothing says why [I].

### Minute 120: many games in

Facts. The ratio sits at 0.57 to 0.66 and hero toughness slides to 0.71 [K, E1]. Chapters 4 and 5 are always dark (`sim.gd:1125-1126`) [K, E1]. Every non-building bot dies at the Hearth in chapter 5 with 13k to 25k gold unspent [K, E1].

Inferred. Boss phases and the dark are the set pieces, and maxed talents make a build visible [I]. A run lost at minute 24 to a Hearth leak is the costliest failure in the game [I]. The win condition shifts from "fight well" to "spend gold on the Town", and the game does not say so [I].

### Not instrumented yet

The repo does not log a run index, quit reasons, time from talent unlock to pick, UI opens, telegraph outcomes, fire relight attempts, time in the dark, Hearth damage by lane and mob kind, real time-to-kill, input mode, a difficulty rating or gold held at each campfire [K, E1]. §13 closes these gaps.

---
## 5. Structural twins

We picked twins by six conditions, not by genre. Hearthguard is real-time with one hero per player and MOBA controls; a run of 5 chapters lasts 24 to 27 minutes; randomness is low (fixed waves and rosters, a fixed talent menu); failure is costly (the Hearth falls and the run restarts); play is solo or co-op for 1-3 players, each owning a lane with a shared loss; and it runs in a browser for short sessions [K]. No single twin matches all six [I]. The closest are the Warcraft III hero defense maps for input and social conditions, Kingdom Rush for platform and fixed waves, and Deep Rock Galactic and Aghanim's Labyrinth for co-op runs of the same length [I].

| Twin | Input | Session | Randomness | Cost of failure | Social | Platform | Why chosen |
|---|---|---|---|---|---|---|---|
| WC3 Hero Defense and X Hero Siege (2003-2019) | ● one hero, RTS controls | ◐ 45-90 min | ● fixed waves | ● base falls, run ends | ◐ 1-8 players, shared base | ○ LAN and Battle.net | The direct ancestor; host picks difficulty in the lobby |
| Aeon of Strife (c. 2001) | ● one hero per player, three lanes | ◐ length unknown | ● fixed creeps | ◐ loss rule unknown | ● four players vs bots | ○ StarCraft LAN | Earliest "heroes hold lanes against AI" |
| Wintermaul (c. 2003) | ○ builder, no hero | ◐ one long run | ● fixed waves | ● shared team lives | ● each player owns a lane, shared lives | ○ LAN and Battle.net | Own lane, shared loss, the Hearth's direct model |
| Green TD and Element TD line (2006-2020) | ○ builder | ○ about 60 waves | ● fixed waves | ● lives run out | ◐ solo or race | ○ LAN and Battle.net | Lobby modes, interest, boss every 10 waves, weighted leaks |
| Gauntlet (1985) | ● one hero each, real-time | ◐ endless while coins last | ● fixed mazes | ○ a coin buys health back | ◐ co-op 1-4 on one screen | ◐ arcade, short | Root of co-op horde play and health as a clock |
| Kingdom Rush 1 to 6 (2011-2025) | ◐ towers plus one hero | ● 10-20 min a stage | ● hand-made waves | ◐ stage restart, no run | ○ solo | ● browser, then mobile | Difficulty bands, stars, post-clear challenges |
| Orcs Must Die 2 and Deathtrap (2012, 2025) | ◐ hero plus traps | ◐ 10-20 min a level | ◐ fixed waves, Deathtrap adds random picks | ● rift points work like a shared Hearth | ● co-op 2 to 4 | ○ PC and console | Lane defense with a hero; designers dropped a capped grade and said why |
| Dungeon Defenders 1 and 2 (2011, 2014) | ◐ hero plus towers | ● 15-30 min a map | ● fixed waves | ◐ map restart | ● co-op 1-4 | ◐ PC, console, early mobile | A per-player HP scaling cut |
| Dota 2 Siltbreaker (2017) | ● Dota MOBA controls | ○ multi-hour campaign | ● fixed acts | ● a wipe resets the act | ● co-op 4 | ○ PC | Same controls; a launch backlash over the cost of failure |
| Dota 2 Aghanim's Labyrinth (2020) | ● Dota MOBA controls | ● about 30-60 min a run | ◐ random rooms and picks | ● run ends on a wipe | ● co-op 4 | ○ PC | Co-op run with five named tiers and a curve-matching patch |
| Vampire Survivors (2021-2022) | ◐ movement only, auto attack | ● 15, 20 or 30 min cap | ○ random level-up draft | ● run ends | ◐ local co-op added later | ● browser origin, mobile | The mow power curve, Curse, a fixed finish line |
| Diablo 2 and Diablo 3 (2000, 2012) | ● click to move, hero skills | ○ open-ended | ◐ random maps and drops | ○ corpse run | ● co-op up to 4 or 8 | ○ PC | The per-player HP formulas and the Inferno story |
| Deep Rock Galactic (2020) | ○ first-person shooter | ● 20-40 min a mission | ◐ random caves, fixed mission types | ● mission fails | ● co-op 1-4, solo drone | ○ PC and console | Published per-player tables split by count, toughness and damage |
| Helldivers 2 (2024) | ○ third-person shooter | ● 15-40 min a mission | ◐ procedural maps | ◐ mission fails, little lost | ● co-op 1-4 | ○ PC and console | Ten tiers with reward multipliers; the clearest power-cut experiment |
| Left 4 Dead line (2008, Back 4 Blood 2021) | ○ first-person shooter | ● 30-60 min a campaign act | ◐ director and card spawns | ● run ends | ● co-op 4 | ○ PC and console | Build up, peak, relax; a tier-gap patch |

The WC3 maps and the Dota 2 events match the input and social conditions but not the platform; Kingdom Rush and Vampire Survivors match the platform and session but not the social condition [I]. Hearthguard is a hero defense with a tower defense's loss rule, so it borrows tuning from both [I]. The fixed-content twins tune difficulty with selectable bands, while the random-content runs (Vampire Survivors, Aghanim's Labyrinth) use a clock or player picks [I]. Hearthguard is fixed content, so the first family's tools fit without change [I].

We pruned several candidates. Footman Frenzy, Survival Chaos, Castle Fight, Island Defense, Troll and Elves and DotA Allstars are PvP, so their difficulty is the other team and there is no authored curve; DotA stays only as the source of the control scheme [V, E3, S98; I]. StarCraft tower defense maps are builders with no hero [I]. Sanctum and Gauntlet Legends had no scaling data, and Dota 2 Overthrow and Custom Hero Chaos are PvP [I]. Risk of Rain is too random to be a twin and stays a lineage source for difficulty over time [I]. Vermintide 2, Monster Hunter, Nightreign and Path of Exile 2 supply natural experiments in §9, and Legion TD and It Takes Two supply co-op mechanics in §7 [I].

---

## 6. Lineage: a timeline

Most of Hearthguard's curve tools are older than it looks. The lobby difficulty pick, the lives budget, the boss every N waves and the self-called wave all date from the Warcraft III custom-map era. The director and the theory came next, then the opt-in ladders, then a run of live-service patches that tested what players accept. Four generations, 1985 to 2026.

**Gen 1: Arcade halls and custom maps (1985-2003)**
- **1985** Gauntlet drains health about 1 point per second and sells 700 health per coin, the first drain clock [V, E3, S99].
- **2000** Diablo 2 scales monster HP linearly with player count, `X × n` [V, E3, S87].
- **2001** Aeon of Strife puts four heroes against bots in three lanes on StarCraft, dated late 2001 to early 2002 [V, E3, S97].
- **2003** Diablo 2 patch 1.10 moves to `(n+1)/2` HP per player, the rule that became standard [V, E3, S87].
- **2003** Wintermaul gives each player a lane where every leak costs the whole team a life [V, E2, S95].

**Gen 2: Directors, stars and a vocabulary (2004-2013)**
- **2004** MDA names eight aesthetics and the mechanics to dynamics to aesthetics chain [V, E2, S8].
- **2004** Hunicke and Chapman's Hamlet adjusts health and ammo supply when a player keeps falling short [V, E2, S9].
- **2007** Cook defines the skill atom and the skill chain [V, E2, S13].
- **2008** Left 4 Dead ships the AI director and its build up, peak, relax cycle [V, E2, S11].
- **2008** Defense Grid lets aliens carry a core back down the path, so a leak can be undone [V, E2, S42].
- **2009** Juul publishes his punishment types and finds players rate a game higher when they fail some first [V, E1, S7].
- **2011** Kingdom Rush ships three difficulty bands as enemy HP at 0.8, 1.0 and 1.2 [V, E3, S85].
- **Jun 2012** Diablo 3 patch 1.0.3 cuts Inferno and removes per-player monster damage in groups [V, E2, S51].
- **Oct 2012** Diablo 3 patch 1.0.5 adds Monster Power 1-10, a player-chosen dial [V, E2, S54].
- **2013** Diablo 3 patch 1.0.8 cuts per-player monster HP to 50% [V, E2, S55].

**Gen 3: Opt-in ladders and measured learning (2014-2021)**
- **2014** Linehan et al. measure introduce, practise, combine in four puzzle games [V, E1, S14].
- **Feb 2014** Diablo 3's Loot 2.0 replaces fixed tiers with Torment levels that any character can pick [V, E3, S56].
- **2016** Klarkowski et al. find overload beats boredom but loses to balance in Left 4 Dead 2 [V, E1, S22].
- **Jun 2017** Siltbreaker launches with hour-long attempts and no checkpoint restart [V, E3, S75].
- **2017** Xue et al. at EA raise rounds played 4.4% to 7.9% with an invisible difficulty lever [V, E1, S19].
- **Jan 2018** Celeste ships Assist Mode, renamed from "Cheat Mode" [V, E2, S33].
- **2019** Giovannetti says Slay the Spire balanced on base difficulty, with 20 ascension levels on top [V, E2, S36].
- **2020** Deep Rock Galactic publishes hazard tables that split count, toughness and damage by player count [V, E3, S82].
- **2020** Hades God Mode starts at 20% damage resistance and adds 2% per death to a cap of 80% [V, E2, S34].
- **Jul 2020** Valve slows early-act growth on Aghanim's Labyrinth's harder tiers [V, E2, S49].
- **Dec 2021** Back 4 Blood update 1.04 closes the gaps between its difficulty tiers [V, E2, S70].

**Gen 4: Live corrections and our build (2022-2026)**
- **Jul 2022** Vampire Survivors counts a Reaper kill before 31:00 as a full clear [V, E3, S90].
- **Jul 2023** Diablo 4 patch 1.1.0 cuts player power and triggers review bombing [V, E3, S57].
- **Aug 2024** Helldivers 2 adds difficulty 10 while nerfing weapons and takes about 3,000 negative reviews in three days [V, E1, S60].
- **Aug 2024** Orcs Must Die! Deathtrap drops the 5-skull grade because it "became binary" [V, E2, S44].
- **Sep 2024** Helldivers 2's buff patch nearly triples concurrent players the next day [V, E1, S61].
- **Oct 2024** Diablo 4 opens its lower tiers and gates Torment behind Pit clears [V, E3, S59].
- **Apr 2025** Path of Exile 2 nerfs players and buffs enemies at once, and recent reviews fall to 39% [V, E1, S63].
- **Jun 2025** Elden Ring Nightreign gives solo players one automatic revive per night boss [V, E2, S66].
- **Sep 2025** Orcs Must Die! Deathtrap's Endurance starts at difficulty 10 and ends at wave 25 [V, E2, S45].
- **Nov 2026** Hearthguard build 0.2.0 runs 24-27 minutes with the sawtooth only in chapter 1 [K, E1].

---

## 7. Pattern cards

Fifteen cards in six families, merged from about 45 candidate cards across the research notes. Each card gives the minimal rule, the evidence with grades, the cost (S, M or L) and the exact Hearthguard constant to change. Where a pattern touches a figure, the figure sits right after its card.

- **A.** Pacing and the chapter sawtooth
- **B.** Power and economy
- **C.** Failure and retry
- **D.** Co-op scaling
- **E.** Choosing difficulty
- **F.** Learning and measurement

### Family A: Pacing and the chapter sawtooth

### A1. Chapter sawtooth that ends in a mow

*Lineage.* Where's My Water? level sets that ease off at each new set (described in 2012) → WC3 maps with a boss every N waves → Linehan et al. measure introduce, practise, combine (2014) → Vampire Survivors builds a whole run on the mow (2022) → Helldivers 2 raises player power to restore it (2024). Each step treats relief as part of the curve, not a balance error.

*Feeling.* Mastery, then a power fantasy. Each chapter ends with the hero mowing a crowd, and the next chapter's first wave pushes back.

*Mechanism.* Pick a target ratio per wave and tune mob scaling and hero growth to hit it. The set is the chapter.

```
ratio(c, w) = hero_dmg_mult(level at wave start) / (HP_SCALE[c] × (1 + WAVE_STEP × w))
target:  ratio(c, 1) in 0.90..0.95      # push-back at each chapter start
         ratio(c, 6) ≥ 1.15 × ratio(c, 1)   # mow by the boss
rule:    levels gained per chapter must buy more damage than (1 + WAVE_STEP)^5 adds HP
```

*Works when / breaks when.* Works when the player's power comes from levels inside the run, as in Hearthguard. Breaks when XP cost grows faster than XP income, so later chapters give fewer levels, which is what `6L²` does today. Breaks the other way when the mow lasts so long that the peak disappears (see A3).

*Evidence.* Hearthguard's ratio rises 27% inside chapter 1, 9% inside chapter 2, and falls inside chapters 3 and 5 [K, E1, S4]. Linehan et al. coded Portal, Portal 2, Braid and Lemmings and found complexity rises after each new skill until the next one resets it [V, E1, S14]. A practitioner describes Where's My Water? as a sawtooth [V, E4, S107]. Helldivers 2's buff patch nearly tripled concurrents the next day [V, E1, S61].

*Cost and knobs.* S. Three constants: `WAVE_STEP`, `HP_SCALE` and the quadratic term of `xp_to_next`. `DMG_GROWTH` is a fourth, riskier knob (see B1).

*In Hearthguard.* Change `xp_to_next` from `80 + 70L + 6L²` to `80 + 70L + 3L²` (`scripts/data/class_defs.gd:19`), `WAVE_STEP` from 0.07 to 0.03 (`scripts/data/chapter_defs.gd:24`) and `HP_SCALE` from [1.0, 2.3, 4.6, 8.0, 13.0] to [1.0, 2.5, 4.3, 7.1, 11.3] (`chapter_defs.gd:21`). In our curve model this gives chapter rises of +49%, +26%, +12%, +20% and +18%, with each later chapter starting near 0.92 to 0.94 [I, model]. Lowering `WAVE_STEP` also slows mob attack inside each chapter, which helps the Hearth. Check talents and abilities with the bot before trusting the model.

*Ratings 1–5 (author judgement):* Fun impact 5 · Evidence 4 · Cheapness 4 · Fit 5 · Testability 5

### A2. Build up, peak, relax

*Lineage.* Counter-Strike's spiky pacing → Left 4 Dead's AI director (2008, described by Booth in 2009) → Evolve's "peaks and valleys" → Klarkowski et al. (2016) show what happens when the relax phase is removed. The director changes when threats arrive, never their stats.

*Feeling.* Tension that releases before it tires.

*Mechanism.* Booth's four states, per player.

```
intensity += damage_taken, incapacitation, nearby kills (decays when nothing engages)
Build Up     full threat until intensity > peak
Sustain Peak hold full threat 3-5 s
Peak Fade    minimal threat until intensity decays
Relax        minimal threat 30-45 s, then Build Up
```

For fixed waves, keep the script and protect the relax. No wave starts with more than `CLEAR_SHARE` of the last wave's mobs still alive.

*Works when / breaks when.* Works when threat can be withheld. Breaks for beats that must happen on time; Booth exempts bosses. Breaks when late chapters grow spawns and add the dark so the gap never empties, which is Klarkowski's overload condition.

*Evidence.* Booth's states and timings come from his 2009 talk, where he calls "constant, unchanging combat" fatiguing [V, E2, S11]. Klarkowski et al. (n=45) found the balanced director condition best and overload more enjoyable than boredom; overload also removed the "cooldown spots" for healing [V, E1, S22]. Hearthguard's director paces without touching stats [K, S1].

*Cost and knobs.* M for a true intensity director, S for the fixed-script version. Knobs: wave gap (`waveGapS` 12 s), Horde surge spacing (9 s), `CLEAR_SHARE` 0.15 and `CLEAR_WAIT` 35 s, campfire length 25 s.

*In Hearthguard.* Waves 1-2 are build up, the Horde's three surges 9 s apart are the sustained peak, the 12 s gap is a short fade (`waveGapS`, `Dota_2.json:110`), and the 25 s campfire is a long relax (`CAMP_TIME`, `scripts/game/director.gd:13`) [K]. Booth's relax is 30-45 s; ours is 12 s inside a chapter [K, I]. If `mobs_carried` at `wave_start` exceeds 15% in chapters 3-5, lengthen `waveGapS` there or lower `CLEAR_SHARE` (`director.gd:16`).

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 4 · Cheapness 3 · Fit 4 · Testability 4

### A3. Boss peak with a floor and a ceiling

*Lineage.* WC3 tower defense tutorials (a boss every 10 levels) → Element TD → Hero Survival Omega (bosses at waves 6, 12, 18, 24) → Monster Hunter Wilds (2025), where fights ended too fast. A peak needs a length band, not only a size.

*Feeling.* Fiero. The set's top, framed by a rest.

*Mechanism.* Boss every N waves with a separate scale table, plus a target duration band.

```
boss_hp(c, n) = BOSS_BASE[c] × party_factor(n)   # not chapter HP_SCALE
target: t_min ≤ median boss time ≤ t_enrage
if median < t_min: raise BOSS_BASE[c] or adds
if median > t_enrage for most players: lower BOSS_BASE[c]
```

*Works when / breaks when.* Works when a relief beat follows (the campfire). Breaks when bosses share the trash multiplier and outgrow the power curve, or when they melt before their phases show.

*Evidence.* The tutorial rule of a boss every 10 levels with higher armor is community practice [V, E3, S94]. Hero Survival Omega places bosses at 6, 12, 18 and 24 [V, E2, S96]. Monster Hunter Wilds monsters died in under 10 minutes at launch; Capcom raised HP and added harder tiers, and players praised longer hunts [V, E2, S72]. Booth exempts bosses from adaptive pacing because they "change up the pacing anyhow" [V, E2, S11].

*Cost and knobs.* S. Knobs: boss base HP per chapter, the enrage timer, add cadence `BOSS_ADDS_EVERY` 5 s.

*In Hearthguard.* Bosses already ignore chapter scaling: 8,000, 16,000, 28,000, 42,000 and 60,000 HP (`scripts/data/mob_defs.gd:153-155`), with enrage at 150 s [K]. The one human Mossback fight took 184 s at minute 4 [K, E1, n=1]. Set a band of 90-150 s from `wave_end.dur_s` and tune `BOSS_BASE` per chapter against it, starting with chapter 1, where 184 s at minute 4 is long [I].

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 3 · Cheapness 4 · Fit 4 · Testability 4

### Family B: Power and economy

### B1. Mob-side correction, one side at a time

*Lineage.* Diablo 3 1.0.4 (2012) cuts monster damage and quadruples drops → Diablo 4 1.1.1 (2023) answers a failed player nerf with density and loot → Helldivers 2 (2024) lowers enemy HP instead of nerfing → Path of Exile 2 0.2.0 (2025) moves both sides and overshoots.

*Feeling.* Mastery kept. Tension tuned without the sense of loss.

*Mechanism.* When felt difficulty is off, move mob numbers. Leave hero numbers alone unless one option dominates, and then buff the alternatives. Change one side of the ratio per build. Cap burst.

```
fix order:  mob ATK or count  >  mob HP  >  hero numbers
per build:  change hero side OR mob side, never both
burst cap:  max single hit ≤ k × max HP (hero or Hearth), recover challenge with HP or count
```

*Works when / breaks when.* Works when players own their power through levels and talents. Breaks when one hero option makes everything trivial; then a targeted nerf is honest.

*Evidence.* Diablo 3 1.0.4 cut Inferno damage 8% to 15% in Acts II-IV, raised normal HP 4% to 10% and made normal monsters drop magic and rare items about 4x more [V, E2, S53]. Diablo 4 1.1.0 cut Vulnerable damage about 65%, drew review bombing, and the developers said they would not "patch like this ever again" [V, E2, S57]. Path of Exile 2's director said nerfs and enemy buffs "both went way too far" [V, E2, S63]. Players accepted more mobs when the mow returned in Diablo 4 1.1.1 [V, E2, S58].

*Cost and knobs.* S. Knobs: `ATK_SCALE`, `HEARTH_HP` per chapter, `HP_SCALE`, a per-hit cap.

*In Hearthguard.* The chapter 3-5 Hearth losses are a damage-side wall. Grow the Hearth with the chapter instead of touching `DMG_GROWTH` (1.09, `scripts/game/hero_stats.gd:10`). The rule `HEARTH_HP × (1 + 0.5 × (c − 1))` gives 6,500, 9,750, 13,000, 16,250 and 19,500 solo (`scripts/game/sim.gd:23`) [I]. With A1's `WAVE_STEP` of 0.03, the Hearth's margin in chapter 1 wave 1 hits stays between 6,500 and 3,854 across the run instead of falling to 1,094 [I, arithmetic]. Use the death records' last 6 s of hits to flag any single hit above 25% of hero HP [K, I].

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 4 · Cheapness 5 · Fit 5 · Testability 4

### B2. A gold sink that buys survival

*Lineage.* Green TD Solo pays interest on banked gold, which rewards hoarding → WC3 tavern revives for gold → Dota 2 buyback → Risk of Rain 2 raises chest costs with player count. Where players already hoard, turn gold into survival.

*Feeling.* Expression and relief. Gold becomes a decision with a visible payoff.

*Mechanism.* At each campfire, offer one-tap options that convert gold into safety, priced to the chapter. Never pay interest.

```
hearth_repair(c) = repair 10% of Hearth max for P × (1 + 0.7c) gold
buyback(hero)    = instant respawn for 100 + gold_held / 13
town_cost(b, lv, n) = base_b × 1.7^lv × (1 + 0.5(n − 1))   # co-op
```

*Works when / breaks when.* Works when gold piles up unspent. Breaks if the sink beats the Town, so the Town must stay the better buy over a chapter.

*Evidence.* Every non-building bot dies with 13k to 25k gold unspent; the building Mage wins [K, E1, S4]. Green TD Solo pays 5% of current gold per level survived and says saving "is a must" [V, E2, S93]. Dota 2's buyback formula is `100 + net worth / 13` [V, E3, S102]. Risk of Rain 2 scales chest costs with its player factor [V, E3, S83].

*Cost and knobs.* M. Knobs: repair price `P`, repair share, buyback divisor, Town cost per player.

*In Hearthguard.* The campfire (`scripts/game/director.gd:223-236`) already offers the Town and the Alchemist [K]. Add a Hearth repair button priced from `sim.gd:277`'s chapter gold multiplier, and a buyback that ends the respawn timer (`sim.gd:378`). For co-op, add `(1 + 0.5(n − 1))` to Town costs in `scripts/data/town_defs.gd:14-16`, since a trio's shared income is about 4.8x solo [K, I].

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 2 · Cheapness 4 · Fit 5 · Testability 4

### B3. Player-steered pressure

*Lineage.* Green TD Solo's self-called waves with a bonus → Chen's flOw and "embed choices into the gameplay" (2006) → Risk of Rain's timer, where looting costs difficulty (2013) → Vampire Survivors' Curse (2022). The player buys reward with pressure, inside play.

*Feeling.* Autonomy. "I chose this."

*Mechanism.* A frequent in-play choice that trades safety for reward, visible and legible.

```
early_call_gold = RUSH_GOLD_PER_S × seconds_skipped × (1 + 0.7c)
curse:  +x% mob count or spawn rate  ↔  +y% gold or XP   (player opt-in, shown on the HUD)
```

*Works when / breaks when.* Works when the trade is legible and repeated every wave. Breaks when one option always dominates, or when the pressure is hidden, which makes it rubber banding.

*Evidence.* Chen argues for difficulty choice embedded in play rather than system DDA [V, E2, S6]. In a 40-player study most participants preferred choosing difficulty by hand [V, E1, S12]. Morse says hunting every item in Risk of Rain "will cost you in time and enemy difficulty" [V, E2, S41]. Vampire Survivors' Curse raises enemy HP, speed, spawn rate and count by its percentage [V, E3, S89]. Green TD Solo pays the first player to spawn a level the survival bonus [V, E2, S93].

*Cost and knobs.* S. Knobs: `RUSH_GOLD_PER_S` 2.0, an optional curse percentage per talent or building.

*In Hearthguard.* Space already pays 2 gold per second skipped (`scripts/game/sim.gd:281`) [K]. The one player called every wave early [K, E1, n=1]. The trade only matters once gold matters, so pair it with B2. A later Town building or talent that adds +10% mob count for more gold would extend it without hidden DDA [I].

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 3 · Cheapness 4 · Fit 4 · Testability 4

### Family C: Failure and retry

### C1. Campfire checkpoint

*Lineage.* Arcade continues → Kingdom Rush per-stage retries → It Takes Two's close checkpoints → Hades' mid-run suspend → Cuerdo et al. (2021). Long runs on short sessions need a place to stop and a place to restart.

*Feeling.* "One more try" instead of "not again".

*Mechanism.* Snapshot the sim at each campfire. On a Hearth loss, offer "retry chapter c" or "new run". Cap the retries or mark the run.

```
on campfire_start(c): save snapshot(c)
on hearth_fall(c):    offer retry(c) if retries_left > 0, else new_run
minutes_lost ≈ time since snapshot  (5-6.5 min) instead of whole run (24-27 min)
```

*Works when / breaks when.* Works when chapters are self-contained, as Hearthguard's are. Breaks the run's tension if retries are free and unlimited; cap at 1-2 per run or mark the run "assisted" on the results screen.

*Evidence.* Siltbreaker's lack of a checkpoint restart meant a wipe could cost "upwards of an hour", and Valve loosened the campaign after launch [V, E3, S75, S76]. Cuerdo et al. (n=72) found the respawn point changed experience, with checkpoints lower on autonomy and curiosity than savepoints or level restart [V, E1, S23]. Juul suggests casual games appeal by sparing setback punishment more than energy punishment [V, E2, S7]. Median mobile sessions run 5-6 minutes, vendor-reported [V, E1, S105].

*Cost and knobs.* M. Knobs: retries per run, what a retry costs (for example the chapter's Town purchases), whether a closed tab resumes.

*In Hearthguard.* Save at `campfire_start` in `scripts/game/director.gd:223-236`. A Hearth fall at minute 24 then costs about 6 minutes, one chapter, instead of 24 [I]. The solo Fighter bot's chapters took 399, 367, 330, 308 and 218+ s, so the worst case after this change is about 6.7 minutes [K, I]. Whether the sim can serialise for this is unverified; it may reuse net sync code [I].

*Ratings 1–5 (author judgement):* Fun impact 5 · Evidence 3 · Cheapness 3 · Fit 5 · Testability 4

### C2. Recoverable leak

*Lineage.* Defense Grid: The Awakening (2008), where aliens carry a core back down the path and a kill returns it → Legion TD's leak-catching fighters. A loss at the goal becomes a chase.

*Feeling.* Tension, then relief. Graded pride in what you kept.

*Mechanism.* A mob that reaches the Hearth steals a chunk and walks it back toward its spawn. Kill it before it leaves and the chunk returns.

```
on mob_reaches_hearth(m):  ember = min(E_CHUNK × hearth_max, hearth_hp); hearth_hp -= ember
                            m.carrying = ember; m.target = corridor_spawn
on carrier_killed(m):       hearth_hp += m.carrying
on carrier_escapes(m):      ember is lost
```

*Works when / breaks when.* Works when the path back is long enough to react. Breaks when the carrier is too fast or hidden, or when it lets a strong player farm returns.

*Evidence.* Michael Austin described cores carried back as "a second chance" that gave "a wide range of challenge within a single map" [V, E2, S42]. Legion TD 2 lets fighters from cleared lanes teleport to the shared King to kill allied leaks [V, E3, S100].

*Cost and knobs.* M. Knobs: chunk size (try 5% of Hearth max, 325 HP solo), carrier speed, which mob kinds carry, whether bosses carry.

*In Hearthguard.* Today a mob at the Hearth deals its full attack and a boss half (`scripts/game/sim.gd:1063`) [K]. Swap that for the steal rule on non-boss mobs. In the one human run that lost to the Hearth, the Broodmother wave took 4,954 of 6,500 Hearth HP [K, E1, n=1]; with carried chunks part of that becomes a chase in the 12 s gap [I].

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 2 · Cheapness 3 · Fit 4 · Testability 4

### C3. Ember pool, a retry budget sized by the party

*Lineage.* Arcade continues → Kingdom Rush stage lives → Helldivers 2 reinforcements, 5 per player with a trickle → Path of Exile 2 gives its pinnacle boss 6 attempts (2025) → Nightreign's solo revive per night boss (2025). Lower the cost of failure on the hardest beat without touching stats.

*Feeling.* Tension with a safety net. "One more ember" drama.

*Mechanism.* Each player brings one ember. When the Hearth hits 0, spend an ember, the Hearth returns to 25% and the wave continues. The run ends at 0 embers.

```
embers = EMBERS_PER_PLAYER × n          # 1 solo, 3 trio
on hearth_zero: if embers > 0: embers -= 1; hearth_hp = 0.25 × hearth_max
                else: game_over
optional: +1 ember at a campfire, capped at the starting count
```

*Works when / breaks when.* Works when the loss is a shared resource. Breaks if embers are so many that the Hearth stops mattering, or if they apply everywhere and remove tension.

*Evidence.* Helldivers 2 gives 5 reinforcements per player per mission, capped at 20 for four, then one every 2:00 [V, E3, S92]. Path of Exile 2 0.1.1 gave the Arbiter of Ash 6 respawn attempts instead of one life [V, E2, S65]. Nightreign 1.01.1 added one automatic solo revive per night boss on Days 1-2, and press called solo "viable" [V, E2, S66].

*Cost and knobs.* S. Knobs: embers per player, Hearth share restored, campfire refill.

*In Hearthguard.* Hook the Hearth's death check in `scripts/game/sim.gd` near `HEARTH_HP` (`sim.gd:23`). The trio bot lost with the Hearth 8 HP short of 13,000 lost at chapter 5 wave 5, and the Archer bot 8 HP short at the chapter 3 boss [K, E1]. One ember would have carried both runs to the next campfire [I].

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 3 · Cheapness 4 · Fit 4 · Testability 4

### Family D: Co-op scaling

### D1. Scale the drained pool linearly, the focused enemy sublinearly

*Lineage.* Diablo 2 `X × n` (2000) → Diablo 2 1.10 `(n+1)/2` (2003) → Diablo 3 +75% per player, cut to +50% in 1.0.8 (2012-2013) → Dungeon Defenders II +50% cut to +25% (2014) → Deep Rock Galactic scales count, not normal-enemy HP (2020). Focused HP shared by many players should cost less than solo; threats each player must face should grow per player.

*Feeling.* Fellowship. A second player makes the run feel louder and safer, not longer.

*Mechanism.*

```
hearth(n)   = 6,500 × n                     # the pool every corridor drains
boss_hp(n)  = boss_base × (1 + 0.5(n − 1))  # only if every player can reach it
              else one boss per corridor at 1.0x
lane mobs:  no per-player stat scaling (each corridor already gets its own wave)
shared costs (Town) × (1 + 0.5(n − 1))
```

*Works when / breaks when.* Works when lanes are roughly equal. Breaks when one lane is much weaker; then a linear Hearth hides who leaks, so pair it with D2.

*Evidence.* Diablo 2 1.10 multiplies monster HP and XP by `(n+1)/2` [V, E3, S87]. Diablo 3 removed per-player monster damage in 1.0.3 and cut per-player HP from 70% to 50% in 1.0.8, so four players face 250% instead of 310% [V, E2, S52, S55]. Dungeon Defenders II called its +50% "higher than intended" and set +25% [U, E2, S77]. Deep Rock Galactic's Hazard 3 count goes 0.50, 0.50, 0.80 for 1-3 players and Hazard 5 goes 0.85, 0.85, 1.25, while normal enemies never scale HP with players [V, E3, S82].

*Cost and knobs.* S. Knobs: Hearth per player (0.5 now), boss per player (0.75 now), Town cost per player (0 now).

*In Hearthguard.* Change the Hearth term in `scripts/game/sim.gd:91` from `1 + 0.5(n − 1)` to `n`, so a trio gets 19,500 instead of 13,000, and the boss term in `sim.gd:189` from 0.75 to 0.5, so a trio boss is 2.0x instead of 2.5x [I]. Today a trio has 4,333 Hearth per corridor against 6,500 solo, and its boss sits in one random lane (`director.gd:105`) at 2.5x [K, E1]. Rerun `--players=3` against solo on the same seed.

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 4 · Cheapness 5 · Fit 5 · Testability 4

### D2. Catch the leak, show the lane

*Lineage.* WC3 Legion TD's shared King → Legion TD 2 fighters teleport to fight allied leaks → It Takes Two, where one death never ends the run while a partner lives. A shared loss feels fair when blame is spread and a failure can be rescued.

*Feeling.* Teamwork and rescue. Less blame on the weak lane.

*Mechanism.* Mobs past the last fire are marked "leaking" for every player. A hero who kills a leaking mob from another corridor gets full gold, not 30%. Log Hearth damage by lane, and show it after the wave as information.

```
on mob_passes_last_fire(m): m.leaking = true; ping(m) for all players
on kill(m, hero): if m.leaking and hero.lane != m.lane: gold_share = 1.0
log hearth_hit {lane, mob_kind, amount}
```

*Works when / breaks when.* Works with lanes that meet near the Hearth. Breaks if catching pays more than holding your own lane.

*Evidence.* Legion TD 2 lets fighters from cleared lanes defend the King, and leak catchers earn gold [V, E3, S100]. It Takes Two returns a dead player in seconds while the partner lives [V, E3, S101]. Juul found players who blamed their own mistakes rated a game higher than those who blamed the game, p<0.016 [V, E1, S7].

*Cost and knobs.* M. Knobs: catch gold share, ping distance, whether the lane is named on the results screen.

*In Hearthguard.* The co-op gold share is 0.3 for non-killers (`scripts/game/sim.gd:532`) [K]. Raise it to 1.0 for leaking mobs. Hearth damage is logged only as totals per wave today (`scripts/game/telemetry.gd:139-142`); add lane and mob kind [K].

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 3 · Cheapness 3 · Fit 4 · Testability 3

### Family E: Choosing difficulty

### E1. Narrow bands around one tuned mode

*Lineage.* WC3 host votes (X Hero Siege 2.0, Green Circle TD) → Kingdom Rush 0.8 / 1.0 / 1.2 HP (2011) → X Hero Siege: Reborn retunes modes by XP and gold → Aghanim's Labyrinth keeps the early-act shape across tiers (2020) → Kingdom Rush 6 at 70 / 80 / 100 / 110% (2025). One hand-tuned middle mode, cheap multipliers on either side.

*Feeling.* Autonomy at the start; Challenge for those who ask.

*Mechanism.* One table, three rows, chosen before the run. Supply first, mob attack second, mob HP last. Same shape in chapters 1-2, the difference grows in chapters 4-5.

| Band | Mob HP | Mob ATK vs Hearth | Hearth HP | Gold | Chapters affected |
|---|---|---|---|---|---|
| Casual | ×0.8 | ×0.8 | ×1.2 | ×1.2 | all |
| Normal | ×1.0 | ×1.0 | ×1.0 | ×1.0 | all |
| Hard | ×1.0 | ×1.2 | ×1.0 | ×1.0 | 3-5 only |

*Works when / breaks when.* Works with fixed waves, because bands keep the wave design intact. Breaks if the middle mode is not tuned first, or if it is tuned on insiders (see X1).

*Evidence.* Kingdom Rush uses enemy HP 0.8, 1.0 and 1.2 and gives heroes 120% HP on Casual [V, E3, S85]. Kingdom Rush 6 uses 70, 80, 100 and 110%, gates Impossible behind stage 18, and tuned Casual by +20% gold in patch 1 [V, E3, S84, S74]. X Hero Siege: Reborn raised Easy XP from 100% to 125% without touching enemies [V, E2, S79]. Valve slowed Aghanim's harder tiers early, "better matching the curve" of the easier ones [V, E2, S49]. An Ironhide founder said Veteran was added after a casual-first balance [U, E2, S43].

*Cost and knobs.* S. One multiplier row per band. A stacking assist (Hades God Mode, 20% plus 2% per death, cap 80% [V, E2, S34]) can replace the fixed Casual row later.

*In Hearthguard.* There are no modes today, and the one real player stalled at chapter 2 [K, E1, n=1]. Apply the row as multipliers on `HP_SCALE` and `ATK_SCALE` (`scripts/data/chapter_defs.gd:21-22`), `HEARTH_HP` (`scripts/game/sim.gd:23`) and the gold term at `sim.gd:277`. A Casual band is the cheapest test of whether chapters 3-5 are fun at all for people [I].

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 4 · Cheapness 5 · Fit 5 · Testability 5

### E2. Opt-in ladder of named knobs, gated by a clear

*Lineage.* Diablo 3 Monster Power 1-10 (2012) → Slay the Spire Ascension 1-20 → Hades Heat, inspired by Ascension (2020) → Deep Rock Galactic Hazard 5+ modifiers → Helldivers 2's ten tiers with reward multipliers (2024) → Diablo 4 gates Torment behind Pit clears (2024) → Nightreign's ranked Deep of Night with demotion (2025).

*Feeling.* Mastery and "one more try" after the first clear. Fiero at each new rung.

*Mechanism.* After a full clear, unlock rung 1. Each rung turns on one named modifier by one even step, pays a little more, and can be stepped down.

```
rung k unlocks on a clear of rung k − 1; lower rungs always open
each rung adds one modifier:  Aggressive (attack rate ×1.5) | More mobs (count ×1.5)
                              | Fragile Hearth (Hearth ×0.67) | Tough elites (elite HP ×1.5)
reward(k) = 1 + 0.25k   # only once something carries across runs
```

*Works when / breaks when.* Works after a base run most players can clear. Breaks when steps are uneven, when the ladder ships while the base is too hard, or when rewards make high rungs mandatory.

*Evidence.* Deep Rock Galactic's hazard bonus is +25% at Hazard 1, +75% at 3 and +133% at 5 [V, E3, S82]. Helldivers 2 pays 0% XP bonus at tiers 1-2, then 25, 50, 75, 100, 150, 200, 250 and 300% [V, E3, S91]. Kasavin named Ascension as Heat's inspiration [V, E2, S35]. Wilson and Cheng framed Monster Power as "more difficulty for those who want it" [V, E2, S38]. Aghanim's Apex Mage had the fewest games of any tier [V, E1, S73].

*Cost and knobs.* M for the menu and unlock logic, then S per modifier. Knobs: modifier list, step size, unlock condition.

*In Hearthguard.* Defer until the collective clears chapter 5. Then map rungs to knobs that exist: count multipliers on `_base_count` (`scripts/data/chapter_defs.gd:84-88`), `ELITE_HP` (`scripts/game/sim.gd:28`), `HEARTH_HP` (`sim.gd:23`) and `dark_chapter()` (`sim.gd:1125-1126`) moved to chapter 3. There is nothing to multiply rewards into yet, since Hearthguard has no meta-progression [K].

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 4 · Cheapness 3 · Fit 2 · Testability 3

### Family F: Learning and measurement

### F1. Introduce, practise, combine

*Lineage.* Cook's skill atoms (2007) → George Fan's Plants vs. Zombies tutorial talk (2012) → Linehan et al. measure the shape (2014) → Hayashida's four-beat levels, popularised by GMTK (2015). Each new skill enters alone and simply, then combines with older ones.

*Feeling.* Competence. "I get it."

*Mechanism.* At most one new skill atom per wave. Never open a menu over a peak. Teach a system the first time it pays.

```
new_atoms(wave) ≤ 1
no choice UI during waves 4 or 6 (Horde, boss); defer to the next gap or pause in solo
first contact with a system = a moment where it obviously helps (one-time teaching action)
```

*Works when / breaks when.* Works for discrete skills such as a talent row, a fire relight or a building. Breaks when real-time execution needs repetition under pressure; Linehan's data are puzzle games, so practice beats must repeat a skill, not only combine it.

*Evidence.* Linehan et al. coded four puzzle games and found skills introduced separately, practised, then combined [V, E1, S14]. Fan's tips include about eight words on screen at once, currency withheld until about level 10 and one-time teaching actions [V, E2, S29]. Hayashida's levels each centre on one gimmick [V, E2, S30, S31]. Cox et al. found more clicks did not raise immersion (p=0.766, n=40) and frustrated low-expertise players [V, E1, S21].

*Cost and knobs.* S. Knobs: `TALENT_LEVELS`, help panel time, the order of first contacts.

*In Hearthguard.* Four systems land between 1:47 and 2:30 [K, E1]. Move the first talent row from level 4 to level 3 in `TALENT_LEVELS` (`scripts/data/class_defs.gd:14`), so it opens around the first elite instead of mid-Horde, or pause the sim in solo while the talent panel is open [I]. Replace the 9 s, 15-line help panel (`scripts/ui/hud.gd:66`) with one line per new atom when it first appears. Teach the Town at the first campfire with one free level-1 building the player picks [I].

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 4 · Cheapness 4 · Fit 5 · Testability 3

### F2. Attempts funnel with a bot floor

*Lineage.* Arcade continue counts → King's pass rate and attempts per level → Mega Crit's per-tier slicing in Slay the Spire (GDC 2019) → Xue et al. model churn per (level, attempt) at EA (2017) → King's bots predicting pass rates (2025). Attempts expose retries that a player count hides; a bot separates bad numbers from "not learned yet".

*Feeling.* None directly. It protects every other curve from bad tuning.

*Mechanism.*

```
win_rate(c) = attempts that clear chapter c / attempts that start it   (Wilson 95% interval)
flag c if outside 20-80%
compare with bot_win_rate(c) on the same build and seeds:
  humans fail, bot fails   → number problem
  humans fail, bot clears  → skill or learning problem
per-player medians first; compare talents only within the same row
```

*Works when / breaks when.* Works when stages are discrete and repeated, and the sim is deterministic. Breaks with very few attempts, when strong players self-select into later chapters, or when the bot does things humans cannot.

*Evidence.* King measures difficulty as pass rate, and its level 65 churned 50% of players who reached it [V, E2, S46]. Mega Crit sliced data by ascension after two playtesters dominated early data [V, E2, S36]. Xue et al. found churn depends on (level, trial) and raised rounds played 4.4% to 7.9% [V, E1, S19]. King uses bots for pass rates and humans for feel [V, E2, S48].

*Cost and knobs.* S, given the existing `play_events` table [K]. Knobs: band edges, minimum attempts, seeds per class.

*In Hearthguard.* Win rate by chapter is computable from `wave_end` today (`scripts/game/telemetry.gd`) [K]. Add `run_index` to `plays` and run `tests/sim_bot.tscn` on three seeds per class for every build, stored with a `bot` flag [I]. Rules D1 and D2 in §13 depend on this.

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 4 · Cheapness 5 · Fit 5 · Testability 5

---

## 8. Comparison scorecard

The fifteen cards side by side. Ratings are author judgement in the order Fun impact · Evidence · Cheapness · Fit · Testability.

| # | Pattern | Fun | Evid. | Cheap | Fit | Test | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Chapter sawtooth that ends in a mow | 5 | 4 | 4 | 5 | 5 | 23 |
| A2 | Build up, peak, relax | 4 | 4 | 3 | 4 | 4 | 19 |
| A3 | Boss peak with a floor and a ceiling | 3 | 3 | 4 | 4 | 4 | 18 |
| B1 | Mob-side correction, one side at a time | 4 | 4 | 5 | 5 | 4 | 22 |
| B2 | A gold sink that buys survival | 3 | 2 | 4 | 5 | 4 | 18 |
| B3 | Player-steered pressure | 4 | 3 | 4 | 4 | 4 | 19 |
| C1 | Campfire checkpoint | 5 | 3 | 3 | 5 | 4 | 20 |
| C2 | Recoverable leak | 4 | 2 | 3 | 4 | 4 | 17 |
| C3 | Ember pool, a retry budget sized by the party | 4 | 3 | 4 | 4 | 4 | 19 |
| D1 | Scale the drained pool linearly, the focused enemy sublinearly | 4 | 4 | 5 | 5 | 4 | 22 |
| D2 | Catch the leak, show the lane | 3 | 3 | 3 | 4 | 3 | 16 |
| E1 | Narrow bands around one tuned mode | 4 | 4 | 5 | 5 | 5 | 23 |
| E2 | Opt-in ladder of named knobs, gated by a clear | 3 | 4 | 3 | 2 | 3 | 15 |
| F1 | Introduce, practise, combine | 4 | 4 | 4 | 5 | 3 | 20 |
| F2 | Attempts funnel with a bot floor | 3 | 4 | 5 | 5 | 5 | 22 |

**Reading the table.** A1 and E1 tie at the top. Both are constant changes in two files, and both answer the strongest finding about our build, that people stall at chapter 2 while the bot hits a wall at chapters 3 to 5. B1, D1 and F2 follow, and they are just as cheap. C1 has the highest fun impact next to A1 but costs a snapshot system. E2 scores lowest because it needs a base run people can clear and something to reward across runs, and neither exists yet. A low sum is not a veto. C2 is weakly evidenced but is the only card that turns a Hearth leak into play.

---

## 9. Natural experiments

A natural experiment here is a change (a patch, a rework, a new mode) plus the reaction to it, with the date and the numbers when known. Twenty-one cases, oldest first. Grades refer to the strongest evidence in the row.

| # | Game | When | Change | Reaction | Grade | Lesson |
|---|---|---|---|---|---|---|
| 1 | X Hero Siege 2.0 and Reborn | undated | 2.0 adds Easy to Extreme; Reborn raises Easy XP 100% to 125%, Hard gold 80% to 90% | Extreme called the replay value | E2 [V, E2, S78, S79] | Retune modes by supply, not enemy stats |
| 2 | Wintermaul Redux | 2010 | Remake made because the original could only be lost by lagging out | Remake rationale only | E2 [V, E2, S80] | A lives pool that cannot run out produces runs that end by quitting |
| 3 | Diablo 2 | 2003, patch 1.10 | Monster HP per player from `X × n` to `X × (n+1)/2`; minions stop scaling | Became the standard; the remaster kept it | E3 [V, E3, S87] | Linear per-player HP makes co-op slower than solo |
| 4 | Diablo 3 | Jun 2012, 1.0.3 | Inferno Acts II-IV damage and HP cut; per-player monster damage removed | Blizzard called group damage scaling "a major barrier" | E2 [V, E2, S51, S52] | A last-tier spike blocks everyone; scaling that punishes grouping kills co-op |
| 5 | Diablo 3 | Aug 2012, 1.0.4 | Damage −8% to −15%, normal HP +4% to +10%, drops about 4x | Accepted as the fix that made Inferno farmable | E2 [V, E2, S53] | Cut the burst, keep the HP, pay more for the time |
| 6 | Diablo 3 | Oct 2012, 1.0.5 | Monster Power 1-10, off by default, rewards rise per level | Well received as a way out of the fixed tier | E2 [V, E2, S54, S40] | A player-chosen dial replaces a fixed top tier |
| 7 | Diablo 3 | 2013, 1.0.8 | Per-player monster HP 70% to 50%; four players face 250% instead of 310% | Co-op teams reported relief | E2 [V, E2, S55] | Make grouping cheaper than solo, never harder |
| 8 | Dota 2 Siltbreaker | Jun 2017 | Launch with no checkpoint restart and instant-fail escorts | A wipe could cost "upwards of an hour"; Valve loosened timers and caps | E3 [V, E3, S75; U, E3, S76] | Long co-op attempts plus full resets turn hard into unfair |
| 9 | Aghanim's Labyrinth | Jul and Aug 2020 | July slows early growth on harder tiers; August adds Apex Mage | Apex Mage had the fewest games, low win rates | E1 [V, E2, S49; V, E1, S73] | Keep the opening learnable; new top tiers reach few players |
| 10 | Back 4 Blood | Dec 2021, 1.04 | Tiers rebalanced to "decrease the disparity" after spawns ran higher than intended | Read as easing all tiers | E2 [V, E2, S69, S70] | Close tier gaps before adding tiers |
| 11 | Vampire Survivors | Jul 2022 hotfix | Killing the Reaper before 31:00 counts as surviving | Recorded by the wiki | E3 [V, E3, S90] | A time cap is a finish line; reward reaching it |
| 12 | Diablo 4 | Jul 2023, 1.1.0 | Vulnerable damage cut about 65%, crit nerfs | Review bombing; devs promised never again | E2 [V, E2, S57] | Cutting the power curve at a season start feels like theft |
| 13 | Diablo 4 | Aug 2023, 1.1.1 | More density, tougher bosses above 60, three rares per Nightmare Dungeon | Calmed the backlash | E2 [V, E2, S58] | Players accept more enemies when the mow returns |
| 14 | Orcs Must Die! Deathtrap | Aug 2024 | 5-skull grade and par time replaced by uncapped scores | Designers said the grade "became binary" | E2 [V, E2, S44] | A capped grade stops informing once most players cap it |
| 15 | Helldivers 2 | Aug 2024 | Difficulty 10 added while fire damage was nerfed | 671 negative reviews on day one, about 3,000 in three days | E1 [V, E1, S60] | A new top tier plus a player nerf doubles the felt jump |
| 16 | Helldivers 2 | Sep 2024, 01.001.100 | Railgun 60 to 225 damage, enemies lose HP and armor | Concurrents nearly tripled to about 60k-68k the next day | E1 [V, E1, S61] | Raising player power brought players back |
| 17 | Diablo 4 | Oct 2024, Season 6 | Four open tiers plus Torment I-IV gated by Pit 20/35/50/65 | Linear to T3, a jump at T4 | E3 [V, E3, S59, S81] | Gate only the top, by a measured clear |
| 18 | Path of Exile 2 | Apr 2025, 0.2.0 | Player and minion nerfs plus enemy buffs | Recent reviews 39%; director said both "went way too far"; hotfix in a week | E1 [V, E1, S63] | Move one side of the ratio, measure, then the other |
| 19 | Elden Ring Nightreign | Jun 2025, 1.01.1 | Solo only, one automatic revive per night boss on Days 1-2, more runes | Press said it "makes solo runs viable" | E2 [V, E2, S66] | A co-op-first game needs solo help that is not a stat cut |
| 20 | Path of Exile 2 | Aug 2025, 0.3.0 | Broad buffs; the Cruel replay of the campaign removed | Described as overwhelmingly positive | E3 [V, E3, S64] | Repeating finished content at a multiplier reads as padding |
| 21 | Monster Hunter Wilds | Feb to Aug 2025 | Launch monsters died in under 10 min; HP and wound resistance raised, harder tiers added | Praise for longer hunts | E2 [V, E2, S72] | Too easy also fails; a fight that ends early has no peak |

The chart below places each experiment by what changed (player side, mob side, structure such as tiers or retries) and how players reacted.

@@FIG:experiments@@

Outside the table, Vermintide 2's clear-gated Cataclysm tier was accepted while its new Weaves mode drew the complaints [V, E3, S71]. Risk of Rain 2's Seekers of the Storm hit a record 75,406 concurrents while reviews fell, so curve changes need two signals [V, E1, S68]. Nightreign's ranked mode pleased its core, with an unverified report of later voluntary demotion [V, E3, S67; U].

### Recurring lessons

1. Nerfing player power draws the strongest backlash in the set (#12, #15, #18). Move mob numbers instead [I].
2. Change one side of the ratio per build (#18 moved both and overshot) [I].
3. Damage spikes are worse than HP padding. Cut the burst, keep the HP, raise rewards (#5, #13) [I].
4. Too easy also fails (#2, #21) [I].
5. A player-chosen dial beat a fixed tier every time it was offered (#6, #17) [I].
6. Gate only the top tier, by a measured clear, with even steps (#10, #17) [I].
7. Each new top tier reaches fewer players, so build it last (#9) [I].
8. Lower the cost of failure with retries or revives, not lower stats (#8, #19) [I].
9. Co-op scaling should add count before damage and must never punish grouping (#3, #4, #7) [I].
10. Judge a change by concurrents and recent reviews together, and separate bug complaints [I].

---

## 10. Anti-patterns

Each anti-pattern names the twin that showed it and the evidence. Three of them describe Hearthguard today.

### X1. Tuning the top on insiders

Diablo 3's director said hardcore internal testers set the bar for Inferno and the team then doubled it [U, E2, S39]. Blizzard cut Inferno twice and shipped a player-chosen dial within five months [V, E2, S54]. The collective and the developer are insiders of this kind, so tune the default run on first-time players and the bot floor [I].

### X2. A long attempt with a full reset

Siltbreaker paired hour-long attempts with full wipes and instant-fail escorts [V, E3, S75]. Hearthguard's 24-27 minute run with a restart from chapter 1 sits near that edge [K, E1; I].

### X3. A shared pool that grows slower than the lanes draining it

Hearthguard's trio has 67% of solo Hearth per corridor, and the trio bot lost earlier than solo [K, E1]. Diablo 3 called group-punishing scaling "a major barrier" and removed it [V, E2, S52].

### X4. Multiplying a lone-lane boss by party size

Hearthguard's boss gets +75% HP per extra player but spawns in one random lane [K, E1]. That +75% matches Diablo 3's 1.0.4 value, which Blizzard later cut to 50% for a boss the whole party can reach [V, E2, S55].

### X5. Nerfing the hero to fix the curve

Diablo 4 1.1.0, Helldivers 2's August 2024 update and Path of Exile 2 0.2.0 each cut player power and each drew the worst reaction of its year [V, E1, S57, S60, S63].

### X6. Moving both sides of the ratio at once

Path of Exile 2 0.2.0 nerfed players and buffed enemies in one patch and had to hotfix within a week [V, E2, S63].

### X7. A curve too flat to lose, or a fight too short to peak

Wintermaul Redux exists because the original could only be lost by lagging out [V, E2, S80]. Monster Hunter Wilds' launch fights ended before their peaks [V, E2, S72].

### X8. Interest where players already hoard

Green TD Solo pays 5% interest on banked gold [V, E2, S93]. Hearthguard's bots already die holding 13k to 25k gold [K, E1]. Interest would pay them to keep doing it [I].

### X9. Hidden or mid-fight adjustment

In Zeng and Sweetser's co-op study, 13 of 23 players hoped mob strength would not change mid-fight [V, E1, S20]. Rubber banding draws criticism once seen [V, E3, S50]. In a lane game every player sees every lane, so hidden per-lane adjustment would be noticed [I].

### X10. Uneven or runaway tiers

Back 4 Blood had to close the gaps between its tiers [V, E2, S70]. Diablo 4's ladder runs roughly even to T3, then jumps [V, E3, S59]. Diablo 3's Torment XIII gives monsters 2,108,607% HP and 28,832% damage, numbers that no longer mean anything to a player [V, E2, S88].

### X11. Four new systems in 45 seconds

Hearthguard opens the Horde, the first talent menu, the first potion, the first fire outage and the second elite between 1:47 and 2:30 [K, E1]. Plants vs. Zombies paced one new plant at a time and withheld currency until about level 10 [V, E2, S29].

### X12. Repeating finished content at a multiplier

Path of Exile 2 removed the Cruel replay of its campaign in 0.3.0, and players named the removal in praise [V, E3, S64]. Hearthguard's retries replay chapter 1, where the ratio is above 1.0, for 5-6 minutes each time [K, E1; I].

### Cost of failure, in minutes

Juul's four punishment types split failure into energy (losing health), life (losing a life or a retry), setback (replaying part of the game) and termination (game over) [V, E2, S7]. Juul suggests casual games appeal by sparing setback more than energy [V, E2, S7]. The figure below puts minutes lost per type side by side.

In Hearthguard, energy punishment is hero HP, and life punishment is a hero death with a 6 to 12 s respawn (`sim.gd:378`) while the corridor stays open [K, E1]. There is no setback layer. Termination, the Hearth falling, costs the whole run so far, up to 24-27 minutes, and cost the one player 4:47 in a first game [K, E1].

Among the twins, Super Meat Boy removed the respawn delay [V, E2, S32], about 1 s by our estimate [I]. Kingdom Rush restarts one 10-20 minute stage [V, E3, S85]. Vampire Survivors runs 15, 20 or 30 minutes [V, E3, S90]. Hades runs are estimated at 30-60 minutes but can be suspended [U, E4, S104]. A Siltbreaker wipe could cost "upwards of an hour" [V, E3, S75], and WC3 Hero Siege sessions ran 45-90 minutes [V, E2, S78]. With a campfire checkpoint (C1), Hearthguard's worst case falls to about 6 minutes [I].

@@FIG:punish@@

---

## 11. Curve Spec for Hearthguard

The Curve Spec is the smallest set of rules that should produce the feelings in §3. It is a design proposal, tested so far only in our curve model [I]. Lower layers set the frame for the upper ones; change them first and least often.

**Layers, bottom to top.**
1. **Run length and chapter budget.** Five chapters of six waves, 24-27 minutes today; each 5-6.5 minute chapter is one phone session, and each campfire a checkpoint (C1).
2. **Party scaling.** The Hearth grows with every open corridor, the boss sublinearly, lane mobs not at all, shared costs with the party (D1).
3. **Mob scaling.** `HP_SCALE` sets the chapter steps and `WAVE_STEP` the rise inside a chapter; attack follows the same steps (A1, B1).
4. **Hero growth.** `xp_to_next` and `DMG_GROWTH` set the power curve; the target is a ratio that starts each chapter near 0.92 and climbs at least 15% by the boss (A1).
5. **Hearth and leaks.** The Hearth grows by chapter, leaks can be won back, and embers turn a fall into a setback (B1, C2, C3).
6. **Pacing beats.** Build up, elite, the Horde as the peak, elite, a boss inside 90-150 s, and a real gap after each peak (A2, A3).
7. **Economy and the Town.** Gold converts into survival at every campfire; the Town stays the better buy; no interest (B2).
8. **Learning gates.** At most one new atom per wave, no menus over peaks, the Town taught by a free first building (F1).
9. **Player-steered difficulty.** Early calls on every gap, a Casual band now, a clear-gated ladder later (B3, E1, E2).

**Formulas.**

Current, from the repo [K, E1]:

    mob_hp(c, w)   = base_hp × 3.2 × HP_SCALE[c] × (1 + 0.07 × w)        # HP_SCALE = [1.0, 2.3, 4.6, 8.0, 13.0]
    mob_atk(c, w)  = base_atk × 3.6 × ATK_SCALE[c] × (1 + 0.07 × w)      # ATK_SCALE = [1.0, 1.6, 2.4, 3.3, 4.4]
    hero_dmg(L)    = 32 × 1.09^(L − 1) + 2.4 × (L − 1)                    # Fighter
    xp_to_next(L)  = 80 + 70L + 6L²
    hearth(n)      = 6,500 × (1 + 0.5 × (n − 1))
    boss_hp(c, n)  = BOSS_BASE[c] × (1 + 0.75 × (n − 1))                  # 8,000 ... 60,000, one random lane
    respawn(c)     = 6 + 1.5 × (c − 1) seconds                              # c = 1..5
    lane_mobs(n)   = full wave in each of n corridors

Proposed [I, model]:

    mob_hp(c, w)   = base_hp × 3.2 × HP_SCALE[c] × (1 + 0.03 × w)        # HP_SCALE = [1.0, 2.5, 4.3, 7.1, 11.3]
    mob_atk(c, w)  = base_atk × 3.6 × ATK_SCALE[c] × (1 + 0.03 × w)      # ATK_SCALE unchanged at first
    xp_to_next(L)  = 80 + 70L + 3L²
    hearth(c, n)   = 6,500 × n × (1 + 0.5 × (c − 1))                       # 6,500 ... 19,500 solo
    boss_hp(c, n)  = BOSS_BASE[c] × (1 + 0.5 × (n − 1))
    town_cost(b, lv, n) = base_b × 1.7^lv × (1 + 0.5 × (n − 1))
    embers(n)      = n; a spent ember restores 25% of the Hearth
    ratio target   : start of chapter 0.90-0.95, boss wave ≥ 1.15 × start

In the model the proposal gives these ratios per wave. Chapter 1 runs 1.00, 0.97, 1.26, 1.23, 1.53, 1.49; chapter 2 0.94, 0.91, 0.98, 1.04, 1.11, 1.18; chapter 3 0.94, 0.91, 0.96, 0.94, 1.07, 1.05; chapter 4 0.92, 0.90, 0.94, 0.92, 1.04, 1.10; chapter 5 0.93, 0.90, 0.95, 1.00, 1.05, 1.10 [I, model]. The hero reaches level 30 by the end. Chapter 1's mow is stronger than today's and may need `HP_SCALE[0]` or the first `WAVE_STEP` raised once the collective has played it [I]. The model ignores abilities, talents, the Town and the execute line.

| Knob | Where | Now | Proposed | Range | Moves |
|---|---|---|---|---|---|
| `HP_SCALE` | `scripts/data/chapter_defs.gd:21` | 1.0, 2.3, 4.6, 8.0, 13.0 | 1.0, 2.5, 4.3, 7.1, 11.3 | each step ×1.5 to ×2.6 | The chapter push-back, where the sawtooth drops |
| `ATK_SCALE` | `scripts/data/chapter_defs.gd:22` | 1.0, 1.6, 2.4, 3.3, 4.4 | unchanged, then lower late if the Hearth still falls | 4.4 down to 3.5 at chapter 5 | Hearth margin and hero toughness |
| `WAVE_STEP` | `scripts/data/chapter_defs.gd:24` | 0.07 | 0.03 | 0.02-0.07 | The rise inside a chapter, for both HP and attack |
| `xp_to_next` | `scripts/data/class_defs.gd:19` | 80 + 70L + 6L² | 80 + 70L + 3L² | quadratic term 2-6 | Levels per chapter, so whether late chapters mow |
| `DMG_GROWTH` | `scripts/game/hero_stats.gd:10` | 1.09 | unchanged | 1.08-1.11 | Hero power per level; touch last (B1) |
| `HEARTH_HP` | `scripts/game/sim.gd:23` | 6,500 flat | 6,500 × (1 + 0.5(c − 1)) | +0.3 to +0.6 per chapter | Late leak cost; where every bot loss happens |
| Hearth per extra player | `scripts/game/sim.gd:91` | +0.5 | +1.0 (linear) | 0.5-1.0 | Co-op Hearth per corridor |
| Boss HP per extra player | `scripts/game/sim.gd:189` | +0.75 | +0.5 | 0.25-0.75 | A trio boss in one lane |
| Respawn | `scripts/game/sim.gd:378`, `Dota_2.json:112` | 6 s + 1.5 s per chapter | unchanged, plus buyback | 4-12 s | Time a corridor stays open after a death |
| `waveGapS` | `Dota_2.json:110` | 12 s | 12 s, 20 s in chapters 3-5 | 8-30 s | The relax after each wave |
| `CLEAR_SHARE` | `scripts/game/director.gd:16` | 0.15 | 0.10 in chapters 3-5 | 0.05-0.2 | Mobs carried into the next wave |
| `TALENT_LEVELS` | `scripts/data/class_defs.gd:14` | 4, 8, 12, 16, 20 | 3, 8, 12, 16, 20 | first row at 3-5 | Whether the first talent lands on the Horde |
| Co-op gold share | `scripts/game/sim.gd:532` | 0.3 | 0.3, 1.0 for caught leaks | 0.3-1.0 | Reason to cross lanes (D2) |
| Town `COST_GROWTH` | `scripts/data/town_defs.gd:14-16` | 1.7, no party term | 1.7 × (1 + 0.5(n − 1)) | 1.5-1.9 | Shared Town vs shared income |
| `CAMP_TIME` | `scripts/game/director.gd:13` | 25 s | 25 s, paused while a menu is open in solo | 20-40 s | Time to learn and spend at the campfire |

---

## 12. The curve lab

The curve lab, `curves-hearthguard-lab.html`, is a single page that plots the Curve Spec with sliders for its knobs [K, S5]. It is a model, not the game, with the same kill-everything solo Fighter assumptions as §4 [I].

It plots six things across all 30 waves:

- The power ratio per wave for the current build, the target sawtooth and the slider values.
- The Hearth's margin per wave, in chapter 1 wave 1 hits.
- Mob counts per corridor and for the party.
- Player count from 1 to 3, which changes the Hearth, boss HP and total mobs.
- Respawn time per chapter and how much of a wave a dead hero's corridor stays open.
- An estimated run length from spans, gaps and campfires.

The sliders are `HP_SCALE` per chapter, `ATK_SCALE` per chapter, `WAVE_STEP`, the quadratic term of `xp_to_next`, `DMG_GROWTH`, `HEARTH_HP` with its per-chapter and per-player terms, boss HP per extra player, respawn base and per-chapter step, and `waveGapS`.

How to use it with the collective [I]:

1. Before a session, write one fun hypothesis from §3, for example H2 for the chapter 2 push-back.
2. Move one side of the ratio in the lab (mob side first, B1) until the curve hits the target, and note the values.
3. Run the bot with those values on three seeds per class. If it disagrees with the lab by more than one level or a minute per chapter, trust the bot.
4. Ship the build to the collective, play it with the §13 protocol, and compare the observed Hearth leak and difficulty item with the lab's prediction.
5. Keep the lab values that survived two sessions; throw away the rest.

---

## 13. Instrumentation and playtest protocol

Every studio in our notes measured the same short list. A pass rate per stage with attempts as the denominator, where players die, how long a stage takes, and where they quit [V, E2, S46, S37, S28]. King adds "time to abandon" as its engagement signal, separate from difficulty [V, E2, S47]. Hearthguard already logs most of this in Supabase `plays` and `play_events`: deaths with the last 6 s of hits, per-wave hero summaries, `wave_start` with `mobs_carried` and `hearth_frac`, `wave_end` with `hearth_lost`, and level, learn, talent, buy, drink, build, road fire, dark and game over events (`supabase/migrations/20261108060000_play_logs.sql`, `scripts/game/telemetry.gd:1-20`) [K, E1].

### Events to add

| Event or field | Data | Why | Cost |
|---|---|---|---|
| `plays.run_index`, `plays.first_session` | earlier plays on this build | Attempts to clear; first game vs tenth | S |
| `plays.input` | "mouse" or "touch" | Phone players face a different skill floor | S |
| `quit` reason | "too hard", "out of time", "bored" | 6 of 11 plays so far are quits with no reason | S |
| `rating` | `{q, value}` at each campfire and game over | Perceived difficulty beside actual difficulty | S |
| `talent_offer` | time the row unlocked | Talent pick delay (H9) | S |
| `hearth_hit` | lane, mob kind, amount | Hearth damage by lane (D2), leak spikes (D4) | S |
| `camp_end` | gold held | Unspent gold at each campfire (H10, D9) | S |
| `ui_open` | panel, seconds open, mid-wave or not | Whether help, talents and the Town are read | S |
| `telegraph` | move, hit or dodged | Whether elite and boss deaths are readable | M |
| `fire_kindle` and dark time | attempts, progress, seconds dark per wave | Whether fires and the dark are learned | S |
| `ember`, `retry`, `steal` | when C1-C3 ship | Whether the safety nets are used | S |

### Derived metrics and SQL views

Five views over `plays` and `play_events`, shown in the existing Netlify dashboard. Column names below are illustrative and must match the migration [I].

- `v_chapter_attempts`. Per build and chapter, the attempts, clears, win rate, Wilson 95% interval, bot win rate on the same build.
- `v_wave_curve`. Per build, chapter and wave, the median Hearth fraction at wave end, Hearth leak as a share of max, human vs bot clear time, damage taken, drinks, deaths, mobs carried.
- `v_learning`. Per player, the attempts to the first clear of each chapter, deaths per chapter by `run_index`, talent pick delay.
- `v_quits`. Quit point (chapter, wave, time), time to abandon, reason.
- `v_ratings`. Median 1-7 difficulty per chapter beside chapter win rate.

```sql
-- v_chapter_attempts (sketch)
select p.build, e.chapter,
       count(distinct p.id)                                         as attempts,
       count(distinct p.id) filter (where e2.how = 'cleared')       as clears
from plays p
join play_events e  on e.play_id = p.id and e.kind = 'wave_start' and e.wave = 0
left join play_events e2 on e2.play_id = p.id and e2.kind = 'wave_end'
                         and e2.chapter = e.chapter and e2.wave = 5
group by p.build, e.chapter;
-- add Wilson bounds in the view or the dashboard; join a bot flag for bot_win_rate
```

Supabase views plus the existing dashboard need no new infrastructure [K]. Metabase (AGPL core) is the only tool worth adding, for ad-hoc charts [V, E1, S109]. PostHog and GameAnalytics would duplicate `play_events` in a second schema [V, E1, S108, S111; I]. Grafana went AGPLv3 in 2021 and suits time series more than funnels [V, E2, S110]. Talo is the fallback if Supabase is dropped [V, E3, S112].

### Session protocol for five players

Before the session, the designer runs the bot for archer, fighter and mage on three fixed seeds, stored with a `bot` flag [K]; writes one hypothesis from §3 with a numeric target, such as "chapter 2 wave 1 Hearth leak 5-15%" for H2; and notes the lab's prediction for the build [I].

During the session, 45-60 minutes [V, E2, S28; I]:
1. Each player plays solo first, one run or 40 minutes, then co-op if time allows.
2. Screen-record. No think-aloud, since MOBA input leaves no spare attention. Observers do not help.
3. One observer notes timestamps of visible frustration or delight, to cross-check against `death` and `hearth_lost` spikes.
4. After the run, replay two minutes around the worst moment from the death record's timestamp.

At each campfire, three one-tap questions:
1. "How hard was this chapter?" 1 (far too easy) to 7 (far too hard), 4 is about right.
2. "Did you want to keep going?" 1 to 7.
3. "What hurt you or the Hearth most?" The chapter's elites, the boss, the Horde, or "I don't know".

At game over, five questions:
1. "How hard was this run?" 1 to 7.
2. "Was the loss your fault, the game's, or bad luck?"
3. "Draw how interested you felt across the run," a 0-10 line over chapters 1 to 5.
4. "What one thing would you change?"
5. "Which moment felt best?"

The 1-7 item copies Valve's Left 4 Dead survey format [V, E2, S28]. The fault question is Juul's attribution test [V, E1, S7]. The drawn line is Schell's interest curve, read as a shape [V, E3, S15]. Once per build, players fill in the 11-item miniPXI; compare only items with reliability near .8 [V, E1, S26]. Skip the 33-item GEQ, whose structure is only partly supported [V, E1, S27]. CORGIS (30 items, four subscales) can come later [V, E1, S17].

### Decision rules

A rule fires only if it holds in two sessions on the same build [I].

| # | Signal | Threshold | Action |
|---|---|---|---|
| D1 | Chapter win rate, humans | below 20% with at least 10 attempts, and the bot also fails | Number problem. Raise `HEARTH_HP` for that chapter or lower its `ATK_SCALE` |
| D2 | Chapter win rate, humans | below 20% with at least 10 attempts, and the bot clears | Skill or learning problem. Add a telegraph or a teach beat; do not touch stats |
| D3 | Chapter win rate | above 80% with at least 10 attempts, median difficulty item at most 3 | Plateau. Raise `WAVE_STEP` inside the chapter or move a later elite in |
| D4 | Hearth leak on one wave | median above 40% of max across players | Spike. Check `taken_by` and `hearth_hit`; retune that wave's roster |
| D5 | Difficulty item vs win rate | median item 6-7 while win rate is above 60% | Felt difficulty from clarity. Fix readability before balance |
| D6 | Quit reason "too hard" | 3 of 5 players in the same chapter | Treat as D1 or D2 by the bot's result |
| D7 | Quit reason "bored", or keep-going item at most 3 | 3 of 5 players in a chapter | Pacing. Check that chapter's ratio rise and `xp_to_next` |
| D8 | Attempts to first clear of chapter 1 | median above 3 | Onboarding. Test with one fresh outside player before tuning |
| D9 | Unspent gold at campfire 2 | median above 1,000 | The Town is not learned. Teach it (F1) or add a sink (B2) |
| D10 | A/B build comparison | per-wave Hearth leak differs by more than 10 points on paired waves, same direction for at least 4 of 5 players | Keep the better build; confirm with the bot on the same seeds |

### What five players can and cannot show

Five users find about 85% of problems that hit 31% of users, under Nielsen and Landauer's model [V, E3, S25]. At n = 5 the same model gives 67% for problems hitting 20% of players, 41% at 10% and 23% at 5% [I, arithmetic]. Critics found five users revealed only 35% of problems on large sites [V, E3, S25]. A felt spike that only one player in ten meets will be seen in a given session with 41% probability, so run two sessions per build before calling a chapter clean [I].

Win rates are worse. The 95% Wilson interval for 1 in 5 is 4% to 62%, for 3 in 10 is 11% to 60%, for 5 in 10 is 24% to 76%, for 8 in 10 is 49% to 94%, and for 10 in 20 is 30% to 70% [I, arithmetic]. Ten attempts cannot tell 30% from 50%. A sign test on "which build felt better" needs 5 of 5 players to agree for a one-sided p of 0.03; 4 of 5 gives 0.19 [I, arithmetic].

So use continuous per-wave metrics for A/B work. Five players with two attempts at one chapter give 60 paired wave rows [I]. Alternate build order (players 1, 3 and 5 play A first) to offset learning, and fix the stopping rule in advance, since stopping when the dashboard looks good inflates false positives [I]. After one session the collective is no longer naive, so bring one fresh outside player per build for onboarding [I]. Report per-player medians before pooled rates; Mega Crit found two playtesters dominated its early data [V, E2, S36]. The explorer below shows the interval for any number of attempts.

@@FIG:ci@@

---

## 14. Backlog: ranked by fun impact ÷ cost

Fun impact is 1-5; cost S, M or L counts as 1, 2 or 3; score is impact divided by cost. Ties are broken by impact.

| Rank | Change | Cards | Fun impact | Cost | Score | Hypothesis |
|---|---|---|---|---|---|---|
| 1 | Restore the sawtooth with `xp_to_next` 6L² to 3L², `WAVE_STEP` 0.07 to 0.03, new `HP_SCALE` | A1 | 5 | S | 5.0 | H1, H2 |
| 2 | Grow the Hearth by chapter, 6,500 × (1 + 0.5(c − 1)), and flag burst hits | B1 | 5 | S | 5.0 | H2 |
| 3 | Linear Hearth and +0.5 boss per extra player (`sim.gd:91, 189`) | D1 | 4 | S | 4.0 | H8 |
| 4 | Casual band with mob HP and ATK ×0.8, Hearth and gold ×1.2 | E1 | 4 | S | 4.0 | H11 |
| 5 | Ember pool, one per player; a spent ember restores 25% of the Hearth | C3 | 4 | S | 4.0 | H7 |
| 6 | Telemetry additions and the five SQL views, plus a bot run per build | F2 | 3 | S | 3.0 | H2, H9, H10 |
| 7 | First talent row at level 3 or a solo pause on the talent panel | F1 | 3 | S | 3.0 | H9 |
| 8 | Campfire checkpoint with one retry per run | C1 | 5 | M | 2.5 | H6 |
| 9 | Recoverable leak, where mobs steal 5% of the Hearth and carry it back | C2 | 4 | M | 2.0 | H7 |
| 10 | Campfire gold sink with Hearth repair, buyback and Town cost per player | B2 | 3 | M | 1.5 | H10 |

Ranks 1 and 2 should ship together but be tested apart, one per build, following B1's one-side-at-a-time rule [I]. Rank 6 should go out first in practice, since without it no other row can be judged [I]. The ladder (E2) and the catch-the-leak rule (D2) wait until the collective clears chapter 5 in co-op.

---

## 15. "See it in action" index

One row per game example, from the research notes.

| # | Game | Curve idea | URL |
|---|---|---|---|
| 1 | Left 4 Dead | AI director build up, peak, relax | https://steamcdn-a.akamaihd.net/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf |
| 2 | Gauntlet | Health drains as a clock; a coin buys health back | https://en.wikipedia.org/wiki/Gauntlet_(1985_video_game) |
| 3 | Green TD Solo | Lobby difficulty table and interest | https://maps.w3reforged.com/maps/categories/tower-defense-td/green-td-solo |
| 4 | Wintermaul | Own lane, shared team lives | https://www.curseforge.com/sc2/maps/wintermaul-the-remake |
| 5 | X Hero Siege | Host picks difficulty at the start | https://www.hiveworkshop.com/threads/x-hero-siege-3-33.76776/latest |
| 6 | Hero Survival Omega | Boss every 6 waves | https://www.hiveworkshop.com/threads/hero-survival-omega.360648/ |
| 7 | Element TD | Leaks loop back; boss every 10 levels | https://forums.eletd.com/topic/95279-example-run-how-to-beat-insane-difficulty |
| 8 | Aeon of Strife | Four heroes hold three lanes against bots | https://upcomer.com/dota-2002-part-one-moba-evolution/ |
| 9 | Kingdom Rush 6 | Four difficulty bands as HP percentages | https://wikily.gg/kingdom-rush-6-genesis/difficulty |
| 10 | Kingdom Rush | Heroic Challenge, one life, post-clear | https://kingdomrushtd.fandom.com/wiki/Heroic_Challenge |
| 11 | Orcs Must Die! Deathtrap | Capped skull grade replaced by scores | https://robotentertainment.com/news-archive/2024/8/15/orcs-must-die-deathtrap-our-new-loop-and-progression-systems |
| 12 | Orcs Must Die! Deathtrap | Endurance starts mid-curve and ends at 25 waves | https://robotentertainment.com/news-archive/2025/9/12/challenge-accepted-coming-soon-new-ways-to-play |
| 13 | Defense Grid | Cores carried back, a recoverable leak | https://www.pcgamer.com/defense-grid-the-beer-game-that-changed-a-genre |
| 14 | Deep Rock Galactic | Per-player tables for count, toughness, damage | https://deeprockgalactic.wiki.gg/wiki/Hazard_Level |
| 15 | Helldivers 2 | Ten tiers with reward bonuses | https://helldivers.wiki.gg/wiki/Difficulties |
| 16 | Helldivers 2 | Reinforcement pool per player | https://helldivers.wiki.gg/wiki/Reinforcement |
| 17 | Vampire Survivors | The Reaper at the time cap | https://vampire.survivors.wiki/w/Reaper |
| 18 | Vampire Survivors | Curse as a pressure stat | https://vampire.survivors.wiki/w/Curse |
| 19 | Risk of Rain 2 | Difficulty over time | https://riskofrain2.wiki.gg/wiki/Difficulty |
| 20 | Diablo 2 | `(n+1)/2` monster HP per player | https://diablo2.diablowiki.net/Players_x |
| 21 | Diablo 3 | Monster Power, a player-chosen dial | https://us.diablo3.com/en/blog/7540457 |
| 22 | Diablo 3 | Co-op damage boost removed | https://pcgamer.com/diablo-3-hotfix-removes-monster-damage-boost-in-co-op-inferno-teams-breathe-sigh-of-relief |
| 23 | Diablo 4 | Torment gated by Pit clears | https://www.sportskeeda.com/mmo/diablo-4-vessel-hatred-how-unlock-torment-difficulty |
| 24 | Dota 2 Siltbreaker | Hour-long co-op wipes | https://kotaku.com/dota-2s-brutal-co-op-campaign-might-end-some-friendship-1795968100 |
| 25 | Aghanim's Labyrinth | Harder tiers keep the easy tiers' early curve | https://store.steampowered.com/news/63749 |
| 26 | Back 4 Blood | Closing the gaps between tiers | https://mp1st.com/news/back-4-blood-update-1-04-patch-notes-out-for-december-update |
| 27 | Path of Exile 2 | Retry budget on the pinnacle boss | https://www.pcgamer.com/games/mmo/path-of-exile-2s-first-patch-of-2025-is-coming-later-this-week-with-more-rewarding-endgame-mapping-and-the-rollout-of-respawns-when-fighting-pinnacle-bosses |
| 28 | Elden Ring Nightreign | Solo revive per night boss | https://www.bandainamcoent.com/news/elden-ring-nightreign-patch-notes-version-1-01-1 |
| 29 | Monster Hunter Wilds | Too easy, then harder Tempered tiers | https://automaton-media.com/en/news/monster-hunter-wilds-update-expands-endgame-content-and-ups-the-difficulty-with-new-9-star-tempered-monsters/ |
| 30 | Slay the Spire | Ascension ladder | https://www.pocketgamer.com/slay-the-spire/ascension-guide |
| 31 | Hades | God Mode, +2% per death | https://www.inverse.com/gaming/hades-god-mode-interview |
| 32 | Celeste | Assist Mode | https://www.vice.com/en/article/d3w887/celeste-difficulty-assist-mode |
| 33 | Plants vs. Zombies | One new thing at a time, eight words on screen | https://gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan |
| 34 | Super Mario 3D World | Introduce, develop, twist, conclude | https://youtu.be/dBmIkEvEBtA |
| 35 | Super Meat Boy | Near-instant respawn | https://www.gamedeveloper.com/game-platforms/-i-super-meat-boy-i-s-mcmillen-explains-why-so-hard- |
| 36 | Legion TD 2 | Catching a partner's leaks | https://www.switchbladegaming.com/strategy-games/legion-td-2/beginners-guide-12/ |
| 37 | It Takes Two | Partner respawn while one lives | https://en.wikipedia.org/wiki/It_Takes_Two_(video_game) |
| 38 | Candy Crush Saga | Time to abandon vs time to pass | https://mobilegamer.biz/how-king-defines-a-good-candy-crush-saga-level-and-why-it-constantly-prunes-the-bad-ones/ |

---

## 16. What remains unverified (and corrections)

### Corrections made during the study

- **Run length.** The brief assumed runs of about 15 minutes. The bot runs took 24 to 27 minutes (1,450 to 1,622 s), with chapters of 5 to 6.5 minutes [K, E1]. Every cost-of-failure figure in this study uses 24-27.
- **CORGIS date.** The series glossary first cited the challenge scale as Denisova et al. 2017. The 2017 CHI paper is the earlier conference work [V, E2, S16]; the full 30-item scale was published in IJHCS in 2020 [V, E1, S17]. The glossary now says 2020.
- **Path of Exile 2.** A search premise said 0.3.0 was review-bombed. It was 0.2.0; 0.3.0 was well received [V, E3, S64].
- **Constant and Levieux 2019.** Briefed as a risk-taking study; its listing shows a study of confidence, and it was not read [U, S24].
- **Missing citations.** "Rummell 2011" and "Lim and Harrell" on tower defense balancing were not found under those names and may be misremembered [U].

### Still unverified

- Hearthguard. Only seed 7 was run, so bot variance is unknown [K]. The ratio model ignores abilities, talents, the Town and the execute line [K]. The co-op gold multipliers assume even kills [I]. Whether the sim can snapshot for C1 is unverified [I]. All human data is one player on one evening, and nothing reaches past chapter 2 [K, E1, n=1].
- Diablo 3. Wilson's "doubled" remark comes through reposts [U, S39]. The 1.0.3 percentages were not found, and the 1.0.4 and 1.0.8 notes disagree on the per-player value before 1.0.8 (75% or 70%) [U, S55]. Torment launched with six levels by the weight of sources; some say ten [U].
- Dungeon Defenders II's cut and Siltbreaker's patch numbers come from snippets [U, S77, S76].
- Helldivers 2's peak player numbers conflict across press reports [U, S61, S62].
- Monster Hunter Wilds' HP table (100, 163, 200, 234% for 1-4 players) is community-measured, and Monster Hunter World's figures disagree on duo [U, E3, S72, S106].
- Kingdom Rush's Impossible first appearing in Vengeance, and three stars at 18 of 20 lives, are unverified [U, S86].
- Nightreign's 43.2% negative peak and voluntary demotion come from a low-reliability aggregator [U].
- Gauntlet's health per coin is 700 in one source and 600 in another [U, S99].
- The claim that Hamlet's players "did not notice" adjustment is unverified; Hunicke 2005 was not read [U, S10].
- Hades run length, the Dota 2 respawn table, the WC3 revive formulas and the PENS item count (often given as 21) were not verified [U, S104, S102, S103].
- Robb and Zhang (2022) was read only as an abstract [V, E1, S18].

### Open gaps

- No paper studies DDA in co-op PvE with one shared loss condition, the case that matters most for Hearthguard [I].
- No twin publishes win rate by wave or quit point by wave for a defense game [I].
- No lane-split co-op game with published per-player scaling was found [I].
- Power-curve and progression papers (Hamari, Wang et al.) were not read [I].
- Orcs Must Die, Dungeon Defenders and poncle have no designer statements on curves in our notes [I].

---

## 17. Sources

Numbered for the [S#] references. All URLs come from the research notes. "Excerpt", "snippet" or "not read" marks a page read only in part.

**Series and Kingsfoil**

1. Enemy AI for a Hero Defense RTS (earlier Kingsfoil study): https://kingsfoil-artifacts.netlify.app/rts-enemy-ai-study
2. Hearthguard, live web build: https://kingsfoil-hearthguard.netlify.app
3. Hearthguard playtest dashboard, fetched 2026-11-09: https://kingsfoil-hearthguard-dashboard.netlify.app
4. Hearthguard repo at main b509a56, with the bot runs of 2026-11-09: https://github.com/sujumayas/hearthguard
5. The curve lab, `curves-hearthguard-lab.html` (companion page)

**Theory and papers**

6. Chen, Flow in Games, MFA thesis, USC (2006, year inferred): https://www.jenovachen.com/flowingames/Flow_in_games_final.pdf
7. Juul, Fear of Failing? The Many Meanings of Difficulty in Video Games (2009): https://www.jesperjuul.net/text/fearoffailing/
8. Hunicke, LeBlanc and Zubek, MDA (2004): https://users.cs.northwestern.edu/~hunicke/MDA.pdf
9. Hunicke and Chapman, AI for Dynamic Difficulty Adjustment in Games (Hamlet, 2004): https://users.cs.northwestern.edu/~hunicke/pubs/Hamlet.pdf
10. Hunicke, The case for dynamic difficulty adjustment in games, ACE 2005 (not read): https://doi.org/10.1145/1178477.1178573
11. Booth, The AI Systems of Left 4 Dead, Valve (2009): https://steamcdn-a.akamaihd.net/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf
12. Smeddinck et al., How to Present Game Difficulty Choices? CHI 2016 (abstract): https://www.cs.mcgill.ca/~jeromew/data/COMP766/CHI2016/p5595-smeddinck.pdf
13. Cook, The Chemistry of Game Design (2007): https://lostgarden.com/2007/07/19/the-chemistry-of-game-design/
14. Linehan et al., Learning curves: analysing pace and challenge in four successful puzzle games, CHI PLAY 2014: https://cora.ucc.ie/handle/10468/3461
15. Schell, The Art of Game Design (2008), Lens of the Interest Curve (transcription): https://gamefroot-developer.gitbooks.io/jesse-schell-the-art-of-game-design-lenses-1-to-1/content/061.html
16. Denisova, Guckelsberger and Zendle, Challenge in Digital Games, CHI EA 2017: https://openaccess.city.ac.uk/21356/
17. Denisova, Cairns, Guckelsberger and Zendle, CORGIS, IJHCS 137 (2020): https://www-users.york.ac.uk/~pc530/pubs/Denisova_IJHCS_20.pdf
18. Robb and Zhang, DDA controlled experiment (2022, abstract only): https://cejsh.icm.edu.pl/cejsh/element/bwmeta1.element.desklight-b63cd1f4-ca47-41c1-a000-22d136588c5a/c/AL_2022-5-1_Study-1_Robb__Zhang__1_.pdf
19. Xue et al., Dynamic Difficulty Adjustment for Maximized Engagement in Digital Games, WWW 2017 Companion: https://archives.iw3c2.org/www2017/proceedings/companion/p465.pdf
20. Zeng and Sweetser, Dynamic Difficulty Adjustment in a Multiplayer Minecraft Server, OzCHI 2022: https://openresearch-repository.anu.edu.au/bitstreams/4ae20c15-6ca4-4171-ac7a-ae5393491e0b/download
21. Cox, Cairns, Shah and Carroll, Not doing but thinking, CHI 2012: https://www-users.york.ac.uk/~pc530/pubs/Cox_CHI2012.pdf
22. Klarkowski et al., Sub-Optimal and Optimal Play Experiences through Challenge-Skill Manipulation, CHI 2016: https://www.cs.mcgill.ca/~jeromew/data/COMP766/CHI2016/p5583-klarkowski.pdf
23. Cuerdo, Mahajan and Melcer, Die-r Consequences, IEEE CoG 2021 (abstract): https://dblp.uni-trier.de/rec/conf/cig/CuerdoMM21.html
24. Constant and Levieux, DDA Impact on Players' Confidence, CHI 2019 (metadata): https://dblp.uni-trier.de/rec/conf/chi/ConstantL19.html
25. Human Factors International, Enough is enough (Nielsen and Landauer model and critiques): https://www.humanfactors.com/newsletters/enough_is_enough.html
26. Haider et al., miniPXI, CHI PLAY 2022, and the 2024 test-retest study: https://researchr.org/publication/HaiderHJBMENGA22/bibtex https://arxiv.org/html/2407.19516v1
27. Game Experience Questionnaire, repository page: https://game-evaluation.github.io/questionnaires/repository/geq.html

**Designers and postmortems**

28. Ambinder, Valve's Approach to Playtesting, GDC 2009: https://cdn.fastly.steamstatic.com/apps/valve/2009/GDC2009_ValvesApproachToPlaytesting.pdf
29. Game Developer, GDC 2012: 10 tutorial tips from Plants vs. Zombies creator George Fan: https://gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan
30. Game Maker's Toolkit, Super Mario 3D World's 4 Step Level Design (2015): https://youtu.be/dBmIkEvEBtA
31. Nintendo Life, Super Mario 3D Land director shares level design inspirations (2012): https://www.nintendolife.com/news/2012/04/super_mario_3d_land_director_shares_level_design_inspirations
32. Game Developer, Super Meat Boy's McMillen explains why so hard: https://www.gamedeveloper.com/game-platforms/-i-super-meat-boy-i-s-mcmillen-explains-why-so-hard-
33. Vice, Celeste assist mode, and Game Rant on Thorson's Sekiro proposal: https://www.vice.com/en/article/d3w887/celeste-difficulty-assist-mode https://gamerant.com/sekiro-easy-mode-assist-celeste/
34. Inverse, Hades God Mode interview with Greg Kasavin: https://www.inverse.com/gaming/hades-god-mode-interview
35. Tom's Guide, Hades interview with Supergiant (Heat inspired by Ascension): https://www.tomsguide.com/features/hades-exclusive-interview-supergiant
36. Giovannetti, Slay the Spire: Metrics Driven Design and Balance, GDC 2019 (listing and transcript notes): https://gdcvault.com/play/1025731/ https://readray.ai/notes/76667
37. Game Developer, How Slay the Spire's devs use data to balance (2018): https://gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder
38. Wilson and Cheng on Monster Power, PC Gamer interview summary (2012): https://www.diablofans.com/comments/139343
39. Diablo Wiki difficulty archive and repost of Wilson's "doubled" remark: https://www.diablowiki.net/Difficulty_archive https://vgtimes.ru/news/3894-okonchatelnyy-rezhim-inferno-v-diablo-3-vdvoe-slozhnee-chem-na-beta-teste.html
40. Blizzard, Monster Power blog post (2012): https://us.diablo3.com/en/blog/7540457
41. Game Developer, Risk of Rain interview with Paul Morse (2024): https://gamedeveloper.com/design/risk-of-rain-interview
42. PC Gamer, Defense Grid retrospective with Michael Austin: https://www.pcgamer.com/defense-grid-the-beer-game-that-changed-a-genre
43. enter.co, Kingdom Rush interview (Spanish, search snippet): https://www.enter.co/?p=151637
44. Robot Entertainment, Orcs Must Die! Deathtrap: our new loop and progression systems (2024): https://robotentertainment.com/news-archive/2024/8/15/orcs-must-die-deathtrap-our-new-loop-and-progression-systems
45. Robot Entertainment, Challenge accepted: new ways to play (2025): https://robotentertainment.com/news-archive/2025/9/12/challenge-accepted-coming-soon-new-ways-to-play
46. Darley, How to Make Sense of Big Data (King): https://businessofsoftware.org/talks/how-to-make-sense-of-big-data/
47. mobilegamer.biz, How King defines a good Candy Crush level (GDC 2024): https://mobilegamer.biz/how-king-defines-a-good-candy-crush-saga-level-and-why-it-constantly-prunes-the-bad-ones/
48. AP via WTOP, How Candy Crush uses AI (2025): https://wtop.com/national/2025/05/how-candy-crush-uses-ai-to-keep-players-coming-back-to-its-puzzles/
49. Valve, Aghanim's Labyrinth update, 24 July 2020: https://store.steampowered.com/news/63749
50. Game Developer, Rubber banding as a design requirement: https://gamedeveloper.com/design/rubber-banding-as-a-design-requirement

**Patch notes and natural experiments**

51. Engadget, Diablo 3 patch 1.0.3 design preview (2012): https://www.engadget.com/2012/06/06/diablo-3s-patch-1-0-3-design-preview/
52. PC Gamer, Diablo 3 hotfix removes monster damage boost in co-op: https://pcgamer.com/diablo-3-hotfix-removes-monster-damage-boost-in-co-op-inferno-teams-breathe-sigh-of-relief
53. GosuGamers, Diablo 3 patch 1.0.4 official notes, and Engadget details: https://www.gosugamers.net/news/20760-patch-1-0-4-official-patch-notes https://www.engadget.com/2012-08-10-blizzard-releases-details-for-diablo-iiis-big-1-0-4-patch.html
54. PCGamesN, Diablo 3 patch 1.0.5 notes: https://www.pcgamesn.com/diablo/diablo-3-105-patch-notes-detailed
55. Diablo Wiki, Patch 1.0.8, and Engadget (2013): https://www.diablowiki.net/Patch_1.0.8 https://www.engadget.com/2013/04/03/diablo-iii-gets-massive-multiplayer-improvements-in-1-0-8/
56. PC Gamer, Diablo 3 patch 2.0.1 impressions (2014): https://www.pcgamer.com/diablo-3-patch-2-0-1-impressions-harder-better-faster
57. GamesRadar on the Vulnerable nerf, and WePC on "never again" (2023): https://gamesradar.com/diablo-4-season-1-patch-nerfs-vulnerable-to-make-it-less-of-a-hard-requirement-for-builds https://www.wepc.com/news/diablo-4-patch-feedback-heard/
58. Icy Veins, Diablo 4 patch 1.1.1 notes (2023): https://www.icy-veins.com/d4/news/official-diablo-4-patch-1-1-1-notes/
59. ProGameTalk, Sportskeeda and Forbes on Diablo 4 Season 6 difficulty (2024): https://progametalk.com/diablo-4/season-6-difficulty-changes-vessel-of-hatred-expansion/ https://www.sportskeeda.com/mmo/diablo-4-vessel-hatred-how-unlock-torment-difficulty https://www.forbes.com/sites/paultassi/2024/10/04/diablo-4-vessel-of-hatred-review-thatll-do-mephisto-thatll-do/
60. GGRecon and Comicbook on the Escalation of Freedom backlash (2024): https://www.ggrecon.com/articles/helldivers-2-review-bombed-after-escalation-of-freedom-update-nerfs-it-into-oblivion https://comicbook.com/gaming/news/helldivers-2-game-director-responds-to-backlash-over-escalation-of-freedom-update
61. Shacknews notes for 01.001.100 and GamesRadar on the rebound (2024): https://shacknews.com/article/141454/helldivers-2-version-1001100-patch-notes https://gamesradar.com/games/third-person-shooter/the-first-big-helldivers-2-patch-of-arrowheads-60-day-recovery-plan-kicks-off-a-redemption-arc-with-player-numbers-and-reviews-steadily-improving
62. OpenCritic, Helldivers 2 highest player count in a long time: https://opencritic.com/news/16920/helldivers-2-just-hit-its-highest-player-count-in-a-long-long-time
63. The Nerd Stash and Kotaku on Path of Exile 2 0.2.0 (2025): https://thenerdstash.com/path-of-exile-2-review-bombed-for-being-too-hard-game-was-good-before-dawn-of-the-hunt/ https://kotaku.com/path-exile-2-poe-nerfs-patch-notes-dawn-hunt-1851775526
64. PCGamesN and Escapist on Path of Exile 2 0.3.0 (2025): https://www.pcgamesn.com/path-of-exile-2/the-third-edict-hotfix-patch-notes https://www.escapistmagazine.com/news-path-of-exile-2-third-edict-0-3-0b-patch/
65. PC Gamer, Path of Exile 2 first 2025 patch with pinnacle boss respawns: https://www.pcgamer.com/games/mmo/path-of-exile-2s-first-patch-of-2025-is-coming-later-this-week-with-more-rewarding-endgame-mapping-and-the-rollout-of-respawns-when-fighting-pinnacle-bosses
66. Bandai Namco notes for Nightreign 1.01.1, and OpenCritic reaction (2025): https://www.bandainamcoent.com/news/elden-ring-nightreign-patch-notes-version-1-01-1 https://opencritic.com/news/17250/elden-ring-nightreign-s-newest-patch-makes-solo-runs-viable
67. Gematsu, Nightreign Deep of Night (2025): https://www.gematsu.com/2025/08/elden-ring-nightreign-adds-high-difficulty-expedition-mode-deep-of-night-on-september-11
68. PC Gamer, Risk of Rain 2 Seekers of the Storm reception (2024): https://pcgamer.com/games/third-person-shooter/gearboxs-first-risk-of-rain-2-expansion-gets-hammered-on-steam-as-developer-admits-the-pc-version-is-in-a-really-bad-place
69. Hypebeast, Turtle Rock acknowledges Back 4 Blood is too difficult (2021): https://hypebeast.com/2021/11/turtle-rock-studios-back-4-blood-difficulty-fix
70. MP1st notes for Back 4 Blood 1.04, and Mein-MMO (2021): https://mp1st.com/news/back-4-blood-update-1-04-patch-notes-out-for-december-update https://mein-mmo.de/en/back-4-blood-nerfs-all-difficulties-becomes-much-easier,762890
71. Prima Games, Vermintide 2 Winds of Magic review (2019): https://primagames.com/gaming/warhammer-vermintide-2-winds-of-magic-review-not-quite-the-goat
72. Gfinity and Automaton on Monster Hunter Wilds difficulty (2025): https://www.gfinityesports.com/article/monster-hunter-wilds-monsters-are-dropping-too-fast-capcom-needs-to-buff-their-health https://automaton-media.com/en/news/monster-hunter-wilds-update-expands-endgame-content-and-ups-the-difficulty-with-new-9-star-tempered-monsters/
73. EarlyGame and GosuGamers (Stratz data) on Apex Mage (2020): https://earlygame.com/valve-add-a-new-difficulty-level-and-new-heroes-to-aghanims-labyrinth https://gosugamers.net/dota2/news/55659-aghanim-s-labyrinth-the-best-heroes-to-navigate-through-the-apex-mage-tier
74. Wikily, Kingdom Rush 6 patch 1 changelog, and Ironhide balance post: https://wikily.gg/kingdom-rush-6-genesis/patches/patch-1-is-here-read-the-full-changelog https://www.ironhidegames.com/News/Details/456
75. Kotaku, Dota 2's brutal co-op campaign might end some friendships (2017): https://kotaku.com/dota-2s-brutal-co-op-campaign-might-end-some-friendship-1795968100
76. Cybersport.ru, Siltbreaker difficulty reduced (search snippet): https://www.cybersport.ru/news/razrabotchiki-dota-2-umenshili-slozhnost-kampanii-siltbreaker
77. Softpedia, Dungeon Defenders II changelog (search snippet): https://games.softpedia.com/progChangelog/Dungeon-Defenders-II-Changelog-145579.html
78. Hive Workshop, X Hero Siege 3.33 thread (excerpt): https://www.hiveworkshop.com/threads/x-hero-siege-3-33.76776/latest
79. Steam, X Hero Siege: Reborn changelog (excerpt): https://steamcommunity.com/sharedfiles/filedetails/changelog/536682348?p=37
80. Hive Workshop and Softpedia on Wintermaul Redux (2010): https://www.hiveworkshop.com/threads/wintermaul-redux-1-08g.121401/latest https://news.softpedia.com/news/Wintermaul-Redux-149818.shtml
81. OpenCritic, Say goodbye to World Tiers in Diablo 4 Vessel of Hatred: https://opencritic.com/news/7649/say-goodbye-to-world-tiers-in-diablo-4-vessel-of-hatred-with-other-major-changes-in-tow

**Wikis, data and community**

82. Deep Rock Galactic Wiki, Hazard Level and difficulty scaling (rev. 2 Oct 2025): https://deeprockgalactic.wiki.gg/wiki/Hazard_Level
83. Risk of Rain 2 Wiki, Difficulty: https://riskofrain2.wiki.gg/wiki/Difficulty
84. Wikily, Kingdom Rush 6 Genesis difficulty: https://wikily.gg/kingdom-rush-6-genesis/difficulty
85. Wikily, Kingdom Rush difficulty and game modes: https://wikily.gg/kingdom-rush/difficulty https://wikily.gg/kingdom-rush/game-modes
86. Kingdom Rush Wiki, Difficulty, Upgrades, Heroic Challenge and Iron Challenge: https://kingdomrushtd.fandom.com/wiki/Difficulty https://kingdomrushtd.fandom.com/wiki/Upgrades https://kingdomrushtd.fandom.com/wiki/Heroic_Challenge https://kingdomrushtd.fandom.com/wiki/Iron_Challenge
87. Diablo Wiki, Players x and Player Settings (Diablo II): https://diablo2.diablowiki.net/Players_x https://diablo2.diablowiki.net/Player_Settings
88. Blizzard, Diablo 3 game difficulty guide: https://eu.diablo3.com/en/game/guide/gameplay/game-difficulty
89. Vampire Survivors Wiki, Curse: https://vampire.survivors.wiki/w/Curse
90. Vampire Survivors Wiki, Reaper: https://vampire.survivors.wiki/w/Reaper
91. Helldivers Wiki, Difficulties: https://helldivers.wiki.gg/wiki/Difficulties
92. Helldivers Wiki, Reinforcement and Boosters: https://helldivers.wiki.gg/wiki/Reinforcement https://helldivers.wiki.gg/wiki/Boosters
93. w3reforged, Green TD Solo v2.57: https://maps.w3reforged.com/maps/categories/tower-defense-td/green-td-solo
94. thehelper.net World Editor tower defense tutorial: https://world-editor-tutorials.thehelper.net/towerdef.php
95. Curseforge, Wintermaul: The Remake: https://www.curseforge.com/sc2/maps/wintermaul-the-remake
96. Hive Workshop, Hero Survival Omega and Champions Trial (excerpts): https://www.hiveworkshop.com/threads/hero-survival-omega.360648/ https://www.hiveworkshop.com/threads/champions-trial-4-0a.311955
97. Upcomer, Dota 2002 part one, and Lost Media Archive on Aeon of Strife: https://upcomer.com/dota-2002-part-one-moba-evolution/ https://lostmediaarchive.fandom.com/wiki/Aeon_of_Strife_(Lost_Starcraft_Map_1998)
98. w3reforged Island Defense and probablydance on Survival Chaos (pruned PvP maps): https://maps.w3reforged.com/featured-maps/island-defense https://probablydance.com/2020/03/28/a-new-strategy-genre-grows-up-survival-chaos-my-new-favorite-game/
99. Wikipedia, Gauntlet (1985), and arcadecontrols DIP settings thread: https://en.wikipedia.org/wiki/Gauntlet_(1985_video_game) https://forum.arcadecontrols.com/index.php/topic,106364.0.html
100. Switchblade Gaming and gameplay.tips Legion TD 2 guides: https://www.switchbladegaming.com/strategy-games/legion-td-2/beginners-guide-12/ https://gameplay.tips/guides/legion-td-2-advanced-game-guide.html
101. Wikipedia, It Takes Two: https://en.wikipedia.org/wiki/It_Takes_Two_(video_game)
102. Dota 2 Pro Tips patch 7.20, and 7.11 formulas: https://www.dota2protips.com/patches/7-20 https://consolepcgaming.com/the-new-7-11-dota-2-formulas-have-surely-done-the-job
103. Blizzard, Warcraft III Heroes FAQ: https://classic.battle.net/war3/faq/heroes.shtml
104. The Supergiant Run (blog) on Hades run length: https://oyito.substack.com/p/the-supergiant-run-hades
105. GameDev Reports on GameAnalytics benchmarks (vendor-reported): https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks https://gamedevreports.substack.com/p/gameanalytics-benchmarks-in-mobile
106. Fextralife and Nexus Mods on Monster Hunter World multiplayer HP: https://monsterhunterworld.wiki.fextralife.com/Multiplayer https://www.nexusmods.com/monsterhunterworld/mods/6438
107. Revert to Saved, Bashing your head against the difficulty wall (2012): https://reverttosaved.com/2012/08/02/bashing-your-head-against-the-difficulty-wall/

**Tools**

108. PostHog repository: https://github.com/PostHog/posthog
109. Metabase licence: https://www.github.com/metabase/metabase/blob/master/LICENSE.txt
110. Grafana relicensing to AGPLv3 (2021): https://grafana.com/blog/2021/04/20/grafana-loki-tempo-relicensing-to-agplv3
111. GameAnalytics Godot SDK docs: https://docs.gameanalytics.com/integrations/sdk/godot
112. Talo on the Godot Asset Library: https://www.godotengine.org/asset-library/asset/2936
