# 07. Combat audio, crits, kills and death

Researcher angle: hit sound design, voice limits, retro synth sounds, crit emphasis, kill confirmation, death and corpses. Adapted to a 2D top-down web MMO with many players on screen.

Source quality key: [primary] = engine docs, open-source code, official dev posts. [secondary] = press write-ups of talks. [low] = blogs and aggregators, some look machine-written. Treat [low] numbers as starting points only.

---

## Q1. Hit sound design, variation, voice limits, priority

### Takeaway
Every serious engine has the same three tools. Randomize pitch and volume per play, cap instances per sound, and let a priority plus audibility score decide which voice dies when the cap is hit. The MMO-specific part is a per-listener source tag. Tibia's server already labels every sound as OWN, OTHERS, CREATURES or GLOBAL for each spectator, so the client can mix your own hits louder than a stranger's. Godot gives us the randomizer and a per-node polyphony cap, but no global priority system, so we write a small voice manager.

### Cited findings

Godot 4 built-ins [primary]
- `AudioStreamRandomizer.random_pitch` is a multiplier. Pitch is picked between `1/random_pitch` and `random_pitch`. Default 1.0 (off). Setting it also updates `random_pitch_semitones`. https://docs.godotengine.org/en/stable/classes/class_audiostreamrandomizer.html
- `random_volume_offset_db` default 0.0. A value of 3.0 gives -3 dB to +3 dB. Same page.
- `playback_mode` default `PLAYBACK_RANDOM_NO_REPEATS`. Also offers weighted random and sequential (round robin). Same page.
- `AudioStreamPlayer2D.max_polyphony` default 1. Extra plays past the cap cut the oldest. `max_distance` default 2000 px, `attenuation` exponent default 1.0, `panning_strength` default 1.0. https://docs.godotengine.org/en/stable/classes/class_audiostreamplayer2d.html

Godot web export [primary]
- Since 4.3 the web default playback type is Sample. Samples are handed to the browser's Web Audio, so "the sound would never lag nor glitch out if the game is lagging." Only static wav, ogg and mp3 can be samples. Positional per-channel volume still works. https://godotengine.org/article/progress-report-web-export-in-4-3/
- Godot docs say bus audio effects do not run in Sample mode on web. Switching to Stream adds latency when threads are off. https://docs.godotengine.org/en/4.3/tutorials/audio/audio_streams.html
- The article recommends `AudioServer.register_stream_as_sample()` during loading to avoid spikes on low-end devices. Same progress report.
- A forum thread reports that the PitchShift effect does not work in web builds. https://forum.godotengine.org/t/pitchshift-doesnt-work-in-web-build/139949 (pitch_scale on the player is a different path; see Gaps.)

Browser rules [primary]
- Since Chrome 71 an AudioContext created before a user gesture starts "suspended". You must call `resume()` after the user interacts. https://developer.chrome.com/blog/autoplay
- `outputLatency` support starts at Chrome 102 and Safari 18.4. Firefox reports `baseLatency` as 0 by design. https://web.dev/articles/audio-output-latency , https://github.com/WebAudio/web-audio-api/issues/2467
- No measured mobile latency numbers found (see Gaps).

Middleware voice management [primary]
- FMOD Core: real (mixed) voices are "often set lower, at anywhere from 32 to 128". Virtual voices "256, 512 or even 1024". When real voices run out, the lowest priority channel goes virtual. Ties go to the least audible. A higher priority channel is never stolen by a lower one. Studio events expose 5 priority levels. https://d1s9dnlmdewoh1.cloudfront.net/2.03/api/managing-resources-in-the-core-api.html
- FMOD event max instances with stealing modes Oldest, Furthest, Quietest, Virtualize, None. https://www.fmod.com/docs/2.00/studio/event-macro-controls-reference.html
- Wwise playback limits exist at three levels, per actor-mixer, per bus and global, and count voices, not events. Priority can drop with distance. https://www.audiokinetic.com/en/how-to-get-a-hold-on-your-voices-optimizing-for-cpu-part-1 (403 on fetch, summary from search results [secondary])
- Microsoft Flight Simulator's Wwise guide sets "Limit sound instances to" 28 for AI aircraft in multiplayer, priority 75 with a distance offset of -75. A real shipped example of distance-based priority. https://docs.flightsimulator.com/msfs2024/html/4_Sound/Aircraft_Audio/Audio_For_AI_Aircraft.htm

