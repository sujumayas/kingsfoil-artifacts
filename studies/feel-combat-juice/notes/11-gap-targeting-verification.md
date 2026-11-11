# 11. Gap fill (targeting) and fact check

Researcher notes for the combat juice study. Part A fills the thin targeting section of note 04. Part B checks claims from notes 03, 04, 06 and 08. Every claim has a source number; see "Sources". "Inference" marks my own reasoning. Researched 2026-11-11.

---

# Part A. Targeting

## A1. Tab-target cycling rules

### Takeaway
No game publishes its full cycling algorithm, but the settings they expose show the shape. WoW limits Tab to the tab-targeting area, locks cycling to in-combat enemies once you are fighting, skips anything neither you nor the camera can see, and puts players first in PvP. FFXIV cycles nearest to farthest with a filter per weapon state. Tibia has no Tab at all. Its "Attack next target" key walks the battle list in whatever order the player sorted it. For a 2D MMO the Tibia model is the most honest one, because the order is visible on screen as a list.

### Cited findings

WoW
- `TargetNearestEnemy([reverse])` "selects the closest enemy", is bound to Tab, needs a hardware event and has been protected since 2.0.1 (2006-12-05). The API page says nothing about range, cone or order [1].
- The old CVar `targetNearestDistance` had a default of 41 yards and a max of 50, per Classic and TBC forum posts. A WotLK-era WoWInterface thread says it and `targetNearestDistanceRadius` were removed [2]. Forum sources only. The current complete CVar list has no `targetNearest*` entry, which supports "removed" [3].
- Patch 7.2 (2017-03-28) replaced the old Tab logic. The current CVar is `TargetNearestUseNew` = 1, described as the "new 7.2 'nearest target' functionality". Setting 0 gives "6.x style tab targeting" [3].
- 7.2 PTR notes said Tab in combat skips targets that are out of combat with you, and skips targets "neither your character nor your camera can see". The exception is turning to face a new target when your current enemies are behind you [4].
- Current priority CVars and defaults from the complete list [3]:
  - `TargetPriorityCombatLock` = 1. Lock to in-combat targets when you start from an in-combat target. 2 also requires the target to be in combat with you.
  - `TargetPriorityCombatLockContextualRelaxation` = 1. Relaxes the lock when no in-combat target is in front.
  - `TargetPriorityPvp` = 1. In PvP, higher priority to players and important PvP targets. Other values add boss NPCs, all PvP targets, or players only.
  - `TargetEnemyAttacker` = 1. Auto-targets an enemy that attacks you when you have no target.
  - `TargetAutoEnemy` = 1, `TargetAutoLock` = 0, `stopAutoAttackOnTargetChange` = 0.
- Soft target CVar defaults, now verified against the complete list (note 04 had them as forum-only) [3]:
  - `SoftTargetEnemy` = 1 (gamepad only; 0 off, 2 keyboard and mouse, 3 always).
  - `SoftTargetEnemyArc` = 2. "0 = No yaw arc allowance, must be directly in front. 1 = Must be in front yaw arc. 2 = Can be anywhere in tab targeting area."
  - `SoftTargetEnemyRange` = 45 yards, "limited to tab targeting range".
  - `SoftTargetInteractRange` = 10, `SoftTargetInteractArc` = 0.
  - `SoftTargetForce` = 1 (soft enemy becomes your real target), `SoftTargetWithLocked` = 1, `SoftTargetMatchLocked` = 1.
  - `SoftTargetNameplateEnemy` = 1, `SoftTargetNameplateSize` = 19 px icon, `SoftTargetIconEnemy` = 0.
- No degree value for the "front yaw arc" is exposed anywhere I found.

FFXIV
- Default keys. Tab cycles enemies nearest to farthest, Shift+Tab farthest to nearest. F11 targets the nearest enemy. T targets your target's target. F10 targets the focus target and Shift+F sets it. Ctrl+Num8/Num2 cycle the enmity list [5].
- Default cycling filter. Weapon sheathed cycles all targets. Weapon drawn cycles enemies and NPCs/objects. Filters live in Character Configuration > Control Settings > Filters [5].
- Controller uses a two-step "target circle". The d-pad shows a temporary circle, A confirms it into a marker. Left/right cycles all targets, up/down cycles party, LB+up/down cycles enmity [5].
- Community guides describe a choice between "Ignore Depth" and "Cone" for nearest-enemy selection. Menu paths conflict between guides and no official definition was found [6].
- Players say the Tab order feels random. That is player opinion, not a documented rule [6].

