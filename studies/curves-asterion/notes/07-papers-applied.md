# 07. Theory and papers, applied to Asterion and its twins

Agent 5 ("theory and papers"). Written 13 Nov 2026. Scope rule from CONTEXT.md principle 4: theory only where it
explains a case in a twin or in Asterion. Flow, Juul's punishment types, MDA, DDA, skill atoms and SDT were already
covered in `studies/curves-hearthguard/notes/00a-glossary-theory.md`; this note extends them to persistent worlds and
does not redefine any term in `docs/formats/design-curves.md`.

Tags: [V] verified from the cited source, [I] inference, [U] unverified or not retrieved in this pass, [K] Kingsfoil
fact from the Asterion repo as summarised in CONTEXT.md. Grades E1 to E4 as in the brief. Where a PDF was fetched but
only partly read, the note says which lines were read.

Asterion facts used throughout [K]: death costs 10 % of total exp, flat at every level; skills and magic level are
untouched; the backpack always drops to the corpse, each of nine worn slots drops at 10 %; the corpse lasts 30 real
minutes (15 as corpse, 15 as bones) and anyone can loot it; `TestDeathPenaltyCalibration` puts the cost of a death at
about 10 minutes at level 4 and about 52 minutes at level 8 while hunting rats at about 480 exp/h; sessions are
designed for 30 to 60 minutes; skills rise by use with `tries = base × 1.08^(level−10)`; the design refuses daily
rewards and FOMO.

---

## Q1. Death penalties. What do the papers say about exp loss, corpse runs and how players react?

### Takeaway
The only dedicated academic treatment of MMO death penalties (Klastrup 2007) finds that every commercial world
softened its penalty over time and that most adopted a "newbie fix", a level below which death costs almost nothing.
Survey evidence (Yee 2008, Allison, Carter and Gibbs 2015) says players value harsh death they do not enjoy, because
it filters groups, builds bonds and makes success mean something, but blame after a wipe is the part that breaks
groups. No paper measures churn against a death penalty change with telemetry; that remains a gap, so the twins'
patch histories (agents 1, 2 and 8) are the best evidence we have. Prospect theory predicts that the same minute cost
framed as a loss (exp taken away) hurts roughly twice as much as framed as a foregone gain (exp debt), which is why
City of Heroes and EverQuest II could keep a comparable recovery time with far less complaint.

### Cited findings
- Klastrup, "Why Death Matters: Understanding Gameworld Experience", JVRB 4 (2007) no. 3, revised from ACE 2006.
  Survey at death-stories.org, 41 respondents (34 men, 8 women) by February 2007, mostly US, mostly WoW players.
  [V, E3 for the survey, E2 for the design history] https://www.jvrb.org/jvrb/article/view/4.2007.3 (open PDF,
  read lines 130 to 140 and 312 to 362 of the extracted text).
  - "over the time, the death penalty is normally made less harsh". Examples given: Ultima Online launched with
    corpse looting by others if you were slow back to your body, later "made almost impossible"; Dark Age of Camelot
    launched with exp loss big enough to lose a level, "quickly changed"; by 2007 no commercially successful MMOG let
    you lose a level on death.
  - The "newbie fix": "until levels 6-10, players will hardly experience any penalty". EverQuest made corpse
    retrieval unnecessary below level 10 soon after launch.
  - WoW's popularity is partly credited to a "very soft death penalty" with no exp loss at all.
  - Soft death becomes a tool: dying on purpose to teleport to a city in Star Wars Galaxies, so "death is suddenly
    no longer a penalty".
  - Secondary sources attribute to the same paper the claim that the social penalty for dying at the wrong time or
    getting others killed makes up for a soft system penalty [U, E4]
    https://bowling-bash.blogspot.com/2010/01/literature-death-matters-understanding.html
- Klastrup, "What makes World of Warcraft a world? A note on death and dying" (2008, ITU listing). Existence
  verified, content not retrieved. [U] https://pure.itu.dk/da/publications/what-makes-world-of-warcraft-a-world-a-note-on-death-and-dying/
- Yee, "Social Architectures in MMOs", The Daedalus Project, 10 June 2008, page 4 (death penalties). Open-ended
  survey responses, no n or percentages on the page. [V, E3] https://nickyee.com/daedalus/archives/001625.php?page=4
  - Severe penalties acted as a filter: only players who understood the mechanics got past the mid levels, so the
    high-end population shared expectations. One respondent (F, 34): "In WoW, PUGs are dreaded because that learning
    curve has been removed."
  - Not everyone agreed. A 15-year-old respondent said the EverQuest penalty "doesn't so much form bonds as break
    them". A respondent (F, 33) described a group spending about 15 minutes assigning blame after an exp-loss wipe
    and then dissolving (her estimate, not measured).
- Allison, Carter and Gibbs, "Good Frustrations: The Paradoxical Pleasure of Fearing Death in DayZ", OzCHI 2015.
  1,704 survey responses. Players overwhelmingly supported permadeath while reporting negative emotion; the authors
  separate "liking" the rule from "enjoying" the moment. [V, E3]
  https://minerva-access.unimelb.edu.au/bitstream/handle/11343/57076/AllisonCarterGibbs%20DayZ%202015%20OzCHI%20CAMERA%20READY.pdf
  Follow-up: Carter and Allison, "Fear, loss and meaningful play: Permadeath in DayZ", Journal of Gaming and Virtual
  Worlds 9(2), 2017, explains the appeal through excitation transfer. [V, E3, paywalled]
  https://doi.org/10.1386/jgvw.9.2.143_1
- Kang et al., ArcheAge 4th closed beta, 270 million behaviour records in a world players knew would be deleted.
  No world-wide behaviour change when consequences vanished; only outliers turned anti-social. [V, E1]
  https://arxiv.org/abs/1703.01500 (WWW 2017 companion). Relevant as the mirror case: removing all long-term stakes
  did not change most players' behaviour.
- Kahneman and Tversky, "Prospect Theory: An Analysis of Decision under Risk", Econometrica 47(2), 1979. Losses
  weigh about twice as much as equal gains; outcomes are judged against a reference point. [V, E1]
  https://doi.org/10.2307/1914185 (paywalled; many open mirrors).
