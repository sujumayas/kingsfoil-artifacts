# Top-down pixel combat juice: hit feedback, targeting and aimed skills for a 2D MMORPG

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #2 of the **Game feel** series, after NPCs and dialog [S2] and eight VFX studies [S1] whose effect recipes it does not repeat. It covers what a player sees, hears and feels when they attack, hit, get hit, miss, dodge, crit, kill and die. Formulas, balance, class design and matchmaking are out of scope.

The combat model is hybrid. Targeted skills (Tibia, WoW) need a selected target and home in, so they cannot miss through aim. Aimed skills (Hammerwatch, MOBAs) go to a point or direction and can miss. Both share one hotbar, so soft-difficulty players lean on targeted skills and skilled players on aimed ones.

The reference is Tibia. A Tibia hit is a coloured number that rises 48 px in 1000 ms, a one-tile effect at 75 ms per frame and, for missiles, a flight of 150 ms times the square root of the distance in tiles [V, S5, S6, S8, S9]. The server decides everything and the client predicts only walking [V, S13]. Most combat craft comes from single-player action games, and much of it breaks when 30 players share a screen. A global freeze stops everyone's world, a stranger's spell shakes your camera, and 30 players' numbers hide the one you care about. Every profile says what transfers to a 32 px server game and what does not.

**Four equal priorities.**
- **Feel and pixel art.** Timing in frames and ms, readability at 32 px, what players praise.
- **MMO problems.** Shared screen, server authority, latency, crowds, PvP fairness and effect spam.
- **Implementation.** Godot 4 (GDScript, web export), state machines, data-driven effects.
- **Runtime cost.** Many numbers, particles, shakes and flashes at once on low-end web. Every cost is measured or labelled as an estimate.

**Targets.**
- Godot 4, web-first, so the **Compatibility renderer** (WebGL 2), plus mobile and desktop.
- Top-down 3/4 pixel art on 32x32 tiles for the Tibia-like MMORPG **Asterion Online**, server-authoritative, PvE and PvP, many players on one screen.
- Phones and old laptops.

**Sources.** Eleven research notes, our **Combat Juice Sandbox** [S3] and our juice benchmark [S4]. Most hard numbers come from source code, chiefly OTClient, TFS and Canary for Tibia, RuneLite for OSRS, rAthena, the Heroes of Hammerwatch scripts, Celeste, jsfxr and Phantom Camera. Note 11 re-checked the disputed numbers and this report follows its verdicts. The benchmark ran on an Apple M4 Pro in Chromium 153. **No phone and no Godot build were measured.**

---

## 1. Executive summary

**Feel and pixel art.**

1. **Weight comes from holds, not from more frames.** Slynyrd's 6-frame swing keeps the strike at three 50 ms frames and varies only the anticipation (100 to 250 ms) and the hold (100 to 300 ms), so a sword takes 400 ms and a hammer 800 ms [V, S80]. The hold does much of hitstop's work and is safe on a shared screen [I].
2. **Hitstop must be per entity and visual only.** Fighting games freeze 9 to 14 frames [V, S87], Celeste 3 to 6 [V, S78], and Sakurai kept Smash's short because a third player can act during it [V, S85]. Smash Ultimate ramps long hitlag toward x0.75 with more players [V, S86]. Asterion freezes only the attacker's and target's sprites, 3 frames normal and 6 on a crit, when the local player is involved [I].
3. **Cheap local feedback beats time tricks.** Heroes of Hammerwatch, a 4-player online game, has no hitstop and no generic knockback; a hit is a 50% red overlay fading over 100 ms, a hit effect and a number [V, S57].
4. **Numbers stay readable with merging and caps.** OTClient sums same-colour numbers on one tile inside 400 ms and pushes the next one 12 px down [V, S6, S7]. OSRS keeps at most 4 hitsplats per actor for 1.4 s [V, S38, S39]. Diablo III turns a number orange only when it beats the last orange one, with a benchmark that decays 3% per second [V, S138].

**MMO problems.**

5. **Predict the cosmetic start, confirm the outcome.** Your wind-up, swing sound and cast bar play at once; numbers, target flashes, knockback and death wait for the server [V, S147; I].
6. **Favour the target for aimed skills.** Shooters rewind targets up to 0.2 or 1 s [V, S149, S150], which breaks dodging. Resolve skillshots against current server positions [I], and resolve ground AoEs when the marker ends, as FFXIV does [V, S131, S132].
7. **Effects come in tiers, with hostile effects always full.** WoW's Spell Density (11.2) and FFXIV's battle effects split own, party and others [V, S152, S154]. Tibia's server tags each sound OWN, OTHERS, CREATURES or GLOBAL per spectator [V, S31, S32].
8. **PvP changes feedback in fixed places.** WoW's crowd control goes 100%, 50%, immune with a 20 s reset, and knockbacks go immune for 10 s [V, S121]. TFS halves player-on-player damage [V, S23]. rAthena walk-delays hit players 20% and monsters 100% [V, S48].

**Implementation.**

9. **One queue slot, last press wins.** WoW accepts the next spell up to 400 ms early [V, S104, S117]; Tibia rejects early presses with "You are exhausted" [V, S30].
10. **Tap to target, drag to aim, on one button.** Brawl Stars and Wild Rift fire a tap at the auto-target and a drag as a skillshot [V, S112, S113]. A tap on an aimed skill aims at the target's tile with no lead, so it can still miss [I].
11. **Godot has the parts.** Phantom Camera implements trauma squared shake (MIT, 3,657 stars) [V, S171, S172]. Godot 4.4 added `instance uniform` to canvas_item shaders on Compatibility, so a hit flash keeps one shared material [V, S176]. `Engine.time_scale` scales every timer and must not drive hitstop [V, S179].

**Runtime cost.**

12. **Juice is cheap if it batches.** On the M4 GPU in WebGL2, 1000 numbers cost 0.25 ms per frame, 10,000 particles 0.29 ms and 100 flashing sprites 0.21 ms; shake is free [V, S4].
13. **Aggregation helps everywhere.** Folding about 10 hits into one number per target cut Canvas2D cost from 13.18 to 4.18 ms under a 6x CPU throttle and from 41.9 to 5.77 ms in software GL [V, S4].

**Recommendation for Asterion** [I]. The server owns hits on a 100 ms step with per-entity attack events. Targeted hits apply at cast end with an impact delay; aimed hits test current positions, never rewound. The client predicts only its own wind-ups. A swing with a hold, 3 to 8 frames of per-entity hitstop for hits involving you, a 100 ms flash, cosmetic recoil, trauma squared shake on your own camera, Tibia-style numbers with a 400 ms merge and others dimmed, a 400 ms queue, tap or drag on every skill, effect tiers and a 16-voice pool. §7 has the layers and preset table, §8 the Sandbox.

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: code, docs, wiki or article, or our own measurement [S4]. "[V, vendor]" and "[V, self-reported]" mark figures reported by their own authors. |
| **[I]** | Author inference or design proposal. Untested unless it says "Sandbox", and then tested only in our JavaScript prototype. |
| **[U]** | Unverified: memory, a search snippet, a single secondary source, or a page that could not be fetched. Treat it as a lead. |
| **[K]** | Textbook or canonical knowledge (release years, frame rates). |

