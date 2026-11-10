# 01 Roots and the classic era of 2D water

Researcher angle: history and classic-era techniques. Colour cycling, animated tile frames, Tibia rules, demoscene, SNES HDMA. Numbers come from primary source code where possible: pret disassemblies, the snesrev/zelda3 reimplementation, the zladx Link's Awakening disassembly, TFS and OTClient source, and Nuvie.

Frame-rate reference used for conversions: Game Boy about 59.73 Hz, SNES NTSC about 60.1 Hz, GBA about 59.73 Hz. Conversions to seconds are mine.

---

## Q1. How did palette and colour cycling make water move?

### Takeaway
Rotate a small range of palette entries and every pixel painted with those entries animates at once. It costs nothing per pixel. Ferrari's water quality came from how he painted the gradient bands with dithering, not from the cycling code. A cycle step rate of 4 to 15 steps per second fits the DPaint units. BlendShift (cross-fading neighbours) hides the stepping at slow speeds.

### Cited findings
- Effect Games' HTML5 port (2011) of Mark Ferrari's art uses 256-colour indexed images at 640x480. It ships 35 scenes, each about 100 KB of gzipped JSON. Source files were Amiga IFF/ILBM from Deluxe Paint. http://www.effectgames.com/effect/article-Old_School_Color_Cycling_with_HTML5.html
- The port redraws only the pixels that use animated colours. Drawing all 307,200 pixels a frame was too slow in some browsers. Same URL.
- "BlendShift" fades neighbouring colours into each other while shifting. It makes in-between frames at the same overall cycle speed. Speed options are 1/4 and 1/2. Same URL.
- Water scenes in the set include ocean waves, waterfalls, streams and lakes. Same URL. See it in action: http://www.effectgames.com/demos/canvascycle/
- DPaint stores cycle ranges in the ILBM CRNG chunk. Rate 16384 means 60 steps per second, and the scale is linear (8192 gives 30 steps per second). https://discmaster.textfiles.com/file/18/Amiga%20Developer%20CD%20v2.1.iso/Reference/HTML/Devices_Manual_guide/node01B9.html?html=true
- Ferrari Q&A: his effects use one flat image and one 256-colour palette, no layers or alpha. Water reflections use the "clown colours" edge trick. A one-pixel outline of two cycling colours plus stencil-filled gradients makes shapes appear to grow and shrink. Example scene "Mountain Mirror Pond". http://www.effectgames.com/effect/article-Q_A_with_Mark_J_Ferrari.html
- In the Sea Cave scene the smooth wave face has no diffusion dither. The collapsing foam uses a "chunkier, more particulate" diffusion texture. Patterned (ordered) dither is his default for smooth effects. Same URL.
- Gradient lengths and speeds vary. Some are "very long and/or slow", others "very short and/or fast". One image took 3 days to 3 weeks. Same URL.
- Ferrari's GDC 2016 talk "8 Bit & '8 Bitish' Graphics-Outside the Box" covers cycling and palette shifting. https://gdcvault.com/play/1023586/8-Bit-8-Bitish-Graphics
- SNES: CGRAM holds 256 15-bit colours, written through $2121/$2122. Entry 0 is the backdrop. https://snes.nesdev.org/wiki/CGRAM
- Game Boy Color, Pokemon Crystal: `AnimateWaterPalette` cycles colour 0 of the water BG palette through the palette's own colours 0, 1, 2, 1. It updates on even animation ticks and is skipped on DMG. https://github.com/pret/pokecrystal/blob/master/engine/tilesets/tileset_anims.asm

### Inferences
- In the CRNG units a "calm sea" cycle at 4 to 8 steps per second is rate 1092 to 2185. A waterfall at 15 to 30 steps per second is rate 4096 to 8192. These are my suggested values, not from Ferrari.
- Crystal's 0-1-2-1 ping-pong is a 4-step cycle using 3 colours. It avoids the visible "wrap" jump that a one-way rotation shows when the gradient ends do not match. Cheap rule: use ping-pong unless the ramp is seamless.
- For Godot, colour cycling equals an indexed texture plus a palette lookup in a shader, with the palette row offset by time. Snow study #1 already uses palette lookup. Reuse that path.

