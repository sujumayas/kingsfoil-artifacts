# 02. Tibia lineage: 1997 to today, as Asterion's direct ancestor

Research agent 8 for Curves #3 (Asterion). Scope: the real Tibia numbers and their history, so the report can
compare Asterion's deliberate divergences (skill mult 1.08 vs 1.1, magic 1.4 vocation-less, exp-only death loss,
bag always drops, 10 % per gear slot) against the source.

Access notes. tibia.com news archive returns 403 to this fetcher and web.archive.org is blocked, so CipSoft's own
teaser texts are cited through TibiaWiki's update pages, which quote them. TibiaWiki (tibia.fandom.com) blocks page
fetches (402) but its MediaWiki API serves wikitext; every wiki claim below was read from the API output of the page
named. Medivia's wiki (wiki.mediviastats.info) did not resolve. No images were downloaded.

Evidence tags: [V] verified from the cited source, [I] inference, [U] unverified or contested, [K] Kingsfoil fact.
Grades E1 data, E2 designer statement, E3 community consensus, E4 anecdote.

---

## Q1. Formulas: exp, skills, magic level, damage, regeneration, speed

**Takeaway.** Tibia's curve is three geometric and polynomial laws that have not changed since the 7.x era:
a cubic exp table, skill tries `A · b^(skill−10)` with the vocation constant b between 1.1 and 2.0, and magic level
`1600 · b^ml` with b 1.1 (mages), 1.4 (paladin), 3.0 (knight). Asterion copies the cubic exactly, copies the shape of
the skill law with b = 1.08 instead of the knight's 1.1, and takes the paladin's magic constant 1.4 for everyone.
What changed over 25 years is not the curves but what feeds them (exercise weapons, potions, offline training) and
what level buys (damage per level, speed per level).

### Cited findings

Exp per level (unchanged since at least 7.x, still live):
- Total exp to be level L: `(50/3)(L³ − 6L² + 17L − 12)`, equivalently `(50L³ − 150L² + 400L)/3` with L−1. Exp
  for the next level: `50(L² − 5L + 8)`. Recurrence `A(x) = 2A(x−1) − A(x−2) + 100`, A(2) = A(3) = 100. [V, E1] [1]
- Values from the formula: L8 4,200; L20 98,800; L50 1,847,300; L100 15,694,800; L200 129,389,800;
  L300 441,084,800. Next-level cost: L8 1,600; L50 112,900; L100 475,400; L200 1,950,400. [V, E1] [1] [2]
- Asterion's `(((L−6)·L + 17)·L − 12)/6 × 100` is the same polynomial (L2 = 100, L8 = 4,200). [K]
- Tibiantis (7.4 revival) publishes the same table: L8 4,200, L20 98,800, L100 15,694,800. [V, E1] [25]

Skills (TibiaWiki "Formula", confirmed against TFS `vocations.xml`):
- Points to the next skill level `P = A · b^(skill − c)`, c = 10 for weapon skills (0 for magic). Total points at a
  skill `Tp = A (b^(skill−c) − 1)/(b − 1)`. [V, E1] [3]
- Skill constants A (same for every vocation): magic 1600, melee 50, distance 30, shielding 100, fishing 20. [V] [3]
- Vocation constants b (TibiaWiki): [V, E1] [3]

| Vocation | Magic | Axe/Club/Sword | Fist | Distance | Shielding | Fishing |
|---|---|---|---|---|---|---|
| None (rookie) | 3.0 | 2.0 | 1.5 | 2.0 | 1.5 | 1.1 |
| Knight | 3.0 | 1.1 | 1.1 | 1.4 | 1.1 | 1.1 |
| Paladin | 1.4 | 1.2 | 1.2 | 1.1 | 1.1 | 1.1 |
| Sorcerer | 1.1 | 2.0 | 1.5 | 2.0 | 1.5 | 1.1 |
| Druid | 1.1 | 1.8 | 1.5 | 1.8 | 1.5 | 1.1 |

- The Forgotten Server (TFS) `vocations.xml` ships the same multipliers, except rookie `manamultiplier` 4.0 (wiki says
  3.0). Knight: fist 1.1, club/sword/axe 1.1, distance 1.4, shielding 1.1, fishing 1.1, mana ×3.0. Paladin distance
  1.1, mana ×1.4. Attack speed 2000 ms for all. [V, E1] [4]
- Shielding counts a try per block, and a player blocks up to two creatures, so in ideal training the shielding
  constant 100 behaves like the melee 50. [V, E3] [3]
- Melee tries: "a blood hit allows you to advance ... for maximal 30 combat tries". Distance: a blood hit is worth
  about twice a blocked shot. [V, E3] [16]
- Magic level: mana to the next ml `1600 · b^ml`; a druid or sorcerer needs 1,600 for ml 1, 1,760 for ml 2. Before
  7.6 mana only counted in 20-point blocks; since wands (7.6) every mana point counts. [V, E1] [3] [16]
- Magic power multiplier for spells: `max(1, (level + 4·ml)/100)`, displayed as percent. [V] [3]

