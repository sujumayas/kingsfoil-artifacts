# 13 - Characters in snow at 24x32 px

Researcher 13, VFX #11 "Snow at 32 px". Angle: what changes for characters when the sprite grows from 7x12 px (2x2 px prints) to 24x32 px on 32 px tiles.

Tool budget used: 30 calls. Method: I downloaded source files from open repos and read the numbers with grep. I did not open any image.

Legend
- **[C]** read this session from fetched source code. The file URL is in "Sources".
- **[P]** already in VFX #1 (`studies/vfx-snow/report.md`), pointed to, not repeated.
- **[I]** my inference or recommendation.
- **[U]** from memory or not verified this session. Treat as a lead.

Every number names its tile size and sprite size. Short names used below:
- **Emerald** = Pokémon Emerald, GBA, 16 px tiles, 16x32 px characters, about 60 game frames per second [U for the exact 59.73 Hz].
- **Platinum** = Pokémon Platinum, DS, 16-unit tiles in a 3D field, 32x32 px character billboards. The code counts ticks. The DS field is commonly said to run at 30 ticks per second [U].
- **Tibia** = 32 px tiles, outfits in 32x32 px cells (64x64 for large ones) [U for cell sizes], data from The Forgotten Server (TFS), Canary and OTClient.
- **MV** = RPG Maker MV, 48 px tiles, 48x48 px default character cell, 60 fps.
- **Stardew** = 16 px tiles, 16x32 px farmer, drawn at 4x zoom. Decompiled 1.x code.
- **LPC** = Liberated Pixel Cup sprites, 64x64 px cells.
- **Asterion** = the target. 32 px tiles, 24x32 px characters, 640x360 canvas.

---

## Q1. Footprints synced to the walk cycle

### Takeaway
- No shipped 2D game I could read places prints per foot from animation events. Emerald, Platinum and Tibia all place **one mark per tile left**, at the tile the character just walked off. The mark is a pre-drawn picture chosen by facing direction.
- The classic ratio is **one footfall per 16 px for a 32 px tall sprite** (0.5 x sprite height). At Asterion's scale that is 2 prints per 32 px tile.
- For Asterion, compute prints from **tile progress**, not from animation events. Make one walk cycle last exactly one tile. Then contact frames, prints and the tile grid stay in phase, and every client draws the same prints with no extra network data [I].

### Cited findings
- **Emerald, where the print goes** [C]. `DoTracksGroundEffect_Footprints` passes `objEvent->previousCoords` and `facingDirection`. `FldEff_SandFootprints` centres the sprite in that tile with an offset of (8, 8) px on a 16 px tile. The check runs in `GetAllGroundEffectFlags_OnBeginStep` and tests the **previous** tile's behaviour.
- **Emerald, print art** [C]. The print is one 16x16 px sprite (`gObjectEventBaseOam_16x16`, `overworld_frame(..., 2, 2, n)`). There are 2 pictures. South is picture 0 with `vFlip`, north is picture 0, west is picture 1, east is picture 1 with `hFlip`. So 2 drawings cover 4 directions. Deep sand uses a second set of 2 pictures with the same flips.
- **Emerald, lifetime** [C, also P]. Visible 41 frames, then `invisible ^= 1` every frame until the timer passes 56. Total about 57 frames, about 0.95 s.
- **Emerald, walk timing** [C]. `sStep1Funcs` has 16 entries, so a normal step is 16 frames per 16 px tile, 1 px per frame, about 267 ms. `sAnim_GoSouth` is 4 entries of 8 frames: step pose A, stand, step pose B, stand. One cycle is 32 frames, which is 2 tiles. Result: **one step pose per tile**, and one print sprite per tile.
- **Emerald, running** [C]. `sStep2Funcs` has 8 entries (8 frames per tile). `sAnim_RunSouth` is 5, 3, 5, 3 frames, 16 frames per cycle. Again 2 tiles per cycle and one step pose per tile.
- **Platinum, where the print goes** [C]. `ov5_021F1ECC` reads `MapObject_GetXPrev` and `GetZPrev` (the previous tile), the facing direction and the previous facing direction. Snow prints are placed 10 units below the object origin and 2 units back in z. Sand prints use 8 units and 1 unit forward.
- **Platinum, shallow against deep** [C]. Track type 2 (shallow snow) picks one of 4 models by facing direction. Track type 3 (deep snow) picks from a 4x4 table indexed by `[previous direction][direction]`, with values 4 to 9. That is 2 straight pieces and 4 corner pieces, the same layout the bike uses on sand. **Deep snow in Platinum draws a connected trench, not feet.**
- **Platinum, who leaves tracks** [C]. Each object graphic has a `trackType`: 0 none, 1 feet, 2 bike.
- **Platinum, lifetime** [C, also P]. Alpha starts at 31, holds 16 ticks, then drops 2 per tick and ends below 0. Total 32 ticks.
- **Stardew, the only "contact frame" rule I found in code** [C]. `checkForFootstep` plays a step sound only in the run animations (ids 32 to 56 and 128 to 152) and only when `indexInCurrentAnimation % 4 == 0`. The run cycle has 8 frames, so contacts are frames 0 and 4, two per cycle, 330 ms apart. Walking plays no footstep.
- **Godot mechanism** [C from a search result, not opened in full]. An `AnimationPlayer` call method track calls a function on a node at a chosen time in the animation. This is the event route if you want one. https://forum.godotengine.org/t/animation-player-call-func-track/30165
- Tikus Tales (velocity-aligned print quads, emission tied to the run animation) is in VFX #1 [P, S99].

