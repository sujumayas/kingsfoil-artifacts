# 01. History and classic era: how 2D MMOs draw and send spell effects

Researcher 01, VFX #10 Magic and spell VFX. Date 2026-11-11.
All findings come from source code read in this run unless marked otherwise. Raw files are in `scratch-01/`.
"Inference" means my own reading or arithmetic, not a statement in the source.

## Summary in six lines

- Tibia sends an effect as an id plus a tile. 7 bytes in the old protocol, 9 to 11 in the new one. The client owns all animation.
- OTClient plays every effect at a fixed 75 ms per frame and removes it after `75 ms x frame count`.
- A Tibia missile is one static sprite out of a 3x3 direction sheet. Flight time is `150 ms x sqrt(tile distance)`.
- An area spell is a 0/1 mask in Lua. The server sends one effect per tile, so a 73-tile UE costs 73 messages per spectator.
- UO, RO and OSRS send more per event (28 to 49, 10 to 23, 6 to 20 bytes) and get per-event hue, blend mode, delay and arc height in return.
- Every game in this set animates on the client. None sends per-frame data.

---

## 1. Tibia, OTClient, TFS, Canary

### Takeaway

The Tibia model is the cheapest design that still reads well. An effect is `(effect id, tile)`. A missile is `(missile id, from tile, to tile)`. The client looks up a flipbook in the sprite data and plays it at a fixed rate. Nothing about the animation crosses the network. The cost is that area spells scale linearly with tile count, because the protocol has no "area" message.

### Cited findings

**Effect playback (OTClient, edubart)**

- `EFFECT_TICKS_PER_FRAME = 75` in `effect.h`. Source: https://github.com/edubart/otclient/blob/master/src/client/effect.h
- Phase is `min(elapsed / 75, phases - 1)`. Lifetime is `75 x getAnimationPhases()` ms, then a scheduled event removes the effect from the map. Source: https://github.com/edubart/otclient/blob/master/src/client/effect.cpp
- One hard-coded exception. Effect id 33 uses `ticks <<= 2`, which is 300 ms per frame. The code comment calls it a "hack to fix some animation phases duration".
- With the `GameEnhancedAnimations` feature the client reads per-frame durations from the sprite data through an `Animator` and uses `getTotalDuration()`.
- Tile variation. The effect picks `xPattern = offsetX % numPatternX` and `yPattern = offsetY % numPatternY`. An effect sprite sheet with pattern 2x2 shows a different variant on neighbouring tiles. This is how a large area avoids looking like a stamped grid.
- Other timing constants in `const.h`: `ITEM_TICKS_PER_FRAME = 500`, `INVISIBLE_TICKS_PER_FRAME = 500`, `ANIMATED_TEXT_DURATION = 1000`. Source: https://github.com/edubart/otclient/blob/master/src/client/const.h

**Missile playback (OTClient)**

- Direction pick from a 3x3 pattern sheet. NW (0,0), N (1,0), NE (2,0), W (0,1), centre (1,1), E (2,1), SW (0,2), S (1,2), SE (2,2). Source: https://github.com/edubart/otclient/blob/master/src/client/missile.cpp
- Duration formula: `m_duration = 150 * std::sqrt(m_delta.length())`, where `m_delta` is the tile delta before it is scaled to pixels.
- Position is linear: `dest + m_delta * (elapsed / m_duration)`. Animation phase is always 0, so the missile sprite does not animate in flight.
- mehah/otclient keeps the same formula as `(getMissileTicksPerFrame() * 2) * sqrt(deltaLength)` with `m_missileTicksPerFrame{75}` and `m_effectTicksPerFrame{75}`. Sources: https://github.com/mehah/otclient/blob/main/src/client/missile.cpp and https://github.com/mehah/otclient/blob/main/src/client/gameconfig.h

Flight times from that formula (inference, arithmetic only):

| Tile distance | Duration | Average speed |
|---|---|---|
| 1 | 150 ms | 6.7 tiles/s |
| 2 | 212 ms | 9.4 tiles/s |
| 4 | 300 ms | 13.3 tiles/s |
| 7 | 397 ms | 17.6 tiles/s |
| 9 | 450 ms | 20 tiles/s |

The square root means far shots fly faster. Nothing on screen takes longer than about half a second.

**Protocol, old format**

- `0x83` magic effect: opcode 1 + position 5 (`u16 x, u16 y, u8 z`) + effect id 1 = **7 bytes**. 8 bytes with the `GameMagicEffectU16` feature. Sources: https://github.com/edubart/otclient/blob/master/src/client/protocolgameparse.cpp and `addPosition` in https://github.com/otland/forgottenserver/blob/master/src/networkmessage.cpp
- `0x85` distance missile: opcode 1 + from 5 + to 5 + id 1 = **12 bytes**. Source: Canary `sendDistanceShoot` old-protocol branch, https://github.com/opentibiabr/canary/blob/main/src/server/network/protocol/protocolgame.cpp
- `0x84` in Canary removes an effect: opcode 1 + position 5 + id 1 or 2 = 7 or 8 bytes.

