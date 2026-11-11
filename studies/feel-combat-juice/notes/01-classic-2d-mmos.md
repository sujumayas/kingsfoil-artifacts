# 01. Classic and 2D MMO combat feel

Angle: how Tibia, OSRS, Albion Online, Ragnarok Online, MapleStory, Ultima Online and Realm of the Mad God make hitting and getting hit feel. Measured from source code where possible.

Source revisions read on 2026-11-11:
- OTClient (edubart/otclient, branch `master`). The mehah/otclient fork is noted where it differs.
- TFS (otland/forgottenserver, `master`) and Canary (opentibiabr/canary, `main`).
- RuneLite (`master`) plus a deobfuscated OSRS client (jbx5/devious-client).
- rAthena (`master`).
- filoper/ms-client, a fan C++ MapleStory client in the HeavenClient/JourneyClient line. It is a reimplementation, so treat its numbers as close to the original client, not identical.
- ServUO (`master`) for Ultima Online.

Line numbers drift on `master`. They were correct on the date above.

---

## Q1. Tibia from open source (OTClient + TFS/Canary)

### Takeaway
Tibia's combat feel comes from a few cheap, fixed client animations driven by tiny server packets. Damage numbers last 1000 ms, rise 48 px and merge if they share a colour. Missiles fly for 150 ms times the square root of the distance in tiles. Magic effects run at 75 ms per frame. A 2 px coloured square marks your target, and a black square flashes for 1000 ms on whoever hits you. The server runs auto-attack on a 2000 ms swing, spells on per-spell and per-group cooldowns, and creature AI in 100 ms buckets. Hit sends one text-message packet (about 60 bytes) and one magic-effect packet (9 bytes) to every spectator. Nothing is predicted on the client. Every hit appears one round trip after the server decides it.

### Cited findings