Shipped games
- Diablo IV: the isometric camera shows many enemies, so the team limits how many instances of each sound can play at once. An importance system lets key monster sounds stand out. Skills have separate cast, loop and impact sets, plus subtle randomized variation in both sound and play frequency. https://news.blizzard.com/en-us/article/23731236/diablo-iv-quarterly-updateoctober-2021 [primary]
- Diablo IV GDC talk "Living Audio" covers "Monster SFX voice limiting and Importance System" and ducking. Vault page: https://gdcvault.com/play/1034343/-Diablo-IV-Audio-Systems (content not fetched, 403 on schedule page)
- Blizzard practice per a press feature: layered sounds with per-layer random volume, pitch and filter, "usually at least five variations" per skill. https://gameluster.com/behind-the-sounds-exploring-the-blizzard-universe/ [secondary]
- Overwatch (GDC 2016, Lawlor and Neumann): goal was to play "with the monitor practically turned off". An importance system boosts the sounds of enemies that are looking at or shooting you, and dims the rest. Enemy and ally footsteps are mixed differently. https://pcgamer.com/how-overwatch-uses-sound-to-pinpoint-threats-you-cant-see , https://gamedeveloper.com/audio/video-how-i-overwatch-i-was-designed-so-people-could-play-by-sound- [secondary]
- Overwatch hit pip was a reversed beer-can opening. Designer Paul Lackey said it had to cut through the mix without sounding like any hero. https://www.pcgamer.com/overwatchs-hit-sound-effect-is-apparently-powered-by-beer/ [secondary, Blizzard-verified per article]
- Overwatch players complain when hit and headshot sounds drop out while the visual marker still shows, and when the victim-side crit sound was removed they could not tell how they died. https://us.forums.blizzard.com/en/overwatch/t/cant-hear-90-of-hit-marker-sounds/27494 , https://eu.forums.blizzard.com/en/overwatch/t/undocumented-misleading-change-on-hitmarkers/15582 [player reports]
- Tibia (Canary server source): every sound and magic effect is sent per spectator with a source tag. `SourceEffect_t { GLOBAL=0, OWN=1, OTHERS=2, CREATURES=3 }`. `actor == spectator` gives OWN, another player gives OTHERS, a monster gives CREATURES, NPC or none gives GLOBAL. https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp (`Game::sendSingleSoundEffect`, `classifyGraphicalEffectSource`), enum in https://github.com/opentibiabr/canary/blob/main/src/creatures/creatures_definitions.hpp [primary]
- Tibia's client exposes battle sound settings split by "own/other players > attack". https://tibiavip.app/home/news?id=2475 [secondary]. Tibia got sound effects about 25 years after launch. https://gamesradar.com/this-ancient-mmo-is-getting-sound-25-years-after-launch
- A later Tibia patch cut volume and frequency of repeating ambient sounds and of eating and drinking. https://tibiavip.app/home/news?id=2493 [secondary]

Pitch and volume ranges
- About ±2 semitones pitch and ±1.5 dB volume on one file. https://sfxengine.com/blog/common-game-audio-mistakes [low]
- "A couple of semitones" either way, wider gets comedic. 3 to 5 takes plus round robin for impacts. https://violetrecording.com/sound-design-for-video-games/ [low]
- Recognition sounds should not be randomized just because you can. https://www.asoundeffect.com/game-audio-immersion/ [secondary]