### Gaps
- No published fps for Ferrari's individual water cycles. The demo JSON holds per-cycle rates but I did not download it (rule: no asset copying).
- No primary source found for FF6, Chrono Trigger or Secret of Mana water palette animation.

---

## Q2. Animated tile frames: how many frames, how fast?

### Takeaway
Classic water is short. 3 to 8 frames, each frame shown 9 to 26 video frames (about 2.3 to 6.7 fps). Full loops last 0.45 s (ALttP) to 2.8 s (Pokemon Red). Fast water (currents, waterfalls) runs 4x faster than calm water in the same game. Every engine swaps the shared tile in VRAM once, so all water on screen moves in lockstep. Pokemon Emerald staggers each animated group to its own frame of a 16-frame window, so only one upload happens per frame.

### Cited findings

| Game | Water tiles | Frames | Hold per frame | Loop | Source |
|---|---|---|---|---|---|
| Pokemon Red/Blue (GB) | 1 tile ($14) | 8 steps: rotate every byte 1 bit right x4, then left x4 | 20 video frames (21 when flowers also animate) | 160 to 168 frames, about 2.7 to 2.8 s | https://github.com/pret/pokered/blob/master/home/vcopy.asm |
| Pokemon Crystal (GBC), Kanto/Johto Modern | tile $14 | 4 frames | 2 ticks of an 11-frame loop = 22 frames | 88 frames, about 1.47 s | https://github.com/pret/pokecrystal/blob/master/data/tileset_anims.asm |
| Pokemon Crystal, Johto tileset | tile $14 plus 4 whirlpool tiles | 4 frames | 2 ticks of a 13-frame loop = 26 frames | 104 frames, about 1.74 s | same |
| Pokemon Emerald (GBA), water | 30 8x8 tiles at tile 432 | 8 frames | 16 frames | 128 frames, about 2.14 s | https://github.com/pret/pokeemerald/blob/master/src/tileset_anims.c |
| Emerald, sand-water edge | 10 tiles | 8 slots, 7 unique (frame 0 repeats) | 16 | 128 frames | same |
| Emerald, land-water edge | 10 tiles | 4 | 16 | 64 frames, about 1.07 s | same |
| Emerald, waterfall | 6 tiles | 4 | 16 | 64 frames | same |
| Zelda ALttP (SNES), overworld animated set | 1 KB (32 4bpp tiles) per frame | 3 | 9 frames (23 on overlays $B5, $BC) | 27 frames, about 0.45 s | https://github.com/snesrev/zelda3/blob/master/src/misc.c |
| Link's Awakening DX, "tide" (sea shore), village, water dungeon, slow waterfall | 64 bytes (4 tiles = one 16x16 block) per frame | 4 | 16 frames | 64 frames, about 1.07 s | https://github.com/zladx/LADX-Disassembly/blob/main/src/code/home/animated_tiles.asm |
| LADX, currents and waterfall | same | 4 | 4 frames | 16 frames, about 0.27 s | same |
| LADX, lava | same | 8-step ping-pong 0,1,2,3,3,3,2,1 | 8 frames | 64 frames | same |

