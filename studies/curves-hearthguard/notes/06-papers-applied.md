# 06. Academic papers applied to Hearthguard's conditions

Angle. Papers that explain specific cases in co-op wave defense, tower defense, horde and MOBA-like PvE, read against
Hearthguard's conditions (real-time, one hero per lane, fixed waves, high cost of failure, co-op 1-3, browser).
Definitions of flow, MDA, Juul, Hamlet, the L4D director, skill atoms, PENS and CORGIS live in `00a-glossary-theory.md`
and are not repeated. EOMM, Denisova & Cairns 2015a/b and Smeddinck 2016 are also already there.

Method note. Full text was read with `pdftotext` for Xue et al. 2017, Cox et al. 2012, Klarkowski et al. 2016,
Zeng & Sweetser 2022 and Hind & Harvey (NEAT TD). Abstracts or secondary summaries only for the rest, marked as such.
ACM DL, IEEE Xplore, Springer and ResearchGate blocked direct fetches (redirect to login or 403). About 33 tool calls.

Sample-size flags. "Lab" means a supervised session under one hour. "Small" means under 50 participants. Most of the
academic evidence on challenge is small and lab-only. The only large-N result here (Xue, about 2 million players a day)
comes from a level-based mobile puzzle game, not a real-time defense game.

---

## Q1. What do tower defense and wave-defense papers say about wave balancing and adapting waves?

### Takeaway
The TD research is thin and mostly about generating waves, not about how waves feel. The few player studies are tiny
(11 to 30 players) and find either "no difference from hand-made waves" or "more enjoyable" with no numbers. What
they give Hearthguard is the vocabulary of levers. Sutoyo et al. used three scalars between waves (enemy stats, gold,
spawn count). That is stat DDA plus supply DDA plus a pacing knob in one system, and Hearthguard should split them.

### Cited findings
- Avery, Togelius, Alistar, van Leeuwen, "Computational intelligence and tower defence games", IEEE CEC 2011.
  Position paper. Proposes TD as a test-bed for casual-games AI research and shows a prototype TD built on
  experience-driven procedural content generation. No player study found. [V, E2] [P1] (abstract only)
- Sutoyo, Winata, Oliviani, Supriyadi, "Dynamic difficulty adjustment in tower defence", Procedia Computer Science
  vol. 59, 2015. Between waves the system reads player health, enemy health and skill points, then moves three
  scalars. A "status point" changes enemy power and health, a "gold point" changes end-of-wave income, a "spawn point"
  changes enemy count. [V, E2] [P2] (described by Hind & Harvey; original not read). Hind & Harvey criticise it. The
  hand-picked multipliers cause "difficulty swings" if set wrong, and health metrics are side effects of the defense,
  not a measure of skill. [V, E2] [P3]
- Hind & Harvey, "A NEAT Approach to Wave Generation in Tower Defense Games" (Birmingham City University, IMET; Unity
  2020.2, so about 2021-22). A NEAT network takes the count of each tower type and outputs a spawn priority per enemy
  type. Blind A/B test, 11 players per group (N=22), Game Experience Questionnaire core module. No statistically
  significant difference between AI and hand-designed waves on any of the seven GEQ components. [V, E1] [P3]
  Small sample, played at home, one session. A Springer journal version (Personal and Ubiquitous Computing, 2024)
  reports the same "no discernible difference". [V, E1] [P4] (abstract via search)
- Colwell & Glavin, "Colwell's Castle Defence", arXiv 2018. Arcade wave-survival. At the end of each level the AI reads
  player health and gate health and sets the next level's enemy spawn rate tier. 30 players. Authors report "more
  enjoyable gameplay" from questionnaires, with no numbers in the abstract. [V, E1] [P5] Small, lab.
- Bergdahl & Sestini (EA SEED), CoG 2024. Hybrid scripted plus RL agent for Plants vs. Zombies won 57.12% of 40
  levels vs 47.95% for heuristic-only AI. A playtesting bot, not DDA. [V, E1] [P6]
- TowerMind (arXiv 2601.05899, January 2026). TD benchmark for LLM agents. Reports LLMs plan poorly and waste actions
  in TD. [V, E1] [P7] Preprint.

