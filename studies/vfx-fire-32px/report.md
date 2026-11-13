# Top-down pixel fire at 32 px: scaling the fire engine to 32x32 tiles and 24x32 characters

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #12 in our VFX series. Each study picks one concept and hunts for old-school algorithms that are tiny and cheap. The series reference is the **DOOM PSX fire** [S1]. One byte of heat per pixel, one rule, one palette.

**VFX #6 Fire** [S2] built the fire engine. A server grid of tile states, an active list ticked at 4 Hz, a hash RNG so every client sees the same burn, flame loops and DOOM buffers on top, a byte field for smoke, a pool of embers and Tibia-style combat fields. Its sandbox runs at 320x180 with 8 px cells and sprites a few pixels tall. That is a quarter of Asterion Online's scale. Asterion has 32x32 px tiles and characters of about 24x32 px. Light itself belongs to **VFX #5 Light** [S4], and the palette-index world with dithered lamp pools goes back to **VFX #1 Snow** [S5].

On 13 Nov 2026, right after **VFX #11 Snow at 32 px** [S3] redid the snow study at the real scale, the user asked for the same treatment for fire. This study does not research fire again. It asks one question. **What changes when the fire engine moves from 8 px cells and tiny sprites to 32 px tiles, 24x32 characters and a 640x360 canvas, with 4 times the pixels?** Where VFX #6 already answers something, we point to it.

**What VFX #6 settled, and we keep** [S2].
- The DOOM rule. Heat 0 to 36, copy from the pixel below into a column shifted +1 to -2, minus `rand & 1`.
- Flame loops of 4 to 6 frames at 8 to 12 fps with 4 tones, the base held still, the phase seeded per tile. Puff rate `f = 1.5 / sqrt(D)`.
- Spreading fire as a per-cell state machine (none, igniting, burning, embers, ash) with ignition `base(material) x (1 - moisture) x wind x (diag ? 0.7 : 1)`, p of about 0.35 to 0.6 with 3 to 6 burn ticks, budgets and the material table of its §6b.
- Smoke as an advected byte field drawn through a threshold. Embers from a fixed pool. Tibia fire fields with three stages, burn stacks and "strongest ground effect only".
- Server truth on the CPU, cosmetics on the client from hashes, ignition and extinguish events instead of diffs.

**Two equal goals.**
- **Artistic quality at 32 px.** A 4-tone flame 8 px tall, a 37-step DOOM gradient with 1 px grain, 1 px embers and Bayer-dithered smoke can look thin or noisy next to hand-drawn 32 px tiles and 24x32 characters.
- **Runtime efficiency at 4 times the pixels.** We benchmarked every fire layer at 640x360 ourselves, on the CPU and in a WebGL2 shader (§6a). The hard question is which buffers must grow with the art and which can stay small.

**Targets.** Godot 4, web-first, so the **Compatibility renderer** (WebGL 2, no compute shaders, limited 2D lights). Top-down 3/4 pixel art on 32x32 tiles for the Tibia-like MMORPG **Asterion Online**. The server is authoritative, characters walk tile to tile, and many players see the same fire burn the same way.

**Sources.** Nine research notes (10 to 18), the lead's verification note, our **Fire 32 Sandbox** [S6], our fire benchmark [S7] and three sets of scripts our researchers wrote and ran [S8, S9, S10]. The benchmark ran on an Apple M4 Pro in Chromium 153. Measured pairs are written "desktop / 6x throttle". The second number is the DevTools 6x CPU throttle, a low-end phone proxy. **No phone was measured, and nothing was run in Godot.**

---

## 1. Executive summary

**Runtime efficiency.**

1. **The whole fire frame grows 3.0 to 3.9 times, not 4.** The default effects frame costs 0.624 / 4.90 ms at 640x360 against 0.206 / 1.24 ms at 320x180. Throttled, it uses 29% of a 16.7 ms frame [I, note 16, measured].
2. **Two per-pixel passes are the frame.** The "Light map build + apply" layer is 44% of the 640x360 desktop frame and the smoke field 18%. The spread grid, the embers and 20 DOOM torches each stay under 0.03 ms [I, note 16, measured].
3. **The spread grid stays at one cell per tile.** A tick of the on-screen 20x12 grid costs 0.0036 / 0.024 ms. At equal front speed in px/s, 16 px cells cost 8.4 times as much per second of play and 8 px cells 65 times [I, note 16, measured].
4. **Keep VFX #6's material table and roll spread once per second.** The same table on 32 px tiles at 4 Hz runs fronts at 2.1 to 4.0 tiles/s, faster than a 2.5 tiles/s walk. Rolling at 1 Hz per tile returns VFX #6's 16.5 to 32 px/s and caps every fuel at 1 tile/s [I, note 15, measured]. Two build rules make it hold at every grid size. A tile's first roll comes one period after it caught, and its burn length counts rolls, not seconds. With both, the Sandbox measured green grass at 0.47 / 0.52 / 0.51 tiles/s and dry grass at 0.91 / 0.90 / 0.91 on 32 / 16 / 8 px grids [V, S6].
5. **DOOM buffers are cheap except as a band.** A 1:1 campfire patch costs 0.0086 / 0.057 ms. A full-width 640x120 band costs 0.388 / 2.52 ms at 1:1 and 0.109 / 0.714 ms at 1:2. A 5-octave noise fire over the whole screen costs 0.022 ms of GPU time on Metal and 0.51 ms on SwiftShader [I, note 16, measured].
6. **Smoke simulation is free, its drawing is not.** One Uint8 channel at 8 px cells advects in 0.0095 / 0.060 ms. Drawing it at art resolution costs 0.099 to 0.408 ms on the desktop, whatever the cell size [I, note 16, measured].
7. **Godot uploads whole textures.** Every small field costs about 0.015 ms per upload in WebGL2, and the 921,600-byte final frame costs 0.091 ms. GPUParticles2D on the web costs about 2 s of compile per system on a cold load, and one 4.7.2 report gives 22 to 25 s per GPUParticles3D material [I, note 16, measured; V, S182].

**Artistic quality.**

8. **Tibia's flames do not fit in the tile.** A stage 1 fire field is 5 frames of 120 ms in a 64x64 canvas, with flames 49x47 px, about 1.5 tiles. Each field picks 1 of 16 variants by `x % 4, y % 4` and runs its own clock [V, S12; I, note 10].
9. **Dying fire is dimmer, and often smaller and slower.** Tibia's campfire goes from 5 x 100 ms at light 7 to 6 x 300 ms at light 3. Its fire field steps light 7, 5, 3, while its height goes 47, 54, 40 px and its frames 120, 100, 100 ms, so only the light falls at every stage [V, S12, S14].
10. **At 32 px a flame has 5 tones.** Packs sit at 4 to 10 frames per loop, and a 10 to 24 px flame body has room for 5 bands plus a purple edge [V, S124, S125; I, note 11]. Torches on posts are about 10x16 px. A torch carried by a 24x32 character is about 6x8 px [I, lead].
11. **DOOM grain needs smoothing at this size.** At 37 tones, 75.2% of DOOM pixels are lone single pixels. Quantized to 5 tones it is 8.6% at L = 36 and 25.3% at L = 8. A 16 px torch has only 6 levels in Sanglard's in-place loop, 8 in a double-buffered one. A 3x3 average before quantizing brings it to 0.3% [I, note 12, measured; S8].
12. **Draw the burn per pixel, store it per tile.** A painted burn-order map biased toward the side the fire came from costs 0.082 / 0.515 ms with a fifth of the screen burning. Bayer 4 is only 8 to 17% cheaper and looks worse [I, note 16, measured; note 12].
13. **Areas are many 1-tile effects.** A great fireball is 37 copies of a 1-tile effect on a radius-3 disc. Effects play 75 ms frames in the old client, and a missile flies `150 x sqrt(distance)` ms [V, S23, S28, S29].
14. **Tibia draws no burning overlay and no carried torch.** A burn tick plays a 900 ms hit effect and an orange number [V, S18, S19, S12]. Every overlay, torch and rim light in this study is an Asterion addition [I].
15. **Embers at 32 px are 2x2 px.** One-pixel sparks live a few frames only. Smoke puffs start at 4 to 10 px and grow to 16 to 64 px by source [V, S131; I, notes 11, 15].

**Pretty and cheap.** Tibia-style overflow sprites with position variants (B2), dying stages (B3), the burn-order map (C1), tile states drawn through it (C4), hero puffs sized by the tile (D2), areas from 1-tile effects (F1) and the 1 Hz roll (A2).

**Pretty but expensive.** A DOOM band across the screen at 1:1 (B4). A fine light map applied on the CPU with bilinear sampling (A3). Burning overlays on every one of 20 players (E1).

**Cheap but ugly.** Bayer 4 on the burn front and in smoke (C1, D1), raw 37-tone DOOM at 1:1 (B4), a whole-tile swap as the moving front (C3), 1 px embers alone (D3).

**Recommendation for Asterion** [I]. The server keeps one fire cell per 32 px tile, ticks at 4 Hz and rolls spread once per second per tile with VFX #6's table. Clients draw the burn per pixel through a painted burn-order map, put Tibia-sized flame loops with position variants on burning tiles, keep smoke and light in small fields and move the two per-pixel passes into the final shader. Combat copies Tibia's two timing constants and builds areas from 1-tile effects (§7, §8).

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: code, asset data, docs, wiki or article. "[V, vendor]" and "[V, self-reported]" mark figures reported by their own authors or sellers. |
| **[I]** | Author inference, arithmetic or design proposal. "[I, note 1X, measured]" is a number a researcher measured with their own script or our benchmark [S7, S8, S9]. Untested otherwise, and "Sandbox" values are tested only in our JavaScript prototype. |
| **[U]** | Unverified: memory, a search snippet, a forum claim, or a page that could not be fetched. Treat it as a lead. |
| **[K]** | Textbook or canonical knowledge (maths, well-known release years). |