### Inferences (recommendations for Asterion, 32 px tile, 24x32 sprite)
- **Spacing.** 2 prints per tile, 16 px apart. This keeps the Emerald and Platinum ratio of one footfall per 0.5 sprite heights. VFX #1 used one stamp per 4 px for a 12 px sprite (0.33 heights). Scaled, that is 10.7 px, or 3 prints per tile. 3 per tile breaks the "one cycle per tile" phase lock, so I prefer 2.
- **Position along the path.** Stamp when tile progress `p` passes 0.0 (left foot) and 0.5 (right foot). Put the print 4 px ahead of the body centre, because the planted foot leads the body in a step pose. Prints then land at 4 px and 20 px into the tile, never on a tile seam.
- **Lateral offset.** Facing north or south: 3 px left or right of the centre line (feet 6 px apart on a 24 px wide sprite whose body is about 12 px wide). Facing east or west in a 3/4 view the offset is across the screen's y axis and foreshortened: 1 px up for the far foot, 1 px down for the near foot.
- **Print size.** A boot of 3x5 px facing north or south and 5x3 px facing east or west. That is 15 cells against the old 4 cells. Draw 2 masks and flip them, as Emerald does. Give the heel row 1 px less width so direction reads.
- **Directions.** 4 are enough if characters face 4 ways while moving on a grid, as Tibia outfits do [U]. Diagonal steps reuse the east or west print and shift it along the diagonal.
- **Stamp into the depth field, do not draw a decal.** Use the C2 stamp from VFX #1 [P] with the 3x5 mask, keep 0.30, and 10 rim deposits on an ellipse of radius 4 px in place of 6 deposits at radius 2.2 px.
- **No animation events needed.** `p` is known from the step timer on every client. `foot = floor(p * 2)`. If the walk frame index is also derived from `p`, the boot in the sprite and the print in the snow cannot drift apart.

### Gaps
- I could not look at the Emerald or Platinum print art (no image access by rule), so I do not know how many of the 16x16 px are painted or whether one sprite shows one foot or a pair.
- No GameMaker or Godot footprint tutorial with real numbers was found. Two searches returned nothing specific.
- The Legend of Zelda (A Link to the Past, The Minish Cap) was not checked. No disassembly file was located inside the budget.
- pokeheartgold and pokefirered were not opened. Platinum and Emerald cover the same engines.

---

## Q2. Decals against field stamps

### Takeaway
Shipped decal pools are small and short-lived: 64 sprites for everything in Emerald, 256 marks for 10 s in Quake 3. Tibia has no pool at all, because the tile itself holds the footprint state for 10 s. A field stamp has no cap and no per-print draw cost, so it suits a crowd better [I].

### Cited findings

| Source | Pool | Lifetime | Fade | When full | Scale |
|---|---|---|---|---|---|
| Emerald [C] | `MAX_SPRITES 64`, shared with every sprite on screen | 57 frames (about 0.95 s) | 1-bit flicker for the last 16 frames | print is not created (`spriteId != MAX_SPRITES` check) | 16 px tile |
| Platinum [C] | not read | 32 ticks | alpha 31, minus 2 per tick after 16 ticks | not read | 16-unit tile |
| Quake 3 (ioquake3) [C] | `MAX_MARK_POLYS 256`, linked list | `MARK_TOTAL_TIME 10000` ms | linear over the last `MARK_FADE_TIME 1000` ms | frees the oldest marks, then reuses the slot | 3D |
| Tibia, TFS items.xml [C] | none, one state per tile | `duration` 10 (seconds), then `decayTo` the clean tile | none, hard swap | cannot fill | 32 px tile |
| VFX #1 ring buffer [P] | 64 to 256 | free choice | dither by age | overwrite oldest | 8 px tile |

- Quake 3 fade formula [C]: `t = time + 10000 - now; if (t < 1000) fade = 255 * t / 1000`.
- Trail texture sizes from 3D games (Batman 512 px squared, God of War 384 into 1024) are in VFX #1 [P, C3].