### Inferences
- [I] Gate health in Colwell's castle defence is the same signal as Hearthguard's Hearth HP. A between-chapter spawn
  rate tier keyed on Hearth HP lost is the closest academic precedent for a pacing-only adjustment in Hearthguard.
  Note that changing spawn rate is pacing DDA, which is DDA, not a pacing director, because it reads performance.
- [I] Hind & Harvey's null result is useful in reverse. Players could not tell generated waves from hand-made ones in
  one session. For Hearthguard that means the 30 hand-authored waves are not the bottleneck. The curve shape is.
- [I] The bot-vs-heuristic gap in Bergdahl & Sestini (about 9 points) supports `01-current-build.md`'s rule that the
  sim_bot is a floor for a person, not an estimate.

### Gaps
- Rummell 2011 (adaptive AI for TD) and Lim & Harrell on TD balancing were not found under those names. Possibly
  misremembered citations. Not chased further.
- No TD paper measures win rate by wave or quit point by wave. No study on Kingdom Rush or WC3 TD maps.
- Sutoyo 2015 original not read, so its player numbers (if any) are unknown.

---

## Q2. What does DDA with measured outcomes say, at scale and in co-op?

### Takeaway
The one large field test (Xue et al., EA, 2017) is the strongest evidence in this note. It adjusted only an invisible
lever (which board seed you get) and only to keep players out of states with high churn, and it raised rounds played
4.4-7.9% and play time up to 9.0%, revenue-neutral. Its key insight transfers to Hearthguard. Churn depends on the
pair (level, trial), and a loss on attempt 3 is more dangerous than a loss on attempt 1. Co-op DDA research is small.
Its one clear player finding is that mobs must not change strength mid-fight.

### Cited findings
- Xue, Wu, Kolen, Aghdaie, Zaman, "Dynamic Difficulty Adjustment for Maximized Engagement in Digital Games",
  WWW 2017 Companion, pp. 465-471, doi 10.1145/3041021.3054170. [V, E1] [P8]
  - Model. States are (level k, trial t). From each state a player wins and advances, loses and retries, or churns.
    Churn after a win and churn after a loss are measured separately per state as no play for 7 days. The system
    picks the win rate per state that maximises expected total rounds before churn, by dynamic programming, with
    retries capped at 30.
  - Lever. A mobile match-three game with 200+ levels. Each round uses one of 100 board seeds. At one level the
    easiest seed won 75% of the time and the hardest 15%, so the hardest takes about 5x more tries. DDA picks one seed
    at random from the top five candidates. Designers rejected changing the goal because players notice it on retry.
  - Sample. Daily rounds of roughly 0.7-1.4 million per arm per platform, in three phases over 3+ months, iOS and
    Android.
  - Result. Rounds per day +4.4% to +7.9% across the six phase-platform cells. Play time per day up to +9.0%. No
    significant revenue difference. Gains were largest for early players and shrank in phase III when fewer new
    players arrived.
  - Retention pattern. Population falls with or without difficulty in levels 1-20. A small difficulty rise at level 21
    caused a big drop. Above level 80 the population is flat despite very hard levels.
  - Caveat. Engagement figures are the vendor's own. Level-based puzzle, not real-time.
- Ben Or, Kolomenkin, Shabat (Playtika), "DL-DDA", arXiv 2106.03075, 2021. A mini-game where DDA sets the points
  needed to finish. A/B of about 800,000 control vs 200,000 test players over 8 days. Target completion was 8-10%.
  Rule-based reached 12.0%, the ML model 8.7%, and clusters above 16% completion fell from 49 to 5. [V, E1] [P9]
  Vendor-reported, measures hit rate on a target, not fun or retention.
- Zeng & Sweetser, "Dynamic Difficulty Adjustment in a Multiplayer Minecraft Server", OzCHI 2022 (ANU). [V, E1] [P10]
  - Mob level is a distance-weighted average of nearby players' performance scores (kills, deaths, blocking rate,
    skill levels), so closer players count more. Mob level and HP shown over heads.
  - 23 players, online, recruited from one small server. Three scenarios, the last two with DDA on.
  - Enjoyment flat at 4.2, 4.2, 4.3 of 5. Rated difficulty rose 2.0, 2.8, 3.1 of 5 with DDA. In scenario 3, 85% rated
    skeletons "hard" or "too hard" to defeat yet rated overall difficulty "neutral".
  - In scenario 3 the system re-levelled mobs at intervals. The third most common thought while reading mob levels was
    hoping their strength would not change (13 of 23). Authors conclude a mob changing level mid-fight feels like lost
    work.
  - Small, self-selected, one session.
