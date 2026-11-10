# 02. Twin selection and lineage A: the oldest twins

Researcher angle: Gauntlet (1985), StarCraft UMS defense maps, Aeon of Strife, and the Warcraft III custom-map era
(Hero Defense, Hero Siege, the TD lineage, and the PvP maps on the starting list).

Access note. Hive Workshop thread pages returned HTTP 403 to the fetch tool, web.archive.org is blocked for this
agent, and Steam changelog pages returned HTTP 429. Several Hive facts below come from search-result excerpts of
those pages, not a full read. They are marked "(excerpt)". A follow-up with a real browser on Hive Workshop and
EpicWar would close most gaps in this file.

---

## Twin table

Conditions from `CONTEXT.md`. ● same, ◐ partly, ○ different.

| Game (year) | Input: real-time, one hero, positioning | Session: one run, 15-40 min | Randomness low | Failure: run ends | Social: co-op 1-3, own lane, shared loss | Platform: short casual sessions | Verdict |
|---|---|---|---|---|---|---|---|
| Gauntlet (1985, arcade) | ● one hero each, real-time | ◐ endless, ends when coins stop | ● fixed mazes | ○ a coin buys 700 health back | ◐ co-op 1-4, shared screen, no lanes | ◐ arcade, short | Keep as root of co-op horde and the drain clock |
| StarCraft UMS TD (Sunken Defense, Skibi's TD, c. 1998-2002) | ○ builder, no hero | ◐ | ● | ● lives | ◐ co-op | ○ | Prune as a twin. Keep as TD ancestor only |
| Aeon of Strife (SC, c. 2001-02) | ● one hero, lanes | ◐ unknown | ● | ◐ unknown loss rule | ● 4 players vs bots, 3 lanes | ○ | Confirm. Closest early twin for "heroes hold lanes vs AI" |
| WC3 Hero Defense / Hero Siege (X Hero Siege 3.33, Xnd) | ● | ◐ 45-90 min | ● fixed waves | ● base falls, run ends | ◐ 1-8 players, shared base | ○ LAN/Battle.net | Confirm. Strongest twin of the era |
| WC3 Hero Survival (Hero Survival Omega, Champions Trial) | ● | ◐ | ● | ● | ◐ up to 4, auto-scaled | ○ | Extend. Adds bosses every 6 and player-count scaling |
| Wintermaul TD (WC3, c. 2003) | ○ builder | ◐ | ● | ● shared team lives | ● each player owns a lane, shared lives | ○ | Keep as an economy and lives twin, not an input twin |
| Green TD family (Green TD, Green Circle TD, Green TD Solo) | ○ builder | ◐ ~60 waves | ● | ● | ◐ solo or race | ○ | Keep for lobby difficulty and interest |
| Element TD (WC3, 2006+) | ○ builder | ○ 60 waves, long | ● | ● lives | ◐ 1-8, separate boards | ○ | Keep for boss cadence and leak cost |
| Footman Frenzy | ◐ hero plus auto-spawns | ◐ | ● | ○ PvP | ○ team vs team | ○ | Prune. PvP, no AI curve to learn from |
| Survival Chaos | ○ base control, light micro | ◐ | ● | ○ PvP | ○ 4-way FFA | ○ | Prune. Tug-of-war PvP |
| Castle Fight | ○ build-only | ◐ | ● | ○ PvP rounds | ○ team vs team | ○ | Prune |
| Island Defense, Troll and Elves | ◐ | ◐ | ● | ○ asymmetric PvP | ○ 10 vs 1 / hunt | ○ | Prune. The curve is set by a human opponent |
| DotA Allstars | ● same control scheme | ○ 40+ min PvP | ● | ○ | ○ 5v5 | ○ | Prune as a curve twin. Keep as control-scheme source only |

Why the prunes. A PvP map's difficulty is the other team, so it has no authored curve, and the CONTEXT condition
"shared loss to an AI" fails. Builder TDs fail the input condition but share four others (low randomness,
lives as run-ending budget, co-op lanes, fixed waves), so they stay as economy and failure twins.

---

## Q1. Which classic games are structural twins, and why?

**Takeaway.** Two families. WC3 Hero Defense / Hero Siege and Aeon of Strife match the input and social conditions
(one hero per player, co-op versus AI). Wintermaul and the Green / Element TD line match the failure and economy
conditions (shared lives per lane, fixed waves, interest). Gauntlet is the root for co-op horde and a health clock.
The PvP maps on the starting list should leave the twin list.

**Cited findings**
- Aeon of Strife has one team of four players with heroes fighting bots in 3 lanes, 6-8 heroes, six creep
  types per side [V, E3] (Upcomer 2017). Other accounts credit Gunner_4_ever and date it to late 2001-early
  2002 [V, E3] (Dannelly; Lost Media Archive). Eul's WC3 DotA followed in 2003 [V, E3] (Upcomer).
- X Hero Siege is by Sogat. Xnd Hero Siege (Ricola3D, 2019) restarted it from 3.33, the last stable version.
  1-8 players, no AI, 45-90 minutes, host picks difficulty and pick mode at start [V, E2] (Hive excerpt).
- Wintermaul (remake description) gives each player a spawn and lane. Every leak costs the whole team a life,
  and at zero "everyone loses" [V, E2] (Curseforge Wintermaul: The Remake). The original is by Duke Wintermaul
  [V, E3] (Hive Wintermaul Redux excerpt).
- Element TD is an 8-player WC3 map with 60 waves that all must be cleared [V, E3] (Hive excerpt). Evan
  "Karawasa" Hatampour took over from creator Brian Powers in 2006 [V, E2] (Element Studios team page).
  Downloaded over 5 million times across WC3, SC2 and Dota 2 [V, E2, vendor-reported] (Element Studios press).
- Island Defense is 10 Builders versus 1 Titan, ends when one team is destroyed [V, E3] (w3reforged).
  Troll and Elves descends from "Le Traqueur", trolls hunt elves [V, E3] (Hive excerpt). Castle Fight is won by
  rounds between teams [V, E3] (Hive excerpt). Survival Chaos is a tug-of-war strategy mod with light micro
  [V, E4] (probablydance 2020).
- Gauntlet (Atari, Oct 1985) is 4-player co-op. Health drains on its own and a coin revives a dead hero in
  place [V, E3] (Wikipedia).

**Inferences**
- Wintermaul's "own lane, shared lives" is the closest classic match to Hearthguard's "own corridor, shared
  Hearth" [I]. Hearthguard is a Hero Defense with a TD's loss rule.
- Hero Siege's 45-90 minutes is 2-3x Hearthguard's 24-27 min bot run [K] (CONTEXT). The classic maps assumed a
  LAN evening. Hearthguard's browser audience wants the shorter end.

**Gaps**
- No primary rules text for original WC3 Hero Defense maps (the generic "Hero Defense" genre, c. 2003-04).
  Footman Frenzy rules not found. Aeon of Strife's loss rule and leveling unknown.

---

## Q2. How did their difficulty curves work (numbers)?

**Takeaway.** The classic maps tuned difficulty with a small set of global knobs chosen once in the lobby
(HP %, armor %, bounty, XP, gold). Inside the run they used fixed wave tables, a boss every 6 or 10 waves, armor
in steps of 10 waves, and a lives pool where bosses cost more. Few published HP-per-wave formulas survive. The
one tutorial rule is "start low, step up, boss every 10".

**Cited findings**
- Green TD Solo v2.57 (kvickan, June 2020) difficulty table [V, E2] (w3reforged):

  | Mode | Monster HP | Armor | Gold per kill | Score on win |
  |---|---|---|---|---|
  | Easy | 80% | +10% | 1 per 100 pts | pts x level/75 + 3000 |
  | Normal | 90% | +20% | 1 per 105 pts | pts x level/50 + 6000 |
  | Hard | 100% | +40% | 1 per 110 pts | pts x level/25 + 9000 |

  Surviving a level pays 5% of current gold plus 15 x level points. The first player to spawn a level gets the
  same bonus. The page says saving gold "is a must to reach the end, even on easy". Player MezGo is credited as
  first to beat Hard [V, E3].
- Green TD Evolution pays wave-end gold starting at 200 and rising about 10-20 per wave. Leaking a boss costs 10
  lives [V, E2] (Hive excerpt). Green Circle TD Gold picks one of three modes by a voting dialog, and each mode
  changes more than invader life [V, E2] (Hive excerpt). A German overview gives 60 waves for Green TD [V, E3] (GIGA).
- Element TD: a boss every 10 levels [V, E4] (eletd forum, via search). Leaked creeps return to the path start, so
  a leak costs twice [V, E3] (Hive excerpt). One player reports 2% interest and "life towers" that grant a life per
  3 or 9 kills depending on being under or over 50 lives [V, E4] (eletd forum, Crooked, Feb 2016). A 2008 post says
  Extreme in v4.0 mainly changes game speed [V, E4] (eletd forum excerpt).
- The thehelper.net World Editor TD tutorial (2000s) gives the mapmaker rules of the era [V, E3]: bosses every 10
  levels with higher armor and "much more life"; armor steps 3, 5, 7, 9, 12, 15, 18, 20 per 10-level band; about
  20 or fewer creeps per level; spawn every 45 s; game length 30-60 min; scale difficulty down if a team lost half
  its lives before level 11.
- Hero Survival Omega puts bosses at waves 6, 12, 18 and 24 [V, E2] (Hive excerpt). Champions Trial changes
  difficulty automatically by player count, up to 4 [V, E2] (Hive excerpt). Impossible Siege offers five
  difficulty levels [V, E2] (Hive excerpt).
- Gauntlet: 700 health per coin by default DIP setting [V, E4] (arcadecontrols forum, MAME settings); one post says
  600 [U]. Health drains 1 point per second [V, E3] (TV Tropes, fan sites). A ROM revision added a score-driven
  difficulty counter in 16,384-point steps that removes food and speeds monster respawn; it caps around 2.1M and
  resets at 4.2M [V, E3] (Wikipedia, fan wiki). Solo play got less default food, groups got bonus food [U, E4].

**Inferences**
- Green TD Solo spends most of its difficulty range on armor (+10% to +40%) and bounty, not HP (only 80-100%) [I].
  Armor raises effective HP nonlinearly, so the visible HP number stays honest while Hard bites. Hard also pays
  more score, so the mode choice is a bet, not a label.
- The thehelper "half lives lost before level 11" rule is early stat DDA in mapmaker folk practice [I]. It was a
  tutorial suggestion, not evidence that popular maps shipped it.
- Hearthguard's mob HP scale [1.0, 2.3, 4.6, 8.0, 13.0] per chapter plus 7% per wave [K] is steeper per set than
  the classic "armor +2 per 10 waves" steps. The classic maps used many small sets (60 waves) where Hearthguard
  uses 5 big ones.

**Gaps**
- No full HP-per-wave table for Element TD, Wintermaul or X Hero Siege. These sit in the map files (wave data in
  the .w3x object editor) or in-game wave info. Extracting them from a downloaded map would need the Hive pages.
- X Hero Siege difficulty multipliers per mode not found. No player-count HP formula found for any WC3 map.

---

## Q3. What patterns did they start, and how did later versions change them?

**Takeaway.** The classic era started the lobby difficulty pick, the lives budget with weighted leaks, the boss
every N waves, interest on banked gold, and self-called waves with a bonus. Later versions mostly retuned supply
(XP, gold) inside modes rather than enemy stats, added more mode steps, and remade maps that were too easy to lose.

**Cited findings (natural experiments)**
- X Hero Siege 2.0 added an Easy / Normal / Hard / Extreme difficulty system and removed the other map variants
  [V, E2] (Hive excerpt). A reviewer called Extreme 4+ on random mode the source of replay value [V, E4] (Hive excerpt).
  Xnd changed boss spell immunity to resistant skin [V, E2] (Hive excerpt).
- X Hero Siege: Reborn (Dota 2 port) raised Easy global XP from 100% to 125% and Hard global gold from 80% to 90%
  [V, E2] (Steam changelog 536682348, excerpt; date not read). Both are supply changes. Neither touched enemy stats.
- Wintermaul Redux was made for players who disliked that in the original "the only way to lose is to lag out"
  [V, E2] (Hive Wintermaul Redux excerpt; Softpedia 2010, 9 players). A remake fixed a curve that was too flat to
  produce loss.
- Gauntlet's score-driven difficulty counter was a ROM update, a stat-and-supply ramp keyed to score [V, E3]
  (Wikipedia). The arcade design kept the game endless to raise coin drop [V, E3] (Wikipedia).

**Inferences**
- Lobby difficulty spread because WC3 had no matchmaking. The host's pick is player-steered difficulty set once [I].
  Hearthguard can copy the cheap part (one pick, a few global multipliers) without lobby friction.
- When mapmakers retuned modes, they reached for XP and gold first. This keeps enemy rosters and wave tables
  fixed, which matches Hearthguard's rule that the director never adjusts stats [I, K].

**Gaps**
- No changelog with before-and-after win rates. WC3 maps had no telemetry. Evidence is mostly E2 rationale and E3/E4
  player reaction. Interest's origin map (Green TD vs earlier SC TDs) is not pinned down.

---

## Pattern cards

### P1. Lobby difficulty pick (host or vote, set once)
- Lineage: Gauntlet operator settings and ROM difficulty counter (1985) -> WC3 host pick in X Hero Siege 2.0
  (Easy to Extreme) and Green Circle TD Gold's voting dialog -> Reborn retunes modes by XP/gold -> ascension
  ladders in modern games (see lineage B). Why: no matchmaking, mixed-skill lobbies.
- Feeling: autonomy (SDT) and Challenge. On Hard, fiero ("first to beat Hard" leaderboards).
- Mechanism: one table, 3-4 rows, columns for enemy HP %, armor %, bounty, XP %, score multiplier. Green TD Solo
  row values above.
- Works when the run is short enough to replay on another mode. Breaks when modes only scale HP (sponge feel) or
  when a group must agree and the weakest player is outvoted.
- Evidence: [V, E2] Green TD Solo table; [V, E2] X Hero Siege 2.0 and Reborn changes (excerpts); [V, E2] Green
  Circle TD Gold vote (excerpt).
- Cost: S. Knobs: HP %, armor/damage-reduction %, gold %, XP %, score multiplier.
- Hearthguard: add a pre-run pick with 3 rows. Prefer moving XP and gold (supply) over mob HP, like Reborn. For
  Hard, raise mob attack against the Hearth rather than HP, since every bot loss is the Hearth falling [K].

### P2. Lives budget with weighted leaks
- Lineage: StarCraft UMS TDs -> Wintermaul (shared team lives per lane) -> Green TD Evolution (boss leak = 10
  lives) -> Element TD (leaks loop back, life towers refund lives).
- Feeling: tension that builds over a run. A leak is information, not instant loss.
- Mechanism: a team pool L; each leaking unit costs w (1 for normal, 5-10 for boss). Optional refund source.
- Works with fixed waves where players can read which leak cost what. Breaks when the pool is so large the game
  cannot be lost (Wintermaul original, per the Redux rationale).
- Evidence: [V, E2] Curseforge Wintermaul remake; [V, E2] Green TD Evolution excerpt; [V, E3/E4] Element TD.
- Cost: S. Knobs: L, w per unit class, refund rate.
- Hearthguard: the Hearth's 6,500 HP is a lives pool [K]. Show it as leak cost by mob class ("elite hit = X") and
  scale it per chapter, since mob attack grows 5.9x while the Hearth stays flat [K].

### P3. Boss every N waves
- Lineage: thehelper TD tutorial (every 10) -> Element TD (every 10) -> Hero Survival Omega (6, 12, 18, 24) ->
  standalone Hero Siege (every 6th).
- Feeling: a peak that frames the set. Fiero on a kill. Gives the sawtooth (set = N waves) its top.
- Mechanism: wave index mod N = 0 spawns a boss with higher armor and much more life; bosses use their own
  difficulty variable.
- Works with a clear relief beat after. Breaks if bosses scale with the same multiplier as trash and outgrow the
  power curve.
- Evidence: [V, E3] thehelper; [V, E4] eletd forum; [V, E2] Hero Survival Omega excerpt.
- Cost: S. Knobs: N, boss HP and armor multiplier, separate scale table.
- Hearthguard: already a boss every 6 waves [K]. Copy the tutorial rule of a separate boss scale table, so
  chapter multipliers do not compound into boss HP.

### P4. Interest on banked gold
- Lineage: SC/WC3 TDs -> Green TD Solo (5% of current gold per level survived) -> Element TD (2%, per forum).
- Feeling: Expression and a save-or-spend decision every wave.
- Mechanism: at wave end, gold += rate x gold, often capped.
- Works when spending converts to power in a known way. Breaks when players already under-spend: interest pays them
  to hoard.
- Evidence: [V, E2] Green TD Solo; [V, E4] Element TD forum.
- Cost: S. Knobs: rate, cap, timing.
- Hearthguard: do not add. Bots already lose with 13k-25k gold unspent [K]. If anything, invert it: a campfire
  "use it or lose it" sink. Recorded here as an anti-pattern for this build.

### P5. Self-called waves with a bonus
- Lineage: Green TD Solo (press G to spawn; first spawner gets the survival bonus) -> modern TD "call early" buttons.
- Feeling: player-steered tempo; greed versus safety.
- Mechanism: early call pays a bonus equal to or scaled by time skipped.
- Evidence: [V, E2] Green TD Solo.
- Cost: S. Knobs: bonus per second, cap.
- Hearthguard: already has Space for 2 gold per second skipped [K]. Classic lineage confirms it.

### P6. Drain clock (health as a timer)
- Lineage: Gauntlet (1 health per second, 700 health per coin) -> later run timers.
- Feeling: urgency even in empty rooms; co-op sharing of food.
- Mechanism: constant HP drain plus pickups; a score-driven counter removes food and speeds respawns, capped.
- Breaks when retry is cheap (coins) and so failure stops mattering.
- Evidence: [V, E3] Wikipedia, TV Tropes; [V, E4] MAME settings post; 600 vs 700 [U].
- Cost: S. Knobs: drain rate, pickup value.
- Hearthguard: the road fires and "the dark" already act as a supply clock [K]. Gauntlet's counter suggests
  linking the dark to progress, which chapters 4-5 already do.

### P7. Armor steps per band, HP honest
- Lineage: thehelper tutorial (armor +2-3 per 10 waves) -> Green TD Solo modes (+10/20/40% armor, HP 80-100%).
- Feeling: steady ramp that players feel without a jump in the visible HP bar.
- Mechanism: piecewise-constant armor per set; HP scales gently.
- Evidence: [V, E3] thehelper; [V, E2] Green TD Solo.
- Cost: S. Knobs: armor per band, band length.
- Hearthguard: a candidate to soften the per-chapter HP jumps (x2.3 then x2.0) by moving part of the rise into
  damage reduction, which the execute line (8%) partly offsets [K, I].

---

## Fun hypotheses and anti-patterns

- Hypothesis: a co-op group choosing "Hard" in a 3-row pick should feel the choice at minute 2 (first Horde), when
  the XP and gold rows show up as a slower first talent [I].
- Anti-pattern: a lives pool that cannot run out (Wintermaul original) produces runs that end only by quitting [V, E2].
- Anti-pattern: interest in a game where players already hoard (P4) [I, K].
- Anti-pattern: 45-90 minute sessions from Hero Siege. Too long for Hearthguard's browser audience [I].

## Glossary additions

| Term | Meaning | Source |
|---|---|---|
| Leak | An enemy that reaches the defended goal, costing lives or goal HP. | WC3 TD practice |
| Lives budget | A shared pool of leaks allowed before the run ends; leaks can be weighted by enemy class. | Wintermaul, Green TD |
| Lobby difficulty pick | A difficulty mode chosen once by the host or a vote before play. | X Hero Siege, Green Circle TD |
| Interest | A wave-end payout proportional to banked gold. | Green TD Solo, Element TD |
| Builder | A player unit that only builds towers; the TD alternative to a hero. | WC3 TD practice |
| Drain clock | Health that falls on its own, turning HP into a timer. | Gauntlet |

## Sources

- CONTEXT and Hearthguard facts: `studies/curves-hearthguard/notes/CONTEXT.md` [K]
- Green TD Solo v2.57 (difficulty table, interest): https://maps.w3reforged.com/maps/categories/tower-defense-td/green-td-solo
- Green TD Evolution (excerpt, 403 on fetch): https://www.hiveworkshop.com/threads/green-td-evolution-v2-05.249982/
- Green Circle TD Gold (excerpt): https://www.hiveworkshop.com/resources/green-circle-td-gold-v1-8.9764
- GIGA TD overview (60 waves): https://www.giga.de/tipp/die-beliebtesten-tower-defense-maps-im-ueberblick-warcraft-3-reforged/
- thehelper World Editor TD tutorial: https://world-editor-tutorials.thehelper.net/towerdef.php
- Element TD Survivor thread (excerpt): https://www.hiveworkshop.com/threads/element-td-survivor-4-3b.125024/latest
- Element TD insane run, Crooked, Feb 2016: https://forums.eletd.com/topic/95279-example-run-how-to-beat-insane-difficulty
- Element Studios team page: https://www.eletd.com/team
- Element TD 2 press release (vendor figure): https://element-studios.prezly.com/element-td-2-launches-into-early-access-to-rave-reviews
- Wintermaul: The Remake (SC2): https://www.curseforge.com/sc2/maps/wintermaul-the-remake
- Wintermaul Redux (excerpt): https://www.hiveworkshop.com/threads/wintermaul-redux-1-08g.121401/latest
- Wintermaul Redux, Softpedia 2010: https://news.softpedia.com/news/Wintermaul-Redux-149818.shtml
- Wintermaul history post: https://ppmforums.com/topic-2792/welcome-to-wintermaul-wars-x-an-open-source-project/
- X Hero Siege 3.33 (excerpt): https://www.hiveworkshop.com/threads/x-hero-siege-3-33.76776/latest
- Xnd Hero Siege 1.51 (excerpt): https://hiveworkshop.com/threads/xnd-hero-siege-1-51.316255/page-3
- X Hero Siege: Reborn changelog (excerpt, 429 on fetch): https://steamcommunity.com/sharedfiles/filedetails/changelog/536682348?p=37
- Hero Survival Omega (excerpt): https://www.hiveworkshop.com/threads/hero-survival-omega.360648/
- Champions Trial (excerpt): https://www.hiveworkshop.com/threads/champions-trial-4-0a.311955
- Impossible Siege (excerpt): https://www.hiveworkshop.com/threads/impossible-siege-v2-16.199605
- Aeon of Strife, Upcomer 2017: https://upcomer.com/dota-2002-part-one-moba-evolution/
- Aeon of Strife, Dannelly: https://daviddannelly.artstation.com/blog
- Aeon of Strife, Lost Media Archive: https://lostmediaarchive.fandom.com/wiki/Aeon_of_Strife_(Lost_Starcraft_Map_1998)
- Island Defense: https://maps.w3reforged.com/featured-maps/island-defense
- Troll and Elves (excerpt): https://www.hiveworkshop.com/threads/troll-vs-elves-v4-7-b5-5.207999
- Castle Fight (excerpt): https://www.hiveworkshop.com/threads/castle-fight-1-30.241772/latest
- Survival Chaos, probablydance 2020: https://probablydance.com/2020/03/28/a-new-strategy-genre-grows-up-survival-chaos-my-new-favorite-game/
- StarCraft TD maps: https://www.gamerevolution.com/features/345125-5-starcraft-custom-maps-kept-playing-years
- Gauntlet (1985), Wikipedia: https://en.wikipedia.org/wiki/Gauntlet_(1985_video_game)
- Gauntlet DIP settings post: https://forum.arcadecontrols.com/index.php/topic,106364.0.html
- Gauntlet 600 health post: https://forums.atariage.com/topic/238273-dark-chambers-to-gauntlet-conversion/page/3/
- Gauntlet, TV Tropes: https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/Gauntlet

See it in action: Green TD Solo page (above), Island Defense page (above), Gauntlet Wikipedia (above), Wintermaul
remake page (above). No video pages collected; add in gap round.