### Inferences
- A decal print at Asterion's size is a 5x5 px quad. 256 of them is nothing for the GPU, but each needs an age and a draw, and they do not refill with snowfall or respect depth. The depth field already does both.
- Keep decals only where there is no depth field to stamp: wet prints on stone after leaving snow, mud prints. A ring of 64 with a 3 s dithered fade is enough for those.

### Gaps
- Platinum's field effect pool size was not read.
- No GameMaker or Godot decal pool with numbers was found.

---

## Q3. Tile-to-tile movement (Tibia-like)

### Takeaway
- Tibia itself swaps the whole snow tile to a "walked on" tile when a **player** steps **off** it, and swaps it back after 10 s. There are 15 clean snow tiles and 15 footprint twins.
- A Tibia step lasts 250 to 600 ms for most players. The client changes the walk pose 3 times per tile.
- Per-foot prints still make sense with step-wise movement, because the client slides the sprite across all 32 px. Derive them from tile progress.

### Cited findings
- **TFS footprints** [C]. `movements.xml` registers `StepOut` on item 670 and items 6580 to 6593 with `snow.lua`. The script ignores non-players and players in ghost mode, then runs `item:transform(6594)` for 670 or `item:transform(itemid + 15)` for the others, then `item:decay()`. Monsters leave no prints.
- **TFS items** [C]. Items 6594 to 6608 are named "snow", carry the description "Someone must have walked here recently.", `decayTo` their clean twin, and `duration` 10.
- **Canary** [C]. Same script, with base id 799 in place of 670.
- **TFS step time** [C]. `calculatedStepSpeed = floor(857.36 * ln(stepSpeed / 2 + 261.29) - 4795.01 + 0.5)`. `duration = floor(1000 * groundSpeed / calculatedStepSpeed)`, rounded **up** to a multiple of 50 ms. Missing ground speed counts as 150. Diagonal steps take 3 times as long.
- **Step times I computed from that formula** [C formula, my arithmetic]. Player speed is 220 + 2 x (level - 1) [U].

| Level | Speed | Ground 150 | Ground 160 (snow [P, S12]) | Ground 200 |
|---|---|---|---|---|
| 1 | 220 | 550 ms | 600 ms | 750 ms |
| 8 | 234 | 550 ms | 550 ms | 700 ms |
| 50 | 318 | 400 ms | 450 ms | 550 ms |
| 100 | 418 | 350 ms | 350 ms | 450 ms |
| 200 | 618 | 250 ms | 250 ms | 350 ms |
| 400 | 1018 | 200 ms | 200 ms | 250 ms |

- **OTClient (edubart) walk animation** [C]. `footDelay = stepDuration / 3`. The pose advances when the foot timer passes `footDelay` and fewer than 32 px are walked: `phase = 1 + (footStep % (animationPhases - 1))`. The pose returns to 0 (standing) after `min(footDelay, 200)` ms at the end of a walk. So there are **3 pose changes per 32 px tile**, about 10.7 px each.
- **OTClient (mehah) walk animation** [C]. `footDelay = clamp(stepDuration / footAnimDelay, min, max)`. For outfits with 2 walk poses the clamp is 20 to 205 ms. For outfits with more poses and "enhanced animations" the divisor is `phases / 1.5`, and the clamp is 30 to 80 ms.

### Inferences
- **Strides per tile.** A two-step cycle that covers one tile gives a 16 px step, 0.5 sprite heights. This is the Pokémon ratio. MV's ratio is 1.25 tiles per step (60 px for a 48 px sprite), which slides visibly. OTClient's is 0.33 tiles per pose.
- **Where prints land in the tile.** At 4 px and 20 px of progress, plus or minus 3 px sideways (Q1).
- **Server model.** Follow Tibia: the server needs at most one "walked" flag per tile, or nothing. The client turns "character left tile T heading in direction D" into two boot stamps. Other clients get the same result from the same move message.
- **Turns.** Platinum's `[previous direction][direction]` table shows the minimum state needed for a clean corner. Stamp the second print of a tile with the outgoing direction.
- **Fast players.** At 250 ms per tile a 4-frame cycle runs at 62 ms per frame, which is fine. An 8-frame cycle would need 31 ms per frame, less than two 60 Hz screen frames. Show every second frame below about 270 ms per tile. mehah's 30 ms floor supports this.

### Gaps
- Snow ground speed (160) comes from VFX #1 [P, S12]. It sits in `items.otb`, a binary file I did not parse.
- How many animation phases each Tibia outfit has was not read from data. The mehah code implies that 3 phases (stand plus 2 walk poses) is the classic case.
- I did not check whether real Tibia servers also use 10 s. The number is from TFS and Canary data.

