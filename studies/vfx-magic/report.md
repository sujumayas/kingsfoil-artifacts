# Top-down pixel magic: tiny algorithms for spell projectiles, auras, hit sparks and readable spell feedback

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #10 in our VFX series. Each study picks one concept and hunts for old-school algorithms that are very small and very efficient. The series reference is the **DOOM PSX fire** [S1]. One byte per pixel, one rule, one palette.

Spells fit that shape better than any topic so far. Tibia sends a spell effect as an id and a tile in 7 to 11 bytes, and the client plays a flipbook at a fixed 75 ms per frame [V, S14, S21]. Pokémon Emerald draws 355 moves from 192 small sprite sheets and a 48-command script [V, S49, S50].

Earlier studies already cover parts of this topic, and we link them instead of repeating them. **Combat juice** [S11] owns hitstop, the white hit flash, screen shake, damage numbers, cast bars, telegraph timing and effect tiers as a rule. **Light** [S6] and **Acid** [S3] own the light map and glow without alpha. **Fire** [S7] owns the DOOM fire. **Fog** and **Grass** [S9, S10] own world-locked dither and the measured-cost method.

This study goes deep on how the spell effects themselves are drawn, animated, layered, budgeted and kept readable.

**Two equal goals.**
- **Artistic quality.** What makes a spell look powerful and stay readable in pixel art.
- **Runtime efficiency.** What each technique costs on a weak web build. We benchmarked particles, flipbooks, glow, trails, lightning, tile areas, full-screen passes, auras and a whole 30-caster scene ourselves (§6a).

**Targets.** Godot 4, web-first, so the **Compatibility renderer** (WebGL 2, no compute shaders, limited 2D lights). Top-down 3/4 pixel art on 32x32 tiles for the Tibia-like MMORPG **Asterion Online**, which is server-authoritative, and a top-down RPG. Combat is hybrid. Targeted spells that cannot miss and aimed spells that can share one hotbar. The hard case is 30 players casting on one screen.

**Sources.** Fourteen research notes, the lead's verification note, our **Spell Sandbox** [S12] and our benchmark [S13], run on an Apple M4 Pro in Chromium 153. Measured pairs are written "M4 / 6x throttle". The second number is the DevTools 6x CPU throttle. It is a low-end phone proxy, not a phone. **No phone was measured.**

---

## 1. Executive summary

**Runtime efficiency.**

1. **The 30-caster fight fits.** Thirty missiles, thirty impacts, 148 tile effects, 1,300 particles, 4 chain bolts, 30 auras, glow, a shockwave and a vignette cost 0.26 / 1.5 ms in a hand-written pixel pipeline, 9% of a frame on the proxy. The same scene in WebGL2 at 320x180 costs 0.090 ms on the M4 [V, S13].
2. **The draw path decides the cost, not the effect.** 2,000 particles cost 0.020 / 0.13 ms as pixel writes and 1.66 / 10.5 ms as one `drawImage` each. Naive Canvas2D breaks the budget at 4x load, 3.97 / 24.9 ms [V, S13].
3. **Render at 320x180.** Thirty overlapping 73-tile area spells drawn as 32 px tiles at 1280x720 blend 39 screens of pixels per frame [V, S13]. One effect per tile caps the tile layer at 220 effects.
4. **Do not use GPU particles on a Godot web build.** One default GPUParticles2D took about 2 s to compile on web, and trails and sub-emitters do not exist in Compatibility [V, self-reported, S129; V, S127].
5. **Bytes are not the problem, fan-out is.** A Tibia effect is 9 bytes and a missile 11 in the current protocol. A 73-tile UE is 511 to 730 bytes per spectator because the protocol has no area message [V, S21, S26; I].

**Artistic quality.**

6. **Peak early, leave early.** Stock fighting-game sparks last 167 to 283 ms, and the strong spark is faster at the start, not longer [V, S102, S103]. Riot minimises linger on purpose [V, S104].
7. **Shape and motion carry the element.** Magicka gives each element one delivery shape [V, S85]. Our element table is author judgement (§6f).
8. **Whole pixels and pre-drawn directions.** Tibia picks one of 9 missile frames and never rotates [V, S16].
9. **Every large MMO ended up with a per-source dial.** FFXIV, WoW 11.2, GW2 and now Tibia let players turn other players' effects down. WoW and GW2 both shipped it with bugs that hid something that mattered [V, S109, S111, S31; U, S112].
10. **Three flashes per second is a hard limit.** A crowd of casters is the case the rule was written for [V, S118; I, note 07].

**Pretty and cheap.** Hit sparks on a 75 ms clock (C1), 8 pre-drawn directions (B1), midpoint lightning (B7), ramps with a dark edge (E2), cast circles (D5), status tints (D4), palette-ramp glow (G2) and seeded sigils (H3).

**Pretty but expensive.** One particle node per effect and GPUParticles2D on web (G1). Afterimage trails through `drawImage`, 1.0 / 6.35 ms for 240 missiles [V, S13]. Native-resolution effects over low-res art.

**Cheap but ugly.** Run-time rotation of small sprites (B1), smooth ribbons next to pixel art (B5), additive stacks that clip to white (G2) and per-frame strobing (F4).

**Recommendation for Asterion** [I]. The server sends five small events with a caster relation, and one area event instead of one effect per tile. A spell is a table of phases over a shared sprite library. The client draws stateless effects from a flat array into the 320x180 viewport, with palette ramps instead of alpha. A clarity manager tiers every effect by owner, caps live effects at 96 and merges same-tile sparks. A flash limiter holds the screen to 3 flashes per second (§7, §8).

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: code, paper, docs, data file or article, or our own measurement [S13]. "[V, vendor]" and "[V, self-reported]" mark figures reported by their own authors or sellers. |
| **[I]** | Author inference, arithmetic or design proposal. Untested unless it says "Sandbox", and then tested only in our JavaScript prototype. |
| **[U]** | Unverified: memory, a search snippet, or a page that could not be fetched. Treat it as a lead. |
| **[K]** | Textbook or canonical knowledge (maths, well-known release years). |