ESO
- A 2013 developer Q&A says you must face the target to hit it. Soft lock lets you pick one out of a crowd, and another enemy cannot step in to absorb the hit, but the target can still dodge [7].
- Players describe PC tab target as a priority hint, not a hard lock. If the reticle is off the target the attack misses. Console has a hard lock on hold R3 [7]. Forum level, and the dev Q&A predates launch.

Tibia (official client and OTClient)
- No Tab key in the classic sense. You click a creature in the world or in the battle list. Canary handles this as a single `parseAttack(creatureId)` packet (note 04 [13]).
- Modern clients have an "Attack next target" binding. Players sort the battle list by distance, hit points or name and the key walks that order. To skip players, hide them in the battle list filter [8].
- OTClient's battle list module has sort options by display time (default ascending), distance, hit points and name, each ascending or descending. Its filters hide players, NPCs, monsters, skulls, party, own guild, summons, and each vocation [9]. So the cycle order and filter are both visible UI, not hidden logic.
- Battle modes. "Chase opponent" walks to the target, "Stand while fighting" stays put, and only one is active. Switching mid-fight takes one 2 s round. "Auto chase off" switches to stand when you move [10]. TibiaWiki (Fandom), not CipSoft.
- Private-server docs (Exordion) list first, next and previous target hotkeys over the battle list, and require the creature to be visible [8].

Albion
- Click to attack is the default. A "Double click to attack" option exists so a single click on a player inspects instead of attacking. Space is "Attack current target", Alt+S deselects [11]. Third-party guides only. No official doc on Albion's aim modes found.

### Inferences
- Copy Tibia's model for cycling. The battle list is the cycle order. Tab and Shift+Tab walk the list as currently sorted and filtered. That makes the order predictable, which is the main complaint about WoW and FFXIV.
- Add WoW's two most useful rules on the server side. Once in combat, Tab only cycles units in combat with you (with a relax rule if none is in view). In PvP zones, players sort before mobs. Both are cheap filters.
- Skip what the player cannot see. On a top-down screen that means off-screen tiles and tiles hidden by roof or floor changes.
- Set range as "visible screen" rather than yards. A Tibia view is about 15 x 11 tiles. WoW's 41 to 45 yard tab range covers roughly a screen too.
- `TargetEnemyAttacker` is worth copying for soft-difficulty players. If you have no target and something hits you, it becomes your target.

### Gaps
- No primary source for WoW's yaw arc angle or for what "tab targeting area" measures.
- FFXIV "Cone" vs "Ignore Depth" semantics unconfirmed.
- No official CipSoft page for "Attack next target".

---

## A2. Soft lock and aim assist in top-down, twin-stick and mobile games

### Takeaway
Mobile MOBAs solve the exact hybrid problem Asterion has. One button does two things. A tap auto-targets by a priority rule (nearest, or lowest health), so the skill behaves like a targeted spell. A drag shows an aim indicator, fires on release, and the skill becomes a skillshot that can miss. Dragging back to the center or onto a cancel zone aborts. That is one control that serves both soft-difficulty and skilled players, and it maps cleanly to mouse (click = tap, hold = drag). Top-down action games sit at the other end. Hades snaps up to about 90 degrees, which is closer to aim automation than assist.

### Cited findings

Brawl Stars
- The right joystick is the attack. Drag to aim, release to fire. A tap is a "quick-fire" that "automatically fire[s] once at the nearest target". If nothing is in range it fires toward the nearest damageable object. Drag back to the center to cancel. The Super joystick works the same way [12].
- Beta history notes. Auto-aim always fires when tapped even with no target. It targets through skulls, vases and other breakables. Some Star Powers change the auto-aim target (Jessie's turret, Poco's allies) [13].
- Auto-aim picks the nearest enemy by straight-line distance and ignores walls, so it can shoot into a wall [14]. Third-party guide. Guides say auto-aim is for point-blank, manual for range [14].
- Auto-aim shoots at the target's current position with no lead (community knowledge, not found in a source this round).

