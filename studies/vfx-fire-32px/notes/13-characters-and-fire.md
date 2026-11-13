# 13 - Characters at 24x32 px and fire

Researcher 13, VFX #12 "Fire at 32 px". Scope item 5. What changes for burning, torch-carrying and fire-lit characters when the sprite grows to 24x32 px on 32 px tiles at a 640x360 canvas.

Budget used is about 31 tool calls. Method: I downloaded source files from open repos (TFS, OTClient edubart and mehah, RPG Maker MV corescript, pokeemerald, a Terraria decompile) into `scratch-13/` and read numbers with grep. I opened no images. Fan wikis were mostly blocked or thin, so the game list in the brief is only partly covered. Gaps are listed per question.

Legend
- **[cited]** read this session from a source file or page. The URL is in the bullet or in "Sources".
- **[inference]** my reasoning or recommendation.
- **[U]** from memory, not verified this session. Treat as a lead.
- **[VFX6-09]** already in `studies/vfx-fire/notes/09-combat-fire-lava.md`. Pointed to, not repeated.
- **[snow-13]** already in `studies/vfx-snow-32px/notes/13-characters-in-snow.md`. Reused, not redone.

Scale names used below
- **Tibia** = 32 px tiles, outfits in 32x32 px cells, game window 15x11 tiles [U for window and cell size]. Asterion's tile is the same size, so Tibia numbers carry over 1:1.
- **MV** = RPG Maker MV, 48 px tiles, 48x48 px character cell. Multiply px by 0.667 for Asterion.
- **Emerald** = Pokémon Emerald battle scene, about 60 fps, battler sprites 64x64 px [U].
- **Terraria** = 16 px tiles, player hitbox 20x42 px [cited, `Player.cs` lines 114-115]. Multiply px by 2 for Asterion's tile, or by about 0.76 to match character height (32/42).
- **Asterion** = 32 px tiles, 24x32 px characters, 640x360 canvas, 4-frame walk at T/4 per frame [snow-13 Q7].

---

## Q1. How do shipped games draw "burning" on a small character?

### Takeaway
Three patterns exist, from cheapest to richest.
1. **No overlay at all (Tibia).** The burn is a status icon plus one hit effect and one orange number per damage tick. The character sprite never changes.
2. **Tint plus a particle stream (Terraria).** Green and blue are scaled down, so the sprite turns orange-red. Fire dust spawns over the hitbox at 15 per second on players and 45 per second on NPCs.
3. **A few looping flame sprites over the body (Pokémon Emerald, RPG Maker MV overlays).** Emerald uses 3 flames of 32x32 px OAM, a 5-frame loop at 67 ms per frame, spawned 4 frames apart. MV overlays are one 96x96 px, 8-frame loop at 133 ms per frame, anchored at the feet.

For Asterion, pattern 2 or 3 at about 2 to 3 small flames is enough. The tint does half the work for zero cost.