Damage, by version (Peonso's "Game mechanics through time", citing archived TibiaWiki and TibiaNews):
- Pre-8.0 melee: max = `0.06 · skill · weaponAtk · d`, random 0 to max, d = 1 (full attack), 7/10 (balanced),
  1/2 (full defence). Pre-8.0 distance: min `level/5`, max `0.065 · skill · atk · d`. [V, E3] [5]
- 8.1 and later melee: max = `0.085 · skill · atk · d + level/5`, d = 1, 3/4, 1/2. Distance max
  `0.09 · skill · atk · d + level/5` (or a TibiaNews variant with 1/3·atk). [V, E3] [5]
- Spells 7.9 and earlier: `MAGIC_FORMULA = 2·level + 3·ml`, each spell takes a min and max multiplier of it
  (exura 0.08 to 0.33, strikes 0.25 to 0.55, Ultimate Explosion 2.3 to 3.0). [V, E3] [5]
- Update 8.0 (2007) intent: "experience level has less of a influence on damage", weapon damage leans more on skill
  and spells on magic level; knights and paladins got skill-based spells to compensate. [V, E2 via wiki] [6]
- Since 13.05 (18 Oct 2022) base damage and healing per level flattens: +1 per 5 levels to 500, per 6 levels to
  1100, per 7 to 1800, etc. `S = floor((sqrt(2L + 2025) + 5)/10)`. [V, E1] [3]
- Armor reduction min `armor · 0.475`, max `armor · 0.95 − 1` (undated). [V, E3] [5]

Regeneration (7.x values still live, promotion since 6.6):
- Knight 1 HP/6 s and 2 mana/6 s; Elite Knight 1 HP/4 s. Paladin 1 HP/8 s, 2 mana/4 s; Royal 1 HP/6 s, 2 mana/3 s.
  Druid and Sorcerer 1 HP/12 s, 2 mana/3 s; promoted 2 mana/2 s. Promotion costs 20,000 gp, level 20, premium.
  [V, E1] [7] [5]
- 7.6 sped mana regeneration ×4 and rescaled spell costs; 8.1 replaced mana fluids with potions. [V, E3] [5]
- HP/mana/cap per level: knight 15/5/25, paladin 10/15/20, mage 5/30/10, rookie 5/5/10; the sum is 45 per level for
  every vocation. [V, E1] [3]

Speed:
- Player base speed `109 + level` (values halved in 9.8; before that 220 at level 1, +2 per level). Movement
  per tile is quantised to multiples of 50 ms through tile friction; haste `1.3·(base − 40) + 40`, strong haste
  ×1.7. [V, E1] [3] [8]
- Asterion: `280 + 5·(level − 1)` quantised to a 50 ms beat; speed steps only at 5, 12, 20, 31, 45. [K]

### Inferences
- Asterion's cubic and Tibia's are identical, so every hours-to-level estimate below transfers directly once exp/h
  is matched. [I]
- Knight sword b = 1.1 vs Asterion 1.08 (A = 50 for both, 10 → S): total tries to skill 50 are 22,130 (Tibia) vs
  12,953 (Asterion); to 70, 151,741 vs 62,661; to 100, 2,656,011 vs 636,197. At 1,800 hits per hour (one swing
  every 2 s) that is 12 h vs 7 h to 50, 84 h vs 35 h to 70, 1,476 h vs 353 h to 100. Asterion's 1.08 is 4× cheaper
  by skill 100 and 6× by 120, but Asterion halves each rung in the damage formula (`skillRung = 10 + (L−10)/2`), so
  the felt power per hour is close to a Tibia knight's. [I] (computed from [3] and CONTEXT)
- Magic 1.4 for everyone: a Tibia paladin needs 111,702 mana in total for ml 10 and 3.34 M for ml 20; a mage 25,500
  and 91,640. A knight (3.0) needs 47 M for ml 10, which is why knights never cast. Asterion's choice of 1.4 puts
  every player on the paladin's magic curve: spells stay useful, but ml 20+ is a hundreds-of-hours project. [I]
- The 7.x damage law `0.06 · skill · atk` has no level term; level only bought HP, mana, cap and speed. 8.0 added
  `level/5` and 13.05 throttled it. Asterion's "flat mitigation, narrow damage band" sits closer to pre-8.0 than
  to modern Tibia. [I]

### Gaps
- TibiaWiki's skill constants are community-derived; CipSoft never published them. TFS reproduces them from
  observation, not from a leak. [U]
- The 7.x melee formula constant (0.06) is contested in the same thread; others list 0.065 or `((5·skill + 50) ·
  atk)/100`. [U] [5] [9]

---

## Q2. Death penalty history

**Takeaway.** For eleven years (7.x to 8.41, 2002 to spring 2009) death took a flat 10 % of experience, 10 % of
skill tries and spent mana, 100 % of the backpack and 10 % per equipped item, with blessings (7.2) refunding part of
the exp loss and the Amulet of Loss (7.2) saving items. Update 8.41 (April 2009) replaced the flat 10 % above level 23
with a loss that shrinks as a share of total exp (one level at 50, 1.5 at 100, 2.5 at 200), made blessings also
protect items (30/55/75/90/100 %), and priced blessings by level. Twist of Fate (9.4, 2012) insures blessings
against PvP deaths. Asterion keeps the 7.x flat 10 % exp, keeps the bag and 10 % per slot, and drops skill loss.

### Cited findings

7.x rule (the ancestor):
- "From Level 1-23, players lose 10 % of their experience points, skill tries, and spent mana." This is the rule
  that applied to every level before 8.41 and still applies below level 24. [V, E3] [10]
- Item loss without blessings: container (backpack) 100 %, each equipped item 10 %. [V, E3] [10]
- Blessings implemented 7.2 (2003). Five regular blessings from five NPCs across the continent (Thais, Carlin,
  Ab'Dendriel, Kazordoon in two parts, Eremo's island). Before 8.41 each blessing reduced exp loss by 10 %;
  blessings did not protect items. [V, E3] [11] [12]
- Amulet of Loss implemented 7.2, 50,000 gp from Eremo (premium island), prevents item loss, breaks on death,
  replaced the Amulet of Life "which would shield both skills and items". Useless with a red or black skull. [V] [13]
- Dying below level 7 reset a character to level 1 on Rookgaard ("rooking") until the Newhaven update (2025). [V] [10]

Update 8.41, Spring Patch 2009 (teaser "Death Penalty and Blessings", tibia.com news 944, quoted by TibiaWiki):
- "Level 1-24 will still lose 10% of their experience points." From 24 upward the loss shrinks: "A character of
  level 50 will lose 1 level and from then on half a level more every 50 levels" (1.5 at 100, 2 at 150, 2.3 at 180,
  2.5 at 200). [V, E2 via wiki] [12]