### Inferences
- ±2 semitones in Godot terms is `random_pitch = 2^(2/12) ≈ 1.122`. For hit sounds I'd start lower, ±1 semitone (`1.059`), because large swings on short transients read as different weapons. Keep crit and kill sounds at 0 or ±0.5 semitone so they stay recognizable.
- Layering for a pixel hit. Transient click 0 to 20 ms (identifies the weapon), body thump 20 to 120 ms (weight, scales with damage), short tail up to 300 ms (material, blood, metal). Randomize each layer separately, which multiplies variety (5 x 5 x 3 = 75 combos from 13 files).
- In a crowd, keep the transient and drop the tail first. Tails stack into mud.
- Proposed voice budget for web (estimate, to measure). 24 to 32 simultaneous one-shots total. Per sound id max 3 to 4 instances within 50 ms. Priority order: own outgoing hit > hit on you > crit/kill involving you > your target's hits from others > others' hits > monster idle and ambient.
- Volume rule from the Tibia tag. OWN 0 dB, hits on you 0 dB, OTHERS -8 to -12 dB, CREATURES -6 dB, plus an "others" slider defaulting low. In a 30-player fight, others' hits should be nearly a texture, not individual events.
- Distance in top-down. The whole screen is about 15 x 11 tiles (480 x 352 px at 32 px). Use a short linear falloff to about 8 tiles, then cut. Pan lightly (panning_strength 0.3 to 0.5). Hard panning on a screen this small feels wrong on headphones.
- Ducking. Duck others' combat and ambient by 3 to 6 dB for 150 ms when you get hit or crit. Cheap to do with a bus volume tween, no effects needed, so it works in Sample mode.

### Gaps
- No measured Web Audio latency on Android Chrome or iOS Safari. Needs a test page on real devices.
- Not confirmed whether `pitch_scale` on an AudioStreamPlayer2D works in Godot web Sample mode (the PitchShift bus effect does not). Test before relying on per-play pitch randomization on web.
- No primary Hades or Doom audio numbers found. Wwise official docs on limits returned 403.
- Real voice cap inside browsers is not a fixed number. Needs a stress test (spawn N one-shots, measure frame time and dropouts).

---

## Q2. Synthesized retro hit sounds (sfxr family)

### Takeaway
jsfxr's `hitHurt` preset is a fast way to get pixel-era hits. It is a square, sawtooth or noise burst at 145 to 2260 Hz with a downward pitch slide and 23 to 227 ms total length. Generate 5 to 8 per weapon class, export to wav, and let AudioStreamRandomizer pick. Do not synthesize at runtime on web.

### Cited findings [primary, jsfxr source]
From https://github.com/chr15m/jsfxr/blob/master/sfxr.js
- `hitHurt`: `wave_type = rnd(2)` picks square, sawtooth or sine. Sine is swapped for noise. Square gets `p_duty = frnd(0.6)`.
- `p_base_freq = 0.2 + frnd(0.6)`. Converted with the file's own formula `8*44100*(v*v+0.001)/100`, that is about 145 Hz to 2260 Hz.
- `p_freq_ramp = -0.3 - frnd(0.4)`. Always a downward slide.
- `p_env_attack = 0`. `p_env_sustain = frnd(0.1)`, which is 0 to 23 ms. `p_env_decay = 0.1 + frnd(0.2)`, 23 to 204 ms. Envelope samples are `v*v*100000` at 44.1 kHz.
- Half the time a high-pass filter `p_hpf_freq = frnd(0.3)`.
- `explosion` preset (useful for kills and death pops): noise, attack 0, sustain 0.1 to 0.4, decay 0 to 0.5, `p_env_punch = 0.2 + frnd(0.6)`, optional repeat and phaser.
- `pickupCoin` (useful for XP or kill confirm): sawtooth, `p_env_punch 0.3 to 0.6`, optional arpeggio jump `p_arp_mod 0.2 to 0.6`.
- Presets list: pickupCoin, laserShoot, explosion, powerUp, hitHurt, jump, blipSelect, synth, tone, click, random. Online editor: https://sfxr.me
- Python port with same params: https://pyfxr.readthedocs.io/en/stable/generating.html

