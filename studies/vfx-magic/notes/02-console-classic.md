# 02. Console and classic spell effects (8/16-bit, GBA, arcade, classic PC)

Researcher 02, VFX #10 "Magic and spell VFX". Fetch date 2026-11-11. All line numbers refer to the `master`/`main` branch on that date. Raw copies of the source files I measured are in `scratch-02/`.

How to read this file. "Cited" means I read it in the linked source or counted it with a script over the linked file. "Inference" is my reading. Frame counts assume 60 Hz for GBA and SNES (59.73 and 60.1 Hz in reality).

Short version. The old games that hold hundreds of spells in a few megabytes all do the same thing. They keep a small library of tiny sprites (8 to 32 px), and a spell is a short script that spawns those sprites on a timer, moves them with a handful of motion callbacks, and adds palette tricks on the target and the background. The art cost per spell is close to zero. The script is the spell.

---

## 1. Pokémon battle animations as data

### Takeaway
Pokémon Emerald describes 355 moves with a 48-opcode bytecode and 289 small sprite sheets. The median move loads 1 sheet. Flamethrower is 22 copies of one 32x32 ember, spawned 2 frames apart. Psychic loads no sprite at all. It is a background swap, a palette pulse and a shake. This is the best model I found for a data-driven spell format.

### Cited findings

The command set
- The interpreter has 48 commands, opcodes 0x00 to 0x2F. `src/battle_anim.c` lines 118-168. The ones that matter: `loadspritegfx`, `createsprite`, `createvisualtask`, `delay`, `waitforvisualfinish`, `playse`/`playsewithpan`/`panse`, `monbg`/`clearmonbg`, `setalpha`, `blendoff`, `call`/`return`, `fadetobg`/`restorebg`, `setbldcnt`. https://github.com/pret/pokeemerald/blob/master/src/battle_anim.c
- `delay` takes one byte, in frames. `createsprite` takes a template pointer, a priority byte and a list of 16-bit args. `createvisualtask` takes a function pointer, a priority and args. `setalpha eva, evb` packs to `(evb << 8) | eva`. `asm/macros/battle_anim_script.inc` lines 13-76. https://github.com/pret/pokeemerald/blob/master/asm/macros/battle_anim_script.inc
- Limits. A script may hold 8 sprite sheets at once (`ANIM_SPRITE_INDEX_COUNT 8`, battle_anim.c line 26). The engine has 64 sprites (`MAX_SPRITES 64`), 32 affine matrices (`OAM_MATRIX_COUNT 32`) and 16 tasks (`NUM_TASKS 16`). `include/sprite.h` lines 4-5, `include/task.h` line 8. https://github.com/pret/pokeemerald/blob/master/include/sprite.h

How many assets cover how many moves (my counts over `data/battle_anim_scripts.s` and `include/constants/battle_anim.h`)
- 289 `ANIM_TAG_*` sprite sheets are defined (ids 0 to 288). The move scripts load 192 distinct ones.
- 356 `Move_*` labels (355 moves plus `Move_NONE`).
- `loadspritegfx` per move: median 1, mean 1.61, max 30. 40 moves load no sheet.
- `createsprite` lines per move: median 2, mean 3.8, max 105 (before `call` repeats).
- One sheet, `ANIM_TAG_IMPACT` (the generic hit splat), is loaded 115 times. Next are hands and feet (30), blue star (16), small ember (15), ice crystals, thin ring, sparkle and orbs (11 each).
- 1486 `delay` commands. Median 4 frames (67 ms). Most common values are 2 frames (205 uses), 4 (183), 1 (183), 3 (106), 6 (100), 10 (99).
- 188 move blocks use `monbg` (blend against the target), 124 use a palette blend, 197 use a shake task, 34 swap the background with `fadetobg`.
- `setalpha 12, 8` appears 132 times. `8, 8` appears 13 times.
- Caveat. I split the file at `Move_` labels, so shared subroutines that sit after a move are counted with it. Treat the per-move numbers as within 10%.
- Sheet sizes from `src/data/battle_anim.h`: SmallEmber 0x0A00 bytes (5 frames of 32x32 at 4bpp), Spark 0x0300, Spark2 0x0180, Impact 0x0200 (one 32x32 frame), IceCrystals 0x01C0, Shock3 0x0600. Lines 1013, 1023, 1041, 1147, 1153, 1294. Each sheet has one 16-colour palette. https://github.com/pret/pokeemerald/blob/master/src/data/battle_anim.h