- Formula (level 24+): max exp loss `((L + 50)/100) · 50(L² − 5L + 8)`; max skill loss as a share
  `((L + 50) · 50(L² − 5L + 8)) / totalExp`. TFS implements the same line:
  `lossPercent = (tmpLevel + 50) * 50 * (tmpLevel² − 5·tmpLevel + 8) / experience`. [V, E1] [10] [14]
- Blessing exp protection went from 10 % to 8 % each; promotion 30 %; maximum 86 % with 7 blessings and promotion.
  Item protection by blessing count: 1 → 30 %, 2 → 55 %, 3 → 75 %, 4 → 90 %, 5 → 100 %. Container loss
  100/70/45/25/10/0 %, equipment 10/7/4.5/2.5/1/0 %. [V, E1] [10] [11] [12]
- Blessing price by level: `2,000` up to 30; `200·(L − 20)` from 31 to 119; `20,000 + 75·(L − 120)` from 120
  (8.41 announced a flat 20,000 at 120+). Enhanced blessings (Blood and Heart of the Mountain, two extra, premium)
  cost 30 % more. All five regular blessings: 10,000 gp at level 30, 30,000 at 50, 80,000 at 100, 100,000 at 120.
  [V, E1] [11] [12]
- The AoL "will likely be removed at a later time" (8.41 teaser); it never was. [V, E2 via wiki] [12] [13]
- Same patch: stamina cut from 56 to 42 h, with a 50 % exp bonus during the first bonus hour for premium (later
  2 h, then 3 h since 2020), and an in-client exp counter with exp/h and time-to-level. [V] [12] [15]

Later:
- Twist of Fate (9.4, 2012): bought at any temple, price like a regular blessing up to 50,000 at level 270.
  On a PvP death (5 % of damage in the last 5 minutes by a player) only Twist of Fate is lost; regular blessings
  and AoL stay. [V, E3] [17]
- Unfair fight: in PvP, loss scales by victim level over killers' combined level, capped at 80 % reduction. [V] [10]
- Retro Hardcore PvP worlds: penalty +16 %, blessings 6.4 % each. [V] [10]
- Blessing charges (11.30, 2017) bought with Tibia Coins (15 to 25 TC each, 130 TC for all seven) and granted as
  death compensation. Dawnport (10.55, 2014) added the "Adventurer's Blessing": no PvP death penalty below level 21.
  [V] [11]
- Current rule (2026): below 24 flat 10 %; from 24 the 8.41 formula; the Red Skull loses everything regardless. [V] [10]

Player reaction and rationale:
- The 8.41 teaser quoted on TibiaWiki gives the levels-lost table as the explanation; no fuller CipSoft rationale was
  reachable (tibia.com 403, archive blocked). [U, gap]
- Community guides still describe the 8.41 curve in levels ("every 100 levels, a character loses one level more").
  [V, E3] [11]
- Promotion is sold partly as a death-penalty discount ("losing 30 % less experience and skills upon death").
  [V, E3] [7]

### Inferences
- Minutes lost per death. Under 7.x's flat 10 %, loss in levels grows with level: 0.26 levels at 8, 0.64 at 20,
  1.64 at 50, 3.3 at 100, 6.6 at 200 (computed from [1]). Under 8.41: 0.74 at 24, 1.0 at 50, 1.5 at 100, 2.5 at
  200, 3.5 at 300. In hours, with exp/h roughly proportional to the next-level cost, the 7.x penalty grows toward
  several sessions at level 100+, which is where the 2009 change intervened. Asterion's flat 10 % at low levels is
  the 7.x law; its own calibration test (10 min at level 4, 52 min at level 8 on rats) is only the start of this
  curve. By level 50 at Ingwen rates the same rule costs multiple 45-minute sessions. [I] [K]
- The blessing economy is a level-indexed insurance premium: at level 50 the five blessings cost 30,000 gp, about
  the exp loss of one level's hunting profit. CipSoft tuned both the loss and the premium to the level. Asterion
  has no blessing; its only insurance is the Heartstone recall and the free temple heal. [I]
- The 2009 change is a natural experiment in making death penalty sublinear in level without removing it; Tibia kept
  the corpse drop and the skill loss and shrank only the exp share. [I]

### Gaps
- No CipSoft statement on why 8.41 chose "one level at 50, +0.5 per 50". The TibiaWiki quote is the only text.
- No measured player retention before and after 8.41. Forum reaction from 2009 was not reachable (tibia.com forum
  archives are gone).

---

## Q3. Onboarding: Rookgaard, the level 8 gate, Dawnport, Newhaven

**Takeaway.** Tibia has run four beginner islands: Rookgaard (5.2, 1999 era; no vocation, leave at level 8 via the
Oracle), the Island of Destiny (8.2, 2007; choose and test a vocation), Dawnport (10.55, 2014; test all vocations,
leave between 8 and 20, no item loss below 8, forced out at 20), and Newhaven (15.12, Oct 2025; a level-8 door, a
one-way boat, no return). Each step shortened the time to a real vocation and made the first deaths cheaper; the
level 8 gate itself never moved.

### Cited findings
- Rookgaard, implemented 5.2: "newly created players arrive to learn basic Tibia gameplay before progressing to
  the less-forgiving Mainland". Level 8 or 9 talk to the Oracle; some stay forever ("Rookstayers"), which "significantly
  limits a character's potential". A tutorial island (kill cockroaches, fetch branches, change outfit) could be
  skipped with "skip tutorial". [V, E3] [18]
- Island of Destiny, 8.2 (Dec 2007): pick a vocation, get Light and a healing spell plus a starter kit from a chest,
  test it in a vocation dungeon. The Festival of Initiates (9.8, 2012) let players try each vocation's combat.
  Players downgraded to level 5 were returned to Rookgaard. [V, E3] [19]
