# 03. Projectiles, beams, chain lightning and trails

Researcher 03, VFX #10 Magic and spell VFX. Date 2026-11-11.

Method. I read raw source files from GitHub (Mindustry, Shattered Pixel Dungeon, OTClient, tModLoader ExampleMod, Godot docs XML) and a few web pages. Numbers marked "code" come from the file cited. Numbers marked "converted" are my arithmetic on code values. Numbers marked "inference" are mine.

Unit keys used for conversion.
- Mindustry: `tilesize = 8` world units per tile (Vars.java line 135), 60 ticks per second. Speeds are world units per tick.
- Shattered Pixel Dungeon (SPD): `DungeonTilemap.SIZE = 16` px per tile. Speeds are px per second.
- Terraria / tModLoader: 16 px tiles, 60 ticks per second ("60 = 1 second" in ExampleMod comments).
- Kingsfoil: 32 px tiles, 320x180 sandbox.

---

## 1. Projectile sprites and direction

### Takeaway
Tibia picks one of 9 pre-drawn frames (8 directions plus a centre frame) and never rotates. SPD rotates a single sprite freely at run time and gets away with it because missiles live under 0.5 s and often spin. For Kingsfoil the cheap and clean answer is 8 pre-drawn directions for long missiles (arrows, spears, bolts) and round, symmetric sprites for magic orbs so no direction art is needed at all. Use offline RotSprite to make 16 directions if 8 looks stiff.

### Cited findings
- OTClient `Missile::draw` maps the 8 compass directions onto a 3x3 pattern grid (`xPattern`, `yPattern` each 0..2). NorthWest is (0,0), North (1,0), East (2,1), South (1,2), and any other case uses (1,1). One direction is chosen once per missile in `setPath` from the from and to tiles. No rotation happens at draw time. Source: https://github.com/edubart/otclient/blob/master/src/client/missile.cpp
- SPD `MissileSprite` rotates at run time. `angle = 135 - atan2(d.x, d.y) * 180 / PI`, so item sprites are drawn pointing along a 45 degree diagonal and rotated to the flight direction. The sprite is flipped horizontally when `d.x < 0`. Source: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/MissileSprite.java
- SPD spin table in the same file. Default angular speed 720 deg/s. Darts, knives, spears, javelins, tridents and spirit arrows use 0 (they keep pointing forward). Boulder 90. Heavy boomerang and bolas 1440. Shuriken 2160 deg/s (6 turns per second).
- RotSprite (Xenowhirl) scales the image 8x with a modified Scale2x that treats similar pixels as matches, then rotates and shrinks back in one nearest-neighbour step. It "does not introduce new colors". Fast RotSprite (Oleg Mekekechko, Pixel Studio) uses one 3x upscale, rotates, then downsamples 3x, with a slight quality loss. Source: https://en.wikipedia.org/wiki/Pixel-art_scaling_algorithms
- A Godot shader port exists that upscales with Scale2x on the GPU and is labelled "RotSprite-like". Source: https://godotshaders.com/shader/rotsprite-like-algorithm-for-cleaner-pixel-art-rotation/
- Mindustry draws every bullet with run-time rotation (`Draw.rect(frontRegion, x, y, width, height, b.rotation() + offset)`), with a back sprite in one colour and a front sprite in a lighter colour. It is not a strict pixel-art game, so shimmer is not a concern there. Source: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/BasicBulletType.java
- Shmup art advice (Raymond Schlitter). Shapes that are stars, squares or oblong ovals take rotation well. Round shapes can pulse or flash between two frames instead. Source: https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design

### Inferences
- Why run-time rotation shimmers. Nearest-neighbour sampling of a rotated low-res sprite picks a different source texel for the same screen pixel as the angle changes by a fraction of a degree. Edges gain and lose single pixels frame to frame. A homing missile that turns 3 to 4 degrees per tick is the worst case because the angle changes every frame.
- RotSprite at 8x means 64 intermediate pixels per source pixel and Fast RotSprite 9 (converted). Both are bake-time tools for Kingsfoil. Run the bake offline, ship a strip of 8 or 16 frames.
- A 16x16 missile in 8 directions is a 128x16 strip, 2,048 px. In 16 directions it is 4,096 px. Texture cost is trivial.
- Mirror to halve the art. Draw N, NE, E, SE, S and flip for W, NW, SW. That is 5 drawn frames for 8 directions.
- Quantise the heading for homing missiles. Pick the frame with `round(angle / 45) & 7` and add 10 degrees of hysteresis so the frame does not flap at a boundary.

### Gaps
- sonicretro.org RotSprite page returned a bot-block page. I used Wikipedia instead.
- I did not verify the "cleanEdge" shader (torcado). No number for its cost.
- I found no published statement from Enter the Gungeon, Hammerwatch or Wizard of Legend on direction frames.

---

## 2. Motion

### Takeaway
Tibia flight time grows with the square root of distance, so near shots are slow enough to see and far shots do not drag. Shipped homing is a clamped turn toward the target at 3 to 4 degrees per tick with a fixed speed. A lob is a straight ground path plus a parabola in a separate height value. Wavy shots add a sine offset perpendicular to the path.

### Cited findings

