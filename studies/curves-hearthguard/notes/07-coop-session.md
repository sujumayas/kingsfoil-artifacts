# 07. Co-op, social and session conditions

Scope. How twins scaled for player count, softened shared loss, handled death and respawn, sized runs and checkpoints, used meta-progression, and let mixed-skill groups play together. Each finding is mapped onto Hearthguard's 1-3 players, one corridor each, a shared Town and a shared Hearth, 24-27 minute runs, restart from chapter 1 on loss, no meta-progression.

Tags follow CONTEXT.md. Source ids [S#] point to the list at the end. Several wikis (Fandom, Liquipedia Dota pages, web.archive.org) returned 402/403 to the fetch tool. Where I fell back to search snippets or forum transcriptions, the tag says so.

## Hearthguard's co-op numbers, restated for this note

All [K, E1] from `notes/01-current-build.md` and `scripts/game/sim.gd`, `scripts/game/director.gd` at b509a56.

| Rule | Solo | Duo | Trio | Where |
|---|---|---|---|---|
| Open corridors (each gets the whole wave) | 1 | 2 | 3 | `director.gd:7-8, 117` |
| Hearth HP, 6,500 x (1 + 0.5(n-1)) | 6,500 | 9,750 | 13,000 | `sim.gd:23, 91` |
| Hearth HP per open corridor | 6,500 | 4,875 | 4,333 | derived |
| Boss HP, x (1 + 0.75(n-1)), spawns in one random lane | 1.0x | 1.75x | 2.5x | `sim.gd:189`, `director.gd:105` |
| XP per hero (split by n, every corridor feeds the pool) | 1x | ~1x | ~1x | `sim.gd:296-299` |
| Gold per hero (killer 100%, others 30%) | 1x | ~1.3x | ~1.6x | `sim.gd:532` |
| Team gold into one shared Town | 1x | ~2.6x | ~4.8x | derived, assumes even kills |
| Respawn, 6 s + 1.5 s x chapter | 6-12 s | same | same | `sim.gd:378` |

- The trio bot fell earlier (chapter 5 wave 5) than the solo Fighter bot (chapter 5 boss). Three corridors leak into one Hearth that only doubles. [K, E1]
- Town costs are fixed. Maxing all nine buildings costs 20,741 gold. A solo run earns about 15,800, so a trio's team gold (~76,000 at 4.8x) is 3.6x what the whole Town costs. [K, E1] on costs, [I] on the trio total (assumes even kills and that bots would spend).

The rest of this note judges these numbers against twins.

## Q1. Player-count scaling

### Takeaway
Twins split along one line. Enemy HP that every player can focus scales sublinearly, about +30% to +75% per extra player. Resources that every player drains, or spawns that every player must face, scale linearly or by count. Hearthguard has it backwards. Its Hearth is drained by n corridors but grows only +50% per player, while its boss sits in one corridor yet grows +75%.

### Cited findings
- Diablo II, `/players X` from 1.09 and in 1.10+. Monster HP and XP both scale by (n+1)/2, so 2 players = 150%, 3 = 200%, 8 = 450%. Before 1.09, HP scaled by n and XP by (2n+1)/3. From 1.10 minion HP stopped scaling. [V, E3] [S1][S2]
- Diablo III. Patch 1.0.3 (2012) removed per-player monster damage scaling and kept health scaling. [V, E2] [S3] Patch 1.0.4 set a flat +75% HP per extra player (replacing 75/85/95/110% by difficulty). [V, E3] [S4] Patch 1.0.8 (2013) cut it from 70% to 50% per extra player, so four players face 250% HP instead of 310%. [V, E2] [S5] The 1.0.4 and 1.0.8 notes disagree on the live value before 1.0.8 (75% vs 70%). [U]
- Natural experiment, Diablo III 1.0.3 to 1.0.8. Blizzard moved the per-player HP bonus down twice and removed damage scaling, and co-op teams on Inferno reported relief. [V, E2] [S3][S5] The direction is "make grouping cheaper than solo", never harder.
- Deep Rock Galactic scales enemy count by player count, not enemy HP. Hazard 5 count multipliers are 0.85 / 0.85 / 1.25 / 1.50 for solo / 2 / 3 / 4 players. Hazard 3 is 0.50 / 0.50 / 0.80 / 1.10. Normal-enemy resistance (effective HP) depends on hazard only, for example 1.20 at Hazard 4-5. Solo equals duo on count because the solo player loses the Bosco drone. [V, E3] [S6] A later update made the Dreadnought easier in 2 and 3 player games so they match solo and 4 player. [V, E2, via search snippet of SteamDB] [S7]
- Risk of Rain 2 adds 0.3 per extra player to the difficulty coefficient (playerFactor = 1 + 0.3(n-1)) and n^0.2 to the time factor. Enemy level subtracts playerFactor, so enemies start at level 1 for any party. Chest costs scale with coeff^1.25, so more players also pay more per chest. [V, E3] [S8] (The full RoR2 formula is already in `00b-glossary-practice.md`.)
- Monster Hunter World. Fan sources put 2-player monster HP near 150% and 3-4 players near 220-260%, varying per monster. A mod's data dump gives 90,300 / 157,303 / 234,780 HP for 1 / 2 / 4 players (1.74x and 2.6x). The two disagree on duo. [U, E3] [S9][S10]
- Legion TD lineage. A team shares one King. Leaked units damage it, the leaking player earns less gold and the opponent gains gold. A known team play is one player holding both waves while the partner builds workers and leaks. Teammates who kill a partner's leak still earn a little gold. [V, E3, community guides] [S11][S12]

### Inferences
- [I] The rule twins share is "scale what the group can share, multiply what each player must face". DRG multiplies spawns because each dwarf can only shoot one direction. D2/D3 multiply HP sublinearly because everyone focuses one monster.
- [I] In Hearthguard each corridor is its own spawn, so mob count already scales linearly with n. That is the DRG half done right. The shared Hearth is the drained resource, so it should scale with n, not 1 + 0.5(n-1). Today a trio has 67% of solo Hearth per corridor. That matches the trio bot losing earlier.
- [I] The boss rule borrows the D3 1.0.4 number (+75%) that Blizzard later cut to +50%. Worse, the boss spawns in one random lane while adds spawn in every lane. If the lane owner fights it alone, a trio boss is 2.5x HP for one hero. Twins only multiply boss HP when the whole party can reach it.
- [I] Team gold into a fixed-price Town is the biggest hidden co-op scaler. At ~4.8x team gold the trio can max the Town by chapter 3 if it spends. RoR2 solves the same problem by raising chest costs with the player factor.
- [I] "The weakest lane loses the game" is structural in lane-ownership games. Legion TD accepts it and adds tools (catch leaks, hold both waves). Hearthguard has no rule for crossing lanes or catching leaks beyond walking to them.

### Gaps
- No primary Diablo IV numbers for party HP scaling. D4 scales enemies per player level (Q6), but I found no per-player HP multiplier.
- No Helldivers 2 enemy-spawn-by-player table, no Dungeon Defenders, Borderlands or Remnant numbers found in budget.
- Footman Frenzy and Castle Fight rules not found. Legion TD WC3 leak payout numbers not found, only Legion TD 2 guides.

## Q2. Shared loss and blame

### Takeaway
Games where one player's failure ends it for everyone soften it in three ways. A shared pool of retries (Helldivers lives, Kingdom Rush lives), a rule that one death never ends the run while a partner lives (It Takes Two), and a way to catch or absorb a partner's failure (Legion TD leak catching). Hearthguard has none of the three for the Hearth. It does have the third for heroes, since a hero death is only a timer.

### Cited findings
- Helldivers 2. Reinforcements are 5 per player per mission, capped at 20 for four. Any living teammate calls a dead player back in. After the pool runs out, one reinforcement returns every 2:00. A booster adds +1 per player (6 solo, 24 for four). Another cuts the 2:00 to 1:30 per the wiki, though guides disagree on the size. [V, E3] [S13]
- It Takes Two. A dead player respawns in seconds while the partner lives, and can mash a button to return faster in boss fights. Only when both are down does the pair go back to the last checkpoint, and checkpoints are close together. [V, E3, reviews] [S14][S15]
- Legion TD 2. Leaked units walk to the shared King, and surviving fighters from cleared lanes teleport to the King to fight allied leaks. [V, E3] [S12]
- Kingdom Rush campaign gives a lives counter per stage. Heroic and Iron challenge modes cut it to 1 life. [V, E3] [S16]

### Inferences
- [I] A shared-loss game feels fair when the blame is spread or the failure can be rescued. Hearthguard's Hearth loss is a single number with no lane attribution in telemetry (`telemetry.gd` logs totals per wave, see current-build gaps). Players cannot see whose lane leaked, so blame is guessed. That can be kind (nobody is named) or toxic (everyone suspects the weak player). Juul's finding that players rate games higher when they blame themselves (glossary, "failure as information") argues for showing the lane, framed as information.
- [I] Pool lives per player is the cleanest map. Hearthguard already has a "campfire returns half the Hearth" rule. A per-player Hearth ember pool (see pattern P2) gives a trio more room than a duo without hiding stats.

### Gaps
- No Overcooked failure data. Overcooked has no run loss (star thresholds instead), so it is a weak twin for termination punishment. Not researched further.

## Q3. Respawn and death in co-op PvE

### Takeaway
Long respawn timers come from PvP, where a death must swing the map. In PvE co-op twins keep death short and let teammates speed it up. Hearthguard's 6-12 s is already PvE-short. The real cost of a hero death is the unguarded corridor, not the timer.

### Cited findings
- Dota 2. Patch 7.20 set level 1-4 respawn to 6 / 8 / 10 / 14 s (from 5 / 7 / 9 / 13). [U, E3, forum transcription of patch notes] [S17] Patch 6.83b used a linear 5 + 3.8 x level, reaching 100 s at level 25. [U, E3] [S17] Buyback since 7.11 costs 100 + net worth / 13. [V, E3] [S18] Patch 7.19b changed the buyback penalty from +25% of remaining time to a flat +25 s on the next death. [V, E3] [S19]
- Warcraft III. Altar revive cost rises with hero level, so a level 10 revive costs much more than a new level 1 hero. Heroes keep level, spells and items. [V, E2, Blizzard FAQ] [S20] Revive time = build time x level x a "time level factor", capped by a 150 s default constant. [U, E4, Hive Workshop forum tests] [S21] Tavern revive is instant at 80% of hero cost +20% per level, at 50% HP and 0 mana. [U, E3, search snippet of warcraft.wiki.gg] [S22]
- It Takes Two lets the downed player speed respawn by mashing, and Helldivers 2 needs a living teammate to call a dead one back. [V, E3] [S13][S14]

### Inferences
- [I] Hearthguard's base 6 s equals Dota's level 1 value, but its +1.5 s per chapter caps at 12 s where Dota reaches ~100 s. That is right for PvE. At chapter 5 a wave lasts 26-28 s, so 12 s dead leaves the corridor open for about 45% of a wave. The Hearth pays that, not the hero.
- [I] In co-op the dead hero's corridor is the danger. A "neighbour covers" rule (allies get a speed or damage buff while in a dead ally's corridor) or a teammate-revive shortcut makes death a social beat instead of a silent leak.
- [I] WC3's gold-for-instant-revive (tavern) is a natural sink for the gold bots leave unspent (13k-25k). A Dota-style buyback scaled by gold held would turn hoarded gold into a lane saved.