- [S#] refers to §14. "[I, note 0X]" is an inference made by the researcher in that note.
- Ratings (1–5) are author judgement: **Simplicity · Speed · Pixel taste · Mood · Readability**.
- **Readability** asks whether a player can tell what the effect is, whose it is and where it hurts.
- **Speed follows the measurements** [S13]. 5 means under about 0.1 ms of CPU at 30-caster counts on the M4, or one batched GPU draw. 4 means a cost that needs a cap.
- **Measured pairs are "M4 / 6x throttle"**, in ms per frame. GPU figures are M4 wall-clock times. The throttle does not model a phone GPU.
- The Sandbox is a Canvas 2D page with 16 px tiles, not a Godot build.

---

## 3. Generations: a timeline

**Gen 1: papers, palettes and console scripts (1983–1996)**
- **1983** Reeves publishes particle systems, with stochastic emission and additive colour [V, S91]. **1984** Niemeyer, Pietronero and Wiesmann model dielectric breakdown, the physics behind branching bolts [V, S93].
- **1991** Zelda: A Link to the Past builds medallion spells from 16 px tiles and palette flashes [K; V, S55]. **1992** Wolfenstein 3D dissolves the screen with a 17-bit LFSR [K; V, S97].
- **1994** Final Fantasy VI scripts 406 attack animations [K; V, S54]. **1996** Diablo ships missile tables with ramping lights, and Quake blends the screen red on damage [K; V, S56, S83].

**Gen 2: effects as ids and table rows (1997–2006)**
- **1997** Tibia and Ultima Online send effects as small packets and animate on the client [K; V, S15, S32]. **Dec 1997** A 12 Hz red and blue flash in a Pokémon episode sends 685 viewers to hospital [V, S121].
- **2000** Diablo II defines 742 missile rows and back and front overlays [K; V, S58]. **2002** Ragnarok Online ships a reduced variant per effect [V, S48; U on the year, note 13].
- **2004** Pokémon Emerald runs 355 moves on a 48-command script. Latta describes stateless particles at GDC [K; V, S49; U, S92].

**Gen 3: indie code and style guides (2007–2019)**
- **2007** Curl noise, and Kim and Lin's fast lightning [V, S96, S94]. **2009** Drilian's midpoint lightning with max-blended glow [V, S87].
- **Oct 2017** Riot publishes its VFX style guide [V, S104].
- **2019** Noita enters early access with data-defined projectiles and three-layer trails [V, S86].

**Gen 4: crowd dials, Godot on the web and measured costs (2020–2026)**
- **Jun 2023** Guild Wars 2 adds "Hide Ally Visual Effects" and patches hidden telegraphs three weeks later [U, S112].
- **Feb 2024** Glow lands in Godot's Compatibility renderer for 4.3. **Dec 2024** 2D instance uniforms are merged for 4.4 [V, S134, S126].
- **Jul 2025** WoW 11.2 cuts spell density from six levels to three [V, S111]. **Oct 2025** Tibia teases three spell opacity sliders [V, S31].
- **Aug 2026** Godot 4.7.2 is the current stable [V, S141]. **Nov 2026** Our spell benchmark and Sandbox [V, S13, S12].

---

## 4. Technique profiles

There are eight families:

- **A.** Roots, effects as data
- **B.** Projectiles and trails
- **C.** Impacts, areas and residue
- **D.** Auras, shields, status and cast circles
- **E.** Element language and art rules
- **F.** Clarity in a crowd, screen feedback and accessibility
- **G.** Rendering and blending in Godot 4 Compatibility
- **H.** Procedural old-school algorithms

Each profile ends with ratings for **Simplicity · Speed · Pixel taste · Mood · Readability** (1 = poor, 5 = excellent; author judgement). Every cost field gives a number. Measured figures come from our benchmark [S13] unless another source is named, and pairs read "M4 / 6x throttle".
### Family A: Roots, effects as data

### A1. Tibia magic effect: an id, a tile and a 75 ms clock

*In plain words.* The server says "effect 7 on this square". The client looks up a small flipbook and plays it at one fixed speed.

*How it works (technical).*
- **Clock** [V, S14, S15]. `EFFECT_TICKS_PER_FRAME = 75`. The phase is `min(elapsed / 75, phases - 1)` and the effect removes itself after `75 x phases` ms. Effect id 33 is hard-coded to 300 ms per frame.
- **Wire size** [V, S18, S22, S21, S26]. The old protocol sends opcode 1 + position 5 + id 1 = 7 bytes. From protocol 12.03 TFS sends 9 bytes and Canary 10 or 11.

*Cost / performance.* One live effect is an id, a tile and a start time. 148 live 16x16 tile effects cost 0.047 / 0.28 ms as pixel blits and 0.0031 ms in one GPU batch [V, S13]. A typical 8-frame effect lasts 600 ms [I, note 01].

*Games that used it.*
- Tibia (OTClient source): https://github.com/edubart/otclient/blob/master/src/client/effect.cpp
- Tibia (TFS effect ids): https://github.com/otland/forgottenserver/blob/master/src/const.h

*How it feels.* Chunky and instant. 13.3 frames per second looks hand-made next to 60 Hz movement, and it matches the 75 ms spark rule in Combat juice B4 [S11].

*Risks.* The model has no area message, so cost grows with tile count (A3) [I, note 01].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 3 · Readability 4

### A2. Tibia missile: nine frames and `150 x sqrt(tiles)`

*In plain words.* A Tibia missile is one still picture chosen from a 3x3 sheet of directions. It slides from caster to target, and far shots fly faster so nothing takes longer than half a second.

*How it works (technical).*
- **Direction** [V, S16]. NW (0,0), N (1,0), NE (2,0), W (0,1), centre (1,1), E (2,1), SW (0,2), S (1,2), SE (2,2). The client picks once from the from and to tiles and never rotates.
- **Duration** [V, S16]. `m_duration = 150 * std::sqrt(m_delta.length())` with the delta in tiles. Position is a linear lerp. The animation phase stays at 0.
- **Cannot miss** [I, note 03]. For a targeted spell, lerp to the target's current position by `t = age / duration`. The missile lands on time with no steering.

*Cost / performance.* One sprite per missile and no trail. 30 missiles with trails cost 0.05 ms on the throttled proxy inside the 30-caster scene [V, S13]. Zero bytes per frame on the network [V, S16].

*Games that used it.*
- Tibia (OTClient source): https://github.com/edubart/otclient/blob/master/src/client/missile.cpp

*How it feels.* A near shot is slow enough to see and a screen-wide shot does not drag.

*Risks.* No trail and no animation, so the missile alone carries the read [I, note 01].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 3 · Readability 4

### A3. Area masks: one effect per tile, and the 73-tile UE

*In plain words.* An area spell is a small grid of ones and zeros. The server walks the grid and sends one effect for every marked tile.

*How it works (technical).*
- **Mask** [V, S24]. A 2D Lua array. `1` is a hit tile, `3` is the caster tile, `0` is empty. Wave and beam masks put the `3` on the bottom row and the engine rotates them to the caster's facing.
- **Sizes** [V, S24, lead count]. `AREA_CIRCLE3X3` has 37 tiles. `AREA_CIRCLE5X5`, the UE, has 73 (rows 1, 5, 7, 9, 9, 11, 9, 9, 7, 5, 1). `AREA_WAVE4` has 12 and a Canary boss mask has 101 [V, S27].
- **Bytes** [V, S18, S26; I]. 73 tiles x 7 bytes = 511 bytes per spectator per cast in the old protocol, 730 at 10 bytes. With 30 spectators that is 15.3 to 21.9 KB for one cast.

*Cost / performance.* 30 casters firing the UE at once is 2,190 live tile effects. That costs 2.2 / 14.1 ms with one `drawImage` each, 0.51 / 2.87 ms as pixel blits and 0.024 ms in one GPU draw. Keeping one effect per tile caps it at 220 effects, 0.060 / 0.39 ms [V, S13].

*Games that used it.*
- Tibia (TFS area masks): https://github.com/otland/forgottenserver/blob/v1.4.2/data/spells/lib/spells.lua
- Tibia, Hell's Core in Canary: https://github.com/opentibiabr/canary/blob/main/data/scripts/spells/attack/hells_core.lua

*How it feels.* The "UE look". A clean diamond edge fills the screen for 600 ms and every player knows what happened [I, note 04].

*Risks.* 39 screens of overdraw if 30 UEs draw as 32 px tiles at 1280x720 [V, S13].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 4 · Pixel taste 4 · Mood 4 · Readability 5

### A4. Pokémon battle scripts: a spell is a short program over shared sprites

*In plain words.* Pokémon Emerald has no art per move. It has a library of tiny sprites and a script per move that says spawn this, wait 2 frames, shake that, tint the target.

*How it works (technical).*
- **Interpreter** [V, S49]. 48 commands, opcodes 0x00 to 0x2F. The ones that matter are `loadspritegfx`, `createsprite`, `createvisualtask`, `delay`, `waitforvisualfinish`, `playse`, `monbg`, `setalpha` and `fadetobg`.
- **Reuse** [V, S50, researcher's count, within 10%]. 355 moves load 192 distinct sheets. The median move loads 1 sheet. One hit splat, `ANIM_TAG_IMPACT`, is loaded 115 times. 40 moves load no sheet.
- **One sprite, many copies** [V, S50]. Flamethrower loads one sheet, a small ember. The script calls `FlamethrowerCreateFlames` 11 times, 2 sprites per call with `delay 2` after each. That is 22 embers over 44 frames, 0.73 s.

*Cost / performance.* A sheet is 0x200 to 0xA00 bytes with one 16-colour palette [V, S53]. A script is a few dozen bytes. For us the run-time cost is the sprites it spawns, about 0.93 µs per 16x16 `drawImage` or 0.21 µs per pixel blit [V, S13].

*Games that used it.*
- Pokémon Emerald, Flamethrower script: https://github.com/pret/pokeemerald/blob/master/data/battle_anim_scripts.s#L6311
- Pokémon Crystal, 48 command codes: https://github.com/pret/pokecrystal/blob/master/docs/battle_anim_commands.md

*How it feels.* Element identity comes from colour and motion more than from unique art [I, note 02].

*Risks.* Turn-based timing. Thunderbolt has 111 frames of explicit delay, 1.85 s, and a real-time MMO keeps the impact part only [V, S50; I, note 02].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Readability 4

### A5. Diablo missile tables: rows that chain, with a light attached

*In plain words.* Diablo keeps every spell as a row in a table. The row names the sprite, how many directions it has, how fast it flies, how long it lives, what light it carries and which other rows to spawn in flight and on hit.

*How it works (technical).*
- **Chaining** [V, S58, researcher's counts]. Diablo II has 742 missile rows, and `NumDirections` is 1 in 390 of them. 94 rows name a sub-missile released in flight, 89 a hit sub-missile and 102 an `ExplosionMissile`. Fire Bolt names `fireexplode`. Frozen Orb names `frozenorbbolt` in flight and `frozenorbnova` on expiry.
- **Light** [V, S58, S57]. 318 rows carry a light radius. Fire Bolt is radius 7 in RGB 255, 178, 64 and its explosion jumps to 13. Diablo I ramps explosions through `ExpLight = {2, 3, 4, 5, 5, 6, 7, 8, 9, 10, 11, 12}`.

*Cost / performance.* A row is a few dozen bytes of data. Half the rows need no direction art. The light is one stamp into the light map from study #5 [S6; I].

*Games that used it.*
- Diablo (DevilutionX missile sprites): https://github.com/diasurgical/devilutionX/blob/master/assets/txtdata/missiles/missile_sprites.tsv
- Diablo II (missile data): https://github.com/blizzhackers/d2data/blob/master/json/missiles.json

*How it feels.* The ramping light sells the hit more than the sprite does.

*Risks.* Deep chains are hard to budget, so cap the sub-missiles a row may spawn [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Readability 4

### A6. Fat packets: what Ultima, Ragnarok and RuneScape pay for

*In plain words.* Other MMOs send more bytes per effect than Tibia and get colour, blending, delays and arcs in return. Three of their ideas are worth the bytes or can move into client data.

*How it works (technical).*
- **Ultima Online** [V, S32, S33, S34]. One `GraphicEffect` layout at 28, 36 or 49 bytes carries type, source, target, graphic, two positions, speed, duration and flags. `0xC0` adds a hue and one of 8 render modes. Screen is additive `One, One`.
- **Ragnarok `min` variants** [V, S36, S39, S37]. A 10-byte packet carries an actor id and an effect id, and the client expands the id into layers. 584 entries name a cheaper file. `/mineffect` swaps to it and `/effect` turns everything off.
- **Old School RuneScape** [V, S40, S43, S42]. A 600 ms server tick and a 20 ms client cycle. A spot animation is 6 bytes plus opcode with a delay in client cycles. A projectile is 20 bytes with start and end cycle, two heights and an angle.

*Cost / performance.* A 5x5 RO ground spell is up to 25 unit packets of 16 to 23 bytes, 400 to 575 bytes per viewer [V, S36; I].

*Games that used it.*
- Ultima Online (ClassicUO): https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Network/PacketHandlers.cs
- Ragnarok Online (roBrowserLegacy): https://github.com/MrAntares/roBrowserLegacy/blob/master/src/DB/Effects/EffectTable.js

*How it feels.* The delay field lets one server tick say "missile now, impact in 300 ms" and the client plays them in order [I, note 01].

*Risks.* Run-time rotation works in UO because its art is larger and softer than 32 px pixel art [I, note 01].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 4 · Pixel taste 3 · Mood 4 · Readability 4

### A7. Console screen tricks: palette blends and the dark-then-flash beat

*In plain words.* The SNES and GBA could not afford big translucent sprites. They changed palettes, added one layer to another and dimmed the background before a bright spell.

*How it works (technical).*
- **Palette blend** [V, S52]. `BlendPalette` computes `c + (((target - c) * coeff) >> 4)` per channel with `coeff` 0 to 16. It recolours 16 palette entries, so the cost does not depend on sprite size.
- **Darken first** [V, S50]. Thunderbolt blends the background toward black with `coeff` 6 before the bolts, which leaves 10/16 of its brightness. Ice Beam uses `coeff` 7 (9/16 left) and tints the target toward RGB(0, 20, 31) with `coeff` 7.

*Cost / performance.* A palette row swap is free. On our CPU path an indexed frame resolved through a palette costs 0.071 / 0.45 ms for 320x180, and tints, flashes and day or night become row swaps inside that one pass [V, S13].

*Games that used it.*
- Pokémon Emerald, Thunderbolt: https://github.com/pret/pokeemerald/blob/master/data/battle_anim_scripts.s#L1075
- Final Fantasy VI (script macros): https://github.com/everything8215/ff6/blob/main/src/btlgfx/anim_script.mac

*How it feels.* The background darken is the cheapest "power" cue in the whole study [I, note 02].

*Risks.* Ether's 7.5 Hz and Thunderbolt's 5 Hz flicker break the 3 flashes per second limit at full-screen size (F4) [I, note 02].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Readability 3
### Family B: Projectiles and trails

### B1. Direction frames: 8 pre-drawn, never rotated at run time

*In plain words.* Draw the arrow pointing in 8 directions once, and pick a frame. Do not rotate a small sprite while it flies.

*How it works (technical).*
- **Tibia** [V, S16]. 9 frames in a 3x3 sheet, chosen once per missile.
- **Why rotation shimmers** [I, note 03]. Nearest-neighbour sampling of a rotated low-res sprite picks a different source texel when the angle changes by a fraction of a degree. Edges gain and lose single pixels every frame. A homing missile is the worst case.
- **Bake, do not rotate** [V, S88]. RotSprite scales 8x with a modified Scale2x, rotates and shrinks back, and "does not introduce new colors". Use it offline to make 16 directions.

*Cost / performance.* One sprite draw either way. The 8-frame strip is 2,048 px of texture [I, note 03]. A GPU batch of 480 sprites costs 0.019 ms [V, S13].

*Games that used it.*
- Tibia: https://github.com/edubart/otclient/blob/master/src/client/missile.cpp
- Shattered Pixel Dungeon (run-time rotation): https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/MissileSprite.java

*How it feels.* Crisp. Round shapes can pulse between two frames instead of turning [V, S99].

*Risks.* 8 directions look stiff on slow, long missiles. Go to 16 baked frames before you reach for a rotation shader [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 3 · Readability 5

### B2. Flight paths as pure functions of time

*In plain words.* Give the missile a formula, not a simulation. Position depends only on where it started, its angle and how long it has lived.

*How it works (technical).*
- **Realm of the Mad God** [V, S44, third-party fork]. `dist = elapsed * (speed / 10000)` tiles. Sideways `deflection = amplitude * sin(phase + elapsed / lifetime * frequency * 2π)`. `phase` is 0 for even bullet ids and π for odd ones, so paired shots mirror into a helix.
- **Speeds in shipped games** [V, S64, S65, S55; converted]. Shattered Pixel Dungeon throws at 240 px/s (15 tiles/s) and magic bolts fly at 200 px/s (12.5 tiles/s). Zelda's Fire Rod moves 4 px per frame, 15 tiles of 16 px per second.

*Cost / performance.* A few float operations per missile. No per-frame network traffic [I, note 01]. Aimed missiles need one tile lookup per tick against the server grid [I, note 03].

*Games that used it.*
- Realm of the Mad God (TKR fork): https://github.com/Slendergo/TKR/blob/main/TK-Client/src/com/company/assembleegameclient/objects/Projectile.as
- Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/MagicMissile.java

*How it feels.* A constant 10 to 15 tiles per second lets a player lead an aimed shot [I, note 03]. Combat juice E2 covers skillshot speed and width as a rule [S11].

*Risks.* The minimum readable missile at 320x180 is about 5x5 px with a 1 px core [I, note 03].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 3 · Readability 5

### B3. Homing with a turn limit

*In plain words.* The missile turns toward its target by a few degrees per frame and keeps its speed. It curves in.

*How it works (technical).*
- **Mindustry** [V, S72; converted]. `vel.setAngle(moveToward(rotation, angleTo(target), homingPower * delta * 50))`. Missiles use `homingPower = 0.08`, 4 degrees per tick. Acquire range 50 units, 6.25 tiles.
- **Turning circle** [I, note 03]. Radius is speed divided by turn rate in radians. At 12 tiles/s and 240 degrees/s it is 2.9 tiles. A target inside that circle is orbited, not hit. On the A2 clock a 10-tile shot averages about 21 tiles/s, and at 3.5 degrees per frame (210 degrees/s) the circle grows to about 5.7 tiles, so steering alone rarely lands.
- **Land on the server's clock** [I, Sandbox]. Steer at 3.5 degrees per frame, then blend onto the direct lerp over the last 40% of the flight so the missile arrives exactly when the server says it does.

*Cost / performance.* One `atan2` and a clamp per missile per frame. A struct-of-arrays step for 500 objects costs 0.0011 / 0.0066 ms [V, S13].

*Games that used it.*
- Mindustry: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/BulletType.java
- Terraria (tModLoader example): https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleHomingProjectile.cs

*How it feels.* The curve says "this one is chasing you".

*Risks.* The angle changes every frame, which is the worst case for run-time rotation (B1) [I, note 03].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Readability 4

### B4. Lobbed arc with a ground shadow

*In plain words.* The ball travels in a straight line on the ground and a second number lifts it on screen. The shadow stays on the ground line and tells the player where it will land.

*How it works (technical).*
- **Parabola** [I, note 03]. `ground = lerp(from, to, t)`, `h = 4 * H * t * (1 - t)`. Draw the shadow at `round(ground)` and the sprite at `round(ground - (0, h))`. Try `H` at half the distance, clamped to 8..48 px.
- **Mindustry artillery** [V, S73]. No collision in flight. `scaleLife = true` scales the lifetime so the shell lands on the aim point. Typical shells take 80 ticks, 1.33 s.

*Cost / performance.* Two sprites per projectile. Three extra bytes on the wire if the server sends heights, zero if the arc lives in the spell definition [I, note 01].

*Games that used it.*
- Mindustry: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/ArtilleryBulletType.java
- Old School RuneScape (RuneLite projectile slope): https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/Projectile.java

*How it feels.* The shadow is the true position and the readable part for anyone who must dodge [I, note 03]. Combat juice E3 has the telegraph timing [S11].

*Risks.* A lob with no shadow is unreadable in 3/4 view [I, note 03].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Readability 5

### B5. Trails: ribbon, afterimages or a particle wake

*In plain words.* Three ways to show where a missile has been. Keep its last few positions and join them with a thinning line, redraw the sprite at old positions in darker colours, or drop small particles behind it.

*How it works (technical).*
- **Ribbon** [V, S71, S76]. Mindustry stores 3 floats per point, adds one point per tick and tapers the width linearly. Shipped lengths are 7 and 9 points, 117 and 150 ms. After the bullet dies the trail shortens for `length * 1.4` ticks.
- **Pixel ribbon** [I, note 03]. A ring buffer of 8 points pushed on a fixed tick, joined by Bresenham lines with stepped widths 3, 2, 1, 1 px and palette steps instead of alpha. Skip the push if the missile moved less than 1 px.
- **Afterimages** [V, S80]. Terraria caches 5 old positions and tints copy `k` by `(n - k) / n`.
- **Three-layer wake** [V, S86; S12]. Noita's Spark Bolt carries three trail emitters with lives of 0.1 to 0.2 s, 0.6 to 0.8 s and 1.4 to 1.5 s. The Sandbox uses 0.1, 0.6 and 1.4 s.

*Cost / performance.* For 240 missiles a 12-point ring costs 0.044 / 0.27 ms as Bresenham lines, afterimages 1.0 / 6.35 ms through `drawImage` and a full-screen feedback buffer 0.066 / 0.41 ms [V, S13].

*Games that used it.*
- Mindustry (ribbon): https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/graphics/Trail.java
- Terraria (afterimages): https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleBullet.cs

*How it feels.* 100 to 150 ms of trail is the common shipped range [I, note 03]. I would pick the stepped ribbon for bolts and a short wake for fire.

*Risks.* A smooth tapering ribbon looks like vector art next to pixel sprites [I, note 03].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Readability 4

### B6. Beams and channels: stacked lines with a white core

*In plain words.* A beam is two or three lines drawn on top of each other, wide and dark outside, thin and white inside. A one-shot beam shrinks to nothing.

*How it works (technical).*
- **Mindustry laser** [V, S74]. Three colours outside in, each half the width of the last. Lifetime 16 ticks (267 ms). Length grows in over the first 20% of life. Width shrinks linearly to 0.
- **Pixel version** [I, note 03]. Layers of 5, 3 and 1 px in palette colours, drawn with thick Bresenham lines. A 20 Hz two-state flicker adds 1 px to the halo. A 2-frame start cap and a 3-frame end splash cover the line ends. A channel holds its width and re-casts its length every frame, as Mindustry's continuous laser does [V, S75].

*Cost / performance.* 3 lines and 2 sprites per beam [I, note 03]. As a guide, 40 lightning bolts of 48 segments each cost 0.095 / 0.62 ms as pixel lines [V, S13], so 30 beams are far below that.

*Games that used it.*
- Mindustry: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/LaserBulletType.java
- Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Beam.java

*How it feels.* A one-shot beam of 250 to 500 ms matches Mindustry's 267 ms and Shattered Pixel Dungeon's 0.5 s DeathRay [V, S74, S66].

*Risks.* A textured, rotated beam quad brings back shimmer at shallow angles [I, note 03].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Readability 5

### B7. Chain lightning by midpoint displacement

*In plain words.* Start with a straight line between caster and target. Split it in the middle and push the midpoint sideways by a random amount.

*How it works (technical).*
- **Textbook** [V, S87]. Each generation splits every segment and offsets the midpoint along the perpendicular by `random(-offset, offset)`, then halves the offset. 5 generations give 32 segments. A branch leaves a midpoint at 0.7 length and is drawn dimmer.
- **Chain rule** [V, S67; U, S89, S90]. Shattered Pixel Dungeon recurses to every character within 1 tile. Path of Exile Arc chains 4 to 7 times and Diablo II starts at 5 targets (wiki figures, not checked against game data).
- **Seed** [I, note 03]. The server sends target ids and one seed byte. Every client builds the same bolt.

*Cost / performance.* Generating a 32-segment bolt with 2 branches takes 0.17 µs. 40 bolts regenerated every frame cost 0.095 / 0.62 ms as pixel lines, 0.92 / 5.85 ms as canvas strokes and 0.054 ms in a GPU batch [V, S13].

*Games that used it.*
- Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Lightning.java
- Mindustry: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/Lightning.java

*How it feels.* Re-rolled every 3 frames it crackles. Every frame it looks like noise [I, note 12].

*Risks.* A bright halo that changes shape at 20 Hz is a large flicker. Keep the halo mid-value and the life at 300 ms or less (F4) [I, note 03].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Readability 4
### Family C: Impacts, areas and residue

### C1. Hit spark anatomy: flash, core, sparks, smoke

*In plain words.* A hit spark opens with its biggest, brightest shape and then shrinks, darkens and breaks apart. It is over in about a quarter of a second.

*How it works (technical).*
- **Fighting-game stock data** [V, S102]. MUGEN 1.1's `fightfx.air` has a light spark of 6 frames in 12 ticks (200 ms), a medium of 5 in 10 (167 ms) and a strong of 10 entries in 13 ticks (217 ms). The strong spark plays 5 frames at 1 tick, then a slower tail. The ms assume 60 ticks per second [I, note 13].
- **On the Tibia clock** [I, notes 04, 13; S12]. 3 to 5 frames at 75 ms. The Sandbox also has a front-loaded option of 33, 33, 50, 83 and 134 ms. The shape comes from MUGEN and the split is illustrative.

*Cost / performance.* 120 live 32x32 impacts cost 0.18 / 1.09 ms with `drawImage`, 0.10 / 1.01 ms as ramp blits and 0.0058 ms in one GPU batch [V, S13].

*Games that used it.*
- MUGEN 1.1 stock sparks: https://github.com/Tunlan/mugen-1.1b1/blob/HEAD/data/fightfx.air
- Ikemen GO: https://github.com/ikemen-engine/Ikemen-GO-Screenpack/blob/HEAD/data/fightfx.air

*How it feels.* Strength changes the art and the easing more than the length. Combat juice B4 covers the spark as a feel rule, with hitstop and the white flash [S11].

*Risks.* A spark longer than about 280 ms starts to look like a shockwave or a super [I, note 13]. We found no Capcom or Arc System Works primary data (§12).

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Readability 5

### C2. Explosions as stateless layers

*In plain words.* An explosion is a ring, a few sparks and a few smoke blobs, each with its own shorter or longer life. Nothing is stored per particle.

*How it works (technical).*
- **The pattern** [V, S77, S79]. A Mindustry effect is a function of id, time, lifetime, position, rotation and colour. `randLenVectors(seed, amount, length)` calls `rand.setSeed(seed)` and yields the same directions every frame. `fin()` is `time / lifetime`, `fout()` is `1 - fin`.
- **Nested lifetimes** [V, S77, S76]. `e.scaled(n, ...)` runs a block with its own shorter life. In `flakExplosion` (20 ticks, 333 ms) the yellow ring lives 6 ticks, 5 smoke discs shrink from radius 3.5 to 0.5 and 4 spark lines fly out.

*Cost / performance.* One live effect is about 16 bytes [I, note 04]. 2,000 particles cost 0.020 / 0.13 ms as pixel writes and 1.66 / 10.5 ms with one `drawImage` each. Stateless particles in a vertex shader cost 0.0095 ms for 2,000 and do not slow down when the CPU is throttled [V, S13].

*Games that used it.*
- Mindustry: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/Effect.java
- Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/bombs/Bomb.java

*How it feels.* White hot, then warm, then grey smoke, with fast expansion that slows [V, S99].

*Risks.* Stateless sparks cannot bounce or collide. Under 1 s nobody notices [I, note 04].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Readability 4

### C3. Ring-by-ring area waves

*In plain words.* Start the tiles nearest the caster first and each ring of tiles a moment later. The spell rolls outward as a wave instead of popping in all at once.

*How it works (technical).*
- **Delay floor in Canary** [V, S28]. Chain spells schedule hop `i` at `i * max(50, COMBAT_CHAIN_DELAY)` ms.
- **Mindustry `shockwaveDust`** [V, S77]. Rings 12 units apart. Ring `i` fires after `i * 3.5` ticks (58 ms) and each puff appears with chance `0.7 - 0.02 * i`, so outer rings are sparser.
- **Rule** [I, note 04]. Bucket mask tiles by rounded Euclidean distance (Chebyshev for square waves). Delay each ring by 55 ms, under one 75 ms frame so neighbours overlap. 5 rings take 275 ms from centre to edge.

*Cost / performance.* The same tile draws as A3, spread over more frames, so the peak is lower. One area event of about 11 bytes replaces 73 messages [I, S12].

*Games that used it.*
- Mindustry: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/Effect.java
- Diablo (Nova): https://github.com/diasurgical/devilutionX/blob/master/Source/missiles.cpp

*How it feels.* The wave gives a big spell a direction and an origin. I would use the wave for the caster's own ultimate and the in-phase version for others.

*Risks.* Damage lands on the server tick, not on ring arrival. If the wave is dodgeable, the server must own the ring timing [I, note 04].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Readability 4

### C4. Shockwave rings as geometry

*In plain words.* Draw a circle outline that grows fast, then slows, while its line gets thinner. It is gone in a fifth of a second.

*How it works (technical).*
- **Mindustry** [V, S76]. `shockwave` lives 10 ticks (167 ms). Radius grows 0 to 28 units, stroke 2.2 to 0.2, white to light grey.
- **Pixel ring** [I, note 04]. Midpoint circle, ease-out radius. Thickness 3 px, then 2 at 40% and 1 at 75% of the life. In the last 40%, drop pixels by a Bayer threshold so the ring breaks into dots.
- **Screen distortion** [V, S124]. The first node that reads `hint_screen_texture` makes Godot copy the full screen to a back buffer. Later nodes reuse that copy, so overlapping distortions do not see each other.

*Cost / performance.* A ring of radius 48 px touches about 300 pixels per pixel of thickness [I, note 04]. A CPU shockwave over the ring band with a frame copy costs 0.026 / 0.16 ms. A GPU distortion with the screen copy costs 0.021 ms at 320x180 and 0.039 ms at 1280x720 [V, S13].

*Games that used it.*
- Mindustry: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/content/Fx.java
- Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/wands/WandOfBlastWave.java

*How it feels.* A ring that keeps its thickness looks like a solid object. A thinning ring looks like pressure [I, note 04].

*Risks.* Distortion smears pixel art off the grid. Quantise the UV offset to whole source pixels [I, note 04].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Readability 4

### C5. Residue: capped decals and staged fields

*In plain words.* A spell can leave a mark. A scorch mark is decoration, so keep it dim, cap the count and let it fade.

*How it works (technical).*
- **Mindustry scorch** [V, S77, S78]. Decals live 3,600 ticks (60 s) on their own layer under units. Alpha drops only in the last 2% of the life. 10 sizes, 3 variants, rotation in 90 degree steps. Pooled and never synced.
- **Tibia fields** [V, S25]. Fire field 1487 lasts 120 s, decays to 1488, then to 1489, then to nothing. 360 s in three sprites. The client animates fields as items at 500 ms per frame [V, S17].
- **Decal rule** [I, note 04]. 8 to 15 s for a hit scorch. A ring buffer of 64. A new decal on a tile with the same kind refreshes the old one.
- **Field rule** [I, note 04]. Stage is `floor(3 * elapsed / total)`. Fields draw at full opacity for every viewer, with a different border for friend and foe.

*Cost / performance.* 64 decals are 64 small blits in one batch below characters. A field costs one item change per stage on the network, one per 120 s in Tibia [I, note 01]. The Sandbox compresses this to 12 s scorches and 3 stages of 4 s [S12].

*Games that used it.*
- Mindustry: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/comp/DecalComp.java
- Tibia (TFS items): https://github.com/otland/forgottenserver/blob/v1.4.2/data/items/items.xml

*How it feels.* A battlefield that remembers the fight. The Tibia fire that shrinks twice is a free dissipation phase [I, note 01].

*Risks.* Path of Exile 2 players report that they cannot tell their own ground effects from enemy ones, and Diablo IV players ask for an opacity slider [U, S107, S108].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Readability 3

### Family D: Auras, shields, status and cast circles

### D1. Back and front slots around the sprite

*In plain words.* An aura that wraps a character is two pictures. One is drawn before the body and one after.

*How it works (technical).*
- **Diablo II** [V, S60, S61]. Each state has `overlay1` to `overlay4`, used as front, back, start and end. `PreDraw` 1 means drawn behind the unit. Bone Armor is a 12-frame cast, then 24-frame front and back loops.
- **OTClient attached effects** [V, S29]. The creature draw walks the effect list twice and each effect checks `onTop`. The bit and the offset are per facing direction. The sample bat wings are on top facing north and west and behind facing south and east.
- **Four slots** [I, note 05]. Ground (under everyone), back, front, overhead. Draw the ground pass for all, then per y-sorted character back, body, front, then the overhead icons above every body.

*Cost / performance.* The halves are two sprites in the same y-sorted batch. 30 characters with a back aura, a front aura and 6 orbiters are 270 draws, 0.25 / 1.62 ms in Canvas2D, 0.039 / 0.24 ms as pixel blits and 0.0061 ms in a GPU batch [V, S13].

*Games that used it.*
- Diablo II (overlay data): https://github.com/blizzhackers/d2data/blob/master/json/overlay.json
- Tibia (OTClient attached effects): https://github.com/mehah/otclient/wiki/Tutorial-Attached-Effects

*How it feels.* The character stands inside the effect instead of under a sticker.

*Risks.* The D2R data guide states the `PreDraw` polarity backwards (§10). The Sandbox has no per-facing offsets [S12].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Readability 4

### D2. Orbiting motes, heal sparkles and haste ghosts

*In plain words.* Small code-driven loops around a character. A mote circles on a flat ellipse and hops between the back and front slots.

*How it works (technical).*
- **Orbit** [I, note 05]. A table of 24 whole-pixel positions on an ellipse with rx 14 to 18 px and ry 6 to 8 px. A mote is in front when `sin(angle) > 0`. Dim the back motes one palette step. Period 1.2 to 2.0 s.
- **Heal** [I, note 05; V, S105]. 4 to 6 sparkles rising 12 to 16 px over 400 to 600 ms. VFX Apprentice paces heals under 60 beats per minute.
- **Haste ghosts** [I, note 05; U, S110]. Capture the body frame every 4 frames into a ring of 3 to 5, drawn in the back slot in darker palette steps, only while moving.

*Cost / performance.* A table lookup per mote, no trigonometry per frame. 4 extra blits per hasted character. Ghosts as pixel blits cost 0.096 / 0.60 ms for 240 sprites with 4 ghosts each, against 1.0 / 6.35 ms through `drawImage` [V, S13].

*Games that used it.*
- Ragnarok Online (cylinder aura): https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Effects/Cylinder.js
- Shattered Pixel Dungeon (Flare): https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Flare.java

*How it feels.* Under 1 s per turn an orbit looks frantic and competes with attacks [I, note 05].

*Risks.* Six buffs must not mean six orbits. Add a mote per buff to one orbit, 4 at most [I, note 05].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Readability 3

### D3. Shields: the rim is the message

*In plain words.* Show a shield by its edge, leave the character visible inside, and spend the effort on the moment it is hit and the moment it breaks.

*How it works (technical).*
- **Tibia draws nothing** [V, S23, S30]. Magic Shield is a status icon. Each absorbed hit sends `CONST_ME_LOSEENERGY` on the tile and a blue number.
- **Diablo II Energy Shield** [V, S61]. An 8-frame ball, plus 8 directional hit overlays of 9 frames each. Hits 3, 4 and 5 are drawn behind the body.
- **Shattered Pixel Dungeon** [V, S81]. One additive disc in `0xBBAACC`. On break it scales from 1x to 2x radius over about 1 s while alpha falls to 0.
- **Riot** [V, S104]. On Leona's shield the border of the circle is the primary element, because players must read the radius. A defensive spell has low saturation, high opacity and a clear silhouette.

*Cost / performance.* A hit-only spark costs nothing while idle. A persistent loop per shielded player is 30 extra animated overlays in a 30-player fight [I, note 13]. The rim is one or two sprites in the aura batch (D1).

*Games that used it.*
- Diablo II (Overlay.txt): https://github.com/fabd/diablo2/blob/master/code/d2_113_data/Overlay.txt
- Shattered Pixel Dungeon (ShieldHalo): https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/ShieldHalo.java

*How it feels.* The directional hit flash tells the owner where the blow came from. I would ship the rim for the owner and party, and Tibia's hit-only spark for everyone else.

*Risks.* Loud shield bubbles are the reverse of Riot's scale, which puts defensive spells below damage spells [V, S104; I, note 13].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Readability 5

### D4. Status looks: one tint by priority plus a small overlay

*In plain words.* A burning, poisoned or frozen character gets one colour change on the whole body and one small extra, such as a flame or an icon. If several statuses apply, the most important one owns the tint.

*How it works (technical).*
- **Ragnarok** [V, S45]. One multiply colour per entity. Frozen is 0.0, 0.4, 0.8 with the pose held. Poison is 0.9, 0.4, 0.8. Curse is 0.50, 0.15, 0.10 with a head icon at 0.5 opacity. Stone is 0.1 grey with the animation paused. Tints multiply, so stacked statuses go dark.
- **Diablo II** [V, S60]. One tint wins by `colorpri`, ties go to the lower state id. Tints are palette rows.
- **Plan** [I, note 05]. Burning flickers between two orange rows at 6 to 8 fps with 2 small flames. Poisoned pulses green at 1 Hz with a drip per second. Shocked blinks one white frame at 2 to 3 Hz. Frozen holds the pose.

*Cost / performance.* A pre-tinted cached sprite or a palette swap at blit time costs nothing extra. A per-frame `getImageData` remap costs 9 ms for 30 characters on a GPU-backed canvas. On the GPU a per-instance tint attribute keeps one draw at 0.0065 ms and a per-sprite uniform costs 0.015 ms [V, S13].

*Games that used it.*
- Ragnarok Online: https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Entity/EntityState.js
- Diablo II (States.txt guide): https://d2runewizard.com/game-files/guide.html

*How it feels.* Freezing the pose is half of the read [I, note 05].

*Risks.* Many shocked characters blinking out of phase add up to a large flickering area. Sync the blink to a global clock (F4) [I, note 05].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Readability 5

### D5. Cast circles and charge-ups

*In plain words.* While a spell is being cast, a ring of runes draws itself under the caster and small lights gather at the hands. Other players learn who is casting, which element, and for how long.

*How it works (technical).*
- **Ragnarok cast packet** [V, S46]. Skill, target or ground position, cast time and an element code. The element picks the aura colour, and `delayTime` sets how long the markers live.
- **Ground marker** [V, S47]. One texture on the ground, drawn before entities, rotating at 40 degrees per second (9 s per turn), sized from a per-skill table of 1, 5, 7 or 13 tiles, with a hard alpha cutout.
- **Procedural circle** [I, note 05]. An outer ring, 8 to 12 glyphs of 3x3 px, an inner ring and a polygon chosen by element. Flatten 2 to 1, so 40x20 px for a 32 px character. Rotate by moving glyphs between 32 precomputed positions, never by rotating a bitmap.

*Cost / performance.* A 40x20 circle is about 100 ring pixels, 10 glyphs and 3 to 6 lines. Baked, 8 elements of 32 frames fit a 512x512 atlas and draw as one quad per caster [I, note 05]. The cast event is 8 bytes in the Sandbox (illustrative) [S12].

*Games that used it.*
- Ragnarok Online (MagicTarget): https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Effects/MagicTarget.js
- Ragnarok Online (LockOnTarget): https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Effects/LockOnTarget.js

*How it feels.* Slow rotation reads as charging and fast rotation reads as threat. Combat juice E1 and E3 cover cast bars, aim previews and telegraph timing [S11].

*Risks.* A cast under 300 ms has no time for a draw-in. We found no source on cast circles in Golden Sun, Genshin or Wizard of Legend (§12).

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 5 · Mood 5 · Readability 5
### Family E: Element language and art rules

### E1. Timing: wind-up, a climax in the first frames, a short tail

*In plain words.* A spell has three beats. A brief gathering, a peak that arrives almost at once, and a fade that is shorter than feels natural.

*How it works (technical).*
- **Riot** [V, S104]. Every effect needs "anticipation and dissipation". The guide prefers dynamic timing to linear timing and says "We intentionally minimize an effect's linger duration". It gives no percentages and no durations.
- **The 25% rule is not Riot's** [V, S101, S104]. VFX Apprentice's summary puts the peak "within the first quarter" of the life. The PDF does not say that.
- **Cover limit** [I, note 06]. An effect may hide the target sprite for 100 to 150 ms, 2 frames at 75 ms.

*Cost / performance.* None. Timing is data. Shorter effects lower the number of live effects, which is the real cost in a crowd [I].

*Games that used it.*
- League of Legends (VFX updates): https://www.leagueoflegends.com/en-us/news/dev/dev-behind-the-scenes-of-vfx-updates/
- MUGEN stock sparks: https://github.com/Tunlan/mugen-1.1b1/blob/HEAD/data/fightfx.air

*How it feels.* The cast circle is the anticipation, the flash frame is the climax and the residue is the dissipation. In a real-time MMO the anticipation is also the telegraph, so it has gameplay weight (Combat juice E3 [S11]).

*Risks.* "If your FX feel long, they're waaaaay too long" [V, S101].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 5 · Readability 5

### E2. Ramps, outlines and value contrast against busy ground

*In plain words.* Draw energy as 4 or 5 hard colour steps from a light core to a dark edge. Give anything that flies an outline.

*How it works (technical).*
- **Ramp** [V, S99; I, note 06]. "The color starts white hot and fades to warm hues, then to gray." Use 3 to 5 steps and shift hue as value drops.
- **No 100% or 0%** [V, S104]. "Avoid using 100% or 0% values", for value and for saturation. The reason is confusion with environment or UI. In a ramp, the top step is an off-white tinted to the element, and true white belongs to the 1-frame flash [I, note 13].
- **Outlines** [V, S99, S100]. A double outline, one bright and one dark, reads on any background. Keep ground tiles in the middle values so spells own the bright end [I, note 06].

*Cost / performance.* A ramp is a 6-entry table. Recolouring per element or per tier is a table swap, and the ramp blit costs 0.036 / 0.24 ms for 30 impacts of 32x32 [V, S13].

*Games that used it.*
- League of Legends (clarity rules): https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/
- VALORANT (hard edges, thin opaque outlines): https://www.riotgames.com/en/news/valorant-shaders-and-gameplay-clarity

*How it feels.* A small effect with a hot core looks stronger than a large flat one.

*Risks.* Additive blending clips to white on snow and sand [I, note 06].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Readability 5

### E3. Element language and colour-blind safety

*In plain words.* Each element needs its own shape and its own motion, because hue is the weakest channel. Fire rises in tongues.

*How it works (technical).*
- **Delivery by rule** [V, S85]. Magicka ties each element to one delivery shape. Water, fire and cold are sprays. Life and arcane are beams. Earth is a single projectile. Lightning "jumps to nearby units".
- **Motion from code** [V, S68, S69, S70]. In Shattered Pixel Dungeon fire particles launch upward at 32 to 64 px/s, gas specks live 1 to 3 s and turn at 30 degrees per second, and the holy flare spins at 180 degrees per second.
- **Our table** [I, notes 04, 06]. §6f. It is author judgement built from genre convention.
- **Colour-blind** [V, S116]. No essential information by colour alone. Red-green difficulty affects "around 8-10% of males". Orange against blue works for the three common types.

*Cost / performance.* The hostile hue is one ramp row that a setting can swap, at no run-time cost [I, note 06]. The Sandbox's colour-blind palette is one table swap [S12].

*Games that used it.*
- Magicka: https://magicka.fandom.com/api.php?action=parse&page=Elements&prop=wikitext&format=json
- Shattered Pixel Dungeon (particle effects): https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Speck.java

*How it feels.* A player reads "spray means fire or cold, beam means holy or arcane" from motion alone [I, note 13].

*Risks.* Overwatch players noticed abilities left in default red after the colour setting changed [U, S117]. Hues for most games in this profile are unsourced (§12).

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Readability 5

### Family F: Clarity in a crowd, screen feedback and accessibility

### F1. Owner tiers and per-source opacity

*In plain words.* Every effect knows whose it is. Yours and your enemies' draw in full, and everyone else's draw faint and simple.

*How it works (technical).*
- **Tibia** [V, S31, S19]. A teaser of 2025-10-22 shows spell opacity sliders for own spells, other players and monsters, 0 to 100%. mehah/otclient already multiplies effect alpha by source.
- **Tag at the source** [I, note 07; V, S106]. Mark every effect layer as gameplay or cosmetic in the spell data. Tiers cut cosmetic layers only. VALORANT keeps gameplay VFX identical on low, medium and high.
- **Sandbox rules** [S12; I]. Others reduced means 40% opacity by ordered dither, 50% of particles, no white first frame, every second area tile, no glow and no decals. Party loses 30% of particles and all screen feedback.

*Cost / performance.* Clarity on saves 26% at 1x load and 16% at 16x on the CPU, 0.26 to 0.20 ms on the M4 and 1.5 to 1.11 ms throttled. Glow drops from 0.44 to 0.09 ms on the proxy [V, S13]. Opacity by ramp swap or dither is free.

*Games that used it.*
- Final Fantasy XIV: https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_bteffect.html
- World of Warcraft 11.2: https://blizzardwatch.com/2025/07/28/blizzard-adding-new-ways-reduce-spell-density-better-performance-visibility-patch-11-2

*How it feels.* Clarity is a readability tool first. Combat juice F5 states the tier rule. This profile supplies the numbers [S11].

*Risks.* Both newest dials shipped with bugs that hid something that mattered [V, S111; U, S112].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 3 · Readability 5

### F2. Budgets: a cap, priority eviction and same-tile merge

*In plain words.* There is a fixed number of effect slots. When they are full, the least important effect that is closest to finishing gives up its slot.

*How it works (technical).*
- **Unreal Niagara** [V, S113; U, S114]. Every effect belongs to an Effect Type with an instance cap. A significance handler ranks instances by distance or age.
- **Tibia servers do none of it** [V, S23, S21]. `addMagicEffect` sends every effect to every spectator with no rate limit, merge or priority. The client must carry the budget.
- **Sandbox rules** [S12; I]. 96 live effects. Priority is own, hostile, party, others. Eviction starts with others, takes residue before missiles and prefers the effect nearest its end. A hostile telegraph is never evicted. A second spark of the same kind on a tile within 150 ms is merged. 1,200 particles (illustrative), and particles over the cap are refused.

*Cost / performance.* One scan of the effect array per refused spawn. Deduplicating 2,190 UE tiles to 220 cuts the pixel-blit cost from 2.87 to 0.39 ms on the proxy [V, S13].

*Games that used it.*
- Terraria: https://terraria.wiki.gg/wiki/Projectiles
- Tibia (mehah/otclient tile rule): https://github.com/mehah/otclient/blob/main/src/client/tile.cpp

*How it feels.* Invisible when it works. In a 30-player fight on one boss most impacts land on the same one to four tiles, so the merge removes most of the load [I, note 07].

*Risks.* A cap must never change who got hit. Effects are cosmetic and the server owns damage [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 2 · Readability 5

### F3. Screen feedback: edge tint, low-health pulse, one flash

*In plain words.* When something big happens to you, the screen edge tints for a third of a second. At low health the edge pulses slowly.

*How it works (technical).*
- **Luanti** [V, S82]. A red rectangle whose alpha adds `95 + 64 x (damage / max HP)`, capped at 127 of 255 (50%), decaying at 384 units per second. 0.25 to 0.33 s.
- **Veloren** [V, S84]. Under 10% health a frame pulses at 0.23 to 0.53 Hz, faster as health drops.
- **Sandbox** [S12]. Edge tint 50% for 0.3 s, low-health pulse 0.5 Hz, one full-screen flash for the player's own meteor storm.

*Cost / performance.* A Canvas2D flash fill costs 0.019 / 0.12 ms and a dithered vignette mask 0.067 / 0.43 ms. On the GPU a flash quad is 0.0009 ms and a vignette shader 0.0014 ms [V, S13].

*Games that used it.*
- Luanti: https://github.com/luanti-org/luanti/blob/master/src/client/game.cpp
- Quake: https://github.com/id-Software/Quake/blob/master/WinQuake/view.c

*How it feels.* Shipped damage flashes are weaker and shorter than most people guess [I, note 13]. Combat juice owns hitstop, shake and damage numbers [S11].

*Risks.* Screen feedback from 30 casters is a strobe. The rule "only what happens to me" removes the problem [I, note 07].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Readability 4

### F4. The flash limiter, reduce flashing and reduce motion

*In plain words.* The client counts bright flashes. Past three in any second over a large area, new effects start without their bright frame.

*How it works (technical).*
- **WCAG 2.3.1** [V, S118]. Nothing flashes more than three times in any one second, unless it is below the thresholds. A general flash is a pair of opposing luminance changes of 10% or more with the darker state below 0.80. A red flash involves a saturated red, `R/(R+G+B) >= 0.8`.
- **Limiter** [I, note 07; S12]. Each effect declares `flash_px`. A ring buffer holds the flashes of the last 1,000 ms, and events closer than 50 ms merge and add their areas. At 3, the next effect starts on frame 2. Others lose the bright frame first, then party, then own.
- **Authoring rules** [I, note 07]. One bright frame per effect. Fire ramps reach red only in the fading frames. Loops change luminance by less than 10% or redraw at 3 Hz or slower.
- **Reduce motion** [I, note 07; V, S122]. No camera kick, no distortion, static auras. God of War Ragnarök ships "Reduce flashing" plus two 10-point camera sliders.

*Cost / performance.* A ring buffer of about 32 entries and one comparison per spawn. No shader and no readback [I, note 07].

*Games that used it.*
- God of War Ragnarök: https://www.playstation.com/en-ie/games/god-of-war-ragnarok/accessibility/
- EA IRIS (flash analysis tool): https://github.com/electronicarts/IRIS

*How it feels.* Dropping the white first frame for the others tier removes most flashes in a crowd before the limiter runs [I, note 07].

*Risks.* Thirty impacts 100 ms apart on neighbouring tiles is ten flashes per second [I, note 07].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 2 · Readability 5
### Family G: Rendering and blending in Godot 4 Compatibility

### G1. Draw paths on the web: flipbooks, one MultiMesh, no GPU particles

*In plain words.* On a web build, count nodes and draw calls before you count particles. Spell bodies are pooled flipbook sprites on one atlas, and loose sparks share one MultiMesh (§7).

*How it works (technical).*
- **GPUParticles2D in Compatibility** [V, S127, S128]. It runs on transform feedback. Trails, sub-emitters and manual emission are not supported.
- **Compile cost** [V, self-reported, S129]. One default GPUParticles2D "needs around 2 seconds to load" on web. Four systems froze a browser "for 30-60 seconds". A 2026-11-01 comment on 4.7.2 reports 22 to 25 s per system in 3D. Moving to CPU particles removed the cost.
- **Every particle node is a draw** [V, S130]. "Meshes can't be batched, so always create a new batch" covers mesh, MultiMesh and particles commands. Polygons do not batch either, so avoid `Line2D` and `Polygon2D` in hot paths.

*Cost / performance.* In our WebGL2 test one instanced draw of 32,000 particles with a per-frame upload costs 0.26 ms. A per-sprite uniform that splits the batch costs 2x to 2.5x the batched frame. Software GL takes 35 ms for the 1x scene [V, S13]. PixiJS reports 1,000,000 particles at 60 fps on an M3 [V, vendor, S125]. Godot itself was not measured.

*Games that used it.*
- Godot engine source (GLES3 canvas renderer): https://github.com/godotengine/godot/blob/4.7-stable/drivers/gles3/rasterizer_canvas_gles3.cpp
- Mindustry (pooled bullets, effects skipped on servers): https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/comp/BulletComp.java

*How it feels.* Invisible when right. When wrong, the first fireball of the session hitches for seconds.

*Risks.* 30 casters with 3 particle nodes each is 90 draw calls before a single sprite [I, note 08].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 4 · Mood 3 · Readability 3

### G2. Glow three ways: additive, palette ramp, low-res buffer

*In plain words.* Glow can be a bright sprite added on top, a colour ramp that needs no transparency, or a small blurred copy of the bright pixels laid back over the scene. Spell light goes into the light map, never into one light node per spell.

*How it works (technical).*
- **Additive sprites** [V, S133]. Godot's own docs say additive sprites "are much faster to render" than lights. Premult Alpha lets one sprite carry an opaque core and an additive halo in a single draw [I, note 08].
- **Palette ramp** [I, note 12]. The frame stores ramp steps and a 6-entry table colours them. A ramp-add variant climbs one step where effects overlap, a palette form of additive. This is "glow without alpha" from the Light study [S6].
- **Low-res buffer** [V, S13; S3]. Max-splat emitters into 80x45, blur with a 3x3 block sum, and let each screen pixel pick a glow colour through a Bayer threshold. The Acid study has the method. Godot's own glow works in Compatibility since 4.3, but it softens pixels [V, S134].

*Cost / performance.* On the CPU the 80x45 buffer costs 0.095 / 0.58 ms for the whole frame, and 240 additive halo sprites cost 0.46 / 2.8 ms. On the GPU 240 additive halo quads cost 0.0097 ms, a separable 9-tap blur 0.032 ms at 320x180 and 0.14 ms at 1280x720, and an 80x45 blur composited to 720p 0.043 ms [V, S13].

*Games that used it.*
- Ultima Online (additive Screen mode): https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Data/GraphicEffectBlendMode.cs
- Pokémon Emerald (`setalpha 12, 8`): https://github.com/pret/pokeemerald/blob/master/data/battle_anim_scripts.s

*How it feels.* Additive is soft and washes out in a crowd. I would ship the ramp as the default and the buffer as an option for dusk and night scenes.

*Risks.* Engine glow size follows viewport resolution in Compatibility [V, S135]. A `PointLight2D` per spell fails, because one item receives 15 lights at most [V, S131].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Readability 4

### Family H: Procedural old-school algorithms

### H1. Particle systems from Reeves to seeded stateless bursts

*In plain words.* A particle system emits a random number of dots, gives each a speed and a life, moves them and kills them. The cheapest form stores nothing.

*How it works (technical).*
- **Reeves 1983** [V, S91]. Five steps per frame: generate, assign attributes, kill, move, render. `NPartsf = MeanPartsf + Rand() x VarPartsf`. A second form scales emission by screen area, a 1983 level-of-detail rule.
- **Stateless** [U, S92; I, note 09]. Position is a closed-form function of start values and time. A hash of `(seed, i)` gives each particle its angle and speed.

*Cost / performance.* A struct-of-arrays step for 2,000 particles costs 0.0068 / 0.042 ms, 1.3x faster than plain objects and 3.3x faster than fresh vectors with `filter()`. With pixel writes, 2,000 particles cost 0.026 / 0.17 ms in all. At 32,000 particles on the proxy the allocating pool's p90 reaches 3.2 ms against 0.72 ms [V, S13].

*Games that used it.*
- Star Trek II, the Genesis effect (Reeves' paper): https://www.cs.princeton.edu/courses/archive/spr15/cos426/papers/Reeves83.pdf
- Mindustry (seeded stateless effects): https://github.com/Anuken/Arc/blob/master/arc-core/src/arc/math/Angles.java

*How it feels.* A seeded burst can be paused for hitstop, scrubbed, or drawn at half count by skipping odd particles, and it still matches on every client [I, note 09].

*Risks.* Stateless motion needs an analytic path, so no collisions [U, S92].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Readability 3

### H2. Demoscene buffers as magic: feedback, fire and palette cycling

*In plain words.* Old demo effects make good spells. A small buffer that fades and shifts every frame gives free trails.

*How it works (technical).*
- **Feedback buffer** [I, note 09]. A small indexed buffer. Each frame, subtract a decay and shift. A decay of 1 on a 6-step ramp gives a 6-frame trail. A random decay of `rand & 1` is the DOOM fire with a different source.
- **DOOM fire** [V, S1]. Values 0 to 36. `firePixels[to] = firePixels[from] - (rand & 1)` with a sideways jitter. Shape the source row like a projectile or a character's feet for an aura [I, note 09]. The Fire study covers the algorithm [S7].
- **Palette cycling** [V, S95]. Canvas Cycle (2010, art by Mark Ferrari) animates 8-bit scenes by rotating palette slots, with blending between steps.

*Cost / performance.* A full-screen feedback buffer for 240 missiles costs 0.066 / 0.41 ms on the CPU and 0.022 ms on the GPU, nearly flat in missile count [V, S13]. A 16x24 fire aura is 384 operations per frame, and thirty 64x64 buffers would be two full screens, so share one buffer per spell type [I, note 09].

*Games that used it.*
- DOOM on PlayStation (fire): https://fabiensanglard.net/doom_fire_psx/
- Canvas Cycle demo (palette cycling): http://www.effectgames.com/demos/canvascycle/

*How it feels.* Organic and alive, with a 1990s texture.

*Risks.* The feedback buffer is screen-locked. When the camera scrolls the last frame must shift, and we did not measure that [I, note 12]. The Sandbox does not build the fire aura [S12].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Mood 5 · Readability 3

### H3. Procedural sigils and dither dissolves

*In plain words.* A magic circle is two or three circles, a star and a ring of tiny glyphs, drawn once from a seed. A dissolve is one comparison per pixel against a pattern.

*How it works (technical).*
- **Sigil** [I, note 09]. Midpoint circles with a 2 to 1 squash, a star polygon {n/k} and 6 to 12 glyph stamps. About 700 pixel writes for a radius of 28 px, done once into an atlas.
- **Draw-in by angle** [I, note 09]. Store an angle per pixel. A pixel is visible when `((ANG - start) & 255) < progress * 256`.
- **Fizzlefade** [V, S97]. Wolfenstein 3D's 17-bit LFSR with taps `0x00012000` visits every pixel of 320x200 exactly once.
- **Bayer dissolve** [K; I, note 09]. `visible = alpha * 16 > B4[y & 3][x & 3]`, 17 levels, no state. Use world coordinates so the pattern does not swim, as in the fog study [S9].

*Cost / performance.* One sprite plus one compare per pixel at run time. A Bayer palette select over 320x180 costs 0.064 / 0.39 ms on the CPU [V, S13]. A 32x32 dissolve is 1,024 compares [I, note 09].

*Games that used it.*
- Wolfenstein 3D (FizzleFade): https://fabiensanglard.net/fizzlefade/index.php
- Alchemy Circles Generator: https://github.com/CiaccoDavide/Alchemy-Circles-Generator

*How it feels.* The white tip of a circle that draws itself carries the eye and shows cast progress with no extra UI [I, note 09].

*Risks.* The LFSR masks for sprite-sized registers are recalled, not checked [U, note 09]. The Sandbox uses ordered dither for opacity and does not build fizzlefade [S12].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Readability 4

---

## 5. Comparison scorecard

All ratings are author judgement. "Sum" is a crude total. A low-sum row such as F2 or G1 can still be mandatory for an MMO.

| # | Technique | Simpl. | Speed | Pixel taste | Mood | Readab. | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Tibia magic effect, 75 ms clock | 5 | 5 | 5 | 3 | 4 | 22 |
| A2 | Tibia missile, 150 x sqrt(tiles) | 5 | 5 | 5 | 3 | 4 | 22 |
| A3 | Area masks and the UE | 5 | 4 | 4 | 4 | 5 | 22 |
| A4 | Pokémon battle scripts | 4 | 5 | 5 | 5 | 4 | 23 |
| A5 | Diablo missile tables | 4 | 5 | 4 | 5 | 4 | 22 |
| A6 | Fat packets (UO, RO, RuneScape) | 3 | 4 | 3 | 4 | 4 | 18 |
| A7 | Console screen tricks | 4 | 5 | 5 | 5 | 3 | 22 |
| B1 | 8 pre-drawn directions | 5 | 5 | 5 | 3 | 5 | 23 |
| B2 | Flight paths as functions of time | 5 | 5 | 4 | 3 | 5 | 22 |
| B3 | Turn-limited homing | 4 | 5 | 4 | 4 | 4 | 21 |
| B4 | Lobbed arc with shadow | 4 | 5 | 4 | 4 | 5 | 22 |
| B5 | Trails (ribbon, afterimages, wake) | 4 | 5 | 4 | 4 | 4 | 21 |
| B6 | Beams and channels | 4 | 5 | 4 | 4 | 5 | 22 |
| B7 | Midpoint chain lightning | 4 | 5 | 5 | 5 | 4 | 23 |
| C1 | Hit spark anatomy | 5 | 5 | 5 | 4 | 5 | 24 |
| C2 | Stateless layered explosions | 4 | 5 | 4 | 5 | 4 | 22 |
| C3 | Ring-by-ring area waves | 4 | 5 | 4 | 5 | 4 | 22 |
| C4 | Shockwave rings as geometry | 5 | 5 | 4 | 4 | 4 | 22 |
| C5 | Residue decals and fields | 4 | 5 | 4 | 4 | 3 | 20 |
| D1 | Back and front slots | 5 | 5 | 4 | 4 | 4 | 22 |
| D2 | Motes, heal, haste ghosts | 5 | 5 | 4 | 4 | 3 | 21 |
| D3 | Rim-only shields | 4 | 5 | 4 | 4 | 5 | 22 |
| D4 | Status tint by priority | 5 | 5 | 4 | 4 | 5 | 23 |
| D5 | Cast circles and charge-ups | 3 | 5 | 5 | 5 | 5 | 23 |
| E1 | Timing, early climax, short tail | 5 | 5 | 5 | 5 | 5 | 25 |
| E2 | Ramps, outlines, value contrast | 5 | 5 | 5 | 4 | 5 | 24 |
| E3 | Element language, colour-blind safety | 4 | 5 | 5 | 5 | 5 | 24 |
| F1 | Owner tiers, per-source opacity | 4 | 5 | 3 | 3 | 5 | 20 |
| F2 | Cap, eviction, same-tile merge | 4 | 5 | 3 | 2 | 5 | 19 |
| F3 | Screen feedback | 5 | 5 | 4 | 4 | 4 | 22 |
| F4 | Flash limiter, reduce flashing | 4 | 5 | 3 | 2 | 5 | 19 |
| G1 | Web draw paths, no GPU particles | 3 | 5 | 4 | 3 | 3 | 18 |
| G2 | Glow three ways | 4 | 5 | 5 | 5 | 4 | 23 |
| H1 | Reeves to stateless bursts | 5 | 5 | 4 | 4 | 3 | 21 |
| H2 | Demoscene buffers as magic | 4 | 4 | 4 | 5 | 3 | 20 |
| H3 | Sigils and dither dissolves | 4 | 5 | 5 | 5 | 4 | 23 |

**Reading the table.** Speed barely separates the rows, as in the fog and grass studies. Drawn the right way, almost every spell technique costs microseconds, so 33 of 36 rows score a 5 [V, S13]. The three 4s grow without a cap. They are tiles for area masks (A3), bytes for fat packets (A6) and pixels for shared buffers (H2). Timing (E1) wins at 25. Hit sparks (C1), ramps and outlines (E2) and element language (E3) follow at 24. All four are art rules that cost nothing at run time. The bottom rows are plumbing. Draw paths (G1, 18), budgets (F2, 19) and the flash limiter (F4, 19) are invisible when they work, and they decide whether the top rows survive a 30-player fight on a phone [I].

---

## 6. Deep dives

### 6a. Measured costs: what spell effects really cost

Our measurements [V, S13]. Apple M4 Pro, Chromium 153, 320x180 unless stated, median ms per frame. The 6x throttle is the DevTools CPU throttle, our low-end phone proxy. GPU numbers are wall-clock times on ANGLE Metal. On multi-pass tests at 1280x720 the GPU timer query reads up to 2.5x higher, so treat wall as the lower bound there. Every GPU draw blends, so Apple's hidden-surface removal cannot cull it. **No phone was measured.**

**CPU work in JavaScript (ms per frame, single thread).**

| CPU task | Size | M4 Pro | 6x throttle | Profiles |
|---|---|---|---|---|
| Particles, pixel writes plus one `putImageData` | 2,000 | 0.020 | 0.13 | C2, H1 |
| Particles, one `drawImage` each | 2,000 | 1.66 | 10.5 | anti-pattern |
| Impact flipbooks 32x32, `drawImage` | 120 | 0.18 | 1.09 | C1 |
| Impact flipbooks 32x32, ramp blit | 120 | 0.10 | 1.01 | C1, E2 |
| Glow buffer 80x45, whole frame | 2,000 particles, 120 discs | 0.095 | 0.58 | G2 |
| Glow as additive halo sprites | 240 | 0.46 | 2.8 | G2 |
| Trail, 12-point ring, Bresenham | 240 missiles | 0.044 | 0.27 | B5 |
| Trail, afterimages through `drawImage` | 240 missiles | 1.0 | 6.35 | anti-pattern |
| Lightning, pixel lines, re-roll every frame | 40 bolts | 0.095 | 0.62 | B7 |
| Lightning, Canvas2D strokes | 40 bolts | 0.92 | 5.85 | anti-pattern |
| Tile effects 16x16, `drawImage` | 2,190 | 2.2 | 14.1 | A3 |
| Tile effects 16x16, ramp blit | 2,190 | 0.51 | 2.87 | A3 |
| Tile effects, one per tile, ramp blit | 220 | 0.060 | 0.39 | A3, F2 |
| Shockwave ring with frame copy | radius 40 | 0.026 | 0.16 | C4 |
| Auras and orbiters, pixel blits | 30 characters | 0.039 | 0.24 | D1, D4 |

**GPU passes (ms per frame, one batched WebGL2 draw).** Software GL (SwiftShader) pays about 13.5 µs per quad, 27 ms for 2,000 particles [V, S13].

| GPU pass | Size | 320x180, M4 wall | 1280x720, M4 wall | Profiles |
|---|---|---|---|---|
| Particles, stateless in the vertex shader | 2,000 | 0.0095 | n/a | C2, H1 |
| Particles, instanced, buffer upload | 32,000 | 0.26 | 0.36 | G1 |
| Flipbooks 64x64, alpha blend | 480 | 0.058 | 0.52 | C1 |
| Glow as additive halo quads | 240 | 0.0097 | 0.070 | G2 |
| Separable 9-tap blur plus composite | full screen | 0.032 | 0.14 | G2 |
| Low-res glow at 80x45, blur, composite | 120 impacts | 0.042 | 0.043 | G2 |
| Tile effects 16x16 | 2,190 | 0.024 | 0.17 | A3 |
| Shockwave distortion with screen copy | 1 | 0.021 | 0.039 | C4 |
| Auras, 9 sprites per character, one batch | 30 characters | 0.0061 | n/a | D1 |

**The whole 30-caster scene.** The 1x load is 30 missiles with trails, 30 impacts, 148 tile effects, 1,300 particles, 4 bolts, 30 auras, one glow pass, one shockwave and one vignette. 4x and 16x multiply every count.

| Pipeline | 1x | 4x | 16x |
|---|---|---|---|
| Pixel buffer, clarity off (M4 / 6x throttle) | 0.26 / 1.5 | 0.63 / 3.9 | 2.0 / 12.6 |
| Pixel buffer, clarity on (M4 / 6x throttle) | 0.20 / 1.11 | 0.51 / 3.1 | 1.74 / 10.6 |
| Canvas2D draw calls, clarity off (M4 / 6x throttle) | 0.97 / 6.15 | 3.97 / 24.9 | 15.5 / 98.5 |
| WebGL2 at 320x180 plus 4x upscale, M4 wall | 0.090 | 0.095 | 0.25 |
| WebGL2 native 1280x720, M4 wall | 0.24 | 0.32 | 0.66 |
| WebGL2 on SwiftShader, 320x180 | 35 | 139 | 556 |

**What the tables say.**
- **The hard case fits.** 1.5 ms on the proxy and 0.090 ms of GPU work on the M4, inside the 2 ms effect budget of the fog and grass studies [V, S13; S9, S10].
- **Tiles, auras and impacts dominate at high load**, not particles. At 16x on the proxy tile effects take 3.16 ms, auras 2.75 ms and impacts 2.36 ms, against 0.94 ms for particles [V, S13]. A clarity manager that only thins particles saves 16% there.
- **Software GL is not a fallback.** It pays about 13.5 µs per quad. Detect it and switch to the pixel-buffer path [V, S13].

**Not measured** [I, note 12]. A phone. Godot itself, meaning per-node cost, `CPUParticles2D`, `GPUParticles2D`, MultiMesh uploads and GDScript. Camera scroll for the feedback buffer. `magicbench.html` runs on a phone as it is.

### 6b. Frame timing across games

Frame counts are cited. Milliseconds at 60 ticks per second are conversions [I].

| Game or source | Effect | Frames | Timing | Source |
|---|---|---|---|---|
| Tibia (OTClient) | Any magic effect | per sprite, 8 typical | 75 ms per frame, 600 ms for 8 | [V, S14; I] |
| MUGEN 1.1 | Light, medium, strong hit spark | 6, 5, 10 | 200, 167, 217 ms | [V, S102] |
| Ikemen GO | Hit spark; very strong | 14; 17 | 233 ms; 283 ms | [V, S103] |
| Mindustry | Small hit; shockwave; flak explosion | code | 233 ms; 167 ms; 333 ms | [V, S76] |
| Pokémon Emerald | Big lightning flipbook | 5 at 5, 5, 8, 5, 5 ticks | 467 ms | [V, S51] |
| Final Fantasy VI | Most common graphic | 4 (80 records), then 5, 2, 8, 6 | script speed unit unconfirmed | [V, S54; U] |
| Asterion proposal | Spark; area tile; shockwave | 5; 8; code | 75 ms per frame; 55 ms per ring; 200 ms | [I; S12] |

Sparks last 170 to 280 ms and explosions 300 to 750 ms. No studio source gave anticipation or dissipation in ms [I, notes 06, 13].

### 6c. Bytes on the wire

Byte counts are for one event to one viewer, opcode included, transport framing excluded [V, sources in the table; I for sums].

| Game | Event | Bytes | Extras carried | Source |
|---|---|---|---|---|
| Tibia, old protocol | Effect; missile | 7; 12 | none | [V, S18, S26] |
| Tibia 12.03+ (TFS) | Effect; missile | 9; 11 | command loop with delay and delta, unused by servers | [V, S21, S20] |
| Tibia | 73-tile UE | 511 to 730 | one message per tile | [V; I] |
| Ultima Online | Graphic effect | 28, 36 or 49 | hue, 8 blend modes, speed, duration, explode flag | [V, S33] |
| Ragnarok Online | Effect; ground unit | 10; 16 to 23 per cell | client expands the id into layers | [V, S36] |
| Old School RuneScape | Spot animation; projectile | 6; 20, plus opcode | delay in 20 ms cycles, heights, angle | [V, S43, S42] |
| Asterion proposal | Cast 8, missile 11, effect 9, area 11, condition 6 | as listed | relation bits, element, cast time, ring delay | [I; S12] |

**The 30-caster fight** [I, notes 01, 07]. Thirty players casting one targeted spell per second is 30 x (11 + 9) = 600 bytes per second per viewer, and 18 KB per second of server output for 30 viewers. Area spells dominate. A 37-tile area sent tile by tile is 333 bytes per cast and 37 new sprites. One area event of about 11 bytes replaces the 333. TFS has no rate limit, merge or priority on effects [V, S23].

### 6d. What MMOs let players tune

| Game | Setting | Levels | What it never hides | Source |
|---|---|---|---|---|
| Final Fantasy XIV | Battle Effects, per own, party, others | Show All, Show Limited, Show None | not documented. Limit Break hidden by Limited was treated as a bug | [V, S109; U, note 07] |
| World of Warcraft 11.2 | Spell Density | Everything, Reduced, Essential | own spells, pets, NPC spells, enemy players | [V, S111] |
| Guild Wars 2 | Hide Ally Visual Effects | all, outside party, outside squad | enemy effects, group heal and boon areas | [U, S112] |
| Tibia | Spell Opacity | 3 sliders, 0 to 100% for own, others, monsters | nothing stated | [V, S31] |
| Ragnarok Online | `/effect`, `/mineffect` | on or off; cheaper file per effect | n/a | [V, S39] |
| Throne and Liberty | Effect Display Range | not documented | one skill forced visible in update 4.13.0 | [V, S115] |

Three levels per source is the stable shape [V, S111]. I would copy Tibia's three sliders and keep hostile telegraphs outside their reach.

### 6e. Flash and photosensitivity limits

| Rule | Rate | Area | Luminance or colour | Source |
|---|---|---|---|---|
| WCAG 2.3.1 | more than 3 flashes in any 1 s fails | 25% of a 10 degree field | 10% of max luminance, darker state below 0.80 | [V, S118] |
| WCAG technique G176 | n/a | under 21,824 px at 1024x768 passes | n/a | [V, S119] |
| Xbox guideline 118 | about 3 per second | about 20% of the screen | saturated red, `R/(R+G+B) >= 0.8` | [V, S120] |
| Sandbox limiter | 3 per second | under 1,600 px exempt; others held to 25% | one bright frame per effect | [I; S12] |

The 21,824 px figure is 2.8% of a 1024x768 screen. At 320x180 that is about 1,600 px, 1.5 tiles of 32 px or about 6 tiles of 16 px [I, lead]. The limiter must count concurrent area, not single effects [I, note 07].

Shipped screen feedback is weaker than most people guess. Luanti caps its red damage flash at 50% alpha for 0.25 to 0.33 s, Quake blends 12 to 59% for 0.2 to 1.0 s, and Veloren pulses under 10% health at 0.23 to 0.53 Hz [V, S82, S83, S84].

### 6f. Element language

This table is author judgement built from genre convention [I, notes 04, 06]. Only the Shattered Pixel Dungeon particle values and Magicka's delivery shapes behind it are cited [V, S69, S85]. Hue is in HSV degrees.

| Element | Ramp, core to edge | Shape | Motion | Impact tail | Colour-blind risk |
|---|---|---|---|---|---|
| Fire (10 to 45) | light yellow, orange, dark red | teardrops, tongues, round blobs | rises, flickers, leaves smoke | 3 to 5 embers rise 8 to 16 px, scorch | against poison green |
| Ice (180 to 210) | pale cyan, mid blue, navy | shards, hexagons, straight edges | snaps in, then holds still | shards slide 4 to 8 px, frost patch | against poison under tritanopia |
| Energy (50 to 60, or 200 to 220) | near white, pale yellow or blue, one dark step | thin jagged lines, forks | jumps with no in-betweens | 2 to 4 sparks hop for 200 ms | low |
| Poison, nature (80 to 140) | pale yellow-green, lime, olive | bubbles, drips, puffs | slow drift, pops, no white flash | bubbles for 800 to 1,500 ms | against fire and holy gold |
| Earth (25 to 40, low saturation) | tan, brown, dark brown | chunks, dust | bursts up, falls with gravity | debris for 200 ms | low |
| Holy (45 to 55) | pale gold, gold | vertical rays, rings, 4-point stars | descends or rises straight | 4 to 6 slow sparkles | against poison lime |
| Death (270 to 300, low value) | pale violet rim, purple, near-black core | wisps, inverted core | drifts inward, sinks | wisps curl down, dark stain | against blue |
| Arcane (280 to 320) | pink-magenta, violet | circles, runes, clean geometry | rotates, orbits | orbiting motes | against ice blue |
| Physical (no hue) | light grey | arcs, slashes, 4-point sparks | one direction, one smear | none | none |

Sigil polygons add shape redundancy. 3 sides for fire, 4 for earth, 5 for arcane, 6 for ice and 8 for holy. This mapping is our suggestion, not a cited convention [I, note 09]. Friend or foe goes on the outline, because the element owns the hue [I, note 06].

---

## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)

All of this section is design proposal [I], built from the cited parts. The Spell Sandbox (§8) plays it.

**Layers, bottom to top.**
1. **Server spell events (gameplay truth).** The server decides hits and conditions and sends five small events: cast start, missile, effect, area and condition on or off (A1 to A3, A6). Every visual is client-side and cosmetic. Each event carries a per-viewer relation so the client can tier it (F1).
2. **Spell definitions as data.** A spell is a table of phases, cast, travel, impact and linger, over a shared sprite library (A4, A5). Each element owns a ramp of 4 to 5 steps and a shape language (E2, E3).
3. **Cast and charge.** A rune circle draws in under the caster, particles gather at the hands and a charge glow climbs the ramp (D5, H3). It is drawn under the character and it tells other players what is coming (E1).
4. **Projectiles.** Straight bolts, homing missiles, lobbed arcs with a shadow, beams and chain lightning, in 8 pre-drawn directions on whole pixels, with ring-buffer trails (B1 to B7). Flight time is `150 ms x sqrt(tiles)` (A2).
5. **Impacts and areas.** A 5-frame hit spark at 75 ms, one effect per tile over a mask with an optional ring delay, a thinning shockwave ring, capped decals and staged fields (C1 to C5).
6. **Auras and status.** Back and front overlays around the y-sorted sprite, orbiting motes, a rim-only shield, one status tint by priority plus a small overlay, haste ghosts and a level-up burst (D1 to D4).
7. **Glow and blending.** Palette-ramp glow by default, additive or a low-res glow buffer as options, and spell light stamped into the light map from study #5 (G2, A7).
8. **Screen feedback.** An edge tint for big hits on the player, a slow low-health pulse and one full-screen flash for the player's own ultimate, all behind a flash limiter (F3, F4).
9. **Clarity manager (budget and tiers).** Every effect has an owner tier, own, party, others or hostile, with per-tier particle, opacity and layer rules, a cap with priority eviction and a same-tile merge (F1, F2). Hostile telegraphs are never reduced.

**Pseudocode.**

Server events and a spell as phase data (A1 to A6). Byte sizes follow the Sandbox [S12]:
```
CAST    caster, spell, element, cast_ms        #  8 bytes, illustrative
MISSILE from_tile, missile_id, dx, dy          # 11 bytes, as TFS 12.03+
EFFECT  tile, effect_id                        #  9 bytes, as TFS 12.03+
AREA    origin, mask_id, effect_id, ring_ms    # 11 bytes, illustrative; replaces one EFFECT per tile
COND    entity, cond_id, on_off                #  6 bytes, illustrative
# every event also carries rel = OWN | PARTY | OTHERS | HOSTILE, computed per viewer

FIREBOLT = { el: FIRE, cast_ms: 300,
  cast:   { circle: SIGIL_FIRE, gather: 8 },
  travel: { kind: HOMING, sprite: BOLT_8DIR, trail: RIBBON },
  impact: { spark: SPARK_5F, decal: SCORCH, light: 7 },
  linger: null,
  cond:   { kind: BURN, ms: 3000 } }
# an area spell has travel: null and impact: { mask: AREA_CIRCLE3X3, tile_fx: FIRE_8F, ring_ms: 55, shock_ms: 200 }
```

The stateless effect loop (C2, H1). One flat array, no allocation, no per-particle state:
```
for f in fx:                                   # fixed-size array of {on, type, tier, seed, t0, delay, dur, ...}
    if not f.on: continue
    t = now - f.t0 - f.delay
    if t < 0: continue                         # scheduled by a delay field, not started yet
    if t >= f.dur: kill(f); continue
    DRAW[f.type](f, t / f.dur, Rng(f.seed))    # same seed every frame gives the same sparks
```

Missile flight and impact order (A2, B2). The impact waits for the missile:
```
def on_missile(ev, now):
    d = length(ev.to_tile - ev.from_tile)                 # in tiles
    m = alloc_missile()
    m.dur = max(1, 150 * sqrt(d))                         # ms, OTClient. max() guards a self-cast, d = 0
    m.t0 = now; m.frame = dir8(ev.to_tile - ev.from_tile) # one of 8 pre-drawn frames, chosen once
def missile_pos(m, now):
    t = clamp((now - m.t0) / m.dur, 0, 1)
    return round(lerp(m.from_px, target_px_now(m), t))    # targeted spell: re-read the target, cannot miss
def on_effect(ev, now):                                   # server sent it in the same tick as the missile
    f = spawn(SPARK, ev.effect_id, ev.rel, ev.tile, now)
    if f: f.delay = ev.delay_ms or missile_dur_to(ev.tile)  # 0 with no missile. The spark starts when the missile lands, not before
```

Turn-limited homing that lands on the server's clock (B3):
```
TURN = 3.5                                     # degrees per frame; m.speed = flight distance in px / m.dur
def homing_pos(m, now, dt):
    t = clamp((now - m.t0) / m.dur, 0, 1)
    goal = target_px_now(m)
    diff = wrap(angle(goal - m.free) - m.ang, -180, 180)
    m.ang  += clamp(diff, -TURN, TURN)
    m.free += dir(m.ang) * m.speed * dt        # constant speed, curved path
    k = smoothstep(0.6, 1.0, t)                # 0 until 60% of the flight, 1 at arrival
    return round(lerp(m.free, lerp(m.from_px, goal, t), k))
```
Midpoint lightning (B7):
```
def bolt(a, b, seed, gens = 5):
    if dist(a, b) < 1: return [a, b]
    rng = Rng(seed); pts = [a, b]; off = dist(a, b) / 4
    for g in 0 .. gens - 1:
        nxt = [pts[0]]
        for i in 0 .. len(pts) - 2:
            p = pts[i]; q = pts[i + 1]
            mid = (p + q) / 2 + perp(normalize(q - p)) * rng.range(-off, off)
            nxt.append(mid); nxt.append(q)
        pts = nxt; off = off / 2
    return pts                                 # 2^gens segments: 32 at gens = 5
shape  = bolt(a, b, base_seed + floor(frame / 3))        # re-roll every 3 frames, life 300 ms
branch = bolt(shape[k], shape[k] + rotate(shape[k+1] - shape[k], +-25 deg) * 0.7 * remaining, seed2, 3)
draw: 3 px halo in a mid ramp step, then a 1 px core in the top step; drop the halo in the last third
```

Back and front aura slots (D1, D2):
```
for c in visible: draw(c.fx[GROUND])                       # cast circles, fields, decals
draw(hostile_telegraphs)                                   # above every friendly ground effect
sort visible by feet.y
for c in visible:
    draw(c.fx[BACK]); draw(c.body, tint = top_priority_status(c)); draw(c.fx[FRONT])
for c in visible: draw(c.fx[OVERHEAD])
# orbit: ORBIT[i] = (round(RX * cos(a_i)), round(RY * sin(a_i))), 24 steps, screen y grows downward
mote.slot = FRONT if ORBIT[i].y >= 0 else BACK             # the lower half of the ellipse is nearer the camera
mote.pos  = c.feet + (ORBIT[i].x, -CHEST_H + ORBIT[i].y)
```

The clarity manager (F1, F2), with the Sandbox's "reduced" setting for others:
```
#           particles  opacity      white frame  area tiles    glow  decals  screen feedback
# OWN       100%       slider       yes          all           yes   yes     yes
# HOSTILE   100%       slider       yes          all           yes   yes     only if it hits me
# PARTY      70%       100%         yes          all           yes   yes     no
# OTHERS     50%       40%, dither  no           every second  no    no      no
PRI = { OWN: 4, HOSTILE: 3, PARTY: 2, OTHERS: 1 }       # hostile telegraphs ignore the slider and the cap
CAP_FX = 96; CAP_PARTICLES = 1200; MERGE_MS = 150          # the particle cap is illustrative

def spawn(type, kind, tier, tile, now):                    # kind = effect id
    if tier == OTHERS and type == SPARK and last_spark[tile].kind == kind and now - last_spark[tile].t < MERGE_MS:
        return null                                        # same-tile merge
    if type == SPARK: last_spark[tile] = { kind, t: now }
    if live < CAP_FX: return alloc(type, tier)
    want = PRI[tier] * 100 + RANK[type] * 10               # residue ranks below missiles
    w = the live non-telegraph effect with the lowest score(e)
    if score(w) < want: kill(w); return alloc(type, tier)  # only a weaker effect is evicted
    return null                                            # the new effect is refused

def score(e):                                              # same scale as `want`
    return PRI[e.tier] * 100 + RANK[e.type] * 10 + 9 * remaining_fraction(e)   # nearest its end goes first
```
A refused or evicted effect changes nothing in the game. The server already decided the hit.

The flash limiter (F4):
```
flashes = []                                   # times of full flashes in the last second
def request_flash(px, tier, now):
    while flashes and now - flashes[0] > 1000: flashes.pop_front()
    if reduce_flashing: return BORDER
    if px < 1600: return (FLASH, px)           # small-area exemption, about 6 tiles of 16 px
    if tier != OWN: px = min(px, 0.25 * 320 * 180)   # another player's flash covers 25% of the screen at most
    if len(flashes) >= 3: return BORDER        # a fourth flash inside one second becomes a border
    flashes.append(now); return (FLASH, px)    # the caller flashes only px pixels around the source
```

**Godot mapping.**
- **Viewport** [I, note 08]. Stretch mode `viewport` at 320x180 with integer scaling. All effects render inside it.
- **Layers 3, 5 and 7** [I, note 08; V, S130]. One `Node2D` per layer that draws every live effect from a flat array with `RenderingServer.canvas_item_add_texture_rect_region` in one `_draw`. Rect commands batch when texture, material and blend mode match. One atlas of 1024 or 2048 px, nearest filter, unshaded, with Premult Alpha so mix and add share a batch.
- **Layer 4** [I, note 08]. Missiles and trails in one custom-draw node. Build ribbons and bolts from rect segments, never `Line2D` or `Polygon2D`, which are one draw each [V, S130, S123].
- **Layer 6** [I, notes 05, 08; V, S126, S136]. Back and front sprites share the actor atlas and blend mode inside the y-sort. Tints go through `modulate` or a 2D instance uniform (Godot 4.4 onward, 16 per shader at most), never a material per character.
- **Loose sparks** [V, S132; I]. One scene-wide `MultiMeshInstance2D` filled by `multimesh_set_buffer()` from a preallocated `PackedFloat32Array`, positions rounded to whole pixels, `visible_instance_count` set to the live count.
- **Layer 7 light** [V, S131; S6]. Additive sprites into the low-res light map. No `PointLight2D` per spell, because one item receives 15 lights at most.

**What to avoid.**
- One particle node per effect. Every particle node is its own draw call [V, S130].
- GPUParticles2D on web. Seconds of shader compile per system, no trails, no sub-emitters [V, self-reported, S129; V, S127].
- Per-frame `getImageData` tints in a canvas prototype, 9 ms for 30 characters [V, S13].
- A `CanvasGroup` or `BackBufferCopy` per spell, and more than one screen-reading pass per frame [V, S124].

**Shader warm-up.** Compatibility has no pipeline precompilation and the shader baker does not cover it. The first display of the simplest canvas shader took about 2 s on an M1 Mac in 4.2.1 [V, self-reported, S137; V, S138]. Keep 3 to 5 shaders for all spells. On the loading screen, draw each one for 1 frame behind a solid sprite, in the exact state it will be used, sprite and MultiMesh variants both [V, S139; I, note 08]. `snap_2d_transforms_to_pixel` rounds nodes, not particles inside a node, so round positions when you fill a buffer [V, S140; I].

---

## 8. Reference implementation: the Spell Sandbox

The Sandbox [S12] is one hand-written page with a 320x180 canvas. It plays the nine layers of §7 in plain Canvas 2D.

**The world.** A ruined courtyard with busy ground, so readability is a real test. 16x16 px tiles, 20 x 11, one tile per Tibia square. A player mage, a party healer, 3 training dummies, 2 monsters that cast at the player and a crowd of 0 to 30 other players.

**Spells.** Eight on the hotbar (keys 1 to 8): fire bolt, ice shard, chain lightning, poison cloud, heal, mana shield, arcane beam and meteor storm. Haste and Level up are buttons. That is 10 spell tables.

**What you can do.** Toggle trail kind, 8 or 16 directions or run-time rotation, glow mode (G), residue, auras, screen feedback, reduce flashing, reduce motion, the colour-blind palette and day or night (N). Set effects for others to full, reduced or minimal, move three opacity sliders, raise the crowd and a stress multiplier, and switch the clarity manager off. V cycles views, including tiers, overdraw and the server event log.

**The efficiency HUD.** Smoothed `performance.now()` timings per layer against a 16.7 ms bar, counters for effects per tier, particles, evictions, merges, bytes and flashes per second, and a cost view of pixel writes per screen pixel.

**What it demonstrates.**
- Run-time rotation breaks a curving fire bolt's outline. The 8-direction sheet does not (B1).
- A 37-tile meteor storm is 333 bytes per spectator as Tibia sends it and one event of about 11 bytes here. The HUD shows both totals (A3).
- With 30 casters and stress up, switching the manager off shows what tiers, the cap and the merge save (F1, F2), and the limiter turns a fourth flash into a border (F4).

**Simplifications (honest list)** [I].
- The meteor storm uses the 37-tile `AREA_CIRCLE3X3` so it fits the arena. Tibia's real UE is the 73-tile mask (A3).
- Not built: the DOOM-fire aura, fizzlefade, the 73-tile mask and per-facing aura offsets.
- It is JavaScript on one thread and says nothing about Godot's node or batching costs.

---

## 9. Gem findings

Stars, push dates and releases were read through the GitHub API on 2026-11-11, and itch.io terms from each page [V, note 11]. No repo here publishes a Compatibility or web test matrix. Paid tools are left out. Licences were read from LICENSE files on 2026-11-11. **Flags:** **Low** = MIT/BSD/Apache/CC0; **LGPL** = fine as a separate library; **Copyleft** = GPL/AGPL/CC BY-SA, study and re-implement; **None** = no licence, study only.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| OTClient (edubart) | https://github.com/edubart/otclient | MIT | 709 stars, 2024 | `effect.cpp`, `missile.cpp`, the exact model for a Tibia-like | Low |
| OTClient Redemption | https://github.com/opentibiabr/otclient | MIT | 542 stars, release 4.2 on 2026-11-02 | Attached effects for auras, per-source effect alpha | Low |
| The Forgotten Server | https://github.com/otland/forgottenserver | GPL v2 | 1,844 stars | Effect and missile packets, area masks | Copyleft |
| Canary | https://github.com/opentibiabr/canary | GPL v2 | 668 stars | The same for the current protocol | Copyleft |
| ClassicUO | https://github.com/ClassicUO/ClassicUO | BSD 2-Clause | 742 stars, pushed 2026-10-16 | `MovingEffect`, `LightningEffect` in a permissive MMO client | Low |
| roBrowser Legacy | https://github.com/MrAntares/roBrowserLegacy | GPL v3 | 450 stars, pushed November 2026 | `CastCircle`, `MagicTarget`, `LockOnTarget` in JavaScript | Copyleft |
| Mindustry | https://github.com/Anuken/Mindustry | GPL v3 | 29,772 stars, shipped | `Fx.java`, `Lightning.java`, `Trail.java` | Copyleft |
| Shattered Pixel Dungeon | https://github.com/00-Evan/shattered-pixel-dungeon | GPL v3 | 6,786 stars, shipped | About 35 small effect classes: lightning, beam, halo, speck | Copyleft |
| Flare engine and game | https://github.com/flareteam/flare-engine ; https://github.com/flareteam/flare-game | GPL v3 code, CC BY-SA 3.0 data | 1,309 stars | 41 power animations defined as text files | Copyleft |
| pokeemerald | https://github.com/pret/pokeemerald | No licence file, Nintendo IP | 3,684 stars, pushed 2026-10-01 | 26 `battle_anim_*.c` files by element | None (study only) |
| DevilutionX | https://github.com/diasurgical/DevilutionX | Sustainable Use License v1.0 | 10,009 stars | Missile tables, 16-direction sprites | None (source-available, read only) |
| GDQuest godot-shaders | https://github.com/gdquest-demos/godot-shaders | MIT code; art CC BY-NC-SA 4.0 | 4,202 stars | Palette swap, dissolve, outline, shockwave, baked sprite glow | Low for shaders only; the art is NC, do not ship it |
| Godot demo projects | https://github.com/godotengine/godot-demo-projects | MIT | 9,786 stars, release 4.7 | `2d/particles`, `2d/glow`, `2d/bullet_shower` | Low |
| GODOT-VFX-LIBRARY (haowg) | https://github.com/haowg/GODOT-VFX-LIBRARY | MIT | 358 stars, pushed 2026-01-25 | 35+ particle effects, 17+ shaders | Low |
| GodotRetro | https://github.com/ahopness/GodotRetro | CC0 1.0 | 809 stars, pushed 2026-07-07 | Dither and palette-limit shaders | Low |
| cleanEdge (torcado) | https://torcado.com/cleanEdge/ ; https://gist.github.com/torcado194/e2794f5a4b22049ac0a41f972d14c329 | MIT (gist header) | Gist updated 2026-10-20 | Clean run-time rotation of pixel sprites, ships a `.gdshader` | Low |
| Godot Aseprite Wizard | https://github.com/viniciusgerevini/godot-aseprite-wizard | MIT | 1,403 stars | Aseprite flipbooks to AnimatedSprite2D | Low |
| BulletUpHell | https://github.com/Dark-Peace/BulletUpHell | MIT | 371 stars, pushed 2026-05-13 | Pooled projectiles and pattern data | Low |
| "2D lightning" shader | https://godotshaders.com/shader/2d-lightning/ | MIT (page) | 2021, Godot 3 syntax, a compile error reported on 4.3 | Procedural lightning with no screen read | Low |
| Effekseer | https://github.com/effekseer/Effekseer | MIT | 2,064 stars, release 1808 | Render flipbooks. The plugin's web support is unproven | Low |
| Pixel Composer | https://github.com/Ttanasart-pt/Pixel-Composer | MIT | 1,442 stars, 1.21.0 (2026-04-28) | Node-based VFX editor made for pixel art | Low |
| Kenney Particle Pack | https://kenney.nl/assets/particle-pack | CC0 (page) | 80 files, 2018 | Base shapes for particles and flashes | Low |
| Foozle Pixel Magic Effects | https://foozlecc.itch.io/pixel-magic-sprite-effects | CC0 1.0 (page) | 12 ratings at 4.9 | 10 spell effects at 32x32, the tile size | Low |
| Pimen spell effects | https://pimen.itch.io/ ; https://pimen.itch.io/fire-spell | Custom: commercial use and edits allowed, no resale | 15 element packs | Frame counts. Firebolt is 4 loop plus 6 impact frames | None (custom terms, read before shipping) |
| BDragon1727 effects | https://bdragon1727.itch.io/free-effect-bullet-impact-explosion-32x32 | Custom: free for non-commercial games | 49 ratings at 4.9 | 45 impacts and explosions at 32x32 | None (custom terms; a commenter alleges SNES rips, unconfirmed) |
| canvascycle | https://github.com/jhuckaby/canvascycle | MIT | 428 stars, pushed 2024-02-04 | Palette cycling with blended shifts on canvas | Low |
| Alchemy-Circles-Generator | https://github.com/CiaccoDavide/Alchemy-Circles-Generator | MIT | 445 stars | Seeded magic circles | Low |
| EA IRIS | https://github.com/electronicarts/IRIS | BSD 3-Clause | 241 stars, 1.1.0 (2024-04-21) | Flash and pattern analysis of captured video | Low |
| PEAT | https://trace.umd.edu/peat/ | Free, but the page bars use on commercial games | v1.6, 2017, Windows | Not usable for Asterion. Use IRIS | None (not for games) |
| godot-colorblindness | https://github.com/paulloz/godot-colorblindness | MIT | 129 stars, v1.6 (2026-05-12) | Colour-blind simulation overlay | Low |

**Top picks for Kingsfoil** [I, note 11]. Port the effect, missile and attached-effect logic from OTClient, which MIT allows. Read Mindustry's `Fx.java` and Shattered Pixel Dungeon's `effects/` for ideas and write fresh code, because both are GPL. Run the 30-caster scene through IRIS. Use Kenney and Foozle for placeholder art.

---

## 10. Learnings and anti-patterns

**Learnings** [I unless cited]
1. **A spell is data, and an effect is a function of a seed and a time.** Pokémon, Diablo and Mindustry all work this way [V, S49, S58, S77].
2. **Send ids, not animation.** Every game we read animates on the client [V, S15, S35, S38, S41].
3. **Peak in the first frames, then leave** [V, S102, S104].
4. **Shape and motion first, hue second, outline for friend or foe** [V, S85; I].
5. **Write pixels or batch draws.** The same 2,000 particles cost 0.13 or 10.5 ms on the proxy [V, S13].
6. **Tag every layer as gameplay or cosmetic on day one,** and keep screen feedback for what happens to me [I, note 07].

**Attribution traps we hit**
- **Riot against VFX Apprentice.** "Peak within the first quarter of the life" is VFX Apprentice's summary. The Riot PDF has no percentages, no tertiary tier and no ranking by damage, crowd control and dodgeability. Its real scale is idle, basic attack, defensive, damage, game changer, ultimate. "Avoid using 100% or 0% values" is Riot's [V, S104, S101].
- **The D2R guide's PreDraw line.** Blizzard's data guide says 1 draws in front. The data says the opposite. 36 of 37 "back" overlays have `PreDraw` 1 and 24 of 26 "front" overlays have 0, and the Phrozen Keep guide agrees with the data [V, S59, S63, S60].
- **150 ms per tile against the square root.** Our brief and first spec said 150 ms per tile. OTClient computes `150 * sqrt(distance)` [V, S16].
- **Vlambeer and bullet colours.** A player describes Nuclear Throne's red enemy shots and yellow player shots. We found no developer rule, so we credit none [U, note 14].

**Anti-patterns**
- One particle node per effect, and GPUParticles2D on web [V, S130, S129].
- Run-time rotation of small sprites [I, note 03].
- Per-frame `getImageData` tints, canvas strokes for lightning, afterimages through `drawImage` [V, S13].
- One effect message per tile, and no source in the effect event [V, S23; I, note 07].
- Strobing flipbooks, 60 Hz bolt re-rolls with a bright halo, red against blue alternation [I, note 07; V, S121].
- A performance dial that can hide a hostile telegraph [U, S112].

---

## 11. "See it in action" index

| # | Game | Spell effect idea | URL |
|---|---|---|---|
| 1 | Tibia | Effect flipbooks on a 75 ms clock | https://github.com/edubart/otclient/blob/master/src/client/effect.cpp |
| 2 | Tibia | Effect gallery (fan wiki, blocks scripts) | https://tibia.fandom.com/wiki/Effects |
| 3 | Tibia | Hell's Core, the 73-tile UE | https://github.com/opentibiabr/canary/blob/main/data/scripts/spells/attack/hells_core.lua |
| 4 | Tibia | Spell opacity sliders | https://tibiaroute.com/news/Spell-Opacity-8552-Tm7c |
| 5 | Ragnarok Online | Skill database with animations | https://ratemyserver.net/index.php?page=skill_db |
| 6 | Ragnarok Online | Rotating ground cast circle | https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Effects/MagicTarget.js |
| 7 | Old School RuneScape | Projectiles with delay and arc | https://oldschool.runescape.wiki/w/Projectile |
| 8 | Pokémon Emerald | Thunderbolt: darken, bolts, flicker | https://github.com/pret/pokeemerald/blob/master/data/battle_anim_scripts.s#L1075 |
| 9 | Zelda: A Link to the Past | Ether and Bombos medallions | https://github.com/snesrev/zelda3/blob/master/src/ancilla.c |
| 10 | Final Fantasy VI | Mode 7 and HDMA as script commands | https://github.com/everything8215/ff6/blob/main/src/btlgfx/anim_script.mac |
| 11 | Diablo | Nova, Fire Wall, light ramps | https://github.com/diasurgical/devilutionX/blob/master/Source/missiles.cpp |
| 12 | Diablo II | Back and front overlays | https://github.com/blizzhackers/d2data/blob/master/json/overlay.json |
| 13 | Shattered Pixel Dungeon | Lightning, beams, halos | https://shatteredpixel.com/shatteredpd/ |
| 14 | Mindustry | 267 effects in one file | https://mindustrygame.github.io/ |
| 15 | Noita | Spark Bolt as data | https://github.com/NathanSnail/noitadata/blob/main/data/entities/projectiles/deck/light_bullet.xml |
| 16 | Heroes of Hammerwatch II | A shockwave from one ring sprite | https://github.com/Xinterp6196/Mod-Reworks---Heroes-of-Hammerwatch-II/blob/main/Unfinished%20Mod%20Reworks/Bulwark/players/bulwark/effects/guardian_pulse_area.effect |
| 17 | MUGEN | Stock hit sparks | https://github.com/Tunlan/mugen-1.1b1/blob/HEAD/data/fightfx.air |
| 18 | League of Legends | Hitbox-driven VFX updates | https://www.leagueoflegends.com/en-us/news/dev/dev-behind-the-scenes-of-vfx-updates/ |
| 19 | VALORANT | Thin opaque outlines for areas | https://www.riotgames.com/en/news/valorant-shaders-and-gameplay-clarity |
| 20 | Magicka | One delivery shape per element | https://magicka.fandom.com/api.php?action=parse&page=Elements&prop=wikitext&format=json |
| 21 | Final Fantasy XIV | Battle Effects per source | https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_bteffect.html |
| 22 | World of Warcraft | Spell density in three levels | https://blizzardwatch.com/2025/07/28/blizzard-adding-new-ways-reduce-spell-density-better-performance-visibility-patch-11-2 |
| 23 | Guild Wars 2 | Hide Ally Visual Effects | https://wiki.guildwars2.com/wiki/Game_updates/2023-06-06 |
| 24 | Path of Exile 2 | Ground effect complaints | https://www.pathofexile.com/forum/view-thread/3626389 |
| 25 | Diablo IV | Requests for effect toggles | https://www.icy-veins.com/d4/news/diablo-4-effect-toggles-players-renew-calls-for-this-feature/ |
| 26 | Luanti | Damage flash capped at 50% | https://github.com/luanti-org/luanti/blob/master/src/client/game.cpp |
| 27 | Veloren | Low-health pulse | https://github.com/veloren/veloren/blob/master/voxygen/src/hud/mod.rs |
| 28 | Wolfenstein 3D | FizzleFade | https://fabiensanglard.net/fizzlefade/index.php |

---

## 12. What remains unverified (and corrections)

**Corrections from the lead's verification**
1. **Missile flight time.** `150 ms x sqrt(tiles)`, not 150 ms per tile. The spec and Sandbox were corrected [V, S16].
2. **UE mask size.** The benchmark brief said 37 tiles. `AREA_CIRCLE5X5` has 73 and `AREA_CIRCLE3X3` has 37 [V, S24].
3. **Bytes per effect.** 7 in the old protocol, 9 to 11 from 12.03 onward [V, S18, S21].
4. **Flash safe area.** About 1.5 tiles at 32 px, about 6 tiles at the Sandbox's 16 px [I, lead].
5. **Riot guide.** Read in full from a Wayback copy. Note 13 wins over note 06 (§10).
6. **PreDraw.** 1 means behind the unit. Note 14 wins over note 05 (§10).
7. **Tick rates.** DevilutionX defaults to 20 ticks per second, adjustable to 50. Diablo II runs 25 frames per second [V, S62, S60].
8. **Godot.** 4.7.2 is stable and 4.8 is in beta. Glow works in Compatibility. HDR 2D is implemented in the source while the docs table says "Not supported". Test both [V, S141, S142, S128].
9. **WCAG's 21,824 px** is in technique G176, not the Understanding page [V, S119].
10. **Tibia effect options.** Note 07 found none. Note 14 found the spell opacity teaser [V, S31].

No note found an error in an earlier study. Combat juice B4's 75 ms spark frame matches OTClient's effect clock [V, S14; S11].

**Labelled as estimates, self-reported or author judgement**
- The element table, the tier percentages, caps, decal lifetimes, orbit sizes and every Asterion byte size except 9 and 11 [I].
- Godot web compile times [V, self-reported, S129, S137].
- PixiJS's 1,000,000 particles [V, vendor, S125].
- Researcher counts over Pokémon, FF6, Diablo II and Mindustry data are within about 10%. MUGEN milliseconds assume 60 ticks per second [I, notes 02, 13].

**Still unverified [U]**
- No phone, no Godot build, no GDScript loop and no draw-call count was measured [S13].
- No developer statements for Wizard of Legend, Enter the Gungeon or Nuclear Throne on effect authoring or bullet readability.
- No official effect settings for Lost Ark, Albion or New World.
- No Capcom or Arc System Works hit-spark data, no Metal Slug data, no Dota art guide text.
- Stardew's `GameLocation.explode` was not read.
- Hues for Magicka, Golden Sun and Genshin, and any source on cast circles in those games.
- GW2, PoE and Diablo IV details came through search summaries [U, S112, S107].
- Diablo II `Trans` blend values, FF6's script speed unit and the RotMG values from a private-server fork.
- LFSR masks for sprite-sized fizzles and several classic algorithms were recalled, not fetched [U, note 09]. We found no 2023 to 2026 paper on generated VFX flipbooks, only character work [V, S98].

---

## 13. Prototype roadmap for Godot 4.7

1. **Measure first.** Run `magicbench.html` [S13] on a low-end Android and an older iPhone. Then export a 320x180 Godot 4.7 web build of the 1x scene and read `RENDERING_INFO_TOTAL_DRAW_CALLS_IN_FRAME`.
2. **Effect core.** A flat effect array, the stateless loop, one atlas, one custom-draw node per layer, pooled at load. 75 ms flipbooks and the 5-frame spark.
3. **Missiles.** The 3x3 direction sheet, `150 * sqrt(tiles)`, the impact delayed to arrival, the 8-point ribbon, then homing, lob and beam.
4. **Server events.** Cast, missile, effect, area and condition with a relation per viewer and a delay field. Test that a 73-tile UE is one event.
5. **Areas and residue.** Masks, ring delay, one effect per tile, a 64-decal ring, fields as server objects with 3 stages.
6. **Auras and status.** Four slots, `modulate` tints by priority, the rim shield, cast circles baked from a seed.
7. **Clarity and safety.** Tiers, three opacity sliders, the cap of 96, the same-tile merge, the flash limiter and reduce flashing. Record the 30-caster scene and run IRIS on it.
8. **Glow and warm-up.** Palette ramp first, light-map stamps, and one warm-up frame per shader state on the loading screen.

---

## 14. Sources

Numbered for [S#] references. All URLs come from notes 01 to 14, the lead's verification note, the shared context or the Sandbox spec. "Search summary", "snippet" or "not opened" means our researchers did not read the page directly.

**Series**
1. DOOM PSX fire, Fabien Sanglard, 2018 (series reference): https://fabiensanglard.net/doom_fire_psx/
2. VFX #1 Snow: https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
3. VFX #2 Acid: https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel
4. VFX #3 Rain: https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel
5. VFX #4 Forest: https://kingsfoil-artifacts.netlify.app/vfx-forest-topdown-pixel
6. VFX #5 Light: https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel
7. VFX #6 Fire and smoke: https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel
8. VFX #7 Water: https://kingsfoil-artifacts.netlify.app/vfx-water-topdown-pixel
9. VFX #8 Fog: https://kingsfoil-artifacts.netlify.app/vfx-fog-topdown-pixel
10. VFX #9 Grass: https://kingsfoil-artifacts.netlify.app/vfx-grass-topdown-pixel
11. Game feel #2 Combat juice: https://kingsfoil-artifacts.netlify.app/feel-combat-juice-topdown-pixel
12. Spell Sandbox: `vfx-magic-sandbox.html` (companion page)
13. Our spell benchmark, `notes/bench/magicbench.html` and `run.py`, Apple M4 Pro, Chromium 153, November 2026 (this study)

**Tibia and Open Tibia**
14. OTClient `effect.h`, `EFFECT_TICKS_PER_FRAME = 75`: https://github.com/edubart/otclient/blob/master/src/client/effect.h
15. OTClient `effect.cpp`, phase, lifetime and tile patterns: https://github.com/edubart/otclient/blob/master/src/client/effect.cpp
16. OTClient `missile.cpp`, 3x3 direction sheet and `150 * sqrt(distance)`: https://github.com/edubart/otclient/blob/master/src/client/missile.cpp
17. OTClient `const.h`, item and text timing constants: https://github.com/edubart/otclient/blob/master/src/client/const.h
18. OTClient `protocolgameparse.cpp`: https://github.com/edubart/otclient/blob/master/src/client/protocolgameparse.cpp
19. OTClient (mehah) `client.h`, effect alpha per source: https://github.com/mehah/otclient/blob/main/src/client/client.h
20. The Forgotten Server (TFS) `const.h`, effect and missile ids, `MagicEffectsType_t`: https://github.com/otland/forgottenserver/blob/master/src/const.h
21. TFS `protocolgame.cpp`: https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
22. TFS `networkmessage.cpp`, `addPosition`: https://github.com/otland/forgottenserver/blob/master/src/networkmessage.cpp
23. TFS `game.cpp`, `addMagicEffect`, `combatChangeHealth`: https://github.com/otland/forgottenserver/blob/master/src/game.cpp
24. TFS `spells.lua`, area masks (v1.4.2): https://github.com/otland/forgottenserver/blob/v1.4.2/data/spells/lib/spells.lua
25. TFS `items.xml`, magic fields (v1.4.2): https://github.com/otland/forgottenserver/blob/v1.4.2/data/items/items.xml
26. Canary `protocolgame.cpp`: https://github.com/opentibiabr/canary/blob/main/src/server/network/protocol/protocolgame.cpp
27. Canary `mawhawk_ue.lua`, 101-tile boss mask: https://github.com/opentibiabr/canary/blob/main/data-otservbr-global/scripts/spells/monster/mawhawk_ue.lua
28. Canary `combat.cpp`, chain delay floor of 50 ms: https://github.com/opentibiabr/canary/blob/main/src/creatures/combat/combat.cpp
29. OTClient (mehah) attached effects, source and tutorial: https://github.com/mehah/otclient/blob/main/src/client/attachedeffect.cpp ; https://github.com/mehah/otclient/wiki/Tutorial-Attached-Effects
30. Canary `game.cpp`, mana shield hit path: https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp
31. Tibia "Spell Opacity" teaser of 2025-10-22, CipSoft text reposted by a fan site: https://tibiaroute.com/news/Spell-Opacity-8552-Tm7c

**Other MMOs**
32. ClassicUO `PacketHandlers.cs`, `GraphicEffect`: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Network/PacketHandlers.cs
33. ClassicUO `PacketsTable.cs`, packet lengths: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Network/PacketsTable.cs
34. ClassicUO `GraphicEffectBlendMode.cs` and `GameEffectView.cs`: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Data/GraphicEffectBlendMode.cs ; https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/GameObjects/Views/GameEffectView.cs
35. ClassicUO `MovingEffect.cs`, homing and run-time rotation: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/GameObjects/MovingEffect.cs
36. rAthena `packets.hpp`, `clif.cpp` and `clif_packetdb.hpp`: https://github.com/rathena/rathena/blob/master/src/map/packets.hpp ; https://github.com/rathena/rathena/blob/master/src/map/clif.cpp ; https://github.com/rathena/rathena/blob/master/src/map/clif_packetdb.hpp
37. roBrowserLegacy `EffectTable.js`, 640 effect ids and `min` variants: https://github.com/MrAntares/roBrowserLegacy/blob/master/src/DB/Effects/EffectTable.js
38. roBrowserLegacy `Str.js` and `StrEffect.js`, keyframed layers with blend per key: https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Loaders/Str.js ; https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/Effects/StrEffect.js
39. roBrowserLegacy `EffectManager.js`, `/effect` and `/mineffect`: https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/EffectManager.js
40. RuneLite `Constants.java`, 20 ms client tick and 600 ms game tick: https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/Constants.java
41. RuneLite `Projectile.java`: https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/Projectile.java
42. rsprot `MapProjAnimEncoder.kt` (OSRS revision 230): https://github.com/blurite/rsprot/blob/master/protocol/osrs-230/osrs-230-desktop/src/main/kotlin/net/rsprot/protocol/game/outgoing/codec/zone/payload/MapProjAnimEncoder.kt
43. rsprot `MapAnimEncoder.kt`: https://github.com/blurite/rsprot/blob/master/protocol/osrs-230/osrs-230-desktop/src/main/kotlin/net/rsprot/protocol/game/outgoing/codec/zone/payload/MapAnimEncoder.kt
44. Realm of the Mad God client `Projectile.as` in the TKR fork (third-party): https://github.com/Slendergo/TKR/blob/main/TK-Client/src/com/company/assembleegameclient/objects/Projectile.as
45. roBrowser `EntityState.js`, status tints and head attachments: https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Entity/EntityState.js
46. roBrowser `Entity.js`, cast packet handler: https://github.com/vthibault/roBrowser/blob/master/src/Engine/MapEngine/Entity.js
47. roBrowser `MagicTarget.js`: https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Effects/MagicTarget.js
48. roBrowser `EffectTable.js`, Kyrie Eleison and `kyrie_min`: https://github.com/vthibault/roBrowser/blob/master/src/DB/Effects/EffectTable.js

**Console classics**
49. pokeemerald `battle_anim.c`, 48 commands: https://github.com/pret/pokeemerald/blob/master/src/battle_anim.c
50. pokeemerald `battle_anim_scripts.s`: https://github.com/pret/pokeemerald/blob/master/data/battle_anim_scripts.s
51. pokeemerald `battle_anim_electric.c`: https://github.com/pret/pokeemerald/blob/master/src/battle_anim_electric.c
52. pokeemerald `util.c`, `BlendPalette`: https://github.com/pret/pokeemerald/blob/master/src/util.c
53. pokeemerald `src/data/battle_anim.h` and `include/sprite.h`, sheet sizes and limits: https://github.com/pret/pokeemerald/blob/master/src/data/battle_anim.h ; https://github.com/pret/pokeemerald/blob/master/include/sprite.h
54. FF6 disassembly, attack animation and graphics records: https://github.com/everything8215/ff6/blob/main/src/data/attack_anim_prop.mac ; https://github.com/everything8215/ff6/blob/main/src/data/attack_gfx_prop.mac
55. zelda3 `ancilla.c` (C reimplementation of A Link to the Past): https://github.com/snesrev/zelda3/blob/master/src/ancilla.c

**Diablo and Diablo II**
56. DevilutionX `missile_sprites.tsv`: https://github.com/diasurgical/devilutionX/blob/master/assets/txtdata/missiles/missile_sprites.tsv
57. DevilutionX `missiles.cpp`: https://github.com/diasurgical/devilutionX/blob/master/Source/missiles.cpp
58. d2data `missiles.json` (Diablo II data dump): https://github.com/blizzhackers/d2data/blob/master/json/missiles.json
59. d2data `overlay.json`: https://github.com/blizzhackers/d2data/blob/master/json/overlay.json
60. Diablo II: Resurrected data guide, Overlay.txt and States.txt (mirror): https://d2runewizard.com/game-files/guide.html
61. Diablo II 1.13 `Overlay.txt`: https://github.com/fabd/diablo2/blob/master/code/d2_113_data/Overlay.txt
62. DevilutionX `options.cpp`, 20 ticks per second by default: https://github.com/diasurgical/devilutionX/blob/master/Source/options.cpp#L843
63. Phrozen Keep, Overlay.txt guide: https://d2mods.info/forum/kb/viewarticle?a=465

**Open-source games and engines**
64. Shattered Pixel Dungeon (SPD) `MissileSprite.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/MissileSprite.java
65. SPD `MagicMissile.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/MagicMissile.java
66. SPD `Beam.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Beam.java
67. SPD `WandOfLightning.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/wands/WandOfLightning.java
68. SPD `BlastParticle.java` and `Bomb.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/particles/BlastParticle.java ; https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/bombs/Bomb.java
69. SPD `Speck.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Speck.java
70. SPD `Flare.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Flare.java
71. Mindustry `Trail.java`: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/graphics/Trail.java
72. Mindustry `BulletType.java`, homing, weave, trails: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/BulletType.java
73. Mindustry `ArtilleryBulletType.java`: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/ArtilleryBulletType.java
74. Mindustry `LaserBulletType.java`: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/LaserBulletType.java
75. Mindustry `ContinuousLaserBulletType.java`: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/ContinuousLaserBulletType.java
76. Mindustry `Fx.java`, 267 effects in one file: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/content/Fx.java
77. Mindustry `Effect.java`, stateless effects, clip and decals: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/Effect.java
78. Mindustry `DecalComp.java`: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/comp/DecalComp.java
79. Arc `Angles.java`, `randLenVectors`: https://github.com/Anuken/Arc/blob/master/arc-core/src/arc/math/Angles.java
80. tModLoader `ExampleBullet.cs`: https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleBullet.cs
81. SPD `ShieldHalo.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/ShieldHalo.java
82. Luanti `game.cpp`, damage flash: https://github.com/luanti-org/luanti/blob/master/src/client/game.cpp
83. Quake `view.c`, damage blend: https://github.com/id-Software/Quake/blob/master/WinQuake/view.c
84. Veloren `hud/mod.rs`, low-health pulse: https://github.com/veloren/veloren/blob/master/voxygen/src/hud/mod.rs
85. Magicka wiki, Elements (API): https://magicka.fandom.com/api.php?action=parse&page=Elements&prop=wikitext&format=json
86. Noita data files, Spark Bolt `light_bullet.xml`, and component docs (mirrors): https://github.com/NathanSnail/noitadata/blob/main/data/entities/projectiles/deck/light_bullet.xml ; https://github.com/phantom22/noita_docs/blob/main/additional%20helpers/component_documentation.txt

**Papers and procedural algorithms**
87. Drilian, lightning bolts, 2009: http://drilian.com/2009/02/25/lightning-bolts/
88. Wikipedia, pixel-art scaling algorithms (RotSprite): https://en.wikipedia.org/wiki/Pixel-art_scaling_algorithms
89. Path of Exile wiki, Arc (search summary): https://www.poewiki.net/wiki/Arc
90. Diablo II wiki, Chain Lightning (search summary): https://diablo2.wiki.fextralife.com/Chain+Lightning
91. Reeves, "Particle Systems. A Technique for Modeling a Class of Fuzzy Objects", ACM TOG 2(2), 1983: https://www.cs.princeton.edu/courses/archive/spr15/cos426/papers/Reeves83.pdf
92. Latta, "Building a Million Particle System", GDC 2004 (search summary): https://gamedeveloper.com/programming/building-a-million-particle-system
93. Dielectric breakdown model (Niemeyer, Pietronero, Wiesmann, 1984), Wikipedia: https://en.wikipedia.org/wiki/Dielectric_breakdown_model
94. Kim and Lin, "Fast Animation of Lightning Using an Adaptive Mesh", 2007: https://gamma.cs.unc.edu/FAST_LIGHTNING/
95. Canvas Cycle, Joseph Huckaby and Mark Ferrari, 2010: https://experiments.withgoogle.com/canvas-cycle ; http://www.effectgames.com/demos/canvascycle/
96. Bridson, Hourihan, Nordenstam, "Curl-Noise for Procedural Fluid Flow", 2007: https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf
97. Fabien Sanglard, Wolfenstein 3D FizzleFade: https://fabiensanglard.net/fizzlefade/index.php
98. "Sprite Sheet Diffusion", arXiv 2412.03685, 2024: https://arxiv.org/abs/2412.03685

**Art direction and pixel craft**
99. Raymond Schlitter (Slynyrd), Pixelblog 31, shmup sprite design: https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design
100. Boghog's bullet hell shmup 101: https://shmups.wiki/library/Boghog's_bullet_hell_shmup_101
101. VFX Apprentice, 10 League of Legends VFX design tips (secondary summary): https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
102. MUGEN 1.1 stock `fightfx.air`, hit spark frame data: https://github.com/Tunlan/mugen-1.1b1/blob/HEAD/data/fightfx.air
103. Ikemen GO screenpack `fightfx.air`: https://github.com/ikemen-engine/Ikemen-GO-Screenpack/blob/HEAD/data/fightfx.air
104. Riot Games, League of Legends VFX style guide, 2017, Wayback copy (the live link is dead): https://web.archive.org/web/2018if_/https://nexus.leagueoflegends.com/wp-content/uploads/2017/10/VFX_Styleguide_final_public_hidpjqwx7lqyx0pjj3ss.pdf
105. VFX Apprentice, what is timing in VFX (page summary): https://www.vfxapprentice.com/blog/the-soul-of-effects-what-is-timing-in-vfx
106. Riot, VALORANT shaders and gameplay clarity: https://www.riotgames.com/en/news/valorant-shaders-and-gameplay-clarity

**Crowd settings and player reception**
107. Path of Exile 2 forum threads on ground effects (search snippets): https://www.pathofexile.com/forum/view-thread/3626389 ; https://www.pathofexile.com/forum/view-thread/3843075
108. Icy Veins, Diablo IV effect toggle requests (search snippet): https://www.icy-veins.com/d4/news/diablo-4-effect-toggles-players-renew-calls-for-this-feature/
109. FFXIV UI guide, battle effects settings: https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_bteffect.html
110. Afterimage recipes on forums (unverified estimates): https://discussions.unity.com/t/2d-effects-tips/665528 ; https://forum.defold.com/t/how-do-you-make-an-afterimage-effect/65628
111. Blizzard Watch, WoW 11.2 spell density, 2025-07-28: https://blizzardwatch.com/2025/07/28/blizzard-adding-new-ways-reduce-spell-density-better-performance-visibility-patch-11-2
112. Guild Wars 2 wiki, updates of 2023-06-06 and 2023-06-27 (search summaries): https://wiki.guildwars2.com/wiki/Game_updates/2023-06-06 ; https://wiki.guildwars2.com/wiki/Game_updates/2023-06-27
113. Unreal Engine docs, performance budgeting with Niagara Effect Types: https://dev.epicgames.com/documentation/unreal-engine/performance-budgeting-using-effect-types-in-niagara-for-unreal-engine
114. Unreal API and forum pages on Niagara significance (search summary): https://docs.unrealengine.com/4.27/en-US/API/Plugins/Niagara/UNiagaraEffectType/index.html
115. Throne and Liberty update 4.13.0, Effect Display Range (patch-note mirror): https://patchbot.io/games/throne-and-liberty/articles/1557-update-4130

**Accessibility and photosensitivity**
116. Game Accessibility Guidelines, no essential information by colour alone: https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-fixed-colour-alone/
117. Overwatch colour-blind options and player reports (search snippets): https://www.slashgear.com/overwatch-gets-updated-colorblind-feature-with-nine-color-options-21546973
118. W3C, Understanding WCAG 2.3.1, three flashes or below threshold: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
119. W3C, technique G176, keeping the flashing area small: https://www.w3.org/WAI/WCAG21/Techniques/general/G176
120. Xbox Accessibility Guideline 118, photosensitivity: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/118
121. Wikipedia, Dennō Senshi Porygon: https://en.wikipedia.org/wiki/Denn%C5%8D_Senshi_Porygon
122. God of War Ragnarök accessibility options (search summary): https://www.playstation.com/en-ie/games/god-of-war-ragnarok/accessibility/

**Godot engine and web rendering**
123. Godot `Line2D` class reference: https://github.com/godotengine/godot/blob/master/doc/classes/Line2D.xml
124. Godot docs, screen-reading shaders: https://docs.godotengine.org/en/4.4/tutorials/shaders/screen-reading_shaders.html
125. PixiJS v8 ParticleContainer post, 2024 (vendor-reported): https://pixijs.com/blog/particlecontainer-v8
126. Godot PR 99230, 2D instance uniforms (4.4): https://github.com/godotengine/godot/pull/99230
127. Godot 4.7 source, `particles_storage.cpp` (Compatibility particle limits): https://github.com/godotengine/godot/blob/4.7-stable/drivers/gles3/storage/particles_storage.cpp
128. Godot docs, renderers overview and feature table: https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html
129. Godot issue 87843, GPUParticles2D load times on HTML5 (self-reported): https://github.com/godotengine/godot/issues/87843
130. Godot 4.7 source, `rasterizer_canvas_gles3.cpp`, batching rules: https://github.com/godotengine/godot/blob/4.7-stable/drivers/gles3/rasterizer_canvas_gles3.cpp
131. Godot 4.7 source, `rasterizer_canvas_gles3.h`, light limits: https://github.com/godotengine/godot/blob/4.7-stable/drivers/gles3/rasterizer_canvas_gles3.h
132. Godot docs, MultiMesh class and tutorial: https://docs.godotengine.org/en/stable/classes/class_multimesh.html ; https://docs.godotengine.org/en/stable/tutorials/performance/using_multimesh.html
133. Godot docs, 2D lights and shadows: https://docs.godotengine.org/en/stable/tutorials/2d/2d_lights_and_shadows.html
134. Godot PR 87360, glow in Compatibility (4.3): https://github.com/godotengine/godot/pull/87360
135. Godot forum, HDR 2D glow size in Compatibility: https://forum.godotengine.org/t/how-can-i-adjust-hdr2d-glow-size/128616
136. Godot docs, shading language (instance uniforms): https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/shading_language.html
137. Godot issue 86731, slow shader compilation in Compatibility (self-reported figures): https://github.com/godotengine/godot/issues/86731
138. Godot docs, pipeline compilations: https://docs.godotengine.org/en/stable/tutorials/performance/pipeline_compilations.html
139. Godot forum, particle shader compilation lag on web: https://forum.godotengine.org/t/handling-particle-shader-compilation-lag-in-godot-4-web-compatibility-renderer/36170
140. Godot docs, ProjectSettings (snap, item buffer size, HDR 2D): https://docs.godotengine.org/en/stable/classes/class_projectsettings.html
141. Godot 4.7.2-stable release, 2026-08-18: https://github.com/godotengine/godot/releases/tag/4.7.2-stable
142. Godot 4.7.2 source, `texture_storage.cpp`, HDR render targets in Compatibility: https://github.com/godotengine/godot/blob/4.7.2-stable/drivers/gles3/storage/texture_storage.cpp