Straight flight and speed.
- OTClient: `m_duration = 150 * sqrt(m_delta.length())` ms where delta is in tiles, then position is a linear interpolation `dest + delta * fraction`. Source: https://github.com/edubart/otclient/blob/master/src/client/missile.cpp
  - Converted: 1 tile 150 ms (6.7 tiles/s), 4 tiles 300 ms (13.3 tiles/s), 7 tiles 397 ms (17.6 tiles/s), 9 tiles 450 ms (20 tiles/s).
- SPD thrown items: `SPEED = 240` px/s, converted 15 tiles/s. Crossbow darts x3 (720 px/s, 45 tiles/s). Spirit arrows and scorpio shots x1.5 (360 px/s). Flight time is `distance / speed` through a position tween. Source: MissileSprite.java above.
- SPD magic bolts: `SPEED = 200` px/s, converted 12.5 tiles/s. Source: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/MagicMissile.java
- Mindustry defaults: `speed = 1`, `lifetime = 40` ticks, `drag = 0`, `accel = 0`. Source: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/BulletType.java
- Mindustry missile: speed 3.7 units/tick (converted 222 units/s, 27.75 tiles/s), lifetime 52 ticks (867 ms), 8x8 units. Sources: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/MissileBulletType.java and Blocks.java line 3680.
- Realm of the Mad God: range in tiles = speed in tiles/s x lifetime in s. A tiered sword shot is 10 t/s for 350 ms, range 3.5 tiles. Source: https://www.realmeye.com/wiki/weapon-attributes

Homing.
- Mindustry `updateHoming`: find closest target within `homingRange` (default 50 units, 6.25 tiles), then `vel.setAngle(moveToward(rotation, angleTo(target), homingPower * delta * 50))`. Speed is unchanged. Missiles use `homingPower = 0.08`. Converted: 4 degrees per tick, 240 deg/s. `homingDelay` holds off steering for the first ticks. Source: BulletType.java lines 747 to 769.
- tModLoader ExampleHomingProjectile: `maxDetectRadius = 400` px (25 tiles), 10 tick delay (167 ms) before homing starts, then rotate velocity toward the target by at most `MathHelper.ToRadians(3)` per tick (180 deg/s), keeping speed. Target must pass a line-of-sight test (`Collision.CanHit`). Hitbox 8x8 px, `timeLeft = 600` ticks (10 s). Source: https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleHomingProjectile.cs
- Noita HomingComponent defaults: `detect_distance` 150 px, `homing_targeting_coeff` 160, `homing_velocity_multiplier` 0.9, `max_turn_rate` 0.05 rad per frame (converted 2.9 deg/frame, 172 deg/s at 60 fps). Default mode accelerates toward the target. `just_rotate_towards_target` switches to rotation only. Source: https://noita.wiki.gg/wiki/Documentation:_HomingComponent
- Noita's wiki notes accelerative homing "often overshoots". Source: https://noita.wiki.gg/wiki/Guide_To_Homing

Lobbed arcs.
- Mindustry ArtilleryBulletType: the bullet does not collide in flight (`collides = false`, `collidesTiles = false`), `scaleLife = true` so lifetime is scaled to land on the aim point. Fake height is drawn by scaling the sprite. `shrinkX = 0.15`, `shrinkY = 0.5`, `shrinkInterp = Interp.slope`. Size is `height * ((1 - shrinkY) + shrinkY * interp(fout))`. Typical shells are speed 3 with lifetime 80 ticks (1.33 s). Wake puffs are emitted every `3 + fslope * 2` ticks with radius `fslope * 4`, so the wake is fattest at the top of the arc. Source: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/ArtilleryBulletType.java and BasicBulletType.java lines 50 to 52.
- SPD has no arc. Thrown items fly in a straight line between "raised tile centres".

Sine and boomerang.
- Mindustry weave: each tick the velocity is rotated by `sin((time + PI * weaveScale / 2) / weaveScale) * weaveMag` degrees. Half the bullets flip sign by a seed so pairs braid. Source: BulletType.java line 781.
- RotMG XML: `Amplitude` default 0, `Frequency` default 1 in "cycles per lifetime". Example values 0.6 and 2.0. Amplitude does not change forward range. Only one of Wavy, Parametric, Boomerang per shot. Source: https://sites.google.com/decagames.com/xml-documentation/xml-guide
- RotMG boomerang keeps speed and lifetime, so reach halves. 10 t/s for 700 ms reaches 3.5 tiles and returns. Source: https://www.realmeye.com/wiki/weapon-attributes
- Mindustry orbit around shooter (`circleShooter`): steer by a vector to the owner rotated up to 90 degrees as the bullet nears `circleShooterRadius`, limited to `speed * 0.3` per tick. Source: BulletType.java updateWeaving.

### Pseudocode

Homing step (turn-rate limited, fixed speed). Fixed-point friendly, runs on server or client.
```
# consts: TURN = 4 deg/tick (240 deg/s), DELAY = 10 ticks, RANGE = 6 tiles
func homing_step(p, dt_ticks):
    p.age += dt_ticks
    if p.age >= DELAY:
        if p.target == null or not valid(p.target):
            p.target = closest_enemy(p.pos, RANGE)       # grid query, not a full scan
        if p.target != null:
            want = angle_to(p.pos, p.target.pos)
            diff = wrap(want - p.angle, -180, 180)
            p.angle += clamp(diff, -TURN * dt_ticks, TURN * dt_ticks)
    p.pos += vec_from_angle(p.angle) * p.speed * dt_ticks
    p.frame = (round(p.angle / 45) & 7)                  # 8 pre-drawn directions
```
Turning circle radius = speed / turn rate in radians. At 12 tiles/s and 240 deg/s (4.19 rad/s) the radius is 2.9 tiles. A target inside that circle cannot be hit and the missile orbits. Fix it with a lifetime cap or by raising TURN as age grows (inference).