Wild Rift (League of Legends on mobile)
- Touch aim is imprecise, so a priority system auto-targets attacks and abilities and marks the chosen target with a glowing ring [15].
- Targeting priority setting has "Closest", "Low Health (Absolute)" and "Low Health (%)" [16].
- "Lock Target System" with "No Minions/Structure" (called Target Lock Filtering, added around patch 2.4, opt-in) restricts locks to champions [16][17].
- Dragging the basic attack button toward a unit locks auto-attacks on it [17].
- A drag on an ability shows an arrow, fires on release, and snaps to max range if you drag past it [15].
- A Riot designer says any aimable ability must fire on button release on mobile, unlike PC where it can fire on press, because PC already has the mouse at press time [15].
- Two cancel methods. Default is dragging onto an X button at the screen corner. The other cancels if you aim outside the skill's range [15].
- Riot dev (2021). Tap-cast "still selects the target nearest your aim cursor". A fix stopped "ping-pong between two targets at the edge of your range". Smite prioritizes large monsters if it would kill them [18].
- Irelia dev post (2021-05-31). Tap-cast follows "regular prioritization" which favors low-health targets. When she aims Bladesurge, the game searches "near the focus point" for a resettable target. Riot normally encourages players "to use the lock-on feature" [19]. This is the clearest official example of aim assist applied only to an aimed drag.

LoL PC (for comparison, from note 04)
- Normal cast, quick cast, quick cast with indicator. Same idea as tap vs drag, split across settings.

Hades and other top-down action games
- A reverse-engineering video of Hades and Death's Door says Hades can snap the attack "as much as 90 degrees" toward a target and calls it aim automation. Death's Door corrects by no more than 15 degrees [20]. Single third-party source, creator not named on the mirror.
- A Hades II mod page says vanilla auto-target covers roughly 70 to 90 degrees for most ranged weapons [21] (search snippet, page 403).
- A Hades II guide lists magnetism levels Low (narrow cone), Medium (default, wider) and higher. No degrees [20].
- Hyper Light Drifter. No source found on its gun auto-aim rules. Gap.
- Rogue Star Rescue devlog (2019-02-04) on 2D aim assist. 5 raycasts in a cone that is wider far away and narrower close up, a 0 to 100 % strength slider, a minimum distance to stop jitter, squared distances for speed [22].

Diablo IV and III on controller
- Diablo IV auto-targets by default on controller. Pressing the right stick toggles manual targeting. "Persist Target Lock" in Accessibility keeps the lock [23].
- Players report auto-aim choosing adds over the boss, and mobility skills snapping to monsters and losing range [23]. Players praise Diablo III's controller targeting, but no technical rule was found [23].

### Inferences
- The Asterion hotbar rule can be one sentence. Click or tap a skill fires it at the current target (or the nearest valid enemy if none, using a priority setting). Hold and drag aims it and fires on release. Targeted skills ignore the drag. Aimed skills use the drag, and a tap aims them straight at the target's current tile with no lead, so a moving target can still dodge.
- That last point keeps "aimed skills can miss" true even for tap users. It is the Brawl Stars behavior and it is what makes tap-fire fair in PvP.
- Priority setting per player. Closest (default), Lowest health, Lowest health %. Add a "Players first" toggle that defaults on in PvP zones. Copy Wild Rift's "no minions/structures" as "no summons".
- Aim assist budget for drag-aim. Death's Door's 15 degree correction is a sensible PvE ceiling. Hades' 90 degrees is too much for PvP. In PvP, use 0 degrees or a few degrees, and never curve the projectile after release.
- Wild Rift's ping-pong fix is a real rule to copy. Add hysteresis so the auto-target does not flip between two units at equal distance. For example keep the current pick unless another is at least 1 tile closer.
- On a 32 px tile grid, compare distances in tiles (Chebyshev, Tibia-style) and break ties by facing, then by lowest unit id, so the server and client agree.

### Gaps
- No primary Supercell or Supergiant statement on auto-aim angles or ranges.
- No Hyper Light Drifter source.
- Wild Rift tap-cast range limits and the Riot controls dev diary text not reached.

---

## A3. Target feedback

### Takeaway
Every game in this set uses the same layered kit. A ring or outline under the selected unit, a separate weaker mark for a soft or hover target, a target frame with the target's cast bar, and an optional target-of-target. WoW ships target-of-target off by default and target cast bar on. None of the games mark "can miss" skills with an icon. The aim preview shape does that job.

