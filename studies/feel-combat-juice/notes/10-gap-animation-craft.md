# 10. Gap pass: pixel-art combat animation craft for a 32 px top-down MMO sprite

Scope. Notes 02 and 03 already cover D2 cast frames (13 f at 25 fps, action on frame 7), D2 hit recovery, the NT 3-frame hurt sprite and `wkick` recoil, the startup/active/recovery split and fighting-game hitstop. This file adds attack-animation craft: per-phase frame timings, smears, follow-through holds, direction counts and art cost, layered weapons, auto-attack pacing, cancelling, and cast animations.

Honest summary. The best hard numbers came from Raymond Schlitter's (Slynyrd) 2018 and 2025 Pixelblog posts, the Heroes of Hammerwatch script mirror, the OTClient source and the D2 attack-speed tables. Pedro Medeiros (saint11) tutorials are GIFs with no machine-readable text, so I got no numbers from them. Heart Machine (HLD), Dead Mage (Children of Morta), Pixpil (Eastward) and Radical Fish (CrossCode) have no public frame data that I could find. The GW2 wiki returned 500 and UESP returned 403, so the cancelling section rests on search snippets for those two.

---

## Q1. Anticipation, active and recovery for light and heavy attacks, and auto-attack pacing

### Takeaway
- A good top-down pixel melee swing is 6 frames and 400 ms for a light weapon, up to 800 ms for a heavy one. Only the first and fifth frames change length between weapons. Anticipation goes from 100 ms (sword) to 250 ms (hammer). The follow-through hold goes from 100 ms to 300 ms. The three middle frames stay at 50 ms each, so the strike itself always takes 150 ms.
- Weight comes from the hold on anticipation and on the follow-through, not from more frames.
- D2 puts the hit on frame 6 to 11 of a 14 to 19 frame swing at 25 fps. That is 240 to 440 ms of wind-up before damage, which players accept for a click-to-attack game but which reads as sluggish for an aimed action game.
- Heroes of Hammerwatch (online co-op, top-down) separates the visual animation from the gameplay "castpoint" (ms until the effect fires) and "cooldown". A melee swing sweeps its hit rays across a 45 degree arc over 150 ms by default. That is the same 150 ms "strike" window as Slynyrd's three 50 ms smear frames.

### Cited findings
- Slynyrd Pixelblog 56 (23 May 2025), top-down attack, 8 directions, 6 frames per weapon. Per-frame ms: sword 100, 50, 50, 50, 100, 50 (400 ms). Spear 200, 50, 50, 50, 150, 50 (550 ms). Hammer 250, 50, 50, 50, 300, 100 (800 ms). Phases are anticipation, smear, follow-through and recover, plus a one-frame "rebound" for the hammer. Follow-through moves "1 more pixel" into the target and is held longer. https://www.slynyrd.com/blog/2025/5/23/pixelblog-56-top-down-character-attack-animation
- Slynyrd says a more dramatic wind-up costs input delay. Pixelblog 9 (8 Sep 2018) says "too much anticipation will give a nasty feeling of input lag". Heavy weapons get "a slower anticipation and recovery". https://slynyrd.com/blog/2018/9/8/pixelblog-9-melee-attacks
- Slynyrd Pixelblog 58 (2 Oct 2025) reuses the 6-frame sword timing (100/50/50/50/100/50) on a full character with sword, shield and cape. Run is 6 frames at 100 ms. https://www.slynyrd.com/blog/2025/10/2/pixelblog-58-top-down-character-animation-part-3
- D2 melee attack frames per direction and action-flag frame (hit frame), from the Amazon Basin wiki: Barbarian 1H sword 16 f, hit on 7. Paladin 1H sword 15 f, hit on 7. Sorceress staff 18 f, hit on 11. Amazon bow 14 f, hit on 6. Necromancer 1H sword 19 f, hit on 9. Engine runs 25 fps (40 ms per frame). Frames per attack = ROUNDUP((FramesPerDirection - 1 - StartingFrame) * 256 / AnimRate). https://theamazonbasin.com/wiki/index.php/Attack_speed
- Heroes of Hammerwatch `ActiveSkill.as`. Params `castpoint` (ms before `DoActivate`, min 1), `cooldown` (default 1000 ms, never below castpoint), `speed-mul` (move speed multiplier while the animation plays), `idle-cooldown-mul` (cooldown ticks at a different rate when standing still). The client sends `PlayerActiveSkillDoActivate` to all peers when castpoint expires. https://github.com/exp111/HeroesOfHammerwatch/blob/master/assets/scripts/Behaviors/Actors/Skills/ActiveSkill.as
- HoH `MeleeSwing.as`. Defaults `arc` 45 degrees, `rays` 4, `dist` 10, `duration` 150 ms. The interval between rays is duration / rays / swings - 1. The skill is direction-targeted. https://github.com/exp111/HeroesOfHammerwatch/blob/master/assets/scripts/Behaviors/Actors/Skills/MeleeSwing.as
- WoW melee auto-attack fires once per weapon speed (for example 3.8 s for a slow two-hander). Most instants do not reset the swing timer, and casts can interrupt it. https://eu.forums.blizzard.com/en/wow/t/tauren-war-stomp-and-melee-autoattack-classic/86971 , https://classic.wowhead.com/forums&topic=111038/swing-timer-gcd-noob-question
- Tibia auto-attack runs on a 2000 ms server swing (note 01). Tibia outfits have no attack animation at all. OTClient draws a creature from idle or walk phases only, and the hit shows as a missile or magic effect plus the damage number. See Q3 for the code.
- League of Legends windups are cancelled by any new command, except in a one-tick grace window (0.033 s) just before the windup completes. After the attack fires, one more tick locks input. https://wiki.leagueoflegends.com/en-us/Basic_attack