More detail from the sources:
- Pokemon Red does not store water frames at all. It shifts the single 8x8 tile's bitplanes left and right with `rrca`/`rlca`. The water appears to sway 4 px and back. pokered vcopy.asm, above.
- Crystal keeps a generic `ScrollTileRightLeft` routine (4 ticks right, 4 left) and an unused `ScrollTileUpDown`. Crystal's unused tilesets scroll tiles "like a waterfall" and "like cave water". pokecrystal tileset_anims.asm, above.
- Emerald's `TilesetAnim_General` puts flowers at timer%16 == 0, water at 1, sand-water edge at 2, waterfall at 3, land-water edge at 4. The counter wraps at 256. pokeemerald tileset_anims.c, above.
- ALttP cycles the source offset 0, $400, $800 and wraps at $C00. NMI copies $400 bytes to VRAM. https://github.com/snesrev/zelda3/blob/master/src/nmi.c
- LADX names its animated groups in a table. Tide, currents, waterfall, slow waterfall, water dungeon and bubbles are all separate groups, with slow (16), medium (8) and fast (4) frame intervals. https://github.com/zladx/LADX-Disassembly/blob/main/src/constants/animated_tiles.asm
- Ultima VI (via the Nuvie engine): animated tile frame = (game_counter & mask) >> shift, from the animdata file. Nuvie also makes the 32 tiles from index 16 onward transparent using animmask.vga and draws them over 4 base water tiles. Shore pieces therefore reuse the animated water underneath instead of storing animated shore art. https://github.com/nuvie/nuvie/blob/master/TileManager.cpp
- Pokemon Gen 3 hack docs: animated tiles must sit next to each other in the tilesheet and are swapped as a block. https://www.pokecommunity.com/threads/any-information-on-animated-tiles.417831
- EarthBound stores per-animation frame count and a per-frame delay byte. https://github.com/pk-hack/CoilSnake/wiki/Graphical-Animations

See it in action:
- ALttP and Link's Awakening water and shore: https://www.spriters-resource.com/snes/legendofzeldaalinktothepast/ and https://www.spriters-resource.com/game_boy_gbc/thelegendofzeldalinksawakeningdx/
- Pokemon Emerald animated water: the frame PNGs live in pokeemerald under data/tilesets/primary/general/anim/water/ (view only, do not copy).
- Ultima VI: https://www.ultimacodex.com/ (game pages)

### Inferences
- Shared-tile animation gives perfect sync. Players read it as "the sea breathes". The risk is a visible grid pulse on large seas. ALttP and Pokemon hide this with art that tiles seamlessly in the swayed direction.
- The Ultima VI trick suits Asterion directly. Draw shore borders as transparent overlays on an animated water base, so only the base animates and the border set stays static. That cuts animated art from 47 or 16 border tiles x N frames down to N frames of one water tile.
- Emerald's staggering is a good rule for many animated groups on web or mobile. Update one group per frame on a shared counter.
- Hold time clusters: calm water 16 to 26 video frames per step (2.3 to 3.75 fps). Fast water 4 to 9 frames per step (7 to 15 fps). Ping-pong with a hold at the extreme (LADX lava 3,3,3) reads like slack water at the turn of a wave.

### Gaps
- Final Fantasy (I-VI), Chrono Trigger, Secret of Mana and Dragon Quest water frame counts: no disassembly-level source found in budget.
- I did not confirm which ALttP tiles in the 32-tile animated set are water versus other animated tiles.
- Pokemon Gen 4 (DPPt) not checked. pret/pokeplatinum exists and is the place to look.

---

## Q3. Tibia: water rules, tiles, fishing, and animation

### Takeaway
Tibia water is mostly server data. Sea tiles are trash holders (items thrown in vanish with a blue bubble effect), fluid sources, and fishable tiles with a skill-scaled chance from 10% to 50%. The client animates ground items on a global clock. Old .dat clients use 500 ms per phase. Newer .dat clients store min/max durations per phase. Big water textures repeat by world position (x mod patternX, y mod patternY), which breaks up the tile grid for free.