---

## Q4. Sinking and occlusion at 24x32

### Takeaway
- Platinum lowers the 32x32 px sprite by **12, 14 or 16 units** in deep, deeper and deepest snow. That is 37.5 %, 44 % and 50 % of the sprite cell.
- Platinum's speeds in those three tiers are **normal walk with running blocked, half speed, quarter speed**.
- Emerald hides rows by sprite priority (bottom 16 of 32 rows behind the grass layer) and adds a small overlay at the feet (16x8 px for deep sand).
- MV does not hide the legs. It draws the lowest 12 px of a 48 px sprite at 50 % opacity.

### Cited findings
- **Platinum sink distances** [C]. `sinkInDeepSnowDistance -12`, `sinkInDeeperSnowDistance -14`, `sinkInDeepestSnowDistance -16`, `sinkInMudDistance -12`, `sinkInDeepMudDistance -14`. `MapObject_SinkIntoTerrain` applies them as a y offset on the sprite (`MapObject_SetSpriteTerrainOffset`). An object can opt out through a "do not sink" flag.
- **Platinum speeds** [C]. `MapObject_GetDeepSnowMovementAction` replaces the player's action: deep gives `WALK_NORMAL`, deeper gives `WALK_SLOW`, deepest gives `WALK_SLOWER`. The walk actions are (units per tick, ticks): slower 0.5 x 32, slow 1 x 16, normal 2 x 8, fast and run 4 x 4, faster 8 x 2. Each covers one 16-unit tile. Because the run action is replaced, running is blocked in all three tiers.
- **Emerald long grass** [C]. `SetObjectEventSpriteOamTableForLongGrass` switches the 16x32 sprite to a table that splits it into a top 16x16 piece and a bottom 16x16 piece with priority 3, which draws behind the background layer. Up to the bottom 16 of 32 rows are hidden, wherever the grass tile has opaque pixels. It applies only when both the current and the previous tile are long grass.
- **Emerald, a second split** [C]. `sOamTable_16x32_2` gives priority 3 to only the bottom 16x8 piece (8 rows, 25 %). I did not trace which effect selects it.
- **Emerald deep sand** [C]. `FldEff_SandPile` adds a 16x8 px overlay at `y2 = height / 2 - 2`, so its centre is 2 px above the sprite's bottom edge. It covers the lowest 6 rows of a 32 px sprite. The animation is 3 frames of 4 game frames each and restarts when the character moves. It needs deep sand on both the current and previous tile.
- **Emerald short grass** [C]. A 16x16 px overlay at `y2 = height / 2 - 8`, drawn one sub-priority step in front of the character. It spans the lowest 16 rows. Animation is 2 frames of 4 game frames.
- **MV bush** [C]. `refreshBushDepth` sets `_bushDepth = 12` px on bush tiles, only when the character is not moving into the tile. `Sprite_Character` splits the sprite into an upper body and a lower body and sets `_lowerBody.opacity = 128`. 12 of 48 px is 25 %.
- VFX #1 numbers [P]: sink up to 4 of 12 rows (33 %), speed never below 45 %, RimWorld 100 / 76 / 62 / 52 %.

### Inferences (Asterion)
- **Sink bands.** 0, 4, 8, 12 px of the 32 px sprite. 4 px covers the boots, 8 px reaches mid-shin to knee, 12 px reaches the thigh and matches Platinum's first deep tier. Keep 14 and 16 px for scripted drifts. The old "1 row per 22 depth units, max 4" becomes "1 row per 8 depth units, max 12" if the byte range stays 0 to 255 [I, tune in the sandbox].
- **How to hide.** Platinum only moves the sprite down and lets the 3D ground cover it. In 2D the same look needs two steps: lower the sprite by `sink` px and discard the rows that fall below the foot line. In Godot that is one uniform in a CanvasItem shader (`if (UV.y > cut) discard`) or a shorter `region_rect` [I].
- **Front rim.** Draw a snow lip over the cut. Emerald's overlay is the full sprite width and 8 px tall on a 16 px wide sprite. For a 24 px wide sprite whose legs span about 12 px, a rim 14 to 16 px wide and 3 to 4 px tall is enough. Give it 2 or 3 frames that play only while moving, at about 66 ms per frame as in Emerald (4 frames at 60 fps).
- **Hysteresis.** Emerald and MV both wait until the character is fully on the tile, or on two such tiles in a row, before turning the effect on. Copy that. With a per-pixel field, smooth the sampled depth over about 100 ms so the sink does not flicker by 1 px per frame.
- **Speed.** Platinum's steps are x1 (no run), x0.5, x0.25. VFX #1's floor of 45 % is kinder. For an MMO I would use x1.0, x0.85, x0.7, x0.5 for the four sink bands and take the band from server tile data [I].

