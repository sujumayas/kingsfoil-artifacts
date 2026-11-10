# 00b. Practitioner glossary for difficulty and learning curves

Scope. Words that shipped-game designers use, with the earliest or most cited designer source I could reach. Academic theory (flow, Koster, Juul, MDA, DDA papers, skill atoms) lives in `00a-glossary-theory.md` and is not repeated here.

Genre shorthand used in every cross-genre note.
- HD = hero defense (Hearthguard)
- M3 = match-3 RPG (MatchRPG)
- PP = precision platformer (SpeedRunner)
- AB = auto-battler (Merge Arena)
- MMO = Tibia-like MMORPG (Asterion)

Budget note. 29 tool calls. Several terms got only community or inferred sourcing; they are tagged [I] or [U] and listed under Gaps for a later pass.

---

## Q1. Curve shapes and pacing words

### Takeaway
Most designers name curve shapes from the player's side (ramp, spike, breather), but the one shipped system with published numbers is the Left 4 Dead director. Its four states and their durations are the best-sourced pacing vocabulary in this glossary. "Sawtooth" is widely used but has no single designer origin I could find.

### Cited findings
- Booth's 2009 talk names four director states. Build Up spawns full threat until survivor intensity crosses a peak threshold. Sustain Peak holds full threat 3-5 s more. Peak Fade drops to minimal threat and waits for intensity to decay and the fight to end. Relax keeps minimal threat for 30-45 s, or until survivors travel far enough, then Build Up resumes. [V, E2] [S1]
- Intensity rises with damage taken (proportional), incapacitation, ledge pulls and nearby infected deaths (inverse to distance). It decays toward zero, but not while infected are engaging the survivor. [V, E2] [S1]
- Boss encounters ignore adaptive pacing, because "boss encounters are intended to change up the pacing anyhow". [V, E2] [S1]
- Booth frames the goal as copying the "spiky" pacing of Counter-Strike, quiet tension broken by unpredictable combat. He calls the spawn method "Structured Unpredictability", with wandering mobs at random 90-180 s intervals. [V, E2] [S1]
- Revert to Saved (2012) describes Where's My Water? as sawtooth. Each level set gets harder, then the next set eases off. [V, E4] [S2] Practitioner blogs repeat that good difficulty "climbs like a sawtooth, not a ramp". [V, E4] [S3]
- Evolve's designers cite L4D's director for "peaks and valleys" of action. [U, E2] [S28] (search snippet only)