### Cited findings
- TFS items.xml: id 493 "water" is a trashholder with effect bluebubble and allowpickupable. IDs 4608 to 4616 are named "shallow water", with description "You see the silvery movement of fish.", trashholder, bluebubble and fluidSource water. https://github.com/otland/forgottenserver/blob/master/data/items/items.xml
- IDs 4617 to 4619 decay back to 4608 to 4610 after duration 1200 (seconds, so 20 minutes). IDs 4620 to 4625 and 4820 to 4825 carry editorsuffix "(Swimmable)". Same file.
- Swamp tiles (4691 to 4712, 4749 to 4755, 6353) are trashholders with effect greenbubble. Mud, ocean floor and waterfall (3569 to 3574) have their own entries. Same file.
- TFS fishing script: valid targets are 493, 4608 to 4625, 7236, 10499, 15401 and 15402. Fishing on 493 or 15402 only shows an effect and gives nothing. https://github.com/otland/forgottenserver/blob/master/data/actions/scripts/tools/fishing.lua
- Each cast adds 1 fishing skill try and shows CONST_ME_LOSEENERGY on the tile. Catch chance is `min(max(10 + (skill - 10) * 0.597, 10), 50)` percent and consumes one worm (item 3976) if `useWorms`. A catch gives fish 2667. Same file.
- Special water in TFS: 10499 is a corpse-owned fishing spot with 1% very rare, 2% rare, 7% common and 90% trash loot. 7236 (ice hole) has a 1% / 3% / 6% rare-fish split, then becomes 7237 and decays. Same file.
- OTClient: `ITEM_TICKS_PER_FRAME = 500`. With `m_async` the phase is `(millis % (500 * phases)) / 500`, so every copy of an item animates in sync. https://github.com/edubart/otclient/blob/master/src/client/const.h and https://github.com/edubart/otclient/blob/master/src/client/item.cpp
- Newer .dat format: each animation has async flag, loop count, start phase, and a (min, max) duration per phase. https://github.com/edubart/otclient/blob/master/src/client/animator.cpp
- OTClient picks the sprite pattern for ground items by `position.x % numPatternX`, `position.y % numPatternY`. item.cpp, above.
- An otland user reports water edge corners with 2 layers and 16 animation phases. Another asks how to speed up a slow 16-frame water sprite in OTC 8.6. Forum-reported. https://otland.net/threads/slow-animation-of-tiles.251542/ and https://otland.net/goto/post?id=2429814
- Drowning (community-reported, TibiaQA): without a Helmet of the Deep underwater you take 5 x 20 drown damage, starting after about 4 seconds. https://www.tibiaqa.com/10030/what-happen-if-i-go-underwater-without-helmet-of-the-deep
- Calassa (underwater) requires the Helmet of the Deep. Massive water elementals there deal drown damage. https://tibia.fandom.com/wiki/Calassa (search snippet only, page blocked)

### Inferences
- At 500 ms per phase a 16-phase water tile loops every 8 s. That explains why Tibia's sea reads as slow and calm compared with console water (0.45 to 2.8 s loops). That is my calculation from the forum-reported 16 phases and the OTClient constant.
- Copy for Asterion: water tile flags on the server (`blocksWalk`, `trashholder`, `fishable`, `swimmable`, `fluidSource`, `effectOnDrop`). The client only needs a global animation clock. Every player sees the same sea in sync without network traffic.
- The fishing formula is linear: 10% at skill 10 up to the 50% cap at about skill 77. Simple and readable.
- The 4617 to 4619 decay entries suggest a "fished out" state that regenerates in 20 minutes. The current TFS script never transforms normal water into them, so this is likely legacy data. Inference.
- Walkability lives in the client items.otb/.dat flags (blocking, unpassable), not in items.xml. I did not verify this.

### Gaps
- TibiaWiki (tibia.fandom.com) returned HTTP 402. The Portuguese TibiaWiki returned 403 and archive.org is not reachable from this tool. Fishing, Water, Shallow Water, Boat and Drown Damage wiki pages were not read. Fill these by hand.
- No verified per-phase ms for real Tibia water in modern .dat files. Opening the .dat in Object Builder would answer it.
- Boat and ship travel rules (NPC captains, prices) not researched.

---

## Q4. Demoscene water

### Takeaway
Demoscene "water" means one of two things. A sine row/column offset of a picture (wobble), or the two-buffer height-field ripple. The ripple is covered in Rain #3 (https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel), so link it and move on. Sizecoders fit waves into 51 bytes in VGA mode 13h.

