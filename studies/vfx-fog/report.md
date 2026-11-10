# Top-down pixel fog: tiny algorithms for ground mist, cloud shadows, fog of war and atmospheric haze

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #8 in our VFX series. Each study picks one concept and hunts for old-school algorithms that are very small and very efficient.

- **Study #1, snow** [S2]: palette lighting and dithered lamp pools.
- **Study #2, acid** [S3]: glow by block-sum blur plus palette select.
- **Study #3, rain** [S4]: rain haze, spray mist and mist after rain.
- **Study #4, forest** [S5]: shade ellipses, sunflecks, canopy and wind.
- **Study #5, light** [S6]: the Tibia light model, day and night, a first look at cloud shadows, shadowcasting and `DrawableTexture2D`.
- **Study #6, fire and smoke** [S7]: an advected smoke field, Bayer smoke, smoke that blocks sight, and the first measured grid costs.
- **Study #7, water** [S8]: shorelines, rivers and waterfall mist.

Study #5 owns field of view, so shadowcasting is an input to fog of war here, not a new derivation. Study #6 owns the smoke field, and fog is that field with slower decay, no upward push and different sources.

The series reference is the **DOOM PSX fire** [S1]. One byte per pixel, one rule, one palette. Fog fits that shape well. A density byte per cell holds the truth, a palette ramp turns it into colour, and a shared clock makes it drift. Pokémon Emerald draws fog with 20 hardware sprites and one blend register [V, S11, S13]. Tibia has no fog of war, because the server never sends anything outside an 18 by 14 tile window [V, S21].

Four areas get equal depth: ground fog and mist, clouds and cloud shadows, fog of war, and atmosphere. A family on gameplay fog (smoke bombs, fog spells, weather as server state) ties them to the MMO.

**Two equal goals.**
- **Artistic quality.** What makes fog beautiful and moody in pixel art, as artists and players judge it: palette, dither against alpha, banding, motion, layering, and readability through the fog.
- **Runtime efficiency.** What each technique costs on a weak web build. For the first time in the series we measured most shader techniques ourselves (§6a). Every cost field gives a number, measured or labelled as an estimate.

**Targets.**
- Godot 4, web-first, so the **Compatibility renderer** (WebGL 2, no compute shaders, limited 2D lights).
- Top-down (3/4) pixel art on 32x32 tiles for the Tibia-like MMORPG **Asterion Online** and a top-down RPG. The MMO is server-authoritative, so players share weather and nobody sees what the server hides.
- Weak hardware. Phones and old laptops.

**Sources.** Ten research notes, our **Fog Sandbox** [S9] and our benchmark [S10], run on an Apple M4 Pro in Chromium 153 on the real GPU (ANGLE Metal) and on software GL (SwiftShader), with a 6x CPU throttle as a low-end proxy. **No phone was measured.** Treat every millisecond here as a desktop figure with a ranking you can trust, not a phone budget.

---

## 1. Executive summary

**Runtime efficiency.**

1. **At native pixel resolution the GPU cost of fog is negligible.** At 320x180 every shader we tested costs 1 to 13 microseconds on the M4 GPU, including 64-sample god rays [V, S10].
2. **Rankings spread only at output resolution.** At 720p a texture-noise layer costs about 0.010 to 0.014 ms, value fbm with 4 octaves 0.065 ms, simplex fbm 0.133 ms, and god rays 0.021 ms (8 samples) to 0.141 ms (64) [V, S10]. A texture layer is about 8x cheaper than a hashed octave, and simplex buys nothing over value noise in pixel art.
3. **Translucent layers add linearly, and opaque benchmarks lie.** Four blended layers cost 3.9x one. Apple's hidden-surface removal made our first, opaque run report 1080p fbm 56x too cheap [V, S10, S154]. Every fog layer pays full price on tile-based mobile GPUs.
4. **The budget risks are CPU work in JS or GDScript, texture re-uploads, screen copies, and fog drawn at output resolution instead of native.** JS per-pixel fbm at 320x180 costs 0.24 to 0.81 ms, 1.4 to 4.7 ms throttled, 3.8 to 12.9 ms at 720p [V, S10]. An 80x45 density grid step costs 0.06 ms (0.34 throttled) [V, S10]. One Godot fog-of-war demo re-uploads 4 MB per move [V, S98; I, note 07], where a 256x256 R8 mask uploads in 0.018 ms [V, S10].
5. **Fog of war is cheap with deltas.** With 1000 units at radius 8 on 256x256: full recompute 0.18 ms, full re-stamp 0.31 ms, stamping only cells that enter and leave 0.048 ms [V, S10]. Line of sight is the real cost, and study #5 owns it [S6].

**Artistic quality.**

6. **Fog is a colour problem first.** Artists push low or far things toward the sky or light colour, drop saturation and cut contrast in a few flat bands [V, S112, S113]. Lower contrast alone reads as distance [V, S70]. A grey alpha wash reads as a filter [I, note 06].
7. **Palette steps or world-locked Bayer, never plain alpha.** A table that moves each colour N steps toward the fog colour keeps every pixel on the palette, as DOOM's COLORMAP did for light [S6; I]. Bayer locked to world pixels never swims [I, note 05]. Both cost about 0.016 ms at 720p [V, S10].
8. **Slow and layered.** Emerald's fog drifts about 15 px/s, its diagonal fog 20 and 12 px/s [V, S11]. Players call faster one-way drift smoke, oil or water [V, S118].
9. **Fog pools in low ground.** `fog = 1 − exp(−k · max(0, fogLine − tileHeight))` fills valleys and leaves ridges, roofs and treetops clear [I, note 05]. Lowering the fog line after sunrise clears the rim first, as real radiation fog does [V, S110].
10. **Players hate fog that hides threats and adds a penalty at once** (Route 210, Heavy Fog, a WoW spore fog) [V, S119, S120, S121]. Keep characters and telegraphs readable, clear a radius around the player, and ship a strength slider and reduce motion [V, S129; I].

**Pretty and cheap.** Height pooling (B3), palette fog (C2), memory with a short reveal (E4), haze with a contrast drop (F1), pre-drawn shafts (F3) and time-of-day colour (H1) score 10 of 10 on taste plus mood and 5 on speed.

**Pretty but expensive.** Radial-blur god rays (F4), 18 ms at 720p on software GL plus a screen copy [V, S10]; full procedural two-level warp (B2), 5 fbm calls per pixel [V, S51]; a Stam solver, 32.1 ms at 320x180 in study #6 [V, S7].

**Cheap but ugly.** Plain alpha (C3), additive screen fog like OTClient's (A4), animated blue noise (C4), and an undithered bilinear fog-of-war mask (E3).

**Recommendation for Asterion** [I]. The server sends 5 weather bytes per region on change and never sends hidden creatures. The client runs an 80x45 field at 10 Hz from Beer's-law pooling, scrolls two layers of one baked table over it, and resolves fog through a palette-step table with world-locked Bayer, all at 320x180. Clouds threshold a table and shade one palette step. Fog of war is a count per tile with delta updates and a dithered, fading edge. Lamps get small halos sized by local fog. Section 7 has the layers, §8 the Sandbox.

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: code, paper, docs, wiki or article, or our own measurement [S10]. "[V, vendor]" and "[V, self-reported]" mark figures reported by their own authors or sellers. |
| **[I]** | Author inference or design proposal. Untested unless it says "Sandbox", and then tested only in our JavaScript prototype. |
| **[U]** | Unverified: memory, a search snippet, or a page that could not be fetched. Treat it as a lead. |
| **[K]** | Textbook or canonical knowledge (maths, well-known release years). |

