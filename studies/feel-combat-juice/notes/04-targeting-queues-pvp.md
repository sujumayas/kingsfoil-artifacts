# 04. Targeting, action queues, PvP vs PvE

Researcher notes for the combat juice study. Angle: targeting systems, action queues and PvP vs PvE in modern MMOs and ARPGs. Every claim has a source number; see "Sources" at the end. "Inference" marks my own reasoning. Researched 2026-11-11.

---

## Q1. Targeting

### Takeaway
Two families exist and most modern games ship both. Hard targeting (WoW Tab, Tibia click) gives a persistent selected unit that targeted skills always reach. Soft targeting (GW2 autotarget, WoW Action Targeting, New World target lock) picks a unit for you from facing or crosshair, per cast. The trend since 2015 is to keep hard target as the default and add soft target as an option, with explicit tuning toggles. New World shows the failure mode. A soft lock that guarantees hits in PvP got called "too easy", and the fix was slower turn speed while locked and no automatic retarget after a kill.

### Cited findings
- WoW Tab is `TargetNearestEnemy([reverse])`, bound to Tab by default. It needs a hardware event and has been protected since patch 2.0.1 (2006-12-05), so addons cannot auto-target [1].
- Players report that Tab in PvP cycles "through literally every pet or guardian" before reaching a player [2]. That is the classic complaint about cycling that does not filter by unit type.
- WoW added Action Targeting (soft target) and an Interact key in the Dragonflight pre-patch, 2022-10-25. Targets come from facing, "similar to an action game" (UI designer Jeff Liu). It works with or without Tab [3].
- Action Targeting is driven by CVars. `SoftTargetEnemy` has states 0 off, 1 gamepad, 2 keyboard, 3 always. Forum posts cite `SoftTargetEnemyArc=1` and `SoftTargetEnemyRange=45`. Defaults differ between posts and the UI checkbox only sets some CVars [2]. Unverified against client source.
- GW2 options [4]:
  - Autotargeting picks a valid foe in skill range in the camera's facing direction if you have no target.
  - Promote Skill Target stops autotargeting from switching after a foe has been hit.
  - Snap Ground Target to Current Target moves the ground circle onto your target if it is in range.
  - Allow Skill Retargeting lets a multi-hit skill follow a newly selected target.
  - Lock Ground Target at Maximum Skill Range clamps the circle to max range and turns it red over an unreachable spot.
  - Melee Attack Assist adds collision with your target so you stop running through it.
  - Fast cast with Range Indicator shows the range on press and fires on release.
  - "Lock Autotarget" is a hold key.
- GW2 Action Camera (Heart of Thorns, 2015-10-20) [5]:
  - A center crosshair has four states that tell you whether skills fire at the crosshair or at a target in range.
  - Autotarget is whatever sits under the crosshair. Right-click locks it, and right-click on empty ground clears it.
  - Ground skills and targetless skills aim at the crosshair. Melee hits the area in front of you.
  - Some skills "will do nothing" without a target and get wasted [5].
- New World Aeternum (launch 2024-10-15) kept PvP target lock but changed it, PvP only [6]:
  - Locked attacks can never be headshots but are guaranteed hits.
  - Turn rate is slower while locked so opponents can break the lock.
  - Line of sight breaks the lock more easily.
  - A mid-cast ability no longer jumps to a nearby target when the current one dies.
  - Blunderbuss PvP damage was cut to offset the guaranteed hits.
- The Season of Opportunity notes confirm the target lock change "only affect PvP" and that a kill no longer auto-switches the lock [7]. A Sportskeeda piece says PvP now "resembles a Tab Target system" [8].
- League of Legends ships four cast modes: normal cast, quick cast, quick cast with indicator, and HUD click [9][10]. Normal cast shows the indicator and waits for a confirm click. Quick cast fires at the cursor on key press. Quick cast with indicator shows the indicator while held and fires on release [9][11].
- Wolcen devs reworked targeting and input buffering because players found targeting "clunky" and controls unresponsive. Holding left mouse locks a target [12].
- Tibia/Canary. Attack target is a client packet `parseAttack(creatureId)`, and the server sets the attacked creature [13]. Secure mode has the comment "0 - can't attack unmarked, 1 - can attack unmarked" [13]. Secure mode is a PvP safety flag on click targeting.