### Cited findings
- **Tibia server, no overlay** [cited]. In TFS `ConditionDamage::getIcons`, `CONDITION_FIRE` only sets `ICON_BURN` (bit `1 << 1` in `const.h`). Nothing else in the condition changes the creature's look. https://github.com/otland/forgottenserver/blob/master/src/condition.cpp , https://github.com/otland/forgottenserver/blob/master/src/const.h
- **Tibia, per tick** [cited]. Each tick runs `ConditionDamage::doDamage`, which builds a `CombatDamage` with `origin = ORIGIN_CONDITION`. In `game.cpp` the fire damage type maps to `TEXTCOLOR_ORANGE` (198) and the magic effect `CONST_ME_HITBYFIRE` (id 16). So each burn tick shows one fire hit effect on the tile and one orange number. Same files plus https://github.com/otland/forgottenserver/blob/master/src/game.cpp (around line 4115).
- **Tibia, PvP field damage** [cited]. In `doDamage`, if the condition came from a field and both attacker and target are players, the damage is halved (`std::round(value / 2.)`). condition.cpp.
- **Tibia fire field tick numbers** (20 on entry, then 10 every 10 s, three stages) are in [VFX6-09] and VFX #6 note 01.
- **OTClient effect timing** [cited]. mehah otclient `data/setup.otml` sets `effect-ticks-per-frame: 75`. `Effect::drawEffect` picks `phase = min(elapsed / 75, phases - 1)` for legacy data without an animator. So a Tibia hit effect plays at 75 ms per frame. https://github.com/mehah/otclient/blob/main/data/setup.otml , https://github.com/mehah/otclient/blob/main/src/client/effect.cpp
- **Terraria NPC on fire** [cited]. In `Main.cs` (NPC draw loop), when `onFire` is set and `Main.rand.Next(4) < 3` (75% per tick), it spawns dust type 6 in a box of the hitbox grown by 2 px on each side. Initial velocity is the NPC's velocity x 0.4, alpha 100, scale 2.5, `noGravity = true`. Then velocity x 1.8 and velocity.Y minus 0.5. The tint is `B *= 0.6`, `G *= 0.7`, red unchanged. https://github.com/dptetc/Freeria/blob/6eedc5ff0752e1e5854a08f01db04edfcda3346f/Freeria/Main.cs (line 5838)
- **Terraria player on fire** [cited]. Same dust and tint, but the chance is `Main.rand.Next(4) == 0` (25% per tick). Same file, line 6354. At 60 ticks per second that is 15 dust per second on a player and 45 on an NPC [inference from the 60 Hz tick, U].
- **Terraria on fire regen** [cited]. `lifeRegen = -8` while `onFire` in `Player.cs` line 1742. Touching any liquid removes buff 24 unless it is lava (line 3276). https://github.com/dptetc/Freeria/blob/6eedc5ff0752e1e5854a08f01db04edfcda3346f/Freeria/Player.cs
- Caveat on the Terraria file. It is a decompile inside a mod repo ("Freeria"). The `NPC.cs` in that repo has `versionNumber = "v. Codename Lion"`. It is old code (1.1 era by its structure [U]). Current Terraria may use different rates. The wiki numbers for On Fire! (4 HP per second, 1 every 0.25 s) are in [VFX6-09].
- **Pokémon Emerald burn status** [cited]. `Status_Burn` in `data/battle_anim_scripts.s` calls `BurnFlame` 3 times. Each call is `createsprite gBurnFlameSpriteTemplate, ANIM_TARGET, 2, -24, 24, 24, 24, 20, 1, 1` then `delay 4`. https://github.com/pret/pokeemerald/blob/master/data/battle_anim_scripts.s (line 10235)
- **Emerald flame sprite** [cited]. `gBurnFlameSpriteTemplate` uses `ANIM_TAG_SMALL_EMBER`, OAM `32x32`, anims `gAnims_BasicFire`. `sAnim_BasicFire` is 5 frames of 4 game frames each, then jump to 0. `AnimBurnFlame` negates args 0 and 2 and hands off to `AnimTravelDiagonally`. https://github.com/pret/pokeemerald/blob/master/src/battle_anim_fire.c (lines 225-271, 635)
- **RPG Maker MV state overlay** [cited]. `Sprite_StateOverlay` draws from `img/system/States.png`. Frame `96 x 96`, `pattern = (pattern + 1) % 8`, `animationWait() = 8` frames. Source x is `pattern * 96`, source y is `(overlayIndex - 1) * 96`. Anchor is `(0.5, 1)`, so it sits on the battler's feet. https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_StateOverlay.js
- **Enter the Gungeon** [VFX6-09]. Burning enemies show flames on the sprite and are tinted red. Burn is mostly 4 DPS for 4 s.
- **Pokémon Gen V** burned Pokémon glow red [VFX6-09, from a Bulbapedia snippet].
- **Noita** [cited]. On fire costs 2% of max HP per second. Burning creatures stop attacking and move 15% faster. Almost any liquid, oil included, puts it out. The page describes no visual beyond the icon. https://noita.wiki.gg/wiki/Status_effects
- **Don't Starve** [cited]. Burning things deal 8-12 health per second to a player too close. Burning mobs run around and spread fire. The page has no detail on a burning player's look. https://dontstarve.wiki.gg/wiki/Fire