- Loss aversion inside a game: Mushtaq (MSc thesis, University of Saskatchewan, 2021), three experiments, 300
  participants wagering in-game gold in a Zelda-style game, loss aversion held in every experiment even for virtual
  currency. [V, E1 but a thesis] https://harvest.usask.ca/handle/10388/13478. Toh, Game Studies 21(3), 2021, codes
  player decisions and finds loss aversion and sunk cost shaping them. [V, E3] https://gamestudies.org/2103/articles/toh
- Juul's punishment types (energy, life, setback, termination) are in the series glossary from the Hearthguard
  study [V]. Source there: Juul, "Fear of Failing? The Many Meanings of Difficulty in Video Games", 2009,
  https://www.jesperjuul.net/text/fearoffailing/

### Inferences
- [I] Asterion's flat 10 % is already a newbie fix in minutes even though it is not one in percent. The cost of a
  death grows with `0.1 × exp(L) / exp_rate(L)`, so at level 4 it is about 10 minutes and at level 8 about 52 [K].
  Klastrup's history says the twins added an explicit gate (EQ below 10, Tibia's Rookgaard) because their percent
  losses did not shrink fast enough at low level. Asterion gets the gate for free from the cubic and does not need a
  second rule until the exp/h curve of mid-level hunting grounds is known (agent 0).
- [I] Exp loss vs exp debt is a framing question with the same minute cost. Prospect theory's reference point is
  the level bar the player sees. Taking 10 % away moves the bar backwards (a loss); exp debt leaves the bar and halves
  the gain rate until the debt is paid (a foregone gain). With the usual 2:1 weighting, debt should feel about half
  as bad for the same recovery time. City of Heroes (2004) and EverQuest II (2004) shipped debt; WoW shipped
  durability and a spirit-healer walk; Tibia and PoE kept the loss. Asterion's vision wants death to "matter" (P2),
  so the loss framing is a deliberate choice of the harsher feeling, not an accident. If playtests show the 52-minute
  cost at level 8 reads as unfair, change the frame before the number.
- [I] The 30-minute corpse timer is a sunk-cost trigger. Once dead, the player has already paid the exp; the bag on
  the floor is a second, visible stake with a countdown. Toh's coding of sunk cost in play predicts players will walk
  back even when the bag is worth less than the minutes it costs, which keeps the corpse run alive as a ritual. That
  is good for Challenge and Fellowship (rescue), bad when it crosses the session boundary (see Q4).
- [I] Juul's types applied to the corpse run: the exp loss is a setback punishment (progress lost, replay the
  hunt); the bag drop is also a setback (items lost, re-earn them); the respawn is an energy punishment reset to
  full with no life count, since there are no lives and no termination. Asterion therefore has two stacked setback
  punishments and no termination, which is the EverQuest 1999 shape with Tibia's percentages. The Hearthguard note
  records that players rate games higher when they blame themselves for failure; in a persistent world with a party,
  blame can land on a friend, which is Yee's 2008 failure mode.
- [I] Allison et al. and Kang et al. together say the stake does not have to be high to shape behaviour, but
  players want it to exist. Asterion's 10 % plus bag is well inside that band; the 2015 DayZ numbers argue against
  softening to zero even if a friend asks for it after a bad night.

### Gaps
- No telemetry study of churn around a death penalty change exists in the literature found. The natural
  experiments live in patch histories (EQ corpse summoning, Tibia blessings and Twist of Fate, PoE's 10 % debates,
  RuneScape gravestones). Agents 1, 2 and 8 own those.
- Klastrup's survey is 41 hard-core players; its history of softening is E2 to E3 and partly from "personal
  correspondence with player".
- The "social penalty" sentence is attributed to Klastrup by blogs; the exact wording in the paper was not located
  in the lines read.

---

## Q2. Skill by use and learning curves. What shape does practice take, and does skill by use match it?

### Takeaway
Practice curves in psychology fall as a power law (Newell and Rosenbloom 1981) or, on unaveraged individual data,
as an exponential (Heathcote, Brown and Mewhort 2000). Both say the same thing for design: most of the real
improvement happens in the first hours, then a long, flat tail. Skill-by-use systems with geometric try counts
(Tibia's 1.1, Asterion's 1.08, UO's 0.1 steps that slow near 100) produce a skill number that rises logarithmically
in tries, which is the same visual shape as the power law of practice. The number mimics learning. The danger
Koster and Cook name is that the player's mental model saturates long before the number does, and the stretch after
that is grind with the aesthetics of Submission, not Challenge.

### Cited findings
- Newell and Rosenbloom, "Mechanisms of skill acquisition and the law of practice" (1981): time per trial falls as
  `T = a + b·N^(−c)`. Summary and references at https://en.wikipedia.org/wiki/Power_law_of_practice [V, E1 via
  secondary].
- Heathcote, Brown and Mewhort, "The power law repealed: The case for an exponential law of practice", Psychonomic
  Bulletin and Review 7(2), 2000, pp. 185 to 207. 40 datasets, 7,910 learning series, 475 subjects, 24 experiments;
  the exponential fit better in every unaveraged dataset; averaging biases toward the power law; they propose the
  APEX function. [V, E1] https://doi.org/10.3758/BF03212979 (publisher page; open copy at
  https://ogma.newcastle.edu.au/vital/access/manager/Repository/uon:2058). Evans et al., "Refining the Law of
  Practice" (2018) revisits the debate. [V, E1]
  https://figshare.utas.edu.au/articles/journal_contribution/Refining_the_Law_of_Practice/22964183
- Koster's fun-as-learning and Cook's skill atoms are already in the glossary (Hearthguard note Q2 and Q6).
  Koster, "Do levels suck?" (16 Dec 2005) adds the MMO case: grindier games have a steeper level curve, "sometimes
  with exponential rather than linear increases in required kills"; levels are "a content multiplier"; the arms race
  of adding levels is "mudflation". [V, E2] https://www.raphkoster.com/2005/12/16/do-levels-suck/ Part II (22 Dec
  2005): levels push play toward cooperation because mismatched power kills competition, and levels are a public
  status marker. [V, E2] https://www.raphkoster.com/2005/12/22/do-levels-suck-part-ii/