**Damage numbers (animated text)**
- Lifetime is 1000 ms. `ANIMATED_TEXT_DURATION = 1000` ([const.h:39](https://github.com/edubart/otclient/blob/master/src/client/const.h#L39)).
- Rise is linear, 48 px over the lifetime (1.5 tiles, 48 px/s). The text starts 8 px below the tile anchor: `p.y += 8 + (-48 * t) / tf` ([animatedtext.cpp:50](https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp#L50)).
- An optional diagonal drift (`GameDiagonalAnimatedText`) moves it left by `4t + 8t²` px, so it ends 12 px left with ease-in ([animatedtext.cpp:46-48](https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp#L46)).
- Full opacity until `tf / 1.2` (833 ms), then a linear fade over the last 167 ms ([animatedtext.cpp:56-62](https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp#L56)).
- Font is a bitmap font, `verdana-11px-rounded`, centred on the 32 px tile (`p.x += 24 - width/2`, the anchor includes the 8 px creature displacement) ([animatedtext.cpp:32-44](https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp#L32)). The source carries a `//TODO: cache into a framebuffer` note on the draw.
- Merge rule. A new number with the same colour and font is added into an existing number on the same tile if that number is younger than `1000 / 2.5 = 400 ms` ([animatedtext.cpp:87-111](https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp#L87)). So two fire hits within 400 ms show "60", not "30" and "30".
- Stacking rule. If it does not merge, the new number is pushed 12 px down relative to the previous one while the previous is younger than 250 ms, clamped to 12 px ([map.cpp:119-145](https://github.com/edubart/otclient/blob/master/src/client/map.cpp#L119)).
- Removal is a scheduled event at 1000 ms, not a per-frame check ([animatedtext.cpp:74](https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp#L74)).
- The mehah fork adds a user scale factor `g_app.getAnimatedTextScale()` to the rise and position ([mehah animatedtext.cpp:51-57](https://github.com/mehah/otclient/blob/main/src/client/animatedtext.cpp#L51)).

**Damage colours per type** (server picks the colour, client only maps an 8-bit palette index via `Color::from8bit`)
- Palette indices are in [TFS const.h:392-407](https://github.com/otland/forgottenserver/blob/master/src/const.h#L392). RED=180, ORANGE=198, LIGHTGREEN=30, SKYBLUE=143, ELECTRICPURPLE=155, YELLOW=210, DARKRED=108, LIGHTGREY=129, WHITE_EXP=215, NONE=255.
- Mapping lives in `Game::combatGetTypeInfo` ([TFS game.cpp:4043](https://github.com/otland/forgottenserver/blob/master/src/game.cpp#L4043)). Physical damage takes its colour and hit effect from the target's race. Blood is red with `CONST_ME_DRAWBLOOD` and a blood splash item on the floor. Venom is light green with a slime splash. Undead is light grey. Fire creatures are orange. Energy creatures are purple. Elements are fixed: energy purple, earth light green, fire orange, ice sky blue, holy yellow, death dark red, drown light blue, life drain red.
- So every hit produces three readable things. A coloured number, a coloured one-tile magic effect, and for physical hits on blood races a floor splash that decays later.

**Miss and block**
- No "MISS" text. A shield block (`BLOCK_DEFENSE`) shows `CONST_ME_POFF`, a grey puff. An armour block shows `CONST_ME_BLOCKHIT`, a spark ([TFS game.cpp:3974-3978](https://github.com/otland/forgottenserver/blob/master/src/game.cpp#L3974)). Damage that hits 0 after reductions sends no number at all (`if (realDamage == 0) return true;`, [game.cpp:4428-4430](https://github.com/otland/forgottenserver/blob/master/src/game.cpp#L4428)).

**Missiles (distance effects)**
- Flight time is `150 * sqrt(distance_in_tiles)` ms ([missile.cpp:75](https://github.com/edubart/otclient/blob/master/src/client/missile.cpp#L75)). Position is a linear lerp from source to target tile ([missile.cpp:65-66](https://github.com/edubart/otclient/blob/master/src/client/missile.cpp#L65)).
- Worked out: 1 tile 150 ms (6.7 tiles/s), 4 tiles 300 ms (13.3 tiles/s), 7 tiles 397 ms (17.6 tiles/s). The sqrt keeps every shot between 150 and 400 ms on screen.
- Sprites have 8 direction patterns picked from the source-to-target direction (a 3x3 pattern grid) ([missile.cpp:36-63](https://github.com/edubart/otclient/blob/master/src/client/missile.cpp#L36)). No rotation.
- The missile is purely visual. The server has already applied damage when it sends the packet, so the number and the missile start at the same moment. The number does not wait for the missile to land.

**Magic effects**
- 75 ms per frame, `EFFECT_TICKS_PER_FRAME = 75` ([effect.h:34](https://github.com/edubart/otclient/blob/master/src/client/effect.h#L34)). Total time is frames times 75 ms. Effect id 33 is hard-coded to 4x slower ([effect.cpp:40-46](https://github.com/edubart/otclient/blob/master/src/client/effect.cpp#L40)).
- Newer protocols (`GameEnhancedAnimations`) read per-frame durations from the sprite data instead ([effect.cpp:35-38](https://github.com/edubart/otclient/blob/master/src/client/effect.cpp#L35)).

**Target square, attacker square, follow**
- Static square is a 2 px outline around the full 32x32 tile. Timed square is a 2 px outline of 28x28, inset 2 px ([creature.cpp:73-83](https://github.com/edubart/otclient/blob/master/src/client/creature.cpp#L73)).
- Timed square lasts 1000 ms (`VOLATILE_SQUARE_DURATION = 1000`, [creature.h:42](https://github.com/edubart/otclient/blob/master/src/client/creature.h#L42); [creature.cpp:814-823](https://github.com/edubart/otclient/blob/master/src/client/creature.cpp#L814)).
- The server sends a black timed square on the attacker each time a player blocks or takes a hit (`sendCreatureSquare(attacker, SQ_COLOR_BLACK)`, [TFS player.cpp:1985](https://github.com/otland/forgottenserver/blob/master/src/player.cpp#L1985)). This is Tibia's "who is hitting me" cue.
- The target colour comes from the battle list UI. Targeted is `#FF0000` (hover `#FF8888`), followed is `#00FF00`, idle `#888888` ([uicreaturebutton.lua:4-8](https://github.com/edubart/otclient/blob/master/modules/gamelib/ui/uicreaturebutton.lua#L4)). Health bar colours step from `#00BC00` above 92% to `#850C0C` below 3% ([uicreaturebutton.lua:10-16](https://github.com/edubart/otclient/blob/master/modules/gamelib/ui/uicreaturebutton.lua#L10)).
- Attack and follow requests carry a sequence number so the client can ignore stale server cancels ([game.cpp:942-957](https://github.com/edubart/otclient/blob/master/src/client/game.cpp#L942), check at [game.cpp:522](https://github.com/edubart/otclient/blob/master/src/client/game.cpp#L522)). Escape cancels both ([gameinterface.lua:99](https://github.com/edubart/otclient/blob/master/modules/game_interface/gameinterface.lua#L99)).

**Server timing (TFS)**
- Swing timer. `doAttacking` fires when `now - lastAttack >= getAttackSpeed()` and schedules the next check at the attack speed, minimum 50 ms ([player.cpp:3400-3443](https://github.com/otland/forgottenserver/blob/master/src/player.cpp#L3400); `SCHEDULER_MINTICKS = 50` at [scheduler.h:10](https://github.com/otland/forgottenserver/blob/master/src/scheduler.h#L10)).
- Attack speed comes from the weapon, else the vocation ([player.cpp:399-406](https://github.com/otland/forgottenserver/blob/master/src/player.cpp#L399)). Every vocation in the shipped data uses `attackspeed="2000"` ([vocations.xml](https://github.com/otland/forgottenserver/blob/master/data/XML/vocations.xml)). The code default is 1500 ([vocation.h:75](https://github.com/otland/forgottenserver/blob/master/src/vocation.h#L75)).
- `classicAttackSpeed = false` (default) ties the next swing to the action timer, so using items or walking can push the swing back. `true` runs a separate swing event ([player.cpp:3417-3437](https://github.com/otland/forgottenserver/blob/master/src/player.cpp#L3417); [Canary config.lua.dist:484](https://github.com/opentibiabr/canary/blob/main/config.lua.dist#L484)).
- Defence drops to 50% or 75% (by fight mode) for the window right after you swing ([player.cpp:426-430](https://github.com/otland/forgottenserver/blob/master/src/player.cpp#L426)).
- Creature think runs every 1000 ms, spread over 10 buckets of 100 ms (`EVENT_CREATURECOUNT = 10`, [creature.h:56-58](https://github.com/otland/forgottenserver/blob/master/src/creature.h#L56); [game.cpp:3863-3866](https://github.com/otland/forgottenserver/blob/master/src/game.cpp#L3863)). Monster attacks and spell rolls are therefore quantised to roughly 1 s per creature.
- Dispatcher tasks expire after 2000 ms in queue (`DISPATCHER_TASK_EXPIRATION = 2000`, [tasks.h:10](https://github.com/otland/forgottenserver/blob/master/src/tasks.h#L10)).
- Exhaust. `timeBetweenActions = 200` ms and `timeBetweenExActions = 1000` ms ([configmanager.cpp:277-278](https://github.com/otland/forgottenserver/blob/master/src/configmanager.cpp#L277); same values in [Canary config.lua.dist:408-409](https://github.com/opentibiabr/canary/blob/main/config.lua.dist#L408)).
- Spell cooldowns. Each spell has a group (attack, healing, support, special), an optional secondary group, a group cooldown and its own cooldown ([spells.cpp:379-443](https://github.com/otland/forgottenserver/blob/master/src/spells.cpp#L379)). Casting checks all three ([spells.cpp:554-556](https://github.com/otland/forgottenserver/blob/master/src/spells.cpp#L554)) and applies them as conditions ([spells.cpp:738-751](https://github.com/otland/forgottenserver/blob/master/src/spells.cpp#L738)). Canary examples: Energy Strike 2000 ms cooldown and 2000 ms attack-group cooldown ([energy_strike.lua:32-33](https://github.com/opentibiabr/canary/blob/main/data/scripts/spells/attack/energy_strike.lua#L32)). Light Healing 1000 ms and 1000 ms ([light_healing.lua:27-28](https://github.com/opentibiabr/canary/blob/main/data/scripts/spells/healing/light_healing.lua#L27)). So you can heal and attack in the same second, but not two attacks.
- Canary caps clients at `maxPacketsPerSecond = 25` ([config.lua.dist:78](https://github.com/opentibiabr/canary/blob/main/config.lua.dist#L78)).

**How a hit reaches clients, with packet sizes**
- `Game::combatChangeHealth` gathers spectators, sends the hit magic effect, then builds a per-spectator text message. The attacker gets "X loses N hitpoints due to your attack.", the target gets "You lose N hitpoints due to an attack by X.", everyone else gets the third-person form. Spectators on other floors are skipped ([game.cpp:4432-4500](https://github.com/otland/forgottenserver/blob/master/src/game.cpp#L4432)).
- Damage text message `0xB4` ([protocolgame.cpp:1776-1800](https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp#L1776)): opcode 1, type 1, position 5, primary value u32 + colour u8, secondary value u32 + colour u8, string (u16 length + text). That is 17 bytes plus the string. A 44-character line makes it about 63 bytes. Two damage types in one hit (for example physical plus fire on an enchanted weapon) share one packet and the client spawns two numbers ([OTClient protocolgameparse.cpp:1664-1690](https://github.com/edubart/otclient/blob/master/src/client/protocolgameparse.cpp#L1664)).
- Magic effect `0x83`: opcode, position, type flag, effect id, end flag = 9 bytes ([protocolgame.cpp:2560-2572](https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp#L2560)).
- Distance missile `0x83`: 11 bytes, target sent as signed byte offsets ([protocolgame.cpp:2547-2558](https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp#L2547)).
- Creature health `0x8C`: 6 bytes, health as a 0-100 percent byte ([protocolgame.cpp:2575-2588](https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp#L2575)).
- Creature square `0x93`: 7 bytes ([protocolgame.cpp:1665-1677](https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp#L1665)).
- A typical ranged auto-attack hit costs each spectator about 11 + 9 + 63 + 6 = 89 bytes before framing. The text string is two thirds of it.

### Inferences
- The 400 ms merge window plus the 12 px stack offset is Tibia's whole answer to number spam. It works because Tibia hits are slow (2 s swings, 1-2 s spell groups). At 30 players on one target it would merge most same-element hits into one growing number, which is arguably good.
- The sqrt missile curve makes long shots move faster on screen, so no shot lingers. Players never "watch" a Tibia missile. They read it as a line of intent.
- The black attacker square is a very cheap PvP readability tool that most modern MMOs lack. It costs 7 bytes and one rect draw.
- Sending the chat string with every hit is wasteful. A Kingsfoil protocol can send the number and type id and let the client format the log line.

### Gaps
- I did not find a damage-number pixel outline or shadow in OTClient source. The font asset may carry it.
- Exact walk/step duration formula (`getStepDuration`) not traced here. It sits at [creature.cpp:855](https://github.com/edubart/otclient/blob/master/src/client/creature.cpp#L855).
- CipSoft's real server is closed. TFS/Canary are reimplementations, so their timings match the official game only as far as the community has measured.

---

## Q2. OSRS (600 ms tick, hitsplats)

### Takeaway
OSRS quantises everything to a 600 ms server tick and renders on a 20 ms client cycle. A hitsplat shows for 70 client cycles (1.4 s). An actor holds at most 4 hitsplat slots, and a fifth replaces the oldest or smallest. Melee damage lands on the tick the attack is processed. Ranged and magic damage lands 1 to several ticks later by distance formula. That gap between swing and splat, all on a beat, is the core of the "tick feel" that high-level players exploit (prayer flicking, tick manipulation) and new players find sluggish.

### Cited findings
- Game tick is 600 ms (`GAME_TICK_LENGTH = 600`) and client tick 20 ms (`CLIENT_TICK_LENGTH = 20`, 50 fps cap) ([RuneLite Constants.java:124-132](https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/Constants.java#L124)). `getGameCycle` increments every 20 ms ([Client.java:1070-1076](https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/Client.java#L1070)).
- Real tick length drifts with server load. The wiki cites 0.616-0.618 s on busy World 302 versus 0.606-0.611 s on quiet worlds ([OSRS Wiki, Game tick](https://oldschool.runescape.wiki/w/Game_tick)).
- Hitsplat default `displayCycles = 70`, so 1.4 s. Definitions also carry `fadeStartCycle`, `scrollToOffsetX/Y` (drift) and a text colour default `0xFFFFFF` ([RuneLite HitSplatDefinition.java:42-47](https://github.com/runelite/runelite/blob/master/cache/src/main/java/net/runelite/cache/definitions/HitSplatDefinition.java#L42)).
- Four slots per actor. `hitSplatTypes/Values/Cycles = new int[4]` ([devious-client Actor.java:404-409](https://github.com/jbx5/devious-client/blob/master/runescape-client/src/main/java/Actor.java#L404)). When all 4 are live, `addHitSplat` replaces a slot by either oldest cycle or smallest value depending on the definition's compare type ([Actor.java:494-540](https://github.com/jbx5/devious-client/blob/master/runescape-client/src/main/java/Actor.java#L494)). A TypeScript port documents the same logic and the end-cycle formula `currentCycle + displayCycles + delayCycles` ([xrsps overlays2.ts:214-280](https://github.com/xrsps/xrsps-typescript/blob/main/client/render/render/overlays2.ts#L214)).
- Hitsplat types. Red damage, blue zero ("usually indicates either a missed or blocked attack"), plus shield, armour, prayer drain, poise, poison, venom, disease, heal and others. Other players' splats are tinted. A max hit gets a "trimmed" variant. Both can be toggled in settings ([OSRS Wiki, Hitsplat](https://oldschool.runescape.wiki/w/Hitsplat)).
- Attack speed is in ticks. Scimitar, dagger, unarmed 4 ticks (2.4 s). Longsword 5 (3.0 s). Battleaxe 6 (3.6 s). Halberd and 2h 7 (4.2 s). All combat spells 5 ticks. Attack speed "works similar to a global cooldown" across weapon switches ([OSRS Wiki, Attack speed](https://oldschool.runescape.wiki/w/Attack_speed)).
- Hit delay. Melee 0 ticks. Bows `1 + floor((3 + distance) / 6)`. Thrown `1 + floor(distance / 6)`. NPCs are processed before players, which adds one tick to all hits on NPCs ([OSRS Wiki, Hit delay](https://oldschool.runescape.wiki/w/Hit_delay)).
- An action registered in a tick starts at the next tick, so input latency ranges from near 0 to nearly 600 ms depending on when you click ([OSRS Wiki, Game tick](https://oldschool.runescape.wiki/w/Game_tick)).
- Movement is 1 tile per tick walking, 2 running. Overhead chat stays 5 ticks ([OSRS Wiki, Game tick](https://oldschool.runescape.wiki/w/Game_tick)). The dwarf multicannon rotates 45 degrees each tick and players use it as a visual metronome (same page).
- Prayer flicking means turning a protection prayer on just before a hit and off after, so it never drains. The wiki suggests a 100 bpm metronome for practice and says sound helps ([OSRS Wiki, Prayer](https://oldschool.runescape.wiki/w/Prayer#Prayer_flicking)).
- Tick manipulation. Jagex treats most of it as balanced because of the extra effort, while blocking it in content where it is too strong ([OSRS Wiki, Tick manipulation](https://oldschool.runescape.wiki/w/Tick_manipulation)).

### Inferences
- The 4-slot cap is a hard budget on overlapping damage UI per actor. Tibia merges, OSRS caps and replaces. Both bound the worst case.
- Tick combat makes server authority invisible. Everyone already expects a sub-600 ms delay, so a 100-200 ms network delay hides inside it. That is the strongest transferable lesson for a server-authoritative game.
- The cost is responsiveness. A click can wait up to 600 ms before anything happens, which reads as lag to players from action games.

### Gaps
- I did not find a primary dated Jagex quote on why the tick is loved or hated. Forum consensus is easy to find, dated primary sources less so.
- Hitsplat pixel size depends on sprite ids in the cache, which I did not decode.
- Magic hit-delay formula was cut from my extract. The OSRS Wiki Hit delay page has it.

---

## Q3. Albion Online, Ragnarok Online, MapleStory, Ultima Online, Realm of the Mad God

### Albion Online

#### Takeaway
Albion mixes click-to-target auto attacks with abilities that are either target-locked or ground-targeted, and uses short cast times plus interrupts as the main skill test. Primary sources I could reach are spell database entries and patch notes, not dev talks on telegraphs.

#### Cited findings
- Interrupt is a 3 m sword bash that cancels the target's cast and stuns for 0.3 s ([albiondatabase, Interrupt](https://www.albiondatabase.com/spells/interrupt)).
- Magic Shock cast time cut from 0.5 s to 0.35 s so it works better as an interrupt ([patchbot, Dragonfire Patch 2 balance changes](https://patchbot.io/games/albion-online/articles/1532-combat-balance-changes-dragonfire-patch-2)).
- Charged Attack is ground-targeted with a 1.3 s cast ([albiondatabase, Charged Attack](https://www.albiondatabase.com/spells/charged-attack)). Some boss abilities are tagged ground-targeted and uninterruptible ([Avalonian Beam](https://www.albiondatabase.com/spells/avalonian-beam-mob-avalon-construct-beam-shot-endphase)).
- Abilities interact with the auto-attack timer. A patch made Thorn Growth stop triggering the auto-attack cooldown ([steamdb patch notes](https://steamdb.info/patchnotes/18608840)). The June 2022 "Into the Fray" update turned a staff ability into a ground-target dash that buffs auto-attack damage ([devtrackers, Into the Fray](https://devtrackers.gg/albion/p/80a4b120-8-june-2022-into-the-fray-update)).
- Combat is classless and set by the weapon ([mein-mmo, Albion combat system](https://mein-mmo.de/en/kampfsystem-albion-online,57796/)).

#### Gaps
- No primary source found for Albion's telegraph colours, ground-decal lead times, or how a dodged skillshot is shown. Needs a video pass or the official wiki.

### Ragnarok Online (rAthena)

#### Takeaway
RO syncs the damage number and the target's flinch to a specific frame in the attacker's animation. The server sends attack-motion and damage-motion times in every damage packet. Being hit locks the target's movement for a fraction of its damage animation. Multi-hit skills add 200 ms per extra hit.

#### Cited findings
- `clif_damage` sends `ZC_NOTIFY_ACT` with `srcSpeed` (attack motion) and `dmgSpeed` (damage motion), the server tick, damage, hit count (`div`) and a type ([clif.cpp:5236-5290](https://github.com/rathena/rathena/blob/master/src/map/clif.cpp#L5236)). The same packet goes to the whole area.
- The source comment explains the client reads `srcSpeed` as an inverse animation speed where 432 means 1x. If the monster's damage frame is undefined, the client shows damage and flinch at the start of the second-to-last frame. rAthena rescales so the client shows the hit when the server applies it ([clif.cpp:5245-5265](https://github.com/rathena/rathena/blob/master/src/map/clif.cpp#L5245)).
- Damage types include normal, endure, critical, lucky dodge, multi-hit and splash ([clif.hpp:692-706](https://github.com/rathena/rathena/blob/master/src/map/clif.hpp#L692)). Endure status converts hits to the endure type so the target does not flinch ([clif.cpp:5142-5175](https://github.com/rathena/rathena/blob/master/src/map/clif.cpp#L5142)). A zero-damage normal hit shows the client's "Miss" text (client behaviour, not in rAthena source).
- Walk delay after being hit. `pc_damage_walk_delay_rate: 20` for players and `damage_walk_delay_rate: 100` for monsters, both as percent of the damage animation. `multihit_delay: 200` ms per extra hit. `attack_walk_delay: 0` by default ([battle.conf:27-59](https://github.com/rathena/rathena/blob/master/conf/battle/battle.conf#L27)).
- WoE maps can hide real damage and send only the hit count (`hide_woe_damage`, [client.conf:24-27](https://github.com/rathena/rathena/blob/master/conf/battle/client.conf#L24); [clif.cpp:5277-5279](https://github.com/rathena/rathena/blob/master/src/map/clif.cpp#L5277)).

#### Inferences
- Players flinch at 20% of the monster value. That is a deliberate PvP and PvE split: monsters stagger fully, players barely. Directly relevant to the "knockback and hitstun on players" question.
- Sending the animation timing in the packet lets the client place the impact frame without prediction.

### MapleStory (fan client filoper/ms-client)

#### Takeaway
Getting hit in MapleStory means a damage number, a knockback hop, and 2000 ms of invulnerability shown as a grey pulse on the sprite. Stance stat can resist the knockback. Damage numbers drift up slowly and fade over 500 ms.

#### Cited findings (reimplementation, not Nexon source)
- `show_damage` spawns the number 60 px above the character, sets an "alerted" pose for 5000 ms and invincibility for 2000 ms ([Char.cpp:190-201](https://github.com/filoper/ms-client/blob/master/src/Character/Char.cpp#L190)).
- While invincible the sprite is tinted by `0.9 - 0.5 * |sin(alpha * 30)|`, a grey pulse between 0.4 and 0.9 brightness ([Char.cpp:40-47](https://github.com/filoper/ms-client/blob/master/src/Character/Char.cpp#L40)).
- Knockback only if damage > 0, not on a ladder, and the stance roll fails. It sets horizontal speed 1.5 away from the attacker and a vertical force of 3.5 (a small hop) ([Player.cpp:328-345](https://github.com/filoper/ms-client/blob/master/src/Character/Player.cpp#L328)).
- Damage number. `vspeed = -0.25` px per step, opacity starts at 1.5 and drops by `TIMESTEP / FADE_TIME` each step with `FADE_TIME = 500` and `TIMESTEP = 8` ms ([DamageNumber.cpp:60-66, 145-152](https://github.com/filoper/ms-client/blob/master/src/Gameplay/Combat/DamageNumber.cpp#L60); [DamageNumber.h:50](https://github.com/filoper/ms-client/blob/master/src/Gameplay/Combat/DamageNumber.h#L50); [Constants.h:24](https://github.com/filoper/ms-client/blob/master/src/Constants.h#L24)). Types are normal, critical and to-player, each with its own digit sprite set, plus a miss sprite ([DamageNumber.h:31](https://github.com/filoper/ms-client/blob/master/src/Gameplay/Combat/DamageNumber.h#L31)).
- Derived: about 750 ms lifetime, full opacity for the first 250 ms, rise speed about 31 px/s, total rise about 23 px if speed stays constant (estimate).
- Knockback resistance spread from warriors to many classes over updates ([TV Tropes, MapleStory characters](https://www.tvtropes.org/pmwiki/pmwiki.php/Characters/MapleStoryOne)). Low-value source, only for the trend.

### Ultima Online (ServUO)

#### Cited findings
- Swing delay is computed in 0.25 s ticks: `ticks = floor((speed * 4 - stamTicks) * 100 / (100 + bonus))`, floor of 5 ticks, so the fastest swing is 1.25 s ([ServUO BaseWeapon.cs:1196-1230](https://github.com/ServUO/ServUO/blob/master/Scripts/Items/Equipment/Weapons/BaseWeapon.cs#L1196)).
- Swing speed bonus caps at 60% and the formula uses current stamina, so a tired fighter swings slower ([UOGuide, Swing Speed](https://uoguide.com/Swing_Speed); [stratics thread](https://community.stratics.com/threads/how-to-figure-out-ssi.62366/)).
- Taking damage can interrupt spell casting ("fizzle"). Low-circle fast spells such as Magic Arrow are used mainly to fizzle the opponent ([UO-X spells wiki](https://uo-x.pages.dev/wiki/spells); [r/ultimaonline Sphere PvP thread, Aug 2024](https://pol1.lr.ggtyler.dev/r/ultimaonline/comments/1ep4ogx/sphere_pvp_explanation_for_traditional_players/lik7du5/?context=3)). Emulator-specific, verify per shard.

### Realm of the Mad God

#### Cited findings
- Settings let you hide allies' shots ("Ally Shoot", with a "Hide Projectile" mode). Players reported the mode hiding all ally shooting, and asked to keep guild and friend projectiles visible ([RealmEye forum](https://www.realmeye.com/forum/t/ally-shoot-hide-projectile-no-longer-works-now-no-longer-shows-shooting-animations/68712)).
- A player design thread asks for contrasting outlines on bullets and calls out low floor contrast in Void and Heroic Abyss ([RealmEye, Some Design Lessons from Realm](https://www.realmeye.com/forum/t/some-design-lessons-from-realm/59312/7)).
- Players ask for "ghosted" (semi-transparent) other players so enemy shots show through crowds ([RealmEye, Ghosted players](https://www.realmeye.com/forum/t/ghosted-players/22884)).
- Players complain the game has no immunity frames after a hit ([RealmEye, Lack of Immunity Frames](https://www.realmeye.com/forum/t/lack-of-immunity-frames/54204)).

#### Gaps
- Thread dates did not come through in search results. Official RotMG patch notes on these options not found. RealmEye release history ([2023](https://realmeye.com/wiki/release-history-2023)) is the next place to look.

---

## Q4. What players and devs say feels good or bad

### Cited findings
- OSRS. Jagex accepts tick manipulation as a skill reward but blocks it where too strong ([OSRS Wiki, Tick manipulation](https://oldschool.runescape.wiki/w/Tick_manipulation)). The wiki notes "Many players shy away" from click-intensive tick methods (same page). Flicking is "click intensity" heavy and mistakes are costly ([OSRS Wiki, Prayer](https://oldschool.runescape.wiki/w/Prayer#Prayer_flicking)).
- Albion devs keep shortening cast times on interrupt tools, 0.5 s to 0.35 s on Magic Shock ([patchbot](https://patchbot.io/games/albion-online/articles/1532-combat-balance-changes-dragonfire-patch-2)). This suggests 0.5 s was too long to react to a cast.
- RotMG players want the option to hide ally bullets but keep friends' visible, ghosted allies, and outlined bullets ([RealmEye threads above](https://www.realmeye.com/forum/t/ally-shoot-hide-projectile-no-longer-works-now-no-longer-shows-shooting-animations/68712)).
- RotMG players miss i-frames ([RealmEye](https://www.realmeye.com/forum/t/lack-of-immunity-frames/54204)). MapleStory gives 2000 ms (Q3).

### Gaps
- Dated primary quotes from Tibia (CipSoft news) and OSRS (Jagex dev blogs) on feel were not collected in this pass. Worth a short follow-up for the report if the budget allows.

---

## Q5. What transfers to a 32 px server-authoritative top-down MMO

### Transfers well (with numbers to start from)
- **Damage numbers, Tibia style.** 1000 ms life, 48 px rise (1.5 tiles), fade in the last 167 ms, bitmap font about 11 px, server-chosen colour per damage type. Merge same-type numbers on the same target inside 400 ms. Offset non-merged ones 12 px. This is the right default for 32 px tiles and is proven at Tibia's scale.
- **Per-actor caps.** OSRS caps at 4 live splats per actor and replaces oldest or smallest. Combine with Tibia merging to bound cost under a 30-player pile-on.
- **Missile timing curve.** `150 * sqrt(tiles)` ms keeps all targeted projectiles between 150 and 400 ms. For targeted (cannot-miss) spells this is a good choice, because the result is already decided. Aimed skillshots need real speeds in tiles/s instead, because the player must read and dodge them.
- **Effect frame rate.** 75 ms per frame (13.3 fps) for hit effects matches pixel-art flipbooks and is cheap.
- **Who is hitting me.** Tibia's black 1000 ms 2 px square on the attacker. Cheap and useful in PvP crowds.
- **Target marker.** 2 px red outline on the 32x32 tile, green for follow. Reuse battle-list colours so the list and world agree.
- **Miss feedback without text.** Tibia shows a grey puff for a shield block and a spark for armour. OSRS shows a blue 0. Both read at 32 px better than a word "MISS" (inference).
- **Animation-timed impact.** RO sends the attack motion time in the damage packet so the client lands the number on the impact frame. For Kingsfoil, include a short "impact at +N ms" field with each hit.
- **Asymmetric flinch.** RO uses 20% walk delay for players versus 100% for monsters. Apply hit reactions fully to mobs and lightly or cosmetically to players.
- **Tick quantisation hides latency.** OSRS's 600 ms and Tibia's 2000 ms swings make a 100-200 ms network delay invisible. Keep the auto-attack rhythm slow and steady so server authority does not feel like lag. Skillshots need a faster loop (see other notes).
- **Spell groups.** TFS attack, healing and support groups with separate group cooldowns let a player heal and attack in the same second while blocking two attacks. A clean model for the hybrid hotbar.
- **Lean packets.** About 9 bytes per effect, 11 per missile, 6 per health update. Drop the per-hit chat string (two thirds of Tibia's hit bytes) and send a type id instead.
- **Ally projectile filter.** RotMG shows that many players need a "hide or dim allies' projectiles" option, with friends and party exempt.

### Does not transfer, or needs change
- **Tibia's lack of client prediction.** Fine for targeted auto attacks. Aimed skillshots need local cast feedback before the server answers.
- **OSRS's 600 ms input wait on every action.** Too slow for aimed dodging. Use ticks for auto-attack and DoTs only.
- **MapleStory's 2000 ms i-frames and knockback hop.** Built for a side-scroller with platforms. On a top-down tile grid with server-authoritative movement, displacing players on hit fights pathing and PvP fairness. A short tint pulse (the grey sin pulse) transfers, the knockback mostly does not.
- **RotMG bullet density.** A bullet-hell density at 32 px with 30 players is unreadable without filters, outlines and ghosting.
- **Per-spectator text strings.** TFS formats a different sentence for attacker, target and others on every hit. Format client-side.

---

## Sources

OTClient (edubart)
- https://github.com/edubart/otclient/blob/master/src/client/const.h
- https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp
- https://github.com/edubart/otclient/blob/master/src/client/map.cpp
- https://github.com/edubart/otclient/blob/master/src/client/missile.cpp
- https://github.com/edubart/otclient/blob/master/src/client/effect.cpp
- https://github.com/edubart/otclient/blob/master/src/client/effect.h
- https://github.com/edubart/otclient/blob/master/src/client/creature.cpp
- https://github.com/edubart/otclient/blob/master/src/client/creature.h
- https://github.com/edubart/otclient/blob/master/src/client/game.cpp
- https://github.com/edubart/otclient/blob/master/src/client/protocolgameparse.cpp
- https://github.com/edubart/otclient/blob/master/modules/gamelib/ui/uicreaturebutton.lua
- https://github.com/edubart/otclient/blob/master/modules/game_interface/gameinterface.lua
- https://github.com/mehah/otclient/blob/main/src/client/animatedtext.cpp

TFS and Canary
- https://github.com/otland/forgottenserver/blob/master/src/player.cpp
- https://github.com/otland/forgottenserver/blob/master/src/player.h
- https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- https://github.com/otland/forgottenserver/blob/master/src/const.h
- https://github.com/otland/forgottenserver/blob/master/src/creature.h
- https://github.com/otland/forgottenserver/blob/master/src/scheduler.h
- https://github.com/otland/forgottenserver/blob/master/src/tasks.h
- https://github.com/otland/forgottenserver/blob/master/src/configmanager.cpp
- https://github.com/otland/forgottenserver/blob/master/src/spells.cpp
- https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
- https://github.com/otland/forgottenserver/blob/master/src/vocation.h
- https://github.com/otland/forgottenserver/blob/master/data/XML/vocations.xml
- https://github.com/opentibiabr/canary/blob/main/config.lua.dist
- https://github.com/opentibiabr/canary/blob/main/data/scripts/spells/attack/energy_strike.lua
- https://github.com/opentibiabr/canary/blob/main/data/scripts/spells/healing/light_healing.lua

OSRS
- https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/Constants.java
- https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/Client.java
- https://github.com/runelite/runelite/blob/master/cache/src/main/java/net/runelite/cache/definitions/HitSplatDefinition.java
- https://github.com/jbx5/devious-client/blob/master/runescape-client/src/main/java/Actor.java
- https://github.com/xrsps/xrsps-typescript/blob/main/client/render/render/overlays2.ts
- https://oldschool.runescape.wiki/w/Game_tick
- https://oldschool.runescape.wiki/w/Hitsplat
- https://oldschool.runescape.wiki/w/Attack_speed
- https://oldschool.runescape.wiki/w/Hit_delay
- https://oldschool.runescape.wiki/w/Prayer#Prayer_flicking
- https://oldschool.runescape.wiki/w/Tick_manipulation

Ragnarok Online
- https://github.com/rathena/rathena/blob/master/src/map/clif.cpp
- https://github.com/rathena/rathena/blob/master/src/map/clif.hpp
- https://github.com/rathena/rathena/blob/master/conf/battle/battle.conf
- https://github.com/rathena/rathena/blob/master/conf/battle/client.conf

MapleStory (fan client)
- https://github.com/filoper/ms-client/blob/master/src/Character/Char.cpp
- https://github.com/filoper/ms-client/blob/master/src/Character/Player.cpp
- https://github.com/filoper/ms-client/blob/master/src/Gameplay/Combat/DamageNumber.cpp
- https://github.com/filoper/ms-client/blob/master/src/Gameplay/Combat/DamageNumber.h
- https://github.com/filoper/ms-client/blob/master/src/Constants.h
- https://www.tvtropes.org/pmwiki/pmwiki.php/Characters/MapleStoryOne

Ultima Online
- https://github.com/ServUO/ServUO/blob/master/Scripts/Items/Equipment/Weapons/BaseWeapon.cs
- https://uoguide.com/Swing_Speed
- https://community.stratics.com/threads/how-to-figure-out-ssi.62366/
- https://uo-x.pages.dev/wiki/spells
- https://pol1.lr.ggtyler.dev/r/ultimaonline/comments/1ep4ogx/sphere_pvp_explanation_for_traditional_players/lik7du5/?context=3

Albion Online
- https://www.albiondatabase.com/spells/interrupt
- https://www.albiondatabase.com/spells/charged-attack
- https://www.albiondatabase.com/spells/avalonian-beam-mob-avalon-construct-beam-shot-endphase
- https://patchbot.io/games/albion-online/articles/1532-combat-balance-changes-dragonfire-patch-2
- https://steamdb.info/patchnotes/18608840
- https://devtrackers.gg/albion/p/80a4b120-8-june-2022-into-the-fray-update
- https://mein-mmo.de/en/kampfsystem-albion-online,57796/

Realm of the Mad God
- https://www.realmeye.com/forum/t/ally-shoot-hide-projectile-no-longer-works-now-no-longer-shows-shooting-animations/68712
- https://www.realmeye.com/forum/t/some-design-lessons-from-realm/59312/7
- https://www.realmeye.com/forum/t/ghosted-players/22884
- https://www.realmeye.com/forum/t/lack-of-immunity-frames/54204
- https://realmeye.com/wiki/release-history-2023