**Protocol, new format (client 12.03 and later)**

One opcode `0x83` carries a small command loop at one position. `MagicEffectsType_t` in TFS `const.h`:

| Value | Name | Payload after the type byte |
|---|---|---|
| 0 | END_LOOP | none |
| 1 | DELTA | u8 delta to adjust position |
| 2 | DELAY | u16 delay in ms (per the TFS comment) |
| 3 | CREATE_EFFECT | effect id |
| 4 | CREATE_DISTANCEEFFECT | id, int8 dx, int8 dy |
| 5 | CREATE_DISTANCEEFFECT_REVERSED | id, int8 dx, int8 dy |

Source: https://github.com/otland/forgottenserver/blob/master/src/const.h

- TFS effect: `0x83, pos(5), 3, u8 id, 0` = **9 bytes**. TFS missile: `0x83, pos(5), 4, u8 id, dx, dy, 0` = **11 bytes**. Source: https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
- Canary uses `u16` ids and an optional source byte (`GraphicalEffectSourceByte`). Effect is **10 or 11 bytes**, missile is **12 or 13 bytes**.
- The missile target is a signed byte delta from the origin, so the format caps range at 127 tiles and saves 3 bytes over a second full position.
- mehah/otclient also parses two sound commands inside the same loop (main sound: u8 source + u16 id, secondary: u8 + u8 + u16). Source: https://github.com/mehah/otclient/blob/main/src/client/protocolgameparse.cpp
- mehah's parser reads only one byte for both DELAY and DELTA (`msg->getU8(); // ?`). The TFS comment says DELAY takes a u16. One of them is wrong. Neither TFS nor Canary emits DELAY or DELTA in the functions I read.

**Effect and missile catalogues**

- TFS master: `CONST_ME_*` runs to id 241 (`CONST_ME_FOAM`) with gaps. About 139 named entries. `CONST_ANI_*` runs to 59 (`CONST_ANI_ROYALSTAR`). `CONST_ANI_WEAPONTYPE = 0xFE` is a server-side placeholder that resolves to a whirlwind axe, sword or club missile. Sources: https://github.com/otland/forgottenserver/blob/master/src/const.h and `Combat::addDistanceEffect` in https://github.com/otland/forgottenserver/blob/master/src/combat.cpp
- Canary: `CONST_ME_*` runs to 303 (`CONST_ME_PURPLE_ELECTRIC_SPARK`), `CONST_ANI_*` to 62 (`CONST_ANI_CHERRYBOMB`). Source: https://github.com/opentibiabr/canary/blob/main/src/utils/utils_definitions.hpp

**Area spells**

- A spell is three or four lines of data. Hell's Core (the fire UE): `COMBAT_PARAM_TYPE = COMBAT_FIREDAMAGE`, `COMBAT_PARAM_EFFECT = CONST_ME_FIREAREA`, `setArea(createCombatArea(AREA_CIRCLE5X5))`. Great Fireball adds `COMBAT_PARAM_DISTANCEEFFECT = CONST_ANI_FIRE` and uses `AREA_CIRCLE3X3`. Source: https://github.com/otland/forgottenserver/tree/v1.4.2/data/spells/scripts/attack
- Areas are 2D arrays. `1` is an affected tile, `3` is the caster or centre tile and is also affected, `0` is empty. Wave and beam masks put the `3` on the bottom row, and the engine rotates the mask to the caster's facing. Diagonal variants are separate arrays (`AREADIAGONAL_WAVE4`, `AREADIAGONAL_BEAM5`). Source: https://github.com/otland/forgottenserver/blob/v1.4.2/data/spells/lib/spells.lua
- Tile counts I computed from that file (inference, counted by script):