### Cited findings
- WoW defaults. `showTargetCastbar` = 1, `showTargetOfTarget` = 0 [3].
- WoW nameplates. `nameplateMaxDistance` = 60. `nameplateTargetRadialPosition` = 0. Setting 1 places an off-screen target's nameplate around the screen edges, and 2 does it for all in-combat units [3].
- WoW soft target shows an icon on the nameplate (19 px default) and always shows the soft enemy's nameplate [3]. So hard and soft targets look different.
- FFXIV. A temporary "target circle" while cycling, which turns into a marker when confirmed [5]. Two visual states for "considering" vs "selected".
- ESO. Tab target gets a white glow outline [7].
- Wild Rift. A glowing ring on the auto-chosen target [15]. Irelia's resettable minions get a purple health bar [19]. This is a per-skill hint drawn on the target, which is a good pattern for "this skill will reset or execute here".
- Brawl Stars. The drag shows the attack shape. A tap shows nothing before firing [12].
- GW2 and LoL (note 04). Ground and line previews are the "can miss" signal.

### Inferences
- Four target marks for a 32 px game, each cheap:
  1. Hard target. A 1 px red ring or corner brackets under the sprite, steady.
  2. Soft or next-target preview. A dim ring or a small arrow above the head, so players see what a tap would hit before pressing.
  3. Hover. A 1 px outline on the sprite under the cursor (shader or a second sprite).
  4. Party target or focus. A coloured pip on the nameplate.
- Show the next-tap target all the time when the player has no hard target. This turns the hidden priority rule into visible UI, the same way Tibia's battle list does.
- Target-of-target matters for PvP healers and tanks. Ship it as a small text line under the target frame, off by default like WoW.
- Mark skill type on the hotbar (note 04 suggests a corner glyph). Add Wild Rift's trick of drawing a hint on the target itself, for example an execute marker on the health bar when a finisher would kill.

### Gaps
- No primary source on WoW's target ring art or sizes.
- No measured readability data for target rings at 32 px.

---

# Part B. Verification

