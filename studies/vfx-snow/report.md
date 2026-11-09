# Top-down pixel snow: tiny algorithms that make a winter world feel alive

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This series takes one concept per study and looks for old-school, very simple and very efficient algorithms for visual effects and textures. The reference case is the **DOOM PSX fire**: a tiny cellular automaton over a buffer of palette indices that looks excellent. The user's reference video could not be opened during this research, so we describe the effect from two written sources.

- **Fabien Sanglard's write-up [S1].**
  - The framebuffer holds values in [0, 36]: 37 palette entries running white → yellow → orange → red → black [V].
  - The bottom row is white (36) and never updated. Every other pixel copies the one below it, minus 0 or 1 chosen at random: `fire[to] = fire[from] - (rand & 1)` [V].
  - A random sideways offset in {+1, 0, −1, −2} makes the flames lean and flicker [V].
- **Filipe Deschamps' playground [S2].** An MIT-licensed repository with dozens of language ports (1,599 stars, last push 17 Oct 2026) [V]. Ports commonly switch the fire off by zeroing the source row [U].

A PICO-8 port uses only 5 colours and still reads as fire [V, S3]. That is the lesson carried over to snow: **one byte per cell, one local rule, one palette.**

**Targets.** Godot 4, web-first, which means the **Compatibility renderer** (WebGL 2). Top-down pixel art for a Tibia-like MMORPG (Asterion Online) and a top-down RPG.

**Scope.** Falling snow, uneven accumulation, interaction with characters, and time (build-up, melt, slush, refreeze). The study draws on nine research notes and on our own playable **Snow Sandbox** [S123].

---

## 1. Executive summary

1. **Ground snow is a heightmap drawn through a dither threshold.** Store one byte of depth per pixel. Snow shows where `depth > threshold`, with the threshold made of Bayer plus noise. Thin snow becomes an ordered dusting, and melt retreats in dithered patches with no tile popping [I, built on S37, S49, S58–S60]. Falling-sand rules assume in-plane gravity. From above, "fall down" becomes height relaxation (sandpile or talus) [I, S41–S43].
2. **Shelter is an exposure mask, baked once.** Accumulation models multiply snowfall by how much sky and wind reach a spot:
   - Ohlsson & Seipel's depth map rendered from the sky [V, S58];
   - CoH2's top-down "snow shadow" map [V, S27];
   - Werner's 15° shadow zone [V, S46] and Beneš & Roa's linear wind-shadow ramp [V, S47].

   In 2D this is one byte per cell: roof or canopy cover times a short upwind ray [I].
3. **Footprints conserve and displace.** Following Sumner et al. 1998, lower the cells under the foot and push the removed snow into a rim [V, S69]. Snowfall then refills the print, as Batman: Arkham Origins does by subtracting a little from its trail map each update [V, S23]. Pokémon-style decals that live 0.5–1 s are a cheaper, less alive fallback [V, S6, S8].
4. **Melt = temperature × sun × shade × edge.** The degree-day model `M = DDF·max(0, T − T0)` [K, Hock 2003, S53, S72] decides how much melts. Typical snow DDFs are 2–6 mm/°C/day [V, S51]. A sun map and a bare-neighbour count decide where it melts first [V-secondary S61; I]. RimWorld's 0.058 %·T² rule is a game-tested alternative [V, S10].
5. **Light through the palette.** Render palette indices. Re-tint the ~230-entry palette per frame for day and night. Draw lamp pools by choosing a warm palette per pixel through a Bayer threshold. Use warm light and cold blue-violet shadows, after saint11 [V, S95; I, S123].
6. **Flakes need height.** In a top-down view, screen-down means south. Give each flake (x, y, z), draw it at (x, y − z), and add a ground shadow dot [V technique, S101]. Fill the background with cheap parallax layers: image-space rain cost 4.11 ms against 19.45 ms for 5–10K particles [V, author-reported, S35].
7. **Godot plan.** Godot 4.7 (19 Jun 2026) added `DrawableTexture2D` GPU blits, which the source shows implemented on Compatibility [V, S75, S80]. The API is experimental [V, S77]. Web still lacks compute shaders and particle collision [V, S81], and Godot core still has no WebGPU [V, S75]. Recommended stack:
   - an 8-bit depth/packed/wet field plus a baked exposure byte;
   - a low-Hz CPU tick on dirty chunks;
   - one CanvasItem shader for threshold and palette;
   - z-height flakes;
   - sync only weather state and seeds, keeping footprints local and cosmetic [I].

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: decomp code, paper PDF, docs page, article. "[V-secondary]": read via a reliable summary, usually Reynolds' 2015 thesis literature review [S59]. "[V, vendor]": developer- or vendor-reported figure. "[V, RE]": reverse-engineered from a frame capture. |
| **[I]** | Author inference or design proposal. Untested unless it says "Sandbox", and then tested only in our JavaScript prototype. |
| **[U]** | Unverified: from memory, from a search-result title, or from an unconfirmed community source. Treat as a lead. |
| **[K]** | Established textbook or canonical-paper knowledge, with its reference. |