### Inferences
- Layer a jsfxr noise click (decay 0.1, about 23 ms) over a recorded or Bfxr square thump to get "transient + body" without a sound designer.
- Map damage tiers to `p_base_freq`. Lower base freq and longer decay for heavy hits. Crit adds `p_env_punch` 0.4+ and a higher noise transient.
- Keep total length under about 150 ms for auto-attack hits. Tibia-like auto-attack fires every 2 s per player, but 30 players gives about 15 hits per second on screen, and long tails overlap.
- Pre-render. Runtime synthesis would run on the main thread in a single-threaded web build, which is exactly the glitch Godot 4.3 moved away from.

### Gaps
- ChipTone and Bfxr parameter dumps not collected. Bfxr adds compression and bit-crush that are useful for crunch, not sourced here.

---

## Q3. Crits: emphasis, overkill, execution

### Takeaway
Crits are a stack of small boosts on top of a normal hit. Bigger, yellow or orange number, a distinct sound, a unique impact sprite, and in single-player a little extra hitstop and shake. In a shared-screen MMO, the crit number, sound and shake belong to the attacker and the victim. Spectators get only the impact sprite. Tibia already does exactly this split for its crit effect.

### Cited findings
- Tibia (Canary source): on a critical hit the server broadcasts magic effect `CONST_ME_CRITICAL_DAMAGE` to all spectators of the target tile. A "fatal" hit (forge onslaught) uses `CONST_ME_FATAL` instead. The attacker's server log line says "due to your critical attack". The damage number itself is not special. https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp (around `if (damage.fatal)`) [primary]
- Diablo III: crits show as large yellow numbers, normal hits white. https://maxroll.gg/d3/resources/critical-hit-chance-hit-damage-explained [secondary]. Patch 2.4 added crit highlight numbers. https://us.diablo3.com/blog/19996041 [primary]
- Diablo III reworked number display in 2016 because large numbers crowding the screen stopped being exciting. https://blizzardwatch.com/2016/01/25/diablo-damage-numbers-changed/ [secondary]
- Diablo IV players asked for a separate visual for "overpower" crits. https://eu.forums.blizzard.com/en/d4/t/visual-indicator-for-overpower-crits/4287 [player reports]
- WoW: crit text start height is a CVar `WorldTextCritScreenY_v2`. Crit font size is an addon feature (MSBT, MidnightBattleText), not a stock CVar. https://www.curseforge.com/wow/addons/forever-combat-style , https://www.curseforge.com/wow/addons/midnightbattletext [secondary]
- OSRS: a maximum hit shows a "trimmed" hitsplat. Other players' hitsplats are tinted, and both can be toggled. https://oldschool.runescape.wiki/w/Hitsplat [primary]
- Overwatch: headshot gets a larger red marker and a separate "dink". Players lean on the victim-side crit cue to understand deaths. https://eu.forums.blizzard.com/en/overwatch/t/undocumented-misleading-change-on-hitmarkers/15582 [player reports]
- Crit hitstop numbers in the wild disagree. 12 to 20 frames (gamejuice), 100 to 150 ms (kindatechnical), fighting-game counter-hit ranges 16 to 36 frames (mygamedesign). Crit sprite pop 1.0 to 1.1 and 4-frame flash (freegamesprites). https://gamejuice.pages.dev/articles/hit-stop-frame-trick , https://kindatechnical.com/game-development/input-buffering-coyote-time-and-game-feel.html , https://mygamedesign-frontend.pages.dev/how-do-you-make-melee-combat-feel-crunchy-and-satisfying , https://freegamesprites.com/es/news/game-feel-2d-combat-juice-tricks [all low]
- Guilty Gear Strive counter hits add slowdown frames and an extra receiver freeze frame. https://dustloop.com/w/GGST/Attack_Attributes [secondary, community frame data]

