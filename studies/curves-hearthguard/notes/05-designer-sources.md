# 05 Designer sources (E2 evidence)

Angle: what the designers of Hearthguard's twins said about how they built and tuned difficulty, learning and
power curves. Every claim is marked **intent** (what the designer meant to do) or **measured** (an outcome
someone counted or observed). Already covered elsewhere and cited only by reference: L4D director numbers,
Hades God Mode numbers, Risk of Rain 2 difficulty formula, PvZ onboarding tips (see `00a`, `00b`).

Tool budget used: 30 calls. Several primary pages (PC Gamer, Tom's Hardware, Softpedia, Diablo Wiki) came back
truncated or 403. Where a quote reached me only through a search excerpt or a fan-site repost, the tag says so.

---

## Q1. How did designers set the top of the difficulty curve?

**Takeaway.** The one designer who calibrated a hard tier on testers and then multiplied it (Diablo 3 Inferno)
had to cut it twice in five months and bolt on a player-chosen ladder. Every later twin ships the top end
as an opt-in ladder unlocked by a clear, with rewards that rise per rung. Hearthguard should never ship a
"testers found it hard, so double it" tier.

### Cited findings

- **Diablo 3 Inferno, the doubled tier (intent).** Jay Wilson (game director, Blizzard) said in 2012 that a
  hardcore internal group set the bar for Inferno, then the team doubled it, expecting players to outskill
  testers. [U, E2] The wording comes through reposts of an IGN interview, not the primary page.
  Diablo Wiki archive https://www.diablowiki.net/Difficulty_archive ;
  Russian repost https://vgtimes.ru/news/3894-okonchatelnyy-rezhim-inferno-v-diablo-3-vdvoe-slozhnee-chem-na-beta-teste.html
- **Inferno was cut, then replaced by a dial (measured as a natural experiment).** Blizzard reduced Inferno
  in patches 1.0.3 and 1.0.4 (mid 2012), then shipped Monster Power in 1.0.5 on 16 October 2012. [V, E2]
  https://di.diablowiki.net/V1.05_patch ; https://www.tomshardware.com/news/Blizzard-Diablo-Patch-Inferno,17627.html
  (Tom's Hardware headline "Reducing ... Inferno Difficulty...Again"; body truncated, so no per-act percentages here.)
- **Monster Power rationale (intent).** Wilson and Wyatt Cheng framed it as "more difficulty for those who want
  it" and said players should "find their own balance between challenge, speed, and drops". It is not meant to
  be "a necessary difficulty" to finish. Level 0 is easier than the old setting with the same drops; there
  are no achievements tied to the level. [V, E2] PC Gamer interview, 22 Sept 2012, summarised at
  https://www.diablofans.com/comments/139343 (primary https://www.pcgamer.com/diablo-3-patch-1-05-interview-with-jay-wilson-and-wyatt-cheng was truncated).
- **Monster Power structure.** Off by default, levels 1-10, per hero and per difficulty, raises monster health
  and damage with rising XP, gold and magic find. Solo and private games only at launch. [V, E2]
  Blizzard blog https://us.diablo3.com/en/blog/7540457 ; https://gamebanshee.com/wh9d
  Per-level multipliers: not retrieved (gap).
- **Hades Heat descends from Slay the Spire Ascension (intent).** Greg Kasavin (Supergiant) named Slay the
  Spire's Ascension as the inspiration for the Pact of Punishment. [V, E2 via search excerpt; page body
  truncated] https://www.tomsguide.com/features/hades-exclusive-interview-supergiant
  Supergiant added Weapon Aspects as rewards to pull players into optional Heat. [V, E3, journalist summary]
  https://www.pcgamer.com/uk/a-journey-through-early-access-helped-make-hades-a-masterpiece/
- **Slay the Spire balances on base difficulty (intent).** Anthony Giovannetti (Mega Crit, GDC 2019) said the
  game was balanced mainly around base difficulty, with 20 Ascension levels unlocked one at a time on top.
  [V, E2] Transcript notes https://readray.ai/notes/76667 ; talk listing https://gdcvault.com/play/1025731/
- **Aghanim's Labyrinth Apex Mage (intent).** Valve added a fifth tier above Grand Magus, unlocked only after
  clearing Grand Magus. Normal rooms carry four modifiers and elite rooms five. [V, E3, press summary of
  Valve's update] https://dotesports.com/dota-2/news/valve-adds-three-new-heroes-and-higher-difficulty-to-aghanims-labyrinth ;
  https://afkgaming.com/dota2/news/4820-3-new-heroes-have-been-added-to-aghanims-labyrinth
  Apex Mage has the fewest recorded games of any tier (measured, community stats). [V, E3]
  https://www.gosugamers.net/dota2/news/55659-aghanim-s-labyrinth-the-best-heroes-to-navigate-through-the-apex-mage-tier
- **Helldivers 2 Super Helldive (intent).** Arrowhead added difficulty 10 in the Escalation of Freedom update
  (August 2024), described as for "the most experienced and skilled" players. Access required clearing a
  difficulty 9 mission first. [V, E3] https://www.techradar.com/gaming/consoles-pc/helldivers-2s-escalation-of-freedom-update-adds-a-new-difficulty-level-enemies-and-a-swamp-world
- **Deep Rock Galactic Rogue Core (intent).** Ghost Ship's Aaron Hathaway (marketing, May 2026) said Rogue Core
  starts "close to the 'Hazard 3' experience" and scales up. [V, E2, marketing role] Source surfaced through
  search; DRG hazard numbers themselves are in `00b` (https://deeprockgalactic.wiki.gg/wiki/Hazard_Level).

### Inferences

- [I] The Inferno story is the clearest designer-side case of a spike set by insiders. Testers who play daily
  are the floor of skill for an expert, but the ceiling for a casual. Hearthguard's collective of about 5 is
  exactly that kind of insider group.
- [I] The ladder pattern carries three features across Diablo 3, Slay the Spire, Hades, Aghanim and Helldivers 2.
  It is opt-in, gated behind a clear of the tier below, and pays more per rung. Diablo 3 added it after launch;
  the others shipped with it.

### Gaps

- No primary transcript of Wilson's "doubled" remark. No per-act Inferno nerf percentages. No Monster Power table.
- No Blizzard Reaper of Souls (Torment levels) design talk found in budget.
- No Ghost Ship designer (not marketing) statement on Hazard 5 or the Hazard 6 / Hazard 5+ addition.

---

## Q2. How did designers use metrics to tune curves?

**Takeaway.** The designer talks agree that per-item and per-tier metrics are worth collecting, and that the raw
numbers lie when the sample is skewed or when acquisition timing hides strength. None of the sources I reached
publishes a win-rate-by-floor chart. Hearthguard's telemetry is already richer than what Mega Crit described.

### Cited findings

- **What Mega Crit logged (intent, describing their system).** The metrics server recorded one record per run,
  on death or victory, covering enemies, cards, relics, events, starting choices and run time. [V, E2]
  https://readray.ai/notes/76667
- **Metrics lie, case 1, timing (measured).** The card Madness showed up in winning decks at a "grossly
  disproportionate rate". Most copies came from a late Act 3 event just before the boss, so it rode on decks
  already strong enough to get there. [V, E2] https://readray.ai/notes/76667
- **Metrics lie, case 2, sample skew (measured).** Two "super playtesters" with thousands of runs dominated early
  data, so the team was "basically just sampling those two people". [V, E2] https://readray.ai/notes/76667
- **Slice by tier (intent).** Data was sorted by Ascension level for targeted changes per audience. [V, E2]
  https://readray.ai/notes/76667
- **Metrics miss boredom (intent).** Optimal but boring strategies, such as farming healing, were found through
  feedback and streamers, not metrics, and nerfed. Over 18,000 pieces of Discord feedback were collected over
  a little over a year of early access. The daily modifier Brewmaster was removed as "no fun". [V, E2]
  https://readray.ai/notes/76667
- **Valve tuned Aghanim's Labyrinth by selection rate (measured then acted on).** The 24 July 2020 update buffed
  or removed shards with "low selection or efficacy rates", made 14 encounters easier and 4 harder. [V, E2,
  official patch note] https://store.steampowered.com/news/63749
- **Risk of Rain was tested mainly to balance the difficulty system (intent).** [V, E3, encyclopedia summary]
  https://en.wikipedia.com/wiki/Risk_of_Rain

### Inferences

- [I] The Madness lesson maps directly onto Hearthguard talents. A talent picked at level 16 or 20 will look
  strong in win-rate tables because only strong runs reach it. Compare talents within a row, not across rows.
- [I] With 5 testers, the super-playtester skew is the default state. Report per-player medians before pooled
  rates, and keep the seeded `sim_bot` as the unskewed floor.

### Gaps

- The GDC 2019 talk as transcribed gives no win rate by floor and no per-card numbers. The claim that Mega Crit
  tracks per-card win and pick rates across "millions of runs" comes only from a secondary site and stays [U].
  https://saschb2b.github.io/game-mechanics/games/slay-the-spire/design-tensions

---

## Q3. How did designers shape the early curve and the cost of a mistake?

**Takeaway.** Two tower-defense designers built difficulty range into the map instead of a menu. Defense Grid let
leaked enemies carry a core back along the path, so a mistake could be undone. Valve flattened the early-act
ramp of its harder tiers to match the easy tiers' shape. Both keep the run alive after a mistake.

### Cited findings

- **Defense Grid's recoverable leak (intent).** Michael Austin (Hidden Path) described aliens that pick up a core
  and walk it back, giving "a second chance". Experts let no alien touch a core; beginners could be proud of
  one core left. It "gave a wide range of challenge within a single map". [V, E2 via search excerpt; page
  body truncated] https://www.pcgamer.com/defense-grid-the-beer-game-that-changed-a-genre
  See it in action https://en.wikipedia.com/wiki/Defense_Grid:_The_Awakening
- **Aghanim's Labyrinth curve matching (intent, patch note).** Sorcerer and Grand Magus Acts 1 and 2 enemies
  gain health and damage more slowly, "better matching the curve in Apprentice and Magician". Act 3 unchanged.
  24 July 2020. [V, E2] https://store.steampowered.com/news/63749
- **Ironhide on Junkworld (intent).** Leonardo Clavijo (Ironhide, 8 Dec 2023) said the curve aimed at an "easy
  first-time experience", adding challenge with each new terrain, plus four selectable difficulty modes. Kingdom
  Rush was "an important source of inspiration"; ideas included shorter stages and faster waves. [V, E2]
  https://www.pocketgamer.com/junkworld/interview/
- **Kingdom Rush difficulty is an HP dial (measured, wiki).** Casual enemies have 80% HP, Veteran 120%; one set
  of stars per stage regardless of difficulty. [V, E3] https://kingdomrushtd.fandom.com/wiki/Difficulty ;
  https://steamcommunity.com/app/2849080/discussions/0/597389486013310630
- **Ironhide's early design goal (intent).** Alvaro Azofra (2013) said they wanted players "involved, busy",
  unlike tower defense where you set up and watch. Balancing tower defense was "uncharted territory" for a team
  of 3. [V, E2] https://www.kodeco.com/30636/top-developer-interviews-ironhide-game-studio

### Inferences

- [I] Hearthguard's Hearth is a single 6,500 HP bar [K], so every leak is permanent damage until the campfire
  returns half. Defense Grid shows a cheaper fix for chapters 3-5 than raising Hearth HP. Make a leak
  recoverable for a few seconds.
- [I] Aghanim's fix is the inverse of Hearthguard's current shape. Hearthguard's harder chapters ramp faster
  (mob attack x4.4 by chapter 5 [K]); Valve chose to keep the early-act ramp similar across tiers and put
  the extra in the last act.

### Gaps

- No Ironhide statement on how stars or Veteran were tuned. No Kingdom Rush postmortem found.
- No Orcs Must Die postmortem or GDC talk found (search returned reviews only). No Dungeon Defenders postmortem
  found in budget. No PixelJunk Monsters source.

---

## Q4. How did designers tie difficulty to time and to the player's own choices?

**Takeaway.** Hopoo's designers frame the Risk of Rain timer as a trade the player owns. Every minute spent looting
buys power and costs difficulty. This is the designer's view of the formula already in `00b`.

### Cited findings

- **Time versus power trade (intent).** Paul Morse (Hopoo, 11 April 2024) said hunting every item "will cost you in
  time and enemy difficulty", while rushing risks being "underprepared for the boss fight". He aims to "match and
  balance the amount of player skill and player luck". [V, E2] https://gamedeveloper.com/design/risk-of-rain-interview
- **Origin in tower defense (intent).** Duncan Drummond and Morse first imagined a tower defense where attacker
  difficulty rose with distance from the defense point; a workaround became the timer. [V, E3, encyclopedia
  summary of interviews] https://en.wikipedia.com/wiki/Risk_of_Rain
- Formula and numbers: see `00b` (https://riskofrain2.wiki.gg/wiki/Difficulty). Not re-researched.

### Inferences

- [I] Hearthguard already has this trade in miniature. Space calls the next wave early for 2 gold per second
  skipped [K]. The timer is the skeleton of player-steered difficulty; the bot data (13k-25k gold unspent [K])
  says the gold side of the trade is not yet worth taking.

---

## Q5. How did designers handle power fantasy versus challenge?

**Takeaway.** Helldivers 2 is a live natural experiment. After months of weapon nerfs, Arrowhead buffed nearly
everything, players called the top tier too easy, and the creative director answered by promising a new tier
rather than nerfs. Buff the power curve, then add difficulty on top as an opt-in rung.

### Cited findings

- **The buff patch (measured reaction).** On 17 September 2024 Arrowhead shipped its "largest patch yet",
  buffing many weapons and Stratagems. Some players said it made the game too easy; the Destructoid writer won
  about half his missions after it. [V, E3] https://www.destructoid.com/some-helldivers-2-players-feel-game-needs-a-higher-difficulty-after-the-buff-patch-and-the-cco-agrees/
- **Designer response (intent).** Johan Pilestedt (CCO and creative director) replied "I agree!" on X the same day
  to a player asking for a harder mode. [V, E2, social post] same source.
  Per VideoGamer, the plan was to raise the top end "without enforcing a challenge through nerfs". [V, E3]
  https://www.videogamer.com/?p=1106958
- **CEO view (intent).** Shams Jorjani said on Discord that difficulty had reached a limit at the top end. [U, E2,
  snippet only] https://www.pcgames.de/Helldivers-2-Spiel-74479/News/Entwickler-wollen-Schwierigkeitsgrad-anders-erhoehen-1479301/
- **Vampire Survivors.** No poncle interview on the power curve found. The only commentary is a journalist calling
  the power rush something that "shades into a sort of bloated boredom" (Vampire Crawlers). [V, E4]
  https://www.avclub.com/game-theory-vampire-crawlers

### Inferences

- [I] Hearthguard's hero-vs-mob ratio slides from 1.0 to 0.6 [K]. Helldivers 2 suggests fixing that by raising
  hero power, then giving the collective a harder named rung, rather than nerfing mobs per chapter.

### Gaps

- Exact Helldivers 2 patch version, earlier nerf list and player-count drop not retrieved.
- No poncle, Fatshark (Vermintide), Mike Booth co-op follow-up, GMTK or Designer Notes source covered in budget.

---

## Pattern cards

### P5.1 Tester ceiling (anti-pattern)
- **Lineage.** Diablo 3 Inferno (2012), set on hardcore internal testers then doubled -> cut in 1.0.3 and 1.0.4 ->
  replaced by Monster Power in 1.0.5 (Oct 2012). Why it failed: insiders are the wrong baseline for a top tier
  everyone is funneled into.
- **Feeling.** Wall, not challenge. Frustration with no knob.
- **Mechanism.** Avoid `tier_difficulty = tester_threshold x k`. Set the default tier from outsider data.
- **Works / breaks.** Breaks whenever the tier is mandatory for progress or loot (70% of Diablo 3 items dropped
  beyond Normal, https://pcgamer.com/diablo-3-70-of-items-appear-beyond-normal-difficulty).
- **Evidence.** [U, E2] Wilson remark via reposts; [V, E2] nerfs and Monster Power as a natural experiment.
- **Cost.** S (a rule). Knob is who you tune on.
- **Hearthguard.** The collective of 5 and the developer are the testers. Tune the default run on first-time
  players and on the bot floor; put tester-hard content on an opt-in rung.

### P5.2 Opt-in ladder with rising pay
- **Lineage.** Diablo 3 Monster Power (2012, levels 0-10, rewards scale) -> Slay the Spire Ascension (20 levels,
  one at a time) -> Hades Heat (Kasavin cites Ascension; Weapon Aspects as lure) -> Aghanim's Labyrinth Apex Mage
  (2020, unlock after Grand Magus) -> Helldivers 2 Super Helldive (2024, unlock after a difficulty 9 clear).
- **Feeling.** Mastery, "one more try", status.
- **Mechanism.** Base tier balanced first. Rung n unlocks on clearing rung n-1. Each rung adds one named modifier
  or a stat step, and pays more (XP, gold, cosmetics). Rung 0 can be easier than default.
- **Works / breaks.** Works with repeatable runs. Breaks if rewards make high rungs mandatory, or if the base tier
  is not tuned first.
- **Evidence.** [V, E2] Wilson/Cheng, Giovannetti, Valve notes; [V, E3] Helldivers 2 press.
- **Cost.** M. Knobs: modifier list, reward per rung, unlock gate.
- **Hearthguard.** After a first full clear, offer "Embers 1..N", each turning on one modifier the game already
  has (darker chapters, a Horde in w2, a weaker Hearth). The glossary has "Ascension ladder"; this card adds the
  reward and the gate.

### P5.3 Recoverable leak
- **Lineage.** Defense Grid: The Awakening (Hidden Path, 2008), cores carried back along the path.
- **Feeling.** Tension then relief; second chance; graded pride (cores left).
- **Mechanism.** A leaked enemy takes a chunk of the goal and walks it back toward the exit. Kill it before it
  leaves and the chunk returns.
- **Works / breaks.** Works when the path back is long enough to react. Breaks when the carrier is too fast or
  hidden.
- **Evidence.** [V, E2] Austin quote via search excerpt.
- **Cost.** S-M. Knobs: chunk size, carrier speed, return path length.
- **Hearthguard.** Every bot loss is the Hearth falling in chapters 3-5 [K]. Mobs that hit the Hearth could steal
  an "ember" (for example 5% of Hearth HP) and carry it back down the corridor; killing the carrier restores it.
  This turns a permanent loss into a chase beat and gives a range of results per chapter.

### P5.4 Slice metrics by tier and by when it was acquired
- **Lineage.** Slay the Spire GDC 2019 (Madness case, super playtesters) -> Valve's Aghanim shard selection and
  efficacy rates (2020).
- **Feeling.** None directly; it protects every other curve from bad tuning.
- **Mechanism.** Report per-player medians, then per-tier, then compare items only within the same acquisition
  window (same talent row, same chapter).
- **Evidence.** [V, E2] Giovannetti; [V, E2] Valve patch note.
- **Cost.** S, given existing `play_events` [K].
- **Hearthguard.** Talent rows land at 4/8/12/16/20 [K]. Compare picks within a row. Weight each of the 5 testers
  equally. Use `sim_bot` as the unskewed reference.

### P5.5 Same shape, higher floor
- **Lineage.** Aghanim's Labyrinth 24 July 2020 patch.
- **Feeling.** A hard tier still has a learnable opening; the climax carries the extra challenge.
- **Mechanism.** For harder tiers, keep the early-act growth rate the same as easy tiers; add the extra in
  the final act.
- **Evidence.** [V, E2] Valve patch note. Effect on retention not published (gap).
- **Cost.** S. Knob: per-act growth rate per tier.
- **Hearthguard.** If difficulty modes are added, scale the chapter multipliers [1.0, 2.3, 4.6, 8.0, 13.0] [K]
  by tier only in chapters 4-5, not 1-2.

### P5.6 Buff the hero, then add a rung
- **Lineage.** Helldivers 2, nerfs through spring-summer 2024 -> buff patch 17 Sept 2024 -> "I agree!" to a harder
  mode the same day.
- **Feeling.** Power fantasy (Mow) on the default; challenge kept for those who opt in.
- **Mechanism.** When the power curve feels weak, raise player power rather than lowering enemy stats; restore
  the top end with a new opt-in tier.
- **Evidence.** [V, E3] press; [V, E2] Pilestedt social post. Long-term player counts not retrieved.
- **Cost.** M. Knob: hero damage per level (+9% today [K]).
- **Hearthguard.** The hero-vs-mob ratio falls 1.0 to 0.6 [K]. Raise per-level damage or talent power so chapters
  2-5 end in a Mow like chapter 1, then send the "too easy" feedback to P5.2.

---

## Glossary additions

- **Recoverable leak.** A loss at the goal that can be undone during play by catching the enemy carrying it.
  Source Defense Grid (Austin). Distinct from a catch-up mechanic, which helps whoever is behind in general.
- **Tester ceiling.** Setting a tier's difficulty from what insiders find hard. Anti-pattern. Source Diablo 3 Inferno.

---

## Sources

Designer statements and patch notes (E2)
- Giovannetti, "Slay the Spire: Metrics Driven Design and Balance", GDC 2019. Listing https://gdcvault.com/play/1025731/ ; transcript notes https://readray.ai/notes/76667 ; preview https://gamedeveloper.com/design/learn-i-slay-the-spire-i-s-metrics-driven-approach-to-game-balancing-at-gdc-2019
- Wilson and Cheng, PC Gamer 1.0.5 interview, 22 Sept 2012. https://www.pcgamer.com/diablo-3-patch-1-05-interview-with-jay-wilson-and-wyatt-cheng ; summary https://www.diablofans.com/comments/139343
- Blizzard, Monster Power blog. https://us.diablo3.com/en/blog/7540457
- Diablo Wiki, patch 1.0.5 and difficulty archive. https://di.diablowiki.net/V1.05_patch ; https://www.diablowiki.net/Difficulty_archive
- Wilson "doubled" repost. https://vgtimes.ru/news/3894-okonchatelnyy-rezhim-inferno-v-diablo-3-vdvoe-slozhnee-chem-na-beta-teste.html
- Valve, Aghanim's Labyrinth update, 24 July 2020. https://store.steampowered.com/news/63749
- Morse, Game Developer, 11 April 2024. https://gamedeveloper.com/design/risk-of-rain-interview
- Clavijo (Ironhide), Pocket Gamer, 8 Dec 2023. https://www.pocketgamer.com/junkworld/interview/
- Azofra (Ironhide), Kodeco, 22 Feb 2013. https://www.kodeco.com/30636/top-developer-interviews-ironhide-game-studio
- Austin (Hidden Path), PC Gamer retrospective. https://www.pcgamer.com/defense-grid-the-beer-game-that-changed-a-genre
- Kasavin, Tom's Guide. https://www.tomsguide.com/features/hades-exclusive-interview-supergiant
- Pilestedt via Destructoid, 20 Sept 2024. https://www.destructoid.com/some-helldivers-2-players-feel-game-needs-a-higher-difficulty-after-the-buff-patch-and-the-cco-agrees/
- Jorjani via PCGames.de. https://www.pcgames.de/Helldivers-2-Spiel-74479/News/Entwickler-wollen-Schwierigkeitsgrad-anders-erhoehen-1479301/

Press and community (E3/E4)
- https://www.tomshardware.com/news/Blizzard-Diablo-Patch-Inferno,17627.html
- https://gamebanshee.com/wh9d
- https://pcgamer.com/diablo-3-70-of-items-appear-beyond-normal-difficulty
- https://www.pcgamer.com/uk/a-journey-through-early-access-helped-make-hades-a-masterpiece/
- https://dotesports.com/dota-2/news/valve-adds-three-new-heroes-and-higher-difficulty-to-aghanims-labyrinth
- https://afkgaming.com/dota2/news/4820-3-new-heroes-have-been-added-to-aghanims-labyrinth
- https://www.gosugamers.net/dota2/news/55659-aghanim-s-labyrinth-the-best-heroes-to-navigate-through-the-apex-mage-tier
- https://www.techradar.com/gaming/consoles-pc/helldivers-2s-escalation-of-freedom-update-adds-a-new-difficulty-level-enemies-and-a-swamp-world
- https://www.videogamer.com/?p=1106958
- https://kingdomrushtd.fandom.com/wiki/Difficulty
- https://steamcommunity.com/app/2849080/discussions/0/597389486013310630
- https://en.wikipedia.com/wiki/Risk_of_Rain
- https://en.wikipedia.com/wiki/Defense_Grid:_The_Awakening
- https://saschb2b.github.io/game-mechanics/games/slay-the-spire/design-tensions
- https://www.avclub.com/game-theory-vampire-crawlers

Not found or not reached in budget: Orcs Must Die postmortem, Dungeon Defenders postmortem, poncle on the power
curve, Reaper of Souls Torment talk, Fatshark on Vermintide, IceFrog/Eul/Guinsoo, GMTK, Designer Notes episodes,
PixelJunk Monsters.