### Gaps
- Current Dota 2 respawn table not verified (Liquipedia and Fandom blocked). Bleed-out twins (Left 4 Dead incap, Borderlands Fight For Your Life) not researched in budget.

## Q4. Session length and run structure

### Takeaway
Hearthguard's 24-27 minute run is in the roguelite band, but its restart rule is harsher than any twin with a run that long. Twins of similar length either allow quit-and-resume mid-run (Hades), cut the run into stages with their own retries (Kingdom Rush), or keep the full run at 15-30 minutes (Vampire Survivors, Brotato). Phone sessions are much shorter than the run.

### Cited findings
- Vampire Survivors stages have soft time limits of 15, 20 or 30 minutes. [V, E3] [S23] Its creator says he did not expect anyone to play more than two hours and favours short games. [V, E2, interview] [S24]
- Brotato's run is 20 waves, ending in a boss wave. [V, E3] [S25]
- Hades. Community estimates put runs at 30-60 minutes (Hades II). A chamber takes 15-30 s to clear, and the player can quit at any point and resume the run later. [U, E4] [S26] I found no Supergiant statement of a target run length. [gap]
- Kingdom Rush splits the campaign into stages, each with its own lives and replay. [V, E3] [S16]
- GameAnalytics mobile benchmarks. Median session length 5-6 minutes in 2024, top quartile 8-9 minutes. A Q1 2024 figure gives a 4.45 minute median. Median daily playtime is about 22 minutes. [V, E1, vendor-reported via secondary summaries] [S27]