### Inferences
- For soft-difficulty players, a hard target plus homing targeted spells is the forgiving path. Nothing to aim, and the target ring is the whole interface.
- Skilled players want the same target selection but control over where aimed skills land. GW2's "Snap ground target to current target" is the bridge. An aimed AoE can default to the selected target's tile and the player can override it with the cursor.
- Tab order needs filters (players first in PvP, ignore pets and summons) and a predictable order. Nearest-first, then a screen-space sweep, is what players expect. WoW's exact cone rules are not documented in anything I found.
- Soft lock that guarantees hits in PvP breaks the "aimed skills can miss" contract. If a 2D game adds aim assist, keep it in PvE or cap it at snapping a skillshot's start direction. Never turn a skillshot into a homing hit.

### Gaps
- No primary source for WoW's tab cone angle, range or priority rules. Wiki pages 404.
- GW2 wiki pages on targeting, projectiles and dodge returned DB errors.
- Nothing solid on Lost Ark, BDO or TERA targeting. Diablo IV auto-target and "attack move" rules not found.
- No source on focus target, mouseover macros or target-of-target history beyond forum posts.

---

## Q2. Hybrid designs (targeted and aimed on one bar)

### Takeaway
GW2 is the cleanest documented hybrid. Every skill has a target type, the crosshair shows which type will fire, and ground skills show a circle that can snap to the target. Albion tags each spell with a target type (unit, ground, direction) and an interrupt flag. Neither game marks "can miss" with a special icon. Players learn it from the cast preview shape. A circle or line preview means aimed. No preview means it homes.

### Cited findings
- GW2. Ground-targeted skills and targetless skills go to the crosshair, and projectiles fly to the crosshair. Skills that "require a target" need a lock [5].
- GW2 ground marker turns red over an inaccessible spot, and can lock at max range [4].
- Albion spell database tags. Explosive Bolt is "fired at the targeted position", 3 m radius. Frostbite has 0.3 s cast, 1.2 s cooldown, 18 m range. Avalonian Beam is GroundUninterruptible with a 1.24 s cast. Aimed Shot can be cast while silenced and cannot be interrupted [14].
- LoL wiki defines a linear skillshot as one that needs "only a direction" and a ground AoE as one that uses a selected location [15].

### Inferences
- In Asterion, give each hotbar slot a small corner glyph for target type. A dot is unit-targeted (cannot miss). A crosshair is aimed. A circle is ground. Show the shape preview on hover or hold. That costs one 8x8 icon per type.
- Offer quick cast with indicator as the default for aimed skills. It shows the shape while the key is held and releases on key up. It is LoL's middle mode [9] and teaches readers which skills can miss.
- If a unit is selected and an aimed skill is cast with quick cast, default the aim to the target's current tile (GW2 snap). Skilled players turn snap off.

### Gaps
- No official Albion or ESO docs on targeting UI. Lost Ark not covered.

---

## Q3. Action queues

### Takeaway
Every target-based MMO has a queue that hides latency. WoW lets the next spell be pressed up to 400 ms before the GCD or cast ends, and the last press in that window wins. FFXIV has a short client lock that the server overwrites, so ping is added to every weave. OSRS and Tibia are tick or exhaust based. Inputs land on the next server step, so a queue is implicit. Wolcen's queue holds exactly 2 slots (current and next), and a new press overwrites the queued one. For a 600 ms tick server, a 1-slot "next action" buffer with last-press-wins matches all of these.

### Cited findings

WoW
- `SpellQueueWindow` default 400 ms, range 0 to 400 ms, checked in 12.0.1 (Midnight) [16]. Forum and addon sources agree 400 is a hard cap [17].
- Last input in the window wins. A 1 s cast, Chaos Bolt pressed at 0.6 s, Conflagrate at 0.8 s, gives Conflagrate [16].
- Maxroll says the minimum to use is "200 ms + your ping" and recommends leaving it at 400 [16].
- History is unclear. The old CVar (`reducedLagTolerance`, then `maxSpellStartRecoveryoffset`) appeared in 4.0.3 (2010-11-16) and was renamed in 7.2.0 (2017-03-28) [18]. A user comment says the default was 250 before 7.2.5. Unverified [17].
- GCD is 1.5 s base. Rogues, Feral cat and Monks mostly use 1.0 s. Empower abilities use 0.5 s. Haste can cut the 1.5 s GCD to a 0.75 s floor (it was 1.0 s before Legion). Haste does not affect energy melee GCD. Haste reduction on GCD came in 2.4.0. BfA put many cooldowns back on the GCD [19].
- Spell batching. Before Warlords of Draenor (2014) the server batched spells in 400 ms windows per a 2014 blue post. Classic recreated it, and Classic 1.13.7 PTR cut it to 10 ms [20][21].