- Baldwin, Johnson, Wyeth, "Crowd-Pleaser: Player Perspectives of Multiplayer DDA", CHI PLAY 2016, pp. 326-337. Builds on
  their 2013 framework for competitive multiplayer DDA. [V, E2] [P11] (metadata only; methods and N not read)
- Vicencio-Moreira, Mandryk, Gutwin, "Balancing multiplayer FPS games using aiming assistance", IEEE GEM 2014, and
  the 2016 Saskatchewan thesis "Player Balancing for First-Person Shooter Games". Five studies in a UDK shooter. Two
  techniques, Combo and Delay, balanced even large skill gaps, and enjoyment rose for players at all skill levels.
  [V, E1] [P12] (thesis abstract; N per study not given). Lab. Competitive, not co-op.
- Demediuk, Tamassia, Raffe, Zambetta, Li, Mueller, "Monte Carlo tree search based algorithms for DDA", IEEE CIG 2017,
  pp. 53-59. MCTS fighting-game opponents that target zero health difference at the end of a match, tested against AI
  and humans. [V, E1] [P13] (abstract only; win rates and N not read)
- Constant & Levieux, "Dynamic Difficulty Adjustment Impact on Players' Confidence", CHI 2019, p. 463. [U] [P14] The
  brief named it a risk-taking study. The listing shows a study of confidence. Method and results not read.

### Inferences
- [I] Hearthguard's natural Xue state is (chapter, attempt). The run restarts from chapter 1, so "attempt" means the
  attempt at reaching that chapter. The telemetry already logs game_over with chapter and wave, so the churn surface
  can be computed from the `plays` table once there are enough players. With 5 playtesters it cannot. Treat it as the
  metric to log now, not a system to build.
- [I] Xue's lever rule (adjust only what a retrying player cannot see) clashes with the glossary's preference for
  player-steered difficulty. Hearthguard has fixed waves, so an invisible seed lever does not exist. The honest
  analogue is supply DDA between chapters (campfire gold or Hearth refill), which players do notice. That points to a
  visible stacking assist rather than hidden adjustment.
- [I] Xue's level-21 cliff matches Hearthguard's data. Real players never got past chapter 2 (`01-current-build.md`).
  Early players are the most sensitive to a small rise, so the chapter 1 to chapter 2 jump (mob HP x2.3) is where to
  spend tuning effort first.
- [I] Zeng & Sweetser's distance weighting maps to lanes. In Hearthguard each player owns a corridor, so each lane can
  have its own scaling input, and only the shared Hearth and the boss are group-level. Their mid-fight complaint gives a
  hard rule. Any adjustment applies at wave_start, never to mobs already alive.

### Gaps
- Hunicke 2005 ACE results (Hamlet in Half-Life) not read. The glossary notes list it as not read too.
- Missura & Gärtner 2009 and Andrade et al. 2005 not reached in budget.
- No paper found on DDA for co-op PvE where players share one loss condition (a shared Hearth). This is the biggest
  hole for Hearthguard.
- Gerling et al. on balancing in exergames and Liu et al. on aim assistance not reached.

---

## Q3. Challenge, tempo and failure. What do the controlled studies show?

### Takeaway
Two lab studies speak straight to Hearthguard's waves. Cox et al. (2012, a tower defense) found more clicking does not
raise immersion but time pressure does. Klarkowski et al. (2016, Left 4 Dead 2 with the director on) found the balanced
mode best, and overload more enjoyable than boredom. Together they say the Horde's "faster than you can clear" design
is sound if the pressure is on thinking and choosing, not on clicks. Both are small lab samples of young students.