### Inferences
- [I] A Hearthguard run is 4-5 median phone sessions long. One loss at minute 24 in chapter 5 costs 24 minutes, which the current-build note already calls the costliest failure in the game.
- [I] Each chapter is 5-6.5 minutes, which is a phone session. A campfire is already a natural checkpoint, with full heal, shop and half the Hearth back. Continue-from-campfire turns termination punishment into setback punishment (Juul, glossary) and cuts the worst-case minutes lost from ~24 to ~6.
- [I] A browser tab closing mid-run is a loss today. The `plays` row already marks it (`ended_at` empty). Save-on-campfire also fixes that.

### Gaps
- No twin postmortem on shortening a run for phone. No numbers for StS run length or StS mobile changes found.

## Q5. Meta-progression as a curve tool

### Takeaway
Meta-progression adds a power curve across runs, so every loss pays something. The cost is that it can replace skill with grind, and players notice. The safer twins cap it, let players refund it, and put variety ahead of power.

### Cited findings
- Kingdom Rush. Stars earned per stage buy permanent tower and spell upgrades, 1-4 stars each, six trees of five upgrades. A reset button refunds every star. Challenge modes give enough extra stars to max every tree with stars left over. [V, E3] [S16][S28]
- Game Maker's Toolkit frames the choice as fixed runs vs a character that grows across runs. It credits Rogue Legacy's carryover with making a failed run feel worthwhile. [V, E3, video essay] [S29]
- Critics say Rogue Legacy-style carryover makes grinding a necessity and turns a loss into "go grind more". [V, E4, forum posts] [S30]
- Hades God Mode (stacking assist, +2% damage resistance per death from 20% to 80%) is already covered in `00b-glossary-practice.md`. [V, E2]