### Gaps
- How Platinum clips the lowered sprite (depth test against the ground model, or a second mechanism) was not traced.
- Zelda tall grass and Stardew were not checked for row hiding.
- RPG Maker VX Ace's bush depth at 32 px tiles was not read. I believe it is 8 px [U].

---

## Q5. Trenches and trails in deep snow

### Takeaway
The one hard 2D reference is Platinum: once snow is deep, footprints stop and a connected track made of 6 pieces (2 straight, 4 corners) follows the path. It fades in 32 ticks like every other track.

### Cited findings
- Platinum track type 3 and its `[previous direction][direction]` table [C], see Q1.
- Emerald's bike tracks use the same idea with 8 pieces [P, C1].
- Refill rules from Batman, the Zomboid mod and Animal Crossing are in VFX #1 [P, C3 and C6].

### Inferences
- **When to switch.** At a sink of 8 px or more the feet are hidden, so boot-shaped prints make no sense. Switch from two 3x5 px stamps per tile to a continuous stamp along the path.
- **Width.** 10 to 12 px for a 24 px wide sprite. That is the hip width, about half the sprite cell. Rims of 1 to 2 px on both sides bring the visible trench to about 14 to 16 px, half a tile.
- **How.** Stamp a 10x3 px bar across the walking direction every 2 px of progress, keep 0.4, and push the spill sideways only. 16 bars per tile at 30 cells each is 480 cell writes per tile walked, against 30 for two boots. Still small.
- **Refill.** Use the field's own deposit and sandpile relax. A trench 10 px wide closes from the sides first, which looks right.

### Gaps
- Don't Starve Together, Project Zomboid (vanilla) and The Long Dark were not checked. I know of no player trench in vanilla Don't Starve Together [U].
- I have no measured trench width from any 2D game.

---

## Q6. Snow on the character and small life cues

### Takeaway
I found no 2D game whose code builds snow on a hat or shoulders, or that draws breath. These stay our own design, already prototyped in VFX #1. The shipped numbers I can add are for dust, overlay animation and shadows.

### Cited findings
- **Emerald shadows** [C]. Four shadow sprites: small, medium, large, extra large. Vertical offsets are 4, 4, 4 and 16 px, used as `y = height / 2 - offset`. For a 32 px tall sprite the shadow centre sits 4 px above the sprite's bottom edge.
- **Emerald dust and grass puffs** [C]. Ground impact dust and the "jump out of tall grass" puff are single 16x8 px sprites.
- **Stardew run bob** [C]. The 8-frame run cycle lifts the body by 2 and 4 units on the airborne frames (frame durations 60 and 120 ms).
- **Platinum** [C]. A tile behaviour named `TileBehavior_IsSnowWithShadows` exists and triggers its own track type. I did not trace what it draws.
- VFX #1's own values [P, C5]: 3 puffs per step above depth 18, breath every 1.4 to 2.0 s, a 3 px head cap above `snowy` 0.4.

### Inferences (Asterion, 24x32 sprite)
- **Kicked snow.** 2 to 3 particles per contact, only when sink is 4 px or more. Size 1 px with one 2 px chunk. Lifetime 250 to 400 ms. Launch 6 to 10 px backward and 4 to 8 px up. Local player and nearby players only.
- **Breath.** A 3-frame puff that grows from 2x2 to 5x4 px over 450 ms, placed 2 px in front of the mouth, drifting 3 px up. One every 3 to 4 s when idle and every 1.5 to 2 s after running. Hide it when facing north, because the head covers it.
- **Snow on the body.** A cap of 8x2 px on the head and 3x1 px on each shoulder, drawn as an overlay keyed to the facing direction (4 small sprites). Grow it over 20 to 30 s of standing in snowfall. Shake it off on the first step with 3 to 4 particles. This costs one extra sprite per snowy character.
- **Shadow.** An ellipse of 14x5 px, centred 3 to 4 px above the sprite's bottom edge (Emerald's 4 px rule). On snow, draw it by switching snow pixels to the cold shadow shade from the palette [P, E1], not by blending black. When the character sinks, shrink the ellipse by 2 px per sink band.

### Gaps
- No source for hat snow or breath in any shipped 2D game.
- Particle counts per step in real 2D games were not found.

---

## Q7. Walk cycles at this size

### Takeaway
The common 2D RPG walk is **two step poses with a neutral pose between them**, 4 displayed frames per cycle. Frame time runs from 133 ms (Emerald) to 200 ms (Stardew). Only LPC and newer Tibia outfits use 8 frames.

### Cited findings