- [S#] refers to §14.
- "note 0X" refers to the internal research notes behind this study.
- Ratings (1–5) are author judgement for top-down pixel art on web Godot.
- "Estimated" costs come from operation counts, not benchmarks.

---

## 3. Generations: a timeline

**Gen 0: science precursors (1987–1998).**
- 1987: the Abelian sandpile (≥4 grains topple to 4 neighbours, and order does not matter) [K, BTW 1987, S41].
- 1995: Werner's dune CA [V, S46]:
  - hops of l = 5 cells;
  - sticking probability 0.6 on sand, 0.4 on bare ground;
  - a 15° shadow zone;
  - a 30° angle of repose.
- 1998: Sumner, O'Brien & Hodgins' height-column footprints [V, S69].

**Gen 1: 8/16-bit flakes and palette tricks (to 2004).**
- Mark Ferrari's colour-cycled snow paths in Living Worlds [V, S18]. The original year is not in our notes; the HTML5 port Canvas Cycle dates from 2010 [V, S20].
- SNES BG3 mist overlay in Super Mario World [V, S22].
- A 1994 SWAG Pascal snow program [V, S110].
- Demoscene Christmas snow: the xmas98 256b compo, and Snow64 (64 bytes, January 2002) [V, S111, S112].
- The Stone Protectors prototype: 74 multiplexed snow sprites against an 80-sprite limit [V, S21].
- Pokémon Emerald (2004): 16 flakes of 8×8 px with sine sway [V, S4, S5].

**Gen 2: tile states and seasons (1997–2016).**
- Tibia (1997): snow tile speed 160 versus ice 100; footprint tiles [V, S12].
- Ultima Online (1997): client-side seasons [V, S14].
- Oracle of Seasons (2001): rod-driven season swaps [V, S15].
- Pokémon D/P/Pt (2006–08): 4 sink depths [V, S9].
- OpenTTD (since 2004): density levels stepped in LFSR order [V, S103].
- Stardew Valley (2016): season-prefixed tilesheets [V, S16].

**Gen 3: per-cell depth simulations.**
- RimWorld (2013–): hidden 0–100 % depth per cell, a melt formula, speed bands [V, S10].
- Dwarf Fortress: gradual cover and freezing water [V, S11].
- Falling-sand engines:
  - The Powder Toy (since 2010) [V, S40];
  - Sandspiel (since 2018; 300×300 at 60 fps in WASM) [V, S37];
  - Noita (GDC 2019; 64×64 dirty chunks) [V, S36].

**Gen 4: GPU trail maps and coverage masks (2012–2023).**
- AC III (2012): mesh deformation with no refill [V, S24].
- Company of Heroes 2 (2013): top-down track map, snow shadow map, ice cells [V, S27].
- Batman: Arkham Origins (2013; GDC 2014): ≤512² heightmaps with refill, <1 ms on PS3/360 [V, vendor, S23].
- "Just snow" shader (2013) [V, S106].
- Rise of the Tomb Raider (2015): raised rims, "fill in blizzard" [V, S24].
- Horizon: The Frozen Wilds (2017) [V, S31].
- God of War (2018): a 384² paint target into 1024² heights [V, RE, S26].
- Slime Rancher 2 (2022; write-up 2023): one RGBA interaction buffer [V, S29].
- Godot community trail shader (2023) [V, S34].

**Gen 5: academic accumulation and melt (2000–2022).**
- Fearing 2000: "flake launching" [V-secondary, S56].
- Haglund et al. 2002: impact-incremented height texture [V-secondary, S59].
- Feldman & O'Brien 2002: wind drifts [V, S57].
- Ohlsson & Seipel 2004: sky depth map, 11–13 fps [V, S58].
- Moeslund 2005 and Saltvik 2006: flake motion [V, S66, S67].
- Foldes & Beneš 2007: day-averaged sun occlusion [V-secondary, S61].
- Festenberg & Gumhold 2009/2011: edge-distance caps [V-secondary, S62].
- Reynolds 2014: persistent maps, 103–112 fps [V, S60].
- Cordonnier 2018: layered snow, 0.01 m/day/°C, ~30 Hz at 1024² [V, S71].
- Junker & Palamas 2020: 100 agents at >30 fps [V, S70].

**Gen 6: 2025–2026.**
- Jan 2025: godotshaders Multilayer Snowfall [V, S89].
- Sep 2025: Godot 4.5 makes WASM SIMD the web default [V, S84].
- 25 Nov 2025: WebGPU in major browsers [V, S86].
- Jan 2026: Godot 4.6 [V, S85].
- 23 Apr 2026: GodotCon Amsterdam pixel-VFX talk on SubViewport feedback loops [V, abstract, S93].
- 24 Apr 2026: 4.7 beta 1 introduces DrawableTexture2D (GH-105701) [V, S74].
- **19 Jun 2026: Godot 4.7 stable** [V, S75, S76]:
  - DrawableTexture2D;
  - wasm64;
  - web still WebGL 2.
- Jun 2026: gd-snow-project uses DrawableTextures [V, S109].
- 21 Jul 2026: experimental Godot WebGPU backend claims ~4× WebGL [V, speaker-reported, S87].
- 30 Sep 2026: Weather FX Free with a pixel mode [V, S90].
- Oct 2026: Project Zomboid's Immersive Snow mod adds trodden paths and heat melt [V, S119].
- Still missing:
  - Godot core WebGPU;
  - any Godot asset doing 2D accumulation, prints and melt together [V/I, S88–S91].

---

## 4. Technique profiles

The profiles fall into five families:
- **A**, falling snow;
- **B**, coverage and accumulation;
- **C**, interaction;
- **D**, time;
- **E**, rendering and taste.

The ratings line follows a fixed order: Simplicity · Speed · Pixel taste · Aliveness · Interactivity (1 = poor, 5 = excellent, author judgement).

### Family A: Falling snow

### A1. Sprite flake list with a sine lookup table

*In plain words.* Keep a small fixed list of flakes. Every frame, each flake moves down by its layer speed and sways sideways by reading a sine table. When it leaves the screen it wraps back to the top. This is how GBA games and demoscene intros did snow.

*How it works (technical).* Pokémon Emerald is the cleanest documented case [V, S4, S5]:
- `NUM_SNOWFLAKE_SPRITES = 16` (rain gets 24); 8×8 4bpp sprites; 2 tile variants.
- Y position is fixed-point ×128. `tDeltaY = (rand&3)*5 + 64` gives about 0.5–0.62 px/frame.
- Sway is `x2 = gSineTable[tWaveIndex]/64`. The index advances 1 or 2 per frame (one flake in four gets 2) and wraps at 256.
- The spawn column is `((id*5)&7)*30 + rand%30`: 8 columns 30 px wide, so flakes never clump.
- Flakes are added or removed **one every 36 frames**, so snow fades in over about 9.6 s.

The demoscene form [I, from S113, S114]: `y += speed[layer]; x += sinLUT[(phase+t)&63] >> shift[layer] + wind; wrap with &(W-1)`, with far layers dim 1 px and near layers bright 2 px. Saltvik's spiral parameters suit the sway: R ~ U(0, 2), ω ~ ±U[π/4, π/3] [V, S67].

*Cost / performance.* About 6–8 integer operations per flake, plus a 64-byte sine table [I, estimated, S113]. In Godot, a 16–64 element array or a `MultiMeshInstance2D` is trivial [I]. Saltvik ran 20–40k flakes on 2006 CPUs [V, S67].

*Games that used it.*
- Pokémon Emerald (GBA, 2004): https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
- Stone Protectors (Mega Drive prototype; 74 multiplexed snow sprites, 3 layers, 5 sizes, 8-line spacing): https://rasterscroll.com/mdgraphics/graphical-effects/sprite-raster-effects/
- Snow64 by TAP (64-byte intro, 2002): https://www.pouet.net/prod.php?which=22358

*How it feels.* At 240×160, 16 flakes read as snowfall [I]. The 36-frame ramp is a free "it's starting to snow" moment. In top-down view a screen-space fall is a perspective lie (see A4), but at low density it reads as cosy retro snow.

*Risks.* Screen-down motion contradicts top-down space. Equal speeds per layer give a "pulsing" look; vary them. The peak of the GBA sine table is not verified, so the ±4 px sway figure is approximate [U, S4].

*Ratings:* Simplicity 5 · Speed 5 · Pixel taste 4 · Aliveness 2 · Interactivity 1

### A2. Palette-cycled flakes

*In plain words.* Paint the snow's paths into the background art and let the palette animate them. The pixels never move; only the colour table rotates.

*How it works (technical).* Mark Ferrari's method [V, S18, S19]:
- Each flake is a contrasting dot or dash travelling along a long "path" of palette indices.
- The path's colours match the background it crosses, so the path itself is invisible.
- Paths are painted as solid, straight-edged bands with no dither.
- In sunny variants the snow paths are *removed from the art*, and their palette rows are reused for rainbows or stars.
- Varying cycle lengths and speeds looks organic. Identical ones produce a "pulsing flash".

The rule is per-frame index arithmetic:
```
for each cycling range r: rotate palette[r.start .. r.end] by r.speed * dt
// pixel buffer untouched
```
In Godot: a palette-index texture plus a canvas shader that offsets indices inside ranges [I, S18].

*Cost / performance.* Close to zero per pixel. One palette rotation per frame [V, S115]: colour cycling exists because swapping a palette is cheaper than swapping frames.

*Games that used it.*
- Mark Ferrari's Living Worlds, via Canvas Cycle: https://experiments.withgoogle.com/canvas-cycle (code mirror https://gh.r-mj.com/icockrum/canvascycle)
- Snow 1 Demo (xmas98 256b, palette fuzz): https://files.scene.org/view/demos/compos/xmas98_256b/snow1.zip

*How it feels.* Hypnotic and painterly, and the most DOOM-fire-like option: pure index arithmetic [I]. It suits authored vistas (title screen, a window view) more than free-roaming maps.

*Risks.*
- The art must be authored for it, and it spends palette rows.
- The paths are fixed, so snow cannot respond to wind changes or the player.
- It does not tile well across a huge MMO map [I].

*Ratings:* Simplicity 3 · Speed 5 · Pixel taste 5 · Aliveness 3 · Interactivity 1

### A3. Stateless hashed-cell shader layers (and why layers beat particles)

*In plain words.* No flake list at all. A shader splits the screen into a grid per layer, hashes each cell's ID to place at most one flake in it, and scrolls the grid with time. Several layers at different scales give parallax.

*How it works (technical).* Andrew Baldwin's "Just snow" (Shadertoy ldsGDn, 2013) is the canonical source, and its header states CC BY-NC-SA 3.0 [V, S105, S106]. Per layer i: scale `q = -uv*(1+i*DEPTH)`, shear by a per-layer random slant, fall `q.y += SPEED*t/(1+i*DEPTH*0.03)`, hash `floor(q)` to offset one flake per cell, and draw a diamond with depth-of-field softness. Presets run 50 layers (light) to 200 (blizzard) [V, S107]. Chris Wellons' stateless starfield is the CPU twin: hash a tile to get 3 stars, store no list [V, S114]. Pixel-art version [I, note 08]:
```glsl
for (int i = 0; i < 3; i++) {
  vec2 q = (px + cam * parallax[i]) / cell[i] + vec2(wind*t, t*fall[i]);
  vec2 id = floor(q), f = fract(q);
  vec3 r = hash3(id + float(i)*17.0);
  vec2 p = 0.15 + 0.7*r.xy;                 // keep flakes inside the cell
  col += step(length(f - p)*cell[i], radius[i]) * flake_col[i];  // step, not smoothstep
}
```

*Cost / performance.* About 15–25 ALU per pixel per layer with no texture fetches [I, estimated, note 08]. Five layers are trivial at 320×180. Cost does not depend on flake count.

Why layers beat particles:
- Tatarchuk's ToyShop: a composite rain layer cost **4.11 ms** against **19.45 ms for 5–10K particles**, with no extra cost in heavy precipitation [V, author-reported, S35].
- Langer et al.: texture layers made "no discernible difference" to render time [V-secondary, S59].
- CoH2: half-resolution weather cut the worst-case frame drop from 30 % to under 4 % [V, vendor, S27]. A 320×180 game gets that saving for free [I].

*Games that used it.*
- Just snow and its many ports (libretro borders, Ghostty, Unity, Flutter, ISF): https://github.com/libretro/glsl-shaders/blob/master/borders/resources/snow.glsl
- godotshaders "Rain and Snow with Parallax" (MIT, with a `step()` variant for snow): https://godotshaders.com/shader/rain-and-snow-with-parallax-scrolling-effect/

*How it feels.* Dense and atmospheric. With 40 smooth layers it looks like screensaver snow; pixel-snapped with `step()` and 3 layers it sits inside the art [I].

*Risks.*
- **Licence.** "Let it snow!!!" (CC0 label) shares verbatim features with Just snow: the constant mat3 hash, the `uv*(1+fi*k)` scale and `dof = 5*sin(t*0.1)`. Its CC0 label therefore probably does not clear the original NC-SA terms [I, S108]. Re-implement instead of pasting.
- The Multilayer shader's 40-layer loop per fragment is heavy on low-end web [I, S89].
- Sub-pixel motion shimmers; snap time offsets to whole pixels.

*Ratings:* Simplicity 4 · Speed 5 · Pixel taste 3 · Aliveness 3 · Interactivity 1

### A4. Z-height flakes with a ground shadow dot (top-down specific)

*In plain words.* Each flake knows where on the ground it is above, and how high it is. Draw the flake lifted by its height and a tiny shadow on the ground beneath it. When the height reaches zero, the flake has landed.

*How it works (technical).* YellowAfterlife's fake-height technique [V, S101]:
- Store z apart from x and y.
- Draw the sprite offset up by z, and sort by ground y.
- Draw the shadow at the ground position, shrinking it with `12/(1+z/20)`.
- Clamp at zero on landing.

For snow [I, implemented in S123]:
```
flake: x, y (ground), z (height), phase
z -= vz[layer] * dt * (0.85 + 0.3*sin(phase))
x += (wind*22*windFactor[layer] + 4*sin(phase + frame*0.05)) * dt
draw pixel at (x, y - z); if layer == near: darken ground at (x, y)  // shadow dot
if z <= 0: if rand() < exposure[x,y]: depth[x,y] += 2;  respawn at z = 60..70
```
The Sandbox uses 3 layers [V, S123 code]:

| Layer | Flakes | Fall speed | Wind factor | Size | Shadow dot |
|---|---|---|---|---|---|
| Far | 260 | 14 px/s | 0.6 | 1 px, pale | no |
| Mid | 150 | 24 px/s | 1.0 | 1 px | no |
| Near | 46 | 42 px/s | 1.5 | 2×2 | yes |

Moeslund et al. give the physical motivation: lift produces helical paths [V, S66].

*Cost / performance.* O(flakes): 456 updates per frame in the Sandbox [V, S123]. Compatibility has no particle SDF collision [V, S81, S82], so landing must be computed like this.

*Games that used it.*
- The fake-z technique is documented for top-down loot rather than snow: https://yal.cc/top-down-bouncing-loot-effects/
- Silly Snow (PICO-8) is the side-view cousin: particles that "become part of the background" when they land: https://www.lexaloffle.com/bbs/?pid=84926

We found no shipped top-down game documented as using z-height snowflakes with shadow dots [I]. The Sandbox is our demonstration [S123].

*How it feels.* The single biggest "this is top-down" cue: flakes drift with the wind instead of sliding south, and shadow dots anchor them to the ground [I].

*Risks.*
- If landings feed accumulation, the link is mostly symbolic. In the Sandbox, flake landings contribute well under 1 % of deposition (see §6c) [I].
- Too many shadow dots look like dirt. Keep them to the near layer only.
- Flakes need to be drawn after characters for correct layering.

*Ratings:* Simplicity 4 · Speed 4 · Pixel taste 5 · Aliveness 5 · Interactivity 2

---

### Family B: Coverage and accumulation

### B1. Tile-state swaps and seasonal tilesets

*In plain words.* Winter is a different set of tiles. Swap the whole tileset when the season changes, and mark some tiles as "snow" with gameplay flags.

*How it works (technical).*
- **Stardew Valley** names outdoor tilesheets by season (`spring_outdoorsTileSheet.png`, `spring_town.png`), and seasonal furniture uses horizontally adjacent spring/summer/fall/winter sprites [V, S16].
- **Oracle of Seasons** swaps an area's season when the Rod is swung on a stump [V, S15].
- **Ultima Online** uses client-side season packet 0xBC [V, hedged forum answer, S14].
- **Tibia** makes snow a ground tile with speed 160, against ice at 100; lower is faster [V, S12].
- **Don't Starve Together** treats snow as rain with a different skin: one `precipitation` value from 0.0 to 1.0 plus `issnowing` / `iswinter` flags [V, S117].

*Cost / performance.* Zero per frame: one tileset or texture swap on a season event.

*Games that used it.*
- Stardew Valley: https://stardewvalleywiki.com/Modding:Maps
- Zelda: Oracle of Seasons: https://www.zeldadungeon.net/wiki/Winter
- Ultima Online: https://www.forums.polserver.com/viewtopic.php?p=19410
- Tibia: https://tibia.fandom.com/wiki/Tiles
- Don't Starve: https://dontstarve.wiki.gg/wiki/Winter

*How it feels.* Clean and authored. It is also instant and dead: nothing builds up or melts. UO players criticised winter for "square snow tiles" with jagged edges at roads, even though softer transition tiles exist in the art files [V, S14]. The lesson is that **edge and transition tiles are what make tile snow look good** [I].

*Risks.*
- Popping on the swap.
- A Tibia-like game with only this looks like 1997.
- Stardew players modded the winter paths because the vanilla recolour felt thin [V, S17].

*Ratings:* Simplicity 5 · Speed 5 · Pixel taste 4 · Aliveness 1 · Interactivity 1

### B2. OpenTTD per-tile density levels with scrambled visit order

*In plain words.* Each tile has a snow level from 0 to 3. Every so often the game visits a tile and nudges its level one step toward a target. Tiles are visited in a scrambled order, so snow arrives as a speckle that thickens, not as a sweeping line.

*How it works (technical).* From OpenTTD master (GPL-2.0) [V, S103, S104]:
```
// TileLoopClearAlps
k   = GetTileZ(tile) - GetSnowLine() + 1
if !snow: if k >= 0: MakeSnow(tile, 0)     // "started at 0 so it can gradually reach"
req = (k < 0) ? 0 : min(k, 3)
if cur == req: if k < 0: ClearSnow
else: AddClearDensity(±1)
```
- **Drawing** picks `_clear_land_sprites_snow_desert[density] + SlopeToSpriteOffset(tileh)`: one sprite per density and slope.
- **Visit order** comes from `RunTileLoop`, a Galois LFSR: `tile = (tile>>1) ^ (-(tile&1) & feedback)`. It processes `mapArea>>8` tiles per tick, so every tile is visited **once per 256 ticks**. The feedback constants run from `0xD8F` (64×64 maps) to `0x800B87` (4096×4096).
- **The variable snow line** is a 12 × 32 table of daily heights.

*Our mapping for Asterion* [I, note 07]: replace "height − snow line" with an exposure score, so the snowing target is `clamp(exposure*intensity, 0..3)`, and lower it faster on sun-facing tiles when sunny.

*Cost / performance.* O(tiles/256) per tick and one 32-bit LFSR state [V, S104]. On a 256×256-tile region that is 256 tile visits per tick [I].

*Games that used it.*
- OpenTTD arctic climate: https://github.com/OpenTTD/OpenTTD/blob/master/src/clear_cmd.cpp

*How it feels.* Organic and gradual at tile scale. OpenTTD draws per-tile sprites with no blending, so a hard tile edge is part of its look [V, note 07]. This is the best fit for **server-authoritative** snow in an MMO: deterministic, cheap, and 2 bits per tile [I].

*Risks.*
- **GPL-2.0.** Re-implement the idea; never paste the code [V, S102].
- Tile-level only, so it needs B4/E2 for sub-tile softness.
- Blocky edges unless you add autotile transitions.

*Ratings:* Simplicity 5 · Speed 5 · Pixel taste 3 · Aliveness 4 · Interactivity 3

### B3. Per-pixel depth heightmap

*In plain words.* Keep one byte per ground pixel: how deep the snow is there. Snowfall adds to it, feet subtract from it, sun removes it. Everything else in this study reads or writes this one buffer.

*How it works (technical).*
- **Haglund, Andersson & Hast (2002)** gave each surface a 2D height texture that every flake impact increments [V-secondary, S58, S59].
- **Reynolds et al. (2014)** made the maps persistent, adding each frame's snowfall so snow survives objects moving. They ran at 103–112 fps, and found accumulation-map resolution mattered more for fps than occlusion-map resolution [V, S59, S60].
- **RimWorld** stores a hidden 0–100 % depth per cell and quantises it into four named bands [V, S10]:

  | Band | Depth | Move speed |
  |---|---|---|
  | Dusting | 3–25 % | 100 % |
  | Thin | 25–50 % | 76 % |
  | Medium | 50–75 % | 62 % |
  | Thick | 75 %+ | 52 % |

- **Sandspiel** packs each cell into 4 bytes, so the grid uploads as an RGBA texture with **no copy** [V, S37].

Proposed layout [I]: depth, packed (trail mark), wet and exposure as four u8 channels, one RGBA8 texture of 230 KB at 320×180, plus a fixed per-pixel threshold.

*Cost / performance.* 57,600 cells at 320×180. Sandspiel ran 90,000 cells at 60 fps in Rust/WASM with render under 1 ms CPU, and the author warns that this size was too much for many devices [V, S37]. A vendor benchmark puts GDScript at about 51 ns per simple loop iteration, roughly 20× slower than C++ [V, vendor, S54]. A full GDScript pass with neighbour reads is therefore likely 5–15 ms, which is **not OK every frame** [I, estimated]. Tick at low Hz on dirty chunks, or use stochastic updates (see §7).

*Games that used it.*
- RimWorld: https://rimworldwiki.com/wiki/Snow
- Sandspiel (cell layout): https://maxbittker.com/making-sandspiel

*How it feels.* The step from "winter tileset" to "the world is weathering" [I].

*Risks.*
- CPU cost in GDScript.
- 8-bit precision means slow rates need stochastic or dithered increments.
- Gameplay reads need a CPU copy if the field lives on the GPU [I].

*Ratings:* Simplicity 4 · Speed 4 · Pixel taste 4 · Aliveness 5 · Interactivity 5

### B4. Threshold-dither coverage ("global snow_level vs noise", the no-sim baseline)

*In plain words.* Give every pixel a fixed random "how much snow do I need before I turn white" number. Compare it with either the real depth or a single global snow level. Snow appears speckle by speckle and melts back the same way, with no simulation at all.

*How it works (technical).* The cheapest form has no simulation [I, notes 02/03]:
```glsl
float d   = snow_level * exposure(uv);            // 0 CPU: one uniform + one baked texture
float thr = noise(px)*a + shelter*b + sun*c + edge*d;
bool snow = d > thr;
```
- **SnowRunner** exposes a global "Procedural snow coverage" scalar on terrain [V, S32].
- **Batman AO and CoH2** drive time with global scalars and buffers [V, S23, S27].
- **The godotshaders dissolve shader** computes `mask = smoothstep(noise - w, noise, value)` with a burn width of about 0.04. That edge band is where slush belongs [V, S48].
- **With a real depth field (B3)**, the threshold makes thin snow a dusting. The Sandbox threshold on grass is `bayer*0.55 + hash*2.5 + 0.5` depth units, plus 5 on grass tufts so tufts poke through longest [V, S123 code].

*Cost / performance.* One compare per pixel in a shader [I]. Zero CPU when using the global-scalar form.

*Games that used it.*
- SnowRunner (global coverage scalar): https://expeditions-guides.saber.games/map_modding/creating_a_map/snow_and_ice/adding_snow_and_ice/
- Company of Heroes 2 (shader blend Solid → Broken → Slush → Water by health): https://www.slideshare.net/slideshow/daniel-barrero-coh2renderingtech/26765990

*How it feels.* Stable and non-flickering. Melt "eats" the snow in a fixed speckle pattern, which reads as natural patchy melt [I, note 08]. With exposure folded in, open fields whiten first and lee sides last, at zero simulation cost.

*Risks.*
- Without a depth field, footprints cannot refill naturally, and prints need a separate trail map.
- A static threshold pattern can look like a fixed stencil if the camera lingers.
- Dithering over large flat fields reads as dirt. Limit it to transitions [I, note 06].

*Ratings:* Simplicity 5 · Speed 5 · Pixel taste 5 · Aliveness 3 · Interactivity 1

### B5. Exposure / sky-occlusion mask

*In plain words.* Before it ever snows, compute for every ground pixel "how much sky and wind can reach me". Under roofs and tree canopies the answer is close to zero, and behind walls it is low. Multiply all snowfall by it.

*How it works (technical).*
- **Ohlsson & Seipel (2004).** Snow prediction `fp = fe · finc` [V, S58]:
  - `fe` (exposure) comes from a depth map rendered from the sky with parallel projection;
  - `finc` (inclination) is `cos θ + n`, with small noise `n` of about 0–0.4;
  - edges are softened by several offset samples plus noise.
- **CoH2.** A top-down "snow shadow" depth map keeps snow off surfaces that are not topmost. Edges use min/max erode and dilate plus noise. The same map is reused for precomputed AO on static objects [V, S27].

The top-down version [I, implemented in S123]:
```
// shelter[]: roof/canopy footprints and eaves, e.g. tree ring:
shelter *= 0.12 + 0.88 * r*r          // r = normalised distance from trunk
expo[p] = baseByMaterial[p] * shelter[p] * windLee(p)   // B6
```
- Store per-surface base exposures. The Sandbox uses ground 1.0, ice 0.7 and canopy 0.9.
- Bake the mask once per map, or once per wind bucket.

*Cost / performance.* About 0.6 M reads once at load, tens of ms even in GDScript [I, note 03].

*Games that used it.*
- Company of Heroes 2 (top-down camera): https://www.slideshare.net/slideshow/daniel-barrero-coh2renderingtech/26765990
- RimWorld (snow only on unroofed cells): https://rimworldwiki.com/wiki/Snow

*How it feels.* The difference between "a white filter" and "weather in a place". Bare rings under trees and dry strips under eaves are the most readable proof that snow came from the sky [I].

*Risks.*
- Ohlsson & Seipel recomputed snow every frame, so snow on moved objects was lost [V-secondary, S59]. Use exposure as a *rate* into a persistent buffer, never as the snow itself [I].
- Moving objects (carts, tents) need a dynamic stamp or a re-bake of the region.

*Ratings:* Simplicity 4 · Speed 5 · Pixel taste 4 · Aliveness 4 · Interactivity 2

### B6. Wind lee and drift rays

*In plain words.* Wind leaves a shadow of calm air behind walls, where snow piles up, and strips snow from exposed ridges. March a few pixels upwind from each cell. If you hit an obstacle close by, you are in its lee.

*How it works (technical).*
- **Werner (1995)** [V, S46]:
  - slabs hop l = 5 cells downwind;
  - they stick with p = 0.6 on sand and 0.4 on bare ground;
  - they always stick in the **15° shadow zone**;
  - avalanches run at a **30° repose angle**;
  - periodic boundaries; 1000×1000 lattices.
- **Beneš & Roa (2004)** [V, S47]:
  - wind-shadow intensity is **0 directly behind an obstacle and rises linearly with distance**;
  - shadow length scales with obstacle height and wind;
  - material that would land inside an object goes to the nearest outside border, which is how snow piles against walls;
  - they ran at 4–10 fps at 1000×1000 on a 1.5 GHz CPU.
- **Feldman & O'Brien (2002)** reproduce windward drifts and leeward gullies in about 3 h of MATLAB [V, S57].

At tan 15° ≈ 0.27, a 1-tile wall shadows about 3.7 tiles [I, note 03]. The Sandbox's baked rule [V, S123 code]:
```
for d in 1..28:                         // step upwind, same row
    h = obstacleHeight[x - dir*d, y]
    if h > 0:
        L = h*1.1*|wind| + 2
        if d < L:        e *= 0.15 + 0.85*(d/L)^2     // lee: strongly reduced
        elif d < 1.8*L:  e *= 1.12                    // drift band just past the lee
        break
```
It is baked once per wind bucket (steps of 0.5).

*Cost / performance.* Bake: up to 28 reads per pixel, once per wind change. Runtime: zero, because it is folded into exposure.

*Games that used it.*
- The Long Dark: a "Wind Shield" forms behind solid objects or low terrain; high wind slows walking into it by up to 50 % within a 45° cone: https://thelongdark.fandom.com/wiki/Weather
- Project Zomboid "Immersive Snow" mod: wind drifts snow along the ground: https://top-mods.com/mods/project-zomboid/gameplay/16435-immersive-snow.html

No game was found that ships a Werner-style drift CA [V, note 03].

*How it feels.* Drifts tell you where the wind came from; with B7 the lee of a fence becomes a soft white ramp [I].

*Risks.*
- Horizontal-only rays in the Sandbox ignore diagonal winds [V, S123].
- Re-baking on every gust causes visible jumps. Quantise wind into buckets and change it slowly [I].

*Ratings:* Simplicity 3 · Speed 5 · Pixel taste 4 · Aliveness 5 · Interactivity 2

### B7. Sandpile / talus smoothing

*In plain words.* If one pixel's snow is much higher than its neighbour's, move a little across. Repeat on random pixels. Peaks slump, holes soften, and footprint rims round off.

*How it works (technical).*
- **Abelian sandpile.** ≥4 grains topple to the 4 neighbours, and the result does not depend on update order, so it is safe to parallelise [K, S41].
- **Thermal erosion.** If the slope exceeds talus T, move `c*(dmax−T)` to the lower neighbours in proportion to slope. One reference used T = 4/map_width with a rotated von Neumann neighbourhood (4 diagonals) and 4 iterations [V, S42]. World Machine notes that real talus is 30–40°, and lower values "look more like sand or soil" [V, S44].
- **Reynolds** replaces repose tests with a **Gaussian blur** on the accumulation map, arguing the snow repose angle is "incredibly variable" [V, S59].
- **Snow-specific trend.** The angle of repose rises with temperature and with smaller grains, and falls with fall height [V, S45]. So wet snow stands steeper and dry powder spreads [I].

The integer version in the Sandbox [V, S123 code]:
```
repeat 4000 times per sim step:
    i = random interior cell; j = random 4-neighbour of i (same surface class)
    if depth[i] > depth[j] + 3: depth[i]--, depth[j]++
```

*Cost / performance.* About 4–8 operations per visited cell [I, note 08]. The Sandbox visits 4,000 random cells per step, about 7 % of the field. The cost scales with the visit count, not with field size [I].

*Games that used it.*
- Falling-sand games use the side-view form: Sol's "Let it Snow" tries down, then down-left, then down-right: https://solhsa.com/gp2/ch04.html
- PICO-8 Component Snow: https://www.lexaloffle.com/bbs?tid=36368

*How it feels.* Soft and physical: rims slump and berms settle. A different T per state gives character (powder spreads, packed snow holds walls) [I].

*Risks.*
- In-place sequential updates are slightly directional. Random visit order hides it [I].
- On the GPU, use the pull form, where each pixel pulls from its neighbours [I, S55].

*Ratings:* Simplicity 5 · Speed 4 · Pixel taste 4 · Aliveness 4 · Interactivity 3

### B8. Snow caps on object tops (the "empty pixel above" rule)

*In plain words.* Any pixel of a roof, fence, rock or tree whose upper neighbour is empty is a "top", and it gets snow. With no extra art, everything gets a white cap.

*How it works (technical).* In a sprite shader [I, note 02]:
```glsl
bool top = alpha(uv) > 0.0 && alpha(uv - vec2(0.0, texel.y)) == 0.0;
// extend down 1–3 px with snow_level
```
- **Festenberg & Gumhold** show that snow thickness rises with distance from the edge of the supporting surface, and that snow bridges small gaps and overhangs edges (cornices) [V-secondary, S62, S63].
- **Pixel-art translation:** `thickness = min(maxDepth, k·edgeDist)`, with a 1-px overhang lip on the camera-facing side and morphological closing for fences [I, note 04].
- **The Sandbox** instead gives roofs, rock tops, fence rails and canopy tiers their own depth cells, which accept snowfall like the ground. Canopy is capped at 14 units, and canopy thresholds use value noise so pines look clumpy [V, S123 code].

*Cost / performance.* One extra alpha fetch per sprite pixel, or zero if authored as a mask channel.

*Games that used it.*
- Don't Starve: snow "builds up on trees and many other objects": https://dontstarve.wiki.gg/wiki/Winter
- Bloodborne: snow "clings to statues and objects": https://www.thegamer.com/most-impressive-snow-physics-mechanics-in-games/
- CoH2: objects "suck in" terrain snow, and damage removes it: https://www.slideshare.net/slideshow/daniel-barrero-coh2renderingtech/26765990

*How it feels.* The "Christmas card" moment: roofs and fence rails piped with white [I].

*Risks.*
- The automatic rule caps every top, including things that should stay clean, like chimneys near heat [I].
- An authored snow-cap mask is the higher-taste route, and it matches the SnowRunner and artist-paint practice [I, note 02].
- Ohlsson & Seipel's per-pixel method gave thin twigs unnatural amounts of snow [V-secondary, S59]. Cap thin objects.

*Ratings:* Simplicity 4 · Speed 5 · Pixel taste 5 · Aliveness 3 · Interactivity 1

---

### Family C: Interaction

### C1. Footprint decal ring buffer (the Pokémon way)

*In plain words.* Every step drops a small footprint sprite. Keep a fixed number of them; the oldest is overwritten or fades out.

*How it works (technical).*
- **Pokémon Emerald** [V, S6, S7]:
  - Spawns sand or deep-sand footprint field effects at the *previous* tile, with the animation chosen from facing direction.
  - Bike tracks use a **4×4 transition table** (old direction × new direction) that picks one of 8 straight and curved pieces.
  - The fade holds the sprite visible for **40 frames**, then toggles `invisible ^= 1` every frame until frame 56 (a 1-bit flicker fade). Total is about 57 frames, about 0.95 s.
  - If no sprite slot is free, the footprint is simply not created.
- **Pokémon Platinum** [V, S8]:
  - Uses 10 snow track models (4 foot directions, 6 bike pieces) and 10 matching sand models.
  - Alpha starts at 31 (the DS 5-bit maximum), holds 16 frames, then drops by 2 per frame. Total is about 32 frames.
- **Tikus Tales** emits velocity-aligned footprint quads, with emission driven by the run animation at a rate of about 4 [V, S99].

Ring buffer [I, note 08]: `prints[N]` (N = 64–256) of {x, y, dir, age}; insert at `i = (i+1) & (N-1)`; draw with a dithered fade by age.

*Cost / performance.* O(1) insert and O(N) draw. Memory is about 4–8 B × N [I, note 08]. There is no field to maintain.

*Games that used it.*
- Pokémon Emerald: https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c
- Pokémon Platinum: https://github.com/pret/pokeplatinum/blob/main/src/overlay005/ov5_021F1CC8.c
- Tikus Tales: https://wilkgames.itch.io/tikus-tales/devlog/199972/creating-footprints-in-the-snow

*How it feels.* Crisp and readable, but 0.5–1 s lifetimes feel gamey. They were set by sprite caps, not by feel [I, note 01].

*Risks.*
- No interaction with snow depth: prints on bare ground look wrong unless gated by the depth field.
- Prints do not refill with snowfall.

*Ratings:* Simplicity 5 · Speed 5 · Pixel taste 4 · Aliveness 2 · Interactivity 3

### C2. Conserve-and-displace stamp

*In plain words.* A boot doesn't paint a dark mark. It pushes snow out of the way. Lower the depth under the foot and add what you removed to a ring around it. The print gets a little raised rim, and the total amount of snow stays the same.

*How it works (technical).* Sumner, O'Brien & Hodgins 1998 [V, S69]:
- **Ground.** A height field of columns. Columns under the object are lowered to the contact point.
- **Displacement.** A fraction α of the displaced volume is "compressed away". The rest is distributed **equally to the nearest ring of non-contact columns**, which forms the rim.
- **Erosion.** For slope `s = atan(Δh/d)`: if s > θ_out, material moves downhill until every slope is below θ_stop.
- **Snow parameters.** The paper lists snow with α = 0.0 and all angles 1.57 rad. This column was not double-checked against the PDF [U, S69]. If correct, snow prints keep crisp vertical walls, while sand slumps (θ_out 0.436 rad ≈ 25°) [I].

The Sandbox stamp [V, S123 code]:
```
stamp(x, y, w=2, h=2, keep=0.30, packV=255):
    spill = 0
    for each cell in the w×h box: nd = floor(depth*keep); spill += depth - nd; depth = nd; packed = max(packed, packV)
    per = max(1, spill/6)
    repeat 6: pick a random point on an ellipse of radius max(w,h)/2 + 1.2 (y squashed 0.7)
              if packed there < 200: depth += per; spill -= per
```
Strides are 4 px; the fox stamps 1×1 with keep 0.45; the shovel throws its snow 1–4 px outward.

*Cost / performance.* About 10 writes per step. A hundred walkers at about 10 steps per second each is about 10,000 writes/s, which is trivial [I, estimated].

*Games that used it.*
- Rise of the Tomb Raider: depression *and elevation* (raised rims) as a design goal: https://www.slideshare.net/slideshow/labs-siggraph15trxno-videos/130489149
- Slime Rancher 2: snow pushed down and **raised at the edges**: https://www.gamedeveloper.com/design/slime-rancher-2-snow-particle-effects
- Muraoka & Chiba: footprint depth from kinetic energy and snow density [V-secondary, S65]: https://kaken.nii.ac.jp/en/report/KAKENHI-PROJECT-09680406/096804061999kenkyu_seika_hokoku_gaiyo

*How it feels.* Prints look dug, not drawn. Emboss (E3) lights the rim, sandpile (B7) slumps it, and snowfall (D1) fills it in [I].

*Risks.*
- On bare ground the stamp does nothing visible, which is correct but needs a separate mud or wet print if desired.
- Rims accumulate if many walkers circle one spot, building berms. The Sandbox caps rim deposits where packed > 200 [V, S123].
- The keep fraction is a tuning value with no published game number [V, note 03].

*Ratings:* Simplicity 4 · Speed 5 · Pixel taste 5 · Aliveness 5 · Interactivity 5

### C3. Trail render target with slow refill

*In plain words.* Keep a small texture that remembers where things walked. Draw a soft white blob into it under every foot or wheel. Every so often, fade it a little so trails refill. The ground shader reads it to swap snow for trodden snow.

*How it works (technical).*
- **Batman: Arkham Origins** [V, vendor, S23]:
  - Renders actors white from below with an "ankle-high orthogonal frustum".
  - Blurs (a 4-tap Poisson), adds into a ping-pong heightmap of `Min(512, ¼·surface)` per rooftop.
  - Subtracts a small value per update so snow "replenishes".
  - Updates only 2 surfaces per frame, with the one under Batman first.
  - Under 1 ms GPU on PS3/360, 2 MB.
- **Slime Rancher 2** [V, S29]:
  - One RGBA buffer: R snow, G grass, B water ripples, A extra grass pushdown, with signed values.
  - Captured in front of the player and snapped to texel steps to avoid jitter.
  - **One draw call per interaction type** for hundreds of slimes [vendor].
- **Kodeco UE4**: capture snaps to whole texels, `(floor(P/px)+0.5)*px` [V, S33].
- **God of War (2018)**: a 384² paint target into 1024² heights [V, RE, S26].

Godot routes:
- **Before 4.7: a SubViewport.** The "Car Tracks" shader renders trail particles on a hidden layer and samples `.r` [V, S34]. One user could not get a SubViewport to keep past frames in Godot 4.4 [V, S83].
- **Godot 4.7: `DrawableTexture2D`** [V, S77–S79]:
  - `blit_rect` stamps with BlitMaterial blend modes, including ADD and SUB;
  - `blit_rect_multi` writes up to 4 outputs;
  - `modulate = Color(0,0,1,0)` writes only the blue channel, so several fields can share one RGBA8 texture.

  Whether a `texture_blit` shader can sample its own target is **not verified** [U, note 05]. Plan a ping-pong pair.

*Cost / performance.* One small texture plus one draw per stamp. At 320×180 with a margin, a 448×308 trail map is "smaller than Batman's 512²" [I, note 02]. Refill via a full-rect SUB blit every N frames. In RGBA8 the smallest step is 1/255, and subtracting 1/255 every 0.5 s refills a full-depth print in about 128 s [I, note 02].

*Games that used it.*
- Batman: Arkham Origins: https://www.slideshare.net/colinbb/gdc2014-deformable-snow-rendering-in-batman-arkham-origins
- Slime Rancher 2: https://www.gamedeveloper.com/design/slime-rancher-2-snow-particle-effects
- Company of Heroes 2 (additive track map reveals mud): https://www.slideshare.net/slideshow/daniel-barrero-coh2renderingtech/26765990
- Horizon Zero Dawn: The Frozen Wilds (trails reveal grass): https://www.gamebanshee.com/k4ah6
- Godot "Car Tracks" demo: https://godotshaders.com/shader/car-tracks-on-snow-or-sand-using-viewport-textures-and-particles/

*How it feels.* Like C2 but without rims, unless faked with `blur(trail) − trail > ε` [I, note 02]. AAA-proven, and a good fit for local-only cosmetics.

*Risks.*
- Gameplay cannot cheaply read GPU data. Sample a few pixels, or keep a CPU mirror per tile [I].
- 8-bit refill steps are coarse.
- On Compatibility there is **no 2D HDR viewport** [V, S81]. Note 02's suggestion to use `use_hdr_2d` for float precision therefore does not apply on web.

*Ratings:* Simplicity 3 · Speed 5 · Pixel taste 4 · Aliveness 4 · Interactivity 4

### C4. Sinking and slowdown

*In plain words.* Deep snow swallows your boots and slows you down. Hide the bottom few pixels of the sprite, draw a snow rim at the cut line, and scale speed by depth.

*How it works (technical).*
- **Pokémon Gen IV** has four tiers [V, S9]:
  1. minimal: no effect;
  2. moderate: no running;
  3. heavy: no running, walk speed ×½;
  4. maximum: no running, walk speed ×¼.

  Bikes are banned on snow at every depth. In X/Y Route 17, snow can be crossed only on Mamoswine.
- **RimWorld** moves pawns at 100 / 76 / 62 / 52 % across its depth bands. Gentle snowfall slows nothing; hard snow slows to 80 % [V, S10].
- **Tibia**: snow speed 160 against ice 100 [V, S12].

The Sandbox [V, S123 code]:
```
d    = mean depth of 3 cells under feet
slow = 1 - min(0.55, d/170)                 // speed never drops below 45 %
sink = min(4, floor(d/22))                  // hide 0..4 bottom rows of the sprite
draw snow rim (7 px) over the cut line; fox sinks min(2, d/30)
```
Our proposal [I, notes 01/06]: quantise depth into about 4 gameplay bands, with speed multipliers of roughly 1.0 / 0.75 / 0.5 / 0.25–0.5 and sinks of 0 / 2 / 4 / 6 px.

*Cost / performance.* One or three reads per character per frame.

*Games that used it.*
- Pokémon D/P/Pt: https://bulbapedia.bulbagarden.net/wiki/Snow_tile ; https://bulbapedia.bulbagarden.net/wiki/Sinnoh_Route_216
- RimWorld: https://rimworldwiki.com/wiki/Snow_(thick)
- Tibia: https://tibia.fandom.com/wiki/Tiles
- The Long Dark: https://thelongdark.fandom.com/wiki/Weather

*How it feels.* Weight. Sinking is the cheapest way to show depth from above [I].

*Risks.*
- In an MMO, slowdown is a gameplay stat. It must come from **server-side** coarse tile depth, not the client's cosmetic field [I].
- Too much slowdown is frustrating. Days Gone was criticised for the opposite: snow *not* affecting motorcycle handling [V, S122].
- How Pokémon draws sprite sinking is not described on Bulbapedia [V, note 06 gap].

*Ratings:* Simplicity 5 · Speed 5 · Pixel taste 4 · Aliveness 4 · Interactivity 5

### C5. Kicked-up puffs and snow on characters

*In plain words.* Deep steps throw up a few white specks. Characters who stay out in the snow get white shoulders and hats, which melt off indoors.

*How it works (technical).*
- **Slime Rancher 2.** Impacts spawn snow particles and add a temporary snow layer to the immersed part of the slime [V, S29].
- **1080 Avalanche.** Snow cakes on clothing [V, S122].
- **Project Zomboid "Immersive Snow" mod.** Snow on characters melts indoors or near heat, players can shake it off, and it wets clothing [V, S119].
- **Stomakhin's MPM** shows cues worth faking: packing, chunk fracture, a plough spray "tube" [V, S68]. Cheap fakes: 1-px powder puffs, 2–3 px packed chunks that land and add depth [I, note 04].

The Sandbox [V, S123 code]:
- When depth > 18, each step emits 3 "puff" particles with a z-velocity of 14–26 and gravity 60.
- `player.snowy` grows at 0.06·intensity/s while it snows and falls at 0.05/s otherwise. Above 0.4, a 3-px white cap is drawn on the head.
- Breath puffs appear every 1.4–2.0 s when temperature < 1 °C, drawn as a dithered fade.

*Cost / performance.* A handful of particles per step. Godot's CPUParticles2D may be safer than GPUParticles2D on web [I, note 02]. Particle trails are unavailable on Compatibility [V, S81].

*Games that used it.*
- Slime Rancher 2: https://www.gamedeveloper.com/design/slime-rancher-2-snow-particle-effects
- Horizon Frozen Wilds: https://www.gamebanshee.com/k4ah6
- Project Zomboid mod: https://top-mods.com/mods/project-zomboid/gameplay/16435-immersive-snow.html

*How it feels.* Slime Rancher 2's slimes did not change AI, yet with snow interaction they "felt like they were frolicking" [V, S29]. Small cues on bodies make the *character* feel cold, not just the map [I].

*Risks.*
- Particle spam. SR2 tuned weather density "to prevent visual chaos" [V, S30].
- Snow caps must clear when entering buildings, or they break continuity.
- In MMO crowds, cap puffs per screen [I].

*Ratings:* Simplicity 5 · Speed 5 · Pixel taste 5 · Aliveness 5 · Interactivity 3

### C6. Shared trampling and worn paths

*In plain words.* Where many people walk, a path forms. Where nobody walks for a while, snow fills it back in. In an MMO, the town's snowy streets draw themselves.

*How it works (technical).*
- **Junker & Palamas (2020)**: a compute shader deforms snow under agents, with accumulation over time and wind. Agents trained with reinforcement learning produce "human-like trail patterns". **>30 fps with up to 100 agents** [V, S70].
- **Animal Crossing: City Folk / New Leaf**: walking wears paths into grass ("animal trails"), running wears it most, grass is **most vulnerable in winter**, and it regrows over time. This is absent in New Horizons [V, S120].
- **Project Zomboid "Immersive Snow"**: "repeated traffic forms trodden paths" that fade or get covered by heavy snowfall [V, S119].

Per-tile model [I]:
```
on_step(tile): wear[tile] = min(255, wear[tile] + k)
tick (1 Hz):   wear[tile] -= regrow * snowfall_intensity   // snow refills paths
render: packed palette where wear > t1; bare/slush where wear > t2
```

*Cost / performance.* One byte per tile and one increment per step. The 1 Hz sweep is O(tiles), or lazy with timestamps. Server-friendly [I].

*Games that used it.*
- Animal Crossing (grass wear): https://animalcrossing.fandom.com/wiki/Animal_Tracks
- Project Zomboid mod: https://top-mods.com/mods/project-zomboid/gameplay/16435-immersive-snow.html
- Company of Heroes 2: https://shacknews.com/article/74964/company-of-heroes-2-chills-out-with-coldtech
- Pokémon Emerald's Route 113 ash: walking permanently swaps ash-covered grass for clean grass until the map reloads: https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c

*How it feels.* Emergent social history: a trodden path from inn to smithy shows where people go. For a Tibia-like MMO, few signals say "alive" so cheaply [I].

*Risks.*
- Must be authoritative and identical for all players if it affects speed. Otherwise make it purely visual and accept divergence [I].
- Popular routes can become permanently bare. Clamp wear and tie regrowth to snowfall.

*Ratings:* Simplicity 4 · Speed 5 · Pixel taste 4 · Aliveness 5 · Interactivity 4

---

### Family D: Time

### D1. Deposition rate driven by intensity

*In plain words.* One "how hard is it snowing" number (0 to 1) drives both how many flakes you see and how fast the ground fills. Snow builds up gradually, open ground first.

*How it works (technical).*
- **Don't Starve Together**: a single `precipitation` 0.0–1.0 "snow intensity" drives the weather [V, S117].
- **Pokémon Emerald** ramps visible flakes one per 36 frames [V, S4].
- **Cordonnier et al.**: storms about once a week lasting about 3 days, with depth proportional to elevation above the rain-snow line [V, S71].
- **The Long Dark**: weather evolves over 2–12 hours [V, S98].
- **Slime Rancher 2** uses "dynamic changes over time" rather than hard switches [V, S30].

The stochastic deposit [V, S123 code; also note 03]:
```
picks = floor(900 * intensity)              // per sim step
repeat picks: i = random cell; if rand() < exposure[i]: deposit(i, 1)
deposit(i, a): if wet[i] > 90 and rand() < 0.6: wet[i] -= 3; return   // snow melts into wet ground
               depth[i] = min(cap, depth[i] + a); packed[i] = max(0, packed[i] - 14)
intensity += (target - intensity) * min(1, dt*0.5*max(1, speed/2))      // eases, never snaps
```
Each pick lands in a random place, so the field thickens as a speckle, much like OpenTTD's LFSR order [I].

*Cost / performance.* O(picks), independent of field size. This is the budget knob: fewer picks just means slower weather [I, note 03].

*Games that used it.*
- Don't Starve Together: https://vietnd69.github.io/dst-api-webdocs/docs/api-vanilla/core/worldstate
- Pokémon Emerald: https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
- The Long Dark: https://thelongdark.fandom.com/wiki/Weather

*How it feels.* Anticipation, then build-up, with exposed ground first [I].

*Risks.*
- **Frame-rate dependence.** The Sandbox runs N sim steps per rendered frame, so a 30 fps device accumulates half as fast. Use a fixed timestep in production [I].
- Deposition that is too uniform hides the exposure map. Keep shelter strong.

*Ratings:* Simplicity 5 · Speed 5 · Pixel taste 4 · Aliveness 5 · Interactivity 2

### D2. Melt models: degree-day, RimWorld formula, Cordonnier numbers

*In plain words.* Above freezing, snow melts at a rate proportional to how warm it is. Pick a rate per degree and you are done. Sun and shade adjust it (D3).

*How it works (technical).*
- **Degree-day model** [K, Hock 2003, S53, S72]: `W = fm·(Td − T0)` if Td > T0, else 0. Such models need "as few as 1 or 2 parameters" and improve when radiation terms are added.
- **Snow DDF.**
  - Typically 2–6 mm/°C/day, with a reported range of 0.5–20, higher with more shortwave radiation (Hock 2003) [V, S51].
  - Ice melts more per degree-day than snow, with an arctic range of 1–10 mm w.e. [V, S52].
- **RimWorld** [V, S10]: 0 at or below 0 °C; **0.058 %·T² per tick for 0–10 °C**; **0.58 %·T per tick at 10 °C and above**. The two agree at T = 10. Our notes do not say how long a wiki "tick" is in real or game time [U].
- **Cordonnier 2018**: **kmelt = 0.01 m/day/°C** (10 mm, above the typical snow range), with temperature from elevation and a sun term [V, S71].
- **Sandbox** [V, S123 code]:
  ```
  if temp > 0:
      picks = floor(1500 * min(temp, 6)/4 * (0.35 + 0.65*sun))
      repeat picks: i = random cell with depth > 0
          rate = (inCastShadow && sun > 0.4 ? 0.25 : 1) * (packed > 100 ? 0.5 : 1)
          rate *= {roof/rock-top: 1.4, canopy: 2.2, ice: 1.3, else: 1}
          c = count of 4-neighbours with depth < 3
          rate *= 0.35 + 0.5*c
          if rand() < rate: depth--, wet += 5 (ground), if depth == 0: packed = 0
  ```
  Temperature targets are −3.5 °C while snowing, −1 °C overcast, and `−2 + 8·daylight` when sunny, so the peak is +6 °C at noon.

*Cost / performance.* O(picks). Stochastic decrements handle 8-bit precision and give organic, ragged edges, the same mechanism as DOOM fire's random decay [I, S1].

*Games that used it.*
- RimWorld: https://rimworldwiki.com/wiki/Snow
- Don't Starve: melts on season change or when it rains in winter: https://dontstarve.wiki.gg/wiki/Winter
- Dwarf Fortress: magma melts snow: https://dwarffortresswiki.org/index.php/Snow
- No game on TheGamer's best-snow list was praised for melting: https://www.thegamer.com/most-impressive-snow-physics-mechanics-in-games/

*How it feels.* The world recovers after a storm [I]. Realistic DDFs are far too slow for play (§6c); exaggerate them.

*Risks.*
- Linear melt with uniform noise looks like a dissolve filter. It needs D3's spatial terms.
- The RimWorld tick length is unknown to us.

*Ratings:* Simplicity 5 · Speed 5 · Pixel taste 4 · Aliveness 4 · Interactivity 2

### D3. Edge-first and shade-last melt

*In plain words.* Real snow disappears first at the edges of patches and in the sun, and lingers in shadows and on the north side of walls. Two multipliers do it: count bare neighbours, and check a shadow map.

*How it works (technical).*
- **Foldes & Beneš (2007)**: direct sun occlusion **averaged over a full day's trajectory** decides where snow melts; ambient occlusion decides where it can accumulate [V-secondary, S61].
- **The HESS review**: melt factor varies with slope, aspect and sky-view angle [V, S51].
- **Hock 2003**: temperature-index models are weak with spatial shading, which is the reason to multiply by a sun map [V, S53].

The Sandbox sun-shadow bake, with the sun at upper-left [V, S123 code]:
```
for each object pixel (x, y) with height h and footprint row O:
    for k in 0..min(O - y, h):
        sx = round(x + 0.7*k); sy = round(O + 1 + 0.28*k)
        if ground-class and not under an object: shadow[sx, sy] = 1
```
- Melt runs at 0.25× in cast shadow when the sun factor is above 0.4.
- With no bare 4-neighbours, the melt multiplier is 0.35. One bare neighbour gives 0.85, and two or more saturate at 1.0, so edge cells melt about 2.4–2.9× faster than interior cells (see §6c) [I, derived from code].

A precomputed per-tile `sun_hours` map, summed over about 5 sun positions, is the cheaper form for a tile game [I, note 04].

*Cost / performance.* One bake (a forward shadow projection) plus 4 neighbour reads per melt pick.

*Games that used it.*
- No 2D game source was found for "melt in shade last". It is a real-world observation [V, note 06 gap].
- Project Zomboid mod (fires and engines as heat melt seeds): https://top-mods.com/mods/project-zomboid/gameplay/16435-immersive-snow.html
- Frostpunk heat zones (gameplay): https://frostpunk.fandom.com/wiki/Heat_level

*How it feels.* The most "true" moment: white strips survive in the house's shadow and patches shrink from the outside in [I].

*Risks.*
- Static shadow bakes ignore the sun's movement. Sum several positions, or re-bake per period.
- Heat sources need their own melt seeds: a distance-to-heat term [I, note 09].

*Ratings:* Simplicity 4 · Speed 5 · Pixel taste 5 · Aliveness 5 · Interactivity 2

### D4. Wet ground, evaporation, slush, ice and refreezing

*In plain words.* Melted snow doesn't vanish. It darkens the ground, sits as slush, and either dries in the sun or freezes overnight into slippery ice.

*How it works (technical).*
- **Company of Heroes 2 ice**: a cell map with "health", neighbour-driven breaking and refreezing, and a shader blend **Solid → Broken → Slush → Water** by health [V, S27].
- **Maréchal et al.**: melting snow wets the soil and changes its thermal properties [V-secondary, S59].
- **Dwarf Fortress**: water ≥4/7 deep freezes into ice walls, and shallower water freezes into floors [V, S11].
- **The Sandbox's wet channel** [V, S123 code]:
  - melt adds +5 per unit;
  - wet > 50 switches the ground to its "wet" palette variant;
  - snow falling on wet > 90 has a 60 % chance to consume 3 wet instead of depositing;
  - evaporation runs `1600·(0.3 + sun)` picks per step above 0 °C (300 below), each taking 2 from wet bare cells.

A state machine [I, notes 02/03/04]:
```
POWDER --step--> PACKED --melt--> SLUSH --melt--> WET_GROUND --dry/sun--> GROUND
                                   |                  |
                                   +--- T<0 night ---> ICE --- T>0 sun ---> SLUSH
```
Ice speed is relevant: Tibia ice is 100, faster than snow at 160 [V, S12].

*Cost / performance.* One extra byte per cell plus O(picks) evaporation. Refreezing is a cheap neighbour rule, the DOOM-fire analogue [I, note 02].

*Games that used it.*
- Company of Heroes 2: https://www.slideshare.net/slideshow/daniel-barrero-coh2renderingtech/26765990
- Project Zomboid mod (fires melt nearby snow into wet patches): https://top-mods.com/mods/project-zomboid/gameplay/16435-immersive-snow.html
- Zelda Oracle of Seasons (frozen water as walkable winter state): https://www.zeldadungeon.net/wiki/Winter

*How it feels.* Thaw days look messy and real. Near-freezing steps sound "crunchy, wet and heavy" [V, S100].

*Risks.*
- The state count grows fast. Keep it to about 5 states.
- Refreeze rules can lock players onto ice tiles. Treat it as a gameplay decision.
- The slush and refreeze numbers have no game reference [V, note 03 gap].

*Ratings:* Simplicity 3 · Speed 5 · Pixel taste 4 · Aliveness 5 · Interactivity 3

---

### Family E: Rendering and taste

### E1. Palette ramp: warm light, cold shadow

*In plain words.* Snow is not white. Lit snow is slightly warm, shadowed snow is blue-violet and less saturated, and pure white is saved for sparkles.

*How it works (technical).*
- **saint11 (Pedro Medeiros)** [V, S95]:
  - "Red hues are hot and blue hues are cold."
  - Grey "is usually perceived as slightly cold."
  - He prefers "opposing shadow and light temperatures". In his hue-shift example shadows become bluer and less saturated, and lights become yellower and more saturated.
- **Lospec "winter" palettes** range from 4 colours (Snowflake 4, Ski resort gb) through Winter Wonderland (8 colours, 7,195 downloads) to Wintercode (36) [V, S96].
- **A Short Hike** built its palette from photos of the Canadian Shield, with no anti-aliasing and "as few pixels as possible" [V, S97].

The Sandbox snow ramp, from its code [V, S123]:

| Role | Colour |
|---|---|
| highlight | `#f6f9ff` |
| base | `#e2eaf6` |
| mid | `#c4d1ea` |
| shadow | `#9eaedb` |
| deep | `#7c86c2` |
| packed | `#c9cfe2` / `#a6aecf` |
| sparkle | `#ffffff` |

Every base colour gets a blue-shifted shadow variant computed as `(r·0.72, g·0.77, b·0.9 + 12)`.

*Cost / performance.* Free.

*Games that used it.*
- A Short Hike: https://en.wikipedia.org/wiki/A_Short_Hike
- Octopath Traveler (snow that "glistens and glitters"): https://www.thegamer.com/most-impressive-snow-physics-mechanics-in-games/
- Celeste (saint11's own game; snowy mountain): https://celestegame.fandom.com/wiki/Wind

*How it feels.* Cold and cosy. Snow flattens contrast, so characters need darker outlines or more saturation [I, note 06].

*Risks.*
- A uniform pure-white carpet is anti-pattern #1 [I/V, note 06].
- Too many ramp steps break the limited-palette look. Use 4–5.

*Ratings:* Simplicity 5 · Speed 5 · Pixel taste 5 · Aliveness 3 · Interactivity 1

### E2. Bayer (ordered) dithering

*In plain words.* To show "half snow" with only two colours, use a fixed checker-like pattern that turns more pixels white as the value rises. That pattern is the Bayer matrix.

*How it works (technical).* Ordered dithering compares each pixel with a threshold map normalised as `M/n²` [K, S49]. The standard 4×4 matrix is `0 8 2 10 / 12 4 14 6 / 3 11 1 9 / 15 7 13 5`. It is quoted from memory in our notes, but it is standard public math [K, S49; U for the exact listing]. It gives 17 apparent levels from 2 palette colours [I, note 07].
```glsl
float b = BAYER4[(x & 3) + 4*(y & 3)] / 16.0 + 0.5/16.0;
int shade = int(floor(d*4.0 + (b - 0.5)));    // dithered quantisation into a 5-step ramp
```
In the Sandbox, Bayer is used three ways [V, S123 code]:
1. Folded into the coverage threshold (B4).
2. As the lamp-pool selector (E4).
3. As the fade for smoke and breath particles.

*Cost / performance.* One lookup and one compare per pixel.

*Games that used it.*
- Ordered dithering is a general retro technique. Our notes did not tie a specific snow game to it [V, note 07 gap].
- N0cturneDev's Bayer shader (CC-BY-4.0) is a small reference: https://github.com/N0cturneDev/Bayer-Dithering-Shader

*How it feels.* Crisp and retro. Partial coverage stays inside the palette, where alpha blending would break it [I, note 03].

*Risks.*
- Noisy dithering on big fields reads as dirt [I, note 06]. Limit it to transitions.
- The regular grid can show as a "screen door". Mix in hash noise, as the Sandbox does.

*Ratings:* Simplicity 5 · Speed 5 · Pixel taste 5 · Aliveness 2 · Interactivity 1

### E3. Emboss shading from neighbour differences

*In plain words.* Compare each pixel's depth with its neighbours. Where snow rises toward the light, brighten; where it drops away, add blue shadow. Drifts, rims and prints suddenly have volume.

*How it works (technical).*
- **Two-tap form** [I, note 03]: `slope = d(x, y) − d(x+1, y+1)`, with shadow-blue where it exceeds +k and highlight where it is below −k.
- **Sandbox four-tap form** [V, S123 code]:
  ```
  sl = (d[x+1] - d[x-1]) + (d[y+1] - d[y-1])        // neighbours of other surfaces count as equal
  packed > 110: sl < -5 ? PACKED_SHADOW : PACKED
  d < thr + 4:  BASE                                  // thin snow stays flat
  else: sl > 6 ? HI : sl >= -6 ? BASE : sl >= -13 ? MID : sl >= -22 ? SHADOW : DEEP
  ```

*Cost / performance.* 2–4 extra reads per snow pixel at render time.

*Games that used it.*
- No 2D game was found documenting it.
- The 3D analogues are RotTR's raised trail edges (https://www.slideshare.net/slideshow/labs-siggraph15trxno-videos/130489149) and Slime Rancher 2's "raised at the edges" (https://www.gamedeveloper.com/design/slime-rancher-2-snow-particle-effects).

*How it feels.* This turns a 2D mask into a landscape. Footprint rims and lee drifts read in 3D from straight above [I].

*Risks.*
- The fixed light direction must match the cast-shadow direction (D3) and the art's lighting, or it looks wrong.
- Thresholds depend on the depth scale. Retune them if you change units.

*Ratings:* Simplicity 5 · Speed 5 · Pixel taste 5 · Aliveness 4 · Interactivity 2

### E4. Palette-based day/night lighting and dithered lamp pools

*In plain words.* Don't recolour 57,600 pixels for night. Recolour the roughly 230 palette entries once per frame. For lamps, keep a second "warm" palette and choose it per pixel through a dither pattern that thins out with distance.

*How it works (technical).*
- **DOOM fire** is a palette-index buffer [V, S1]. Colour cycling works because swapping a palette is cheaper than swapping frames [V, S115].
- **The Sandbox palette** has 58 base colours × 4 variants (base, shadow, wet, wet+shadow), giving 232 entries. Each frame [V, S123 code]:
  ```
  daylight = clamp(1.6*sin((h-6)/12*pi), 0, 1)
  tint = (0.34+0.66*dl+0.16*warm, 0.40+0.60*dl+0.02*warm, 0.66+0.34*dl-0.08*warm)   // warm at dawn/dusk
  overcast/snow: desaturate by up to 14 % R, 11 % G, 5 % B
  windows & lamp bulb: lerp toward warm (255,196,96)/(255,214,130) as night falls
  palLamp[i] = pal[i] shifted toward (r*.98+14, g*.82+4, b*.58)   // warm variant
  per pixel: lampOn && lampMask*night*22 > BAYER(x,y) ? palLamp[idx] : pal[idx]
  ```
- **Pixel-art guidance**: snow under warm light should shift orange ("cozy") and snow in shade should shift blue-violet [I, note 06]. A GodotCon 2026 talk covers weather states and palette swaps for atmosphere [V, abstract only, S94].

*Cost / performance.* About 232 × 3 multiplies per frame for the palette, plus 1 compare per pixel for the lamp.

*Games that used it.*
- DOOM PSX fire (palette buffer): https://fabiensanglard.net/doom_fire_psx/

*How it feels.* A warm lamp pool dithered onto blue snow is the image people remember [I].

*Risks.*
- Palette lighting cannot do colour bleeding or soft shadows.
- Every sprite must use the shared palette, or it falls outside the lighting.
- Too many lamp variants multiply palette size. One warm variant is enough [I].

*Ratings:* Simplicity 4 · Speed 5 · Pixel taste 5 · Aliveness 5 · Interactivity 2

### E5. Sparkle via palette cycling or hashing

*In plain words.* On sunny snow, a few random pixels flash pure white for a frame. It is cheap, and it makes the surface feel crisp and alive.

*How it works (technical).*
- **Palette version** [I, note 08]: scatter 3–4 reserved highlight indices on about 1–2 % of snow pixels and rotate their colours (white, near-white, base, base) every few frames, at zero per-pixel CPU cost.
- **Hash version (the Sandbox)** [V, S123 code]: `slot = (frame >> 3) * 2654435761`; a pixel sparkles when `(imul(i ^ slot, 2246822519) >>> 23) == 0`, a probability of 1/512. This applies only in sunny daylight > 0.3, and only on flat or light-facing snow (`sl >= 0`). The pattern changes every 8 frames.

*Cost / performance.* One hash per snow pixel, or zero with palette cycling.

*Games that used it.*
- Octopath Traveler (glistening snow): https://www.thegamer.com/most-impressive-snow-physics-mechanics-in-games/
- Final Fantasy VI's opening flurries (same article, called the best snow of the 16-bit era).

*How it feels.* Glints read as cold, dry, sunny snow; their absence at night and in shade tells time [I].

*Risks.*
- Too dense and it looks like noise or a broken texture.
- Flicker sensitivity: keep sparkles sparse and frame-held [I].

*Ratings:* Simplicity 5 · Speed 5 · Pixel taste 5 · Aliveness 4 · Interactivity 1

---

## 5. Comparison scorecard

All ratings are author judgement for top-down pixel art on web Godot. "Sum" is a crude total; it is not a recommendation by itself.

| # | Technique | Simpl. | Speed | Pixel taste | Aliveness | Interact. | Sum | Cost class |
|---|---|---|---|---|---|---|---|---|
| A1 | Sprite flake list + sine LUT | 5 | 5 | 4 | 2 | 1 | 17 | O(flakes), tiny CPU |
| A2 | Palette-cycled flakes | 3 | 5 | 5 | 3 | 1 | 17 | Free (palette rotate) |
| A3 | Hashed-cell shader layers | 4 | 5 | 3 | 3 | 1 | 16 | Per-pixel shader, O(layers) |
| A4 | Z-height flakes + shadow dot | 4 | 4 | 5 | 5 | 2 | 20 | O(flakes), tiny CPU |
| B1 | Tile-state swaps / seasonal tilesets | 5 | 5 | 4 | 1 | 1 | 16 | Free (event) |
| B2 | OpenTTD levels + LFSR order | 5 | 5 | 3 | 4 | 3 | 20 | O(tiles/256) per tick |
| B3 | Per-pixel depth heightmap | 4 | 4 | 4 | 5 | 5 | 22 | CPU field (stochastic / dirty chunks) |
| B4 | Threshold-dither coverage | 5 | 5 | 5 | 3 | 1 | 19 | Per-pixel shader, 1 compare |
| B5 | Exposure / sky-occlusion mask | 4 | 5 | 4 | 4 | 2 | 19 | Bake once |
| B6 | Wind lee and drift rays | 3 | 5 | 4 | 5 | 2 | 19 | Bake per wind bucket |
| B7 | Sandpile / talus smoothing | 5 | 4 | 4 | 4 | 3 | 20 | Stochastic CPU, O(visits) |
| B8 | Snow caps on object tops | 4 | 5 | 5 | 3 | 1 | 18 | Per-pixel shader or authored mask |
| C1 | Footprint decal ring buffer | 5 | 5 | 4 | 2 | 3 | 19 | O(prints) |
| C2 | Conserve-and-displace stamp | 4 | 5 | 5 | 5 | 5 | 24 | O(steps) |
| C3 | Trail render target + refill | 3 | 5 | 4 | 4 | 4 | 20 | Render target, 1 draw/stamp |
| C4 | Sinking and slowdown | 5 | 5 | 4 | 4 | 5 | 23 | O(characters) |
| C5 | Puffs, snow on characters | 5 | 5 | 5 | 5 | 3 | 23 | O(particles) |
| C6 | Shared trampling / worn paths | 4 | 5 | 4 | 5 | 4 | 22 | 1 B/tile, 1 Hz sweep |
| D1 | Intensity-driven deposition | 5 | 5 | 4 | 5 | 2 | 21 | O(picks) |
| D2 | Melt models (degree-day etc.) | 5 | 5 | 4 | 4 | 2 | 20 | O(picks) |
| D3 | Edge-first, shade-last melt | 4 | 5 | 5 | 5 | 2 | 21 | Bake + O(picks) |
| D4 | Wet / slush / ice / refreeze | 3 | 5 | 4 | 5 | 3 | 20 | +1 B/cell, O(picks) |
| E1 | Warm-light / cold-shadow ramp | 5 | 5 | 5 | 3 | 1 | 19 | Free |
| E2 | Bayer dithering | 5 | 5 | 5 | 2 | 1 | 18 | Per-pixel, 1 lookup |
| E3 | Emboss from neighbours | 5 | 5 | 5 | 4 | 2 | 21 | Per-pixel, 2–4 reads |
| E4 | Palette day/night + dithered lamps | 4 | 5 | 5 | 5 | 2 | 21 | Free (palette) + 1 compare/px |
| E5 | Sparkle (palette or hash) | 5 | 5 | 5 | 4 | 1 | 20 | Free / 1 hash per px |

**Reading the table [I].**
- The highest sums cluster around the **depth field and what touches it**: C2, C4, C5, B3 and C6.
- The cheapest high-taste wins are rendering tricks: E1, E3, E4 and B4.
- Among falling techniques only A4 scores high on aliveness, thanks to its top-down shadow dot.

---

## 6. Deep dives

### 6a. Characters and snow

**Steps.** Classic prints are short-lived objects: about 57 frames in Emerald [V, S6], about 32 in Platinum [V, S8], and 10 s tiles on a community Tibia server [U, S13]. Modern references treat prints as **information**:
- The Long Dark: snowfall and blizzards "reduce duration of tracks" [V, S98];
- CoH2: snow is a "record of everything that's passed by" until it melts or fresh snow covers it [V, S28];
- RDR2: animal tracks identifiable from prints [V, S122].

Our recommendation is C2: prints *move* snow inside the depth field, and D1's refill erases them [I]. The Sandbox implements the refill erasure literally: every deposit lowers the cell's `packed` value by 14, so old trails go from "packed grey" back to fresh white as snow falls on them [V, S123].

**Depth.** Map depth to 3–4 bands (Pokémon, RimWorld) [V, S9, S10], read speed from the band, hide 0–4 sprite rows and draw a snow rim over the cut [I; Sandbox: one row per 22 u, speed ≥ 45 %, S123].

**Trails as storytelling [I, from S29, S98, S119, S121, S122].** Cheap stories with no extra system:
- A fox crossing the map every 12–30 s leaves a line of 1-px prints. This is the Sandbox's ambient fox [V, S123].
- A villager's daily route wears a path (C6).
- A wolf track leads to a den.
- A cart's ruts lead to the market.


**MMO with many walkers [I].** Cost is not the issue: a stamp is about 10 byte writes, and Junker & Palamas ran 100 agents above 30 fps [V, S70]. The issues are:
1. **Determinism.** Two clients will never agree on a per-pixel field driven by local RNG and frame timing. Treat footprints and per-pixel snow as **cosmetic and local**.
2. **Authority.** Anything that changes speed should come from a coarse server value per tile (B2/C6 style), which is cheap to sync because it changes slowly.
3. **Budget.** Like Batman's "two surfaces per frame" [V, S23], stamp only for characters on screen, and drop stamps beyond N per frame.
4. **Crowds.** In towns, swap per-step stamps for C6's wear counter, so a busy plaza becomes a packed path rather than a storm of rims.

### 6b. Uneven coverage: exposed versus sheltered

Coverage that differs from place to place is what separates "weather" from "a filter". The pieces:

1. **Sky cover.** Roof footprints, canopies and eaves are multiplied into exposure.
   - In the Sandbox, the ring under each pine scales exposure by `0.12 + 0.88·r²`, so the trunk area gets about 12 % of open-ground snow.
   - A 6-row strip under the house eaves ramps from 15 % to 100 % [V, S123].
   - The same move appears in RimWorld (unroofed only) [V, S10] and in CoH2's "snow shadow" map [V, S27].
2. **Wind lee.** A short upwind ray march folds Werner's shadow zone and Beneš & Roa's ramp into the same byte [V, S46, S47; I].
3. **Drifts.** A band just beyond the lee gets extra (×1.12 in the Sandbox) [V, S123].
   - Wind creep then moves loose snow one cell downwind at a time, only from exposed cells (E ≥ 0.75) holding at least 4 units. It stops against walls, because the receiving cell must not be more than 2 units higher [V, S123].
   - Beneš & Roa's "nearest outside border" rule is the source idea [V, S47].
4. **Objects.** Roofs, rock tops, fence rails and canopy tiers are separate depth surfaces (B8).
   - Canopies are capped at 14 units and melt 2.2× faster, so trees shed snow first in sun [V, S123].
   - Horizon's "snow falling off trees" is the 3D precedent [V, S122].

A Sandbox caveat [I, from code]: picks are accepted with probability `min(1, E)`, so exposure above 1 (the drift band) **does not deposit faster**. Production code should deposit `floor(E) + (rand < frac(E))` units.

### 6c. Time: snowing, sunny, day and night, with a worked example

**Weather beats** (transition, never switch [V, S30]) [I, note 06]: anticipation (30–60 s of cooler light, wind audio, a few big flakes) → build-up (exposed first) → the quiet (cut wind, low-pass ambience) → sunny melt (edges and sun first, shade last, wet then slush) → night refreeze. Sound matters: wet snow "sucks" all the sounds [V, S100].

**Worked example A: the Sandbox's actual rates on a 320×180 field (57,600 cells).** The figures are derived from the code [S123] at the default 2× speed. The Sandbox runs 2 sim steps per rendered frame, so 120 steps/s at 60 fps. "u" means depth units; all values are [I].

| Process | Per-step rule | Per exposed cell | At 120 steps/s |
|---|---|---|---|
| Heavy snowfall | 900 picks × P(accept)=min(1,E) | 900/57,600 = 0.0156 u | **1.9 u/s** open ground; 0.28 u/s directly in a wall's lee (E×0.15); 0.23 u/s at a pine trunk (×0.12) |
| Light snowfall (intensity → 0.35) | 315 picks | 0.0055 u | 0.66 u/s |
| Flake landings | ~120 landings/s × 2 u (far ~48, mid ~47, near ~25; mean fall speed is 0.85 × layer speed from 60–70 px) | — | ≤ 240 u/s field-wide vs 108,000 u/s from picks: **≈ 0.2 % of deposition** |
| Melt, sunny noon (+6 °C) | 1,500·6/4·1.0 = 2,250 picks | 0.039 × rate | interior 1.6 u/s; edge with 1 bare neighbour 4.0 u/s; edge with ≥2 bare neighbours 4.7 u/s; interior in cast shadow 0.41 u/s; packed interior 0.8 u/s |
| Evaporation, sunny noon | 2,080 picks × 2 u | 0.072 u | 8.7 u/s of wetness off bare ground |

What a player sees, at heavy snow and 2× speed:
- **Grass whitening.** The grass threshold runs 0.5–11.25 u, plus 5 on tufts, so open grass goes from dusting to white in about 3–6 s, and tufts vanish at about 9 s.
- **Sinking.** Characters sink 1 px at 22 u (about 12 s) and 4 px at 88 u (about 47 s), where they move at about 48 % speed.
- **Sun versus shade.** In sun, an 88-u drift interior disappears in about 54 s; in a cast shadow it lasts about 3.6 min (≈ 4×). Edges go 2.4–2.9× faster than interiors, so patches shrink from the outside.
- **Day length.** The game clock runs 2 game-minutes per real second per speed unit, so at 2× a full day takes 6 real minutes.
- **Weather cycle.** The auto cycle (heavy 110 → light 60 → overcast 40 → sunny 220 → overcast 30 game-minutes) loops every 460 game-minutes, about 115 s at 2×.

These are toy speeds for a watchable demo. For production, note that rates depend on frame rate (use a fixed timestep) and that flakes contribute almost nothing to accumulation [I].

**Worked example B: a degree-day design for Asterion.** Assumptions [I]:
- 1 u = 2 mm snow-water equivalent (a proposal from note 03).
- DDF = 4 mm/°C/day, in the typical 2–6 range [V, S51].
- 1 game day = 20 real minutes (a tuning example from note 03).

| Quantity | Calculation | Result |
|---|---|---|
| Melt at +5 °C | 4 × 5 = 20 mm/day | 10 u per game day |
| Per cell per real second | 10 u / 1,200 s | 0.0083 u/s |
| Whole field | 0.0083 × 57,600 | ≈ 480 decrements/s ≈ **48 picks per tick at 10 Hz** (before sun/edge multipliers) |
| Time to melt a 64-u cover | 64 / 10 | **6.4 game days ≈ 2.1 real hours** |

Realism is therefore too slow for a session. Options:
- scale DDF ×5–10;
- use Cordonnier's 10 mm/°C/day [V, S71] plus a sun boost, as in `melt = DDF·max(0, T + sunBoost·sun·exposure − T0)` [I, note 04];
- or use RimWorld's quadratic rule, which accelerates sharply with temperature (0.058 %·T²) [V, S10].

Snowfall works the same way. To reach 64 u on open ground in 10 real minutes:
- 64/600 = 0.107 u/s per cell;
- 6,144 accepted increments/s field-wide;
- about **614 picks per 10 Hz tick** on fully exposed ground.

That is a cheap loop even in GDScript, at about 51 ns × a few operations per pick [V, vendor, S54; I].

**Day and night.** Light comes from the palette (E4) and temperature follows daylight [V, S123]. Refreezing (`T < 0`, wet > θ) then happens after sunset by itself [I].

---

## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)

Everything in this section is a design proposal [I]. It is grounded in the sources cited, but it has not been tested in Godot.

```
┌──────────────── WEATHER STATE (server-authoritative, synced) ────────────────┐
│ intensity 0..1 · temperature °C · wind (bucketed) · sun factor · time · seed  │
└───────────────┬──────────────────────────────────────────────┬───────────────┘
                ▼                                              ▼
 DATA LAYER (per visible chunk, client)              GAMEPLAY LAYER (server)
  depth  R8   (u8 per art pixel or 2×2)               tile snow band 0..3 (B2)
  packed R8   (trail mark)                            tile wear 0..255 (C6)
  wet    R8   (meltwater / ice flag)                  → speed multiplier, tracking
  expo   R8   baked: shelter × wind lee (B5, B6)
  sun    R8   baked: day-summed shadow (D3)
                ▼
 UPDATE LAYER  (choose one per platform)
  (1) CPU GDScript @ 5–10 Hz, stochastic picks on dirty chunks → Image → ImageTexture.update()
  (2) Shader ping-pong (two SubViewports / DrawableTexture2D pair), pull-form rules
  (3) DrawableTexture2D stamps for cosmetic trails (blit_rect ADD/SUB), CPU field for the rest
                ▼
 RENDER LAYER: one CanvasItem shader on the ground:
  depth > threshold(Bayer+hash) → emboss band → palette index → palette LUT (day/night, lamp)
                ▼
 FLAKES LAYER: z-height flakes w/ shadow dots (near) + 2 cheap hashed layers (far)
```

**Data layer.**
- R8 textures, or one RGBA8 texture (depth, packed, wet, exposure) that uploads without a copy, as in Sandspiel [V, S37].
- Compatibility means RGBA8 precision and no 2D HDR [V, S81]: use stochastic rounding [I].
- `DrawableTexture2D` has no R8 format (RGBA8, RGBA8_SRGB, RGBAH, RGBAF) [V, S77]; pack channels with `modulate` masks [V, S79].

**Update layer.** (1) CPU: Noita-style dirty 64×64 chunks [V, S36] and stochastic picks, uploading only dirty chunks [I]. (2) Shader ping-pong ("feedback loops via SubViewport" [V, abstract, S93]) with pull-form rules [I, S55], since there is no compute on web [V, S81]. (3) Hybrid: GPU blits for cosmetic trails, CPU for the rest. Wrap the experimental DrawableTexture2D API in one script [I].

**Render layer.** One nearest-filtered CanvasItem shader: threshold (B4 + E2), emboss (E3), palette LUT (E1/E4), sparkle (E5).

**Flakes layer.** 50–150 z-flakes (CPU or MultiMesh) plus 2 hashed far layers. No particle collision on web [V, S81, S82].

**Gameplay hooks.**
- **Speed** comes from the server's tile band (C4).
- **Tracking:** the server can store sparse "track events" (who, where, when) and let clients render them.
- **Multiplayer sync**: weather state plus seeds only (intensity, temperature, wind bucket, time, RNG seed). Footprints, flakes and per-pixel melt stay local and cosmetic [I]. Precedents: DST's single `precipitation` scalar [V, S117] and Vav Labs' depth map read by both renderer and gameplay [V, S92].

**Pseudocode.** GDScript-like and Godot-shader-like. Engine API names are written from the notes and should be checked against the target Godot version.

```gdscript
# --- data ---
const W := 320; const H := 180
var depth := PackedByteArray(); var packed := PackedByteArray(); var wet := PackedByteArray()
var expo := PackedFloat32Array()      # baked once per wind bucket (B5 + B6)
var sun_shadow := PackedByteArray()   # baked (D3)
var rng := RandomNumberGenerator.new()  # seeded from synced weather seed

func _ready():
    depth.resize(W*H); packed.resize(W*H); wet.resize(W*H)

# --- deposit (D1), called at fixed 10 Hz ---
func deposit_tick(intensity: float) -> void:
    var picks := int(614 * intensity)          # worked example B: 64 u in ~10 min
    for k in picks:
        var i := rng.randi() % (W*H)
        var e := expo[i]
        var units := int(e) + (1 if rng.randf() < fposmod(e, 1.0) else 0)  # E>1 deposits more
        if units == 0: continue
        if wet[i] > 90 and rng.randf() < 0.6: wet[i] -= 3; continue
        depth[i] = min(200, depth[i] + units)
        packed[i] = max(0, packed[i] - 14)     # fresh snow erases trail marks

# --- stamp (C2), called per footstep ---
func stamp(x: int, y: int, keep := 0.3) -> void:
    var spill := 0
    for yy in 2:
        for xx in 2:
            var i := (y+yy)*W + (x+xx)
            var nd := int(depth[i] * keep); spill += depth[i] - nd; depth[i] = nd
            packed[i] = 255
    var per := maxi(1, spill / 6)
    for k in 6:
        var a := rng.randf() * TAU
        var px := x + roundi(cos(a) * 2.2); var py := y + roundi(sin(a) * 1.5)
        var j := py*W + px
        if packed[j] < 200: depth[j] = min(200, depth[j] + per)
    mark_dirty(x, y)

# --- melt (D2 + D3 + D4), called at fixed 10 Hz ---
func melt_tick(temp: float, sun: float) -> void:
    if temp <= 0.0: return
    var picks := int(1500 * min(temp, 6.0) / 4.0 * (0.35 + 0.65*sun))
    for k in picks:
        var i := W + 1 + rng.randi() % (W*H - 2*W - 2)
        if depth[i] == 0: continue
        var rate := (0.25 if sun_shadow[i] and sun > 0.4 else 1.0) * (0.5 if packed[i] > 100 else 1.0)
        var bare := int(depth[i-1] < 3) + int(depth[i+1] < 3) + int(depth[i-W] < 3) + int(depth[i+W] < 3)
        rate *= 0.35 + 0.5 * bare             # edges first
        if rng.randf() < rate:
            depth[i] -= 1; wet[i] = min(255, wet[i] + 5)
            if depth[i] == 0: packed[i] = 0
```

```glsl
// --- render threshold (B4 + E2 + E3 + E1/E4), canvas_item ---
shader_type canvas_item;
uniform sampler2D depth_tex  : filter_nearest;   // R = depth/255
uniform sampler2D thresh_tex : filter_nearest;   // baked: bayer*0.55 + hash*2.5 + 0.5 (in depth units/255)
uniform sampler2D ground_idx : filter_nearest;   // base palette index of bare ground
uniform sampler2D palette    : filter_nearest;   // 1D LUT, rebuilt per frame for day/night
uniform vec2 size = vec2(320.0, 180.0);
const int SN_HI = 9; const int SN_BASE = 10; const int SN_MID = 11; const int SN_SH = 12; const int SN_DEEP = 13;

float D(vec2 p) { return texture(depth_tex, (p + 0.5) / size).r * 255.0; }

void fragment() {
    vec2 p = floor(UV * size);
    float d = D(p), t = texture(thresh_tex, UV).r * 255.0;
    int idx = int(texture(ground_idx, UV).r * 255.0);
    if (d > t) {
        float sl = (D(p + vec2(1,0)) - D(p - vec2(1,0))) + (D(p + vec2(0,1)) - D(p - vec2(0,1)));
        idx = (d < t + 4.0) ? SN_BASE :
              sl > 6.0 ? SN_HI : sl >= -6.0 ? SN_BASE : sl >= -13.0 ? SN_MID : sl >= -22.0 ? SN_SH : SN_DEEP;
    }
    COLOR = texture(palette, vec2((float(idx) + 0.5) / 256.0, 0.5));
}
```

**DrawableTexture2D variant for cosmetic trails (4.7+).** `trail.blit_rect(Rect2i(foot, Vector2i(4,4)), print_tex, Color(1,0,0,0), 0, mat_sub)` stamps into R only. Every 0.5 s, a full-rect blit with an ADD BlitMaterial and a 1/255 modulate refills the trails [V API, S77–S79; I usage].

---

## 8. Reference implementation: the Snow Sandbox

`vfx-snow-sandbox.html` [S123] is our playable companion. It is a single page of plain JavaScript drawing into a 320×180 Canvas 2D `ImageData` with no WebGL. Its design choices are ours [I]. The description below is from reading its script.

**Buffers.** All 320×180 = 57,600 cells: `Uint8Array` **depth** (cap 200; 14 on canopy), **packed** and **wet**, plus surface class, sun shadow, object height and the palette-index buffer; `Float32Array` exposure, shelter, threshold and lamp mask. The scene has a house, ten pines, a fence, rocks, a lamp, a path and an ice pond; each object pixel stores its height and foot row (for y-sorting and shadows).

**Exposure, baked per wind bucket.** Wind is rounded to steps of 0.5, and the bake reruns only when the bucket changes. Each ground pixel steps up to **28 px horizontally upwind** looking for object pixels with a wind-obstacle height. Inside the lee length `L = 1.1·h·|wind| + 2`, exposure is scaled by `0.15 + 0.85(d/L)²`; between L and 1.8L it gets ×1.12. Shelter rings under pines and an eave strip under the house multiply in, and the result is capped at 1.3. The page's explanatory card says "24 pixels" and "+30 %"; the code uses 28 px and ×1.12, and this study follows the code.

**Sun shadows** are forward-projected once from every object pixel toward the lower right (sun at upper left).

**Per sim step.** At speed N there are N steps per rendered frame.
1. **Deposit.** `900 × intensity` random picks, each accepted with probability E (heavy snow: about 900 deposits/frame at 1×).
2. **Sandpile.** 4,000 random cells each compare depth with one random 4-neighbour of the same surface class. One unit moves if the difference exceeds 3. The card says "more than 4"; the code uses `D[i] > D[j] + 3`, i.e. repose 3.
3. **Wind creep.** If |wind| > 0.35 while snowing, `1400·|wind|` picks move 1 unit downwind from exposed, unpacked cells holding at least 4 units.
4. **Melt.** Above 0 °C: `1500·min(T,6)/4·(0.35 + 0.65·sun)` picks, with rate = shadow 0.25 × packed 0.5 × surface (roof/rock 1.4, canopy 2.2, ice 1.3) × (0.35 + 0.5 × bare neighbours). Each melted unit adds 5 wetness.
5. **Evaporation.** `1600·(0.3 + sun)` picks above 0 °C, 300 picks otherwise.

**Characters.** A player (keyboard or tap-to-walk), a villager on a waypoint loop and a fox every 12–30 s. Each makes stamps every 4 px (2×2 keeping 30 %, rim spill to 6 points; fox 1×1 keeping 45 %). Sink is one row per 22 u (max 4), slowdown `1 − min(0.55, d/170)`, 3 puffs per step above 18 u. A hat snow cap builds during snowfall, and breath puffs appear below 1 °C. There are shovel and add-snow brushes.

**Rendering.**
- Threshold coverage and four-neighbour emboss (5 snow shades + 2 packed).
- 1/512 sparkles.
- **58 base colours × 4 variants** (base, shadow, wet, wet+shadow) = 232 entries, re-tinted per frame.
- A Bayer-dithered warm lamp palette.
- Flake layers of **260 / 150 / 46** with z, the near layer with shadow dots.
- X-ray views of depth, exposure, sun shadow, packed and wet.

**Measured cost.** The HUD shows smoothed sim time. On our test machine, in headless Chromium, the simulation took **about 3–9 ms per frame at 2–16× sim speed**. This is one machine and is illustrative, not a benchmark; GDScript would be slower (B3).

**Honest limits [I].** Rates depend on frame rate; exposure above 1 adds nothing; rays are horizontal only; flake landings are cosmetic (~0.2 % of deposition); there is no ice/refreeze state; nothing is networked.

---

## 9. Gem findings

Repository data (stars, last push) were checked via the GitHub search API on 2026-11-08 [V, note 07].

| Name | URL | Licence | Maturity evidence | Good for |
|---|---|---|---|---|
| OpenTTD snow line + LFSR tile loop | https://github.com/OpenTTD/OpenTTD | **GPL-2.0, study only** | 8,482★; pushed 2026-11-08; shipped since 2004 | Per-tile density stepping, scrambled visit order (B2) |
| Just snow (Baldwin, ldsGDn) | https://www.shadertoy.com/view/ldsGDn | **CC BY-NC-SA 3.0, non-commercial; re-implement** | Ported to libretro, Ghostty, Unity, Flutter, ISF | Reference hashed-cell layers (A3) |
| godotshaders "Let it snow!!!" | https://godotshaders.com/shader/let-it-snow/ | Labelled CC0, **provenance risk** (likely derived from Just snow) | 2023; GLES2/Android | Study only |
| godotshaders "Multilayer Snowfall" | https://godotshaders.com/shader/multilayer-snowfall-shader/ | Labelled CC0, provenance unclear | 2025-01-12; 6 comments | Wind/spread uniforms; 40 layers by default (heavy) |
| godotshaders "Rain and Snow with Parallax" | https://godotshaders.com/shader/rain-and-snow-with-parallax-scrolling-effect/ | MIT | 2023; used in a game per a commenter | Safe commercial base; `step()` snow variant |
| godotshaders "Car Tracks on Snow or Sand" | https://godotshaders.com/shader/car-tracks-on-snow-or-sand-using-viewport-textures-and-particles/ | MIT | 2023, updated 2026-11-06 | SubViewport trail pattern (C3) |
| Flynsarmy/gd-snow-project | https://github.com/Flynsarmy/gd-snow-project | MIT | 4★; created 2026-06-19 | DrawableTexture2D stomping (Godot 4.7) |
| Godot DrawableTexture2D | https://docs.godotengine.org/en/4.7/classes/class_drawabletexture2d.html | MIT (engine) | Official 4.7; experimental API | GPU paint into textures on web |
| Weather FX Free | https://store.godotengine.org/asset/heyheythere/weather-fx-free/ | Store: CC BY 4.0; repo: custom text (NOASSERTION), **check** | v1.0.2, 2026-09-30; 1★ repo | One-shader snow with pixel mode, Compatibility |
| WeatherSystem2D | https://github.com/gregrylivingston/Godot4---Weather-System-2D | MIT | AssetLib accepted; Godot 4.3+ | Day/night, fronts, seeded weather |
| Sandspiel | https://github.com/MaxBittker/sandspiel | MIT | 3,221★; live since 2018 | WASM CA + WebGL; wind-pushed cells |
| sand-slide | https://github.com/kiwijuice56/sand-slide | MIT | 143★; shipped on itch and Google Play | Godot GDExtension CA engine |
| The Powder Toy (SNOW.cpp) | https://github.com/The-Powder-Toy/The-Powder-Toy | **GPL-3.0, study only** | 5,395★; maintained since 2010 | Melt and salt rules for tuning |
| Sandboxels | https://github.com/R74nCom/sandboxels | Custom (unread), **check** | 478★; 500+ elements | Readable JS snow/ice/water states |
| filipedeschamps/doom-fire-algorithm | https://github.com/filipedeschamps/doom-fire-algorithm | MIT | 1,599★; pushed 2026-10-17 | Playground template for this series |
| fabiensanglard/DoomFirePSX | https://github.com/fabiensanglard/DoomFirePSX | **No licence (all rights reserved)** | 263★ | Cite; do not copy |
| PICO-8 Component Snow | https://www.lexaloffle.com/bbs?tid=36368 | **CC BY-NC-SA** | 2019-12-25 | Tiny fall-slide-freeze rules |
| jjacobson/Realtime-Snow | https://github.com/jjacobson/Realtime-Snow | **GPL-3.0, study only** | 85★; 2022 | Deformation + accumulation (Unity) |
| Noniv/snowflow_demo | https://github.com/Noniv/snowflow_demo | MIT | 596★ in ~3 months (2026) | WebGPU snow reference (internals not inspected) |
| Lospec winter palettes | https://lospec.com/palette-list/tag/winter | Not stated | Winter Wonderland 7,195 downloads | Ready snow ramps |

**Licence flags.**
- **Shadertoy shaders default to CC BY-NC-SA unless stated otherwise.** Just snow states it explicitly, and Godot ports labelled CC0 may not clear it.
- **GPL code** (OpenTTD, Powder Toy, Realtime-Snow) must not be pasted into a closed MMO client.
- **Copy the ideas.** Algorithms are not copyrightable; code is [I, note 07].

---

## 10. Learnings and anti-patterns

**Learnings [I unless tagged].**
1. **One buffer, many effects.** Depth plus a fixed threshold yields coverage, prints, drifts and melt fronts. Resist separate systems per effect.
2. **Exposure is a rate, not a result.** Ohlsson & Seipel lost snow by recomputing it every frame [V-secondary, S59]. Accumulate into persistent state instead.
3. **Stochastic updates are the budget knob.** Werner-style "K random cells" makes cost independent of field size and turns precision problems into organic edges.
4. **Interaction is the feeling.** In Slime Rancher 2, art tests showed snow interaction was "crucial to capturing the feeling of snow" [V, S29].
5. **Transitions, not switches** [V, S30]. Even Emerald ramps snow over about 9.6 s [V, S4].
6. **Edges carry the taste.** UO's square snow tiles were criticised [V, S14]. Use autotile edges, dither only at transitions, and emboss the rims.

**Anti-patterns** (from notes 06/08 and our tests):

| Anti-pattern | Why | Fix |
|---|---|---|
| Uniform pure-white carpet | Flat; ignores saint11's opposing temperatures [V, S95] | 4–5 value ramp, warm light, blue-violet shadow |
| Flakes falling straight down the screen | Wrong top-down perspective | z-height + shadow dot (A4) |
| Particle blizzards | Overdraw [V, S27]; "visual chaos" [V, S30] | Few near flakes, cheap far layers |
| Snow burying gameplay objects | SR2 keeps nests and patches clear [V, S29] | Exclusion / occlusion masks |
| Footprints that never fade, or fade in 1 s | Long Dark ties track duration to snowfall [V, S98] | Refill by deposition (C2 + D1) |
| Uniform dissolve melt | Reads as a filter | Sun map + bare-neighbour term (D3) |
| Frame-tied sim steps | Rate varies with fps (Sandbox) | Fixed-timestep ticks |
| Syncing per-pixel snow over the network | Non-deterministic, bandwidth | Sync weather state + seeds; tile bands for gameplay |
| One generic crunch | Snow sound varies with temperature and type [V, S100] | 3–5 footstep sets by state |
| Pasting "CC0" Shadertoy ports | NC-SA provenance [V, S106] | Re-implement or use MIT shaders |

---

## 11. "See it in action" index

| # | Game / production | Year | What to look at | Link |
|---|---|---|---|---|
| 1 | Pokémon Emerald | 2004 | 16-sprite snowfall, footprint flicker fade | https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c |
| 2 | Pokémon Diamond/Pearl/Platinum | 2006–08 | 4 sink depths, snow foot/bike tracks | https://bulbapedia.bulbagarden.net/wiki/Snow_tile |
| 3 | Pokémon HeartGold/SoulSilver; Pokémon X/Y | — | Mt. Silver snow tiles; Route 17 snow crossable only on Mamoswine | https://bulbapedia.bulbagarden.net/wiki/Snow_tile |
| 4 | Tibia | 1997– | Snow speed tile, footprint tiles, Yeti tracks | https://tibia.fandom.com/wiki/Tiles |
| 5 | Ultima Online | 1997 | Client-side winter, square snow tiles | https://www.forums.polserver.com/viewtopic.php?p=19410 |
| 6 | Zelda: Oracle of Seasons | 2001 | Per-area winter swap, snow mounds, frozen water | https://www.zeldadungeon.net/wiki/Winter |
| 7 | Stardew Valley | 2016 | Seasonal tilesheets, winter paths | https://stardewvalleywiki.com/Modding:Maps |
| 8 | RimWorld | 2013– | Per-cell depth, speed bands, melt formula | https://rimworldwiki.com/wiki/Snow |
| 9 | Dwarf Fortress | — | Gradual cover, magma melt, freezing water | https://dwarffortresswiki.org/index.php/Snow |
| 10 | OpenTTD | 2004– | Arctic snow line, 4 density sprites | https://github.com/OpenTTD/OpenTTD/blob/master/src/clear_cmd.cpp |
| 11 | Don't Starve / Together | — | Snow on objects, turf goes snowy | https://dontstarve.wiki.gg/wiki/Winter |
| 12 | Project Zomboid (+ Immersive Snow mod) | B40 / 2026 | Prints, trodden paths, ruts, heat melt | https://top-mods.com/mods/project-zomboid/gameplay/16435-immersive-snow.html |
| 13 | Animal Crossing: City Folk / New Leaf | — | Grass wear trails, regrowth | https://animalcrossing.fandom.com/wiki/Animal_Tracks |
| 14 | Snowy Trails (jam) | — | Footprints as puzzle obstacles | https://matojeje.itch.io/snowy-trails/devlog/670340/about-the-game-mechanics |
| 15 | Kingdom Two Crowns | 2019 post | Winter changes economy and wildlife | https://www.kingdomthegame.com/news/2019/3/26/citizens-more-active-during-winter-in-kingdom-two-crowns |
| 16 | Celeste | 2018 | Wind chapters on a snowy mountain | https://celestegame.fandom.com/wiki/Wind |
| 17 | A Short Hike | 2019 | Snowy summit, minimal-pixel palette | https://en.wikipedia.org/wiki/A_Short_Hike |
| 18 | Tikus Tales (demo) | — | Animation-driven footprint particles | https://wilkgames.itch.io/tikus-tales/devlog/199972/creating-footprints-in-the-snow |
| 19 | Octopath Traveler / Final Fantasy VI | — | Glistening HD-2D snow; 16-bit flurries | https://www.thegamer.com/most-impressive-snow-physics-mechanics-in-games/ |
| 20 | Noita | 2019 talk | Snow as a falling-sand material | https://noita.wiki.gg/wiki/Snow_static |
| 21 | Sandspiel | 2018– | Web CA with wind-pushed cells | https://maxbittker.com/making-sandspiel |
| 22 | Company of Heroes 2 | 2013 | Top-down tracks, snow shadow map, ice cells | https://shacknews.com/article/74964/company-of-heroes-2-chills-out-with-coldtech |
| 23 | Batman: Arkham Origins | 2013 | Rooftop trail heightmaps that refill | https://www.slideshare.net/colinbb/gdc2014-deformable-snow-rendering-in-batman-arkham-origins |
| 24 | Slime Rancher 2 | 2022 | Interaction buffer, raised edges, snow on slimes | https://www.gamedeveloper.com/design/slime-rancher-2-snow-particle-effects |
| 25 | Rise of the Tomb Raider | 2015 | Raised trail rims, fill in blizzard | https://www.slideshare.net/slideshow/labs-siggraph15trxno-videos/130489149 |
| 26 | Assassin's Creed III | 2012 | Early deformation, no refill | https://gamingbolt.com/red-dead-redemption-2-tech-analysis-animations-physics-post-processing-effects-weather-systems-and-more |
| 27 | God of War / Ragnarök | 2018 / 2022 | Paint target + parallax; capsule carving | https://mamoniem.com/?p=1646 |
| 28 | Horizon Zero Dawn: The Frozen Wilds | 2017 | Trails reveal grass, kicked snow, snow off trees | https://www.gamebanshee.com/k4ah6 |
| 29 | Red Dead Redemption 2 | 2018 | Prints and troughs, readable animal tracks | https://www.thegamer.com/most-impressive-snow-physics-mechanics-in-games/ |
| 30 | The Long Dark | — | Tracks erased by snowfall, wind shield | https://thelongdark.fandom.com/wiki/Weather |
| 31 | SnowRunner | — | Painted depth, global coverage scalar | https://expeditions-guides.saber.games/map_modding/creating_a_map/snow_and_ice/adding_snow_and_ice/ |
| 32 | Frostpunk | — | Snow-cover mesh, heat-level bands | https://frostpunk.fandom.com/wiki/Heat_level |
| 33 | 1080 Avalanche / Bloodborne / Days Gone / Lost Planet / TLOU2 | — | Snow on clothing / on props / blood in snow / kicked haze / whiteout | https://www.thegamer.com/most-impressive-snow-physics-mechanics-in-games/ |
| 34 | Ghost of Yōtei | — | Deep-snow walking, snow on Atsu | https://80.lv/articles/sucker-punch-breaks-down-tech-that-brought-ghost-of-y-tei-s-world-to-life |
| 35 | Winter Burrow | 2025 | Screen ices over as a cold warning | https://aftermath.site/winter-burrow-demo.md |
| 36 | Moomintroll: Winter's Warmth / Froggy Hates Snow | 2026 | Shovelling, persistent footprints (press only) | https://www.pulse.bot/gaming/news/let-it-snow-294bc3d1-0efb-4003-bdf0-c57d774a513a/ |
| 37 | Stone Protectors (Mega Drive prototype) | — | 74 multiplexed snow sprites, 3 layers | https://rasterscroll.com/mdgraphics/graphical-effects/sprite-raster-effects/ |
| 38 | Living Worlds / Canvas Cycle | 2010 port | Palette-cycled snow | https://experiments.withgoogle.com/canvas-cycle |
| 39 | The Night it Snowed (C64 demo) | 2020 | Demoscene snow | https://www.youtube.com/watch?v=Urq7Ue6gS44 |
| 40 | BartekDev's pixel naval game | — | Winter pixel environment | https://80.lv/articles/developer-shows-picturesque-winter-environment-for-pixel-art-naval-game |
| 41 | Snow Sandbox (ours) | 2026 | Everything in this study, with X-ray views | `vfx-snow-sandbox.html` |

---

## 12. What remains unverified (and corrections)

**Corrections.**
- **Haglund 2002 authors.** An earlier brief listed "Haglund, Andersson, Gustavsson, Seipel". Reynolds' bibliography gives **H. Haglund, M. Andersson, A. Hast**, SIGRAD 2002, pp. 11–15 [V-secondary, S59]. The primary PDF was not opened; it is probably at [S73].
- **Wet versus dry fall speed conflict.**
  - Moeslund 2005: dry 0.5–1.5 m/s, wet 1–2 m/s [V, S66].
  - Saltvik's thesis: the opposite, wet 0.5–1.5 and dry 1–2 [V, S67].
  - Physical intuition (denser wet flakes fall faster) favours Moeslund [I]. Verify before use.
- **Tibia's 10 s footprint** comes from a community OpenTibia server thread whose author claims it "matches real Tibia", replacing an earlier 30 s. It is not verified against CipSoft [U, S13].
- **Ohlsson & Seipel** and **Powder Toy SNOW**, flagged unread in one note, were read first-hand by another researcher [V, S58, S39].
- **`use_hdr_2d` precision.** This was suggested for trail maps, but a 2D HDR viewport is not available on Compatibility [V, S81]. It is not a web option.
- **DrawableTexture2D on web.** Source code shows a GLES3 blit path [V, S80]. One researcher could not confirm web support from the docs, and no runtime web test was done [U].
- **Sandbox cards versus code.** The cards say 24 px rays, a +30 % drift band and sandpile "> 4". The code uses 28 px, ×1.12 and "> 3". This study follows the code.

**Still unverified.** Sumner's snow parameters; Hock's DDF table; RimWorld's tick length and renderer; the peak of Emerald's sine table; RotTR's numbers and sliding window [S25]; the exact Bayer listing [K, from memory]; Fizzlefade's LFSR details [S116]; Deschamps' off-switch; Fearing's DOI; SNES BG3 snow; Minecraft snow layers and ACNH species footprints; Frostpunk's heat melt; DST's ground snow level [S118]; talk contents (abstracts only). The WebGPU 4× claim and the GDScript benchmark are vendor-reported [V, vendor].

---

## 13. Prototype roadmap for Godot (web)

1. **Render first (1–2 days).**
   - Port the Sandbox's ground shader: depth texture, threshold (Bayer + hash), emboss, palette LUT.
   - Drive it with a global `snow_level × exposure` (B4) so the look can be judged with zero simulation.
   - Choose a Lospec winter ramp and apply saint11's warm/cold rule.
2. **Bake shelter.** Generate exposure per chunk from roof, canopy and wall layers (B5 + B6) and a sun-hours map (D3). Add the "empty pixel above" snow caps (B8).
3. **CPU field at 10 Hz.** PackedByteArray depth/packed/wet per visible chunk, with stochastic deposit and melt, sandpile, and dirty-chunk `ImageTexture.update()`. Profile GDScript on a low-end web device; move the hot loop to a GDExtension or shader only if needed.
4. **Interaction.** Conserve-and-displace stamps on footstep events, sink and slowdown from a coarse tile band, puffs, and snow on characters. Test 50+ walkers in a town scene.
5. **Flakes.** z-height near flakes with shadow dots, plus 2 MIT-safe hashed far layers, pixel-snapped.
6. **Time and network.** A fixed-timestep weather state machine (anticipation → build → quiet → melt → refreeze) and palette day/night with dithered lamps. Server sync carries weather state + seed only, and the server owns tile bands and wear (C6).
7. **Optional 4.7 path.** Swap cosmetic trails to `DrawableTexture2D` stamps, behind one wrapper script because the API is experimental. Compare cost against the CPU path on WebGL 2.

---

## 14. Sources

Numbered for the inline references [S#]. Additional URLs for games and repositories appear directly in §4, §9 and §11. "Not opened" or "secondary" marks a source whose content the research did not read first-hand. Every URL comes from the research notes or from the sandbox file.

**DOOM fire and tiny-effect templates**
1. Fabien Sanglard, "How DOOM fire was done": https://fabiensanglard.net/doom_fire_psx/
2. Filipe Deschamps, doom-fire-algorithm playground (MIT): https://github.com/filipedeschamps/doom-fire-algorithm
3. Adam Richardson (thales17), PICO-8 DOOM fire: https://thales17.srht.site/posts/doom_fire.html

**Classic 2D games (decomps, wikis)**
4. pokeemerald, field_weather_effect.c: https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
5. pokeemerald, constants/field_weather.h: https://github.com/pret/pokeemerald/blob/master/include/constants/field_weather.h
6. pokeemerald, field_effect_helpers.c: https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c
7. pokeemerald, event_object_movement.c: https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
8. pokeplatinum, ov5_021F1CC8.c: https://github.com/pret/pokeplatinum/blob/main/src/overlay005/ov5_021F1CC8.c
9. Bulbapedia, Snow tile: https://bulbapedia.bulbagarden.net/wiki/Snow_tile
10. RimWorld Wiki, Snow: https://rimworldwiki.com/wiki/Snow
11. Dwarf Fortress Wiki, Snow: https://dwarffortresswiki.org/index.php/Snow
12. TibiaWiki, Tiles: https://tibia.fandom.com/wiki/Tiles
13. OTLand, "8.0 snow footsteps fix" (community server): https://otland.net/threads/8-0-snow-footsteps-fix.189116/
14. POL server forum, UO seasons: https://www.forums.polserver.com/viewtopic.php?p=19410
15. Zelda Dungeon Wiki, Winter (Oracle of Seasons): https://www.zeldadungeon.net/wiki/Winter
16. Stardew Valley Wiki, Modding:Maps: https://stardewvalleywiki.com/Modding:Maps
17. CurseForge, Snowy Paths mod: https://www.curseforge.com/stardewvalley/mods/snowy-paths
18. Q&A with Mark J. Ferrari (EffectGames, mirror): https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html
19. monochrom.at on Ferrari's colour cycling: https://monochrom.at/blog/?p=11592
20. Canvas Cycle (Experiments with Google): https://experiments.withgoogle.com/canvas-cycle
21. rasterscroll, sprite raster effects (Stone Protectors): https://rasterscroll.com/mdgraphics/graphical-effects/sprite-raster-effects/
22. SnesLab, BG3: https://sneslab.net/wiki/BG3

**Industry snow systems**
23. Barré-Brisebois, "Deformable Snow Rendering in Batman: Arkham Origins", GDC 2014 slides: https://www.slideshare.net/colinbb/gdc2014-deformable-snow-rendering-in-batman-arkham-origins
24. Eidos Montréal Labs, SIGGRAPH 2015 Rise of the Tomb Raider slides: https://www.slideshare.net/slideshow/labs-siggraph15trxno-videos/130489149
25. GPU Pro 7 chapter, "Deferred Snow Deformation in RotTR" (paywalled, not read): https://www.taylorfrancis.com/books/9780203705179/chapters/10.1201/b22483-18
26. Moniem, "Behind the Pretty Frames: God of War" (reverse-engineered): https://mamoniem.com/?p=1646
27. Barrero, "Company of Heroes 2 Rendering Tech" (KGC 2013): https://www.slideshare.net/slideshow/daniel-barrero-coh2renderingtech/26765990
28. Shacknews, CoH2 ColdTech: https://shacknews.com/article/74964/company-of-heroes-2-chills-out-with-coldtech
29. Game Developer, Slime Rancher 2 snow particle effects (2023): https://www.gamedeveloper.com/design/slime-rancher-2-snow-particle-effects
30. Game Developer, weather in Slime Rancher 2: https://www.gamedeveloper.com/programming/the-art-and-science-of-creating-weather-in-slime-rancher-2
31. GameBanshee / Digital Foundry, Horizon Zero Dawn: The Frozen Wilds: https://www.gamebanshee.com/k4ah6
32. Saber, SnowRunner map modding, snow and ice: https://expeditions-guides.saber.games/map_modding/creating_a_map/snow_and_ice/adding_snow_and_ice/
33. Kodeco, "Creating Snow Trails in Unreal Engine 4": https://www.kodeco.com/5760-creating-snow-trails-in-unreal-engine-4 (page 3: https://kodeco.com/5760-creating-snow-trails-in-unreal-engine-4?page=3)
34. godotshaders, "Car Tracks On Snow Or Sand" (MIT): https://godotshaders.com/shader/car-tracks-on-snow-or-sand-using-viewport-textures-and-particles/
35. Tatarchuk, "Artist-Directable Real-Time Rain Rendering", SIGGRAPH 2006: https://advances.realtimerendering.com/s2006/Tatarchuk-Rain.pdf

**Cellular automata, terrain and melt science**
36. 80.lv, Noita falling-sand article: https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/
37. Max Bittker, "Making Sandspiel": https://maxbittker.com/making-sandspiel
38. Sandboxels Wiki, Packed Snow: https://sandboxels.wiki.gg/wiki/Packed_Snow
39. The Powder Toy, SNOW.cpp: https://github.com/The-Powder-Toy/The-Powder-Toy/blob/master/src/simulation/elements/SNOW.cpp
40. The Powder Toy repository (GPL-3.0): https://github.com/The-Powder-Toy/The-Powder-Toy
41. Wikipedia, Abelian sandpile model: https://en.wikipedia.org/wiki/Abelian_sandpile_model
42. Fractal terrain wiki, Erosion Models: https://github.com/vrum/fractalterraingeneration/blob/master/wiki/Erosion_Models.wiki
43. CESCG'97 thermal erosion notes: https://old.cescg.org/CESCG97/marak/node11.html
44. World Machine, Thermal Erosion device: https://help.world-machine.com/topic/device-thermalerosion/
45. Chalmers, angle of repose of snow (abstract): https://research.chalmers.se/en/publication/?id=528014
46. Werner 1995, eolian dune CA: https://planetarygeoscience.uchicago.edu/doc/Werner_1995.pdf
47. Beneš & Roa 2004, "Simulating desert scenery": https://www.cs.purdue.edu/homes/bbenes/papers/Benes04WSCGa.pdf
48. godotshaders, 2D dissolve with burn edge: https://godotshaders.com/shader/2d-dissolve-with-burn-edge/
49. Wikipedia, Ordered dithering: https://en.wikipedia.org/wiki/Ordered_dithering
50. MetricGate, snowmelt degree-day: https://metricgate.com/docs/snowmelt-degree-day/
51. HESS 30, 2613 (2026), melt-factor review: https://hess.copernicus.org/articles/30/2613/2026/hess-30-2613-2026.html
52. AntarcticGlaciers.org, degree-day models: https://www.antarcticglaciers.org/glaciers-and-climate/numerical-ice-sheet-models/modelling-glacier-melt/
53. Hock 2003 abstract: https://repository.geologyscience.ru/items/959fd6dc-a49d-44b9-8a58-c662ee369ac5/full
54. Projekt J.E.N.O.V.A benchmark (vendor-reported): https://jenova-framework.github.io/docs/pages/Misc/Benchmark
55. nullprogram, "When Parallel: Pull, Don't Push" (title only): https://nullprogram.com/blog/2020/04/30/

**Academic snow graphics**
56. Fearing 2000, SIGGRAPH archive: https://history.siggraph.org/?p=118252
57. Feldman & O'Brien 2002: https://escholarship.org/content/qt5v34k082/qt5v34k082.pdf
58. Ohlsson & Seipel 2004: https://ep.liu.se/ecp/013/007/ecp01307.pdf
59. Reynolds 2015 PhD thesis (UEA): https://ueaeprints.uea.ac.uk/id/eprint/53359/
60. Reynolds, Laycock, Day 2014 (DOI 10.1007/s00371-014-0995-5): https://research-portal.uea.ac.uk/en/publications/real-time-accumulation-of-occlusion-based-snow/
61. Foldes & Beneš 2007 (secondary): https://www.cs.purdue.edu/cgvlab/www/publications/Foldes07Vriphys
62. Festenberg & Gumhold 2009 (secondary): https://diglib.eg.org/items/c12884c9-b7fd-4679-b743-02ad5c7b87bf
63. Festenberg & Gumhold 2011 (secondary): https://diglib.eg.org/items/0e424c9c-7dbe-4040-87df-6b53b53104c2
64. Muraoka & Chiba 2000 (secondary): https://ieeexplore.ieee.org/document/884537
65. KAKEN grant report 09680406: https://kaken.nii.ac.jp/en/report/KAKENHI-PROJECT-09680406/096804061999kenkyu_seika_hokoku_gaiyo
66. Moeslund et al. 2005: https://diglib7.eg.org/bitstream/handle/10.2312/vvg20051008/061-068.pdf
67. Saltvik MSc thesis 2006: https://folk.idi.ntnu.no/elster/master-studs/saltvik/saltvik-master.pdf
68. Stomakhin et al. 2013, MPM snow: https://www.math.ucdavis.edu/~jteran/papers/SSCTS13.pdf
69. Sumner, O'Brien, Hodgins 1998: https://escholarship.org/content/qt3nk515kp/qt3nk515kp.pdf
70. Junker & Palamas 2020 (DOI 10.1145/3402942.3402995): https://vbn.aau.dk/da/publications/real-time-interactive-snow-simulation-using-compute-shaders-in-di
71. Cordonnier et al. 2018: https://www.cs.purdue.edu/homes/bbenes/papers/Cordonnier18EG.pdf
72. IAHS/ICSIH snow-modelling overview: https://iahs.info/uploads/Commissions/ICSIH/ICSIH%20snow%20modeling%20article%20FINAL.pdf
73. Haglund, Andersson, Hast 2002, SIGRAD proceedings (probable location, not opened): https://ep.liu.se/ecp/007/ecp02007.pdf

**Godot, web platform and 2025–2026 developments**
74. Godot, "Dev snapshot: Godot 4.7 beta 1" (24 Apr 2026): https://godotengine.org/article/dev-snapshot-godot-4-7-beta-1/
75. Cinevva, Godot 4.7 released (19 Jun 2026, secondary): https://app.cinevva.com/news/2026-06-19-godot-4-7-released
76. CG Channel, Godot 4.7 (23 Jun 2026): https://www.cgchannel.com/?p=176830
77. DrawableTexture2D.xml: https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/DrawableTexture2D.xml
78. BlitMaterial.xml: https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/BlitMaterial.xml
79. "Using DrawableTextures" tutorial: https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/rendering/drawable_textures.rst ; https://docs.godotengine.org/en/4.7/tutorials/rendering/drawable_textures.html
80. GLES3 texture_storage.cpp (Compatibility blit support): https://raw.githubusercontent.com/godotengine/godot/master/drivers/gles3/storage/texture_storage.cpp
81. Godot 4.7 docs, renderers feature table: https://docs.godotengine.org/en/4.7/tutorials/rendering/renderers.html
82. Godot forum, GPUParticles2D collisions need LightOccluder2D: https://forum.godotengine.org/t/why-do-gpuparticles2d-collisions-rigid-hide-need-an-lightoccluder-to-work/64814
83. Godot forum, interactive snow shader issues (Aug 2025): https://forum.godotengine.org/t/interactive-snow-shader-issues/119668
84. Godot 4.5 release page: https://godotengine.org/releases/4.5/ (CG Channel: https://www.cgchannel.com/?p=170196)
85. Godot 4.6 release page: https://godotengine.org/releases/4.6/ (CG Channel: https://www.cgchannel.com/?p=173665)
86. web.dev, WebGPU in major browsers (25 Nov 2025): https://web.dev/blog/webgpu-supported-major-browsers
87. GodotCon Boston 2026, "Godot WebGPU" talk: https://talks.godotengine.org/godotcon-boston-2026/talk/CT739D/
88. godotshaders snow tag: https://godotshaders.com/shader-tag/snow
89. godotshaders, Multilayer Snowfall Shader: https://godotshaders.com/shader/multilayer-snowfall-shader/
90. Weather FX Free (Godot Asset Store): https://store.godotengine.org/asset/heyheythere/weather-fx-free/ ; AssetLib 5495: https://godotengine.org/asset-library/asset/5495
91. WeatherSystem2D: https://godotengine.org/asset-library/asset/5328 ; https://github.com/gregrylivingston/Godot4---Weather-System-2D
92. Vav Labs, Top-Down Water 2D: https://forum.godotengine.org/t/top-down-water-2d-for-godot-seafloor-depth-you-can-see-and-boats-that-run-aground/144236 ; https://vav-labs.com/blog/godot-2d-water-depth-maps-and-bathymetry/
93. GodotCon Amsterdam 2026, "Procedural Pixel Art: Retro VFX with Shaders": https://talks.godotengine.org/godotcon-ams-2026/talk/NSNXFT/
94. GodotCon Amsterdam 2026, "Changing the Mood": https://talks.godotengine.org/godotcon-ams-2026/talk/FKW3EB/

**Design, feel and artists**
95. saint11 (Pedro Medeiros), "How to start making pixel art #6": https://medium.com/pixel-grimoire/how-to-start-making-pixel-art-6-a74f562a4056
96. Lospec, winter palettes: https://lospec.com/palette-list/tag/winter (also https://lospec.com/palette-list/tag/ice)
97. Wikipedia, A Short Hike: https://en.wikipedia.org/wiki/A_Short_Hike
98. The Long Dark Wiki, Weather: https://thelongdark.fandom.com/wiki/Weather
99. Wilk Games, Tikus Tales footprints devlog: https://wilkgames.itch.io/tikus-tales/devlog/199972/creating-footprints-in-the-snow
100. Tapio Liukkonen, "Sounds of the Snow": https://gamedeveloper.com/audio/sounds-of-the-snow
101. YellowAfterlife, top-down bouncing loot (fake height): https://yal.cc/top-down-bouncing-loot-effects/

**Open-source gems**
102. OpenTTD repository: https://github.com/OpenTTD/OpenTTD
103. OpenTTD clear_cmd.cpp: https://github.com/OpenTTD/OpenTTD/blob/master/src/clear_cmd.cpp
104. OpenTTD landscape.cpp / landscape.h: https://github.com/OpenTTD/OpenTTD/blob/master/src/landscape.cpp ; https://github.com/OpenTTD/OpenTTD/blob/master/src/landscape.h
105. Andrew Baldwin, "Just snow" (Shadertoy ldsGDn): https://www.shadertoy.com/view/ldsGDn
106. libretro port of Just snow (licence header): https://github.com/libretro/glsl-shaders/blob/master/borders/resources/snow.glsl
107. Ghostty port of Just snow (presets): https://github.com/hackrdotsh/ghostty-shaders/blob/main/just-snow.glsl
108. godotshaders, "Let it snow!!!": https://godotshaders.com/shader/let-it-snow/
109. Flynsarmy/gd-snow-project: https://github.com/Flynsarmy/gd-snow-project

**Tiny code and demoscene**
110. SWAG Pascal snow (1994): https://swag.bttr-software.de/EGAVGA/0124.PAS.html
111. pouet, Snow64 by TAP: https://www.pouet.net/prod.php?which=22358
112. scene.org, Snow 1 Demo (xmas98 256b): https://files.scene.org/view/demos/compos/xmas98_256b/snow1.zip
113. ChibiAkumas forum, 8-bit starfield mechanics: https://chibiakumas.com/forum/viewtopic.php?p=533
114. Chris Wellons, stateless parallax starfield (2011): https://nullprogram.com/blog/2011/06/13/
115. Wikiwand, Color cycling: https://www.wikiwand.com/en/articles/Color-cycling
116. antirez, Fizzlefade: https://antirez.com/news/113

**Additional game examples**
117. DST API docs, worldstate: https://vietnd69.github.io/dst-api-webdocs/docs/api-vanilla/core/worldstate
118. Klei bug tracker, DST missing snow layer: https://forums.kleientertainment.com/klei-bug-tracker/dont-starve-together/cawnival-builds-have-no-snow-layer-during-winter-r35434/
119. Project Zomboid "Immersive Snow" mod: https://top-mods.com/mods/project-zomboid/gameplay/16435-immersive-snow.html
120. Animal Crossing Wiki, Animal Tracks (grass wear): https://animalcrossing.fandom.com/wiki/Animal_Tracks
121. matojeje, Snowy Trails devlog: https://matojeje.itch.io/snowy-trails/devlog/670340/about-the-game-mechanics
122. TheGamer, best-looking snow in games: https://www.thegamer.com/most-impressive-snow-physics-mechanics-in-games/

**Reference implementation**
123. Kingsfoil Studios, Snow Sandbox (`vfx-snow-sandbox.html`, this study's companion; local file, script read in full).