- Dawnport, 10.55 (Aug 2014 teaser, tibia.com news 2851): "allowing them to test each vocation" by stepping on
  pedestals; swap kits freely; free spells up to level 18 that are removed on leaving; no premium area; leave from
  level 8, forced out at 20 (teleported after 5 minutes); "When you died on Dawnport, you would keep all your items,
  unless you were level 8 or higher". Exp/h 25k (knight) to 55k (sorcerer); 2,000 gp cap carried to the mainland.
  [V, E3] [20]
- Adventurers' Guild (9.80, 2012): a hub reached with an Adventurer's Stone from any temple, with tasks and a
  promotion NPC; the Adventurer's Blessing protects new characters from PvP death penalties until level 21. [V] [21] [11]
- Newhaven (15.12, announced 8 Oct 2025): a village, a trader, a banker, a spell trainer, one hunting ground, and a
  "special level door, only opening for those who have reached level eight" to a one-way boat. "Once adventurers
  leave Newhaven, they can never return." Rooking was removed with it. [V, E2 via wiki] [22] [10]
- Community verdict (weak sources): a fan overview says "new players generally preferred Dawnport for its efficiency,
  while veterans mourned" Rookgaard; a TibiaBR thread proposes reviving Rookgaard's population. [U, E4] [23] [24]
- Modern level-1 and sub-8 population (2009 database, CipSoft community managers): over 500,000 characters at level
  1 and about 1.8 million below level 8 out of 6.54 million; about 1.7 million had no vocation. [V, E1] [26]

### Inferences
- The 2009 numbers are the funnel: 27 % of all characters never left the beginner island. Dawnport (2014) and
  Newhaven (2025) are repeated attempts to move that wall. Asterion's "censo" chain (5 steps, 72 exp each) is a
  Rookgaard-style tutorial; its level 8 equivalent is implicit (Akron 1 to 35). [I]
- Dawnport's "no item loss below 8" is a graded death penalty by level; Asterion's rule (bag always drops, 10 %
  exp from level 1) is harsher than every Tibia start since 2014. [I]

### Gaps
- No CipSoft postmortem on Rookgaard retention. No reachable Dawnport forum reaction beyond fan summaries.

---

## Q4. Skill grinding: training monks and slimes, offline training (2012), exercise weapons (2018)

**Takeaway.** Tibia's skill curve was never changed; the hours per rung were cut by changing the input. Classic
training (two monsters hitting you while you bleed a healing monk or a slime clone) delivered 1 try per 2 s per
attacker. Offline training (9.6, summer 2012) added 12 hours of logged-out training at about 50 % efficiency.
Exercise weapons (11.73, April 2018) sell 3,600 hits for 347,222 gp or 25 TC and finish in 16 min 40 s, two hours of
monster training compressed to a quarter hour.

### Cited findings
- Classic training: knights lure two slimes or a convinced monk; "if a creature moves, it looses about 0.4 seconds";
  "Breaking the shielding" of the monk makes blood hits possible; ghouls are 25 to 30 % slower than monks. Training
  with players ended with the 2013 PvP update. [V, E3] [16]
- Offline training, 9.60 (2012): pick melee + shielding, distance + shielding or ml + shielding at a statue; train
  up to 12 consecutive hours; regenerate 1 s of pool per second online. "Statistics have shown that it works at 50%
  of efficiency of the normal training" and shielding at 25 %. Free accounts capped at skill 50 and ml 30. [V, E3] [27] [28]
- Exercise weapons, 11.73 (24 Apr 2018, tibia.com news 4573): 500 charges, one every 2 s, 16 min 40 s per weapon;
  one melee charge = 7.2 hits so one weapon = 3,600 hits = "2 hours of regular training"; one wand charge = 600 mana,
  a weapon = 300,000 mana; price 347,222 gp or 25 TC; Durable (1,800 charges, 1 h, 1.25 M gp or 90 TC) and Lasting
  (14,400 charges, 8 h, 10 M gp or 720 TC) added Winter 2020. Expert dummies in houses add 10 %. The system "was
  implemented ... to offer Paladins and Knights a quicker way to train their offensive skills by spending Gold, just
  like Sorcerers and Druids can do using Mana Potions". Training weapons (50 charges) come from the daily reward.
  [V, E3] [29] [27]
- Dawnport-era mages train ml by drinking mana potions; a 7.x mage trained by making runes with regenerated mana
  (`a = 1600/(MP per second · 3600)` hours per ml). [V, E3] [3]
- Community reaction to exercise weapons: no large thread found; a fan overview describes a split between
  "convenience" and "competitive integrity of the high-score boards"; a long-time player links the wand era to "mass
  leveling and most of my friends started to bot". [U, E4] [23] [30]

### Inferences
- Tibia's skill-by-use feeling after 2018 is a shop purchase: skill 15 to about 66 from one Lasting weapon (wiki
  calculator claim). The use loop still exists in hunts, but the ladder is bought. Asterion's 1.08 constant is the
  opposite lever: keep skill by use only, make the curve itself 4× shorter by skill 100. [I]
- Offline training is the only Tibia mechanism that fits a 45-minute session: a player who hunts 45 minutes earns
  45 minutes of pool and trains 22 minutes' worth of skill offline. Asterion rejects rested or offline progression,
  which is a stated anti-compulsion stance, so it needs the curve itself to pay out in 45 minutes. [I]

### Gaps
- Botting (pre-2016 ban wave) was the de facto skill accelerator in 7.x to 10.x; no quantified source here.

---

## Q5. The long curve in practice