### Inferences
- [I] For Hearthguard the Town is already an in-run meta-layer that gets stronger as you spend. A between-runs layer should not add raw power on top while the Town is untaught. It would mask the Hearth and Town problems the current-build note found.
- [I] Kingdom Rush's model fits best. Capped, refundable, and the cap is reachable. A "Hearth level" that persists (small, visible, capped) is player-steered difficulty if the player can turn it off.
- [I] Variety unlocks (heroes, talent rows, Town building variants) give the "loss still pays" feeling without inflating the power curve.

### Gaps
- No Orcs Must Die skull numbers, no Vampire Survivors PowerUp numbers, no Rogue Legacy designer interview found in budget.

## Q6. Mixed-skill co-op

### Takeaway
Twins help weaker players with per-player scaling (Diablo IV), an invincible helper role (Super Mario Odyssey's Cappy, Galaxy's co-star) or a structural carry role (Legion TD's "hold both waves"). Lane ownership makes per-player scaling unusually cheap in Hearthguard, because each corridor's waves already spawn separately.

### Cited findings
- Diablo IV scales enemies to each player's level, and loot drops per player. A Blizzard developer said a level 1 and a level 30 can play together because "the game scales for them". [V, E2] [S31][S32] Season 1 removed XP level scaling, so the details changed over time. [U, E3] [S31]
- Super Mario Odyssey. Player two controls Cappy, is invincible, attacks enemies and helps with jumps, but cannot collect Moons. Galaxy's co-star collects star bits and stuns enemies. Coverage frames it as a way to bring in new players without the fear of consequences. [V, E3] [S33]
- Legion TD 2. One player can hold both waves while the partner leaks and eco-builds. [V, E3] [S11]

### Inferences
- [I] Hearthguard can scale a corridor's waves to its owner without touching others. A per-lane difficulty pick (or per-lane mob count) is a visible, player-chosen handicap. That respects the glossary preference for player-steered difficulty over hidden DDA.
- [I] A hidden per-lane stat DDA would be rubber banding. In co-op, players compare lanes, so they would notice.
- [I] The Cappy model maps to a fourth, light seat or a "support" talent row. It is out of scope for 1-3 corridors.

### Gaps
- No Halo or Sea of Thieves sources fetched. No data on how mixed-skill groups play Hearthguard (only one player in logs).

## Pattern cards

### P1. Scale the drained pool linearly, the focused enemy sublinearly
- Lineage. Diablo II (n+1)/2 HP (1.09, 2000s) -> Diablo III +75% then +50% (2012-2013) -> Deep Rock Galactic count-not-HP tables. Why, focused HP shared by many players should cost less than solo, spawns each player must face should grow per player.
- Feeling. Fairness. A duo or trio feels the same pressure per player as solo.
- Mechanism. Hearth = 6,500 x n (or 6,500 per corridor). Boss HP = 1 + 0.5(n-1) if the boss can be reached by all, else spawn one boss per corridor at 1.0x. Team-wide costs (Town) scale like RoR2's chest costs, for example base x (1 + 0.5(n-1)).
- Works when lanes are equal. Breaks when one lane is much weaker. Then linear Hearth hides who leaks.
- Evidence. [V, E3] S1, S2. [V, E2] S5. [V, E3] S6. [K, E1] trio bot lost earlier than solo.
- Cost S. Knobs: Hearth per player (0.5 now), boss per player (0.75 now), Town cost per player (0 now).
- Hearthguard. Change `sim.gd:91` and `sim.gd:189`, add a player term to `town_defs.gd` costs. Rerun `--players=3` bot against solo.

### P2. Per-player retry pool (Hearth embers)
- Lineage. Arcade continues -> Kingdom Rush stage lives -> Helldivers 2 reinforcements (5 per player, cap 20, 2:00 trickle). Why, a shared pool sized by headcount makes more players mean more room, and spending is a team decision.
- Feeling. Tension with a safety net. "One more ember" drama instead of instant loss.
- Mechanism. Each player brings 1 ember. When the Hearth hits 0, spend an ember: Hearth returns to 25%, the wave continues. Run ends at 0 embers. Optional slow refill at each campfire.
- Works when the loss is a shared resource. Breaks if embers are so many that the Hearth stops mattering.
- Evidence. [V, E3] S13, S16.
- Cost S. Knobs: embers per player, refill per campfire, Hearth % restored.
- Hearthguard. Turns a termination punishment into a setback inside chapters 3-5, where every bot loss happens.

### P3. Catch the leak
- Lineage. WC3 Legion TD shared King -> Legion TD 2 fighters teleport to King, leak catchers earn gold. Why, it gives the strong player a way to rescue the weak one and spreads blame.
- Feeling. Teamwork, rescue, and less blame on the weak lane.
- Mechanism. Mobs that pass the last fire in a corridor are marked "leaking" on every player's minimap. A hero who kills a leaking mob from another corridor gets full gold (not 30%). Log Hearth damage by lane.
- Works with lanes that meet near the Hearth. Breaks if catching pays more than holding your lane.
- Evidence. [V, E3] S11, S12.
- Cost M (marker, gold rule, telemetry field).
- Hearthguard. Fills the "Hearth damage by lane" gap in telemetry and gives co-op a reason to cross lanes.

### P4. Short death, social revive
- Lineage. Dota 2 / WC3 long PvP timers and gold revives -> It Takes Two seconds-long respawn plus mash to speed up -> Helldivers teammate call-in. Why, in PvE a death should cost tempo, not minutes.
- Feeling. Relief and debt to a teammate, no dead time.
- Mechanism. Keep 6 + 1.5c s. Add: an ally standing on the fallen hero's marker for 2 s halves the remaining timer. Optional buyback, instant respawn for gold scaled by gold held (Dota 7.11 shape 100 + held / 13).
- Works with small parties near each other. Breaks if lanes are too far apart to walk.
- Evidence. [U, E3] S17. [V, E3] S13, S14, S18. [U, E3] S22.
- Cost S. Knobs: base, per chapter, revive share, buyback divisor.
- Hearthguard. Buyback is also a sink for the 13k-25k gold bots die with.

### P5. Campfire checkpoint
- Lineage. Arcade continue -> Kingdom Rush per-stage retry -> It Takes Two dense checkpoints -> Hades mid-run suspend. Why, long runs on short sessions need a place to stop and a place to restart.
- Feeling. "One more try" instead of "not again".
- Mechanism. Snapshot the full Sim at each campfire start. On loss, offer "retry chapter N" (with a marked flag on the run, or a cost like losing the chapter's Town purchases), or "new run". Save the snapshot so a closed tab resumes there.
- Works when chapters are self-contained. Breaks the run's tension if retries are free and unlimited. Cap at 1-2 per run, or mark the run as "assisted" on the results screen.
- Evidence. [V, E3] S14, S16. [U, E4] S26. [V, E1, vendor] S27.
- Cost M (Sim serialisation already exists for net sync, [I] unverified).
- Hearthguard. Worst-case minutes lost go from ~24 to ~6. One chapter is about one median phone session.

### P6. Per-lane handicap
- Lineage. Diablo IV per-player enemy level -> Hearthguard's separate corridor spawns make it per lane. Why, mixed-skill groups need different challenge without splitting up.
- Feeling. Competence for the weaker player, still a real game for the stronger.
- Mechanism. Each player picks a lane difficulty (count x 0.75 / 1.0 / 1.25) at lobby, shown to all. Gold per kill scales inversely so the economy stays level.
- Works with lane ownership. Breaks if hidden (that is rubber banding).
- Evidence. [V, E2] S31, S32. [V, E3] S33.
- Cost S. Knobs: count multipliers, gold compensation.
- Hearthguard. Uses `director.gd` per-lane spawning. Pairs with P3.

### P7. Capped, refundable meta layer
- Lineage. Rogue Legacy carryover gold -> Kingdom Rush stars with reset and reachable cap -> Hades Mirror plus God Mode. Why, every loss pays something without endless grind.
- Feeling. "Loss still pays", mastery over time.
- Mechanism. Small persistent points per chapter reached, spent on variety (heroes, talent alternates) or on capped, refundable power. The cap is reachable in about 5 runs.
- Works once the in-run curve is right. Breaks if it hides the Hearth or Town problems.
- Evidence. [V, E3] S16, S28, S29. [V, E4] S30.
- Cost M-L. Ship after P1 and P5.
- Hearthguard. Out of scope until the 5-player collective has played full runs.

## Fun hypotheses
- A trio of friends should feel less Hearth pressure per person than a solo player in chapter 3 because of P1. Today they feel more.
- In co-op, a strong player who catches a leak in chapter 4 should feel heroic at the moment the Hearth bar stops dropping (P3).
- A player who loses in chapter 5 at minute 24 should press "retry chapter 5" within 10 s instead of closing the tab (P5).

## Anti-patterns
- Multiplying a lone-lane boss by party size (current +75% boss HP in one random lane).
- Scaling the shared loss pool slower than the number of lanes that drain it (current Hearth +50%).
- Fixed shared costs against multiplied shared income (Town at ~4.8x team gold).
- Hidden per-lane DDA in a game where players can see every lane.
- Meta-power that lets players skip learning the Town.

## Glossary additions
| Term | Meaning | Source |
|---|---|---|
| Drained pool | A shared resource that every player's failure reduces (Hearth, lives, King). Scale it per player. | this note |
| Leak catching | Killing enemies that escaped another player's lane before they reach the shared target. | Legion TD |
| Lives pool | A per-player count of retries pooled for the team. | Helldivers 2 |
| Buyback | Paying gold to end a respawn timer. | Dota 2 |

## Sources
- [S1] Players x, Diablo Wiki. https://diablo2.diablowiki.net/Players_x
- [S2] Player Settings, Diablo Wiki. https://diablo2.diablowiki.net/Player_Settings
- [S3] PC Gamer, "Diablo 3 hotfix removes monster damage boost in co-op". https://pcgamer.com/diablo-3-hotfix-removes-monster-damage-boost-in-co-op-inferno-teams-breathe-sigh-of-relief
- [S4] Ubergizmo, Diablo 3 patch 1.0.4 preview. https://www.ubergizmo.com/2012/08/diablo-3-patch-1-0-4-preview/amp/
- [S5] Diablo Wiki, Patch 1.0.8 (Blizzard notes). https://www.diablowiki.net/Patch_1.0.8 and Engadget https://www.engadget.com/2013/04/03/diablo-iii-gets-massive-multiplayer-improvements-in-1-0-8/
- [S6] Deep Rock Galactic Wiki, Hazard Level / Difficulty Scaling. https://deeprockgalactic.wiki.gg/wiki/Hazard_Level
- [S7] SteamDB patch notes, Deep Rock Galactic. https://steamdb.info/patchnotes/3677091
- [S8] Risk of Rain 2 Wiki, Difficulty. https://riskofrain2.wiki.gg/wiki/Difficulty
- [S9] Fextralife, Monster Hunter World Multiplayer. https://monsterhunterworld.wiki.fextralife.com/Multiplayer
- [S10] Nexus Mods, MHW monster HP data. https://www.nexusmods.com/monsterhunterworld/mods/6438
- [S11] Gameplay.tips, Legion TD 2 Advanced Game Guide. https://gameplay.tips/guides/legion-td-2-advanced-game-guide.html
- [S12] Switchblade Gaming, Legion TD 2 Beginner's Guide. https://www.switchbladegaming.com/strategy-games/legion-td-2/beginners-guide-12/
- [S13] Helldivers Wiki, Reinforcement and boosters. https://helldivers.wiki.gg/wiki/Reinforcement and https://helldivers.wiki.gg/wiki/Boosters
- [S14] Wikipedia, It Takes Two (video game). https://en.wikipedia.org/wiki/It_Takes_Two_(video_game)
- [S15] Stevivor, It Takes Two review. https://stevivor.com/reviews/it-takes-two-review-this-is-a-story-of-collaboration/
- [S16] Kingdom Rush Wiki, Upgrades / Heroic Challenge / Iron Challenge. https://kingdomrushtd.fandom.com/wiki/Upgrades , https://kingdomrushtd.fandom.com/wiki/Heroic_Challenge , https://kingdomrushtd.fandom.com/wiki/Iron_Challenge
- [S17] Dota 2 Pro Tips, patch 7.20. https://www.dota2protips.com/patches/7-20 , respawn history via https://dota2.fandom.com/wiki/Respawn (blocked to fetch, search snippet only)
- [S18] Console & PC Gaming, Dota 2 7.11 formulas. https://consolepcgaming.com/the-new-7-11-dota-2-formulas-have-surely-done-the-job
- [S19] NAVI, 7.19b post-TI8 patch. https://navi.gg/en/publications/2040-7-19b-the-post-ti8-patch
- [S20] Blizzard, Warcraft III Heroes FAQ. https://classic.battle.net/war3/faq/heroes.shtml
- [S21] Hive Workshop, Hero revival time. https://www.hiveworkshop.com/threads/hero-revival-time.209984
- [S22] Warcraft Wiki, Tavern (Warcraft III). https://warcraft.wiki.gg/wiki/Tavern_(Warcraft_III)
- [S23] Wikiwand, Vampire Survivors. https://www.wikiwand.com/en/articles/Vampire_Survivors
- [S24] GamesRadar, Vampire Survivors creator interview. https://www.gamesradar.com/games/roguelike/on-steam-alone-i-probably-have-3-000-hours-nobody-loves-vampire-survivors-more-than-its-creator-who-once-thought-nobody-would-play-it-for-more-than-two-hours-and-ironically-says-short-games-rule
- [S25] Brotato Wiki, Waves. https://brotato.wiki.spellsandguns.com/Waves
- [S26] The Supergiant Run (blog). https://oyito.substack.com/p/the-supergiant-run-hades and Space4games https://space4games.com/en/games-en/hades-2-playtime-how-many-hours-youll-spend-in-the-dark-roguelike/
- [S27] GameDev Reports, GameAnalytics benchmarks 2025 and Q1 2024. https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks , https://gamedevreports.substack.com/p/gameanalytics-benchmarks-in-mobile
- [S28] Steam discussion, Kingdom Rush stars surplus. https://steamcommunity.com/app/246420/discussions/0/2261314050777056345
- [S29] Game Maker's Toolkit, Roguelikes, Persistency and Progression (transcript). https://amara.org/subtitles/7doGHxwrhRpX/en/1/download/Roguelikes%20Persistency%20and%20Progression%20%20Game%20Makers%20Toolkit.en.txt
- [S30] Forum thread on meta-progression. https://scribe.disroot.org/comment/9255518
- [S31] PCGamesN, Diablo 4 level scaling. https://www.pcgamesn.com/diablo-4/scaling
- [S32] GamesRadar, Diablo 4 campaign co-op. https://www.gamesradar.com/diablo-4-lead-clarifies-how-campaign-co-op-progress-will-work
- [S33] Siliconera, Super Mario Odyssey co-op. https://www.siliconera.com/super-mario-odyssey-cooperative-multiplayer-two-players/

See it in action: S6 (DRG table), S13 (Helldivers reinforce), S16 (Kingdom Rush upgrades), S25 (Brotato waves), S33 (Odyssey co-op video in article).