- Linehan, Bellord, Kirman, Morford and Roche, "Learning curves: analysing pace and challenge in four successful
  puzzle games", CHI PLAY 2014, pp. 181 to 190. Method: code play-through videos for when each skill is introduced,
  practised alone, then combined, and how puzzle complexity rises until the next skill drops it back. [V, E1]
  https://doi.org/10.1145/2658537.2658695 (open copy https://cora.ucc.ie/handle/10468/3461). Visani Scozzi,
  Iacovides and Linehan (CHI PLAY 2017) note the 2014 method measured structure, not player reaction. [V]
  https://eprints.whiterose.ac.uk/130552/

### Inferences
- [I] Two curves share one word. The skill number (sword 10 to 100) is a geometric try count: solving
  `tries = 50 × 1.08^(L−10)` for L gives `L = 10 + ln(tries/50)/ln 1.08`, a logarithm of practice. The player's
  learning curve (what they can do: target, kite, time a potion, read a creature's range) saturates after a few
  skill atoms. In Tibia 7.x the knight's kiting and potion rhythm are grokked in the first 5 to 10 hours [I from
  agent 8's material], while sword 50 takes 14 hours and sword 100 takes 707 hours [K]. From Koster's rule the fun
  from learning ends near hour 10 and the next 700 hours run on other aesthetics: Fellowship (hunting with friends),
  Discovery (new grounds, boats), and Submission (the comfortable loop). Asterion's "slowness lives in travel,
  progression, economy and discovery" [K] is a statement of exactly this handoff, so the design already knows it.
- [I] Heathcote's exponential vs power argument matters for one knob only: how fast the early gains come. An
  exponential approach to asymptote gives a shorter honeymoon and a longer flat; a power law keeps giving small
  visible gains for longer. Geometric try counts with base 1.08 are closer to the power-law feel (each rung is only
  8 % longer than the last, so gains never stop arriving, they just slow). Tibia's 1.1 is the harsher version. The
  D149 change from 1.1 to 1.08 (30 Aug 2026) [K] moved Asterion toward the gentler shape for a 45-minute session.
- [I] Skill atoms for Asterion, in Cook's form (act, game updates, feedback, model updates): click to target;
  step back to kite a melee creature on the 2 s beat; drink when HP crosses a threshold; read `min_level` on an
  item; use the heartstone before HP runs out; find and open your own corpse; party exp share. The corpse run is
  itself a skill atom with the slowest feedback loop in the game (minutes, not seconds), which is why first deaths
  teach so much and later ones teach nothing. Linehan's method can be applied to a twin by coding a Tibia 7.x
  Rookgaard play-through for the order in which these atoms appear; that is a cheap E3 artefact agent 8 could make.
- [I] Skill by use adds a failure mode the glossary's "skill burnout" does not cover: the atom is still useful,
  but the number keeps asking for repetitions after the model is complete. The glossary addition below calls this
  "skill grind" to keep it apart from Cook's burnout.

### Gaps
- No paper measures a skill-by-use curve against player retention. UO's GGS and RuneScape afk-training reactions
  are forum evidence (agents 1 and 2).
- Linehan's method has only been applied to puzzle games; the MMO application is a proposal.

---

## Q3. Progression curve mathematics. Why MMOs pick cubic or exponential exp, and what "level" means

### Takeaway
The designers' literature agrees on the shape and the reason: each level should take "a little bit longer than the
last" (Schreiber 2010), levels exist for "clear regular feedback" (Bartle via Koster 2005) and as a content
multiplier, and an endless game eventually reaches a point where "more progression just isn't meaningful"
(Schreiber). Castronova (2001) gives the lens that turns the exp curve into a price list: time is the currency, an
hour in EverQuest produced goods worth about USD 3.42, so a death penalty is a tax on hours. No paper gives a formal
treatment of exp stages or a diminishing-returns family for MMO curves; that is design practice, not literature.

### Cited findings
- Schreiber, Game Balance Concepts, "Level 7: Advancement, Progression and Pacing", 18 Aug 2010. Level transitions
  should follow a "slightly increasing curve, where each level takes a little bit longer than the last"; frequent
  small gains beat rare big ones, "Giving too many big rewards in a small space of time diminishes their impact";
  in MMOs without an endpoint progression "loses a lot of meaning" and the elder game is a jarring transition; the
  post names "the progression treadmill" and criticises padding that artificially lengthens the game. The post does
  not give named curve families or formulas. [V, E2]
  https://gamebalanceconcepts.wordpress.com/2010/08/18/level-7-advancement-progression-and-pacing/
- Koster, "Do levels suck?" (2005), as in Q2: Bartle put levels in MUD1 for "clear regular feedback on
  advancement"; grindier games use exponential kill counts; mudflation. [V, E2]
  https://www.raphkoster.com/2005/12/16/do-levels-suck/
- Castronova, "Virtual Worlds: A First-Hand Account of Market and Society on the Cyberian Frontier", CESifo Working
  Paper 618, December 2001. Average EverQuest player produced 319 platinum per hour, about USD 3.42 at the eBay
  exchange rate; GNP per capita of Norrath between Russia and Bulgaria; about 12,000 people treat the world as their
  permanent home. [V, E1] https://www.cesifo.org/DocDL/cesifo_wp618.pdf. The 616-auction sample and the one-cent
  platinum price come from secondary accounts. [U, E4] https://chinagamesworld.blogspot.com/2007/10/77th-richest-country-in-world.html
- Bartle, "Hearts, Clubs, Diamonds, Spades: Players Who Suit MUDs" (1996) is the source for levels as the achiever's
  yardstick. [V, E2] https://mud.co.uk/richard/hcds.htm

### Inferences
- [I] Asterion's cubic is Schreiber's rule made exact. `exp(L) = (((L−6)·L + 17)·L − 12)/6 × 100` has a next-level
  increment that grows roughly as `50·L²`, so each level is a little longer than the last and the ratio between
  consecutive levels falls toward 1. That is the gentlest of the "increasing" families; an exponential (Tibia's magic
  level at 1.4^ml, Asterion's own) has a constant ratio and is the harsh one. Asterion therefore runs a gentle curve
  for level and a harsh one for magic level and skills, which is also what Tibia 7.x does. Where the three curves
  cross on an axis of hours is agent 0's job; this note only says the mix is orthodox.
- [I] Castronova's wage turns the death penalty into a price. Price of one death in hours = `0.1 × exp(L) /
  exp_rate(L)`. At 480 exp/h and level 8 that is 52 minutes [K], about one session, which is the vision's stated
  target. Because `exp(L)` grows as L³ while exp/h at the right hunting ground grows roughly linearly with level in
  Tibia-likes [I], the price of a death in hours rises about quadratically with level unless the exp/h ladder keeps
  up. The twins' answer was to make exp/h climb steeply through gear and grounds (EQ, Tibia) or to cap the loss in
  minutes through blessings (Tibia 8+). Asterion should plot "minutes per death by level at the intended ground" from
  `cmd/balance` before deciding whether 10 % flat survives past level 35.
- [I] Schreiber's "more progression just isn't meaningful" is Asterion's uncapped-level problem stated in advance.
  Levels buy HP (+5), mana (+10) and walk speed only at 5, 12, 20, 31 and 45 [K]. After 45 a level buys 5 HP and
  10 mana against a `145 + 5L` pool, under 2 % each. Koster's status-marker reading (level as public rank) is then
  what keeps levelling meaningful in a group of 5, which argues for the rankings page and titles doing real work.
- [I] Exp stages (Open Tibia practice: a multiplier per level band, high early and 1× late) are a piecewise
  rescaling of exp/h, not a new curve family. They change the price of a death in hours by the same factor, which is
  why low-rate servers feel harsh on death and high-rate servers feel free. No paper treats them; agent 2 owns the
  practice evidence.

### Gaps
- No formal literature on exp stages, diminishing returns or "time to level" as a design object. The closest is
  Schreiber's prose and designer blogs.
- Ducheneaut et al.'s hours-to-60 figures were not retrieved (the PDF link returned 404); see Q4.

---

## Q4. Retention and sessions. What predicts staying, how long are sessions, and what about compulsion?

### Takeaway
The largest WoW retention survey (Debeauvais et al. 2011, n = 2,865) found that social motivation and guild rank
predicted continued play while achievement motivation predicted hours per week but not whether players stopped. Breaks
are normal: 35 % had stopped for at least a month and 23 % were paying but not playing for six months. MMO session
lengths are heavy-tailed; in Lineage II half of all sessions were under 26 minutes (Kim et al., cited by Pittman
and GauthierDickey 2007). For Asterion that means a 30-minute corpse timer is about one median session long, so a
death in the second half of a session leaves a corpse that is gone by the next login. The 2024 disengagement work
(Alexandrovsky et al.) says players plan how long to play and want self-determined exits, which fits the anti-FOMO
pillar and argues for the temple respawn and heartstone as deliberate exit points.

### Cited findings
- Debeauvais, Nardi, Schiano, Ducheneaut and Yee, "If you build it they might stay: retention mechanisms in World of
  Warcraft", FDG 2011, pp. 180 to 187. Online survey of 2,865 WoW players in spring 2010 (72 % US, 15 % Taiwan, 9 %
  Hong Kong; 31 % women). Read in full from the open PDF. [V, E1 survey]
  https://www.artifex.org/~bonnie/WoW_retention_04_24_11.pdf (DOI https://doi.org/10.1145/2159365.2159390)
  - Overall stop rate 77 %; only 23 % had never stopped. 35 % had stopped for at least a month, 26 % for six
    months, 14 % for a year. 23 % of the whole sample had kept paying while not playing for six months or more.
  - Weekly hours: Western players 22 (sd 13.3), Asian 26 (sd 19.1). Self-labelled casual 17 h/week and 83 % stop
    rate; in-between 24 h and 76 %; hardcore 32 h and 67 %.
  - Guild position: not in a guild 19 h/week and 88 % stop rate; member 22 h and 79 %; officer or GM 24 h and 71 %
    (chi-square 9.27, significant). Only 10 % of the sample had no guild.
  - Achievement motivation correlated weakly with hours (r = .20) and did not influence the stop rate; social
    motivation did. 54 % had made a real-life friend in the game and played more per week (24 vs 21 h).
  - The paper cites an earlier MMORPG study (its ref. 13) in which 30 % of players left within a month and 70 %
    within eighteen months, and after two years 75 % of newcomers left within a month. [U on which study; not
    retrieved]
- Debeauvais, Lopes, Yee and Ducheneaut, "Retention and progression: Seven months in World of Warcraft", FDG 2014.
  Existence verified, findings not retrieved. [U] https://isr.uci.edu/node/2256.html
- Ducheneaut, Yee, Nickell and Moore, "Building an MMO With Mass Appeal: A Look at Gameplay in World of Warcraft",
  Games and Culture 1(4), 2006, pp. 281 to 317, and "Alone Together? Exploring the Social Dynamics of Massively
  Multiplayer Online Games", CHI 2006. The open PDF link returned 404 and the mirror redirected; hours-to-60 and
  group-time-by-level figures were not retrieved in this pass. [U] https://doi.org/10.1177/1555412006292613 and
  https://doi.org/10.1145/1124772.1124834 (both paywalled). The "Alone Together" abstract states that social
  activity in MMOGs "may have been previously over-estimated" (players use others as an audience). [V, E1 abstract]
- Pittman and GauthierDickey, "A Measurement Study of Virtual Populations in Massively Multiplayer Online Games",
  NetGames 2007. Measured one full WoW realm (Aerie Peak) for five weeks, 13 April to 20 May 2007. Session lengths
  and zone populations "appear to occur according to a power-law distribution". They cite Kim et al. on Lineage II:
  "50% of all playing sessions lasting less than 26 minutes", and say their WoW sessions looked similar. [V, E1]
  https://www.cs.du.edu/~chrisg/publications/pittman-netgames07.pdf (read lines 18 to 141 of the extracted text).
- Chen, Huang and Lei, ShenZhou Online traces (2005 to 2006): session arrivals within an hour fit a Poisson model,
  session durations are heavy-tailed. [V, E1] https://people.cs.nycu.edu.tw/~chuang/pubs/pdf/2006infocom.pdf
- Raptr tracker, December 2010: average WoW session 2.1 hours after the Cataclysm launch. Vendor figure, a mean of a
  heavy-tailed quantity. [V, E1 vendor] https://www.gamedeveloper.com/pc/report-average-i-wow-i-session-just-over-two-hours-following-i-cataclysm-i-launch
- Tarng, Chen and Huang, "An Analysis of WoW Players' Game Hours", NetGames 2008/2009: traces of 34,524 players over
  two years; game hours alone predict whether a player renews at subscription expiry. [V, E1]
  https://homepage.iis.sinica.edu.tw/~swc/pub/wow_player_game_hours.html
- Khan, "Predicting Customer Churn in World of Warcraft" (arXiv 2006.15735, 2020): survival analysis on the WoWAH
  dataset, 96 % ROC AUC for churn within six months. [V, E1] https://arxiv.org/abs/2006.15735
- Zagal, Björk and Lewis, "Dark Patterns in the Design of Games", FDG 2013, pp. 39 to 46. Defines dark game design
  patterns as design that serves the creator against the player; the paper's temporal patterns include grinding and
  playing by appointment. [V, E2 for the definition; the pattern names are recalled from the paper and were not
  re-read in this pass] https://gup.ub.gu.se/file/101018. Critique: Deterding, Stenros and Montola, "Against 'Dark
  Game Design Patterns'", DiGRA 2020. [V] https://eprints.whiterose.ac.uk/156460/1/DiGRA_2020_paper_189.pdf
- Frommel and Mandryk, "Daily Quests or Daily Pests? The Benefits and Pitfalls of Engagement Rewards in Games",
  CHI PLAY 2022, 178 participants, mixed methods with validated motivation scales. Findings not retrieved. [U]
  https://doi.org/10.1145/3549489
- Alexandrovsky, Gerling, Opp, Hahn, Birk and Alsheail, "Disengagement From Games: Characterizing the Experience
  and Process of Exiting Play Sessions", Proc. ACM HCI (CHI PLAY) 2024, article 301. 16 interviews plus a 111-person
  survey. Disengagement is defined as ending a session intending to return; it is a multi-phase process (plan,
  adjust in game, think about re-engagement); players set time and achievement goals and use their knowledge of the
  game's structure to pick stopping points; the authors call for design that supports self-determined exits.
  [V, E1 qualitative] https://doi.org/10.1145/3677066 (open preprint https://arxiv.org/abs/2406.00189)
- "Exploring Inaction Inertia and Proactive Procrastination among MMORPG Players" (Final Fantasy XIV, hardcore vs
  casual), DiGRA 2025. Existence verified, findings not retrieved. [U] https://dl.digra.org/index.php/dl/article/view/2469

### Inferences
- [I] The corpse timer and the session length are the same number. If half of sessions in a Tibia-like are under
  about 30 minutes (Lineage II's 26-minute median is the only hard figure), then a 30-minute corpse timer means a
  death after the session's midpoint produces a corpse the player cannot reach before logging off, and that is gone
  (15 min corpse plus 15 min bones) when they return. Tibia 7.x had the same timers against 3-hour sessions, where
  the window was small relative to the session. Asterion kept Tibia's window and shrank the session. Two cheap fixes:
  a corpse that persists until the owner's next login for the first N minutes of that login, or a bag that walks
  itself to the depot after 30 minutes for a gold fee. Both keep the 10 % exp loss and the "run back" ritual while
  removing the appointment.
- [I] Zagal's "playing by appointment" is the lens for that. Asterion refuses dailies and FOMO [K], but a real-time
  corpse countdown is a small appointment: it decides when the player must act. Juul's setback punishment plus a
  clock is a compulsion loop in miniature. Stating the rule as "progress waits for you, and so does your bag" would
  make the pillar consistent.
- [I] Debeauvais predicts what retains a group of 5 friends: the social tie, not the exp curve. Guild rank was the
  strongest predictor of not stopping (88 % vs 71 %), achievement motivation predicted hours only. For Asterion that
  ranks party exp share, friends list, shared depot and the GM above any tuning of the level curve for retention,
  and it says the "level gap between friends" problem (scope item 4) is a retention problem, not a balance problem.
- [I] Breaks are the default, not churn. 23 % of WoW players kept paying through six months of not playing. A game
  that says "progress waits for you" matches how players already behave; it does not need rested exp as a lure. Rested
  exp was not found as a studied mechanic in any paper located; it stays an industry pattern (agent 2).
- [I] Alexandrovsky's finding that players pick stopping points from game structure makes the temple a designed
  exit. Respawn at the temple, free heal, 5-minute heartstone cooldown: a death already lands the player at the
  natural log-off spot. Showing "your corpse is safe until you return" on that screen would turn an involuntary exit
  into a self-determined one.

### Gaps
- Session-length medians for Tibia-likes specifically do not exist in the literature; Lineage II (2005) is the proxy.
- Debeauvais 2014, Frommel and Mandryk 2022, and the Ducheneaut 2006 pair were not read; their numbers would sharpen
  the hours-to-level and dailies arguments.
- No paper studies rested exp or offline progression as a mechanic.

---

## Q5. Small-population and social curves. Group size, rescue, and who hates death penalties

### Takeaway
Player-type theory predicts the split in reactions to a death penalty: achievers (Bartle 1996; Yee 2006's
achievement factor) lose the thing they value, socialisers gain a reason to help, and the literature on WoW says the
second group is the one that stays. Ducheneaut's "alone together" result (others as audience, not partners) and
Yee's 2008 respondents agree that harsh death forced grouping in EverQuest and that WoW's soft death dissolved it. In
a world of 5 friends the rescue and the corpse retrieval are the main co-op verbs the death system creates, and
blame after a wipe is the main thing it can destroy.

### Cited findings
- Bartle 1996 (achievers, explorers, socialisers, killers). [V, E2] https://mud.co.uk/richard/hcds.htm
- Yee, "Motivations for Play in Online Games", CyberPsychology and Behavior 9(6), 2006: achievement, social and
  immersion factors from a 3,000-player survey. [V, E1, paywalled] https://doi.org/10.1089/cpb.2006.9.772
- Debeauvais 2011: social motivation and guild rank predict not stopping; achievement does not (Q4). [V, E1]
- Yee 2008 Daedalus page 4: harsh death as filter and bond; blame as the breaker (Q1). [V, E3]
- Ducheneaut et al. 2006 "Alone Together" abstract: social activity over-estimated; players want an audience. [V, E1 abstract]
- Klastrup 2007: the social penalty of dying at the wrong time (Q1). [U on exact wording]

### Inferences
- [I] Asterion's five players are one guild. Debeauvais's guild-rank effect suggests that giving one friend the GM
  or officer role, and making party leadership visible, does retention work for free.
- [I] The rescue is the Fellowship aesthetic the death system buys. Corpse lootable by anyone for 30 minutes [K]
  means a friend can fetch the bag; the 20 % party bonus means the friend who stops hunting to help is paid a little.
  A "fetch my bag" request in the party UI is a one-line feature that turns Klastrup's social penalty into a social
  reward.
- [I] Blame is the design risk. Yee's 15-minute blame session is the anti-pattern. A death log that shows which
  creature did the final hit and whether the party shared the kill takes the guessing out, and Juul's "players rate
  games higher when they blame themselves" argues for making the cause legible.

### Gaps
- No group-size study for small persistent worlds (under 50 players). The WoW and EQ work assumes thousands.

---

## Q6. 2024 to 2026 work. What is new, and what is shipped vs research

### Takeaway
Nothing from 2024 to 2026 studies death penalties or progression curves in persistent worlds directly. The useful
new work is on exits (Alexandrovsky 2024) and churn modelling from telemetry (Blade and Soul and Korean MMORPG
papers, 2024 to 2025). Koster published a systems-design collection in 2026 that was not read. All of it is
research, none shipped as a mechanic.

### Cited findings
- Alexandrovsky et al., CHI PLAY 2024 (Q4). Research. [V]
- Blade and Soul churn with non-login imputation, MDPI Data 10(7):96 (2025), NCSoft data, micro AUC above 0.92,
  weighted F1 above 0.70. Research. [V, E1] https://www.mdpi.com/2306-5729/10/7/96
- Early churn detection from MMORPG logs with daily retention probabilities, Korea University with a Kakao Games
  analyst, 2024. Research. [V, E1] https://www.koreascience.or.kr/article/JAKO202428253381775.page
- DiGRA 2025 FFXIV procrastination paper (Q4). Research. [U on findings]
- Koster, "Gritty Systems Design" (PDF dated July 2026 on raphkoster.com). Not read. [U]
  https://www.raphkoster.com/wp-content/uploads/2026/07/Gritty-Systems-Design.pdf
- 2025 IJHCS paper arguing "disengagement is just as important as engagement" for wellbeing; authors not
  identified from the snippet. [U]

### Inferences
- [I] The churn papers all use daily login and progression-stall features. Asterion's telemetry (session, kill,
  death, level events, off by default) already records the inputs those models need; turning it on for the 5
  playtesters gives E1 data for "minutes between death and next login", the one number this whole note turns on.

### Gaps
- No 2024 to 2026 paper on death penalties, corpse runs, exp debt or skill by use was found. CHI PLAY and FDG
  proceedings for 2025 and 2026 were not searched page by page.

---

## Pattern cards found (theory-backed, each tied to a twin case)

### Card T5. Newbie fix (penalty onset by level)
- Lineage: EverQuest (no corpse retrieval below level 10, soon after 1999) -> Tibia (Rookgaard isolated from the
  main world) -> WoW (no exp loss at all, 2004) -> Tibia 8+ (exp loss shrinks with level, 2009 onward) [V, E2 via
  Klastrup 2007; agents 2 and 8 own the Tibia dates].
- Feeling: Challenge without early Submission; keeps the first-session funnel open.
- Mechanism: `deathExpLoss(L) = 0 for L < N, else p`, or a cost curve in minutes that starts near zero.
- Works when the first 5 hours are the churn point; breaks when the gate is visible and players die on purpose
  to travel (Klastrup's SWG exploit).
- Evidence: Klastrup 2007 [V, E2]; Yee 2008 on filters [V, E3].
- Cost S. Knobs: N, p, whether the bag also stays.
- Asterion: the cubic already gives 10 minutes at level 4; no second rule needed until exp/h by level is plotted.

### Card T6. Loss or debt (frame the same minutes two ways)
- Lineage: EverQuest exp loss (1999) -> City of Heroes exp debt (2004) and EverQuest II debt (2004) -> WoW
  durability only (2004) -> PoE 10 % loss kept and argued over (2013 to 2025) [V, E2 as design history; agents 1
  and 2 own the patch dates].
- Feeling: loss framing produces fiero on survival and resentment on death; debt framing produces Submission.
- Mechanism: loss `exp −= 0.1 × exp`; debt `gain ×= 0.5 until paid = 0.1 × exp`. Equal minutes, different sign.
- Evidence: Kahneman and Tversky 1979 [V, E1]; Mushtaq 2021 [V, E1 thesis]; Toh 2021 [V, E3].
- Cost S. Knobs: the fraction, the repayment rate, how the bar is drawn.
- Asterion: keeps the loss on purpose (P2). Test the debt frame only if level 8+ deaths read as unfair in playtests.

### Card T7. Corpse timer inside the session
- Lineage: UO corpse looting (1997) -> EverQuest corpse decay in days (1999) -> Tibia 7.x corpse and bones in 30
  minutes (2002) -> Valheim tombstone with no timer (2021) [V, E3; agents 1 and 2 own the specifics].
- Feeling: sunk cost pulls the player back (Challenge); when the timer crosses the session end it becomes an
  appointment (Zagal) and reads as unfair.
- Mechanism: corpse lifetime ≥ the median session, or lifetime measured in the owner's online minutes.
- Evidence: Pittman and GauthierDickey 2007 and Kim et al. (50 % of sessions under 26 min) [V, E1]; Zagal 2013
  [V, E2]; Alexandrovsky 2024 on planned exits [V, E1].
- Cost S to M. Knobs: timer, who may loot, pause while offline.
- Asterion: 30 real minutes against 30 to 60 minute sessions is the one number in this note that looks wrong.

### Card T8. Social penalty over system penalty
- Lineage: EverQuest corpse drags and rez requests (1999) -> Tibia's party and blessing culture -> WoW's spirit
  healer that needs nobody (2004) [V, E3].
- Feeling: Fellowship when a friend fetches the bag; the anti-pattern is 15 minutes of blame.
- Mechanism: corpse lootable by party members; a one-click "fetch my bag" request; a death log naming the killer and
  the party share.
- Evidence: Yee 2008 [V, E3]; Klastrup 2007 [U wording]; Debeauvais 2011 on social retention [V, E1].
- Cost S. Knobs: who may loot, whether helping pays.
- Asterion: the corpse is already lootable by anyone; the request and the log are missing.

### Card T9. Geometric tries as the practice law
- Lineage: Ultima Online skill gains slowing toward 100 (1997) -> RuneScape's 1.1-based exp table (2001) -> Tibia
  7.x 1.1 per skill rung (2002) -> Asterion 1.08 (D149, 2026) [V for Asterion [K]; agents 1 and 8 for the twins].
- Feeling: Challenge for the first hours, then Submission; the number keeps the player company after learning ends.
- Mechanism: `tries(L→L+1) = base × r^(L−10)`, so skill is logarithmic in practice, the shape of the power law.
- Evidence: Newell and Rosenbloom 1981, Heathcote et al. 2000 [V, E1]; Koster 2004 fun-as-learning [V, E2].
- Cost S. Knobs: r per skill, base, the damage weight per rung.
- Asterion: the honeymoon ends near sword 50 (14 h); plan the Discovery and Fellowship handoff for the hours after.

### Card T10. Social motivation retains, achievement fills the week
- Lineage: EverQuest forced grouping (1999) -> WoW guilds and the 2010 survey -> small-group MMOs that ship with a
  friends list first [V, E1 for WoW].
- Feeling: Fellowship as the retention aesthetic; Challenge as the hours aesthetic.
- Mechanism: give the social structure a rank and a job; measure stop rate by rank.
- Evidence: Debeauvais 2011 (88 % vs 71 % stop rate by guild rank; achievement r = .20 with hours only) [V, E1].
- Cost S. Knobs: party roles, shared depot, GM role.
- Asterion: party exp share and shared depot are already the retention features; the level curve is not.

---

## Glossary additions (candidates for `docs/formats/design-curves.md`)

| Term | One-line meaning | Source |
|---|---|---|
| Corpse run | The walk from the respawn point back to one's own corpse to recover dropped items, inside a timer. A setback punishment with distance and minutes lost. | Klastrup 2007; practice (EverQuest 1999, Tibia 2002) |
| Exp loss / exp debt | Two framings of one death cost. Loss removes earned exp (the bar moves back). Debt halves future gain until a sum is repaid (the bar stands still). Same minutes, different reference point. | Kahneman and Tversky 1979; City of Heroes 2004 |
| Loss aversion | Losses weigh about twice as much as equal gains against the player's reference point. Explains why exp loss feels harsher than exp debt at equal recovery time. | Kahneman and Tversky 1979 |
| Sunk cost (in play) | Continuing an action because of what was already spent, not what remains to gain. The corpse timer uses it. | Toh 2021 |
| Newbie fix | A level below which death carries almost no penalty. | Klastrup 2007 |
| Power law of practice | Time per action falls as a power of repetitions: fast gains first, a long flat tail. The exponential alternative (Heathcote 2000) fits individuals better; the design shape is the same. | Newell and Rosenbloom 1981; Heathcote et al. 2000 |
| Skill grind | Repetitions the skill number still demands after the player's mental model is complete. Not Cook's skill burnout (where the skill stops being useful). | series, from Koster 2004 and Cook 2007 |
| Exp stages | Piecewise exp multipliers by level band (Open Tibia practice: high at low levels, 1× late). A rescaling of exp/h, not a new curve family; it rescales the price of a death the same way. | agent 2's note for sources; practice |
| Playing by appointment | A rule that decides when the player must play (dailies, decay timers). A dark pattern when it serves the creator over the player. | Zagal, Björk and Lewis 2013 |
| Disengagement (designed exit) | Ending a session while intending to return; players plan it from the game's structure, so the game can offer good stopping points. | Alexandrovsky et al. 2024 |
| Heavy-tailed sessions | Session lengths with many short and a few very long sessions; report the median, never the mean. Lineage II median about 26 minutes. | Pittman and GauthierDickey 2007; Chen, Huang and Lei 2006 |

---

## Sources

1. Klastrup, L. "Why Death Matters: Understanding Gameworld Experience." Journal of Virtual Reality and Broadcasting
   4 (2007), no. 3. DOI 10.20385/1860-2037/4.2007.3. Open PDF. https://www.jvrb.org/jvrb/article/view/4.2007.3
2. Klastrup, L. "What makes World of Warcraft a world? A note on death and dying." 2008. Listing only.
   https://pure.itu.dk/da/publications/what-makes-world-of-warcraft-a-world-a-note-on-death-and-dying/
3. Yee, N. "Social Architectures in MMOs." The Daedalus Project, 10 June 2008, page 4.
   https://nickyee.com/daedalus/archives/001625.php?page=4
4. Allison, F., Carter, M., Gibbs, M. "Good Frustrations: The Paradoxical Pleasure of Fearing Death in DayZ." OzCHI
   2015. Open PDF. https://minerva-access.unimelb.edu.au/bitstream/handle/11343/57076/AllisonCarterGibbs%20DayZ%202015%20OzCHI%20CAMERA%20READY.pdf
5. Carter, M., Allison, F. "Fear, loss and meaningful play: Permadeath in DayZ." Journal of Gaming and Virtual Worlds
   9(2), 2017. Paywalled. https://doi.org/10.1386/jgvw.9.2.143_1
6. Kang, A. R. et al. "Rise and fall of online game groups / ArcheAge closed beta behaviour." WWW 2017 companion.
   https://arxiv.org/abs/1703.01500
7. Kahneman, D., Tversky, A. "Prospect Theory: An Analysis of Decision under Risk." Econometrica 47(2), 1979.
   Paywalled. https://doi.org/10.2307/1914185
8. Mushtaq, A. "Presence and Effects of Loss Aversion in an Adventure Video Game." MSc thesis, University of
   Saskatchewan, 2021. https://harvest.usask.ca/handle/10388/13478
9. Toh, W. "The Player Experience and Decision-Making in Video Games (economic concepts)." Game Studies 21(3), 2021.
   https://gamestudies.org/2103/articles/toh
10. Juul, J. "Fear of Failing? The Many Meanings of Difficulty in Video Games." 2009. https://www.jesperjuul.net/text/fearoffailing/
11. Newell, A., Rosenbloom, P. "Mechanisms of skill acquisition and the law of practice." 1981. Summary:
    https://en.wikipedia.org/wiki/Power_law_of_practice
12. Heathcote, A., Brown, S., Mewhort, D. J. K. "The power law repealed: The case for an exponential law of
    practice." Psychonomic Bulletin and Review 7(2), 2000. https://doi.org/10.3758/BF03212979 (open copy
    https://ogma.newcastle.edu.au/vital/access/manager/Repository/uon:2058)
13. Evans, N. J. et al. "Refining the Law of Practice." 2018.
    https://figshare.utas.edu.au/articles/journal_contribution/Refining_the_Law_of_Practice/22964183
14. Koster, R. "Do levels suck?" 16 Dec 2005. https://www.raphkoster.com/2005/12/16/do-levels-suck/
15. Koster, R. "Do levels suck? Part II." 22 Dec 2005. https://www.raphkoster.com/2005/12/22/do-levels-suck-part-ii/
16. Koster, R. "Gritty Systems Design." PDF, July 2026. Not read.
    https://www.raphkoster.com/wp-content/uploads/2026/07/Gritty-Systems-Design.pdf
17. Linehan, C., Bellord, G., Kirman, B., Morford, Z. H., Roche, B. "Learning curves: analysing pace and challenge
    in four successful puzzle games." CHI PLAY 2014. https://doi.org/10.1145/2658537.2658695 (open
    https://cora.ucc.ie/handle/10468/3461)
18. Visani Scozzi, M., Iacovides, I., Linehan, C. "A mixed method approach for evaluating and improving the design
    of learning in puzzle games." CHI PLAY 2017. https://eprints.whiterose.ac.uk/130552/
19. Schreiber, I. "Level 7: Advancement, Progression and Pacing." Game Balance Concepts, 18 Aug 2010.
    https://gamebalanceconcepts.wordpress.com/2010/08/18/level-7-advancement-progression-and-pacing/
20. Castronova, E. "Virtual Worlds: A First-Hand Account of Market and Society on the Cyberian Frontier." CESifo
    Working Paper 618, Dec 2001. https://www.cesifo.org/DocDL/cesifo_wp618.pdf
21. Bartle, R. "Hearts, Clubs, Diamonds, Spades: Players Who Suit MUDs." 1996. https://mud.co.uk/richard/hcds.htm
22. Yee, N. "Motivations for Play in Online Games." CyberPsychology and Behavior 9(6), 2006. Paywalled.
    https://doi.org/10.1089/cpb.2006.9.772
23. Debeauvais, T., Nardi, B., Schiano, D., Ducheneaut, N., Yee, N. "If you build it they might stay: retention
    mechanisms in World of Warcraft." FDG 2011. Open PDF. https://www.artifex.org/~bonnie/WoW_retention_04_24_11.pdf
    DOI https://doi.org/10.1145/2159365.2159390
24. Debeauvais, T., Lopes, C. V., Yee, N., Ducheneaut, N. "Retention and progression: Seven months in World of
    Warcraft." FDG 2014. https://isr.uci.edu/node/2256.html
25. Ducheneaut, N., Yee, N., Nickell, E., Moore, R. J. "Building an MMO With Mass Appeal: A Look at Gameplay in
    World of Warcraft." Games and Culture 1(4), 2006. Paywalled. https://doi.org/10.1177/1555412006292613
26. Ducheneaut, N., Yee, N., Nickell, E., Moore, R. J. "Alone Together? Exploring the Social Dynamics of Massively
    Multiplayer Online Games." CHI 2006. Paywalled. https://doi.org/10.1145/1124772.1124834
27. Pittman, D., GauthierDickey, C. "A Measurement Study of Virtual Populations in Massively Multiplayer Online
    Games." NetGames 2007. Open PDF. https://www.cs.du.edu/~chrisg/publications/pittman-netgames07.pdf
28. Chen, K.-T., Huang, P., Lei, C.-L. "How sensitive are online gamers to network quality?" and ShenZhou Online
    session traces, INFOCOM 2006. https://people.cs.nycu.edu.tw/~chuang/pubs/pdf/2006infocom.pdf
29. Raptr via Game Developer. "Average WoW session just over two hours following Cataclysm launch." Dec 2010.
    Vendor figure. https://www.gamedeveloper.com/pc/report-average-i-wow-i-session-just-over-two-hours-following-i-cataclysm-i-launch
30. Tarng, P.-Y., Chen, K.-T., Huang, P. "An Analysis of WoW Players' Game Hours." NetGames 2008.
    https://homepage.iis.sinica.edu.tw/~swc/pub/wow_player_game_hours.html
31. Khan, S. "Predicting Customer Churn in World of Warcraft." arXiv 2006.15735, 2020. https://arxiv.org/abs/2006.15735
32. Zagal, J. P., Björk, S., Lewis, C. "Dark Patterns in the Design of Games." FDG 2013. Open PDF.
    https://gup.ub.gu.se/file/101018
33. Deterding, S., Stenros, J., Montola, M. "Against 'Dark Game Design Patterns'." DiGRA 2020.
    https://eprints.whiterose.ac.uk/156460/1/DiGRA_2020_paper_189.pdf
34. Frommel, J., Mandryk, R. L. "Daily Quests or Daily Pests? The Benefits and Pitfalls of Engagement Rewards in
    Games." CHI PLAY 2022. https://doi.org/10.1145/3549489
35. Alexandrovsky, D., Gerling, K., Opp, M. S., Hahn, C. B., Birk, M. V., Alsheail, M. "Disengagement From Games:
    Characterizing the Experience and Process of Exiting Play Sessions." Proc. ACM HCI (CHI PLAY) 2024.
    https://doi.org/10.1145/3677066 (preprint https://arxiv.org/abs/2406.00189)
36. "Exploring Inaction Inertia and Proactive Procrastination among MMORPG Players." DiGRA 2025.
    https://dl.digra.org/index.php/dl/article/view/2469
37. Blade and Soul churn prediction with non-login imputation. MDPI Data 10(7):96, 2025.
    https://www.mdpi.com/2306-5729/10/7/96
38. Early churn detection from MMORPG logs (Korea University, Kakao Games). 2024.
    https://www.koreascience.or.kr/article/JAKO202428253381775.page
39. Kingsfoil, Hearthguard theory glossary (flow, Koster, Juul, MDA, DDA, Cook, Linehan, SDT), 2026.
    `studies/curves-hearthguard/notes/00a-glossary-theory.md`
40. Kingsfoil, Asterion CONTEXT.md (the [K] facts). `studies/curves-asterion/notes/CONTEXT.md`