### Inferences
- [inf] Map Slynyrd's phases onto server events. Anticipation is the "telegraph" the server can broadcast. The first smear frame is the action frame where damage applies. The follow-through hold is where the hit spark, flash and damage number should land.
- [inf] For a 1 to 2 s MMO auto-attack, play the swing at the moment the server resolves the hit, then idle (combat idle, weapon raised) for the rest of the interval. Do not stretch a 400 ms swing to fill 2000 ms. A slow, stretched swing reads as lag. This is what WoW does (swing fires per weapon speed) and Tibia does in its extreme (no swing, effect only).
- [inf] Because the client only learns of the hit when the server says so, the client should start anticipation locally on the expected swing time (it knows the swing period) and snap to the smear frame when the hit packet arrives. With a 100 ms anticipation the server packet usually arrives inside the wind-up at 50 to 100 ms ping.
- [inf] Recommended budgets at 32 px. Light auto-attack, 4 to 6 frames, 300 to 400 ms, anticipation at most 100 ms. Heavy or aimed skill, 6 frames, 550 to 800 ms, anticipation 200 to 250 ms with a visible telegraph. Anticipation above about 250 ms on a player-triggered action needs a cast bar or ground decal so it reads as intent, not lag (Slynyrd and D2 both cap near there; D2's 280 ms Sorceress wind-up is the upper bound players accept).

### Gaps
- No frame data for HLD, Dead Cells, Hades, CrossCode or Children of Morta melee. Dead Cells' Thomas Vasseur describes key-frame-first timing, then adds in-betweens, but no counts. https://www.jikguard.com/news/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-dead-cells
- No source on exact WoW melee animation length vs swing speed.

---

## Q2. Smears, arcs, trails, impact and hold frames, squash and stretch, hit reactions

### Takeaway
- Smear frames should be few and fast. One smear frame is often enough. Put them only between anticipation and follow-through, never on anticipation or recovery.
- The follow-through frame is drawn clean (no smear) and held 2x to 6x longer than a smear frame. This "hold" does much of the work hitstop does in single-player games, and it is local to the attacker, so it is safe on a shared MMO screen.
- At 32 px, a 1 px push into the target on follow-through and a slightly elongated weapon or arm at full extension sell range and contact.
- Hit reactions in pixel games are short, 3 frames (NT, about 100 ms) to 3 to 13 frames (D2 at 25 fps), and D2 only plays them above a damage threshold (note 02).

### Cited findings
- Smears "should always be few and fast". Often "a single smear frame can get the job done". Smears follow the natural path from stance to follow-through. Colour gradation can smooth motion without extra frames. https://slynyrd.com/blog/2018/9/8/pixelblog-9-melee-attacks
- Arc. A sword swing covers "a large 90 degree area" from above the head to straight ahead. Elongating the weapon or arm at full extension adds range and looseness. Same source.
- Overshoot. Shift the stance "one pixel to the left for one frame" on recovery. Hold a pose "a few extra frames to add impact". Freeze on the impact frame only for strong collisions. Same source.
- Smears go on the wind-up-to-strike frames. Smears on anticipation or recover "noisily distracts" from the strike. Follow-through has no smear and moves 1 px further. The hammer adds a one-frame rebound plus screen shake for weight. https://www.slynyrd.com/blog/2025/5/23/pixelblog-56-top-down-character-attack-animation
- HoH sweeps 4 hit rays across the arc over 150 ms, so the hitbox follows the smear instead of popping on one frame. https://github.com/exp111/HeroesOfHammerwatch/blob/master/assets/scripts/Behaviors/Actors/Skills/MeleeSwing.as
- Saint11 (Pedro Medeiros) has GIF tutorials titled "AttackSheet", "TopDownAttack", "Impact", "Squash" and "Swords" in his index. The GIFs carry no text, so no numbers were extracted. https://saint11.art/blog/pixel-art-tutorials/

### Inferences
- [inf] Squash and stretch on a 32 px body is 1 to 2 px. More than that changes the silhouette and reads as a different pose. Apply it in code (a 2 to 3 frame scale tween of 0.9 to 1.1 on the sprite node) instead of drawing it, so it costs zero art across all directions.
- [inf] Weapon trails at 32 px are better as one drawn smear frame per direction than as a runtime ribbon. A ribbon at 2x or 3x pixel scale breaks the pixel grid unless snapped. If a runtime trail is used, draw it as a fixed set of 3 to 4 arc sprites (one per 45 degrees) on the effect layer.
- [inf] Use Slynyrd's follow-through hold as the MMO substitute for hitstop. A 100 ms hold on the attacker's own sprite, plus a 1 to 3 frame freeze of only the attacker and target visuals (note 08, per-node hitstop), gives contact without freezing other players.
- [inf] Hit reaction for MMO crowds. One 2-frame flinch (about 150 ms total) plus a white flash, played only when damage exceeds a share of max HP or on crits, like D2. Small chip damage gets only the flash and number.

### Gaps
- No numbers found for squash and stretch amounts on 16 to 32 px sprites from a named artist. Brandon James Greer and MortMort tutorials are video-only and were not checked.
- No source for hit-reaction frame counts in HLD, Children of Morta or Eastward.

---

## Q3. 4 vs 8 directions, mirroring, and layered weapons

### Takeaway
- Tibia uses 4 directions for outfits and maps diagonals to east or west. It colours outfits with 4 multiply-tinted mask layers (head, body, legs, feet) and draws addons as extra pattern layers. It has no attack animation at all.
- D2 uses 16 directions for player characters and up to 16 in COF files, with frames per direction set per animation. It is a layered system too, up to 11 layers (body parts and weapon) per COF.
- Slynyrd's 2025 top-down guide draws 8 unique directions and keeps the sword and shield in the correct hand in every view, so no mirroring. It animates the base body first, then adds sword, shield and cape as separate layers.
- Heroes of Hammerwatch stores the direction count per animation in the animation string ("name N"), so an attack can use 8 directions while another animation uses fewer. It can also cap the range of directions.

### Cited findings
- OTClient `Creature::internalDrawOutfit`. `xPattern` is the creature direction. NE and SE draw as East, NW and SW draw as West. `yPattern` is the addon layer. With more than one layer, it multiplies head, body, legs and feet colours over yellow, red, green and blue mask sprites. Idle animation uses 1000 ms / phases per frame. https://github.com/edubart/otclient/blob/master/src/client/creature.cpp#L105-L165
- OTClient walk animation. The foot frame advances every stepDuration / 3 ms, using phases - 1 walking frames. https://github.com/edubart/otclient/blob/master/src/client/creature.cpp#L486-L516
- Tibia 8.6 outfits have 3 frames per direction, 10.x outfits have 8 (OTLand forum reply, community claim). https://otland.net/threads/outfit-disapear-when-moving-with-mount.258128/
- D2 character animations use 16 directions. https://www.d2mods.info/forum/kb/viewarticle?a=265 . COF format: layers 1 to 11, frames per direction 1 to 200, directions 1 to 16. https://github.com/OpenDiablo2/cof
- Slynyrd 8 directions, "all 8 positions offer a unique view of the action". https://www.slynyrd.com/blog/2025/5/23/pixelblog-56-top-down-character-attack-animation . Separate layers for sword, shield, cape; run is "36 unique frames" across directions. https://www.slynyrd.com/blog/2025/10/2/pixelblog-58-top-down-character-animation-part-3
- HoH `AnimString`. Format "anim N [capStart capEnd]". Scene name is the anim name plus a direction index from the facing angle. https://github.com/exp111/HeroesOfHammerwatch/blob/master/assets/scripts/Behaviors/AnimString.as
- CrossCode used a segmented sprite system where parts are positioned by facing angle (fan post, not a dev source). https://photon.uhhoh.com/post/lemmy.uhhoh.com/3700273 . A weekly update says Radical Fish rewrote animation so several animations run on one entity at once. https://www.moddb.com/news/weekly-update-36-time-for-some-changes
- Dead Cells renders 3D models with skeletons to low-res sprites, so direction and gear changes cost a re-render instead of redrawing. https://www.jikguard.com/news/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-dead-cells

### Art cost (arithmetic, not a citation)
One 6-frame attack, per weapon class:

| Setup | Directions drawn | Frames to draw | Notes |
|---|---|---|---|
| 4 dir, mirror E/W | 3 (S, N, E) | 18 | Weapon swaps hands when mirrored. Tibia-style. |
| 4 dir, no mirror | 4 | 24 | |
| 8 dir, mirror | 5 (S, SE, E, NE, N) | 30 | Hand swap visible on diagonals. |
| 8 dir, no mirror | 8 | 48 | Slynyrd 2025. |
| 16 dir (D2) | 16 | 96 | Only viable with a 3D render pipeline. |

With body, weapon and effect on separate layers, each new weapon type costs only the weapon layer frames (the body swing is shared within a weapon class), and recolours cost zero with Tibia-style multiply masks.

### Inferences
- [inf] For Asterion, 4 directions with east-west mirroring for walk and idle, and the same for the body swing, is the cheapest path consistent with Tibia's grid feel. Aimed skills fire in any angle, but the body only needs to face the nearest cardinal. The projectile or cone decal shows the exact angle.
- [inf] If 8 directions are wanted for aimed combat, draw 8 only for the weapon and effect layer (smear arcs), and keep the body at 4. The smear carries the direction; the body pose is mostly hidden behind it at 32 px.
- [inf] Mirroring breaks handedness (sword switches hand). At 32 px with 3 to 4 px weapons, players rarely notice on walk cycles but do notice on shield-plus-sword attack poses. Either accept it or draw E and W separately for attacks only (4 directions, 24 frames).
- [inf] Layer the sprite as body, back gear, weapon, front gear, smear effect. In Godot each is an `AnimatedSprite2D` child sharing one `AnimationPlayer` timeline, so one key track switches direction and frame for all layers.

### Gaps
- No primary direction counts for Albion (3D models), Hammerwatch I (player data files not in the mirror), HLD, Eastward, Children of Morta or CrossCode. These need sprite-sheet inspection.

---

## Q4. Animation cancelling in ARPGs and MMOs

### Takeaway
- Cancelling means ending recovery (or the whole animation) early with another input. In ARPGs it is usually allowed after the hit frame and into a dodge, dash or another skill.
- GW2 calls the post-hit tail "aftercast". Skills that respect aftercast queue behind it. Auto-attack chains often have aftercast that any skill, including itself, can cancel.
- Lost Ark tunes "movement and skill cancellation" timing per patch, so it is a designer-set window per skill, not a free rule.
- LoL lets any new command cancel an attack windup, except in a 33 ms grace tick before it fires. This is "cancel startup freely, lock the action frame".

### Cited findings
- GW2 wiki search snippets. Aftercast is the time after activation when animations still play. A skill used during aftercast that respects it "will be delayed and queued". Single-skill auto-attacks like Long Range Shot have aftercast cancellable by any skill. Patch 2022-06-28 cut Singeing Strike's repeat aftercast by 0.5 s. https://wiki.guildwars2.com/wiki/Aftercast (page returned 500 on fetch; content from search snippets), https://wiki.guildwars2.com/wiki/Game_updates/2022-06-28
- Original Guild Wars: a 2 s spell keeps the caster in place 2.75 s, implying 0.75 s aftercast. Same search, Guild Wars 1 wiki. https://wiki-en.guildwars.com/wiki/Aftercast
- Lost Ark KR balance patch, Feb 2025: "the timing for movement and skill cancellation" made faster. https://maxroll.gg/lost-ark/news/kr-balance-patch-february-2025
- LoL windup is interrupted by any new command, the target dying or leaving range. Grace period of one tick (0.033 s) before completion. One more tick of input lock after firing. https://wiki.leagueoflegends.com/en-us/Basic_attack
- Game Developer "Combat Canceled" describes buffered cancel (store input, fire when the window opens) vs instant cancel (fire on the input frame if the window is open), with per-move cancel windows defined by on/off frames. https://www.gamedeveloper.com/pc/combat-canceled-i-god-of-war-i-action-game-design
- HoH skills use `speed-mul` while the animation plays and `IsActive()` stays true while the animation countdown runs, so movement is slowed, not blocked, during an attack. https://github.com/exp111/HeroesOfHammerwatch/blob/master/assets/scripts/Behaviors/Actors/Skills/ActiveSkill.as
- PoE2 players say pressing a new skill cancels a cast instead of queueing it (note 04).

### Inferences
- [inf] For a server-authoritative MMO, define cancelling on the server as two windows per skill. Before the action frame, a cancel aborts the skill (no damage, refund or short lockout). After the action frame, recovery is visual only and any input ends it on the client at once. The server never needs to know about recovery cancels because damage already applied.
- [inf] That makes recovery cancels free of netcode risk, and they are what makes combat feel responsive. Startup cancels must go to the server and are where PvP fairness matters.
- [inf] The GCD keeps cancelling from becoming a DPS exploit. If damage is gated by the GCD and server swing timer, cancelling recovery only buys movement and responsiveness, not extra hits. This avoids the ESO-style "animation cancel meta" (UESP page blocked, not verified here).
- [inf] Let movement cancel the recovery of auto-attacks but not their wind-up, and let a dodge cancel both. Show a 1-frame "snap" to idle or run, no blend, which reads crisp at 32 px.

### Gaps
- BDO and ESO cancel rules not fetched (UESP 403, no BDO results).
- No measured data on how players perceive cancel windows.

---

## Q5. Cast and channel animations

### Takeaway
- Tibia spells are instant. The caster sprite does not change; the spell is a magic effect at 75 ms per frame (note 01) plus words in chat.
- WoW uses a 1.5 s GCD with casts typically 1.5 to 3 s (note 04 for GCD). Albion casts are short, 0.35 s to 1.3 s, with interrupts as the skill test, and since a 2023 patch some channels allow movement at 50% speed.
- D2 casts are 10 to 16 frames at 25 fps with the release frame near the middle (note 02).
- HoH has no cast bar for players. The castpoint is a short delay inside the animation.

### Cited findings
- Albion. Magic Shock cast 0.5 s to 0.35 s (SteamDB patch notes). Frostbolt (mob) 1.3 s, Avalon Mage Start 1 s (Albion Database). A patch says the caster "can now move while channeling, with 50% reduced movement speed". https://steamdb.info/patchnotes/18608840 , https://www.albiondatabase.com/spells/frostbolt-undead-necromancer-frostbolt , https://devtrackers.gg/albion/p/fc08e921-14-august-2023-beyond-the-veil-patch-12
- D2 casting base frames, Barbarian 14, Paladin 16, action flag 9 for both. https://maxroll.gg/d2/resources/breakpoints-animations
- CrossCode shows a charge animation before battle techs and slows time while charging special attacks (single-player only). https://www.moddb.com/games/crosscode/news/weekly-update-37-special-points-and-javascript-optimizations , https://www.moddb.com/news/crosscode-update-54-new-menu-story-progress-and-more

### Inferences
- [inf] A cast needs three drawn states per direction. A 2 to 3 frame raise (about 150 ms), a 2 to 4 frame looping hold (hands up, 100 to 150 ms per frame, plus a small glow particle on the effect layer), and a 2 frame release that matches the attack's follow-through hold. Total art for 4 mirrored directions is about 3 x 8 = 24 frames, reused by every spell. Spell identity lives on the effect layer.
- [inf] Cast-complete flash. A 1 to 2 frame white or element-tinted flash on the hands at release, synced to the server's "spell fired" event, tells allies and enemies the cast landed. For PvP readability, enemies' hold loops should carry the spell's element colour so they can be read and interrupted.
- [inf] Channel. Keep the hold loop running and add a beam or tether on the effect layer. If movement is allowed (Albion's 50% rule), play the walk cycle on legs and keep the hands-up frame on the upper body. This needs a split body (legs and torso layers) or a dedicated "walk-cast" set.
- [inf] Instant Tibia-style spells need no cast art. A 100 ms one-frame "point" pose is enough to show who cast, which helps in 30-player fights where effects overlap.

### Gaps
- No primary WoW source for cast-animation phase lengths (precast, loop, release). Riot's "Art of Spell Casting" posts returned 404.
- No Albion source on whether casts show a dedicated body animation in the isometric 3D view.

---

## What transfers to Asterion and what does not

Transfers
- Slynyrd's 6-frame swing with fixed 150 ms strike and variable anticipation and hold. Data-driven per weapon: two numbers change.
- HoH's split between the animation and a gameplay `castpoint` and `cooldown`, with a move-speed multiplier during the animation.
- Tibia's 4-direction body with diagonal-to-E/W mapping and multiply-tinted mask layers for recolours.
- Layered weapon and effect sprites over a shared body swing.
- Recovery cancels on the client only, startup cancels judged by the server.

Does not transfer
- D2's 16 directions (needs a 3D render pipeline).
- Global hitstop as a weight cue. Use the attacker's follow-through hold instead.
- CrossCode's time slow while charging (single-player).
- Stretching the swing animation to fill a 2 s auto-attack interval.

---

## Sources
- Slynyrd Pixelblog 9, melee attacks (2018): https://slynyrd.com/blog/2018/9/8/pixelblog-9-melee-attacks
- Slynyrd Pixelblog 56, top-down attack (2025): https://www.slynyrd.com/blog/2025/5/23/pixelblog-56-top-down-character-attack-animation
- Slynyrd Pixelblog 58, top-down animation part 3 (2025): https://www.slynyrd.com/blog/2025/10/2/pixelblog-58-top-down-character-animation-part-3
- Saint11 tutorial index (GIFs only): https://saint11.art/blog/pixel-art-tutorials/
- Heroes of Hammerwatch scripts mirror: https://github.com/exp111/HeroesOfHammerwatch (ActiveSkill.as, MeleeSwing.as, AnimString.as)
- OTClient creature.cpp: https://github.com/edubart/otclient/blob/master/src/client/creature.cpp
- OTLand outfit frames thread: https://otland.net/threads/outfit-disapear-when-moving-with-mount.258128/
- D2 attack speed table: https://theamazonbasin.com/wiki/index.php/Attack_speed
- D2 cast breakpoints: https://maxroll.gg/d2/resources/breakpoints-animations
- D2 16 directions: https://www.d2mods.info/forum/kb/viewarticle?a=265
- OpenDiablo2 COF: https://github.com/OpenDiablo2/cof
- Dead Cells 3D pipeline: https://www.jikguard.com/news/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-dead-cells
- CrossCode updates: https://www.moddb.com/news/weekly-update-36-time-for-some-changes , https://www.moddb.com/games/crosscode/news/weekly-update-37-special-points-and-javascript-optimizations , https://www.moddb.com/news/crosscode-update-54-new-menu-story-progress-and-more
- CrossCode segmented sprites (fan post): https://photon.uhhoh.com/post/lemmy.uhhoh.com/3700273
- GW2 aftercast: https://wiki.guildwars2.com/wiki/Aftercast , https://wiki.guildwars2.com/wiki/Game_updates/2022-06-28
- GW1 aftercast: https://wiki-en.guildwars.com/wiki/Aftercast
- Lost Ark KR patch Feb 2025: https://maxroll.gg/lost-ark/news/kr-balance-patch-february-2025
- LoL basic attack: https://wiki.leagueoflegends.com/en-us/Basic_attack
- Combat Canceled (Game Developer): https://www.gamedeveloper.com/pc/combat-canceled-i-god-of-war-i-action-game-design
- WoW swing timer threads: https://eu.forums.blizzard.com/en/wow/t/tauren-war-stomp-and-melee-autoattack-classic/86971 , https://classic.wowhead.com/forums&topic=111038/swing-timer-gcd-noob-question
- Albion: https://steamdb.info/patchnotes/18608840 , https://www.albiondatabase.com/spells/frostbolt-undead-necromancer-frostbolt , https://devtrackers.gg/albion/p/fc08e921-14-august-2023-beyond-the-veil-patch-12

See it in action
- Slynyrd top-down attack GIFs: https://www.slynyrd.com/blog/2025/5/23/pixelblog-56-top-down-character-attack-animation
- Saint11 TopDownAttack and Impact GIFs: https://saint11.art/blog/pixel-art-tutorials/
- D2 attack frames: https://maxroll.gg/d2/resources/attack-speed