| Mask | Tiles | Typical use |
|---|---|---|
| AREA_BEAM5 / BEAM7 / BEAM8 | 5 / 7 / 8 | energy beam, great energy beam |
| AREA_WAVE4 | 12 | fire wave, energy wave |
| AREA_SQUAREWAVE5 | 11 | short cone |
| AREA_CROSS1X1 | 5 | explosion rune |
| AREA_SQUARE1X1 | 9 | melee area |
| AREA_CIRCLE2X2 | 21 | small burst |
| AREA_CIRCLE3X3 | 37 | great fireball, avalanche |
| AREA_CIRCLE5X5 | 73 | UE (hell's core) |
| AREA_CIRCLE6X6 | 101 | largest stock circle |
| AREA_SQUAREWAVE6 | 66 | large monster wave |

- One effect per tile. `Combat::doCombat` loops over the tiles and calls `combatTileEffects`, which calls `Game::addMagicEffect(spectators, tile->getPosition(), params.impactEffect)`. `addMagicEffect` loops over spectators and calls `sendMagicEffect` for each player. Sources: https://github.com/otland/forgottenserver/blob/master/src/combat.cpp and https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- The missile for an area spell is sent once, from caster to the target position, in `postCombatEffects`.
- The server builds the spectator list once per cast with a range widened by the area size, then reuses it for every tile.
- `sendMagicEffect` drops the message if the player cannot see the tile (`canSee(pos)`). `sendDistanceShoot` has no such check. The spectator list for a missile is the union of players near the origin and players near the target.

**Condition visuals**

- A condition has no persistent aura in the protocol. It sets a bit in the player's status icon mask: `ICON_BURN`, `ICON_ENERGY`, `ICON_POISON`, `ICON_FREEZING`, `ICON_DAZZLED`, `ICON_CURSED`, `ICON_BLEEDING`, `ICON_DROWNING`, `ICON_HASTE`, `ICON_PARALYZE`, `ICON_MANASHIELD`. Source: https://github.com/otland/forgottenserver/blob/master/src/condition.cpp
- Each damage tick goes through the normal damage path, which picks a hit effect by damage type and sends it on the victim's tile: fire `CONST_ME_HITBYFIRE`, energy `CONST_ME_ENERGYHIT`, earth `CONST_ME_GREEN_RINGS`, ice `CONST_ME_ICEATTACK`, holy `CONST_ME_HOLYDAMAGE`, death `CONST_ME_SMALLCLOUDS`, drown `CONST_ME_LOSEENERGY`. Physical damage picks by the victim's race (blood, venom, undead, ink). Source: `Game::combatChangeHealth` in https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- So "burning" on screen is a 7 to 11 byte effect at each tick plus a coloured damage number. The tick interval is a condition parameter (`CONDITION_PARAM_TICKINTERVAL`).

**Fields**

Fields are map items of type `magicfield`, not effects. The client animates them as items at 500 ms per frame (`ITEM_TICKS_PER_FRAME`). Source for the values: https://github.com/otland/forgottenserver/blob/v1.4.2/data/items/items.xml

| Item | Decay | Damage data |
|---|---|---|
| Fire field 1487 (full) | 120 s, then becomes 1488 | init 20, then 10 per tick, ticks 10000 ms, count 7 |
| Fire field 1488 (medium) | 120 s, then becomes 1489 | 10 per tick, ticks 10000 ms, count 7 |
| Fire field 1489 (small) | 120 s, then removed | none |
| Poison gas 1490 | 120 s | ticks 5000 ms, start 5, damage 100 |
| Energy field 1491 | 120 s | init 30, damage 25, ticks 10000 ms |
| Magic wall 1497 | 20 s | blocks |
| Rush wood 1499 | 45 s | blocks |

- The three fire items give a 360 s burn-down in three visual stages with no extra animation data.
- Ids 1492 to 1496 are the same fields without decay, for map makers.
- `combatTileEffects` swaps PvP field ids for no-PvP ids on non-PvP worlds, so the same spell places a different item per world type.

**Throttling and player options (mehah/otclient only)**

- Per-source opacity. `Effect::draw` multiplies by `g_client.getEffectAlpha(m_source)`. The client keeps separate alpha values for own spells, other players' spells, monster spells and boss-area effects, plus a missile alpha. The source comes from the protocol's source byte. Sources: https://github.com/mehah/otclient/blob/main/src/client/effect.cpp and https://github.com/mehah/otclient/blob/main/src/client/client.h
- Same-tile stacking rule in `tile.cpp`. If a new effect has the same id as one already on the tile, `waitFor` delays its first drawn frame until the old one is one third through (`duration / 3`). In optimize mode the divisor is 1.5 and a larger new effect hides the older one. Source: https://github.com/mehah/otclient/blob/main/src/client/tile.cpp
- Infinite-loop effects exist. If the animator reports `isInfiniteLoop()`, the effect is marked permanent and no removal is scheduled. Canary's `0x84` remove message pairs with this.
- TFS and Canary have no server-side rate limit on effects in the functions I read.

### Inferences

- Network cost of a UE. 73 tiles x 7 bytes = 511 bytes per spectator in the old protocol. 73 x 10 = 730 bytes in Canary's new format. With 30 spectators that is 15.3 KB or 21.9 KB of payload for one cast, before damage numbers and health updates. A single "area effect" message (`effect id, centre, mask id`) would be about 9 bytes. That is roughly a 57x to 81x cut for this spell.
- The new-format loop already allows several effects at one position in one message. An extension with DELTA between entries could pack a whole area into one message. The enum has the hooks, but the open-source servers do not use them.
- 75 ms per frame is 13.3 fps. It matches the 75 ms hit-spark rule from the combat juice study (B4). A typical 8-frame effect lasts 600 ms.
- Tibia missiles have no trail, no rotation and no animation. The whole "projectile" read comes from an 8-way sprite and a short, fast flight.
- The fire field's three-item decay chain is a free "dissipation" phase. The server sends one item change every 120 s.
- The icon-only status model fails the "others can read my state" test. Other players see a burn only when a tick lands.

### Gaps

- I did not read `Position::getDirectionFromPosition`, so the exact angle thresholds for the 8 directions are unverified.
- Default tick intervals for fire, poison and energy conditions were not extracted.
- Real Tibia (CipSoft) behaviour is inferred from open-source reimplementations. CipSoft's client is closed.
- I found no measured draw-call or frame-time numbers for OTClient effects.
- The DELAY payload width is in dispute between TFS (u16) and mehah's parser (u8).

### See it in action

- OTClient repo with screenshots: https://github.com/mehah/otclient
- Tibia effect and missile galleries (fan wiki, not opened in this run because of 403s): https://tibia.fandom.com/wiki/Effects and https://tibia.fandom.com/wiki/Distance_Effects

---

## 2. Ultima Online (ClassicUO)

### Takeaway

UO sends a fat, general packet. One layout covers moving effects, fixed effects and lightning, and later versions add hue and a blend mode. The server controls speed, duration, colour and blending per event. UO pays 28 to 49 bytes for that.

### Cited findings

- One handler, `GraphicEffect`, serves packets `0x70`, `0xC0` and `0xC7`. Field order: type u8, source serial u32, target serial u32, graphic u16, source x u16, y u16, z i8, target x u16, y u16, z i8, speed u8, duration u8, unknown u16, fixedDirection bool, doesExplode bool. `0xC0` adds hue u32 and render mode u32. `0xC7` adds tile id u16, explode effect u16, explode sound u16, serial u32, layer u8 and 2 skipped bytes. Source: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Network/PacketHandlers.cs
- Packet lengths from the table: `0x70` = 0x1C = **28 bytes**, `0xC0` = 0x24 = **36 bytes**, `0xC7` = 0x31 = **49 bytes**. Source: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Network/PacketsTable.cs
- Types: `Moving = 0`, `Lightning = 1`, `FixedXYZ = 2`, `FixedFrom = 3`, `ScreenFade = 4`. Source: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Data/GraphicEffectType.cs
- Blend modes: `Normal 0` (black is transparent), `Multiply 1`, `Screen 2`, `ScreenMore 3`, `ScreenLess 4`, `NormalHalfTransparent 5`, `ShadowBlue 6`, `ScreenRed 7`. The handler applies `% 7` to the value. Source: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Data/GraphicEffectBlendMode.cs
- GPU states in the view: Screen and ScreenMore use `One, One` (additive). Multiply uses `Zero, SourceColor`. ShadowBlue uses `ReverseSubtract`. Source: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/GameObjects/Views/GameEffectView.cs
- Timing. `ITEM_EFFECT_ANIMATION_DELAY = 50` ms. Duration on the wire is multiplied by 50 ms. Frame interval is `animdata FrameInterval x (speed x 10)` ms, or 50 ms when speed is 0. Sources: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Constants.cs and https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/GameObjects/GameEffect.cs
- Moving effects. The client steps the sprite toward the target each frame by `(100 + speed x 100) x deltaTime`, re-reads the target entity's position each update (so it homes), and rotates the sprite at run time with `AngleToTarget = atan2(-dy, -dx)` unless `fixedDirection` is set. It removes the effect when the remaining distance is 22 px or less. Source: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/GameObjects/MovingEffect.cs
- Explosion chaining. If `doesExplode` is set, arrival spawns fixed effect graphic `0x36CB` for 400 ms with the same hue and blend. One packet buys flight plus impact.
- Lightning is a fixed 10-frame sprite strip at graphic `0x4E20`, lifetime 400 ms, drawn with `BlendState.Additive`. It is not procedural. Sources: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/GameObjects/LightningEffect.cs and https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/GameObjects/Views/LightningEffectView.cs
- Culling. `EffectManager.Update` destroys any effect farther than the client view range. Source: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Managers/EffectManager.cs

### Inferences

- UO spends 36 bytes to do what Tibia does in 12, and gets hue, blend mode, homing and an automatic explosion. For Asterion the useful part is the idea, not the layout. A hue index and a blend flag could live in the effect definition instead of the packet.
- "Black is transparent" in Normal mode means UO effect art is authored on black, which suits additive or screen blending and avoids alpha channels.
- Run-time rotation works in UO because the art is larger and softer than 32 px pixel art.

### Gaps

- The unit of `Time.Delta` was not checked, so the moving speed in px per second is my reading of the code.
- Server-side values (which speed and duration each spell sends) live in ServUO or RunUO. I did not read them.

### See it in action

- ClassicUO project site: https://www.classicuo.eu/
- UOGuide spell list (not opened in this run): https://www.uoguide.com/Magery

---

## 3. Ragnarok Online (roBrowserLegacy, rAthena)

### Takeaway

RO moves almost everything to client data. The server sends a small id. The client expands it into a stack of layers, each with its own type, timing and blend function. RO also ships two player commands that cut effect load, and the data has a dedicated cheap variant for most effects.

### Cited findings

- `ZC_NOTIFY_EFFECT` (0x19b) is `int16 packetType, uint32 aid, uint32 effectId` = **10 bytes**. Source: https://github.com/rathena/rathena/blob/master/src/map/packets.hpp
- Ground skill units. `clif_getareachar_skillunit` picks the header by client date: `0x011f` (**16 bytes**), `0x099f` (**22 bytes**), `0x09ca` (**23 bytes**). The body carries unit id u32, source id u32, x u16, y u16 and the unit type. The server sends one packet per unit, and each unit has its own x and y. `0x120` removes a unit. Sources: https://github.com/rathena/rathena/blob/master/src/map/clif.cpp and https://github.com/rathena/rathena/blob/master/src/map/clif_packetdb.hpp
- Hidden traps are sent as `UNT_DUMMYSKILL` so the client has nothing to draw. Visibility is enforced by the server.
- Skill damage notification `0x01de` is 33 bytes and `0x01f3` (special effect) is 10 bytes in the packet table.
- The client maps unit type to an effect in a table: `UNT_PNEUMA -> EF_PNEUMA`, `UNT_ICEWALL -> EF_ICEWALL`, `UNT_QUAGMIRE -> EF_QUAGMIRE`, traps to named STR files. Source: https://github.com/MrAntares/roBrowserLegacy/blob/master/src/DB/Skills/SkillUnit.js
- EffectTable. roBrowserLegacy defines 640 effect ids. The constant list ends at `EF_MAX: 1884`. Each id maps to an array of layers. Layer types counted across the file: STR 1053, 3D 276, CYLINDER 149, FUNC 145, SPR 70, RSM 19, 2D 16, QuadHorn 15, WATERFALL 8, PRIM 4, TRAIL 2, AREA_SPAWN 2. Sources: https://github.com/MrAntares/roBrowserLegacy/blob/master/src/DB/Effects/EffectTable.js and https://github.com/MrAntares/roBrowserLegacy/blob/master/src/DB/Effects/EffectConst.js
- Layering example. Blessing (id 42) is one SPR layer (1500 ms, `head: true`, `yOffset: -120`), two "3D" particle layers (6 duplicates each, 1200 ms, delay offsets 300 and 400 ms, fade in and out, size 50) and a tinted ground glow (`alphaMax 0.3`, 2500 ms, `blendMode: 2`).
- STR format. Header `STRM`, version `0x94`, then `fps`, `maxKey`, `layernum`. Each layer has a texture list (128-byte names) and keyframes. A keyframe holds frame index, type, position, 4 UV pairs, 4 corner XY pairs, texture frame, animation type, delay, angle (stored in 1/1024 turns), RGBA colour, `srcalpha`, `destalpha` and a preset. Source: https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Loaders/Str.js
- STR playback. Key index is `((tick - startTick) / 1000) * fps`, so the file sets its own frame rate. Each keyframe sets `gl.blendFunc(D3DBLEND[srcalpha], D3DBLEND[destalpha])`. The D3DBLEND map covers ZERO, ONE, SRC_COLOR, SRC_ALPHA, DST_COLOR and their inverses. Blend mode is data per layer per keyframe. Source: https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/Effects/StrEffect.js
- `/mineffect`. `spamSTR` loads `Params.effect.min` instead of `Params.effect.file` when `Preferences.mineffect` is on. 584 entries in EffectTable have a `min` variant. Example: Angelus uses `angelus`, with `jong_mini` as the cheap file.
- `/effect`. `EffectManager.spam` returns early when `Preferences.effect` is off. All effects vanish. Source: https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/EffectManager.js

### Inferences

- A 5x5 ground spell is up to 25 unit packets at 16 to 23 bytes each, which is 400 to 575 bytes per viewer. RO pays the same per-tile cost as Tibia for ground areas, and each unit is also a gameplay object the client can target.
- The `min` variant is the best idea in this section for a crowded screen. The artist authors a second, cheaper flipbook per effect and the client swaps by a setting. Compare with mehah/otclient, which only lowers opacity.
- STR is a keyframed quad animation format. Position, corner offsets, rotation, colour and blend per key. It is small enough to port to a 2D canvas or a Godot `Sprite2D` plus tween.
- The per-layer `delayOffset` values (300 ms, 400 ms) are how RO staggers anticipation, burst and linger in data.

### Gaps

- I did not open individual STR files, so typical `fps` and layer counts are unknown.
- I did not verify how many unit packets Storm Gust or Fire Wall produce in rAthena's skill code.
- No measured frame cost for roBrowser effects.

### See it in action

- roBrowserLegacy repo and demo links: https://github.com/MrAntares/roBrowserLegacy
- RateMyServer skill database with animations (not opened in this run): https://ratemyserver.net/index.php?page=skill_db

---

## 4. RuneScape and OSRS (RuneLite, rsprot, 2009scape)

### Takeaway

RuneScape separates two clocks. The server thinks in 600 ms ticks. The client animates in 20 ms cycles. Every effect packet carries a start delay in client cycles, so the server can schedule a projectile and its impact graphic in the same tick and the client plays them in order.

### Cited findings

- `CLIENT_TICK_LENGTH = 20` ms (50 fps cap) and `GAME_TICK_LENGTH = 600` ms. Source: https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/Constants.java
- RuneLite's `Projectile` exposes id, source and target point or actor, start height, end height, start cycle, end cycle, remaining cycles, slope and start offset. The slope doc says larger slopes give "a more noticeable arc when thrown". A projectile with an actor target is re-aimed each frame. Source: https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/Projectile.java
- `MAP_PROJANIM` in rsprot (OSRS revision 230). Encoder writes target index 3 bytes, end time 2, source index 3, start height 1, progress 2, id 2, delta x 1, delta z 1, angle 1, end height 1, packed coord in zone 1, start time 2. Payload is **20 bytes** plus the opcode. Start and end times are in client cycles, "20ms/cc". `progress` moves the start point along the path, 128 units per tile. Sources: https://github.com/blurite/rsprot/blob/master/protocol/osrs-230/osrs-230-desktop/src/main/kotlin/net/rsprot/protocol/game/outgoing/codec/zone/payload/MapProjAnimEncoder.kt and https://github.com/blurite/rsprot/blob/master/protocol/osrs-230/osrs-230-model/src/main/kotlin/net/rsprot/protocol/game/outgoing/zone/payload/MapProjAnim.kt
- `MAP_ANIM` (spot animation on a tile). Encoder writes packed coord 1, height 1, delay 2, id 2. Payload is **6 bytes** plus the opcode. Delay is in client cycles. Source: https://github.com/blurite/rsprot/blob/master/protocol/osrs-230/osrs-230-desktop/src/main/kotlin/net/rsprot/protocol/game/outgoing/codec/zone/payload/MapAnimEncoder.kt
- Coordinates are 3 bits per axis inside an 8x8 zone. The zone base is sent once and shared by all events in that zone.
- 2009scape (2009-era server). Default projectile is start height 40, end height 36, start delay 41, angle 5. Speed is `46 + distance x 5` for ranged and `46 + distance x 10` for magic. Source: https://gitlab.com/2009scape/2009scape/-/blob/master/Server/src/main/core/game/node/entity/impl/Projectile.java
- 2009scape positioned graphic. Opcode 26 plus 2 bytes sets the zone, then opcode 17 with offset 1, id 2, height 1, delay 2. **9 bytes** in total. Source: https://gitlab.com/2009scape/2009scape/-/blob/master/Server/src/main/core/net/packet/out/PositionedGraphic.java

### Inferences

- If 2009scape's "speed" is the end cycle, a magic projectile over 5 tiles ends at cycle 96, which is 1920 ms after the cast, with flight starting at cycle 41 (820 ms). That fits a 600 ms tick game where the cast animation plays first. I did not confirm that reading in the packet encoder.
- The delay field is the part worth copying. It lets one server message per tick describe "missile now, impact in 300 ms" with no second message and no client guesswork. Tibia's new protocol has a DELAY command for the same purpose.
- Start height, end height and slope give a lobbed arc for 3 extra bytes. In a 2D top-down game the same three numbers can drive a fake-height offset and a shadow.
- Zone-relative coordinates cut a position from 5 bytes to 1. For an area spell with many events in one 8x8 block this beats Tibia's 5-byte position per tile.

### Gaps

- The 2009scape projectile packet encoder was not found at the paths I tried.
- The exact client-side arc formula from slope was not read. RuneLite exposes the value but the maths is in the obfuscated client.
- Spot animation frame timing is in cache data, not in these repos.

### See it in action

- OSRS wiki projectile page (not opened in this run): https://oldschool.runescape.wiki/w/Projectile
- RuneLite: https://github.com/runelite/runelite

---

## 5. Realm of the Mad God (projectile patterns as data)

### Takeaway

RotMG defines bullet motion as a closed-form function of elapsed time. The client and server both evaluate it. The network only needs the spawn event. One XML block with five numbers describes a straight, wavy, boomerang or figure-eight shot.

### Cited findings

Source is the decompiled Flash client kept in a private-server project, not Deca's own repository: https://github.com/Slendergo/TKR/blob/main/TK-Client/src/com/company/assembleegameclient/objects/Projectile.as and `ProjectileProperties.as` in the same folder.

- XML fields read by `ProjectileProperties`: `LifetimeMS`, `Speed`, `Size`, `Damage` or `MinDamage` and `MaxDamage`, `ConditionEffect`, flags `MultiHit`, `PassesCover`, `ArmorPiercing`, `ParticleTrail` (with `intensity` and `lifetimeMS` attributes and a colour), `Wavy`, `Parametric`, `Boomerang`, `FaceDir`, `NoRotation`, and numbers `Amplitude` (default 0), `Frequency` (default 1), `Magnitude` (default 3).
- Distance: `dist = elapsed * (speed / 10000)` tiles, with elapsed in ms. Speed 100 is 10 tiles per second.
- Amplitude and frequency: `deflection = amplitude * sin(phase + elapsed / lifetime * frequency * 2π)`, applied at a right angle to the flight direction. `phase` is 0 for even bullet ids and π for odd ids, so paired shots mirror each other.
- Wavy: `theta = angle + (π / 64) * sin(phase + 6π * elapsed / 1000)`. The heading wobbles 3 times per second.
- Parametric: `t = elapsed / lifetime * 2π`, `x = sin(t)`, `y = sin(2t)`, signs by bullet id, rotated by the angle and scaled by `magnitude`. This is a figure-eight.
- Boomerang: past half of `lifetime * speed / 10000`, distance counts back down.
- Deca's XML guide says Frequency is in "cycles per lifetime" and RealmEye gives range as speed times lifetime. Sources (search summaries, pages not opened): https://sites.google.com/decagames.com/xml-documentation/xml-guide and https://www.realmeye.com/wiki/weapon-attributes

### Inferences

- This is the right model for Asterion's aimed spells. Position as a pure function of `(spawn, angle, elapsed, bullet id)` needs no per-frame sync and lets the server validate hits by evaluating the same function.
- The even and odd phase flip is a one-line trick that turns a single wavy shot into a crossing double helix.

### Gaps

- The spawn packet layout was not read.
- The source is a third-party fork. Values may differ from the live game.

### See it in action

- RealmEye weapon attributes: https://www.realmeye.com/wiki/weapon-attributes

---

## 6. Not covered

MapleStory (WZ skill data with `effect`, `hit`, `ball`, `tile` layers), Graal and Lineage were in the brief as "if time allows". I ran out of budget before opening any source for them. Nothing in this file should be read as a finding about those games.

---

## Comparison table

Byte counts are for one event to one viewer, opcode included, transport framing excluded.

| Game (source) | What the server sends | Bytes | Who animates | Frame time | Blend mode |
|---|---|---|---|---|---|
| Tibia old protocol (OTClient, Canary) | effect id + tile | 7 (8 with u16 id) | client flipbook | 75 ms fixed, effect 33 at 300 ms | set by sprite data, opacity only in the client |
| Tibia old protocol | missile id + from tile + to tile | 12 | client, linear, `150 ms x sqrt(dist)` | static sprite, 1 of 9 directions | same |
| Tibia 12.03+ (TFS) | command loop at one tile: effect | 9 | client | 75 ms or per-frame from data | same |
| Tibia 12.03+ (TFS) | command loop: missile with int8 dx, dy | 11 | client | static sprite | same |
| Tibia 12.03+ (Canary) | effect or missile with u16 id and optional source byte | 10 to 11, 12 to 13 | client, alpha by source in mehah/otclient | same | per-source alpha |
| Tibia area spell | one effect message per tile | 7 to 11 x tiles (73-tile UE: 511 to 730) | client | 75 ms | same |
| Tibia field | a map item that decays | item add, then one change per 120 s | client item animation | 500 ms | none |
| UO 0x70 (ClassicUO) | type, source, target, graphic, two positions, speed, duration, flags | 28 | client, homing, run-time rotation | 50 ms base x speed | normal, black transparent |
| UO 0xC0 | same plus hue and render mode | 36 | client | same | 8 modes, Screen is additive `One, One` |
| UO 0xC7 | same plus particle data | 49 | client | same | same |
| UO lightning | type 1 in the same packet | 28 to 36 | client, 10-frame strip, 400 ms | about 40 ms (inference) | additive |
| RO effect (rAthena) | actor id + effect id | 10 | client, layered STR, SPR and particle layers | per file `fps` | per keyframe `srcalpha, destalpha` |
| RO ground unit | unit id, source id, x, y, unit type, one per cell | 16, 22 or 23 | client loop until remove packet | per file `fps` | per keyframe |
| OSRS spot anim (rsprot 230) | zone coord, height, delay, id | 6 + opcode | client | 20 ms client cycle, frame lengths in cache | model based |
| OSRS projectile | ids, heights, start and end cycle, angle, progress, source and target index | 20 + opcode | client, arc from slope, tracks target | 20 ms client cycle | model based |
| RS 2009 positioned graphic (2009scape) | zone set + id, height, delay | 9 | client | 20 ms client cycle | model based |
| RotMG (TKR fork) | spawn only, layout not read | not read | client and server evaluate the same formula | every frame | not read |

---

## What I would take for Asterion (inference)

1. Keep Tibia's `(id, tile)` message and its 75 ms default. Add one "area" message with a mask id so a UE is about 9 bytes instead of 511.
2. Keep the 3x3 direction sheet for missiles and the `150 x sqrt(d)` flight time. It caps flight at about 450 ms across a screen.
3. Add a delay field in client ticks (OSRS, Tibia DELAY) so cast, travel and impact arrive in one message.
4. Put blend mode and hue in the effect definition (UO, RO), not in the packet.
5. Author a `min` variant per effect (RO) and add per-source opacity (mehah/otclient). Use both for the 30-caster case.
6. Use closed-form projectile paths (RotMG) for aimed spells.
7. Make lingering effects map objects with a decay chain (Tibia fields). They cost nothing per frame on the network.

---

## Sources

Tibia family
- https://github.com/edubart/otclient/blob/master/src/client/effect.cpp
- https://github.com/edubart/otclient/blob/master/src/client/effect.h
- https://github.com/edubart/otclient/blob/master/src/client/missile.cpp
- https://github.com/edubart/otclient/blob/master/src/client/const.h
- https://github.com/edubart/otclient/blob/master/src/client/protocolgameparse.cpp
- https://github.com/mehah/otclient/blob/main/src/client/effect.cpp
- https://github.com/mehah/otclient/blob/main/src/client/missile.cpp
- https://github.com/mehah/otclient/blob/main/src/client/gameconfig.h
- https://github.com/mehah/otclient/blob/main/src/client/client.h
- https://github.com/mehah/otclient/blob/main/src/client/tile.cpp
- https://github.com/mehah/otclient/blob/main/src/client/protocolgameparse.cpp
- https://github.com/otland/forgottenserver/blob/master/src/const.h
- https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
- https://github.com/otland/forgottenserver/blob/master/src/networkmessage.cpp
- https://github.com/otland/forgottenserver/blob/master/src/combat.cpp
- https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- https://github.com/otland/forgottenserver/blob/master/src/condition.cpp
- https://github.com/otland/forgottenserver/blob/v1.4.2/data/spells/lib/spells.lua
- https://github.com/otland/forgottenserver/blob/v1.4.2/data/items/items.xml
- https://github.com/otland/forgottenserver/tree/v1.4.2/data/spells/scripts/attack
- https://github.com/opentibiabr/canary/blob/main/src/server/network/protocol/protocolgame.cpp
- https://github.com/opentibiabr/canary/blob/main/src/utils/utils_definitions.hpp

Ultima Online
- https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Network/PacketHandlers.cs
- https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Network/PacketsTable.cs
- https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Constants.cs
- https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Managers/EffectManager.cs
- https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/GameObjects/GameEffect.cs
- https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/GameObjects/MovingEffect.cs
- https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/GameObjects/LightningEffect.cs
- https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/GameObjects/Views/GameEffectView.cs
- https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/GameObjects/Views/LightningEffectView.cs
- https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Data/GraphicEffectType.cs
- https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Data/GraphicEffectBlendMode.cs

Ragnarok Online
- https://github.com/MrAntares/roBrowserLegacy/blob/master/src/DB/Effects/EffectTable.js
- https://github.com/MrAntares/roBrowserLegacy/blob/master/src/DB/Effects/EffectConst.js
- https://github.com/MrAntares/roBrowserLegacy/blob/master/src/DB/Skills/SkillUnit.js
- https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/EffectManager.js
- https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/Effects/StrEffect.js
- https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Loaders/Str.js
- https://github.com/rathena/rathena/blob/master/src/map/clif.cpp
- https://github.com/rathena/rathena/blob/master/src/map/packets.hpp
- https://github.com/rathena/rathena/blob/master/src/map/clif_packetdb.hpp

RuneScape
- https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/Projectile.java
- https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/Constants.java
- https://github.com/blurite/rsprot/blob/master/protocol/osrs-230/osrs-230-model/src/main/kotlin/net/rsprot/protocol/game/outgoing/zone/payload/MapProjAnim.kt
- https://github.com/blurite/rsprot/blob/master/protocol/osrs-230/osrs-230-desktop/src/main/kotlin/net/rsprot/protocol/game/outgoing/codec/zone/payload/MapProjAnimEncoder.kt
- https://github.com/blurite/rsprot/blob/master/protocol/osrs-230/osrs-230-model/src/main/kotlin/net/rsprot/protocol/game/outgoing/zone/payload/MapAnim.kt
- https://github.com/blurite/rsprot/blob/master/protocol/osrs-230/osrs-230-desktop/src/main/kotlin/net/rsprot/protocol/game/outgoing/codec/zone/payload/MapAnimEncoder.kt
- https://gitlab.com/2009scape/2009scape/-/blob/master/Server/src/main/core/game/node/entity/impl/Projectile.java
- https://gitlab.com/2009scape/2009scape/-/blob/master/Server/src/main/core/net/packet/out/PositionedGraphic.java
- https://gitlab.com/2009scape/2009scape/-/blob/master/Server/src/main/core/game/world/update/flag/context/Graphics.java

Realm of the Mad God
- https://github.com/Slendergo/TKR/blob/main/TK-Client/src/com/company/assembleegameclient/objects/Projectile.as
- https://github.com/Slendergo/TKR/blob/main/TK-Client/src/com/company/assembleegameclient/objects/ProjectileProperties.as
- https://sites.google.com/decagames.com/xml-documentation/xml-guide (search summary only)
- https://www.realmeye.com/wiki/weapon-attributes (search summary only)