FFXIV
- Using an instant ability locks the client for 500 ms. The server reply carries the real lock, about 600 ms (some actions more), which overwrites the rest [22].
- Ping is added. At 1 ms ping the lock is about 601 ms. At 160 ms it is about 760 ms, plus a server delay of about 40 ms on average (0 at best) [22].
- Community thresholds from the same thread are about 110 ms or less to single-weave a 1.5 s GCD. Double-weaving on Ninja or Samurai needs about 50 to 60 ms [22]. Player analysis, not official.
- Icy Veins says more than one oGCD after a 1.5 s cast, or more than two after an instant, delays the next GCD [23] (via search snippet, page 403).

Tibia (Canary source)
- Attack spells share a 2 s group cooldown. `energy_strike.lua` has `cooldown(2000)` and `groupCooldown(2000)`. Healing spells use 1 s, as in `light_healing.lua` with `cooldown(1000)` and `groupCooldown(1000)` [24][25].
- A cast during cooldown returns `RETURNVALUE_YOUAREEXHAUSTED`, which is the "You are exhausted" message. No queue. The press is rejected [26].
- Cooldown reductions are clamped to half the base cooldown [26].
- Melee auto-attack is scheduled per vocation `attackspeed="2000"` ms [27]. The player re-arms through `setNextActionTask` with a delay of `getAttackSpeed()` [28].
- Defense factor drops to 0.5 (full attack) or 0.75 (balanced) only while `now - lastAttack < attackSpeed` [28]. The attack stance only costs defense during the swing window.

OSRS
- Tick is 0.6 s. Measured about 0.606 to 0.618 s, longer on full worlds [29].
- "Each action registered within one tick will start to take place by the beginning of the next tick". Delay is 0 to nearly 600 ms [29].
- Client-only actions (menus, tabs) run on a 20 ms client tick [29].

ARPGs
- Wolcen's buffer has 2 items (executing and next). If full, the newest press overwrites the queued one, since the latest press is the player's intent [12].
- PoE2 players ask for WoW-style input queueing. They report pressing a new skill cancels a cast instead of queueing it, and say they are "locked into animation" without a queue [30]. No official GGG statement found.

### Inferences
- Asterion with a server tick should copy the Tibia/OSRS shape with WoW's forgiveness. Keep one queued action per player, last press wins. Accept presses in the final 400 ms of a GCD or exhaust, or simply in the tick before it ends. Show the queued skill with a pulsing outline on the hotbar so players can see what will fire.
- Tibia's reject-and-message model punishes high ping. A press 50 ms early is lost. A queue window fixes that at almost no cost (one int per player).
- Split group cooldowns like Tibia (attack 2 s, heal 1 s) so a heal is never blocked by an attack. This is also a readability rule. Players learn two rhythms.
- Avoid FFXIV's design where ping stretches a client lock. On a tick server, locks should be measured in ticks so ping only shifts when the action shows, not how long it lasts.

### Gaps
- No Diablo IV or Lost Ark input buffer numbers found.
- No primary Blizzard source for the 400 ms default or its patch.
- OSRS PID order and attack speeds in ticks not pulled this round.

---

## Q4. PvP vs PvE

### Takeaway
PvP rules change in three places. CC gets diminishing returns and caps. Damage and healing get scaled. Some feedback is changed or removed so players keep control (WoW knockbacks DR to immunity after one). The current WoW numbers moved in 2026. The user's "100/50/25 over 18 s" is out of date. Tibia halves all player-vs-player damage in TFS. Canary makes it a per-vocation multiplier.

### Cited findings