| # | Claim (as in notes) | Verdict | Evidence | Source |
|---|---|---|---|---|
| 1a | WoW DR 12.0.0 (2026-01-20): reset 18 s to 16 s, immune after 2 applications | CONFIRMED | Patch history quotes "reset after 16 seconds (was 18 seconds)" and "fully immune ... after 2 casts (was 3)". Also creatures stop going immune to stuns and halve down to 1/16 | [24] |
| 1b | 12.1.0 (2026-08-11) raised reset to 20 s | CONFIRMED | "reset after 20 seconds (was 16 seconds)", dev note says for Season 2 | [24] |
| 1c | PvP CC capped at 6 s | CONFIRMED | "maximum PvP duration on Retail is 6 seconds", except an Evoker buff | [24] |
| 1d | Knockbacks immune after the first | CONFIRMED | Immune after first use, 10 s reset (5.4.0, 2013-09-10) | [24] |
| 1e | Wiki intro contradicts patch history | CONFIRMED | Intro still says 18 s window and a 75 % third step, both outdated by 12.0.0 and 12.1.0. Current rule is 100 %, 50 %, then immune, 20 s reset | [24] |
| 2a | SpellQueueWindow default 400 ms | CONFIRMED | Complete CVar list, default 400, "how early you can pre-activate/queue a spell" | [3] |
| 2b | SpellQueueWindow max 400 ms | CONFIRMED (secondary) | Maxroll and addon authors give 0 to 400. No Blizzard source for the cap | [25] |
| 2c | Classic batching 400 ms to 10 ms in 1.13.7 | CONFIRMED | 1.13.7 PTR, article 2021-01-26, citing the June 2014 Celestalon blue post for the 400 ms original | [26] |
| 3 | FFXIV animation lock 500 ms client, then about 600 ms server | CONFIRMED (player analysis) | Client applies 500 ms, then reapplies the server value, "typically around 600ms, but some actions have more". Server delay averages about 40 ms. Source is a 2021-10-14 forum post quoting a Reddit interview, not an SE statement | [27] |
| 4a | Smash Ultimate hitlag `(0.65 x d + 6)`, cap 30 | CONFIRMED | Formula with h, e, s, p, c multipliers. Cap 30 frames (20 for a crouch-cancelling victim). Kirby Stone x1.2 can reach 36 | [28] |
| 4b | x0.75 at 8 players | CORRECTED | 0.75 is the end value, not a flat factor. p = 1 - ((H - 10) / 20) x (1 - pc). No effect at 10 frames or less, full 0.75 only when prior hitlag reaches 30. So an 8-player 20-frame hit gets x0.875. Table also has 0.925 (3p), 0.862 (4p), 0.752 (7p). Also missing from note 03: when spirits are on and hitlag exceeds 15 frames, a soft-cap formula `x 0.3 + 10.5` applies | [28] |
| 5a | Kao juiciness study N = 3,018 | CONFIRMED | Entertainment Computing 34, 100359 (2020). None and Extreme lowered play time, experience, intrinsic motivation and performance vs Medium and High | [29] |
| 5b | Hicks Juicy Game Design N = 40 and 32 | CONFIRMED | Study 1, 40 participants, Cuber and Dungeon Descent. Study 2, 32 participants, Quake III Arena. CHI PLAY 2019 pp. 185-197 | [30] |
| 6a | Phantom Camera 3,657 stars, MIT | CONFIRMED | GitHub API on 2026-11-11, 3,657 stars, MIT, last push 2026-11-09 | [31] |
| 6b | Phantom Camera shake uses trauma squared | CONFIRMED | `phantom_camera_noise_2d.gd` lines 127 and 129, position and rotation are multiplier x `pow(_trauma, 2.0)` x noise | [32] |
| 6c | No per-instance uniforms for canvas_item shaders | CORRECTED | True up to 4.3 only. PR #99230 "Implement 2D instance uniforms" merged 2024-12-20, milestone 4.4. It touches the GLES3 (Compatibility) canvas renderer as well as RD, so web export gets it. Follow-up fix #102503 merged 2025-02-07 (4.4). Godot 4.4+ supports `instance uniform` in canvas_item shaders and `CanvasItem.set_instance_shader_parameter` | [33] |
| 7a | PoE GGG post 7 May 2015 | CONFIRMED | "Update on Deterministic Lockstep", Chris Wilson, 2015-05-07. Quotes "a delay equal to your latency", "everything stops moving", Predictive "probably the best choice" above 100 ms | [34] |
| 7b | Auto mode switches around 150 ms | UNVERIFIED | Only the community wiki gives about 150 ms. The 2015 post has no Auto mode, only a plan to make Lockstep "automatic for players with low latency". No GGG figure found | [34][35] |
| 8 | Overwatch hit prediction off above about 220 ms RTT | CONFIRMED (translation) | Chinese transcript of Tim Ford's GDC 2017 talk. Above 220 ms ping, some hit effects are delayed and not predicted, the client waits for server confirmation. Reason given is to avoid pulling a target back from behind a wall. A forum comment recalls 250 ms, which I discount. GDC Vault video not watched | [36][37] |

Corrections to carry into the report
- Note 03 on Smash. Replace "x0.75 at 8 players" with the ramp described in 4b.
- Note 08 on Godot. Replace "no per-instance uniforms for canvas_item shaders" with "available since 4.4 in both renderers". The hit-flash shader can use `instance uniform float flash_amount;` and keep one shared material, which helps batching. Batching behavior with instance uniforms on Compatibility was not measured. Test it.
- Note 06 on PoE. Keep 150 ms marked as wiki-only.
- Note 04 on WoW soft target CVars. Now verified against the CVar list. `SoftTargetEnemyArc` default is 2 (anywhere in tab area), not 1 as one forum post said.

---