For a targeted spell that cannot miss (Tibia style) skip steering. Lerp from caster to the target's current position by `t`, so the missile always arrives on time.
```
pos = lerp(start, target.pos_now, t)     # t = age / duration, duration = 150 ms * sqrt(tiles)
```

Lob arc with shadow.
```
# duration from distance, peak height H px (try H = 0.5 * distance, clamp 8..48 px)
func lob_update(p, dt):
    p.t = min(1, p.t + dt / p.duration)
    ground = lerp(p.from, p.to, p.t)                 # straight line on the ground plane
    h = 4 * H * p.t * (1 - p.t)                      # parabola, 0 at both ends, H at t = 0.5
    draw_shadow(round(ground), scale = 1 - 0.5 * h / H)   # shadow shrinks as the ball rises
    draw_sprite(round(ground - vec(0, h)))           # screen up = height
    # sort by ground.y, never by sprite y
    if p.t == 1: impact(p.to)
```
The shadow is the true position. It is the readable part for players who must dodge. Collision is tested once, at landing.

Sine shot.
```
fwd = dir * speed * age
side = perp(dir) * A * sin(2 * PI * F * age / lifetime)   # RotMG convention: F cycles per lifetime
pos = origin + fwd + side
```

### Inferences
- Pure-pursuit steering (above) is what Mindustry, tModLoader and Noita ship. I found no shipped 2D game source using proportional navigation. It is not needed when targets move at 2 to 5 tiles/s and missiles at 12 or more.
- For Kingsfoil targeted spells, the OTClient formula with the destination re-read each frame gives a cannot-miss missile with zero steering cost.
- For aimed skillshots keep constant speed so the player can lead the shot. 10 to 15 tiles/s matches SPD (12.5 to 15) and RotMG swords (10).

### Gaps
- No exact position formula for RotMG wavy shots in an official page. The forum transcription is unconfirmed.
- Terraria vanilla homing (Chlorophyte Bullet) numbers not found. tModLoader's example stands in.
- `Interp.slope` (peaks at mid-life) is from my memory of the Arc library. I did not open that file.

---

## 3. Trails

### Takeaway
Three trail families ship in the games I read. A ribbon built from a short position buffer (Mindustry, 7 to 27 points). Afterimage copies of the sprite at old positions with stepped alpha (Terraria, 5 copies). A particle wake dropped at a fixed interval (SPD, one particle per 10 ms. Mindustry, one puff per 3 to 5 ticks). For pixel art the afterimage and wake families keep hard pixels. The ribbon needs care.

### Cited findings

Ribbon (Mindustry `Trail.java`). Source: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/graphics/Trail.java
- Storage is one flat float array, 3 floats per point (x, y, width). Capacity `length * 3`. Oldest point first.
- `update(x, y, width)` adds points on a tick counter (`counter += Time.delta`), so one point per 1/60 s regardless of frame rate. If more than one tick passed it adds interpolated points. It removes points from the front when over `length`.
- `draw(color, width)`: for each consecutive pair it fills one quad. Half-width at point i is `(i / n) * width * w_i`, a linear taper from 0 at the tail to full at the head. The edge direction is perpendicular to the segment angle. The tail point is lerped toward its neighbour by `counter` so the tail slides smoothly.
- `drawCap` draws a half circle sprite ("hcircle") at the head.
- After the bullet dies the trail is handed to `Fx.trailFade`, which calls `shorten()` each tick and lasts `trail.length * 1.4` ticks. Source: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/content/Fx.java line 44.
- Shipped sizes: `trailLength = 7`, `trailWidth = 3` (silicon artillery, Blocks.java 3508), `trailLength = 9` (Blocks.java 4010), commented preset `trailLength = 27`, `trailWidth = 3.5` in ArtilleryBulletType. Default width 2. Converted: 7 points is 117 ms, 9 is 150 ms, 27 is 450 ms. At speed 3 units/tick a 7 point trail is 21 units long, 2.6 tiles.
- Width can be modulated with `trailInterp` over bullet life and a sine (`trailSinMag`, `trailSinScl`).

Afterimage (tModLoader). Source: https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleBullet.cs
- `TrailCacheLength = 5` old positions, `TrailingMode = 0`. Draw loop goes from oldest to newest and tints each copy by `(n - k) / n`, so alphas step 1/5, 2/5 and so on up to 1.
- `extraUpdates = 1` runs the projectile logic twice per frame. Fast bullets then collide at half-step spacing.

Particle wake.
- SPD MagicMissile: an emitter rides the bolt and calls `pour(factory, 0.01f)`, one particle per 10 ms. Emitter box `size(4)` px for most types, 10 for specks, 2 for shaman bolts. Magic particles live 0.5 s with random speed -10..10 px/s. White particles live 0.4 s at 0.5 alpha. Source: MagicMissile.java lines 128 to 205, 345, 549.
  - Converted: at 200 px/s one particle per 2 px of travel. About 50 live particles per bolt at steady state (100 per s x 0.5 s). Frame rate limits real emission, so at 60 fps about 1 to 2 per frame.
