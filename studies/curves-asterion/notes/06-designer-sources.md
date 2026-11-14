# 06. Designer sources: what the makers of the twins said

Agent 4, "designer sources". Grade E2 unless marked. Written 2026-11-13.
Angle: designer statements (postmortems, talks, interviews, dev blogs, official rationale in patch notes) on
progression curves, skill by use, death penalties and session length. Each entry: who, where, when, the claim
in my words, a quote under 15 words, and what it means for Asterion.

Access notes. Blocked during this pass and not mirrored (archive.org is blocked for this tool): the TibiaLatina
"Interview with Steve" page (HTTP 402), the Portal Tibia Vogler interview (403), the Massively OP GDC 2018 UO
postmortem write-up (403), the Valheim fandom Skills page (402), the Ashes of Creation wiki Experience_debt page
(403), the Project Gorgon forum (403). Where a claim rests only on a search snippet of a blocked page it is
marked [U] and the page is still given so the gap check can re-fetch it.

---

## Q1. Skill by use: what Koster learned from Ultima Online

**Takeaway.** The designer who shipped the most famous skill-by-use system says it fails when "the tool becomes
the goal". Every anti-macro fix UO tried (dynamic rate tracking, gains only on real challenge, chunk-seeded dice)
was found and farmed within weeks. His verdict is to put the fun in the activity, not in the gain roll.