- [S#] refers to §14. "[I, note 1X]" is an inference made by the researcher in that note.
- Ratings (1–5) are author judgement: **Simplicity · Speed · Pixel taste · Mood · Interactivity**.
- **Pixel taste** asks whether the result looks drawn by an artist at 32 px. **Interactivity** asks whether players and the world can change the fire, or the fire them.
- **Speed follows the measurements** [S7]. 5 means under about 0.1 ms on the desktop at 640x360, or one GPU pass. 4 means a cost that grows with pixels or burning cells and needs a cap. 3 and below mean milliseconds on the throttled run, or seconds of load time.
- **Measured pairs are "desktop / 6x throttle"**, in ms. They come from the benchmark's "GPU run median" and "6x throttle median" columns. Whole-frame totals come from the frame medians, never from the per-layer sum. Every table header names its column.
- All measurements are browser JavaScript and WebGL2 on one machine, not Godot. A tile is 32 px and the view is 640x360 unless a line says otherwise.

---

## 3. Generations: a timeline

**Gen 1: tile fires and fixed-rate effects (1991–2004)**
- **1991** Zelda: A Link to the Past builds its Fire Rod burst from 16x16 sprites, 3 frames of 8 game frames [K; V, S66].
- **1995** DOOM reaches the PlayStation with the title fire that Sanglard reverse-engineered in 2018 [K; V, S1].
- **1997** Tibia launches on 32 px tiles [K], and Ultima Online grows its fire field one tile every 300 ms [K; V, S112].
- **2002** Ragnarok Online picks 1 of 2 Fire Wall strips per cell at random [K; V, S113].
- **2004** Pokémon Emerald draws burn as 3 flames of 32x32 OAM and swaps ash grass to clean grass after a 938 ms puff [K; V, S62, S64].

**Gen 2: systems and tile states (2008–2016)**
- **2008** Far Cry 2 caps spread after a test burned "miles of terrain" [V, S107].
- **2010** OTClient begins, with 75 ms effect frames and the `150 x sqrt(d)` missile [V, S28, S29, S40].
- **2011** Minecraft schedules fire every 30 to 40 game ticks, and Terraria ships On Fire! [K; V, S99, S86].
- **2013** RimWorld lets fire start only on the edge ring of a building (2013 onward) [K; V, S89].
- **2015** RPG Maker MV plays 192x192 battle cells at 15 fps [K; V, S58].
- **2016** Stardew Valley stacks three seeded 12x11 flames into a campfire, and Don't Starve Together burns a tree for 45 s [K; V, S47, S93].

**Gen 3: tile-sized art and shader burns (2017–2024)**
- **Dec 2019** brullov publishes a fire size ladder from 8x8 to 24x32 px [V, S124]. **Dec 2020** Slynyrd draws explosions as rings that slow down [V, S134].
- **Jul 2021** Slynyrd builds particles from a "2x2px particle" [V, S131].
- **Jan 2022** arlez80's Pixel-burn shader snaps burn noise to pixels [V, S158].
- **Feb 2024** Godot issue #87843 reports about 2 s to load one GPUParticles2D on the web [V, S182].

**Gen 4: Godot 4.7 and measured costs (2025–2026)**
- **Jul 2025** A directional burn shader with a noise term [V, S157]. **Nov 2025** The Pixelated burn shader and Simple Pixelated Fire [V, S156, S166].
- **Jan 2026** `DrawableTexture2D` is merged for Godot 4.7 [V, S180]. **Apr 2026** A GodotCon talk covers burning effects and SubViewport feedback [V, S185].
- **Jun 2026** Godot 4.7 is released on 18 June [V, S3].
- **Nov 2026** A comment on #87843 reports 22 to 25 s of compile per particle material on 4.7.2 [V, S182]. **Nov 2026** Our fire benchmark and the Fire 32 Sandbox [V, S7, S6].

---

## 4. Technique profiles

There are eight families:

- **A.** Resolution and fields
- **B.** Flames at 32 px
- **C.** Burn front and burnt world
- **D.** Smoke, steam and embers at 32 px
- **E.** Characters at 24x32
- **F.** Combat fire and lava
- **G.** Cost and Godot
- **H.** Frontier

Each profile is a technique or a decision at 32 px, not a repeat of VFX #6. Each ends with ratings for **Simplicity · Speed · Pixel taste · Mood · Interactivity** (1 = poor, 5 = excellent; author judgement). Measured figures come from our benchmark [S7] unless another source is named, and pairs read "desktop / 6x throttle".

### Family A: Resolution and fields

### A1. Base resolution 640x360 and the buffers that grow

*In plain words.* Pick 640x360, which shows 20 x 11.25 tiles of 32 px. Then sort every fire buffer into two groups. Buffers tied to art pixels grow 4 times. Buffers tied to tiles, cells or fire sources do not grow at all.

*How it works (technical).*
- **Scale factors** [V, S3]. 640x360 fills 1280x720 at 2x, 1920x1080 at 3x, 2560x1440 at 4x and 3840x2160 at 6x, as VFX #11 found.
- **What grows 4 times** [I, notes 12, 16]. DOOM patches at 1:1, the burn front, the light apply, the smoke draw and the palette pass. A full-screen 1:1 DOOM buffer is 230,400 cells, the same as four VFX #6 screens. VFX #6's 16x32 torch patch was 512 cells. A 32x40 px campfire patch at art resolution is 1,280.
- **What stays put** [I, notes 12, 15]. The server grid is 240 cells per screen against 3,600 for 8 px cells on the same view, 15 times fewer. The smoke field and the light map keep 3,600 cells at 8 px. The ember pool does not follow the pixels. It grows from VFX #6's 256 to 512 because each ember is now a 2x2 block and a crowd carries many fires.

*Cost / performance.* Scaled from 320x180 to 640x360 on the desktop, the burn front costs 3.7 times as much, drawn loops 3.3, smoke 2.4, light 2.8 and the palette pass 3.9. Field simulations stay flat. The whole frame grows 3.0 times on the desktop and 3.9 times throttled [I, note 16, measured].

*Games that used it.*
- Tibia through OTClient (32 px tiles, a 15x11 view): https://github.com/edubart/otclient/blob/master/src/client/const.h
- VFX #11 Snow at 32 px (the same base resolution): https://kingsfoil-artifacts.netlify.app/vfx-snow-32px-topdown-pixel

*How it feels.* At 3x on a 1080p screen one art pixel is a 3x3 square. Every 1 px DOOM grain and every 1 px ember shows [I, note 11].

*Risks.* Nothing here was run in Godot. Whole-number scaling with a fractional `devicePixelRatio` is untested [U, S3].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 3 · Interactivity 1

### A2. Spread grid at one cell per tile, rolled once per second

*In plain words.* The server stores one fire cell per 32 px tile, as Tibia stores fire as an item on a tile. VFX #6's ignition chances are per tick, so on a cell 4 times wider the front runs 4 times faster. Roll spread once per second per tile and the old table works unchanged.

*How it works (technical).*
- **The trap, measured** [I, note 15, measured; S9]. Line ignition on a 400 x 60 strip, Moore neighbourhood, diagonals x 0.7, IGNITING flipped at the end of the tick, 5 seeds. Green grass advances 0.52 cells per tick and dry grass 0.93. On 32 px tiles at 4 Hz that is 2.1 and 3.7 tiles/s, and brush and oil reach 4.0. A walk is 2.5 tiles/s. Note 18 re-ran it independently and got 0.517 and 0.930 [I, note 18, measured].
- **Option A, adopted** [I, note 15; lead; V, S6]. Keep the chances and burn lengths, except green grass, which needed 5 rolls instead of 3 because 3 let fronts die in the build. Roll spread once per second per tile. The 4 Hz tick stays for water, rain, extinguish and events. Speeds return to VFX #6's 16.5 to 32 px/s, 0.52 to 1.0 tiles/s.
- **Option B, rejected** [I, note 15]. Keep 4 Hz and search for p. It lands at p of 0.03 to 0.07 with 5 to 25 ticks, and green grass dies before it reaches its target speed.
- **Phase from the ignition tick** [V, S6]. The Sandbox rolls a tile on ticks where `(tick - t_ignite) % period == 0` and `tick > t_ignite`, so the first roll comes one full period after the tile caught. "Catching" is a look only. A caught tile that also waited a roll before it could spread halved the front speed in the build.
- **Burn length in rolls** [V, S6]. A cell burns a fixed number of rolls at every grid size, so a 16 px cell burns half as long in seconds and an 8 px cell a quarter. With burn time fixed in seconds, a 32 px tile got 3 rolls against 12 at 8 px, and 32 px fronts died in 4 of 12 runs. Green grass also needed 5 rolls instead of VFX #6's 3, because 3 let fronts die.
- **As-built table** [V, S6]. Chance per roll: green grass 0.15, dry grass 0.40, tree 0.22, wood 0.30, fence 0.30, hay 0.50, oil 1.0. Rolls: green grass 5, dry grass 2, hay 4, oil 6, fence 12, tree 24, wood 30.
- **Measured fronts** [V, S6]. Twelve runs each with no wind, in tiles/s at 32 / 16 / 8 px. Green grass 0.47 / 0.52 / 0.51, dry grass 0.91 / 0.90 / 0.91. The spread-grid control rolls 16 px cells at 2 Hz and 8 px cells at 4 Hz, and the front keeps its speed.
- **Wind** [V, S6]. Alexandridis' factor with c1 0.045 and c2 0.131 multiplies the straight-downwind roll by 1.25 at 5 m/s and the diagonals by about 1.03. Green grass then runs 0.53 tiles/s downwind, 13% faster, and its upwind front dies in 10 of 12 runs. Dry grass runs 0.97 downwind and 0.16 to 0.55 upwind.
- **Traffic** [I, note 15]. A screen-high grass front lights about 6.2 tiles/s, about 25 B/s of ignition events at 4 bytes each. At 8 px cells the same visible front needs 93 ignitions/s, about 370 B/s.

*Cost / performance.* A tick of the on-screen 20x12 grid costs 0.0036 / 0.024 ms with 85 cells burning. A 40x23 grid of 16 px cells costs 0.015 / 0.098 ms and an 80x45 grid of 8 px cells 0.059 / 0.389 ms. Every row costs about 45 ns per burning cell. Per second of play at equal px/s, that is 0.014, 0.12 and 0.94 ms on the desktop [I, note 16, measured]. The bench rolled every burning cell on every 4 Hz tick, so the 1 Hz roll costs at most this. Phasing by ignition tick does not spread the load within one fire, because every tile lit from one seed rolls on the same tick of four. At about 45 ns per burning cell that does not matter.

*Games that used it.*
- Tibia (fire is an item per tile; Canary's data): https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
- Shattered Pixel Dungeon (one fire value per cell, 1 tile per turn): https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/blobs/Fire.java
- Brogue CE (at most 1 cell per turn): https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Time.c

*How it feels.* A fire you can watch and walk away from. The burning band stays 1.4 tiles deep for green grass and 3 tiles for brush, 45 to 96 px of flame behind the front, which reads as a band and not a line [I, note 15]. The server front steps once per second, and the continuous front (C2) and the flame loops smooth those steps on the client.

*Risks.* Two easy mistakes halve or kill the front. A visible "catching" state that also blocks spreading for a roll halves the speed. Burn times in seconds kill fronts on coarse grids [V, S6]. Upwind green grass dies in 10 of 12 runs at 5 m/s, which is good for gameplay but surprising [V, S6]. One cell per tile shows square fronts unless C1 or C2 draws the edge.

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Mood 4 · Interactivity 5

### A3. Light map and smoke field resolution

*In plain words.* Light and smoke are smooth fields. Building them costs per cell, drawing them costs per art pixel. Choose the cell size by what the eye needs, because the draw costs the same either way.

*How it works (technical).*
- **Light** [V, S39; I, note 12]. OTClient keeps one light texel per tile, `intensity = min(1, (radius - distance_in_tiles) * 0.2)`, per-channel max, drawn with a multiply. Per tile is 240 texels per view, per 8 px 3,600 and per 4 px 14,400. A per-tile map cannot shade anything smaller than a tile, a post or a trunk. 8 px cells can.
- **Dither band** [I, note 12]. With bilinear sampling the band width does not depend on the map resolution. A pool that falls linearly over R px gives a band `δ x R` px wide for a light range δ. A 3-tile pool (R = 96 px) at δ = 1/16 gives 6 px. For the 2 to 3 px band that suits 32 px art, δ ≈ 0.026.
- **Smoke** [I, note 12]. A field shows features down to about 2 cells, and a moving feature steps unless it is about 4 cells wide. The smallest clean feature is about 16 px at 4 px cells, 32 px at 8 px and 64 px at 16 px. House smoke is 2 tiles or more across, so 8 px cells hold it. A chimney plume of 4 to 12 px is smaller than any field, so draw it as puffs (D2).

*Cost / performance.* Light build from 30 sources costs 0.0025 / 0.016 ms at 32 px cells, 0.021 / 0.142 ms at 8 px and 0.084 / 0.547 ms at 4 px. Applying it to every art pixel costs 0.21 to 0.29 ms on the desktop with nearest sampling and 0.47 to 0.52 ms with bilinear, at any map size. A 4 px map with nearest sampling (0.37 ms build plus apply) beats bilinear on a coarse map (0.48 to 0.53 ms). Smoke advect with one Uint8 channel costs 0.0028 / 0.018 ms at 16 px, 0.0095 / 0.060 ms at 8 px and 0.035 / 0.214 ms at 4 px [I, note 16, measured]. The bench lit 99% of the screen. In the Sandbox, which skips unlit blocks, the apply follows the lit pixel count. It costs 0.47 ms with 160,123 lit px in the showcase, 0.24 ms by day and 0.29 ms by night with 57,141 at idle [V, S6].

*Games that used it.*
- OTClient (one light texel per tile, max blending): https://github.com/mehah/otclient/blob/main/src/client/lightview.cpp
- Cataclysm DDA (smoke as a per-tile field with 3 levels): https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/field_type.json

*How it feels.* With bilinear sampling a small flicker in a per-tile map moves the pool edge 1 to 2 px. Nearest sampling makes it jump whole tiles [I, note 12].

*Risks.* No perceptual source for smoke cell size at 32 px exists. Our rules are sampling arithmetic, and the Sandbox's smoke-cell control should settle it by eye [I, note 12].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Mood 4 · Interactivity 2

### Family B: Flames at 32 px

### B1. Drawn flame loops sized by the tile

*In plain words.* Draw the flame by hand, as VFX #6 advised, but at sizes picked from a ladder against the 32 px tile. Pixel size grows a lot from 8 px art. Frame count grows a little, and tone count goes from 4 to 5.

*How it works (technical).*
- **Packs** [V, S124, S125, S126, S128]. brullov ships five fires at 24x32, 20x24, 15x24, 10x24 and 8x8 px, each with start, loop and end parts, 355 frames in all. Minifantasy ships fire at 8, 16 and 32 px. Idylwild uses 4 frames per animation. Silas Games draws a 172x192 campfire in only 7 frames with 46 colours.
- **Craft** [V, S129, S130]. "Busy Flames" plays at 10 fps with 16 colours, animates bubbles first and then flamelets around them, and gets a purple outer edge. Its artist says more frames are smoother but "less punchy". The Pixel Joint candle thread puts the hottest, widest part at the wick.
- **Ladder** [I, note 11; lead]. Candle 4x8 px, 4 frames of 100 ms, 3 tones and a white core. Torch on a post or wall 10x16, 6 frames of 100 ms, 5 tones. Brazier 16x20, 6 frames of 110 ms. Campfire 24x28 on one tile, 8 frames of 100 to 120 ms, 5 tones and a purple edge. Bonfire 32x48, 8 frames of 130 ms, 6 tones.
- **Ramps** [V, S141, S142, S143; I, note 11]. Endesga 32 runs `#3e2731 #a22633 #e43b44 #f77622 #feae34 #fee761` with hue 334, 354, 357, 24, 36, 51. Resurrect 64 and Apollo bend the same way, purple to red to yellow, with value rising 15 to 25 points per step.
- **Motion** [I, note 11]. Hold the bottom 2 to 3 rows, where VFX #6 held one. Let one tongue pinch off around frame 3 as a 2x2 or 2x3 blob rising 2 to 3 px per frame. Put a 7-frame tongue layer over a 6-frame body and the pattern repeats only every 42 frames, 4.2 s at 100 ms.

*Cost / performance.* Copying a cached frame into the index buffer costs 0.22 µs per flame. 150 flames cost 0.034 / 0.213 ms and 800 flames 0.179 / 1.17 ms [I, note 16, measured].

*Games that used it.*
- Stardew Valley (one 12x11 loop, 4 x 100 ms, stacked into campfires): https://stardewvalleywiki.com/Campfire
- Tibia (campfire 32x32, 5 x 100 ms): https://github.com/opentibiabr/canary/blob/main/data/items/appearances.dat
- brullov Fire Animation (the size ladder): https://brullov.itch.io/fire-animation

*How it feels.* Hand-made. At 32 px a flame has room for a 2 to 3 px white core and a purple edge that glows against grass.

*Risks.* No artist text gives tone or frame counts per flame size, so the ladder is inference from packs [I, note 11]. Stardew draws its flames at 3x on a 4x world, which breaks the pixel grid [I, note 10]. Do not copy that.

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 2

### B2. Tibia overflowing field sprites and 16 position variants

*In plain words.* Tibia's burning tile has flames taller and wider than the tile, drawn in a 64x64 canvas that spills up and left. Each tile picks one of 16 drawings by its map position. A 3x3 firebomb never looks stamped, and the server stores nothing extra.

*How it works (technical).*
- **Asset data** [V, S12, S14; S10]. Fire field 2118 has 5 frames of 120 ms, a 4x4 pattern (80 sprites) and a box of (15, 17, 49, 47) with light 7. Stage 2119 has 5 x 100 ms, a 49x54 box and light 5. Stage 2120, harmless, has 5 x 100 ms, a 38x40 box and light 3. All three are unsynchronised. Map-placed copies 2131 to 2133 use a 2x2 pattern.
- **Variant rule** [V, S32]. OTClient sets `m_numPatternX = m_position.x % numPatternX`, and the same for y.
- **Anchoring** [V, S34; I, note 10]. Large sprites are drawn from the tile's bottom-right corner. A stage 1 field spills about 17 px into the left tile and 15 px into the tile above, 1.53 x 1.47 tiles in all. The box is probably the union over 16 variants and 5 frames, so one frame is smaller.
- **The same trick elsewhere** [V, S80, S77, S113]. Cataclysm DDA's 32x32 MShockXotto+ fire is 7 frames with a per-location hash "so that everything does not blink at the same time". Ragnarok picks 1 of 2 Fire Wall strips at random.

*Cost / performance.* Texture memory only, 80 sprites per stage. One sprite draw per burning tile, about 0.22 µs on our CPU path [I, note 16, measured]. One item change per stage on the server [I, note 10].

*Games that used it.*
- Tibia fire field: https://tibia.fandom.com/wiki/Fire_Field
- Cataclysm DDA, MShockXotto+ tileset: https://github.com/I-am-Erk/CDDA-Tilesets/tree/master/gfx/MShockXotto%2B
- Ragnarok Online Fire Wall: https://irowiki.org/wiki/Fire_Wall

*How it feels.* A field of fire, not a grid of fires. A flame that stays inside 32x32 looks smaller than Tibia's [I, note 10].

*Risks.* We do not know whether the 16 variants are 16 shapes or 16 crops of one picture [U, note 10]. Overflowing flames must be y-sorted with characters and objects, or a player walks under a flame from the tile below.

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 3

### B3. Dying fire: smaller, slower, dimmer

*In plain words.* Tibia's campfire and torch show a fire dying with three signals at once. The sprite gets smaller, the frames get slower and the light drops by steps. The fire field only follows the light rule, and Asterion can apply all three.

*How it works (technical).*
- **Fire field** [V, S12]. Boxes 49x47, 49x54, 38x40 px. Frames 120, 100, 100 ms. Light 7, 5, 3. Stage 2 is taller and faster than stage 1, so only the light falls at every stage. The last stage is the smallest. Canary's stage times are 200, 148 and 98 s [V, S14]. TFS 1.4, which VFX #6 quoted, gives 3 x 120 s [V, S2]. The Sandbox plays Canary's times divided by 10, so 20, 14.8 and 9.8 s, and a field runs its whole life while you watch [V, S6].
- **Campfire** [V, S12]. Item 1998 is 5 x 100 ms at light 7, 1999 is 4 x 100 ms at light 5, 2000 is 6 x 300 ms at light 3, and 2003 is 4 x 150 ms at light 5.
- **Torch** [V, S12, S14]. Boxes 29x30, 26x27 and 24x23 px at light 7, 6 and 5, lasting 600, 300 and 300 s. Then a burnt-down stub of 11x14 px at light 0 for 300 s.
- **Project Zomboid** [V, S96]. A fire spends its last quarter of life in smoke stages, with a single small flame before smoke alone.
- **For Asterion** [I, note 15]. "Dying" is client-side, the last 25% of a tile's hashed burn length, with one flame left and smoke doubled.

*Cost / performance.* One sprite swap and one light change per stage per tile. One server message per stage, or none if the client derives it [I, note 10].

*Games that used it.*
- Tibia fire field and campfire: https://tibia.fandom.com/wiki/Fire_Field
- Project Zomboid (life stages in `IsoFire.java`): https://github.com/Ketum-Git/PZ-Javacode/blob/master/PZ_41.78/zombie/iso/objects/IsoFire.java

*How it feels.* Tired. Physics says a smaller flame puffs faster, since `f = 1.5 / sqrt(D)` [S2]. Tibia slows the dying campfire to 300 ms frames anyway, and it reads better. A slow small flame reads as embers running out. I would follow Tibia here, not the physics.

*Risks.* The three signals must change together. A smaller sprite at full light reads as a bug.

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 2

### B4. DOOM buffers at 1:1 and 1:2: height rule and smoothing

*In plain words.* The DOOM fire still works at 32 px, but a short flame has few heat levels, and its 1 px grain turns into static next to drawn tiles. Size the buffer with a height rule, smooth the heat before turning it into 5 tones, and keep the buffers small.

*How it works (technical).*
- **Height** [I, notes 12, 18, measured; S8]. Measured as "the row where half the columns are lit", Sanglard's exact in-place loop reaches 95 rows at L = 36 (93 in note 18's re-run). A double-buffered loop reaches 73 (72) and a GPU-style gather 71. VFX #6's "about 72 rows" is the double-buffered height. The median of each column's highest lit pixel gives a third answer, 105 against 78 rows. The 95 rows need wrapped edges or a wide buffer (note 18 used 1,024 columns). A 64-column buffer with three padding columns measured 69 rows [I, figure agent], because the sideways drift carries heat out of a narrow patch.
- **Rule for a clean fire** [I, note 12]. `R50 = (L - c + 1) / p` rows, with L the source heat, c the lowest visible level and p the decay chance per row. Height in px is `k x R50`, with k = 1 at 1:1 and 2 at 1:2. Tip spread is `sqrt((L - c + 1)(1 - p)) / p`. For the exact in-place loop at p = 0.5 use `R50 ≈ 2.6 L`.
- **What a 32 px flame holds** [I, note 12; figure agent]. With the double-buffered rule at p = 0.5, a 16 px torch at 1:1 needs L = 8, 1.6 levels per tone at 5 tones, and L = 4 at 1:2. A 28 px campfire needs L = 14, or 21 at p = 0.75, and a 64 px house flame L = 32. Sanglard's in-place loop burns taller, so divide the height by 2.6 instead. A 16 px torch then needs L = 6, since L = 8 reaches 19 to 20 rows, a campfire about 11 and a house flame about 25.
- **Grain** [I, notes 12, 18, measured]. With 37 tones, 75.2% of lit pixels differ from all four neighbours. At 5 tones that falls to 8.6% at L = 36 but rises to 15.5% at L = 16 and 25.3% at L = 8. Raising p to 0.75 gives 5.3%. A 3x3 box average before quantizing gives 0.3%, and Lode's kernel 0.1%.
- **Tones** [I, note 12]. Use a level-to-tone table with unequal bands, a pale core and a wide red-orange body. After a 3x3 average the top level almost never appears, 0.0% of pixels at L = 8 and 0.1% at L = 6, so map the core to the top 2 levels, about 10 to 15% of flame pixels [I, figure agent]. Leave out Bayer between bands. The DOOM noise already dithers every edge.
- **1:2** [I, note 12]. It halves the levels at the same p and turns each lone pixel into a lone 2x2 cluster.

*Cost / performance.* A torch of 8x24 px costs 0.0012 / 0.0084 ms at 1:1 and a 32x48 campfire 0.0086 / 0.057 ms. Twenty torches cost 0.024 / 0.158 ms. A 128x96 house front costs 0.067 / 0.417 ms at 1:1 and 0.019 / 0.122 ms at 1:2. A 640x120 band costs 0.388 / 2.52 ms at 1:1 and 0.109 / 0.714 ms at 1:2. Quantizing costs the same at 4, 5 or 6 tones [I, note 16, measured].

*Games that used it.*
- DOOM PSX title fire: https://fabiensanglard.net/doom_fire_psx/
- PICO-8 DOOM fire (32x36 cells, each 4 px wide): https://www.lexaloffle.com/bbs/?pid=172560

*How it feels.* Raw 37-tone DOOM at 1:1 reads as TV static over 32 px art. Smoothed and quantized to 5 tones it reads as a drawn flame whose tongues never repeat. At 1:2 it looks chunky next to 1 px outlines, as VFX #6's buffers did [I].

*Risks.* No shipped game with roughly 32 px tiles uses DOOM flames [I, note 12]. The lone-pixel metric ignores motion. Keep a 2-column margin, because the sideways write runs past the buffer edge.

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 3 · Mood 4 · Interactivity 3

### B5. GPU noise fire quantized to the palette

*In plain words.* Run the flame in a CanvasItem shader. Two scrolling noise textures, a painted silhouette mask, stepped time for a hand-drawn frame rate, and a lookup into the 5-tone ramp. On a real GPU it costs almost nothing.

*How it works (technical).*
- **Sketch** [I, note 12]. `t = floor((TIME + phase) * fps) / fps`. Two noise reads at different speeds, heat = shape mask x noise mix, `q = floor(heat * tones) / tones`, then the ramp. 4 fetches per fragment. Twenty 32x48 campfires are 30,720 fragments, 13% of the screen.
- **Shipped shader** [V, S167, S166]. Simple Pixelated Fire scrolls with `floor(TIME * scroll_speed)` and up to 5 palette thresholds, MIT, for Godot 4.5.
- **Bench shader** [I, note 16, measured]. Value-noise FBM with 1 noise unit per tile, scrolling up 1.5 tiles/s, a 5-tone ramp and `discard` below a threshold.

*Cost / performance.* The full 640x360 screen at 5 octaves costs 0.022 ms of GPU time on Metal and 0.510 ms of wall time on SwiftShader. Three octaves cost 0.014 and 0.399 ms. A 640x120 band costs 0.0076 and 0.170 ms, a 128x96 house front 0.0039 and 0.033 ms. Snapping to 2 px saves nothing, because the shader still runs per pixel. A 320x180 target is 3.0 to 3.8 times cheaper [I, note 16, measured].

*Games that used it.*
- Simple Pixelated Fire: https://godotshaders.com/shader/simple-pixelated-fireshader/
- sconce-fire-test, its Godot project: https://github.com/Casual-Cynic/sconce-fire-test

*How it feels.* Smooth and endless, good for big masses such as a burning roof or a lava lake. Without a painted mask it looks like every other shader fire.

*Risks.* A phone GPU may be 10 to 30 times slower in fill, which is an estimate [I, note 16]. CanvasItem shaders compile slowly on first use on Compatibility [V, S183].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 3 · Mood 4 · Interactivity 2

### B6. Stacked copies, jitter and particle-only fire

*In plain words.* Three cheap ways to get many fire sizes from little art. Stack copies of one small loop with different seeds. Redraw a flame several times with tiny offsets. Or skip flame sprites and let every burning cell throw small rising squares.

*How it works (technical).*
- **Stardew** [V, S47, S48]. A campfire draws one 12x11 loop of 4 x 100 ms three times at scale 3, with seeds `x*3047 + y*88`, `x*2047 + y*98` and `x*2077 + y*98`, at offsets (12, -8), (20, 0) and (12, 12) screen px. A fireplace draws it twice at scale 4. The floor torch is a separate 8x8 flame of 7 x 100 ms with seed `x*3204 + y*49`.
- **Terraria** [V, S82, S83]. The campfire is an 8-frame loop of 66.7 ms, 533 ms per loop. Flame overlays are drawn 7 times with additive colour (50, 50, 50) and offsets of up to about 3 px, reseeded every 5 draws, about 12 Hz, and XORed with the tile position.
- **Shattered Pixel Dungeon** [V, S67, S68, S70; I, note 17]. Each burning 16 px cell emits one 4 px additive square of `0xEE7722` every 30 ms. It lives 0.6 s, accelerates up at 80 px/s² and shrinks to nothing. That is 20 live squares per cell, each rising 14.4 px. At 32 px the port is 8 px squares at 160 px/s², rising about 29 px.
- **Project Zomboid** [V, S96]. Two or three flame animations per tile at random offsets of up to 32 px, at 12 fps.

*Cost / performance.* A stacked copy is one flame draw, 0.22 µs. A 20-tile SPD front is about 400 squares, and particles cost about 7 ns each [I, note 16, measured].

*Games that used it.*
- Stardew Valley campfire (decompiled `Torch.cs`): https://github.com/veywrn/StardewValley/blob/master/StardewValley/Torch.cs
- Terraria campfire: https://terraria.wiki.gg/wiki/Campfires
- Shattered Pixel Dungeon: https://shatteredpixel.com/

*How it feels.* Stardew's stacks look rich for one small sheet. One 24x22 loop stacked by seed could give Asterion every fire from a candle cluster to a bonfire [I, note 10]. Terraria's additive copies blur edges by up to 3 px and leave the palette. SPD's squares read as abstract heat, not flame.

*Risks.* Additive and scaled copies leave the palette and break the grid. Use only whole-pixel offsets with palette tones [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 2

### Family C: Burn front and burnt world

### C1. Per-pixel burn-order map with entry direction

*In plain words.* The server knows only that a tile burns. The client paints the burn across the tile pixel by pixel, in an order an artist chose, starting from the side the fire came from. This is VFX #11's art threshold map, applied to scorch and ash.

*How it works (technical).*
- **The test** [I, note 12]. With `T(px)` a threshold per art pixel in 0..1 and `b` the tile's burn progress, `d = b - T(px)`. Below 0 is unburnt. From 0 to `w_rim` is the glowing ember line. From `w_rim` to `w_rim + w_sc` is the scorch band. Above that is the charred tileset, and later ash.
- **Band width** [I, note 12]. A band's width in px is its width in threshold units over the threshold's gradient. For a ramp across one 32 px tile, 1 px is 1/32 ≈ 0.031, so a 2 to 3 px scorch band is 0.06 to 0.09. Noise in T widens bands where T is flat, so measure on the final map.
- **Entry direction** [I, note 12]. With `u = px_in_tile / 32 - 0.5` and `e` the unit direction the fire came from (3 bits, 8 directions), `T = (1 - a) * clamp(dot(u, -e) / s + 0.5, 0, 1) + a * N(px)`. `s` is 1 for side entries and `sqrt(2)` for diagonals, N is the painted cluster map, and `a` of 0.3 to 0.5 keeps the front ragged without losing its direction.
- **Diagonal widths** [I, figure agent]. The ramp part of T changes `(1 - a) / (32 s)` per px across the front, so divide the band widths by s too. With the side-entry widths on a diagonal entry, a test measured a 3.7 px edge and a 4.7 px scorch band against 2.0 and 2.0 for a side entry.
- **Widths to aim for** [V, S155; I, note 11]. mreliptik's burn-edge shader suggests a band of 0.04 of the noise range, 1.3 px across a 32 px ramp. Note 11 rounds that to a 2 px edge, 1 px bright and 1 px dark red. The Sandbox draws a 2 px edge in glow and dark red, then a scorch zone, then char [V, S6].
- **Burn shaders to borrow** [V, S155, S156, S157]. mreliptik zeroes the band at 0 and 1 with two `step()` calls so no stray dot remains. The Pixelated burn shader snaps UV with `floor(UV / pixel_size) * pixel_size`. enekoassets' directional burn uses `s = dot(UV*2-1, dir) + noise.r * noiseForce`. All three work in sprite UV, not on a world-anchored tile map [I, note 12].

*Cost / performance.* 1.6 to 1.7 ns per burning pixel. With 10% of the screen burning it costs 0.039 / 0.246 ms, with 20% 0.082 / 0.515 ms, with 50% 0.210 / 1.30 ms and with all 240 tiles 0.417 / 2.88 ms. Bayer 4 costs 0.036, 0.179 and 0.348 ms on the desktop, 8 to 17% less. A finished tile can drop into a cached layer, so only tiles with a moving front cost anything [I, note 16, measured].

*Games that used it.*
- 2D dissolve with burn edge (Godot, CC0): https://godotshaders.com/shader/2d-dissolve-with-burn-edge/
- 2D Burn/dissolve with direction (Godot, CC0): https://godotshaders.com/shader/2d-burn-dissolve-with-direction-v-1-0/
- VFX #11's art threshold map for snow: https://kingsfoil-artifacts.netlify.app/vfx-snow-32px-topdown-pixel

*How it feels.* The front arrives from where the fire came, eats the tile in ragged clusters and leaves a glowing line, then a dark band. The square tile disappears.

*Risks.* No shipped tile game draws its burn this way. With per-tile progress, two neighbours that caught on different ticks show a step at their shared edge, because T restarts at every border [I, note 12]. C2 removes that.

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 4 · Pixel taste 5 · Mood 5 · Interactivity 4

### C2. Continuous arrival-time front

*In plain words.* Store the time each tile caught fire in a tiny texture, one texel per tile, and let the GPU blend it between tile centres. The blended time at a pixel says when the fire reached that pixel. The front becomes a smooth curve that crosses tile borders without a seam. This is our researcher's own construction. No shipped game uses it, and our Sandbox is the only place it has run.

*How it works (technical).*
- **Arrival time** [I, note 12; lead]. `t_ignite` per tile in a 1-texel-per-tile texture with a linear filter, 240 texels per view. Sample it at the art pixel to get `t_arrival(px)`, then `b = (now - t_arrival(px)) / t_burn` against the same tileable T as C1. The bilinear contour of the arrival time is the front.
- **Unlit tiles** [I, note 12]. A tile that has not caught needs a placeholder time, now plus a horizon or the arrival predicted from the spread rate, or the blend pulls the front ahead of the fire.
- **Precedent** [V, S168; I, note 12]. This is fog of war with time in place of visibility. raylib's fog example keeps one texel per 32 px tile and lets the bilinear filter round it.
- **Format** [I]. Two bytes of a 16-bit time cannot be interpolated by the filter, so store the time as a half float relative to a rolling epoch, 480 bytes per view, re-uploaded when a tile catches.
- **As built** [V, S6]. The Sandbox makes this its default front. Each 2x2 px block samples the cells' ignition times bilinearly through an 8 px warp. A cell that has not caught counts as now plus 6 s. Jitter comes from a 128 px map grown from 96 seeds, up to 0.9 s. Then a 2 px edge in glow and dark red, a 0.35 s scorch zone and char. A cell's clock freezes when its fuel runs out, and ash comes from a second smooth field.

*Cost / performance.* On the GPU, one more fetch than C1, 5 fetches per ground pixel with the two tilesets and the rim ramp, 1,152,000 per 640x360 frame [I, note 12]. On the Sandbox's CPU, in the showcase scene, the continuous front costs 0.73 ms per frame against 0.53 for per-tile progress, 0.43 for Bayer 4 and 0.32 for the whole-tile swap. Burning cells redraw at 30 Hz into a cached base [V, S6].

*Games that used it.*
- None shipped. The nearest code is raylib's fog-of-war example: https://github.com/raysan5/raylib/blob/master/examples/textures/textures_fog_of_war.c

*How it feels.* The best-looking front in this study. A grass fire spreads as a ragged curve, and you cannot tell where the tiles are. The per-tile style in the Sandbox shows the seam it removes.

*Risks.* Untested in Godot. The placeholder rule decides whether the front leans ahead of the server. Band widths in px change with front speed, because the time gradient changes [I]. In the Sandbox an unburnt tile next to a long-burning tree or house can still show straight edges [V, S6].

*Ratings 1–5 (author judgement):* Simplicity 2 · Speed 4 · Pixel taste 5 · Mood 5 · Interactivity 4

### C3. Whole-tile swap and scorch autotiles

*In plain words.* The cheapest burn. The tile flips to its burnt picture at once. Autotiles round the corners of the final scar. It is the right tool for the end state and the wrong one for a moving front.

*How it works (technical).*
- **Shipped swaps** [V, S98, S64, S65]. Project Zomboid swaps every object on a burnt square to its `burntTile`. Walls pick 1 of 2 burnt variants per orientation and floors 1 of 3. Pokémon Emerald plays a 16x16 ash puff of 938 ms and then swaps the metatile to clean grass.
- **Multitile** [V, S80, S81]. Cataclysm DDA's 32x32 MShockXotto+ fire draws a background sprite plus foreground pieces for centre, corner, edge, T-connection, end and unconnected, so a fire region reads as one blob.
- **Dual grid** [V, S3; I, note 12]. One burnt bit per tile gives 15 or 16 tiles. The edge then moves in 16 px steps.

*Cost / performance.* Copying a 32x32 tile by progress costs 0.011 / 0.066 ms with 10% of the screen burning, 0.060 / 0.382 ms at 50% and 0.116 / 0.720 ms at 100%, 3.6 times cheaper than the burn-order map. In a cached tile layer it costs nothing between state changes [I, note 16, measured].

*Games that used it.*
- Project Zomboid (`BurnWalls`): https://github.com/Ketum-Git/PZ-Javacode/blob/master/PZ_41.78/zombie/iso/IsoGridSquare.java
- Cataclysm DDA (fire field multitile): https://cdda-guide.nornagon.net/field/fd_fire
- Pokémon Emerald (ash on Route 113): https://bulbapedia.bulbagarden.net/wiki/Route_113

*How it feels.* A board of switches. Fine for ash, a bug for a front.

*Risks.* Square fronts. It is the fallback for machines that skip the per-pixel pass.

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Mood 2 · Interactivity 3

### C4. Tile states, burnt tileset, embers, ash and regrowth

*In plain words.* A burning 32 px tile goes through seven states, from fresh to regrown. The artist draws three tilesets (normal, charred, ash), an ember overlay and the regrowth tiles. The burn-order map makes everything in between.

*How it works (technical).*

| # | State | Server | Duration (green grass / tree) | Drawn |
|---|---|---|---|---|
| 0 | Fresh | yes | until lit | normal tileset |
| 1 | Catching | client | first roll period, 1 s | a look only, the tile may spread on its first roll. Front enters from the entry side, one 8 to 10 px flame and a grey wisp |
| 2 | Burning | yes | 5 rolls / 24 rolls (5 s / 24 s at 32 px) | up to 3 flames at hashed offsets, the burn map sweeps the tile in about 1 s |
| 3 | Dying | client | last 25% of the burn | one small flame looping 1.4 times slower, smoke doubled |
| 4 | Embers | yes | 4 to 10 s | charred tile with 2 to 4 glowing clusters of at least 2x2 px |
| 5 | Ash | yes | 60 to 120 s | whole-tile swap, 2 variants by hash, a thin wisp for 3 to 5 s |
| 6 | Regrowing | yes | 5 to 10 min in all | bare dirt, sprouts, short grass, full grass |

- **Source of the table** [I, note 15; V, S6]. The durations are the Sandbox's as-built values. The server stores states 0, 2, 4, 5 and 6 plus the entry direction and the ignition tick. Note 15 made catching a stored state of one roll. The build showed that a tile which waits a roll before spreading halves the front speed, so catching is drawn on the client only. Dying comes from the time since ignition and the hashed burn length, so VFX #6's event list stays as it was.
- **Shipped stages** [V, S96, S78, S74, S73, S12]. Project Zomboid has six life stages with smoke from the third. Cataclysm DDA has 3 fire intensities with translucency 0.7, 0.4 and 0.1 and light 20, 60 and 160. Brogue promotes fire to embers at 500 per 10,000 per turn and embers to ash at 300. SPD turns a burnt cell into its EMBERS terrain. Tibia's ash is a still 24x24 sprite.
- **Regrowth** [V, S100, S101, S93; I, note 15]. Minecraft grass spreads only from adjacent grass, about one random tick per block every 68 s. Don't Starve Together regrows picked grass in 1,440 s and a desolated forest in 400 min. Our steps are ash 60 to 120 s, bare dirt 2 to 4 min, sprouts 1 to 2 min entered only beside green, short grass 1 to 2 min.
- **Art** [I, note 11]. Char in the ramp's darkest warm purple (Endesga `#3e2731`, Apollo `#411d31`), not black. Ash in two warm greys with 2x2 flecks.

*Cost / performance.* Whole-tile swaps on change only. Regrowth on a slow list, one check per burnt tile every 10 to 30 s [I, note 15].

*Games that used it.*
- Brogue CE (fire, embers, ash as tile types): https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c
- Minecraft (grass regrowth by neighbour): https://minecraft.wiki/w/Grass_Block
- Tibia (ash as a still 24x24 item): https://github.com/opentibiabr/canary/blob/main/data/items/items.xml

*How it feels.* A scar that heals from its edges. A global timer would flip the whole scar at once [I, note 15].

*Risks.* No pixel game publishes ash-to-grass timings [I, note 15]. A 4-frame loop at 10 fps shows less than 2 loops in VFX #6's 0.75 s grass burn, which reads as a flash. Green grass at 5 rolls of 1 s gives 12 loops [I, note 15; V, S6].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 4

### C5. Trees and houses in stages

*In plain words.* A tree is one fuel tile with a painted canopy. A house is nine fuel tiles drawn as one object whose look comes from how much of it has burnt. Every client agrees, because the fraction comes from server state.

*How it works (technical).*
- **Tree** [I, note 15]. The server cell is the trunk. One flame at the base while catching, then 3 to 5 flames climbing the crown over the first third of the burn. Raise trees to 20 to 30 rolls. The Sandbox uses 24 rolls for trees and 30 for wood [V, S6]. Then a charred tree with bare branches, then a stump. In dense woods, a burning tree also rolls against trees 2 tiles away at 0.3 times p.
- **Shipped trees** [V, S93, S94, S88]. Don't Starve Together burns a full tree for 45 s with a propagator range of 5 to 7 units, 1.25 to 1.75 tiles, and plays a `burnt_<stage>` animation. RimWorld sends 20% of its sparks about 2 tiles out. Tibia has no burnt-tree item at all [V, S14].
- **House** [V, S89; I, note 15]. RimWorld refuses fire on the inner cells of a building (`OccupiedRect().ContractedBy(1)`). A 3x3 house takes outside ignition on its 8 edge tiles. The burnt fraction picks the stage. Any tile catching puts smoke under the eaves. At 25%, flames through the roof. At 60%, the roof collapses to charred rafters with a 300 to 500 ms burst of embers and smoke. At 100%, charred wall stumps. Then rubble.
- **Art** [I, note 11]. A burning house is 4 to 6 loops of 24 to 32 px across the roof at 8 frames of 130 ms, under a smoke column up to 32x96. A burning tree is 2 to 3 offset campfire loops over a 32x48 to 64x64 canopy.

*Cost / performance.* One object stage swap per threshold crossed. The collapse is derived on the client and needs no message [I, note 15].

*Games that used it.*
- Don't Starve Together (`evergreens.lua`): https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/prefabs/evergreens.lua
- RimWorld (edge-ring rule): https://rimworldwiki.com/wiki/Fire
- Dwarf Fortress (burning trees can collapse): https://dwarffortresswiki.org/index.php/DF2014:Fire

*How it feels.* A house fire becomes an event. With wood walls at 20 rolls a house burns for about 30 s, which matches Don't Starve's large burnable. The Sandbox's 30 rolls sit between. At 40 rolls it lasts about a minute, and I prefer that for an MMO, where players need time to gather and watch [I, note 15].

*Risks.* No devlog shows house collapse stages [I, note 15]. Five drawn house stages per house type is real art time.

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 4

### Family D: Smoke, steam and embers at 32 px

### D1. Smoke field drawn with clusters

*In plain words.* Keep VFX #6's smoke field at 8 px cells, store it in one byte channel, and draw it through 2x2 px clusters instead of a 4x4 Bayer. Skip empty spans and the draw gets cheap.

*How it works (technical).*
- **Field** [I, note 16]. One Uint8 channel in 8.8 fixed point, the wobble from per-row and per-column tables built once per tick. The benchmark decays by x254/256 per step with a floor. The Sandbox keeps 50% per second at 30 Hz, about x250/256 per step, which clears smoke faster at 32 px.
- **Emission** [I, note 15]. A 32 px tile covers 16 cells of 8 px. A burning tile emits 16 times the 8 px cell amount, into its top 2x2 cells only, so smoke starts as a plume.
- **Clusters** [V, S139, S3]. Nano Combat draws its smoke density through 5 dither textures scaled so the dither is "not as small as a pixel". VFX #11 found single isolated pixels read as noise at 32 px. The Sandbox first reused the burn-order map for smoke and got lone 2x2 dots, so smoke now has its own soft-blob cluster map [V, S6].
- **As built** [V, S6]. Fields of 160x90, 80x45 or 40x23 advected at 30 Hz, rising 26 px/s, 50% kept per second (16% for steam). Ground smoke feeds 170 units per tile per second against a draw threshold of 44. A burning house feeds a column of 420 per second over an 18 px radius, a tree 200.
- **Sight** [V, S78, S2; I, note 15]. Cataclysm DDA has thin, normal and thick smoke with translucency 1, 10 and 0, the thickest marked not transparent, half life 2 minutes. DCSS stops sight after 2 opaque cloud tiles. Only the server computes sight, from a copy of the field at tile resolution.

*Cost / performance.* The step as VFX #6 wrote it, with three Float32 channels, costs 0.055 / 0.366 ms at 8 px cells. One Uint8 channel costs 0.0095 / 0.060 ms, 5.8 times less. Drawing 30 plumes at 2.5% coverage with a 2x2 cluster and bilinear sampling costs 0.273 / 1.68 ms, and 0.099 / 0.606 ms with zero spans skipped. Bayer 4 costs 0.283 / 1.70 ms and nearest 0.137 / 1.22 ms. A stress field at 31% coverage costs 0.253 / 1.67 ms with skipping [I, note 16, measured].

*Games that used it.*
- Cataclysm DDA (`fd_smoke` levels): https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/field_type.json
- Nano Combat (dithered smoke density): https://itch.io/post/477565

*How it feels.* Smoke that drifts as shapes, not as speckle.

*Risks.* Nearest sampling at 8 px cells draws visible squares, as it did for snow [V, S3]. The 2x2 cluster costs the same as Bayer, so the look is the only argument, and it is a good one.

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Mood 4 · Interactivity 3

### D2. Hero puffs scaled by the tile

*In plain words.* Chimneys, campfires, trees and houses throw drawn puffs. Scale Stardew's puff by the tile and let column height in tiles tell players how big the fire is. Wildfire smoke stays in the field.

*How it works (technical).*
- **Stardew converted** [I, note 15]. In art px at 16 px tiles, the puff starts at 5 px, ends at 24 px and rises 7.5 px/s for 6.25 s.
- **Per source at 32 px** [I, note 15]. Campfire 4 to 6 px growing to 16 to 20, 12 px/s, 1 to 1.5 tiles, 2 puffs per second. Chimney 8 to 10 growing to 32 to 47, 15 px/s, 2 to 3 tiles, every 600 ms. Tree 10 to 12 growing to 32 to 40, 3 to 4 tiles. House 12 to 16 growing to 48 to 64, 20 px/s, 4 to 6 tiles, 2 to 4 per second, dark grey. Steam 8 to 12 white puffs of 6 to 8 px in 0.3 s, rising 30 px/s for 0.5 to 1 s.
- **Packs** [V, vendor, S136; V, S125, S126]. pimen's smoke runs 6 to 10 frames at 70 ms on canvases of 16 to 96 px. Minifantasy's columns are 8x24, 16x48, 32x48 and 32x96, three times the fire width. Idylwild draws smoke in 2 colours.
- **Craft** [I, note 11]. Two tones per puff, three from 16 px. Break a fading puff into 2x2 chunks instead of fading alpha.
- **Budget** [V, S88; I, note 15]. RimWorld throws one mote per burning cell every 2.3 to 3.3 s and stops all smoke motes at 15 fires. Spawn puffs from objects only and cap them at about 64 alive.
- **Tibia** [V, S12]. Smoke is a one-shot effect, SMOKE 12 x 100 ms at 33x35 px.

*Cost / performance.* 64 small quads. 240 burning tiles each throwing puffs would be about 580 alive, which is why the field carries wildfire smoke [I, note 15].

*Games that used it.*
- Stardew Valley (`addSmokePuff`, decompiled): https://github.com/E-riCA0/StawdewValley/blob/HEAD/Utility.cs
- Minifantasy Raided Village (smoke columns by fire size): https://krishna-palacio.itch.io/minifantasy-raided-village
- RimWorld (smoke motes off at 15 fires): https://github.com/josh-m/RW-Decompile/blob/master/RimWorld/Fire.cs

*How it feels.* A 3-tile chimney column is 27% of the screen height and a 6-tile house column 53%. House smoke that leaves the top of the screen says "big fire" without hiding the play area [I, note 15].

*Risks.* A puff under 4 px reads as an ember [I, note 11]. Alpha fades leave the palette.

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 2

### D3. Embers and sparks at 2x2 px

*In plain words.* At 32 px an ember is a 2x2 block. A single pixel is a spark that lives a few frames. A 3x3 block is a burning chunk thrown by an explosion.

*How it works (technical).*
- **Craft** [V, S131]. Slynyrd builds particles from a "2x2px particle", moves it 1 px per frame and makes it flutter by cutting its top half every other frame.
- **Sizes and lives** [I, note 11]. Sparks 1x1 or 1x2 in the two hottest tones, 3 to 8 frames. Embers 2x2, 0.5 to 1.5 s, coloured by age. Chunks 3x3 only from explosions and roof collapses.
- **Counts alive** [I, note 11]. Torch 1 to 3, campfire 4 to 8, bonfire 10 to 20, burning house 20 to 40.
- **Stardew** [V, S47]. Three ember points of 1 source px at scale 3, 1.5 px at Asterion scale. Respawn chance 0.0075 per frame, updated only within 256 px of the screen.

*Cost / performance.* 7 ns per particle for update and draw. 256 embers cost 0.0019 / 0.012 ms, 512 cost 0.0033 / 0.021 ms and 4,096 cost 0.030 / 0.196 ms [I, note 16, measured]. Pool size is an art choice.

*Games that used it.*
- Stardew Valley (three ember pixels per torch): https://github.com/veywrn/StardewValley/blob/master/StardewValley/Torch.cs
- Slynyrd, Pixelblog 33 (the 2x2 particle): https://www.slynyrd.com/blog/2021/7/16/pixelblog-33-wind-effects

*How it feels.* Heat you can see rising. VFX #11 found 1 px flakes read as sensor noise at 32 px [V, S3], and 1 px embers do the same.

*Risks.* Too many become confetti. Round positions to whole pixels.

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 2

### Family E: Characters at 24x32

### E1. Burning overlay on a 24x32 character

*In plain words.* Tibia draws nothing on a burning character. It shows an icon, a hit effect and an orange number per tick. Asterion adds a warm tint, two small flames, a few embers and a puff. Everything in this profile beyond Tibia's hit effect is an Asterion addition [I, lead].

*How it works (technical).*
- **Tibia** [V, S18, S17, S19, S12]. `CONDITION_FIRE` only sets `ICON_BURN`. Each tick shows `CONST_ME_HITBYFIRE`, 9 frames of 100 ms at 42x40 px, and one orange number. Field damage between two players is halved.
- **Terraria** [V, S84; I, note 13]. A burning entity is tinted with blue x0.6 and green x0.7. Fire dust spawns over the hitbox on 75% of ticks for NPCs and 25% for players, about 45 and 15 per second at 60 ticks per second.
- **Pokémon Emerald** [V, S62, S63; I, note 13]. Burn plays 3 flames of 32x32 OAM, each a 5-frame loop of 4 game frames (about 67 ms), started 4 frames apart.
- **RPG Maker MV** [V, S59]. A state overlay of 96x96 px, 8 frames of 8 game frames (133 ms), anchored at the feet.
- **Others** [V, S71, S80]. Shattered Pixel Dungeon pours flame particles over a burning sprite every 0.06 s, about 10 alive. Cataclysm DDA's 32x32 tileset has one static `overlay_effect_onfire` sprite.
- **Asterion recipe** [I, note 13]. A warm palette-row tint (or R x1.0, G x0.7, B x0.6). Two flames of 8x10 px, 4 frames of 100 ms, at the shoulder and the hip, 2 frames apart. A 6x8 head flame on even seconds. Embers of 2x2 px at 6 to 8 per second. One 4x4 puff every 0.5 s rising 0.5 px per frame for 1 s. One damage tick per second, as the Sandbox deals 10 per second while burning, each with a 50 ms white flash and an orange number. VFX #6 proposed one every 2 s. One per 4 Hz tick would flash 4 times a second, over the 3-per-second flash limit, and numbers would merge in pairs. The server sends "burning until tick N" and the damage per damage tick.

*Cost / performance.* About 10 draws per burning character. Twenty burning players make about 200 sprites, which Godot batches if flames and particles share one atlas [I, note 13].

*Games that used it.*
- Terraria, On Fire!: https://terraria.wiki.gg/wiki/On_Fire!
- Pokémon burn: https://bulbapedia.bulbagarden.net/wiki/Burn_(status_condition)
- RPG Maker MV state overlay: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_StateOverlay.js

*How it feels.* Alarming without hiding the character. The tint does half the work for no draw at all.

*Risks.* Emerald's 32x32 flames on a 24x32 body would hide it, so the flames shrink to a quarter [I, note 13]. Under warm night light the tint is hard to see, so keep Tibia's HUD icon.

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 4

### E2. Carried torch through a 4-frame walk

*In plain words.* Tibia never draws a carried torch. The torch only adds a light. A drawn torch is an Asterion addition and needs its own rules for hand offsets, layering and lean [I, lead].

*How it works (technical).*
- **Tibia** [V, S22, S39]. The server takes the brightest item in any slot as the player's light. OTClient puts creature light at the creature's draw position. With radius 7 the light is full out to 2 tiles and reaches zero at 7 tiles, 224 px, so one torch lights about 14 x 11 tiles of a 20 x 11.25 view [I, note 13].
- **Size** [I, lead; note 13]. Stick 2x8 px and flame about 6x8, a quarter of the character height. Torches on posts and walls stay 10x16. A 4-frame loop of 100 ms with the base still, running on its own clock so it does not restart each step.
- **Hand offsets, facing south** [I, note 13]. Frames 0 to 3: (+1, 0), (0, -1), (-1, 0), (0, -1). Facing east or west, swing along x instead.
- **Layering** [I, note 13; V, S6]. Note 13 drew the torch before the body facing west, on the idea that mirroring the east sprite moves the torch to the far hand. A horizontal flip does not change depth, and in side view the held hand is the near arm both ways. The Sandbox draws the torch in front facing south, east and west. Only facing north puts it behind. It holds the torch 4 px forward in side view with the stick tilted 6 px.
- **Lean** [I, note 13]. Shift the top 2 flame rows 1 px against the walk while moving.
- **Hand height** [V, S85; I, notes 13, 18]. Note 13 puts the hand about 18 px above the feet. Terraria places a held torch 24 px down a 42 px hitbox, which scales to 18 px below the head top, 14 px above the feet. The 4 px difference is an art call.

*Cost / performance.* One sprite and one light entry per carrier, plus a rim uniform pair (E3) [I, note 13].

*Games that used it.*
- Terraria (held torch at the hand, an old decompile): https://github.com/dptetc/Freeria/blob/6eedc5ff0752e1e5854a08f01db04edfcda3346f/Freeria/Player.cs
- Tibia (light from the brightest item, TFS `player.cpp`): https://github.com/otland/forgottenserver/blob/master/src/player.cpp

*How it feels.* A quarter-height flame reads as hand-held. A bigger one reads as a brazier on legs.

*Risks.* No shipped game's per-frame torch offsets were found [I, note 13]. A per-tile light map ignores the 1 px swing, so only the rim light follows the hand.

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 4

### E3. Warm rim light and the fire shadow

*In plain words.* A character standing near a fire gets a 1 px warm edge on the side facing it and a shadow cast away from it. No normal maps, just an alpha test in the sprite shader.

*How it works (technical).*
- **Graveyard Keeper** [V, S116]. Up to 4 shadows per object, the sun and the 3 nearest lights, each a sprite rotated in the vertex shader, from about 10 reusable shadow sprites. Lighting uses normal maps painted as 4 light passes.
- **Pixel Beef** [V, S135]. A rim shader lights the outermost pixels of each sprite from received light, with 4 to 6 colours per sprite.
- **Rim recipe** [I, note 13]. Find the nearest fire within 4 tiles and quantize its direction to 8. A pixel is rim if it is opaque and the pixel 1 px toward the fire is transparent, and inner rim at 2 px. Rim takes the warm highlight entry and inner rim the warm mid entry, by palette row lookup. Both tones within 1.5 tiles, rim only out to 3 tiles, nothing beyond or behind the fire.
- **Width** [I, notes 11, 13]. 1 px is about 4% of a 24 px sprite and reads at 2x and 3x. 2 px looks like an outline glow. Note 11 allows a second warm tone only beside a bonfire.
- **Shadow** [I, note 13; V, S6]. Note 13 proposed a 16x6 px ellipse stretched to 16x10 and rotated. As built, it is one ellipse 16 px wide and 6 to 10 px tall, pushed away from the nearest fire, one shade darker, with no pixel darkened twice. The normal blob shadow is 14x5. Update it when the character or the fire changes tile and lerp over the step.

*Cost / performance.* Two extra texture taps per fragment, about 768 pixels per character, trivial for 50 characters [I, note 13]. Not measured.

*Games that used it.*
- Graveyard Keeper (rotated shadows per light): https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
- Sea of Stars ("full dynamic lighting" on pixel art, no method given): https://sabotagestudio.com/presskits/sea-of-stars

*How it feels.* A campfire stops being a sprite next to people and becomes a scene.

*Risks.* No shipped game uses this alpha-edge rim [I, note 13]. A warm rim on a warm main light "simply looks flat" [U, S145], so keep the far side's cool shadow. Painted normal maps double art time per frame, too much for an MMO's outfits [I, note 13]. The alpha test steps in UV space, so negate the step on a sprite mirrored with `flip_h`, give each frame a 2 px clear margin, and skip outline and eye pixels for the inner tone [I, figure agent; V, S6].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 4 · Pixel taste 4 · Mood 5 · Interactivity 4

### E4. Walking through fire: fields as terrain, soot prints and ash puffs

*In plain words.* In Tibia a fire field is terrain. Pathfinding goes around it, but a player can step in by hand. Asterion adds what Tibia lacks, a flare under the feet on entry and soot prints after walking through ash.

*How it works (technical).*
- **Players** [V, S20]. `Tile::queryAdd` refuses a damaging field for a player only on a pathfinding move. A manual step goes through.
- **Monsters** [V, S20, S21]. A monster enters a damaging field only if immune, flagged `canWalkOnFire`, or ignoring field damage after taking a hit while random-stepping.
- **Step-in feedback** [I, note 13]. A 3-frame flare of 16x8 px in the tile's bottom third and 4 embers kicked from the feet.
- **Soot prints** [I, note 13; V, S3]. Reuse VFX #11's boot prints, 2 per tile, darkening the ground with a soot palette shift instead of carving depth. Leave them for the 3 tiles after an ash or charred tile and fade them over 10 s, Tibia's footprint time. Note 13 says 3x5 px. VFX #11 found 3x5 did not read at 1x and drew 4x6.
- **Ash puffs** [I, note 13]. On contact frames 0 and 2 over ash, 2 grey 2x2 particles rise 4 px and fade in 300 ms.
- **Burning walkers** [V, S110, S72; I, note 13]. In Enter the Gungeon a burning enemy ignites goop and a burning player does not. In SPD the burning buff seeds fire under its target each turn. Asterion should not let a burning player light grass by walking, or one player becomes a moving spread source.

*Cost / performance.* One sprite and 4 particles per step. Prints cost one byte per print cell in a decal field and no network data, because every client knows who walked where [I, note 13].

*Games that used it.*
- The Forgotten Server, `tile.cpp` (fields block pathfinding): https://github.com/otland/forgottenserver/blob/master/src/tile.cpp
- Enter the Gungeon (burning goop): https://enterthegungeon.wiki.gg/wiki/Goop

*How it feels.* A fire wall blocks a chase in PvP, and a trail of soot tells you who ran through the burn.

*Risks.* No game we read draws soot or ash prints [I, note 13]. Whether real Tibia lets click-to-walk path through fields was not checked.

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### E5. Damage text and hit flash

*In plain words.* Asterion's tile is Tibia's tile, so Tibia's floating numbers carry over unchanged. One white frame on the character per tick is the flash.

*How it works (technical).*
- **OTClient** [V, S30, S31, S40, S41]. Text lives 1000 ms in an 11 px rounded Verdana. It starts 8 px down and rises 48 px linearly, 1.5 tiles. Alpha falls from 833 ms to zero at 1000 ms. Two numbers of one colour merge if the first is under 400 ms old. Mehah halves the lifetime in optimize mode.
- **Fire colour** [V, S17; I, note 13]. `TEXTCOLOR_ORANGE` is 198, which OTClient's 6x6x6 colour cube turns into (255, 153, 0).
- **RPG Maker MV** [V, S60]. Digits live 90 frames, drop from 40 px above with gravity 0.5 and bounce at -0.6. A critical flashes red at 160/255 for 60 frames.
- **For Asterion** [I, note 13]. Copy OTClient with a pixel font of 7 to 8 px cap height. One white frame or 50 ms per damage tick, with damage ticks one second apart (the Sandbox's 10 per second while burning) so flashes stay under 3 per second. Keep MV's red flash for big hits, cut to 15 frames.

*Cost / performance.* The combat juice study drew 1,000 numbers at 0.25 ms per frame in WebGL2 [V, S11].

*Games that used it.*
- OTClient, `animatedtext.cpp`: https://github.com/mehah/otclient/blob/main/src/client/animatedtext.cpp
- RPG Maker MV, `Sprite_Damage.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Damage.js

*How it feels.* Players of Tibia-likes read it at once. With the 400 ms merge, a field tick and a burn tick landing together show as one number.

*Risks.* CipSoft's own client values were not checked, only OTClient's [I, note 13].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 3 · Interactivity 3

### E6. The crowd budget

*In plain words.* Twenty players with torches and a few burning ones on one screen. Lights are cheap at tile resolution. Overlays and particles are what to cap.

*How it works (technical).*
- **Lights** [V, S39, S22]. OTClient has no light cap. It drops a light that repeats the previous one's position and colour and rebuilds its one-texel-per-tile map only when a hash of the inputs changes. TFS gives each player one light.
- **Arithmetic** [I, note 13]. The view plus a margin is about 22 x 14 = 308 tiles. Fifty torch carriers make 15,400 distance checks per rebuild, about every frame when all of them walk, and a 1,232-byte upload. At 8 px cells the cost grows 16 times, and a cap starts to matter.
- **Drop order** [I, note 13]. First embers and smoke for other players more than 6 tiles away. Then the head flame on other burning players, then the rim light for others, then a wider merge window for their numbers, 400 to 800 ms. Never the tint or the HUD icon.
- **Others' effects** [V, S35]. Mehah draws effects and missiles from other sources at a set opacity.

*Cost / performance.* Building an 8 px light map from 30 sources costs 0.021 / 0.142 ms and a per-tile map 0.0025 / 0.016 ms [I, note 16, measured]. Our build loops over sources, so 50 torches cost more, but stay well under the apply pass.

*Games that used it.*
- OTClient (hash-gated light rebuilds): https://github.com/mehah/otclient/blob/main/src/client/lightview.cpp
- The Forgotten Server (one light per player): https://github.com/otland/forgottenserver/blob/master/src/player.cpp

*How it feels.* A plaza at night full of torches reads as a crowd, not a blaze.

*Risks.* No measured Godot cost for many burning sprites on low-end web [I, note 13].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 3

### Family F: Combat fire and lava

### F1. Areas built from 1-tile effects

*In plain words.* Tibia never draws a big explosion sprite. A great fireball is 37 copies of one 1-tile flame effect laid on a disc. The shape and the per-tile variants make the look.

*How it works (technical).*
- **Shapes** [V, S23, S24, S25, S26]. Great fireball, FIREAREA on `AREA_CIRCLE3X3`, 37 tiles. Explosion rune, EXPLOSIONAREA on `AREA_CROSS1X1`, 5 tiles. Fire bomb, field 1487 on `AREA_SQUARE1X1`, 9 tiles. Fire wall, 1487 on `AREA_WALLFIELD`, 5 tiles. Fire wave, HITBYFIRE on `AREA_WAVE4`, 12 tiles. Hell's core, FIREAREA on `AREA_CIRCLE5X5`, 73 tiles.
- **Overdraw** [V, S12; I, note 17]. FIREAREA is 53x53 px, 1.66 tiles, so neighbours overlap by about 21 px. The grid disappears under the overlap.
- **Variants** [V, S28, S35]. edubart picks the sprite by `offsetX % patternX`, Mehah by `position.x % pattern_x`.
- **Stagger** [V, S52; I, note 14]. Stardew starts its extra blast sprites with random delays of 0 to 700 ms. For Asterion, start the centre first and the ring 75 ms later, or add a random 0 to 300 ms delay so 37 tiles do not flash in step.
- **Crowding** [V, S35, S37; I, note 18]. Mehah refuses a second copy of an effect on a tile while the first is no older than the minimum duration times `max(phases / 3, 1)`. The minimum is 75 ms, or the idle animator's value when the dat has one. Otherwise it delays the new copy by a third of the old one's duration. The Sandbox only refuses repeats under 350 ms and does not delay [V, S6].
- **Light** [V, S44; I, note 14]. TibiaWiki gives fire effects a light radius of 4 to 6. Light the centre tile only, or one light per 3x3 block.

*Cost / performance.* One great fireball is 37 sprites for 820 ms. Ten mages casting at once make 370 sprites of 32x32 [I, note 14]. The juice study drew 1,000 numbers in 0.25 ms in WebGL2 [V, S11].

*Games that used it.*
- Tibia, Great Fireball Rune: https://tibia.fandom.com/wiki/Great_Fireball_Rune
- The Forgotten Server area arrays (`spells.lua`): https://github.com/otland/forgottenserver/blob/master/data/scripts/lib/spells.lua
- Stardew Valley bombs: https://stardewvalleywiki.com/Bomb

*How it feels.* At 640x360 a great fireball covers 7x7 tiles, 35% of the screen width. Hell's core covers more than half [I, note 14].

*Risks.* A light on every tile of a 37-tile area is far too much light. Flash only the centre tile, or the whole disc strobes [I, note 14].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 4

### F2. Effect and missile timing

*In plain words.* Tibia's combat look rests on two constants. An effect frame lasts 75 ms in the classic client, and a missile flies `150 x sqrt(distance)` ms in a straight line. Newer data stores a time per frame, and it follows a clear rule.

*How it works (technical).*
- **Classic client** [V, S28, S17; I, note 18]. `EFFECT_TICKS_PER_FRAME = 75`. An effect is removed after 75 x phases ms, and the last frame holds. Effect 33, `CONST_ME_SLEEP`, gets 4 times the frame time.
- **Per-frame data** [V, S12; I, note 17]. FIREAREA is 40 ms plus 13 x 60 ms, 820 ms. EXPLOSIONHIT eases from 35 to 110 ms over 8 frames, 660 ms. HITBYFIRE is 9 x 100 ms, FIREATTACK 8 x 100 ms and EXPLOSIONAREA 12 x 50 ms plus one 100 ms frame. The rule in the data is impacts at 50 to 60 ms, flames at 100 to 120 ms and liquids at 150 to 500 ms.
- **Missile** [V, S29, S36]. `m_duration = 150 * sqrt(m_delta.length())`, Euclidean distance in tiles, a linear slide, one still sprite chosen from 9 by direction. The FIRE missile's box is 27x22 px on diagonals and 15x26 vertical, light 5 [V, S12].
- **Flight table** [I, note 14]. 1 tile takes 150 ms (6.7 tiles/s), 3 tiles 260 ms (11.5), a (3, 3) diagonal 309 ms (13.7), 5 tiles 335 ms (14.9), 7 tiles 397 ms (17.6), 9 tiles 450 ms (20.0). A 7-tile missile moves 9.4 px per frame at 60 fps.
- **Damage first** [V, S11]. Tibia applies damage when the server sends the missile, so the missile is visual only.
- **Head** [I, note 14]. A visible fireball of 12 to 16 px in a 32x32 cell. Optional afterimages, 2 to 3 spaced 8 to 12 px, 1 and 2 palette steps darker.

*Cost / performance.* Nothing to measure. One sprite per missile, one per effect tile.

*Games that used it.*
- OTClient `effect.cpp`: https://github.com/edubart/otclient/blob/master/src/client/effect.cpp
- OTClient `missile.cpp`: https://github.com/edubart/otclient/blob/master/src/client/missile.cpp
- Zelda: A Link to the Past (Fire Rod, 3 impact frames of 133 ms): https://zeldawiki.wiki/wiki/Fire_Rod

*How it feels.* Every missile lands in 150 to 450 ms, so combat reads fast at any range.

*Risks.* The match between client effect ids and `const.h` names is an inference [I, note 17]. The two timing models must not be mixed in one client.

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 4

### F3. Explosions, scorch decals and shake at 640x360

*In plain words.* An explosion at 32 px is 6 to 13 frames at 50 to 90 ms, sized in tiles. It leaves a scorch decal that fades in seconds. The camera shakes in whole pixels, and only for the local player.

*How it works (technical).*
- **Packs** [V, vendor, S137; V, S138]. pimen's 32x32 explosions run 9 to 13 frames, 48 px ones 7 to 14 and 64 px ones 10 to 18, all at 70 ms. Reactorcore's sheets are 16 frames, CC0.
- **Tibia** [V, S12]. EXPLOSIONHIT is 35x35 px over 660 ms and EXPLOSIONAREA 31x31 over 700 ms.
- **Stardew** [V, S52, S53]. A central 6-frame sprite carries a light whose radius equals the blast radius. 45% of the tiles on the disc get a delayed extra sprite. Every tile gets a ring sprite whose frame time is its distance from the centre times 20 ms, so the blast seems to slow as it spreads. Bombs have radius 3, 5 and 7.
- **RPG Maker MV** [V, S58]. Painted 192x192 cells, scaled and rotated at 15 fps, 4 tiles across at 48 px. It does not suit strict pixel art.
- **Plan** [I, notes 11, 14]. A 1-tile hit is one 32x32 sprite of 6 to 8 frames at 75 ms. Frame 1 is a white or pale yellow flash of 20 to 24 px, frames 2 to 4 grow to 32 px, the rest break into 2 or 3 grey puffs. A 64 px blast in a non-Tibia style runs 10 to 12 frames at 70 to 80 ms. Debris is 2 to 6 particles of 2x2 px living 300 to 500 ms. One white frame only.
- **As built** [V, S6]. The Sandbox has no 64x64 explosion. It tiles a 14-frame area effect (40 ms, then 13 x 60 ms) in a 56 px canvas over a 3x3 area or the 37-tile disc, rings 75 ms apart, and refuses repeats under 350 ms. Scorch decals fade over 4.5 s. Shake is 2 or 5 px, capped at 6.
- **Scorch** [I, note 14]. A 32x32 decal per tile, 2 or 3 variants, fading over 3 to 5 s on the client. Lasting scars belong to the spread system (C4).
- **Shake** [V, S11; I, note 14]. The juice study uses trauma squared, a 6 px cap, half vertical, decay 1.5 per second, no rotation. Note 14's presets for Asterion are 0 px for your fireball, 1 px for your fire bomb, 2 px for a big blast within 3 tiles, 6 px for a boss slam, 0 for strangers. The Sandbox uses louder steps for a demo, 2 px and 5 px with a 6 px cap [V, S6]. I would ship note 14's. Nuclear Throne's 6 px pistol kick at 320x240 would be 12 px here, too much for an MMO [U, note 14].

*Cost / performance.* The juice study found every shake method within 0.05 ms of none [V, S11].

*Games that used it.*
- Stardew Valley (`GameLocation.explode`): https://github.com/E-riCA0/StawdewValley/blob/HEAD/GameLocation.cs
- pimen Explosion Effect (frame counts by size): https://pimen.itch.io/explosion-effect
- Vlambeer, "The Art of Screenshake": https://www.youtube.com/watch?v=AJdEqssNZ-U

*How it feels.* Heavy and short. Two white frames on 37 tiles look like a strobe [I, note 14].

*Risks.* No shipped game gives an explosion shake amplitude at this size [I, note 14]. Pack frame counts are seller pages.

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 3

### F4. Lava at 32 px

*In plain words.* Lava changes slowly. Tibia's open lava is 3 frames of 500 ms on a 32 px tile with 8 position variants. Asterion can match that tempo with a palette cycle that costs one uniform for a whole lake.

*How it works (technical).*
- **Tibia** [V, S12, S14, S43]. Classic lava 727 and 2144 is opaque 32x32 art with a 4x2 pattern, 3 synchronised frames of 500 ms and light 4 in colour 193. Newer lava 728 runs 30 frames of 150 ms, a 4.5 s loop. Edge strips are 32x16. Lava is not walkable, and items thrown in burst into flames.
- **Stardew** [V, S50, S51; I, note 18]. Volcano lava reuses the water animation, 10 frames of 200 ms, with a checkerboard of two variants by `(x + y) % 2`. A slow scroll moves about 3.2 art px/s on a 16 px tile, about 6 px/s at 32 px. Steam is a 10x10 puff every 5,000 ms.
- **Plan** [I, note 14]. Four tile variants picked by `x % 2, y % 2`. Two dark crust plates of 8 to 14 px per tile and cracks 2 to 3 px wide. Five hot entries on the crack pixels, cycled at 8 steps per second, a 625 ms period. A dark rim of 2 to 3 px on the lava side and a 2 px glow band on the ground side, drawn as an autotile border. One light per 3x3 block.
- **Hue** [I, note 17]. Tibia lights flames in warm yellow (206) and lava in red-orange (193).

*Cost / performance.* One palette uniform per frame for any number of lava tiles [I, note 14]. A noise shader over the whole screen costs 0.022 ms of GPU time (B5).

*Games that used it.*
- Tibia lava: https://tibia.fandom.com/wiki/Lava
- Stardew Valley, Volcano Dungeon: https://stardewvalleywiki.com/Volcano_Dungeon

*How it feels.* Heavy and slow. Fast lava reads as water painted orange.

*Risks.* 1 px cracks read as noise at 32 px [I, note 14]. Neither game palette-cycles in code. Both swap frames [I, note 18].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 2

### Family G: Cost and Godot

### G1. The measured frame: light apply is the biggest layer

*In plain words.* We timed a whole fire frame at 640x360. The light map and the smoke draw take almost two thirds of it, because they touch every art pixel. On the GPU each is one texture read.

*How it works (technical).*
- **Frame contents** [I, note 16]. The spread grid ticked every 15th frame, a ground copy, the burn front on 20% of the tiles, 150 drawn loops, 512 embers, an 80x45 smoke field, an 80x45 light map from 30 sources with nearest apply, the palette pass and `putImageData`.
- **Shares** [I, note 16, measured]. On the desktop at 640x360, light build plus apply is 44%, smoke 18%, the burn front 12%, the palette pass 10%, drawn loops and `putImageData` 6% each, embers and the ground copy 1% each.
- **Lit pixels, not map cells** [V, S6]. The Sandbox skips tier-0 blocks, so its light apply costs 0.24 ms by day at idle and 0.47 ms with 160,123 lit px in the burning showcase. A fire scene pays more for light than a quiet one.
- **Tricks that helped** [I, note 16, measured]. Writing a light cell's run without the dither lookup when its tier cannot change drops the apply from 0.281 to 0.208 ms. Skipping zero spans cuts the plume draw 2.8 times.
- **Shader path** [I, note 16]. Moving light apply and smoke draw into the final fragment shader would leave about 0.24 ms on the desktop and 1.6 ms throttled, an estimate from the layer table.

*Cost / performance.* The default frame costs 0.624 / 4.90 ms at 640x360 and 0.206 / 1.24 ms at 320x180, with 0.631 ms on SwiftShader [I, note 16, measured]. It has no ground render. VFX #11's ground render cost 1.44 / 8.85 ms, so with one of that size fire would be about 30% of a CPU frame [I, note 16].

*Games that used it.*
- VFX #11 (the ground shader that replaced its CPU loop): https://kingsfoil-artifacts.netlify.app/vfx-snow-32px-topdown-pixel
- OTClient (a light map drawn with one multiply pass): https://github.com/mehah/otclient/blob/main/src/client/lightview.cpp

*How it feels.* Invisible. It decides whether a phone holds 60 fps.

*Risks.* The shader path was not built. The throttled per-layer sum (3.76 ms) does not match the throttled frame (4.90 ms), so read the layers as shares only [I, note 16].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 1

### G2. Whole-texture uploads and small R8 fields

*In plain words.* Godot's web renderer replaces a whole texture on every update. So keep every live field small and in one byte per cell, and put all DOOM patches in one atlas.

*How it works (technical).*
- **Godot** [V, S169, S188, S187]. `ImageTexture.update()` needs the same size, format and mipmaps and is faster than `set_image`, which reallocates. Godot 4 has no `set_data`. On GLES3 the update ends in `glTexImage2D` for the whole texture, and the proposal for partial updates is still open.
- **Bytes per update** [I, note 16]. The spread state is 240 bytes per view, the burn progress 240, the light map at 8 px 3,600, the smoke field at 8 px 3,600, twenty DOOM torches in one atlas 3,840. The 128x128 burn-order map is 16,384 bytes, uploaded once. A final 640x360 RGBA8 frame is 921,600 bytes, 55.3 MB/s at 60 fps.
- **One atlas** [I, note 12]. A 128x128 R8 atlas holds about 10 campfire patches and moves 492 KB/s at 30 updates per second.

*Cost / performance.* In WebGL2 every upload pays about 0.015 ms of fixed cost, so any field under about 15 KB costs the same as an empty one. An 80x45 R8 field costs 0.016 ms, a 128x96 DOOM buffer 0.016 ms, a 640x120 band 0.024 ms, a 640x360 R8 texture 0.034 ms and the 640x360 RGBA8 frame 0.091 ms, wall time on the Metal run [I, note 16, measured]. These are WebGL numbers, not Godot's.

*Games that used it.*
- OTClient (uploads its light map only when the hash changes): https://github.com/mehah/otclient/blob/main/src/client/lightview.cpp
- Godot proposal #13012 (the missing partial update): https://github.com/godotengine/godot-proposals/issues/13012

*How it feels.* Nothing to see, unless it hitches.

*Risks.* No measured `ImageTexture.update()` time on the web exists [I, note 12].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 2 · Interactivity 2

### G3. Particles on the web

*In plain words.* GPUParticles2D works in a browser, but each system can take seconds to compile on a cold load. Embers belong in a custom pool or CPUParticles2D.

*How it works (technical).*
- **Missing on Compatibility** [V, S170]. `emit_particle()` works only on Forward+ and Mobile. `amount_ratio` below 1 saves nothing, because all particles are allocated and processed. `fixed_fps` defaults to 30.
- **Compile cost** [V, S182]. Issue #87843 reports "around 2 seconds to load" one default GPUParticles2D on a web export. A 2024 comment says pre-warming 4 systems froze the browser for 30 to 60 s. A comment of 1 Nov 2026 on 4.7.2 reports 22 to 25 s per GPUParticles3D process material, about 93 s for four.
- **Shaders too** [V, S183]. CanvasItem shaders load much slower the first time on Compatibility than on Forward+ or Mobile.
- **Docs** [V, S172]. CPUParticles2D "may perform better on low-end systems", and no new features are planned for it.

*Cost / performance.* A 512-ember pool costs 0.0033 / 0.021 ms in JavaScript [I, note 16, measured]. A custom pool in one MultiMesh, or CPUParticles2D, skips the compile entirely [I, note 12].

*Games that used it.*
- Godot issue #87843: https://github.com/godotengine/godot/issues/87843
- Godot 2D particle docs: https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html

*How it feels.* A 2 s freeze the first time someone casts a fireball.

*Risks.* We did not check whether the 4.8 betas change the compile cost [I, note 12].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 3 · Pixel taste 3 · Mood 3 · Interactivity 2

### G4. PointLight2D limits and a baked light texture

*In plain words.* Godot's 2D lights on the web loop over up to 15 lights per drawn item. A baked light texture sampled once by the ground shader costs the same for one fire or fifty.

*How it works (technical).*
- **Source, 4.7-stable** [V, S174, S175]. Lights are applied in the item's own pass. Each item gathers up to `MAX_LIGHTS_PER_ITEM - 1` = 15 lights, and a render holds 256, or 64 when the GPU's uniform buffer is under 64 KB. The fragment shader does one atlas fetch per light. An item that switches between lit and unlit breaks the batch.
- **Docs** [V, S173, S176]. Larger lights cost more because they touch more pixels. Additive sprites are much faster and suit short flashes, but cannot light dark areas. The `max_renderable_lights` and `max_lights_per_object` settings are for 3D.
- **Baked** [I, note 12]. An 80x45 R8 texture at 8 px cells, 3,600 bytes per update, sampled once per pixel. Tibia's hues by source are warm yellow for flames, red-orange for lava and near-white for explosions [I, note 17].

*Cost / performance.* The baked build costs 0.021 / 0.142 ms for 30 sources, and its apply is G1's largest layer on the CPU [I, note 16, measured]. PointLight2D fill cost was not measured.

*Games that used it.*
- OTClient (a baked light map per tile): https://github.com/mehah/otclient/blob/main/src/client/lightview.cpp
- Godot 2D lights docs: https://docs.godotengine.org/en/stable/tutorials/2d/2d_lights_and_shadows.html

*How it feels.* Every torch in a crowd lights the ground, with no light dropping out when a 16th one walks in.

*Risks.* A baked map cannot cast sharp shadows. Use PointLight2D, if at all, for one or two hero lights [I, note 12].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Mood 4 · Interactivity 2

### Family H: Frontier

### H1. GPU fire buffers: DrawableTexture2D and SubViewport ping-pong

*In plain words.* Run the DOOM fire on the GPU in two textures that take turns. Godot 4.7's `DrawableTexture2D` makes that possible without SubViewports. Nobody has tested it on the web.

*How it works (technical).*
- **The class** [V, S180, S178]. Merged on 30 Jan 2026 for 4.7, 46 files and 2,417 added lines. In 4.7-stable `setup`, `blit_rect` and `blit_rect_multi` are experimental. Formats are RGBA8, RGBA8_SRGB, RGBAH and RGBAF, and GLES3 implements it. The docs do not say whether a texture may be its own blit source.
- **Open bugs** [V, S181]. #123507, `setup()` gives an empty texture on D3D12 Forward+. #121113 and #119928 are also open. No issue mentions the web.
- **GPU DOOM** [I, note 12, measured]. A fragment shader cannot scatter, so it gathers, `out(x, y) = in(x + o, y + 1) - d` with o in {-1, 0, 1, 2} and d from a hash. It gives the clean height, 71 rows at L = 36, not the in-place 95.
- **Before 4.7** [V, S177; K]. Two SubViewports with `CLEAR_MODE_NEVER`, each sampling the other, alternated with `UPDATE_ONCE`. RGBAH and RGBAF need `EXT_color_buffer_float` on WebGL2, so use RGBA8 [K, S184].

*Cost / performance.* A 128x128 fire atlas is 16,384 fragments, 7% of a 640x360 screen, and 65,536 bytes of VRAM per buffer with no CPU upload [I, note 12]. The noise fire bench (B5) is the nearest measured proxy.

*Games that used it.*
- GodotCon 2026, "Procedural Pixel Art: Retro VFX with Shaders": https://talks.godotengine.org/godotcon-ams-2026/talk/NSNXFT/
- Godot PR #105701: https://github.com/godotengine/godot/pull/105701

*How it feels.* The same flames as B4 with nothing crossing the bus. Each client's flames differ, which is fine for a cosmetic layer.

*Risks.* Experimental, untested on WebGL2 [V, S178]. A 30-line test project would settle it.

*Ratings 1–5 (author judgement):* Simplicity 2 · Speed 4 · Pixel taste 3 · Mood 4 · Interactivity 2

### H2. Fire seeded from sprite masks and painted cooling maps

*In plain words.* At 32 px the artist can steer a buffer fire. Seed the heat from the burning part of a sprite, a roof ridge or a tree crown, and paint where the tongues rise with a small cooling map.

*How it works (technical).*
- **Seeds** [V, S160; I, note 12]. Lode seeds object edges to make "flaming text". A roof fire seeded along the ridge burns in the roof's shape.
- **Cooling map** [V, S161; S2]. Hugo Elias subtracts a smoothed random map, values 0 to about 10 after about 20 smoothing passes, scrolled up with the flames. Shapes painted into it appear in flame.
- **At 32 px** [I, note 12]. A tileable 32x64 cooling map scrolling at the convection speed, painted by an artist. The noise shader's silhouette mask (B5) is the same idea on the GPU.

*Cost / performance.* One extra read per pixel. Lode-style averaging in the sim cuts lone pixels to 0.1% at 5 tones [I, note 12, measured].

*Games that used it.*
- Lode's fire tutorial: https://lodev.org/cgtutor/fire.html
- Hugo Elias, fire (archived): https://web.archive.org/web/2016/http://freespace.virgin.net/hugo.elias/models/m_fire.htm

*How it feels.* Art-directed fire. The tongues rise where the artist wants them.

*Risks.* No shipped game at this scale does it [I, note 12]. A full-size map per fire costs memory unless it tiles.

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 4 · Pixel taste 4 · Mood 5 · Interactivity 3

---

## 5. Comparison scorecard

All ratings are author judgement. "Sum" is a crude total. A low-sum row such as G2 or G3 can still decide whether the game loads and runs.

| # | Technique | Simpl. | Speed | Pixel taste | Mood | Interact. | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Base resolution 640x360, buffers that grow | 5 | 5 | 5 | 3 | 1 | 19 |
| A2 | Spread grid per tile, rolled at 1 Hz | 5 | 5 | 3 | 4 | 5 | 22 |
| A3 | Light map and smoke field resolution | 4 | 4 | 4 | 4 | 2 | 18 |
| B1 | Drawn flame loops sized by the tile | 4 | 5 | 5 | 5 | 2 | 21 |
| B2 | Tibia overflow sprites, 16 position variants | 5 | 5 | 5 | 4 | 3 | 22 |
| B3 | Dying fire: smaller, slower, dimmer | 5 | 5 | 5 | 5 | 2 | 22 |
| B4 | DOOM buffers 1:1 and 1:2, height rule, smoothing | 4 | 4 | 3 | 4 | 3 | 18 |
| B5 | GPU noise fire quantized to the palette | 3 | 5 | 3 | 4 | 2 | 17 |
| B6 | Stacked copies, jitter, particle-only fire | 5 | 5 | 3 | 3 | 2 | 18 |
| C1 | Burn-order map with entry direction | 3 | 4 | 5 | 5 | 4 | 21 |
| C2 | Continuous arrival-time front | 2 | 4 | 5 | 5 | 4 | 20 |
| C3 | Whole-tile swap and scorch autotiles | 5 | 5 | 3 | 2 | 3 | 18 |
| C4 | Tile states, burnt tileset, embers, ash, regrowth | 4 | 5 | 5 | 4 | 4 | 22 |
| C5 | Trees and houses in stages | 3 | 5 | 5 | 5 | 4 | 22 |
| D1 | Smoke field drawn with clusters | 4 | 4 | 4 | 4 | 3 | 19 |
| D2 | Hero puffs scaled by the tile | 5 | 5 | 5 | 5 | 2 | 22 |
| D3 | Embers and sparks at 2x2 px | 5 | 5 | 4 | 4 | 2 | 20 |
| E1 | Burning overlay on a 24x32 character | 4 | 5 | 4 | 5 | 4 | 22 |
| E2 | Carried torch through a 4-frame walk | 3 | 5 | 5 | 5 | 4 | 22 |
| E3 | Warm rim light and fire shadow | 3 | 4 | 4 | 5 | 4 | 20 |
| E4 | Walking through fire, soot prints, ash puffs | 4 | 5 | 4 | 4 | 5 | 22 |
| E5 | Damage text and hit flash | 5 | 5 | 4 | 3 | 3 | 20 |
| E6 | Crowd budget | 4 | 5 | 3 | 3 | 3 | 18 |
| F1 | Areas built from 1-tile effects | 5 | 5 | 5 | 4 | 4 | 23 |
| F2 | Effect and missile timing | 5 | 5 | 4 | 4 | 4 | 22 |
| F3 | Explosions, scorch decals, shake | 4 | 5 | 4 | 5 | 3 | 21 |
| F4 | Lava at 32 px | 4 | 5 | 4 | 4 | 2 | 19 |
| G1 | Measured frame, light apply the biggest layer | 4 | 5 | 3 | 3 | 1 | 16 |
| G2 | Whole-texture uploads, small R8 fields | 4 | 5 | 3 | 2 | 2 | 16 |
| G3 | Particles on the web | 3 | 3 | 3 | 3 | 2 | 14 |
| G4 | PointLight2D limits, baked light texture | 4 | 4 | 4 | 4 | 2 | 18 |
| H1 | GPU fire buffers on DrawableTexture2D | 2 | 4 | 3 | 4 | 2 | 15 |
| H2 | Fire seeded from masks and cooling maps | 3 | 4 | 4 | 5 | 3 | 19 |

**Reading the table.** The top row is Tibia's own answer. Areas built from 1-tile effects (F1, 23) cost a sprite per tile and look drawn. A cluster at 22 follows, and almost all of it is drawn art driven by tile state: overflow sprites (B2), dying stages (B3), tile states (C4), trees and houses (C5), hero puffs (D2), the character additions (E1, E2, E4), the 1 Hz roll (A2) and Tibia's timing (F2). The simulated looks sit lower. DOOM buffers (B4) and noise fire (B5) score 18 and 17 because raw they look like programmer art next to 32 px tiles, and they need smoothing or a painted mask to reach taste. The burn-order map (C1, 21) is the one per-pixel technique that earns its place, since nothing else hides square fronts. The plumbing rows (G1 to G4, H1) score low because nobody sees them. G3 decides whether the first fireball freezes the browser [I].

---

## 6. Deep dives

### 6a. Measured costs: what the fire engine costs at 640x360

Our measurements [I, note 16, measured; S7]. Apple M4 Pro, macOS 26.5.1, Chromium 153.0.8010.12 driven by Playwright 1.63.0, 13 Nov 2026. These are browser JavaScript and WebGL2 numbers on one machine. **They are not Godot numbers.** The Sandbox's own per-layer timings are a separate set and sit in §8.

**Method.** A CPU test warms up for 200 ms and takes 31 samples, each calling the function until 10 ms pass. The tables give the median of the 31 sample means. A WebGL2 test measures the slope between a batch of 1 frame and a batch of K frames, each ending in a 1x1 `readPixels`. Engines are compiled fresh per test and keep RNG state in an `Int32Array`, the two harness rules from VFX #11 [S3].

**The setups.** "GPU run" is full Chromium on ANGLE Metal. "SwiftShader" is chromium-headless-shell with a CPU rasteriser. "6x throttle" is the GPU run's build with `Emulation.setCPUThrottlingRate` 6 [V, S189]. We quote the "GPU run median" for a desktop and the "6x throttle median" for the low-end case.

**DOOM buffers** (heat 0 to 36, step plus quantize to 5 tones plus draw into the index buffer).

| Buffer, art px (cells) | GPU run median, ms | 6x throttle median, ms |
|---|---|---|
| Torch 8x24, 1:1 (192) | 0.0012 | 0.0084 |
| Torch 8x24, 1:2 (48) | 0.00039 | 0.0025 |
| Campfire 32x48, 1:1 (1,536) | 0.0086 | 0.057 |
| Campfire 32x48, 1:2 (384) | 0.0026 | 0.016 |
| Bonfire 64x96, 1:1 (6,144) | 0.033 | 0.217 |
| House front 128x96, 1:1 (12,288) | 0.067 | 0.417 |
| House front 128x96, 1:2 (3,072) | 0.019 | 0.122 |
| Full-width band 640x120, 1:1 (76,800) | 0.388 | 2.52 |
| Full-width band 640x120, 1:2 (19,200) | 0.109 | 0.714 |
| 20 torches 8x24, 1:1 (3,840) | 0.024 | 0.158 |

A cell costs 3.9 to 5 ns per step. Draw is 15 to 38% of step plus draw, and the quantize costs 0.0014 ms for a campfire at 4, 5 or 6 tones alike.

**Drawn loops** (cached frames copied into the index buffer; flames of 6x10 to 24x32 px, 6 frames at 10 fps).

| Flames | GPU run median, ms | 6x throttle median, ms |
|---|---|---|
| 50 | 0.011 | 0.073 |
| 150 | 0.034 | 0.213 |
| 200 | 0.045 | 0.278 |
| 800 | 0.179 | 1.17 |

Canvas `drawImage` on SwiftShader costs 0.594 ms for 800 flames from small canvases and 0.800 ms from one atlas. The GPU-run canvas rows were a readback artifact and are not quoted.

**Burn front at art resolution.**

| Burning share (GPU run median / 6x throttle median, ms) | Art burn-order map | Bayer 4 | Whole-tile swap |
|---|---|---|---|
| 10%, 24 tiles | 0.039 / 0.246 | 0.036 / 0.234 | 0.011 / 0.066 |
| 20%, 48 tiles | 0.082 / 0.515 | | |
| 50%, 120 tiles | 0.210 / 1.30 | 0.179 / 1.08 | 0.060 / 0.382 |
| 100%, 240 tiles | 0.417 / 2.88 | 0.348 / 4.00 | 0.116 / 0.720 |
| 320x180, 20% of 16 px tiles, for scale | 0.021 / 0.131 | | 0.0059 / 0.038 |

**Spread grid** (active list, VFX #6 rule, 75% fuel).

| Grid (GPU run median / 6x throttle median, ms per tick) | Mean burning | Per tick | Per second at equal px/s |
|---|---|---|---|
| 32 px tiles, 20x12 on screen, 4 Hz | 85 | 0.0036 / 0.024 | 0.014 / 0.10 |
| 16 px cells, 40x23, 8 Hz | 336 | 0.015 / 0.098 | 0.12 / 0.78 |
| 8 px cells, 80x45, 16 Hz | 1,272 | 0.059 / 0.389 | 0.94 / 6.2 |
| Server 256x256 tiles, active list | 6,361 | 0.286 / 1.75 | |
| Server 256x256 tiles, active list | 18,692 | 0.909 / 6.05 | |
| Server 256x256, full moisture sweep each tick | 6,525 | 0.392 / 2.52 | |

About 45 ns per burning cell at every size. 1,000 to 5,000 burning tiles on a server area would cost about 0.05 to 0.23 ms per tick, interpolated, not measured.

**Smoke field.**

| Smoke (GPU run median / 6x throttle median, ms) | 4 px cells (160x90) | 8 px cells (80x45) | 16 px cells (40x23) |
|---|---|---|---|
| Advect + decay, VFX #6 code (3 Float32 channels) | 0.244 / 1.50 | 0.055 / 0.366 | 0.015 / 0.092 |
| Advect + decay, 1 Uint8 channel | 0.035 / 0.214 | 0.0095 / 0.060 | 0.0028 / 0.018 |
| Draw plumes, 2x2 cluster, bilinear, zero spans skipped | 0.158 / 1.04 | 0.099 / 0.606 | 0.115 / 0.757 |
| Draw stress field (31% covered), same | 0.326 / 2.22 | 0.253 / 1.67 | 0.233 / 1.47 |

At 8 px the plume draw without skipping costs 0.273 / 1.68 ms, with Bayer 4 0.283 / 1.70 ms and with nearest sampling 0.137 / 1.22 ms.

**Light map** (30 sources).

| Light map (GPU run median / 6x throttle median, ms) | 32 px cells | 8 px cells | 4 px cells |
|---|---|---|---|
| Build | 0.0025 / 0.016 | 0.021 / 0.142 | 0.084 / 0.547 |
| Apply, nearest, Bayer band | 0.281 / 1.87 | 0.294 / 1.98 | 0.289 / 2.65 |
| Apply, nearest, flat runs | 0.208 / 1.44 | 0.240 / 1.61 | 0.281 / 1.90 |
| Apply, bilinear | 0.473 / 3.23 | 0.505 / 3.25 | 0.520 / 3.47 |

**Embers, palette and present.** 512 embers cost 0.0033 / 0.021 ms and 4,096 cost 0.030 / 0.196 ms. The 640x360 palette pass costs 0.059 / 0.388 ms and `putImageData` with a 1 px sync 0.033 / 0.200 ms.

**Uploads and the GPU fire.**

| WebGL2 pass | Bytes or pixels | GPU run wall median, ms | GPU run timer (Metal), ms | SwiftShader wall median, ms |
|---|---|---|---|---|
| No upload, 1 px draw | 0 | 0.00033 | 0.00025 | 0.015 |
| Smoke 80x45 R8 upload | 3,600 | 0.016 | 0.018 | 0.018 |
| 640x360 R8 upload | 230,400 | 0.034 | 0.023 | 0.039 |
| 640x360 RGBA8 upload | 921,600 | 0.091 | 0.057 | 0.095 |
| Noise fire, full screen, 5 octaves | 230,400 px | 0.027 | 0.022 | 0.510 |
| Noise fire, 640x120 band | 76,800 px | 0.0079 | 0.0076 | 0.170 |
| Noise fire, 320x180 target | 57,600 px | 0.0077 | 0.0075 | 0.134 |

**The whole frame.** Spread grid at 32 px ticked at 4 Hz, a ground copy, the burn front on 20% of tiles, 150 drawn loops, 512 embers, 8 px smoke, an 8 px light map, the palette pass and `putImageData`. At 320x180 the same scene keeps its cell counts.

| Default frame, "Default at 640x360" and "at 320x180" rows | GPU run median, ms | SwiftShader median, ms | 6x throttle median, ms | Share of 16.7 ms, throttled |
|---|---|---|---|---|
| 640x360 | 0.624 | 0.631 | 4.90 | 29% |
| 320x180 | 0.206 | 0.204 | 1.24 | 7% |
| Ratio | 3.0 | 3.1 | 3.9 | |

**What the tables say** [I, note 16].
- **Pixel passes approach the 4 times pixel ratio, fields stay flat.** Burn front 3.7, loops 3.3, smoke 2.4, light 2.8 and palette 3.9 times at 640 against 320.
- **The light map is the frame.** The "Light map build + apply" layer row is 0.274 of the 0.624 ms desktop frame, 44%, almost all of it the apply. Smoke advect plus draw follows at 18%. On the GPU each would be one texture read.
- **A DOOM band is the only flame cost that matters.** 2.52 ms throttled at 1:1. Twenty 1:1 torches cost less than 1% of the throttled budget.
- **Bayer saves nothing worth having.** 8 to 17% on the burn front, nothing on smoke.

**Not measured** [I, note 16].
- Godot itself. No GDScript, no `ImageTexture.update()`, no CanvasItem shader, no draw-call batching. VFX #6 measured GDScript at 15 to 50 times slower than V8 on per-cell loops [S2].
- A ground render, characters and objects. VFX #11's ground render was 1.44 / 8.85 ms [S3].
- Any phone. The throttle slows the main thread, not the GPU process.
- The shader paths for light and smoke, and accelerated-canvas `drawImage` without a readback.

### 6b. The conversion table: VFX #6 numbers at 32 px

VFX #6 stated its values at 320x180 with 8 px cells [S2]. "Tile" means the value scales with the 32 px tile. "Character" means it follows the 24x32 sprite. Converted values are arithmetic or proposals [I] unless a source is cited.

| VFX #6 value (8 px cells, 320x180) | At 32 px tiles, 640x360 | Follows | Note |
|---|---|---|---|
| Spread cell 8 px, 40 x 23 grid at 320x180 | One cell per tile, 20 x 12 = 240 per view. That is 3.8 times fewer than the 920 cells of VFX #6's grid, and 15 times fewer than 8 px cells at 640x360 | Tile | [I, note 15] |
| Server tick 4 Hz, spread rolled every tick | 4 Hz for events, rain and water. Spread rolled at 1 Hz per tile, on ticks where `(tick - t_ignite) % 4 == 0` and `tick > t_ignite` | Tile | [I, note 15; V, S6] |
| IGNITING, 1 tick | Catching drawn on the client only. A tile that waits a roll before spreading halves the front | Tile | [V, S6] |
| Ignite p, grass 0.15 to oil 1.0 | Unchanged, tree 0.22 and wood 0.30 in the Sandbox | Constant | [I, note 15; V, S6] |
| Burn 3, 2, 4, 3, 12, 20, 6 ticks (0.5 to 5 s) | Counted in rolls at every grid size. Green grass 5 (not 3), dry grass 2, hay 4, oil 6, fence 12, tree 24, wood 30 | Roll | [V, S6] |
| Front 16.5 to 32 px/s | Green grass 0.47 / 0.52 / 0.51 and dry grass 0.91 / 0.90 / 0.91 tiles/s at 32 / 16 / 8 px. The naive port runs 66 to 128 px/s | Tile | [V, S6; I, note 15, measured] |
| Alexandridis wind | x1.25 straight downwind at 5 m/s, about x1.03 on diagonals. Green grass +13% downwind, upwind fronts die in 10 of 12 runs | Constant | [V, S6] |
| Embers 2 to 8 ticks | 4 to 10 s | Tile | [I, note 15] |
| Ash "regrows after minutes" | Ash 60 to 120 s, full grass after 5 to 10 min | Tile | [I, note 15] |
| Budget 60 points, 8 per cell (7 cells) | 7 to 9 tiles per firebomb, 8 points per tile | Tile | [I, note 15] |
| Ignition events, screen-high grass front | 93 per s becomes 6 per s | Tile | [I, note 15] |
| Smoke field 80x45 at 4 px cells | 80x45 at 8 px cells. A tile emits 16 times a cell's amount into its top 2x2 cells | Tile | [I, note 15] |
| Smoke CA 0.077 ms in Node at 320x180 | 0.0095 / 0.060 ms with one Uint8 channel at 8 px | Field cells | [I, note 16, measured] |
| Chimney puff, 10x10 sprite at scale 2 to 9.5, 6.25 s | 8 to 10 px growing to 32 to 47, 15 px/s, 2 to 3 tiles | Tile | [I, note 15] |
| Embers 1 px, pool of 256 | Embers 2x2, sparks 1 px for 3 to 8 frames, pool of 512 | Pixel rule | [I, note 11; S6] |
| Embers 8 to 15/s on a burning creature | 6 to 8/s per burning character | Crowd | [I, note 13] |
| Flame loop 4 to 6 frames, 4 tones, 1 row held | 6 to 8 frames, 5 tones, 2 to 3 rows held | Tile | [I, note 11] |
| "Stardew torch" 12x11, 4 x 100 ms | That is the campfire flame. The floor torch is 8x8, 7 x 100 ms, 12 px at our scale | Tile | [V, S47; I, note 10] |
| Torch flame (sandbox) | 10x16 px on posts, about 6x8 px carried | Tile / Character | [I, lead] |
| DOOM torch patch 16x32, 512 updates | 8x24 px at 1:1 is 192 cells. A 16 px flame needs L = 6 in Sanglard's in-place loop, or L = 8 double-buffered at p = 0.5 | Tile | [I, notes 12, 16; figure agent] |
| DOOM height "about 72 rows" | 95 rows in place on a wide or wrapped buffer, 73 double-buffered, by the row where half the columns are lit. A 64-column padded patch gives 69 | Constant | [I, notes 12, 18, measured; figure agent] |
| DOOM palette, 37 entries | 5 tones in unequal bands after a 3x3 average | Pixel rule | [I, note 12] |
| Fireball head 8 to 12 px | 12 to 16 px visible in a 32x32 cell | Tile | [I, note 14] |
| Fireball 3 to 4 frames at 10 to 12 fps | Effects at 75 ms per frame, missiles `150 x sqrt(d)` ms | Tile | [V, S28, S29] |
| Explosion, flash, ring, smoke | 32x32 in 6 to 8 frames at 75 ms. 64x64 in 10 to 12 frames at 70 to 80 ms | Tile | [I, notes 11, 14] |
| Fire field 3x3, wall 1x5, TFS stages 3 x 120 s | Same shapes. Canary's stages 200, 148, 98 s. Flames 49x47 px in a 64x64 canvas | Tile | [V, S14, S12] |
| Shake, light 1 px, heavy 2 to 4 px | 0 to 2 px for normal hits, 6 px cap, local player only | Screen | [I, note 14] |
| Burn status, 2 to 3 flame sprites | Two 8x10 px flames plus a 6x8 head flame on even seconds | Character | [I, note 13; V, S6] |
| Burn tick every 2 s, number and red flash | One damage tick per second (Sandbox, 10 per second), an orange number rising 48 px in 1 s, a 50 ms white flash | Tile | [V, S31, S6; I, note 13] |
| Light glow per burning cluster | 80x45 light map at 8 px cells, dither band δ ≈ 0.026 | Field cells | [I, note 12] |

Three traps hide in this table. Per-tick rates scale with the cell, which is why the spread table needs the 1 Hz roll. Burn times in seconds give a coarse cell fewer rolls, and the Sandbox's 32 px fronts died in 4 of 12 runs until burn length moved to rolls [V, S6]. And the DOOM height VFX #6 quoted belongs to a different loop than the one it wrote down.

### 6c. Games by tile size

Flame sizes as a fraction of each game's own tile. Multiply by 32 for Asterion pixels. Only sourced cells are filled [V for sizes; I for fractions].

| Game | Tile px | Flame or effect, px | Fraction of a tile | Frames x ms | Source |
|---|---|---|---|---|---|
| Tibia fire field, stages 1 to 3 | 32 | 49x47, 49x54, 38x40 in a 64x64 canvas | 1.53x1.47, 1.53x1.69, 1.19x1.25 | 5 x 120, 5 x 100, 5 x 100 | [S12] |
| Tibia FIREAREA, HITBYFIRE | 32 | 53x53, 42x40 | 1.66, 1.31x1.25 | 40 + 13 x 60, 9 x 100 | [S12] |
| Tibia campfire, fireplace | 32 | 32x32, 35x47 | 1.0, 1.09x1.47 | 5 x 100, 5 x 100 | [S12] |
| Tibia lit torch, burnt stub | 32 | 29x30 to 24x23, 11x14 | 0.91x0.94 to 0.34x0.44 | 2 x 500 | [S12] |
| Tibia ash, lava | 32 | 24x24, 32x32 | 0.75, 1.0 | still, 3 x 500 | [S12] |
| Cataclysm DDA, MShockXotto+ | 32 | 32x32 | 1.0 | 7 x 136 | [S80, S77] |
| RPG Maker MV battle animation, state overlay | 48 | 192x192, 96x96 | 4.0, 2.0 | 66.7 ms per cell, 8 x 133 | [S58, S59] |
| Stardew campfire flame, fireplace flame | 16 at 4x | 12x11 at 3x, 12x11 at 4x | 0.56x0.52, 0.75x0.69 | 4 x 100 | [S47, S48] |
| Stardew floor torch, ember | 16 at 4x | 8x8 at 3x, 1 px at 3x | 0.375, 0.047 | 7 x 100 | [S47] |
| Terraria campfire | 16 | 3x2 tiles | 3.0 x 2.0 | 8 x 66.7 | [S82] |
| Shattered Pixel Dungeon | 16 | 4 px squares, rising 14.4 px | 0.25, rise 0.9 | 1 per 30 ms, 0.6 s life | [S67, S68] |
| Zelda: A Link to the Past, Fire Rod impact | 16 | 16x16 | 1.0 | 3 x 133 + 117 | [S66] |
| Pokémon Emerald ash puff | 16 | 16x16 | 1.0 | 201, 201, 134, 201, 201 | [S64] |
| Project Zomboid | isometric | 2 or 3 flames per tile, offsets up to 32 px | | 4 frames at 12 fps | [S96, S97] |
| Asterion proposal | 32 | post torch 10x16, carried 6x8, campfire 24x28, field flames 40 to 54 tall | 0.31x0.5, 0.19x0.25, 0.75x0.88, up to 1.7 | 6 x 100, 4 x 100, 8 x 100 to 120, 5 x 100 to 120 | [I, notes 10, 11, 13] |

**Patterns** [I for the grouping].
- **Map flames are short loops.** 4 to 8 frames at 66 to 150 ms. One-shot effects run 7 to 14 frames at 35 to 100 ms. Liquids run 150 to 500 ms.
- **Flames in the most Asterion-like game overflow their tile.** Tibia's field reaches 1.5 tiles, its area flame 1.66.
- **Variety comes from variants and seeds, not simulation.** Tibia picks 1 of 16 by position, Stardew seeds the phase, Ragnarok flips a coin, Cataclysm hashes the location.
- **Burnt art is small and still.** Tibia's ash is 24x24, and no Tibia item is a burnt tree [V, S14].

### 6d. Spread speed in tiles per second, and the walking cap

Asterion's walk is 400 ms per tile, 2.5 tiles/s, 80 px/s [S3]. Every row converts its game's own units [V for the rule; I for the conversion].

| Game | Rule | Tiles per second | Against a 2.5 tiles/s walk | Source |
|---|---|---|---|---|
| RimWorld | Grows from size 0.1 to 1 in about 27 s, then one try every 2 to 2.5 s | 0.03 to 0.05 | far slower | [S88] |
| Don't Starve Together | Heat over `1 - d²/r²` every 0.5 s. Tufts half a tile apart | about 0.2, and it stops at 1 tile spacing | slower | [S92, S93] |
| Sigil of Kings | Inert for 3 to 4 turns of about 5 | 0.25 to 0.33 cells per turn | slower | [S109] |
| Minecraft | A fire block ticks every 1.5 to 2 s | at most 0.67 per hop chain | slower | [S99] |
| Brogue CE, Shattered Pixel Dungeon | 1 cell per turn at most, SPD with p = 1 | 1 per turn, about 2.5 at a walking turn | equal at best | [S75, S67] |
| VFX #6 numbers on 32 px tiles at 4 Hz | Per-tick rolls on a 4x larger cell | 2.1 to 4.0 | dry grass outruns a walker | [I, note 15, measured] |
| Asterion, rolled at 1 Hz (Sandbox, as built) | Per-tile roll once per second, burn counted in rolls | green grass 0.47, dry grass 0.91, capped at 1.0 | 40% of walking at most | [V, S6; I, note 15, measured] |
| Far Cry 2, uncapped test | "miles of terrain" in about 2 minutes | more than about 13 m/s | far faster | [S107] |
| Real grassland | 10 to 15 km/h under high danger | 2.8 to 4.2 m/s | faster, at 1 m per tile | [U, S106] |

**The designer's ladder at 32 px** [I, note 15]. 0.1 tiles/s (3 px/s) reads as smouldering creep. 0.3 to 0.5 tiles/s is green grass, which you can watch and walk away from. 0.8 to 1.0 tiles/s is dry brush or oil, a threat that a walking player escapes. Above 2.5 tiles/s fire outruns the player, so keep it for scripted events.

**The cap is structural** [I, note 15]. A tile lights a neighbour at most once per roll, so the axis speed is at most 1 tile per roll. At 1 Hz no fuel beats 1 tile/s. New players stand in grass in an MMO, and that cap is the safety rule. No game we read lets spreading fire outrun a walker.

### 6e. What artists say changes with size

**No artist gives tone counts or burn-edge widths per flame size.** Saint11's and Brullov's fire tutorials are image-only, and Slynyrd's 64 posts have none on fire [V, S150, S133, S140]. The rules below are general craft applied to fire.

| Topic | What the source says | What it means at 32 px | Source |
|---|---|---|---|
| Frame count | 4 frames at 16 px, 6 for 32 px torches, 6 to 10 for 32 to 48 px fires, 7 for a 172x192 campfire | Frames grow about 1.5 times from 16 to 32 px, then flatten. Big fires get slower frames, not more | [V, S126, S146, S128; I, note 11] |
| Frames and punch | More frames are smoother but "less punchy" | Stay at 6 to 8 | [V, S129] |
| Tone count | Packs keep "4-6 per sprite" colours | 5 flame tones plus a purple edge on flames 16 px or wider | [V, S135; I, note 11] |
| Hue | Ramps bend from purple through red and orange to yellow, value up 15 to 25 per step | Char in the darkest purple, not black | [V, S141, S142, S143; I, note 11] |
| Hot spot | The hottest, widest part sits at the wick | Hold 2 to 3 base rows | [V, S130] |
| Outline | Busy Flames gets a purple outer edge. No pack draws black flame outlines | A dark-red or purple edge pixel from the ramp | [V, S129; I, note 11] |
| Particles | A "2x2px particle" moving 1 px per frame | Embers 2x2, sparks 1 px for a few frames | [V, S131] |
| Smoke dither | Dither scaled "not as small as a pixel" | 2x2 blocks in a 2 px edge band only | [V, S139] |
| Smoke columns | 8x24, 16x48, 32x96 for fires of 8, 16 and 32 px | A column three times the fire width | [V, S125] |
| Burn edge | A band of 0.04 of the noise range | 1.3 px on a 32 px ramp, round to 2 px | [V, S155; I, note 11] |
| Rim light | Light the "outmost pixels" of a sprite | 1 px warm rim | [V, S135] |
| Blurry flames | An OGA campfire was re-pixelled because its earlier, blurrier version did not read as pixel art | Smooth gradients fail at 32 px too | [U, S147] |

---

## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)

All of this section is design proposal [I], built from the cited parts. It has not been tested in Godot. The Fire 32 Sandbox (§8) plays it in JavaScript [S6]. It keeps VFX #6's architecture and changes the scale of each layer.

**Layers, bottom to top.**
1. **Server fire grid (gameplay truth).** One cell per 32 px tile with material, fuel, moisture, state, heat and the 3-bit direction the fire came from. A fixed 4 Hz tick with an active list, and spread rolled once per second per tile with VFX #6's chances, phased by the tile's ignition tick. Burn length counts rolls, and catching is a client look (A2, C4).
2. **Network events.** Ignition and extinguish events with the tick and the entry direction, about 25 B/s for a screen-high grass front. Dying, embers and ash timing come from the shared hash on each client (A2).
3. **Burn front at art resolution.** A painted burn-order map biased toward the entry side decides, per art pixel, between the normal tileset, a 2 px ember edge, a scorch band and the charred tileset. The arrival-time front removes tile seams and is the Sandbox's default. Whole-tile swap is the fallback (C1, C2, C3, C4).
4. **Flames.** Drawn loops sized by the tile, overflowing in 64x64 canvases with position variants, three dying signals per stage, and tree and house stages. DOOM buffers at 1:1 or 1:2 remain an option, smoothed before quantizing (B1 to B6, C5).
5. **Embers and sparks.** A pool of 512, 2x2 px embers coloured by age and 1 px sparks that live a few frames, rising with drag and pushed by wind (D3).
6. **Smoke and steam.** An 80x45 Uint8 field at 8 px cells drawn through 2x2 clusters with empty spans skipped, plus hero puffs from chimneys, campfires, trees and houses, about 64 alive (D1, D2).
7. **Combat fire.** Tibia's timing, areas from 1-tile effects with variants and a stagger, 3x3 and 1x5 fields with three stages, explosions and scorch decals, and a burn status with a tinted overlay and numbers (F1, F2, F3, E1, E5).
8. **Characters at 24x32.** Torches carried in hand with per-frame offsets, a 1 px warm rim toward the nearest fire, one fire shadow, soot prints after ash, all y-sorted with objects and overflowing flames (E2, E3, E4, E6).
9. **Light, haze and palette.** The world renders to palette indices. Day and night retint the palette once per frame. Fires write an 8 px light map drawn through a 2 to 3 px dither band, lava cycles its palette, and big fires may add whole-pixel row offsets as haze (A3, F4, G4).

**Which buffers grow with the art, and which stay small.**

| Buffer | Follows | Size for a 640x360 view | Changes |
|---|---|---|---|
| Server fire grid | Tiles | 240 cells, 2 bytes plus 3 bits each | 4 Hz |
| Ignition times (C2) | Tiles | 240 half floats, 480 bytes | On ignition |
| Burn-order map | Art pixels | 128x128 R8, 16,384 bytes | Never |
| Normal, charred and ash tilesets, flame sheets | Art pixels | In the atlas | Never |
| DOOM patches (option) | Art pixels | One 128x128 R8 atlas, 16,384 bytes | Every frame |
| Smoke | Field cells | 80x45 R8, 3,600 bytes | Every tick |
| Light map | Field cells | 80x45 R8, 3,600 bytes | When its input hash changes |
| Embers | Count | 512 | Every frame |
| Final colour | Art pixels | 230,400 fragments on the GPU | Every frame |

The art grows by four. The data does not. The burn-order map and the flame sheets are painted once. The final colour belongs on the GPU. Everything simulated, uploaded or sent stays at VFX #6's size or smaller [I, notes 12, 15, 16].

**What the server sends.**
- **Ignitions.** Tile index, tick and entry direction, about 4 bytes. Extinguish events the same.
- **Weather.** Wind bucket and rain on change.
- **Combat.** Effect id and tile, missile from and to, a field item swap per stage, and "burning until tick N" with the damage per tick.
- **Nothing for looks.** Flame phase, variants, embers, puffs, rims, shadows and prints come from hashes and from moves every client already sees.

**Pseudocode.** Python-like for the server, Godot-shader-like for the client. Engine API names come from the notes and should be checked against the target Godot version.

The server tick (layers 1 and 2). The 4 Hz tick handles rain and events. Each tile rolls spread and burns down on one tick in four, counted from the tick it caught:
```python
MASK = 0xFFFFFFFF

def rand16(x, y, tick, salt):                  # integer hash, the same on every machine
    h = (salt ^ x * 374761393 ^ y * 668265263 ^ tick * 2246822519) & MASK
    h = ((h ^ (h >> 13)) * 1274126177) & MASK
    return (h ^ (h >> 16)) & 0xFFFF            # 0..65535

PERIOD = 4                                     # ticks per roll: 4 at 32 px tiles, 2 at 16 px, 1 at 8 px

def rolls_now(c, tick):                        # phase is the ignition tick: first roll one period later
    return tick > c.ign_tick and (tick - c.ign_tick) % PERIOD == 0

RAIN_P = 3277                                  # 5% per 4 Hz tick, in 1/65536, as the Sandbox uses
BUDGET = 4                                     # new ignitions accepted per tick, as the Sandbox uses

def server_tick(tick):                         # called at 4 Hz
    cand = {}                                  # tile -> (lowest successful hash, entry direction)
    for c in list(burning):                    # active list only
        if raining and rand16(c.x, c.y, tick, SEED ^ RAIN) < RAIN_P:
            extinguish(c); emit(EXTINGUISH, c.index, tick)
            continue
        if not rolls_now(c, tick):
            continue                           # spread and burn-down once per roll period per tile
        for n, d in neighbours8(c):
            if n.state != NONE or BASE[n.mat] == 0:
                continue
            p = BASE[n.mat] * (255 - n.moist) // 255   # BASE in 1/65536: grass 0.15 = 9830
            p = p * WIND[d] // 256                     # 8 factors, rebuilt when the wind changes
            if is_diag(d):
                p = p * 179 // 256                     # x 0.7
            h = rand16(n.x, n.y, tick, SEED + d)
            if h < p and (n not in cand or h < cand[n][0]):
                cand[n] = (h, opposite(d))             # the lowest hash wins, whatever the loop order
        c.age += 1
        c.rolls_left -= 1
        if c.rolls_left == 0:
            c.state = EMBERS; burning.remove(c); embers.add(c)
    ranked = sorted(cand.items(), key=lambda kv: (kv[1][0], kv[0].index))
    for n, (h, entry) in ranked[:BUDGET]:      # end of tick: a tile cannot catch and spread in one tick
        n.state = BURNING; n.age = 0; n.entry = entry
        n.rolls_left = BURN_ROLLS[n.mat]       # rolls, the same at every grid size: grass 5, dry 2, tree 24, wood 30
        n.ign_tick = tick                      # the tile's roll phase
        burning.add(n); emit(IGNITE, n.index, tick, n.entry)
```
New fires flip to BURNING after the loop, so a tile lit this tick cannot spread in the same tick, as VFX #6 required [S2]. Its first roll comes exactly one period later, and it may spread on that roll. The "catching" look is drawn by the client during that first period and holds nothing back. A tile that also waited a roll before spreading halved the front speed in the Sandbox [V, S6]. Burn length counts rolls, not seconds, or a coarse grid gets too few rolls and its fronts die [V, S6].

Three details make the tick order-free. When several burning neighbours light the same tile, the successful roll with the lowest hash sets its entry direction, so the loop order cannot change it. A test run without this rule gave 27 to 46 tiles a different entry depending on order [I, figure agent]. The budget sorts the successful candidates by hash and accepts the first 4 per tick, as the Sandbox does, instead of granting rolls in loop order. Rain is 5% per tick, the Sandbox's rule. VFX #6's 20% plus 3% per age step was Minecraft's chance per fire tick, every 1.5 to 2 s [V, S99]. Rolled per 4 Hz tick it would put out 59% of fires every second.

The roll phase does not spread the load for a single fire. Every tile lit from one seed catches on a tick `t0 + 4k`, so all of them roll on the same tick of four. One run put 3,955 of 3,955 rolls on one tick [I, figure agent]. At about 45 ns per burning cell (§6a) that does not matter. Embers and ash run on a slower list with the same hash.

The burn front (layer 3). Per-tile progress with the entry direction, in a ground CanvasItem shader that writes palette indices:
```glsl
shader_type canvas_item;
uniform sampler2D burnt    : filter_nearest;                  // charred tileset, same layout as the ground art
uniform sampler2D order    : filter_nearest, repeat_enable;   // 128x128 painted burn-order map N, clusters >= 2x2 px
uniform sampler2D tile_dir : filter_nearest;                  // 1 texel per tile: R * 255 = entry 0..7, 8 = not burning
uniform sampler2D tile_t   : filter_nearest;                  // 1 texel per tile: ignition time in s (half float)
uniform vec2  grid_origin_px;                                 // world px of tile (0, 0), a multiple of 32
uniform vec2  grid_tiles;                                     // tiles covered by the two tile textures
uniform float now;                                            // client time, same epoch as tile_t
uniform float t_sweep = 1.0;                                  // s for the front to cross a tile
uniform float a = 0.4;                                        // weight of the painted map against the entry ramp
const int EMBER_LINE = 40; const int SCORCH = 41;             // palette indices
const vec2 DIRS[8] = vec2[8](vec2(-1.0, 0.0), vec2(-0.7071, -0.7071), vec2(0.0, -1.0), vec2(0.7071, -0.7071),
                             vec2(1.0, 0.0), vec2(0.7071, 0.7071), vec2(0.0, 1.0), vec2(-0.7071, 0.7071));
varying vec2 wpos;
void vertex() { wpos = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy; }

void fragment() {
    vec2 p   = floor(wpos) + 0.5;                             // centre of this art pixel
    vec2 tuv = (p - grid_origin_px) / (32.0 * grid_tiles);
    int idx  = int(texture(TEXTURE, UV).r * 255.0 + 0.5);    // normal ground art as palette index
    float dir = texture(tile_dir, tuv).r * 255.0;
    if (dir < 7.5) {
        vec2 e  = DIRS[int(dir + 0.5)];                       // unit direction the fire came from
        vec2 u  = fract(p / 32.0) - 0.5;                      // -0.5..0.5 inside the tile
        float s = (e.x != 0.0 && e.y != 0.0) ? 1.41421 : 1.0;
        float T = (1.0 - a) * clamp(dot(u, -e) / s + 0.5, 0.0, 1.0) + a * texture(order, p / 128.0).r;
        float w_rim = (1.0 - a) / (32.0 * s);                 // about 1 px across the front, side or diagonal
        float w_sc  = 2.5 * w_rim;                            // 2 to 3 px of scorch
        float b = clamp((now - texture(tile_t, tuv).r) / t_sweep, 0.0, 1.0) * (1.0 + w_rim + w_sc);
        float d = b - T;
        if (d >= w_rim + w_sc) idx = int(texture(burnt, UV).r * 255.0 + 0.5);
        else if (d >= w_rim)   idx = SCORCH;
        else if (d >= 0.0)     idx = EMBER_LINE;
    }
    COLOR = vec4(float(idx) / 255.0, 0.0, 0.0, 1.0);          // the palette pass turns indices into colour
}
```
`b` runs to `1 + w_rim + w_sc`, not 1, or the pixels with T near 1 would never char. The ramp part of T changes `(1 - a) / (32 s)` per px across the front, which sets the 1 px rim. Without the division by s, a diagonal entry drew a 3.7 px edge instead of 2 [I, figure agent]. Ash is a whole-tile swap in the tile layer, so this shader only sees tiles that are catching, burning or in embers. For the continuous front (C2), give `tile_t` a linear filter, use `T = N` alone, and compare `(now - t_arrival) / t_burn` with it [I, note 12]. The band then measures `band x front speed` px, so a 16 px/s grass front needs a rim of 1/16 s. Dividing `now - t_arrival` by the length of its screen-space gradient gives px behind the front directly, an untested option [I].

The DOOM buffer (layer 4), Sanglard's in-place loop with smoothing before quantizing:
```python
R6 = (0, 1, 1, 2, 2, 3)                        # round(random() * 3): weights 1/6, 1/3, 1/3, 1/6

def doom_step(fire, W, H):                     # row 0 at the top, row H-1 is the source, held at L
    for x in range(2, W - 1):                  # columns 0, 1 and W-1 are padding for the sideways write
        for y in range(1, H):
            src = y * W + x
            p = fire[src]
            if p == 0:
                fire[src - W] = 0
            else:
                r = R6[rng() % 6]
                dst = src - r + 1              # sideways +1, 0, -1, -2
                fire[dst - W] = p - (r & 1)    # lose a level when r is 1 or 3

def doom_draw(fire, W, H, put, TONE):          # TONE[h]: smoothed heat to tone, 0 = transparent
    for y in range(1, H - 1):
        for x in range(3, W - 2):
            s = 0
            for dy in (-1, 0, 1):
                row = (y + dy) * W
                s += fire[row + x - 1] + fire[row + x] + fire[row + x + 1]
            t = TONE[(s * 57) >> 9]            # s / 9 in integers (57 / 512 = 1 / 8.98)
            if t:
                put(x, y, RAMP[t])

# a 16 px torch at 1:1 with this in-place loop: L = 6 (16 / 2.6), TONE = [0, 1, 2, 3, 4, 5, 5], the core on the top 2 levels
# (a double-buffered loop at p = 0.5 needs L = 8 for the same 16 rows)
```
The loop is in place on purpose. A no-decay write lands in a column not yet processed this frame and is read again at once, so the flame burns taller than the clean formula. Measured as the row where half the columns are lit, it reaches 95 rows at L = 36, against 73 for a double-buffered copy. That 95 needs wrapped edges or a wide buffer. A 64-column patch with three padding columns measured 69 rows, because heat drifts out of the sides [I, figure agent]. The 3x3 average pulls heat below the top level, which then covers almost no pixels, so the core takes the top 2 levels, about 10 to 15% of flame pixels. For the in-place loop pick `L ≈ H / (2.6 k)` for a flame H px tall at ratio k. For a double-buffered or GPU loop use `L = p x H / k + c - 1` [I, notes 12, 18, measured]. Smoothing before the tone lookup takes lone pixels from 8.6% to 0.3%. Draw only the columns the step processes.

The rim light (layer 8), in the character sprite shader:
```glsl
shader_type canvas_item;                       // character sprite, R = palette index
instance uniform vec2  fire_step = vec2(0.0);  // toward the nearest fire, components -1, 0 or 1; zero = none
instance uniform float rim_tones = 0.0;        // 2 within 1.5 tiles, 1 out to 3 tiles, 0 beyond or behind
uniform sampler2D warm : filter_nearest;       // row 0 warm highlight, row 1 warm mid, per body index
void fragment() {
    vec4 c = texture(TEXTURE, UV);
    if (c.a > 0.5 && rim_tones > 0.5) {
        vec2 st = fire_step * TEXTURE_PIXEL_SIZE;
        bool rim   = texture(TEXTURE, UV + st).a < 0.5;
        bool inner = rim_tones > 1.5 && !rim && texture(TEXTURE, UV + 2.0 * st).a < 0.5;
        if (rim || inner) c = texelFetch(warm, ivec2(int(c.r * 255.0 + 0.5), rim ? 0 : 1), 0);
    }
    COLOR = c;
}
```
The script picks the nearest fire within 4 tiles when the character or the fire changes tile and sets both instance uniforms. 2D instance uniforms need Godot 4.4 or later [S3]. Three details matter [I, figure agent; V, S6]:
- The shader steps in UV space, so on a sprite mirrored with `flip_h` the rim lands on the side away from the fire. Negate `fire_step.x` when the sprite is flipped.
- Give every frame in the sheet a 2 px clear margin, or `UV + st` reads the next frame.
- Skip outline and eye pixels for the inner tone, as the Sandbox does.

**Burn damage period.** The Sandbox deals 10 damage per second while burning, so one damage tick per second, not one per 4 Hz tick. At 4 Hz the 50 ms white flash would fire 4 times a second, over the limit of 3 flashes per second, and numbers would merge in pairs. VFX #6 proposed one burn tick every 2 s [S2]. The head flame shows on even seconds.

**Godot mapping.**
- **Viewport** [V, S186, S3]. Stretch mode `viewport` at 640x360 with `integer` scale mode, so every shader runs on 230,400 fragments.
- **Tile data** [I, note 12]. The entry direction and ignition time per tile as two 20x12 images updated on events, 240 and 480 bytes per view.
- **Smoke and light** [V, S169; I, note 16]. `PackedByteArray` fields copied into `Image.FORMAT_R8` images, one `ImageTexture.update()` each, sampled once by the final shader. That moves the two largest CPU layers to the GPU.
- **Flames** [I, notes 10, 12]. One atlas of loops, variants and dying stages, drawn as sprites y-sorted with characters. DOOM patches, if used, share one R8 atlas.
- **Embers and puffs** [V, S170, S182; I, note 12]. One MultiMesh or CPUParticles2D. No GPUParticles2D on the web.
- **Light** [V, S174]. The baked map for all fires, and PointLight2D, if at all, for one or two hero lights.

**What to avoid.**
- VFX #6's spread table at 4 Hz on 32 px tiles. Dry grass outruns a walker [I, note 15, measured].
- Raw 37-tone DOOM at 1:1 over drawn tiles, and Bayer between tone bands [I, note 12, measured].
- A whole-tile swap as the moving front [I, note 16].
- GPUParticles2D on the web, and `canvas_items` stretch for any full-screen pass [V, S182; I, note 12].
- A light on every tile of a 37-tile area [I, note 14].

---

## 8. Reference implementation: the Fire 32 Sandbox

The Sandbox [S6] is one hand-written page with a native 640x360 canvas scaled with pixelated rendering. It plays the nine layers of §7 in plain JavaScript, porting the engine of the VFX #6 sandbox [S2] and the page, characters and HUD of the VFX #11 sandbox [S3]. This section describes the page as built, after one polish pass, from the builder's record in `notes/SANDBOX-SPEC.md` [V, S6].

**The world.** A top-down 3/4 village edge on 32x32 px tiles, 20 wide by 11.25 tall. A meadow of green and dry grass with variation picked by a position hash, a stand of trees about 1.5 tiles wide and 2 to 2.5 tiles tall, two wooden houses of about 3x3 tiles (one chimney always smokes), a stone house that never burns, a stone road, a pond, a small lava pool, a campfire, two torches on posts, a brazier, hay bales and a fence. There is no bonfire. All art is drawn in code with 1 px dark outlines, ramps and clusters. The palette has 97 colours in 4 versions. Lava cycles every 300 ms and the pond glints every 450 ms.

**Actors.** The player, 24x32 px, with a 4-frame walk of 400 ms per tile and contacts on frames 0 and 2, and a torch toggle. A villager on a waypoint loop, a sheep of about 20x14 px that can catch fire, and a crowd of 0 to 20 other players, half of them with torches. Free 8-way movement by default, with a "tile steps" toggle.

**Layer 1, server grid.** 20x12, 40x23 or 80x45 cells at 32, 16 or 8 px, ticked at 4 Hz. Burning cells roll at 1, 2 or 4 Hz, phased by their ignition tick, so the first roll comes one period after ignition. "Catching" is a look only. A cell burns a fixed number of rolls at every grid size. Chance per roll is 0.15 for green grass, 0.40 dry grass, 0.22 tree, 0.30 wood and fence, 0.50 hay and 1.0 oil. Rolls are 5 for green grass, 2 dry grass, 4 hay, 6 oil, 12 fence, 24 tree and 30 wood. Embers last 4 to 10 s, and ash regrows in two steps after 60 to 120 s. Wind follows Alexandridis with V from 0 to 10 m/s. The budget cap allows 4 tiles of ignitions per tick.

**Layer 2, network.** A full set costs 4 + 2 bytes per burning cell per tick, events 4 + 3 bytes per event. The HUD shows both in B/s, labelled illustrative.

**Layer 3, burn front.** The continuous front is the default. Each 2x2 px block samples the cells' ignition times bilinearly with an 8 px warp, and a cell that has not caught counts as now plus 6 s. Jitter comes from a 128 px map grown from 96 seeds, up to 0.9 s. A 2 px edge in glow and dark red, then a 0.35 s scorch zone, then char. A cell's clock freezes when its fuel runs out, and ash comes from a second smooth field in three tones of 2x2 blocks with charcoal bits and light flecks. Burning cells redraw at 30 Hz, embers at 15 Hz and burning objects at 20 Hz into a cached base. A second object layer restores pixels hidden behind an object that burns away. Front styles are continuous, per tile (which shows the seam), Bayer 4 and whole tile.

**Layer 4, flames** (W x H px, frames x ms, tones). Candle 4x8, 4 x 100, 3. Post torch 10x16, 6 x 100, 5. Hand torch 6x8, 4 x 100, 4. Grass flames 8x10 at 4 x 100 and 12x16 at 6 x 100. Brazier 16x20, 6 x 110, 5. Campfire 24x28, 8 x 110, 6 with a purple edge. Tree 22x28, 8 x 120, 6. House 28x32, 8 x 130, 6. Field stages 46x46, 44x50 and 34x36 at 5 x 120, 5 x 100 and 5 x 100. Every loop holds its bottom 3 rows, and 2x2 or 2x3 tongues rise 3 px per frame. A burning tile shows up to 3 flames, and in its last 25% keeps one small flame looping 1.4 times slower. The DOOM styles run Sanglard's in-place loop at 640x360 (1:1) or 320x180 (1:2) inside a bounding box, with a 3x3 average before the 5-tone cut and the seed level at rows / 1.9 + 2.

**Layer 5, embers.** A pool of 512. Embers 2x2 px for 0.5 to 1.5 s, sparks 1x1 or 1x2 for 3 to 8 frames. The "1 px" mode is the VFX #6 look.

**Layer 6, smoke.** Byte fields of 160x90, 80x45 or 40x23 advected at 30 Hz, rising 26 px/s, drifting 4 px/s per wind step, 50% kept per second (16% for steam). They are drawn through their own soft-blob cluster map, because the burn-order map left lone 2x2 dots, or through Bayer 4. Ground smoke feeds 170 units per tile per second against a threshold of 44. A burning house feeds a column of 420 per second over an 18 px radius plus dark puffs, a tree 200. Object puffs, at most 64 alive, start at 4 to 16 px and grow to 16 to 64 px by source, fading from 60% of their life. Smoke keeps half its brightness at night and counts 1.8 times in the light pass.

**Layer 7, combat.** Missiles fly `150 x sqrt(d)` ms with one 16x16 sprite per 8 directions. The area effect is 14 frames (40 ms, then 13 x 60 ms) in a 56 px canvas, on a 3x3 area or the 37-tile disc, with rings 75 ms apart and repeats refused under 350 ms. There is no 64x64 explosion. Scorch decals fade over 4.5 s. Field stages last 20, 14.8 and 9.8 s, Canary's times divided by 10, and the last is harmless. Damage is 20 on entering a field and 10 per second while burning. Shake is 2 or 5 px, capped at 6.

**Layer 8, characters.** Rim light within 3 tiles, a second tone within 1.5 tiles. One fire shadow, an ellipse 16 px wide and 6 to 10 px tall pushed away from the nearest fire, one shade darker, no pixel darkened twice. Soot prints of 3x5 px, 2 per tile, for 3 tiles, fading over 10 s. Damage digits 11 px tall, rising 48 px in 1 s. The hand torch is held 4 px forward in side view with the stick tilted 6 px, drawn in front of the body facing south, east and west. Only facing north draws it behind.

**Layer 9, light and palette.** Light maps of 20x12, 80x45 or 160x90 cells, bands at 0.3 and 0.62, dither 0.026, flat runs and tier-0 blocks skipped. Map build costs 0.003, 0.03 and 0.12 ms at 32, 8 and 4 px. The apply follows the lit pixel count, 0.47 ms with 160,123 lit px in the showcase and 0.24 ms by day or 0.29 ms by night at idle with 57,141.

**Actors.** The player, 24x32 px, with a 4-frame walk of 400 ms per tile and contacts on frames 0 and 2, and a torch toggle. A villager on a waypoint loop, a sheep that can catch fire, and a crowd of 0 to 20 other players, half with torches.

**Controls and demos.** The spec's tools, weather, time, budget and scale controls, plus a 3x3 or 37-tile fireball option and four front styles. Views show the picture, fuel, moisture, server state, burn progress, the burn-order map, the smoke field, the light map, active cells, the field grid and a cost view. Three demo buttons. `showcase` sets a dusk scene with a house and meadow burning and the player in front with a torch and a rim light. `vfx6` sets 8 px cells, Bayer 4, DOOM 1:2, Bayer smoke and 1 px embers. `art32` restores the 32 px defaults. The thumbnail crops [96, 120, 416, 300]. Hooks are `fire32.bench(n)`, `frontTest`, `set`, `demo` and `stats`.

**Measured fronts.** From `frontTest`, 12 runs each, no wind, tiles/s at 32 / 16 / 8 px. Green grass 0.47 / 0.52 / 0.51, dry grass 0.91 / 0.90 / 0.91. At 5 m/s green grass runs 0.53 downwind (+13%) and its upwind front dies in 10 of 12 runs. Dry grass runs 0.97 downwind and 0.16 to 0.55 upwind [V, S6].

**Sandbox timings.** These are the Sandbox's own numbers, separate from the controlled benchmark of §6a [S7]. Builder's machine, Apple M4 Pro, headless Chromium, showcase scene, median of 5 runs of 60 frames through `fire32.bench`, after the polish pass [V, S6].

| Case (Sandbox loop, ms per frame) | Front | Flames | Embers | Smoke | Chars | Light | Total |
|---|---|---|---|---|---|---|---|
| Default (night) | 0.73 | 0.05 | 0.02 | 0.33 | 0.02 | 0.64 | 1.76 |
| Default, day | 0.73 | 0.04 | 0.01 | 0.32 | 0.01 | 0.62 | 1.75 |
| VFX #6 settings | 0.51 | 0.30 | 0.03 | 0.27 | 0.01 | 0.69 | 1.82 |
| Grid 16 px | 0.79 | 0.05 | 0.01 | 0.31 | 0.01 | 0.60 | 1.78 |
| Grid 8 px | 1.07 | 0.04 | 0.02 | 0.30 | 0.01 | 0.60 | 2.05 |
| Smoke 4 px | 0.73 | 0.05 | 0.01 | 0.50 | 0.01 | 0.61 | 1.94 |
| Smoke 16 px | 0.74 | 0.05 | 0.01 | 0.40 | 0.01 | 0.62 | 1.83 |
| Light 32 px | 0.75 | 0.05 | 0.01 | 0.32 | 0.02 | 0.63 | 1.75 |
| Light 4 px | 0.73 | 0.05 | 0.01 | 0.33 | 0.01 | 0.72 | 1.85 |

The light column includes the palette pass (0.08 ms), `putImageData` (0.03), the map build (0.03) and haze (0.03). Other front styles cost 0.53 ms per tile, 0.43 for Bayer 4 and 0.32 for the whole-tile swap. DOOM flames cost 0.80 ms at 1:1 (total 2.56) and 0.26 ms at 1:2 (total 1.95). A crowd of 20 adds 0.12 ms for characters (total 2.02). With nothing burning the total is 0.46 ms by day and 0.59 by night.

**Under a 6x CPU throttle**, measured on the first pass, before the polish pass, the default scene cost 12.6 ms, the VFX #6 settings 11.8, grid 8 px 15.2 and DOOM 1:1 16.9 ms [V, S6]. The burning showcase is far busier than §6a's frame, and DOOM 1:1 alone fills the throttled budget.

**What it demonstrates.**
- VFX #6's settings cost about the same as the 32 px defaults (1.82 against 1.76 ms) and look thin and noisy next to them (A1, B4, D3).
- The continuous front hides the tile seam that the per-tile style shows, for 0.2 ms more than per-tile progress (C1, C2).
- With rolls phased by ignition and burn counted in rolls, the front keeps its speed across the three grid sizes (A2).
- Smoke cell size changes the shapes more than the cost, 0.31 to 0.50 ms (A3, D1).
- The light apply follows the lit pixel count, so a burning night scene costs twice an idle day (A3, G1).

**Simplifications and weak spots** [V, S6; I].
- It is JavaScript on one thread with a CPU render. It says nothing about Godot's upload, shader or node costs.
- "Server" and "client" share one page. The network layer only counts bytes.
- An unburnt tile next to a long-burning tile, a tree or a house, can still show straight edges.
- Ground smoke over a large burnt area forms some grey patches.
- Lava sometimes ignites the grass beside it.
- The 6x throttle figures predate the polish pass.

---

## 9. Gem findings

Each licence cell says how the licence was learned. Stars and dates come from the notes, several carried from VFX #6 and VFX #11 [S2, S3]. Decompilations of commercial games are for reading only. Licences were read from LICENSE files on 2026-11-13. **Flags:** **Low** = MIT/BSD/Apache/CC0; **LGPL** = fine as a separate library; **Copyleft** = GPL/AGPL/CC BY-SA, study and re-implement; **None** = no licence, study only.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| Canary `appearances.dat` and `appearances.proto` | https://github.com/opentibiabr/canary | GPL-2.0, read in VFX #11 | Maintained Tibia server, current client data | Frame counts, per-frame ms, 4x4 position patterns, boxes and light for every fire item and effect. A 90-line reader decodes it | Copyleft |
| OTClient (Mehah) | https://github.com/mehah/otclient | MIT, read from file headers | 541 stars, pushed 9 Nov 2026 | `lightview.cpp`, `animatedtext.cpp`, the `waitFor` crowding rule, configurable effect and missile ticks | Low |
| OTClient (edubart) | https://github.com/edubart/otclient | MIT per VFX #11. The GitHub API reports NOASSERTION | 709 stars | The 75 ms effect frame and the `150 x sqrt(d)` missile in two short files | Low (check the LICENSE file) |
| The Forgotten Server | https://github.com/otland/forgottenserver | GPL-2.0 | 1,844 stars, pushed Nov 2026 | Spell area arrays, burn condition, field pathing rules, one light per player | Copyleft |
| Shattered Pixel Dungeon | https://github.com/00-Evan/shattered-pixel-dungeon | GPL-3.0, LICENSE.txt read | 6,789 stars, shipped on Android, iOS and desktop | A whole per-cell fire with particle visuals in about 150 lines | Copyleft |
| Brogue CE | https://github.com/tmewett/BrogueCE | AGPL-3.0, read in VFX #6 | v1.15.1 | Fire exposure, ember and ash promotion, dancing fire colours | Copyleft |
| roBrowser Legacy | https://github.com/MrAntares/roBrowserLegacy | GPL-3.0, read in VFX #11 | Stars not collected | `EffectTable.js`, every Ragnarok effect with variant counts | Copyleft |
| RPG Maker MV corescript | https://github.com/rpgtkoolmv/corescript | MIT, read in VFX #11 | 326 stars, ships inside every MV game | `Sprite_Animation`, `Sprite_StateOverlay`, `Sprite_Damage` | Low |
| filipedeschamps/doom-fire-algorithm | https://github.com/filipedeschamps/doom-fire-algorithm | MIT, read in VFX #6 | 1,599 stars on 10 Nov 2026 | JavaScript DOOM fire ports to check ours against | Low |
| Simple Pixelated Fire and sconce-fire-test | https://godotshaders.com/shader/simple-pixelated-fireshader/ ; https://github.com/Casual-Cynic/sconce-fire-test | MIT, GitHub API spdx | 3 stars, last push 20 Nov 2025, Godot 4.5 | A stepped-time, 5-threshold noise flame for Godot | Low |
| 2D dissolve with burn edge (mreliptik) | https://godotshaders.com/shader/2d-dissolve-with-burn-edge/ | CC0, stated on the page | Godot shader library entry | A burn band that leaves no stray dot | Low |
| Pixelated burn (Demyr) | https://godotshaders.com/shader/pixelated-burn/ | CC0, stated on the page | Published 26 Nov 2025 | Snapped UVs, quantized edge bands, a gradient ramp | Low |
| 2D Burn/dissolve with direction (enekoassets) | https://godotshaders.com/shader/2d-burn-dissolve-with-direction-v-1-0/ | CC0, stated on the page | Published 9 Jul 2025 | The entry-direction rule in about 10 lines | Low |
| Pixel-burn Shader (arlez80) | https://godotshaders.com/shader/pixel-burn-shader/ | MIT, stated on the page | Published 18 Jan 2022, Godot 3 syntax | A snapped scrolling burn fringe | Low |
| Idylwild Chromatic Campfires | https://idylwild.itch.io/campfires | CC0, stated on the page | Free pack with source file | Lit, unlit and burnt torches and campfires, smoke in 2 colours | Low |
| Reactorcore explosion minipack | https://reactorcore.itch.io/explosion-spriteanim-sheet-minipack | CC0, per the author's comment | 10 sheets of 16 frames | 32 and 64 px explosion references | Low |
| brullov Fire Animation | https://brullov.itch.io/fire-animation | Use in games, no resale, stated on the page | 4.9 from 53 ratings, since 2019 | A size ladder from 8x8 to 24x32 with start, loop and end parts | Low (custom, no resale) |
| pimen Explosion Effect and Smoke n Dust 04 | https://pimen.itch.io/explosion-effect ; https://pimen.itch.io/smoke-n-dust-04 | Use and modify, no resale, stated on the page | 30 and 9 effects with Aseprite files | Frame counts and timing at 16 to 96 px | Low (custom, no resale) |
| Minifantasy Raided Village | https://krishna-palacio.itch.io/minifantasy-raided-village | Credit required, no redistribution, stated on the page | A paid pack on an 8 px grid | Scorched grass, broken houses, smoke columns by fire size | Low (custom, credit required) |
| raylib `textures_fog_of_war.c` | https://github.com/raysan5/raylib/blob/master/examples/textures/textures_fog_of_war.c | zlib from memory, LICENSE not opened (VFX #11) | An official raylib example | One texel per 32 px tile with a bilinear upscale, the shape of C2 | Low (open the LICENSE first) |
| Godot `DrawableTexture2D` | https://docs.godotengine.org/en/latest/classes/class_drawabletexture2d.html | Godot is MIT [K] | Merged 30 Jan 2026, experimental | GPU ping-pong buffers without SubViewports | Low |
| CDDA-Tilesets, MShockXotto+ | https://github.com/I-am-Erk/CDDA-Tilesets | Not read | Ships with Cataclysm DDA | A worked 32x32 fire multitile and a per-tile phase format | None (licence not read) |
| ServUO | https://github.com/ServUO/ServUO | Not read | A long-running Ultima Online emulator | `FireField.cs`, the 300 ms tile-by-tile wall growth | None (licence not read) |
| snesrev/zelda3 | https://github.com/snesrev/zelda3 | Not read | A C reimplementation of the ROM | Frame-exact Fire Rod and Lamp timings in `ancilla.c` | None (licence not read) |
| pret/pokeemerald | https://github.com/pret/pokeemerald | No licence file | 3,686 stars, pushed Oct 2026 | Burn flames and the ash puff with its tile swap | None (study only) |
| Stardew Valley 1.5.4 decompilation | https://github.com/veywrn/StardewValley | Decompiled proprietary code | Game version 1.5.4 | `Torch.cs`, `Furniture.cs`, volcano lava | None (read only) |
| RimWorld decompile (josh-m) | https://github.com/josh-m/RW-Decompile | Decompiled commercial code | Version not stated | `Fire.cs`, `FireUtility.cs`, sparks, smoke cap, edge ring | None (read only) |
| Don't Starve Together scripts mirror | https://github.com/taichunmin/dont-starve-together-game-scripts | Klei's shipped Lua, a mirror | Shipped game scripts | Propagator heat, burn times, burnt tree stages | None (read only) |
| PZ-Javacode | https://github.com/Ketum-Git/PZ-Javacode | Decompiled commercial code | Build 41.78 | Six fire life stages, 2 or 3 flames per tile, burnt tile swaps | None (read only) |
| Terraria decompile (aoki-lizlov) | https://github.com/aoki-lizlov/terraria-decompiled | Decompiled commercial code | Current-era code | Campfire timing and the additive flame jitter | None (read only) |
| Lospec palette JSON | https://lospec.com/palette-list/endesga-32.json | Site terms not read | Worked for 4 palettes on 13 Nov 2026 | Exact fire ramp hex for build scripts | None (terms not read) |

**Top picks for Kingsfoil** [I]. Port OTClient's light map, damage text and crowding rule freely, since Mehah's fork is MIT. Start the burn-front shader from the two CC0 burn shaders and make it world-anchored. Use Idylwild's CC0 pack for burnt-state placeholders. Read Canary's data, TFS, SPD and Brogue for numbers and write fresh code, because all four are GPL or AGPL. Read the decompilations for numbers and copy nothing.

---

## 10. Learnings and anti-patterns

**Learnings** [I unless cited]
1. **Per-tick rates scale with the cell.** VFX #6's table on 32 px tiles runs 4 times faster in px/s. Roll at 1 Hz and keep the table [I, note 15, measured].
2. **The data stays small, the art grows.** 240 server cells, 3,600-cell fields and a 512-ember pool against 230,400 art pixels (§7).
3. **Tibia hides the grid with overdraw and variants, not simulation.** Flames of 1.5 tiles and 16 variants per stage (B2) [V, S12].
4. **Dying is three signals at once.** Smaller, slower and dimmer (B3) [V, S12].
5. **Name the measure.** The DOOM fire is 72, 95 or 105 rows tall depending on loop and metric [I, notes 12, 18, measured].
6. **Smooth before you quantize.** At 32 px a 5-tone DOOM fire needs it. Dither on top makes it worse [I, note 12, measured].
7. **Per-pixel passes are the cost.** Light apply and smoke draw are 62% of the CPU frame. Fields are free [I, note 16, measured].
8. **What Tibia leaves out is still Asterion's to decide.** Tibia has no burning overlay, no carried torch, no burnt trees and no soot prints [V, S18, S22, S14]. Each addition here is labelled [I].

**Attribution traps.** Four claims we nearly carried forward are corrected in §12: the Stardew torch size, the 72-row DOOM height, the field size behind VFX #6's smoke cost and the file behind Don't Starve's burn times.

**Anti-patterns**
- **VFX #6's spread table at 4 Hz on 32 px tiles.** Dry grass at 3.7 tiles/s outruns a 2.5 tiles/s walk [I, note 15, measured].
- **Raw 37-tone DOOM at 1:1.** 75.2% lone pixels [I, note 12, measured].
- **A full-width DOOM band at 1:1 on the CPU.** 2.52 ms throttled, for a look a shader gives for 0.022 ms of GPU time [I, note 16, measured].
- **Bayer 4 on the burn front or in smoke.** 8 to 17% cheaper and worse-looking [I, note 16, measured].
- **1 px embers alone.** Sensor noise at 3x [V, S3].
- **Flames clipped to 32x32.** They look smaller than Tibia's [I, note 10].
- **GPUParticles2D on the web.** Seconds of compile on a cold load [V, S182].
- **Lights on every tile of an area.** 37 lights for one great fireball [I, note 14].
- **Shake for strangers' spells.** Everyone casts in an MMO [I, note 14].

---

## 11. "See it in action" index

| # | Game | Fire idea | URL |
|---|---|---|---|
| 1 | Tibia | Fire field in three stages that overflow the tile | https://tibia.fandom.com/wiki/Fire_Field |
| 2 | Tibia | Great fireball as 37 one-tile effects | https://tibia.fandom.com/wiki/Great_Fireball_Rune |
| 3 | Tibia | Slow lava, 3 frames of 500 ms with 8 variants | https://tibia.fandom.com/wiki/Lava |
| 4 | Tibia (OTClient) | 75 ms effect frames | https://github.com/edubart/otclient/blob/master/src/client/effect.cpp |
| 5 | Tibia (OTClient) | Missiles over `150 x sqrt(d)` ms | https://github.com/edubart/otclient/blob/master/src/client/missile.cpp |
| 6 | Tibia (OTClient) | Per-tile light map with max blending | https://github.com/mehah/otclient/blob/main/src/client/lightview.cpp |
| 7 | Tibia (OTClient) | Floating damage numbers that merge | https://github.com/mehah/otclient/blob/main/src/client/animatedtext.cpp |
| 8 | Tibia (TFS) | Burning shows only an icon and hit effects | https://github.com/otland/forgottenserver/blob/master/src/condition.cpp |
| 9 | Tibia (TFS) | Fields block pathfinding, not manual steps | https://github.com/otland/forgottenserver/blob/master/src/tile.cpp |
| 10 | Stardew Valley | Campfire built from three seeded flames | https://stardewvalleywiki.com/Campfire |
| 11 | Stardew Valley | Floor torch, 8x8 in 7 frames | https://github.com/veywrn/StardewValley/blob/master/StardewValley/Torch.cs |
| 12 | Stardew Valley | Volcano lava on the water animation | https://stardewvalleywiki.com/Volcano_Dungeon |
| 13 | Stardew Valley | Bombs as many delayed tile sprites | https://stardewvalleywiki.com/Bomb |
| 14 | RPG Maker MV | 192 px battle cells at 15 fps | https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Animation.js |
| 15 | RPG Maker MV | State overlay anchored at the feet | https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_StateOverlay.js |
| 16 | RPG Maker MV | Bouncing damage digits | https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Damage.js |
| 17 | Pokémon Emerald | Burn as three small flames | https://bulbapedia.bulbagarden.net/wiki/Burn_(status_condition) |
| 18 | Pokémon Emerald | Ash puff, then a tile swap | https://bulbapedia.bulbagarden.net/wiki/Route_113 |
| 19 | Zelda: A Link to the Past | Fire Rod burst of 16x16 frames | https://zeldawiki.wiki/wiki/Fire_Rod |
| 20 | Ultima Online | Fire field that grows a tile every 300 ms | https://www.uoguide.com/Fire_Field |
| 21 | Ragnarok Online | Fire Wall with 2 random strips per cell | https://irowiki.org/wiki/Fire_Wall |
| 22 | Terraria | On Fire! tint and dust | https://terraria.wiki.gg/wiki/On_Fire! |
| 23 | Terraria | Campfire smoke that follows the wind | https://terraria.wiki.gg/wiki/Campfires |
| 24 | Enter the Gungeon | Fire spreading through goop | https://enterthegungeon.wiki.gg/wiki/Goop |
| 25 | Enter the Gungeon | Burning enemies tinted red | https://enterthegungeon.wiki.gg/wiki/Status_Effects |
| 26 | Shattered Pixel Dungeon | Fire with no flame sprites | https://shatteredpixel.com/ |
| 27 | Brogue CE | Fire, embers and ash as tile types | https://github.com/tmewett/BrogueCE |
| 28 | Cataclysm DDA | 32x32 fire multitile with a per-tile phase | https://cdda-guide.nornagon.net/field/fd_fire |
| 29 | RimWorld | Fire on the edge ring of buildings | https://rimworldwiki.com/wiki/Fire |
| 30 | Don't Starve | Burn times, ashes, burnt structures | https://dontstarve.wiki.gg/wiki/Fire |
| 31 | Project Zomboid | Six fire life stages and burnt walls | https://github.com/Ketum-Git/PZ-Javacode/blob/master/PZ_41.78/zombie/iso/objects/IsoFire.java |
| 32 | Minecraft | Fire ticks and grass regrowth by neighbour | https://minecraft.wiki/w/Fire |
| 33 | Noita | Burning status and its effects | https://noita.wiki.gg/wiki/Status_effects |
| 34 | Noita | Burn rates by material | https://noita.wiki.gg/wiki/Fire |
| 35 | Dwarf Fortress | Burning trees that can collapse | https://dwarffortresswiki.org/index.php/DF2014:Fire |
| 36 | Far Cry 2 | Capped spread after an uncapped test | https://www.gamedeveloper.com/game-platforms/interview-how-i-far-cry-2-i-s-fire-fuels-spreads |
| 37 | Sigil of Kings | Fire inert for 3 to 4 turns | https://byte-arcane.itch.io/sigil-of-kings/devlog/712302/wildfires |
| 38 | Graveyard Keeper | Shadows rotated away from each light | https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made |
| 39 | Sea of Stars | Dynamic light on pixel art (press kit) | https://sabotagestudio.com/presskits/sea-of-stars |
| 40 | Eastward | Pixel art with a 3D light system | https://eastwardgame.com/?p=154 |
| 41 | Children of Morta | Postmortem on its lighting | https://gamedeveloper.com/design/postmortem-children-of-morta |
| 42 | Nuclear Throne (Vlambeer) | Screenshake talk | https://www.youtube.com/watch?v=AJdEqssNZ-U |
| 43 | DOOM PSX | The series reference fire | https://fabiensanglard.net/doom_fire_psx/ |
| 44 | PICO-8 DOOM fire | DOOM fire drawn 4 px per cell | https://www.lexaloffle.com/bbs/?pid=172560 |
| 45 | Minifantasy (tileset) | Scorched grass and smoke columns by fire size | https://krishna-palacio.itch.io/minifantasy-raided-village |

---

## 12. What remains unverified (and corrections)

**Corrections to VFX #6**
1. **The Stardew torch.** VFX #6 called a 12x11 flame of 4 x 100 ms "the torch". In the 1.5.4 decompilation that flame belongs to the campfire, the fireplace and the torch furniture. The floor torch is an 8x8 flame of 7 frames at 100 ms, seeded with `x*3204 + y*49` [V, S47, S48].
2. **The DOOM height.** VFX #6 §1 says flames reach about 72 rows. That is the double-buffered loop. Sanglard's exact in-place loop reaches 95 rows at L = 36, measured as the row where half the columns are lit (93 against 72 in an independent re-run). The median highest lit pixel per column gives 105 against 78, so the measure must be named [I, notes 12, 18, measured; S8]. The 95 also needs wrapped edges or a wide buffer. A 64-column patch with three padding columns measured 69 rows [I, figure agent].
3. **Tibia fire field stage times.** VFX #6 quoted TFS 1.4's 3 x 120 s. Canary's data gives 200, 148 and 98 s, which matches TibiaWiki's 3:20, 2:28 and 1:38. Both are server data from different forks [V, S14, S42].
4. **Smoke cost at 320x180.** VFX #6's 0.31 ms for smoke advect plus decay was a 320x180 field of 57,600 cells, not an 80x45 field [I, lead].

**Corrections and decisions between our notes**
- **Torch size.** Note 11 proposes 10x16 px and note 13 about 6x8. The lead kept both, 10x16 on posts and walls and 6x8 carried. Both come from packs, not a shipped game's data [I, lead].
- **Tibia additions.** Tibia draws no burning overlay and no carried torch [V, S18, S22]. Every overlay, torch and rim light in this study is an Asterion addition [I].
- **Effect timing.** Note 14's flat 75 ms per frame is edubart's fixed-rate client. Current Tibia data stores a time per frame, such as FIREAREA's 40 ms plus 13 x 60 ms. Both are right for their client [V, S28, S12; I, lead].
- **Fire field frames.** 5 x 120 ms is stage 1 only. Stages 2 and 3 run 5 x 100 ms [V, S12; I, note 18].
- **Mehah's `waitFor`.** It refuses at `<=` the minimum age, and the minimum is the idle animator's value when the dat has one, 75 ms otherwise [V, S35; I, note 18].
- **Don't Starve burn times.** 10, 20 and 30 s are `standardcomponents.lua` defaults. `tuning.lua` gives 7.5, 15 and 30 s [V, S91, S93].
- **Spread at 32 px.** Note 15's Option A, 1 Hz rolls with the same table, is the decision [I, lead].
- **The arrival-time front** is note 12's own construction and is labelled [I] [I, lead].
- **Hand height.** Note 13 puts a carried torch's hand 18 px above the feet. Terraria's rule, scaled, puts it 14 px above the feet [I, notes 13, 18]. Left to the artist.
- **Areas against big sprites.** Note 11's 64x64 explosion is a pack reference for non-Tibia styles. Tibia areas are 1-tile effects [I, lead].

**Corrections from the build** [V, S6]
- **Roll phase.** The spec phased rolls by `hash(x, y) & 3`. The Sandbox phases them by the ignition tick, so the first roll comes one period after a tile caught.
- **Catching.** Note 15 made catching a stored state of one roll. A tile that waited a roll before spreading halved the front speed, so catching is visual only.
- **Burn length.** Burn time in seconds gave a 32 px tile 3 rolls against 12 at 8 px, and 32 px fronts died in 4 of 12 runs. Burn length is counted in rolls. Green grass needed 5 rolls, not VFX #6's 3.
- **Sizes and times.** No 64x64 explosion, only tiled areas. Field stages at Canary's times divided by 10. Trees 24 rolls and wood 30. Smoke drawn through its own soft-blob cluster map. The hand torch drawn in front of the body facing west, and behind only facing north. Light apply cost follows the lit pixel count.

**Labelled as estimates, self-reported or author judgement**
- Every flame, puff, ember, rim, shadow, print and explosion size for Asterion [I, notes 11, 13, 14, 15].
- Pack contents and frame counts come from seller pages [V, vendor, S124, S136, S137].
- The 64x64 canvas and bottom-right anchoring of Tibia's big sprites are inferred from box coordinates and OTClient's draw code [I, note 10].
- Tibia light colours as RGB come from an assumed 6x6x6 colour cube [I, note 17].
- The match between client effect ids and TFS names is inferred [I, note 17].

**Still unverified [U]**
- No Godot measurement of any kind. No `ImageTexture.update()` time on the web, no GDScript loop, no phone [S7].
- `DrawableTexture2D` on WebGL2. Nobody has published a web test [V, S181].
- Whether Tibia's 16 field variants are 16 shapes or crops of one picture, and what `bounding_square` means [U, note 10].
- The RimWorld speed conversion assumes flammability 1 and 60 ticks per second [U, note 15]. Project Zomboid's age unit was not pinned to seconds.
- The Terraria on-fire dust rates come from an old decompile inside a mod repo [U, S84].
- The CSIRO grass fire speed and Nuclear Throne's 6 px kick come from search snippets [U, S106; U, note 14].
- OpenGameArt pages were blocked, so their licences and frame counts come from search summaries [U, S146, S147].
- RPG Maker VX Ace's 192 px cells and its animation rate are from memory [U, note 10].

**Not found after two research rounds**
- Tone counts or burn-edge widths per flame size from any artist.
- A burnt-corpse or death-by-fire frame in any open data. Tibia leaves a 24x24 ash pile.
- Soot or ash footprints in any game.
- Devlogs showing house collapse stages, or published ash-to-grass timings.
- A 32 px top-down tileset with burnt grass, trees and houses.
- Spread speeds for Breath of the Wild, Divinity: Original Sin 2 or Far Cry 2 in m/s, and projectile speeds for Enter the Gungeon, Nuclear Throne or Hyper Light Drifter.
- Lighting methods for Eastward, Sea of Stars and Children of Morta beyond marketing text [V, S118, S119].
- Fire data for CrossCode, Chained Echoes, Hyper Light Drifter, Moonlighter, Secret of Mana, Chrono Trigger, The Minish Cap, and the default MV and MZ fire animations.

The §11 index has 45 rows. Every sourced game with a public page is in it.

---

## 13. Prototype roadmap for Godot 4.7 (web)

1. **Measure the unknowns first.** A small Godot test that times `ImageTexture.update()` for 80x45 R8, 128x128 R8 and 640x360 RGBA8 on the Compatibility renderer in a browser, on the target laptop and phone. A second test that sets up two RGBA8 `DrawableTexture2D` buffers and ping-pongs them on WebGL2. Run `firebench.html` [S7] on the same devices.
2. **Project settings.** 640x360, `viewport` stretch, `integer` scale, Nearest filter, as VFX #11 set them [S3].
3. **Server grid.** One cell per tile in typed arrays, the 4 Hz tick, the 1 Hz roll phased by the ignition tick, burn length in rolls, the hash RNG and the IGNITING flip. Unit-test that two runs with one seed match tile for tile, and check the front against the Sandbox's 0.47 and 0.91 tiles/s for green and dry grass.
4. **Burn front.** The ground shader with the per-tile burn-order map and the entry ramp. Paint the first 128x128 map for grass over a blue-noise base and compare it with the whole-tile swap at 3x. Try the arrival-time variant only after that works.
5. **Flames.** One atlas of drawn loops from the ladder in B1, field stages in 64x64 canvases with 16 variants, dying signals per stage. Add DOOM patches later, smoothed, if the drawn loops feel static on big fires.
6. **Smoke and light into the final shader.** 80x45 R8 fields uploaded whole, sampled once per pixel. This takes the two largest CPU layers off the frame.
7. **Embers and puffs.** One MultiMesh or CPUParticles2D. No GPUParticles2D on the web.
8. **Combat.** Effects with per-frame times, missiles over `150 x sqrt(d)` ms, areas from 1-tile effects with variants and a stagger, the crowding rule, scorch decals and local-only shake.
9. **Characters.** The burning tint and two flames, the carried torch with hand offsets, the rim shader, one fire shadow, soot prints from the snow print code.
10. **Art pass and phone profile.** The charred and ash tilesets, tree and house stages, lava with a palette cycle. Profile on a phone before turning on anything optional.

---

## 14. Sources

Numbered for [S#] references. All URLs come from notes 10 to 18, the lead's verification note, the shared context or the Sandbox spec. "Search summary", "snippet" or "not opened" means our researchers did not read the page directly. For sources that VFX #6 or VFX #11 already list, we often cite the earlier study itself [S2, S3].

**Series**
1. DOOM PSX fire, Fabien Sanglard, 28 Dec 2018 (series reference): https://fabiensanglard.net/doom_fire_psx/
2. VFX #6 Fire: https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel
3. VFX #11 Snow at 32 px: https://kingsfoil-artifacts.netlify.app/vfx-snow-32px-topdown-pixel
4. VFX #5 Light: https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel
5. VFX #1 Snow: https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
6. Fire 32 Sandbox, `vfx-fire-32px-sandbox.html` (companion page), with its as-built record in `notes/SANDBOX-SPEC.md` (this study)
7. Our fire benchmark, `notes/bench/firebench.html`, `run.py` and raw results, Apple M4 Pro, Chromium 153, 13 Nov 2026 (this study, note 16)
8. Our DOOM height and grain scripts, `notes/scratch-12/doomheight.js`, `doomheight2.js`, `gather.js` and `notes/scratch-18/doom18.js` (this study)
9. Our spread front scripts, `notes/scratch-15/front.js` and `notes/scratch-18/front18.js` (this study)
10. Our Tibia appearances decoder, `notes/scratch-10/decode_app.py`, with output in `notes/scratch-17/tibia-decode.txt` (this study)
11. Combat juice study, `studies/feel-combat-juice/report.md` (Kingsfoil, earlier study)

**Tibia and Open Tibia**
12. Canary `appearances.dat`: https://github.com/opentibiabr/canary/blob/main/data/items/appearances.dat
13. Canary `appearances.proto`: https://github.com/opentibiabr/canary/blob/main/src/protobuf/appearances.proto
14. Canary `items.xml`: https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
15. Canary `utils_definitions.hpp`, effect ids: https://github.com/opentibiabr/canary/blob/main/src/utils/utils_definitions.hpp
16. Canary `game.cpp`, fire damage to effect and colour: https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp
17. TFS `const.h`: https://github.com/otland/forgottenserver/blob/master/src/const.h
18. TFS `condition.cpp`: https://github.com/otland/forgottenserver/blob/master/src/condition.cpp
19. TFS `game.cpp`: https://github.com/otland/forgottenserver/blob/master/src/game.cpp
20. TFS `tile.cpp`: https://github.com/otland/forgottenserver/blob/master/src/tile.cpp
21. TFS `monster.cpp`: https://github.com/otland/forgottenserver/blob/master/src/monster.cpp
22. TFS `player.cpp`: https://github.com/otland/forgottenserver/blob/master/src/player.cpp
23. TFS `spells.lua`, area arrays: https://github.com/otland/forgottenserver/blob/master/data/scripts/lib/spells.lua
24. TFS attack rune scripts: https://github.com/otland/forgottenserver/tree/master/data/scripts/runes/attack
25. TFS `fire_wave.lua`: https://github.com/otland/forgottenserver/blob/master/data/scripts/spells/attack/fire_wave.lua
26. TFS `hell's_core.lua`: https://github.com/otland/forgottenserver/blob/master/data/scripts/spells/attack/hell's_core.lua
27. TFS `map.h`: https://github.com/otland/forgottenserver/blob/master/src/map.h
28. OTClient (edubart) `effect.cpp` and `effect.h`: https://github.com/edubart/otclient/blob/master/src/client/effect.cpp
29. OTClient (edubart) `missile.cpp` and `missile.h`: https://github.com/edubart/otclient/blob/master/src/client/missile.cpp
30. OTClient (edubart) `const.h`: https://github.com/edubart/otclient/blob/master/src/client/const.h
31. OTClient (edubart) `animatedtext.cpp`: https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp
32. OTClient (Mehah) `item.cpp`: https://github.com/mehah/otclient/blob/main/src/client/item.cpp
33. OTClient (Mehah) `animator.cpp`: https://github.com/mehah/otclient/blob/main/src/client/animator.cpp
34. OTClient (Mehah) `thingtype.cpp`: https://github.com/mehah/otclient/blob/main/src/client/thingtype.cpp
35. OTClient (Mehah) `effect.cpp`: https://github.com/mehah/otclient/blob/main/src/client/effect.cpp
36. OTClient (Mehah) `missile.cpp`: https://github.com/mehah/otclient/blob/main/src/client/missile.cpp
37. OTClient (Mehah) `tile.cpp`: https://github.com/mehah/otclient/blob/main/src/client/tile.cpp
38. OTClient (Mehah) `gameconfig.h`: https://github.com/mehah/otclient/blob/main/src/client/gameconfig.h
39. OTClient (Mehah) `lightview.cpp`: https://github.com/mehah/otclient/blob/main/src/client/lightview.cpp
40. OTClient (Mehah) `animatedtext.cpp`: https://github.com/mehah/otclient/blob/main/src/client/animatedtext.cpp
41. OTClient (Mehah) `data/setup.otml`: https://github.com/mehah/otclient/blob/main/data/setup.otml
42. TibiaWiki, Fire (MediaWiki API): https://tibia.fandom.com/api.php?action=parse&page=Fire&prop=wikitext&format=json
43. TibiaWiki, Lava (MediaWiki API): https://tibia.fandom.com/api.php?action=parse&page=Lava&prop=wikitext&format=json
44. TibiaWiki, Fire Effect and other effect pages (MediaWiki API): https://tibia.fandom.com/api.php?action=parse&page=Fire_Effect&prop=wikitext&format=json
45. TibiaWiki, Fire Field: https://tibia.fandom.com/wiki/Fire_Field
46. TibiaWiki, Great Fireball Rune: https://tibia.fandom.com/wiki/Great_Fireball_Rune

**Stardew Valley**
47. Stardew 1.5.4 decompilation, `Torch.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/Torch.cs
48. Same, `Objects/Furniture.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/Objects/Furniture.cs
49. Same, `Object.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/Object.cs
50. Same, `Locations/VolcanoDungeon.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/Locations/VolcanoDungeon.cs
51. Same, `GameLocation.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/GameLocation.cs
52. A pre-1.5 decompilation, `GameLocation.cs`, `explode`: https://github.com/E-riCA0/StawdewValley/blob/HEAD/GameLocation.cs
53. Same, `TemporaryAnimatedSprite.cs`, bomb radii: https://github.com/E-riCA0/StawdewValley/blob/HEAD/TemporaryAnimatedSprite.cs
54. Same, `Utility.cs`, `addSmokePuff`: https://github.com/E-riCA0/StawdewValley/blob/HEAD/Utility.cs
55. Stardew Valley Wiki, Campfire: https://stardewvalleywiki.com/Campfire
56. Stardew Valley Wiki, Volcano Dungeon: https://stardewvalleywiki.com/Volcano_Dungeon
57. Stardew Valley Wiki, Bomb: https://stardewvalleywiki.com/Bomb

**RPG Maker**
58. RPG Maker MV `Sprite_Animation.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Animation.js
59. RPG Maker MV `Sprite_StateOverlay.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_StateOverlay.js
60. RPG Maker MV `Sprite_Damage.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Damage.js
61. RPG Maker MZ default `Animations.json` (copy in a project): https://github.com/KageDesu/Alpha-ABS-Z/blob/master/data/Animations.json

**Pokémon and Zelda**
62. pokeemerald `battle_anim_scripts.s`: https://github.com/pret/pokeemerald/blob/master/data/battle_anim_scripts.s
63. pokeemerald `battle_anim_fire.c`: https://github.com/pret/pokeemerald/blob/master/src/battle_anim_fire.c
64. pokeemerald `field_effect_objects.h`: https://github.com/pret/pokeemerald/blob/master/src/data/field_effects/field_effect_objects.h
65. pokeemerald `field_effect_helpers.c`: https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c
66. zelda3 `ancilla.c`: https://github.com/snesrev/zelda3/blob/master/src/ancilla.c

**Fire in other games**
67. Shattered Pixel Dungeon `Fire.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/blobs/Fire.java
68. SPD `FlameParticle.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/particles/FlameParticle.java
69. SPD `SmokeParticle.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/particles/SmokeParticle.java
70. SPD `BlobEmitter.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/BlobEmitter.java
71. SPD `CharSprite.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/CharSprite.java
72. SPD `Burning.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/buffs/Burning.java
73. SPD `Level.java` and `Terrain.java`: https://github.com/00-Evan/shattered-pixel-dungeon/tree/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels
74. Brogue CE `Globals.c`: https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c
75. Brogue CE `Time.c`: https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Time.c
76. Brogue CE `IO.c` and `Rogue.h`: https://github.com/tmewett/BrogueCE/blob/master/src/brogue/IO.c
77. Cataclysm DDA `cata_tiles.cpp`: https://github.com/CleverRaven/Cataclysm-DDA/blob/master/src/cata_tiles.cpp
78. Cataclysm DDA `field_type.json`: https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/field_type.json
79. Cataclysm DDA `terrain-walls.json`: https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/furniture_and_terrain/terrain-walls.json
80. CDDA-Tilesets, MShockXotto+ fire JSON and `tile_info.json`: https://github.com/I-am-Erk/CDDA-Tilesets/tree/master/gfx/MShockXotto%2B
81. Cataclysm DDA `TILESET.md`: https://github.com/CleverRaven/Cataclysm-DDA/blob/master/doc/TILESET.md
82. Terraria decompile, `Main.cs`: https://github.com/aoki-lizlov/terraria-decompiled/blob/master/root/Terraria/Main.cs
83. Terraria decompile, `TileDrawing.cs`: https://github.com/aoki-lizlov/terraria-decompiled/blob/master/root/Terraria/GameContent/Drawing/TileDrawing.cs
84. Terraria old decompile in the Freeria mod repo, `Main.cs`: https://github.com/dptetc/Freeria/blob/6eedc5ff0752e1e5854a08f01db04edfcda3346f/Freeria/Main.cs
85. Same repo, `Player.cs`: https://github.com/dptetc/Freeria/blob/6eedc5ff0752e1e5854a08f01db04edfcda3346f/Freeria/Player.cs
86. Terraria Wiki, On Fire!: https://terraria.wiki.gg/wiki/On_Fire!
87. Terraria Wiki, Campfires: https://terraria.wiki.gg/wiki/Campfires
88. RimWorld decompile, `Fire.cs`: https://github.com/josh-m/RW-Decompile/blob/master/RimWorld/Fire.cs
89. RimWorld decompile, `FireUtility.cs`: https://github.com/josh-m/RW-Decompile/blob/master/RimWorld/FireUtility.cs
90. RimWorld Wiki, Fire: https://rimworldwiki.com/wiki/Fire
91. Don't Starve Together `standardcomponents.lua`: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/standardcomponents.lua
92. Don't Starve Together `components/propagator.lua`: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/components/propagator.lua
93. Don't Starve Together `tuning.lua`: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/tuning.lua
94. Don't Starve Together `prefabs/evergreens.lua`: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/prefabs/evergreens.lua
95. Don't Starve Together scripts (second mirror), `standardcomponents.lua`, burnable characters: https://github.com/penguin0616/dst_gamescripts/blob/master/standardcomponents.lua
96. Project Zomboid 41.78 decompile, `IsoFire.java`: https://github.com/Ketum-Git/PZ-Javacode/blob/master/PZ_41.78/zombie/iso/objects/IsoFire.java
97. Same, `IsoFireManager.java`: https://github.com/Ketum-Git/PZ-Javacode/blob/master/PZ_41.78/zombie/iso/objects/IsoFireManager.java
98. Same, `IsoGridSquare.java`: https://github.com/Ketum-Git/PZ-Javacode/blob/master/PZ_41.78/zombie/iso/IsoGridSquare.java
99. Minecraft Wiki, Fire: https://minecraft.wiki/w/Fire
100. Minecraft Wiki, Grass Block: https://minecraft.wiki/w/Grass_Block
101. Minecraft Wiki, Tick: https://minecraft.wiki/w/Tick
102. Don't Starve Wiki, Fire: https://dontstarve.wiki.gg/wiki/Fire
103. Noita Wiki, Status effects: https://noita.wiki.gg/wiki/Status_effects
104. Noita Wiki, Fire: https://noita.wiki.gg/wiki/Fire
105. Dwarf Fortress Wiki, Fire: https://dwarffortresswiki.org/index.php/DF2014:Fire
106. CSIRO Spark news, grassfire speed (search snippet): https://research.csiro.au/spark/news
107. Far Cry 2 fire interview, Game Developer: https://www.gamedeveloper.com/game-platforms/interview-how-i-far-cry-2-i-s-fire-fuels-spreads
108. Jean-François Levesque, Far Cry 2 fire blog: https://jflevesque.com/2012/12/06/far-cry-how-the-fire-burns-and-spreads/
109. Sigil of Kings, Wildfires devlog: https://byte-arcane.itch.io/sigil-of-kings/devlog/712302/wildfires
110. Enter the Gungeon Wiki, Goop: https://enterthegungeon.wiki.gg/wiki/Goop
111. Enter the Gungeon Wiki, Status Effects: https://enterthegungeon.wiki.gg/wiki/Status_Effects
112. ServUO `FireField.cs`: https://github.com/ServUO/ServUO/blob/master/Scripts/Spells/Fourth/FireField.cs
113. roBrowser Legacy `EffectTable.js`: https://github.com/MrAntares/roBrowserLegacy/blob/master/src/DB/Effects/EffectTable.js
114. rAthena `skill_db.yml`: https://github.com/rathena/rathena/blob/master/db/re/skill_db.yml
115. iRO Wiki, Fire Wall: https://irowiki.org/wiki/Fire_Wall
116. Graveyard Keeper, how the graphics effects are made: https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
117. Children of Morta postmortem (search snippet): https://gamedeveloper.com/design/postmortem-children-of-morta
118. Sea of Stars press kit (search snippet): https://sabotagestudio.com/presskits/sea-of-stars
119. Eastward official site (search snippet): https://eastwardgame.com/?p=154
120. Bulbapedia, Burn (status condition): https://bulbapedia.bulbagarden.net/wiki/Burn_(status_condition)
121. Bulbapedia, Route 113: https://bulbapedia.bulbagarden.net/wiki/Route_113
122. Wikipedia, Forest-fire model: https://en.wikipedia.org/wiki/Forest-fire_model
123. Wizard of Legend 2 afflictions (search snippet): https://maxroll.gg/wizard-of-legend-2/guides/afflictions-in-wizard-of-legend-2

**Pixel-art craft and packs**
124. brullov, Fire Animation (seller page): https://brullov.itch.io/fire-animation
125. Krishna Palacio, Minifantasy Raided Village (seller page): https://krishna-palacio.itch.io/minifantasy-raided-village
126. Idylwild, Chromatic Campfires: https://idylwild.itch.io/campfires
127. urais, Pixel Art Animated Torches: https://urais.itch.io/animatedtorches
128. Silas Games, Pixel Campfire FX (seller page): https://silasgamedev.itch.io/pixel-campfire
129. Pixel Joint, "Busy Flames": https://pixeljoint.com/pixelart/161988.htm
130. Pixel Joint, candle flame thread: https://pixeljoint.com/forum/forum_posts.asp?TID=25996
131. Slynyrd, Pixelblog 33, Wind Effects, 16 Jul 2021: https://www.slynyrd.com/blog/2021/7/16/pixelblog-33-wind-effects
132. Slynyrd, Pixelblog 6, Light and Shadow: https://www.slynyrd.com/blog/2018/6/15/pixelblog-6-light-and-shadow
133. Slynyrd, Pixelblog catalogue: https://www.slynyrd.com/pixelblog-catalogue
134. Slynyrd, Pixelblog 31, Shmup Sprite Design, 14 Dec 2020: https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design
135. Pixel Beef, xDasher devlog on light and depth: https://pixel-beef.itch.io/xdasher/devlog/192949/4-things-we-did-to-add-light-and-depth-to-our-pixel-art-game
136. pimen, Smoke n Dust 04 (seller page): https://pimen.itch.io/smoke-n-dust-04
137. pimen, Explosion Effect (seller page): https://pimen.itch.io/explosion-effect
138. Reactorcore, explosion minipack: https://reactorcore.itch.io/explosion-spriteanim-sheet-minipack
139. Nano Combat, smoke dither post: https://itch.io/post/477565
140. Lospec, tutorials tagged fire: https://lospec.com/pixel-art-tutorials/tags/fire
141. Endesga 32 palette JSON: https://lospec.com/palette-list/endesga-32.json
142. Resurrect 64 palette JSON: https://lospec.com/palette-list/resurrect-64.json
143. Apollo palette JSON: https://lospec.com/palette-list/apollo.json
144. Sweetie 16 palette JSON: https://lospec.com/palette-list/sweetie-16.json
145. Oleander Studios, edge lighting (search summary): https://www.oleanderstudios.com/edge-lighting-how-to-add-interest-to-your-character-art/
146. OpenGameArt, animated pixel torch (search summary): https://opengameart.org/content/animated-pixel-torch
147. OpenGameArt, camp fire animation (search summary): https://opengameart.org/content/camp-fire-animation
148. Matt Walkden, explosion pack (search summary): https://mattwalkden.itch.io/explosion-pack
149. Isotile Universe, burnt forest set (search summary): https://isotileuniverse.itch.io/isometrictiles-burntforest-set-01
150. saint11, pixel art tutorials index: https://saint11.art/blog/pixel-art-tutorials/
151. Lospec gallery, Pixel Principles "Campfire" (search summary): https://lospec.com/gallery/pixelprinciples/campfire
152. Penusbmic, understanding explosions tutorial (seller page): https://penusbmic.itch.io/pixel-art-tutorial-understanding-explosions
153. dibbelgames, explosion effect (snippet): https://dibbelgames.itch.io/explosioneffect-pixelart
154. Lospec gallery, pixelcraftmaestro "Campfire" (search summary): https://lospec.com/gallery/pixelcraftmaestro/campfire

**Burn shaders and buffer fire**
155. mreliptik, 2D dissolve with burn edge: https://godotshaders.com/shader/2d-dissolve-with-burn-edge/
156. Demyr, Pixelated burn: https://godotshaders.com/shader/pixelated-burn/
157. enekoassets, 2D Burn/dissolve with direction: https://godotshaders.com/shader/2d-burn-dissolve-with-direction-v-1-0/
158. arlez80, Pixel-burn Shader: https://godotshaders.com/shader/pixel-burn-shader/
159. godotshaders.com, search "burn": https://godotshaders.com/?s=burn
160. Lode Vandevenne, Fire Effect: https://lodev.org/cgtutor/fire.html
161. Hugo Elias, fire (archived): https://web.archive.org/web/2016/http://freespace.virgin.net/hugo.elias/models/m_fire.htm
162. PICO-8 DOOM fire: https://www.lexaloffle.com/bbs/?pid=172560
163. filipedeschamps, doom-fire-algorithm: https://github.com/filipedeschamps/doom-fire-algorithm
164. Jason Coon, LED DOOM fire gist (search summary): https://gist.github.com/jasoncoon/c5103fd5d0ba4d7da3677ed5187fc61c
165. 32blit SDK `doom-fire.cpp` (search summary): https://pigweed.googlesource.com/third_party/github/32blit/32blit-sdk/+/bc6fa8911fcb39dcfd100f352e2d193b7eff7e6b/examples/doom-fire/doom-fire.cpp
166. Casual-Cynic, sconce-fire-test: https://github.com/Casual-Cynic/sconce-fire-test
167. Simple Pixelated Fire shader: https://godotshaders.com/shader/simple-pixelated-fireshader/
168. raylib `textures_fog_of_war.c`: https://github.com/raysan5/raylib/blob/master/examples/textures/textures_fog_of_war.c

**Godot**
169. ImageTexture class, 4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/ImageTexture.xml
170. GPUParticles2D class, 4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/GPUParticles2D.xml
171. CPUParticles2D class, 4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/CPUParticles2D.xml
172. Godot docs, particle systems 2D: https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/2d/particle_systems_2d.rst
173. Godot docs, 2D lights and shadows: https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/2d/2d_lights_and_shadows.rst
174. GLES3 `rasterizer_canvas_gles3.cpp` and `.h`, 4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/drivers/gles3/rasterizer_canvas_gles3.cpp
175. GLES3 `canvas.glsl`, 4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/drivers/gles3/shaders/canvas.glsl
176. ProjectSettings class, 4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/ProjectSettings.xml
177. SubViewport class, 4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/SubViewport.xml
178. DrawableTexture2D class, 4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/DrawableTexture2D.xml
179. Godot docs, using DrawableTextures: https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/rendering/drawable_textures.rst
180. Godot PR #105701, "Implement DrawableTextures", merged 30 Jan 2026: https://github.com/godotengine/godot/pull/105701
181. Godot issue #123507 and related DrawableTexture2D issues: https://github.com/godotengine/godot/issues/123507
182. Godot issue #87843, GPUParticles2D web load times: https://github.com/godotengine/godot/issues/87843
183. Godot issue #86731, Compatibility shader compile time: https://github.com/godotengine/godot/issues/86731
184. MDN, `EXT_color_buffer_float` (not re-read): https://developer.mozilla.org/docs/Web/API/EXT_color_buffer_float
185. GodotCon Amsterdam 2026, "Procedural Pixel Art: Retro VFX with Shaders": https://talks.godotengine.org/godotcon-ams-2026/talk/NSNXFT/
186. Godot docs, multiple resolutions: https://docs.godotengine.org/en/stable/tutorials/rendering/multiple_resolutions.html
187. Godot proposal #13012, partial texture updates: https://github.com/godotengine/godot-proposals/issues/13012
188. GLES3 `texture_storage.cpp`, 4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/drivers/gles3/storage/texture_storage.cpp

**Benchmark method and talks**
189. Chrome DevTools Protocol, `Emulation.setCPUThrottlingRate`: https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setCPUThrottlingRate
190. `EXT_disjoint_timer_query_webgl2`: https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/
191. HTML spec, canvas `willReadFrequently`: https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently
192. Vlambeer, "The Art of Screenshake" (video): https://www.youtube.com/watch?v=AJdEqssNZ-U
193. Vlambeer co-founder on action games, Game Developer (search snippet): https://gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games