### Inferences (proposed starting values for Asterion, estimates to tune)
- Number. Normal 1.0x scale, crit 1.5x with a 1.8x pop over the first 80 ms, colour shift (white to yellow/orange), 1 px dark outline kept. OSRS "trim" is a good pixel trick, a crit gets a border sprite rather than a bigger font, which keeps it crisp at integer scale.
- Hitstop. Only the attacker's and the target's sprites freeze locally, never the world. Normal hit 2 to 3 frames (about 33 to 50 ms), crit 4 to 6 frames (about 67 to 100 ms). The [low] sources' 12 to 20 frames is far too long for an MMO with 2 s auto-attacks and other players moving.
- Shake. Crit by you or on you, 2 px amplitude, 100 ms, on your camera only. Others' crits never shake your camera.
- Sound. A distinct crit layer (higher transient, metallic ping) on top of the normal hit, played at 0 dB for OWN and for crits on you, -12 dB or skipped for OTHERS.
- Overkill. Show overkill only as feel, not numbers. A larger death pop or the corpse flung 2 to 4 px further when damage exceeded remaining HP by, say, 50%. Inference, no source.
- Execution (finisher below X% HP). A one-off sprite and sound for the killer only. Spectators see a normal death.

### Gaps
- No primary-source crit hitstop numbers from a shipped ARPG or MMO. Hitstop research is covered by the hit-feedback researcher; check overlap.
- No source on Albion or Lost Ark crit presentation collected.

---

## Q4. Kill confirmation and death

### Takeaway
Tibia does no death animation at all. On the server tick the creature is removed and replaced by a corpse item plus a blood splash, and the corpse then rots through 3 sprites over about 11 minutes. That is cheap, readable and server-friendly, and the "rotting stages" carry the passage of time. A short client-only flash-then-pop on top of the corpse swap would add juice without touching the server. Slow-mo on the final kill is a single-player trick only.

### Cited findings

Tibia corpses and splash [primary]
- `Creature::dropCorpse` adds a full splash (blood, slime or ink by race), then the corpse item, starts decay on both, then drops loot into the corpse. https://github.com/otland/forgottenserver/blob/master/src/creature.cpp (lines around 523-577)
- Corpse loot owner is set to the most-damage creature (or its master for summons). https://github.com/otland/forgottenserver/blob/master/src/monster.cpp (`Monster::getCorpse`)
- Canary items.xml, dead rat: stage 1 `duration 300` s, stage 2 `300` s, stage 3 `60` s then gone. Dead dragon identical (300 + 300 + 60 = 660 s = 11 min). Dead human (player corpse) first stage `duration 10`. https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
- TFS items.xml, dead lion and dead fire devil first stage `duration 900` s. Blood pool stage `duration 45` s then smaller pools. https://github.com/otland/forgottenserver/blob/master/data/items/items.xml
- Tibia shows kills to the killer as a server log line ("loses N hitpoints due to your attack"). Same game.cpp.

OSRS player death [primary]
- Since 25 June 2020 a grave appears where you died. You have 15 minutes after respawn to return. The timer pauses when logged out, idle over 10 s, or with the grave open. Graves are lootable from 7 tiles with line of sight and shown on the minimap. https://oldschool.runescape.wiki/w/Grave

Vlambeer "Art of Screenshake" (2013) [secondary]
- Tweaks include "even more permanence (smoke)" and slow motion. https://medienwissenschaft.uni-bayreuth.de/wp-content/uploads/GxD-10-Game-Feel.pdf
- One tweak is a 33% chance of enemies exploding harmlessly on death. https://gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games
- Talk video and list referenced via https://kenney.nl/learn/must-see-videos-for-indie-developers

Diablo [secondary]
- Diablo III's sound lead described a recognizable sound when a monster dies and loot flips out, and building sound so it does not get repetitive when many monsters attack at once. https://www.gamebanshee.com/kuucc
- Diablo IV monster pain screams play as you take enemies out one by one. https://news.blizzard.com/en-us/article/23731236/diablo-iv-quarterly-updateoctober-2021