Worked examples (all in https://github.com/pret/pokeemerald/blob/master/data/battle_anim_scripts.s)
- Ember, lines 919-937. One sheet. 3 ember sprites, 4 frames apart, each with a travel argument of 20. Then `delay 16`. Then 3 flare sprites on the target, 4 frames apart.
- Flamethrower, lines 6311-6342. One sheet (`SMALL_EMBER`). `setalpha 12, 8`. Attacker shake for 46 frames. `FlamethrowerCreateFlames` is called 11 times. Each call makes 2 sprites with `delay 2` after each. That is 22 sprites over 44 frames (0.73 s). The target starts to shake after call 3, at frame 18 (300 ms), for 43 frames.
- The flame loop is 5 frames at 4 ticks each, 20 ticks per cycle, so 15 fps. `src/battle_anim_fire.c` lines 225-233 (`sAnim_BasicFire`). 15 of the 19 sprite templates in that file use 32x32 with affine off. https://github.com/pret/pokeemerald/blob/master/src/battle_anim_fire.c
- Thunderbolt, lines 1075-1122. Three sheets. Step 1, darken the background palette from 0 to 6 of 16. Step 2, three bolts at delays 7, 7 and 9 frames. Step 3, blend the target to black (0 to 13) and back. Step 4, 8 flashing sparks around the target on two rings (radius 32 and 16), plus an orb. Step 5, flicker the background blend between 2 and 6 every 6 frames, 4 times. Step 6, restore the background from 6 to 0. Explicit delays sum to 111 frames (1.85 s) before the `waitforvisualfinish` time.
- A bolt is built from 8x8 pieces. `AnimTask_ElectricBolt_Step` creates 5 segments, one every 2 ticks, 16 px apart, and ends at tick 10. `src/battle_anim_electric.c` lines 222-230 and 685-760. The big lightning flipbook is 5 frames at 5, 5, 8, 5, 5 ticks (28 ticks, 467 ms), lines 40-46. https://github.com/pret/pokeemerald/blob/master/src/battle_anim_electric.c
- Ice Beam, lines 5351-5393. One sheet. Background darkens to 7 of 16. `IceBeamCreateCrystals` makes 3 sprites (2 outer, 1 inner) then `delay 1`, called 11 times. The target is tinted toward RGB(0, 20, 31) at 7 of 16 while the beam runs, then released over the end.
- Psychic, lines 4733-4748. No sprite sheet. `fadetobg BG_PSYCHIC`, `setalpha 8, 8`, the attacker's palette pulses twice to RGB(31, 23, 0) at 8 of 16, then the target shakes for 15 frames and scales.

The palette blend
- `BlendPalette(palOffset, numEntries, coeff, blendColor)` is 16 lines. Per channel it computes `c + (((target - c) * coeff) >> 4)` with coeff 0 to 16, reading the unfaded palette and writing the faded one. `src/util.c` lines 264-279. https://github.com/pret/pokeemerald/blob/master/src/util.c
- It recolours 16 palette entries, so the cost does not depend on sprite size.

Gen 2 (Game Boy Color), for scale
- pokecrystal has 282 `BattleAnim_*` labels in `data/moves/animations.asm`. Any byte from $00 to $CF is a wait of that many frames. Commands are $D0 to $FF (48 codes). An animation loads at most 5 graphics sets (`anim_5gfx`). Palette flashes are `anim_bgp`, `anim_obp0`, `anim_obp1` (whole 4-shade palettes). https://github.com/pret/pokecrystal/blob/master/docs/battle_anim_commands.md
- Flamethrower in Crystal is 8 objects, 2 frames apart, from one graphics set, then a 6x16 frame sound loop. https://github.com/pret/pokecrystal/blob/master/data/moves/animations.asm

### Inferences
- `setalpha 12, 8` means sprite at 12/16 plus background at 8/16, clamped at 31. The weights sum to 1.25, so overlaps brighten. It is a cheap "screen-like" glow, and Game Freak used it in about a third of the moves. Modern equivalent: draw the effect at 75% and the scene under it at 50% inside the effect's own pixels, or just use premultiplied alpha with an additive part.
- The sheet reuse numbers (192 sheets for 355 moves, one hit splat in 115 moves) say that element identity comes from colour and motion more than from unique art.
- A Kingsfoil spell could be a record with phases (cast, travel, impact, linger), each a list of timed commands from a set of about 10: spawn sprite with motion preset, wait, play sound, blend palette of target, shake target, tint screen, call sub-effect. Pokémon needed 48, and half of those are sound panning and battler bookkeeping.

### Gaps
- I did not read `gFlamethrowerFlameSpriteTemplate` (it is not in battle_anim_fire.c on master), so the flame's flight time is unknown to me.
- pokefirered was not read. It shares the engine.
- No frame-time measurement. These are data counts only.

---

## 2. SNES RPG spell effects

### Takeaway
The SNES gave spell animators four cheap screen tricks: colour math (add or subtract a second layer or a fixed colour), HDMA (change a register every scanline), windows (circles and wipes), and Mode 7. FF6's animation script exposes each as a named command. Zelda 3's medallions are tiny tile sets driven by state machines, and the "power" comes from a palette flash on the whole background.

### Cited findings

Colour math (how the SNES blended without alpha)
- Per channel: main colour plus or minus the sub-screen colour or a fixed colour, optionally halved, clamped to 0..31. Registers CGWSEL $2130, CGADSUB $2131, COLDATA $2132. https://snes.nesdev.org/wiki/Color_math
- Add can only lighten. Subtract can only darken. Add plus half is a fixed 50% blend.
- Only sprites on palettes 4 to 7 take part. Sprites cannot blend with other sprites.
- Named uses on that page: Secret of Mana water (add plus half), F-Zero horizon glow (fixed colour plus HDMA gradient), Super Mario World ghosts fading by darkening an additive palette, Yoshi's Island darkness by subtraction.

HDMA
- 8 channels, shared with DMA. A table entry says "write this value, then wait N scanlines" (1 to 128) or "write every scanline for N lines" (up to 127). https://snes.nesdev.org/wiki/HDMA
- Worked examples on the wiki: a sine distortion that feeds a 48-entry table of about -16 to +16 px into BG1HOFS, repeated 5 times down the screen; a per-scanline shear; a colour gradient written to CGRAM over 88 scanlines. https://snes.nesdev.org/wiki/HDMA_examples

Final Fantasy VI (disassembly: https://github.com/everything8215/ff6)
- 406 attack animations are defined in `src/data/attack_anim_prop.asm`. Each record is 14 bytes: script ids for sprite, BG1, BG3 and one "extra" layer, a palette per layer, a sound, an init function and a delay that defaults to 16. `src/data/attack_anim_prop.mac`. https://github.com/everything8215/ff6/blob/main/src/data/attack_anim_prop.mac
- 650 graphics records in `src/data/attack_gfx_prop.asm`, each 6 bytes: 2bpp or 3bpp flag, frame count, tile offset, frame offset, frame width and height in tiles. https://github.com/everything8215/ff6/blob/main/src/data/attack_gfx_prop.mac
- Effect art is 3bpp or 2bpp, so 8 or 4 colours per layer.
- Frames per graphic (my count): 4 frames is the most common (80 records), then 5 (34), 2 (33), 8 (32), 6 (30). The longest is 29.
- Frame sizes (my count): {16, 10} tiles 91 times, {3, 3} 84 times, {2, 2} 72 times, {4, 4} 40 times.
- Fire: sprite layer only, palette 56, 5 frames of {2, 3} tiles, script speed 5. The script forks 3 threads. Two of them play a 5-frame loop while moving 26 units back and forward, and the first one recolours the target (`anim_target_pal`) and restores it. `src/btlgfx/attack_anim_script.asm` near line 16095. https://github.com/everything8215/ff6/blob/main/src/btlgfx/attack_anim_script.asm
- Blizzard adds a BG1 layer: 6 frames of {6, 10} tiles with its own palette (attack_gfx_prop.asm line 2304).
- The script macro file defines about 308 macros. The hardware tricks are commands: `mode7_move` (line 560), `mode7_zoom`, `mode7_rotate`, `update_rainbow_gradient` (499), `update_blue_gradient`, `enable_monster_color_math` (509), `bg1_window` (600), `circle_shape` (705), `window2_size`, `reset_scroll_hdma` (422), `update_window_hdma` (798), `update_vec_wave`, `dec_brightness`, `mainscreen_layers`, `screen_mode`. `src/btlgfx/anim_script.mac`. https://github.com/everything8215/ff6/blob/main/src/btlgfx/anim_script.mac
- 661 script labels end in 708 `end_anim_script` (threads). Script speed is 1 to 16. 142 scripts use speed 1, 36 use 3, 24 use 4, 19 use 5.

Zelda: A Link to the Past (C reimplementation of the disassembly: https://github.com/snesrev/zelda3/blob/master/src/ancilla.c)
- Spell objects are "ancillae". 67 handler types (line 252). The loops run over 10 slots (lines 340, 2695, 6019).
- Velocity is in 1/16 px per frame (`vel << 4` added to an 8-bit subpixel, lines 1243-1251).
- Fire Rod shot: velocity 64, so 4 px per frame, 240 px/s, 15 tiles of 16 px per second (lines 538-541). A second table uses 40, 48 and 64 (lines 22-23).
- Fire Rod impact: timer 31 frames. `timer >> 3` picks one of 3 16x16 frames for 8 frames each, then two 8x8 embers for the last 8 frames. Total 32 frames, 533 ms (lines 841-873).
- Ice Rod shot: animation step every 4 frames, starts moving after 2 steps, drops sparkle ancillae with velocity 4 (0.25 px per frame) behind it. Wall hit is 2 steps of 8 frames, 16 frames total (lines 2043-2078, 680-730).
- Ether (lines 2338-2470). Phases: lightning stroke down to Link, orb pulse, split into 8 balls, spin, fly out. The 8 balls advance 1 step per frame on a 64-step circle, so one turn takes 64 frames (1.07 s). Radius grows to 0x40 = 64 px, holds, then the radial speed rises by 16 per frame. Ball art is 2 alternating 16x16 tiles (line 2497), orb is 4 tile pairs (line 86).
- Ether's flash: while active, `(++counter & 4) == 0` picks between `Filter_Majorly_Whiten_Bg()` with an electric palette for Link and the normal palettes (lines 2345-2356). That is 4 frames white, 4 frames normal, 7.5 flashes per second.
- Bombos (lines 2562-2830). 10 fire column slots, each 13 steps of 4 frames (52 frames). Then 8 blast slots, 8 stages of 4 frames each (32 frames). A blast grows from one 16 px tile to four tiles offset by ±19 px, about 38 px across. Each blast uses 4 OAM entries.
- Quake uses a table of 15 ground-bolt tiles and two position tables (lines 98-240).

### Inferences
- If FF6's frame unit is a 16 px tile, then {16, 10} is 256x160, a full battle-field layer, and {2, 2} to {4, 4} are 32 to 64 px sprites. I did not confirm the tile unit in code.
- FF6's script speed is probably ticks per frame step. Not confirmed.
- Ether's 7.5 Hz full-background flash breaks the modern "3 flashes per second" rule. Keep the idea (palette-only whiten of the background) and slow it to one flash, or use a single 4-frame hold with a fade.
- Shader or canvas imitations, with rough cost:
  - Colour add: `blend_add` CanvasItem material, or on canvas `globalCompositeOperation = 'lighter'`. Zero extra passes.
  - Colour subtract for darkness spells: `blend_sub`, or multiply by a dark tint.
  - Fixed-colour add with gradient: one full-screen quad with a 1 px wide vertical gradient texture, additive.
  - HDMA wave: in a fragment shader, `uv.x += table[int(uv.y * H)] / W`. One screen-texture read per pixel. On canvas, draw the buffer in 1 px rows with an x offset from a 48-entry table (180 `drawImage` calls at 320x180).
  - Window circle: `step(length(uv - c), r)` mask, or a pre-drawn circle sprite.
  - Mosaic: `floor(uv * n) / n` on a screen read, or draw the low-res buffer at a lower size and scale it up with nearest filtering.
  - Mode 7: one affine-transformed textured quad.
  - Palette flash: swap a palette row in a lookup texture, or tint through a shader uniform. No texture changes.
- Every one of these that reads the screen costs a full-screen copy in Godot's Compatibility renderer. The palette tricks and additive sprites do not. Cost numbers are for other researchers to measure.

### Gaps
- Chrono Trigger, Super Mario RPG and Secret of Mana spells: no decompilation or technical write-up read. The only Secret of Mana fact here is the water blend from the nesdev page.
- Zelda 3's "garnish" trail system lives in `sprite.c`. ancilla.c has one reference (line 3022). Not read.
- FF6 esper sequences were not read one by one.

---

## 3. Game Boy Advance and DS

### Takeaway
The GBA had real blending but only in 1/16 steps and never sprite over sprite, and it could rotate or scale at most 32 sprites, at twice the per-pixel line cost. Its best-looking spell work (Pokémon, Golden Sun) is many small sprites plus palette blends, with blending kept for one layer at a time.

### Cited findings
- BLDALPHA holds EVA (bits 0-4) and EVB (bits 8-12), each 0 to 16 in 1/16 steps. `I = MIN(31, I1st*EVA + I2nd*EVB)` per channel. https://problemkaputt.de/gbatek-lcd-i-o-color-special-effects.htm
- BLDY brightness: increase is `I + (31 - I) * EVY`, decrease is `I - I * EVY`, EVY in 1/16 steps. Same page.
- Blending only happens between the top pixel (1st target) and the pixel right under it (2nd target). Sprite over sprite blending is not possible. Same page.
- 128 sprites per screen, 8x8 to 64x64, 32 rotation/scaling parameter sets. A normal sprite costs n cycles per scanline for n pixels of width. An affine sprite costs 10 + 2n. The line budget is 1210 cycles, or 954 with H-blank free. https://problemkaputt.de/gbatek-lcd-obj-overview.htm
- Pokémon Emerald's choices under those limits are in section 1: 32x32 non-affine sprites for most fire templates, `setalpha 12, 8` in 132 places, palette blends in 124 moves.

### Inferences
- From the cycle costs, a scanline fits about 37 plain 32 px sprites or about 16 affine 32 px sprites (1210 / 32 and 1210 / 74). That is the real reason effects were built from small unrotated sprites and why rotation was baked into directions. The same trade exists on low-end WebGL as overdraw.
- "No sprite over sprite blending" forced one translucent layer over opaque art. That is also a good readability rule for 30 casters: opaque cores, one soft layer.

### Gaps
- Golden Sun: two searches found only reviews praising rotation, zoom and particles. No technical breakdown. I have no cited numbers.
- Fire Emblem GBA spell animations: the FEUniverse thread I read covers command numbers only (0x14 to 0x52 pass to the attacker's animation). No frame sizes or colour limits found. https://feuniverse.us/t/notes-for-csa-and-battle-animations/745
- Castlevania (Aria, Circle of the Moon), Minish Cap (zeldaret/tmc decomp) and DS titles were not researched.

---

## 4. Arcade and 2D fighters

### Takeaway
I found no citable frame counts for Street Fighter, Guilty Gear or Metal Slug effects. This question stays open.

### Cited findings
- CPS-1 sprites are built from 16x16 tiles, so SF2's sparks are multiples of 16 px. https://fabiensanglard.net/cpss/
- Metal Slug artist Akio says his animations made programmers "want to rip their hair out". Headline only, the body did not load. https://automaton-media.com/en/news/metal-slug-artist-akio-says-his-elaborate-pixel-animations-made-his-programmers-want-to-rip-their-hair-out-but-it-was-so-worth-it/

### Inferences
- None worth recording without frame data.

### Gaps
- Per-strength spark sizes and frame counts in SF2, SF3 and Guilty Gear. Best next step is frame-stepping in MAME or reading sprite rips, which the rules of this study do not allow me to download.
- Metal Slug explosion frame counts.
- The combat-juice study's B4 rule (75 ms per spark frame) is still the only number the series has here.

---

## 5. Classic PC: Diablo I and II

### Takeaway
Diablo treats a spell as a row in a table: sprite set, direction count, frame count, speed, range in frames, light radius and colour, and the names of the missiles to spawn while flying and on hit. Diablo II ships 742 such rows over 292 sprite files. A light with a radius and an RGB colour is attached to 43% of them.

### Cited findings

Diablo I (DevilutionX)
- `assets/txtdata/missiles/missile_sprites.tsv` defines 46 sprite sets with width, direction count, frame delay and frames per direction. https://github.com/diasurgical/devilutionX/blob/master/assets/txtdata/missiles/missile_sprites.tsv
- Projectiles: Fireball 16 directions, 14 frames, 96 px wide. Fire arrow and lightning arrow 16 directions, 4 frames. Holy bolt 16 directions, 14 frames. Magma ball 8 directions, 16 frames, 128 px. Acid 16 directions, 8 frames.
- Impacts and areas: Big explosion 15 frames at 160 px. Holy bolt explosion 8 frames at 160 px. Blood star explosion 7 frames at 128 px. Magma ball explosion 10 frames with delay 1. Fire arrow explosion 6 frames at 64 px. Lightning 8 frames. Inferno 20 frames. Fire wall has a 13-frame start and an 11-frame loop at 128 px. Acid puddle has a 9-frame start and a 4-frame loop.
- Lights in `Source/missiles.cpp`: firebolt adds a light of radius 8 at the start tile (line 1878), lightning uses radius 4 (line 2017), other missiles use 1, 5 or 8. Explosions and the fire wall start ramp the radius through `ExpLight = {2, 3, 4, 5, 5, 6, 7, 8, 9, 10, 11, 12}` (lines 3063 and 3478). The fire wall walks the table up and back down (lines 3084-3089). https://github.com/diasurgical/devilutionX/blob/master/Source/missiles.cpp
- Firebolt speed is 26 by default. For a player's bolt it is 16 plus `min(spell level * 2, 47)`. Lifetime is 256 ticks. Direction is one of 16 (lines 1860-1878).

Diablo II (data dump: https://github.com/blizzhackers/d2data/blob/master/json/missiles.json and overlay.json; my counts)
- 742 missile rows, 292 distinct `CelFile` sprite files.
- `NumDirections`: 1 in 390 rows, 16 in 122, 32 in 102, 4 in 57, 8 in 56.
- `AnimSpeed` is 16 in 702 rows. `AnimLen` median is 10 frames. The most common lengths are 1 (89 rows), 8 (83), 2 (79), 16 (62), 12 (43).
- `Vel`: median 15.5, range 1 to 100. Fire Bolt 20, Ice Bolt 12, Glacial Spike 16, Bone Spear 24, Chain Lightning 30, Frozen Orb 10.
- `Range`: Fire Bolt 50 frames, Fire Wall 90, fire explosion 12, ice explosion 16.
- Light: 318 rows have a `Light` radius. 40 have `Flicker`. Fire Bolt is radius 7 with RGB 255, 178, 64. Ice Bolt is radius 7 with RGB 81, 81, 255. The fire explosion jumps to radius 13. The ice explosion is 11. Fire Wall is radius 5 with flicker 4.
- Chaining: 94 rows name a sub-missile released in flight, 89 name a hit sub-missile, 102 name an `ExplosionMissile`. Fire Bolt names `fireexplode` (12 frames, no loop, random start of 5). Bone Spear names a trail (`bonespeartrail`), a hit effect and an explosion. Frozen Orb names `frozenorbbolt` in flight and `frozenorbnova` on expiry.
- Fire Wall has 37 frames with a sub-loop from frame 12 to 36, so 12 frames of ignition then a 25-frame loop.
- `Trans` is 1 in 492 rows, 0 in 245, 2 in 5.
- Overlays (auras, buffs, cast effects on a unit): 334 rows. Median 16 frames. `AnimRate` 16 in 249 rows and 8 in 55. `PreDraw` is 1 in 77 rows and 0 in 257. `Trans` is 3 in 323 rows. Each has a light `Radius` and RGB.
- Column meanings from the modding guides: `Vel` is pixels per frame, `MaxVel` caps it when acceleration is positive, `Range` is frames of life, distance is speed times range, `InitSteps` is frames before the missile shows on the client, `AnimSpeed` is not changed by `animrate`. https://d2mods.info/forum/kb/viewarticle?a=364 and https://d2mods.info/forum/kb/viewarticle?a=352 (read through search snippets, not the full pages).

### Inferences
- Diablo I runs its logic at 20 ticks per second (common knowledge, not fetched here). On that basis the big explosion lasts 750 ms, the holy bolt explosion 400 ms, the fire arrow explosion 300 ms.
- Diablo II runs at 25 frames per second (not fetched here). Fire Bolt then lives 2 s and its explosion 0.48 s.
- `Trans = 1` on two thirds of missiles is very likely a blend mode where black is transparent (additive-like), and `Trans = 3` on overlays a similar light blend. The guide I found lists it as unknown. Treat as unconfirmed.
- `PreDraw = 1` very likely means "draw behind the unit". 77 of 334 overlays use it. That matches the behind/in-front split in scope item 3. Unconfirmed.
- Half of D2's missiles have 1 direction. Orbs, explosions, novas and ground fire never needed rotation. Only bolts, arrows and spears use 16 or 32.
- The table design maps to Kingsfoil directly. A spell row names its travel sprite, its trail sub-missile, its hit sub-missile and a light. The server sends the row id and endpoints, and the client expands the chain.

### Gaps
- Ultima VII and early Zelda-likes on PC were not researched.
- D2 column guide pages were not read in full. `Trans`, `PreDraw`, `SubLoop` and the light radius unit need confirmation.
- No sprite pixel sizes for D2 (the DCC files are binary).

---

## 6. Rules that transfer

Cited numbers behind each rule are in sections 1 to 5. The rules themselves are my inferences.

1. Build spells from a shared sprite library. Pokémon covers 355 moves with 192 loaded sheets and a median of 1 sheet per move. FF6 covers 406 animations with 650 small graphics records. Target for Kingsfoil: 30 to 40 shared sheets of 8 to 32 px, and one generic hit splat used everywhere.
2. Make the spell a script, with waits in frames. The common waits are 1, 2, 4 and 6 frames. Staggered copies of one sprite 2 frames apart read as a stream (Flamethrower: 22 sprites over 44 frames).
3. Flipbooks are short. 4 or 5 frames is typical (FF6 mode is 4, Pokémon fire is 5). Step time is 4 ticks at 60 Hz, about 15 fps. Lightning holds its brightest frame longer (5, 5, 8, 5, 5).
4. Durations by class.
   - Projectile loop: 4 to 6 frames per direction, or 14 to 16 for big slow orbs (Diablo fireball 14).
   - Small impact: 16 to 32 frames at 60 Hz, 270 to 530 ms (Zelda ice hit 16, fire hit 32, Bombos blast 32). Diablo small explosions are 6 to 8 frames at 20 Hz, 300 to 400 ms.
   - Big impact: 10 to 15 frames at 20 Hz, 500 to 750 ms.
   - Area with ignition and loop: 12 or 13 start frames, then an 11 to 25 frame loop (Diablo I and II fire wall).
   - Full single-target spell with wind-up: about 1 to 2 s in a turn-based game (Thunderbolt has 111 frames of explicit delay). A real-time MMO should cut this to the impact part only.
5. Sizes. Console spell parts are 8x8, 16x16 and 32x32. A 16 px hero in Zelda fires a 16 px shot whose impact stays 16 px and whose biggest medallion blast is about 38 px. So projectile about 1x the character, small impact 1x, big blast 2x to 2.5x. Diablo is larger: 96 px missiles and 160 px explosions against a roughly 96 px tall character frame, so 1x and 1.7x.
6. Palette. One 16-colour palette per sheet on GBA. 4 or 8 colours per effect layer in FF6. Kingsfoil can hold an element to 4 to 8 colours including the white core.
7. Speed. Zelda's fire rod moves 4 px per frame, 15 tiles per second at 16 px tiles. Slow shots there use 2.5 and 3 px per frame.
8. Blending without alpha, in order of cost.
   - Opaque sprites with a palette ramp to white. Free.
   - Palette blend on the target or background (`c + (target - c) * k / 16`). 16 entries, free.
   - Additive or "12/16 + 8/16" blend for one layer. No sprite over sprite.
   - Whole-screen tricks (darken background to 6/16 or 7/16 before the bolt, whiten on impact). Pokémon uses a background darken in Thunderbolt and Ice Beam so a bright effect has contrast. This is the cheapest "power" cue in the whole set.
9. Tint the victim, not just the air. Ice Beam tints the target to RGB(0, 20, 31) at 7/16. Thunderbolt blacks it out to 13/16 then releases. FF6 Fire recolours the target palette for the length of the flame.
10. Attach a light to the missile and ramp it on impact. Diablo ramps radius 2 to 12 over 12 steps. D2 fire bolt goes from radius 7 in flight to 13 on explosion. The light study (#5) already has the map to draw it on.
11. Chain small effects by name (trail, hit, explosion) and keep half of them direction-free. D2 has 1 direction on 390 of 742 rows.
12. Mind the flashes. Ether's 7.5 Hz whiten and Thunderbolt's 5 Hz flicker would not pass a 3 flashes per second limit at full-screen scale. Keep the darken-then-flash shape and do it once.

---

## Summary table

"See it" links marked (code) point at the script or table that defines the effect. Links marked (unverified) are wiki or reference pages I did not fetch.

| Game | Effect | Technique | Frames | Duration | Sprite size | See it in action |
|---|---|---|---|---|---|---|
| Pokémon Emerald (GBA) | Ember | 3 ember sprites, 4 frames apart, then 3 flare sprites | 5-frame flame loop at 4 ticks | 20-tick loop (333 ms) | 32x32 | https://github.com/pret/pokeemerald/blob/master/data/battle_anim_scripts.s#L919 (code), https://bulbapedia.bulbagarden.net/wiki/Ember_(move) (unverified) |
| Pokémon Emerald | Flamethrower | 22 copies of one ember, 2 frames apart, alpha 12/16 + 8/16, shakes | 5-frame loop | 44 frames of emission (0.73 s) | 32x32 | https://github.com/pret/pokeemerald/blob/master/data/battle_anim_scripts.s#L6311 (code), https://bulbapedia.bulbagarden.net/wiki/Flamethrower_(move) (unverified) |
| Pokémon Emerald | Thunderbolt | Background darken to 6/16, 3 bolts of five 8x8 segments, target blackout 13/16, 8 orbiting sparks, background flicker | bolt built in 10 ticks | 111 frames of explicit delay (1.85 s) plus waits | 8x8 segments, sparks on 16 and 32 px rings | https://github.com/pret/pokeemerald/blob/master/data/battle_anim_scripts.s#L1075 (code) |
| Pokémon Emerald | Ice Beam | 3 crystals per frame for 11 frames, background darken 7/16, target tint RGB(0,20,31) 7/16 | not read | beam emission about 12 frames, plus fades | small crystal sheet (0x1C0 bytes) | https://github.com/pret/pokeemerald/blob/master/data/battle_anim_scripts.s#L5351 (code) |
| Pokémon Emerald | Psychic | No sprites. Background swap, palette pulse 8/16 twice, shake 15 frames, scale | 0 | not summed | none | https://github.com/pret/pokeemerald/blob/master/data/battle_anim_scripts.s#L4733 (code) |
| Pokémon Crystal (GBC) | Flamethrower | 8 objects, 2 frames apart, 1 graphics set | not read | 16 frames of spawn plus 7x16 frames of hold | not read | https://github.com/pret/pokecrystal/blob/master/data/moves/animations.asm (code) |
| Zelda: A Link to the Past (SNES) | Fire Rod shot | 4-direction projectile, 4 px per frame | not read | until hit | 16x16 | https://github.com/snesrev/zelda3/blob/master/src/ancilla.c#L537 (code) |
| Zelda: ALttP | Fire Rod impact | 3 big frames then 2 small embers | 4 stages x 8 frames | 32 frames (533 ms) | 16x16, then two 8x8 | https://github.com/snesrev/zelda3/blob/master/src/ancilla.c#L853 (code) |
| Zelda: ALttP | Ice Rod shot and hit | Shot drops slow sparkles (0.25 px per frame). Hit is 2 steps | hit 2 steps x 8 frames | hit 16 frames (267 ms) | 8x8 sparkle tiles, 16 to 24 px spread | https://github.com/snesrev/zelda3/blob/master/src/ancilla.c#L2043 (code) |
| Zelda: ALttP | Ether medallion | Lightning stroke, orb pulse, 8 balls on a 64-step circle out to 64 px, background whiten every 4 frames | 2 ball frames | 64 frames per turn (1.07 s) | 16x16 balls | https://github.com/snesrev/zelda3/blob/master/src/ancilla.c#L2338 (code) |
| Zelda: ALttP | Bombos medallion | 10 fire columns, then 8 blast slots, 4 OAM each | column 13 steps, blast 8 steps, 4 frames each | 52 and 32 frames | blast 16 px growing to about 38 px | https://github.com/snesrev/zelda3/blob/master/src/ancilla.c#L2606 (code) |
| Final Fantasy VI (SNES) | Fire | Sprite layer only, 3 threads, target palette recolour | 5 | not confirmed (speed 5) | {2, 3} tiles | https://github.com/everything8215/ff6/blob/main/src/btlgfx/attack_anim_script.asm (code) |
| Final Fantasy VI | Blizzard | Sprite layer plus BG1 layer with own palette | 6 on BG1 | not confirmed | {6, 10} tiles on BG1 | https://github.com/everything8215/ff6/blob/main/src/data/attack_gfx_prop.asm (code) |
| Final Fantasy VI | Big spells and espers | Mode 7 move, zoom and rotate, HDMA gradients and waves, circle windows, colour math, as script commands | up to 29 per graphic | not read | {16, 10} tiles full layer | https://github.com/everything8215/ff6/blob/main/src/btlgfx/anim_script.mac (code) |
| Secret of Mana (SNES) | Water transparency | Colour math add plus half | n/a | n/a | layer | https://snes.nesdev.org/wiki/Color_math |
| Diablo (PC) | Fireball | 16-direction missile, light radius 8 | 14 per direction | loops | 96 px wide cel | https://github.com/diasurgical/devilutionX/blob/master/assets/txtdata/missiles/missile_sprites.tsv (code) |
| Diablo | Big explosion | 1 direction flipbook, light ramps 2 to 12 | 15 | 750 ms at 20 ticks/s (estimate) | 160 px wide cel | https://github.com/diasurgical/devilutionX/blob/master/Source/missiles.cpp#L3063 (code) |
| Diablo | Fire wall | Start then loop, light ramps up and down | 13 start, 11 loop | until duration ends | 128 px wide cel | https://github.com/diasurgical/devilutionX/blob/master/Source/missiles.cpp#L3084 (code) |
| Diablo II (PC) | Fire Bolt | Row in Missiles.txt. 16 directions, Vel 20, Range 50, light 7 orange, explosion missile on hit | 5 loop, explosion 12 | 2 s max flight, 0.48 s explosion at 25 fps (estimate) | not known | https://github.com/blizzhackers/d2data/blob/master/json/missiles.json (data) |
| Diablo II | Frozen Orb | 1 direction, Vel 10, sub-missile bolts in flight, nova on expiry | 16 loop | 30 frames of range | not known | https://github.com/blizzhackers/d2data/blob/master/json/missiles.json (data) |
| Diablo II | Fire Wall | 37 frames with sub-loop 12 to 36, light 5 with flicker 4 | 12 start, 25 loop | 90 frames of range | not known | https://github.com/blizzhackers/d2data/blob/master/json/missiles.json (data) |
| Diablo II | Overlays (auras, buffs) | 334 rows, 77 drawn before the unit, light radius and RGB each | median 16 | AnimRate 16 typical | not known | https://github.com/blizzhackers/d2data/blob/master/json/overlay.json (data) |
| Street Fighter II (arcade) | Hit sparks | 16x16 tile sprites | gap | gap | multiples of 16 px | https://fabiensanglard.net/cpss/ |

---

## Gaps, all in one place
- Fighters and Metal Slug: no frame counts or sizes found.
- Golden Sun, Fire Emblem GBA, Castlevania GBA, Minish Cap, DS games: no technical source found or read.
- Chrono Trigger, Super Mario RPG, Secret of Mana spell internals: not read.
- Ultima VII: not researched.
- D2 `Trans` and `PreDraw` semantics, D1 and D2 tick rates: not confirmed from a fetched source.
- FF6 tile unit and script speed unit: not confirmed.
- Zelda 3 garnish system: not read.
- "See it" wiki links for Pokémon moves were not fetched.
- No runtime cost was measured here. This file is about data shapes and timing only.

## Sources
- pret/pokeemerald: https://github.com/pret/pokeemerald (data/battle_anim_scripts.s, src/battle_anim.c, src/battle_anim_fire.c, src/battle_anim_electric.c, src/util.c, src/data/battle_anim.h, include/constants/battle_anim.h, include/sprite.h, include/task.h, asm/macros/battle_anim_script.inc)
- pret/pokecrystal: https://github.com/pret/pokecrystal (docs/battle_anim_commands.md, data/moves/animations.asm)
- snesrev/zelda3: https://github.com/snesrev/zelda3/blob/master/src/ancilla.c
- everything8215/ff6: https://github.com/everything8215/ff6 (src/btlgfx/anim_script.mac, src/btlgfx/attack_anim_script.asm, src/data/attack_anim_prop.asm and .mac, src/data/attack_gfx_prop.asm and .mac)
- diasurgical/devilutionX: https://github.com/diasurgical/devilutionX (Source/missiles.cpp, assets/txtdata/missiles/missile_sprites.tsv)
- blizzhackers/d2data: https://github.com/blizzhackers/d2data (json/missiles.json, json/overlay.json)
- Phrozen Keep guides for Missiles.txt: https://d2mods.info/forum/kb/viewarticle?a=364 , https://d2mods.info/forum/kb/viewarticle?a=352
- SNESdev wiki: https://snes.nesdev.org/wiki/Color_math , https://snes.nesdev.org/wiki/HDMA , https://snes.nesdev.org/wiki/HDMA_examples
- GBATEK: https://problemkaputt.de/gbatek-lcd-i-o-color-special-effects.htm , https://problemkaputt.de/gbatek-lcd-obj-overview.htm
- Fabien Sanglard, CPS-1 graphics: https://fabiensanglard.net/cpss/
- FEUniverse CSA notes: https://feuniverse.us/t/notes-for-csa-and-battle-animations/745
- Automaton, Akio interview (headline only): https://automaton-media.com/en/news/metal-slug-artist-akio-says-his-elaborate-pixel-animations-made-his-programmers-want-to-rip-their-hair-out-but-it-was-so-worth-it/