- Mindustry: `trailChance = 0.2` per tick for missiles (12 puffs/s on average), or `trailInterval` for uniform spacing. The puff `Fx.missileTrail` is a filled circle, lifetime 50 ticks (833 ms), radius `param * fout` with `trailParam = 2`. `trailMinVelocity` stops emission when the bullet is slow. Sources: BulletType.java 275 to 298, Fx.java 1315.

Godot.
- `Line2D` "is drawn using a 2D mesh" and "is not accelerated by batching when being anti-aliased". Source: https://github.com/godotengine/godot/blob/master/doc/classes/Line2D.xml

### Pseudocode

Ring-buffer trail, pixel-art version. No allocation after spawn.
```
N = 8                       # points, one per 16.7 ms tick -> 133 ms of history
buf_x[N], buf_y[N]; head = 0; count = 0

func trail_push(x, y):      # call once per fixed tick, not per frame
    buf_x[head] = x; buf_y[head] = y
    head = (head + 1) % N
    count = min(count + 1, N)

func trail_draw():
    for i in 0 .. count - 2:                 # i = 0 is the newest pair
        a = (head - 1 - i + N) % N
        b = (head - 2 - i + N) % N
        f = i / (count - 1)                  # 0 at head, 1 at tail
        w = WIDTH_STEPS[int(f * 3)]          # e.g. [3, 2, 1, 1] px, stepped not smooth
        c = RAMP[int(f * 4)]                 # e.g. white, light, mid, dark. palette steps, no alpha
        bresenham_line(buf[a], buf[b], w, c)
    # optional dither fade on the last third: skip pixels where (x + y) & 1

func trail_release():       # projectile died: keep drawing, pop one point per tick
    count = max(0, count - 1)   # gone after N ticks (Mindustry uses length * 1.4)
```
Skip the push when the projectile moved less than 1 px, or the tail collapses into a dot.

Afterimage variant: draw the sprite at `buf[head - 2]`, `buf[head - 4]`, `buf[head - 6]` with a darker palette row each. Three extra sprites per projectile.

Wake variant: accumulate distance, and every 4 px emit one pooled 1 to 2 px particle with 300 to 500 ms life. Spacing by distance instead of time keeps the wake even at any speed.

### Inferences
- Ribbon cost. N points means N - 1 quads. 30 projectiles with 8 points is 210 quads, small if batched into one mesh or one `draw_polygon` pass. 30 separate `Line2D` nodes are 30 meshes rebuilt every frame. Prefer one custom-draw node for all trails. Estimate, not measured.
- A smooth tapering ribbon reads as vector art against pixel sprites. Stepped widths (3, 2, 1 px) and palette steps keep it in style.
- Wake particles are the costliest per projectile. SPD's 50 live particles per bolt works because SPD is turn-based with one bolt at a time. For 30 casters cap the wake at 6 to 10 live particles per missile and drop it first for other players' spells.
- Trail time of 100 to 150 ms (6 to 9 ticks) is the common shipped range (Terraria 5, Mindustry 7 to 9). 450 ms is the long, showy preset.

### Gaps
- No measured ms cost for Godot Line2D trails on WebGL2. Needs a sandbox test.
- No source found for Nuclear Throne or Hammerwatch trail code.

---

## 4. Beams and channels

### Takeaway
A beam is one stretched sprite or a few stacked lines. SPD stretches a single texture between two points, draws it additive and collapses its thickness and alpha to zero over 0.5 to 1 s. Mindustry stacks 3 or 4 lines from a wide translucent colour to a thin white core, each layer half the width of the last, with a small sine flicker.

### Cited findings

SPD `Beam.java`. Source: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Beam.java
- One `Image`. Origin at left-middle. `angle = atan2(dy, dx)`, `scale.x = distance / texture_width`.
- Each frame `p = timeLeft / duration`, then `alpha(p)` and `scale.y = p`. The beam thins and fades together.
- Durations: DeathRay 0.5 s, HealthRay 0.75 s, LightRay 1 s, SunRay 1 s with a yellow tint (1, 1, 0.25).
- Drawn with `Blending.setLightMode()` (additive).
- No caps, no flicker, no scrolling.

Mindustry LaserBulletType (instant laser). Source: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/LaserBulletType.java
- Defaults: `length = 160` units (20 tiles), `width = 15`, `lifetime = 16` ticks (267 ms), `lengthFalloff = 0.5`.
- Colours, outside in: laser colour at 0.4 alpha, laser colour opaque, white.
- Draw loop per colour: `cwidth *= 0.5`, stroke = `cwidth * fout`. Converted widths at spawn: 7.5, 3.75, 1.9 units.
- Length grows in over the first 20% of life (`curve(fin, 0, 0.2)`), 3.2 ticks, 53 ms. Width shrinks linearly to 0 over the whole life.
- End cap is a triangle of length `cwidth * 2 + width / 2`. Start cap is a filled circle of radius `cwidth * fout`. Two side spikes at +-90 degrees, 29 units long.
- Lancer turret uses length 173 units. Blocks.java line 3602.
- Hit test is done once at spawn (`Damage.collideLaser`), speed 0, pierce on.