### Inferences
- Death sequence for a 32 px monster (client-only, estimate). Frame 0, the killing hit lands and the sprite flashes white for 2 frames (33 ms). Frames 2 to 6, squash to 1.2x wide / 0.8x tall and fade or dissolve with a 4-step dither (about 80 ms). Frame 6, swap to the corpse sprite plus splash, play a one-shot "pop" particle of 6 to 10 pixels. Total about 100 to 150 ms. The server only sends "died" and "corpse item at tile". If the death packet arrives while the death animation for a predicted kill already played, nothing changes.
- Corpses are the loot container, so they must appear fast. Never delay the corpse behind a long animation. Players spam-click the corpse.
- Rot stages. Keep Tibia's idea of 3 stages, but shorter (for example 120 + 120 + 30 s) to cut tile clutter in crowded spawns. Fade the final stage over 1 s instead of a hard vanish.
- Last-hit feedback for the killer only. Kill sound (pickupCoin-style rising blip), an XP number "+120 xp" in a different colour from damage, rising 16 px over 800 ms. Spectators get the death pop but no kill sound.
- Slow-mo on final kill. Impossible as a global effect because time is server-owned and other players keep moving. A local version is possible, slowing only the dying monster's death animation to 50% for 200 ms on the killer's client. Use only on bosses.
- Player death in an MMO should be clear and short. Tibia-style "You are dead" dialog plus a corpse with your name, OSRS-style grave with a visible timer on the minimap. Avoid cinematic slow-mo when others need to see the fight continue.

### Gaps
- Tibia's real-client corpse loot protection duration not confirmed from source (TFS stores an owner, but I did not trace when it expires).
- No frame counts for death animations in Hyper Light Drifter, Enter the Gungeon or Nuclear Throne found. Needs video frame counting.
- No primary Hades source for an end-of-encounter slow-mo.

---

## Q5. What transfers to a 2D top-down MMO with web audio

### Takeaway
Tag every sound and effect with who caused it relative to the listener, and drive volume, priority and whether to play at all from that tag. Tibia's protocol proves it works at MMO scale. Everything else (randomizer, polyphony caps, short sfxr sounds, crit layers, corpse swap) is cheap in Godot web, as long as effects stay off the buses.