### Inferences
- [I] The L4D states map onto Hearthguard's wave structure already. Waves 1-2 are Build Up, the w4 Horde is Sustain Peak, the 12 s gap is Peak Fade plus a short Relax, and the 25 s campfire is a long Relax. The difference is that L4D reads player intensity and Hearthguard runs a fixed script. [K] Hearthguard's director paces but never adjusts stats (CONTEXT.md).
- [I] "Sawtooth" in practice means two things. Level-to-level, each set starts easier than the last set ended (Where's My Water?, Hearthguard chapter boundaries). Inside a level, tension rises and falls. Name the scale when using it.
- [I] "Intensity curve" is the L4D sense (measured player stress over seconds). "Difficulty curve" is designed challenge over a run. "Interest curve" (Schell, The Art of Game Design, 2008) is felt engagement over a session; leave it to 00a.
- [I] "Cadence" and "tempo" are used loosely by practitioners. Proposed series sense: cadence is how often a beat repeats (a wave every N s, an elite every 3 waves); tempo is how fast the player must act inside a beat (actions per minute demanded). No designer source found. [U]

### Gaps
- No primary designer origin for "sawtooth". Schell's interest curve and Lost Garden were not checked in this pass.
- No designer source for cadence or tempo as distinct terms.

---

## Q2. Power and economy words

### Takeaway
Schreiber's Game Balance Concepts (2010) and the Schreiber and Romero book (2021) are the standard source for cost curves, numeric relationships and feedback loops. Catch-up words split into two families that players often confuse, rubber banding (the system bends toward the trailing player) and comeback mechanics (the trailing player gets a tool). Pity timers are the RNG version of the same idea.

### Cited findings
- Cost curve. A table mapping how much benefit each unit of cost buys. The curve can rise, stay linear or fall, and all can be balanced, but a falling curve favours the early game. Rule of thumb, "overpowered <=> undercosted". [V, E2] [S4][S5] (via course notes)
- Numeric relationships. Linear has a constant conversion rate. Exponential (1, 2, 4, 8, 16) gets "prohibitively large very quickly". Triangular (1, 3, 6, 10, 15) grows with linear differences and is "a pretty good first guess" for rising costs. [V, E3] [S6] (lesson built on Schreiber)
- Schreiber's Level 10 (8 Sep 2010) covers positive feedback loops (The Great Dalmuti), negative feedback (trading) and built-in catch-up such as later rounds scoring more. [V, E2] [S4]
- Rubber banding. Game Developer frames it as a way to keep races close, with the blue shell as the clearest case (unusable by first place). [V, E4] [S16] Mario Kart director Kosuke Yabuki said removing the blue shell made it feel like "something's missing". [V, E2] [S16b] A critic argues blue-shell rubber bands "discourage good decisions". [V, E4] [S16c]
- Pity timer / bad-luck protection. Hearthstone guarantees a legendary within 40 packs, and within the first 10 packs of a new set. [V, E3] [S9] WoW Legion legendaries used weighted bad-luck protection. Blizzard first denied it, then confirmed it, then removed a soft cap that stopped helping after 4 legendaries, then renamed it "Mediocre Luck Protection" in 7.x. [V, E2 translated] [S10]
- Soft cap. In the WoW case, a threshold after which a bonus keeps working but at a reduced rate. Blizzard removed the legendary soft cap in Legion in 2016 after player backlash. [V, E3] [S10b]
- Diminishing returns as scaling. Risk of Rain 2 enemy level comes from a coefficient `(1 + 0.3(players-1) + minutes x 0.0506 x diff x players^0.2) x 1.15^stages`. Each enemy level adds 30% base HP and 20% base damage. Drizzle runs the clock at 50%, Monsoon at 150%. [V, E3] [S18] This is the reference "difficulty over time" curve, linear in minutes and exponential in stages.

### Inferences
- [I] Power curve. The player's effective output (damage per second, clear speed) plotted against the same axis as the difficulty curve. The gap between the two is what the player feels. [K] Hearthguard hero damage +9% per level against mob HP x[1.0, 2.3, 4.6, 8.0, 13.0] per chapter plus +7% per wave, which produces the "chapter ends in a mow" sawtooth.
- [I] Power fantasy. The stretch where the power curve sits clearly above the difficulty curve and the player is meant to feel overwhelming. Vampire Survivors-likes build the whole late run on this. No designer source captured. [U]
- [I] Mow / horde-clear moment. A Kingsfoil term (CONTEXT.md) for a planned power-fantasy beat where mobs die faster than they arrive. It is a pacing beat, not a balance error. Keep it in the glossary as a local term.
- [I] Snowballing. A positive feedback loop where an early lead buys more lead (MOBA gold, AB economy streaks). Comeback mechanics and rubber banding exist to dampen it. Schreiber's feedback-loop vocabulary [S4] is the source of the frame.
- [I] Exponential vs logarithmic. If XP per level grows exponentially, level over time grows logarithmically. Both words describe the same system from opposite axes, which confuses balance talk. [S6-adjacent, E3]

### Gaps
- Did not reach the Level 2 and Level 3 Game Balance Concepts posts directly. Cost-curve wording is from course notes and a Carthage lesson.
- No designer source for "power fantasy" or "snowballing" in this pass.

---

## Q3. Failure and retry words

### Takeaway
Practitioners talk about the cost of failure as what the player loses (time, items, XP, run progress) and time-to-retry as how fast they are back in. Super Meat Boy is the anchor for near-zero retry cost. Diablo II hardcore and Dark Souls bloodstains anchor the high and middle ends. Hades God Mode is the cleanest example of an assist that keeps the failure loop.

### Cited findings
- Super Meat Boy. McMillen wanted the action to keep going after death, with near-instant respawn and small levels, removing the respawn delay other platformers used as a penalty. [V, E2] [S14] A critic argues the zero delay leaves no time to reflect. [V, E4] [S14b]
- Diablo II hardcore makes death the end of the character, an optional permadeath mode. Blizzard hesitated to ship it over fan backlash. [V, E3] [S23]
- Dark Souls drops souls at the death point. One retrieval attempt is allowed, and a second death loses them. [V, E3] [S23b]
- Game Developer's "varying degrees of death" frames the penalty as what is lost, such as play time, XP and money. [V, E4] [S23c]
- Hades God Mode starts at 20% damage resistance, adds 2% per death, caps at 80%. Kasavin wanted it "immediately palpable" but not game-breaking. [V, E2] [S8] Vice notes it keeps the loop in place, because you keep dying. [V, E3] [S8b]

### Inferences
- [I] Setback vs reset. A setback returns you to a checkpoint inside the attempt (Celeste screen, Dark Souls bonfire). A reset returns you to the start of the run (Hades, Hearthguard Hearth loss). Cost of failure is mostly the length of play lost.
- [I] Time to retry (TTR). Seconds from failure to regaining control. Super Meat Boy sits near 1 s. A Hearthguard Hearth loss costs the whole run, 15-40 min. That gap is the main failure-design question for the study.
- [I] Run-based vs persistent progression. Run-based resets power each attempt (Slay the Spire). Persistent keeps it (MMO character). Meta-progression is a persistent layer on top of a run-based game (Hades mirror, Rogue Legacy). [K] Hearthguard has no meta-progression yet.
- [I] "One more try" is the player-reported feeling when TTR is short and the cause of failure is legible. Not a mechanism. No designer origin found.

### Gaps
- Did not open the Super Meat Boy postmortem text. Respawn time in ms is unverified.
- No designer source for "setback vs reset" phrasing.

---

## Q4. Accessibility and choice words

### Takeaway
Two families. Selectable difficulty (modes, assist toggles, heat or ascension dials) is a menu the player controls. Adaptive difficulty changes the game without asking. Celeste's Assist Mode and Hades God Mode are the reference accessibility examples. Ascension (Slay the Spire) and Heat (Hades) are the reference "opt-in challenge" ladders.

### Cited findings
- Celeste Assist Mode offers game speed, invincibility, infinite stamina and chapter skip. The game recommends a first play without it. [V, E3] [S7] It was first called "Cheat Mode", renamed because the name felt judgmental. [V, E2] [S7] Thorson (3 Apr 2019) proposed a Sekiro version and said assists belong in the main menu, explained upfront, adjustable mid-run. [V, E2] [S7c]
- Slay the Spire has 20 Ascension levels per character, each stacking a harder modifier. [V, E3] [S19] Slay the Spire 2 early access merges them into 10. [V, E3] [S19b] Mega Crit later said lower ascensions should be more accessible. [V, E3] [S29]
- Hades Heat (Pact of Punishment) unlocks after the first escape and is a dial of chosen modifiers. Top players report a max-heat attempt takes at least 85 hours. [V, E3] [S26]
- Deep Rock Galactic hazard level plus player count set enemy damage, friendly fire, environmental damage and swarm size. Hazard 5 also lowers health regeneration. [V, E3] [S17]
- Risk of Rain 2 difficulty picks a time multiplier (50%, 100%, 150%). Eclipse adds stacking modifiers per cleared run. [V, E3] [S18]
- Counter-view. A Game Developer blog argues against difficulty levels altogether. [U, E4] [S24] (title only) The Cogmind developer argues opt-in ease dilutes achievement in roguelikes. [V, E2] [S25]

### Inferences
- [I] "Difficulty as content". A practitioner phrase for high-difficulty ladders that give replay value after the first clear (Ascension, Heat, DRG Hazard 5, RoR2 Eclipse). No single designer coined it in sources found. [U]
- [I] Assist vs mode. A mode is a bundled preset. An assist is a single, named, player-chosen tweak. Celeste moved the industry vocabulary from the first to the second.
- [I] Adaptive (hidden) vs selectable (visible) is the key split, and it maps onto the Hearthguard rule that its director paces but never adjusts stats. L4D adapts pacing, not stats. God Mode adapts stats, but visibly and by opt-in.

### Gaps
- Did not read the Game Developer anti-modes article body.
- DRG per-hazard multipliers not extracted.

---

## Q5. Learning words

### Takeaway
The most cited designer sources are George Fan's GDC 2012 Plants vs. Zombies tutorial talk and Hayashida's kishōtenketsu framing of Mario 3D Land/World as popularised by GMTK (2015). "Teach-test-twist" is a community shorthand for that four-step structure. Bushnell's law is the standard tag for the floor vs ceiling split.

### Cited findings
- Fan's talk gave 10 tutorial tips. Highlights are blend teaching into play, about eight words on screen at once, currency withheld until about level 10, one-time teaching actions (click the arrowed coin), and visuals that show function (plants are rooted, so they behave like towers). [V, E2] [S12]
- GMTK (16 Mar 2015) breaks 3D World levels into introduction, development, twist and conclusion. Director Koichi Hayashida tied this to kishōtenketsu. [V, E2] [S13]
- Bushnell's law. "Easy to learn, hard to master", attributed to Nolan Bushnell after Computer Space's confusing controls. Blizzard adopted it as a motto. [V, E3] [S11]

### Inferences
- [I] Onboarding is the first-session funnel (install to first win). Tutorialisation is the method of teaching inside it. Gating is withholding a mechanic until earlier ones are learned (PvZ currency at level 10).
- [I] Introduce one mechanic at a time follows from Fan's pacing of new plants per level.
- [I] Readability / telegraphing. The enemy shows intent before acting (wind-up, ground marker). Players blame themselves for telegraphed hits and the game for untelegraphed ones. Borrow detail from the RTS enemy AI study.
- [I] Skill floor is the minimum skill to make progress. Mastery ceiling is the point beyond which more skill gives no more result. Bushnell's law asks for a low floor and a high ceiling.
- [I] Cognitive load is the number of things the player must track at once. Fan's eight-word rule is a practical cap.

### Gaps
- "Teach-test-twist" has no single designer source found; treat as community shorthand for kishōtenketsu.
- No designer source captured for telegraphing.

---

## Q6. Measurement words

### Takeaway
Designer telemetry vocabulary comes from two places. One is games user research (Halo 3 at Microsoft, 2007). The other is free-to-play analytics (D1/D7 retention, funnels). Steam global achievement percentages are a free public proxy for completion and drop-off in shipped games.

### Cited findings
- Halo 3 user research (Pagulayan, Microsoft) ran playtesters behind one-way mirrors. NPR reported a barrier added after too many players died flying into a spot. [V, E2] [S15] I could not confirm the "death heatmap" image detail from the Wired article. [U]
- GameAnalytics 2026 report (2025 data). Top 25% of mobile games keep D1 a little above 30%. Median D7 sits just under 4%; top 25% at 6-7%, top 10% at 11-12%. [V, E1, vendor-reported] [S20] Q1 2024 medians were D1 22.91%, D7 4.20%, D28 0.85%. [V, E1, vendor-reported] [S20b]
- Steam global stats. Celeste "Climb Celeste Mountain" (main story) is held by 34.6% of owners. [V, E1] [S21] Hollow Knight final-boss achievement 37.3%. [V, E1] [S21b] Silksong's early Bell Beast boss is at 87.5%. [V, E1] [S21c]

### Inferences
- [I] Funnel / drop-off. The share of players reaching each step (wave, chapter, level). A churn point is a step where the drop is bigger than the neighbours. Steam achievements give a crude funnel for twins.
- [I] Win rate by stage. Share of attempts that clear a stage. Use attempts, not players, as the denominator, or retries hide the spike.
- [I] Time-to-kill (TTK) and time-to-die (TTD) are shooter terms for seconds needed to kill a target or be killed. They travel well to HD (hero TTK on an elite), AB (fight length) and MMO (hunt pace).
- [I] Deaths-per-level heatmaps plot death positions on the map. [K] Hearthguard already logs deaths with position and last 6 s of hits.
- [I] Completion rate. Share of starters who finish. Steam numbers are of owners, not starters, so they understate it.

### Gaps
- No primary source for the Halo 3 heatmap image.
- Retention benchmarks are mobile F2P and vendor-reported. Browser and premium PC benchmarks were not found.

---

## Terms that mean different things in different communities

| Term | Meaning A | Meaning B | Series rule |
|---|---|---|---|
| Steep learning curve | Technical. Steep means proficiency rises fast, so easy [V, E4] [S22] | Gamer speech. Hard to get into [V, E4] [S22b] | Avoid "steep". Say "hard to learn" or "fast to learn" |
| Difficulty curve vs learning curve | Designed challenge over time | Player skill over time | Use both, never interchangeably. The gap between them is felt difficulty |
| Rubber banding | Racing AI that speeds up or slows down to stay near the player (Giant Bomb concept page) [V, E3] [S16d] | Any catch-up system, including items like the blue shell [V, E4] [S16] | Use "rubber banding" for hidden system adjustment. Use "comeback mechanic" for a visible tool |
| Soft cap | A threshold past which returns diminish (WoW stats) | A cap players can exceed but rarely do | Define the curve after the cap each time |
| Pity timer | Hard guarantee after N tries (Hearthstone 40) | Rising odds per failure (WoW BLP) | Say "hard pity" or "soft pity" |
| Adaptive difficulty | Stat changes based on performance (DDA) | Pacing changes only (L4D director) | Say which variable adapts |
| Sawtooth | Level-set to level-set relief | Tension wave inside a level | Name the scale |
| Hardcore | Permadeath mode (Diablo) | "Midcore/hardcore audience" | Use "permadeath" for the mechanic |

---

## Pattern cards found

### Build-up, peak, relax (adaptive pacing)
- Lineage. Counter-Strike's natural spiky pacing -> Left 4 Dead director (2008, talk 2009) -> Evolve (2015). Why, to make co-op replays dramatic without scripting.
- Feeling. Tension, then relief.
- Mechanism. Track intensity per player. Full threat until intensity peaks, hold 3-5 s, wait for the fight to end, then 30-45 s of minimal threat.
- Works when the threat can be spawned or withheld freely. Breaks when bosses or scripted waves must happen on time (Booth exempts bosses).
- Evidence. [V, E2] [S1]
- Cost. M. Knobs are peak threshold, sustain seconds, relax seconds, decay rate.
- Hearthguard. Use as a lens on fixed wave timing and the 12 s gap first. Adaptive spawning would break "director never adjusts stats" only if it touched stats, so pacing-only adaptation stays within the rule.

### Stacking assist that keeps the loop (God Mode)
- Lineage. Celeste Assist Mode (2018, toggles) -> Hades God Mode (2020, grows per death).
- Feeling. Learning without humiliation.
- Mechanism. Start at 20% damage reduction, +2% per death, cap 80%.
- Evidence. [V, E2] [S8]
- Cost. S. Knobs are start, step and cap.
- Hearthguard. Could apply to Hearth HP or hero damage taken, opt-in from the menu.

### Opt-in difficulty ladder
- Lineage. Diablo difficulty tiers -> Slay the Spire Ascension 1-20 -> Hades Heat -> Slay the Spire 2 merges to 10.
- Feeling. Mastery and replay after the first clear.
- Mechanism. Clear at level N to unlock N+1. Each level adds one named, stacking modifier.
- Evidence. [V, E3] [S19][S26][S29]
- Cost. S per modifier. Knobs are modifier list and order.
- Hearthguard. Gives the 5-player collective a shared ladder once the base run is cleared.

---

## Glossary additions
None beyond the table below. Local Kingsfoil term kept: "mow".

---

## Proposed glossary entries

| Term | Plain definition (≤25 words) | Source | Example game | Cross-genre note |
|---|---|---|---|---|
| Difficulty curve | Designed challenge plotted over play time or progress. | [S2] | Where's My Water? | HD waves, M3 levels, PP screens, AB rounds, MMO hunt zones |
| Learning curve | Player skill plotted over time. Avoid "steep"; it means opposite things to different people. | [S22] | Celeste | Compare with difficulty curve; the gap is felt difficulty |
| Difficulty ramp | Steady rise in challenge across a sequence. | [I] | Kingdom Rush | Pure ramps feel grindy; add relief beats |
| Sawtooth curve | Challenge rises inside a set, drops at the next set's start, each peak higher. | [S2][S3] | Where's My Water? | Name the scale. HD chapter, M3 world, AB stage |
| Spike / plateau | A sudden jump in challenge / a flat stretch with no rise. | [I] | Hollow Knight bosses | Detect spikes with win rate by stage |
| Breather / relax beat | Planned low-threat stretch after a peak. | [S1] | Left 4 Dead | HD gaps and campfires, MMO safe zones |
| Build-up, sustain peak, peak fade, relax | L4D director states. Full threat to peak, hold 3-5 s, fade, 30-45 s low threat. | [S1] | Left 4 Dead | Pacing only; works in co-op HD and MMO dungeons |
| Intensity curve | Measured player stress over seconds, driven by damage taken and nearby kills. | [S1] | Left 4 Dead | Can be logged from damage events |
| Cadence | How often a beat repeats. | [I] | Hearthguard (elite every 3 waves) | Proposed series sense |
| Tempo | How fast the player must act inside a beat. | [I] | Super Meat Boy | Proposed series sense |
| Power curve | Player effective output plotted against the difficulty curve. | [I][K] | Vampire Survivors | AB unit tiers, MMO levels |
| Power fantasy | Stretch where player power clearly exceeds the threat. | [U] | Vampire Survivors | Plan it as a beat |
| Mow | Kingsfoil term. Planned beat where mobs die faster than they arrive. | [K] | Hearthguard chapter ends | Local term |
| Cost curve | Benefit each unit of cost buys. Overpowered means undercosted. | [S4][S5] | Magic: The Gathering | AB unit cost, M3 skill cost, MMO gear |
| Linear / exponential / triangular scaling | Constant step / doubling step / step that grows by one each time. | [S6] | Hearthguard Town cost x1.7 | Triangular is a safe first guess for costs |
| Soft cap | Threshold after which a bonus keeps working at reduced rate. | [S10b] | WoW Legion legendaries | Define the post-cap curve |
| Diminishing returns | Each extra unit of input buys less output. | [I] | WoW stat ratings | Stops stacking one stat |
| Snowballing | Early lead buys more lead through positive feedback. | [S4] | Dota 2 | AB economy, co-op HD carries |
| Catch-up / comeback mechanic | Visible tool that helps the trailing player. | [S4] | Mario Kart blue shell | AB loss-streak gold |
| Rubber banding | Hidden adjustment pulling the leader back or trailing player forward. | [S16] | Mario Kart AI | Disclose or players feel cheated |
| Pity timer / bad-luck protection | Guarantee (hard) or rising odds (soft) after repeated failed rolls. | [S9][S10] | Hearthstone (40 packs) | M3 and AB drops, MMO loot |
| Difficulty over time | Difficulty that rises with real minutes, not just progress. | [S18] | Risk of Rain 2 | Punishes slow play; HD early-call fits it |
| Cost of failure | What a failure takes away, such as time, items, XP or run progress. | [S23c] | Dark Souls | HD high, PP low, MMO death penalty |
| Death penalty | Specific loss on death (XP, items, souls). | [S23b] | Dark Souls bloodstain | MMO central, Tibia-style XP loss |
| Setback vs reset | Return to a checkpoint / return to run start. | [I] | Celeste vs Hades | Measure in minutes lost |
| Time to retry | Seconds from failure to regaining control. | [S14] | Super Meat Boy | PP near 1 s; HD run loss 15-40 min |
| Checkpoint | Saved restart point inside an attempt. | [I] | Celeste screens | HD could checkpoint per chapter |
| Permadeath | Death ends the character or run permanently. | [S23] | Diablo II hardcore | Opt-in mode in MMO and ARPG |
| Run-based vs persistent progression | Power resets each attempt / power carries over. | [I] | Slay the Spire vs Tibia | HD and AB run-based; MMO persistent |
| Meta-progression | Persistent unlocks layered over run-based play. | [I] | Hades mirror | Not in Hearthguard yet |
| Difficulty mode | Bundled preset of difficulty settings chosen up front. | [S24] | Diablo II | Cheap but coarse |
| Assist mode | Separate named player-chosen tweaks, such as speed, invincibility, skips. | [S7] | Celeste | PP origin; ports to HD and M3 |
| Stacking assist | Assist that grows each failure. | [S8] | Hades God Mode | 20% +2% per death cap 80% |
| Adaptive vs selectable difficulty | Game changes itself / player chooses. Say which variable adapts. | [S1][S7] | Left 4 Dead vs Celeste | Hearthguard rule, pacing may adapt, stats may not |
| Ascension / heat / hazard | Opt-in numbered ladder of stacking modifiers. | [S17][S19][S26] | Slay the Spire, Hades, Deep Rock Galactic | Replay after first clear |
| Difficulty as content | High-difficulty ladders used as replay content. | [U] | Hades Heat | Practitioner phrase, no coined source |
| Onboarding | First-session path from launch to first success. | [S12] | Plants vs. Zombies | Measure as a funnel |
| Tutorialisation | Teaching folded into play rather than separate screens. | [S12] | Plants vs. Zombies | ≈8 words on screen |
| Gating | Holding a mechanic back until earlier ones are learned. | [S12] | PvZ currency at level 10 | Talent rows, Town unlocks |
| Teach-test-twist | Introduce, develop, twist, conclude a mechanic within one level. | [S13] | Super Mario 3D World | M3 level packs, PP screens |
| Readability / telegraphing | Showing enemy intent before the hit lands. | [I] | Hollow Knight | See RTS enemy AI study |
| Cognitive load | Things the player must track at once. | [I] | Plants vs. Zombies | Cap new elements per wave |
| Skill floor / mastery ceiling | Minimum skill to progress / point where more skill stops helping. | [S11] | StarCraft | AB low floor, PP high ceiling |
| Bushnell's law | Easy to learn, hard to master. | [S11] | Pong, Blizzard games | Low floor, high ceiling |
| Funnel / drop-off | Share of players reaching each step. | [I] | Steam achievements | Steam % for twins |
| Churn point | Step with an outsized drop in players. | [I] | Celeste (34.6% finish) | Locate in Supabase |
| Win rate by stage | Share of attempts that clear a stage. | [I] | Slay the Spire | Use attempts as denominator |
| Time-to-kill / time-to-die | Seconds to kill a target / to be killed. | [I] | Halo 3 | HD elites, AB fights, MMO hunts |
| Death heatmap | Map of where players die. | [S15][U] | Halo 3 | Hearthguard logs death position |
| Completion rate | Share of starters who finish. | [S21] | Celeste 34.6% (owners) | Steam counts owners, not starters |
| D1 / D7 retention | Share of new players returning on day 1 / day 7. | [S20] | Mobile median D7 <4% | F2P benchmark; vendor-reported |

---

## Sources

- [S1] Booth, M. "The AI Systems of Left 4 Dead", Valve, AIIDE 2009. https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf (read, pacing slides)
- [S2] Revert to Saved, "Bashing your head against the difficulty wall", 2 Aug 2012. https://reverttosaved.com/2012/08/02/bashing-your-head-against-the-difficulty-wall/ (snippet)
- [S3] Bugnet, "Difficulty curves, how to get them right". https://bugnet.io/blog/difficulty-curves-how-to-get-them-right (snippet, low weight)
- [S4] Schreiber, I. Game Balance Concepts, 2010. https://gamebalanceconcepts.wordpress.com/ ; Level 10, 8 Sep 2010. https://gamebalanceconcepts.wordpress.com/2010/09/08/level-10-final-boss/
- [S5] Schreiber, I. and Romero, B. Game Balance, CRC Press, 2021. https://www.routledge.com/Game-Balance/Schreiber-Romero/p/book/9781315156422 (chapter "Transitive Mechanics and Cost Curves"; not read)
- [S6] Carthage College game design lesson, "Numeric analysis". https://sites.google.com/carthage.edu/game-design/lessons/numeric-analysis
- [S7] Vice, Celeste assist mode. https://www.vice.com/en/article/d3w887/celeste-difficulty-assist-mode ; Game Developer. https://gamedeveloper.com/design/check-out-i-celeste-s-i-remarkably-granular-assist-options ; [S7c] Game Rant on Thorson's Sekiro proposal, Apr 2019. https://gamerant.com/sekiro-easy-mode-assist-celeste/
- [S8] Inverse, Hades God Mode interview with Kasavin. https://www.inverse.com/gaming/hades-god-mode-interview ; [S8b] Vice. https://www.vice.com/en/article/how-hades-made-a-genre-known-for-being-impossibly-hard-accessible
- [S9] Hearthstone Wiki, Card Pack. https://hearthstone.wiki.gg/wiki/Card_Pack
- [S10] Mein-MMO, Legion bad luck protection. https://mein-mmo.de/en/wow-legion-legendary-bad-luck-protection,125306 ; [S10b] PCGamesN, soft cap removed. https://pcgamesn.com/world-of-warcraft/wow-legion-legendary-soft-cap-removed
- [S11] Wikipedia, Bushnell's Law. https://en.wikipedia.org/wiki/Bushnell%27s_Law
- [S12] Game Developer, "GDC 2012: 10 tutorial tips from Plants vs. Zombies creator George Fan". https://gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan ; GDC Vault. https://gdcvault.com/play/1015541/
- [S13] Game Maker's Toolkit, "Super Mario 3D World's 4 Step Level Design", 16 Mar 2015. https://youtu.be/dBmIkEvEBtA ; Engadget. https://www.engadget.com/2015/03/17/super-mario-3d-world-design/
- [S14] Game Developer, "Super Meat Boy's McMillen explains why so hard". https://www.gamedeveloper.com/game-platforms/-i-super-meat-boy-i-s-mcmillen-explains-why-so-hard- ; postmortem. https://gamedeveloper.com/audio/postmortem-team-meat-s-i-super-meat-boy-i- ; [S14b] Critical Gaming. https://critical-gaming.squarespace.com/blog/2011/1/6/super-meat-boy-pt3.html
- [S15] Wired, "Halo 3: How Microsoft Labs Invented a New Science of Play", Aug 2007 (mirror). https://wirednews.pages.dev/2007/08/ff-halo-2 ; NPR transcript. https://www.npr.org/transcripts/14649338
- [S16] Game Developer, "Rubber banding as a design requirement". https://gamedeveloper.com/design/rubber-banding-as-a-design-requirement ; [S16b] Yabuki on the blue shell. https://gamedeveloper.com/design/-sometimes-life-isn-t-fair-i-mario-kart-i-director-defends-blue-shell-game-design ; [S16c] Law of Game Design, 25 Aug 2014. https://lawofgamedesign.com/2014/08/25/theory-rubber-bands/ ; [S16d] Giant Bomb, Rubber Band AI. https://giantbomb.com/wiki/Concepts/Rubber_Band_AI
- [S17] Deep Rock Galactic Wiki, Difficulty Scaling. https://deeprockgalactic.wiki.gg/wiki/Hazard_Level
- [S18] Risk of Rain 2 Wiki, Difficulty. https://riskofrain2.wiki.gg/wiki/Difficulty (read)
- [S19] Pocket Gamer, Slay the Spire ascension guide. https://www.pocketgamer.com/slay-the-spire/ascension-guide (fandom wiki blocked, HTTP 402) ; [S19b] PCGamesN, Slay the Spire 2 ascension levels. https://www.pcgamesn.com/slay-the-spire-2/ascension-levels
- [S20] GameAnalytics 2026 Mobile and PC Benchmarks (PDF). https://investgame.net/wp-content/uploads/2026/01/2026-01-27-2026-mobile-pc-benchmarks_compressed.pdf ; [S20b] GameDev Reports, Q1 2024. https://gamedevreports.substack.com/p/gameanalytics-benchmarks-in-mobile
- [S21] Steam global stats, Celeste. https://steamcommunity.com/stats/504230/achievements (read) ; [S21b] Exophase, Hollow Knight. https://www.exophase.com/game/hollow-knight-steam/achievements/ ; [S21c] Steam, Silksong. https://steamcommunity.com/stats/1030300/achievements/
- [S22] Webmaster-Source, "Learning curve, it isn't what you think it is". https://www.webmaster-source.com/?p=4494 ; [S22b] lestmyopinions, 5 Mar 2023. https://lestmyopinions.com/2023/03/05/hard-limits-about-steep-learning-curves/
- [S23] PopMatters, "Giving Death Weight, Hardcore Mode in Diablo II". https://popmatters.com/148710-diablo-ii-2495949637.html ; [S23b] PlayStation Blog, Diablo III Hardcore, 26 Jun 2017. https://blog.playstation.com/archive/2017/06/26/get-tough-play-hard-why-diablo-iiis-hardcore-mode-is-the-best-way-to-play-the-classic-action-rpg ; [S23c] Game Developer, "The varying degrees of death in games". https://gamedeveloper.com/design/the-varying-degrees-of-death-in-games
- [S24] Game Developer, "Difficulty levels and why you should never use them". https://www.gamedeveloper.com/design/difficulty-levels-and-why-you-should-never-use-them (title only)
- [S25] Cogmind devlog, "Adjustable difficulty". https://www.indiedb.com/games/cogmind/news/adjustable-difficulty
- [S26] GamesRadar, Hades max heat takes 85+ hours. https://www.gamesradar.com/hades-highest-difficulty-is-so-tough-that-top-players-say-a-single-attempt-takes-at-least-85-hours-to-pull-off
- [S27] Valve, GDC 2009 "Replayable Cooperative Game Design, Left 4 Dead". https://cdn.fastly.steamstatic.com/apps/valve/2009/GDC2009_ReplayableCooperativeGameDesign_Left4Dead.pdf (not read)
- [S28] Shacknews, Evolve and L4D's director. https://shacknews.com/article/82787/how-evolve-assures-action-peaks-and-valleys (not read)
- [S29] GamesRadar, Slay the Spire 2 patch on lower ascensions. https://www.gamesradar.com/games/roguelike/new-slay-the-spire-2-patch-makes-some-terrible-cards-and-relics-actually-good-mega-crit-agrees-the-game-is-quite-hard-and-wants-lower-ascensions-to-be-more-accessible/
