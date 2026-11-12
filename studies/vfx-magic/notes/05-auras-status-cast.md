# 05. Auras, buffs, shields, status effects, cast circles and charge-ups

Researcher 05, VFX #10 Magic and spell VFX. Everything here is attached to a character. Projectiles and impacts belong to other notes.

How to read this file. "Cited findings" come from a page or source file I fetched, with the URL. "Inferences" are my own numbers and designs, not measured and not sourced. "Gaps" list what I could not confirm. Scratch data sits in `scratch-05/` (the D2 data guide HTML and roBrowser's EffectTable.js).

---

## 1. Layering around a sprite

### Takeaway
Three shipped engines solve this the same way. Each attached effect carries one boolean that says "draw before the body" or "draw after the body", plus an offset. Ground effects go in a separate pass before all entities. Head icons are a special attachment anchored to the head. Nobody sorts effect pixels against body pixels. A two-part effect (back half and front half) is two sprites with opposite flags.

### Cited findings

**Diablo II (Overlay.txt and States.txt).** Source: D2R data guide mirrored at https://d2runewizard.com/game-files/guide.html
- `PreDraw` is a boolean that picks in front of or behind the unit sprite. The D2R guide says 1 = in front and 0 = behind. The older Phrozen Keep guide (Scribd copy, https://www.scribd.com/document/781781832/Overlay) appears to say the opposite for 0. Treat the polarity as unconfirmed. The design point holds either way. It is one bit per overlay.
- `Xoffset`, `Yoffset` position the overlay on the unit. `Height1` to `Height4` add to Yoffset, chosen by the monster's `OverlayHeight` class in monstats2.txt. If OverlayHeight is 0 the game adds a default of 75. Players always use `Height2`. So "above the head" is solved with 4 height classes, not per-sprite data.
- `AnimRate` is frames per second for the overlay. `LoopWaitTime` is a pause between loops for looping overlays.
- `Trans` has 9 blend modes: 0 = 25%, 1 = 50%, 2 = 75%, 3 = black alpha, 4 = white alpha, 5 = opaque, 6 = dark (unused), 7 = highlight (mouse-over), 8 = blended.
- `InitRadius` and `Radius` give each overlay a light that grows per frame from the first to the second value. Max 18 for both. `Red`, `Green`, `Blue` colour that light.
- `1ofN` picks a random variant. Index = Index + RANDOM(0, N-1).
- States.txt gives each state `overlay1` to `overlay4`. The guide says states typically use overlay1 for the front and overlay2 for the back. Some states use all four as front start, front end, back start, back end. That is the canonical back/front split with an intro and a loop.
- States.txt also has `castoverlay` (played once when the state lands), `removerlay` (played once when it ends) and `pgsvoverlay` (charge-up stages).
- `colorpri` and `colorshift` control the body tint. Only one tint wins. The guide says the state with the highest colour priority is used and the others are ignored. Ties go to the lower state ID. Colour shifts are palette rows: 73 = grey, 74 = black, 100 = red, 104 = green, 108 = blue, 109 = purple and so on.
- `light-r/g/b` let a state recolour the unit's light radius.
- `canstack` exists but only works for poison.

**Ragnarok Online (roBrowser source).**
- Effects have a class-level flag `renderBeforeEntities`. The effect manager renders in two passes keyed on it. https://github.com/vthibault/roBrowser/blob/master/src/Renderer/EffectManager.js
- Ground target markers set it to true and nudge depth by 0.01 or 0.02 so they sit on the ground under everyone. https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Effects/MagicTarget.js
- Status icons (sleep, stun, curse) are entity "attachments" with `head: true` and `repeat: true`. Curse uses `opacity: 0.5`. https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Entity/EntityState.js

**Tibia family (OTClient Redemption AttachedEffect).** Classic Tibia has no auras, only one-shot magic effects on the tile plus status icons in the UI. The open-source client added attached effects. Sources: https://github.com/mehah/otclient/blob/main/src/client/attachedeffect.cpp , https://github.com/mehah/otclient/wiki/Tutorial-Attached-Effects , https://github.com/mehah/otclient/blob/main/modules/game_attachedeffects/effects.lua
- The creature draw calls the effect list twice. Each effect checks `if (dirControl.onTop != isOnTop) return;`. So onTop is one bit, same as D2.
- The bit and the offset are per facing direction. `dirOffset[dir] = {x, y, onTop}`. The sample "Bat Wings" effect is on top when the creature faces North and West and behind when it faces South and East. This is the answer for back-mounted things in 3/4 view.
- Config fields: `speed`, `opacity`, `duration`, `loop`, `size`, `offset`, `dirOffset`, `light{color,intensity}`, `shader`, `bounce{minHeight,height,speed}`, `pulse`, `fade{start,end,speed}`, `transform`, `hideOwner`, `followOwner`, `drawOnUI`, `drawOrder`.
- Bounce, pulse and fade share one triangle-wave function. Pulse adds `wave/100` to scale. Fade sets opacity to `wave/100`.
- Effects nest. The sample "Four Angel Light" clones one effect 4 times at offsets of plus or minus 50 px.
- Sample opacity for a persistent light effect is 0.5.
- An effect can register a light source without drawing its sprite (`drawLight`).

### Inferences
- For Kingsfoil use four slots per character: `ground` (under all entities), `back`, `front`, `overhead`. Each attached effect declares which slots it fills. Draw order per character is ground pass first for everyone, then per y-sorted character: back, body, front, overhead.
- With Godot y-sort, back and front can be children of the character with `z_index` -1 and +1 relative, or (cheaper for batching) drawn by one "aura layer" node per slot that draws all characters' effects from one atlas. See section 4 for why.

### Gaps
- PreDraw polarity conflict between the two D2 guides.
- How many overlays a D2 unit can hold at once is not in the guide. The data model allows 4 per state and many states.
- MapleStory, Hades, PoE layering internals were not found in open sources. Hades has an 80.lv VFX article I did not fetch (https://80.lv/articles/a-behind-the-scenes-look-at-the-effects-in-hades).

### Pseudocode: back/front split with y-sort
```
# one-time: each effect def has parts = [{slot, anim, offset, dir_overrides}]
SLOTS = [GROUND, BACK, FRONT, OVERHEAD]

draw_frame():
    # pass 1: ground decals for everyone, no sorting needed
    for c in visible_chars:
        for part in c.parts[GROUND]:
            blit(part.frame(now), c.feet + part.offset)

    # pass 2: y-sorted bodies with their back and front parts
    sort visible_chars by feet.y
    for c in visible_chars:
        for part in c.parts[BACK]:   blit(part.frame(now), c.feet + part.off(c.dir))
        blit(c.body_frame, c.feet)
        for part in c.parts[FRONT]:  blit(part.frame(now), c.feet + part.off(c.dir))

    # pass 3: overhead icons, above every body so they are never hidden
    for c in visible_chars:
        x = c.head.x - icon_row_width(c)/2
        for icon in c.parts[OVERHEAD][0:MAX_ICONS]:
            blit(icon.frame(now), (x, c.head.y - 10)); x += 9

# direction-dependent slot, as in OTClient dirOffset
part.slot_for(dir): return part.dir_overrides.get(dir, part.slot)
```

---

## 2. Orbiters and loops

### Takeaway
An orbiter is one sprite on a flattened ellipse. Its slot flips between back and front on the sign of sin(angle). No depth buffer needed. Loops stay cheap when the frame count is small and the motion comes from code (rotation, bounce, pulse) and not from more frames.

### Cited findings
- RO's cylinder aura is a 20-segment textured tube with independent top and bottom radius and height. The only animation is rotation at `tick/4` degrees with tick in ms, which is 250 degrees per second, one turn in 1.44 s. The texture is static. https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Effects/Cylinder.js
- RO level-up is effect 371, a STR (keyframed layers) file named `angel` with the `levelup` sound, attached to the entity. https://github.com/vthibault/roBrowser/blob/master/src/DB/Effects/EffectTable.js
- OTClient loops are a count. `--m_loop == 0` ends the effect when the animation wraps to phase 0. `-1` means endless. Bounce and pulse are triangle waves, so they are seamless by construction. https://github.com/mehah/otclient/blob/main/src/client/attachedeffect.cpp
- D2 overlays have an fps (`AnimRate`) and an optional wait between loops (`LoopWaitTime`), used for item gleams. A gleam that fires, then rests, reads calmer than a constant loop. https://d2runewizard.com/game-files/guide.html

### Inferences (numbers for a 32 px character, not measured)
- Orbit ellipse: rx 14 to 18 px, ry 6 to 8 px (ry is about 0.4 to 0.5 of rx for a 3/4 camera), centre at chest height, about 14 px above the feet.
- Period 1.2 to 2.0 s per turn. Under 1 s reads as frantic and competes with attacks. RO's 1.44 s sits in that band.
- 2 to 4 motes, 2x2 or 3x3 px each, with 1 or 2 trailing pixels a step darker.
- Front/back rule: mote is in front when sin(angle) > 0 (lower half of the ellipse on screen). Dim back motes one palette step so the depth reads even when they overlap the body outline.
- Heal: 4 to 6 plus-shaped or 1 px sparkles rising 12 to 16 px over 400 to 600 ms, spawn staggered over 200 ms, front slot only. Buff: a column of light falling 24 px over 300 ms, then a 2-frame ground ring.
- Level-up: one-shot, 600 to 900 ms, 8 to 12 frames, taller than the character (48 to 64 px), plus a light pulse. It is the one attached effect allowed to be loud because it is rare.
- Loop lengths: 4, 6 or 8 frames at 100 to 125 ms per frame. Seamless loops come from making the last frame lead into the first, or from code-driven motion on a single frame.
- Snap mote positions to whole pixels with round(), and step the angle at a fixed rate (for example 24 steps per turn from a lookup table of 24 x,y pairs). A table costs zero trig per frame.

### Gaps
- No artist source fetched for orbit periods or mote sizes. MapleStory and Tibia level-up frame counts not confirmed.

### Pseudocode: elliptical orbiters
```
# precomputed once: STEPS = 24
ORBIT[i] = (round(RX * cos(2*pi*i/STEPS)), round(RY * sin(2*pi*i/STEPS)))

orbiter_parts(c, now, n_motes, period_ms):
    base = floor((now % period_ms) * STEPS / period_ms)
    for k in 0..n_motes-1:
        i = (base + k * STEPS / n_motes) % STEPS
        dx, dy = ORBIT[i]
        slot = FRONT if i < STEPS/2 else BACK      # dy >= 0 is the near half
        frame = MOTE_BRIGHT if slot == FRONT else MOTE_DIM
        emit(slot, frame, c.feet + (dx, -CHEST_H + dy))
```

---

## 3. Shields

### Takeaway
I found no open-source reference for a 2D pixel shield bubble in the games on the list. Everything in this section is design inference. The one cited data point is that classic Tibia's magic shield has no body effect at all, only a status icon.

### Cited findings
- Tibia's mana shield is a condition with a client icon flag (ICON_MANASHIELD), separate from any visual effect. Haste is also icon only. https://otland.net/threads/about-icon-condition.259450/ and https://tibia.fandom.com/wiki/Special_Conditions (the Fandom page was a search hit, not fetched).
- OTClient attached effects support per-effect `opacity` and `shader`, which is what a private server would use to add a bubble. https://github.com/mehah/otclient/wiki/Tutorial-Attached-Effects

### Inferences
- Bubble sprite 40x40 px for a 32 px character, drawn as two halves. Back half in the BACK slot at one palette step darker, front half in FRONT.
- Keep the character readable. Rim only at full opacity, 1 px wide, with a 2 to 3 px highlight arc at top-left. Interior fill 0 to 15%, or a 25% ordered dither (1 pixel in 4) in place of alpha. A dither fill costs no blending and matches the "glow without alpha" rule from study #5.
- Idle loop: a highlight that travels around the rim in 6 to 8 frames, with a rest of 1 to 2 s between sweeps (the D2 LoopWaitTime idea).
- Hit reaction: on damage, draw a bright arc of about 90 degrees centred on the impact angle for 2 frames (about 100 to 130 ms), then one frame of full rim flash at one palette step brighter. Pick the arc from 8 pre-drawn arc sprites by direction. No shader.
- Break: rim splits into 6 to 8 shards that fly out 10 to 14 px over 250 ms, plus a 1-frame white ring. Reuse the hit spark atlas.
- Hex patterns need about 6 px per cell to read, so a 40 px bubble shows only 5 or 6 cells. At this size a dither or plain rim reads better.

### Gaps
- No shipped-game source for any of the above. Worth a second pass on Shattered Pixel Dungeon (shield and barrier visuals in open Java source) and tModLoader.

---

## 4. Status visuals and Godot shader notes

### Takeaway
RO does all its status looks with one multiply colour per entity plus head attachments. It never swaps palettes. That is the cheapest model that shipped in a big MMO, and in Godot it maps to `modulate`, which does not break batching. Reserve shaders for the three things a multiply cannot do: flash to white, outline, dissolve.

### Cited findings

**RO status table, from roBrowser.** https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Entity/EntityState.js and https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Entity/EntityRender.js

| State | Multiply RGB | Extra |
|---|---|---|
| Stone | 0.1, 0.1, 0.1 | animation paused |
| Stone (petrifying) | 0.3, 0.3, 0.3 | none |
| Frozen | 0.0, 0.4, 0.8 | ice attachment, sound, held freeze frame |
| Stun | none | stars on head, looping |
| Sleep | none | Zzz on head, looping |
| Curse | 0.50, 0.15, 0.10 | head attachment at 0.5 opacity |
| Poison | 0.9, 0.4, 0.8 | sound only |
| Blind | none | sound only |
| Invisible | alpha 0 | none |
| Hide, cloak | alpha 0, or black silhouette (0,0,0) if the viewer has the detect card | none |

- The three state groups (body, health, effect) multiply together per channel. Curse plus poison gives (0.45, 0.06, 0.08). So RO stacks tints by multiplication and accepts that stacked statuses go dark.
- The final colour is applied per sprite layer as `layer.color * effectColor`.
- Stone and frozen pause the animation. Freezing the pose is half of the read.

**Diablo II.** One tint wins by `colorpri`. Tints are palette rows (`colorshift`), not multiplies. https://d2runewizard.com/game-files/guide.html

**Godot 4.**
- 2D instance uniforms landed in 4.4 through PR #99230, merged 2024-12-20. The PR touched the Compatibility (GLES3) renderer and a reviewer reported it works in all rendering methods. Syntax is `instance uniform vec4 tint : source_color;` and `set_instance_shader_parameter()`. https://github.com/godotengine/godot/pull/99230 and https://forum.godotengine.org/t/why-isnt-my-sprite2d-updating/105581
- The docs still said instance uniforms were 3D only when that thread was written, so expect thin documentation.
- A forum commenter reports a hard cap of 1024 entries in the instance buffer under Compatibility. Unverified, single source. https://forum.godotengine.org/t/how-to-properly-utilize-unique-shader-data-across-10k-ish-sprites/131081
- Godot 3 batching docs state that texture and material changes break a batch. The 4.x canvas renderer follows the same painter's-order logic. https://docs.godotengine.org/en/3.5/tutorials/performance/batching.html
- Palette swap shader examples for Godot 4 exist on godotshaders. One reads source colours from row 0 of a palette image and target colours from a row picked by `palette_index`. Another reads the sprite's red and green channels as UVs into the palette. https://godotshaders.com/shader/palette-swap-shader-sampler2d/ and https://godotshaders.com/shader/palette-swap-no-recolor-recolor/
- A Godot forum thread warns that a per-pixel loop comparing against every palette colour is slow. Use an indexed lookup. https://forum.godotengine.org/t/i-wrote-a-shader-to-replace-the-palette-of-a-sprite-with-another-palette-is-this-the-best-way-any-way-to-optimize/24537

**Afterimages.** Generic recipe from forum sources: a repeating timer copies the current sprite frame and position into a pooled sprite, which then fades. One estimate for older games is about 5 clones per second. https://discussions.unity.com/t/2d-effects-tips/665528 and https://forum.defold.com/t/how-do-you-make-an-afterimage-effect/65628

### Inferences

Status channel plan (one status should use at most two channels):

| Status | Tint (multiply or LUT row) | Overlay | Tick |
|---|---|---|---|
| Burning | orange ramp, flicker between 2 rows at 6 to 8 fps | 2 small flames on body, 4 frames, FRONT | ember puff per damage tick |
| Poisoned | green, slow pulse at 1 Hz | 1 drip or bubble every 1 s | green number |
| Frozen | RO's 0.0/0.4/0.8, pose paused | ice block, BACK and FRONT halves, 25% dither | shatter on end |
| Shocked | 1 white frame every 400 to 500 ms (2 to 2.5 Hz) | 2 arcs of 3 to 5 px, 2 frames | none |
| Cursed | RO's 0.5/0.15/0.1 or purple row | skull icon overhead at 50% | none |
| Stone | grey row, pose paused | none | none |
| Stun, sleep | none | stars or Zzz overhead | none |

- Outline colour is a free channel when tints are taken. Use it for friend, foe and target, not for status, so the two never fight. Combat juice study already covers targeting outlines.
- Haste: 3 ghosts, one captured every 4 frames at 60 fps (67 ms), opacity 60, 40, 20% or three palette steps down, tinted one flat colour. Ghosts only while moving. 5 ghosts is the ceiling before the trail reads as a smear.
- Stealth, own view: 40 to 50% alpha or a 50% checker dither. Others' view: not sent by the server at all (RO sends alpha 0, which leaks position to modified clients). Detected stealth: black silhouette, as RO does.

Godot Compatibility cost notes (estimates, not measured):
- `modulate` and `self_modulate` are per-vertex colour. They keep sprites in one batch. Use them for every multiply tint. Cost is zero extra draw calls.
- A unique ShaderMaterial per character splits batches. 30 characters with 30 materials is at least 30 extra draw calls plus one per attached effect drawn between them.
- One shared material with instance uniforms (4.4+) should keep the shader bound. Whether batches still merge is not documented. Test before relying on it.
- Fallback that needs no instance uniforms: pack the status into vertex colour. For example, read `COLOR.a` bands or a spare channel in the fragment shader to pick a LUT row. Fragile but it batches. Needs a prototype.
- Flash to white is `mix(tex.rgb, vec3(1.0), flash)`. Outline is 4 extra texture samples (8 for corners). Dissolve is 1 extra sample of a noise texture and a `step`. All three are fine on WebGL2 at 320x180. The cost that matters is draw calls, not fragment work.
- Best case for 30 casters: tint via modulate, overlays from one shared atlas, and the flash shader only on the few characters hit this frame.

### Pseudocode: status tint via palette LUT
```
# Art: sprites authored in a fixed N-colour palette.
# Sprite texture stores the palette INDEX in the red channel (index/255), alpha as usual.
# LUT texture: width N, height = number of statuses. Row 0 = normal colours.
#   row 1 burning A, row 2 burning B, row 3 poison, row 4 frozen, row 5 stone, row 6 curse ...

shader_type canvas_item;
uniform sampler2D lut : filter_nearest;
uniform float lut_w = 32.0;
uniform float lut_h = 8.0;
instance uniform float row = 0.0;        # Godot 4.4+, else a per-material uniform
instance uniform float flash = 0.0;      # 0..1 white flash

void fragment() {
    vec4 src = texture(TEXTURE, UV);
    float idx = floor(src.r * 255.0 + 0.5);
    vec2 uv = vec2((idx + 0.5) / lut_w, (row + 0.5) / lut_h);
    vec3 col = texture(lut, uv).rgb;
    COLOR = vec4(mix(col, vec3(1.0), flash), src.a);
}

# game side, at 6-8 fps for burning flicker:
row = BURN_A if (now / 140) % 2 == 0 else BURN_B
# priority like D2 colorpri: only the highest-priority status sets the row
row = max_by(c.statuses, s => s.color_pri).lut_row
```
One dependent texture read per pixel. No loops. Works with RGB sprites too if a build step converts them to index textures.

### Pseudocode: afterimage ring buffer
```
GHOSTS = 4; EVERY = 4            # frames between captures at 60 fps
ALPHA = [0.6, 0.45, 0.3, 0.15]   # or palette steps instead of alpha
ring = array[GHOSTS] of {pos, frame, flip, born}
head = 0; counter = 0

on_physics_frame(c):
    if c.hasted and c.moving:
        counter += 1
        if counter >= EVERY:
            counter = 0
            ring[head] = {c.pos, c.body_frame, c.flip, now}
            head = (head + 1) % GHOSTS

draw_back_slot(c):
    for k in 0..GHOSTS-1:
        g = ring[(head - 1 - k + GHOSTS) % GHOSTS]     # newest first
        age = now - g.born
        if age > GHOSTS * EVERY * 16.7: continue        # expired, about 267 ms
        blit(g.frame, g.pos, flip=g.flip, tint=HASTE_COLOUR, alpha=ALPHA[k])
```
No allocation after start. 4 extra blits per hasted character, all from the body atlas, so they batch with the body if the tint goes through modulate.

### Gaps
- No measured ms or draw-call numbers for 2D instance uniforms in Compatibility on the web.
- SotN and Celeste afterimage parameters not confirmed from a primary source.
- Whether `COLOR` in a Godot 4 canvas fragment already includes modulate differs by version. Check before using the vertex-colour trick.

---

## 5. Stacking: one character, six buffs

### Takeaway
Shipped games cap or rank. D2 shows one tint by priority. RO multiplies tints and puts everything else in icons. FFXIV caps a character at 30 statuses and lets each player turn other players' effects down. PoE has no such toggle and players keep asking for one.

### Cited findings
- D2: highest `colorpri` wins the tint, ties to the lower state ID. https://d2runewizard.com/game-files/guide.html
- RO: tints multiply across three groups. Overhead attachments are limited to a few states (sleep, stun, curse). https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Entity/EntityState.js
- FFXIV: Battle Effects settings exist for three groups, own character, party members and other players, with the options Show All, Show Limited and Show None. https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_bteffect.html
- FFXIV: players are capped at 30 combined buffs and debuffs. https://ffxiv.consolegameswiki.com/wiki/Status_effects (search hit, not fetched)
- WoW Classic: 32 helpful auras, the oldest gets pushed off. Debuff cap 16. Both were removed on Hardcore realms. https://us.forums.blizzard.com/en/wow/t/the-32-buff-cap/468933 and https://us.forums.blizzard.com/en/wow/t/annifresh-remove-debuff-limits-edit-successful/2009570 (search hits, not fetched)
- PoE and PoE 2: no option to hide allies' auras was found. Players ask for an allied effects transparency slider, separate self, ally and enemy opacity, and a way to turn off party particle effects. One complaint cites "7+ default aura effects at once". https://www.pathofexile.com/forum/view-thread/3690131 , https://www.pathofexile.com/forum/view-thread/3868713 , https://www.pathofexile.com/forum/view-thread/3660138 , https://www.pathofexile.com/forum/view-thread/3450606
- Grim Dawn has a similar thread asking to reduce aura clutter. https://forums.crateentertainment.com/t/option-to-reduce-visual-clutter-auras/85512

### Inferences (proposed caps)
- Body tint: 1, by priority. Suggested order: frozen or stone, then burning, shocked, poisoned, cursed, then buffs.
- Looping body overlays: 2 for own character, 1 for others.
- Ground circle: 1. If several apply, show the newest for 1 s, then fall back to the highest priority.
- Orbiters: 1 set. More buffs add a mote of their colour to the same orbit, up to 4 motes. This merges 4 buffs into one effect.
- Overhead icons: 3, debuffs first. The rest live on the UI buff bar.
- Tiers, reusing F5 from the combat juice study: own = full, party = one-shot gain effect plus tint, others = tint only, hostile = full for crowd-control states (frozen, stunned, shielded) because they change what the viewer should do.
- Every persistent buff gets a loud 300 to 500 ms "gained" one-shot and then drops to its quiet loop or to nothing. The one-shot is what other players need. The loop is mostly for the owner.

### Gaps
- No telemetry or dev statement on how many simultaneous attached effects stay readable. The caps above are judgement.
- WoW spell density and projected textures settings not confirmed.

---

## 6. Cast circles and charge-ups

### Takeaway
RO is the reference. The server sends a cast-begin packet with the skill, the target or ground position, the cast time and an element code. The client shows a coloured aura on the caster for exactly the cast time, plus a marker on the target (shrinking lock-on) or on the ground (rotating circle sized to the real area). Other players learn who is casting, what element, at whom or where, how big and for how long from five fields.

### Cited findings
- RO cast packet handler. `property` picks the cast aura colour: 0 yellow (neutral), 1 water, 2 earth, 3 fire, 4 wind, 5 poison, 6 holy, anything else like 0. `delayTime` is the cast time and sets the lifetime of the markers. The caster's sprite holds a casting pose on frame 0 and a text bubble shows the skill name with "!!". https://github.com/vthibault/roBrowser/blob/master/src/Engine/MapEngine/Entity.js
- Ground marker (MagicTarget). One texture, `magic_target.tga`, on a flat quad draped on the ground, drawn before entities. It rotates at 40 degrees per second (one turn in 9 s) by rotating UVs. Size comes from a per-skill table in tiles: default 1, and 5, 7 and 13 are used (Meteor Storm 13, Sanctuary 7, Fire Wall 1). Alpha is a hard cutout (`discard` at alpha 0), no blending set. It disappears when the cast time ends. https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Effects/MagicTarget.js
- Target marker (LockOnTarget). One 128 px texture, pre-rotated 45 degrees. It spins at 250 degrees per second. Size shrinks from 15 to 3 units over the first 250 ms and then holds. Green and blue channels step down in 5% steps every 20 ms and wrap every 400 ms, so the ring pulses toward red at 2.5 Hz. https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Effects/LockOnTarget.js
- RO's effect table lists `ring_blue` and `ring_yellow` textures for cast and warp effects (IDs 6, 8, 34, 35). https://github.com/vthibault/roBrowser/blob/master/src/DB/Effects/EffectTable.js
- The 3D perspective does the ellipse flattening in RO. The circle is a round texture on the ground plane.
- D2 has `castoverlay` on skills and states, plus `pgsvoverlay` for charge stages (Assassin charge-ups show a different overlay per charge count). https://d2runewizard.com/game-files/guide.html
- Tools that generate magic circles as layered rings exist: Magic Circle Generator by Game Dev Goose (has draw-in animations, https://game-dev-goose.itch.io/magic-circle-generator ) and Sigil Core for RPG Maker MZ, which builds seals from skill data ( https://csaf.itch.io/sigil-core ). A Blender asset animates inner star, rune ring and outer decoration as separate layers ( https://blendermarket.com/products/procedural-transmutation-circles ).

### Inferences
- Circle anatomy for pixel scale: outer ring 1 px, a rune band of 8 to 12 glyphs of 3x3 or 3x5 px, an inner ring, and one inscribed polygon or star. Element picks the polygon: triangle up for fire, hexagon or snowflake spokes for ice, zigzag star for energy, square for earth, cross or sun for holy, inverted triangle or crescent for death. Shape plus colour gives colour-blind redundancy.
- Flatten 2:1 for 3/4 view. Caster circle 40x20 px for a 32 px character. Ground target circle is the true area in tiles times 32 wide and half that tall.
- Rotation in 2D pixel art cannot be a texture rotation without shimmer. Rotate by index. Move each glyph to the next of 24 or 32 precomputed positions on the ellipse. Outer band clockwise at 10 to 15 s per turn, inner counter-clockwise at 6 to 8 s. RO's 9 s per turn confirms slow reads as "charging" while the 1.44 s lock-on reads as "threat".
- Draw-in: reveal by angle over the first 30 to 40% of the cast time, hold with slow rotation, brighten one palette step in the last 150 ms, then a 1-frame white flash on release and a 3-frame fade. If the cast is under 300 ms skip the draw-in and show the full circle at once.
- Gathering particles: 6 to 10 pixels spawned on a ring of radius 20 to 24 px, moving toward the hands with ease-in over 300 to 400 ms, respawned through the cast. It is an emitter run backwards. Spawn at the end position, compute start = end + random ring offset, lerp t from 0 to 1.
- Charge glow: a 3 to 5 px orb at the hands that climbs the element ramp (dark, mid, light, white) at 25, 50, 75 and 100% of the cast time. Same staging as D2's progressive overlays.
- Channel loop: keep the circle, switch the rune band to a faster 4 s turn, and pulse brightness at 1 to 2 Hz.
- Summoning circle: same generator at 64x32, draw-in over the whole summon time, and the creature rises through it with a vertical dissolve.
- Tiering: others' caster circles at 50% opacity or rim only. Hostile ground target circles always at full strength (covered in combat juice E3 and F5).

### Gaps
- Wizard of Legend, Secret of Mana and Trials of Mana, Golden Sun, FFXIV, Genshin and Magicka were not researched from sources. They are listed in section 8 with reference URLs only.
- Which RO texture is used per element for the caster aura is not in roBrowser (that part is a stub). Only the property codes are confirmed.

### Pseudocode: procedural rune circle
```
# Bake once per (element, size) into a small texture or a list of pixel runs.
make_circle(rx, seed, element):
    ry = rx / 2                                   # 3/4 flatten
    STEPS = 32
    P_out[i] = (round(rx*cos(a_i)), round(ry*sin(a_i)))        for i in 0..STEPS-1
    P_in[i]  = (round(0.6*rx*cos(a_i)), round(0.6*ry*sin(a_i)))
    rng = RNG(seed)
    glyphs = [rng.pick(GLYPH_SET[element]) for _ in 0..N_GLYPHS-1]   # 3x3 bitmaps
    poly_n = POLY_SIDES[element]                  # 3 fire, 6 ice, 4 earth, 5 arcane ...
    return {P_out, P_in, glyphs, poly_n, rx, ry}

draw_circle(c, centre, cast_t, now, pal):          # cast_t in 0..1
    reveal = clamp(cast_t / 0.35, 0, 1)            # draw-in over first 35%
    col = pal[2] if cast_t < 0.9 else pal[3]       # brighten at the end
    # rings: midpoint ellipse, only the revealed angle range
    ellipse_arc(centre, c.rx, c.ry, 0, reveal*TAU, col)
    ellipse_arc(centre, 0.6*c.rx, 0.6*c.ry, 0, reveal*TAU, pal[1])
    # rune band: step positions, never rotate bitmaps
    shift_out = floor(now / (12000 / STEPS)) % STEPS           # cw, 12 s per turn
    for g in 0..N_GLYPHS-1:
        i = (g * STEPS / N_GLYPHS + shift_out) % STEPS
        if i / STEPS <= reveal:
            blit_glyph(c.glyphs[g], centre + 0.8 * P_out[i], col)
    # inner polygon, counter-rotating in steps
    shift_in = STEPS - floor(now / (7000 / STEPS)) % STEPS     # ccw, 7 s per turn
    if reveal == 1:
        for k in 0..c.poly_n-1:
            a = P_in[(shift_in + k * STEPS / c.poly_n) % STEPS]
            b = P_in[(shift_in + (k+1) * STEPS / c.poly_n) % STEPS]
            line(centre + a, centre + b, pal[1])
```
Cost estimate: a 40x20 circle is about 100 ring pixels, 10 glyphs and 3 to 6 lines. If baked into 32 pre-rendered frames per element at 40x20 it is 8 elements x 32 frames x 800 px, about 205k pixels, which fits in a 512x512 atlas and draws as one quad per caster.

---

## 7. Numbers

### Cited
| What | Value | Source |
|---|---|---|
| RO ground cast circle rotation | 40 deg/s, 9 s per turn | roBrowser MagicTarget.js |
| RO ground cast circle sizes | 1, 5, 7, 13 tiles | roBrowser MagicTarget.js |
| RO lock-on rotation | 250 deg/s, 1.44 s per turn | roBrowser LockOnTarget.js |
| RO lock-on shrink | 15 to 3 units in 250 ms | roBrowser LockOnTarget.js |
| RO lock-on colour pulse | 400 ms cycle, 2.5 Hz | roBrowser LockOnTarget.js |
| RO aura cylinder | 20 segments, 250 deg/s | roBrowser Cylinder.js |
| RO frozen tint | 0.0, 0.4, 0.8 multiply | roBrowser EntityState.js |
| RO poison tint | 0.9, 0.4, 0.8 | roBrowser EntityState.js |
| RO curse tint, icon opacity | 0.5, 0.15, 0.1 and 0.5 | roBrowser EntityState.js |
| RO stone tint | 0.1 grey, 0.3 while petrifying | roBrowser EntityState.js |
| D2 overlay blend modes | 9, with 25, 50, 75% steps | D2R data guide |
| D2 overlays per state | 4 slots (front, back, start, end) | D2R data guide |
| D2 overlay light radius | max 18 | D2R data guide |
| D2 default overhead offset | 75 | D2R data guide |
| OTClient sample aura opacity | 0.5 | effects.lua |
| FFXIV status cap | 30 per character | consolegameswiki (not fetched) |
| WoW Classic caps | 32 buffs, 16 debuffs | Blizzard forums (not fetched) |
| WCAG flash limit | at most 3 flashes in any 1 s | W3C Understanding 2.3.1 |
| WCAG flash definition | luminance swing of 10% or more, darker state below 0.80 | W3C |
| WCAG small-area exemption | 25% of a 10 degree field, about 341x256 px at 1024x768 | W3C |
| Godot 2D instance uniforms | 4.4, merged 2024-12-20 | PR #99230 |

Source for the flash rows: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html

### Inferred targets for a 32 px character (not measured)
- Caster circle 40x20 px. Shield bubble 40x40. Level-up burst 48 to 64 px tall.
- Orbit rx 14 to 18, ry 6 to 8, period 1.2 to 2.0 s, 2 to 4 motes.
- Ghosts 3 to 5, captured every 4 frames (67 ms), alpha 60/40/20%.
- Pulses 1 to 2 Hz for loops. Strobes (shocked) at 2 to 2.5 Hz at most. A flash is two transitions, so a 2.5 Hz strobe is 2.5 flashes per second, under the limit of 3. Many shocked characters flashing out of phase can add up over a large screen area, so sync the strobe phase to a global clock or use a tint flicker with under 10% luminance swing for other players.
- Persistent aura opacity 50% for own, 25% or rim only for others. Shield fill at most 15%.
- Loops of 4 to 8 frames at 100 to 125 ms per frame.

---

## 8. See it in action

Fetched and confirmed:
- Ragnarok Online status and cast code: https://github.com/vthibault/roBrowser (EntityState.js, MagicTarget.js, LockOnTarget.js, Cylinder.js)
- OTClient attached effects tutorial: https://github.com/mehah/otclient/wiki/Tutorial-Attached-Effects
- Diablo II overlay and state data: https://d2runewizard.com/game-files/guide.html
- FFXIV battle effects setting: https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_bteffect.html
- PoE clutter complaints: https://www.pathofexile.com/forum/view-thread/3660138

Search hits, not fetched:
- Hades effects, behind the scenes: https://80.lv/articles/a-behind-the-scenes-look-at-the-effects-in-hades
- Tibia conditions: https://tibia.fandom.com/wiki/Special_Conditions and https://tibia.fandom.com/wiki/Haste_(Condition)
- RO elements: https://irowiki.org/classic/Elements
- Magic circle generator with draw-in animation: https://game-dev-goose.itch.io/magic-circle-generator

Not researched this pass, no URL collected: MapleStory buff effects, Wizard of Legend, Secret of Mana and Trials of Mana, Golden Sun, Genshin, Magicka, Diablo II paladin aura footage. A follow-up should collect one video or wiki page for each.

---

## Sources
- roBrowser EntityState.js: https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Entity/EntityState.js
- roBrowser EntityRender.js: https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Entity/EntityRender.js
- roBrowser Entity.js (cast packet): https://github.com/vthibault/roBrowser/blob/master/src/Engine/MapEngine/Entity.js
- roBrowser MagicTarget.js: https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Effects/MagicTarget.js
- roBrowser LockOnTarget.js: https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Effects/LockOnTarget.js
- roBrowser Cylinder.js: https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Effects/Cylinder.js
- roBrowser EffectManager.js: https://github.com/vthibault/roBrowser/blob/master/src/Renderer/EffectManager.js
- roBrowser EffectTable.js: https://github.com/vthibault/roBrowser/blob/master/src/DB/Effects/EffectTable.js
- OTClient attachedeffect.cpp: https://github.com/mehah/otclient/blob/main/src/client/attachedeffect.cpp
- OTClient effects.lua: https://github.com/mehah/otclient/blob/main/modules/game_attachedeffects/effects.lua
- OTClient wiki, attached effects: https://github.com/mehah/otclient/wiki/Tutorial-Attached-Effects
- Diablo II data file guide (Overlay.txt, States.txt, skills.txt): https://d2runewizard.com/game-files/guide.html
- Phrozen Keep Overlay guide, Scribd copy (body not readable): https://www.scribd.com/document/781781832/Overlay
- Godot PR 99230, 2D instance uniforms: https://github.com/godotengine/godot/pull/99230
- Godot forum, instance uniforms in 2D: https://forum.godotengine.org/t/why-isnt-my-sprite2d-updating/105581
- Godot forum, 10k sprites with unique shader data: https://forum.godotengine.org/t/how-to-properly-utilize-unique-shader-data-across-10k-ish-sprites/131081
- Godot 3.5 batching docs: https://docs.godotengine.org/en/3.5/tutorials/performance/batching.html
- Godot forum, palette shader performance: https://forum.godotengine.org/t/i-wrote-a-shader-to-replace-the-palette-of-a-sprite-with-another-palette-is-this-the-best-way-any-way-to-optimize/24537
- godotshaders palette swap (sampler2D): https://godotshaders.com/shader/palette-swap-shader-sampler2d/
- godotshaders palette swap (recolor): https://godotshaders.com/shader/palette-swap-no-recolor-recolor/
- WCAG 2.2 Understanding 2.3.1: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- FFXIV UI guide, battle effects: https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_bteffect.html
- PoE forum threads: https://www.pathofexile.com/forum/view-thread/3690131 , https://www.pathofexile.com/forum/view-thread/3868713 , https://www.pathofexile.com/forum/view-thread/3660138 , https://www.pathofexile.com/forum/view-thread/3450606
- Grim Dawn forum, aura clutter: https://forums.crateentertainment.com/t/option-to-reduce-visual-clutter-auras/85512
- WoW buff cap threads: https://us.forums.blizzard.com/en/wow/t/the-32-buff-cap/468933 , https://us.forums.blizzard.com/en/wow/t/annifresh-remove-debuff-limits-edit-successful/2009570
- OTLand, condition icons: https://otland.net/threads/about-icon-condition.259450/
- Afterimage recipes: https://discussions.unity.com/t/2d-effects-tips/665528 , https://forum.defold.com/t/how-do-you-make-an-afterimage-effect/65628
- Magic circle tools: https://game-dev-goose.itch.io/magic-circle-generator , https://csaf.itch.io/sigil-core , https://blendermarket.com/products/procedural-transmutation-circles