Mindustry ContinuousLaserBulletType (channel). Source: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/ContinuousLaserBulletType.java
- 4 colours: `ec745855` (33% alpha), `ec7458aa` (67% alpha), `ff9c5a`, white.
- Stroke multiplier per layer lerps from `strokeFrom = 2` to `strokeTo = 0.5`. Base `width = 9`. Converted layer widths: 18, 13.5, 9, 4.5 units.
- Flicker: width adds `absin(time, oscScl = 0.8, oscMag = 1.5)`, up to +1.5 units. Brightness multiplies by `1 + absin(time, 1, 0.1)`, up to +10%.
- Caps: a rounded "flame front" polygon, back length 7 units, front length 35 units, 13 divisions. Inner layers get shorter fronts (`pointyScaling = 0.75`).
- `fadeTime = 16` ticks. Length and width both scale by `fout` in the last 16 ticks, so the beam retracts when released.
- Meltdown turret uses length 200 units (25 tiles). Blocks.java line 4358.
- Length is re-cast each frame (`Damage.findLength`) so the beam stops at blockers.

### Pseudocode

Beam with core and halo, pixel-art version.
```
# layers outside-in. widths in px at 320x180. colours are palette entries, no alpha needed
LAYERS = [ (5, DARK_HUE), (3, MID_HUE), (1, WHITE) ]

func beam_draw(a, b, age, life, channel):
    if channel: k = 1                                   # held beam, full size
    else:       k = 1 - age / life                      # one-shot: shrink to nothing (SPD, Mindustry)
    grow = min(1, age / (0.2 * life))                   # extend over first 20% of life
    end = lerp(a, b, grow)
    flick = (tick / 3) & 1                              # 20 Hz two-state flicker, +1 px on halo
    for (w, col) in LAYERS:
        ww = max(1, round(w * k)) + (flick if w > 1 else 0)
        bresenham_thick_line(a, end, ww, col)
    draw_sprite(CAP_START[flick], a)                    # 2 frame muzzle blob
    draw_sprite(CAP_END[tick / 4 % 3], end)             # 3 frame impact splash, covers the line end
    # channel only: scroll a 2 colour dash pattern along the core
    #   core pixel i uses WHITE if ((i - tick) & 7) < 5 else LIGHT_HUE
```
The 1 px white core must survive to the last frame. Remove the halo layers first as `k` drops.

### Inferences
- Halving width per layer (Mindustry `lengthFalloff = 0.5`) gives 3 layers in the ratio 4:2:1. At 320x180 that is 5, 3, 1 px. A 4 layer beam is wider than a character sprite and belongs to boss spells only.
- A one-shot beam life of 250 to 500 ms matches both games (267 ms Mindustry, 500 ms SPD DeathRay).
- Cost is 3 thick lines and 2 sprites per beam. 30 beams is 150 draw items, no per-pixel work. A textured-quad beam with scrolling UV costs one quad but needs rotation of a texture, which brings back the shimmer problem at shallow angles. Bresenham lines stay crisp at any angle.
- 20 Hz two-state flicker changes 1 px of halo width. It is a small-area change, well under photosensitivity concern, but the study should check it against the 3 flashes per second rule owned by another researcher.

### Gaps
- No textured scrolling-UV beam in the sources read. The dash-scroll trick is my inference.
- No Tibia beam source. Tibia draws beams as rows of per-tile magic effects (covered by the impacts researcher).

---

## 5. Chain lightning and bolts

### Takeaway
Shipped bolts are simpler than the textbook. SPD draws each arc as two stretched sprites with one jittered midpoint, re-rolled every frame for 0.3 s. Mindustry walks 12 steps of 15 units with a random +-20 degree turn and snaps to the furthest enemy in reach. The textbook version is midpoint displacement with 5 generations (32 segments), offset halved per generation, branches at 0.7 length.

### Cited findings

SPD `Lightning.java`. Source: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Lightning.java
- `DURATION = 0.3` s. Alpha = `life / DURATION` on all arcs. Additive blend.
- Each `Arc` is 2 images. Every `update()` the midpoint is re-rolled as the true midpoint plus `Random.Float(-4, +4)` px on each axis. On a 16 px tile that is +-25% of a tile. The bolt changes shape every frame for 18 frames at 60 fps.
- A Lightning holds a list of arcs, so a whole chain is one effect object.

SPD Wand of Lightning chain rule. Source: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/wands/WandOfLightning.java
- Recursive. From each hit character, every character within path distance 1 tile (2 if the source stands in water) not already hit gets an arc and recurses. No bounce cap, the hit list stops repeats.
- Damage multiplier `0.4 + 0.6 / affected_count`. All arcs are built first, then drawn in one Lightning.

Mindustry `Lightning.java`. Source: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/Lightning.java
- Loop runs `length / 2` times. Each step records a node at the current point plus `range(3)` units of jitter on each axis.
- `hitRange = 30` units. It collects enemies in a 30 unit box, picks the furthest, and if within 60 units jumps to it. Otherwise `rotation += range(20)` degrees and it advances `hitRange / 2 = 15` units.
- `maxChain = 8` distinct units per bolt. Seeded RNG (`random.setSeed(seed)`), so server and clients build the same shape from one integer.
- Insulated tiles stop the bolt (raycast per segment).
- Drawing, `Fx.lightning`: lifetime 10 ticks (167 ms). Stroke `3 * fout` units. Colour lerps from bolt colour to white over life. A filled circle of radius stroke/2 at every node hides the joints. Static shape, no per-frame re-roll. Source: Fx.java line 189.
- Arc turret: `lightningLength = 25`, so 12 nodes. Range is computed as `length * 6` = 150 units, 18.75 tiles. Source: LightningBulletType.java, Blocks.java 3622.
- Bullets can spawn bolts on hit: `lightning` roots, `lightningLength = 5` default, cone 360 degrees.