WoW diminishing returns (from the wiki's patch history, which supersedes its intro text) [31]
- 12.0.0 (2026-01-20) cut the reset from 18 s to 16 s. Immunity now comes after 2 applications (was 3). Creatures no longer go immune to stuns. Each stun halves until 1/16 duration.
- 12.1.0 (2026-08-11) raised the reset from 16 s to 20 s.
- Steps are 100 %, 50 % (and 25 % if a third hit were possible). With immunity after 2, the third step looks unreachable. The wiki text is inconsistent here.
- Retail PvP CC is capped at 6 s.
- Knockbacks go immune right after the first, with a 10 s reset (5.4.0).
- Stuns and taunts on creatures DR per creature, shared by the whole group.
- Classic uses a dynamic 15 to 20 s reset instead of a fixed 18 s.
- Retail categories are roots, stuns, incapacitates, disorients, silences, knockbacks and disarms.

WoW arena dampening [32]
- Each stack cuts healing and absorbs received by 1 %.
- It starts immediately in 2v2 and around 5 min in 3v3. One stack every 10 s.
- History. It was added 2013-10-21, moved from 10 min to 5 min in 5.4.7 (2014-02-18), and 2v2 dropped its 20 % starting value on 2020-12-14.

Tibia
- TFS halves damage when a player hits a player (not black skull, not healing). See `damage.primary.value /= 2` in `combat.cpp` [33].
- Canary replaces this with `applyPvPDamage` = target `damageReceivedMultiplier` x attacker `damageDealtMultiplier` x a level-difference multiplier. The default vocations ship 1.0 / 1.0 [34][27].
- Canary config has `pzLocked = 60 * 1000` (60 s protection-zone lock after aggression), `whiteSkullTime = 15 min`, `stairJumpExhaustion = 2 s`, and world types "expert-pvp", "retro-pvp", "no-pvp", "pvp-enforced" [35].

New World
- PvP-only target lock rules (slower turn, no auto-retarget after a kill, damage cut on spread weapons) while PvE stays the same [6][7].

### Inferences
- Asterion should give each feedback effect a PvP mode in data. Proposed defaults:
  - Knockback on a player is 1 tile max with DR to immune for 10 s. In PvE, mobs take full knockback.
  - No hitstop on the victim player's own movement. Visual flash only.
  - Stun or root on players uses the WoW shape (2 hits then immune, about 16 to 20 s reset) and shows the DR state over the player.
  - Screen shake fires only for the local player and only for hits on them.
- Enemy cast readability matters more in PvP. Show a cast bar above enemy players' heads (PvE mobs can use the same) with a color for interruptible versus not. Albion's "uninterruptible" flag [14] gives the data.
- Fairness under latency. Server-side windows like WoW's 400 ms batch felt bad and were cut to 10 ms in Classic [20][21]. A 600 ms tick server batches everything per tick anyway. Resolve same-tick actions in a fixed order and tell players. OSRS does the fixed order [29].

### Gaps
- No primary source this round for arena frames, enemy cast bar design or PvP healing modifiers in WoW.
- WoW knockback suppression details (which effects are disabled vs players) not found beyond knockback DR.
- No measured latency fairness data.

---

## Q5. What transfers to a 2D top-down 32 px MMO

Transfers directly
- Hard target with a ring under the sprite and click or Tab to cycle. Tibia already does this. Tab should filter players first in PvP and skip summons [2].
- Unit-targeted spells that home and cannot miss, next to ground and direction skills with shape previews on the tile grid.
- GW2's snap ground target to current target, clamp to max range, and red marker on invalid tiles [4]. All are cheap on a tile grid.
- LoL's three cast modes as a per-player setting [9].
- One-slot action queue, last press wins, with a 400 ms window or one tick [16][12].
- Split group cooldowns like Tibia's 2 s attack and 1 s heal [24][25].
- PvP damage multiplier per vocation [34], DR on CC [31] and a protection-zone lock [35].

Does not transfer or needs care
- Crosshair action camera. No camera rotation in top-down. The mouse cursor fills that role.
- FFXIV-style client animation lock that ping stretches [22]. Use tick-based locks instead.
- New World guaranteed-hit lock in PvP [6]. It collapses aimed combat into tab-target.
- Facing-based soft target (WoW Action Targeting) needs 8-direction facing that players can read. At 32 px, facing is hard to read. A cursor-nearest soft target reads better (inference).

Proposed numbers (inference, test in prototype)
- Queue window 400 ms or 1 tick, whichever is larger.
- Target cycle filter order is hostile players, hostile mobs, then neutral. Cycle by distance, ties broken clockwise from facing.
- Aim snap only snaps the initial direction of skillshots to the selected target in PvE. Off in PvP.

---

## Sources
1. https://warcraft.wiki.gg/wiki/API_TargetNearestEnemy
2. https://us.forums.blizzard.com/en/wow/t/how-to-turn-onoff-action-targeting-with-a-macro-or-command/1437079 and https://us.forums.blizzard.com/en/wow/t/tab-target/1344971 (forum, unverified)
3. https://gamerant.com/world-of-warcraft-dragonflight-soft-targeting-options-action-interact-key/
4. https://wiki.guildwars2.com/wiki/Options (read via api.php wikitext)
5. https://www.guildwars2.com/en/news/introducing-the-action-camera/ (see it in action, official, with screenshots)
6. https://www.mmobomb.com/news/no-target-lock-pvp-isn-t-going-away-new-world-aeternum-launch-but-getting-last-minute-changes
7. https://www.newworld.com/en-gb/game/releases/season-of-opportunity
8. https://sportskeeda.com/mmo/news-new-world-streamer-beats-pvp-duel-blindfolded-recent-change
9. https://www.mobachampion.com/blog/quick-cast/ and https://wiki.leagueoflegends.com/en-us/Hotkeys
10. https://technology.riotgames.com/node/135 (Riot "Art of Spell Casting, Part 2"; seen in search snippet, fetch timed out)
11. https://wecoach.gg/blog/article/quick-cast-vs-normal-cast-which-is-better-in-league-of-legends
12. https://wolcengame.com/forum/official-news/work-in-progress-targeting-and-input-buffering/ (dev post; seen via search summary, direct fetch 404)
13. https://github.com/opentibiabr/canary/blob/main/src/server/network/protocol/protocolgame.cpp
14. https://www.albiondatabase.com/spells/explosive-bolt , https://www.albiondatabase.com/spells/frostbite , https://www.albiondatabase.com/spells/avalonian-beam-mob-avalon-construct-beam-shot , https://www.albiondatabase.com/spells/aimed-shot (via search snippets)
15. https://wiki.leagueoflegends.com/en-us/Area_of_effect
16. https://maxroll.gg/wow/resources/spell-queue-window
17. https://www.wowace.com/addons/ldb-lagtolerance/?comment=2 , https://www.curseforge.com/wow/addons/spellqueueperspec , https://us.forums.blizzard.com/en/wow/t/input-lag-spellqueuewindow-and-spell-batching/1210379
18. https://warcraft.wiki.gg/wiki/CVar_reducedLagTolerance
19. https://warcraft.wiki.gg/wiki/Global_cooldown
20. https://massivelyop.com/?p=319302
21. https://www.wowisclassic.com/en/news/spell-batching-impact-ptr/
22. https://forum.square-enix.com/ffxiv/threads/444667 (player analysis thread with Yoshida quotes)
23. https://www.icy-veins.com/ffxiv/healer-combat-mechanics (403 on fetch; search snippet only)
24. https://github.com/opentibiabr/canary/blob/main/data/scripts/spells/attack/energy_strike.lua
25. https://github.com/opentibiabr/canary/blob/main/data/scripts/spells/healing/light_healing.lua
26. https://github.com/opentibiabr/canary/blob/main/src/creatures/combat/spells.cpp (lines ~518-530, ~822-870)
27. https://github.com/opentibiabr/canary/blob/main/data/XML/vocations.xml
28. https://github.com/opentibiabr/canary/blob/main/src/creatures/players/player.cpp (getDefenseFactor ~853, attack scheduling ~3979-4023)
29. https://oldschool.runescape.wiki/w/Game_tick (read via api.php wikitext)
30. https://pathofexile.com/forum/view-thread/3625755 , https://www.pathofexile.com/forum/view-thread/3625169
31. https://warcraft.wiki.gg/wiki/Diminishing_returns
32. https://warcraft.wiki.gg/wiki/Dampening
33. https://github.com/otland/forgottenserver/blob/master/src/combat.cpp (lines ~803-809, ~968-975)
34. https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp (applyPvPDamage ~8232)
35. https://github.com/opentibiabr/canary/blob/main/config.lua.dist