### Cited findings
- Cox, Cairns, Shah, Carroll, "Not doing but thinking: the role of challenge in the gaming experience", CHI 2012,
  pp. 79-88. Immersion measured with the IEQ. [V, E1] [P15]
  - Study 1. A tower defense game. Physical challenge raised by requiring more interactions. 40 analysed players aged
    18-24. Action count differed as intended (F(1,38)=13.17, p<0.001), but immersion did not (F(1,38)=0.09, p=0.766).
    Expertise correlated with performance (r=0.62). The expertise main effect on the challenge factor was significant
    (F(1,23)=4.42, p=0.047). Low-expertise players found being forced to play faster frustrating.
  - Studies 2-3. Bejeweled timed vs untimed, 22 players. Time pressure raised overall immersion (t(10)=6.36) and the
    challenge factor (t(10)=9.59), p<0.05, with no significant score difference.
  - Conclusion. Felt challenge is expertise interacting with cognitive challenge, not the amount of input.
- Klarkowski, Johnson, Wyeth, McEwan, Phillips, Smith, "Operationalising and Evaluating Sub-Optimal and Optimal Play
  Experiences through Challenge-Skill Manipulation", CHI 2016, pp. 5583-5594. [V, E1] [P16]
  - Game. A Left 4 Dead 2 map. Boredom removed special infected. Balance left standard L4D2 with its director. Overload
    raised spawn rates, herd size, damage, and special infected HP x4 (tanks at 16,000 HP), spawned more zombies behind
    the player and removed the zombie cap.
  - 45 players (33 male) aged 17-29, between-subjects.
  - Balance scored well on positive measures. Boredom gave the lowest negative affect and the highest competence.
    Overload beat boredom on enjoyment and positive affect. Authors note overload also removed "cooldown spots" for
    healing and regrouping.
- Cuerdo, Mahajan, Melcer, "Die-r Consequences: Player Experience and the Design of Failure through Respawning
  Mechanics", IEEE CoG 2021, doi 10.1109/COG52621.2021.9618894. Same platformer, 72 players, between-subjects,
  respawn point varied (permadeath, level start, last checkpoint, last manual save). Respawn point changed player
  experience. Checkpoints scored lower on autonomy and curiosity than savepoints or level restart. [V, E1] [P17]
  (abstract and snippet; full tables not read). Lab, single-player.
- "A Good Reason to Die: How Avatar Death and High Challenges Enable Positive Experiences", CHI 2017,
  doi 10.1145/3025453.3026047. Argues avatar death and high challenge can produce positive, meaningful experiences.
  [V, E2] [P18] (abstract only; authors, method and N not confirmed)
- Allart, Levieux, Pierfitte, Guilloux, Natkin, "Difficulty influence on motivation over time in video games using
  survival analysis", FDG 2017, doi 10.1145/3102071.3102085. Survival analysis of Ubisoft telemetry from Rayman Legends
  and The Division. [V, E1] [P19] (metadata only; results not read). This is the closest published analogue to
  computing a quit-point curve from Hearthguard's `plays` table.

### Inferences
- [I] Cox's study 1 is a warning for the MOBA scheme on phones. Raising wave tempo so players must click more does not
  buy immersion and frustrates low-expertise players. Raise decision load per second instead (which lane to help,
  when to relight a fire, when to call the next wave early).
- [I] Klarkowski's overload condition is close to Hearthguard's chapters 3-5 (more spawns, more damage, no cooldown
  spots, and the dark always on). Overload beat boredom, so the late run being too hard is the lesser problem. But it
  lost to balance, and it took away the relief beats. That matches the finding that the sawtooth only exists in
  chapter 1.
- [I] Cuerdo et al. say the respawn point alone moves experience. Hearthguard has two failure grains, hero death
  (timer, low cost) and Hearth fall (restart run, high cost). A chapter-start "save" after a Hearth fall would be the
  savepoint option, which scored better on autonomy than checkpoints. Untested in real-time co-op.