Midpoint displacement (drilian, 2009). Source: http://drilian.com/2009/02/25/lightning-bolts/
- Start with one segment. Each generation splits every segment at its midpoint and offsets the midpoint along the perpendicular by `random(-offset, offset)`. Then `offset /= 2`. The illustrations use 5 generations.
- Branch: at a split, add a third segment from the midpoint in the same direction rotated by a small random angle, with length scale 0.7, called "a good value". Branches are drawn dimmer.
- Animation: two bolts alive at once. Each is replaced every 1/3 s (20 frames). The second runs 1/6 s behind. A bolt is at half brightness 10 frames after spawn.
- Overlapping glow quads over-brighten at joints. The author's fix is max blending instead of additive.

Chain rules in ARPGs (wiki and search-snippet figures, not checked against game data).
- Path of Exile Arc: chains 4 times at gem level 1, 7 at level 20. Chain range 35 units per a patch note (earlier 25, earlier still 50). "15% more damage per remaining chain". Each chain also spawns a secondary arc that cannot chain. Source: https://www.poewiki.net/wiki/Arc
- Diablo II Chain Lightning: 5 targets at level 1, one more bounce per 5 levels past 20, 11 bounces at level 30. Source: https://diablo2.wiki.fextralife.com/Chain+Lightning

### Pseudocode

Midpoint-displacement lightning with branches. Iterative, fixed arrays, seeded.
```
# params: GEN = 4 (16 segs) for a 3..6 tile bolt, GEN = 3 for under 3 tiles
#         OFFSET0 = 0.25 * length (px), DECAY = 0.5, BRANCH_P = 0.3 on generations 1..2 only,
#         BRANCH_LEN = 0.7, BRANCH_ANGLE = +-25 deg, REDRAW = every 3 ticks (20 Hz), LIFE = 9..18 ticks

func build_bolt(a, b, seed, gen, bright):
    rng = Rng(seed)
    segs = [ (a, b, bright) ]
    offset = OFFSET0(len(a, b))
    for g in 0 .. gen - 1:
        next = []
        for (p, q, lv) in segs:
            mid = (p + q) / 2 + perp(normalize(q - p)) * rng.range(-offset, offset)
            next.add((p, mid, lv)); next.add((mid, q, lv))
            if lv == MAIN and g in [1, 2] and rng.chance(BRANCH_P):
                d = rotate(mid - p, rng.range(-25, 25)) * BRANCH_LEN
                next.add((mid, mid + d, BRANCH))          # refined by later generations too
        segs = next
        offset *= DECAY
    return segs

func draw_bolt(bolt, tick):
    if tick % REDRAW == 0: bolt.segs = build_bolt(bolt.a, bolt.b, bolt.seed + tick, GEN, MAIN)
    # pass 1: halo. 3 px wide, element colour. skip for BRANCH segs
    for s in bolt.segs where s.lv == MAIN: bresenham_thick_line(s.p, s.q, 3, HALO)
    # pass 2: core. 1 px white on main, 1 px light hue on branches
    for s in bolt.segs: bresenham_line(s.p, s.q, WHITE if s.lv == MAIN else LIGHT)
    # last third of life: drop the halo, then dither the core
```

Chain rule (server).
```
func chain(first, max_bounces = 4, range = 3 tiles):
    hit = [first]; cur = first
    while len(hit) <= max_bounces:
        nxt = nearest enemy to cur within range, not in hit, with line of sight
        if nxt == null: break
        hit.add(nxt); cur = nxt
    send(spell_id, caster, hit[], seed)        # one event: ids plus a 1 byte seed
```
Client staggers the hops by 2 to 3 ticks (33 to 50 ms) each so the eye follows the jump order. Each hop is its own bolt object.

### Inferences
- Segment counts. 5 generations is 32 main segments. At 320x180 a 4 tile bolt is 128 px, so 32 segments are 4 px each, which is finer than needed. 4 generations (16 segments of 8 px) is enough. Under 3 tiles use 3 generations.
- Two-pass halo and core in solid palette colours avoids the additive over-bright joints that drilian reports, because opaque draws do not accumulate.
- Redraw rate. SPD re-rolls every frame (60 Hz) for 0.3 s. Drilian replaces every 20 frames with two overlapping bolts. Mindustry never re-rolls and lives 167 ms. A re-roll every 3 ticks (20 Hz) for 150 to 300 ms sits between them and gives 3 to 6 distinct shapes per bolt. Full-shape re-rolls are large-area luminance changes when the halo is bright, so keep the halo mid-value and the bolt short-lived. Hand to the accessibility researcher.
- Cost. A 16 segment bolt with 2 branches of about 4 segments is about 24 lines per pass, 40 lines for both passes (branches skip the halo). A 4 hop chain is 160 short lines, rebuilt at 20 Hz. 10 simultaneous chains is 1,600 lines per frame, fine for a single batched custom draw, heavy as 1,600 separate nodes. Estimate.
- The seed trick from Mindustry means the server sends target ids and one seed. Every client draws the same bolt without sending points.

### Gaps
- PoE and D2 numbers come from wiki pages and search snippets. PoE "units" have no stated px or tile conversion.
- No public source for Diablo II's bolt drawing. DevilutionX covers Diablo I only and I did not read it.

---

## 6. Published design statements from other games