**Takeaway.** Tibia's population sits at the bottom of the cubic: in 2009, 76 % of 6.54 million characters were at
or below level 20, average level 16.5, 0.04 % above 200. Exp per hour grows roughly with the next-level cost, so
time per level is nearly flat from 50 onward, and the "long curve" is a treadmill with a nearly constant beat.
Party share (2/3 level rule, bonus 20/35/70/100 % by vocation count) and stamina bonus hours, prey (2016) and daily
rewards (2017) are the knobs Tibia added to keep the beat worth hitting. Asterion keeps the party bonus (flat 20 %),
drops daily rewards and prey.

### Cited findings

Level distribution:
- CipSoft database figures via community managers, 2 June 2009: 6.54 million characters; over 500,000 at level 1;
  about 1.8 million below 8; "almost 5 million" at 20 or below; 61,021 at 100+; 2,582 at 200+; 57 at 300+;
  3 at 400+; average level about 16.5; 2.5 characters per account. Knights 1.6 M (83,000 promoted), sorcerers 1.2 M,
  paladins 1.1 M, druids 1.0 M. [V, E1] [26]
- 2024 (MeinMMO, from NabBot's ~700,000 registered characters, a self-selected sample): 36 % at level 200+. [V, E1
  but biased sample] [31]
- Tibiantis (7.4 revival, launched 4 Apr 2020) showed 281 players online at fetch time. [V, E1] [25]

Exp/h anchors:
- Dawnport (levels 8 to 20, 2014+): 25,000 exp/h knight to 55,000 exp/h sorcerer. [V, E3] [20]
- Level 100 in "4 days", 200 in "2 weeks" in a team with boost and prey (TibiaQA, Dec 2023, one answer). [V, E4] [32]
- Modern high level: 1.2 to 1.6 M exp/h at Banuta apes with good ml; 1.3 to 5.5 M/h for level 500+ knights
  (user-uploaded document). [V, E4] [33]
- Experience to go from 100 to 200: 113.7 M; from 200 to 300: 311.7 M (from the table [1]). [V, E1]

Party exp share:
- Shared experience introduced Christmas 2007 (8.1), revamped Summer 2014 from a player proposal. Requirements: the
  lowest level at least 2/3 of the highest, all within 30 fields and one floor, each member contributing in the last
  2 minutes. Bonus by distinct vocations: 1 → 20 %, 2 → 35 %, 3 → 70 %, 4 → 100 %. `Exp = M · S / P · C`.
  [V, E3] [34]
- Asterion: equal split among damage dealers plus a flat 20 %, the one-vocation case. [K]

Retention knobs:
- Stamina (7.8, 2006): 42 h pool; first 3 h at +50 % exp (premium); last 14 h at half exp and no loot; regenerates
  1 min per 3 min offline. [V, E3] [15]
- XP Boost (10.97, 2016 Store): +50 % for 1 hunting hour, 30/45/90/180/360 TC for the five daily purchases. [V] [35]
- Prey (11.02, Winter 2016): per slot a creature from 9 with a bonus of damage +5 to +?, exp +10 % + 3 per value step,
  loot likewise; rerolls free every 20 h or 150 gp per level. Timers drain only while hunting. [V, E3] [36] [3]
- Daily Reward (Summer 2017): a 7-day lane, free rewards include potions, a prey wildcard, a training weapon and a
  10-minute 50 % XP boost; premium 30 minutes; a 5 to 6 day streak doubles regeneration in protection zones.
  "Not taking your daily reward for one or more days does not affect your Reward Lane position." [V, E3] [37] [38]

### Inferences
- Hours to level, two scenarios computed from the exp table. 7.x-era solo rates (assumed 20k/h to 20, 60k/h to 50,
  150k/h to 100, 350k/h to 150, 600k/h to 200, 1 M/h to 300): about 5 h to 20, 34 h to 50, 126 h to 100, 236 h to 150,
  362 h to 200, 673 h to 300. These rates are inferred anchors, not measured; modern Tibia with prey, boosts and
  team hunts is 3 to 10× faster (level 100 in 4 days reported). [I]
- Because exp/h in Tibia scales with level (bigger creatures, area spells), the hours per level after 50 flatten to
  roughly 2 to 4 hours per level for a long stretch; the curve is a ramp in numbers and a plateau in feeling. [I]
- The 2009 distribution says the real curve ends for most players before level 20, which is Rookgaard and the
  first two mainland hunting grounds. Asterion's first world (Akron, 1 to 35) covers exactly that band. [I]
- Tibia's retention knobs (stamina bonus, daily lane, prey timers) all reward logging in every day. Asterion refuses
  them on principle (vision §2.3). The one Tibia knob that rewards the group rather than the calendar is the party
  bonus by vocation count, which Asterion cannot copy because it has no vocations. [I]

### Gaps
- No modern full-population level histogram (TibiaData or GuildStats). The 2009 figures are the only E1 census.
- No 7.x-era exp/h table by level could be fetched; the Reddit guide (2018, MS/ED 8 to 150) returned 403.

---

## Q6. Open Tibia servers and 7.x revivals

**Takeaway.** The OT scene runs on exp stages: a per-level-band multiplier on the same cubic. TFS ships a default
table (1 to 8 ×7, 9 to 20 ×6, 21 to 50 ×5, 51 to 100 ×4, 101+ ×5), and 7.4 revivals choose between a low flat rate
(Tibiantis ×1 with the standard table, Nevila capped at ×5 by vote) and high rates (Tibiara ×10 exp, skills and
magic, Zanera about ×12). The community argument for stages is that a static rate "was either too high or too low";
the argument against is that stages make a server feel less "serious". Tibiantis has run six years at low rate with
a few hundred online, the closest live twin to Asterion's situation.

### Cited findings
- TFS `stages.xml` default: `1-8 ×7, 9-20 ×6, 21-50 ×5, 51-100 ×4, 101+ ×5`, disabled by default (`config
  enabled="0"`); `experienceStages` in config.lua replaces the flat `rateExp`. [V, E1] [39] [40]
- TFS `vocations.xml` reproduces Tibia's skill and mana multipliers (table in Q1); servers change the skill and
  magic rate with `rateSkill` and `rateMagic` on top. [V, E1] [4]
