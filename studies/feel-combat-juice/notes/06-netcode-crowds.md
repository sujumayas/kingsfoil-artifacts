# 06. Latency, netcode feel and crowds

Researcher angle: how combat feels through a server, and what 30 players on one screen do to readability and bandwidth. Combat model is hybrid (targeted plus aimed). Everything below is filtered for a 2D top-down, server-authoritative, web-first Godot 4 MMO.

Tool budget note: about 30 calls. Valve's wiki returned 403 on direct fetch, so Valve numbers come from search snippets quoting the wiki pages. Riot's tech blog timed out (504). poewiki.net blocked by Anubis.

---

## Q1. Client prediction of attacks in action MMOs and ARPGs

### Takeaway
Two working models exist and Path of Exile ships both as a player setting. "Predictive" plays your action at once and risks desync. "Lockstep" waits one round trip and never lies. For a Tibia-like with a server tick, the safe split is to predict only the cosmetic start of your own action (wind-up frame, swing sound, cast bar) and never predict outcomes (damage, death, knockback on others). Prediction of a whole projectile is fine for your own screen if the server owns the hit.

### Cited findings
- PoE 1 offers Predictive, Lockstep and Auto. Lockstep "will not begin showing your character moving until the server authorizes the action"; Auto switches near about 150 ms ping (one wiki gives about 100 ms). The /oos chat command forces a resync. https://poewiki.net/wiki/Desync (summary via search; page blocked to fetch), https://www.pathofexile.com/forum/view-thread/1925713
- GGG's announcement (Chris Wilson, 7 May 2015). Lockstep sends your action to the server before you see it, "a delay equal to your latency". On a lag spike "everything stops moving". Predictive is "probably the best choice" above 100 ms. Lockstep guarantees no desync only if gameplay code is "completely bug-free". https://www.pathofexile.com/forum/view-thread/1262596
- Technical Director Jonathan Rogers: netcode "completely rewritten from scratch to fix desync"; in Lockstep "the monsters are always exactly where you see them". GGG added data centres to keep players under 100 ms. https://www.pcgamesn.com/path-of-exile/path-of-exile-s-new-lockstep-mode-banishes-desync-problems (20 May 2015)
- PoE 2: player reports say Predictive is missing and Lockstep is enforced, causing stutter. Not confirmed by GGG. https://www.pathofexile.com/forum/view-thread/3887145
- Overwatch (Tim Ford, GDC 2017). 16 ms command frames (7 ms in tournament). Movement, all abilities and weapons are predicted by default, teams opt out. Rockets are predicted. On mismatch the client rolls back to the server snapshot and replays buffered inputs. Inputs travel in a sliding window so one lost packet costs nothing. Server-side input starvation triggers "time dilation" (client steps 15.2 ms instead of 16 ms to build a buffer). Secondary summary: https://edgegap.com/blog/game-backend-deep-dive-overwatch-2016-netcode-architecture-rollback ; talk page https://gdcvault.com/play/1024001
- Gambetta: with 100 ms lag and a 100 ms animation, an unpredicted action takes 200 ms to finish. Reconcile with input sequence numbers. Hard-to-reverse outcomes such as death should wait for the server. In his combat example the client may show effects but should not change health until confirmed. https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html
- Tibia's open-source client predicts only walking. OTClient `LocalPlayer::preWalk` starts the step animation before the server answers, and `cancelWalk` undoes it if the server refuses. A timeout exists because "the server sometimes doesn't answer the prewalk". Attacks are not predicted. https://github.com/edubart/otclient/blob/master/src/client/localplayer.cpp
- New World. Amazon: the game is "not client authoritative", outcomes come only from the server, and the client animation "may extend" while it waits. A server bug that waited on client input caused desync. Players reported missing hits after a 2021 update. https://pcgamer.com/new-world-is-not-client-authoritative-amazon-says , https://www.altchar.com/game-news/new-world-combat-is-unplayable-due-to-desync-stagger-and-animation-lock-a3WHD1V3WLHA , https://piunikaweb.com/blog/new-world-desync-and-lag-issues-in-pvp-after-recent-update-arises
- Diablo III. No official netcode write-up found. A 2012 hotfix fixed "several cases" of rubberbanding at very high latency tied to direction changes, speed changes and movement skills. https://eu.diablo3.com/en-gb/blog/10004871/diablo-iii-hotfixes-august-22-08-2012
- WoW spell batching. Classic shipped with a 400 ms batch window (to imitate 2004-era behaviour). PTR 1.13.7 cut it to 10 ms. Some players defended 400 ms because it allowed "both happened" PvP trades (two sheeps, simultaneous kills). https://www.wowisclassic.com/en/news/spell-batching-impact-ptr/ , https://mein-mmo.de/en/wow-classic-ends-the-the-heal-was-actually-done-joke,641282 , https://eu.forums.blizzard.com/en/wow/t/positive-spell-batching-interactions-worth-preserving/252694