### Takeaway
I found few hard numbers. The solid guidance is from shmup craft writing. Give bullets a bright core next to a dark border, draw hostile bullets above everything, prefer reds, pinks and purples for hostile shots, and stretch fast shots so length matches speed.

### Cited findings
- Boghog's bullet hell shmup 101. Bullets need "very bright elements (the glowing cores) right next to dark elements". Backgrounds should be midtone and low contrast. Reds, pinks and purples clash least. Yellow and orange bullets blend into explosions and pickups. Enemy bullets draw above player sprites, player shots, items and explosions. Smaller, faster bullets draw above larger, slower ones. Sprite length should match travel speed. Source: https://shmups.wiki/library/Boghog's_bullet_hell_shmup_101
- Raymond Schlitter (Slynyrd, Pixelblog 31). Projectiles "should always be readable across all backgrounds". Use a double outline, one bright and one dark. Projectiles often get white outlines while other sprites get dark ones. Target canvas 480x270 inside a 320x180 to 640x360 range. Flash by alternating two frames. Source: https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design
- Vlambeer, "The art of screenshake" (Jan Willem Nijman, 2013). A fan recreation lists the steps "Increase Bullet Size", "Muzzle Flash", "Faster Bullet" among others. Source: https://dkliao.itch.io/the-art-of-screenshake-recreation (devlog index. The direct devlog URL returned 404 for me.)
- Enter the Gungeon. Dave Crooks said the top-down view and collision systems kept the first game from full bullet-hell density, and the studio shrank hitboxes for Exit the Gungeon. Source: https://www.gamedeveloper.com/design/building-i-enter-the-gungeon-i-s-dungeon-climbing-spin-off-i-exit-the-gungeon-i-
- Noita exposes homing as data fields with defaults (see section 2). Source: https://noita.wiki.gg/wiki/Documentation:_HomingComponent
- Mindustry draws each basic bullet as two sprites, a darker back and a lighter front (`backColor`, `frontColor`), and lasers end in white. Source: BasicBulletType.java, LaserBulletType.java.

### Inferences
- For Kingsfoil, hostile missiles get a dark 1 px outline plus a white or near-white core, in a hue family reserved for hostile shots. Friendly missiles keep element colour and may drop the outline and lower contrast. This connects to the tier rule in feel study F5.
- The Tibia grass and stone ground is busier than a shmup background, so the double outline matters more here than in a space shooter.
- Minimum readable missile at 320x180 is about 5x5 px with a 1 px core (inference from outline + mid + core needing 5 px across).

### Gaps
- No dev-published projectile sizes or speeds found for Enter the Gungeon, Nuclear Throne, Vampire Survivors, Hammerwatch or Wizard of Legend. These are honest gaps. A later pass could read the Nuclear Throne GameMaker source release or Hammerwatch mod files.
- I did not watch the Nijman talk. Any specifics beyond the step names are unverified.

---

## 7. Cost, pooling and counts

### Takeaway
Shipped games pool bullets, cap them, and find hits with a spatial structure. Terraria's cap is 1,000 live projectiles. Mindustry marks bullets `pooled = true` and queries a quadtree. Kingsfoil's hard case of 30 casters needs far fewer than either.

### Cited findings
- Terraria: "capped at 1000" simultaneous projectiles, citing the 1.4.5.8 source field `Main.projectile`. Source: https://terraria.wiki.gg/wiki/Projectiles
- Terraria projectiles carry a fixed `ai[]` float array and an `oldPos[]` cache of set length (5 in the example), so no per-frame allocation. Source: ExampleBullet.cs, ExampleHomingProjectile.cs above.
- Mindustry: `@EntityDef(value = {Bulletc.class}, pooled = true, serialize = false)`. Bullets are pooled and are not saved or synced as entities. Collision uses a `QuadTree` (`tree.intersect(r2, arrOut)`). Sources: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/comp/BulletComp.java and https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/EntityCollisions.java
- Mindustry lightning allocates per bolt (`new Seq<Vec2>()`, `new Vec2` per node). It accepts garbage for a 167 ms effect. Source: Lightning.java.
- Mindustry trail effects are skipped on headless servers (`if(!headless && trailLength > 0)`). Source: BulletType.java line 822.
- SPD recycles particles through `emitter.recycle(Class)` and revives missile sprites with `reset()`/`revive()`. Sources: MagicMissile.java, MissileSprite.java.
- OTClient missiles are client-only objects removed by a scheduled event after `m_duration`. The server sends id, from and to. No per-frame network traffic. Source: missile.cpp.
- Godot `Line2D` builds a 2D mesh and loses batching when anti-aliased. Source: Line2D.xml above.

### Inferences
- Budget for the 30 caster case. 30 casters x 1.5 casts/s x 0.4 s flight is 18 live missiles on average. A burst peak of 60 is a safe pool size. Add 8 trail points each, 480 floats pairs. All of it fits in flat typed arrays.
- One node should draw all missiles and trails (`_draw` with batched primitives, or one MultiMesh for sprites). 60 separate scenes with Line2D and CPUParticles2D children is the pretty-but-expensive path.
- Missiles for targeted spells need no collision. Aimed missiles need one grid lookup per tick against the 32 px tile grid the server already has. No quadtree needed at this scale.
- Allocation rule: no `new` in the per-tick path. Lightning points go in a preallocated array of 64 segments per bolt slot.