### Cited findings
- Wellen64b ("Wellen" is German for waves) is a 51-byte intro for VGA mode 13h (320x200, 256 colours), with source included. https://deinmeister.de/wellen64_e.htm
- Classic article on the height-map water effect: disturb a height map, filter it, apply it to a background as refraction. https://gamedev.net/reference/articles/article915.asp
- Amiga per-line sine shifting of a picture (copper/bplcon1 horizontal shifts). https://markwrobel.dk/post/amiga-machine-code-letter12-wave
- Sonic 2 hack docs on the Labyrinth Zone water ripple, a per-line horizontal scroll table on Mega Drive. https://info.sonicretro.org/SCHG_How-to:Insert_Labyrinth_Zone_water_ripple_effect_in_Sonic_2

### Inferences
- For top-down pixel water the sine wobble is a shader one-liner. Offset sample x by `A * sin(y * k + t * w)` and snap to whole pixels to keep pixel taste. The Rain study already covers the ripple buffer.

### Gaps
- Did not find a 256-byte intro that is specifically a water effect. Pouet search by tag would be the next step.

---

## Q5. SNES HDMA and Mode 7 wave effects

### Takeaway
HDMA writes a new BG horizontal scroll value ($210D BG1HOFS) on every scanline. A 224-entry table of sine offsets makes water and heat haze. Animate by moving the table start (phase) each frame. Cost: zero CPU per pixel, 2 bytes per scanline.

### Cited findings
- SNESdev wiki HDMA examples: horizontal waves target BGnHOFS with transfer pattern "write twice" (2 bytes per scanline). One example uses a 48-word sine table with amplitude 16.5 px, repeated 5 times over 240 lines through an indirect table. Indirect entries cost 3 bytes each. Repeat entries cover up to 127 lines. https://snes.nesdev.org/wiki/HDMA_examples
- The shear example on the same page advances a timer by 2 per frame and offsets each line by timer - 2 x line. Same URL.
- SNES Lab lists $210D (BG1HOFS) HDMA for "horizontal waves (water)". https://sneslab.net/wiki/HDMA
- OpenSNES has an HDMA wave example using channel 6 and phase-shifted sine tables. https://k0b3n4irb.github.io/opensnes/examples_graphics_effects_hdma_wave.html (page now 404, seen in search snippet)
- HDMA on CGRAM can also make vertical colour gradients. A sea that darkens toward the top of the screen is the same trick. https://k0b3n4irb.github.io/opensnes/examples_graphics_effects_gradient_colors.html

### Inferences
- Godot equivalent: a canvas shader that offsets UV.x by a per-row value. Snap the offset to whole pixels at 320x180 to keep the SNES look. Amplitude of 1 to 2 px for calm water and 4 to 16 px for heat or dream effects. The 16.5 px example is a showcase value. Use it only for big effects.
- Row offsets work well for top-down underwater tint (whole screen wobble) and for sea horizons. They are wrong for top-down water tiles under a moving camera, because the offset is tied to the screen row. Key the offset to world y.