- [S#] refers to §14. "[I, note 0X]" is an inference made by the researcher in that note.
- Ratings (1–5) are author judgement: **Simplicity · Speed · Pixel taste · Mood · Interactivity**.
- **Speed follows the measurements** [S10]. 5 means under about 0.02 ms per frame at 720p on the M4 GPU, or under 0.1 ms of CPU at native size, with no screen copy. 4 means a few times more, or CPU work that needs care in GDScript. 3 means a cost you see on software GL or at full resolution. 2 means it does not belong in a web frame.
- **Measured numbers are desktop numbers.** The 6x throttle is a CPU estimate, SwiftShader only bounds a device with no GPU, and Godot adds its own canvas pass and blit.
- Sandbox numbers are illustrative; the Sandbox is a Canvas 2D page, not a Godot build.

---

## 3. Generations: a timeline

**Gen 0: the science and the theory**
- **1852** Beer's law of attenuation, the root of every `1 − exp(−k·d)` fog [K; V, S56]. **1985** Perlin noise [K]; **1993** Ulichney's void-and-cluster blue noise [V, S65].
- **1994** O'Shea, Blackburn and Ono show contrast alone works as a depth cue [V, S70]. **1996** Worley cellular noise [V, S61].
- **2002** Perlin's improved noise, with the 6t⁵ − 15t⁴ + 10t³ fade [V, S59]. **2003** Stam's stable fluids for games [V, S73].
- **2007** Mitchell's radial-blur light scattering in GPU Gems 3; Bridson's curl noise [V, S63, S60]. **2011** OpenConflict shows every RTS map hack is undetectable [V, S38].
- **2012** McEwan and colleagues measure texture-free GLSL noise [V, S57]. **2014** Demofox, analytic fog density [V, S54].

**Gen 1: hardware layers, palettes and three states (1987–2004)**
- NetHack stores what the hero remembers per cell (1987 onward) [V, S45]. **1991** ALttP fog on BG1 with colour math add-half [K; V, S17].
- **1995** Warcraft II adds grey fog over explored ground [K; V, S25]. **1997** Tibia and Ultima Online ship view windows and light levels instead of fog of war [K; V, S21, S22].
- **1998** StarCraft rebuilds vision every 100 frames [K; V, S30]. **2000** Pokémon Crystal swaps to a darkness palette in caves [K; V, S15].
- **2004** Pokémon Emerald draws fog with 20 world-locked 64x64 sprites, clouds with 3, and Flash with a per-scanline window [K; V, S11, S14].

**Gen 2: shaders, RTS engines and indie mood (2005–2020)**
- **2009** League of Legends launches; its fog runs on a 128x128 grid [K; V, S34]. **2013** Dota 2 and Smoke of Deceit [K; V, S143].
- **2016** Riot's "Story of Fog and War" post; Peters publishes CC0 blue noise [V, S34, S65]. **2017** Hollow Knight fog and haze objects [V, S134].
- **2018** Graveyard Keeper's sprite fog with altitude; Return of the Obra Dinn's dither; Into the Breach smoke tiles [V, S117, S67, S148]. **2019** Wargroove fog of war [V, S149].
- **2020** VALORANT ships server-side fog of war at under 2% of server frame time [V, S35]. **2021** first CC0 Godot fog overlay and god-ray shaders [V, S86, S90].

**Gen 3: Godot, the web and measured costs (2022–2026)**
- **2022** Fukyuuten's stencilled cloud shadows; Gustavson and McEwan's WebGL tiling noise [V, S101, S58]. **2023** Baldur's Gate 3 Fog Cloud and Darkness [V, S145, S146].
- **Oct 2024** Hypercoven's hex fog devlog [V, S43]. **Mar 2025** Godot 4.4 brings per-instance uniforms to 2D [U on date; V, S78]. **Sep 2025** Godot 4.5, stencil for 3D only [V, S79].
- **Jan 2026** Godot 4.6; thatisuday's pixel cloud-shadow shader [V, S80, S88]. **Feb 2026** r/IndieDev players call fast fog "oil" [V, S118]. **Apr 2026** CESCG weather chains from 50 years of data [V, S106].
- **May 2026** Slynyrd's Pixelblog 62 on haze [V, S112]. **Jun 2026** Godot 4.7 with `DrawableTexture2D` [V, S81, S82]. **Oct 2026** circle-cluster cloud shader; Recoil release [V, S89, S33]. **Nov 2026** our fog benchmark [V, S10].

---

## 4. Technique profiles

There are eight families:

- **A.** Classic roots
- **B.** Ground fog and mist
- **C.** Rendering fog for pixel art
- **D.** Clouds and cloud shadows
- **E.** Fog of war
- **F.** Atmosphere and depth
- **G.** Gameplay fog and weather
- **H.** Palette, time of day and accessibility

Each profile ends with ratings for **Simplicity · Speed · Pixel taste · Mood · Interactivity** (1 = poor, 5 = excellent; author judgement). Family A is the history we copy from. B, C and D are how fog and clouds look and move. E is what the player may see, and G is what the server decides. F and H are the finish. Every cost field gives a number. Measured figures come from our benchmark [S10] unless another source is named. Sandbox constants are in §8.

### Family A: Classic roots

### A1. Pokémon Emerald fog sprites: 20 world-locked tiles and one blend register

*In plain words.* Emerald covers the screen with 20 copies of one soft 64x64 fog picture. The grid moves with the map, so the fog lies on the ground, and it creeps one whole pixel every few frames. The GBA blend hardware mixes it in and fades it in by small steps.

*How it works (technical).*
- **Layout** [V, S11, S13]. 20 OAM sprites, 64x64 4bpp, at `x = (i % 5) * 64 + 32`, `y = (i / 5) * 64 + 32`, so 320x256 over a 240x160 screen.
- **Drift** [V, S11]. Horizontal fog steps 1 px every 4 frames, about 15 px/s; diagonal fog about 20 px/s across and 12 down. Position `(gSpriteCoordOffsetX - fogHScrollOffset) & 0xFF` locks it to the world and wraps every 256 px.
- **Blend** [V, S12, S16]. Target `(EVA 12, EVB 8)`; the GBA computes `min(31, (A·EVA + B·EVB) / 16)`, so 75% fog plus 50% scene. `Weather_UpdateBlend` moves one coefficient by 1 per delay.

*Cost / performance.* A few register writes and 20 sprite moves per frame on the GBA [V, S11]. In Godot it is one blended texture layer, measured at 0.0008 ms at 320x180 and 0.010 ms at 720p [V, S10].

*Games that used it.*
- Pokémon Emerald (Route 119, Mt. Pyre): https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c

*How it feels.* Calm and milky. The 125% sum washes the scene toward the fog colour, and whole-pixel steps stay crisp.

*Risks.* The additive sum lifts night blacks into grey. A 256 px repeat shows on a 320 px screen if the art has strong features [I, notes 01, 06].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 1

### A2. ALttP overlays: one background layer, colour math and no parallax

*In plain words.* A Link to the Past puts the Lost Woods fog on its own background layer and adds it at half strength. The fog ignores the camera and drifts on its own, like air in front of your eyes. Canopy and cloud overlays follow the camera at half or quarter speed and feel high up.

*How it works (technical).* From the zelda3 reimplementation [V, S17, S18]:
- **Blend.** `CGADSUB = 0x72` for fog, forest and rain overlays, which is add plus half, a 50/50 average.
- **Drift.** Overlays 0x97 and 0x9D add `0x2000` per frame in 16.16 fixed point to both scroll registers, 1/8 px per frame, about 7.5 px/s, with no camera term. Reading 0x9D as Lost Woods fog comes from a code comment [I, note 01].
- **Parallax.** Other overlays add the camera delta shifted right by 1 or 2, half or quarter speed.
- **Lightning.** Rain switches to 0x32 (add, no half) on frames 3 and 88, so the screen flashes at no art cost.

*Cost / performance.* One offset per frame on the SNES. As a shader, one blended fetch, 0.0008 ms at 320x180 and 0.010 ms at 720p [V, S10].

*Games that used it.*
- The Legend of Zelda: A Link to the Past: https://github.com/snesrev/zelda3/blob/master/src/overworld.c

*How it feels.* The Lost Woods is remembered for its fog. A 50% average works because the art is sparse with transparent gaps [I, note 01]. Screen-locked fog suits mood haze; world-locked fog (A1) suits fog on the ground [I, note 04].

*Risks.* Add-half only brightens, so it cannot make a scene gloomier. The lightning needs a flash-limit check (H3) [V, S130].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 1

### A3. Palette darkness and the hardware window

*In plain words.* Pokémon Crystal makes a dark cave by swapping the whole palette to a set where only the brightest shades survive. Emerald cuts a real circle of light around the player with the GBA window, redrawn line by line from a table of radii.

*How it works (technical).*
- **Crystal** [V, S15]. `DARKNESS_PALSET` when the map is dark and Flash is off; the night palette once Flash is used.
- **Emerald** [V, S14]. `sFlashLevelToRadius[] = { 200, 72, 64, 56, 48, 40, 32, 24, 0 }`, written into `REG_WIN0H` per scanline.
- **For Asterion** [I, note 01]. The 8-step table is a ready design for light-radius levels; double it for 32 px tiles.

*Cost / performance.* Zero per pixel. A palette swap is a few colour writes, and the window is 160 scanline writes per frame [V, S14, S15]. In Godot a swap is one uniform on a lookup shader [I].

*Games that used it.*
- Pokémon Crystal: https://github.com/pret/pokecrystal/blob/master/engine/tilesets/timeofday_pals.asm
- Pokémon Emerald (Flash): https://github.com/pret/pokeemerald/blob/master/src/field_screen_effect.c

*How it feels.* The darkness palette is moody and fully on-palette. The hard window edge is cheap but stark; study #5's dithered pools are what we would ship [I, note 01; S6].

*Risks.* A whole-palette swap cannot vary across the screen, so a fog bank cannot sit next to clear ground [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 3 · Interactivity 2

### A4. Tibia and OTClient: a view window, floor fading and an optional fog shader

*In plain words.* Tibia has no fog of war. The client only knows a small rectangle around the player and hides the floors above. Some OTClient builds add a "Map - Fog" shader that lays a scrolling cloud picture over the map. Ultima Online and RuneScape treat fog as light level or distance, not weather.

*How it works (technical).*
- **Window** [V, S19, S21]. The client knows 18x14 tiles and shows 15x11; the server's `canSee` uses the same window, shifted one tile per floor.
- **Floors** [V, S19]. Floors above fade over `m_floorFading = 500` ms.
- **Fog shader** [V, S20]. `col = bgcol + fogcol * 0.6`, additive, direction (1, 0.3) at speed 0.05, UV offset by `u_WalkOffset` so it stays world-locked.

*Cost / performance.* Two range compares per creature per viewer on the server [V, S21]. The shader is one fetch, 0.010 ms at 720p [V, S10].

*Games that used it.*
- Tibia (OTClient fog shader): https://github.com/opentibiabr/otclient/blob/main/modules/game_shaders/shaders/fragment/fog.frag
- Ultima Online (ServUO): https://github.com/ServUO/ServUO/blob/master/Scripts/Misc/LightCycle.cs

*How it feels.* The window is the Tibia look, and it is fair because everyone gets the same rectangle [I, note 03]. The additive shader lifts dark pixels and clips highlights, so night turns grey [I, note 01]. Cheap but ugly.

*Risks.* Nobody confirmed whether official Tibia has area fog; the wikis block bots [U, note 01].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Mood 2 · Interactivity 2

### A5. Classic RTS fog of war: shroud, fog and visible

*In plain words.* Warcraft II gave strategy games three states. Black where you have never been, grey where you have been, clear where your units see now. StarCraft rebuilt its vision map every few seconds and revealed new ground the moment a unit stepped in.

*How it works (technical).*
- **Warcraft II** [V, S25]. Explored terrain stays visible under grey fog, but enemy movement is hidden.
- **StarCraft** [V, S30]. OpenBW hides every tile once per 100 frames and lets units re-reveal; a unit also refreshes when its 32 px tile changes. At 42 ms per frame that is about 4.2 s, so vision lingers [I, note 01].
- **Edges** [V, S28, S29]. 12 or 47 edge sprites in C&C engines; a 4x4 upscale with blur and 8 easing steps in Stratagus (E3).

*Cost / performance.* Our full recompute for 1000 units at radius 8 on a 256x256 grid costs 0.18 ms on the M4 and 1.1 ms throttled [V, S10].

*Games that used it.*
- Warcraft II: https://warcraft.wiki.gg/wiki/Fog_of_war
- StarCraft (OpenBW): https://github.com/OpenBW/openbw/blob/master/bwgame.h

*How it feels.* Grey fog over explored ground rewards exploring without giving away the enemy, which is why fog of war is fun [V, S127, S128].

*Risks.* In lockstep games every client holds the full state, so map hacks work (E5) [V, S39, S38].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 3

### Family B: Ground fog and mist

### B1. Scrolling noise-table layers

*In plain words.* Bake one small tileable noise picture once. Each frame, read it two or three times at different sizes and speeds, add the readings and turn them into fog. This is the cheapest good-looking fog there is.

*How it works (technical).*
- **Table** [V, S97]. Godot's FastNoiseLite makes a seamless `NoiseTexture2D`; 128x128 R8 is 16 KB.
- **Layers** [I, note 02; V, S52]. 2 to 3 layers at scale ratios like 1.0, 1.7 and 2.9 in different directions, so repeats never line up.
- **Speeds** [I, note 06]. 4 to 20 px/s for ground fog at 320 px, 0 to 6 px/s for horror fog. A second layer at 0.6x reads as volume.
- **Snap** [I, note 02]. Scroll in whole pixels and sample nearest. Godot 4 needs `repeat_enable` on the sampler [V, S86].

*Cost / performance.* Measured at 720p on the M4: 1, 2 and 3 layers cost 0.010, 0.012 and 0.014 ms, under 0.0012 ms at 320x180 [V, S10]. An extra layer costs about 0.002 ms against 0.016 ms for an extra procedural octave. On the CPU, 1 to 3 nearest layers cost 0.11 to 0.24 ms at 320x180 [V, S10].

*Games that used it.*
- Godot "2D Fog Overlay" (CC0): https://godotshaders.com/shader/2d-fog-overlay/

*How it feels.* Soft and readable when slow and snapped. One layer reads as a moving texture; two read as air [I, note 06]. Fast one-way drift gets called smoke, oil or water [V, S118].

*Risks.* A 64 px repeat shows within seconds at 320x180. Sub-pixel scrolling with linear filtering smears [I, notes 02, 06].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 1

### B2. Domain warp: a texture offset instead of nested fbm

*In plain words.* Scrolling fog slides. Warped fog curls. You get the curl by bending where you read the noise, using another noise as the bend. With real maths it is expensive; one extra texture read gives most of the look.

*How it works (technical).*
- **Quilez** [V, S51]. `fbm(p + fbm(p + fbm(p)))`. One warp level is 3 fbm calls, two levels 5, with arbitrary offsets such as (5.2, 1.3) that only decorrelate the calls.
- **Cheap warp** [I, note 02]. Two noises in R and G of one table give the offset `q`; read the fog at `uv + k·q`. The Godot 2D Fog Overlay warps with 8 fetches [V, S86].

*Cost / performance.* A measured 3-fetch texture warp costs 0.014 ms at 720p on the M4 [V, S10]. A procedural two-level warp is 5 fbm calls, about 0.33 ms at 720p by arithmetic from our 4-octave figure [I, from S10]. Speed 4 averages the texture warp (5) and the procedural one (2).

*Games that used it.*
- GDQuest clouds2D (one noise offsets another): https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Shaders/clouds2D.gdshader

*How it feels.* The step that makes fog look alive. At 320x180 the fine curls of a second level fall under one pixel, so the texture warp keeps most of the beauty [I, note 05].

*Risks.* The procedural branch is pretty but expensive at full resolution. Large `k` tears the pattern [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Mood 5 · Interactivity 1

### B3. Fog that pools in low ground: height and Beer's law

*In plain words.* Give every tile a height and draw a fog line. Tiles below the line get fog by how far below they are, so valleys fill and ridges, roofs and treetops stay clear. Lower the line in the morning and fog shrinks into the valley floor.

*How it works (technical).*
- **Beer's law** [V, S56]. Transmittance `T = exp(−σt·d)`; a pixel keeps T of its colour and takes 1 − T of the fog colour.
- **Top-down form** [I, notes 05, 10]. No view ray, so use thickness: `thickness = max(0, fogLine − tileHeight)`, `fog = 1 − exp(−k · thickness)`. A low tile has a small height, a big thickness and more fog.
- **Storage** [I, note 04]. One height texel per tile, R8, linear filter.
- **Burn-off** [V, S110]. Real radiation fog clears "from the edges toward the center"; lowering `fogLine` does that for free (G3).

*Cost / performance.* Measured height-fog shader (3 fetches plus `exp`): 0.0011 ms at 320x180, 0.013 ms at 720p on the M4 [V, S10].

*Games that used it.*
- Graveyard Keeper (roofs and treetops above the fog): https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made

*How it feels.* The most beautiful fog in the study for its cost: a tower on a ridge above a white valley at dawn. It follows the art rule that low and far things take the sky colour [V, S112; I].

*Risks.* No shipped 2D game documents it, so player reaction is unproven [I, note 04]. Wrong heights make fog float on hills.

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 2

### B4. A coarse density grid with wind advection

*In plain words.* Keep a small grid of fog values. Several times a second, push them along the wind, blur them a little and pull them toward a target from weather and terrain. Fog drifts in from the coast and fills a hole slowly after a player walks through.

*How it works (technical).*
- **Reuse study #6** [S7; I, note 04]. The smoke field with slower decay (0.995 to 0.999 per tick), no upward term and rule-based sources.
- **Step** [I, note 04]. Read upwind, `sample(fog, cell − wind·dt)`, blur with `mix(up, avg4, k)` at k ≤ 0.25, then decay and add sources, capped by height (B3).
- **No solver** [V, S7, S73]. Stam's solver took 32.1 ms at 320x180 in JS in study #6. Fog needs no pressure solve.
- **Rate** [I; S9]. 4 to 10 Hz, interpolating the last two states. The Sandbox runs 80x45 at 10 Hz.

*Cost / performance.* Measured in JS on the M4: 80x45 costs 0.060 ms (0.34 ms throttled), 160x90 0.24 ms, 320x180 0.93 ms, about 15 ns per cell; upscaling 80x45 to 320x180 costs 0.11 ms [V, S10]. GDScript is unmeasured and slower [I, note 08].

*Games that used it.*
- Study #6 smoke field (Kingsfoil): https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel

*How it feels.* The only fog that answers the world. Wind pushes it, spells add to it, players leave a wake [I].

*Risks.* Large explicit diffusion diverges [V, S73]. Without interpolation the 10 Hz steps stutter [I].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 4 · Pixel taste 4 · Mood 4 · Interactivity 5

### B5. Clearing masks: fog that parts around the player and the lamps

*In plain words.* Draw soft circles where the player and the lamps are into a small mask and subtract it from the fog. The fog opens around you and closes behind you.

*How it works (technical).*
- **Mask** [I, note 02]. Radial sprites drawn additively into an 80x45 target; `fog *= 1 − mask`. Linear filtering softens the edge.
- **Parting** [I, note 02]. Offset the fog UV by the mask gradient for fog that is pushed, not erased.
- **Into the grid** [S9]. The Sandbox subtracts holes from the density field, so they refill by advection.
- **Radius** [I, note 06]. About 2 to 3 tiles around the player, less around torches. Client-only, zero bytes.

*Cost / performance.* One extra fetch, about 0.002 ms at 720p [V, S10]. A SubViewport for the mask is the web risk; one user saw under 1 FPS with several [V, S75]. Subtracting into the CPU grid costs a few hundred cell writes [I].

*Games that used it.*
- Don't Starve: Hamlet: https://dontstarve.wiki.gg/wiki/Heavy_Fog
- Phaser RenderTexture erase: https://phaser.io/examples-show/3215

*How it feels.* "The fog parts around me" keeps the player readable without drawing them over everything, and lamps that push fog back feel safe [I, note 06].

*Risks.* Too big a radius kills the fog; a hard circle looks like a spotlight [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### B6. Sprite fog banks with altitude (Graveyard Keeper)

*In plain words.* Scatter soft horizontal fog sprites over the map and sort them with trees and houses. Low things get covered by more sprites than the tops of tall things, so roofs and crowns rise out.

*How it works (technical).*
- **Graveyard Keeper** [V, S117]. Fog is "horizontal clouds spread across all the picture" with an "object altitude simulation", a density setting and about 10 time-of-day LUTs.
- **Order** [I, note 06]. Ground, low fog, y-sorted sprites, thin high fog, UI.
- **One material** [V, S78]. Godot 4.4 per-instance uniforms let many fog sprites share a material with their own density and offset.

*Cost / performance.* Overdraw only. 20 sprites of 64x32 cover about 71% of a 320x180 screen, under one blended layer at 0.0008 ms [I, from S10].

*Games that used it.*
- Graveyard Keeper: https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
- Hollow Knight: https://unity.com/madewith/hollow-knight

*How it feels.* Fog that wraps around houses belongs to the world. Graveyard Keeper is the closest shipped analogue to Asterion [I, note 02].

*Risks.* Placement costs art time per map. Alpha sprites leave the palette unless drawn through C2 [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 2

### Family C: Rendering fog for pixel art

### C1. World-locked ordered dither (Bayer 4x4)

*In plain words.* Show either a fog pixel or a ground pixel, picked by a fixed 4x4 pattern of thresholds. Thin fog shows a few fog pixels, thick fog many. Pin the pattern to the world and it never crawls.

*How it works (technical).*
- **Rule** [V, S93]. Fog shows where density is above the Bayer value, a `step()`.
- **World lock** [I, note 05]. With a pixel-snapped camera, `b = BAYER[(px.y + cam.y) & 3][(px.x + cam.x) & 3]` never swims.
- **Still pattern, moving fog** [I, notes 05, 06]. Move the density under a fixed pattern; pixels flip only at the fog's edge, the creeping look of 16-bit fog.
- **Close colours** [V, S114, S115]. Dither between similar values; far-apart values flicker.

*Cost / performance.* Measured Bayer dither plus palette snap: 0.0018 ms at 320x180, 0.016 ms at 720p on the M4; on the CPU, 0.057 ms at 320x180 (0.33 ms throttled) [V, S10].

*Games that used it.*
- Return of the Obra Dinn: https://hackaday.com/2022/07/04/dithering-makes-everything-cooler-now-even-animated

*How it feels.* Authored and retro. Pixel artists call checkerboard the standard 50% blend, and warn that overused dither reads as noise or false texture [V, S115]. Use it at edges and between steps.

*Risks.* Non-integer phone scaling turns Bayer into moiré [I, note 05]. A full-screen high-contrast dither may fail XAG 118 [V, S130].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 1

### C2. Palette value compression: a fog lookup table

*In plain words.* A table says, for each palette colour and fog level, which palette colour to draw. Each level steps toward the fog colour, losing contrast and saturation. Fog never invents a colour.

*How it works (technical).*
- **COLORMAP idea** [S6]. DOOM darkened through a table per light level; study #5 used it for light. Here the target is the fog colour.
- **Table** [I; S9]. `FOGMAP[level][index] → index`, 4 to 6 levels, rebuilt when the time of day moves (H1).
- **Between levels** [I]. `level = floor(f·N) + (fract(f·N)·16 > bayer ? 1 : 0)`.
- **What moves** [V, S70; I, note 05]. Value and saturation, not hue alone; contrast loss is what sells depth.

*Cost / performance.* One table read inside the fog pass, part of the measured 0.016 ms palette shader at 720p [V, S10]. Rebuilding 256 colours by 6 levels is 1,536 nearest-colour searches, under 1 ms [I].

*Games that used it.*
- DOOM COLORMAP, via study #5: https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel
- Graveyard Keeper (time-of-day LUTs): https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made

*How it feels.* Hand-painted, because each step is a colour an artist chose. Slynyrd's haze bands are this [V, S112].

*Risks.* A careless table jumps hue between steps. Small palettes give few steps toward a pale fog [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 1

### C3. Plain alpha blending, the anti-pattern

*In plain words.* A semi-transparent grey layer over the scene. One line of code, fine in a thumbnail. Up close every pixel becomes a colour your palette lacks, and the art goes flat.

*How it works (technical).*
- **What happens** [I, note 06]. `mix(scene, fog, a)` makes off-palette colours wherever 0 < a < 1; large doses read as a grey wash.
- **Grey is wrong** [V, S112]. Haze follows the light; Slynyrd shifts greens toward warm yellow facing the sun.
- **Fixes** [V, S116]. Snap to the nearest ramp entry, or use C2. One dev locks output to the palette "to catch stray alpha pixels".
- **Where it is fine** [I]. Thin UI layers, or HD-2D art without a palette [V, S139].

*Cost / performance.* 0.0008 ms per layer at 320x180, 0.010 ms at 720p, but four layers cost 3.9x one, since tile GPUs shade every translucent layer [V, S10].

*Games that used it.*
- Stardew Valley Cave Weather mod (opacity 0 to 255): https://www.curseforge.com/stardewvalley/mods/cave-weather-dynamic-mine-events

*How it feels.* The Ambient Light mod's author removed fog overlay code because it "caused more harm than good" [V, S123]. Our clearest cheap-but-ugly case, kept in the Sandbox as a comparison [S9].

*Risks.* It erases the artist's palette work and hides characters unless they draw above it (H2) [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 1 · Mood 2 · Interactivity 1

### C4. Blue noise and temporal dither

*In plain words.* Blue noise is a dither that looks random without clumps. It survives scaling better than Bayer. Changing it every frame hides it in 3D, and makes low-resolution pixel art shimmer.

*How it works (technical).*
- **Making it** [V, S65]. Void-and-cluster with σ ≈ 1.9 px; Peters' CC0 textures run 16² to 1024².
- **Animating it** [V, S65, S66]. A new 64x64 texture and offset per frame; NVIDIA's filing says naive animation decays to white noise [V, vendor].
- **Obra Dinn** [V, S67]. An 8x8 Bayer plus a 128x128 blue-noise field; Pope mapped the pattern to a sphere around the camera and said swimming was never fully fixed.

*Cost / performance.* One extra fetch, about 0.002 ms at 720p by our texture-layer slope [I, from S10].

*Games that used it.*
- Return of the Obra Dinn: https://setsideb.com/?p=5672

*How it feels.* Static blue noise reads as grain, which looks like a bug in clean pixel art; temporal dither reads as shimmer [I, note 05]. Cheap but ugly at 320x180. Its one good use is odd, non-integer phone scaling.

*Risks.* No controlled study compares Bayer and blue noise for animated pixel transparency [I, note 05].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 2 · Mood 3 · Interactivity 1

### C5. Render fog at native resolution, snapped to the pixel grid

*In plain words.* Draw fog into the same 320x180 picture as the game, then scale everything up once. Never draw fog at the window's full size. It is cheaper and it looks better.

*How it works (technical).*
- **Snap** [I, note 02]. `uv = (floor(uv * res) + 0.5) / res`; scroll in whole pixels.
- **Stretch mode** [I, note 08]. Godot's viewport stretch makes the final upscale the only full-resolution pass.
- **The other road** [V, S137, S138]. Children of Morta and Sea of Stars light above sprite resolution. Smooth and modern, wrong for a palette look.

*Cost / performance.* Measured value fbm at 4 octaves: 0.0054 ms at 320x180, 0.065 at 720p, 0.140 at 1080p on the M4 [V, S10]. A 2-core Mali-G52 peak implies at least 0.017 ms per 320x180 layer against 0.27 ms at 720p [V, vendor, S156; I, note 08].

*Games that used it.*
- Pokémon Emerald (fog in the native frame): https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c

*How it feels.* Fog pixels the size of art pixels belong to the art; window-resolution fog floats over it as a filter [I, note 02].

*Risks.* UI and text need their own full-resolution layer [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 3 · Interactivity 1

### Family D: Clouds and cloud shadows

### D1. Cloud shapes from a thresholded scrolling noise table

*In plain words.* Slide a tileable noise picture across the world with the wind and keep only the parts above a threshold. Those blobs are clouds. More cover means a lower threshold.

*How it works (technical).*
- **Threshold** [I, note 04]. `thr = 1 − cover`, `shadow = step(thr, n)`, plus one dithered edge band 2 to 4 px wide. At full cover switch to an overcast palette (H1).
- **Scale and speed** [I, note 04]. A 128 or 256 px table stretched 2x to 4x, so clouds are 100 to 300 px. 4 to 20 px/s with wind; real cumulus speed would be 160 to 480 px/s, unreadable. Emerald's 30 px/s is the ceiling [V, S11].
- **Octaves** [I, note 04; V, S62]. After a threshold, features under 4 px are edge noise; 3 to 4 baked octaves.
- **Shared clock** [I, note 04]. Offset from wind and server time, so all clients agree.

*Cost / performance.* One fetch, measured at 0.0008 ms at 320x180 and 0.010 ms at 720p; inside the fog pass it adds no overdraw [V, S10; I, note 04].

*Games that used it.*
- Fukyuuten: https://hatchet2k4.itch.io/fukyuuten/devlog/341089/update-1302022-shadows-and-clipping

*How it feels.* A hard threshold with one dither band beats a soft multiply in pixel art [I, note 04].

*Risks.* Mask shadows off water and void, as Fukyuuten did [V, S101].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 1

### D2. Palette-step shadows instead of multiply

*In plain words.* Under a cloud, draw each ground pixel one palette step darker. A multiply makes new colours and looks like dirt; a palette step looks like shade.

*How it works (technical).*
- **Shift** [I, note 04]. `color = SHADE[index]`, one ramp step down, like C2.
- **Warning** [V, S6]. Study #5 found that multiply over a palette world looks like dirt.
- **Sun offset** [I]. Shadows land away from the sun. Sample the cloud at `p − shadow_offset`, with the offset pointing away from the sun.
- **World lock** [I, note 04]. Shadows move at parallax 1.0 or slide against the ground.
- **GDQuest** [V, S96]. clouds2D multiplies through a gradient; swap it for a 2 to 3 colour ramp [I, note 07].

*Cost / performance.* One table read in the palette pass, inside the measured 0.016 ms at 720p [V, S10]. clouds2D as shipped is 3 fetches, about 0.014 ms at 720p [I, from S10].

*Games that used it.*
- GDQuest clouds2D demo: https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Demos/Clouds2DDemo.tscn

*How it feels.* The shade carries the artist's own hue shift, so it reads as weather, not a smear [I].

*Risks.* Few-step ramps make the shadow too strong; offer a 50% dither. Night tiles may vanish into black [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 1

### D3. Overhead clouds with parallax and a fade over the player

*In plain words.* A few real clouds drift over everything, faster than the ground, so they feel close. Over the player they thin with a dither.

*How it works (technical).*
- **Parallax** [V, S17; I, note 04]. 1.2 to 1.5 for clouds near the camera, 0.25 to 0.5 for clouds below sky islands. The Sandbox uses 1.9x the shadow speed [S9].
- **Fade** [I, note 04]. Raise the dither threshold in a 24 to 40 px circle around the player.
- **Count** [I, note 04]. 1 to 3 on screen, long gaps. Emerald's 3 clouds are placed decorations [V, S11].

*Cost / performance.* One to three sprites, or one thresholded layer at 0.0008 ms at 320x180 [V, S10]. Zero network [I, note 04].

*Games that used it.*
- Pokémon Emerald (Route 120): https://bulbapedia.bulbagarden.net/wiki/Weather

*How it feels.* A passing cloud gives a flat top-down map height. Clouds that hide the player feel unfair, so the fade matters [I, notes 04, 06].

*Risks.* Fast parallax can bother motion-sensitive players; reduce motion freezes it (H3) [V, S129].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 3

### D4. Sprite clouds: puffs, circle clusters and hand-drawn heroes

*In plain words.* For clouds you look at, noise looks lumpy. Round bumps, a flat dark underside and 2 to 4 colour bands read as a cloud.

*How it works (technical).*
- **PixelPlanets** [V, S100]. Value fbm plus a hashed circle term over 9 iterations, a hard `step`, 4 colours. Shipped clouds use 2 octaves and cover 0.415.
- **Circle clusters** [V, S89]. tripod's CC0 shader, 4 palette colours, dither, outline.
- **Heroes** [I, note 04]. Hand-drawn clusters of 3 to 5 circles still beat noise.

*Cost / performance.* Baked or drawn, a cloud is a sprite, under 0.0008 ms per screenful [V, S10]. Live puff shaders sit near 4-octave fbm, 0.065 ms at 720p [I, from S10].

*Games that used it.*
- PixelPlanets: https://deep-fold.itch.io/pixel-planet-generator

*How it feels.* Round banded puffs read as friendly weather; artists prefer hand-drawn heroes [I, note 04].

*Risks.* Too much dither erases cloud shapes [V, S115].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 1

### Family E: Fog of war

### E1. Visibility counts and an explored bit

*In plain words.* For every cell, count how many of your units see it, and keep one bit for "seen once". Visible means count above zero. Explored never resets. Each unit adds its circle on arrival and removes it on leaving.

*How it works (technical).*
- **OpenRA** [V, S26]. Per player, short counters `visibleCount` and friends, a `bool explored` layer and a `touched` dirty layer. Visible is not a superset of Explored.
- **0 A.D.** [V, S31]. u16 counts per player plus a u32 packing 2 bits for each of 16 players; shared vision is a bit OR.
- **Spring, Stratagus, League** [V, S33, S29, S34]. Spring keeps 7 reference-count grids; Stratagus encodes 0 unexplored, 1 explored, ≥ 2 visible; League used one flag per cell on 128x128.
- **Godot** [I, note 03]. `PackedByteArray` explored plus a byte count per team; u8 is enough for a party.

*Cost / performance.* By our arithmetic, memory is about 9 bytes per cell per player in OpenRA, 1 MB per team at 1024x1024 tiles and 1 byte [I, note 03]. Update costs are in E2.

*Games that used it.*
- OpenRA: https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Game/Traits/Player/Shroud.cs
- 0 A.D.: https://github.com/0ad/0ad/blob/master/source/simulation2/components/CCmpRangeManager.cpp

*How it feels.* Players never see it; it is the truth the look reads from.

*Risks.* Rebuilding a boolean from scratch per frame is slower than deltas once units move (E2) [V, S10].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 5

### E2. Delta updates: stamp only the cells that enter and leave

*In plain words.* When a unit steps one cell, a thin crescent at the front becomes visible and a crescent at the back stops being visible. Precompute both crescents per direction and touch only them.

*How it works (technical).*
- **Cell change only** [V, S27]. OpenRA returns early unless the unit changed cell or moved 1/4 cell.
- **Touched scan** [V, S26]. A vectorised `IndexOf(true)` finds dirty cells; "Most cells are unchanged".
- **Strips** [V, S31]. 0 A.D. touches only cells "that have a net change" between old and new circles.
- **Events** [I, note 08]. A count crossing 0↔1 is the visible or hidden event interest management needs.

*Cost / performance.* Measured on a 256x256 grid with 1000 units at radius 8 on the M4: full recompute 0.184 ms, naive re-stamp 0.308 ms, delta edge 0.048 ms, and 0.010 ms with 10% moving; throttled 1.1, 1.76, 0.27 and 0.07 ms [V, S10]. The delta grid matched a full recompute after 50 frames.

*Games that used it.*
- 0 A.D. (incremental strips): https://github.com/0ad/0ad/blob/master/source/simulation2/components/CCmpRangeManager.cpp

*How it feels.* Invisible, except as a frame rate that holds when 50 players walk at once [I].

*Risks.* Naive incremental is slower than a full rebuild when all move [V, S10]. These figures exclude line of sight, which study #5 owns [S6].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 5

### E3. Soft edges: 16-case tiles, upscale and blur, or a dithered threshold

*In plain words.* A cell grid gives blocky edges. Pick one of 16 drawn edge tiles from the four corners, as C&C did. Or enlarge and blur the grid, as League did. Or stretch it with bilinear filtering and cut it with Bayer, which keeps the pixel look and costs almost nothing.

*How it works (technical).*
- **Edge tiles** [V, S28, S29]. OpenRA maps corner and side bits to 12 or 47 sprites; Stratagus uses a 16-entry corner table. This is marching squares.
- **Upscale and blur** [V, S29, S32, S34]. Stratagus: 4x4 texels per tile, blur, 8 easing steps. 0 A.D.: 255 visible, 127 explored, a 7-tap binomial blur. League: 128x128 to 512x512 with 16 patterns, because more blur "made it too blurry".
- **Bilinear plus Bayer** [I, notes 03, 05]. One byte per tile, linear filter, world-locked threshold.
- **Bleeding** [V, S37]. One texel per tile "can bleed" through thin walls.

*Cost / performance.* Measured box blur of a 256x256 mask 0.19 to 0.22 ms (1.1 to 1.4 ms throttled); R8 upload 0.018 ms wall; the shader path about 0.0018 ms at 320x180 [V, S10].

*Games that used it.*
- Red Alert via OpenRA: https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Traits/World/ShroudRenderer.cs
- League of Legends: https://www.riotgames.com/en/news/story-fog-and-war

*How it feels.* Edge tiles read hand-drawn. Plain bilinear is an airbrush over crisp pixels, cheap but ugly [I, note 03].

*Risks.* Full-map CPU blur per frame costs 1+ ms throttled; blur in the shader [I, note 08].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 3

### E4. Reveal fade-in and remembered tiles

*In plain words.* New ground fades in instead of popping. Ground you saw but cannot see now stays, darker and colder, with no creatures on it. That memory is the reward for exploring.

*How it works (technical).*
- **Crossfade** [V, S32, S29]. 0 A.D. blends two textures over 0.5 s; Stratagus eases over 8 steps. The Sandbox fades cells over 0.3 s [S9].
- **Memory looks** [V, S46, S47, S48, S49, S50]. Angband drops 1 or 2 colour steps. Brogue multiplies by (25, 25, 50)% then averages 25% toward dark blue. DCSS overlays a stipple mesh. Cogmind keeps true colours but darker, terrain and items only.
- **Asterion** [I, note 06]. Unknown dark, explored through a cool dark ramp without creatures, visible live, a 1 to 2 tile dithered fringe.

*Cost / performance.* A crossfade is one more fetch, about 0.002 ms at 720p [I, from S10]. A 256x256 R8 upload while fading costs 0.018 ms [V, S10].

*Games that used it.*
- Brogue CE: https://github.com/tmewett/BrogueCE/blob/master/src/brogue/IO.c
- Dungeon Crawl Stone Soup: https://crawl.develz.org/

*How it feels.* Fog of war feels good when uncovering is the reward and memory stays [V, S127, S49]. The DCSS mesh dims by covering pixels, the most pixel-native look [I, note 01]. A 4 to 8 frame dissolve is the satisfaction beat [I, note 06].

*Risks.* Remembering monsters breaks convention and the anti-cheat rule [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 4

### E5. Server-side vision for an MMO

*In plain words.* In lockstep games every client knows everything, so fog is paint and map hacks work. In a server-authoritative MMO the server never sends what you cannot see, so fog of war and interest management are one system.

*How it works (technical).*
- **Lockstep leaks** [V, S39, S38]. Kartograph lifted fog in every RTS tested, undetectably. OpenConflict cost 22 ms per sync on one core.
- **Tibia** [V, S21]. An 18x14 window, two compares per creature, an 8x8-leaf quadtree, up to 1,300 cached creature ids.
- **VALORANT** [V, self-reported, S35]. A precomputed cell-to-cell visibility table plus a look-ahead cut fog of war from about 50% to under 2% of server frame time.
- **AOI savings**. Only simulated. The A3 paper reports about 33% less traffic [U, S40]; STOW-E found 2 to 2.5 km cells gave most of its saving [V, S41].

*Cost / performance.* Tibia's rule is constant per player, at most about 112 to 144 new tiles per step [I, note 03]. Server delta stamping for 1000 units costs 0.048 ms before line of sight [V, S10].

*Games that used it.*
- VALORANT: https://www.riotgames.com/en/news/demolishing-wallhacks-valorants-fog-war
- Tibia (TFS): https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp

*How it feels.* Fair. Hiding players the server already sent would feel like a hack target [I, note 06].

*Risks.* Per-viewer line of sight can eat a tick; without look-ahead, creatures pop in at corners [V, S35].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 4 · Pixel taste 3 · Mood 3 · Interactivity 5

### Family F: Atmosphere and depth

### F1. Haze and aerial perspective: tint and a contrast drop

*In plain words.* Far or high things look paler, toward the sky colour, and flatter. In top-down view "far" means high on the screen or the map. Pull those pixels toward the sky and squeeze their contrast.

*How it works (technical).*
- **What changes** [V, S72]. Less contrast, detail and chroma, and lightness toward the background.
- **Contrast is enough** [V, S70, S71]. Lower contrast read as farther even against size; untested against occlusion.
- **Artists** [V, S112, S113]. Distant shapes "take on the color of atmospheric haze" and use fewer colours.
- **Formula** [I]. `col = mix(col, sky, h·a)`; `col = mean + (col − mean)·(1 − h·c)`; in palette form, C2 steps.

*Cost / performance.* One extra index inside the palette pass, part of the measured 0.016 ms at 720p [V, S10].

*Games that used it.*
- Ori and the Blind Forest: https://www.pressreader.com/australia/edge/20161013/283407716237477

*How it feels.* Depth from nothing, and on-palette because it reuses sky colours [V, S112]. Ori puts light fog behind the play layer to separate it [V, S136].

*Risks.* Hue-only tints look like filters [I, note 05]. Too much contrast loss hides characters (H2).

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 1

### F2. Lights inside fog: additive halos sized by density

*In plain words.* A lamp in fog glows. Draw a tight bright ring and a wider soft ring on top of the fog, bigger and dimmer when the fog is thick.

*How it works (technical).*
- **Sprites** [V, S76]. Godot's fake light is an additive Sprite2D: no shadows, cannot light full darkness.
- **Sizing** [I, note 09]. `radius = r0·(1 + 2·density)`, `alpha = a0·density`, density at the lamp's tile.
- **Rings** [V, S152; I, note 09]. A 3 to 5 px core and a 12 to 20 px soft ring in palette steps with Bayer, drawn after the fog.

*Cost / performance.* A 32x32 sprite is 1.8% of a 320x180 screen; 20 lamps are about 36% of one layer, under 0.001 ms on the M4 [I, from S10]. Large glow sprites hurt one mobile game, so keep them small [V, S151].

*Games that used it.*
- RPG Maker halo tutorial: https://eeveeexpo.com/resources/710

*How it feels.* Lamps glowing in fog are what people mean by moody. It turns fog from obstacle into atmosphere [I].

*Risks.* An additive sprite did not brighten under CanvasModulate in one report [V, S85].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 3

### F3. Pre-drawn light shafts

*In plain words.* Paint a few soft slanted bands of light and lay them over the fog at dawn, one palette step brighter, breathing slowly. The forest-morning look with none of the maths.

*How it works (technical).*
- **Sprites** [I, note 02; S5]. Tapered quads, additive or palette step, alpha on a slow sine, masked by canopy; study #4's sunflecks are the base.
- **Sandbox** [S9]. 6 shafts at dawn from a cached pixel list.

*Cost / performance.* Overdraw only. Shafts over a quarter of the screen cost under a quarter of one layer, about 0.0002 ms [I, from S10].

*Games that used it.*
- Godot Pixelated God Rays (CC0): https://godotshaders.com/shader/pixelated-god-rays/

*How it feels.* Authored, like pixel art, where a blur looks like a filter [I, note 02]. Top-down suns sit off screen, so real rays would be parallel bands anyway [I, note 05].

*Risks.* Shafts ignore occluders; a shaft over a roof reads as a mistake [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 1

### F4. Radial-blur god rays

*In plain words.* Render the light blockers black, blur toward the sun with many samples per pixel and add the result. Real shafts sweep round trees and towers. Pretty, and the most expensive effect here.

*How it works (technical).*
- **GPU Gems 3** [V, S63]. Samples, Density, Weight, Decay, Exposure; no sample count given.
- **Mitigation** [V, S63, S64]. Downsample, jitter, fade off screen; Sanglard used 100 samples at half size.
- **Godot** [V, S74, S92]. A screen read copies the whole screen; a CC0 shader marches 64 samples by default.

*Cost / performance.* Measured at 720p on the M4: 8, 16, 32 and 64 samples cost 0.021, 0.036, 0.070 and 0.141 ms, about 0.0022 ms per sample; 64 samples cost 18.0 ms on SwiftShader [V, S10]. Plus a screen copy [I].

*Games that used it.*
- Sanglard's port: https://fabiensanglard.net/lightScattering/

*How it feels.* Lovely in 3D and HD-2D; on pixel art it paints smooth gradients off the palette [I, note 05]. Pretty but expensive.

*Risks.* Software-GL browsers cannot run it at 720p [V, S10].

*Ratings 1–5 (author judgement):* Simplicity 2 · Speed 3 · Pixel taste 3 · Mood 5 · Interactivity 1

### F5. Dust motes in the light

*In plain words.* A handful of single bright pixels drift slowly inside a shaft, wobbling a little. They make still air visible.

*How it works (technical).*
- **Texture or particles** [V, S153]. A panning dust texture on the shaft is cheaper than particles.
- **Godot** [V, S84]. CPUParticles2D with an emission mask; motes take the shaft colour.
- **Numbers** [I, note 09]. 8 to 20 motes per shaft, 1 px, 2 colours, 2 to 6 px/s, ±1 px wobble over 2 to 4 s.

*Cost / performance.* 20 particles, under 0.01 ms by estimate [I, note 09].

*Games that used it.*
- Tunic: https://wireframe.raspberrypi.com/articles/wireframe-cover-star-tunic-and-the-art-of-keeping-a-secret

*How it feels.* Quiet and lived-in [I]. Faster motes read as snow or sparks [I, note 09].

*Risks.* No shipped game gives counts; ours are estimates.

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 1

### F6. Cave mist, swamp haze and indoor steam as presets

*In plain words.* Caves, swamps and bathhouses each want mist. Build one fog system and give it presets for colour, height, speed and source.

*How it works (technical).* From note 09 [I, note 09]:
- **Cave.** Blue-grey, 2 steps darker than the floor, pooled low, 1 to 2 px/s, bigger halos.
- **Swamp.** Grey-green, 1 to 2 tiles tall, thickest on water, bubbles as sprites, thicker at night.
- **Steam.** Near-white plumes rising 8 to 15 px/s, fading in 1 to 2 s, reusing study #6 [S7].
- **Magic.** Purple or teal, bounded; Albion's Mists use purple as identity [V, S150].

*Cost / performance.* Same as the base fog, 0.06 ms grid step and 0.0018 ms pass at 320x180 [V, S10]. Bubbles and steam are sprites.

*Games that used it.*
- Albion Online: https://mmos.com/news/albion-online-the-mists-dev-update

*How it feels.* Biome colour tells players where they are. Horror wants cold, dark fog that barely moves [V, S118].

*Risks.* Dark, evenly lit fog reads as smoke; mist has albedo near white [V, S83].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 2

### Family G: Gameplay fog and weather

### G1. Smoke bombs and fog-cloud spells as server state

*In plain words.* A smoke bomb or fog spell makes the server record a set of tiles and an expiry time. Creatures inside are not sent to players outside. The client draws a dense cloud with a clear rim over exactly those tiles.

*How it works (technical).*
- **Shipped rules** [V, S143, S144, S145, S146, S147, S148]. Dota's Smoke of Deceit: 45 s team invisibility. Graves' Smoke Screen: 4 s nearsight at radius 200. BG3 Fog Cloud: 4.5 m for 10 turns; Darkness blocks ranged attacks in or out. DOS2 smoke blocks sight. Into the Breach: no attacks from smoke.
- **Model** [I, note 09]. `{tiles, expires_at_tick, owner, rule}`; tiles opaque for viewers outside, radius 1 inside, reusing study #6's rule [S7].
- **Duration** [I, note 09]. 10 to 20 s over 3x3 to 5x5 tiles.

*Cost / performance.* Two events of a few bytes [I, note 09]. On the client, the Sandbox adds spell density decaying 4.5% per 10 Hz update, about 6 s, inside the 0.06 ms grid step [S9; V, S10].

*Games that used it.*
- Baldur's Gate 3: https://bg3.wiki/wiki/Fog_Cloud
- Dota 2: https://dotacoach.gg/en/items/smoke-of-deceit

*How it feels.* Every one of these is a dense blob with a clear rim, because players must read where the rule ends [I, note 09].

*Risks.* A client-only cloud is a map-hack target (E5) [V, S38].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### G2. Weather as a state machine with one byte per region

*In plain words.* Each region holds a few bytes: fog, cloud, wind. The server rolls a new state now and then and sends it only on change. Clients turn the bytes into fog and clouds from the same clock.

*How it works (technical).*
- **Markov** [V, S106, S107]. A CESCG 2026 chain from 50 years of data; fog self-transition 0.457; players preferred it 95% to 5% in a 20-person test.
- **Asterion** [I, note 04; S9]. 5 state bytes per region in a 7-byte packet on change; clients lerp over 60 to 120 s.

*Cost / performance.* With 64 regions changing every 15 minutes, about 0.5 bytes per second for the world [I, note 04].

*Games that used it.*
- Minecraft: https://minecraft.wiki/w/Weather
- Terraria: https://terraria.wiki.gg/wiki/Wind

*How it feels.* Shared weather makes an MMO feel like one place [I]. RPG players split evenly on realism in the CESCG test [V, S106].

*Risks.* Stardew's storm odds conflict between sources [V, S103].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 4 · Interactivity 3

### G3. Radiation fog timing and the four fog types

*In plain words.* On clear, calm nights cold air sinks into valleys and fog forms. It is thickest at sunrise and clears from the edges inward. Wind brings fog from the sea; cold air over warm water makes wisps.

*How it works (technical).*
- **Definitions** [V, S108]. Fog under 1,000 m visibility, dense under 100 m; mist "disperses quickly in light winds".
- **Radiation** [V, S108, S109, S110]. Clear calm nights; 2 to 7 knots thickens it; deepest at sunrise; "dissipates from the edges toward the center".
- **Advection and steam** [V, S108, S110]. Advection needs 3 to 9 knots of wind; steam fog rises off warm water, usually 6 h or less.
- **Rule** [I, note 04]. Starts 2 to 4 game hours after dusk if clear and calm, clears 1 to 3 hours after sunrise by lowering the fog line. The 1 to 3 hours is an estimate; real timing "can be very variable" [V, S111].

*Cost / performance.* A few compares per region per server tick; zero per pixel beyond B3 [I].

*Games that used it.*
- NWS fog guide (reference, not a game): https://www.weather.gov/media/zhu/ZHU_Training_Page/fog_stuff/fog_guide/fog.pdf

*How it feels.* Fog that comes at night and burns off at dawn gives the day a rhythm. Edges-first clearing looks natural because it is [I, note 04].

*Risks.* No game we found documents this timing; tune by eye [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 3

### G4. Fair fog: information or a penalty, never both, and fog gates

*In plain words.* Fog can hide things or hurt you. Players accept either, and hate both at once with no counter. A fog curtain at a doorway is the friendliest fog. It says something waits beyond.

*How it works (technical).*
- **Complaints** [V, S119, S120, S121]. Route 210 hides trainers and cuts accuracy, and returns when you leave. Heavy Fog shrinks view and slows players 40 to 60%. A WoW spore fog had no setting for low-vision players.
- **Praise** [V, S122, S127]. Hyper Light Drifter's atmosphere is praised; fog of war is liked when exploring is the reward.
- **Gates** [V, S126]. Dark Souls fog walls give a "palpable feeling of accomplishment".
- **Silent Hill** [U, S124]. The draw-distance story is unconfirmed; remake players mod the fog away [V, S124].
- **Rule** [I, note 06]. Remove information or add a cost, not both, unless there is a visible counter.

*Cost / performance.* Design. A fog gate is one animated strip, a few hundred pixels [I].

*Games that used it.*
- Pokémon BDSP (Route 210): https://www.nintendolife.com/guides/pokemon-brilliant-diamond-and-shining-pearl-defog-hm-where-to-get-defog
- Dark Souls: https://gamerant.com/fromsoftware-games-fog-walls-dark-souls-elden-ring-bloodborne/

*How it feels.* Fair fog builds curiosity; unfair fog builds forum threads [I].

*Risks.* Shared weather penalties hit everyone; show start and end times [I, note 06].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Mood 4 · Interactivity 4

### Family H: Palette, time of day and accessibility

### H1. Fog colour from the time of day

*In plain words.* Fog takes the colour of the light around it. Cold blue-grey at night, cream or pink at sunrise, near-white at noon, amber at dusk.

*How it works (technical).*
- **Haze follows light** [V, S112, S113]. Greens shift warm when facing the sun; warm dawn reads contemplative.
- **LUTs** [V, S117, S140]. Graveyard Keeper uses about 10 time-of-day LUTs; Don't Starve uses colour cubes.
- **Table** [I; S9]. Rebuild C2's table as time moves; the Sandbox blends 5 palettes into an 8,192-entry table.

*Cost / performance.* A few thousand table entries rebuilt a few times per game hour; per pixel, the same 0.016 ms pass at 720p [V, S10].

*Games that used it.*
- Graveyard Keeper: https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made

*How it feels.* A pink dawn fog lifting off a valley is the best mood shot in the study. Grey fog at all hours reads as a filter [I, note 06].

*Risks.* Interpolate between 5 keys instead of painting 24 palettes [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 1

### H2. Readability: characters above the fog, or the fog behind them

*In plain words.* The contrast loss that makes fog look deep also hides players, enemies and loot. Draw ground fog before characters, or characters on top with an outline.

*How it works (technical).*
- **Behind the play layer** [V, S136]. Ori puts fog behind the gameplay layer for readability.
- **Clear channels** [V, S129]. Let players remove background detail.
- **Order** [I, note 06; S9]. Ground, low fog, sprites, thin high fog, UI; telegraphs above everything. The Sandbox toggles characters above or below fog.

*Cost / performance.* Draw order is free; outlines cost a few fetches on sprite pixels only [I].

*Games that used it.*
- Hyper Light Drifter: https://www.gamedeveloper.com/business/the-ultra-modern-stylings-of-hyper-light-drifter

*How it feels.* Nobody praises readable fog; everybody complains when it fails [I, note 06].

*Risks.* Characters above all fog float over high banks; keep a thin covering layer [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 3 · Interactivity 3

### H3. Accessibility: a strength slider, reduce motion, flash limits and sound

*In plain words.* Ship a fog strength slider and a switch that freezes the drift. Keep lightning in fog under three flashes a second. Let sound carry fog too.

*How it works (technical).*
- **Flashes** [V, S130]. XAG 118 fails more than about 3 flashes per second over 20% of the screen, and high-contrast patterns over 10% contrast.
- **Contrast** [V, S131, S132]. 4.5:1 for text, 7:1 in high-contrast modes.
- **Demand** [V, S123]. Modders keep adding fog opacity sliders.
- **Sound** [V, S133]. A low-pass on ambience as fog rolls in, sparse distant one-shots with more reverb. Godot's web low-pass is untested [U].

*Cost / performance.* A uniform and a flag; zero per pixel [I].

*Games that used it.*
- Way of the Passive Fist (via APX): https://accessible.games/accessible-player-experiences/access-patterns/clear-channels/

*How it feels.* Invisible to most players and decisive for some [I].

*Risks.* ALttP-style lightning (A2) must pass the flash rule [V, S17, S130].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 3 · Interactivity 3

---

## 5. Comparison scorecard

All ratings are author judgement for top-down pixel art on web Godot. "Sum" is a crude total, not a recommendation. A low-sum row such as C3 is in the table as a warning, and a mid-sum row such as E5 can still be mandatory for an MMO.

| # | Technique | Simpl. | Speed | Pixel taste | Mood | Interact. | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Emerald fog sprites, BLDALPHA 12/8 | 5 | 5 | 4 | 4 | 1 | 19 |
| A2 | ALttP overlay, colour math add-half | 5 | 5 | 4 | 4 | 1 | 19 |
| A3 | Palette darkness, hardware window | 5 | 5 | 4 | 3 | 2 | 19 |
| A4 | Tibia window, floor fade, OTClient fog | 5 | 5 | 3 | 2 | 2 | 17 |
| A5 | Classic RTS three-state fog | 4 | 5 | 3 | 3 | 3 | 18 |
| B1 | Scrolling noise-table layers | 5 | 5 | 4 | 4 | 1 | 19 |
| B2 | Domain warp (texture or procedural) | 4 | 4 | 4 | 5 | 1 | 18 |
| B3 | Height pooling with Beer's law | 5 | 5 | 5 | 5 | 2 | 22 |
| B4 | Coarse density grid, advection | 3 | 4 | 4 | 4 | 5 | 20 |
| B5 | Clearing masks, parting fog | 4 | 5 | 4 | 4 | 5 | 22 |
| B6 | Sprite fog banks with altitude | 4 | 5 | 4 | 4 | 2 | 19 |
| C1 | World-locked Bayer dither | 5 | 5 | 5 | 4 | 1 | 20 |
| C2 | Palette fog lookup table | 4 | 5 | 5 | 5 | 1 | 20 |
| C3 | Plain alpha blend (anti-pattern) | 5 | 5 | 1 | 2 | 1 | 14 |
| C4 | Blue noise, temporal dither | 4 | 5 | 2 | 3 | 1 | 15 |
| C5 | Native resolution, pixel snap | 4 | 5 | 5 | 3 | 1 | 18 |
| D1 | Thresholded noise cloud shapes | 5 | 5 | 4 | 4 | 1 | 19 |
| D2 | Palette-step cloud shadows | 5 | 5 | 5 | 4 | 1 | 20 |
| D3 | Overhead parallax clouds, fade | 4 | 5 | 4 | 4 | 3 | 20 |
| D4 | Sprite clouds, puffs, clusters | 3 | 5 | 5 | 4 | 1 | 18 |
| E1 | Visibility counts, explored bit | 4 | 5 | 3 | 3 | 5 | 20 |
| E2 | Delta updates (enter/leave) | 3 | 5 | 3 | 3 | 5 | 19 |
| E3 | Soft edges: tiles, blur, dither | 4 | 5 | 5 | 4 | 3 | 21 |
| E4 | Reveal fade, remembered tiles | 4 | 5 | 5 | 5 | 4 | 23 |
| E5 | Server-side vision for an MMO | 3 | 4 | 3 | 3 | 5 | 18 |
| F1 | Haze with contrast drop | 5 | 5 | 5 | 5 | 1 | 21 |
| F2 | Halos sized by fog density | 5 | 5 | 4 | 5 | 3 | 22 |
| F3 | Pre-drawn light shafts | 4 | 5 | 5 | 5 | 1 | 20 |
| F4 | Radial-blur god rays | 2 | 3 | 3 | 5 | 1 | 14 |
| F5 | Dust motes | 4 | 5 | 4 | 4 | 1 | 18 |
| F6 | Cave, swamp, steam presets | 4 | 5 | 4 | 4 | 2 | 19 |
| G1 | Smoke and fog spells as server state | 4 | 5 | 4 | 4 | 5 | 22 |
| G2 | Weather state machine | 4 | 5 | 3 | 4 | 3 | 19 |
| G3 | Radiation fog timing, fog types | 4 | 5 | 4 | 5 | 3 | 21 |
| G4 | Fair fog rules, fog gates | 5 | 5 | 3 | 4 | 4 | 21 |
| H1 | Time-of-day fog colour | 4 | 5 | 5 | 5 | 1 | 20 |
| H2 | Readability above or behind fog | 4 | 5 | 4 | 3 | 3 | 19 |
| H3 | Strength slider, reduce motion, sound | 5 | 5 | 4 | 3 | 3 | 20 |

**Reading the table.** Speed barely separates the rows, and that is the main efficiency finding. At 320x180 almost every technique costs microseconds, so 34 of 38 rows score a 5 [V, S10]. Only the procedural warp (B2), the CPU density grid (B4), server line of sight (E5) and radial blur (F4) drop below. Taste, mood and interaction decide. Memory and reveal (E4) wins at 23; height pooling (B3), clearing masks (B5), halos (F2) and smoke as server state (G1) follow at 22. Palette fog (C2), haze (F1), shafts (F3) and time-of-day colour (H1) are free beauty. The bottom rows are warnings: plain alpha (C3) is cheap and ugly, and radial blur (F4) is the one pretty shader a weak device would feel [I].

---

## 6. Deep dives

### 6a. Measured costs: what fog really costs

Our measurements [V, S10]. Apple M4 Pro, Chromium 153, WebGL2. "M4 GPU" is the ANGLE Metal timer-query time per full-screen, alpha-blended pass. "SwiftShader" is software GL, a bound for a device with no GPU; never use it to rank texture against maths. "6x throttle" is the DevTools CPU throttle, our low-end proxy. **No phone was measured.**

**GPU passes (ms per full-screen blended pass).**

| Technique | 320x180, M4 GPU | 720p, M4 GPU | 1080p, M4 GPU | 720p, SwiftShader | Profiles |
|---|---|---|---|---|---|
| Flat colour (floor) | 0.0019 | 0.0035 | 0.0078 | 0.37 | reference |
| One texture fetch | 0.0015 | 0.011 | 0.023 | 0.70 | A1, A2, A4 |
| Texture noise, 1 layer | 0.0008 | 0.0099 | n/a | 0.67 | B1, D1 |
| Texture noise, 2 layers | 0.0010 | 0.012 | 0.027 | 0.97 | B1 |
| Texture noise, 3 layers | 0.0012 | 0.014 | n/a | 1.23 | B1 |
| Domain warp from a texture, 3 fetches | 0.0013 | 0.014 | n/a | 1.34 | B2 |
| Height fog, 3 fetches plus exp | 0.0011 | 0.013 | n/a | 1.15 | B3 |
| Bayer dither plus palette snap | 0.0018 | 0.016 | 0.037 | 1.34 | C1, C2, D2 |
| Value fbm, 1 octave | 0.0029 | 0.019 | n/a | 0.65 | B2 (procedural) |
| Value fbm, 4 octaves | 0.0054 | 0.065 | 0.140 | 1.17 | B2 (procedural) |
| Simplex fbm, 4 octaves | 0.0125 | 0.133 | n/a | 2.18 | none, skip it |
| God rays, 8 samples | 0.0031 | 0.021 | n/a | 2.40 | F4 |
| God rays, 16 samples | 0.0064 | 0.036 | n/a | 4.49 | F4 |
| God rays, 32 samples | 0.0068 | 0.070 | 0.151 | 8.90 | F4 |
| God rays, 64 samples | 0.0112 | 0.141 | n/a | 18.0 | F4 |
| Four blended texture layers | 0.0032 | 0.040 | 0.082 | 2.61 | B6, C3 |

**CPU work in JavaScript (ms per call, single thread).**

| CPU task | Size | M4 Pro | 6x throttle | Profiles |
|---|---|---|---|---|
| Value fbm per pixel, 4 octaves | 320x180 | 0.81 | 4.65 | none, use a shader |
| Value fbm per pixel, 4 octaves | 1280x720 | 12.9 | 74.3 | none, use a shader |
| Noise table, nearest, integer scroll, 2 layers | 320x180 | 0.17 | 0.97 | B1 |
| Density grid step (advect, diffuse, decay) | 80x45 | 0.060 | 0.34 | B4 |
| Density grid step | 320x180 | 0.93 | 5.35 | B4 |
| Bayer dither to a 4-colour palette | 320x180 | 0.057 | 0.33 | C1 |
| Separable 3x3 box blur of a byte mask | 320x180 | 0.23 | 1.20 | E3 |
| texSubImage2D RGBA8 upload, wall time on Metal | 1280x720 | 0.30 | n/a | C5 |

**Fog-of-war updates (ms, 256x256 Uint16 count grid plus explored bit).**

| Units | Radius | Full recompute | Naive re-stamp, all move | Delta edge, all move | Delta edge, 10% move | Full recompute, 6x throttle |
|---|---|---|---|---|---|---|
| 10 | 4 | 0.0013 | 0.0006 | 0.0003 | 0.0002 | 0.0088 |
| 100 | 4 | 0.0084 | 0.0103 | 0.0033 | 0.0009 | 0.044 |
| 1000 | 4 | 0.070 | 0.110 | 0.033 | 0.008 | 0.36 |
| 10 | 8 | 0.0035 | 0.0032 | 0.0005 | 0.0002 | 0.019 |
| 100 | 8 | 0.020 | 0.031 | 0.0047 | 0.0011 | 0.114 |
| 1000 | 8 | 0.184 | 0.308 | 0.048 | 0.010 | 1.10 |

**What the tables say.**
- **At native size the GPU is idle.** The dearest pass at 320x180, 4-octave simplex fbm, costs 0.0125 ms, 0.07% of a 16.7 ms frame. 64-sample god rays come next at 0.011 ms, and they become the dearest pass at 720p (0.141 ms) [V, S10].
- **Cost scales with pixels.** Value fbm goes 0.0054, 0.065, 0.140 ms from 320x180 to 1080p [V, S10]. A window-sized fog `ColorRect` multiplies every row by 16 to 36.
- **Texture beats maths on a real GPU and loses on software GL.** An extra layer costs about 0.002 ms at 720p on the M4, an extra value octave 0.016 ms; on SwiftShader, 0.28 against 0.17 ms [V, S10].
- **Opaque benchmarks lie.** With blending off, Apple's hidden-surface removal culled covered draws and reported 4-octave fbm at 1080p as 0.0025 ms; blended, it is 0.140 ms, 56x more. Alpha 1.0 was culled too, until alpha became 0.99 [V, S10]. Apple and Arm both describe this saving for opaque overdraw [V, S154, S155]. Fog is translucent and pays for every layer.
- **The CPU is where budgets break.** JS per-pixel noise at 720p costs 12.9 ms, 74 ms throttled. Grid, upscale, Bayer and upload together cost about 0.26 ms, about 1.5 ms throttled [V, S10; I, note 08].
- **Deltas win.** At 1000 units and radius 8, delta stamping is 3.8x cheaper than a full recompute and 6.4x cheaper than a naive re-stamp [V, S10].

**Not measured** [I, note 08]. A phone; Godot itself; screen copies [V, S74]; SubViewports on web, where one user saw under 1 FPS [V, S75]; GDScript; line of sight. A 2-core Mali-G52 vendor peak implies at least 0.017 ms per 320x180 layer and 0.27 ms per 720p layer [V, vendor, S156; I]. `fogbench.html` runs on a phone as-is.

### 6b. Pretty versus cheap: the matrix

Rows are Speed; columns are Pixel taste plus Mood (2 to 10). Every profile appears once, with its §4 ratings.

| Speed | Taste + Mood 2 to 5 (ugly) | Taste + Mood 6 to 7 | Taste + Mood 8 to 9 | Taste + Mood 10 (best) |
|---|---|---|---|---|
| 5 (negligible) | A4, C3, C4 | A3, A5, E1, E2, G2, G4, H2, H3 | A1, A2, B1, B5, B6, C1, C5, D1, D2, D3, D4, E3, F2, F5, F6, G1, G3 | B3, C2, E4, F1, F3, H1 |
| 4 (care needed) | none | E5 | B2, B4 | none |
| 3 (felt on weak devices) | none | none | F4 | none |
| 2 (not for a web frame) | no profile; full procedural warp at 720p, a Stam solver, CPU per-pixel fbm at 720p | none | none | none |

**Pretty and cheap.** B3, C2, E4, F1, F3 and H1. Build these first; none needs more than a table read or a few sprites.

**Pretty but expensive.**
- Radial-blur god rays (F4): 0.141 ms at 720p, 18.0 ms on SwiftShader, plus a screen copy [V, S10, S74].
- Full procedural two-level warp (B2's expensive branch): about 0.33 ms at 720p by arithmetic [I, from S10].
- A Stam solver for fog: 32.1 ms at 320x180 in study #6 [V, S7].
- Lighting above sprite resolution (Children of Morta, Sea of Stars): smooth, and every cost times the pixel ratio [V, S137, S138; I].

**Cheap but ugly.**
- Plain alpha fog (C3), worst as a neutral grey quad [I, note 06].
- Additive screen fog (A4's OTClient shader), which greys night scenes [V, S20].
- Animated blue noise or temporal dither (C4) [I, note 05].
- A bilinear fog-of-war mask with no dither (E3's weak branch) [I, note 03].
- A hard hardware-window circle (A3) [I, note 01].

### 6c. Classic overlay timings

Frame counts are cited; px/s and seconds at 60 Hz are our conversions [I, notes 01, 04].

| Game | Effect | Layer | Speed | Blend | Fade or timing | Source |
|---|---|---|---|---|---|---|
| Pokémon Emerald | Horizontal fog | 20 × 64x64 sprites, world-locked | 1 px per 4 frames, about 15 px/s | EVA 12, EVB 8 (125%) | in about 1.5 s, out about 0.7 s | [V, S11, S12] |
| Pokémon Emerald | Diagonal fog | 20 × 64x64 sprites | about 20 px/s across, 12 down | 12, 8 | in about 3.5 s | [V, S11] |
| Pokémon Emerald | Route 120 clouds | 3 sprites at map coordinates | 1 px per 2 frames, 30 px/s | 12, 8 | delay 1 | [V, S11] |
| Pokémon Crystal | Dark cave | palette swap | instant | none | Flash swaps to night palette | [V, S15] |
| Zelda: ALttP | Lost Woods fog | BG1 subscreen, screen-locked | 1/8 px per frame, 7.5 px/s | add-half (50%) | none | [V, S17] |
| Zelda: ALttP | Canopy and clouds | BG1 | 0.5 or 0.25 of camera speed | add-half | none | [V, S17] |
| Zelda: ALttP | Lightning | colour math | frames 3 and 88 | add, no half | back on 5, 44, 90 | [V, S17] |
| Tibia (OTClient) | Fog shader | full screen, world-locked | (1, 0.3) × 0.05 | additive 0.6 | none | [V, S20] |
| StarCraft | Vision | 32 px tiles | rebuild every 100 frames, about 4.2 s | 3 states | instant reveal | [V, S30] |
| 0 A.D. | Line of sight | 7-tap blurred texture | on recompute | 255 visible, 127 explored | 0.5 s crossfade | [V, S32] |
| Asterion proposal | Fog; shadows; overhead clouds | 2 layers; 1 table; 1 to 3 sprites | 15 and 9 px/s; 6 to 12 px/s; 1.9x shadows | palette steps plus Bayer | in 2 s, out 1 s; reveal 0.3 s | [I] |

Fog drifts at 7.5 to 20 px/s and clouds near 30 px/s, in whole pixels [V, S11, S17]. Fog fades in slowly and out fast.

### 6d. Network and determinism for weather and vision

Sizes are illustrative except where the Sandbox counts them [S9; I].

| What | Who decides | Sent | Size | Notes |
|---|---|---|---|---|
| Region weather state | server | on change only | 5 bytes in a 7-byte packet | fog, cloud cover, wind x, wind y, fog ceiling [S9] |
| Weather transition | client | nothing | 0 | lerp over 60 to 120 s [I, note 04] |
| Fog drift, clouds, shadows | client | nothing | 0 | offsets from wind and server time, seeded table [I, note 04] |
| Density field, masks, halos | client | nothing | 0 | cosmetic [I, note 02] |
| Smoke or fog spell | server | cast and expiry | a few bytes each | tiles plus expiry tick [I, note 09] |
| Creatures hidden by fog of war or smoke | server | never | 0 | the anti-cheat rule [V, S35, S21] |
| Explored memory | client, or server to persist | optional save | 1 bit per tile, 128 KB at 1024x1024 | never creatures [I, note 07] |

**Rules that keep every client identical** [I].
1. One clock, sent at login and in regular packets.
2. Weather truth is a few bytes per region; every visual derives from bytes, clock and seed.
3. Vision truth lives on the server; client fog of war only dims what was never sent.
4. Anything that changes what you may see is server state with an expiry tick.

With 64 regions changing every 15 minutes the world costs about 0.5 bytes per second [I, note 04].

### 6e. The frame budget rule

Keep all fog work under about 2 ms of a 16.7 ms frame on a weak laptop, the rule from studies #6 and #7 [I; S7, S8]. At native size the shaders in §7 use about 0.01 ms of it on the M4 [V, S10]. The rest goes to the 80x45 grid (0.06 ms per 10 Hz step, 0.34 ms throttled), the fog-of-war mask upload (0.018 ms when it changes) and line of sight from study #5 [V, S10; S6]. Add no screen copies or SubViewports without measuring a web export first [V, S74, S75].

---

## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)

All of this section is design proposal [I], built from the cited parts. The Fog Sandbox (§8) plays it.

**Layers, bottom to top.**
1. **Server weather and vision truth (gameplay).** Each region holds a fog density target, cloud cover, a wind vector and a fog ceiling on a slow server clock; time of day drives radiation fog, which forms at night in low, moist cells and burns off after sunrise (G2, G3). Only these bytes travel, on change. The server decides which entities each client may see, counting fog of war and smoke, and never sends hidden ones (E5).
2. **Fog density field (client).** An 80x45 grid of 4 px cells whose target is weather density times a Beer's-law height factor times moisture, so fog pools low (B3). It is advected by wind, lightly diffused and pulled toward its target at 10 Hz, with interpolation between updates (B4). Clearing masks subtract around the player and lamps (B5).
3. **Drifting fog texture.** Two layers of one precomputed tileable noise table, scrolled in whole pixels at different slow speeds and directions, multiplied by the upsampled field and warped by an offset from a second table (B1, B2). No per-pixel procedural fbm.
4. **Fog rendering pass.** Fog takes the sky colour of the hour. Each scene colour moves N steps toward it through a lookup table with world-locked Bayer between steps (C2, C1); plain alpha is only a comparison (C3). Characters and lamps draw above the fog with an outline, or below it (H2).
5. **Clouds and cloud shadows.** Cloud cover thresholds a scrolling table (D1); shadows are one palette step darker, offset away from the sun and sliding with the wind (D2). Overhead clouds drift faster than the shadows and dither away near the screen centre and over the player (D3).
6. **Atmosphere.** High cells and the top of the screen take a haze tint with a contrast drop (F1). Lamps draw dithered halos that grow with local fog and clear a small hole (F2). Dawn brings a few pre-drawn shafts that brighten fog by palette steps (F3); radial blur is only a comparison (F4).
7. **Fog of war.** Cells are unknown, explored or visible. Visible comes from shadowcasting from study #5, rerun only on a cell change (E1, E2). Unknown is solid dark with a dithered edge, explored is remembered terrain in a dark, desaturated palette without live entities, visible is live; edges upsample through a Bayer threshold and cells fade in over about 0.3 s (E3, E4).
8. **Magic fog and smoke.** A fog spell or smoke bomb adds density, blocks sight because cells over a threshold count as opaque for the FOV, and decays over a few seconds (G1).
9. **Palette, time of day and accessibility.** Dawn, day, dusk and night palettes, with fog colour following the hour (H1). Reduce motion freezes drift while the fog keeps its shape; a strength slider helps low-vision players (H3).

**Pseudocode.**

Server weather tick and radiation fog (G2, G3):
```
def radiation(hours_after_dusk, hours_after_sunrise, sky_clear, wind):
    if not sky_clear or wind > 2: return 0.0           # wind mixes in dry air
    if hours_after_sunrise < 0:                         # still night
        return smoothstep(2, 6, hours_after_dusk)       # starts 2 h after dusk, full by 6 h
    return 1.0 - smoothstep(0, BURN_H, hours_after_sunrise)   # BURN_H 1..3 h, estimate
def server_tick(region, t):
    r = radiation(...)                                  # from the shared clock
    region.fog     = clamp(region.base_fog + 200 * r, 0, 255)
    region.ceiling = FLOOR_H + int(CEIL_SPAN * r)        # ceiling falls as fog burns off
    if region.state_bytes() != region.last_sent:         # 5 bytes
        broadcast(region.id, region.state_bytes())       # 7-byte packet
        region.last_sent = region.state_bytes()
```
The ceiling falls during burn-off, so high tiles leave the fog first and the valley floor last, the "edges toward the centre" of real radiation fog [V, S110].

Density field at 10 Hz (B3, B4, B5):
```
for each cell c:
    thick  = max(0, ceiling - height[c])                # low cell -> thick fog
    target = fog_density * (1 - exp(-K * thick)) * moisture[c]
    up     = bilinear(F, c - wind * DT)                  # semi-Lagrangian: read upwind
    avg    = (F[n] + F[s] + F[e] + F[w]) / 4
    v      = mix(up, avg, 0.2)                           # keep blur <= 0.25 per step
    v      = v + (target - v) * PULL                     # relax toward the rule
    v      = v - clear_mask[c]                           # player and lamps push holes
    G[c]   = clamp(v + spell[c], 0, 1)
swap(F, G); frame_lerp = 0                               # render lerps F_prev -> F
```

Fog fragment, palette steps with world-locked Bayer (B1, B2, C1, C2):
```
d     = lerp(field_prev, field_now, frame_lerp)(uv)     # bilinear upsample
w     = texture(warp_tab, px / 64).rg - 0.5             # one-fetch warp
n     = 0.6 * tab(floor(px * 0.5 + w * 6 + off1)) + 0.4 * tab(floor(px + off2))
f     = clamp(d * (0.55 + 0.9 * n) * strength, 0, 1)
lvl   = f * N_LEVELS                                     # N_LEVELS = 5
b     = BAYER4[(px.y + cam.y) & 3][(px.x + cam.x) & 3]   # world-locked, 0..15
step  = floor(lvl) + ((fract(lvl) * 16 > b) ? 1 : 0)
COLOR = PALETTE[ FOGMAP[time_of_day][step][scene_index] ]
```
`off1` and `off2` are whole-pixel offsets equal to minus `wind × server_time`, scaled per layer. Mind the sign. A pattern sampled at `px − v·t` moves along `+v`, so adding `wind × t` would send the fog upwind. Every client computes the same offsets from the shared clock, so every client draws the same fog.

Cloud shadow inside the same pass (D1, D2):
```
thr = 1 - cover                                          # more cover -> lower threshold
c   = cloud_tab(floor(world_px - shadow_offset - wind * t) / SCALE)  # offset points away from the sun
s   = c > thr ? 1 : (c > thr - 0.04 && b < 8 ? 1 : 0)    # one dithered edge band
scene_index = SHADE[scene_index][s]                       # one palette step darker
```

Fog of war with delta stamping on cell change (E1, E2, E4):
```
ENTER[dir], LEAVE[dir] = precomputed offsets for a radius-R circle stepped one cell
def on_cell_change(u, old, new, dir):
    if open_terrain(u): cells_on = [new + o for o in ENTER[dir]]; cells_off = [old + o for o in LEAVE[dir]]
    else:               vis = shadowcast(new, R)       # study #5; then diff with u.vis
                        cells_on, cells_off = vis - u.vis, u.vis - vis; u.vis = vis
    for c in cells_on:
        count[c] += 1
        if count[c] == 1: explored[c] = 1; emit(VISIBLE, c)   # 0 -> 1
    for c in cells_off:
        count[c] -= 1
        if count[c] == 0: emit(HIDDEN, c)                     # 1 -> 0
client: fade[c] += dt / 0.3 for visible cells; upload R8 rows that changed
```

Smoke cloud as server state (G1):
```
cast_smoke(owner, center, r=2, secs=15):
    cloud = {tiles: disc(center, r), expires: now + secs, rule: BLOCKS_SIGHT}
    opaque_overlay |= cloud.tiles; requeue_fov(viewers_near(cloud))
    broadcast(SMOKE_START, id, center, r, cloud.expires)      # a few bytes
on expiry: opaque_overlay -= cloud.tiles; requeue_fov(...); broadcast(SMOKE_END, id)
```


---

## 8. Reference implementation: the Fog Sandbox

`vfx-fog-sandbox.html` [S9] is one hand-written page of plain JavaScript on a **320×180** canvas, scaled with pixelated rendering. It plays the nine layers of §7 and shows each layer's cost live. Its design choices are ours [I], and every number on the page is illustrative.

**The world.** A top-down 3/4 highland with a clear height map: a valley with a stream and a marsh, tree-covered slopes, a ridge with a stone watchtower, a village edge with houses and lamp posts, a cave mouth, and an unexplored forest to one side.

**The grid.** 8x8 px cells, 40 x 23 (the last row partial), each with height, moisture, an opaque flag, an explored bit and a visible count. The fog field runs on a finer 80x45 grid of 4 px cells.

**What you can do.** Walk, cast a fog cloud, place a lamp or toggle a wall (keys 1 to 4; arrows, WASD or tap to move). Toggle fog mode (palette steps, Bayer, alpha; F cycles), noise table or procedural fbm, characters above or below fog, clouds, shadows, overhead clouds, haze, god rays (shafts or radial blur with 4 to 48 samples), fog of war and reduce motion. Set the time (2-minute auto day, T), fog strength (0 to 150%) and a preset: Clear, Morning valley fog, Coastal fog bank, Overcast or Night mist. V cycles views: normal, height, fog density, fog-of-war states and a cost view. Space pauses.

**The efficiency HUD.** Smoothed `performance.now()` timings per layer (density field, fog texture, fog pass, clouds, atmosphere, fog of war) and a total against a 16.7 ms bar, plus field updates per second, FOV recomputes and their cost, cells revealed, weather bytes (7 per change), vision bytes, and creatures sent out of the total.

**What it demonstrates.**
- The server state is 5 bytes per region, ticked every 2 s and sent as 7 bytes only on change. Radiation fog forms at night in low, wet ground and burns off after sunrise. Creatures in the dark are never sent.
- The field target is density times `1 − exp(−k · max(0, ceiling − height))` times moisture, at 10 Hz with a lerp between updates. The traveller and lamps push holes into it.
- Two layers read one 128x128 fbm table, warped by a 64x64 offset table, 4 reads per pixel. The procedural toggle computes 5 value octaves per pixel instead, and the HUD shows the difference.
- Each pixel is a palette index plus a fog level 0 to 5, resolved through an 8,192-entry table rebuilt as time moves.
- Cloud cover sets a percentile threshold; shadows are one palette step, offset by the sun, gone at night. Overhead clouds drift 1.9x faster and dither away near the centre and over the traveller.
- Lamps light dithered rings that grow with the fog; 6 pre-drawn shafts brighten dawn fog; radial blur is the costly comparison.
- Recursive shadowcasting at radius 13 reruns only on a cell change; cells fade in over 0.3 s; fully visible 8x8 blocks are skipped.
- The fog cloud decays 4.5% per update, about 6 s, and blocks sight while over the threshold.
- The dither is locked to world pixels, and reduce motion stops drift, flicker and shaft pulsing.

**Thumbnail.** The `data-demo="showcase"` button sets a dawn frame: fog filling the valley, lamps glowing in it, shafts through the trees, the tower above the fog, and fog of war at one edge.

**Simplifications (honest list)** [I].
- It is Canvas 2D drawn on the CPU. Its HUD times are JS costs, comparable with §6a's CPU table, not the GPU table, and nothing in it is a Godot measurement or a real network.
- "Server" and "client" share one page; bytes are counted, not sent.
- The 2-minute day, 10 Hz field, 0.3 s fade and 6 s spell are illustrative.
- In Asterion the server's 18x14 window decides what is sent, and fog of war only dims inside it.

---

## 9. Gem findings

Licences were read from LICENSE files on 2026-11-10 via the GitHub API, or from the page footer on godotshaders.com, where each page states its own licence [V, note 07]. Star counts and dates are from the same API calls. "NC" means non-commercial, and we write it into the Flag cell wherever it applies. **Flags:** **Low** = MIT/BSD/Apache/CC0; **LGPL** = fine as a separate library; **Copyleft** = GPL/AGPL/CC BY-SA, study and re-implement; **None** = no licence, study only.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| GDQuest clouds2D | https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Shaders/clouds2D.gdshader ; https://github.com/gdquest-demos/godot-shaders/blob/main/LICENSE | MIT code; art assets CC BY-NC-SA 4.0 | 4,199 stars | Cloud shadows in about 25 lines, 3 fetches; swap the gradient for a palette ramp | Low for code only; the repo's art is NC, do not ship it |
| FastNoiseLite | https://github.com/Auburn/FastNoiseLite | MIT | 3,553 stars | Seamless noise tables via `NoiseTexture2D`, no addon | Low |
| Blue noise textures (Christoph Peters) | https://momentsingraphics.de/BlueNoise.html | CC0 | Published 2016-12-22, widely cited | Ready dither textures 16² to 1024² | Low |
| 2D Fog Overlay (blinks) | https://godotshaders.com/shader/2d-fog-overlay/ | CC0 (page) | 2021-07-06 | fbm fog base, 4 octaves, one-level warp | Low |
| TopDown Game 2D Cloud shader (Jams) | https://godotshaders.com/shader/topdown-game-2d-cloud-shader/ | CC0 (page) | 2024-09-07 | One nearest sample, pixel-friendly clouds | Low |
| Cloud Shadow Pixel Patches (thatisuday) | https://godotshaders.com/shader/animated-grassy-wind-or-cloud-shadow-pixel-patches-overlay/ | CC0 (page) | 2026-01-04 | Stepped cloud shadow with a pixel size knob | Low |
| Pixel Art Cartoon Clouds (tripod) | https://godotshaders.com/shader/pixel-art-cartoon-clouds-circle-clusters/ | CC0 (page) | 2026-10-16 | Circle-cluster clouds, 4 palette colours, dither, outline | Low |
| PixelPlanets Clouds.gdshader | https://github.com/Deep-Fold/PixelPlanets/blob/master/Planets/LandMasses/Clouds.gdshader | MIT | Shipped generator with a live demo | Puffy clouds from fbm plus circle noise, 4 bands | Low |
| God rays (pend00) | https://godotshaders.com/shader/god-rays/ | CC0 (page) | 2021-01-27 | Procedural shafts, no screen read | Low |
| Pixelated God Rays 1 and 2 | https://godotshaders.com/shader/pixelated-god-rays/ ; https://godotshaders.com/shader/pixelated-god-rays-2/ | CC0 (page) | 2025-06-26 and 2025-06-30 | Pixelated, 4 colour levels; v2 uses a seamless texture | Low |
| Canvas Godray Edge Detection | https://godotshaders.com/shader/canvas-godray-edge-detection/ | CC0 (page) | 2026-04-28 | Screen-texture ray march, 8 to 128 samples; heavy on web | Low (expensive) |
| 2D Retro Dithered Lighting and Fog of War | https://godotshaders.com/shader/2d-retro-dithered-lighting-fog-of-war/ | MIT (page) | 2026-06-23 | 8x8 Bayer light bands; blends a fixed colour off-palette | Low |
| Hexagon Tilemap Fog of War | https://godotshaders.com/shader/hexagon-tilemap-fog-of-war/ | CC0 (page) | 2024-05-09, Godot 4 | Nearest-sampled visibility mask texture | Low |
| godot-mrpas | https://github.com/matt-kimball/godot-mrpas | MIT | 32 stars | Drop-in GDScript grid FOV, also usable on a server | Low |
| TABmk godot-4-fog-of-war | https://github.com/TABmk/godot-4-fog-of-war | MIT | 14 stars | Explored mask with `blend_rect`; re-uploads 4 MB per move by default | Low |
| 87PizzaStudios godot_light_fow | https://github.com/87PizzaStudios/godot_light_fow | MIT | 18 stars | Fog of war from 2D lights in a SubViewport; risky on Compatibility | Low |
| Godot-FogOfWar (AntonWedemeier) | https://github.com/AntonWedemeier/Godot-FogOfWar | none | 24 stars | Viewport feedback brush | None |
| OpenRA shroud | https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Game/Traits/Player/Shroud.cs | GPL-3.0 | 17,766 stars | Count grid, touched cells, 12 or 47 edge sprites | Copyleft |
| 0 A.D. LOSTexture | https://github.com/0ad/0ad/blob/master/source/graphics/LOSTexture.cpp | GPL-2.0-or-later | 2,827 stars | 0/127/255 mask, 7-tap blur, 0.5 s crossfade | Copyleft |
| Stratagus | https://github.com/Wargus/stratagus | GPL-2.0 | 747 stars, active 2026-11-09 | 16-case tiled fog, 4x4 upscale, 8 easing steps | Copyleft |
| libtcod | https://github.com/libtcod/libtcod | BSD-3-Clause | 1,241 stars | Many FOV algorithms in C | Low |
| rot.js | https://github.com/ondras/rot.js/tree/master/src/fov | BSD-3-Clause | 2,729 stars | JS shadowcasting for web prototypes | Low |
| Phaser RenderTexture erase | https://phaser.io/examples-show/3215 ; https://docs.phaser.io/phaser/concepts/gameobjects/render-texture | MIT (Phaser); example code licence not checked | Official examples | Web fog-of-war erase brush | Low (examples unchecked) |
| Shadertoy fog and cloud shaders | https://creativecommons.org/licenses/by-nc-sa/3.0/ | CC BY-NC-SA 3.0 by default unless stated (terms page 403) | Huge catalogue | Ideas only, never paste | Copyleft, NC (non-commercial by default) |

**Top five for Kingsfoil** [I, note 07]. Bake noise tables with FastNoiseLite and port the CC0 2D Fog Overlay with 2 to 3 layers and a density mask. Port GDQuest's clouds2D code (MIT, never the NC art), replace its gradient with a 2 to 3 colour palette ramp and snap UVs. Use godot-mrpas or study #5's shadowcaster for FOV, on the client and the server. Copy the ideas of OpenRA's count grid and 0 A.D.'s 0/127/255 mask, but write your own code, since both are GPL. Use pend00's or the pixelated CC0 shafts for god rays and skip 64-sample screen marches on web.

---

## 10. Learnings and anti-patterns

**Learnings** [I unless cited]
1. **Render fog at game resolution.** At 320x180 every shader costs microseconds; at window size, 16 to 36 times more [V, S10].
2. **The CPU and the bus break budgets, not the GPU.** Per-pixel JS noise, full-size re-uploads, screen copies and SubViewports [V, S10, S75, S98].
3. **Fog is colour.** Toward the light's colour, less saturation, less contrast, through a palette table [V, S112, S70].
4. **One density byte per cell, one palette, one clock,** the shape of the DOOM fire [S1].
5. **Height makes fog beautiful** (B3), and **deltas make fog of war cheap** (E2) [V, S10].
6. **Fog of war in an MMO is the server's interest management** [V, S21, S35].

**Anti-patterns**
- A grey alpha wash, or additive fog at night [I, note 06; V, S20].
- Dither that moves with the fog, or screen-locked dither under a scrolling world [I, notes 02, 06].
- Sub-pixel scrolling with linear filtering [I, note 02].
- Fast one-way drift, read as smoke, oil or water [V, S118].
- Fog that hides threats and adds a penalty with no counter [V, S119, S120].
- Benchmarking fog with blending off on a tile GPU [V, S10, S154].
- Per-pixel fbm on the CPU, or a 1000x1000 RGBA8 mask re-uploaded per move [V, S10, S98].
- A 500-point uniform loop in a WebGL2 fog-of-war shader [V, S95].
- An undithered bilinear fog-of-war mask that bleeds through thin walls [V, S37].
- Radial blur at window resolution [V, S10], and Shadertoy code in a commercial game [V, S99].

---

## 11. "See it in action" index

| # | Game | Fog idea | URL |
|---|---|---|---|
| 1 | Pokémon Emerald | 20 world-locked fog sprites, BLDALPHA 12/8 | https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c |
| 2 | Pokémon Emerald | Weather on Route 119 and Route 120 | https://bulbapedia.bulbagarden.net/wiki/Weather |
| 3 | Pokémon Crystal | Darkness palette in caves | https://github.com/pret/pokecrystal/blob/master/engine/tilesets/timeofday_pals.asm |
| 4 | Pokémon Brilliant Diamond and Shining Pearl | Route 210 fog and Defog | https://www.nintendolife.com/guides/pokemon-brilliant-diamond-and-shining-pearl-defog-hm-where-to-get-defog |
| 5 | Zelda: A Link to the Past | Lost Woods fog, parallax overlays, lightning | https://github.com/snesrev/zelda3/blob/master/src/overworld.c |
| 6 | Tibia (OTClient) | Optional "Map - Fog" shader | https://github.com/opentibiabr/otclient/blob/main/modules/game_shaders/shaders/fragment/fog.frag |
| 7 | Tibia (TFS) | 18x14 view window instead of fog of war | https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp |
| 8 | Warcraft II | Black shroud, grey fog | https://warcraft.wiki.gg/wiki/Fog_of_war |
| 9 | StarCraft | Vision rebuilt every 100 frames | https://liquipedia.net/starcraft/Fog_of_War |
| 10 | Red Alert (OpenRA) | Shroud and fog edge sprites | https://www.openra.net/ |
| 11 | League of Legends | 128x128 grid upscaled to 512x512 | https://www.riotgames.com/en/news/story-fog-and-war |
| 12 | League of Legends | Graves Smoke Screen, 4 s nearsight | https://wiki.leagueoflegends.com/en-us/Graves |
| 13 | VALORANT | Server-side fog of war, under 2% of frame | https://www.riotgames.com/en/news/demolishing-wallhacks-valorants-fog-war |
| 14 | Dota 2 | Smoke of Deceit, 45 s team invisibility | https://dotacoach.gg/en/items/smoke-of-deceit |
| 15 | Factorio | Radar charting, dim last-known chunks | https://wiki.factorio.com/Radar |
| 16 | Brogue CE | Cold blue memory colour | https://github.com/tmewett/BrogueCE/blob/master/src/brogue/IO.c |
| 17 | Dungeon Crawl Stone Soup | Mesh over remembered tiles | https://crawl.develz.org/ |
| 18 | Cogmind (and others) | Remembered terrain darker, no monsters | https://redlib.hbubli.cc/r/roguelikedev/comments/84rkyv/faq_friday_70_map_memory |
| 19 | Graveyard Keeper | Sprite fog with altitude, time-of-day LUTs | https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made |
| 20 | Don't Starve: Hamlet | Heavy Fog with a small clear radius | https://dontstarve.wiki.gg/wiki/Heavy_Fog |
| 21 | Hollow Knight | Fog and haze objects, soft light shapes | https://unity.com/madewith/hollow-knight |
| 22 | Ori and the Blind Forest | Light fog behind the play layer | https://www.pressreader.com/australia/edge/20161013/283407716237477 |
| 23 | Octopath Traveler II | HD-2D volumetric fog and light | https://www.unrealengine.com/en-US/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style |
| 24 | Hyper Light Drifter | Colour and silhouette first | https://www.gamedeveloper.com/business/the-ultra-modern-stylings-of-hyper-light-drifter |
| 25 | Darkest Dungeon | Darkness as a 0 to 100 rule | https://darkestdungeon.wiki.gg/wiki/Surprise |
| 26 | Silent Hill 2 (remake) | Players mod the fog away | https://pcgamer.com/games/horror/silent-hill-2-players-are-modding-away-the-fog-and-freeing-the-camera-to-discover-hidden-detail-in-the-remake |
| 27 | Return of the Obra Dinn | Bayer plus blue-noise dither, anti-swim | https://hackaday.com/2022/07/04/dithering-makes-everything-cooler-now-even-animated |
| 28 | Baldur's Gate 3 | Fog Cloud and Darkness | https://bg3.wiki/wiki/Fog_Cloud |
| 29 | Into the Breach | Smoke tile cancels attacks | https://www.ludo.guide/guide/into-the-breach/game-mechanics |
| 30 | Fukyuuten | Stencilled cloud shadows | https://hatchet2k4.itch.io/fukyuuten/devlog/341089/update-1302022-shadows-and-clipping |

---

## 12. What remains unverified (and corrections)

**Conflicts between notes, and how we resolved them**
1. **Quilez's fog article.** Note 05 got HTTP 404 and wrote the height-fog formula from memory; note 10 confirmed the article and the closed form `(a/b) · exp(−ro.y·b) · (1 − exp(−t·rd.y·b)) / rd.y` [K; V, S53]. It is background only; the recommendation is Beer's law on a thickness (B3).
2. **Noise estimates against measurements.** Note 05's 1.4 ms (4-octave fbm) and 7 ms (two-level warp) for a 7600GS-class GPU are scaled from McEwan 2012, not measured [I, note 05]. Our measured 4-octave simplex at 320x180 on the M4 is 0.0125 ms [V, S10]. We use the measurements.
3. **Fog-of-war costs.** Note 03 found no published millisecond figure and estimated from cell counts; note 08 measured them [V, S10]. We use note 08.
4. **Cloud scroll sign.** Note 04's recipe samples at `world_px + wind · t`, which moves clouds upwind. Our §7 pseudocode subtracts `wind · t` [I]. Check the sign in any port.
5. **Blend coefficients and overlay ids.** Note 04 inferred Emerald's (12, 8); note 01 read it in code and GBATEK, and they agree [V, S12, S16]. ALttP's 0x9D as Lost Woods fog is read from a comment [I, note 01].
6. **SwiftShader order.** On software GL a texture layer costs more than an octave; on the M4 it is the reverse [V, S10]. We rank by the real GPU.

**Labelled as estimates or self-reported**
- Radiation fog burning off 1 to 3 hours after sunrise is our researcher's estimate [I, note 04].
- VALORANT's under 2% of server frame time, down from about 50%, is Riot's own figure [V, self-reported, S35].
- The Mali-G52 fill rate is a vendor peak [V, vendor, S156].
- Halo sizes, mote counts, clearing radius, reveal length and cloud px/s are design estimates [I, notes 04, 06, 09]. GDScript speed was not measured [I, note 03].

**Still unverified [U]**
- No phone was measured; every cost comes from an Apple M4 Pro plus a 6x CPU throttle [S10]. Godot itself, screen copies and SubViewports on a web export were not measured.
- `DrawableTexture2D` exists in Godot 4.7 [V, S82], but the 19 June 2026 release date is from a secondary source and Compatibility and web support are undocumented [U, S81, S82]. Godot 4.4's date is from memory [U, S78].
- The Shadertoy default licence (CC BY-NC-SA 3.0) was not read on the terms page, which returned 403 [U, S99]. GDQuest's art is CC BY-NC-SA, so the NC flag applies to its assets [V, S96].
- Official Tibia area fog, Tibia field durations and the 2D light cap per object are community reports [U, note 01, S24, S77].
- The A3 traffic figure, the Tales of Fablecraft and Liquipedia SC2 pages, and the Tunic and Death's Door Unity posts were read as snippets or not at all [U, S40, S44, S42, S142, S125].
- Silent Hill's fog intent has no primary source [U, S124]. Stardew storm odds conflict between wiki pages [U, S103].
- No code-level numbers for FF6, Secret of Mana, Chrono Trigger or Minish Cap fog, nor for Age of Empires or the 1995 C&C shroud [U, notes 01, 03].

---

## 13. Prototype roadmap for Godot (web)

1. **Measure first.** Run `fogbench.html` [S10] on a low-end Android phone and an older iPhone, then a 320x180 Godot Compatibility web export with one blended `ColorRect`.
2. **Native resolution.** Viewport stretch at 320x180, a pixel-snapped camera, all fog inside that viewport.
3. **Weather bytes.** 5 bytes per region, a 7-byte packet on change, shared server time, radiation fog with a falling ceiling. Test that two clients draw identical offsets.
4. **Height and density.** An R8 height texel per tile and an 80x45 field at 10 Hz in GDScript; move it to C# or GDExtension if it passes 1 ms on the phone.
5. **Fog shader.** Two layers of one FastNoiseLite table, a 1-fetch warp, palette steps with world-locked Bayer, a strength uniform and a reduce-motion flag.
6. **Clouds.** A thresholded table, one palette step of shade away from the sun, masked off water; 1 to 3 overhead clouds on `Parallax2D`.
7. **Fog of war.** Server counts, delta stamps, shadowcasting on cell change, no packets for hidden creatures. Client R8 mask by changed rows, bilinear plus Bayer, 0.3 s fade, memory through a cool ramp.
8. **Atmosphere.** Haze in the palette pass, two-ring halos after the fog, a few dawn shafts and motes, presets for cave, swamp and steam, smoke as server state, an ambience low-pass. Try `DrawableTexture2D` for the explored mask on a web export.

---

## 14. Sources

Numbered for [S#] references. All URLs come from notes 01 to 10, the shared context or the Sandbox spec. "Blocked", "snippet" or "not fetched" means our researchers did not read the page directly.

**Series**
1. DOOM PSX fire (series reference), Fabien Sanglard, 2018: https://fabiensanglard.net/doom_fire_psx/
2. VFX #1 Snow (palette lighting, dithered lamp pools): https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
3. VFX #2 Acid (glow by block-sum blur plus palette select): https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel
4. VFX #3 Rain (rain haze, spray mist, evaporation mist): https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel
5. VFX #4 Forest (shade ellipses, sunflecks, canopy): https://kingsfoil-artifacts.netlify.app/vfx-forest-topdown-pixel
6. VFX #5 Light (Tibia light model, day/night, cloud shadows in B4, shadowcasting, DrawableTexture2D): https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel
7. VFX #6 Fire and smoke (smoke field advection, Bayer smoke, smoke blocking sight, measured grid costs): https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel
8. VFX #7 Water (shorelines, rivers, waterfall mist): https://kingsfoil-artifacts.netlify.app/vfx-water-topdown-pixel
9. Fog Sandbox: `vfx-fog-sandbox.html` (companion page)
10. Kingsfoil fog benchmark, our own measurement (November 2026): `studies/vfx-fog/notes/bench/fogbench.html`, runner `run.py`, raw data `results-*.json` in the same folder. Apple M4 Pro (14 cores, 48 GB), macOS 26.5.1, Playwright 1.63.0 with Chromium 153.0.8010.12; GPU runs on ANGLE Metal (real GPU, timer queries) and ANGLE SwiftShader (software GL); CPU runs in single-threaded JS, plain and with the DevTools 6x CPU throttle as a low-end proxy. No phone was measured.

**Classic consoles**
11. pokeemerald, src/field_weather_effect.c: https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
12. pokeemerald, src/field_weather.c: https://github.com/pret/pokeemerald/blob/master/src/field_weather.c
13. pokeemerald, include/constants/field_weather.h: https://github.com/pret/pokeemerald/blob/master/include/constants/field_weather.h
14. pokeemerald, src/field_screen_effect.c (Flash radii): https://github.com/pret/pokeemerald/blob/master/src/field_screen_effect.c
15. pokecrystal, engine/tilesets/timeofday_pals.asm: https://github.com/pret/pokecrystal/blob/master/engine/tilesets/timeofday_pals.asm
16. GBATEK, LCD colour special effects: https://problemkaputt.de/gbatek.htm
17. zelda3 reimplementation, src/overworld.c: https://github.com/snesrev/zelda3/blob/master/src/overworld.c
18. SNESdev wiki, colour math; Super Famicom wiki, translucency: https://snes.nesdev.org/wiki/Color_math ; https://wiki.superfamicom.org/translucency

**Tibia, Ultima Online and RuneScape**
19. OTClient (opentibiabr), gameconfig.h, map.cpp, mapview.h, const.h: https://github.com/opentibiabr/otclient/blob/main/src/client/gameconfig.h ; https://github.com/opentibiabr/otclient/blob/main/src/client/map.cpp ; https://github.com/opentibiabr/otclient/blob/main/src/client/mapview.h
20. OTClient, fog.frag and shaders.lua: https://github.com/opentibiabr/otclient/blob/main/modules/game_shaders/shaders/fragment/fog.frag ; https://github.com/opentibiabr/otclient/blob/main/modules/game_shaders/shaders.lua
21. The Forgotten Server, map.h and protocolgame.cpp: https://github.com/otland/forgottenserver/blob/master/src/map.h ; https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
22. ServUO, Map.cs and LightCycle.cs: https://github.com/ServUO/ServUO/blob/master/Server/Map.cs ; https://github.com/ServUO/ServUO/blob/master/Scripts/Misc/LightCycle.cs
23. RuneLite GPU plugin, GpuPlugin.java and vert.glsl: https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/gpu/GpuPlugin.java ; https://github.com/runelite/runelite/blob/master/runelite-client/src/main/resources/net/runelite/client/plugins/gpu/vert.glsl
24. TibiaQA, elemental fields (community); Tibiantis notes, poison: https://www.tibiaqa.com/13634/what-type-of-elemental-fields-is-there-and-what-damage-do-they-produce ; https://tibiantis-notes.github.io/poison

**Fog of war in RTS engines and online games**
25. Warcraft wiki, Fog of war: https://warcraft.wiki.gg/wiki/Fog_of_war
26. OpenRA, Shroud.cs: https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Game/Traits/Player/Shroud.cs
27. OpenRA, AffectsShroud.cs: https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Traits/AffectsShroud.cs
28. OpenRA, ShroudRenderer.cs and mods/ra/rules/world.yaml: https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Traits/World/ShroudRenderer.cs ; https://github.com/OpenRA/OpenRA/blob/bleed/mods/ra/rules/world.yaml
29. Stratagus, fow.h, fow.cpp, tile.h, map_fog.cpp: https://github.com/Wargus/stratagus/blob/master/src/include/fow.h ; https://github.com/Wargus/stratagus/blob/master/src/map/fow.cpp ; https://github.com/Wargus/stratagus/blob/master/src/include/tile.h
30. OpenBW (StarCraft: Brood War reimplementation), bwgame.h: https://github.com/OpenBW/openbw/blob/master/bwgame.h
31. 0 A.D., CCmpRangeManager.cpp and Los.h: https://github.com/0ad/0ad/blob/master/source/simulation2/components/CCmpRangeManager.cpp ; https://github.com/0ad/0ad/blob/master/source/simulation2/helpers/Los.h
32. 0 A.D., LOSTexture.cpp: https://github.com/0ad/0ad/blob/master/source/graphics/LOSTexture.cpp
33. Spring/Recoil, LosHandler, LosMap, ModInfo, GlobalConstants; Recoil Los.cpp: https://github.com/beyond-all-reason/spring/tree/master/rts/Sim/Misc ; https://github.com/beyond-all-reason/RecoilEngine/blob/master/rts/Rendering/Map/InfoTexture/Modern/Los.cpp
34. Riot Games, A Story of Fog and War (May 2016): https://www.riotgames.com/en/news/story-fog-and-war
35. Riot Games, Demolishing Wallhacks with VALORANT's Fog of War: https://www.riotgames.com/en/news/demolishing-wallhacks-valorants-fog-war
36. Factorio wiki, Radar: https://wiki.factorio.com/Radar
37. minmax, grid-based fog of war in UE4, part 1: https://minmax.itch.io/operators/devlog/222177/rendering-grid-based-fog-of-war-in-unreal-engine-4-part-1
38. Bursztein, Hamburg, Lagarenne, Boneh, OpenConflict, IEEE S&P 2011: https://www.ieee-security.org/TC/SP2011/PAPERS/2011/paper032.pdf ; https://crypto.stanford.edu/~dabo/pubs/abstracts/onlinegames.html
39. treeform, Don't use lockstep in RTS games; Spring netcode overview: https://medium.com/@treeform/dont-use-lockstep-in-rts-games-b40f3dd6fddb ; https://beyond-all-reason.github.io/spring/articles/netcode-overview
40. A3 interest management paper (found via search, not fetched): https://core.ac.uk/download/36695351.pdf
41. Abrams, Watsen, Zyda, VRST 1998: https://mikezyda.com/resources/pubs/VRST98.pdf
42. Liquipedia, StarCraft II high ground and low ground (403, quoted via search); StarcraftAI wiki, chance to hit: https://liquipedia.net/starcraft2/High_Ground_and_Low_Ground ; https://www.starcraftai.com/wiki/Chance_to_Hit
43. Hypercoven devlog, Making fog with your bare hands (Oct 2024): https://filmstars.itch.io/hypercoven/devlog/813874/making-fog-with-your-bare-hands
44. Robin Wouters, Tales of Fablecraft fog of war (403, snippet): https://robinwouters.artstation.com/projects/a0Z2xq

**Roguelike memory**
45. NetHack 3.7, include/rm.h: https://github.com/NetHack/NetHack/blob/NetHack-3.7/include/rm.h
46. Angband, cave-map.c and ui-map.c: https://github.com/angband/angband/blob/master/src/cave-map.c ; https://github.com/angband/angband/blob/master/src/ui-map.c
47. Brogue CE, Globals.c and IO.c: https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c ; https://github.com/tmewett/BrogueCE/blob/master/src/brogue/IO.c
48. Dungeon Crawl Stone Soup, tiledgnbuf.cc: https://github.com/crawl/crawl/blob/master/crawl-ref/source/tiledgnbuf.cc
49. r/roguelikedev FAQ Friday #70, map memory (2018, search summaries): https://redlib.hbubli.cc/r/roguelikedev/comments/84rkyv/faq_friday_70_map_memory
50. Rust roguelike tutorial (bracket-lib), chapter 5: https://bfnightly.bracketproductions.com/chapter_5.html

**Noise, fog maths and dithering theory**
51. Inigo Quilez, Domain warping: https://iquilezles.org/articles/warp/
52. Inigo Quilez, fBM: https://iquilezles.org/articles/fbm/
53. Inigo Quilez, Better fog (height fog): https://iquilezles.org/articles/fog/
54. Demofox, Analytic fog density (2014): https://blog.demofox.org/2014/06/22/analytic-fog-density/
55. Flax Engine, exponential height fog (docs and shader): https://docs.flaxengine.com/manual/graphics/fog-effects/exponential-height-fog.html ; https://git.flaxengine.com/Flax/FlaxEngine/src/commit/38cd840a66e1ec9b5fc310b54fff327a9217974d/Source/Shaders/ExponentialHeightFog.hlsl
56. PBR Book 3rd ed., volume scattering processes: https://pbr-book.org/3ed-2018/Volume_Scattering/Volume_Scattering_Processes
57. McEwan, Sheets, Gustavson, Richardson, Efficient computational noise in GLSL (2012): https://arxiv.org/pdf/1204.1461
58. Gustavson and McEwan, tiling simplex and flow noise, JCGT 2022: https://jcgt.org/published/0011/01/02/paper-lowres.pdf
59. Ken Perlin, Improving Noise (2002): https://mrl.cs.nyu.edu/~perlin/paper445.pdf
60. Bridson, Hourihan, Nordenstam, Curl-noise for procedural fluid flow (2007): https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf
61. Steven Worley, A cellular texture basis function (1996): https://dl.acm.org/doi/10.1145/237170.237267
62. Red Blob Games, Making maps with noise functions: https://www.redblobgames.com/maps/terrain-from-noise/
63. Kenny Mitchell, Volumetric light scattering as a post-process, GPU Gems 3 ch. 13 (2007): https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process
64. Fabien Sanglard, light scattering port: https://fabiensanglard.net/lightScattering/
65. Christoph Peters, free blue noise textures (CC0, 2016): https://momentsingraphics.de/BlueNoise.html
66. NVIDIA patent filing, spatio-temporal blue noise (vendor): https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11727621
67. Return of the Obra Dinn dithering (secondary sources): https://hackaday.com/2022/07/04/dithering-makes-everything-cooler-now-even-animated ; https://setsideb.com/?p=5672 ; https://www.alanzucconi.com/?p=10365
68. tufourn, Obra Dinn style dithering (Mar 2025): https://tufourn.pages.dev/blog/2025-03-28-obra-dinn-style-dithering
69. Playdate dev forum, an exploration of dithering and flashing: https://devforum.play.date/t/an-exploration-of-dithering-and-flashing/10272
70. O'Shea, Blackburn, Ono, Contrast as a depth cue, Vision Research 1994: https://researchportal.scu.edu.au/esploro/outputs/journalArticle/Contrast-as-a-depth-cue/991012820590902368
71. Critique of the contrast-depth study: https://philarchive.org/archive/DREDPF
72. Aerial perspective: Eclectic Light (2024) and Hanover College: https://eclecticlight.co/2024/02/16/a-to-z-of-landscapes-aerial-perspective/ ; https://psychology.hanover.edu/Krantz/art/aerial.html
73. Jos Stam, Real-Time Fluid Dynamics for Games (GDC 2003): https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/GDC03.pdf

**Godot engine**
74. Godot docs, screen-reading shaders: https://docs.godotengine.org/en/stable/tutorials/shaders/screen-reading_shaders.html
75. Godot forum, SubViewport performance on web (anecdote): https://forum.godotengine.org/t/subviewport-rendering-performances-on-web/101434
76. Godot docs, 2D lights and shadows: https://docs.godotengine.org/en/stable/tutorials/2d/2d_lights_and_shadows.html
77. Godot forum and proposals, the 2D light cap per object: https://forum.godotengine.org/t/working-around-godots-2d-light-limitations-for-a-dark-game/81311 ; https://github.com/godotengine/godot-proposals/discussions/9336
78. Godot docs, shading language (per-instance uniforms in 2D) and docs PR 10749: https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/shading_language.html ; https://github.com/godotengine/godot-docs/pull/10749
79. Godot 4.5 release, CG Channel report, stencil proposal: https://godotengine.org/releases/4.5/ ; https://www.cgchannel.com/?p=170196 ; https://github.com/godotengine/godot-proposals/issues/3373
80. Godot 4.6 release: https://godotengine.org/releases/4.6/
81. Godot 4.7 release; release-date reports; 4.7.2: https://godotengine.org/releases/4.7/ ; https://app.cinevva.com/news/2026-06-19-godot-4-7-released ; https://gamedev.net/news/5172-godot-engine-472-stable-released/
82. Godot, DrawableTexture2D class docs (4.7), class XML and GLES3 storage code: https://docs.godotengine.org/en/4.7/classes/class_drawabletexture2d.html ; https://github.com/godotengine/godot/blob/master/doc/classes/DrawableTexture2D.xml ; https://github.com/godotengine/godot/tree/master/drivers/gles3/storage
83. Godot docs, volumetric fog (albedo of mist vs smoke): https://docs.godotengine.org/en/stable/tutorials/3d/volumetric_fog.html
84. Godot docs, 2D particle systems: https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html
85. Godot forum, fake light with CanvasModulate: https://forum.godotengine.org/t/creating-fake-light-that-works-with-canvas-modulate-optimizing-lighting-in-2d/142438

**Shaders and code we can reuse**
86. Godot Shaders, 2D Fog Overlay (blinks, 2021, CC0): https://godotshaders.com/shader/2d-fog-overlay/
87. Godot Shaders, TopDown Game 2D Cloud shader (Jams, 2024, CC0): https://godotshaders.com/shader/topdown-game-2d-cloud-shader/
88. Godot Shaders, Animated Grassy Wind or Cloud Shadow Pixel Patches Overlay (thatisuday, Jan 2026, CC0): https://godotshaders.com/shader/animated-grassy-wind-or-cloud-shadow-pixel-patches-overlay/
89. Godot Shaders, Pixel Art Cartoon Clouds, circle clusters (tripod, Oct 2026, CC0): https://godotshaders.com/shader/pixel-art-cartoon-clouds-circle-clusters/
90. Godot Shaders, God rays (pend00, 2021, CC0): https://godotshaders.com/shader/god-rays/
91. Godot Shaders, Pixelated God Rays and Pixelated God Rays 2 (2025, CC0): https://godotshaders.com/shader/pixelated-god-rays/ ; https://godotshaders.com/shader/pixelated-god-rays-2/
92. Godot Shaders, Canvas Godray Edge Detection (Apr 2026, CC0): https://godotshaders.com/shader/canvas-godray-edge-detection/
93. Godot Shaders, Color Dither (Donitzo); godot-2d-dithering; forum answer on Bayer step: https://godotshaders.com/shader/color-dither/ ; https://github.com/ensanmartin/godot-2d-dithering ; https://forum.godotengine.org/t/how-can-i-apply-a-dithering-effect-to-a-gradienttexture/143687
94. Godot Shaders, 2D Retro Dithered Lighting and Fog of War (nachomakesgames, Jun 2026, MIT): https://godotshaders.com/shader/2d-retro-dithered-lighting-fog-of-war/
95. Godot Shaders, Basic Fog of War Shader (2025, MIT): https://godotshaders.com/shader/basic-fog-of-war-shader/
96. GDQuest godot-shaders: LICENSE, clouds2D.gdshader, demo scene, noise resource: https://github.com/gdquest-demos/godot-shaders/blob/main/LICENSE ; https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Shaders/clouds2D.gdshader ; https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Demos/Clouds2DDemo.tscn
97. FastNoiseLite and Godot's vendored copy: https://github.com/Auburn/FastNoiseLite ; https://github.com/godotengine/godot/blob/master/thirdparty/README.md
98. TABmk, godot-4-fog-of-war (and HeartBeast's tutorial): https://github.com/TABmk/godot-4-fog-of-war ; https://github.com/uheartbeast/godot-fow-tutorial
99. Shadertoy licence default (forum report) and CC BY-NC-SA 3.0 text: https://magicmusicvisuals.com/forums/viewtopic.php?p=9445 ; https://creativecommons.org/licenses/by-nc-sa/3.0/
100. Deep-Fold PixelPlanets, Clouds.gdshader and LandMasses.tscn: https://github.com/Deep-Fold/PixelPlanets/blob/master/Planets/LandMasses/Clouds.gdshader ; https://github.com/Deep-Fold/PixelPlanets/blob/master/Planets/LandMasses/LandMasses.tscn

**Clouds, weather and meteorology**
101. Fukyuuten devlog, shadows and clipping (Jan 2022): https://hatchet2k4.itch.io/fukyuuten/devlog/341089/update-1302022-shadows-and-clipping
102. Minecraft wiki, Weather: https://minecraft.wiki/w/Weather
103. Stardew Valley wiki, weather data and weather odds diff: https://stardewvalleywiki.com/Modding:Weather_data ; https://stardewvalleywiki.com/Special:MobileDiff/52434
104. Terraria wiki, Wind: https://terraria.wiki.gg/wiki/Wind
105. Don't Starve wiki, Rain: https://dontstarve.wiki.gg/wiki/Rain
106. Aszyk, Hybrid weather simulation system for real-time rendering, CESCG 2026: https://cescg.org/wp-content/uploads/2026/04/Aszyk-Hybrid-Weather-Simulation-System-for-Real-Time-Rendering-1.pdf
107. Gametek, Markov chains for the game designer: https://gametek.substack.com/p/markov-chains-for-the-game-designer
108. Met Office, What is fog?: https://weather.metoffice.gov.uk/learn-about/weather/types-of-weather/fog
109. CIMSS, condensation, dew, fog and clouds: https://cimss.ssec.wisc.edu/wxwise/class/dewfog.html
110. NWS training, fog guide: https://www.weather.gov/media/zhu/ZHU_Training_Page/fog_stuff/fog_guide/fog.pdf
111. SIRTA fog dissipation study, ACP 2023 (search summary only): https://acp.copernicus.org/articles/23/15711/2023/acp-23-15711-2023.pdf

**Pixel art craft, mood and players**
112. Slynyrd, Pixelblog 62, landscape backgrounds (May 2026): https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds
113. Slynyrd, Pixelblog 11, landscape pixeling (2018): https://slynyrd.com/blog/2018/11/16/pixelblog-11-landscape-pixeling
114. Pixnote, dithering guide: https://pixnote.net/en/learn/dithering
115. Pixel Parmesan, Dithering for pixel artists: https://pixelparmesan.com/dithering-for-pixel-artists
116. itch.io posts, fog dither alignment and palette-locking stray alpha: https://itch.io/post/9334920 ; https://itch.io/post/13865283
117. Graveyard Keeper, how the graphics effects are made (Lazy Bear): https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
118. r/IndieDev, "Does this look like a nightmare fog?" (Feb 2026 snapshot): https://reddit.sentinel-team.org/posts/1r8ua1j/snapshots/2026-02-20T04%3A11%3A24.594254Z
119. TV Tropes, Pokémon scrappy mechanics; Nintendo Life, BDSP Defog: https://www.tvtropes.org/pmwiki/pmwiki.php/ScrappyMechanic/Pokemon ; https://www.nintendolife.com/guides/pokemon-brilliant-diamond-and-shining-pearl-defog-hm-where-to-get-defog
120. Don't Starve wiki, Heavy Fog; Klei forum threads: https://dontstarve.wiki.gg/wiki/Heavy_Fog ; https://kleiforums.com/forums/topic/96732-slow-in-the-fog-sucks/ ; https://kleiforums.com/forums/topic/107325-humid-season-sucks-too-much/
121. World of Warcraft forum, spore fog and low vision: https://us.forums.blizzard.com/en/wow/t/visual-setting-help/2317851
122. Hyper Light Drifter reviews (Kotaku, PC Gamer): https://kotaku.com/hyper-light-drifter-the-kotaku-review-1769432532 ; https://pcgamer.com/hyper-light-drifter-review
123. Stardew mods, Cave Weather and Ambient Light: https://www.curseforge.com/stardewvalley/mods/cave-weather-dynamic-mine-events ; https://www.nexusmods.com/stardewvalley/mods/4639
124. Silent Hill fog (secondary) and the Silent Hill 2 remake fog mod: https://retro-replay.com/retroreplayfyi-the-accidental-horror-of-silent-hills-fog ; https://dev.to/blaze_faisal/the-truth-about-silent-hill-2-fog-myth-when-hardware-limits-meet-creative-genius-7o1 ; https://pcgamer.com/games/horror/silent-hill-2-players-are-modding-away-the-fog-and-freeing-the-camera-to-discover-hidden-detail-in-the-remake
125. Death's Door (Edge review, Unity blog, Byteside): https://www.pressreader.com/australia/edge/20210812/283313230515167 ; https://blog.unity.com/games/crafting-intricate-environments-deaths-door ; https://byteside.com/2021/08/deaths-door-developer-acid-nerve-on-how-it-made-its-sword-wielding-crow-game
126. Dark Souls fog walls (Game Rant, CyberPost): https://gamerant.com/fromsoftware-games-fog-walls-dark-souls-elden-ring-bloodborne/ ; https://cyberpost.co/why-do-walls-fog-in-dark-souls/
127. Sridharan, fog of war in games, DiGRA: https://dl.digra.org/index.php/dl/article/download/3026/3010/3069
128. Wayward Strategy, battlefield uncertainty and fog of war (2015): https://waywardstrategy.com/2015/01/30/battlefield-uncertainty-and-fog-of-war/

**Accessibility and sound**
129. Accessible Player Experiences, Clear Channels: https://accessible.games/accessible-player-experiences/access-patterns/clear-channels/
130. Xbox Accessibility Guideline 118, photosensitivity: https://learn.microsoft.com/en-ie/gaming/accessibility/xbox-accessibility-guidelines/118
131. Xbox Accessibility Guideline 102, contrast: https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/102
132. Game Accessibility Guidelines, adjustable contrast: https://gameaccessibilityguidelines.com/provide-an-option-to-adjust-contrast/
133. Fog in sound design (Wayline, Unity low-pass manual, Morphic, Designing Sound): https://www.wayline.io/blog/audio-plugins-game-atmosphere ; https://docs.unity3d.com/Manual/class-AudioLowPassFilter.html ; https://morphic.com/resources/sounds/fog-sound-effects ; https://designingsound.org/2012/12/creating-the-spaces-of-ambience

**Shipped games and studio interviews**
134. Hollow Knight (Unity case study) and the NoBlur mod: https://unity.com/madewith/hollow-knight ; https://github.com/Destalta/NoBlur
135. Hyper Light Drifter (Game Developer; Automaton interview, Japanese): https://www.gamedeveloper.com/business/the-ultra-modern-stylings-of-hyper-light-drifter ; https://automaton-media.com/articles/interviewsjp/20170525-47328/
136. Ori and the Blind Forest (Edge; Polycount): https://www.pressreader.com/australia/edge/20161013/283407716237477 ; https://polycount.com/discussion/comment/2267931
137. Children of Morta art (TechRaptor): https://techraptor.net/content/how-dead-mage-created-the-art-for-children-of-morta
138. Sea of Stars (MobileSyrup interview, presskit, TechRaptor day-night clip): https://mobilesyrup.com/2023/09/11/sea-of-stars-level-design-sabotage-studio-thierry-boulanger-interview/ ; https://sabotagestudio.com/presskits/sea-of-stars ; https://techraptor.net/gaming/news/sea-of-stars-gameplay-clip-shows-day-night-cycle
139. Octopath Traveler II (Unreal interview) and HD-2D (Wikipedia): https://www.unrealengine.com/en-US/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style ; https://en.wikipedia.org/wiki/HD-2D
140. Don't Starve overlays and colour cubes (Klei forum): https://forums.kleientertainment.com/forums/topic/137865-adding-overlay/ ; https://forums.kleientertainment.com/forums/topic/47987-map-sharing-mod-feasibility/
141. Quest Girl devlog, the fog atmosphere effect (Godot): https://liangzi82.itch.io/quest-girl/devlog/722727/-the-fog-atmosphere-effect-in-quest-girl
142. Tunic (Unity blog, now 404; Wireframe): https://blog.unity.com/games/smoke-mirrors-and-scrolling-textures-behind-the-scenes-of-tunic ; https://wireframe.raspberrypi.com/articles/wireframe-cover-star-tunic-and-the-art-of-keeping-a-secret

**Gameplay fog rules**
143. Dota 2, Smoke of Deceit: https://dotacoach.gg/en/items/smoke-of-deceit ; https://www.dota2protips.com/items/smoke_of_deceit
144. League of Legends wiki, Graves: https://wiki.leagueoflegends.com/en-us/Graves ; https://www.riftpatchnotes.com/lol/champion/graves
145. Baldur's Gate 3 wiki, Fog Cloud: https://bg3.wiki/wiki/Fog_Cloud
146. Baldur's Gate 3 wiki, Darkness: https://bg3.wiki/wiki/Darkness
147. Divinity: Original Sin 2, clouds and Smoke Cover: https://www.gamepressure.com/originalsinii/clouds-and-combinations/zfa275 ; https://divinityoriginalsin2.wiki.fextralife.com/Smoke+Cover
148. Into the Breach mechanics: https://www.ludo.guide/guide/into-the-breach/game-mechanics ; https://www.gamepressure.com/into-the-breach/combat/z1aa78
149. Wargroove wiki, Fog of War and rules: https://wargroovewiki.com/Fog_of_War ; https://wargroovewiki.com/Rules_(Codex)
150. Albion Online, the Mists: https://mmos.com/news/albion-online-the-mists-dev-update ; https://www.albiondatabase.com/guides/mists

**Lights, shafts and motes**
151. Glow sprites on mobile, for and against (itch.io; Construct forum): https://itch.io/post/2069770 ; https://www.construct.net/en/forum/construct-3/how-do-i-8/graphic-effect-mobile-game-157585
152. Eevee Expo, RPG Maker halo lighting tutorial: https://eeveeexpo.com/resources/710
153. Unreal forum, stylised light shafts with dust and particles in shafts: https://forums.unrealengine.com/t/stylized-fake-animated-light-shafts-with-fireflies/1941111 ; https://forums.unrealengine.com/t/is-there-any-way-to-make-particles-seen-only-in-sun-light-shafts/303681

**GPU hardware and web performance**
154. Apple WWDC20 session 10632, Optimize Metal performance for Apple silicon: https://developer.apple.com/videos/play/wwdc2020/10632
155. Arm, Mali performance 3, opaque overdraw: https://community.arm.com/groups/arm-mali-graphics/blog/2014/05/16/mali-performance-3-is-eglbufferpreserved-a-good-thing
156. AnandTech, Mali-G52 launch (vendor figures): https://anandtech.com/show/12501