- TFS death: `getLostPercent` uses the 8.41 formula above level 24 (flat 10 % below), minus 30 % for promotion and
  8 % per blessing; skill tries removed as `sumSkillTries · deathLossPercent`; `deathLosePercent` config can replace
  it with a flat value minus 3 for promotion and 1 per blessing. [V, E1] [14]
- Tibiantis: "exact recreation of version 7.4 gameplay", "take you (and us) back to 2004", standard exp table,
  launched 4 Apr 2020, 281 online at fetch; "RPG should not mean being a peaceful player". [V, E2/E3] [25] [41]
- Tibiara (RealOTS engine, 7.4, Feb 2025 beta): ×10 exp, skill and magic, ×1 loot and regeneration. Mysteria (7.4):
  ×1 exp, "after level 100, double EXP is required"; Zanera (Classic-Gaming 7.4): custom formula "almost 12x". [V, E4]
  [42]
- Nevila 7.4 chose its rate by community vote, capped at ×5. [V, E4] [43]
- otland debates: "a static experience rate that was either too high or too low" (for stages); stages "wreck a
  server's seriousness"; a 97-vote poll 69 % for stages; "7.4 low-rate servers are very popular" while recent-version
  servers need high rates; low-rate servers hold players with quests and exploration exp. [V, E3/E4] [44] [45] [46] [47]
- Exordion (7.4-style OT wiki): "blessings protect only experience and skills on death, they do not protect items",
  the 7.x rule. [V, E3] [48]

### Inferences
- Exp stages are a supply-side pacing knob on the exp curve: they compress the cubic's early slope where the 2009
  census says most players quit, and leave the late slope for the core. Asterion has no stages; its equivalent would
  be a per-world multiplier (Akron ×2, Ingwen ×1.5, Gorothland ×1), tunable in one table. [I]
- Tibiantis is the proof that a few hundred players will hold a ×1 7.4 curve for years, but they are self-selected
  veterans with 3-hour sessions. Asterion's five friends with 45-minute sessions are closer to the "stages" camp. [I]

### Gaps
- Medivia's wiki was unreachable; its death rules (reported as 7.x-like with a custom blessing) are unverified. [U]
- RealOTS (2016 to 2018, leaked 7.7 CipSoft binaries) numbers were not fetched.

---

## Q7. Tibia's 3-hour session vs Asterion's 45 minutes

**Takeaway.** Tibia's slowness lives in regeneration (a 7.x knight regenerates 1 HP per 6 s; a mage needed 20
minutes of a life ring for 1600 mana), in travel (five blessings need about 1,225 gp of boats and a continent walk),
and in the exp table itself. Later features cut each: 7.6 mana ×4 and wands, 8.1 potions, 8.41 stamina bonus and
exp counter, mounts (8.70, Winter 2010, +10 speed), XP boosts (2016), prey (2016), daily reward teleport scrolls
(2017), exercise weapons (2018). Modern Tibia is a 1-hour-hunt game because each of those shaved a fixed cost.

### Cited findings
- Regeneration 7.x: knight 1 HP/6 s, mage 1 HP/12 s and 2 mana/3 s; promotion +50 %; 7.6 mana ×4. [V] [7] [5]
- Travel: the five-blessing route "~1225 gp travel money" across boats, steamship and ore wagon. [V, E3] [11]
- Mounts 8.70 (Winter 2010): +10 speed levels. [V] [49]
- Stamina happy hours (8.41, 2009): +50 % exp for the first bonus hour, later 3 hours. Exp counter with exp/h and
  time-to-level in the client (8.41). [V] [12] [15]
- XP Boost (2016): +50 % for one hunting hour, bought with Tibia Coins. [V] [35]
- Exercise weapons: 16 min 40 s replaces 2 hours of training. [V] [29]
- Daily Reward: temple teleport scroll and instant reward access from the Store. [V] [37]

### Inferences
- The 7.x session was long because the fixed costs (walk to the hunt, regenerate between fights, walk back to deposit)
  were paid once per session. Asterion's Heartstone (free recall, 5 min cooldown) removes the walk back; the 2 s
  combat beat and 50 ms tick keep the hunt itself at Tibia speed. The remaining 45-minute enemy is regeneration
  between fights, which Tibia solved with potions (8.1) and Asterion must solve with its own supply rules. [I]
- Every Tibia session shortener after 2009 was also a monetisation point (Store boosts, TC blessings, exercise
  weapons). Asterion gets the session benefit without the shop only if it bakes the shortening into the base rules
  (faster regen, cheaper skill constant 1.08, free recall). [I]

---

## Pattern cards

### Card 1. Flat-percent exp death (7.x law)
- Lineage: Tibia 7.x (10 % exp, skills and mana) → 8.41 (shrinking share above 24) → Asterion (10 % exp only).
- Feeling: Challenge with real stakes; Fellowship when friends escort a corpse run.
- Mechanism: `expLost = 0.10 · totalExp`, level recomputed. Cost in levels `0.1·E(L)/50(L²−5L+8)`: 0.26 at 8,
  1.6 at 50, 3.3 at 100.
- Works: below level 30, where a death is under one session. Breaks: above 50, a death is several sessions and
  players stop fighting at the edge; CipSoft replaced it in 2009.
- Evidence: [V, E3] [10] [12]; natural experiment 8.41 [E2 via wiki].
- Cost S. Knobs: percent, level threshold, promotion and blessing discounts.
- Asterion: live rule. Calibrate in minutes per level band; consider the 8.41 shape (a fixed number of levels per
  band) once Ingwen players pass 50.

### Card 2. Level-indexed insurance (blessings)
- Lineage: Tibia 7.2 (five NPCs, exp only) → 8.41 (also items, price by level) → 9.4 Twist of Fate (PvP rider)
  → 11.30 charges (Store).