### Inferences (Asterion, 24x32 sprite)
- **Emerald arithmetic.** 4 game frames is about 67 ms, so the flame loop is 5 x 67 = 333 ms. The `20` argument to `AnimTravelDiagonally` is a duration in frames, so each flame lives about 333 ms and the three start 67 ms apart. I read the offsets as each flame drifting about 48 px sideways across a 64 px battler. That reading needs the function body, which I did not open.
- **MV arithmetic.** 8 x 8 = 64 game frames, so a 1.07 s loop at 133 ms per frame. A 96x96 px overlay on a 48x48 px character is 2x the character width. Scaled to Asterion that is a 64x64 px overlay cell, but most of it must be empty.
- **Terraria arithmetic.** 15 dust per second is the "player" density. With scale 2.5 dust that reads as a busy flame stream on a 20x42 px body. Dust 6 frames are 8x8 px in the sheet [U], so drawn size is roughly 10 to 20 px as they shrink. At Asterion's art scale with no sprite scaling, use 3x3 and 2x2 px flame particles instead.
- **Recommended burning status for Asterion.**
  1. Tint the character in the sprite shader. Copy Terraria's ratio, R x 1.0, G x 0.7, B x 0.6. Better, swap to a 4-entry warm palette row so pixels stay on palette. One uniform, no extra draw.
  2. 2 small flame sprites, 8x10 px, 4 frames at 100 ms (10 fps), placed at the shoulder and the hip on the side away from the camera, phase offset by 2 frames. A third flame of 6x8 px at the head on even ticks only. This is Emerald's "3 flames" idea at 1/4 the size, because a 32x32 flame on a 24x32 body hides the character.
  3. Embers from the pool [VFX #6 §1], 2x2 px, 6 to 8 per second per character. That is half of Terraria's player rate, because Asterion has many players on screen (Q5).
  4. Smoke. One 4x4 px grey puff every 0.5 s from the head, rising 0.5 px per frame and fading over about 1 s (shorter than the Stardew chimney figure in VFX #6, so it does not trail across tiles while walking).
  5. Damage feedback per server tick. One white flash frame (or 50 ms of full white) plus the orange number (Q6). This is the Tibia signal, and players of Tibia-likes read it at once.
- **Server data.** Keep the TFS split. The server sends "burning until tick N" and the damage per tick. The client derives tint, flames, embers and smoke from that flag and a per-creature hash seed [VFX6-09].
- **Status icon.** Tibia relies on the HUD icon for the local player. Asterion needs it too, because the tint is hard to see at night under warm light.

### Gaps
- No death-by-fire frames found in any source read. Tibia, Terraria and MV all use their normal death. No charred-corpse or ash-pile code was located.
- Hyper Light Drifter, Children of Morta, Moonlighter, Nuclear Throne, Wizard of Legend, Divinity, Darkest Dungeon and Stardew burning visuals were not found. Searches gave only generic text (Wizard of Legend 2 Burn is a DoT, no visuals: https://maxroll.gg/wizard-of-legend-2/guides/afflictions-in-wizard-of-legend-2).
- Emerald `AnimTravelDiagonally` body and the Small Ember tile art were not read, so flame paths and painted size inside the 32x32 OAM are unknown.
- MV default `States.png` row list was not read, so I cannot say whether a fire overlay ships by default. I believe it does not [U].
- The Tibia `CONST_ME_HITBYFIRE` sprite frame count needs appearance data. Note 14 owns combat effect timings.

---

## Q2. Carrying a torch at 24x32

### Takeaway
Tibia does not draw carried torches. The outfit stays the same, and the torch only adds a light. The server takes the brightest item in any slot as the player's light. A drawn torch is an Asterion addition, so it needs its own rules. Light radius is already settled (Tibia torch 7 tiles in VFX #5).

### Cited findings
- **TFS player light** [cited]. `Player::updateItemsLight` loops `CONST_SLOT_FIRST..CONST_SLOT_LAST` and keeps the item with the highest light level. If it changed, it calls `g_game.changeLight(this)`. https://github.com/otland/forgottenserver/blob/master/src/player.cpp (line 3507)
- **Tibia light values** (Lit Torch 7 / colour 206, Medium 6, Small 5, fuel stepping down 10 + 5 + 5 min) are in `studies/vfx-light/report.md` §A4 and §E1. Not repeated.
- **OTClient light falloff** [cited]. Per light-map texel (one per tile), `intensity = min(1, (radius - distance_in_tiles) * 0.2)`, skipped if below 0.01 or beyond `radius * tileSize` px. Lights combine by per-channel max, and the map is drawn with `CompositionMode::MULTIPLY`. https://github.com/mehah/otclient/blob/main/src/client/lightview.cpp
- **Tibia walk facts** (2 walk poses, step time / 3) and Asterion's 4-frame table are in [snow-13 Q7].

### Inferences (Asterion, 24x32 sprite, 4-frame walk)
- **Falloff in px.** With OTClient's formula a torch of radius 7 is at full strength out to 2 tiles (64 px) and fades linearly to zero at 7 tiles (224 px). Asterion's 640x360 view is 20 x 11.25 tiles, so one torch lights about 14 x 11 tiles, most of the screen height. VFX #5's warmer, smaller pools may be better for mood. Light radius is a VFX #5 / note 07 question.
- **Torch art size.** Stick 2x8 px, flame 6x8 px at rest, 4 frames at 100 ms with the base still [VFX #6 §1 loop rule]. That puts the flame top at about head height when the hand is at hip height (hand about 18 px above the feet). A flame of about 1/4 the character height reads as hand-held. Bigger reads as a brazier.
- **Hand offsets per frame** (relative to the stand pose, facing south, torch in the right hand):

| Walk frame | Pose | Hand dx | Hand dy | Note |
|---|---|---|---|---|
| 0 | left step | +1 | 0 | arm swings forward as the left leg leads |
| 1 | pass | 0 | -1 | body bob up 1 px, so the hand rides up |
| 2 | right step | -1 | 0 | arm swings back |
| 3 | pass | 0 | -1 | |

  Facing east or west, use dx 0 and swap the swing to dy ±1 (forward and back are along the screen x axis, so swing shows as x ±1 instead). Keep the flame base locked to the hand, and let the flame loop run on its own clock so it does not restart each step.
- **Layering by facing.** South: torch drawn after the body (in front). North: before the body (behind), with the flame tip still showing above the shoulder. East: torch in the near hand, drawn after the body. West: mirror the east sprite with `flip_h`. Then the torch moves to the far hand, so draw it before the body. This one rule handles the flip without a second sprite.
- **Flame lean.** Shift the flame top 1 px opposite the walk direction while moving, 0 px when standing. One extra frame set is not needed, just offset the top two rows.
- **Light anchor.** Put the light at the hand, not the tile centre. OTClient puts creature light at the creature's draw position. A 1 px swing in a per-tile light map does nothing, so this only matters for the rim light in Q3.

### Gaps
- No shipped game's per-frame torch hand offsets were found. Stardew has no hand-held torch [U]. RPG Maker light plugins were not read.
- Pixel art tutorials on held-item layering (Saint11, MortMort, Slynyrd) were not searched within budget.

---

## Q3. Lighting characters by fire at this size

### Takeaway
The best documented cheap system is Graveyard Keeper's. Each sprite gets up to 4 shadows (sun plus the 3 nearest lights), and each shadow is a rotated sprite turned in the vertex shader. Lighting uses per-sprite normal maps, which an artist paints as 4 directional light passes merged by a script. For Asterion, a 1 px two-tone rim from an alpha-edge test gets most of the look with no normal maps.

### Cited findings
- **Graveyard Keeper shadows** [cited]. Shadows are sprites rotating around a point; skew was tried and dropped. At most 4 per object (1 sun plus 3 nearest dynamic lights), found each frame in `Update()`. Rotation runs in a vertex shader, with the parameter in a vertex colour channel. About 10 reusable shadow sprites (thin, thick, oval). Long objects such as fences give poor shadows. https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
- **Graveyard Keeper lights** [cited]. Torches, ovens and lamps are standard Unity lights. A shader uses each sprite's vertical distance to the light. Sprites in front are lit, sprites behind fade out gradually. Every sprite has a normal map made from 4 painted light directions (they recommend Sprite Lamp). Same URL.
- **Children of Morta** [cited]. The postmortem credits "advanced lighting techniques" but gives no method. https://gamedeveloper.com/design/postmortem-children-of-morta
- **Sea of Stars** [cited]. Sabotage describes a custom pipeline with "full dynamic lighting" on 2D pixel art. Sprites show in puddle reflections. One developer worked on lighting from 2018. No method given. https://sabotagestudio.com/presskits/sea-of-stars , https://mobilesyrup.com/2023/09/11/sea-of-stars-level-design-sabotage-studio-thierry-boulanger-interview/
- **Eastward** [cited]. The official site calls it "a modern, innovative 3D lighting system" with retro pixel art, on Pixpil's engine over MOAI. No method given. https://eastwardgame.com/?p=154 , https://www.redbull.com/my-en/eastward-interview
- **Hand-painted normal maps for animated pixel sprites are costly.** A UE4 pixel-art devlog says normal-mapping every animation frame by hand is a lot of work. https://atomic-kraken.itch.io/slice-back/devlog/94965/behind-the-scenes-pixel-art-in-unreal-engine-4 . A Defold thread says the maps are cumbersome but keep limited palettes. https://forum.defold.com/t/normal-map-lighting-for-2d-pixel-art-sprites/70967

### Inferences (Asterion, Godot Compatibility)
- **Normal maps cost.** A 24x32 character with 4 directions x 4 walk frames is 16 frames, and more with attack and outfit layers. Graveyard Keeper's 4-pass painting doubles art time per frame. For an MMO with many outfits that is too much.
- **Two-tone rim mask, no normal maps.**
  - Per character, the client finds the nearest fire light within 4 tiles and sends its direction to the sprite shader, quantized to 8 directions.
  - In the shader, a pixel is "rim" if it is opaque and the pixel 1 px toward the fire is transparent. A pixel is "inner rim" if the pixel 2 px toward the fire is transparent.
  - Rim gets the warm highlight palette entry. Inner rim gets the warm mid entry. Do a palette row lookup (index + 1 or + 2 in a warm ramp), not additive colour, so pixels stay on palette.
  - Fade by distance in whole steps. Within 1.5 tiles both tones, to 3 tiles rim only, beyond that none.
  - Cost is 2 extra texture taps per fragment, about 768 pixels per character. That is trivial even for 50 characters.
- **Width.** 1 px rim on a 24 px wide sprite is about 4% of the width and reads clearly at 2x and 3x scale. 2 px looks like an outline glow and fights the dark outline most 24x32 sprites have. Keep 1 px rim plus 1 px inner tone.
- **Shadows away from fire.** Copy Graveyard Keeper's cap and rotate the existing drop shadow ellipse. For a 24x32 character use a 16x6 px ellipse, stretched to 16x10 and rotated away from the fire, alpha by distance. Cap at 1 fire shadow per character (the nearest fire) plus the normal blob shadow, not 3. Players walk tile to tile, so update the angle only when the character or fire changes tile, then lerp over the step time.
- **Behind-the-fire fade.** Graveyard Keeper's "vertical distance" rule fits 3/4 view. A character north of a campfire (screen y above it) has its front in shadow, so skip the rim and show only the light-map warmth.

### Gaps
- No method for rim light found from Eastward, Sea of Stars, Children of Morta or Octopath. All give marketing-level text only.
- No measured cost of a 2D normal-mapped sprite on Godot Compatibility (WebGL2) was found.
- No shipped game was found that uses an alpha-edge rim mask as proposed. It is an untested recipe for the sandbox.

---

## Q4. Walking through fire fields and ash

### Takeaway
In Tibia, damaging fields block pathfinding for players and monsters, but a player can still step in by hand. Monsters enter only if immune, flagged `canWalkOnFire`, or "ignoring field damage" after taking a hit while random-stepping. So fields are terrain in PvP and hunting, not just damage. No source was found for ash or soot footprints in any game.

### Cited findings
- **Players** [cited]. `Tile::queryAdd` returns `RETURNVALUE_NOTPOSSIBLE` for a player when the tile has a field with damage, the move is `FLAG_PATHFINDING`, and `FLAG_IGNOREFIELDDAMAGE` is not set. A manual step is not a pathfinding step, so it goes through. https://github.com/otland/forgottenserver/blob/master/src/tile.cpp (lines 555-559)
- **Monsters** [cited]. For a damaging, non-blocking field, a monster that is not immune may enter only with `FLAG_IGNOREFIELDDAMAGE` set and either `canWalkOnFieldType` (fire maps to `mType->info.canWalkOnFire`) or `isIgnoringFieldDamage()`. Otherwise not possible. tile.cpp lines 519-540, https://github.com/otland/forgottenserver/blob/master/src/monster.cpp (line 95)
- **Monsters ignore fields after a hit** [cited]. `Monster::drainHealth` sets `ignoreFieldDamage = true` if damaged while random-stepping. It is cleared when a follow path fails. monster.cpp lines 1218 and 1977.
- **PvP field damage is halved** between players [cited, Q1].
- **Tibia footprints** are one state per tile for 10 s, players only [snow-13 Q8].
- **Don't Starve** [cited]. Pickable items that burn become Ashes. Red Hound flames last a few seconds and leave Ashes. Burnt structures give back 1/4 of their materials. https://dontstarve.wiki.gg/wiki/Fire

### Inferences (Asterion)
- **Fire fields as terrain.** Copy the TFS rules. Click-to-walk routes around fire, arrow keys walk through. Monster AI avoids fire unless immune or hurt. This keeps fire walls useful for blocking chases in PvP.
- **Step-in feedback at 24x32.** On entry the server sends the hit (Q1). The client adds a 3-frame flare under the feet (a 16x8 px flame burst at the tile's bottom third) and 4 embers kicked from the feet. Cost is one sprite and 4 particles per step.
- **Soot footprints.** Reuse the snow print system [snow-13 Q1]. Two prints per tile, 3x5 px boots facing north or south, 5x3 px facing east or west. Darken the ground with a soot palette shift instead of carving depth. Leave prints for only the 3 tiles after leaving an ash or charred tile, fading in 10 s like Tibia's footprints. One byte per print cell in a decal field. No new network data, because every client knows who walked where.
- **Ash puffs.** On each contact frame (0 and 2) on an ash tile, kick 2 grey 2x2 px particles that rise 4 px and fade in 300 ms.
- **Burning character on dry ground.** Gungeon ignites goop under burning enemies [VFX6-09]. Asterion should not let a burning player ignite grass by walking. It turns one player into a moving spread source the server must track. Keep it for monsters only, if at all. Spread rules belong to note 15.

### Gaps
- No ash, soot or scorched boot print in any game source read. Zelda and Pokémon were not checked for this.
- Whether real Tibia (not TFS) lets click-walk path through fields was not checked.

---

## Q5. Many players with torches or burning on one screen

### Takeaway
OTClient has no cap on lights. It dedups lights with the same position, intensity and colour, and rebuilds its one-texel-per-tile light map only when the hash of inputs changes. Cost is tiles x lights. TFS also gives each player only one light (the brightest item). The things to cap for Asterion are flame overlays and particles, not lights.

### Cited findings
- **One light per player** [cited, Q2]. `updateItemsLight` keeps the max.
- **Dedup and caching** [cited]. `LightView::addLightSource` drops a light if it repeats the previous light's position and colour (keeps the max intensity). It adds a hash of position, intensity and colour to the pool's hash controller. `draw` only calls `updatePixels` when that hash changed, then uploads with `m_texture->updatePixels`. https://github.com/mehah/otclient/blob/main/src/client/lightview.cpp
- **Per-texel loop** [cited]. `updatePixels` loops every tile and every light from `m_lightData.tiles[index]` to the end, with a squared-distance early-out at `radius * tileSize`. Same file.
- **Tibia hit text merge** [cited, Q6]. Numbers of the same colour merge into one if the first is under 400 ms old. This is OTClient's built-in crowd control for damage numbers.
- **Snow crowd figures** (drop order, print caps) are in [snow-13 Q8].

### Inferences (my arithmetic, estimates)
- **Light cost.** Asterion's view plus a 1-tile margin is about 22 x 14 = 308 tiles. 50 torch-carrying players make 15,400 distance checks per rebuild. Rebuilds happen when a light moves a tile, about every 400 ms per player, so with 50 players almost every frame. Still about 15k cheap operations, well under 0.1 ms in JS [estimate, not measured]. The upload is 308 x 4 = 1,232 bytes. Lights do not need a cap at per-tile resolution. At a finer light map (per 8 px, note 07) the cost grows 16x and a cap starts to matter.
- **Budget per burning character** (from Q1). 1 tint uniform, 2 to 3 flame sprites, 6 to 8 embers per second living about 0.6 s (about 5 live), 2 smoke puffs per second living 1 s (2 live). About 10 draws per burning character with batching off. 20 burning players is about 200 sprites. Fine for Godot 2D batching on Compatibility, if all flames and particles share one atlas texture.
- **Budget per torch carrier.** 1 torch sprite with flame, 1 light (map entry), 1 rim uniform pair. Embers off for other players' torches.
- **Drop order when slow** (extends snow-13 Q8).
  1. Embers and smoke for other players more than 6 tiles away.
  2. The third (head) flame on other burning players.
  3. Rim light for other players (keep the light map).
  4. Merge other players' damage numbers more aggressively (merge window 400 ms to 800 ms).
  5. Never drop the tint or the HUD icon. They are the readable state and cost nothing.

### Gaps
- No Tibia-like client with a hard cap on creature effects or lights was found. OTClient relies on hashing.
- No measured frame times for many burning sprites in Godot on low-end web.

---

## Q6. Damage numbers and hit flash at 32 px

### Takeaway
Tibia (OTClient) floats numbers in an 11 px Verdana font. They rise 48 px (1.5 tiles) in 1000 ms and fade over the last 167 ms. Same-colour numbers merge within 400 ms. RPG Maker MV instead drops the digits from 40 px above and bounces them for 1.5 s, with a red flash of 60 frames on criticals. Asterion's 32 px tile matches Tibia's, so the OTClient numbers carry over unchanged.

### Cited findings
- **Duration and font** [cited]. edubart `const.h` has `ANIMATED_TEXT_DURATION = 1000`. `AnimatedText` uses font `verdana-11px-rounded`. mehah moves both to `setup.otml`: `animated-text-duration: 1000`, `animated-text: verdana-11px-rounded`. https://github.com/edubart/otclient/blob/master/src/client/const.h , https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp , https://github.com/mehah/otclient/blob/main/data/setup.otml
- **Motion** [cited]. `p.x += 24 - textWidth / 2`, `p.y += 8 + (-48 * t) / 1000`, so a linear rise of 48 px per 1000 ms starting 8 px down. With `GameDiagonalAnimatedText`, x also drifts by `4t/tf + 8t²/tf²`, which is 12 px left at the end. animatedtext.cpp.
- **Fade** [cited]. `t0 = tf / 1.2` (833 ms). After t0, alpha falls linearly from 1 to 0 by 1000 ms. animatedtext.cpp.
- **Merge** [cited]. `merge` adds two numbers if they share colour and font and the existing one is not older than `1000 / 2.5` = 400 ms. animatedtext.cpp.
- **Fire colour** [cited]. `TEXTCOLOR_ORANGE = 198` in TFS. With OTClient's 8-bit colour cube (VFX #5 §A4: `r = c/36 % 6 * 51` and so on), 198 is (255, 153, 0). tfs const.h, plus the formula in `studies/vfx-light/report.md` §A4.
- **RPG Maker MV popup** [cited]. `Sprite_Damage` lives 90 frames. Digits start at `y = -40` with `dy = -i` per digit (a stagger), gravity `dy += 0.5` per frame, bounce `dy *= -0.6` on reaching 0. Opacity fades over the last 10 frames. Critical sets flash colour `[255, 0, 0, 160]` for 60 frames, alpha scaled by `(d - 1) / d` each frame. https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Damage.js

### Inferences (Asterion)
- **Copy OTClient as is.** 11 px font (a pixel font with 7 to 8 px cap height fits 640x360 better than Verdana), rise 48 px in 1000 ms, fade from 833 ms, merge window 400 ms, fire numbers in (255, 153, 0). At 640x360 the number travels from the chest to about 1 tile above the head of a 32 px tall sprite.
- **Burn ticks.** One orange number per server tick (Tibia's 10 s field ticks, or 2 s burn ticks). With the 400 ms merge, a field tick and a burn tick in the same moment show as one number.
- **Hit flash.** 1 frame of white (or 50 ms) on the character per damage tick. MV's critical flash of 60 frames at 160/255 red is far too long for burn ticks. Use it only for big hits, shortened to 15 frames.
- **MV bounce scaled.** 40 px on a 48 px tile is 27 px on Asterion's 32 px tile. It reads more playful than Tibia's linear rise. Pick one style for all damage.

### Gaps
- Tibia's own client (Cipsoft) values were not checked. Only OTClient's were.
- MV `Damage.png` digit size (sets `digitWidth`) was not read.

---

## Gems
- **mehah/otclient** `src/client/lightview.cpp` and `animatedtext.cpp`. A complete, short reference for a per-tile light map with max blending and hash-gated rebuilds, and for Tibia-style floating numbers. Licence MIT, read from the file headers (the standard MIT "THE SOFTWARE" text). Actively maintained (copyright line 2010-2026 in `animatedtext.cpp`). It saves writing and tuning both systems. https://github.com/mehah/otclient
- No fire-on-character plugin or shader worth listing was found within budget.

---

## Sources
Source code read this session (files saved in `scratch-13/`)
- TFS condition.cpp: https://github.com/otland/forgottenserver/blob/master/src/condition.cpp
- TFS game.cpp: https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- TFS const.h: https://github.com/otland/forgottenserver/blob/master/src/const.h
- TFS tile.cpp: https://github.com/otland/forgottenserver/blob/master/src/tile.cpp
- TFS monster.cpp: https://github.com/otland/forgottenserver/blob/master/src/monster.cpp
- TFS player.cpp: https://github.com/otland/forgottenserver/blob/master/src/player.cpp
- OTClient edubart const.h: https://github.com/edubart/otclient/blob/master/src/client/const.h
- OTClient edubart animatedtext.cpp: https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp
- OTClient mehah animatedtext.cpp: https://github.com/mehah/otclient/blob/main/src/client/animatedtext.cpp
- OTClient mehah setup.otml: https://github.com/mehah/otclient/blob/main/data/setup.otml
- OTClient mehah lightview.cpp and lightview.h: https://github.com/mehah/otclient/blob/main/src/client/lightview.cpp
- OTClient mehah effect.cpp: https://github.com/mehah/otclient/blob/main/src/client/effect.cpp
- RPG Maker MV Sprite_StateOverlay.js: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_StateOverlay.js
- RPG Maker MV Sprite_Damage.js: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Damage.js
- pokeemerald battle_anim_scripts.s: https://github.com/pret/pokeemerald/blob/master/data/battle_anim_scripts.s
- pokeemerald battle_anim_fire.c: https://github.com/pret/pokeemerald/blob/master/src/battle_anim_fire.c
- Terraria decompile (Freeria repo) Main.cs, Player.cs, NPC.cs: https://github.com/dptetc/Freeria/tree/6eedc5ff0752e1e5854a08f01db04edfcda3346f/Freeria

Pages read this session
- Graveyard Keeper effects: https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
- Don't Starve Fire: https://dontstarve.wiki.gg/wiki/Fire
- Noita status effects: https://noita.wiki.gg/wiki/Status_effects
- Children of Morta postmortem (search snippet): https://gamedeveloper.com/design/postmortem-children-of-morta
- Sea of Stars press kit and interview (search snippets): https://sabotagestudio.com/presskits/sea-of-stars , https://mobilesyrup.com/2023/09/11/sea-of-stars-level-design-sabotage-studio-thierry-boulanger-interview/
- Eastward site and review (search snippets): https://eastwardgame.com/?p=154 , https://www.redbull.com/my-en/eastward-interview
- Pixel normal map effort (search snippets): https://atomic-kraken.itch.io/slice-back/devlog/94965/behind-the-scenes-pixel-art-in-unreal-engine-4 , https://forum.defold.com/t/normal-map-lighting-for-2d-pixel-art-sprites/70967
- Wizard of Legend 2 afflictions (search snippet): https://maxroll.gg/wizard-of-legend-2/guides/afflictions-in-wizard-of-legend-2

"See it in action" pages
- Tibia burning and fire field: https://tibia.fandom.com/wiki/Fire_Field (fandom, often blocked)
- Terraria On Fire!: https://terraria.wiki.gg/wiki/On_Fire!
- Enter the Gungeon burn: https://enterthegungeon.wiki.gg/wiki/Status_Effects
- Pokémon burn: https://bulbapedia.bulbagarden.net/wiki/Burn_(status_condition)
- Graveyard Keeper shadows: https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
- Noita on fire: https://noita.wiki.gg/wiki/Status_effects