### Gaps
- Iacovides/Cox follow-ups on difficulty and immersion and Anderson et al. on failure messages not reached.
- No controlled study of shared-loss failure in co-op (one player's lane collapses, everyone restarts).

---

## Q4. Power curves and progression

### Takeaway
Not covered in budget. No paper was read on reward schedules or experience curves in ARPGs or roguelites
(Hamari, Wang et al.). Gap stated, not filled.

### Gaps
- Hamari on progression, Wang et al. on experience curves, Missura & Gärtner on player types, Gerling et al. on co-op
  skill balancing. All unread.

---

## Pattern cards

### P-A. Churn-surface logging (level x attempt)
- Lineage. Xue et al. 2017 at EA (match-three) -> Playtika DL-DDA 2021 (target completion bands) -> Allart et al.
  2017 survival analysis on Ubisoft data (why: quit risk depends on where you are and how many times you failed there).
- Feeling it protects. "One more try" instead of "I'm done".
- Mechanism. For each (chapter reached, attempt number) store win rate, churn after a win and churn after a loss
  (no play within 7 days). Plot it as a surface. The cell where churn after a loss jumps is the spike to fix.
- Works when there are many players. Breaks with 5 playtesters (cells are empty). Useful as an alarm only past roughly
  a few hundred plays.
- Evidence. [V, E1] Xue +4.4-7.9% rounds, up to +9.0% play time, revenue-neutral, with roughly 2 million rounds a
  day [P8]. Vendor-reported.
- Cost S (a SQL view over `plays`). Knobs are the churn window (7 days) and the attempt cap (Xue used 30).
- Hearthguard. Add attempt number per player to `plays` now. Read the surface before tuning chapter 2.

### P-B. Adjust at wave start, never mid-fight
- Lineage. Hamlet (stat changes between encounters) -> Sutoyo 2015 (between waves) -> Colwell 2018 (between levels)
  -> Zeng & Sweetser 2022 (players disliked mid-fight re-levelling).
- Feeling it protects. Fairness. Work already done on a mob is not erased.
- Mechanism. Any adjustment (spawn count, gold, Hearth refill) is computed at wave_end and applied at the next
  wave_start. Live mobs keep their stats.
- Breaks when the adjustment is large enough that wave-to-wave jumps read as swings (Hind & Harvey's critique of
  hand-picked scalars).
- Evidence. [V, E1] 13 of 23 players hoped mob strength would not change mid-fight [P10]. Small sample.
- Cost S. Knob is the cap per step.
- Hearthguard. Fits the existing director rule ("paces but never adjusts stats"). If supply DDA is added, apply it at
  the campfire.

### P-C. Pressure on decisions, not clicks
- Lineage. Cox et al. 2012 (TD and Bejeweled) -> Klarkowski et al. 2016 (L4D2 overload) (why: immersion follows
  cognitive challenge and expertise, not input count).
- Feeling. Tension without frustration for low-skill players.
- Mechanism. When raising a beat's difficulty, add a choice under time (two lanes leaking, a fire going out, an
  early-call bonus) before adding mobs that demand more clicks.
- Breaks on phones if each choice needs precise input, and for novices when tempo rises without decisions.
- Evidence. [V, E1] More interactions gave no immersion change (p=0.766, N=40); time pressure raised immersion
  (N=22) [P15]. Lab, students.
- Cost S-M. Knobs are surge spacing in the Horde, fire burn-down time, the early-call gold rate.
- Hearthguard. Test the Horde (w4) with fewer, tougher surges and one fire timing out, against more mobs.

### P-D. Overload beats boredom, but keep cooldown spots
- Lineage. L4D director relax phase (glossary) -> Klarkowski 2016 overload removed it.
- Feeling. Relief after a peak.
- Mechanism. Even in late chapters keep a guaranteed low-threat window after each peak. The 12 s gap and the 25 s
  campfire already exist. Do not let the dark plus spawn growth erase them.
- Evidence. [V, E1] Overload > boredom on enjoyment, balance best overall, N=45 [P16]. Lab.
- Cost S. Knob is the length of the wave gap in chapters 3-5.
- Hearthguard. Check in telemetry whether mobs from wave n are still alive when wave n+1 starts in chapters 3-5.

## Glossary additions
- Churn surface. Churn rate after a win and after a loss, per (level, attempt). From Xue et al. 2017.
- Cooldown spot. A place or moment with low enough threat to heal, regroup and restock. Klarkowski et al. 2016,
  after a Left 4 Dead community term. Close to relief beat, but spatial.