- Feeling: Submission (a ritual before each expedition); reduces Challenge anxiety.
- Mechanism: `price(L) = 200·(L − 20)` per blessing between 30 and 120; each blessing −8 % exp loss and a step down
  the item table 100/70/45/25/10/0 %.
- Works: when gold has a sink and travel to the NPCs is itself content. Breaks: when sold for cash (community split).
- Evidence: [V, E1] [11] [12].
- Cost M (NPCs, a flag per character, price table). Knobs: price slope, protection per blessing, whether items are covered.
- Asterion: not present. A single temple blessing priced `200·(L − 20)` that halves gear drop would add a gold sink
  and a pre-expedition ritual without softening the bag drop.

### Card 3. Exp stages (per-band multiplier)
- Lineage: Open Tibia servers (TFS `stages.xml`) → nearly every OT since 2008 → discussed as a knob for 7.4 revivals.
- Feeling: fast Discovery early, Challenge later.
- Mechanism: `expGain = base · mult(level)`, a 5-row table (TFS default 7/6/5/4/5).
- Works: for new servers that must get players past level 20 (the 2009 census wall). Breaks: when the drop between
  stages is felt as a cliff, or when players prize "seriousness" (low-rate 7.4 crowd).
- Evidence: [V, E1] [39]; community split [E3/E4] [44] [45] [46].
- Cost S. Knobs: band edges, multipliers, whether to tie them to worlds instead of levels.
- Asterion: a per-world multiplier (Akron, Ingwen, Gorothland) would be the same mechanism expressed in geography,
  consistent with D147.

### Card 4. Party bonus by diversity
- Lineage: Tibia 8.1 shared exp (2007) → 2014 revamp with vocation bonus 20/35/70/100 %.
- Feeling: Fellowship; makes the mixed party the best party.
- Mechanism: `Exp = M · S / P`, 2/3 level rule, 30-field radius, 2-minute contribution.
- Works: when roles differ. Breaks: with no classes (Asterion), where it would reward nothing.
- Evidence: [V, E3] [34].
- Cost S. Knobs: bonus steps, level ratio, radius.
- Asterion: has the flat 20 %. Could index the bonus to distinct dominant skills (sword, distance, magic) to recreate
  the diversity reward without vocations.

### Card 5. Compressed training input (exercise weapons, offline training)
- Lineage: training monks and slimes (7.x) → offline training 9.6 (2012, 50 % efficiency, 12 h pool) → exercise
  weapons 11.73 (2018, 2 h in 16 min 40 s for 347,222 gp).
- Feeling: Submission; removes grind from the session.
- Mechanism: a consumable or an offline pool that credits tries at a fixed rate.
- Works: for players with little time who have gold. Breaks: when sold for cash (highscore integrity); skill by
  use stops meaning use.
- Evidence: [V, E3] [27] [28] [29].
- Cost S to M. Knobs: tries per charge, price, pool size.
- Asterion: rejected on principle; the 1.08 constant replaces it.

### Card 6. Graded beginner island (Rookgaard → Dawnport → Newhaven)
- Lineage: Rookgaard 5.2 (level 8 gate, no vocation) → Island of Destiny 8.2 → Dawnport 10.55 (test vocations,
  no item loss below 8, exit 8 to 20) → Newhaven 15.12 (one-way level 8 door).