### Inferences
- What rejection looks like depends on what you predicted. Predict position and you get rubber-banding. Predict a hit spark and you get a "phantom hit" with no damage. Predict health loss and you get "ghost damage" that heals back. Only the first is unavoidable for a moving player. The other two are self-inflicted.
- Tibia already uses the PoE Lockstep model for combat (server sends effects and numbers, the client only draws them) and players accept it because auto-attacks are 2 s apart. Lockstep cost hurts most for movement and aimed skills, which is exactly where OTClient chose to predict.
- New World's "animation extends while waiting" is a useful pattern. A wind-up that is at least one RTT long hides the confirmation wait completely.

### Gaps
- No primary Albion, Lost Ark or Diablo IV netcode documentation found. Albion is described as server-authoritative only by third-party ping-booster blogs (https://noping.com/blog/albion-online-how-to-improve-ping-and-stability).
- Glenn Fiedler's articles (gafferongames.com) not fetched this pass.

---

## Q2. Lag compensation for skillshots

### Takeaway
Shooters rewind targets (favour the shooter) up to a cap. MMOs mostly do not rewind. They resolve aimed skills on the server at server time and pay for it with generous hitboxes, slow projectiles and telegraphs. For a 32 px tile game, server-time resolution plus a tile-based or slightly enlarged hit area is the honest default. Add a short rewind (one tick, capped) only if PvP testing shows shots feel stolen.

### Cited findings
- Source engine. Server keeps player position history, `sv_maxunlag` default and maximum 1 s on the Valve wiki (CS:GO/CS2 sources say default 0.2 s). Default interpolation `cl_interp 0.1` gives a constant 100 ms view lag so one lost snapshot still leaves two to blend. Effective lerp is `min(max(cl_interp, cl_interp_ratio/cl_updaterate), 0.25)`. Server lag compensation knows the client's interpolation, so players do not lead targets. https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking , https://developer.valvesoftware.com/wiki/Lag_Compensation , https://developer.valvesoftware.com/wiki/TF2_Network_Graph , https://totalcsgo.com/commands/svmaxunlag
- Gambetta. The server rebuilds the world at the shot timestamp. Cost is "somewhat unfair": a target behind cover can still be hit shortly after. He calls it the best compromise. https://www.gabrielgambetta.com/lag-compensation.html
- Overwatch. Server rewinds to the shooter's frame, first testing a bounding volume of about the last 0.5 s of each entity's motion, then fully rewinding only hits. Above about 220 ms RTT hit prediction turns off and the target is extrapolated, so a dodger behind cover is safe. https://edgegap.com/blog/game-backend-deep-dive-overwatch-2016-netcode-architecture-rollback (secondary)
- Apex Legends players cite a developer mention of a 250 ms rewind cap. Forum hearsay, not verified. https://forums.ea.com/discussions/apex-legends-feedback-en/stop-rewarding-laggers-limit-client-side-hit-registration-to-200ms-in-the-past/8435746/replies/8435749
- Riot VALORANT. Defines peeker's advantage. Buffering duration "directly dependent on simulation tick rate", which drove 128-tick servers (7.8 ms) and a target of under 35 ms ping for most players. A secondary summary puts the modelled peeker head start at about 141 ms, trimmed by about a third. https://technology.riotgames.com/node/111 , https://technology.riotgames.com/node/112 , https://edgegap.com/blog/game-backend-deep-dive-valorant-riot-games (141 ms is secondary, unverified)

### Inferences
- Favour-the-shooter breaks dodging, and dodging is the whole point of aimed skills in this design. A player who stepped out of a decal on their own screen and still got hit will blame the game. For a dodge-centric MMO, favour the target (server time) and make the telegraph long enough that latency is a small slice of it. Example: a 600 ms telegraph with 100 ms ping leaves 500 ms of real reaction time.
- With a tile grid, a skillshot that resolves against tiles occupied at server time is far more forgiving than pixel hitboxes, because moving one tile at Tibia walk speeds takes hundreds of ms.
- If rewind is added later, cap it at one server tick plus interpolation delay (for example 100 to 150 ms), never Source's 1 s.

### Gaps
- No MMO published a rewind cap. Albion skillshot resolution undocumented.

---

## Q3. Targeted vs aimed under latency; predict vs confirm; tick rates

### Takeaway
Targeted spells hide latency for free. The projectile can launch locally and home on wherever the target is drawn, and the server only needs to say "hit" when it arrives. Aimed spells expose latency because the decal and the target are both in the past. Show damage numbers on confirm, not on predict. Hit sparks and sound can be predicted for your own targeted attacks only (they cannot miss through aim, so the only failure is a server-side miss or block, which should show as a "miss" puff at confirm time).

### Cited findings
- OSRS. Every in-game timing is a "cycle" of 0.6 s, also called a tick. Melee hit delay is 0 ticks, bows and crossbows 1 to 3 ticks by distance. Older monsters roll damage when the attack animation starts, newer bosses when the hitsplat appears. Retaliation delay is half the attack speed, rounded down. https://oldschool.runescape.wiki/w/Update:PJ_Timer_%26_New_Broadcast_Settings , https://oldschool.runescape.wiki/w/Projectile_speed , https://oldschool.runescape.wiki/w/Hit-and-run
- Tibia (TFS source). There is no single combat tick. Creatures think every `EVENT_CREATURE_THINK_INTERVAL = 1000` ms, spread over `EVENT_CREATURECOUNT = 10` buckets checked every 100 ms. Player auto-attacks are scheduled per player with `max(SCHEDULER_MINTICKS, attackSpeed)` in `Player::doAttacking`. Item decay ticks every 250 ms. https://github.com/otland/forgottenserver/blob/master/src/creature.h , https://github.com/otland/forgottenserver/blob/master/src/game.h , https://github.com/otland/forgottenserver/blob/master/src/player.cpp
- League of Legends runs about 30 Hz (33 ms) per a mirrored League wiki page. Not a Riot primary source. https://gamecytus.netlify.app/host-https-leagueoflegends.fandom.com/wiki/Tick_and_updates
- WoW. Classic batch window 400 ms then 10 ms (see Q1). The SpellQueueWindow cvar defaults to 400 ms and is capped there. It lets you press the next spell up to 400 ms before the current cast or GCD ends. Advice ranges from "100 + ping" to leaving 400. https://maxroll.gg/wow/resources/spell-queue-window , https://us.forums.blizzard.com/en/wow/t/input-lag-spellqueuewindow-and-spell-batching/1210379
- Overwatch 16 ms, VALORANT 7.8 ms (see above). Source default interpolation 100 ms.
- Hit markers are often client-side while the server decides damage. A common fix is to fire the marker from the server's damage result. Bug-blog and forum sources, not a studio statement. https://bugnet.io/blog/how-to-fix-hit-marker-showing-on-shots-that-dealt-no-damage , https://forums.ea.com/discussions/battlefield-6-technical-issues-en/client-hit-detection-andor-hit-communication-to-server/13625005
- Gambetta's combat rule (effects may play, health waits). https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html

### Inferences
- Tibia proves that event-scheduled attacks (not a global tick) remove the 0 to 600 ms "wait for the next tick" jitter OSRS has. OSRS turns that jitter into a skill (tick manipulation), which is charming in OSRS and should not be copied by accident.
- Suggested split for Asterion (estimate, to test):
  - Predict at once (0 ms): own wind-up frame, own cast bar start, own swing sound, own targeted projectile launch.
  - Show on confirm (RTT + up to one server step): damage number, target white flash, target knockback, health bar change, death.
  - For aimed skills, draw the decal locally at once, but resolve and draw the impact on confirm. A miss then needs no rollback, because nothing claimed a hit.
- Server step for a Tibia-like: 50 to 100 ms simulation step for movement and projectiles, with combat events scheduled per entity. Interpolate remote players by one step plus jitter buffer (100 to 150 ms total). Estimate.
- A predicted projectile that the server later says missed should fizzle at the target's feet (small puff, grey "miss"), never vanish mid-air.

### Gaps
- No Albion or WoW (retail) server tick published. Tibia CipSoft's real server is closed source. TFS is the open reimplementation.

---

## Q4. Latency perception thresholds

### Takeaway
Third-person RPG combat tolerates far more latency than shooters. Claypool and Claypool give 100 ms for first-person, 500 ms for third-person avatar games (sports, RPG) and 1000 ms for omnipresent games (RTS). Aimed skills in a top-down MMO sit between RPG and shooter, so treat about 150 ms as the comfort line for skillshots and 500 ms for targeted play.

### Cited findings
- Claypool and Claypool, "Latency and Player Actions in Online Games", CACM Nov 2006. Table 1 thresholds are 100 ms (first person, FPS and racing), 500 ms (third person, sports and RPG), 1000 ms (omnipresent, RTS). Precision and deadline drive sensitivity. "RPG Area Spell" is listed as low sensitivity. In an EverQuest 2 field test, 0 to 500 ms added only about 5 s to roughly 2 minutes of combat. Warcraft III build time grew under 1% up to 3.5 s latency. https://ftp.cs.wpi.edu/pub/techreports/pdf/06-13.pdf , https://cacm.acm.org/?p=1673
- Same paper. Racing performance drops faster above 50 ms and again above 150 ms. Common belief is that 100 ms is the limit "regardless of genre", which the paper argues against.
- GGG recommends Predictive above 100 ms. Riot aims for under 35 ms ping. Overwatch disables hit prediction above about 220 ms RTT. (sources above)

### Inferences
- A miss or rejection that appears 100 to 300 ms late lands inside the "it's the game, not the net" zone for targeted attacks but outside it for dodging. That is the argument for favour-the-target on aimed skills.

### Gaps
- No study measured the threshold for a top-down MMO skillshot. A local test with simulated latency (Godot can add delay in the server loop) is the only way.

---

## Q5. Shared screen with 30 players

### Takeaway
Every big MMO converged on the same rule. Your own effects at full, party reduced, others reduced or off, and enemies and NPC attacks always at full because they carry gameplay information. WoW put that rule in writing in 11.2. FFXIV has had per-group settings for years. For Asterion, ship three tiers (own, party, others) plus an always-on class for hostile telegraphs, and cut network cost by sending effect IDs, not effect data.

### Cited findings
- WoW Spell Density, reworked in 11.2 to Everything / Reduced / Essential. It applies only to other players in your party or raid. Your own and your pet's visuals, NPC spells and enemy player spells always show at full intensity. Reduced is tuned for dungeons and raids. The setting started in the Shadowlands alpha as a dynamic, FPS-driven option with six steps. Some players say Essential still leaves too much. https://www.icy-veins.com/wow/news/too-many-spells-on-screen-patch-11-2-fixes-that-with-one-simple-setting/ , https://blizzardwatch.com/2025/07/28/blizzard-adding-new-ways-reduce-spell-density-better-performance-visibility-patch-11-2 , https://techradar.com/news/world-of-warcraft-shadowlands-should-run-more-smoothly-on-your-pc-no-matter-how-many-spells-are-flying , https://us.forums.blizzard.com/en/wow/t/is-the-new-spell-density-working/2143578
- FFXIV battle effects. Separate settings for self, party, others and enemy PCs, each All / Limited / Off. Text command `/bfx self all`, `/bfx party simple`, `/bfx other off`. Common setup is all / limited / off. Some party ground effects (Asylum, Sacred Soil) are kept under Limited because they mark useful zones. https://na.finalfantasyxiv.com/lodestone/playguide/db/text_command/9241c2b27da/ , https://ffxiv.consolegameswiki.com/wiki/Configuration_text_commands , https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_bteffect.html
- PC Gamer framed WoW's 11.2 change as borrowing "one of FF14's best features". https://www.pcgamer.com/games/world-of-warcraft/wow-snaps-up-one-of-ff14s-best-features-by-letting-players-choose-how-many-particle-effects-they-want-swamping-their-screens-during-raids
- Guild Wars 2 Effect LOD. Limits particle detail, reportedly by distance. At lowest, other players' skills render as generic effects, which guides warn against in PvP. No own/party/others split found. https://hardstuck.gg/gw2/guides/general/performance-improving-settings , https://en-forum.guildwars2.com/topic/26957-spell-effects/
- Lost Ark. Confirmed toggle only for other players' move-effect skins and a spectator option to hide others' combat effects. An "Only for Me" option is claimed by one promotional article, unverified. Screen shake on skill use can be disabled. https://vulkk.com/2022/02/20/lost-ark-settings-and-ui-guide-what-should-you-change/ , https://icy-veins.com/forums/topic/68059-lost-ark-september-update-patch-notes
- Diablo IV players asked for effect toggles in Helltide crowds ("Like in a Where's Waldo book"). https://mein-mmo.de/en/diablo-4-players-are-annoyed-by-the-flood-of-effects-like-in-awheres-waldo-book,1162644
- Tibia wire format (TFS source, measured from code). Packet 0x83 magic effect = opcode 1 + position 5 + type marker 1 + effect id 1 + end marker 1 = 9 bytes. Distance (projectile) effect = 11 bytes (adds dx, dy as signed bytes). Damage text 0xB4 = opcode, type, position 5, primary value u32 + colour, secondary value u32 + colour, plus a string. Effects are sent only to spectators within the client viewport range (`canSee`, `Map::maxClientViewportX/Y`). https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp , https://github.com/otland/forgottenserver/blob/master/src/game.h

### Inferences
- Bandwidth estimate for one 30-player fight (estimate, not measured). One hit seen by one spectator is roughly 9 B effect + 11 B projectile + about 30 to 40 B damage text + about 6 B health update, so about 60 B before TCP framing. If 30 players each land one hit per second, each client receives about 1.8 KB/s of combat events and the server sends about 54 KB/s for that fight. Cost grows with players squared, so aggregation matters above 30.
- Aggregation ideas that keep feel intact: merge all damage on one target within one server step into one number message (also fixes number spam), send only the damage number for "others" tier and let the client skip the effect, and let the client cull rather than the server so a player can switch tiers without a reconnect.
- Server-side interest management is already Tibia's viewport check. Keep it, since 18x14 tiles bounds the spectator set.
- Hostile telegraphs and enemy-player aimed skills must never be culled by any density setting. WoW's rule is the right one.

### Gaps
- No measured per-hit byte counts from WoW, FFXIV or Albion. No GW2 own/party split confirmed. Lost Ark menu unverified.

---

## Q6. Godot 4 multiplayer (brief)

### Takeaway
Web export cannot use ENet or raw UDP. Use WebSocket (TCP, reliable, head-of-line blocking) for a Tibia-like, which is what Tibia itself does over TCP. WebRTC data channels give unreliable delivery on web but need signalling. Rollback addons exist but are overkill for a tick-scheduled MMO. Steal their ideas (input sequence numbers, reconciliation) rather than adopt them.

### Cited findings
- Godot docs. HTML5 "currently offers WebSockets and WebRTC support" and lacks raw TCP/UDP. RPC transfer modes are unreliable, unreliable_ordered and reliable. Channels keep streams from blocking each other. https://docs.godotengine.org/en/stable/tutorials/networking/high_level_multiplayer.html
- netfox (MIT, Godot 4) gives timing, rollback, and client prediction with server reconciliation through a RollbackSynchronizer node, plus a network profiler. https://github.com/foxssake/netfox , https://foxssake.github.io/netfox
- Snopek "Godot Rollback Netcode" (MIT) has Godot 3 and Godot 4 listings. Maintenance status unclear. https://www.godotengine.org/asset-library/asset/2450 , https://gitlab.com/snopek-games/godot-rollback-netcode

### Inferences
- With WebSocket, one lost packet delays everything behind it. Visual feedback that waits for confirm will sometimes arrive in a burst. Smooth this on the client by spacing queued damage numbers by about 50 ms rather than drawing them all in one frame. Estimate.
- An authoritative server does not need to be Godot. TFS-style C++ or a headless Godot server both work. The client effect layer is the same.

### Gaps
- No measured WebSocket vs WebRTC latency numbers for Godot web builds gathered.

---

## Design rules distilled (inference, for the report)
1. Predict cosmetics of your own actions, confirm outcomes. Numbers, flashes, knockback and death wait for the server.
2. Make wind-ups at least about one typical RTT (100 to 150 ms) so confirmation hides inside the animation.
3. Targeted skills: launch locally, home on the drawn target, impact on confirm.
4. Aimed skills: favour the target, resolve at server time, long enough telegraphs, tile-forgiving hit areas.
5. Schedule attacks per entity (Tibia), not on a coarse global tick (OSRS 600 ms), unless tick play is wanted.
6. Three effect tiers (own / party / others) plus an uncullable hostile class. Aggregate damage per target per server step.

## Sources
- https://poewiki.net/wiki/Desync
- https://www.pathofexile.com/forum/view-thread/1262596
- https://www.pathofexile.com/forum/view-thread/1925713
- https://www.pathofexile.com/forum/view-thread/3887145
- https://www.pcgamesn.com/path-of-exile/path-of-exile-s-new-lockstep-mode-banishes-desync-problems
- https://edgegap.com/blog/game-backend-deep-dive-overwatch-2016-netcode-architecture-rollback
- https://gdcvault.com/play/1024001
- https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html
- https://www.gabrielgambetta.com/lag-compensation.html
- https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking
- https://developer.valvesoftware.com/wiki/Lag_Compensation
- https://developer.valvesoftware.com/wiki/TF2_Network_Graph
- https://totalcsgo.com/commands/svmaxunlag
- https://technology.riotgames.com/node/111
- https://technology.riotgames.com/node/112
- https://edgegap.com/blog/game-backend-deep-dive-valorant-riot-games
- https://forums.ea.com/discussions/apex-legends-feedback-en/stop-rewarding-laggers-limit-client-side-hit-registration-to-200ms-in-the-past/8435746/replies/8435749
- https://github.com/edubart/otclient/blob/master/src/client/localplayer.cpp
- https://github.com/otland/forgottenserver/blob/master/src/creature.h
- https://github.com/otland/forgottenserver/blob/master/src/game.h
- https://github.com/otland/forgottenserver/blob/master/src/player.cpp
- https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
- https://pcgamer.com/new-world-is-not-client-authoritative-amazon-says
- https://www.altchar.com/game-news/new-world-combat-is-unplayable-due-to-desync-stagger-and-animation-lock-a3WHD1V3WLHA
- https://piunikaweb.com/blog/new-world-desync-and-lag-issues-in-pvp-after-recent-update-arises
- https://eu.diablo3.com/en-gb/blog/10004871/diablo-iii-hotfixes-august-22-08-2012
- https://www.wowisclassic.com/en/news/spell-batching-impact-ptr/
- https://mein-mmo.de/en/wow-classic-ends-the-the-heal-was-actually-done-joke,641282
- https://eu.forums.blizzard.com/en/wow/t/positive-spell-batching-interactions-worth-preserving/252694
- https://maxroll.gg/wow/resources/spell-queue-window
- https://us.forums.blizzard.com/en/wow/t/input-lag-spellqueuewindow-and-spell-batching/1210379
- https://oldschool.runescape.wiki/w/Update:PJ_Timer_%26_New_Broadcast_Settings
- https://oldschool.runescape.wiki/w/Projectile_speed
- https://oldschool.runescape.wiki/w/Hit-and-run
- https://gamecytus.netlify.app/host-https-leagueoflegends.fandom.com/wiki/Tick_and_updates
- https://bugnet.io/blog/how-to-fix-hit-marker-showing-on-shots-that-dealt-no-damage
- https://forums.ea.com/discussions/battlefield-6-technical-issues-en/client-hit-detection-andor-hit-communication-to-server/13625005
- https://ftp.cs.wpi.edu/pub/techreports/pdf/06-13.pdf
- https://cacm.acm.org/?p=1673
- https://www.icy-veins.com/wow/news/too-many-spells-on-screen-patch-11-2-fixes-that-with-one-simple-setting/
- https://blizzardwatch.com/2025/07/28/blizzard-adding-new-ways-reduce-spell-density-better-performance-visibility-patch-11-2
- https://techradar.com/news/world-of-warcraft-shadowlands-should-run-more-smoothly-on-your-pc-no-matter-how-many-spells-are-flying
- https://us.forums.blizzard.com/en/wow/t/is-the-new-spell-density-working/2143578
- https://www.pcgamer.com/games/world-of-warcraft/wow-snaps-up-one-of-ff14s-best-features-by-letting-players-choose-how-many-particle-effects-they-want-swamping-their-screens-during-raids
- https://na.finalfantasyxiv.com/lodestone/playguide/db/text_command/9241c2b27da/
- https://ffxiv.consolegameswiki.com/wiki/Configuration_text_commands
- https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_bteffect.html
- https://hardstuck.gg/gw2/guides/general/performance-improving-settings
- https://en-forum.guildwars2.com/topic/26957-spell-effects/
- https://vulkk.com/2022/02/20/lost-ark-settings-and-ui-guide-what-should-you-change/
- https://icy-veins.com/forums/topic/68059-lost-ark-september-update-patch-notes
- https://mein-mmo.de/en/diablo-4-players-are-annoyed-by-the-flood-of-effects-like-in-awheres-waldo-book,1162644
- https://noping.com/blog/albion-online-how-to-improve-ping-and-stability
- https://docs.godotengine.org/en/stable/tutorials/networking/high_level_multiplayer.html
- https://github.com/foxssake/netfox
- https://foxssake.github.io/netfox
- https://www.godotengine.org/asset-library/asset/2450
- https://gitlab.com/snopek-games/godot-rollback-netcode