## Sources
1. https://warcraft.wiki.gg/wiki/API_TargetNearestEnemy
2. https://tbc.wowhead.com/forums/topic/93844 , https://wowinterface.com/forums/showthread.php?p=102656 , https://classic.wowhead.com/forums&topic=42190/targeting-macro-discussion (forum, unverified)
3. https://warcraft.wiki.gg/wiki/Console_variables/Complete_list (read 2026-11-11)
4. https://warcraft.wiki.gg/wiki/7.2 and 7.2 PTR notes coverage https://blizzardwatch.com/2017/01/20/wow-patch-7-2-ptr-patch-notes/ (via search summary)
5. https://ffxiv.consolegameswiki.com/wiki/Controls (read via api.php wikitext)
6. https://www.gameskinny.com/tips/ffxiv-pc-controls-guide/ , https://forum.square-enix.com/ffxiv/threads/423581-Help-with-Tab-targeting (via search summary)
7. https://content3.uesp.net/wiki/General:Ask_Us_Anything:_Combat , https://forums.elderscrollsonline.com/en/discussion/174580/console-hard-lock-target (via search summary)
8. https://www.tibiaqa.com/3155/how-to-do-single-target-hunting-with-the-battle-window-in-an-efficient-way , https://www.tibiaqa.com/31797/how-to-bind-a-key-to-attack-only-creatures , https://exordion.gitbook.io/exordion-wiki/en/client/hotkeys
9. https://github.com/mehah/otclient/blob/main/modules/game_battle/battle.lua (lines 29-36, 253, 578-610)
10. https://tibia.fandom.com/wiki/Combat_Controls (via search summary; see it in action)
11. https://vortexgaming.io/en/postdetail/735023 , https://www.magicgameworld.com/?p=46310 (third-party)
12. https://brawlstars.fandom.com/wiki/Beginner%27s_Guide (read via api.php wikitext; see it in action)
13. https://brawlstars.fandom.com/wiki/Version_History/Beta
14. https://androidayuda.com/en/?p=189732 , https://jeu.video/en/guide/brawl-stars-aim-settings (via search summary)
15. https://www.oneesports.gg/wild-rift/the-ultimate-guide-to-wild-rift-for-league-of-legends-players/ , https://gamingbolt.com/league-of-legends-wild-rift-streamlined-gameplay-revealed-in-new-dev-diary , https://www.ginx.tv/en/wild-rift-best-controller-and-ui-settings (via search summary)
16. https://playerassist.com/league-legends-wild-rift-change-targeting-priority-target-lock-filtering/
17. https://joyletto.pages.dev/posts/select-target-lock-filtering-now-the-best-new-feature-in-wild-rift-patch-2-4 , https://upcomer.com/what-are-the-best-settings-in-league-of-legends-wild-rift (via search summary)
18. https://devtrackers.gg/wildrift/p/6ea4c94a-the-targeting-system (Riot dev reply, 2021)
19. https://wildrift.leagueoflegends.com/en-gb/news/dev/dev-irelia-dances-her-way-to-wild-rift (official, 2021-05-31; see it in action)
20. https://tw.voicetube.com/videos/173139 (mirror of a reverse-engineering video; via search summary, direct fetch 404), https://egg.network/ms/guides/hades-2-ps5-beginners-guide
21. https://www.nexusmods.com/hades2/mods/89 (search snippet; 403 on fetch)
22. https://chuteapps.itch.io/rogue-star-rescue/devlog/68507/effective-aim-assist-in-2d-shooters
23. https://primagames.com/tips/how-to-enable-auto-targeting-in-diablo-4 , https://eu.forums.blizzard.com/en/d4/t/controller-auto-aim-toggle-onoff-option-please/8549 , https://us.forums.blizzard.com/en/d4/t/disengage-auto-aim-function-needed-like-shift-on-pc/100851
24. https://warcraft.wiki.gg/wiki/Diminishing_returns
25. https://maxroll.gg/wow/resources/spell-queue-window , https://www.curseforge.com/wow/addons/spellqueueperspec
26. https://www.wowisclassic.com/en/news/spell-batching-impact-ptr/
27. https://forum.square-enix.com/ffxiv/threads/444667
28. https://www.ssbwiki.com/Hitlag (read via api.php wikitext)
29. https://dblp.uni-trier.de/rec/journals/entcom/Kao20.html , https://www.x-mol.com/paper/1307980428882448384 (abstract), DOI 10.1016/j.entcom.2020.100359
30. https://core.ac.uk/download/492524999.pdf (Hicks thesis), https://bibtex.github.io/CHI-PLAY-2019-HicksGDA.html , DOI 10.1145/3311350.3347171
31. https://github.com/ramokz/phantom-camera
32. https://github.com/ramokz/phantom-camera/blob/main/addons/phantom_camera/scripts/resources/phantom_camera_noise_2d.gd
33. https://github.com/godotengine/godot/pull/99230 , https://github.com/godotengine/godot/pull/102503 , https://github.com/godotengine/godot/issues/62943
34. https://www.pathofexile.com/forum/view-thread/1262596
35. https://poewiki.net/wiki/Desync (community wiki; bot wall on direct fetch, via search summary)
36. https://www.sohu.com/a/148848770_466876 (Chinese transcript of Tim Ford GDC 2017), https://gdcvault.com/play/1024001
37. https://edgegap.com/blog/game-backend-deep-dive-overwatch-2016-netcode-architecture-rollback (secondary)