| Game | Tile, sprite | Drawn poses per direction | Displayed cycle | Frame time | Cycle | Distance per cycle |
|---|---|---|---|---|---|---|
| Emerald walk [C] | 16 px, 16x32 | 3 (stand, step A, step B) | A, stand, B, stand | 8 frames, about 133 ms | 32 frames, about 533 ms | 2 tiles, 32 px |
| Emerald run [C] | 16 px, 16x32 | 3 run poses | 5, 3, 5, 3 frames | 83 and 50 ms | 16 frames, about 267 ms | 2 tiles, 32 px |
| MV [C] | 48 px, 48x48 | 3 | 0, 1, 2, 1 (pattern 1 is neutral) | 10 frames, 167 ms at speed 4 | 40 frames, 667 ms | 2.5 tiles, 120 px |
| Stardew walk [C] | 16 px, 16x32 | 3 | step, stand, step, stand | 200 ms | 800 ms | not read |
| Stardew run [C] | 16 px, 16x32 | 5 | 8 frames | 90, 60, 120, 60, 90, 60, 120, 60 ms | 660 ms | not read |
| Tibia classic, OTClient edubart [C] | 32 px | 2 walk + stand [U] | alternate 2 poses | step time / 3 | 2/3 of a step | 21 px |
| Tibia, OTClient mehah [C] | 32 px | 2, or more with "enhanced animations" | loop | 20 to 205 ms, or 30 to 80 ms | varies | varies |
| LPC [C] | 64x64 cell | 9 columns (stand + 8) | columns 1 to 8 | not defined in the files I read | 8 frames | free |
| Platinum [C for speeds] | 16 units, 32x32 | not read | not read | not read | not read | 8 ticks per tile at normal walk |

- MV details [C]: `distancePerFrame = 2^speed / 256` tiles, so speed 4 is 16 frames per tile. `animationWait = (9 - speed) * 3` and the counter rises 1.5 per frame while moving, so the pattern changes every 10 frames at speed 4.
- LPC details [C]: `FRAME_SIZE = 64`. `walk: { row: 8, num: 4, cycle: [1,2,3,4,5,6,7,8] }`, `run: cycle [0..7]`, `idle: cycle [0,0,1]`. Four direction rows per animation.
- An OpenGameArt forum post says the LPC 8-frame walk can be cut to 6 frames (1,2,4,5,7,8) or 4 frames (1,3,5,7) [search snippet only, U]. https://opengameart.org/forumtopic/lpc-walk-cycle-with-varying-speed

### Inferences: recommended contact timing for Asterion
Let `T` be the server step time for one 32 px tile (250 to 600 ms, Q3) and `p` the progress through the tile, 0 to 1.

**4-frame cycle, one cycle per tile**

| Frame | p range | Pose | Event |
|---|---|---|---|
| 0 | 0.00 to 0.25 | left step (leg forward, planted) | stamp left print at p = 0 |
| 1 | 0.25 to 0.50 | pass (neutral, body 1 px up) | |
| 2 | 0.50 to 0.75 | right step | stamp right print at p = 0.5 |
| 3 | 0.75 to 1.00 | pass | |

Frame time is `T / 4`: 137 ms at T = 550 ms, 87 ms at 350 ms, 62 ms at 250 ms. Emerald and OTClient both start a walk on a step pose, which makes input feel instant, so frame 0 is a step.

**8-frame cycle, one cycle per tile**

| Frame | p | Pose | Event |
|---|---|---|---|
| 0 | 0.000 | left contact | stamp left print |
| 1 | 0.125 | left down (body 1 px low) | kick particles if sunk |
| 2 | 0.250 | pass | |
| 3 | 0.375 | up (body 1 px high) | |
| 4 | 0.500 | right contact | stamp right print |
| 5 | 0.625 | right down | kick particles if sunk |
| 6 | 0.750 | pass | |
| 7 | 0.875 | up | |

Frame time is `T / 8`: 69 ms at T = 550 ms, 44 ms at 350 ms, 31 ms at 250 ms. Below about 270 ms per tile, show frames 0, 2, 4, 6 only. Stardew's rule (contacts at index 0 and 4 of 8) is the cited match for this layout.

- **3-pose art (RPG Maker style)** fits the 4-frame table with no change: A, neutral, B, neutral.
- **Idle.** Return to the stand pose within `min(T / 3, 200)` ms of stopping, as OTClient does.

### Gaps
- Which LPC columns are the contact poses was not checked, because that needs looking at the sheet.
- Tibia outfit phase counts were not read from sprite data.
- Platinum and Gen 5 walk animation frame counts were not read. Only step speeds were.
- Stardew's walk speed in px per tick lives in `Farmer.cs`, which I did not fetch.

---

## Q8. The MMO case: 20 or more players leaving prints