- [S#] refers to §14. "[I, note 0X]" is an inference made by the researcher in that note.
- Ratings (1 to 5) are author judgement, in this order: **Impact · Clarity · MMO fit · Fairness · Speed**.
- **Impact** is how much weight and satisfaction the technique adds to a hit. **Clarity** is how fast a player reads what happened and acts. **MMO fit** is how it holds up with many players on one screen, a server and latency. **Fairness** is whether it keeps outcomes honest for both sides, above all in PvP and under ping. **Speed** is runtime cost on low-end web.
- **Speed follows the measurements** [S4]. 5 is server logic or batched quads; 4 needs care at crowd scale; 1 to 3 means per-frame compositing or unbatched draws.
- **Measured numbers are desktop numbers.** Trust ratios over milliseconds.
- Frames are 60 fps (16.7 ms) unless stated; Diablo II runs at 25 fps [V, S69]. Sandbox numbers are illustrative.

---

## 3. Generations: a timeline

**Gen 1: tiles, ticks and numbers (1997–2003)**
- **1997** Tibia and Ultima Online launch with server swings; UO counts 0.25 s ticks [K; V, S52]. **2000** Diablo II times casts in 25 fps frames [K; V, S69].
- **2001** RuneScape's 600 ms tick [K; V, S40]. **2002** Ragnarok sends motion times in damage packets [K; V, S47]. **2003** MapleStory's 2000 ms grey pulse [K; V, S49].

**Gen 2: queues, tab and fighting-game freeze (2004–2012)**
- **2004** WoW launches with a 1.5 s global cooldown [K; V, S118]. **Dec 2006** Patch 2.0.1 protects Tab targeting [V, S103].
- **2006** Claypool and Claypool put RPG latency tolerance near 500 ms [V, S100]. **2010** Sonic Hurricane tallies 9, 11 and 13 frames of freeze [V, S87].
- **2012** "Juice it or lose it" [V, S94].

**Gen 3: screenshake, trauma and lockstep (2013–2017)**
- **2013** Nijman's "The art of screenshake" [V, S91]; WoW 5.4.0 makes knockbacks immune after the first [V, S121].
- **2015** Sakurai's hitstop column; Path of Exile ships Lockstep [V, S85, S143]. **Jan 2016** Diablo III's orange big-hit rule [V, S138].
- **2016** Eiserloh's trauma model [V, S93]. **2017** Overwatch's predicted abilities at GDC [V, S145]; WoW 7.2 rewrites Tab [V, S105].

**Gen 4: tap, drag and density (2018–2024)**
- **2018** Heroes of Hammerwatch's positional shake [K; V, S58]; Smash Ultimate's player-count hitlag factor [K; V, S86].
- **2020** Kao finds no juice and extreme juice both hurt [V, S95]. **Mar 2021** Riot's Clarity in League [V, S130]; **2021** Classic cuts batching to 10 ms [V, S119].
- **Oct 2022** WoW Action Targeting [V, S106]. **Oct 2024** New World's PvP lock changes [V, S109]. **Dec 2024** Godot merges 2D instance uniforms [V, S176].

**Gen 5: per-viewer rules and measured costs (2025–2026)**
- **May 2025** Slynyrd's 6-frame top-down attack [V, S80]. **Jul 2025** WoW announces Spell Density [V, S153].
- **Jan 2026** WoW 12.0.0 DR immunity after 2 applications [V, S121]. **Aug 2026** WoW 12.1.0 sets a 20 s reset [V, S121].
- **Oct 2026** Phantom Camera v0.11.0.4 [V, S171]. **Nov 2026** Our juice benchmark [V, S4].

---
## 4. Technique profiles

There are eight families:

- **A.** Attack animation
- **B.** Impact feedback and camera
- **C.** Combat text
- **D.** Targeting
- **E.** Telegraphs, aiming and misses
- **F.** Netcode feel and crowds
- **G.** Action queues and PvP
- **H.** Audio, crits, kills and death

Each profile ends with ratings for **Impact · Clarity · MMO fit · Fairness · Speed** (1 = poor, 5 = excellent; author judgement). A to C are what a hit looks like, D and E how a player chooses and aims, F and G what the server and other players change, and H how it sounds and ends. Measured figures come from our benchmark [S4].

### Family A: Attack animation

### A1. Three-phase swing: anticipation, strike, follow-through hold

*In plain words.* A wind-up, a fast strike and a held end pose. Heavy weapons feel heavy because the wind-up and the hold last longer, not because they have more frames.

*How it works (technical).*
- Slynyrd's 6-frame top-down attack, ms per frame [V, S80]. Sword 100, 50, 50, 50, 100, 50 (400 ms). Spear 200, 50, 50, 50, 150, 50. Hammer 250, 50, 50, 50, 300, 100 (800 ms). The follow-through moves "1 more pixel" into the target.
- The 150 ms strike is the same for every weapon. Heroes of Hammerwatch sweeps its melee rays over 150 ms too [V, S63].
- Diablo II lands melee on frame 6 to 11 of a 14 to 19 frame swing at 25 fps, 240 to 440 ms of wind-up [V, S70].
- Map to the server [I]. The client plays anticipation at once, the first strike frame is the action frame, and spark, flash and number land on the hold.

*Cost / performance.* Six frames per direction and weapon class; timing is two numbers of data per weapon.

*Games that used it.*
- Slynyrd Pixelblog 56: https://www.slynyrd.com/blog/2025/5/23/pixelblog-56-top-down-character-attack-animation

*How it feels.* Snappy for a sword, solid for a hammer. "Too much anticipation will give a nasty feeling of input lag" [V, S79], so anticipation above about 250 ms needs a cast bar or decal [I, note 10].

*Risks.* Long auto-attack wind-ups read as lag at 150 ms ping. Server and art timing drift unless both read one data file.

*Ratings 1–5 (author judgement):* Impact 5 · Clarity 4 · MMO fit 5 · Fairness 4 · Speed 5

### A2. Smear frames, arcs and a hitbox that sweeps with the smear

*In plain words.* One stretched frame shows the blade's path, and the hit area follows that path instead of popping in on one frame.

*How it works (technical).*
- Smears "should always be few and fast", often "a single smear frame" [V, S79]. They sit between anticipation and follow-through only; the follow-through frame is drawn clean [V, S80].
- A sword covers about 90 degrees, and an elongated arm at full extension adds reach [V, S79].
- HoH `MeleeSwing` sweeps 4 rays over a 45 degree arc in 150 ms [V, S63].
- At 32 px, one drawn smear per direction beats a runtime ribbon, which breaks the pixel grid when scaled [I, note 10].

*Cost / performance.* One or two frames per direction, shareable on the effect layer across bodies (A3).

*Games that used it.*
- Slynyrd Pixelblog 9: https://slynyrd.com/blog/2018/9/8/pixelblog-9-melee-attacks

*How it feels.* The smear says "fast" and the clean hold says "contact". Without it a 3-frame swing at 32 px looks like a pose change.

*Risks.* Art multiplies by direction count. A swept hitbox wider than the drawn smear breaks Riot's rule that hitboxes match effects [V, S130].

*Ratings 1–5 (author judgement):* Impact 4 · Clarity 4 · MMO fit 5 · Fairness 4 · Speed 5

### A3. Directions and layers: 4 or 8, mirroring, body, weapon and effect sprites

*In plain words.* Draw the body in 4 directions and let the weapon and effect layers carry the exact angle. Recolours and new weapons then cost a fraction of the art.

*How it works (technical).*
- Tibia maps diagonals to East or West and tints outfits over 4 mask colours; outfits have no attack animation [V, S10].
- Diablo II draws 16 directions and up to 11 layers per COF [V, S71, S72]. Slynyrd draws 8 unmirrored directions with body, sword, shield and cape on separate layers [V, S80, S81]. HoH stores a direction count per animation [V, S64].
- One 6-frame attack costs 18 frames at 4 directions mirrored, 24 unmirrored, 30 at 8 mirrored, 48 unmirrored and 96 at 16 [I, arithmetic].

*Cost / performance.* One sprite draw per layer per entity. Sibling `AnimatedSprite2D` layers on one `AnimationPlayer` switch together [I, note 10].

*Games that used it.*
- Tibia outfit drawing: https://github.com/edubart/otclient/blob/master/src/client/creature.cpp

*How it feels.* At 32 px the smear hides the body, so 4 body directions with 8 smears read as 8 [I, note 10].

*Risks.* Layers multiply draws in a crowd. Mirroring swaps the sword hand, which shows on shield-and-sword attacks.

*Ratings 1–5 (author judgement):* Impact 3 · Clarity 4 · MMO fit 5 · Fairness 5 · Speed 4

### A4. Auto-attack rhythm: swing on the hit, combat idle in between

*In plain words.* Play the short swing when the hit happens and hold a combat pose the rest of the interval. Never stretch a 400 ms swing over a 2 s timer.

*How it works (technical).*
- Tibia swings every 2000 ms in every shipped vocation (code default 1500), scheduled per player with a 50 ms minimum tick [V, S24, S16, S20].
- OSRS weapons take 4 to 7 ticks of 600 ms; all combat spells take 5 [V, S42]. UO swings in 0.25 s ticks with a 1.25 s floor [V, S52].
- The client knows the period, so it starts anticipation on the expected time and snaps to the strike when the packet arrives; 100 ms of anticipation covers a 50 to 100 ms ping [I, note 10].

*Cost / performance.* One server timer per attacker.

*Games that used it.*
- Tibia swing timer (TFS): https://github.com/otland/forgottenserver/blob/master/src/player.cpp

*How it feels.* A 2 s beat is calm and hides 100 to 200 ms of delay [I, note 01]. Action-game players call it slow.

*Risks.* A late packet leaves the wind-up hanging. Cap the hold at 150 ms, then play the strike without a number [I].

*Ratings 1–5 (author judgement):* Impact 3 · Clarity 5 · MMO fit 5 · Fairness 5 · Speed 5

### A5. Cancelling: free recovery cancels, server-judged startup cancels

*In plain words.* After the hit lands, any input ends the animation at once. Before the hit, a cancel is a real choice the server must approve.

*How it works (technical).*
- League cancels a windup on any command except in a 33 ms grace tick before it fires [V, S125]. Dota calls the leftover "backswing" and lets commands cut it [V, S126].
- GW2's "aftercast" queues skills that respect it, and many auto-attack aftercasts can be cancelled [U, S123]. Lost Ark tunes cancel timing per patch [V, S124].
- Two windows [I, note 10]. Before the action frame a cancel goes to the server. After it, recovery is visual and ends locally, because damage already applied. The GCD stops this from adding damage.

*Cost / performance.* One message for a startup cancel; recovery cancels cost nothing.

*Games that used it.*
- League of Legends basic attack: https://wiki.leagueoflegends.com/en-us/Basic_attack

*How it feels.* Recovery cancels make combat responsive. A one-frame snap to idle reads crisp at 32 px [I, note 10].

*Risks.* Startup cancels under latency let a laggy player bait interrupts. Without a GCD gate, an animation-cancel meta appears [U, note 10].

*Ratings 1–5 (author judgement):* Impact 3 · Clarity 4 · MMO fit 4 · Fairness 4 · Speed 5

### A6. Casts and channels: raise, hold loop, release on the castpoint

*In plain words.* Hands go up, a loop plays while the spell charges, and a release matches the moment it fires. Every spell shares the body frames and shows its identity on the effect layer.

*How it works (technical).*
- Diablo II casts are 10 to 16 frames at 25 fps, releasing near the middle [V, S69].
- HoH splits animation from gameplay with `castpoint` (ms before the effect) and `cooldown` (default 1000 ms) [V, S62].
- Albion cut Magic Shock from 0.5 to 0.35 s to work as an interrupt [V, S54] and lets some channels move at 50% speed [V, S55]. Tibia outfits have no cast pose; spells are effects only [V, S10].
- Proposal [I, note 10]. Raise about 150 ms, a hold loop at 100 to 150 ms per frame, a 2-frame release; about 24 frames for 4 mirrored directions. Enemy loops carry the element colour.

*Cost / performance.* One shared set of body frames and a glow per cast.

*Games that used it.*
- Diablo II cast breakpoints: https://maxroll.gg/d2/resources/breakpoints-animations

*How it feels.* A release flash on the server's "fired" event tells everyone the cast landed [I, note 10].

*Risks.* Moving casts need split legs and torso layers. Long loops become PvP interrupt bait, which is a design choice.

*Ratings 1–5 (author judgement):* Impact 4 · Clarity 5 · MMO fit 5 · Fairness 4 · Speed 5

### Family B: Impact feedback and camera

### B1. Per-entity hitstop, the follow-through hold and the hit slow

*In plain words.* On contact, only the attacker's and target's sprites freeze for a few frames, and the target shakes. Nothing else stops and the server never pauses. A held end pose or a brief slow adds weight without a freeze.

*How it works (technical).*
- Fighting games freeze about 9, 11 and 13 frames for light, medium and heavy, 8 for SFIV projectiles where only the victim stops [V, S87].
- Smash Ultimate is `(0.65d + 6)` frames before multipliers, cap 30. Its player-count factor acts only above 10 frames and ramps toward 0.75 as hitlag nears 30, so an 8-player 20-frame hit gets 0.875 [V, S86].
- Sakurai shook the victim's sprite but not its hurtbox and kept hitstop short because a third player can act during it [V, S85]. Celeste freezes 50 and 100 ms [V, S78].
- Holds of 100 to 300 ms come with the swing (A1) [V, S80]. A Hades-format mod slows the sim to 10% for 40 ms, then lerps back over 30 ms [U, S77].
- Asterion [I]. Freeze visual children by wall clock, only when you are attacker or target. Normal 3 frames (50 ms), heavy 5, crit 6, kill 8, cap 8 (133 ms). Others' hits get 0.

*Cost / performance.* An `AnimationPlayer` pause and a flag. `Engine.time_scale` scales every Timer and delta and drifts a networked client [V, S179]; Whumpkit Lite uses it [V, S174].

*Games that used it.*
- Super Smash Bros. Ultimate hitlag: https://www.ssbwiki.com/Hitlag

*How it feels.* 5,000 Steam comments tie hitstop, sound and camera most closely to impact feel [V, S98], and players pushed back when Monster Hunter Wilds cut it [V, S90].

*Risks.* The sprite jumps to its server position after a long freeze. A global freeze is impossible with other players on screen [I].

*Ratings 1–5 (author judgement):* Impact 5 · Clarity 4 · MMO fit 4 · Fairness 4 · Speed 5

### B2. Hit flash: white frame, tint overlay and invulnerable pulse

*In plain words.* The struck sprite flashes white or red for a tenth of a second. Another colour means "immune", and a slow pulse means "cannot be hurt now".

*How it works (technical).*
- HoH's overlay `vec4(1, 0, 0, 0.5 * m_dmgColor)` fades from 50% red to nothing over 100 ms; an immortal target flashes purple with its own text and sound [V, S57].
- MapleStory (fan client) pulses an invulnerable player between 0.4 and 0.9 brightness for 2000 ms [V, S49].
- Godot 4.4 added `instance uniform` to canvas_item shaders, on Compatibility too (PR #99230), so one shared material holds a per-sprite flash [V, S176, S177]. Batching with it was not measured.
- Xbox fails more than about 3 flashes per second over about 20% of the screen, with a lower bar for saturated red [V, S102].
- Asterion [I]. 2 frames full white, a 4-frame fade, 100 ms total; purple for immune.

*Cost / performance.* 100 flashing sprites cost 0.75 ms pre-baked against 0.74 for none, and 16.0 ms with per-frame `source-atop` (79.6 throttled). In WebGL2 an instance attribute costs 0.21 ms against 0.20 [V, S4].

*Games that used it.*
- Heroes of Hammerwatch hit tint: https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/Behaviors/Actors/Enemies/CompositeActorBehavior.as

*How it feels.* The clearest "I hit it" at 32 px. A separate immune colour saves wasted cooldowns.

*Risks.* Thirty players flashing white can approach the limits. Tint others' hits and cap full-white flashes [I, note 03].

*Ratings 1–5 (author judgement):* Impact 4 · Clarity 5 · MMO fit 5 · Fairness 5 · Speed 5

### B3. Knockback and squash: server tiles, cosmetic pixels

*In plain words.* Real knockback moves a unit by whole tiles and the server decides it. Cosmetic recoil nudges the sprite a few pixels and springs back; a squash shows the blow.

*How it works (technical).*
- HoH comments out knockback in its generic damage path and keeps it in specific skills [V, S57]. Nuclear Throne gives every projectile a `force` [V, S65].
- MapleStory (fan client) knocks back only if the stance roll fails, with a small hop [V, S50].
- Squash of 1 to 2 px as a 0.9 to 1.1 scale tween in code costs no art [I, note 10].
- Asterion [I]. Recoil 4 px over 3 frames out and 3 back, 8 px on crits. Server knockback 1 tile over 150 ms; players 1 tile max with immunity after (G2).

*Cost / performance.* A tween on a visual child; server knockback adds a move and a path check.

*Games that used it.*
- Nuclear Throne projectile force: https://yal.cc/r/17/ntt/objects

*How it feels.* Recoil gives direction and mass. Real knockback in PvP is crowd control and feels like lost control.

*Risks.* Recoil that drifts off the tile makes click targets lie. Tile knockback fights pathing.

*Ratings 1–5 (author judgement):* Impact 4 · Clarity 4 · MMO fit 4 · Fairness 3 · Speed 5

### B4. Hit sparks and impact effects at 75 ms per frame

*In plain words.* A small flipbook plays on the hit tile. Its colour says the damage type, and some hits leave a mark on the floor.

*How it works (technical).*
- Tibia runs magic effects at 75 ms per frame [V, S9, S14]. The server picks effect and colour by type and race, for example red blood with a splash item, green slime, orange fire [V, S17, S18].
- HoH plays a per-unit `hit-fx` from data [V, S57]. Nijman lists impact effects and permanence among his tweaks [V, S92].
- Godot particles draw a system in one call. Compatibility has no pipeline precompilation, so show each spark once while loading [V, S181, S182].

*Cost / performance.* 2000 particles cost 1.02 ms with `fillRect`, 2.74 ms with `drawImage` and 0.22 ms in WebGL2; 10,000 cost 0.29 ms in WebGL2 [V, S4]. A 30-player fight is about 50 to 400 live sparks [I, note 09].

*Games that used it.*
- Tibia magic effects: https://github.com/edubart/otclient/blob/master/src/client/effect.cpp

*How it feels.* Number, effect and floor mark give three readable cues per hit at 32 px [I, note 01].

*Risks.* First-use hitches on web. Floor marks clutter spawns unless capped and faded.

*Ratings 1–5 (author judgement):* Impact 4 · Clarity 4 · MMO fit 5 · Fairness 5 · Speed 4

### B5. Hit reactions above a damage threshold

*In plain words.* Small hits only flash. A hit big enough to matter plays a short flinch, and players flinch less than monsters.

*How it works (technical).*
- Diablo II plays no reaction below max life divided by 8, 16, 32 or 64 by hit class, rolls between 1x and 4x, and always reacts above 4x; recovery is 3 to 13 frames at 25 fps [V, S69].
- Ragnarok locks a hit player's walking for 20% of the damage animation and a monster's for 100%, plus 200 ms per extra hit [V, S48].
- Nuclear Throne plays a 3-frame hurt sprite [V, S65].
- Asterion [I]. A 2-frame flinch (150 ms) when damage is at least 1/16 of max HP or on crits. Deterministic, so clients agree. Cosmetic on players.

*Cost / performance.* One comparison per hit and two frames per direction.

*Games that used it.*
- Diablo II hit recovery: https://maxroll.gg/d2/resources/breakpoints-animations

*How it feels.* A mob that flinches on every hit from 30 players vibrates. The threshold keeps flinches meaningful [I].

*Risks.* Random rolls make clients disagree unless the server sends the result. Movement lock on players is crowd control (G2).

*Ratings 1–5 (author judgement):* Impact 4 · Clarity 4 · MMO fit 5 · Fairness 5 · Speed 5

### B6. Trauma shake and camera kick, for your own hits only

*In plain words.* Every hit you deal or take adds "trauma". The camera shakes by trauma squared and calms down on its own. Strangers' hits never move your camera.

*How it works (technical).*
- Eiserloh [V, S93]. Trauma in 0 to 1, events add 0.2 or 0.5, linear decay, shake trauma² or trauma³, offsets from smooth noise. Trauma 0.3, 0.6 and 0.9 give 3%, 22% and 73% cubed.
- Phantom Camera uses `pow(trauma, 2)` times noise times amplitude (default 10), and `noise_emitter_layer` sends a shake only to cameras on that layer [V, S172, S173].
- Nijman's pistol kicks the camera 6 px back from the aim, a secondary quote [U, S66].
- Asterion [I]. Max 6 px at 32 px tiles, whole pixels, vertical half, no rotation, decay 1.5 per second. Hit taken +0.2 plus 0.3 times damage over max HP; your crit +0.3 and a 2 px kick.

*Cost / performance.* Free. Every shake method landed within 0.05 ms of none [V, S4].

*Games that used it.*
- Eiserloh slides: http://www.mathforgameprogrammers.com/gdc2016/GDC2016_Eiserloh_Squirrel_JuicingYourCameras.pdf

*How it feels.* Chip damage stays still and big hits dominate. A Kyushu study found strong shake raised agency while weak shake equalled none [V, S99].

*Risks.* Motion sickness. Xbox asks for an off option [V, S101]; ship a 0 to 100% slider.

*Ratings 1–5 (author judgement):* Impact 5 · Clarity 3 · MMO fit 4 · Fairness 5 · Speed 5

### B7. Positional shake with distance falloff

*In plain words.* A boss slam shakes the cameras of players near it and fades with distance. A player across the screen feels nothing.

*How it works (technical).*
- HoH `ShakeScreen(tm, amount, pos, range)` scales by the `g_screenshake` setting, sums active shakes, decays each linearly, and multiplies by `(range - distance) / range` [V, S58, S60]. Vertical amplitude is half.
- `ScreenShaker` runs on local and network paths, so every client shakes by its own distance; `range = -1` is global [V, S59].
- Asterion [I]. Feed the falloff into B6's trauma. Slam 0.6 at the centre, 6-tile range.

*Cost / performance.* One distance per event per client.

*Games that used it.*
- Heroes of Hammerwatch `ScreenShake.as`: https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/Utils/ScreenShake.as

*How it feels.* The slam you stood next to rattles you; the healer at the back keeps a steady view.

*Risks.* A global shake moves everyone's camera for one player's spell. Many slams pin trauma at the cap.

*Ratings 1–5 (author judgement):* Impact 4 · Clarity 4 · MMO fit 5 · Fairness 5 · Speed 5

### Family C: Combat text

### C1. Tibia animated text: 1000 ms, 48 px, merge inside 400 ms

*In plain words.* A coloured number rises a tile and a half in one second and fades at the end. Two hits of one colour on one tile within 0.4 s add into one number.

*How it works (technical).*
- Life 1000 ms, removed by a scheduled event [V, S5, S6]. Rise `8 + (-48 * t) / tf`, linear, from 8 px below the anchor [V, S6].
- Full opacity until 833 ms (`tf / 1.2`), then a linear fade [V, S6].
- Merge when colour and font match, both are numeric and the old one is under 400 ms old (`1000 / 2.5`); the values add and the old age stays [V, S6].
- Otherwise a number under 250 ms old pushes the new one `12 - 48 * t / T` px lower, so they sit 12 px apart [V, S7, S14].

*Cost / performance.* 1000 live numbers by glyph blits cost 3.38 ms on the M4, 13.18 ms throttled and 41.9 ms in SwiftShader; one instanced WebGL2 draw costs 0.25, 1.07 and 37.7 ms [V, S4].

*Games that used it.*
- Tibia `animatedtext.cpp`: https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp

*How it feels.* Slow and readable. Under a pile-on, same-element hits become one growing number [I, note 01].

*Risks.* Everyone sees every number, which is noise at 30 players (C4).

*Ratings 1–5 (author judgement):* Impact 3 · Clarity 5 · MMO fit 5 · Fairness 5 · Speed 4

### C2. Aggregation and caps per target

*In plain words.* Many small hits on one target inside a short window show as one number that counts up, and no target carries more than four numbers.

*How it works (technical).*
- OSRS keeps 4 hitsplat slots per actor for 70 cycles of 20 ms (1.4 s); a fifth replaces the oldest or the smallest [V, S38, S39, S37].
- Asterion merges per target, per tier and per damage type inside 400 ms, keeps crits apart, caps 4 per target and 64 on screen, dropping the oldest [I, note 05].
- The server merges damage on one target within one step into one message [I, note 06]. Space confirmed numbers about 50 ms apart, because WebSocket delivers in clumps [I, note 06; V, S157].
- Cache only strings that stay fixed for their life [V, S4].

*Cost / performance.* Aggregating 1000 live numbers to 100 cut glyph-blit cost from 3.38 to 0.94 ms on the M4, 13.18 to 4.18 ms throttled and 41.9 to 5.77 ms in software. Cached running totals did worse, 43.2 ms throttled, at an 87 to 93% hit rate [V, S4].

*Games that used it.*
- Old School RuneScape hitsplats: https://oldschool.runescape.wiki/w/Hitsplat

*How it feels.* A number that ticks up under a flurry reads as momentum. Ten overlapping labels read as noise.

*Risks.* Merging across types loses information. A window longer than the swing fuses separate swings.

*Ratings 1–5 (author judgement):* Impact 3 · Clarity 5 · MMO fit 5 · Fairness 5 · Speed 5

### C3. Crit emphasis and Diablo III's big-hit rule

*In plain words.* A crit gets its own colour, a bigger number and a sound. Diablo III adds a rule so "big" stays rare late in the game.

*How it works (technical).*
- Diablo III 2.4.0 turns a number over 10,000 orange only if it beats the last orange one; that benchmark decays 3% per second, calibrates on the first 10 and resets after 10 s idle [V, S138].
- Diablo IV uses white, yellow crit, cyan Overpower and orange for both [V, S139]. MapleStory (fan client) has a separate crit digit set [V, S51].
- Tibia sends a crit as a magic effect to all spectators; the number is plain [V, S31].
- Asterion [I]. Larger yellow digits, a 2x integer pop for 3 frames, 1200 ms life, never merged.

*Cost / performance.* One font atlas and one float per player.

*Games that used it.*
- Diablo III number changes: https://blizzardwatch.com/2016/01/25/diablo-damage-numbers-changed/

*How it feels.* A small jolt without screen-wide noise.

*Risks.* Non-integer scale blurs pixel fonts. Path of Exile 2's director wants to avoid runaway numbers [V, S140].

*Ratings 1–5 (author judgement):* Impact 5 · Clarity 4 · MMO fit 4 · Fairness 5 · Speed 5

### C4. Who sees which numbers, and how misses read

*In plain words.* Your numbers and the ones on you show in full. Party numbers are dim and strangers' are off by default. Misses are small grey words for the two players involved.

*How it works (technical).*
- Vampire Survivors toggles numbers, flashes and shake [V, S73]; Hades II and Diablo IV have number toggles [V, S76, S139]. HoH hides a number type when its colour var is empty and culls off-screen spawns [V, S61].
- Tibia shows no "MISS"; a shield block is a grey puff and 0 damage sends no number [V, S17]. OSRS shows a blue 0 [V, S41].
- Asterion [I, note 05]. Own and incoming full, party at 50% alpha, others off. "Miss", "Block" and "Immune" in grey, smaller, no rise.

*Cost / performance.* Client filtering is free and needs no reconnect [I, note 06]. Players report turning numbers off cures late-run lag in Vampire Survivors [U, S74, S75].

*Games that used it.*
- Vampire Survivors accessibility: https://www.familygamingdatabase.com/accessibility/Vampire+Survivors

*How it feels.* In a crowd the number that matters is yours.

*Risks.* Healers and leaders lose information if one switch hides everything; give per-tier settings.

*Ratings 1–5 (author judgement):* Impact 2 · Clarity 5 · MMO fit 5 · Fairness 5 · Speed 5

### Family D: Targeting

### D1. Click targeting and the battle list (Tibia)

*In plain words.* Click a creature or a row in the list of everything nearby. The list's order and filters are on screen, so "next target" is never a mystery.

*How it works (technical).*
- Canary takes one `parseAttack(creatureId)` packet; secure mode blocks attacks on unmarked players [V, S34].
- OTClient's battle list sorts by display time, distance, hit points or name and filters players, monsters, summons, party and more [V, S15]. "Attack next target" walks that order [V, S35].
- The target gets a 2 px red outline on the tile; whoever hits you gets a black square for 1000 ms [V, S10, S12, S16].
- Requests carry a sequence number so stale cancels are ignored [V, S11].

*Cost / performance.* One packet per change; the attacker square is 7 bytes [V, S22].

*Games that used it.*
- Tibia battle list: https://github.com/mehah/otclient/blob/main/modules/game_battle/battle.lua

*How it feels.* Predictable and calm. The black square answers "who is hitting me" in a PvP crowd [I, note 01].

*Risks.* Clicking a moving 32 px sprite on a phone is hard.

*Ratings 1–5 (author judgement):* Impact 2 · Clarity 5 · MMO fit 5 · Fairness 5 · Speed 5

### D2. Tab cycling rules

*In plain words.* Tab picks the next enemy by a fixed rule. In combat it cycles only what is fighting you, and in PvP it puts players first.

*How it works (technical).*
- WoW 7.2 rewrote Tab to skip targets out of combat with you or unseen by you and the camera [V, S105, S104]. `TargetPriorityCombatLock = 1`, `TargetPriorityPvp = 1`, and `TargetEnemyAttacker = 1` makes an attacker your target if you have none [V, S104].
- FFXIV cycles nearest to farthest with a filter per weapon state [V, S111]. Tibia's cycle is the battle list (D1).
- Asterion [I, note 11]. Tab walks the battle list as sorted, within the screen, combat-locked, players first in PvP, summons skipped.

*Cost / performance.* A sort of a few dozen visible units per press.

*Games that used it.*
- World of Warcraft CVars: https://warcraft.wiki.gg/wiki/Console_variables/Complete_list

*How it feels.* Good Tab feels like mind reading. Cycling through pets is one of the oldest complaints [U, S107].

*Risks.* Hidden rules feel random. Showing the order as a list fixes that.

*Ratings 1–5 (author judgement):* Impact 2 · Clarity 4 · MMO fit 5 · Fairness 4 · Speed 5

### D3. Soft target, action targeting and target lock

*In plain words.* The game picks a target from where you face or aim on each cast. It helps new players, and in PvP it can turn aimed skills into sure hits.

*How it works (technical).*
- WoW Action Targeting (2022) picks from facing [V, S106]. Verified defaults are `SoftTargetEnemy = 1` (gamepad), `SoftTargetEnemyArc = 2` (anywhere in the tab area, corrected from a forum's 1) and range 45 yards [V, S104].
- GW2 autotargets in the camera's direction and can snap ground circles to the target [V, S108].
- New World's PvP lock never headshots, turns slower and no longer auto-switches after a kill [V, S109, S110].
- Asterion [I]. A cursor-nearest soft target. Aim snap bends an aimed skill's start direction by at most 15 degrees in PvE and 0 in PvP, and never curves a projectile.

*Cost / performance.* A cone query per cast.

*Games that used it.*
- Guild Wars 2 options: https://wiki.guildwars2.com/wiki/Options

*How it feels.* Fast in PvE. In PvP a lock that guaranteed hits needed nerfs [V, S109].

*Risks.* A homing soft lock breaks "aimed skills can miss" [I, note 04]. Facing is hard to read at 32 px.

*Ratings 1–5 (author judgement):* Impact 2 · Clarity 3 · MMO fit 4 · Fairness 3 · Speed 5

### D4. Tap to target, drag to aim, with a priority rule

*In plain words.* Tap a skill and it fires at the chosen target. Hold and drag and it becomes an aimed shot that fires on release. When the game picks for you, it uses a rule you set and sticks with its pick.

*How it works (technical).*
- Brawl Stars fires a tap "once at the nearest target" and a drag on release; dragging back cancels [V, S112].
- Wild Rift offers Closest, Low Health and Low Health %, a lock filter that skips minions, and a fix for "ping-pong between two targets" [V, S114, S115]. Aimed abilities fire on release on mobile [V, S113].
- Irelia's aimed drag searches near the aim point for a resettable target [V, S116].
- Asterion [I, note 11]. Click is tap, hold is drag. A tap on an aimed skill fires at the target's tile with no lead. Closest in Chebyshev tiles, keep the pick unless another is 1 tile closer, ties by clockwise angle from facing, then lowest id.

*Cost / performance.* A scan of visible units and the aim preview (E1).

*Games that used it.*
- Brawl Stars controls: https://brawlstars.fandom.com/wiki/Beginner%27s_Guide

*How it feels.* The tap is safe and the drag is skill, on one button.

*Risks.* A tap that leads would make aimed skills unmissable. Float ties make server and client disagree.

*Ratings 1–5 (author judgement):* Impact 3 · Clarity 5 · MMO fit 5 · Fairness 5 · Speed 5

### D5. Target markers, target frame and target of target

*In plain words.* A steady ring under your target, a dim mark on what a tap would hit, an outline on whatever the cursor covers, and a HUD frame with health and cast bar.

*How it works (technical).*
- WoW defaults `showTargetCastbar = 1`, `showTargetOfTarget = 0`, a 19 px icon for soft targets, and an option to pin off-screen targets to the edge [V, S104].
- FFXIV shows a temporary circle while cycling and a marker once chosen [V, S111]. Wild Rift rings the auto-target [V, S113].
- Asterion [I, note 11]. A 1 px red ring or brackets for the hard target, a dim ring for the next tap whenever you have none, a 1 px hover outline, and target of target off by default.

*Cost / performance.* A few sprites, or the flash's instance uniform for the outline (B2).

*Games that used it.*
- World of Warcraft target CVars: https://warcraft.wiki.gg/wiki/Console_variables/Complete_list

*How it feels.* The next-tap mark turns a hidden rule into visible UI [I, note 11].

*Risks.* Four marks on one 32 px sprite clutter it. Use shape, not only colour.

*Ratings 1–5 (author judgement):* Impact 2 · Clarity 5 · MMO fit 5 · Fairness 5 · Speed 5

### Family E: Telegraphs, aiming and misses

### E1. Cast modes and aim previews

*In plain words.* Players choose how an aimed skill fires. Show the shape and click to confirm, fire at the cursor on key down, or show the shape while held and fire on release.

*How it works (technical).*
- League ships normal cast, quick cast and quick cast with indicator [V, S127, S128]. GW2 has "Fast" and "Instant", clamps ground circles at max range and turns them red over unreachable spots [V, S108].
- No game marks aimable skills with an icon; a line or circle preview says "aimed", no preview says "homes" [V, S108, S112; I, note 04].
- Asterion [I, notes 04 and 05]. Quick cast with indicator by default. A hotbar corner glyph per type (dot targeted, crosshair aimed, circle ground). Preview as 4x4 px dots every 8 px with an end marker.

*Cost / performance.* A few sprites for the local player only.

*Games that used it.*
- League of Legends cast modes: https://wiki.leagueoflegends.com/en-us/Hotkeys

*How it feels.* Hold-and-release teaches range without an extra click.

*Risks.* Three modes burden new players. The preview must match the hitbox (E2).

*Ratings 1–5 (author judgement):* Impact 2 · Clarity 5 · MMO fit 5 · Fairness 5 · Speed 5

### E2. Skillshot speed, width and a tail that shows direction

*In plain words.* An aimed projectile should be fast enough to feel strong, slow enough to dodge at medium range, about a body wide, and drawn so a still frame shows its direction.

*How it works (technical).*
- Ezreal Q is a 0.25 s cast, 2000 units/s, 120 wide and 1200 long; selection radius 115 is wider than gameplay radius 65 [V, S129].
- With 1 tile at about 130 units, that is 15.4 tiles/s, 0.92 tiles wide and 9.2 long; at 60 fps, 15 tiles/s moves 8 px per frame [I, note 05].
- Riot wants hitboxes to match effects and projectiles to "convey the direction they're traveling, even without motion" [V, S130].
- Tibia's homing missiles fly `150 * sqrt(tiles)` ms, 150 ms for 1 tile and 397 ms for 7 [V, S8].
- Asterion [I]. Fast 12 tiles/s, orb 6 tiles/s, 0.75 tile wide, 8 tiles long, 2 or 3 afterimages.

*Cost / performance.* A sprite plus afterimages, and a segment test per step.

*Games that used it.*
- League of Legends Ezreal: https://wiki.leagueoflegends.com/en-us/Ezreal

*How it feels.* At 3 to 6 times walk speed, prediction pays at range and point-blank misses sting [I, note 05].

*Risks.* Generous hitboxes are unfair in PvP. A tail longer than the hitbox lies about reach.

*Ratings 1–5 (author judgement):* Impact 4 · Clarity 4 · MMO fit 4 · Fairness 4 · Speed 5

### E3. Ground telegraphs that resolve when the marker ends

*In plain words.* An enemy area attack draws a filling shape on the floor. The hit is decided when the marker vanishes, and the explosion after that is only the show.

*How it works (technical).*
- FFXIV markers are orange circles, donuts, lines, cones and squares on tile arenas. They snapshot when the telegraph disappears, cast-bar attacks at bar end, and player position is the model's centre [V, S131, S132].
- Lost Ark glows a boss blue before a counterable attack [V, S134].
- No source gives lead times in ms. Estimates are trash 400 to 600 ms, elite 1000 to 1500 ms, boss 2000 to 3000 ms, never under 400 ms [I, note 05].
- Asterion [I, note 05]. Tile-snapped, 1 px dark outline, 2x2 checker fill in warm orange with a hatch, a 2-frame white flash on resolve. Avoid red on green [V, S137].

*Cost / performance.* 20 overlapping decals at 1280x720 cost 0.24 ms (alpha) and 0.28 ms (dither) in WebGL2 on the M4. In Canvas2D dither cost more, 1.06 against 0.73 ms [V, S4].

*Games that used it.*
- Final Fantasy XIV AoE markers: https://ffxiv.consolegameswiki.com/wiki/AoE_marker

*How it feels.* On a grid, "am I in it" becomes yes or no. Hades II players complain when radius must be read from animation alone [V, S135].

*Risks.* Many overlapping fills become one blob. A colour with two meanings teaches nothing.

*Ratings 1–5 (author judgement):* Impact 3 · Clarity 5 · MMO fit 5 · Fairness 5 · Speed 5

### E4. Misses, dodges and near-miss cues

*In plain words.* A missed shot keeps flying and puffs on a wall. A server-rolled miss shows a puff, not a big word. The part of a player that can be hit is smaller than the sprite, and a whoosh marks a close call.

*How it works (technical).*
- Tibia shows a grey puff for a block and a spark for armour [V, S17]. HoH and Nuclear Throne let the projectile show the miss and keep text for damage and immunity [V, S57, S65].
- Touhou's hitbox is about 5x5 px; grazing a bullet scores 500 once [V, S82, S83]. Gungeon rolls for about 0.7 s, immune in the first half [V, S67].
- A predicted bolt that the server says missed should fizzle at the feet, never vanish mid-air [I, note 06].
- Asterion [I, note 05]. A 14 px hurt circle at the feet. A whoosh within 0.5 tile for the dodger and caster only. Immune gets a purple flash.

*Cost / performance.* One effect per miss; the near-miss test reuses the hit test.

*Games that used it.*
- Touhou hitbox: https://touhou.fandom.com/wiki/Imperishable_Night/Gameplay

*How it feels.* A puff reads faster than a word, and a close call feels earned.

*Risks.* Gungeon's 0.35 s immune window is shorter than a round trip plus a step, so dodges must be server-judged [I, note 02].

*Ratings 1–5 (author judgement):* Impact 3 · Clarity 5 · MMO fit 5 · Fairness 5 · Speed 5

### E5. Cast bars, interrupt flags and server timestamps

*In plain words.* A thin bar above a caster fills until the spell fires. Its colour and a small shield say whether you can interrupt.

*How it works (technical).*
- WoW `UnitCastingInfo` returns `startTimeMs`, `endTimeMs` and `notInterruptible`; the default UI draws a shield when true [V, S142].
- FFXIV lets roughly the last 0.5 s of a player cast move without cancelling [U, S133].
- Albion's Interrupt cancels a cast and stuns for 0.3 s [V, S53].
- Asterion [I, note 05]. Server timestamps so late packets shorten the bar. A 24x3 px bar, yellow when interruptible, grey with a shield when not. In PvP, enemy bars only for your target and casts aimed at you.

*Cost / performance.* A few rectangles per caster and 8 bytes per cast.

*Games that used it.*
- World of Warcraft cast info: https://warcraft.wiki.gg/wiki/API:UnitCastingInfo

*How it feels.* A window for the skilled player and a warning for the healer.

*Risks.* Thirty floating bars are noise in PvP.

*Ratings 1–5 (author judgement):* Impact 2 · Clarity 5 · MMO fit 4 · Fairness 5 · Speed 5

### Family F: Netcode feel and crowds

### F1. Predict the cosmetic start, confirm the outcome

*In plain words.* Your character starts swinging the instant you press. Whether it hit, how much and whether the target died appear when the server says so.

*How it works (technical).*
- Path of Exile's Lockstep waits "a delay equal to your latency"; GGG called Predictive "probably the best choice" above 100 ms [V, S143]. The 150 ms Auto switch is wiki-only [U, S144].
- Overwatch predicts abilities and rolls back on mismatch; above about 220 ms RTT some hit effects wait for the server [V, S145, S146].
- Gambetta lets effects play but makes health wait [V, S147]. Tibia predicts only walking [V, S13].
- Asterion [I, note 06]. Predict your wind-up, cast bar, swing sound and targeted launch. Confirm numbers, target flash, recoil, health and death.

*Cost / performance.* Nothing to roll back.

*Games that used it.*
- Path of Exile lockstep post: https://www.pathofexile.com/forum/view-thread/1262596

*How it feels.* Input answers at once and nothing seen is taken back. Predicted sparks become "phantom hits" when rejected [I, note 06].

*Risks.* Wind-ups shorter than a round trip leave a gap; make them 100 to 150 ms [I, note 06].

*Ratings 1–5 (author judgement):* Impact 3 · Clarity 4 · MMO fit 5 · Fairness 5 · Speed 5

### F2. Targeted skills launch locally and land on confirm

*In plain words.* A targeted bolt leaves your hands at once and flies to the target. The server has already decided it hits, and the number appears when the bolt arrives.

*How it works (technical).*
- Tibia applies damage when it sends the missile packet; the missile is visual [V, S8, S17].
- Ragnarok sends motion times in each damage packet so the client shows the hit on the right frame [V, S47]. OSRS delays bow hits by distance [V, S43].
- Asterion [I]. Apply at cast end and send `impact_ms` (0 for melee, `150 * sqrt(tiles)` for bolts); the client shows number, flash and sound at impact.

*Cost / performance.* Two bytes per hit.

*Games that used it.*
- Ragnarok Online damage packet: https://github.com/rathena/rathena/blob/master/src/map/clif.cpp

*How it feels.* Instant and honest. Claypool puts click-to-target RPG play near a 500 ms tolerance [V, S100].

*Risks.* A server-rolled miss on a homing bolt needs a clear fizzle (E4).

*Ratings 1–5 (author judgement):* Impact 3 · Clarity 5 · MMO fit 5 · Fairness 5 · Speed 5

### F3. Aimed skills favour the target

*In plain words.* If you dodged out of a shot on your screen, you are safe. The server checks aimed hits against where players are now, not where the shooter saw them.

*How it works (technical).*
- Source rewinds targets, `sv_maxunlag` 1 s on the Valve wiki (0.2 s per CS sources), with 100 ms interpolation [V, S149, S150]. Gambetta calls it "somewhat unfair" [V, S148].
- Overwatch stops predicting hits above about 220 ms so a dodger behind cover stays safe [V, S145, S146].
- Asterion [I]. No rewind. Projectiles step against current server positions. A 600 ms telegraph at 100 ms ping leaves 500 ms to react. If PvP tests show stolen shots, rewind at most 100 to 150 ms.

*Cost / performance.* No position history to keep.

*Games that used it.*
- Valve lag compensation: https://developer.valvesoftware.com/wiki/Lag_Compensation

*How it feels.* Dodging feels real; the shot's travel time hides near misses for the shooter [I].

*Risks.* High-ping shooters must lead. Short telegraphs let latency decide fights.

*Ratings 1–5 (author judgement):* Impact 2 · Clarity 4 · MMO fit 5 · Fairness 5 · Speed 5

### F4. Server ticks against per-entity scheduling

*In plain words.* Either the world moves in fixed beats, or each attacker has its own timer. Beats hide lag but make every press wait for the next beat.

*How it works (technical).*
- OSRS ticks every 600 ms (0.606 to 0.618 s on busy worlds), and an action waits 0 to nearly 600 ms [V, S40]. Players turn that into skill with prayer flicking [V, S44, S45].
- TFS has no single combat tick. Creatures think every 1000 ms in 10 buckets of 100 ms and player swings are scheduled per player [V, S19, S16].
- Overwatch uses 16 ms frames [V, S145], VALORANT 128-tick servers [V, S151]. WoW Classic cut spell batching from 400 to 10 ms [V, S119].
- Asterion [I, note 06]. A 100 ms step for movement and projectiles, combat on per-entity events, remote players drawn 100 to 150 ms behind.

*Cost / performance.* Ten simulation passes per second.

*Games that used it.*
- Old School RuneScape game tick: https://oldschool.runescape.wiki/w/Game_tick

*How it feels.* A coarse tick makes authority invisible for targeted play and feels like lag for dodging [I, note 01].

*Risks.* Copying OSRS's tick by accident brings tick manipulation.

*Ratings 1–5 (author judgement):* Impact 2 · Clarity 4 · MMO fit 5 · Fairness 4 · Speed 4

### F5. Effect tiers: own, party, others, and hostile always on

*In plain words.* Your effects show in full, your party's reduced, strangers' minimal or off. Anything that can hurt you always shows in full.

*How it works (technical).*
- WoW Spell Density (11.2) reduces only other party and raid players; your visuals, NPC spells and enemy player spells stay full [V, S152, S153].
- FFXIV sets self, party, others and enemy PCs to All, Limited or Off [V, S154, S155]. RotMG players ask to hide ally shots but keep friends' [V, S56].
- A Tibia ranged hit costs each spectator about 89 bytes, two thirds of it a chat string [V, S22; I, note 01].
- Asterion [I, notes 01 and 06]. A 16-byte `hit` event and client-side log text (§6c).

*Cost / performance.* Culling others' effects cuts particles, numbers and voices together. Network cost grows with players squared [I, note 06].

*Games that used it.*
- World of Warcraft Spell Density: https://www.icy-veins.com/wow/news/too-many-spells-on-screen-patch-11-2-fixes-that-with-one-simple-setting/

*How it feels.* You see your rotation and the boss's next attack. Diablo IV players compared crowds to "a Where's Waldo book" [V, S156].

*Risks.* Hiding party heals hides useful zones. Culling hostile telegraphs is a fairness bug.

*Ratings 1–5 (author judgement):* Impact 2 · Clarity 5 · MMO fit 5 · Fairness 5 · Speed 5

### Family G: Action queues and PvP

### G1. Spell queue window against exhaust, ticks and locks

*In plain words.* Press your next skill a little early and the game fires it on time; the newest press in the window wins. Older games reject the early press, wait for a tick or lock the client.

*How it works (technical).*
- WoW `SpellQueueWindow` defaults to 400 ms [V, S104]; the 400 cap comes from Maxroll and addon authors [V, S117, secondary]. The last press wins, and Maxroll advises at least "200 ms + your ping" [V, S117].
- Tibia rejects early casts with "You are exhausted". Spells have a group cooldown and their own (attack 2000 and 2000 ms, heal 1000 and 1000 ms), so a heal and an attack share a second [V, S28, S29, S30]. Generic exhaust is 200 ms, ex-actions 1000 ms [V, S21].
- OSRS lands inputs on the next 600 ms tick [V, S40]. FFXIV locks the client 500 ms and lets the server's about 600 ms replace it, so ping stretches every weave [V, S120, player analysis].
- Asterion [I, note 04]. One server slot, 400 ms, a pulse on the queued slot, Tibia's split groups over a 1000 ms GCD.

*Cost / performance.* One slot and a few timestamps per player.

*Games that used it.*
- World of Warcraft spell queue window: https://maxroll.gg/wow/resources/spell-queue-window

*How it feels.* Rotations flow at any ping inside the window. Without one, a press 50 ms early is lost [I, note 04].

*Risks.* A window far larger than the GCD makes late changes feel ignored. An invisible queue feels like eaten input.

*Ratings 1–5 (author judgement):* Impact 3 · Clarity 4 · MMO fit 5 · Fairness 5 · Speed 5

### G2. Crowd control diminishing returns and knockback immunity

*In plain words.* Each stun of a kind lasts half as long as the last, then not at all for a while. A knockback makes a player immune to knockbacks for a few seconds.

*How it works (technical).*
- WoW 12.0.0 (2026-01-20) made players immune after 2 applications; 12.1.0 (2026-08-11) set the reset to 20 s. The rule is 100%, 50%, immune, 20 s reset, with a 6 s PvP cap [V, S121]. Note 11 confirmed the patch history over the wiki intro's 18 s.
- Knockbacks go immune after the first for 10 s (5.4.0) [V, S121]. Arena dampening cuts healing 1% per stack every 10 s [V, S122].
- Asterion [I, note 04]. WoW's shape per category, a DR pip over the player, knockback 1 tile then 10 s immune. Mobs take full knockback.

*Cost / performance.* A few timers per player and 2 bits per category on the wire.

*Games that used it.*
- World of Warcraft diminishing returns: https://warcraft.wiki.gg/wiki/Diminishing_returns

*How it feels.* Control chains end, so a player caught alone gets to act.

*Risks.* "100/50/25 over 18 s" is out of date [V, S121]. Mid-season DR changes confuse players.

*Ratings 1–5 (author judgement):* Impact 2 · Clarity 3 · MMO fit 5 · Fairness 5 · Speed 5

### G3. PvP damage scaling and asymmetric hit reactions

*In plain words.* Players hit players for less, flinch less, and never get frozen by someone else's hitstop. A monster can be stunlocked; a player keeps control.

*How it works (technical).*
- TFS halves player-on-player damage with `damage.primary.value /= 2` [V, S23]. Canary uses per-vocation multipliers shipped at 1.0 [V, S31].
- Ragnarok walk-delays players 20% and monsters 100% of the damage animation [V, S48]. Smash gives a perfect shield's attacker hitlag and the defender none [V, S86].
- Canary locks protection zones for 60 s after aggression [V, S27]. New World applied its lock nerfs to PvP only [V, S109].
- Asterion [I]. Damage x0.5 per world type. No hitstop on victim players, cosmetic flinch, shake only for the local player. Each feedback resource carries a PvP override.

*Cost / performance.* One multiplier and one flag per resource.

*Games that used it.*
- Tibia PvP halving (TFS): https://github.com/otland/forgottenserver/blob/master/src/combat.cpp

*How it feels.* The player being hit still steers, while the attacker keeps the full flash, hold and sound on their own screen [I].

*Risks.* Two rule sets double testing. Halved damage lengthens fights, a balance question out of scope here.

*Ratings 1–5 (author judgement):* Impact 2 · Clarity 4 · MMO fit 5 · Fairness 5 · Speed 5

### Family H: Audio, crits, kills and death

### H1. Source tags per listener: OWN, OTHERS, CREATURES

*In plain words.* Every sound knows who caused it relative to you. Your hits and hits on you play loud, and strangers' hits sit in the background.

*How it works (technical).*
- Canary tags each sound per spectator, `SourceEffect_t { GLOBAL=0, OWN=1, OTHERS=2, CREATURES=3 }` [V, S31, S32]. Tibia's client splits battle sound settings by own and others [U, S36].
- Overwatch boosts enemies that target you to play "with the monitor practically turned off" [V, S166, secondary]. Diablo IV limits instances per sound and lifts key monsters [V, S165].
- Asterion [I, note 07]. OWN and incoming 0 dB, CREATURES -6 dB, OTHERS -10 dB with a slider; the client computes the tag from attacker id.

*Cost / performance.* One comparison per sound, which also feeds voice priority (H2).

*Games that used it.*
- Tibia source tags (Canary): https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp

*How it feels.* Others' hits become texture and your own stay events. Juicy audio raised immersion with a medium effect in one study [V, S96].

*Risks.* Enemy players' hits on you must count as OWN-level.

*Ratings 1–5 (author judgement):* Impact 3 · Clarity 5 · MMO fit 5 · Fairness 5 · Speed 5

### H2. A voice pool with priority stealing

*In plain words.* Only so many sounds play at once. When the pool is full, an important new sound replaces the least important quiet one, and your own hits are never cut.

*How it works (technical).*
- FMOD runs 32 to 128 real voices, and a higher priority is never stolen by a lower [V, S164].
- Godot `max_polyphony` defaults to 1 and cuts the oldest, with no global priority [V, S160]. Web audio uses Sample playback since 4.3, with no bus effects [V, S161, S162], and starts after a user gesture [V, S163].
- Asterion [I, notes 07 and 09]. A pool of 16 players, 3 per sound id, 40 ms between starts of one id, priority own hit, hit on you, crit or kill involving you, others, ambient. Duck others 4 dB for 150 ms when hit, by volume tween.

*Cost / performance.* Each Web Audio voice cost about 0.1% of an M4 core; 128 hits per second (about 38 voices) took 3.6% with zero underruns, and a trigger 0.035 to 0.16 ms of main thread [V, S4]. The limit must live in game code.

*Games that used it.*
- FMOD voice management: https://d1s9dnlmdewoh1.cloudfront.net/2.03/api/managing-resources-in-the-core-api.html

*How it feels.* A clear mix that never drops your hits.

*Risks.* A weak phone's audio thread may be 5 to 10 times slower [I, note 09]. `pitch_scale` on web is untested [U, note 07].

*Ratings 1–5 (author judgement):* Impact 3 · Clarity 4 · MMO fit 5 · Fairness 5 · Speed 5

### H3. Short synthesized hits, jsfxr ranges and layering

*In plain words.* Generate retro hits from a preset, export a few per weapon, and layer a sharp click over a short thump. Keep them under 150 ms so a crowd does not turn to mud.

*How it works (technical).*
- jsfxr `hitHurt` is square, sawtooth or noise at about 145 to 2260 Hz with a downward slide, attack 0, sustain 0 to 23 ms and decay 23 to 204 ms [V, S168].
- Godot `AudioStreamRandomizer` picks pitch between `1/x` and `x` and avoids repeats by default [V, S159].
- Asterion [I, note 07]. ±1 semitone (1.059) on hits, none on crits. Click 0 to 20 ms, thump 20 to 120 ms, tail dropped first in crowds. Five variants per layer give 75 combinations from 13 files. Pre-render; never synthesize at runtime on web.

*Cost / performance.* Buffer playback cost about half an oscillator at low counts [V, S4].

*Games that used it.*
- jsfxr presets: https://github.com/chr15m/jsfxr/blob/master/sfxr.js
- sfxr online editor: https://sfxr.me

*How it feels.* Crunchy and period-correct. Sound coherence ranks among the top three impact-feel features [V, S98].

*Risks.* Wide pitch swings sound like different weapons [U, S169].

*Ratings 1–5 (author judgement):* Impact 4 · Clarity 4 · MMO fit 5 · Fairness 5 · Speed 5

### H4. Crit and overkill stacks

*In plain words.* A crit stacks small boosts on a normal hit, and most belong to the attacker and the victim. Bystanders see the impact sprite only.

*How it works (technical).*
- Tibia sends `CONST_ME_CRITICAL_DAMAGE` to all spectators and "due to your critical attack" only to the attacker [V, S31].
- OSRS trims max-hit splats [V, S41]. Overwatch players relied on the victim-side crit sound to understand deaths [V, S167, player reports].
- Low-authority blogs put crit hitstop at 4 to 36 frames [U, S170].
- Asterion [I, note 07]. Crit digits (C3), 6-frame hitstop (B1), trauma +0.3 and a 2 px kick (B6), a crit sound at 0 dB for the two players involved and -12 dB for others. Overkill only as a bigger death pop.

*Cost / performance.* One extra effect and sound per crit.

*Games that used it.*
- Tibia critical effect (Canary): https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp

*How it feels.* A jolt for the attacker, a reason for the victim, a spark for the crowd.

*Risks.* Crit shake on every client is the classic MMO mistake.

*Ratings 1–5 (author judgement):* Impact 5 · Clarity 4 · MMO fit 4 · Fairness 5 · Speed 5

### H5. Kill confirmation, death pop and corpses

*In plain words.* The killing hit flashes, the monster squashes and dissolves in about 130 ms, and a corpse appears at once so players can loot. It rots in stages and disappears.

*How it works (technical).*
- Tibia has no death animation. `dropCorpse` adds a splash, the corpse and the loot, owned by the top damage dealer [V, S25, S26]. Canary's rat and dragon rot 300 + 300 + 60 s; a player corpse's first stage is 10 s [V, S33].
- OSRS graves give 15 minutes and show on the minimap [V, S46]. Nijman lists permanence and a death animation among his tweaks [V, S92].
- Asterion [I, note 07]. Killer only, a kill blip and "+120 xp" rising 16 px over 800 ms. Everyone, a 2-frame flash, a squash to 1.2 by 0.8 with a dither fade, then corpse and pop, about 133 ms. Rot 120 + 120 + 30 s.

*Cost / performance.* "Died" and "corpse at tile" from the server and a few particles.

*Games that used it.*
- Tibia corpses (Canary `items.xml`): https://github.com/opentibiabr/canary/blob/main/data/items/items.xml

*How it feels.* Short and clear. Players spam-click corpses, so a long animation before loot feels like lag [I, note 07].

*Risks.* Corpse clutter in busy spawns. Global slow motion on kills is impossible in a shared world.

*Ratings 1–5 (author judgement):* Impact 4 · Clarity 5 · MMO fit 5 · Fairness 5 · Speed 5

## 5. Comparison scorecard

Author judgement, copied from the profiles: Impact · Clarity · MMO fit · Fairness · Speed.

| # | Technique | Impact | Clarity | MMO fit | Fairness | Speed | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Three-phase swing with a hold | 5 | 4 | 5 | 4 | 5 | 23 |
| A2 | Smear frames and swept hitbox | 4 | 4 | 5 | 4 | 5 | 22 |
| A3 | Directions and layers | 3 | 4 | 5 | 5 | 4 | 21 |
| A4 | Auto-attack rhythm | 3 | 5 | 5 | 5 | 5 | 23 |
| A5 | Recovery and startup cancels | 3 | 4 | 4 | 4 | 5 | 20 |
| A6 | Cast and channel animations | 4 | 5 | 5 | 4 | 5 | 23 |
| B1 | Per-entity hitstop, hold, hit slow | 5 | 4 | 4 | 4 | 5 | 22 |
| B2 | Hit flash | 4 | 5 | 5 | 5 | 5 | 24 |
| B3 | Knockback and squash | 4 | 4 | 4 | 3 | 5 | 20 |
| B4 | Hit sparks at 75 ms per frame | 4 | 4 | 5 | 5 | 4 | 22 |
| B5 | Hit reactions above a threshold | 4 | 4 | 5 | 5 | 5 | 23 |
| B6 | Trauma shake and kick | 5 | 3 | 4 | 5 | 5 | 22 |
| B7 | Positional shake | 4 | 4 | 5 | 5 | 5 | 23 |
| C1 | Tibia animated text | 3 | 5 | 5 | 5 | 4 | 22 |
| C2 | Aggregation and caps per target | 3 | 5 | 5 | 5 | 5 | 23 |
| C3 | Crit emphasis and D3 big-hit rule | 5 | 4 | 4 | 5 | 5 | 23 |
| C4 | Number visibility and miss text | 2 | 5 | 5 | 5 | 5 | 22 |
| D1 | Click target and battle list | 2 | 5 | 5 | 5 | 5 | 22 |
| D2 | Tab cycling rules | 2 | 4 | 5 | 4 | 5 | 20 |
| D3 | Soft target and target lock | 2 | 3 | 4 | 3 | 5 | 17 |
| D4 | Tap to target, drag to aim | 3 | 5 | 5 | 5 | 5 | 23 |
| D5 | Target markers and frame | 2 | 5 | 5 | 5 | 5 | 22 |
| E1 | Cast modes and aim previews | 2 | 5 | 5 | 5 | 5 | 22 |
| E2 | Skillshot speed, width, tail | 4 | 4 | 4 | 4 | 5 | 21 |
| E3 | Ground telegraphs resolve at marker end | 3 | 5 | 5 | 5 | 5 | 23 |
| E4 | Misses, dodges, near misses | 3 | 5 | 5 | 5 | 5 | 23 |
| E5 | Cast bars and interrupt flags | 2 | 5 | 4 | 5 | 5 | 21 |
| F1 | Predict cosmetic start, confirm outcome | 3 | 4 | 5 | 5 | 5 | 22 |
| F2 | Targeted skills land on confirm | 3 | 5 | 5 | 5 | 5 | 23 |
| F3 | Aimed skills favour the target | 2 | 4 | 5 | 5 | 5 | 21 |
| F4 | Ticks against per-entity scheduling | 2 | 4 | 5 | 4 | 4 | 19 |
| F5 | Effect tiers | 2 | 5 | 5 | 5 | 5 | 22 |
| G1 | Queue window, exhaust, ticks, locks | 3 | 4 | 5 | 5 | 5 | 22 |
| G2 | CC DR and knockback immunity | 2 | 3 | 5 | 5 | 5 | 20 |
| G3 | PvP damage and asymmetric reactions | 2 | 4 | 5 | 5 | 5 | 21 |
| H1 | Source tags per listener | 3 | 5 | 5 | 5 | 5 | 23 |
| H2 | Voice pool with priority | 3 | 4 | 5 | 5 | 5 | 22 |
| H3 | Short synthesized hits | 4 | 4 | 5 | 5 | 5 | 23 |
| H4 | Crit and overkill stacks | 5 | 4 | 4 | 5 | 5 | 23 |
| H5 | Kill, death pop, corpses | 4 | 5 | 5 | 5 | 5 | 24 |

**Reading the table.** Speed barely separates the rows, and that is the main runtime finding. Once numbers batch and flashes live in a shader, 36 of 40 rows score a 5 [V, S4]. Fairness separates little more, because most good feedback is local and decides nothing. Impact and Clarity decide. The hit flash (B2) and the kill sequence (H5) lead at 24, cheap and readable for everyone. Fourteen rows follow at 23, among them the swing with a hold (A1), the flinch threshold (B5), positional shake (B7), aggregation (C2), tap and drag (D4) and marker-end telegraphs (E3). Soft target lock (D3) scores lowest at 17, because in PvP it trades the "aimed can miss" contract for comfort. Per-entity hitstop (B1) scores 22, not higher, because crowds force it short [I].

---

## 6. Deep dives

### 6a. Hitstop across games

Frames at 60 fps unless stated.

| Game | Normal hit | Heavy, crit or special | Cap | Who freezes | Source |
|---|---|---|---|---|---|
| Street Fighter (most games) | Light 9 f, medium 11 f | Heavy 13 f; SF2 14 f flat | n/a | Both; projectiles freeze only the victim, 8 f | [V, S87] |
| Smash Ultimate | 12 f at 10% damage | 19 f at 20% | 30 f | Both; perfect shield freezes only the attacker | [V, S86] |
| Smash Ultimate, 8 players | No change at 10 f or less | 20 f becomes 17.5 (x0.875) | Ramps toward x0.75 | Both | [V, S86] |
| Celeste | 3 f (50 ms) at dash start | 6 f (100 ms) on explosion launch | n/a | Whole game | [V, S78] |
| Hades (mod schema) | 40 ms at 10% speed, 30 ms lerp back | n/a | n/a | Simulation slow | [U, S77] |
| Heroes of Hammerwatch | None | None | n/a | Nobody; a 100 ms tint instead | [V, S57] |
| VR study (Tomizawa) | Pleasant mean 0.37 to 0.39 s | Unpleasant from about 0.54 s | n/a | One enemy, single player | [V, S97] |
| Asterion proposal | 3 f (50 ms) | Heavy 5 f, crit 6 f, kill 8 f | 8 f (133 ms) | Attacker and target visuals, only when you are involved | [I] |

**What the table says.** Fighting games sit near 150 to 230 ms because two players watch one exchange. Celeste uses a third of that and HoH, the only online co-op game here, none. The VR study's pleasant 0.37 s comes from one enemy and does not transfer to a crowd [I, note 03]. Smash Ultimate is the only shipped game we found that cuts hitstop for more players, and only on long freezes [V, S86].

### 6b. Damage numbers across games

| Game | Lifetime | Motion | Merge or cap | Crit or big-hit rule | Source |
|---|---|---|---|---|---|
| Tibia (OTClient) | 1000 ms, fade after 833 ms | Rise 48 px linear | Same colour on a tile inside 400 ms adds; else 12 px lower | Crit is a magic effect | [V, S6, S7, S31] |
| Old School RuneScape | 1.4 s | Sits on the actor | 4 slots per actor, replace oldest or smallest | Trimmed max hit; others tinted | [V, S38, S39, S41] |
| MapleStory (fan client) | About 750 ms | Rise about 31 px/s | None found | Separate crit digits | [V, S51; I on lifetime] |
| Diablo III (2.4.0) | n/a | n/a | Abbreviation (1769M) | Orange beats last orange; decays 3%/s | [V, S138] |
| Diablo IV | n/a | n/a | One on/off option | White, yellow, cyan, orange | [V, S139] |
| Path of Exile 2 | n/a | n/a | No floating numbers on normal hits | Boss bar only | [U, S141] |
| Asterion proposal | 1000 ms; crit 1200 ms | Rise 48 px | 400 ms merge; 4 per target; 64 on screen | Larger yellow digits, 2x pop, never merged | [I] |

**What the table says.** The 2D MMOs keep numbers short-lived and bounded per actor; the ARPGs fight inflation with colour rules. OSRS's cap and Tibia's merge solve different halves of the crowd problem, so Asterion uses both [I].

### 6c. Latency and bytes

**What to predict and what to confirm.**

| Event | When it shows | Why | Source |
|---|---|---|---|
| Your wind-up, cast bar start, swing sound | At once | Cosmetic, nothing to undo | [V, S147; I, note 06] |
| Your targeted or aimed projectile launch | At once | The server decides the hit; a miss needs no rollback | [I, note 06] |
| Number, target flash, recoil, health bar | On confirm (RTT plus up to one step) | Outcomes are server truth | [V, S147] |
| Death, corpse, loot | On confirm | Hard to reverse | [V, S147] |
| Your walk step | At once, cancelled if refused | Tibia's prewalk | [V, S13] |
| Enemy telegraph fill | From server timestamps | Shorter but honest at high ping | [I, note 05] |

**Bytes per hit event**, before framing.

| Message | Layout | Bytes | Source |
|---|---|---|---|
| Tibia damage text `0xB4`, 44-character line | 17 fixed plus string | about 63 | [V, S22] |
| Tibia magic effect / missile / health | | 9 / 11 / 6 | [V, S22] |
| Tibia ranged hit seen by one spectator | 11 + 9 + 63 + 6 | about 89 | [V, S22; I, note 01] |
| Proposed `hit` event | opcode 1, attacker 4, target 4, skill 2, outcome 1, amount 2, impact delay 2 | 16 | [I] |
| 30 players, one hit each per second, per client | 30 × 89 against 30 × 16 | 2,670 against 480 B/s | [I] |
| Same fight, server total to 30 clients | | 80 against 14.4 KB/s | [I] |

A type id with client-side text saves most of Tibia's bytes, and per-step merging (C2) caps the rest [I]. Claypool and Claypool put RPG tolerance near 500 ms and first-person near 100 ms [V, S100], so targeted and aimed skills get different rules [I, note 06]. Godot web has only WebSocket and WebRTC [V, S157].

### 6d. Runtime cost: what juice really costs

Whole frames including a 1 px readback, median ms [V, S4]. Subtract the baseline for the effect alone. Canvas2D draws into 320x180 unless marked native (1280x720); WebGL2 uses one instanced draw per effect.

| Test | M4 GPU | M4, 6x CPU throttle | SwiftShader (software) | Profiles |
|---|---|---|---|---|
| Baseline, Canvas2D / WebGL2 | 0.65 / 0.22 | 3.37 / 0.88 | 0.56 / 0.05 | n/a |
| 1000 numbers, Canvas2D glyph blits | 3.38 | 13.18 | 41.9 | C1 |
| 1000 hits aggregated to 100, glyph blits | 0.94 | 4.18 | 5.77 | C2 |
| 1000 hits aggregated to 100, cached sprites | 3.75 | 43.2 | 4.67 | C2 |
| 1000 numbers, WebGL2 instanced digits | 0.25 | 1.07 | 37.7 | C1 |
| 2000 particles, Canvas2D fillRect / drawImage | 1.02 / 2.74 | 4.18 / 10.5 | 29.3 / 31.8 | B4 |
| 10,000 particles, WebGL2 points | 0.29 | 1.23 | 0.96 | B4 |
| 100 flashing sprites, pre-baked / source-atop | 0.75 / 16.0 | 3.63 / 79.6 | 2.28 / 9.86 | B2 |
| 100 flashing sprites, WebGL2 instance attribute | 0.21 | 0.72 | 1.55 | B2 |
| Shake, none / setTransform | 0.84 / 0.86 | 4.00 / 3.94 | 4.00 / 4.18 | B6, B7 |
| 20 telegraphs native, WebGL2 alpha / dither | 0.24 / 0.28 | 1.06 / 1.07 | 2.29 / 2.16 | E3 |
| Audio, 128 hits/s, audio thread | 3.6% of a core | 3.6% | 3.7% | H2 |

**Machine.** Apple M4 Pro (14 cores, 48 GB), macOS 26.5.1, Chromium 153.0.8010.12 under Playwright with COOP and COEP headers (5 µs timers). ANGLE Metal for GPU runs, a 6x CPU throttle that spares the GPU and audio thread, and SwiftShader. Chrome seems to rasterize a 320x180 Canvas2D on the CPU, unconfirmed in source [I, note 09]. No phone and no Godot build were measured [V, S4].

**What it means.**
- **Cost tracks draw calls, not pixels.** One instanced draw handles 1000 numbers or 10,000 particles in about 0.25 ms. In Godot that means one bitmap-font texture and shared materials [I, note 09].
- **Aggregate numbers, and never cache running totals.** Aggregation helped 3 to 7 times in every condition; cached totals hit 43.2 ms throttled [V, S4].
- **Never composite flashes per frame.** `ctx.filter` cost 442 ms per frame at 1280x720 [V, S4].
- **Software GL is the floor.** 1000 unaggregated digits take 37.7 ms in SwiftShader [V, S4].
- **Budget.** A stress frame with 100 aggregated numbers, 2000 sparks, 100 flashes, shake and 20 telegraphs adds about 1 ms in WebGL2 on the M4, under 2 ms throttled [I, note 09, summed]. We aim for 2 ms of juice on a weak device.

**What Godot adds** (published, not measured by us). Compatibility has no pipeline precompilation, so show every material once while loading [V, S182]. Browsers pause inactive tabs, so a client must resync on focus [V, S180].

### 6e. Queues, locks and PvP rules compared

| Game | Queue or buffer | Lock or cooldown | PvP rule | Source |
|---|---|---|---|---|
| World of Warcraft | 400 ms window, last press wins | GCD 1.5 s, floor 0.75 s | CC 100%, 50%, immune, 20 s; 6 s cap; knockback immune 10 s | [V, S104, S118, S121] |
| Tibia (TFS, Canary) | None; "You are exhausted" | Attack group 2 s, heal 1 s | Player damage halved (TFS); 60 s PZ lock | [V, S30, S23, S27] |
| Old School RuneScape | Implicit, next 600 ms tick | Weapon speed 4 to 7 ticks | Fixed processing order | [V, S40, S42] |
| Final Fantasy XIV | None | Client 500 ms, server about 600 ms plus ping | n/a | [V, S120, player analysis] |
| Ragnarok Online | n/a | 200 ms per extra hit | Players walk-delayed 20%, monsters 100% | [V, S48] |
| New World Aeternum | n/a | n/a | Lock never headshots, slower turn | [V, S109] |
| Asterion proposal | 400 ms, 1 slot, last press wins | GCD 1000 ms; attack 2000, heal 1000 ms | WoW DR; 1 tile knockback then 10 s immune; x0.5 damage; no victim hitstop | [I] |

Count every lock on the server clock, so ping moves when an action appears but never how long it lasts, and resolve same-step actions in a fixed order, as OSRS does [V, S40; I].

---
## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)

All of this section is design proposal [I], built from the cited parts. The Combat Juice Sandbox (§8) plays it.

**Layers, bottom to top.**
1. **Server combat truth.** The server owns hits, damage, cooldowns and deaths. A 100 ms step moves units and projectiles, and swings, casts and queued actions fire on per-entity events. Targeted hits apply at cast end, aimed hits test current positions, ground AoEs resolve when the marker ends (A4, E3, F2 to F4).
2. **Input, targeting and action queue.** Click and Tab over the battle-list order, tap to target and drag to aim, a cursor-nearest soft target with hysteresis, one queued action with a 400 ms window (D1 to D4, E1, G1).
3. **Client prediction and reconciliation.** Your wind-ups, cast bars, swing sounds and launches play at once; numbers, target flashes, recoil, health and death wait for the server (F1, F2, E4).
4. **Animation.** A 6-frame swing with a fixed 150 ms strike, smears on the effect layer, 4-direction bodies, cast raise, loop and release, a flinch above 1/16 of max HP, a 133 ms death pop into an instant corpse (A1 to A6, B5, H5).
5. **Impact feedback.** Per-entity hitstop of 3 to 8 frames when you are involved, a 100 ms flash by instance uniform, 4 px recoil back to the tile, squash in code, 75 ms spark flipbooks, and a global-freeze toggle in the Sandbox to show why it fails (B1 to B4).
6. **Camera.** One trauma value, shake by trauma squared in whole pixels up to 6 px, decay 1.5 per second, positional falloff for slams, a 2 px kick on your crits, a 0 to 100% slider (B6, B7).
7. **Combat text and UI.** Tibia-style numbers with a 400 ms merge and caps, crit digits, tiers for own, party and others, grey miss text, target marks and frame, cast bars, tile-snapped telegraphs (C1 to C4, D5, E2, E3, E5).
8. **Audio.** Pre-rendered short hits with ±1 semitone, OWN, OTHERS and CREATURES tags, a 16-voice pool with priority, crit layers for the two players involved, ducking by volume tween (H1 to H4).
9. **Crowd budget, PvP rules and accessibility.** Effect tiers with hostile effects always full, caps on flashes, numbers and particles, a software-GL fallback, the PvP rule set, and settings for flashes, shake, numbers and colour-blind patterns (C4, F5, G2, G3, B2).

**Recommended preset.** Starting values for Asterion at 32 px tiles and 60 fps. "Estimate" means no source gave the number; tune in the Sandbox.

| Setting | Asterion value | Source |
|---|---|---|
| Server step | 100 ms; combat events scheduled per entity | Estimate [I, note 06]; Tibia per-entity swings [V, S16] |
| Auto-attack swing | 2000 ms | Tibia vocations [V, S24] |
| Global cooldown | 1000 ms | Tibia ex-action exhaust [V, S21]; estimate for the GCD role |
| Spell group cooldowns | Attack 2000 ms, heal 1000 ms | Canary spells [V, S28, S29] |
| Spell queue window | 400 ms, 1 slot, last press wins | WoW default [V, S104, S117] |
| Swing timing | Sword 100, 50, 50, 50, 100, 50 ms; hammer 250, 50, 50, 50, 300, 100 ms | Slynyrd [V, S80] |
| Hitstop, involves you | Normal 3 f (50 ms), heavy 5 f, crit 6 f, kill 8 f; cap 8 f (133 ms) | Estimate, between Celeste [V, S78] and HoH's none [V, S57] |
| Hitstop, others' hits; victim players in PvP | 0 | Sakurai's third-player problem [V, S85]; estimate |
| Hit flash | 2 f full white, 4 f fade, 100 ms total | HoH 100 ms fade [V, S57] |
| Cosmetic recoil | 4 px over 3 f out, 3 f back; 8 px on crits | Estimate [I, note 03] |
| Server knockback | 1 tile over 150 ms; players 1 tile max, 10 s immune after | WoW knockback DR [V, S121]; tile values estimate |
| Flinch threshold | 2 f (150 ms) when damage ≥ max HP / 16, or on crits | D2 divisors 8 to 64 [V, S69]; 16 is an estimate |
| Trauma per event | Hit taken 0.2 + 0.3 × damage / max HP; your crit 0.3; boss slam 0.6 at centre | Eiserloh 0.2 and 0.5 [V, S93]; values estimate |
| Shake curve | trauma², max 6 px, vertical half, decay 1.5/s, no rotation | Phantom Camera squared [V, S172]; HoH half vertical [V, S58]; px estimate |
| Camera kick | 2 px opposite the aim on own crits and heavy skills | Estimate; Nijman's 6 px is secondary [U, S66] |
| Number lifetime and rise | 1000 ms, 48 px, fade after 833 ms | OTClient [V, S5, S6] |
| Number merge window | 400 ms per target, tier and type; crits never merge | OTClient [V, S6] |
| Number caps | 4 per target, 64 on screen | OSRS 4 slots [V, S39]; 64 estimate |
| Crit number | Larger digit set, 2x pop for 3 f, 1200 ms | Estimate [I, note 05] |
| Others' numbers | Party 50% alpha, strangers off | Estimate [I, note 05] |
| Targeted missile flight | `150 × sqrt(tiles)` ms | OTClient [V, S8] |
| Skillshot speed | Fast 12 tiles/s, slow orb 6 tiles/s | Estimate from Ezreal [V, S129; I, note 05] |
| Skillshot width and range | 0.75 tile, 8 tiles | Estimate [I, note 05] |
| Telegraph lead | Trash 500 ms, elite 1200 ms, boss 2500 ms, never under 400 ms | Estimate [I, note 05] |
| Aim snap | PvE up to 15°, PvP 0° | Death's Door 15° [U, S84]; estimate |
| Auto-target hysteresis | Keep current pick unless another is ≥ 1 tile closer | Wild Rift fix [V, S115]; 1 tile estimate |
| CC diminishing returns | 100%, 50%, immune; 20 s reset; 6 s cap | WoW 12.1.0 [V, S121] |
| PvP damage | x0.5 | TFS [V, S23] |
| Voice pool | 16 voices; 3 per sound id; 40 ms between starts of one id | Estimate [I, notes 07 and 09] |
| Pitch and volume jitter | ±1 semitone (`random_pitch` 1.059), ±1.5 dB; crits 0 | Estimate [I, note 07] |
| Corpse rot | 120 + 120 + 30 s, last stage fades 1 s | Tibia 300 + 300 + 60 s [V, S33]; shortened estimate |

**Pseudocode.**

Server hit resolution, targeted against aimed (F2, F3, E3). GDScript-like; distances in tiles, times in ms:
```
const STEP_MS := 100                      # server step for movement and projectiles
const PVP_DAMAGE := 0.5                   # TFS halves player-on-player damage
const NEAR_MISS_TILES := 0.5

func resolve_targeted(c: Unit, t: Unit, s: Skill, now: int) -> void:
    if not t.alive or chebyshev(c.tile, t.tile) > s.range_tiles or not has_los(c, t):
        send_to(c, CAST_FAIL, s.id); return
    var outcome := roll_outcome(c, t, s)  # hit, crit, miss, block, immune (formulas out of scope)
    var amount := 0 if outcome in [MISS, BLOCK, IMMUNE] else damage(c, t, s, outcome)
    if is_player(c) and is_player(t): amount = int(amount * PVP_DAMAGE)
    apply_damage(t, amount)               # now: a targeted skill cannot miss through aim
    var impact_ms := 0 if s.melee else int(150.0 * sqrt(float(chebyshev(c.tile, t.tile))))
    broadcast_view(t.tile, HIT, c.id, t.id, s.id, outcome, amount, impact_ms)   # 16 bytes
    if t.hp <= 0: schedule(now + impact_ms, kill.bind(t, c))

func step_projectiles() -> void:          # every STEP_MS; spawned at the caster's server position at cast end
    var dt := STEP_MS / 1000.0            # seconds, because speed is tiles per second
    for p in projectiles.duplicate():
        var a: Vector2 = p.pos
        var b: Vector2 = a + p.vel * dt
        var hit: Unit = null
        for u in hostiles_near_segment(p.owner, a, b):   # sorted by distance from a
            var r: float = p.skill.radius_tiles + u.hurt_radius_tiles
            var d := dist_point_segment(u.pos, a, b)     # favour the target: u.pos NOW, never rewound
            if d <= r: hit = u; break
            var passed := segment_param(u.pos, a, b) < 1.0   # closest point lies behind b: it went past
            if passed and d <= r + NEAR_MISS_TILES and not p.whiffed.has(u.id):
                p.whiffed[u.id] = true
                send_to_pair(p.owner, u, WHIFF, u.id)    # dodger and caster only
        if hit:
            resolve_projectile_hit(p, hit)               # same outcome path, impact_ms = 0
            projectiles.erase(p); continue
        p.left_tiles -= (b - a).length()
        if p.left_tiles <= 0.0 or blocked(a, b):
            broadcast_view(tile_of(b), PROJ_END, p.skill.id, b)   # puff: everyone sees the miss
            projectiles.erase(p); continue
        p.pos = b

func telegraph_circle(src: Unit, center: Vector2, r: float, lead_ms: int, now: int) -> void:
    broadcast_view(tile_of(center), TELEGRAPH, src.id, center, r, now, now + lead_ms)
    schedule(now + lead_ms, resolve_circle.bind(src, center, r))  # resolves when the marker ends
```
Targeted damage applies before the missile lands, as in Tibia [V, S17], and the client delays the number by `impact_ms`. A 12 tiles/s shot moves 1.2 tiles per 0.1 s step, and the segment test catches units between steps. Rewind would swap `u.pos` for a position `latency + interp` ms old; we leave it out on purpose.

Per-entity hitstop on the client (B1, G3). Frames at 60 fps, wall-clock timing, never `Engine.time_scale`:
```
const FRAME_MS := 1000.0 / 60.0           # 16.67 ms
const FRAMES := {NORMAL = 3, HEAVY = 5, CRIT = 6, KILL = 8}   # cap is KILL = 8 f = 133 ms

func on_hit_shown(ev: HitEvent) -> void:  # at impact time
    if ev.attacker_id != my_id and ev.target_id != my_id: return   # others' hits: no hitstop
    var ms := int(round(FRAMES[ev.kind] * FRAME_MS * settings.hitstop))   # 3 f = 50 ms
    freeze(visual_of(ev.attacker_id), ms, false)
    if not (pvp_zone and is_player(ev.target_id)):                  # never on victim players
        freeze(visual_of(ev.target_id), ms, true)

func freeze(v: EntityVisual, ms: int, shake: bool) -> void:
    v.freeze_until = maxi(v.freeze_until, Time.get_ticks_msec() + ms)   # extend, never add
    v.frozen = true; v.shake_px = 1 if shake else 0
    v.anim.pause()                        # the visual child only; the networked root keeps moving

# EntityVisual._process
    if frozen:
        var now := Time.get_ticks_msec()
        if now >= freeze_until:
            frozen = false; offset.x = 0; anim.play()
        elif shake_px > 0:
            offset.x = shake_px if (now / 33) % 2 == 0 else -shake_px  # sprite only; hurtbox stays
```

Trauma plus positional shake on the local camera (B6, B7):
```
const MAX_OFFSET_PX := 6.0                # at 32 px tiles
const DECAY_PER_S := 1.5
var trauma := 0.0
var kick := Vector2.ZERO

func add_trauma(amount: float, src_px := Vector2.ZERO, range_tiles := 0.0) -> void:
    var k := 1.0
    if range_tiles > 0.0:                 # HoH falloff: (range - distance) / range
        k = clampf((range_tiles - my_pos_px.distance_to(src_px) / 32.0) / range_tiles, 0.0, 1.0)
    trauma = minf(1.0, trauma + amount * k)

func _process(delta: float) -> void:
    trauma = maxf(0.0, trauma - DECAY_PER_S * delta)
    var s := trauma * trauma * settings.shake          # trauma squared
    var t := Time.get_ticks_msec() / 1000.0
    kick = kick.lerp(Vector2.ZERO, 1.0 - pow(0.7, delta * 60.0))   # k = 0.3 per 60 fps frame
    var off := Vector2(noise.get_noise_2d(t * 25.0, 0.0), 0.5 * noise.get_noise_2d(0.0, t * 25.0))
    camera.offset = (off * MAX_OFFSET_PX * s + kick).round()       # whole pixels

# on_hit_taken: add_trauma(0.2 + 0.3 * amount / max_hp)
# on_my_crit:   add_trauma(0.3); kick = -aim_dir.normalized() * 2.0   # opposite the shot
# on_slam:      add_trauma(0.6, slam_px, 6.0)
```
At trauma 0.3 the offset is at most 0.54 px, which almost always rounds to 0, so chip damage leaves the camera still. From 1.0, trauma reaches 0 in 0.67 s.

Damage number merge rule (C1, C2, C4):
```
const LIFE_MS := 1000; const FADE_FROM_MS := 833; const RISE_PX := 48.0
const MERGE_MS := 400; const STACK_MS := 250; const STACK_PX := 12.0; const PER_TARGET := 4

func add_number(target_id: int, value: int, kind: int, tier: int, now: int) -> void:
    if tier == OTHERS and not settings.show_others: return
    var list: Array = live.get_or_add(target_id, [])
    for n in list:                        # crits never merge
        if kind != CRIT and n.kind == kind and n.tier == tier and now - n.born < MERGE_MS:
            n.value += value; return      # sum, keep the old age
    if list.size() >= PER_TARGET:
        remove_number(list.pop_front())   # drop the oldest
    var n := Num.new(value, kind, tier, now)
    if list.size() > 0 and now - list.back().born < STACK_MS:
        n.y_off = list.back().y_off + STACK_PX - RISE_PX * (now - list.back().born) / LIFE_MS
    list.append(n)

func number_y(n: Num, now: int, anchor_y: float) -> float:   # Godot y grows downward
    return anchor_y + 8.0 + n.y_off - RISE_PX * (now - n.born) / LIFE_MS

func number_alpha(n: Num, now: int) -> float:
    var age := now - n.born
    return 1.0 if age < FADE_FROM_MS else clampf(float(LIFE_MS - age) / (LIFE_MS - FADE_FROM_MS), 0.0, 1.0)
```
A number spawned 100 ms after the previous one gets `12 - 4.8 = 7.2` px of offset; the old one has risen 4.8 px, so they sit 12 px apart and keep that gap. A 64-number screen cap sits on top. Draw all numbers from one bitmap font in one `_draw()` node, as OTClient does [V, S14].

Spell queue window on the server (G1):
```
const QUEUE_MS := 400

func on_skill_press(p: Player, s: Skill, target_id: int, aim: Vector2, now: int) -> void:
    var ready_at := maxi(maxi(p.gcd_end, p.group_cd_end[s.group]), maxi(p.cd_end.get(s.id, 0), p.cast_end))
    if now >= ready_at:
        try_cast(p, s, target_id, aim, now)          # sets gcd_end = now + 1000, group and own cooldowns
    elif ready_at - now <= QUEUE_MS:
        p.queued = QueuedCast.new(s, target_id, aim) # one slot: the last press wins
        if p.queue_event: cancel(p.queue_event)
        p.queue_event = schedule(ready_at, fire_queued.bind(p))
        send_to(p, QUEUED, s.id)                     # hotbar pulse
    else:
        send_to(p, TOO_EARLY, s.id)                  # Tibia's "You are exhausted"

func fire_queued(p: Player) -> void:
    var q = p.queued
    p.queued = null; p.queue_event = null
    if q: try_cast(p, q.skill, q.target_id, q.aim, now_ms())   # re-checks range and target
```
The queued cast fires on an event at `ready_at`, not on the next 100 ms step, so the queue adds no tick jitter. A press 401 ms early is refused, 400 ms early is queued. A press sent 450 ms before the ready time that spends 100 ms in transit arrives 350 ms early and is kept.

---

## 8. Reference implementation: the Combat Juice Sandbox

`feel-combat-juice-sandbox.html` [S3] is one hand-written page of plain JavaScript on a **320×180** canvas, scaled with pixelated rendering at an integer scale where it fits. It plays the nine layers of §7 and shows each layer's cost live. Its design choices are ours [I], every number is illustrative, and it loads no external assets; the bitmap font data is copied from the NPC Dialog Sandbox [S2].

**The arena.** Stone floor, pillars and torches on 16x16 px tiles, half of Asterion's 32 px, so every pixel size is half the Asterion value (a 48 px rise becomes 24 px, the 6 px shake cap 3 px). The player walks in 4 directions with anticipation, strike and recovery frames and a smear on melee swings.

**The fights.** PvE has a training dummy that never dies, 3 to 5 chasing melee mobs, a caster that telegraphs a circle and a line, and an elite whose slam uses positional shake. PvP has 1 to 3 scripted enemy players who strafe, sometimes dodge and carry DR pips. An "allied players" slider adds 0 to 30 allies with their own effects.

**Hybrid combat.** Click or Tab targets with a ring and a target frame. Auto-attack every 2000 ms (toggle 1 s). A homing bolt and an instant strike are targeted; a line skillshot, a cone and a delayed ground circle are aimed, previewed while held, with a quick-cast toggle. Misses puff, near misses whiff. Hotbar 1 to 6, a 1000 ms GCD and a queue slider from 0 to 400 ms (start 400) with a press-and-fire timeline. Targeting modes are tab only, click, soft lock (15 degree snap in PvE) and free aim.

**Controls.** A juice master slider, per-effect toggles, four presets ("No juice", "Tibia classic", "Modern ARPG", "Asterion recommended"), PvE or PvP, server step 50, 100 or 600 ms, latency 0 to 400 ms, prediction modes with a "phantom number" demo, a global hitstop toggle, effect tiers and accessibility switches. V cycles views, P pauses, M plays at 0.25x.

**The efficiency HUD.** Smoothed `performance.now()` timings per layer against a 16.7 ms bar, and counters for particles, numbers, sounds, blits and server bytes per second.

**Thumbnail.** The `data-demo="showcase"` button freezes a crit on the elite (flash, big number, sparks), a skillshot in flight, an enemy circle filling, the target ring and frame, and a few dimmed ally numbers.

**Simplifications (honest list)** [I]. Canvas 2D on the CPU, so HUD times compare with §6d, not Godot. "Server" and "client" share one page; latency is a timer and bytes are counted, not sent. Simulated players follow scripts.

---
## 9. Gem findings

Licences, stars and push dates were read from the GitHub API and LICENSE files on 2026-11-11 [V, note 08]. Godot "hitstop" repos from late 2026 have 0 to 13 stars and are unproven. The GPL Tibia servers are the best references and the worst code to paste. **Flags:** **Low** = MIT/BSD/Apache/CC0; **LGPL** = fine as a separate library; **Copyleft** = GPL/AGPL/CC BY-SA, study and re-implement; **None** = no licence, study only.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| Phantom Camera | https://github.com/ramokz/phantom-camera | MIT | v0.11.0.4 (2026-10-27), 3,657 stars, Godot 4.4+ | Trauma squared noise shake with emitter layers, follow, dead zones | Low |
| LimboAI | https://github.com/limbonaut/limboai | MIT | v1.8.1, 3,117 stars | Behaviour trees and state machines for mobs; web needs its module templates | Low |
| Beehave | https://github.com/bitbrain/beehave | MIT | 3,325 stars, pushed 2026-09-20 | Pure GDScript behaviour trees for attack, flee and cast | Low |
| Godot State Charts | https://github.com/derkork/godot-statecharts | MIT | 1,628 stars | Parallel states: anticipation, active, recovery next to "stunned" | Low |
| Aseprite Wizard | https://github.com/viniciusgerevini/godot-aseprite-wizard | MIT | 1,400 stars, pushed 2026-11-11 | Imports Aseprite tags and frame times, so swing timing stays authored in Aseprite | Low |
| godot-sfxr | https://github.com/tomeyro/godot-sfxr | MIT | 208 stars, last push 2023-09-18 | sfxr presets inside the editor, shipped as normal samples | Low |
| jsfxr | https://github.com/chr15m/jsfxr | Unlicense | 464 stars | Hit, hurt, explosion and coin presets in the browser | Low (public domain) |
| netfox | https://github.com/foxssake/netfox | MIT | Godot 4 addon | Timing, prediction and reconciliation ideas; overkill as a whole for a tick MMO | Low |
| Cobo godot-hitstop | https://github.com/Cobo-Makes-Games/godot-hitstop | MIT | 0 stars, created 2026-10-23 | Per-node "pose mode" freeze, the right design; unproven | Low (young, test first) |
| LabelUpX | https://github.com/godot-x/label-up | MIT | 10 stars, Godot 4.5+ | A number-style Resource (distance 80, duration 1.2, arc or wiggle); "thousands of labels" is unbenchmarked [V, vendor] | Low |
| OTClient (edubart, opentibiabr) | https://github.com/edubart/otclient ; https://github.com/opentibiabr/otclient | API reports NOASSERTION, MIT-style header | Reference Tibia client | Animated text, missiles, effects, target squares, battle list | None until the LICENSE is checked |
| The Forgotten Server | https://github.com/otland/forgottenserver | GPL-2.0 | 1,844 stars | Swing timer, exhaust, spell groups, PvP halving, corpses, packet sizes | Copyleft |
| Canary | https://github.com/opentibiabr/canary | GPL-2.0 | 668 stars | Source tags per spectator, crit effects, PvP multipliers, rot stages | Copyleft |
| Heroes of Hammerwatch scripts | https://github.com/exp111/HeroesOfHammerwatch | None (unofficial mirror of shipped game scripts) | Complete game scripts | Hit tint, positional shake, castpoint, swept melee | None (study only) |
| Celeste | https://github.com/NoelFB/Celeste | MIT (Player class source) | 4,003 stars | Freeze and shake timings in readable C# | Low |
| Juicy Breakout | https://github.com/grapefrukt/juicy-breakout | Zlib | 692 stars, 2017 | One flag per juice effect, a model for the Sandbox panel | Low (zlib) |

**Picks.** Phantom Camera for shake. Our own hitstop on native knobs (`AnimationPlayer.pause`, `speed_scale`, `process_mode` on the visual child) [V, S178; I, note 08]. One `_draw()` node and a bitmap font for numbers. State Charts or Beehave for mobs. Read the Tibia sources for rules and write our own code [I].

---

## 10. Learnings and anti-patterns

**Learnings.**
1. **Weight lives in the hold.** A fixed 150 ms strike with a longer wind-up and hold sells heavy weapons [V, S80].
2. **Freeze two sprites, never the world**, only when you are involved, capped at 133 ms [V, S85, S86; I].
3. **Your camera is yours.** Trauma squared from your own hits and falloff for slams [V, S93, S58; I].
4. **Merge and cap numbers.** Aggregation cut throttled cost from 13.18 to 4.18 ms [V, S6, S39, S4].
5. **Predict the start, confirm the outcome** [V, S147; I].
6. **Favour the target, and resolve AoEs when the marker ends** [V, S131; I].
7. **One queue slot, last press wins, 400 ms** [V, S104, S117].
8. **Tap targets, drag aims, and a tap never leads** [V, S112, S113; I].
9. **Tag every effect and sound by who caused it** [V, S31, S152].
10. **PvP keeps the victim in control** [V, S121, S23; I].

**Anti-patterns.**
1. **`Engine.time_scale` hitstop** on a networked client [V, S179, S174].
2. **Global shake from other players' spells** [V, S59; I].
3. **Predicted damage numbers** that turn into phantom hits [I, note 06].
4. **Favour-the-shooter rewind** on dodgeable skills [V, S150; I].
5. **Per-frame flash compositing**, 16 to 442 ms [V, S4].
6. **Cached running totals**, 43.2 ms throttled [V, S4].
7. **A PvP lock that guarantees hits** [V, S109].
8. **Density settings that hide hostile telegraphs** [V, S152].
9. **Colour-only telegraphs and red on green** [V, S136, S137].
10. **A 400 ms swing stretched over a 2 s timer** [I, note 10].

---

## 11. "See it in action" index

| # | Game | Combat idea | URL |
|---|---|---|---|
| 1 | Tibia | Damage numbers rise 48 px and merge inside 400 ms | https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp |
| 2 | Tibia | Missiles fly 150 ms times the square root of tiles | https://github.com/edubart/otclient/blob/master/src/client/missile.cpp |
| 3 | Tibia | Target square and black attacker square | https://github.com/edubart/otclient/blob/master/src/client/creature.cpp |
| 4 | Tibia | Battle list sort and filters as the target cycle | https://github.com/mehah/otclient/blob/main/modules/game_battle/battle.lua |
| 5 | Tibia | Sound tagged OWN, OTHERS, CREATURES per spectator | https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp |
| 6 | Old School RuneScape | Four hitsplat slots, blue zero, trimmed max hit | https://oldschool.runescape.wiki/w/Hitsplat |
| 7 | Old School RuneScape | 600 ms tick and prayer flicking | https://oldschool.runescape.wiki/w/Game_tick |
| 8 | Ragnarok Online | Damage frame timing sent in the packet | https://github.com/rathena/rathena/blob/master/src/map/clif.cpp |
| 9 | MapleStory | Grey invincibility pulse and knockback hop (fan client) | https://github.com/filoper/ms-client/blob/master/src/Character/Char.cpp |
| 10 | Albion Online | Interrupt with a 0.3 s stun | https://www.albiondatabase.com/spells/interrupt |
| 11 | Realm of the Mad God | Players ask to hide ally projectiles | https://www.realmeye.com/forum/t/ally-shoot-hide-projectile-no-longer-works-now-no-longer-shows-shooting-animations/68712 |
| 12 | Heroes of Hammerwatch | Positional shake with distance falloff | https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/Utils/ScreenShake.as |
| 13 | Heroes of Hammerwatch | 100 ms red hit tint and purple immune flash | https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/Behaviors/Actors/Enemies/CompositeActorBehavior.as |
| 14 | Nuclear Throne | Weapon kick, freeze frames and shake options | https://yal.cc/r/17/ntt/objects |
| 15 | Enter the Gungeon | Dodge roll with early invulnerability | https://enterthegungeon.wiki.gg/wiki/Dodge_Roll_(Move) |
| 16 | Diablo II | Cast frames and hit recovery at 25 fps | https://maxroll.gg/d2/resources/breakpoints-animations |
| 17 | Diablo III | Orange big-hit rule with a decaying benchmark | https://blizzardwatch.com/2016/01/25/diablo-damage-numbers-changed/ |
| 18 | Celeste | 50 ms freeze and directional shake on dash | https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs |
| 19 | Super Smash Bros. Ultimate | Hitlag formula and player-count factor | https://www.ssbwiki.com/Hitlag |
| 20 | Street Fighter | Impact freeze of 9, 11 and 13 frames | https://sonichurricane.com/?p=1043 |
| 21 | World of Warcraft | Spell queue window, last press wins | https://maxroll.gg/wow/resources/spell-queue-window |
| 22 | World of Warcraft | Diminishing returns and knockback immunity | https://warcraft.wiki.gg/wiki/Diminishing_returns |
| 23 | World of Warcraft | Spell Density for other players' effects | https://www.icy-veins.com/wow/news/too-many-spells-on-screen-patch-11-2-fixes-that-with-one-simple-setting/ |
| 24 | Final Fantasy XIV | Ground markers that snapshot when they vanish | https://ffxiv.consolegameswiki.com/wiki/AoE_marker |
| 25 | Guild Wars 2 | Action camera and autotarget | https://www.guildwars2.com/en/news/introducing-the-action-camera/ |
| 26 | League of Legends | Ezreal's line skillshot | https://wiki.leagueoflegends.com/en-us/Ezreal |
| 27 | League of Legends | Clarity rules for hitboxes and projectiles | https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/ |
| 28 | League of Legends: Wild Rift | Tap-cast priority and aimed drag | https://wildrift.leagueoflegends.com/en-gb/news/dev/dev-irelia-dances-her-way-to-wild-rift |
| 29 | Brawl Stars | Tap quick-fire, drag to aim | https://brawlstars.fandom.com/wiki/Beginner%27s_Guide |
| 30 | Path of Exile | Lockstep against Predictive | https://www.pathofexile.com/forum/view-thread/1262596 |
| 31 | New World | PvP-only target lock rules | https://www.newworld.com/en-gb/game/releases/season-of-opportunity |
| 32 | Lost Ark | Blue glow for counterable attacks | https://vulkk.com/2022/02/11/how-to-use-advanced-combat-mechanics-in-lost-ark |
| 33 | Touhou | 5 px hitbox and graze | https://touhou.fandom.com/wiki/Imperishable_Night/Gameplay |
| 34 | Vampire Survivors | Toggles for numbers, flashes and shake | https://www.familygamingdatabase.com/accessibility/Vampire+Survivors |

---

## 12. What remains unverified (and corrections)

**Corrections made during research** (note 11 checked each against its source)
1. **Smash Ultimate's 8-player factor.** Not a flat x0.75 but the end of a ramp, `p = 1 - ((H - 10) / 20) × (1 - pc)`, with no effect at 10 frames or less; an 8-player 20-frame hit gets x0.875 [V, S86].
2. **Godot per-instance uniforms.** Missing only up to 4.3. PR #99230 (merged 2024-12-20, milestone 4.4) added 2D instance uniforms in both renderers, with follow-up #102503 [V, S176, S177], so a hit flash no longer needs the `self_modulate` workaround.
3. **WoW soft target arc.** `SoftTargetEnemyArc` defaults to 2, anywhere in the tab area, not 1 as a forum post said [V, S104].
4. **WoW diminishing returns.** "100/50/25 over 18 s" is out of date; since 12.0.0 and 12.1.0 it is 100%, 50%, immune with a 20 s reset [V, S121].
5. **Path of Exile Auto mode.** The 150 ms switch exists only on the community wiki [U, S144; V, S143].
6. **Sandbox spec.** This report changes several spec numbers; the dated list is at the end of `SANDBOX-SPEC.md`.

**Single-source and derived values.** MapleStory numbers come from a fan reimplementation [V, S49, S51], Heroes of Hammerwatch numbers from an unofficial script mirror [V, S57], the Hades hit slow from a mod [U, S77] and FFXIV locks from player analysis [V, S120]. LoL unit conversions, proposed message sizes and every preset marked "estimate" are ours [I].

**Still unverified [U]**
- Nijman's "sleep" length (20 ms or 0.2 s) and his 6 px camera kick, a secondary quote [U, S92, S66].
- GGST and SF6 frame data from snippets of blocked pages [U, S88, S89].
- Cobo's claim that `speed_scale = 0` re-fires a method-track key [U, S175].
- Hades' 90 degree and Death's Door's 15 degree aim assist, from one mirrored video [U, S84].
- Apex's 250 ms rewind cap [U, S158]; League's 30 Hz and VALORANT's 141 ms [U, note 06].
- A Blizzard source for the 400 ms queue cap [U, S117].
- Gungeon's i-frames, first half or three quarters [V, S67; U, S68].
- Godot web `pitch_scale` in Sample mode, batching with instance uniforms, and any Godot frame time [U, notes 07 and 08].
- Telegraph lead times in ms, and frame data for Hyper Light Drifter, Hades, CrossCode, Children of Morta and Eastward [U, notes 02 and 10].
- No phone, Chromebook or mobile audio latency was measured [S4].

---

## 13. Prototype roadmap for Godot 4 (web, Compatibility)

1. **Measure first.** Run `juicebench.html` [S4] on a low-end Android phone and an older iPhone, then a 320x180 Compatibility export with 50 to 1000 numbers in one `_draw()` node, 100 instance-uniform flashes and 2000 CPUParticles2D sparks, reading `RENDER_TOTAL_DRAW_CALLS_IN_FRAME`.
2. **Server core.** A 100 ms step, per-entity swings and casts, group cooldowns, the 400 ms queue, 16-byte `HIT` events, and 0 to 300 ms of artificial latency from day one.
3. **Data.** Aseprite frame times through Aseprite Wizard, one `HitFeedback` Resource per skill and outcome, and a `FeedbackSettings` autoload for player multipliers [I, note 08].
4. **Impact and camera.** Visual children with wall-clock hitstop, an instance-uniform flash, recoil tweens, prewarmed 75 ms flipbooks, trauma shake on `Camera2D.offset` in whole pixels.
5. **Text, targeting, aiming.** The merge rule and tiers, target marks, timestamped cast bars, tile telegraphs with a hatch, the battle list, tap and drag with hysteresis.
6. **Audio and PvP.** A 16-voice pool with tags, sounds registered as samples, the PvP rules in data, then a 30-player test at 150 ms with tiers on and off.

---
## 14. Sources

Numbered for [S#] references, all from research notes 01 to 11. "Not fetched", "403", "snippet" or "search summary" means the page was not read in full. Code was read at branch heads on 2026-11-11.

**Series and our own work**
1. Kingsfoil Artifacts library: https://kingsfoil-artifacts.netlify.app
2. Game feel #1, NPCs and dialog: https://kingsfoil-artifacts.netlify.app/feel-npc-dialog-topdown-pixel.html
3. Combat Juice Sandbox: `feel-combat-juice-sandbox.html` (companion page)
4. Kingsfoil juice benchmark, our own measurement (November 2026): `studies/feel-combat-juice/notes/bench/juicebench.html`, with `run.py`, `runall.sh`, `summarize.py`, `results-*.json` and `summary-table.md`. Apple M4 Pro (14 cores, 48 GB), macOS 26.5.1, Chromium 153.0.8010.12 under Playwright; ANGLE Metal, Metal with a 6x CPU throttle, and SwiftShader; 30 warm-up frames, then 200 timed frames (100 throttled and in software). No phone was measured.

**Tibia: OTClient, TFS and Canary**
5. OTClient `const.h`: https://github.com/edubart/otclient/blob/master/src/client/const.h
6. OTClient `animatedtext.cpp`: https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp
7. OTClient `map.cpp`: https://github.com/edubart/otclient/blob/master/src/client/map.cpp
8. OTClient `missile.cpp`: https://github.com/edubart/otclient/blob/master/src/client/missile.cpp
9. OTClient `effect.cpp` and `effect.h`: https://github.com/edubart/otclient/blob/master/src/client/effect.cpp
10. OTClient `creature.cpp`: https://github.com/edubart/otclient/blob/master/src/client/creature.cpp
11. OTClient `game.cpp`: https://github.com/edubart/otclient/blob/master/src/client/game.cpp
12. OTClient `uicreaturebutton.lua`: https://github.com/edubart/otclient/blob/master/modules/gamelib/ui/uicreaturebutton.lua
13. OTClient `localplayer.cpp`: https://github.com/edubart/otclient/blob/master/src/client/localplayer.cpp
14. opentibiabr OTClient `gameconfig.h`: https://github.com/opentibiabr/otclient/blob/main/src/client/gameconfig.h
15. mehah OTClient `battle.lua`: https://github.com/mehah/otclient/blob/main/modules/game_battle/battle.lua
16. TFS `player.cpp`: https://github.com/otland/forgottenserver/blob/master/src/player.cpp
17. TFS `game.cpp`: https://github.com/otland/forgottenserver/blob/master/src/game.cpp
18. TFS `const.h`: https://github.com/otland/forgottenserver/blob/master/src/const.h
19. TFS `creature.h`: https://github.com/otland/forgottenserver/blob/master/src/creature.h
20. TFS `scheduler.h`: https://github.com/otland/forgottenserver/blob/master/src/scheduler.h
21. TFS `configmanager.cpp`: https://github.com/otland/forgottenserver/blob/master/src/configmanager.cpp
22. TFS `protocolgame.cpp`: https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
23. TFS `combat.cpp`: https://github.com/otland/forgottenserver/blob/master/src/combat.cpp
24. TFS `vocations.xml`: https://github.com/otland/forgottenserver/blob/master/data/XML/vocations.xml
25. TFS `creature.cpp`: https://github.com/otland/forgottenserver/blob/master/src/creature.cpp
26. TFS `monster.cpp`: https://github.com/otland/forgottenserver/blob/master/src/monster.cpp
27. Canary `config.lua.dist`: https://github.com/opentibiabr/canary/blob/main/config.lua.dist
28. Canary `energy_strike.lua`: https://github.com/opentibiabr/canary/blob/main/data/scripts/spells/attack/energy_strike.lua
29. Canary `light_healing.lua`: https://github.com/opentibiabr/canary/blob/main/data/scripts/spells/healing/light_healing.lua
30. Canary `spells.cpp`: https://github.com/opentibiabr/canary/blob/main/src/creatures/combat/spells.cpp
31. Canary `game.cpp`: https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp
32. Canary `creatures_definitions.hpp`: https://github.com/opentibiabr/canary/blob/main/src/creatures/creatures_definitions.hpp
33. Canary `items.xml`: https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
34. Canary `protocolgame.cpp`: https://github.com/opentibiabr/canary/blob/main/src/server/network/protocol/protocolgame.cpp
35. TibiaQA, single-target hunting with the battle window: https://www.tibiaqa.com/3155/how-to-do-single-target-hunting-with-the-battle-window-in-an-efficient-way
36. Tibia own and other battle sound settings (secondary): https://tibiavip.app/home/news?id=2475

**RuneScape, Ragnarok Online, MapleStory, Ultima Online, Albion and Realm of the Mad God**
37. RuneLite `Constants.java`: https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/Constants.java
38. RuneLite `HitSplatDefinition.java`: https://github.com/runelite/runelite/blob/master/cache/src/main/java/net/runelite/cache/definitions/HitSplatDefinition.java
39. devious-client `Actor.java`: https://github.com/jbx5/devious-client/blob/master/runescape-client/src/main/java/Actor.java
40. OSRS Wiki, Game tick: https://oldschool.runescape.wiki/w/Game_tick
41. OSRS Wiki, Hitsplat: https://oldschool.runescape.wiki/w/Hitsplat
42. OSRS Wiki, Attack speed: https://oldschool.runescape.wiki/w/Attack_speed
43. OSRS Wiki, Hit delay: https://oldschool.runescape.wiki/w/Hit_delay
44. OSRS Wiki, Prayer flicking: https://oldschool.runescape.wiki/w/Prayer#Prayer_flicking
45. OSRS Wiki, Tick manipulation: https://oldschool.runescape.wiki/w/Tick_manipulation
46. OSRS Wiki, Grave: https://oldschool.runescape.wiki/w/Grave
47. rAthena `clif.cpp`: https://github.com/rathena/rathena/blob/master/src/map/clif.cpp
48. rAthena `battle.conf`: https://github.com/rathena/rathena/blob/master/conf/battle/battle.conf
49. MapleStory fan client `Char.cpp`: https://github.com/filoper/ms-client/blob/master/src/Character/Char.cpp
50. MapleStory fan client `Player.cpp`: https://github.com/filoper/ms-client/blob/master/src/Character/Player.cpp
51. MapleStory fan client `DamageNumber.cpp`: https://github.com/filoper/ms-client/blob/master/src/Gameplay/Combat/DamageNumber.cpp
52. ServUO `BaseWeapon.cs`: https://github.com/ServUO/ServUO/blob/master/Scripts/Items/Equipment/Weapons/BaseWeapon.cs
53. Albion Database, Interrupt: https://www.albiondatabase.com/spells/interrupt
54. Albion Dragonfire Patch 2 balance changes: https://patchbot.io/games/albion-online/articles/1532-combat-balance-changes-dragonfire-patch-2
55. Albion, Beyond the Veil patch 12 (channel movement): https://devtrackers.gg/albion/p/fc08e921-14-august-2023-beyond-the-veil-patch-12
56. RealmEye, Ally Shoot hide projectile: https://www.realmeye.com/forum/t/ally-shoot-hide-projectile-no-longer-works-now-no-longer-shows-shooting-animations/68712

**Pixel and top-down action games**
57. Heroes of Hammerwatch `CompositeActorBehavior.as` (unofficial script mirror): https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/Behaviors/Actors/Enemies/CompositeActorBehavior.as
58. Heroes of Hammerwatch `ScreenShake.as`: https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/Utils/ScreenShake.as
59. Heroes of Hammerwatch `ScreenShaker.as`: https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/Behaviors/Actions/ScreenShaker.as
60. Heroes of Hammerwatch `BaseGameMode.as`: https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/GameModes/BaseGameMode.as
61. Heroes of Hammerwatch `FloatingText.as`: https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/FloatingText.as
62. Heroes of Hammerwatch `ActiveSkill.as`: https://github.com/exp111/HeroesOfHammerwatch/blob/master/assets/scripts/Behaviors/Actors/Skills/ActiveSkill.as
63. Heroes of Hammerwatch `MeleeSwing.as`: https://github.com/exp111/HeroesOfHammerwatch/blob/master/assets/scripts/Behaviors/Actors/Skills/MeleeSwing.as
64. Heroes of Hammerwatch `AnimString.as`: https://github.com/exp111/HeroesOfHammerwatch/blob/master/assets/scripts/Behaviors/AnimString.as
65. Nuclear Throne Together, objects reference: https://yal.cc/r/17/ntt/objects
66. Rock Paper Shotgun, Nijman on Nuclear Throne's feel, 2013 (not fetched): http://www.rockpapershotgun.com/2013/10/21/interview-jan-willem-nijman-on-nuclear-thrones-feel/
67. Enter the Gungeon wiki, Dodge Roll: https://enterthegungeon.wiki.gg/wiki/Dodge_Roll_(Move)
68. Enter the Gungeon, i-frame Steam thread: https://steamcommunity.com/app/311690/discussions/0/368542585858479737
69. Maxroll, Diablo II breakpoints and animations: https://maxroll.gg/d2/resources/breakpoints-animations
70. The Amazon Basin, Diablo II attack speed: https://theamazonbasin.com/wiki/index.php/Attack_speed
71. d2mods, 16 directions: https://www.d2mods.info/forum/kb/viewarticle?a=265
72. OpenDiablo2 COF format: https://github.com/OpenDiablo2/cof
73. Family Gaming Database, Vampire Survivors accessibility: https://www.familygamingdatabase.com/accessibility/Vampire+Survivors
74. Vampire Survivors Steam thread on numbers and lag: https://steamcommunity.com/app/1794680/discussions/0/3194745173775130766
75. Vampire Survivors Steam thread on disabling numbers: https://steamcommunity.com/app/1794680/discussions/0/4631482569784862180
76. Kotaku, Hades II settings: https://kotaku.com/hades-2-early-access-god-mode-autofire-timer-1851461987
77. Hades-format weapon data in the OlympusExtra mod: https://github.com/AlexKage69/OlympusExtra/blob/main/Weapons/HammerWeapon.lua
78. Celeste `Player.cs`: https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
79. Slynyrd Pixelblog 9, melee attacks (2018): https://slynyrd.com/blog/2018/9/8/pixelblog-9-melee-attacks
80. Slynyrd Pixelblog 56, top-down attack (2025): https://www.slynyrd.com/blog/2025/5/23/pixelblog-56-top-down-character-attack-animation
81. Slynyrd Pixelblog 58, top-down animation part 3 (2025): https://www.slynyrd.com/blog/2025/10/2/pixelblog-58-top-down-character-animation-part-3
82. Touhou wiki, Imperishable Night gameplay: https://touhou.fandom.com/wiki/Imperishable_Night/Gameplay
83. Touhou wiki, Embodiment of Scarlet Devil gameplay: https://touhou.fandom.com/wiki/Embodiment_of_Scarlet_Devil:_Gameplay?oldid=2565
84. Hades and Death's Door aim assist video (mirror, search summary): https://tw.voicetube.com/videos/173139

**Feel theory, frame data and research**
85. Sakurai, Famitsu vol. 490 (Source Gaming translation): https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/
86. SmashWiki, Hitlag: https://www.ssbwiki.com/Hitlag
87. Sonic Hurricane, Impact Freeze: https://sonichurricane.com/?p=1043
88. Dustloop, GGST attack attributes (403, snippet): https://dustloop.com/w/GGST/Attack_Attributes
89. SuperCombo, SF6 frame data (bot check, snippet): https://srk.shib.live/w/Street_Fighter_6/Terry/Data
90. PC Gamer, Monster Hunter Wilds hitstop: https://www.pcgamer.com/games/rpg/capcom-if-youre-listening-monster-hunter-wilds-needs-its-hitstop-back
91. Nijman, "The art of screenshake" (video): https://www.youtube.com/watch?v=AJdEqssNZ-U
92. Nijman trick list with timestamps: https://theengineeringofconsciousexperience.com/jan-willem-nijman-vlambeer-the-art-of-screenshake/
93. Eiserloh, Juicing Your Cameras slides (GDC 2016): http://www.mathforgameprogrammers.com/gdc2016/GDC2016_Eiserloh_Squirrel_JuicingYourCameras.pdf
94. Jonasson and Purho, Juice it or lose it (GDC Europe 2012): https://gdcvault.com/play/1016487/Juice-It-or-Lose
95. Kao 2020, juiciness in an action RPG: https://dblp.uni-trier.de/rec/journals/entcom/Kao20.html
96. Smets and van der Spek 2021, That sound's juicy: https://research.tue.nl/en/publications/that-sounds-juicy-exploring-juicy-audio-effects-in-video-games/
97. Tomizawa and Ishikawa 2024, dynamic hit stop: https://scitepress.org/publishedPapers/2024/124614/pdf/index.html
98. Lin et al. 2022, What features influence impact feel: https://arxiv.org/abs/2208.06155
99. KAKEN 22K18649, screen shake and agency: https://kaken.nii.ac.jp/en/report/KAKENHI-PROJECT-22K18649/22K186492023hokoku
100. Claypool and Claypool 2006, latency and player actions: https://ftp.cs.wpi.edu/pub/techreports/pdf/06-13.pdf
101. Xbox Accessibility Guideline 117: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117
102. Xbox Accessibility Guideline 118: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/118

**Targeting**
103. warcraft.wiki.gg, TargetNearestEnemy: https://warcraft.wiki.gg/wiki/API_TargetNearestEnemy
104. warcraft.wiki.gg, Console variables complete list: https://warcraft.wiki.gg/wiki/Console_variables/Complete_list
105. Blizzard Watch, WoW 7.2 PTR notes: https://blizzardwatch.com/2017/01/20/wow-patch-7-2-ptr-patch-notes/
106. Game Rant, Dragonflight action targeting: https://gamerant.com/world-of-warcraft-dragonflight-soft-targeting-options-action-interact-key/
107. Blizzard forums, Tab target (player reports): https://us.forums.blizzard.com/en/wow/t/tab-target/1344971
108. Guild Wars 2 wiki, Options: https://wiki.guildwars2.com/wiki/Options
109. MMOBomb, New World Aeternum target lock: https://www.mmobomb.com/news/no-target-lock-pvp-isn-t-going-away-new-world-aeternum-launch-but-getting-last-minute-changes
110. New World, Season of Opportunity notes: https://www.newworld.com/en-gb/game/releases/season-of-opportunity
111. FFXIV wiki, Controls: https://ffxiv.consolegameswiki.com/wiki/Controls
112. Brawl Stars wiki, Beginner's Guide: https://brawlstars.fandom.com/wiki/Beginner%27s_Guide
113. ONE Esports, Wild Rift guide: https://www.oneesports.gg/wild-rift/the-ultimate-guide-to-wild-rift-for-league-of-legends-players/
114. Player Assist, Wild Rift targeting priority and lock filtering: https://playerassist.com/league-legends-wild-rift-change-targeting-priority-target-lock-filtering/
115. Riot dev reply, Wild Rift targeting system (2021): https://devtrackers.gg/wildrift/p/6ea4c94a-the-targeting-system
116. Wild Rift dev blog, Irelia (2021-05-31): https://wildrift.leagueoflegends.com/en-gb/news/dev/dev-irelia-dances-her-way-to-wild-rift

**Queues, locks and PvP**
117. Maxroll, WoW spell queue window: https://maxroll.gg/wow/resources/spell-queue-window
118. warcraft.wiki.gg, Global cooldown: https://warcraft.wiki.gg/wiki/Global_cooldown
119. WoW is Classic, spell batching PTR: https://www.wowisclassic.com/en/news/spell-batching-impact-ptr/
120. FFXIV forum, animation lock analysis: https://forum.square-enix.com/ffxiv/threads/444667
121. warcraft.wiki.gg, Diminishing returns: https://warcraft.wiki.gg/wiki/Diminishing_returns
122. warcraft.wiki.gg, Dampening: https://warcraft.wiki.gg/wiki/Dampening
123. Guild Wars 2 wiki, Aftercast (500, snippet): https://wiki.guildwars2.com/wiki/Aftercast
124. Maxroll, Lost Ark KR balance patch February 2025: https://maxroll.gg/lost-ark/news/kr-balance-patch-february-2025
125. League of Legends wiki, Basic attack: https://wiki.leagueoflegends.com/en-us/Basic_attack
126. Liquipedia, Cast backswing: https://liquipedia.net/dota2/Cast_backswing
127. League of Legends wiki, Hotkeys: https://wiki.leagueoflegends.com/en-us/Hotkeys
128. MOBAchampion, quick cast: https://www.mobachampion.com/blog/quick-cast/

**Telegraphs, skillshots and combat text**
129. League of Legends wiki, Ezreal: https://wiki.leagueoflegends.com/en-us/Ezreal
130. Riot, Clarity in League (2021-03-12): https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/
131. FFXIV wiki, AoE marker: https://ffxiv.consolegameswiki.com/wiki/AoE_marker
132. Akh Morning, Raiding fundamentals: https://akhmorning.com/resources/raiding-fundamentals
133. Icy Veins, FFXIV healer combat mechanics (403, snippet): https://www.icy-veins.com/ffxiv/healer-combat-mechanics
134. Vulkk, Lost Ark advanced combat mechanics: https://vulkk.com/2022/02/11/how-to-use-advanced-combat-mechanics-in-lost-ark
135. Hades II has a legibility problem: https://nex-3.com/blog/hades-ii-has-a-legibility-problem/
136. Filament Games, colour blindness: https://www.filamentgames.com/blog/color-blindness-accessibility-in-video-games
137. ESO forum, red circles on grass: https://forums.elderscrollsonline.com/en/discussion/comment/3950601
138. Blizzard Watch, Diablo III damage numbers changed: https://blizzardwatch.com/2016/01/25/diablo-damage-numbers-changed/
139. Diablo IV forum, the four damage colours: https://us.forums.blizzard.com/en/d4/t/what-are-the-four-damage-colors-please-normal-crit-overpower-and/203037
140. PC Gamer, Path of Exile 2 and runaway damage numbers: https://www.pcgamer.com/games/rpg/we-dont-have-to-worry-about-trillions-of-damage-path-of-exile-2-is-trying-to-avoid-diablo-4s-game-breaking-damage-numbers-director-says
141. Path of Exile 2 Steam thread, numbers only on bosses: https://steamcommunity.com/app/2694490/discussions/0/594008672803320028
142. warcraft.wiki.gg, UnitCastingInfo: https://warcraft.wiki.gg/wiki/API:UnitCastingInfo

**Netcode and crowds**
143. Path of Exile, Update on Deterministic Lockstep (2015-05-07): https://www.pathofexile.com/forum/view-thread/1262596
144. PoE wiki, Desync (community, search summary): https://poewiki.net/wiki/Desync
145. Edgegap, Overwatch netcode deep dive (secondary): https://edgegap.com/blog/game-backend-deep-dive-overwatch-2016-netcode-architecture-rollback
146. Sohu, Chinese transcript of Tim Ford's GDC 2017 talk: https://www.sohu.com/a/148848770_466876
147. Gambetta, client-side prediction and server reconciliation: https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html
148. Gambetta, lag compensation: https://www.gabrielgambetta.com/lag-compensation.html
149. Valve, Source multiplayer networking: https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking
150. Valve, Lag compensation: https://developer.valvesoftware.com/wiki/Lag_Compensation
151. Riot, Peeking into VALORANT's netcode: https://technology.riotgames.com/node/111
152. Icy Veins, WoW 11.2 spell density: https://www.icy-veins.com/wow/news/too-many-spells-on-screen-patch-11-2-fixes-that-with-one-simple-setting/
153. Blizzard Watch, spell density in 11.2: https://blizzardwatch.com/2025/07/28/blizzard-adding-new-ways-reduce-spell-density-better-performance-visibility-patch-11-2
154. FFXIV Lodestone, battle effect text command: https://na.finalfantasyxiv.com/lodestone/playguide/db/text_command/9241c2b27da/
155. FFXIV UI guide, battle effect settings: https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_bteffect.html
156. Mein-MMO, Diablo IV effect flood: https://mein-mmo.de/en/diablo-4-players-are-annoyed-by-the-flood-of-effects-like-in-awheres-waldo-book,1162644
157. Godot docs, high-level multiplayer: https://docs.godotengine.org/en/stable/tutorials/networking/high_level_multiplayer.html
158. EA forums, Apex rewind cap claim (hearsay): https://forums.ea.com/discussions/apex-legends-feedback-en/stop-rewarding-laggers-limit-client-side-hit-registration-to-200ms-in-the-past/8435746/replies/8435749

**Audio, crits and death**
159. Godot docs, AudioStreamRandomizer: https://docs.godotengine.org/en/stable/classes/class_audiostreamrandomizer.html
160. Godot docs, AudioStreamPlayer2D: https://docs.godotengine.org/en/stable/classes/class_audiostreamplayer2d.html
161. Godot, web export progress report for 4.3: https://godotengine.org/article/progress-report-web-export-in-4-3/
162. Godot 4.3 docs, audio streams: https://docs.godotengine.org/en/4.3/tutorials/audio/audio_streams.html
163. Chrome, autoplay policy: https://developer.chrome.com/blog/autoplay
164. FMOD Core, managing resources: https://d1s9dnlmdewoh1.cloudfront.net/2.03/api/managing-resources-in-the-core-api.html
165. Blizzard, Diablo IV quarterly update October 2021: https://news.blizzard.com/en-us/article/23731236/diablo-iv-quarterly-updateoctober-2021
166. PC Gamer, how Overwatch uses sound: https://pcgamer.com/how-overwatch-uses-sound-to-pinpoint-threats-you-cant-see
167. Overwatch forum, hitmarker change: https://eu.forums.blizzard.com/en/overwatch/t/undocumented-misleading-change-on-hitmarkers/15582
168. jsfxr `sfxr.js`: https://github.com/chr15m/jsfxr/blob/master/sfxr.js
169. SFX Engine, common game audio mistakes (low authority): https://sfxengine.com/blog/common-game-audio-mistakes
170. Game Juice, hit stop frame trick (low authority): https://gamejuice.pages.dev/articles/hit-stop-frame-trick

**Godot, gems and engines**
171. Phantom Camera: https://github.com/ramokz/phantom-camera
172. Phantom Camera `phantom_camera_noise_2d.gd`: https://github.com/ramokz/phantom-camera/blob/main/addons/phantom_camera/scripts/resources/phantom_camera_noise_2d.gd
173. Phantom Camera `phantom_camera_noise_emitter_2d.gd`: https://github.com/ramokz/phantom-camera/blob/main/addons/phantom_camera/scripts/phantom_camera/phantom_camera_noise_emitter_2d.gd
174. Whumpkit Lite: https://github.com/pnscripts/godot-whumpkit-lite
175. Cobo godot-hitstop: https://github.com/Cobo-Makes-Games/godot-hitstop
176. Godot PR #99230, 2D instance uniforms: https://github.com/godotengine/godot/pull/99230
177. Godot PR #102503, instance uniform follow-up: https://github.com/godotengine/godot/pull/102503
178. Godot docs, Node: https://docs.godotengine.org/en/stable/classes/class_node.html
179. Godot docs, Engine: https://docs.godotengine.org/en/stable/classes/class_engine.html
180. Godot docs, Exporting for the Web: https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html
181. Godot docs, 2D particle systems: https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html
182. Godot docs, reducing stutter from shader compilation: https://docs.godotengine.org/en/stable/tutorials/performance/pipeline_compilations.html