### Inferences (with the source each leans on)
1. Source tag per listener, OWN / OTHERS / CREATURES / GLOBAL, computed on the server or client. Mirrors Canary's `SourceEffect_t`.
2. Mix by tag. Own and incoming hits at full volume. Others at -8 to -12 dB with a user slider (Tibia's own/others battle sound settings, OSRS tinted hitsplats).
3. Per-sound cooldown and cap. Same sound id at most 3 to 4 voices, and at most one new start per 30 to 50 ms. Mirrors Diablo IV's per-sound instance limits and FMOD/Wwise caps.
4. Global cap with priority stealing. Write a tiny GDScript pool of 24 to 32 AudioStreamPlayer2D nodes. On request, if full, steal the lowest priority then quietest, never steal OWN. FMOD's rule "higher priority never stolen by lower" is a good model. Godot's `max_polyphony` alone only steals the oldest within one node.
5. Short sounds. Hits under 150 ms, crit layer under 250 ms, death pop under 400 ms. From jsfxr presets and crowd math.
6. Web constraints. Unlock audio on first click or tap (`resume()`). Register combat sounds as samples during loading. No bus effects in Sample mode, so do ducking with bus volume tweens and do "filtering" by baking variants. Test pitch_scale randomization on Safari early.
7. What does not transfer. Global hitstop, global slow-mo, Overwatch-style 3D occlusion, long cinematic death cams, crit shake on every client.

### Gaps
- No measured cost per voice on low-end Android in Godot web. Needs a stress test.
- Whether the server should send the source tag or the client should compute it (client knows its own player id, so it can compute it from attacker id) is an implementation choice, not researched.

---

## Sources

Engine and platform docs
- https://docs.godotengine.org/en/stable/classes/class_audiostreamrandomizer.html
- https://docs.godotengine.org/en/stable/classes/class_audiostreamplayer2d.html
- https://docs.godotengine.org/en/4.3/tutorials/audio/audio_streams.html
- https://godotengine.org/article/progress-report-web-export-in-4-3/
- https://forum.godotengine.org/t/pitchshift-doesnt-work-in-web-build/139949
- https://developer.chrome.com/blog/autoplay
- https://web.dev/articles/audio-output-latency
- https://github.com/WebAudio/web-audio-api/issues/2467
- https://d1s9dnlmdewoh1.cloudfront.net/2.03/api/managing-resources-in-the-core-api.html
- https://www.fmod.com/docs/2.00/studio/event-macro-controls-reference.html
- https://www.audiokinetic.com/en/how-to-get-a-hold-on-your-voices-optimizing-for-cpu-part-1
- https://docs.flightsimulator.com/msfs2024/html/4_Sound/Aircraft_Audio/Audio_For_AI_Aircraft.htm

Open-source code
- https://github.com/chr15m/jsfxr/blob/master/sfxr.js
- https://pyfxr.readthedocs.io/en/stable/generating.html
- https://sfxr.me
- https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp
- https://github.com/opentibiabr/canary/blob/main/src/creatures/creatures_definitions.hpp
- https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
- https://github.com/otland/forgottenserver/blob/master/src/creature.cpp
- https://github.com/otland/forgottenserver/blob/master/src/monster.cpp
- https://github.com/otland/forgottenserver/blob/master/data/items/items.xml

Games, wikis, press
- https://news.blizzard.com/en-us/article/23731236/diablo-iv-quarterly-updateoctober-2021
- https://gdcvault.com/play/1034343/-Diablo-IV-Audio-Systems
- https://gameluster.com/behind-the-sounds-exploring-the-blizzard-universe/
- https://www.gamebanshee.com/kuucc
- https://pcgamer.com/how-overwatch-uses-sound-to-pinpoint-threats-you-cant-see
- https://gamedeveloper.com/audio/video-how-i-overwatch-i-was-designed-so-people-could-play-by-sound-
- https://www.pcgamer.com/overwatchs-hit-sound-effect-is-apparently-powered-by-beer/
- https://us.forums.blizzard.com/en/overwatch/t/cant-hear-90-of-hit-marker-sounds/27494
- https://eu.forums.blizzard.com/en/overwatch/t/undocumented-misleading-change-on-hitmarkers/15582
- https://tibiavip.app/home/news?id=2475
- https://tibiavip.app/home/news?id=2493
- https://gamesradar.com/this-ancient-mmo-is-getting-sound-25-years-after-launch
- https://oldschool.runescape.wiki/w/Hitsplat
- https://oldschool.runescape.wiki/w/Grave
- https://maxroll.gg/d3/resources/critical-hit-chance-hit-damage-explained
- https://us.diablo3.com/blog/19996041
- https://blizzardwatch.com/2016/01/25/diablo-damage-numbers-changed/
- https://eu.forums.blizzard.com/en/d4/t/visual-indicator-for-overpower-crits/4287
- https://www.curseforge.com/wow/addons/forever-combat-style
- https://www.curseforge.com/wow/addons/midnightbattletext
- https://dustloop.com/w/GGST/Attack_Attributes
- https://medienwissenschaft.uni-bayreuth.de/wp-content/uploads/GxD-10-Game-Feel.pdf
- https://gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games
- https://kenney.nl/learn/must-see-videos-for-indie-developers
- https://www.asoundeffect.com/game-audio-immersion/

Low-authority (numbers flagged in text)
- https://sfxengine.com/blog/common-game-audio-mistakes
- https://violetrecording.com/sound-design-for-video-games/
- https://gamejuice.pages.dev/articles/hit-stop-frame-trick
- https://kindatechnical.com/game-development/input-buffering-coyote-time-and-game-feel.html
- https://mygamedesign-frontend.pages.dev/how-do-you-make-melee-combat-feel-crunchy-and-satisfying
- https://freegamesprites.com/es/news/game-feel-2d-combat-juice-tricks