**Cited findings.**
- Raph Koster, "Use-based systems", raphkoster.com, 2006-07-18 (updated 2015-06-15) [V, E2] [1].
  Definition: everyone has every skill and each use gives "a chance of improvement every time you use the skill".
  Problems he lists: skills used at very different rates (swordsmanship would race ahead of rarely used skills
  unless rates were tuned per skill); the fixed 700-point total meant a gain in one skill removed a point from
  another (atrophy by cap); the gain roll was seeded from the map chunk, so a failed attempt repeated in the same
  place and players learned that walking 8 tiles reset the odds ("8x8 macroing"). Fixes tried in order: dynamic
  tracking of use frequency (advancement slowed so much that "playing 'the right way' no longer had any
  incentives"), gains only on real challenge (players trapped strong monsters and farmed them), a hand-tuned rate
  table, then "guaranteed gain" and "power hour". Verdict: "A skill is supposed to be a tool you use to defeat a
  challenge."
- Koster, "The Laws of Online World Design", raphkoster.com (compiled 1997 to 2005) [V, E2] [2]. Design rules
  that bear on the long curve: "have multiple paths of advancement", "make sure the milestones ... are clear and
  visible and significant", "make your game not have a sense of running out of significant milestones". Also
  Darklock's law: when players expect slow advancement they "will call any method of gaining them rapidly
  'cheating'", and Lambert: "Players will eventually find the shortest path to the cheese."
- Koster, "Designing a Living Society in SWG, part one", raphkoster.com [V, E2] [3]: he notes that the UO-style
  cap "encourages grinding" and that at the cap a player "could simply surrender any skill, and go learn another".
- Skill cap numbers (context, not Koster): 700 total at launch, raised to 720 in January 2013 (UOGuide) [V, E3] [4].

**Inferences for Asterion.** [I]
- Asterion has no total cap, so UO's atrophy problem does not exist, but the per-skill geometric curve
  (1.08^(level-10)) will produce the same "roll for a gain" feeling that Koster says breaks the activity. His
  advice translates to: make the hunt itself the reward (loot, creature variety, party) and let skill rungs be a
  slow background tick. The current rung spacing (sword 50 in about 14 h) already does this; the danger is the
  late rungs (100 at about 707 h) where only the number is left.
- UO's "power hour" and "guaranteed gain" are the lineage of Tibia's exercise weapons and OSRS's afk training:
  designers conceding that the gain roll is the compulsion and bounding it in time. Asterion's rule that
  slowness lives in travel and discovery rather than in skill rolls is the same concession made up front.

**Gaps.** Koster's direct account of Trammel (2000) and the PK problem was in the blocked Massively OP write-up of
the GDC 2018 UO postmortem [5]; the GDC Vault video is the primary and was not opened. "A Theory of Fun" (2004)
is already the glossary's source for fun as learning and grok; no new claim added here.

---

## Q2. Death penalties: the founders' and leads' stated reasoning

**Takeaway.** Four generations of designers converge on the same sentence: death must cost something or there is
no tension, but the cost must be bounded so players keep taking risks. The disagreement is only about the size.
CipSoft started at "death is the end" and reduced it stepwise; Schubert (SWTOR) wanted a bumblebee sting;
Miyazaki wants fear of death without numbness; Jagex re-raised risk in 2020 after five years of "temporary"
softness; GGG says exp loss is a signal, not a punishment.

**Cited findings.**
- CipSoft, Stephan Vogler ("Steve", co-founder), fan interview republished on TibiaLatina [U, E2] [6]. Page
  blocked (402), snippet only: "we literally designed Tibia so that death meant the end"; later "we gradually
  reduced the loss on death"; "some loss had to remain". The Portal Tibia interview with Vogler [U, E2] [7] (403)
  carries the same line: in early Tibia "it was ok for people to die and to lose everything". Both pages must be
  re-fetched before quoting in the report. The GameStar 25-year piece [8] and the MeinMMO 25-year interview [9]
  are the accessible press versions of CipSoft's history and did not yield a death-penalty quote in this pass.
- Jagex, OSRS "Death Changes" news post, 2020-06-24, revised 2020-06-26 [V, E2] [10]. The old item-retrieval
  rules were unpolled changes that "were only ever meant to be temporary" and made death much less risky; the
  team wanted a "middle ground" between five years of low risk and the high risk of the original game. Design:
  three most valuable items kept, the rest under a gravestone for 15 minutes ("enough time to reach most newbie
  areas"); the timer pauses on logout or inactivity so bad connections are not punished; loot from up to seven
  tiles away so retrieval does not require re-entering danger; common items free, fees from 1,000 gp (item worth
  100,000) to 100,000 gp (item worth 10 million); after collapse Death's Office returns items under 100,000 free
  and charges 5% of Grand Exchange value above that, with no timer; Ironmen pay half because "it is much harder
  for them to obtain cash quickly". The old NPC retrieval fees were among "the few direct item sinks that death has
  had in recent years".
- Damion Schubert (lead combat designer, SWTOR), BioWare forum posts, January 2011, reported by The Escapist and
  Engadget/Massively [V, E2] [11][12]. He wanted death to carry a sting like a bumblebee's rather than a box
  jellyfish's; a manageable penalty "allows designers to make encounters more challenging" because players retry
  instead of quitting; harsh penalties push players to grind easy content and discourage grouping (GameBanshee
  repost of the forum text [13]). He preferred challenge to depend on "skill, gear, and teamwork" rather than on
  credits or downtime. No GDC talk of his devoted to death penalties was found; his GDC talks are the Meridian 59
  postmortem (2012) [14] and "Double Coding" casual vs hardcore (2011).
- Hidetaka Miyazaki, Game Informer, 2009-11-05 (Demon's Souls) [V, E2] [15]. "difficulty is just one way to offer
  an intense sense of accomplishment"; soul loss was deliberate because failure "was necessary to give players
  that sense of accomplishment"; if souls could be recovered at any time "there would be no suspense or sense of
  accomplishment". On Sekiro, Game Informer 2018-08-21 [V, E2] [16]: "we don't want to numb the player to death".
- Grinding Gear Games, Jonathan Rogers (director, PoE 2), Digital Trends, 2025-01-14 [V, E2] [17]. Rewards must
  have "real economic value" that takes time to earn and must be protected; exp loss is not seen as punishment but
  as a signal that the player is in an area too hard for their level; "the whole death actually mattering thing is
  important". The PoE 1 Standard rule (exp loss at higher levels, respawn in town) is on Wikipedia [V, E3] [18].
- Visionary Realms (Pantheon), Kickstarter update reported by Ten Ton Hammer, 2014-02-14 [V, E2] [19]. The
  corpse holds gear and part of the exp; "losing too much XP can reduce your level"; resurrection returns some
  exp for a limited time; a god can summon the corpse for an exp fee and destroys the exp on it. A 2016 staff
  forum post said the penalty would sit between vanilla EverQuest and vanilla Vanguard and that "totally naked
  corpse runs are probably too extreme" [U, E2] [20] (snippet only; forum page not opened). No Brad McQuaid quote
  on death penalties was reached in this pass.
- Sandbox Interactive (Albion), Christoph Hombergs (head of operations), MMOBomb 2023 and Massively OP 2025
  [V, E2] [21][22]. Risk against reward is "one of the key issues underlying almost every design decision"; every
  activity should feel as if the rewards are worth the risks. A dev post on open-world PvP says full loot means
  each kill destroys hours of the victim's gear, so rewards in red and black zones are set much higher [U, E2]
  [23]. The 2025 Abyssal Depths were built as a stepping stone where only inventory is lost, not equipped gear [24].

**Inferences for Asterion.** [I]
- Asterion's death (10% exp, bag always drops, 10% per worn slot, 30-minute corpse) is already in Schubert's
  "bumblebee" band at low level (10 minutes lost at level 4) and drifts toward "jellyfish" by level 8 (52
  minutes, one full session). The designers above would all accept the low-level number; Jagex and GGG would
  call the level-8 number the point where the penalty stops teaching and starts punishing. A level-scaled exp
  loss (Tibia 8+, see agent 2) is the usual answer; Asterion's flat 10% is the knob.
- Jagex's two retrieval rules are cheap and directly portable: pause the corpse timer while the player is
  offline, and let the player loot their own corpse from a few tiles away. Both remove the "disconnect equals
  double death" case without touching the penalty itself.
- Rogers' "signal, not punishment" framing only works if the game tells the player why they died. Asterion's
  death screen could name the creature and the level band of the zone.
- Albion's Abyssal Depths (lose inventory, keep gear) is the same shape as Asterion's rule "backpack always
  drops, worn slots at 10%". That rule has a designer precedent and a stated reason: it caps the worst case.

**Gaps.** No primary CipSoft statement reached. No McQuaid quote. No Albion destiny board rationale from a
designer (only press descriptions). The Schubert Bluesky thread on MMO death (Massively OP) was not opened.

---

## Q3. Sessions, rested exp and respecting players' lives

**Takeaway.** The one well-documented designer story about tuning for session length is WoW's rested exp. The
same math shipped twice: as a penalty for playing past two hours it was hated in beta; flipped into a bonus for
logging off it became a loved feature. Framing is a free knob. Hazzikostas (2019) adds the other half: squish
levels so each one is felt, and accept slower levels as the price.

**Cited findings.**
- Rob Pardo (Blizzard), as relayed by Chris Remo on Idle Thumbs and quoted at Psychology of Games, 2010-03
  [V, E2 secondhand] [25]. Original design: exp gain fell after about two hours of play and levelled off; the
  intent was two-hour sessions rather than twelve; "people just hated it". Fix: "made everything in the game take
  twice as much experience to achieve" and reframed it: "you start getting 200% experience and eventually it goes
  back down to 100%". "It's EXACTLY the same as it was before." Eric Heimburg (then at Turbine) comments on that
  page that beta players were outraged by the penalty version.
- Game Developer, "GDC: Blizzard's Core Game Design Concepts" (Pardo, GDC 2010) [V, E2] [26]: the launch design
  dropped exp gain from 100% to 50% after a couple of hours; the shipped version frames the early hours as bonus
  and the normal rate as baseline.
- USgamer, "How World of Warcraft Was Made" [V, E2 secondhand] [27]: Pardo pushed rested exp after Blizzard saw
  players "literally never logging off"; "a certain amount of wanting to save people from themselves".
- Ion Hazzikostas (WoW game director), Live Developer Q&A, March 2019, reported by Blizzard Watch [V, E2] [28]:
  leveling to 120, especially through old content, "simply doesn't feel meaningful"; thought experiment of all
  current content taking the player to level 60 instead; the trade-off is that levels come slower, and the open
  question is how much slower is too slow. Destructoid on the same period [29]: leveling had become 15% longer
  and the 60 to 80 band was the painful stretch, so Blizzard raised exp there as a short-term fix. The squish
  shipped in Shadowlands (2020), 120 to 60.

**Inferences for Asterion.** [I]
- Asterion rejects daily rewards and FOMO (vision §2.3). Rested exp in its bonus framing is compatible with that
  stance: it rewards being away, never punishes it, and it never expires if the pool simply caps. The cheap form
  is a multiplier (1.5x to 2x) on exp for the first N minutes of a session, N growing with hours offline up to a
  cap of about one session. This also narrows the level gap between friends who play different amounts, which is
  the Q4 problem in the brief.
- Pardo's story is a warning for the death penalty too: a 10% loss and a "10% bonus for surviving" are the same
  math and will not be felt the same way. Any softening of Asterion's death should be tried as a framing change
  first (a blessing bought in advance, see agent 2) before the number moves.
- Hazzikostas's "does the level feel meaningful" test applies to Asterion's walk-speed quantisation: speed only
  changes at levels 5, 12, 20, 31 and 45, so most levels buy only HP and mana. Those are the levels to attach a
  visible milestone to (a new spell tier, a gear gate, a boat).

**Gaps.** No designer statement on 30 to 60 minute sessions as a stated tuning target was found beyond Pardo's
"two hours". Blizzard's own rested exp patch note text was not fetched.

---

## Q4. Skill by use with a small population and skill-loss changes

**Takeaway.** Thin evidence this pass. Heimburg's 2013 blog argues caps cannot be tuned for both aggressive and
average players at once; Valheim and Ashes statements were blocked.

**Cited findings.**
- Eric Heimburg ("Citan", Project Gorgon), Elder Game blog 2013, quoted in a Project Gorgon forum thread
  [U, E2] [30] (forum 403, snippet only): a cap tuned for the average player means aggressive players "hit the cap
  quickly and be frustrated", a cap tuned for aggressive players means the average player "will never even see"
  it; there is no limit to how many skills a player can raise at once, "by design". A forum reply gives the
  planned combat skill ceiling as 100 plus 25 synergy points.
- Valheim: skill loss on death is 5% per skill; a "No Skill Drain" status effect after respawn exists in the base
  game and since 0.221.4 shows its remaining time (mod changelog, Thunderstore) [U, E3] [31]. The Iron Gate patch
  note that introduced it was not reached.
- Ashes of Creation experience debt: wiki page blocked; nothing cited.

**Inferences for Asterion.** [I]
- Heimburg's cap argument is an argument for Asterion's uncapped geometric skills: with five friends on very
  different schedules, any cap is wrong for someone. The cost is that the gap between the most and least active
  friend grows without bound; party exp share and rested exp are the two levers that bound it.
- Valheim's grace period after death (no skill drain for a few minutes) is a pattern worth a card: it stops the
  death spiral where the corpse run kills you again at full price.

**Gaps.** Valheim patch note, Ashes exp debt (Steven Sharif statements), Jagex RuneScape 2 death rationale
(Andrew Gower), Bartle on progression, Scott Jennings. All left for the gap check.

---

## Pattern cards

### Card 1. Framing flip (penalty to bonus)
- Lineage: WoW beta 2004 (exp decay after two hours) -> WoW launch (rested exp bonus) -> every "rested" system
  since. Why: identical math, opposite reaction.
- Feeling: Submission (a comfortable return) and Fellowship (friends who play less stay close).
- Mechanism: define the slow rate as 100%; grant a multiplier m (1.5 to 2.0) on exp for the first N minutes of a
  session, N = min(cap, k x hours_offline). Never show a reduced rate.
- Works when the baseline is tuned as the "normal" rate. Breaks if the bonus is shown as decaying mid-session
  (players feel the drop) or if it is tied to a daily clock (becomes FOMO).
- Evidence: [V, E2] Pardo via Remo [25], Game Developer GDC 2010 [26], USgamer [27].
- Cost S. Knobs: m, N cap, accrual rate k, whether the bonus applies to skill tries as well as exp.
- Asterion: fits the anti-FOMO stance if the pool caps and never expires. Also a catch-up mechanic (glossary) for
  the friend who plays once a week.

### Card 2. Bounded sting (death penalty sized to retry, not to quit)
- Lineage: EverQuest 1999 (corpse run, exp loss) -> SWTOR 2011 (Schubert's bumblebee) -> OSRS 2020 (middle
  ground, 15-minute grave) -> PoE 2 2024 (exp loss as signal). Why: harsh penalties make players farm easy
  content and refuse groups; zero penalty removes tension.
- Feeling: Challenge; fear of death without numbness (Miyazaki).
- Mechanism: cost of failure in minutes capped at a fraction of a session; everything above the cap converted
  into recoverable form (corpse, gravestone) with a fee or a timer.
- Works when the player can see what killed them and retry quickly. Breaks when the retrieval itself is lethal
  (double death) or when a disconnect counts as a death.
- Evidence: [V, E2] Schubert [11][12][13], Jagex [10], Rogers [17], Miyazaki [15][16].
- Cost S for the number, M for a death screen that names the cause. Knobs: exp loss %, whether it scales with
  level, corpse timer, fee.
- Asterion: the level-8 cost (52 minutes) is at the top of the band the designers above would accept; a
  level-scaled loss or a blessing is the knob.

### Card 3. Paused corpse timer and remote loot
- Lineage: RuneScape 2 gravestones 2007 -> OSRS Death Changes 2020-06-24 (timer pauses on logout or inactivity,
  loot from seven tiles). Why: bad connections and lag deaths were the loudest complaint.
- Feeling: Challenge kept, the sense of unfairness removed.
- Mechanism: corpse decay counts only while the owner is online and active; owner may open their own corpse from
  up to d tiles.
- Works in any game with a corpse timer. Breaks if the corpse is also meant to be a loot opportunity for others
  (pausing hides it from them); pick one.
- Evidence: [V, E2] Jagex [10].
- Cost S. Knobs: pause conditions, d, whether others can still loot while paused.
- Asterion: the 30-minute corpse currently ticks in real time; pausing it while the owner is offline removes
  the "disconnected and lost the bag" case. Remote loot conflicts with "lootable by anyone"; a 2-tile reach is a
  compromise.

### Card 4. Post-death grace period
- Lineage: Valheim 2021 "No Skill Drain" after respawn -> Asterion's free heal at the temple.
- Feeling: Challenge without a death spiral.
- Mechanism: for T minutes after respawn, death costs nothing (or costs only the bag).
- Works when the corpse run is the main cost. Breaks if T is long enough to be used as free aggression.
- Evidence: [U, E3] Thunderstore changelog [31]; Iron Gate patch note not reached.
- Cost S. Knobs: T, what is waived.
- Asterion: waive the exp loss on a second death within T minutes of the first; keep the bag drop.

### Card 5. Milestone-dense levels
- Lineage: Koster's design rules (clear, visible, significant milestones) 1997-2005 -> Hazzikostas's level squish
  2019/2020 ("doesn't feel meaningful").
- Feeling: Challenge and Discovery; each level opens something.
- Mechanism: list every level that changes only HP and mana; attach a visible unlock to each stretch longer than
  one session without one.
- Works when unlocks are cheap content data (a spell, an item gate, a boat). Breaks when unlocks are new systems.
- Evidence: [V, E2] Koster [2], Blizzard Watch [28], Destructoid [29].
- Cost S to M (content yaml edits). Knobs: unlock cadence per level band.
- Asterion: walk speed changes at 5, 12, 20, 31, 45 only; wands gate at magic level 10/15/20; `min_level` on
  items is the lever.

---

## Glossary additions
- Rested exp: a multiplier on experience granted for time spent logged out, framed as a bonus; the same math as
  a fatigue penalty with the opposite reaction. Source: Pardo via Remo [25]; Game Developer [26].
- Death's Office / gravestone: a timed container for the dead player's items with a fee to reclaim; the fee is
  an item sink. Source: Jagex 2020 [10].
- Framing flip: changing how a rule is presented without changing its math. Source: Pardo [25][26].
- Bounded sting: a death penalty sized so the player retries rather than quits. Source: Schubert [11].

---

## Sources
1. Raph Koster, "Use-based systems", 2006-07-18. https://raphkoster.com/?p=592
2. Raph Koster, "The Laws of Online World Design". https://www.raphkoster.com/games/laws-of-online-world-design/the-laws-of-online-world-design/
3. Raph Koster, "Designing a Living Society in SWG, part one". https://www.raphkoster.com/?p=25717
4. UOGuide, "Skill Cap". https://uoguide.com/Skill_Cap
5. Massively OP, "GDC 2018 Ultima Online post-mortem" (403 during this pass). https://massivelyop.com/2018/03/28/gd-2018-ultima-online-post-mortem-with-richard-garriott-starr-long-raph-koster-and-rich-vogel/
6. TibiaLatina, "Interview with Steve" (Stephan Vogler) (402 during this pass). https://tibialatina.fandom.com/wiki/Interview_with_Steve
7. Portal Tibia, "Interview with Stephan Vogler, 'God' Steve" (403 during this pass). https://portaltibia.com.br/?p=63089
8. GameStar, "25 Jahre Tibia". https://www.gamestar.de/artikel/tibia-will-einfach-nicht-sterben,3377107.html
9. MeinMMO, CipSoft 25-year interview. https://mein-mmo.de/cipsoft-tibia-25-jahre-jubilaeum-interview/
10. Jagex / OSRS Wiki, "Update: Death Changes", 2020-06-24. https://oldschool.runescape.wiki/w/Update:Death_Changes
11. The Escapist, Schubert on SWTOR death penalty, 2011. https://escapistmagazine.com/?p=81623
12. Engadget/Massively, "I want to live" tag (Schubert SWTOR death penalty). https://www.engadget.com/tag/I-want-to-live
13. GameBanshee, SWTOR forum activity repost (Schubert). https://gamebanshee.com/k9caf
14. GDC Vault, "Classic Game Postmortem: Meridian 59" (Schubert, 2012). https://gdcvault.com/play/1016676/Classic-Game-Postmortem-Meridian
15. Game Informer, "Demon's Souls Director Discusses Difficulty", 2009-11-05. https://gameinformer.com/games/demons_souls/b/ps3/archive/2009/11/05/feature-demon-s-souls-director-discusses-difficulty-sequels-and-more
16. Game Informer, "Hidetaka Miyazaki on Sekiro", 2018-08-21. https://gameinformer.com/interview/2018/08/21/hidetaka-miyazaki-on-sekiro-shadows-die-twice
17. Digital Trends, PoE 2 Jonathan Rogers interview, 2025-01-14. https://digitaltrends.com/?p=3828963
18. Wikipedia, "Path of Exile". https://en.wikipedia.org/wiki/Path_of_Exile
19. Ten Ton Hammer, "Pantheon Discusses Death Penalty Mechanic", 2014-02-14. https://www.tentonhammer.com/news/pantheon-discusses-death-penalty-mechanic
20. Pantheon forums, "Let's talk death penalty" (staff post, 2016). https://seforums.pantheonmmo.com/content/forums/topic/2087/let-s-talk-death-penalty/view/page/3
21. MMOBomb, Christoph Hombergs interview, 2023. https://www.mmobomb.com/albion-online-talks-past-present-future
22. Massively OP, Albion head of ops interview, 2025-07-22. https://massivelyop.com/2025/07/22/interview-albion-onlines-head-of-ops-on-the-newbie-experience-streamlined-leveling-and-more/
23. Albion dev post, "Balancing non-consensual PvP" (devtrackers mirror). https://devtrackers.gg/albion/p/dad93514-balancing-non-consensual-pvp
24. FinalBoss, Albion Abyssal Depths, 2025. https://finalboss.io/albion-online-abyssal-depths-update-changes-pvp-forever
25. Psychology of Games, "Framing and World of Warcraft's Rest System", 2010-03. https://www.psychologyofgames.com/2010/03/framing-and-world-of-warcrafts-rest-system/
26. Game Developer, "GDC: Blizzard's Core Game Design Concepts" (Pardo, 2010). https://www.gamedeveloper.com/game-platforms/gdc-blizzard-s-core-game-design-concepts
27. USgamer, "How World of Warcraft Was Made". https://www.usgamer.net/articles/how-world-of-warcraft-was-made-the-inside-story
28. Blizzard Watch, "Level squish inevitable", 2019-03-22. https://blizzardwatch.com/2019/03/22/level-squish-inevitable/
29. Destructoid on Hazzikostas and leveling length, 2019. https://www.destructoid.com/?p=226579
30. Project Gorgon forum thread quoting Citan's Elder Game blog (403 during this pass). https://forum.projectgorgon.com/showthread.php?p=14753
31. Thunderstore, LicenseToSkill changelog (Valheim "No skill loss" effect, 0.221.4). https://thunderstore.io/c/valheim/p/ComfyMods/LicenseToSkill/changelog