### Gaps
- No measured frame times for any of this on Godot Compatibility/WebGL2. Every cost above is an estimate.
- Vampire Survivors projectile cap not found. PC Gamer covers the engine port for performance but gives no projectile numbers (https://www.pcgamer.com/vampire-survivors-was-such-a-big-hit-its-getting-a-whole-new-engine).

---

## Proposed Kingsfoil defaults (inference, to test in the sandbox)

| Item | Value | Basis |
|---|---|---|
| Targeted missile flight | 150 ms x sqrt(tiles) | OTClient |
| Aimed missile speed | 10 to 15 tiles/s | SPD 12.5 to 15, RotMG 10 |
| Direction frames | 8, mirrored from 5 drawn | OTClient 3x3 grid |
| Homing turn rate | 3 to 4 deg/tick, 10 tick delay | tModLoader 3, Mindustry 4 |
| Homing acquire range | 6 tiles | Mindustry 6.25 |
| Trail | 8 points, 133 ms, widths 3/2/1 px | Mindustry 7 to 9, Terraria 5 |
| Wake | 1 particle per 4 px, 300 to 500 ms life, cap 8 | SPD 2 px and 0.4 to 0.5 s, scaled down |
| One-shot beam | 250 to 500 ms, layers 5/3/1 px, grow-in 20% | Mindustry 267 ms, SPD 500 ms |
| Bolt | 4 generations, offset 25% of length, halved each gen, branch 0.7 | drilian |
| Bolt life and redraw | 150 to 300 ms, re-roll at 20 Hz | SPD 300 ms, Mindustry 167 ms |
| Chain | 4 bounces, 3 tile range, 33 to 50 ms per hop | PoE 4 to 7, D2 5, Mindustry 8 max |
| Pool | 60 missiles | estimate |

---

## See it in action

| Game | URL | Note |
|---|---|---|
| Tibia / OTClient | https://github.com/edubart/otclient | missile.cpp read |
| Shattered Pixel Dungeon | https://shatteredpixel.com/ | not fetched, official site |
| Mindustry | https://mindustrygame.github.io/ | not fetched, official site with web demo link |
| Terraria | https://terraria.wiki.gg/wiki/Projectiles | fetched |
| Noita | https://noita.wiki.gg/wiki/Guide_To_Homing | fetched |
| Realm of the Mad God | https://www.realmeye.com/wiki/weapon-attributes | search result |
| Path of Exile Arc | https://www.poewiki.net/wiki/Arc | search result |
| Diablo II Chain Lightning | https://diablo2.wiki.fextralife.com/Chain+Lightning | search result |
| Nuclear Throne / Vlambeer talk | https://dkliao.itch.io/the-art-of-screenshake-recreation | playable recreation, page not fetched |
| Enter the Gungeon | https://www.gamedeveloper.com/design/building-i-enter-the-gungeon-i-s-dungeon-climbing-spin-off-i-exit-the-gungeon-i- | search result |
| Lightning demo | http://drilian.com/2009/02/25/lightning-bolts/ | fetched |

---

## Sources

Code read directly (raw files, master or stable branch, 2026-11-11).
- https://github.com/edubart/otclient/blob/master/src/client/missile.cpp
- https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/MissileSprite.java
- https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/MagicMissile.java
- https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Beam.java
- https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Lightning.java
- https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/wands/WandOfLightning.java
- https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/tiles/DungeonTilemap.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/graphics/Trail.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/BulletType.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/BasicBulletType.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/MissileBulletType.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/ArtilleryBulletType.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/LaserBulletType.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/ContinuousLaserBulletType.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/bullet/LightningBulletType.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/Lightning.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/content/Fx.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/content/Blocks.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/comp/BulletComp.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/EntityCollisions.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/Vars.java
- https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleHomingProjectile.cs
- https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleBullet.cs
- https://github.com/godotengine/godot/blob/master/doc/classes/Line2D.xml

Pages fetched.
- http://drilian.com/2009/02/25/lightning-bolts/
- https://noita.wiki.gg/wiki/Documentation:_HomingComponent
- https://noita.wiki.gg/wiki/Guide_To_Homing
- https://sites.google.com/decagames.com/xml-documentation/xml-guide
- https://www.realmeye.com/forum/t/amplitude-and-frequencies-of-shots/18584
- https://en.wikipedia.org/wiki/Pixel-art_scaling_algorithms
- https://terraria.wiki.gg/wiki/Projectiles
- https://shmups.wiki/library/Boghog's_bullet_hell_shmup_101
- https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design

Search-result only (summaries read, pages not opened).
- https://www.realmeye.com/wiki/weapon-attributes
- https://www.poewiki.net/wiki/Arc and https://pathofexile.fandom.com/wiki/Arc
- https://diablo2.wiki.fextralife.com/Chain+Lightning and https://diablo.fandom.com/wiki/Chain_Lightning_(Diablo_II)
- https://godotshaders.com/shader/rotsprite-like-algorithm-for-cleaner-pixel-art-rotation/
- https://www.gamedeveloper.com/design/building-i-enter-the-gungeon-i-s-dungeon-climbing-spin-off-i-exit-the-gungeon-i-
- https://www.pcgamer.com/vampire-survivors-was-such-a-big-hit-its-getting-a-whole-new-engine

Failed.
- https://info.sonicretro.org/RotSprite (bot block)
- dkliao devlog deep link (404)

Scratch copies of the code files are in `studies/vfx-magic/notes/scratch-03/`.