### Gaps
- No primary source on specific games (Super Mario World, FF6 water, Chrono Trigger's sea) or Mode 7 water planes. Mode 7 water appears in F-Zero and Pilotwings style maps but I did not cite one.

---

## Q6. The numbers players notice

### Takeaway
Players notice three things. Loop length (too short reads as jitter, too long as frozen). Sync (all tiles pulse together). Seam or wrap jumps. Classic values sit in a narrow band.

### Synthesis (from the cited tables above, my conversion)
- Calm water step rate: 2.3 to 3.75 fps (16 to 26 frames hold). Loop 1 to 2.8 s.
- Fast water (currents, waterfalls): 7 to 15 fps (4 to 9 frames hold). Loop 0.27 to 0.45 s.
- Frame counts: 3 (ALttP), 4 (Crystal, LADX, Emerald edges and waterfall), 8 (Red shift steps, Emerald sea).
- Shore animation shares the water clock. Emerald runs sand-edge water at the same 16-frame rate as open water. LADX "tide" is a slow group.
- Tibia: 500 ms per phase in old clients, so a calm sea far slower than console water.
- Colour cycling: CRNG 60 steps per second max. Ferrari mixes long slow and short fast ramps in one scene.
- HDMA wave: amplitude 16.5 px over a 48-line period in the reference example.

### Inferences
- Avoid loop lengths that divide evenly into other ambient loops (wind, torch flicker), or the scene pulses in unison. Emerald's 256-frame master counter shows the opposite choice. All loops share powers of two so they line up, which is tidy but makes a visible common beat.
- Ping-pong (Red, Crystal palette, LADX lava) hides the wrap. One-way loops need seamless art.

### Gaps
- No player-study data, only shipped values.

---

## Sources
- http://www.effectgames.com/effect/article-Old_School_Color_Cycling_with_HTML5.html
- http://www.effectgames.com/demos/canvascycle/
- http://www.effectgames.com/effect/article-Q_A_with_Mark_J_Ferrari.html
- https://gdcvault.com/play/1023586/8-Bit-8-Bitish-Graphics
- https://discmaster.textfiles.com/file/18/Amiga%20Developer%20CD%20v2.1.iso/Reference/HTML/Devices_Manual_guide/node01B9.html?html=true
- https://snes.nesdev.org/wiki/CGRAM
- https://snes.nesdev.org/wiki/HDMA_examples
- https://sneslab.net/wiki/HDMA
- https://k0b3n4irb.github.io/opensnes/examples_graphics_effects_hdma_wave.html
- https://k0b3n4irb.github.io/opensnes/examples_graphics_effects_gradient_colors.html
- https://github.com/pret/pokered/blob/master/home/vcopy.asm
- https://github.com/pret/pokecrystal/blob/master/engine/tilesets/tileset_anims.asm
- https://github.com/pret/pokecrystal/blob/master/data/tileset_anims.asm
- https://github.com/pret/pokecrystal/blob/master/home/vblank.asm
- https://github.com/pret/pokeemerald/blob/master/src/tileset_anims.c
- https://github.com/snesrev/zelda3/blob/master/src/misc.c
- https://github.com/snesrev/zelda3/blob/master/src/nmi.c
- https://github.com/snesrev/zelda3/blob/master/src/load_gfx.c
- https://github.com/zladx/LADX-Disassembly/blob/main/src/code/home/animated_tiles.asm
- https://github.com/zladx/LADX-Disassembly/blob/main/src/constants/animated_tiles.asm
- https://github.com/nuvie/nuvie/blob/master/TileManager.cpp
- https://github.com/pk-hack/CoilSnake/wiki/Graphical-Animations
- https://www.pokecommunity.com/threads/any-information-on-animated-tiles.417831
- https://github.com/otland/forgottenserver/blob/master/data/items/items.xml
- https://github.com/otland/forgottenserver/blob/master/data/actions/scripts/tools/fishing.lua
- https://github.com/edubart/otclient/blob/master/src/client/const.h
- https://github.com/edubart/otclient/blob/master/src/client/item.cpp
- https://github.com/edubart/otclient/blob/master/src/client/animator.cpp
- https://otland.net/threads/slow-animation-of-tiles.251542/
- https://otland.net/goto/post?id=2429814
- https://www.tibiaqa.com/10030/what-happen-if-i-go-underwater-without-helmet-of-the-deep
- https://tibia.fandom.com/wiki/Calassa (blocked, HTTP 402, snippet only)
- https://deinmeister.de/wellen64_e.htm
- https://gamedev.net/reference/articles/article915.asp
- https://markwrobel.dk/post/amiga-machine-code-letter12-wave
- https://info.sonicretro.org/SCHG_How-to:Insert_Labyrinth_Zone_water_ripple_effect_in_Sonic_2
- https://www.spriters-resource.com/snes/legendofzeldaalinktothepast/
- https://www.spriters-resource.com/game_boy_gbc/thelegendofzeldalinksawakeningdx/
- https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel
