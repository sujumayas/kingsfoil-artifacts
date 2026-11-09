# Top-down pixel acid: tiny algorithms for liquids that eat the world

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #2 in our VFX series. Each study takes one concept and hunts for old-school, very small and very efficient algorithms. Study #1 was **snow** [S2]: a per-pixel depth byte drawn through a dither threshold, an exposure mask, conserve-and-displace footprints, melt as `T × sun × shade × edge`, and lighting done through the palette. This study reuses those parts wherever acid allows.

The reference case is still the **DOOM PSX fire** [S1]. It is a buffer of palette indices in [0, 36] where every pixel copies the one below it minus `rand & 1`, with a random sideways step [V]. Sanglard notes that linear decay alone gives "a boring uniform output" [V, S1]. The lesson is the same as for snow: **one number per cell, one local rule, one palette.**

Acid is harder than snow because it is a *verb*: snow covers the world, acid **changes** it. It must flow and dry, eat materials at different speeds and be used up doing it, wear gear before flesh fairly, breed creatures made of the same stuff, and age the world into fumes, stains, salt and rust.

**Targets.** Godot 4, web-first, which means the **Compatibility renderer** (WebGL 2). Top-down pixel art for the Tibia-like MMORPG **Asterion Online** and for a top-down RPG with dungeons.

**Scope.** The study draws on nine research notes (history, systemic games, grid techniques, academic papers, 2025–26 news, design and art, open-source code, tiny-code tricks, extra games) and on our playable **Acid Sandbox** [S3]. Flesh is handled the way good games handle it: through status, numbers, tint and smoke, never wounds.

---

## 1. Executive summary

1. **Acid is one amount per cell plus flow with a film threshold.** Wet cells send a share of their surface height (acid + floor) to lower neighbours, and a cell thinner than a **film threshold** cannot wet dry floor. That one rule stops spreading and gives puddles crisp edges [I, from S119, S121; Sandbox `FILM = 0.3`, S3]. A floor heightmap (grout, drains) replaces gravity in top-down view [I]. Virtual pipes are the upgrade for sloshing [V, S123].
2. **Corrosion is a material table times concentration, and the reaction spends the acid.** Noita drives everything from tagged reaction rules with a probability [V, S81]. The Powder Toy gives acid 75 "life" and dissolves with probability `Hardness/1000`, spending 1 life per dissolve [V, S88]. Sandspiel spends 60 strength per dissolve [V, S89]. sand-slide eats with `EAT × (1 − acid_resistance)` [V, S91]. Ours: `damage = RATE[material] × concentration`, and the acid pays 55 % of that damage [V, S3]. Small spills stop on their own.
3. **Show visible stages, not health bars.** NetHack has used 3 named tiers per damage type since 1987, and only the worst counts [V, S15, S23]. In graphics terms, damage is an index into an ordered appearance ramp [V, S144]. Mérillou's random-walk front gives the *where*, with holes once depth passes the thickness [V, S141]. Draw stages through a Bayer threshold so they blend [I, S3].
4. **Armour before flesh, and temporary before permanent.** DOS2's acid strips physical armour first [V, S51]. XCOM 2's acid has the highest armour shred of any grenade [V, S58]. Angband armour absorbs acid but may be damaged [V, S24]. Modern DCSS uses only a **temporary, stacking** corrosion status: −4 AC per stack, 10 + 2d4 turns, stacking harder as it grows [V, S29]. Brogue warns before you hit an acid mound with an unprotected weapon [V, S30]. Players hate gear loss that is "sudden, random, permanent and unwarned" [V, S118; I]. Recommended: temporary debuff + capped, visible, repairable permanent stages + warnings.
5. **Slimes share the acid field.** Our Sandbox draws slime where `slimeField + 0.55 × acid ≥ 1`, so a slime melts into the puddle it crosses [V, S3]. The verbs are 40 years old: split on hit [V, S95, S21, S34], merge back [V, S36, S96], show items inside [V, S99, S100], eat items [V, S22, S97], burst into a pool [V, S98].
6. **Time turns acid into fumes, stains and rust.** SPD's gas rule is one line: average yourself and your open neighbours, then subtract 1 [V, S37]. That `−1` is free evaporation. Drying edges leave rings, as Dorsey's "deposit where moisture leaves" stone model suggests [V, S140; I]. Damaged iron rusts later, spreading from edges and scratches [I, from S141, S147]. Lime turns acid into a white salt crust [V chemistry, S163; I].
7. **Render old-school, then plan for Godot.** DOOM's nukage loops 3 frames at 8 tics with damage every 32 tics [V, S7]; Quake warps texels with a sine table [V, S8]; palette cycling animates without rewriting pixels [V, S169]; glow is acid summed into 8×8 blocks, blurred, and chosen per pixel through Bayer [V, S3]. Godot 4.7 (19 Jun 2026) adds `DrawableTexture2D`, implemented in the Compatibility driver [V, S183, S189]. Use a CanvasGroup threshold for slimes [I]. **No compute on web** [V, S191]: gameplay stays on the CPU and server; pixel detail is cosmetic [I].

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: source code, paper PDF, docs page, wiki or article. "[V-secondary]": read via a reliable restatement or mirror. "[V, vendor]": developer-, vendor- or speaker-reported figure. |
| **[I]** | Author inference or design proposal. Untested unless it says "Sandbox", and then tested only in our JavaScript prototype. |
| **[U]** | Unverified: from memory, a search-result title, or an unconfirmed community source. Treat it as a lead. |
| **[K]** | Established textbook or canonical-paper knowledge, with its reference. |

- [S#] refers to §14.
- Ratings (1–5) are author judgement for top-down pixel art on web Godot. The order is fixed: **Simplicity · Speed · Pixel taste · Reactivity** (how much the world responds) **· Fairness/Readability**.
- "Estimated" costs come from operation counts, not benchmarks.
- Numbers marked "Sandbox run" come from replaying the Sandbox's own `simStep()` headless at 60 steps per second. They are illustrative and depend on its constants.

---

## 3. Generations: a timeline

**Gen 0: science precursors (1981–1999).**
- 1981: Witten & Sander's diffusion-limited aggregation [V, S157].
- 1982: Blinn's "blobby" density sum with an iso-threshold, the origin of metaballs [V, S130].
- 1986: Wyvill's soft objects with finite-radius falloff [V, S131].
- 1991–93: reaction-diffusion textures and Pearson's dividing spots [V, S153–S155].
- 1995–99: column-and-pipe water, metallic patinas, flow stains, weathered stone, stable fluids [V, S127, S139, S146, S140, S128].

**Gen 1: animated floors and damage flags (1986–1996).**
- 1986: Metroid's acid pools; Zelda's Zol splits into Gels; Dragon Quest's slime [V, S13, S95, S102].
- 1993–94: DOOM's NUKAGE1–3 and DOOM II's SLIME01–12, with 5/10/20 damage floors [V, S5, S7].
- 1996: Quake's turbulent liquid warp; Duke Nukem 3D's acid floors, Protective Boots and Episode 4 Hyper Acid [V, S8, S11].

**Gen 2: roguelike item erosion (1987–2015).**
- 1987: NetHack's rust/corrode/burn/rot tiers, passive acid splash, black pudding division [V, S15, S21].
- 1990: Angband destroys inventory with acid and lets armour absorb it [V, S24].
- Ultima V–VII: slimes split and recombine [V, S36]. Brogue: −1 enchant per acid hit [V, S30, S32].
- 7 Apr 2015: DCSS trunk adds heavily corroding entropy weavers [V, S28]. DCSS later keeps corrosion only as a temporary status [V, S29].

**Gen 3: surfaces, goop and puddle systems (2009–2023).**
- 2009: PixelJunk Shooter renders fluids into an off-screen texture plus one shading pass [V, S76].
- 2015: Splatoon makes coverage the score [V, S74].
- 2016: Enter the Gungeon's goop (12 types, ignite/freeze/electrify) and XCOM 2's acid shred [V, S46, S58].
- 2017: Divinity: Original Sin 2's surfaces, where acid is *cursed poison* [V, S50].
- 2018: Into the Breach's A.C.I.D. tiles and statuses on a pixel grid [V, S54].
- 2019: Monster Hunter World: Iceborne's Acidic Glavenus pools [V, S70]. 2021: Aliens: Fireteam Elite's acid death puddles [V, S73].
- 2022: Elden Ring's Scarlet Rot swamps and coatings [V, S64]. 2023: Baldur's Gate 3's −2 AC acid surface [V, S52].
- Also undated in our notes: Isaac's creep, Factorio's spitter puddles, Path of Exile's caustic ground, Don't Starve Together's acid rain [V, S49, S61, S63, S66].

**Gen 4: per-pixel material simulations (2009–2020).**
- 2009: w-shadow's simple compressible-water CA [V, S119].
- The Powder Toy: 15+ years of community development; ACID with life and hardness [V, S88].
- Sandspiel grows from a 2015 100×100 JS prototype to a 300×300 WASM toy [V, S90].
- 2019 (GDC) / Oct 2020 (1.0): Noita, with 64×64 dirty chunks and reaction tables [V, S85, S81].

**Gen 5: academic weathering (2001–2016).**
- 2001: Mérillou's corrosion random walk; Paquette's impact aging [V, S141, S148].
- 2004: Bosch's scratches; Desbenoit's lichen by open DLA [V, S147, S150].
- 2005: γ-ton tracing [V, S142]. 2006: appearance manifolds and time-varying appearance (STAF) [V, S144, S145].
- 2007: context-aware textures; Mei's GPU virtual pipes [V, S151, S123]. 2008: Mérillou's aging survey [V, S143].
- 2010: Jones' Physarum transport networks [V, S158]. 2016: weathering in texture space [V, S152].

**Gen 6: 2025–2026.**
- 2 Apr 2025: Enter the Gungeon 2 is announced, in **3D** [V, S220].
- 2 Jun 2025: godotshaders "Goo" (MIT, 3D) [V, S208].
- 23 Sep 2025: Slime Rancher 2 1.0; no new goo hazards described [V, S105].
- 2025: Hollow Knight: Silksong's maggot water drains silk and blocks healing instead of hurting [V, S214–S216]. Patch 4 eases it (article 10 Nov 2025) [V, S217].
- 30 Jan 2026: PR #105701 "Implement DrawableTextures" merged [V, S188].
- 10 Feb 2026: Mewgenics on PC [V, S219].
- 12 Apr 2026: ProfesorShader's CC0 "Dynamic Animated Liquid Texture", a DrawableTexture2D wet-map flow sim [V, S200].
- 23 Apr 2026: GodotCon Amsterdam talk on retro pixel VFX with SubViewport feedback loops [V, abstract, S194].
- **19 Jun 2026: Godot 4.7 stable with DrawableTexture2D** [V, S183, S184].
- 21 Jul 2026: experimental Godot WebGPU backend, ~4× WebGL [V, speaker-reported, S193].
- 7 Oct 2026: Powdered World Engine v1.0 (Godot 4.7, C# only, has Acid) [V, S93].
- Still missing: a 2025–26 headline game with spectacular item corrosion [V/I, S214–S220].

---

## 4. Technique profiles

The profiles fall into six families:
- **A**, acid as a liquid and a surface;
- **B**, material corrosion;
- **C**, equipment and flesh;
- **D**, creatures;
- **E**, time and chemistry;
- **F**, rendering and taste.

Ratings: Simplicity · Speed · Pixel taste · Reactivity · Fairness/Readability (1 = poor, 5 = excellent, author judgement).

### Family A: Acid as a liquid and a surface

### A1. Animated tile plus a damage flag (the DOOM floor)

*In plain words.* Two separate, very cheap systems sit on the same tile. A 3–4 frame loop makes it look like bubbling sludge. A flag on the tile says "this hurts", and a global clock applies the damage. The art never decides the damage; the flag does.

*How it works (technical).* From DOOM's `p_spec.c` [V, S7]:
- Animated flats NUKAGE1–3, FWATER1–4, LAVA1–4, BLOOD1–3 and SLIME01–04/05–08/09–12 all run at **8 tics per frame**, with `pic = basepic + ((leveltime/speed + i) % numpics)`.
- Damage applies only when the player is on the floor and only when `!(leveltime & 0x1f)`, i.e. every **32 tics**. Special 7 (nukage) = 5, special 5 (hellslime) = 10, specials 16/4 = 20, special 11 = 20 and exits the level at low health.
- The radiation suit blocks damage, but 20-damage floors leak when `P_Random() < 5`.
- Damage is checked against *global* level time, so a quick dash may take 0 or 1 hit; the flat's look never decides damage [V, S4].

At 35 tics/s this is a ~4.4 fps flipbook and a ~0.91 s damage period, about 5.5 HP/s for nukage [I, S7]. For a tilemap:
```
frame = (tick / 8 + tile_phase[t]) % n_frames                  // per tile, render only
if (tick & 31) == 0:                                           // one global clock
  for actor on tile with hazard h > 0:
    if !actor.acid_boots or (h == STRONG and rand8() < 5): actor.hp -= DMG[h]   // 5 / 10 / 20
```

*Cost / performance.* Zero per pixel. One AND per tick plus one lookup per actor on a hazard tile [I].

*Games that used it.*
- DOOM / DOOM II: https://doomwiki.org/wiki/Damaging_floor , https://doomwiki.org/wiki/Animated_flat
- Duke Nukem 3D (boots, purple Hyper Acid): https://www.ludo.guide/guide/duke-nukem-3d/02-04-11-environmental-damage-sources
- Metroid series (fake acid in Kraid's Lair; suit immunity): https://metroid.fandom.com/wiki/Acid
- Hollow Knight (acid gates areas until Isma's Tear): https://hollowknight.wiki/w/Isma%27s_Tear

*How it feels.* Instantly readable and retro. The rare suit leak keeps strong floors scary; fake acid and immunity items add tension and progression [I, S13, S14].

*Risks.* Decoupled look and damage can mislead (DOOM's sludge flats are usually harmless [V, S4]). Tiles animating in sync look mechanical; offset phases [I]. DOOM's IWAD textures are not covered by its GPL code licence [I, S7].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 1 · Fairness/Readability 4

### A2. Zero-sim living surface: Quake turbulence and palette cycling

*In plain words.* Make the pool move without simulating anything. Either wobble the texture with a sine table (Quake), or rotate a few palette entries so the pixels appear to flow (Mark Ferrari's colour cycling).

*How it works (technical).*
- **Quake software path** (`D_DrawTurbulent8Span`) [V, S8]: `sturb = ((s + turb[(t>>16)&(CYCLE-1)])>>16)&63`, and the same for `tturb` with s and t swapped. Constants: `TURB_TEX_SIZE 64`, `CYCLE 128`, `AMP 8·0x10000`, `SPEED 20`. The table is `sintable[i] = AMP + sin(i·2π/CYCLE)·AMP`, and animation just slides the table pointer: `turb = sintable + ((int)(cl.time*SPEED) & (CYCLE-1))`.
- **Quake GL path** [V, S8, S9, S10]: a 256-entry `turbsin` table (8·sin, ±8), indexed by `(ot*0.125 + realtime)*TURBSCALE & 255`, scaled by 1/64.
- **Canvas Cycle** (Huckaby's HTML5 port of Mark Ferrari's art) [V, S169]: ranges `{rate, reverse, low, high}`, modes standard, reversed, ping-pong and sine sway; "BlendShift" cross-fades neighbouring entries so slow cycles glide; only pixels using cycled indices are rewritten.
- **Plasma** [V, S172]: precompute a sum of sines once, then index `palette[(plasma + shift) % 256]` each frame.

Pixel-art version [I, from S8 and note 08]:
```glsl
// idx_tex: R8 palette indices of the pool art; pal: 1-row LUT
vec2 px = floor(UV * TEX_SIZE);
px += floor(vec2(sin(px.y*0.4 + TIME*2.0), sin(px.x*0.4 + TIME*2.0)) * 1.0 + 0.5); // ±1 px, quantised
int i = int(texelFetch(idx_tex, ivec2(px), 0).r * 255.0);
if (i >= CYC_LO && i <= CYC_HI) i = CYC_LO + (i - CYC_LO + int(TIME*RATE)) % (CYC_HI-CYC_LO+1);
COLOR = texelFetch(pal, ivec2(i, 0), 0);
```
The Sandbox uses a third, related trick: a two-sine "sheen" `w = sin(x·0.35 + t·1.7 + sin(y·0.3 + t·0.9)·1.6) + sin((x+y)·0.21 − t·1.3)` that swaps deep acid to the light colour above 1.5 and to the highlight above 1.8 [V, S3].

*Cost / performance.* Quake's warp is 2 table lookups, 2 adds and 1 fetch per pixel, with a 128-int table; the table slides 20 entries/s, so a full cycle takes ~6.4 s [I, S8]. Palette cycling costs nothing per pixel on indexed hardware, and one extra fetch in a shader [I].

*Games that used it.* Quake: https://www.quakewiki.net/quakesrc/10.html ; Mark Ferrari's Living Worlds via Canvas Cycle: https://experiments.withgoogle.com/canvas-cycle

*How it feels.* Alive and painterly at nearly zero cost. Slynyrd's water loops are 6 frames, and its ripples loop over 2 s, which is the right pacing for acid sheen [V, S109].

*Risks.* Unquantised offsets shimmer [I, note 08]. Palette cycling needs authored index ramps and ignores the player. Plasma needs a narrow palette [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Reactivity 1 · Fairness/Readability 3

### A3. One amount per cell, flow with a film threshold, and drains

*In plain words.* Every pixel (or small cell) stores how much acid is on it. Wet cells push acid toward lower neighbours, where "lower" means the floor height plus the acid already there. A very thin film cannot wet dry floor, so puddles stop spreading and keep crisp edges. Low grout lines and trenches steer the acid like gutters.

*How it works (technical).* The family tree:
- **w-shadow's CA** (2009) [V, S119]: `MinMass = 0.0001` counts as dry; side flow `(mass − neighbour)/4`; double-buffered so scan order doesn't bias flow.
- **DwarfCorp** [V, S121]: a level byte 0–255 plus a flow vector; only wet cells are visited; evaporate below a threshold, then give random amounts to neighbours.
- **Minecraft** [V, S122]: levels 0–7; flow prefers the nearest drop within 5 blocks.
- **Virtual pipes** (Mei, Decaudin & Hu 2007, after O'Brien & Hodgins 1995) [V, S123, S124, S127]: store a flux per edge, `f = max(0, f + Δt·A·g·Δh/l)`, scale all outflows by `K = min(1, d·lx·ly/(Σf·Δt))` so a cell never goes negative, then `d += Δt·(in − out)/(lx·ly)`. lisyarus stores flow, not velocity, with friction `(1−friction)^dt` [V, S125]. ProfesorShader's CC0 Godot shader runs the same idea on two ping-pong DrawableTexture2Ds (R = amount, G = velocity, `velocity_keep = 0.998`) [V, S200].

**The Sandbox rule** [V, S3] (one `Float32Array(320×180)`, bounding box of the wet area only):
```
for each cell i with a = A[i] >= 0.004:
  h = a + FH[i]                                      // surface = acid + floor height
  for each open 4-neighbour j:
    d = h - A[j] - FH[j]
    if d > 0 and (a > FILM or A[j] > 0.004): f[j] = d; s += d   // FILM = 0.3: thin film can't wet dry floor
  k = min(0.2, a*0.9/s)                              // never send more than 90 % of what you hold
  dA[i] -= s*k;  dA[j] += f[j]*k                     // double-buffered via dA
```
**Drains and guidance.** Floor height is `FH = 0.035 + tile_random·0.03` per 16-px tile, grout lines sit at 0.03, and a drain trench at −0.02 runs from x = 200 to the iron gate [V, S3]. Acid therefore creeps into the grout grid first, which reads as seeping [I, note 03]. Note 03 adds a 0–8 roughness noise to the height so puddles freeze into irregular blobs rather than Minecraft diamonds [I].

**Sandbox run.** A spill of radius 10 (289 acid units on 317 px) covers 596 px after 1 s, 866 px after 5 s and **917 px (≈3.6 floor tiles, mean depth 0.29) after 10 s, then stops**: the film rule freezes the outline [I, Sandbox run].

*Cost / performance.* ~5 reads per wet cell: an estimated 0.4–1.2 ms per 64×64 chunk in typed GDScript, 0.02–0.06 ms in JS [I, extrapolated from S138]. Jákó measured pipes at 25.7 ms CPU vs 0.295 ms GPU on 128² [V, S124].

*Games that used it.* Noita: https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/ ; DwarfCorp: https://www.gamedeveloper.com/programming/how-water-works-in-dwarfcorp ; Minecraft: https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Fluid

*How it feels.* The single biggest step from "decal" to "liquid". Puddles find low ground, creep along grout and pool at gates [I, Sandbox].

*Risks.* Pure `/4` equalisation makes diamonds; without a film threshold acid smears forever. "Move-into-cell" rules don't port to fragment shaders; only gather rules (pipes, diffusion) do [I, note 03].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 5 · Reactivity 5 · Fairness/Readability 4

### A4. Surface types and goop grids with combination rules

*In plain words.* Each tile (or sub-tile cell) holds a surface type, such as water, oil, poison or acid, plus a few flags. A small table says what happens when types meet or when fire, ice or lightning arrives. Acid becomes one row in a living chemistry set.

*How it works (technical).*
- **Enter the Gungeon** [V, S46]: 12 goop types; only water freezes and electrifies; five goops ignite. Fire "spreads quickly through the pool", ice until the pool is frozen, electricity **instantly** across the connected pool (10 DPS to enemies, half a heart to players). Lanterns don't ignite goop, a deliberate restraint.
- **Divinity: Original Sin 2** [V, S50, S51]: base surfaces times Blessed/Cursed variants. **Cursed Poison is the acid**: it applies Acid (strips physical armour every turn) plus Poisoned. Necrofire cannot be put out by water.
- **Into the Breach** [V, S54]: ACID doubles weapon damage taken. An ACID pool affects the first unit that stops on it and then becomes ground. Units that die with ACID leave a pool. Water cures a unit, but the water tile *becomes* an ACID tile. Cryo makes frozen ACID. Buildings are immune.
- **Baldur's Gate 3** [V, S52]: −2 AC while standing in acid; acid created over blood does not apply the condition (a priority rule).
- **Cataclysm: DDA** [V, S39]: `fd_acid` has 3 intensities (splatter, streak, pool), a 2-minute half-life, faster decay underwater, and merges as `min(3, a+b)` with the overflow extending its life.

Two propagation speeds are the key design lever [I, from S46]:
```
tile: { liquid: NONE|WATER|OIL|ACID|FROZEN_ACID, level: 0..3, flags: IGNITED|ELECTRIC|CURSED, age }
on_shock(t):   for c in flood_fill_same_liquid(t): c.flags |= ELECTRIC      // instant, whole pool
on_fire tick:  for c with IGNITED: ignite random flammable 4-neighbour      // gradual front
water enters acid: (acid).level += water.level; conc down; ITB rule: unit cured, tile becomes acid
```

*Cost / performance.* One or two bytes per tile; flood fills are O(pool size) and rare [I].

*Games that used it.* Enter the Gungeon: https://enterthegungeon.wiki.gg/wiki/Goop ; DOS2: https://dos2.wiki/wiki/Acid_(Status) ; Into the Breach: https://www.ludo.guide/guide/into-the-breach/game-mechanics ; BG3: https://bg3.wiki/wiki/Acid_(surface) ; CDDA: https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/field_type.json

*How it feels.* This is the "feels alive" multiplier. DOS2 gets dozens of surfaces from about 6 bases and 4 modifiers [I, note 02, from S50]. Players love acid here because it **changes what is possible**, not because of its damage [I, note 02].

*Risks.* Combinations explode; keep a written priority order (BG3's blood rule). Levels can self-destruct, which is why Gungeon's lanterns don't ignite goop. Surprising conversions (water turning into acid) need a clear visual [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Reactivity 5 · Fairness/Readability 4

### A5. Puddle decals with a lifetime, and splash stamps

*In plain words.* Spawn a puddle object where acid lands. It hurts or slows whoever stands in it and disappears after a fixed time. A cheap random stamp gives the splash a natural shape.

*How it works (technical).*
- **Isaac's creep** [V, S49]: one puddle sprite recoloured per type, owned by a team; hostile creep **flickers rapidly** and vanishes after the room is cleared.
- **Factorio spitters** [V, S61]: 0.6 attacks/s; every puddle lasts **32 s** and slows for 2 s.

  | Spitter | Hit | Splash size | Puddle DPS | Slow |
  |---|---|---|---|---|
  | Small | 12 | 1 | 7.2 | 60 % |
  | Medium | 24 | 1.25 | 28.8 | 50 % |
  | Big | 36 | 1.35 | 130 | 40 % |
  | Behemoth | 60 | 1.75 | 360 | 30 % |

- **XCOM 2** [V, S56, S57]: splashes last **3 turns**; Acid Burn deals 1–3 per turn for 2 turns; leftover acid "may destroy cover on the following turns".
- **Path of Exile** [V, S63]: on-death clouds last 3,000 ms (radius 12) or 6,000 ms (radius 16); Siegebreaker minions deal 20 % of their max Life per second.
- **CDDA acid spit** [V, S39]: in a 7×7 box, each cell with a clear path gets intensity 2 if `one_in(|i|) && one_in(|j|)` (always at the centre). Brogue's `ACID_SPLATTER` spreads with start probability 200, minus 25 per generation [V, S32].
```
for i in -3..3, j in -3..3:                     // CDDA-style splash, cross-biased
  if clear_path(c, c+(i,j)) and one_in(abs(i)) and one_in(abs(j)): acid[c+(i,j)] += 2
```

*Cost / performance.* O(puddles) per tick. Nothing per pixel beyond drawing a sprite [I].

*Games that used it.* Isaac: https://bindingofisaacrebirth.wiki.gg/wiki/Creep ; Factorio: https://wiki.factorio.com/Spitters ; XCOM 2: https://xcom.fandom.com/wiki/Acid_Grenade_(XCOM_2) ; Path of Exile: https://poedb.tw/us/Caustic_ground ; Risk of Rain 2: https://riskofrain.wiki.gg/wiki/Acrid_(RoR2)

*How it feels.* Clear and arcade-like; death puddles make *where* you kill matter [I, S73]. Two lifetimes work well: 3 turns on a grid, about 30 s in real time [I, note 09].

*Risks.* Decals don't flow, stain or remember. Overlapping puddles stack damage unless capped. Long lifetimes clutter the map [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 2 · Fairness/Readability 5

### A6. Ripple buffer for splashes and bubble pops

*In plain words.* Keep two small height grids over each pool. A footstep, a dropped item or a popping bubble pokes the grid, and rings spread out and bounce off the pool's edge. The rings nudge pixels by ±1 and shift colours by ±1 palette step.

*How it works (technical).* Hugo Elias' algorithm, as reproduced by Microsoft's Silverlight sample [V-secondary, S177]:
```
B2[x,y] = (B1[x-1,y] + B1[x+1,y] + B1[x,y-1] + B1[x,y+1]) / 2 - B2[x,y]
B2[x,y] *= 0.94                     // Elias' damping
swap(B1, B2)
xo = h[x-1,y] - h[x+1,y];  yo = h[x,y-1] - h[x,y+1];  shade = (xo - yo)/2
colour = tex[x+xo, y+yo] + shade
```
Matyka found that seeding a single pixel gives a "really ugly picture", so seed a 3×3 block [V, S178]. For pixel art, clamp offsets to ±1 px and turn `shade` into ±1 palette index. Treat cells outside the acid mask as walls, so rings reflect off the puddle's edge [I, note 08]. A common integer damping is `h -= h >> 5` [U].

*Cost / performance.* About 5 adds and a shift per cell to simulate, 2 subtractions and a fetch per pixel to render. Two int16 buffers: 16 KB for a 64×64 pool [I, note 08].

*Games that used it.* Our notes found no shipped acid game documented with this technique. Reference implementations: https://learn.microsoft.com/en-us/archive/blogs/nikola/building-the-reallistic-water-ripples-sample-in-silverlight and https://maciejmatyka.blogspot.com/2018/03/2d-water-algorithm.html . The Sandbox does not implement it yet.

*How it feels.* Note 08 ranks it the best "reactive" effect per operation [I]. Every step into a pool is acknowledged.

*Risks.* Smooth shading breaks the palette unless quantised. Large lakes cost area; run it only on visible pools [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Reactivity 5 · Fairness/Readability 3

### Family B: Material corrosion

### B1. Reaction table with probabilities

*In plain words.* Write corrosion as data: "acid touching *this kind of thing* turns into *that*, with *this* chance per tick". Tags let one rule cover many materials, and a short list of exceptions makes the world readable.

*How it works (technical).*
- **Noita** [V, S81]: `<Reaction input_cell1 input_cell2 output_cell1 output_cell2 probability …/>`, plus options such as `blob_radius` and `ExplosionConfig`. Inputs can be tags such as `[corrodible]`; the per-tick meaning of probability is undocumented. Acid rules [V, S80]: Acid + corrodible → Acid + Flammable Gas (50); Acid + Air → Flammable Gas + Air (10); Purifying Powder + Acid → Water (80); Frozen Acid + Fire → Acid (90). Immune: glass, dense rock, extremely dense rock, wood of the great tree, lava, magical liquids [V, S79].
- **sand-slide** (Godot, MIT) [V, S91]: every element implements `get_acid_resistance()` ∈ [0, 1]. Acid moves into a neighbour with probability `EAT × (1 − resistance)`, `EAT = 1/16`; the vacated cell becomes acid gas with `EMIT = 1/64`; touching Base with `MIX = 1/2` turns it into water.
```
for each acid cell c, each neighbour n:                  // 4 Hz is plenty (note 03)
  m = MAT[n]
  if rand() < m.p * conc[c] * dt_scale:
     integrity[n] -= m.loss;  conc[c] -= m.acid_cost;  gas[c] += m.gas;  spawn(m.cue, n)
```

*Cost / performance.* One random number per wet contact per tick; trivial at tile or sub-tile resolution [I].

*Games that used it.*
- Noita: https://noita.wiki.gg/wiki/Documentation:_Reaction
- sand-slide: https://github.com/kiwijuice56/sand-slide
- The Powder Toy: https://github.com/The-Powder-Toy/The-Powder-Toy/blob/master/src/simulation/elements/ACID.cpp

*How it feels.* Probability makes acid eat irregularly instead of wiping a wall uniformly [I, note 02].

*Risks.* Per-tick odds change with tick rate; specify per second. Exceptions must be taught [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Reactivity 5 · Fairness/Readability 3

### B2. Acid that gets used up

*In plain words.* Every bite costs the acid something. A splash eats a little and stops; only a flood eats a door.

*How it works (technical).*
- **The Powder Toy** [V, S88]: acid starts with `life = 75`. Each frame it scans 5×5 neighbours. If `life > 50`, the dice pass `chance(Hardness, 1000)` and glass does not protect the target, it kills the target, loses 1 life and heats up by `max(0, (60 − Hardness)·7)`. At `life ≤ 50` it dies on touching anything else, so it gets ~25 dissolves. Two random acid neighbours equalise half their life difference each frame, so strength spreads through a pool.
- **Sandspiel** [V, S89]: acid spawns with `ra = 100 + rand(0..50)`; each dissolve costs 60 and it vanishes below 80, so a pixel eats 1–2 cells. Walls are immune.
- **Into the Breach**: a pool is consumed by the first unit that stops on it [V, S54].
- **Our Sandbox** [V, S3]: `damage = RATE[m] × min(1, acid) × 0.0035 × mul × (0.5..1.5)`, and the source cell loses `0.55 × damage`. So every material spends the same **0.55 acid units per unit of integrity**; `RATE` only sets the speed [I, derived].
- Noita is the exception: its acid survives the corrodible reaction and limits itself only by evaporating [V, S80].

*Cost / performance.* One subtraction per reaction [I].

*Games that used it.* The Powder Toy (link in B1); Sandspiel: https://github.com/MaxBittker/sandspiel ; Into the Breach: https://www.ludo.guide/guide/into-the-breach/game-mechanics

*How it feels.* An "alive, then calm" arc: a burst of fizz, then a flat stain [I, note 03]. Mérillou's corrosion law `w = k·tⁿ` with n ≈ 0.5 has the same front-loaded shape [V, S141].

*Risks.* Too fast, and acid feels weak; too slow, and the map eats itself. Noita-style non-consuming acid digs forever [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 4 · Fairness/Readability 4

### B3. Integrity → colour stage through a dithered threshold

*In plain words.* Each object pixel has an integrity from 1 (clean) to 0 (gone). Integrity picks one of 3–4 hand-made colour stages. A Bayer pattern decides which pixels change first, so stages bleed into each other instead of popping.

*How it works (technical).*
- Appearance manifolds order the looks of a weathering material and render any moment as a position along that order [V, S144]. STAF splits time into a shared curve plus per-pixel rate and offset: `look(x,t) = ramp(curve(rate(x)·t − offset(x)))` [V, S145; I]. Bellini et al. recommend authoring only end states and generating the middle [V, S152].
- **Sandbox** (`matIdx`) [V, S3]:
```
si = floor((1 - q)*3.3 + (bayer4x4[x&3][y&3] - 7.5)/16 * 0.9);  si = clamp(si, 0, 3)
if q < 0.15 and hash(x,y) < (0.15 - q)*7: HOLE                      // holes open gradually
if iron and si == 1 and hash < 0.30: PIT colour (#363b44)            // dark pits
if iron and si == 2 and hash < 0.45: SALT colour (#c0dba0)           // pale green salts
colour = STAGE[material][si][role]                                   // role = light / mid / dark pixel
```
Without dither the stage boundaries sit at q ≈ 0.70, 0.39 and 0.09; the dither spreads each by about ±0.13 [I, arithmetic].

*Cost / performance.* One compare and one lookup per pixel [I].

*Games that used it.* NetHack's three named tiers are the text-mode ancestor: https://nethackwiki.com/wiki/Erosion . Our Sandbox shows the pixel version: `vfx-acid-sandbox.html`.

*How it feels.* Readable at 16×16 and it tells a story: shine, pits, salts, holes [I, Sandbox].

*Risks.* Stages must be authored per material (4 ramps × 3 roles each in the Sandbox). Colour-only stages fail colour-blind players; add pits and holes as shape cues [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Reactivity 3 · Fairness/Readability 5

### B4. Corrosion fronts: Mérillou pitting and solids eaten from the wet edge

*In plain words.* Corrosion does not happen everywhere at once. It starts at seeds (scratches, edges) and creeps outward one pixel at a time. Thick, solid things are eaten only where acid actually touches them, so the hole advances as acid flows into it.

*How it works (technical).*
- **Mérillou, Dischler & Ghazanfarpour 2001** [V, S141]: seeds appear with probability ∝ area × k_str (scratches, > 1) × k_gr (grease, < 1) × k_ext. A front pixel corrodes a random non-corroded 8-neighbour; a pixel surrounded by corrosion deepens instead; depth beyond the thickness becomes a **hole**. Mass loss follows `w(t) = k·tⁿ` (medium corrosivity k = 274.6, n = 0.516), with an empirical **pitting factor ×10**. The authors call it "not a fully physical model".
- **Sandbox** [V, S3]: solid pixels (crates, barrels, bars, tables) react only with wet 4-neighbours at `mul = 0.6`. A destroyed pixel turns into floor, gets a +60 stain scar, and acid flows into it, so the front advances.
- **CDDA terrain** [V, S39]: glass wall → floor; closed door 1/3 → broken; metal bars → floor ("The metal bars melt!"). **Qud**'s gas hits walls 50× harder than creatures at level 1 [V, S44].
```
every corrosion tick:
  for px in front:                                      // exposed AND wet pixels only
    if all 8 neighbours corroded: depth[px] += δ        // deepen (pitting)
    else: corrode(random_uncorroded_8_neighbour(px))
    if depth[px] > thickness[px]: make_hole(px); add_neighbours_to_front(px)
```

*Cost / performance.* O(front length), a few dozen operations per item per tick [I, note 04]. **Sandbox run:** pouring acid into the drain for 20 s dissolves all 54 iron pixels of the gate within ~30 s [I, Sandbox run].

*Games that used it.* CDDA: https://github.com/CleverRaven/Cataclysm-DDA/blob/master/src/map.cpp ; Caves of Qud: https://wiki.cavesofqud.com/wiki/Acid_gas ; Noita (half a flask digs the thinnest Holy Mountain wall): https://noita.fandom.com/wiki/Acid

*How it feels.* Ragged, organic and inevitable: holes first, then thinning [I]. Acid becomes a tool for opening routes.

*Risks.* Square-grid random walks look anisotropic [I, note 04]. Edible walls need level design and server authority [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 5 · Reactivity 5 · Fairness/Readability 3

### B5. Rust after exposure

*In plain words.* Once the acid is gone, damaged iron starts to rust. It begins at the damaged pixels and slowly spreads to neighbouring iron, so a corroded sword or gate keeps telling its story for minutes.

*How it works (technical).*
- NetHack keeps rust and corrosion as separate tracks; only iron rusts, and copper or iron corrodes [V, S23].
- Note 03 proposes a 1 Hz rust CA seeded where integrity < 255, with chance `0.02 + 0.05·rusty_neighbours` [I].
- **Sandbox** [V, S3], 2,500 random pixels sampled per step:
```
if iron and q < 0.985 and dry(i, i-1, i+1):
  if rand() < 0.06*(1.15 - q): rust[i] += 3
  if rust[i] > 150 and rand() < 0.03: rust[random iron 4-neighbour] += 14     // spread
  if rust[i] > 220: q -= 0.0002                                             // rust keeps eating, slowly
draw rust colour where rust > bayer*12 + 30
```
- Dorsey & Hanrahan's patina verbs give the design: coat (acid), erode (wear), polish (a whetstone resets) [V, S139; I].

*Cost / performance.* Sampled, so it costs the same whatever the map size [I].

*Games that used it.* NetHack: https://nethackwiki.com/wiki/Rust ; Noita has a Rusted Metal material (page not read): https://noita.wiki.gg/wiki/Rusted_Metal

*How it feels.* **Sandbox run:** a chestplate with 39 acid-damaged pixels shows its first rust ~2 minutes after drying, 43 at 10 minutes (by then spreading to 11 clean neighbours), and 50 by ~25 minutes [I, Sandbox run]. The world remembers.

*Risks.* Rust that keeps lowering integrity after the danger is over can feel unfair; show it, or make it cosmetic on player gear [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Reactivity 4 · Fairness/Readability 3

### B6. Integrity-driven dissolve: burn edge, Bayer and fizzlefade

*In plain words.* When something is being eaten, draw a bright acid rim at the edge of what remains, and let pixels drop out in a stable pattern rather than a fade.

*How it works (technical).*
- **"2D dissolve with burn edge"** (mreliptik, CC0, Godot 4 `canvas_item`) [V, S201]: alpha × `smoothstep(n − bs, n, dissolve_value)`, colour pushed toward `burn_color` in a band `burn_size` ≈ 0.04 wide.
- **Pixel variant** [I, note 03]: replace the global `dissolve_value` with the per-pixel integrity texture from B3/B4, sample noise at texel resolution, and use `step` instead of `smoothstep` for hard edges:
```glsl
float e = texture(integrity_tex, UV).r - texture(noise_tex, floor(UV*SIZE)/SIZE).r*0.25;
if (e < 0.0) discard;
c = mix(c, c*0.6, step(e, 0.55));  c = mix(c, acid_rim.rgb, step(e, 0.08));
```
- **Fizzlefade** (Wolfenstein 3D) [V, S179]: a 17-bit LFSR, XOR 0x00012000, seed 1, period 131,072, visits every pixel exactly once. **Ordered dither** [V, S180]: the threshold matrix is fixed to the frame, so it "jitters less" than error diffusion. Visible iff `integrity > bayer4x4[x&3][y&3]` [I; matrix K, S2].

*Cost / performance.* 2–3 texture samples per sprite pixel [I].

*Games that used it.* Wolfenstein 3D's fizzlefade: https://fabiensanglard.net/fizzlefade ; Godot shaders: https://godotshaders.com/shader/2d-dissolve-with-burn-edge/ ; the GodotCon 2026 retro-VFX talk covers burn and dissolve on pixel sprites: https://talks.godotengine.org/godotcon-ams-2026/talk/NSNXFT/

*How it feels.* Crisp and iconic, and honest when driven by the simulation [I].

*Risks.* `smoothstep` edges and bilinear noise smear pixel art. A canned `dissolve_value` animation ignores where the acid really touched [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Reactivity 3 · Fairness/Readability 4

### Family C: Equipment and flesh

### C1. Erosion tiers (NetHack)

*In plain words.* Each item has a small counter per damage type, 0–3. Each level costs 1 point of damage or armour. Only the worst counter applies. Grease, blessings and "proofing" protect, and oil repairs.

*How it works (technical).* From NetHack 3.7 [V, S23] and the wiki [V, S15, S17]:
- `MAX_ERODE 3`. Corrosion (copper, iron) writes the secondary counter; rust and burn write the primary. Names run "corroded / very corroded / thoroughly corroded".
- `erode_obj()` order: grease absorbs it → not vulnerable → erodeproof, or blessed and passing a luck roll (`!rnl(4)`) → increment → at max with `EF_DESTROY`, the item "corrodes away".
- Weapon damage `−= greatest_erosion`, minimum 1. Armour `ARM_BONUS = a_ac + spe − min(greatest_erosion, a_ac)`, so erosion never makes AC negative.
- Passive acid triggers on 1/2 of melee hits; worn armour corrodes 1/30, and the striking weapon, glove or boot 1/6 [V, S18, S23].
- D&D 5e uses a cumulative −1 instead: weapons destroyed at −5, armour at AC 10 [V, S34, S35].

*Cost / performance.* Two 2-bit counters per item [I].

*Games that used it.* NetHack: https://nethackwiki.com/wiki/Erosion ; D&D 5e SRD oozes: https://dnd-srd-sphinx.readthedocs.io/en/latest/monster/oozes.html

*How it feels.* Rare, memorable losses rather than constant attrition, thanks to the 1/6 and 1/30 odds [I, note 01]. The three tiers map onto three sprite stages (B3) [I].

*Risks.* Hidden odds feel random; show the chance or warn (C2). Destroy-at-max is the most-hated version [V, S118].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 3 · Fairness/Readability 4

### C2. Enchantment drain with warnings (Brogue)

*In plain words.* Fighting an acid creature costs your gear exactly one point per hit, every time, and the game tells you before you swing.

*How it works (technical).*
- **Acid mound** [V, S30, S32]: 15 HP, defence 10, accuracy 70, damage 1–3. Its flags make every weapon hit on it cost `enchant1--`, and every hit it lands on you cost your armour 1 enchant, with the message "your %s weakens!". The floor is −10.
- Protected items show `}` instead of `)` and are exempt; slaying weapons are exempt too [V, S30, S32].
- The game warns before you attack a mound with an unprotected weapon, unless it is unseen. Before 1.7.4, axe and spear sweeps could hit one with no warning [V, S30].
- **Acidic jelly**: 60 HP, the same flags, and it clones itself when hit [V, S32].
- Players respond as designed: unequip armour, punch, use ranged attacks or allies [V, S30].

*Cost / performance.* One integer per item [I].

*Games that used it.* Brogue: https://brogue.fandom.com/wiki/Acid_Turret?oldid=8205 ; Brogue CE source: https://github.com/tmewett/BrogueCE

*How it feels.* Fair and tactical. The warning turns loss into a decision, which is the "agency" players ask for [V, S118].

*Risks.* With no cap or repair, it is permanent attrition. Brogue CE's licence is AGPL-3.0: re-implement, never paste [V, S32].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 3 · Fairness/Readability 5

### C3. Temporary, stacking corrosion (DCSS)

*In plain words.* Acid gives you a "Corroded" status that lowers armour and damage for a while. More acid adds more, but each extra stack is harder to get, and it all wears off.

*How it works (technical).* From DCSS source [V, S29]:
- `corrode(amount = 4)`: duration grows by `10 + 2d4`, capped at 50; corrosion resistance halves the amount.
- A new stack lands only if `!x_chance_in_y(corr, corr + 28)`: 100 % at 0, 87.5 % at 4, ~78 % at 8, 70 % at 12.
- `corrosion_amount()` = stacks + 4 per adjacent slime wall + 8 in Dis. Each point is −1 AC and −1 melee damage.
- An acid splash deals 4d3, then 35 % to corrode. An acid cloud corrodes with probability 2/3 per turn [V, S29].
- **SPD's Corrosion** ramps instead: damage +1 per turn below `depth/2 + 2`, then +0.5; the gas refreshes 2 turns while you stand in it [V, S37].
```
AcidBurn { stacks 0..5; tick 1 s (or 2 s, Tibia-like); dmg = base(conc) * stacks
  in acid: +1 stack with chance 1 - stacks/(stacks+3)      // DCSS-style diminishing
  out of acid: every 3 ticks stacks -= 1;  water/potion: stacks = 0 }     // note 03 proposal [I]
```

*Cost / performance.* One status record per character [I].

*Games that used it.* Dungeon Crawl Stone Soup: https://github.com/crawl/crawl/blob/master/crawl-ref/source/player.cc ; Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/buffs/Corrosion.java

*How it feels.* The threat is real, but nothing you own is ruined. Ideal for an MMO [I, note 07].

*Risks.* Invisible statuses are forgettable; show the stack on the sprite (dull tint, fizz) [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Reactivity 3 · Fairness/Readability 5

### C4. Armour before flesh (boots first, then footprints)

*In plain words.* Acid hits what it touches first. Feet in a puddle wear the boots; a slime's body wears the chestplate. Only bare skin takes health damage. Wet boots then print acidic footprints.

*How it works (technical).*
- DOS2's Acid status destroys physical armour each turn and stops once it is gone [V, S51].
- XCOM 2: acid grenade shred 2, acid bomb shred 4, the most of any grenade; acid-immune units still take the shred [V, S58].
- Angband: body armour reduces acid damage "but the armor may be damaged" [V, S24].
- Caves of Qud: acid resistance protects the creature, not its gear; feet armour is damaged by stepping in acid [V, S43].
- CDDA burns a body part only if its acid armour is lower than the roll; standing exposes feet and legs, lying down adds torso, arms and head [V, S39].
- NetHack's cloak protects the armour under it [V, S17].
- **Sandbox** [V, S3]: boots lose `0.035 × footAcid` per second; with no boots, HP drops `9 × min(1.5, footAcid)` per second. Slime contact strips the chestplate at 0.09/s, then deals 10 HP/s. Every 5 px of walking, wet feet deposit `0.3 × footAcid` and keep 72 %, so a trail lasts about 10 prints [I, derived]. Speed falls by up to 40 % in deep acid.

*Cost / performance.* A few floats per character [I].

*Games that used it.* DOS2: https://dos2.wiki/wiki/Acid_(Status) ; XCOM 2: https://www.gamepressure.com/xcom2/grenades-and-explosives/z985e7 ; Caves of Qud: https://wiki.cavesofqud.com/wiki/Acid ; Don't Starve Together: https://dontstarve.wiki.gg/wiki/Acid_rain

*How it feels.* Logical and dramatic: "my boots are going" is a warning you can see before your HP moves [I, Sandbox].

*Risks.* Players without armour feel nothing until it hurts; give them the grace meter of C5 [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Reactivity 4 · Fairness/Readability 5

### C5. Damage-over-time ticks, meters and coatings

*In plain words.* Decide *when* acid hurts. Fixed ticks are simple; a meter that must fill first gives a grace window; a coating keeps hurting after you leave until water washes it off.

*How it works (technical).*
- **Fixed tick**: DOOM, 5/10/20 per 32 tics [V, S7]. Factorio's puddle DPS ladder (A5) [V, S61].
- **Meter**: Gungeon's poison goop fills a meter while you stand in it; when full, it resets and deals damage [V, S46].
- **Coating**: Elden Ring swamps build Scarlet Rot; "rolling in the sludge leaves a coating" that keeps building until rain, clean water or Soap removes it [V, S64]. Damage per second is **flat + % max HP**:

  | Source | Per second | Duration |
  |---|---|---|
  | Weapons | 0.18 % + 15 | 90 s |
  | Swamp of Aeonia | 2 % + 8 | 180 s |
  | Lake of Rot | 2 % + 30 | 180 s |
  | Malenia | 3.3 % + 26 | 300 s |

  [V, S65; comments report different numbers, unverified]
- **Can't kill**: RoR2's poison is 10 % max HP over 10 s at 3 ticks/s and cannot kill [V, S62]; Noita's Toxic stain deals 2 % max HP per tick and cannot kill alone [V, S83].
- **Washes off**: SPD's Ooze lasts 20 turns and is removed by standing in water [V, S37].
- **Not HP at all**: Silksong's maggot water drains silk and blocks healing; Bind cures it [V-secondary, S215].
- Acid burns self-limit, unlike alkalis [V, S168], so a tapering DoT (4, 3, 2, 2, 1, 1) is defensible [I, note 04].

*Cost / performance.* One timer per character [I].

*Games that used it.* Elden Ring: https://eldenring.wiki.gg/wiki/Scarlet_Rot ; Enter the Gungeon: https://enterthegungeon.wiki.gg/wiki/Goop ; Hollow Knight: Silksong: https://hollowknight.wiki/w/Putrified_Ducts

*How it feels.* Meters and coatings feel fair and teach the counter (step out, find water) [I].

*Risks.* Ticks with no feedback feel like bugs (C6). Silksong's goo areas were disliked until Patch 4 made the counter-item last longer [V, S217].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Reactivity 4 · Fairness/Readability 5

### C6. Tasteful flesh feedback

*In plain words.* Show acid on a body with a flash, a tint, a puff of steam and a number, never with wounds.

*How it works (technical).*
- The cited games all do it through status and numbers: BG3 lowers AC, Isaac ticks half hearts, Noita scales damage by how much of the body touches acid [V, S52, S49, S79].
- **Sandbox** [V, S3]: on a hit the sprite flashes white on alternate frames for 0.12 s, otherwise it uses the acid-tinted palette variant. While flesh burns, a smoke speck rises from the feet every 0.12 s. Smoke is drawn through a Bayer threshold on its remaining life, so it thins without alpha. At 0 HP: "You dissolved…", a small puddle and 14 smoke puffs, then a respawn after 2.6 s.
- Kenney's smoke puff is 4 circles at 80/60/40/20 % opacity [V, S110].
- Note 06's kit [I]: 1–2 frame green flash per tick, 2–4 px steam puffs from the feet, light-green fizz pixels on the outline, 10–20 % slow, a sizzle sound, no screen shake on ticks. Mighty Bear: slow, steady pulses alarm less than fast, chaotic ones [V, S115].

*Cost / performance.* A palette swap and a few particles [I].

*Games that used it.* The Binding of Isaac: https://bindingofisaacrebirth.wiki.gg/wiki/Creep ; Noita stains (a per-body tint with a timer): https://noita.wiki.gg/wiki/Stains

*How it feels.* Clear and all-ages; the sizzle carries the drama [I].

*Risks.* Too much feedback on frequent ticks is noise; save shake and big flashes for bursts [I, S115].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Reactivity 3 · Fairness/Readability 5

### Family D: Creatures

### D1. Slime = a threshold field shared with the acid (with squash and stretch)

*In plain words.* Don't draw a slime as a sprite. Splat a soft blob into a field and draw "slime" wherever the field passes a threshold. Add the acid puddle to the same field, and a slime crossing a puddle visibly melts into it. Squash the blob with a sine wave and it wobbles.

*How it works (technical).*
- Metaballs are Blinn's density sum with an iso-threshold [V, S130]. Bounded kernels are far cheaper: Cohnen's Blobs2D adds a precomputed `(1 − r²/R²)²` stamp per blob into a buffer and maps the sum through a palette [V, S174]; Geiss reports 20–50× speed-ups from finite-support falloffs [V, S175]. PixelJunk Shooter rendered its fluids to "an off-screen texture" and shaded it in one full-screen pass [V, S76].
- **Sandbox** [V, S3]:
```
r  = 2.5 + sqrt(mass)*1.25                      // mass 16 → 7.5 px; 60 (cap) → 12.2 px
sq = sin(phase)*0.13;  rx = r*(1+sq);  ry = r*(1-sq)*0.82      // ±13 % squash
for px in box: d2 = ((x-cx)/rx)^2 + ((y-cy)/ry)^2
               if d2 < 2.56: F[px] += (1 - d2/2.56)^2 * 2.7    // all slimes add into one field
draw slime where F + 0.55*min(acid,1) >= 1
  dark outline  if value < 1.13 and acid < 0.1
  acid colour   if F < 0.3 and acid > 0.1          // the slime's skirt becomes puddle
  shade by F[x+1,y+1] - F[x-1,y-1]                 // light from upper left
  see-through   if F > 1.35: draw the object under it, acid-tinted
```
  Alone, the edge falls exactly at d = 1; on deep acid it grows to d ≈ 1.23 and merges with the pool [I, arithmetic]. The phase advances 8 rad/s while moving and 3 rad/s idle; movement speed rides the hop (`0.35 + 0.9·max(0, sin phase)`), so it surges and pauses [V, S3]. Eyes blink for 6 of every 170 frames.
- **Bigger wobble**: an 8–12 point Verlet ring with distance constraints and pressure, 1–2 iterations [V, S135, S133, S134; I]. Rain World's few physics circles read as very alive [V, S137].
- Artist rules: "flubbery" with a stretched base, and a **bright outline** to read as translucent [V, S106].

*Cost / performance.* About 1 add per covered pixel per blob. The Sandbox box is ±1.7 radii [V, S3]. Note 03 estimates 20 slimes at ~13k writes [I].

*Games that used it.* No game in our notes documents "pool + creature in one threshold buffer"; it is our proposal, tested in the Sandbox [I]. Closest: PixelJunk Shooter (https://gamedeveloper.com/programming/optimising-pixeljunk-shooter-and-giving-it-the-ultimate-look) and Blobs2D (https://webpage-65r.pages.dev/pixelfx/Blobs2D/Blobs2D.htm).

*How it feels.* A slime is "a pool with a heartbeat" [I, note 06]. Merging, splitting and dissolving into puddles come for free.

*Risks.* Fields look smooth; quantise to 3–4 bands with a 1-px outline. In Godot, CanvasGroup thresholding is the likely route, but its docs were not checked [U, note 07].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 5 · Reactivity 5 · Fairness/Readability 4

### D2. Split, merge, mitosis and size tiers

*In plain words.* Hit a slime and it may become two smaller ones. Leave them alone and they may merge again. Size is a tier: bigger slimes have more HP and hit harder.

*How it works (technical).*
- **NetHack black pudding**: splits only when hit non-lethally by an iron or metal weapon with HP > 1; HP halves (rounded up) and the clone gets the rest [V, S21]. Pre-3.6 "pudding farming" was an exploit [V, S21].
- **D&D 5e**: slashing or lightning on a Medium+ ooze with HP ≥ 10 makes two halves, one size smaller; the ochre jelly is immune to those types, so they only multiply it [V, S34].
- **Zelda (1986)**: a hit with the first sword or better splits a Zol into 2 Gels [V, S95]. Skyward Sword ChuChus **re-merge if left alone** [V, S96]. Ultima slimes "constantly divide and recombine" [V, S36].
- **Brogue's `splitMonster`**: clone count under 100; flood-fill the group, pick a random empty edge cell, parent HP becomes `(HP+1)/2` and the clone copies it [V, S32].
- **Tiers**: Minecraft slimes are 1/4/16 HP [V, S101]; Stardew's Big Slime splits into 2–4 with 75 % chance [V, S100]; Tibia's original slime summons 0–3 more, marked by **blue sparkles** [V, S98].
- **Sandbox** [V, S3]: a sword hit removes 8 mass. If the slime keeps ≥ 12 and there are fewer than 10 slimes, it splits in half with opposite velocities. A slime above 45 mass (from eating) splits on its own about once every 2 s if there are fewer than 6. Mass is capped at 60. Below 5 (hit) or 4 (otherwise) it bursts (D4).

*Cost / performance.* A list operation per split [I].

*Games that used it.* NetHack: https://nethackwiki.com/wiki/Black_pudding ; Zelda Zol: https://www.zeldadungeon.net/wiki/Zol ; Stardew Valley: https://stardewvalleywiki.com/Slimes ; Tibia: https://tibia.fandom.com/es/wiki/Slime_(Creature)

*How it feels.* Every hit changes the fight. The mother-slime tell (Tibia) makes it fair: kill the source first [I, S98].

*Risks.* Split spam and loot farming; cap counts, decay mass and give split slimes no loot [I, S21]. The Sandbox halves mass, but its radius has a 2.5 px offset, so area is not conserved; use `R' = R/√2` for that [I, note 03].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Reactivity 4 · Fairness/Readability 4

### D3. Engulf, digest, steal

*In plain words.* Slimes pick up things. You can see what is inside them. Organic things dissolve over time; hard things are carried and dropped on death. Some slimes go for your shield.

*How it works (technical).*
- **NetHack gelatinous cube** [V, S22]: engulfs floor items 19 times in 20 (1/20 for artifacts); eats one organic stack per move when nobody is adjacent, healing up to the item's weight; carries inorganic, bone and dragon-hide items; avoids statues and boulders.
- **D&D 5e cube** [V, S34]: DC 12 Dex save, 3d6 acid on engulf plus 6d6 per turn; creatures inside "can be seen but have total cover".
- **Visible contents**: Terraria shows a bonus item inside 5 % of slimes [V, S99]; Stardew's Big Purple Sludges look semi-transparent when holding drops [V, S100]. imonk: draw the object as a dark shadow and remove the highlight over it [V, S106].
- **Like Like** (Zelda) [V, S97]: it eats your shield. Some games make the loss permanent (Oracle games, A Link Between Worlds), others let you recover it if you kill it first (Minish Cap; Phantom Hourglass). The article calls it a decades-long "source of aggravation".
- **Sandbox** [V, S3]: every 2–5 s a slime picks the nearest non-gold item within 90 px (75 % of the time). Each frame it tests 5 random points inside 0.85 r. Corrodible pixels there take damage at 2.2× and the slime gains 0.9 mass per unit eaten. Digesting spends no acid. Gold is ignored.

*Cost / performance.* A few samples per slime per frame [I].

*Games that used it.* NetHack: https://nethackwiki.com/wiki/gelatinous_cube ; Zelda's Like Like: https://zeldauniverse.net/2020/06/02/zeldas-study-like-like-species-overview/ ; Terraria: https://terraria.wiki.gg/wiki/Slimes

*How it feels.* Watching a crate vanish into a slime, which then swells and splits, is the Sandbox's best moment [I, Sandbox].

*Risks.* Permanent item theft generates "groans" [V, S97]. Use a **kill-before-digest** timer with the item visible inside [I, note 09].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Reactivity 5 · Fairness/Readability 3

### D4. Trails and death bursts (the creature writes acid)

*In plain words.* Acid creatures leave acid behind: a thin trail while they move, and a pool when they die. The pool then behaves like any other acid: it flows, eats, fumes and stains.

*How it works (technical).*
- Brogue's acid mound leaves "a trail of hissing goo" [V, S32]. XCOM 2's empty Andromedon suit keeps walking, "trailing acidic coolant" [V, S59].
- Tibia's slime has no loot and "turns into a pool of slime" [V, S98]. Into the Breach units that die with ACID leave an ACID pool [V, S54].
- Half-Life 2: Episode Two's antlion worker explodes into 40 splash acid damage [V, S72]. Aliens: Fireteam Elite's bursters leave a longer, stronger puddle than runners [V, S73].
- SPD's caustic slime drops a goo blob on death [V, S37]; NetHack 3.6+ puddings drop "globs" [V, S21].
- For trail *networks*, Physarum agents sense, turn, move, deposit, diffuse and decay [V, S158, S159]. Jones' example: sensor angle 22.5°, rotation 45°, offset 9 px, 6,000 agents on 200×200 [V, S158].
- **Sandbox** [V, S3]: each frame a slime adds 0.006 acid at its centre if the cell holds less than 0.3. On death it spills a disc of radius `1.5 r` with amount `0.5 + 0.025·mass`, and throws 10 droplets that land as small splashes.

*Cost / performance.* One write per slime per frame, one spill per death [I].

*Games that used it.* Tibia: https://tibia.fandom.com/es/wiki/Slime_(Creature) ; Into the Breach: https://www.ludo.guide/guide/into-the-breach/game-mechanics ; XCOM 2: https://temp.ufopaedia.org/Andromedon_(XCOM2) ; Half-Life 2: Episode Two: https://combineoverwiki.net/wiki/Antlion_Worker

*How it feels.* Conservation, as in the snow study's footprints [S2]: the creature's mass becomes the world's acid [I].

*Risks.* Death pools near doorways can trap players; cap pool size and keep them out of spawn zones [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Reactivity 5 · Fairness/Readability 4

### Family E: Time and chemistry

### E1. Evaporation feeds a fume grid

*In plain words.* Acid that evaporates or reacts puts "fume" into a coarser grid above the floor. Each tick the fumes blur, fade and drift. Standing in thick fumes hurts.

*How it works (technical).*
- **SPD `Blob.evolve()`** [V, S37]: `off[c] = sum >= count ? sum/count − 1 : 0` over the cell and its open 4-neighbours, double-buffered, inside a growing bounding rect. The `−1` is free evaporation. ToxicGas deals `1 + depth/5` per turn regardless of concentration; CorrosiveGas applies Corrosion for 2 turns with one strength per blob ("FIXME should have strength per-cell") [V, S37].
- **Caves of Qud** [V, S44]: creature damage `ceil(Density × Level / 200)`, wall damage `ceil((0.75·Level + 0.25) × Density)`.
- The DOOM fire inverted is a rising-fume CA [I, S1]; Stam's stable fluids are overkill here [I, S128].
- **Sandbox** [V, S3]: a 160×90 grid (2×2 px cells). Evaporation adds `0.9 × evaporated`; reactions add `damage × GASK × 6` (iron 0.9, wood 0.6, leather and cloth 0.5, bone 0.4).
```
d     = (4*G[c] + G[c-1] + G[c+1] + G[c-W] + G[c+W]) / 8              // blur
below = (4*G[c+W] + G[c+W-1] + G[c+W+1]) / 6                         // pull from the south = drift north
G'[c] = (0.8*d + 0.2*below) * 0.991                                   // decay: half-life ≈ 77 steps ≈ 1.3 s [I]
draw haze where G*14 > bayer+1;  hurt (G - 0.3)*3 HP/s, sampled 8 px above the feet
```

*Cost / performance.* One read of 5–8 cells per gas cell; 14,400 cells in the Sandbox [I].

*Games that used it.* Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/blobs/Blob.java ; Caves of Qud: https://wiki.cavesofqud.com/wiki/Acid_gas ; Noita (acid evaporates into flammable gas): https://noita.wiki.gg/wiki/Acid

*How it feels.* **Sandbox run:** a quiet puddle's evaporation peaks at 0.008, invisible and harmless. Acid eating a chestplate peaks at 1.16 after ~1 s, a visible, harmful cloud [I, Sandbox run]. Fumes mean "something is being eaten".

*Risks.* Gas that hurts must be visible before it hurts [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 4 · Fairness/Readability 4

### E2. Neutralisation: water, base and salt residue

*In plain words.* Water dilutes acid, and a base (lime, ash, soap) cancels it, leaving a white crust. Give players a counter from day one.

*How it works (technical).*
- Chemistry: acid + metal carbonate → salt + water + CO₂ [V, S163]; 5–10 % HCl on limestone gives "a vigorous fizz" [V, S162]; mixing sulfuric acid with water is highly exothermic [V, S160].
- Games: SPD's Ooze washes off in water [V, S37]; Into the Breach's water cures ACID [V, S54]; Noita's Purifying Powder + Acid → Water [V, S80]; sand-slide's acid + Base → water [V, S91]; fresh water kills Slime Rancher's Tarr [V, S104].
- **Sandbox lime** [V, S3]: radius 7 px; each wet cell gets `salt += acid × 200 + 40`, puffs `acid × 0.08` into the fume grid, and its acid is set to 0. Slimes in range lose 0.6 mass per frame. Salt fades with chance 0.12 per sample.
- Note 03's rule set [I]: `conc' = conc·amt/(amt + w)` for water; `n = min(acid, base)` for lime.

*Cost / performance.* One rule per wet cell when a counter arrives [I].

*Games that used it.* Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/buffs/Ooze.java ; Slime Rancher: https://slimerancher.gamepedia.com/The_Tarr ; Noita: https://noita.wiki.gg/wiki/Acid

*How it feels.* The salt crust is a satisfying "you fixed it" mark [I].

*Risks.* In the Sandbox, liming a slime makes it burst into a fresh puddle, which can surprise [V, S3].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 5 · Fairness/Readability 5

### E3. Stains, rings and reaction cues

*In plain words.* Acid leaves marks: a darker etch where it sat, a ring where its edge dried, scars where things dissolved. While it reacts it gives clear cues: bubbles on metal, char on wood, fizz on limestone.

*How it works (technical).*
- Dorsey's stone model: dissolved mineral recrystallises where moisture leaves, so stains ring at the drying edge [V, S140; I, note 04]. γ-ton tracing emits agents and accumulates effects where they land [V, S142]; Dorsey's flow particles pick up and deposit stains [V, S146].
- **Sandbox** [V, S3]: floor under acid gains +1 stain with chance `0.012 × acid`; a drying edge thinner than 0.3 gains +2 with chance 0.03; dissolved pixels leave +60. Dry stain loses 1 with chance 0.04 per sample. Two stain shades are drawn through Bayer.
- Cues: dilute acid on iron releases hydrogen [V, S166]; concentrated sulfuric acid chars wood, paper and sugar [V, S167, S160]. Noita's acid gas is flammable [V, S79], so acid + metal + fire can "pop" [I, note 04]. The Sandbox spawns bubbles from deep acid (>0.45) with chance 0.0005 per step and from reactions with chance `damage × 26`; organic reactions make smoke instead [V, S3].

*Cost / performance.* One byte per pixel and sampled fading [I].

*Games that used it.* No game in our notes documents drying-edge rings; Noita has persistent body stains: https://noita.wiki.gg/wiki/Stains . The Sandbox shows the floor version.

*How it feels.* **Sandbox run:** a puddle leaves 134 visible stain pixels by 80 s; after it dries they fade to 125 at 10 min and 52 at 30 min [I, Sandbox run]. The room keeps a history.

*Risks.* Stains must read as harmless; never flicker them [I, S49].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Reactivity 5 · Fairness/Readability 4

### E4. Acid weather and world events

*In plain words.* Sometimes the acid comes from the sky. A short event can change the whole map: gear wears, food spoils, ponds crust, creatures react.

*How it works (technical).*
- **Don't Starve Together's acid rain** [V, S66]: up to 3 damage every 1.5 s, scaled by rain strength; 100 % water resistance negates it; perishables lose 0.07 % freshness per tick; water-resistant armour loses 3 HP per tick; ponds crust with Nitre; Rock Lobsters shrink and regrow afterwards; the Umbralla protects and repairs itself.
- Metroid Prime 3's acid rain needs the Hazard Shield; Smash Bros.' Zebes has rising acid tides [V, S13]. Elden Ring's rain washes off rot [V, S64].
- For a tile game: an event flag sets a global acid input, adds wear to exposed gear, and switches a few tile and creature flags [I, note 09].

*Cost / performance.* One global state plus sampled tile updates [I].

*Games that used it.* Don't Starve Together: https://dontstarve.wiki.gg/wiki/Acid_rain ; Metroid: https://metroid.fandom.com/wiki/Acid

*How it feels.* The world reacts as an ecology, not just a damage source [I].

*Risks.* Server-wide wear angers MMO players; keep it regional, telegraphed and counterable [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Reactivity 5 · Fairness/Readability 4

### Family F: Rendering and taste

### F1. Palette ramps, translucent rims and colour families

*In plain words.* Choose acid's colours on purpose: inky purple shadows rising to yellow-green, near-white highlights, and a bright rim so pools and slimes read as translucent. Use palette swaps for slime families.

*How it works (technical).*
- **Lospec "Eight Hues of Toxic Ooze"** (Digi) [V, S111]: `#0e0314 #281039 #2c4273 #407292 #56a3b2 #6dd4c3 #95ffcf #d5ffcc`. Shadows are inky purple, highlights lose saturation.
- imonk: a bright outline makes slimes look translucent, and "the little dabs of highlights" carry the shine [V, S106, S107]. Slynyrd: surface sparkle loops in 6 frames [V, S109].
- **Sandbox** [V, S3]: acid ramp `#f6ffa8 #d9f75e #a2e33c #68b42c #3f8124` plus a bright edge `#ecff86`; slime ramp `#eeffbe … #0f200b`. 107 base colours, each with 4 variants (base, acid-wet tint, fume haze, shadow), times 3 lighting palettes.
- **Colour families**: Stardew slimes are green, blue, red, then purple by mine depth, and breeding mixes R, G and B separately [V, S100]. BotW ChuChus are red = fire, white = ice, yellow = electric [V, S96]. Dragon Quest's teardrop slime made the weakest enemy a mascot [V, S102]. imonk: "The basic ones are usually green." [V, S107]

*Cost / performance.* Free; one LUT row per family [I].

*Games that used it.* Stardew Valley: https://stardewvalleywiki.com/Slimes ; Zelda ChuChu: https://www.zeldadungeon.net/wiki/ChuChu ; Dragon Quest: https://en.wikipedia.org/wiki/Slime_(Dragon_Quest) ; palette: https://lospec.com/palette-list/eight-hues-of-toxic-ooze

*How it feels.* Acid that glows on a cool dungeon floor is instantly legible [I].

*Risks.* Green acid on green grass disappears; give every pool a dark etch ring [I, note 06].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Reactivity 2 · Fairness/Readability 4

### F2. Glow through block sums and palette selection

*In plain words.* Acid lights up its surroundings. Add up how much acid is in each 8×8 block, blur that small grid, then let each pixel pick a "glow" version of its colour through a dither pattern.

*How it works (technical).* **Sandbox** (`computeGlow`, every 4 frames) [V, S3]:
```
block[40x23] = sum over each 8x8 block of min(acid, 1.2) + 0.5*mass for each slime
repeat 2: block = 3x3 tent blur (weights 1-2-1)
glow[px] = clamp(bilinear(block)/12 - 0.35, 0, 1)
palette = (glow*20 > bayer+2 and glow >= 0.6*torch) ? GLOW : (torch*19 > bayer ? TORCH : DIM)
```
Two torches flicker between 0.72 and 1.0 of full strength. Emissive colours (acid, slime, flames) stay bright even in the dim palette. It is the snow study's dithered lamp pool, driven by liquid [S2].

*Cost / performance.* 920 blocks × 9 taps × 2 passes plus one bilinear sample per pixel, every 4th frame [I].

*Games that used it.* Glowing acid is a convention (Isaac's "shiny" creep; HL2's luminous antlion worker) [V, S49, S72]; the block method is ours. Lospec calls the Toxic Ooze ramp "perfect for creating interesting glow" [V, S111].

*How it feels.* Warm torch light and cold green acid light meet in dithered bands [I, Sandbox].

*Risks.* Block light lags fast changes by up to 4 frames [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Reactivity 3 · Fairness/Readability 4

### F3. Readability: flicker, colour language and colour-blind caution

*In plain words.* Make "this will hurt you" obvious through motion, not just colour, and keep harmless acid marks calm.

*How it works (technical).*
- Isaac's creep that hurts Isaac **flickers rapidly**, and creep is team-owned [V, S49].
- Mighty Bear Games: green = healing or poison, purple = corruption; "Flying triangles usually indicate incoming damage."; slow pulses alarm less than fast ones; scale visual weight to impact [V, S115].
- Silksong's maggot water pulses the screen edges green and puts maggots on the silk bar [V-secondary, S215].
- Note 06's colour-blind rule [I]: separate acid (bubbles, rising steam, jagged etch ring, fizz sound) from poison (drifting motes, soft edge, purple) by **shape and motion**.
- Budget: desynchronise bubble timers, cap simultaneous pops at about 6–10, no shake on ticks [I, note 06].

*Cost / performance.* Free [I].

*Games that used it.* The Binding of Isaac: https://bindingofisaacrebirth.wiki.gg/wiki/Creep ; Enter the Gungeon (meter as grace): https://enterthegungeon.wiki.gg/wiki/Goop

*How it feels.* Players trust the hazard and stop fearing the stain [I].

*Risks.* Our accessibility source was blocked; no cited prevalence figure [V, note 06].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 2 · Fairness/Readability 5

---

## 5. Comparison scorecard

All ratings are author judgement for top-down pixel art on web Godot. "Sum" is a crude total, not a recommendation.

| # | Technique | Simpl. | Speed | Pixel taste | Reactivity | Fairness | Sum | Cost class |
|---|---|---|---|---|---|---|---|---|
| A1 | Animated tile + damage flag | 5 | 5 | 4 | 1 | 4 | 19 | Free (tile anim + 1 AND/tick) |
| A2 | Quake turbulence + palette cycling | 4 | 5 | 5 | 1 | 3 | 18 | Per-pixel shader, 2–3 lookups |
| A3 | Amount + flow + film threshold | 4 | 4 | 5 | 5 | 4 | 22 | CPU field, dirty bbox |
| A4 | Surface types + combination rules | 4 | 5 | 4 | 5 | 4 | 22 | 1–2 B/tile, rare flood fills |
| A5 | Puddle decals + splash stamps | 5 | 5 | 4 | 2 | 5 | 21 | O(puddles) |
| A6 | Ripple buffer | 4 | 5 | 4 | 5 | 3 | 21 | 2×int16 per pool cell |
| B1 | Reaction table + probabilities | 4 | 4 | 4 | 5 | 3 | 20 | 1 RNG per wet contact |
| B2 | Self-limiting acid | 5 | 5 | 4 | 4 | 4 | 22 | 1 subtract per reaction |
| B3 | Integrity → dithered stage colour | 5 | 5 | 5 | 3 | 5 | 23 | 1 compare per pixel |
| B4 | Mérillou front / wet-edge eating | 4 | 4 | 5 | 5 | 3 | 21 | O(front) |
| B5 | Rust after exposure | 5 | 5 | 5 | 4 | 3 | 22 | Sampled, map-size independent |
| B6 | Integrity-driven dissolve | 5 | 5 | 5 | 3 | 4 | 22 | 2–3 samples per sprite pixel |
| C1 | Erosion tiers (NetHack) | 5 | 5 | 4 | 3 | 4 | 21 | 2×2 bits per item |
| C2 | Enchant drain + warnings (Brogue) | 5 | 5 | 4 | 3 | 5 | 22 | 1 int per item |
| C3 | Temporary stacking corrosion (DCSS) | 4 | 5 | 3 | 3 | 5 | 20 | 1 status per character |
| C4 | Armour before flesh, boot prints | 4 | 5 | 4 | 4 | 5 | 22 | Few floats per character |
| C5 | DoT ticks, meters, coatings | 4 | 5 | 4 | 4 | 5 | 22 | 1 timer per character |
| C6 | Tasteful flesh feedback | 5 | 5 | 5 | 3 | 5 | 23 | Palette swap + particles |
| D1 | Slime threshold field shared with acid | 4 | 4 | 5 | 5 | 4 | 22 | 1 add per covered px per blob |
| D2 | Split / merge / size tiers | 4 | 5 | 5 | 4 | 4 | 22 | List ops |
| D3 | Engulf, digest, steal | 4 | 5 | 5 | 5 | 3 | 22 | Few samples per slime |
| D4 | Trails and death bursts | 5 | 5 | 5 | 5 | 4 | 24 | 1 write per frame, 1 spill per death |
| E1 | Evaporation → fume grid | 5 | 5 | 4 | 4 | 4 | 22 | Half-res 5–8 tap blur |
| E2 | Neutralisation + salt residue | 5 | 5 | 4 | 5 | 5 | 24 | On demand |
| E3 | Stains, rings, reaction cues | 4 | 5 | 5 | 5 | 4 | 23 | 1 B/px, sampled fade |
| E4 | Acid weather / world events | 4 | 5 | 4 | 5 | 4 | 22 | Global state + sampling |
| F1 | Palette ramps, rims, families | 5 | 5 | 5 | 2 | 4 | 21 | Free (LUT) |
| F2 | Glow via block sums + palette | 4 | 5 | 5 | 3 | 4 | 21 | 40×23 grid every 4 frames |
| F3 | Readability rules | 5 | 5 | 4 | 2 | 5 | 21 | Free |

**Reading the table [I].**
- The top sums are the **closing loops**: D4 (creatures write acid) and E2 (players remove it). Both connect two systems with one rule.
- The cheapest high-taste wins are B3 (dithered stages) and C6 (flash, smoke, tint).
- The weakest on fairness are the ones that destroy things: B1, B4, B5 and D3. Pair them with C2's warnings and E2's counters.

---

## 6. Deep dives

### 6a. Acid × materials

"Sandbox RATE" is the code's corrosion speed [V, S3]. "Proposal" is note 03's per-contact table at 4 Hz: chance / integrity loss / acid consumed [I]. Fume factor is the Sandbox's `GASK` [V, S3].

| Material | Sandbox RATE | Proposal | Visual stages | Byproduct / cue | Gameplay hook |
|---|---|---|---|---|---|
| Flesh | DoT, not RATE: 9 HP/s × depth (≤1.5) after boots | DoT (C3/C5) | Flash, acid tint, sizzle specks | Steam puff | Armour first (C4); can't-kill option (RoR2) [V, S62] |
| Wood | 0.55 (fume 0.6) | 0.30 / 6 / 2 | Brown → darker → dark → near-black → crumble | Char, thin smoke [V, S167] | Doors 1/3 → broken (CDDA) [V, S39]; crates feed slimes |
| Iron / steel | 0.80 (fume 0.9) | 0.20 / 4 / 3 | Clean → dark pits → pale green salts → dull → holes; rust later | H₂ bubbles [V, S166] | Bars melt (CDDA, Sandbox gate) [V, S39, S3]; NetHack corrode tiers |
| Stone | 0 (floor and walls only stain) | Limestone 0.25 / 2 / 4; granite 0.03 / 1 / 1 | Etch darkening, pale crust ring | CO₂ fizz on limestone [V, S162] | Qud gas eats walls ×50 vs creatures [V, S44]; dense rock immune (Noita) |
| Bone | 0.45 (fume 0.4) | 0.15 / 3 / 2 | Ivory → yellowed → tan → grey-brown | Chalky fizz [I] | Cube carries bone, doesn't eat it [V, S22] |
| Leather | 0.60 (fume 0.5) | 0.30 / 6 / 2 | Tan → dark → near-black | Smoke | Boots wear first (Sandbox); NetHack rot/burn track |
| Cloth | 1.10 (fume 0.5) | 0.30 / 6 / 2 | Red → faded rose → brown → dark | Char, smoke | Rug dissolves fastest (Sandbox) |
| Gold | 0 | 0 | No change | None | Immune loot; slimes ignore it (Sandbox) [V, S3] |
| Glass | Not simulated (flask entity) | 0 | Intact until broken | None | Acid containers (Qud: inorganic containers only) [V, S43]; but CDDA glass walls → floor [V, S39], NetHack 3.7 glass cracks [V, S15] |

Notes: copper and tin don't react with dilute HCl or H₂SO₄ [V, S166], so "copper/bronze slow" is defensible. Gold resisting single acids is general knowledge [U, note 04]. Every Sandbox material spends **0.55 acid per unit of integrity**; RATE only sets speed (B2) [I].

### 6b. Equipment: swords, shields, armour, boots

**Design options seen in the notes.**

| Model | Example | Loss | Player view |
|---|---|---|---|
| Rare permanent tiers | NetHack 1/6 weapon, 1/30 armour [V, S23] | −1 per tier, cap 3 | Memorable, a little random |
| Every-hit drain | Brogue −1 enchant per hit, warned [V, S30] | Uncapped to −10 | Fair, tactical |
| Cumulative to destruction | D&D −1, destroyed at −5 / AC 10 [V, S34] | Item lost | Feared |
| Temporary stacks | DCSS −4 AC per stack, ≤50 turns [V, S29] | None permanent | MMO-friendly |
| Timed durability burn | Dark Souls Acid Surge, ~1 durability/s for 8 s, PvP only [V, S67] | Durability | Short, readable |
| Armour shred | XCOM 2, 2–4 points [V, S58] | Armour pips | Clear tactical cost |
| Item theft | Like Like shield [V, S97] | Item | "Groans" |

**Per slot [I, from the table and the Sandbox].**
- **Swords**: corrode when they strike acid creatures. The Sandbox costs 0.06 integrity per hit on a slime, so ~17 hits empty a sword [V, S3]. Brogue's warning is the fairness model; NetHack's 1/6 is the rarity model.
- **Shields**: the classic "steal" target, but recoverable (D3).
- **Armour**: absorbs acid before HP (C4); erosion never takes AC below zero, as in NetHack's `min(erosion, a_ac)` [V, S23].
- **Boots**: first contact with every puddle and the source of footprints; a cheap slot is the right place for visible wear.

**Recommended fair model for Asterion [I].**
1. Contact applies a **temporary** "Corroded" stack (DCSS rules), shown as a dull tint plus fizz pixels.
2. Each piece also has a **permanent stage 0–3**, with −1 per stage and a cap, shown with B3's stage colours.
3. **Warn** before the first loss: a chat line ("Your boots hiss.") and a sprite stage change. Never destroy on first contact [I, note 06].
4. **Prevent and repair**: oil/wax coatings that absorb N hits (NetHack grease), gold/silver/glass immune, a smith or whetstone "polish" that resets stages (Dorsey's verbs).
5. **Never delete** an item, except cheap sacrificial classes. Thieving slimes hold the item visibly until killed.

### 6c. Acid creatures drawn with the acid's own logic

The point is reuse [I]. In the Sandbox a slime is a mass, a position and a phase [V, S3]:
- **Body**: its kernel goes into the same threshold as the puddle (`F + 0.55·acid ≥ 1`). Same ramp family, same outline rule.
- **Eating**: its pixels run B2's reaction with `mul = 2.2`, and the "damage" becomes mass.
- **Trail and death**: it writes into the acid buffer (D4), which then flows (A3), stains (E3) and fumes (E1).
- **Glow**: its mass adds to the light blocks (F2).
- **Counters**: lime removes its mass like acid (E2).

Variants are data: a **gelatinous cube** is a squarer kernel [I, note 03]; an **acid-blooded alien** is a normal sprite whose hits spawn D4 splashes [V, S73; I]; a **mother slime** carries a sparkle tell [V, S98]; a **Tarr-like** contagion converts what it eats and dies to fresh water [V, S104].

### 6d. Time: a worked example on a 320×180 field

Using the Sandbox's constants: 60 sim steps per second at 1×, interior floor of 304×152 = 46,208 px, 16-px tiles [V, S3]. Timings are from a headless replay of its `simStep()` with no slimes or player [I, Sandbox run].

1. **Spill.** A flask-sized disc (radius 10, depth 1.3 at the centre) puts 289 acid units on 317 px.
2. **Spread (0–10 s).** 596 px after 1 s, 866 px after 5 s, then 917 px at 10 s (about 3.6 floor tiles, 2 % of the room, mean depth 0.29). The film rule (`FILM = 0.3`) then freezes the outline.
3. **Evaporation (10–90 s).** Interior cells lose 0.00004 per step (0.0024/s); edges lose 1.8×; cells below 0.08 lose an extra 0.0005 per step [V, S3]. The puddle **thins without shrinking**: 268 units at 10 s, 145 at 60 s, dry at ~90 s.
4. **Fumes.** Evaporation alone peaks at 0.008 in a fume cell: invisible (haze needs > 0.07) and harmless (damage needs > 0.3). Drop an iron sword in and the reaction lifts the peak to ~0.10 (sparse haze). A bigger spill (radius 14, 571 units) on the chestplate peaks at 1.16 after ~1 s, about (1.16 − 0.3) × 3 ≈ 2.6 HP/s at head height, and falls to 0.38 by 10 s.
5. **Corrosion.** The sword (40 iron, 8 leather and 2 gold pixels) averages 0.61 integrity at 5 s and 0.37 at 10 s; all iron is gone by 20 s, leaving the 2 gold pixels. The big-spill chestplate is gone in ~20 s.
6. **Stains.** Visible stain pixels: 5 at 10 s, 67 at 30 s, 134 at 80 s, mostly the frozen outline (a ring). After drying: 125 at 10 min, 104 at 20 min, 52 at 30 min.
7. **Rust.** A small spill at the chestplate's edge damages 39 pixels. Rust starts once they are dry (~60 s); 4 rusty pixels are visible at 2 min, 20 at 5 min and 43 at 10 min, by which time rust has spread to 11 clean neighbours; all 50 show rust by ~25 min.

**Timeline**: seconds of fizz → 90 s of thinning → tens of minutes of stain and rust: "alive, then calm, then remembered" [I]. On an MMO server, map the three bands to ticks (A4/C3) and keep pixels client-side [I].

---

## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)

**Data [I].**

| Layer | Format | Resolution | Owner |
|---|---|---|---|
| Acid amount (+ concentration) | R8 or RG8 | 1 cell per 4 px (4×4 per 16-px tile) or per pixel near the camera | Client (cosmetic) |
| Tile acid level 0–3 + liquid enum + flags | 1–2 B per tile | Tile | **Server** |
| Integrity | R8 per object sprite; per pixel only for world objects (doors, bars, crates) | Sprite texel | Client look; server owns item stage 0–3 |
| Stain / salt / rust | R8 each (or packed RGBA8) | Pixel | Client |
| Fumes | R8 | Half or quarter res (Sandbox: 160×90) | Client look; server has per-tile gas |

Compatibility is RGBA8 for colour precision and float formats on WebGL 2 are unconfirmed, so stay 8-bit [V, S191; U].

**Update [I].**
- **CPU path**: `PackedByteArray` per active chunk, dirty bounding boxes, liquid 10–15 Hz, corrosion 2–5 Hz, gas 4–10 Hz, stain fade 0.2 Hz (note 03), uploaded with `ImageTexture.update()`. This handles scatter rules: moves, random consumption, fronts.
- **GPU path**: `DrawableTexture2D.blit_rect()` with `texture_blit` shaders for gather rules only (diffusion, fumes, stain decay), up to 4 inputs and outputs per blit [V, S185, S186]. The API is experimental [V, S185]. ProfesorShader's flow sim shows the ping-pong pattern [V, S200].
- No compute shaders, no RenderingDevice, no particle trails or SDF collision on Compatibility [V, S191]. Use CPUParticles2D or shader specks for bubbles [I, note 05].

**Render [I].** One CanvasItem shader per layer: palette-index lookup through a LUT, a Bayer threshold for acid edges and stage changes, the stage ramps per material, and fume haze as a palette variant. Slimes: soft radial sprites inside a CanvasGroup, thresholded in the group's shader (`step(0.5, a)`) and quantised to 2–3 tones [I, note 07; docs not fetched]. Canvas shaders can read `texture_sdf` for "distance to walls", if walls have LightOccluder2D [V, S192, S190].

**Gameplay [I].** The server owns a per-tile acid level and liquid enum (Into the Breach / CDDA style), item stages 0–3, corrosion stacks and per-tile gas (SPD rule at turn rate). Clients receive tile events and seeds and run the pixel simulation as cosmetic, allowed to diverge [I, note 03].

**Pseudocode [I].**
```
# --- flow (A3), 10–15 Hz, dirty bbox ---
for i in bbox: if a[i] >= 0.004:
  h = a[i] + floor_h[i]; s = 0
  for j in N4(i): if open(j):
    d = h - a[j] - floor_h[j]
    if d > 0 and (a[i] > FILM or a[j] > 0.004): f[j] = d; s += d
  if s > 0: k = min(0.2, a[i]*0.9/s); da[i] -= s*k; for j: da[j] += f[j]*k

# --- react (B1 + B2), 4 Hz ---
for wet i, for each object pixel o touching i:
  dmg = RATE[mat[o]] * min(1, a[i]) * K * randf_range(0.5, 1.5)
  integ[o] -= dmg;  a[i] -= 0.55*dmg;  gas[i>>1] += dmg*GASK[mat[o]]*6
  if integ[o] <= 0: hole(o); stain[o] += 60

# --- stage colour (B3), fragment ---
si = clamp(floor((1.0 - q)*3.3 + (bayer - 7.5)/16.0*0.9), 0, 3); col = ramp[mat][si][role]

# --- slime field (D1), per frame ---
F[px] += (1 - d2/2.56)^2 * 2.7  for each slime;   slime if F + 0.55*min(a,1) >= 1

# --- fumes (E1), per step ---
G'[c] = (0.8*(4G[c] + ΣN4)/8 + 0.2*(4G[c+W] + G[c+W±1])/6) * 0.991
```

---

## 8. Reference implementation: the Acid Sandbox

`vfx-acid-sandbox.html` [S3] is one page of plain JavaScript drawing a 320×180 Canvas 2D `ImageData`, with no WebGL. Its choices are ours [I]. The description comes from reading its script.

**Scene.** A stone room (16-px tiles, grout, a drain trench, an iron portcullis) with a table of four acid flasks, a crate, a barrel, a shield, a sword, a chestplate, bones, gold and a rug; two spills and two slimes (mass 24 and 14). Tools: walk, pour, lime, spawn slime, drop item. X-ray views: acid, integrity, fumes, stain, rust, glow. Buffers are `Float32Array` (acid, floor height, integrity, slime field, glow, 160×90 fumes) and `Uint8Array` (material, role, solid, stain, salt, rust).

**Constants and rules** (from the code [V, S3]):
- Flow: `FILM = 0.3`, `k = min(0.2, a·0.9/s)`, cells under 0.004 are dry. Evaporation `EVAP = 0.00004` per step, ×1.8 at edges, +0.0005 under 0.08.
- `RATE` = wood 0.55, iron 0.8, bone 0.45, leather 0.6, cloth 1.1, gold 0; fume factors `GASK` 0.6 / 0.9 / 0.4 / 0.5 / 0.5.
- `react`: `dmg = RATE × conc × 0.0035 × mul × (0.5 + rnd)`, with `mul` = 1 in place, 0.6 for solids from a wet neighbour, 2.2 × sim speed for digestion. The acid pays `0.55 × dmg`; fumes get `dmg × GASK × 6`.
- Stages: `floor((1 − q)·3.3 + (Bayer − 7.5)/16·0.9)`, holes below q = 0.15, iron pits and salts at stages 1 and 2.
- Slimes: radius `2.5 + √mass·1.25`, squash ±13 %, kernel `(1 − d²/2.56)²·2.7`, drawn where `F + 0.55·acid ≥ 1`. Split above mass 45 (fewer than 6 slimes) or on a hit leaving ≥ 12 (fewer than 10); cap 60; burst below 5/4.
- Fumes: 5-tap blur, 20 % pull from the row below, ×0.991 per step, harm above 0.3.
- Rust and fading: 2,500 sampled pixels per step.
- Glow: 40×23 blocks of 8×8, two tent blurs, every 4 frames. **Three palettes** (dim, torch, acid glow) of 107 colours × 4 variants, chosen per pixel through Bayer.
- Sim steps: 60 per second × speed (1–8), at most 16 per frame.

**Measured cost.** The HUD shows a smoothed time for the sim steps plus the glow pass. On our test machine, in headless Chromium, it read **about 0.6–3.5 ms per frame**. This is one machine and is illustrative, not a benchmark. It excludes slime updates and rendering. GDScript would be slower (A3) [I].

**Honest simplifications [I].**
- One acid value per pixel with no concentration channel, so water dilution is not modelled; only lime neutralises.
- Glass is not a material: flasks are entities that break when struck or when the table under them is eaten.
- Equipment is a single integrity number per slot, not a per-pixel map; the sprite borrows the stage colours.
- Some rates ignore sim speed (HP loss, chestplate drain, lime on slimes), while others scale (boots, digestion, trails).
- Nothing is networked; there is no ripple buffer or water tool yet.

**Caption-versus-code mismatches** (the study follows the code):
- The HUD has a **Helmet** bar, but nothing in the code damages the helmet.
- Card 2 lists glass among immune materials; glass is not simulated at all (above).
- Card 5 says the sword corrodes "on every hit"; it loses 0.06 only on hits that connect with a slime, not on swings or flasks.
- Card 4's split rule omits the population caps (6 and 10) and the ≥ 12 mass condition.
- Card 6 says breathing fumes hurts; it does, but only above 0.3, which plain evaporation never reaches (§6d).

---

## 9. Gem findings

Repository data (stars, last push) come from the repos.ecosyste.ms API on 2026-11-08, because GitHub was blocked [V, S213].

| Name | URL | Licence | Maturity | Good for |
|---|---|---|---|---|
| Shattered Pixel Dungeon (Blob, CorrosiveGas, Corrosion, Ooze) | https://github.com/00-Evan/shattered-pixel-dungeon | **GPL-3.0, study only** | 6,732★; pushed 2026-10-07; commercial | `avg − 1` gas, ramping DoT, water washes acid |
| NetHack 3.7 (`erode_obj`) | https://github.com/NetHack/NetHack | **NGPL (copyleft), study only** | 3,980★; pushed 2026-11-06; since 1987 | 0–3 tiers, grease/bless/proof, 1/6 and 1/30 odds |
| Cataclysm: DDA (`fd_acid`, `hit_with_acid`) | https://github.com/CleverRaven/Cataclysm-DDA | **CC BY-SA 3.0, share-alike risk** | 13,454★; pushed 2026-11-03 | 3-level field, 2-min half-life, terrain table, splash stamp |
| Brogue CE | https://github.com/tmewett/BrogueCE | **AGPL-3.0, highest risk for an online game** | 1,511★; pushed 2026-10-31 | −1 enchant per hit, split onto group edge, puddle DF 200/−25 |
| DCSS | https://github.com/crawl/crawl | **GPL v2+, study only** | 3,064★; pushed 2026-11-07 | Temporary diminishing corrosion stacks |
| The Powder Toy (ACID.cpp) | https://github.com/The-Powder-Toy/The-Powder-Toy | **GPL-3.0, study only** | 5,395★; pushed 2026-11-05 | life 75, hardness/1000, glass immune |
| Sandspiel | https://github.com/MaxBittker/sandspiel | MIT | 3,219★; pushed 2026-09-10 | Strength byte −60 per dissolve; WASM web |
| sand-slide | https://github.com/kiwijuice56/sand-slide | MIT | 143★; pushed 2026-09-08; shipped itch + Google Play | Godot GDExtension; `get_acid_resistance()`; acid/base/gas rules |
| Sandboxels | https://github.com/R74nCom/sandboxels | **R74n Content License, "All Rights Reserved"** | 477★; pushed 2026-06-03 | Play for reference only |
| DOOM (p_spec.c) | https://github.com/id-Software/DOOM | **GPL-2.0 code; IWAD textures not free** | 19,851★ | 8-tic flats, 32-tic damage |
| ProfesorShader liquid | https://godotshaders.com/?p=15449 | CC0 | 2026-04-12 | DrawableTexture2D wet-map flow |
| 2D dissolve with burn edge | https://godotshaders.com/shader/2d-dissolve-with-burn-edge/ | CC0 | 2024-03-12; Godot 4 canvas_item | Item dissolve base |
| Dissolve (Godot 4.x) | https://godotshaders.com/shader/dissolve-godot-4-x/ | MIT | Spatial | Edge band logic to port |
| Metaballs (Davidoron) | https://godotshaders.com/shader/metaballs/ | CC0 | Spatial SDF raymarch | Smooth-min to port to 2D |
| Goop Projectile | https://godotshaders.com/shader/goop-projectile/ | MIT | 2023-08-07; Godot 3.5 canvas_item | Scrolling-noise goop |
| Powdered World Engine | https://store.godotengine.org/asset/cannedbottle/powdered-world-engine/ | MIT | v1.0 2026-10-07; **C# only, so likely no web export** [I] | Reaction editor, dirty chunks |
| SoftBody2D | https://godotengine.org/asset-library/asset/edit/11195 | MIT | Asset Library, Godot 4.4 | Breakable soft bodies (likely overkill) |
| Canvas Cycle | https://github.com/jhuckaby/canvascycle | Not stated in our notes, **check** | Classic demo | Palette-cycling reference |
| Karl Sims RD tutorial | https://www.karlsims.com/rd.html | No code licence stated | Widely cited | Bake etch/pit textures |

**Licence flags.** AGPL (Brogue CE) reaches network use: never paste into an online client or server. GPL/NGPL code would make the game GPL. CC BY-SA (CDDA) covers its JSON data too: re-derive numbers. Sandboxels can demand removal. Copy ideas and numbers, not code [V, note 07].

---

## 10. Learnings and anti-patterns

**Learnings [I unless tagged].**
1. **One buffer, many effects.** The acid amount drives look, flow, damage, fumes, stains and slime blending.
2. **Make the reaction pay.** Consumption (B2) is what turns a hazard into an event with an ending.
3. **Exceptions make acid readable.** Noita's immune list and Into the Breach's immune buildings are the most important tables to design [V, S79, S54].
4. **Water is the universal counter** across almost every game in the notes [V, S54, S37, S80, S104].
5. **Warn, cap, repair.** Players accept loss with agency [V, S118].
6. **Close the loops.** Creatures write acid (D4), players remove it (E2), and time turns it into memory (E3, B5).

| Anti-pattern | Why | Fix |
|---|---|---|
| Green acid on green grass | No value step, no motion [I, note 06] | Dark etch ring, bright rim |
| Permanent, random, unwarned loss | "kill my character, don't break my toys" [V, S118] | C2 warnings + C3 temporary stacks |
| DoT with no tick feedback | Feels like a bug | Flash + puff + number per tick (C6) |
| Every pool bubbling in sync | Mechanical; screen noise | Random phases, cap pops at 6–10 |
| Endless thin film | Smears the whole room | Film threshold (A3) |
| Acid that never gets used up | Eats the map | B2 consumption |
| Slime splitting with loot | Pudding farming [V, S21] | Caps, no loot on clones |
| Harmful fumes you can't see | Unfair | Draw haze below the harm level |
| Syncing per-pixel acid | Bandwidth, divergence | Server tiles; client pixels |
| Pasting GPL/AGPL roguelike code | Licence | Re-implement from numbers |

---

## 11. "See it in action" index

| # | Game / production | Year | What to look at | Link |
|---|---|---|---|---|
| 1 | DOOM / DOOM II | 1993–94 | Nukage flats, 5/10/20 floors, radsuit | https://doomwiki.org/wiki/Damaging_floor |
| 2 | Quake | 1996 | Turbulent slime warp | https://www.quakewiki.net/quakesrc/10.html |
| 3 | Duke Nukem 3D | 1996 | Acid floors, boots, Hyper Acid | https://www.ludo.guide/guide/duke-nukem-3d/02-04-11-environmental-damage-sources |
| 4 | Metroid series / Smash Bros. Zebes | 1986– | Acid pools, fake acid, acid tides | https://metroid.fandom.com/wiki/Acid |
| 5 | Hollow Knight | — | Acid as a traversal gate | https://hollowknight.wiki/w/Isma%27s_Tear |
| 6 | Hollow Knight: Silksong | 2025 | Maggot water drains silk, blocks healing | https://hollowknight.wiki/w/Putrified_Ducts |
| 7 | NetHack | 1987– | Erosion tiers, grease, proofing | https://nethackwiki.com/wiki/Erosion |
| 8 | NetHack (cube, pudding) | 1987– | Item engulfing; iron splits puddings | https://nethackwiki.com/wiki/gelatinous_cube |
| 9 | Angband | 1990– | Acid destroys inventory; armour absorbs | https://angband.readthedocs.io/en/latest/attack.html |
| 10 | Dungeon Crawl Stone Soup | — | Temporary corrosion, Slime Pits | https://www.tvtropes.org/pmwiki/pmwiki.php/VideoGame/DungeonCrawl |
| 11 | Brogue | — | Acid mound, protected `}` glyph | https://brogue.fandom.com/wiki/Acid_Turret?oldid=8205 |
| 12 | Shattered Pixel Dungeon | — | Corrosive gas, caustic slime | https://github.com/00-Evan/shattered-pixel-dungeon |
| 13 | Pixel Dungeon | — | Caustic ooze washes off in water | https://pixeldungeon.fandom.com/wiki/Debuffs |
| 14 | Cataclysm: DDA | — | Acid fields, melting bars | https://srgnis.github.io/cdda-wiki/cdda_wiki/Fields.html |
| 15 | Caves of Qud | — | Acid in drams; gas eats walls | https://wiki.cavesofqud.com/wiki/Acid |
| 16 | Noita | 2019/2020 | Per-pixel acid, immune materials, gas | https://noita.fandom.com/wiki/Acid |
| 17 | The Powder Toy | — | ACID life and hardness | https://github.com/The-Powder-Toy/The-Powder-Toy |
| 18 | Sandspiel | — | Web CA acid | https://maxbittker.com/making-sandspiel |
| 19 | Sand Slide | — | Godot CA with acid gas and base | https://kiwijuice56.itch.io/sand-slide |
| 20 | Sandboxels | — | Look only (licence) | https://github.com/R74nCom/sandboxels |
| 21 | Enter the Gungeon | 2016 | Goop types and propagation | https://enterthegungeon.wiki.gg/wiki/Goop |
| 22 | Enter the Gungeon (Poisbulon) | 2016 | Blob that leaves poison goop | https://enterthegungeon.wiki.gg/wiki/Poisbulon |
| 23 | The Binding of Isaac | — | Flickering hostile creep | https://bindingofisaacrebirth.wiki.gg/wiki/Creep |
| 24 | Divinity: Original Sin 2 | 2017 | Cursed poison = acid strips armour | https://www.gamepressure.com/originalsinii/environmental-effects-and-combinations/zea274 |
| 25 | Baldur's Gate 3 | 2023 | −2 AC acid surface | https://bg3.wiki/wiki/Acid_(surface) |
| 26 | Into the Breach | 2018 | Acid tiles, water converts | https://www.ludo.guide/guide/into-the-breach/game-mechanics |
| 27 | XCOM 2 | 2016 | Shred, 3-turn splashes, leaking suit | https://xcom.fandom.com/wiki/Acid_Burn |
| 28 | Factorio | — | Spitter puddle ladder | https://wiki.factorio.com/Spitters |
| 29 | Risk of Rain 2 | — | Acrid pools, poison that can't kill | https://riskofrain.wiki.gg/wiki/Acrid_(RoR2) |
| 30 | Path of Exile | — | Caustic ground on death | https://poedb.tw/us/Caustic_ground |
| 31 | Elden Ring | 2022 | Rot swamps and coatings | https://eldenring.wiki.gg/wiki/Scarlet_Rot |
| 32 | Don't Starve Together | — | Acid rain ecology | https://dontstarve.wiki.gg/wiki/Acid_rain |
| 33 | Dark Souls | — | Acid Surge durability burn | https://darksouls.wiki.fextralife.com/Acid+Surge |
| 34 | Dark Souls 2 | — | Gear-corroding egg crawlers | https://darksouls2.wiki.fextralife.com/Corrosive+Egg+Crawlers |
| 35 | Monster Hunter World: Iceborne | 2019 | Acid pools give Defense Down | https://samurai-gamers.com/monsterhunterworld/acidic-glavenus-monster-guide/ |
| 36 | Half-Life 2: Episode Two | — | Antlion worker acid burst | https://combineoverwiki.net/wiki/Antlion_Worker |
| 37 | Aliens: Fireteam Elite | 2021 | Acid-blood death puddles | https://gamespot.com/articles/aliens-fireteam-elite-xenomorph-enemy-guide-every-type-and-how-to-kill-them/1100-6495612/ |
| 38 | Splatoon | 2015 | Coverage as gameplay | https://sourcegaming.info/2016/08/26/holism-the-ink-of-splatoon/ |
| 39 | PixelJunk Shooter | 2009 | Fluid texture + one shading pass | https://gamedeveloper.com/programming/optimising-pixeljunk-shooter-and-giving-it-the-ultimate-look |
| 40 | The Legend of Zelda (Zol/Gel) | 1986– | Splitting slimes; Red Zol disarms | https://www.zeldadungeon.net/wiki/Zol |
| 41 | Zelda (ChuChu) | — | Element colours; split and re-merge | https://www.zeldadungeon.net/wiki/ChuChu |
| 42 | Zelda (Like Like) | 1986– | Shield-eating slime | https://zeldauniverse.net/2020/06/02/zeldas-study-like-like-species-overview/ |
| 43 | Tibia | — | Summoning slime, pool on death | https://tibia.fandom.com/es/wiki/Slime_(Creature) |
| 44 | Terraria | — | Items visible inside slimes | https://terraria.wiki.gg/wiki/Slimes |
| 45 | Stardew Valley | — | Depth colours, splits, breeding | https://stardewvalleywiki.com/Slimes |
| 46 | Minecraft | — | Three slime sizes | https://wikily.gg/minecraft/mobs/slime |
| 47 | Dragon Quest | 1986 | Teardrop slime, Metal Slime | https://en.wikipedia.org/wiki/Slime_(Dragon_Quest) |
| 48 | Slime Rancher | — | Contagious Tarr, water kills | https://slimerancher.gamepedia.com/The_Tarr |
| 49 | Ultima V–VII | — | Dividing, recombining slimes | https://wiki.ultimacodex.com/wiki/Slime |
| 50 | Rain World | — | Squishy procedural creatures | https://gamedeveloper.com/art/video-animating-i-rain-world-i-and-its-many-squishy-stretchy-creatures |
| 51 | Wolfenstein 3D | — | Fizzlefade | https://fabiensanglard.net/fizzlefade |
| 52 | Living Worlds (Canvas Cycle) | — | Palette-cycled water | https://experiments.withgoogle.com/canvas-cycle |
| 53 | Zelda: Breath of the Wild | — | Durability as strategy (interview) | https://www.zeldadungeon.net/wiki/Interview:Nintendo_Power_Podcast_December_21st_2017 |
| 54 | D&D 5e SRD (tabletop) | — | Oozes: split, engulf, corrode | https://dnd-srd-sphinx.readthedocs.io/en/latest/monster/oozes.html |
| 55 | Acid Sandbox (ours) | 2026 | Everything here, with X-ray views | `vfx-acid-sandbox.html` |

---

## 12. What remains unverified (and corrections)

**Corrections found by researchers.**
- **"Flow and changes in appearance"** is Dorsey, Pedersen & Hanrahan, SIGGRAPH 1996. Bosch et al. 2004 is a scratch-rendering paper [V, S146, S147].
- **DOOM suit leak.** The Doom Wiki says 6/256 (~2.3 %); the source tests `P_Random() < 5`, i.e. 5/256 (~2 %). This study follows the code [V, S4, S7].
- **Noita acid damage.** Fandom says 20–500 per second; wiki.gg says up to 637.5 submerged. Fandom's tag "[corrosive]" differs from the docs' "[corrodible]". Game files are authoritative [V, S79–S81].
- **Brogue's acid turret** is on the Brogue wiki but was not found in Brogue CE's monster catalogue [V, S31, S32].
- **Noita's acid is not self-limiting** in its corrodible reaction (the acid pixel survives) [V, S80].
- **Qud** evaporation: infobox 100 vs text 350 [V, S43].
- **DrawableTexture2D default blend**: tutorial `blend_mix` vs reference `blend_disabled` [V, S186, S187].
- **NetHack erosion floor**: the wiki gives a penalty floor of 0; the code floors weapon damage at 1 [V, S15, S23].
- **Silksong**: one guide places maggot water in "Sinner's Rise", probably wrongly [V-secondary, S215].
- **Sandbox** card mismatches (§8).

**Still unverified [U].** Quake slime damage and Biosuit duration; Half-Life acid values; Gungeon goop grid size and fade times; DCSS Tavern numbers (player proposal only); Eden 1961; Jakobsen's GDC year; Wyvill's polynomial; a primary source for marching squares; gold and aqua regia; `EXT_color_buffer_float` in Godot web; RGBAH/RGBAF DrawableTexture2D on web; DrawableTexture2D blit cost on WebGL 2; CanvasGroup threshold docs; `texture_sdf` at runtime; Powdered World Engine web export; Hugo Elias' original page and integer damping; the Doom fire stop condition; PixelJunk Shooter timings; Splatoon's ink resolution; Mewgenics and Hades II acid; Noita's rigid-body rebuild. The WebGPU 4× figure, the GDScript benchmark and the Rolled Alloys corrosion rates are vendor- or speaker-reported.

---

## 13. Prototype roadmap for Godot (web)

1. **Look first (1–2 days).** Port the Sandbox's floor shader: acid amount texture, Bayer edge threshold, depth bands, sheen, palette LUT with the four variants. Judge it with a static painted amount map.
2. **Tile truth.** Add the server-style tile layer: liquid enum, level 0–3, flags, and A1's global damage clock. Hook C3 corrosion stacks and C5 meters to it.
3. **CPU flow at 10–15 Hz.** A3 on dirty chunks in typed `PackedByteArray`s, with grout and drain heights. Profile GDScript on a low-end web device; move the loop to GDExtension only if needed.
4. **Materials.** B1–B3 on world objects (doors, bars, crates): per-pixel integrity, stage ramps, wet-edge fronts, 0.55 consumption. Item stages 0–3 with warnings, coatings and repair (§6b).
5. **Slimes.** CanvasGroup threshold that also samples the acid texture; split/merge/digest/burst using the Sandbox rules; mother-slime tell.
6. **Time.** Fume grid at half resolution, stain/salt/rust bytes with sampled fading, lime and water counters.
7. **Light and polish.** Block-sum glow with Bayer palette choice, bubble pops capped per screen, a ripple buffer on visible pools.
8. **Optional 4.7 path.** Move gather rules (fumes, stain decay) to `DrawableTexture2D` blits behind one wrapper script, since the API is experimental, and compare cost against the CPU path on WebGL 2.

---

## 14. Sources

Numbered for the inline [S#] references. More game and repository URLs appear in §4, §9 and §11. Every URL comes from the research notes or the Sandbox file. "Not fetched" marks sources whose content was not read.

**Series**
1. Sanglard, How DOOM fire was done: https://fabiensanglard.net/doom_fire_psx/
2. Kingsfoil, Top-down pixel snow (VFX #1): https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
3. Kingsfoil, Acid Sandbox: `vfx-acid-sandbox.html`

**Animated floors**
4. Doom Wiki, Damaging floor: https://doomwiki.org/wiki/Damaging_floor
5. Doom Wiki, Animated flat: https://doomwiki.org/wiki/Animated_flat
6. Doom Wiki, Nukage: https://doomwiki.org/wiki/Nukage
7. DOOM p_spec.c: https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/p_spec.c
8. Quake source (WinQuake): https://github.com/id-Software/Quake/tree/master/WinQuake
9. QuakeSrc tutorial 10: https://www.quakewiki.net/quakesrc/10.html
10. AOSP gl_warp_sin.h: https://android.googlesource.com/platform/gdk/+/jb-release/samples/quake/jni/gl_warp_sin.h
11. ludo.guide, Duke 3D hazards: https://www.ludo.guide/guide/duke-nukem-3d/02-04-11-environmental-damage-sources
12. EDuke32, EVENT_CHECKFLOORDAMAGE: https://wiki.eduke32.com/wiki/EVENT_CHECKFLOORDAMAGE
13. Metroid Wiki, Acid: https://metroid.fandom.com/wiki/Acid
14. Hollow Knight Wiki, Isma's Tear: https://hollowknight.wiki/w/Isma%27s_Tear

**Roguelikes**
15. NetHackWiki, Rust: https://nethackwiki.com/wiki/Rust
16. NetHackWiki, Acid: https://nethackwiki.com/wiki/Acid
17. NetHackWiki, Erosion: https://nethackwiki.com/wiki/Erosion
18. NetHackWiki, Acid blob: https://nethackwiki.com/wiki/acid_blob
19. NetHackWiki, Green mold: https://nethackwiki.com/wiki/Green_mold
20. NetHackWiki, Ochre jelly: https://nethackwiki.com/wiki/Ochre_jelly
21. NetHackWiki, Black pudding: https://nethackwiki.com/wiki/Black_pudding
22. NetHackWiki, Gelatinous cube: https://nethackwiki.com/wiki/gelatinous_cube
23. NetHack 3.7 source (trap.c, uhitm.c, weapon.c, obj.h, objclass.h, hack.h, monsters.h): https://github.com/NetHack/NetHack/tree/NetHack-3.7
24. Angband manual, Attacking: https://angband.readthedocs.io/en/latest/attack.html
25. Angband wiki, Elements: https://wiki.angband.live/index.php/Elements
26. TV Tropes, Dungeon Crawl: https://www.tvtropes.org/pmwiki/pmwiki.php/VideoGame/DungeonCrawl
27. Crawl Tavern proposal (player): https://crawl.develz.org/tavern/viewtopic.php?p=175376
28. Crawl blog p. 9: https://crawl.develz.org/wordpress/blog/page/9
29. DCSS source (player.cc, actor.h, cloud.cc, attack.cc, terrain.cc): https://github.com/crawl/crawl/tree/master/crawl-ref/source
30. Brogue Wiki, Acid Mound talk: https://brogue.fandom.com/wiki/Talk:Acid_Mound/@comment-103.101.153.224-20180612020244/@comment-27418381-20180615033649?oldid=9262
31. Brogue Wiki, Acid Turret: https://brogue.fandom.com/wiki/Acid_Turret?oldid=8205
32. Brogue CE source (Combat.c, GlobalsBrogue.c, Globals.c): https://github.com/tmewett/BrogueCE
33. Brogue Wiki, Caustic gas trap (not fetched): https://brogue.fandom.com/wiki/Caustic_gas_trap
34. D&D 5e SRD, Oozes: https://dnd-srd-sphinx.readthedocs.io/en/latest/monster/oozes.html
35. D&D 5e SRD, Rust Monster: https://dandwiki.com/wiki/5e_SRD:Rust_Monster
36. Ultima Codex, Slime: https://wiki.ultimacodex.com/wiki/Slime
37. SPD source (Blob, ToxicGas, CorrosiveGas, Corrosion, Ooze, CausticSlime, Slime, WandOfCorrosion, Char): https://github.com/00-Evan/shattered-pixel-dungeon/tree/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors
38. Pixel Dungeon Wiki, Debuffs: https://pixeldungeon.fandom.com/wiki/Debuffs
39. CDDA source (field_type.json, map_field.cpp, map.cpp, monattack.cpp, LICENSE.txt): https://github.com/CleverRaven/Cataclysm-DDA
40. CDDA wiki, Fields: https://srgnis.github.io/cdda-wiki/cdda_wiki/Fields.html
41. CDDA docs, Armor balance: https://docs.cataclysmdda.org/ARMOR_BALANCE_AND_DESIGN.html
42. CDDA forum, spitter acid: https://discourse.cataclysmdda.org/t/spitter-acid-is-way-too-effective-against-full-body-suits-like-rm13-combat-armor/7159
43. Qud wiki, Acid: https://wiki.cavesofqud.com/wiki/Acid
44. Qud wiki, Acid gas: https://wiki.cavesofqud.com/wiki/Acid_gas
45. Qud wiki, Corrosive Gas Generation: https://wiki.cavesofqud.com/wiki/Corrosive_Gas_Generation

**Surfaces, goop, puddles**
46. Gungeon wiki, Goop: https://enterthegungeon.wiki.gg/wiki/Goop
47. Gungeon wiki, Poisbulon: https://enterthegungeon.wiki.gg/wiki/Poisbulon
48. ETGMod (not read): https://github.com/KubeRoot/ETGMod
49. Isaac wiki, Creep: https://bindingofisaacrebirth.wiki.gg/wiki/Creep
50. Gamepressure, DOS2 surfaces: https://www.gamepressure.com/originalsinii/environmental-effects-and-combinations/zea274
51. DOS2 wiki, Acid (Status): https://dos2.wiki/wiki/Acid_(Status)
52. bg3.wiki, Acid (surface): https://bg3.wiki/wiki/Acid_(surface)
53. BG3 Fextralife, Elemental Surfaces: https://baldursgate3.wiki.fextralife.com/Elemental+Surfaces
54. ludo.guide, Into the Breach: https://www.ludo.guide/guide/into-the-breach/game-mechanics
55. ITB wiki, statuses: https://intothebreach.gamepedia.com/Abilities_and_status_effects?oldid=4665
56. XCOM wiki, Acid Burn: https://xcom.fandom.com/wiki/Acid_Burn
57. XCOM wiki, Acid Grenade: https://xcom.fandom.com/wiki/Acid_Grenade_(XCOM_2)
58. Gamepressure, XCOM 2 grenades: https://www.gamepressure.com/xcom2/grenades-and-explosives/z985e7
59. UFOpaedia, Andromedon: https://temp.ufopaedia.org/Andromedon_(XCOM2)
60. XCOM 2 Fextralife, Andromedon: https://xcom2.wiki.fextralife.com/Andromedon
61. Factorio wiki, Spitters: https://wiki.factorio.com/Spitters
62. RoR2 wiki, Acrid: https://riskofrain.wiki.gg/wiki/Acrid_(RoR2)
63. poedb, Caustic ground: https://poedb.tw/us/Caustic_ground
64. Elden Ring wiki.gg, Scarlet Rot: https://eldenring.wiki.gg/wiki/Scarlet_Rot
65. Elden Ring Fextralife, Scarlet Rot: https://eldenring.wiki.fextralife.com/scarlet+rot
66. DST wiki, Acid rain: https://dontstarve.wiki.gg/wiki/Acid_rain
67. Dark Souls Fextralife, Acid Surge: https://darksouls.wiki.fextralife.com/Acid+Surge
68. DS2 Fextralife, Corrosive Egg Crawlers: https://darksouls2.wiki.fextralife.com/Corrosive+Egg+Crawlers
69. DS2 Fextralife, Corrosive Urn (not fetched): https://darksouls2.wiki.fextralife.com/Corrosive+Urn
70. Samurai Gamers, Acidic Glavenus: https://samurai-gamers.com/monsterhunterworld/acidic-glavenus-monster-guide/
71. Kiranico, MHW status: https://mhworld.kiranico.com/guide/status
72. Combine OverWiki, Antlion Worker: https://combineoverwiki.net/wiki/Antlion_Worker
73. GameSpot, Aliens: Fireteam Elite: https://gamespot.com/articles/aliens-fireteam-elite-xenomorph-enemy-guide-every-type-and-how-to-kill-them/1100-6495612/
74. Source Gaming, Splatoon ink: https://sourcegaming.info/2016/08/26/holism-the-ink-of-splatoon/
75. UE forums, Splatoon coverage (community): https://forums.unrealengine.com/t/splatoon-how-to-calculate-areas-covered-by-different-colors/85942
76. Game Developer, PixelJunk Shooter: https://gamedeveloper.com/programming/optimising-pixeljunk-shooter-and-giving-it-the-ultimate-look
77. GDC Vault, Go With the Flow: https://gdcvault.com/play/1012447/Go-With-the-Flow-Fluid
78. SIGGRAPH history, PixelJunk Shooter 2: https://history.siggraph.org/learning/fluid-dynamics-and-lighting-implementation-in-pixeljunk-shooter-2-by-kessler-carabaich-and-kinoshita

**Per-pixel sims**
79. Noita fandom, Acid: https://noita.fandom.com/wiki/Acid
80. Noita wiki.gg, Acid: https://noita.wiki.gg/wiki/Acid
81. Noita wiki.gg, Reaction: https://noita.wiki.gg/wiki/Documentation:_Reaction
82. Noita wiki.gg, Material: https://noita.wiki.gg/wiki/Material
83. Noita wiki.gg, Stains: https://noita.wiki.gg/wiki/Stains
84. Noita wiki.gg, Rusted Metal (not read): https://noita.wiki.gg/wiki/Rusted_Metal
85. 80.lv, Noita: https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/
86. GDC Vault, Noita tech (not watched): https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design
87. r/howdidtheycodeit mirror: https://axebps-redlib.hf.space/r/howdidtheycodeit/comments/ej07ns/exploring_the_tech_and_design_of_noita
88. The Powder Toy, ACID.cpp: https://github.com/The-Powder-Toy/The-Powder-Toy/blob/master/src/simulation/elements/ACID.cpp
89. Sandspiel source (species.rs, lib.rs): https://github.com/MaxBittker/sandspiel
90. Bittker, Making Sandspiel: https://maxbittker.com/making-sandspiel
91. sand-slide (README, LICENSE, acid.h, acid_water.h, acid_gas.h, sand_simulation.cpp): https://github.com/kiwijuice56/sand-slide ; https://kiwijuice56.itch.io/sand-slide
92. Sandboxels licence: https://github.com/R74nCom/sandboxels/blob/main/license.txt
93. Powdered World Engine: https://store.godotengine.org/asset/cannedbottle/powdered-world-engine/
94. GamingOnLinux, Sandustry: https://www.gamingonlinux.com/2025/06/in-the-side-scroller-automation-game-sandustry-every-single-pixel-is-a-simulated-resource/page=1/

**Creatures**
95. Zelda Dungeon, Zol / Gel: https://www.zeldadungeon.net/wiki/Zol ; https://zeldadungeon.net/wiki/Gel
96. Zelda Dungeon, ChuChu: https://www.zeldadungeon.net/wiki/ChuChu
97. Zelda Universe, Like Like: https://zeldauniverse.net/2020/06/02/zeldas-study-like-like-species-overview/
98. TibiaWiki ES, Slime: https://tibia.fandom.com/es/wiki/Slime_(Creature)
99. Terraria wiki, Slimes: https://terraria.wiki.gg/wiki/Slimes
100. Stardew wiki, Slimes: https://stardewvalleywiki.com/Slimes
101. wikily, Minecraft slime: https://wikily.gg/minecraft/mobs/slime
102. Wikipedia, Slime (Dragon Quest): https://en.wikipedia.org/wiki/Slime_(Dragon_Quest)
103. Engadget, Horii on the slime: https://www.engadget.com/2010/07/10/yuji-horii-explains-the-dragon-quest-slimes-origin/
104. Slime Rancher wiki, Tarr: https://slimerancher.gamepedia.com/The_Tarr
105. Slime Rancher 2 1.0 news: https://www.slimerancher.com/news/full-release-and-physical-pre-orders

**Design and art**
106. imonk, Slimes: https://itch.io/t/1471610/pixel-tutorial-slimes
107. imonk, Slime Monster Design: https://itch.io/t/2614553/pixel-tutorial-slime-monster-design
108. imonk, Slime creatures (not fetched): https://itch.io/t/2118972/pixel-tutorial-drawing-slime-creatures
109. Slynyrd, Water in Motion: https://slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion
110. Kenney, Particle sprites: https://www.kenney.nl/learn/drawing-particle-effect-sprites
111. Lospec, Eight Hues of Toxic Ooze: https://lospec.com/palette-list/eight-hues-of-toxic-ooze
112. Lospec, poison tag (not fetched): https://lospec.com/palette-list/tag/poison
113. 80.lv, Pedro Medeiros: https://80.lv/articles/pixel-animation-tutorial-by-pedro-medeiros
114. Studio Miniboss tutorials: https://studiominiboss.itch.io/pixel-art-tutorials/community
115. Mighty Bear Games, UX and VFX: https://medium.com/mighty-bear-games/how-ux-design-can-help-with-vfx-a0925f80e0f0
116. Aonuma interview: https://www.zeldadungeon.net/wiki/Interview:Nintendo_Power_Podcast_December_21st_2017
117. Game Informer, breaking weapons: https://gameinformer.com/b/features/archive/2017/05/16/opinion-why-breaking-weapons-are-ruining-my-zelda-experience
118. GiantITP, gear-destroying monsters: https://forums.giantitp.com/archive/index.php/t-663703.html

**Grid simulation**
119. w-shadow, Simple fluid CA: https://w-shadow.com/blog/2009/09/01/simple-fluid-simulation
120. jgallant LiquidSimulator (blog not read): https://github.com/jongallant/LiquidSimulator
121. DwarfCorp water: https://www.gamedeveloper.com/programming/how-water-works-in-dwarfcorp
122. Minecraft Fluid (mirror): https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Fluid
123. Mei, Decaudin & Hu 2007, DOI 10.1109/PG.2007.15: https://hgpu.org/?p=2256
124. Jákó, CESCG 2011: https://www.old.cescg.org/CESCG-2011/papers/TUBudapest-Jako-Balazs.pdf
125. lisyarus, Water over terrain: https://lisyarus.github.io/blog/posts/simulating-water-over-terrain.html
126. Dagenais et al. 2018 (not read): https://profs.etsmtl.ca/epaquette/Research/Papers/Dagenais.2018.cg/
127. O'Brien & Hodgins 1995: https://doi.org/10.1109/CA.1995.393532 ; https://arxiv.org/pdf/2302.06087
128. Stam, Stable fluids: https://doi.org/10.1145/311535.311548 ; https://wdv.com/Aerospace/Fluids/StamFluidsforGames.pdf ; https://mikeash.com/pyblog/fluid-simulation-for-dummies.html
129. Macklin & Müller 2013: https://doi.org/10.1145/2461912.2461984
130. Blinn 1982: https://doi.org/10.1145/965145.801290
131. Wyvill et al. 1986: https://doi.org/10.1007/BF01900346
132. 2D metaballs: https://www.github.com/xtenzQ/2D-metaballs
133. Matyka & Ollila: https://arxiv.org/abs/physics/0407003 ; https://panoramx.ift.uni.wroc.pl/~maq/soft2d/node12.html
134. JellyCar soft bodies: https://gamedeveloper.com/programming/deep-dive-the-soft-body-physics-of-jelly-car-explained
135. Jakobsen, Character physics: https://gamedeveloper.com/programming/advanced-character-physics
136. Müller et al. 2007, PBD: https://doi.org/10.1016/j.jvcir.2007.01.005
137. Rain World: https://gamedeveloper.com/art/video-animating-i-rain-world-i-and-its-many-squishy-stretchy-creatures ; https://unity.com/blog/exploring-procedural-design-rain-world
138. GDScript typing benchmark: https://beep.blog/2024-02-14-gdscript-typing

**Weathering papers**
139. Dorsey & Hanrahan 1996: https://graphics.stanford.edu/papers/patina/
140. Dorsey et al. 1999: https://graphics.stanford.edu/~henrik/papers/sig99/
141. Mérillou et al. 2001: https://graphicsinterface.org/wp-content/uploads/gi2001-20.pdf
142. Chen et al. 2005: https://doi.org/10.1145/1073204.1073321
143. Mérillou & Ghazanfarpour 2008: https://doi.org/10.1016/j.cag.2008.01.003
144. Wang et al. 2006: https://doi.org/10.1145/1141911.1141951
145. Gu et al. 2006: https://doi.org/10.1145/1141911.1141952
146. Dorsey, Pedersen & Hanrahan 1996: https://graphics.cs.yale.edu/publications/flow-and-changes-appearance
147. Bosch et al. 2004: https://doi.org/10.1111/j.1467-8659.2004.00767.x
148. Paquette et al. 2001: https://profs.etsmtl.ca/epaquette/Research/Papers/Paquette.2001/
149. Paquette et al. 2002 (not read): https://graphicsinterface.org/proceedings/gi2002/gi2002-8
150. Desbenoit et al. 2004: https://doi.org/10.1111/j.1467-8659.2004.00765.x
151. Lu et al. 2007: https://doi.org/10.1145/1189762.1189765
152. Bellini et al. 2016: https://doi.org/10.1145/2897824.2925891
153. Turk 1991: https://doi.org/10.1145/127719.122749
154. Witkin & Kass 1991: https://doi.org/10.1145/127719.122750
155. Pearson 1993: https://doi.org/10.1126/science.261.5118.189
156. Karl Sims, Reaction-diffusion: https://karlsims.com/rd.html
157. Witten & Sander 1981: https://doi.org/10.1103/PhysRevLett.47.1400
158. Jones 2010, Physarum: https://doi.org/10.1162/artl.2010.16.2.16202 ; https://uwe-repository.worktribe.com/index.php/OutputFile/837928
159. Sage Jenson, Physarum (mirror): https://hn.jakechampion.name/reader/https://cargocollective.com/sagejenson/physarum

**Real chemistry**
160. Sulfuric acid (Wikipedia mirror): https://solarspell-dls.sfis.asu.edu/mea/wikipedia/wp/s/Sulfuric_acid.htm
161. Sugar charcoal: https://en.wikipedia.org/wiki/Sugar_charcoal
162. geology.com, Acid test: https://geology.com/minerals/acid-test.shtml
163. Oak National Academy, Acid + carbonate: https://www.thenational.academy/teachers/lessons/chemical-reactions-acid-and-metal-carbonate
164. Panossian et al. 2012: https://ipt.br/2021/09/29/corrosion-of-carbon-steel-pipes-and-tanks-by-concentrated-sulfuric-acid-a-review-2/
165. Rolled Alloys (vendor): https://www.rolledalloys.ca/?p=3051
166. RSC, Metals and acids: https://edu.rsc.org/experiments/microscale-reactions-of-metals-with-acids/509.article
167. Britannica, Sulfuric acid: https://www.britannica.com/science/sulfuric-acid
168. Forensic medicine, Chemical burns: https://www.forensicmed.co.uk/wounds/burns/chemical-and-electrical-burns/

**Old-school rendering**
169. Canvas Cycle: https://github.com/jhuckaby/canvascycle ; https://experiments.withgoogle.com/canvas-cycle
170. monochrom, Color cycling repost: https://monochrom.at/blog/?p=11592
171. Dave Rupert, Color cycling with workers: https://daverupert.com/2018/09/color-cycling-image-pixels-with-workers/
172. lodev, Plasma: https://www.lodev.org/cgtutor/plasma.html
173. flipcode, Art of Demomaking #4: https://flipcode.com/archives/The_Art_of_Demomaking-Issue_04_Per_Pixel_Control.shtml
174. Cohnen, Blobs2D: https://webpage-65r.pages.dev/pixelfx/Blobs2D/Blobs2D.htm
175. Geiss, Metaballs: https://geisswerks.com/ryan/BLOBS/blobs.html
176. Parusel, Simple fire: https://www.gamedev.net/articles/programming/graphics/simple-fire-effect-r222/
177. Microsoft, Silverlight ripples: https://learn.microsoft.com/en-us/archive/blogs/nikola/building-the-reallistic-water-ripples-sample-in-silverlight
178. Matyka, 2D water: https://maciejmatyka.blogspot.com/2018/03/2d-water-algorithm.html
179. Sanglard, Fizzlefade: https://fabiensanglard.net/fizzlefade
180. Ordered dithering (IPFS mirror): https://en.wikipedia-on-ipfs.org/wiki/Ordered_dithering
181. Munro's Postcarts: https://lexaloffle.com/bbs/?pid=80723
182. deater, dancing blobs (not inspected): https://files.scene.org/view/parties/2024/outline24/256_byte_intro_oldskool/dancing_blobs_by_deater.zip

**Godot and tooling**
183. Godot 4.7 release: https://godotengine.org/releases/4.7/
184. 4.7 news: https://app.cinevva.com/news/2026-06-19-godot-4-7-released ; https://digitalproduction.com/2026/06/23/godot-4-7-turns-up-hdr/
185. DrawableTexture2D class: https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/DrawableTexture2D.xml
186. texture_blit reference: https://github.com/godotengine/godot-docs/blob/master/tutorials/shaders/shader_reference/texture_blit_shader.rst
187. Drawable textures tutorial: https://github.com/godotengine/godot-docs/blob/master/tutorials/rendering/drawable_textures.rst
188. PR #105701: https://github.com/godotengine/godot/pull/105701
189. GLES3 texture_storage.cpp: https://github.com/godotengine/godot/blob/master/drivers/gles3/storage/texture_storage.cpp
190. GLES3 canvas: https://github.com/godotengine/godot/blob/master/drivers/gles3/shaders/canvas.glsl ; https://github.com/godotengine/godot/blob/master/drivers/gles3/rasterizer_canvas_gles3.cpp
191. Renderers: https://github.com/godotengine/godot-docs/blob/master/tutorials/rendering/renderers.rst
192. CanvasItem shaders: https://github.com/godotengine/godot-docs/blob/master/tutorials/shaders/shader_reference/canvas_item_shader.rst
193. GodotCon Boston 2026, WebGPU: https://talks.godotengine.org/godotcon-boston-2026/talk/CT739D/
194. GodotCon Amsterdam 2026, Retro VFX: https://talks.godotengine.org/godotcon-ams-2026/talk/NSNXFT/
195. GodotCon US 2025 talks: https://talks.godotengine.org/godotcon-us-2025/talk/UA37CQ/ ; https://talks.godotengine.org/godotcon-us-2025/talk/UAQ7H9/
196. GodotFest 2025, 2D raytracing: https://app.media.ccc.de/v/godotfest2025-raytracing-is-simple-for-2d-games/audio
197. Juckett, GDC 2026 (not opened): https://www.ryanjuckett.com/how-we-draw-a-3d-sprite-world-gdc2026/
198. engineer-game devlog (not opened): https://engineer-game.org/devlog/2025/12/07/shrinking-flow-after-flood.html
199. gamedev.net, physics-informed diffusion: https://gamedev.net/news/2276-physics-informed-video-diffusion-for-shallow-water-equations/
200. ProfesorShader, liquid texture: https://godotshaders.com/?p=15449
201. 2D dissolve with burn edge: https://godotshaders.com/shader/2d-dissolve-with-burn-edge/
202. Burn/dissolve from point: https://godotshaders.com/?p=10186
203. Dissolve (Godot 4.x): https://godotshaders.com/shader/dissolve-godot-4-x/
204. Burn tag: https://godotshaders.com/shader-tag/burn/
205. Metaballs: https://godotshaders.com/shader/metaballs/
206. SDF Metaballs (licence unchecked): https://godotshaders.com/?p=16686
207. CC0 list: https://godotshaders.com/shader-license/cc0/page/11/
208. Goo: https://godotshaders.com/shader/goo/
209. Goop Projectile: https://godotshaders.com/shader/goop-projectile/
210. SoftBody2D: https://godotengine.org/asset-library/asset/edit/11195 ; https://appsinacup.itch.io/godot-softbody2d
211. Nojoule: https://nojoule.itch.io/pixel-ui-vfx ; https://nojoule.itch.io/pixel-art-shaders/devlog/1108781/dissolve-effect-and-improvements
212. captainproton42, 2D Metaballs: https://captainproton42.github.io/2DMetaballs/
213. repos.ecosyste.ms: https://repos.ecosyste.ms/

**2025–26 games**
214. Hollow Knight Wiki, Putrified Ducts: https://hollowknight.wiki/w/Putrified_Ducts
215. xboxplay, maggot water guide: https://xboxplay.games/hollow-knight-silksong/how-to-cure-poison-from-maggot-water-in-hollow-knight-silksong-67004
216. PCGamesN, Wreath of Purity: https://www.pcgamesn.com/hollow-knight-silksong/wreath-of-purity
217. GamesRadar, Patch 4: https://www.gamesradar.com/games/action/silksongs-most-hated-areas-just-became-a-little-easier-thanks-to-desperately-desired-muckmaggot-nerfs
218. PC Gamer, Groal: https://www.pcgamer.com/games/action/silksong-bilewater-groal-maggots
219. Mewgenics: https://www.avclub.com/mewgenics-gets-a-early-2026-release-date ; https://www.rpgsite.net/news/21209-mewgenics-also-coming-to-playstation-5-switch-2-xbox-series-xs-on-september-8
220. Shacknews, Enter the Gungeon 2: https://shacknews.com/article/143752/enter-the-gungeon-2-pc-switch-2