- Feeling: Discovery; a safe Challenge.
- Mechanism: a bounded map with its own death rules and a level door.
- Works: when the exit is one-way and the island teaches the mainland's verbs. Breaks: when veterans can return and
  farm it, or when the island is more generous than the mainland (Dawnport's 55k exp/h).
- Evidence: [V, E3] [18] [19] [20] [22]; funnel [E1] [26].
- Cost M. Knobs: exit level, death rules on the island, carry-out gold cap.
- Asterion: Akron is the island without the door; the censo chain is the tutorial. A "no bag drop until level 8"
  rule would be the Dawnport step.

---

## Glossary additions
- Blessing: a paid, per-death consumable protection against exp, skill and (since 8.41) item loss; price indexed to
  level. Source [11].
- Amulet of Loss (AoL): a 50,000 gp neck item that prevents item loss on death and breaks; 7.2. Source [13].
- Corpse run: returning to your own corpse to recover what dropped before it decays or is looted. Tibia has no
  recovery window for items (dropped loot is open to all); Asterion gives 30 minutes. Source [10], CONTEXT.
- Exp stages: per-level-band multipliers on experience gain, the Open Tibia pacing knob. Source [39].
- Rookgaard gate: the level 8 door out of the beginner island, unchanged from 5.2 to Newhaven. Sources [18] [22].
- Rooking: being reset to level 1 on Rookgaard after dying below level 7 (removed 2025). Source [10].
- Skill tries: the hidden counter behind a skill rung; `A · b^(skill−10)` tries per rung. Source [3].
- Stamina: a 42-hour pool of exp-earning time with a +50 % bonus window and a half-exp tail; 7.8. Source [15].
- Twist of Fate: a blessing that is the only thing lost on a PvP death; 9.4. Source [17].
- Offline training: skill tries credited while logged out, 12-hour pool, about 50 % efficiency; 9.6. Source [27].
- Exercise weapon: a 500-charge consumable worth 3,600 melee hits in 16 min 40 s; 11.73. Source [29].

## See it in action
- Tibia death rules and blessing table: https://tibia.fandom.com/wiki/Death
- Blessing prices by level: https://tibia.fandom.com/wiki/Blessings
- Skill, magic and speed formulas: https://tibia.fandom.com/wiki/Formula
- Dawnport: https://tibia.fandom.com/wiki/Dawnport ; Newhaven: https://tibia.fandom.com/wiki/Newhaven
- Offline training and exercise dummies: https://tibia.fandom.com/wiki/Offline_Training
- Exercise weapons: https://tibia.fandom.com/wiki/Exercise_Weapons
- Party exp share: https://tibia.fandom.com/wiki/Party
- Tibiantis (7.4 revival): https://tibiantis.online/
- TFS exp stages: https://raw.githubusercontent.com/otland/forgottenserver/master/data/XML/stages.xml

## Sources
1. TibiaWiki, Experience Formula. https://tibia.fandom.com/wiki/Experience_Formula
2. TibiaWiki, Experience Table. https://tibia.fandom.com/wiki/Experience_Table
3. TibiaWiki, Formula (skills, magic, damage per level, HP/mana, speed, prey). https://tibia.fandom.com/wiki/Formula
4. The Forgotten Server, data/XML/vocations.xml. https://raw.githubusercontent.com/otland/forgottenserver/master/data/XML/vocations.xml
5. Peonso, "Game mechanics through time", otland. https://otland.net/threads/game-mechanics-through-time.216072/
6. TibiaWiki, Updates/8.0. https://tibia.fandom.com/wiki/Updates/8.0
7. TibiaWiki, Promotion. https://tibia.fandom.com/wiki/Promotion
8. TibiaWiki, Speed. https://tibia.fandom.com/wiki/Speed
9. TibiaQA, how to calculate hits. https://www.tibiaqa.com/24409/how-to-calculate-hits
10. TibiaWiki, Death. https://tibia.fandom.com/wiki/Death
11. TibiaWiki, Blessings. https://tibia.fandom.com/wiki/Blessings
12. TibiaWiki, Updates/8.41 (quotes tibia.com news 944 and 945). https://tibia.fandom.com/wiki/Updates/8.41
13. TibiaWiki, Amulet of Loss. https://tibia.fandom.com/wiki/Amulet_of_Loss
14. The Forgotten Server, src/player.cpp (getLostPercent, death). https://raw.githubusercontent.com/otland/forgottenserver/master/src/player.cpp
15. TibiaWiki, Stamina. https://tibia.fandom.com/wiki/Stamina
16. TibiaWiki, Training. https://tibia.fandom.com/wiki/Training
17. TibiaWiki, Twist of Fate. https://tibia.fandom.com/wiki/Twist_of_Fate
18. TibiaWiki, Rookgaard. https://tibia.fandom.com/wiki/Rookgaard
19. TibiaWiki, Island of Destiny. https://tibia.fandom.com/wiki/Island_of_Destiny
20. TibiaWiki, Dawnport. https://tibia.fandom.com/wiki/Dawnport
21. TibiaWiki, Adventurers' Guild. https://tibia.fandom.com/wiki/Adventurer%27s_Guild
22. TibiaWiki, Newhaven. https://tibia.fandom.com/wiki/Newhaven
23. shapes.inc fan overview, Tibia controversies (unsourced). https://shapes.inc/fandom/tibia/controversies
24. TibiaBR forum, "A Humble Proposal ROOKGAARD". https://forums.tibiabr.com/threads/515140-A-Humble-Proposal-ROOKGAARD
25. Tibiantis Online, home and exp table. https://tibiantis.online/ and https://tibiantis.online/?page=exptable
26. otland repost of tibia.com "Statistics", 2 June 2009. https://otland.net/threads/jun-02-2009-statistics.34540/
27. TibiaWiki, Offline Training. https://tibia.fandom.com/wiki/Offline_Training
28. TibiaWiki, Updates/9.6. https://tibia.fandom.com/wiki/Updates/9.6
29. TibiaWiki, Exercise Weapons. https://tibia.fandom.com/wiki/Exercise_Weapons
30. otland post on the wand era and botting. https://otland.net/goto/post?id=2634199
31. MeinMMO, character sold for about 41,000 euros (NabBot level data). https://mein-mmo.de/en/player-of-a-german-mmorpg-sells-his-character-for-the-equivalent-of-about-41000-euros,1218610
32. TibiaQA, how long would it take to get to a certain level. https://www.tibiaqa.com/34763/how-long-would-it-take-to-get-to-a-certain-level
33. TibiaQA, best hunting side of library (Banuta exp/h). https://tibiaqa.com/6210/what-is-the-best-hunting-side-of-library
34. TibiaWiki, Party. https://tibia.fandom.com/wiki/Party
35. TibiaWiki, XP Boost. https://tibia.fandom.com/wiki/XP_Boost
36. TibiaWiki, Prey. https://tibia.fandom.com/wiki/Prey
37. TibiaWiki, Daily Reward System. https://tibia.fandom.com/wiki/Daily_Reward_System
38. TibiaWiki, Regeneration. https://tibia.fandom.com/wiki/Regeneration
39. The Forgotten Server, data/XML/stages.xml. https://raw.githubusercontent.com/otland/forgottenserver/master/data/XML/stages.xml
40. otland, exp stages configuration threads. https://otland.net/threads/why-doesnt-exp-stages-work.173719/
41. otland, Tibiantis announcement posts. https://otland.net/goto/post?id=2584225
42. otland, Tibiara 7.4 RealOTS engine beta. https://otland.net/threads/usa-7-4-tibiara-realots-engine-7-4-beta-test-world-smooth-client.291088/
43. otland, Nevila 7.4 experience rate vote. https://otland.net/f251/experience-rate-nevila-7-4-a-162672/
44. otland, exp rate discussion (RealOTS static rate). https://otland.net/goto/post?id=2618630
45. otland, experience rates poll. https://otland.net/threads/experience-rates.29446/latest
46. otland, low rate long term vs mid-high rate short term. https://otland.net/threads/low-rate-long-term-v-s-mid-high-rate-short-term.291062/
47. otland, discussion about exp stages. https://otland.net/threads/discussion-about-exp-stages.152476/
48. Exordion wiki, Blessings (7.4-style OT). https://exordion.gitbook.io/exordion-wiki/en/gameplay/blessings
49. TibiaWiki, Mounts. https://tibia.fandom.com/wiki/Mounts