### Takeaway
With stamps into a field the cost is a few thousand byte writes per second and needs no cap. The things to cap are particles and overlays, not prints.

### Cited findings
- Caps in shipped code: Emerald 64 sprites in total, print skipped when full [C]. Quake 3 256 marks, oldest freed first [C]. Tibia one state per tile, 10 s [C]. Tibia gives prints to players only, never monsters [C].
- Batman's "update 2 surfaces per frame" rule and Junker and Palamas's 100 agents above 30 fps are in VFX #1 [P].

### Inferences (my arithmetic, estimates)
- **Rate.** 20 players at 400 ms per tile make 50 tiles per second and 100 boot stamps per second. Each stamp is 15 cells plus 10 rim deposits, so about 2,500 byte writes per second. 100 players make about 12,500. Both are far below the field's own tick (VFX #1 runs 9,400 random picks per frame at 320x180).
- **If decals were used.** 100 prints per second with Tibia's 10 s life is 1,000 live decals. Quake 3's cap of 256 would allow 2.5 s. Emerald's 0.95 s life would hold about 95. This is why the field wins for crowds.
- **Screen bound.** 640x360 shows 20 x 11.25 tiles, 225 tiles. Two prints per tile is at most 450 visible prints however many players there are, because new stamps overwrite old ones in the same cells.
- **Dirty area.** A stamp touches a 7x9 px box. 100 stamps per second touch at most 6,300 px per second, about 2.7 % of a 230,400 px field. Upload dirty 32x32 px chunks, not the full texture.
- **Drop order when the frame is slow.**
  1. Kicked particles for other players.
  2. Breath and body snow for players more than about 8 tiles away.
  3. Rim deposits (stamp the hole only, 15 writes).
  4. Per-foot prints for other players. Fall back to one 6x6 px stamp per tile, the Tibia and Pokémon level of detail.
  5. In crowded tiles, stop stamping and raise the per-tile wear counter (C6 in VFX #1 [P]).
- **Never drop** the local player's own prints and sink. They are what the player looks at.
- **Monsters.** Tibia skips them. For Asterion give each creature type a track type as Platinum does (0 none, 1 feet, 2 other), so flying and ghost creatures cost nothing.

### Gaps
- No measured ms numbers for stamps on low-end web hardware. The sandbox must measure this.
- No 2D MMO with client-side footprint code was found to compare caps.

---

## Gems

| Name | URL | Licence | Maturity | What it saves |
|---|---|---|---|---|
| Universal LPC Spritesheet Character Generator | https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator | Code GPL-3.0 (GitHub API). Art is per asset: CC-BY-SA, CC-BY, OGA-BY, GPL or CC0, and credits are required (README) | 2,006 stars, pushed 11 Nov 2026 | Open character sheets with a 9-column walk (stand + 8) and an 8-frame run in 4 directions, 64x64 px cells. Useful as test sprites for contact timing. Not 24x32, so they need a redraw or a scale test |
| pret/pokeemerald | https://github.com/pret/pokeemerald | No licence file (API returns none). Reference only, do not copy code or art | 3,686 stars, pushed Oct 2026 | Exact rules for prints, sprite splitting in grass, sand pile overlay, shadow offsets |
| pret/pokeplatinum | https://github.com/pret/pokeplatinum | No licence file. Reference only | 609 stars, pushed Nov 2026 | Deep snow sink distances, speed tiers, shallow against deep track choice |
| otland/forgottenserver | https://github.com/otland/forgottenserver | GPL-2.0 | 1,844 stars, pushed Nov 2026 | Tibia snow footprint tile swap, step duration formula |
| opentibiabr/canary | https://github.com/opentibiabr/canary | GPL-2.0 | 668 stars, pushed Nov 2026 | Same footprint script in the newer script format |
| edubart/otclient and mehah/otclient | https://github.com/edubart/otclient , https://github.com/mehah/otclient | API reports "NOASSERTION". I did not open the LICENSE files | 709 and 541 stars, mehah pushed Nov 2026 | Client walk animation timing for tile-to-tile movement |
| rpgtkoolmv/corescript | https://github.com/rpgtkoolmv/corescript | MIT | 326 stars, last push Aug 2021 | Readable bush depth and walk pattern code, safe to copy ideas and code from |
| ioquake/ioq3 | https://github.com/ioquake/ioq3 | GPL-2.0 | 2,870 stars, pushed Nov 2026 | A small, clear mark pool with time fade (`cg_marks.c`) |

A third-party decompilation of Stardew Valley was read for numbers only: https://github.com/E-riCA0/StawdewValley . It has no licence and is not a gem.

## See it in action
- Pokémon Platinum deep snow (Route 216 and 217): https://bulbapedia.bulbagarden.net/wiki/Sinnoh_Route_217 (may return 403, as CONTEXT warns)
- Pokémon Emerald sand prints (Route 111 desert): https://bulbapedia.bulbagarden.net/wiki/Hoenn_Route_111
- Tibia snow footprints, item 6594: https://tibia.fandom.com/wiki/Snow_(Footprints) (not fetched, URL may differ)
- LPC walk and run previews play in the generator: https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/

## Sources
Code read this session (all fetched 12 Nov 2026):
- pokeemerald `src/field_effect_helpers.c` (prints, fade, shadows, short grass, sand pile): https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c
- pokeemerald `src/event_object_movement.c` (track trigger, long grass table, step tables): https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
- pokeemerald `src/data/object_events/object_event_anims.h` (walk and run frame times): https://github.com/pret/pokeemerald/blob/master/src/data/object_events/object_event_anims.h
- pokeemerald `src/data/object_events/object_event_subsprites.h` (16x32 split tables): https://github.com/pret/pokeemerald/blob/master/src/data/object_events/object_event_subsprites.h
- pokeemerald `src/data/field_effects/field_effect_objects.h` (print pictures and flips, overlay sizes): https://github.com/pret/pokeemerald/blob/master/src/data/field_effects/field_effect_objects.h
- pokeemerald `include/sprite.h` (`MAX_SPRITES 64`): https://github.com/pret/pokeemerald/blob/master/include/sprite.h
- pokeplatinum `src/map_object_move.c` (sink distances, track types): https://github.com/pret/pokeplatinum/blob/main/src/map_object_move.c
- pokeplatinum `src/player_move.c` (`MapObject_GetDeepSnowMovementAction`): https://github.com/pret/pokeplatinum/blob/main/src/player_move.c
- pokeplatinum `src/unk_020655F4.c` (walk actions, units and ticks): https://github.com/pret/pokeplatinum/blob/main/src/unk_020655F4.c
- pokeplatinum `src/overlay005/ov5_021F1CC8.c` (track placement, piece table, fade): https://github.com/pret/pokeplatinum/blob/main/src/overlay005/ov5_021F1CC8.c
- TFS `data/movements/scripts/snow.lua`: https://github.com/otland/forgottenserver/blob/master/data/movements/scripts/snow.lua
- TFS `data/movements/movements.xml` ("Snow footprint tiles"): https://github.com/otland/forgottenserver/blob/master/data/movements/movements.xml
- TFS `data/items/items.xml` (items 6594 to 6608, `duration` 10): https://github.com/otland/forgottenserver/blob/master/data/items/items.xml
- TFS `src/creature.cpp` (`getStepDuration`, speed constants): https://github.com/otland/forgottenserver/blob/master/src/creature.cpp
- Canary `data/scripts/movements/snow.lua`: https://github.com/opentibiabr/canary/blob/main/data/scripts/movements/snow.lua
- OTClient (edubart) `src/client/creature.cpp` (`updateWalkAnimation`, `getStepDuration`): https://github.com/edubart/otclient/blob/master/src/client/creature.cpp
- OTClient (mehah) `src/client/creature.cpp`: https://github.com/mehah/otclient/blob/main/src/client/creature.cpp
- RPG Maker MV corescript `js/rpg_objects/Game_CharacterBase.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_objects/Game_CharacterBase.js
- RPG Maker MV corescript `js/rpg_sprites/Sprite_Character.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Character.js
- ioquake3 `code/cgame/cg_marks.c` and `cg_local.h`: https://github.com/ioquake/ioq3/blob/main/code/cgame/cg_marks.c , https://github.com/ioquake/ioq3/blob/main/code/cgame/cg_local.h
- LPC generator `README.md`, `sources/state/constants.ts`, `sources/canvas/preview-animation.ts`: https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator
- Stardew Valley decompilation `FarmerSprite.cs` (walk and run frames, `checkForFootstep`): https://github.com/E-riCA0/StawdewValley/blob/HEAD/FarmerSprite.cs
- GitHub REST API repo records for stars, push dates and licences: https://api.github.com/repos/<owner>/<repo>

Search results used as leads only:
- Godot forum, AnimationPlayer call track: https://forum.godotengine.org/t/animation-player-call-func-track/30165
- OpenGameArt forum, LPC walk cycle with varying speed: https://opengameart.org/forumtopic/lpc-walk-cycle-with-varying-speed

Earlier study, pointed to and not repeated:
- `studies/vfx-snow/report.md` sections C1 to C6 and 6a, sources S6 to S13, S23, S29, S69, S99, S123.

Scratch copies of the small source files are in `studies/vfx-snow-32px/notes/scratch-13/dl/`. The Platinum clone, the Stardew file and the large Tibia item list were deleted after reading.