## Sources
- [P1] Avery, P., Togelius, J., Alistar, E., van Leeuwen, R. P. (2011). Computational intelligence and tower defence games. IEEE CEC. https://ieeexplore.ieee.org/document/5949738 (abstract only)
- [P2] Sutoyo, R., Winata, D., Oliviani, K., Supriyadi, D. M. (2015). Dynamic difficulty adjustment in tower defence. Procedia Computer Science 59. Described in [P3]; original not read.
- [P3] Hind, D. & Harvey, C. A NEAT Approach to Wave Generation in Tower Defense Games. Birmingham City University. https://www.open-access.bcu.ac.uk/13568/1/A_NEAT_Approach_to_Wave_Generation_in_Tower_Defense_Games___IMET.pdf
- [P4] Journal version (2024), Personal and Ubiquitous Computing. https://link.springer.com/article/10.1007/s00779-024-01801-z (login wall; abstract via search)
- [P5] Colwell, A. M. & Glavin, F. G. (2018). Colwell's Castle Defence. arXiv. https://aitopics.org/doc/arxivorg:6F757EB4
- [P6] Bergdahl, J. & Sestini, A. (2024). Reinforcement Learning for High-Level Strategic Control in Tower Defense Games. IEEE CoG. https://arxiv.org/pdf/2406.07980
- [P7] TowerMind (2026). arXiv preprint. https://arxiv.org/html/2601.05899
- [P8] Xue, S., Wu, M., Kolen, J., Aghdaie, N., Zaman, K. A. (2017). Dynamic Difficulty Adjustment for Maximized Engagement in Digital Games. WWW Companion. https://archives.iw3c2.org/www2017/proceedings/companion/p465.pdf
- [P9] Ben Or, D., Kolomenkin, M., Shabat, G. (2021). DL-DDA. arXiv. https://ar5iv.labs.arxiv.org/html/2106.03075
- [P10] Zeng, Z. & Sweetser, P. (2022). Dynamic Difficulty Adjustment in a Multiplayer Minecraft Server. OzCHI. https://openresearch-repository.anu.edu.au/bitstreams/4ae20c15-6ca4-4171-ac7a-ae5393491e0b/download
- [P11] Baldwin, A., Johnson, D., Wyeth, P. (2016). Crowd-Pleaser. CHI PLAY. https://bibtex.github.io/CHI-PLAY-2016-Baldwin0W.html (metadata only)
- [P12] Vicencio-Moreira, R. (2016). Player Balancing for First-Person Shooter Games. MSc thesis, University of Saskatchewan. https://harvest.usask.ca/items/949fd3f0-0a4b-475d-822c-823e9d11e5bc/full
- [P13] Demediuk, S. et al. (2017). Monte Carlo tree search based algorithms for dynamic difficulty adjustment. IEEE CIG. https://opus.lib.uts.edu.au/handle/10453/127485 (abstract only)
- [P14] Constant, T. & Levieux, G. (2019). Dynamic Difficulty Adjustment Impact on Players' Confidence. CHI. https://dblp.uni-trier.de/rec/conf/chi/ConstantL19.html (metadata only)
- [P15] Cox, A. L., Cairns, P., Shah, P., Carroll, M. (2012). Not doing but thinking. CHI. https://www-users.york.ac.uk/~pc530/pubs/Cox_CHI2012.pdf
- [P16] Klarkowski, M. et al. (2016). Operationalising and Evaluating Sub-Optimal and Optimal Play Experiences through Challenge-Skill Manipulation. CHI. https://www.cs.mcgill.ca/~jeromew/data/COMP766/CHI2016/p5583-klarkowski.pdf
- [P17] Cuerdo, M. A. M., Mahajan, A., Melcer, E. F. (2021). Die-r Consequences. IEEE CoG. https://dblp.uni-trier.de/rec/conf/cig/CuerdoMM21.html (ResearchGate PDF returned 403)
- [P18] A Good Reason to Die (2017). CHI. https://www.aminer.cn/pub/599c7b8c601a182cd2747054/a-good-reason-to-die-how-avatar-death-and-high-challenges-enable (abstract only)
- [P19] Allart, T. et al. (2017). Difficulty influence on motivation over time in video games using survival analysis. FDG. https://researchr.org/publication/AllartLPGN17 (metadata only)
