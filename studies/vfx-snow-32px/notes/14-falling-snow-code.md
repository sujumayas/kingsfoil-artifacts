# 14. Falling snow and weather overlays at 32 px, from real code

Researcher 14, 12 Nov 2026. Angle: flake sizes, counts and speeds read from shipped source, converted to tiles so they can be compared with a 640x360 canvas on 32 px tiles (20 x 11.25 tiles, 225 tiles, 230,400 px).

Tags: [V] read in the fetched file this session. [I] my inference or arithmetic. [K] from memory, not checked this session. [U] unverified.

All line numbers refer to the `master` or `main` branch as fetched on 12 Nov 2026. Raw copies are in `scratch-14/dl/`.

Baseline from VFX #1 (see `studies/vfx-snow/report.md` A4): 320x180, 8 px tiles (900 tiles), 456 flakes in three layers of 260 / 150 / 46, 1 px and 2x2 px, fall 14 / 24 / 42 px/s.

---

## Q1. RPG Maker VX Ace, MV and MZ weather code

### Takeaway
RPG Maker is the best scaling experiment in shipped code. VX Ace (32 px tiles, 544x416) and MV (48 px tiles, 816x624) both show 17 x 13 tiles. When the tile grew 1.5 times, Kadokawa kept the flake count at `power * 10` (90 at most), grew the flake bitmap from 6 px to 9 px (0.1875 tile both times), kept 3 px per frame, and made flakes live 4 times longer. Count followed tiles. Size followed the tile. Density per pixel fell 2.25 times.

### Cited findings

MV, `js/rpg_core/Weather.js` (MIT, 816x624, 48 px tiles, 60 fps) [V]:
- Flake bitmap, lines 69-70. `new Bitmap(9, 9)` then `drawCircle(4, 4, 4, 'white')`. A hard white disc of radius 4, about 50 px of area.
- Count, line 96. `maxSprites = Math.floor(this.power * 10)`. The class comment gives power "in the range (0, 9)", so 90 sprites at most.
- Motion, lines 184-187. `rotation = Math.PI / 16`, `ax -= 3 * sin(rotation)`, `ay += 3 * cos(rotation)`, `opacity -= 3`. Per frame that is 0.585 px left and 2.942 px down. At 60 fps this is 176.5 px/s down (3.68 tiles/s) and 35.1 px/s left (0.73 tiles/s) [I].
- Respawn, lines 146-148 and 196-198. A flake is reborn when `opacity < 40`. New position is `randomInt(width + 100) - 100 + origin.x`, `randomInt(height + 200) - 200 + origin.y`. New opacity is `160 + randomInt(60)`.
- Lifetime [I]. Opacity 160 to 219 falling by 3 gives 41 to 60 frames (0.68 to 1.0 s). A flake travels 121 to 177 px down, which is 2.5 to 3.7 tiles, then vanishes wherever it is.
- Dimmer, lines 78-79 and 88. A `ScreenSprite` of colour (80, 80, 80) with `opacity = floor(power * 6)`. At power 9 that is 54/255, a 21% grey veil. It applies to rain, storm and snow alike.
- Scroll coupling. `sprite.x = sprite.ax - this.origin.x` (line 105). `Spriteset_Map.updateWeather` sets `origin.x = $gameMap.displayX() * $gameMap.tileWidth()` (`Spriteset_Map.js` lines 165-170). Flakes hold world coordinates, so they stay put when the camera scrolls.
- Ramp. `Game_Screen.updateWeather` (lines 259-269) moves power toward its target with `power = (power * (d - 1) + t) / d` each frame. Sprites are added and removed to match.
- For comparison, rain is a 1x60 px bitmap at 6 px/frame and storm is 2x100 px at 8 px/frame.

MZ, `rmmz_core.js` v1.3.3, lines 4336-4426 [V]. The `Weather` class is identical to MV in every number above (9x9 bitmap, radius 4, `power * 10`, 3 px per frame at pi/16, opacity minus 3, reborn below 40, dimmer 80 grey at `power * 6`). MZ's default screen is 816x624 with 48 px tiles [K].

VX Ace, `Spriteset_Weather` (RGSS3 default script, 544x416, 32 px tiles, 60 fps [K]) [V]:
- Flake bitmap. `Bitmap.new(6, 6)` built from four rectangles. A 6x6 rounded plus shape, 32 px painted. The core (12 px) is white at alpha 192 and the rim is white at alpha 96. So VX Ace has a two-tone soft flake, and MV replaced it with a hard disc.
- Count. `sprite_max = (@power * 10).to_i`.
- Motion. `sprite.x -= 1`, `sprite.y += 3`, `sprite.opacity -= 12`. Whole pixels only. At 60 fps that is 180 px/s down (5.6 tiles/s) and 60 px/s left.
- Respawn. Reborn when `opacity < 64`. Position `rand(Graphics.width + 100) - 100 + @ox`, `rand(Graphics.height + 200) - 200 + @oy`. Opacity `160 + rand(96)`.
- Lifetime [I]. 9 to 16 frames (0.15 to 0.27 s). A flake travels 27 to 48 px, about 0.8 to 1.5 tiles. VX Ace snow flickers. MV fixed that by fading 4 times slower.
- Dimming. `@viewport.tone.set(-dimness, -dimness, -dimness)` with `dimness = (@power * 6).to_i`. At most minus 54 on each channel.

Converted [I]:

| Engine | Screen | Tile | Tiles shown | Flake | Flake / tile | Peak flakes | Per 100x100 px | Per tile | Fall |
|---|---|---|---|---|---|---|---|---|---|
| VX Ace | 544x416 | 32 | 17x13 = 221 | 6x6 | 0.1875 | 90 | 3.98 | 0.41 | 180 px/s, 5.6 tiles/s |
| MV / MZ | 816x624 | 48 | 17x13 = 221 | 9x9 | 0.1875 | 90 | 1.77 | 0.41 | 176 px/s, 3.7 tiles/s |

The counts are nominal. The spawn rectangle is 100 px wider and 200 px taller than the screen, so about two thirds of the 90 are on screen at once [I].

### Inferences
- Peak flake coverage is close to 1% of screen pixels in both. VX Ace is 90 x 32 px over 226,304 px, or 1.27%. MV is 90 x 50 px over 509,184 px, or 0.89%. The VFX #1 sandbox is 594 flake pixels over 57,600, or 1.03%. Three independent tunings landed on the same coverage.
- The opacity death is a free top-down landing. Flakes spawn anywhere in the rectangle and vanish anywhere after 0.7 to 1.0 s. Nothing reaches the bottom edge on purpose. This reads as "landed on the ground" in a 3/4 view with no z value at all.
- 3 px per frame is fast. MV snow is 3.7 tiles/s. It reads as sleet next to Emerald's 2 tiles/s.

### Gaps
- VX Ace `Game_Screen` and `Spriteset_Map` were not fetched. The power range of 1 to 9 for VX Ace is assumed from MV [K].
- `rmmz_core.js` is a proprietary file read from a third-party repository mirror. It is not open source.

---

## Q2. Stardew Valley winter snow (decompiled 1.5.x)

### Takeaway
Stardew does not use flake particles for snow. It tiles one animated 16x16 art-pixel cell over the whole screen, 16 frames long, and shifts the grid against camera movement so the snow sticks to the world. Its default view of 1280x720 at 64 px per tile is 20 x 11.25 tiles, the same tile grid as Asterion's 640x360 at 32 px.

### Cited findings (`StardewValley/Game1.cs`, `WeatherDebris.cs`) [V]
- Scale. `pixelZoom = 4`, `tileSize = 64`, `defaultResolutionX = 1280`, `defaultResolutionY = 720` (`Game1.cs` lines 75-81).
- Snow draw, `drawWeather`, lines 17975-17987. Two nested loops step x and y by 64 from `-64 + snowPos % 64` to the viewport edge. Each cell draws `mouseCursors` source `Rectangle(368 + (int)(TotalMilliseconds % 1200.0) / 75 * 16, 192, 16, 16)` at scale `4.001f` with colour `Color.White * 0.8f * options.snowTransparency`.
- So the animation is a 16-frame strip, 75 ms per frame (13.3 fps), looping every 1.2 s. Every tile-sized cell shows the same frame.
- Scroll coupling, `updateWeather`, lines 7088-7091. `snowPos = updateFloatingObjectPositionForMovement(current: viewport, w: snowPos, previous: previousViewportPosition, speed: -1f)`. The helper (lines 7557-7576) adds the camera delta times `speed`. With minus 1 the grid moves opposite to the camera, so it is world-locked.
- Cost [I]. 21 to 22 columns times 13 rows is 273 to 286 quads from one texture in one SpriteBatch.
- `WeatherDebris` (the wind-blown petals and leaves class) has a winter variant, `which == 3`. Source rect `Rectangle(391 + 4 * random.Next(5), 1236, 4, 4)`, so 5 variants of 4x4 art px, drawn at scale `3f`, which is 12 screen px or 0.1875 of a 64 px tile.
- Debris count. `populateDebrisWeatherArray` (lines 7731-7741) makes `random.Next(16, 64)` pieces, so 16 to 63, with `baseIndex = 3` in winter.
- Debris motion (`WeatherDebris.update`). `position.X += dx + globalWind` and `position.Y += dy + 0.5`, with `globalWind = -0.25f`, start `dx` in [-0.2, -0.02] and `dy` in [0, 0.18]. At 60 ticks per second that is 30 to 41 screen px/s down (0.47 to 0.64 tiles/s) and 16 to 27 px/s left [I]. Wrap happens at `X < -80` and `Y > viewport.Height + 16`.
- Debris is also shifted by the camera delta with a 16 px wrap buffer (`updateDebrisWeatherForMovement`, lines 7612-7619).
- Rain uses a fixed pool of 70 (`rainDrops = new RainDrop[70]`, line 752). That is 0.31 drops per tile on the default view.

### Inferences
- A tiled animated cell is the cheapest possible overlay and it is world-locked for free. Its weakness is visible repetition, since every tile shows the same flakes. Stardew hides it with 80% alpha and a busy winter tileset.
- A 32x32 px, 16-frame cell at 640x360 would be a 512x32 strip, drawn as one `TextureRect` with a repeat shader. That is one draw call and one texture fetch per pixel.
- Flake size 0.1875 tile appears a third time here (12 px on 64).

### Gaps
- I did not open the Cursors sheet, so the number and size of flakes inside the 16x16 cell and their per-frame travel are unknown. Images are off limits for this study.
- I did not confirm that winter debris weather occurs in normal play [U]. The code path for `baseIndex = 3` exists.
- The decompilation is of 1.5.x. Version 1.6 reorganised weather code and was not checked.

---

## Q3. Tibia, OTClient, OTCv8, Canary

### Takeaway
The only snow in the OTClient family that I found is a 20-line full-screen fragment shader in the `mehah` (now `opentibiabr`) client. It adds a scrolling 512x512 texture to the map framebuffer. No particle weather exists in the repositories I searched.

### Cited findings
- `modules/game_shaders/shaders/fragment/snow.frag` [V]. Constants: `snowDirection = vec2(0.5, 1.0)`, `snowSpeed = 0.08`, `snowPressure = 0.4`, `snowZoom = 0.1`.
- The sample is `(v_TexCoord + u_WalkOffset + snowDirection * u_Time * snowSpeed) / snowZoom`. The output is `Game + Snow * snowPressure`, which is additive.
- The texture `modules/game_shaders/images/snow.png` is 512x512 RGBA (read from the PNG header only) [V]. `shaders.lua` registers it as `'Map - Snow'` with `tex1 = 'images/snow'` [V].
- `snowZoom = 0.1` repeats the texture 10 times across the map framebuffer on each axis. Scroll is 8% of the framebuffer height per second down and 4% of the width per second sideways [I]. On Tibia's 15 x 11 tile view [K] that is 0.88 tiles/s down and 0.6 tiles/s sideways, and one texture repeat covers 1.5 x 1.1 tiles [I].
- `u_WalkOffset` is added to the UV, so the overlay follows the player's walk offset. It is world-locked.
- A recursive tree listing of `OTCv8/otclientv8` and `edubart/otclient` returned no path containing snow or weather [V].

### Inferences
- Additive blending cannot show a flake over white snow ground. White plus white stays white. A snow map needs flakes with a darker outline pixel, or a shadow, or alpha blending with a slightly blue flake.
- Stretching one texture by a UV fraction means flake size in pixels changes with the framebuffer size. For pixel art, sample in integer art pixels instead.

### Gaps
- Official Tibia has no weather system that I could source [K]. Canary (server) was not searched. Weather would be client-side in any case.
- I did not look inside `snow.png`, so flakes per texture are unknown.

---

## Q4. Pokémon Gen 3 and Gen 4

### Takeaway
Gen 4's light snow moves in whole pixels only. It falls 1 px every 1 or 2 frames and steps 1 px sideways every 4 or 5 frames in an eased zig-zag. Heavy snow uses 3 size classes where bigger flakes are faster, and each flake slows down and is deleted mid-screen after 4 to 45 frames. That is a shipped "flake lands anywhere" trick.

### Cited findings

Emerald (240x160, 16 px tiles, 60 fps). VFX #1 already has the constants (16 sprites of 8x8, 0.5 to 0.62 px/frame, one flake added per 36 frames). New this session, `src/field_weather_effect.c` [V]:
- `gSprites[spriteId].coordOffsetEnabled = TRUE` in `CreateSnowflakeSprite`. `UpdateSnowflakeSprite` wraps x with `if (x < -3) sprite->x = 242 - (gSpriteCoordOffsetX + ...)` and the mirror case. Flakes are world-locked and wrap at the screen edges.
- `Snow_InitVars` sets `targetColorMapIndex = 3` and `colorMapStepDelay = 20`. Snow weather also shifts the palette.

Platinum (256x192, `src/overlay005/ov5_021D5EB8.c`). Function names are not yet decompiled. I mapped handlers to weather by their index in the 31-entry task table `Unk_ov5_02201D78` against `enum OverworldWeather` (`SNOWING = 5`, `HEAVY_SNOW = 6`, `BLIZZARD = 7`, `HAILING = 11`). That mapping is my inference [I]. The numbers below are read from the code [V].

Light snow (handler `ov5_021D79F0`, spawner `ov5_021D7C40`, mover `ov5_021D7D54`):
- 4 sprite frames picked at random (`MTRNG_Next() % 4`).
- Fall period `v4[3] = 1 + rand % 2`. The mover adds `FX32_ONE` (1 px) to y every 1 or 2 frames.
- Sway period `v4[2] = 4 + rand % 2`. The mover adds plus or minus 1 px to x every `v4[2]` frames. The period shrinks for 10 steps, grows for 10 steps, then the direction flips at 20 steps.
- Spawn at `x = -32 + rand % 414`, `y = -8 - rand % 20`. Deleted when y is between 212 and 232.
- Rate. `ov5_021D7210(..., 1, 24, 1, 14, -5, 1, 0, spawner)` sets 1 flake per burst and an interval that ramps from 24 frames to 14 frames. Stop uses `ov5_021D7238(..., 0, 24, 5, -1)`.
- Steady state [I]. A flake needs 220 to 440 frames to cross, so about 16 to 31 are alive, 24 on average. The spawn span is 414 px wide for a 256 px screen, so fewer are on screen.

Heavy snow (handler `ov5_021D7E54`, spawner `ov5_021D8098`, mover `ov5_021D81BC`):
- 3 sprite frames by size class `v7` (0 to 2). Velocity is `x = -(v7 + 1)` and `y = 2 * (v7 + 1)` px per frame, so (-1, +2), (-2, +4), (-3, +6).
- Lifetime `4 + rand % 42` frames. Every 16, 32, 16 or 10 frames (a table that rotates every 200 spawns) x speed drops by 1 and y speed drops by 1 down to a floor of 1. Then the sprite is deleted where it is.
- Spawn at `x = -20 + v7 * 20 + rand % 420`, `y = -8`.
- Rate. `ov5_021D7210(..., 1, 30, 6, 3, -5, 2, 1, spawner)`. Bursts ramp from 1 flake per 30 frames to 6 flakes per 3 frames. About 50 alive at peak [I].
- A pre-roll call `ov5_021D7568(v0, spawner, 20, 2, 3, mover)` spawns 20 flakes and steps them forward so the screen is not empty at start.

Converted, assuming the Gen 4 overworld runs at 30 fps and one tile is about 16 px on screen [U]: light snow is 15 to 30 px/s (0.9 to 1.9 tiles/s). Heavy snow is 60 / 120 / 180 px/s (3.75 to 11.25 tiles/s).

### Inferences
- Size class tied to speed is the cheapest parallax. One list, one loop, 3 sprite frames.
- The light-snow sway (1 px steps with a shrinking then growing period) gives an S-curve with no sine table and no sub-pixel position.

### Gaps
- Platinum frame rate, sprite pixel sizes (the NARC graphics were not opened) and the blizzard, hail and diamond dust handlers were not decoded. `ov5_021D8FF8` (index 7) and `ov5_021D9464` (index 11) are the places to look.
- `pret/pokeheartgold` `src/field/weather_manager.c` (2,369 lines) has no named snow functions yet.
- The repository has no licence. Read it for ideas only.

---

## Q5. Other open-source games

### Takeaway
Mindustry ships the CPU twin of the hashed shader. It reseeds one RNG with 0 every frame and derives every flake from time, so it stores no particles at all. Cataclysm DDA gives the cleanest intensity ladder: 1%, 2% and 4% of visible tiles.

### Cited findings

Mindustry (8 world units per tile [K], GPL-3.0) [V]:
- `Weathers.java` lines 20-25. Snow is `new ParticleWeather("snowing")` with `sizeMax = 13f`, `sizeMin = 2.6f`, `density = 1200f`, `attrs.set(Attribute.light, -0.15f)`.
- `ParticleWeather.java` line 15 defaults: `yspeed = -2f`, `xspeed = 0.25f`. Line 16: `sinSclMin = 30f, sinSclMax = 80f, sinMagMin = 1f, sinMagMax = 7f`.
- `Weather.java` `drawParticles`, lines 116-155. `rand.setSeed(0)`. The rectangle is the camera view grown by `sizeMax * 1.5`. `total = (int)(area / density * intensity)`. Per flake: `scl` and `scl2` in [0.5, 1], `size` in [sizeMin, sizeMax], `x = rand(0, boundMax) + Time.time * windx * scl2`, `y = rand(0, boundMax) + Time.time * windy * scl`, then `x += Mathf.sin(y, rand(sinSclMin, sinSclMax), rand(sinMagMin, sinMagMax))`, then both are wrapped with `Mathf.mod` into the rectangle. A flake is drawn only if it overlaps the camera bounds.
- Converted [I]. 8.33 flakes per 100x100 world units at intensity 1, or 0.053 per tile. Flakes are 0.33 to 1.6 tiles wide. Fall is 60 to 120 units/s, 7.5 to 15 tiles/s. Positions are world coordinates wrapped to the camera rectangle, so they are world-locked. Count scales with visible world area, never with screen pixels.

Cataclysm DDA [V]:
- `data/json/weather_type.json`. `weather_animation` factor is 0.01 for `flurries` (glyph `.`), 0.02 for `snowing` (glyph `,`), 0.04 for `snowstorm` (glyph `*`). `snowing` has `sight_penalty 1.3`, `light_modifier -20`, `tiles_animation "weather_snowflake"`.
- `src/handle_action.cpp` line 326. `dropCount = static_cast<int>(iEnd.x * iEnd.y * weather_info.factor)`. Line 334 sets `ctxt.set_timeout(125)`, so the flakes are re-rolled every 125 ms.
- So snow is 1, 2 or 4 whole-tile flakes per 100 visible tiles, redrawn at 8 fps, and the glyph gets bigger with intensity.

Shattered Pixel Dungeon (16 px tiles, GPL-3.0), `effects/particles/SnowParticle.java` [V]:
- `speed.set(0, Random.Float(5, 8))`, `lifespan = 1.2f`, alpha `am = (p < 0.5f ? p : 1 - p) * 1.5f`. A `PixelParticle` that falls 5 to 8 px/s (0.31 to 0.5 tiles/s), lives 1.2 s and fades in and out with a peak alpha of 0.75. It starts `speed.y * lifespan` above its target so it ends on the emitter point.

Luanti `snowdrift` mod by paramat (3D, voxel) `init.lua` [V]:
- `FLAKLPOS = 32` flakes per 0.5 s at most, `FLAKRAD = 16` nodes, velocity `y = -2.0` nodes/s, `size = 2.8`, 12 flake textures, `collisiondetection = true`, `collision_removal = true`, lifetime `min((spawny - YWATER) / 2, 10)` s.
- A flake spawns only where `get_node_light(pos + 10 up, 0.5) == 15`, which is a sky-exposure test. No flakes under roofs.

Veloren (3D), `voxygen/src/scene/particle.rs` lines 3669-3676 [V]. Snow is a block particle with `range: 4`, `rate: 0.025`, `lifetime: 15.0`. Not useful for 2D.

### Inferences
- Mindustry's trick fits a server-synced MMO. Every client that knows the weather seed and the clock draws the same flakes with nothing sent over the network.
- The `Mathf.mod` wrap into a camera-sized rectangle is the cheap way to make a fixed flake set world-locked.
- Luanti's light test is the particle version of VFX #1's exposure byte. Do not spawn flakes over roofed pixels.

### Gaps
- OpenTTD, Flare, Tales of Maj'Eyal and Solarus were not searched. OpenTTD's snow is terrain (covered in VFX #1 B2). Solarus has no built-in weather that I know of [K].
- SPD's emitter rates and where `SnowParticle` is used were not read.
- `snowdrift` and CDDA report no SPDX licence through the GitHub API. Their licence files were not read.

---

## Q6. Particles against overlay texture against hashed shader, in Godot 4 Compatibility on web

### Takeaway
At this flake count the CPU list wins on predictability. `CPUParticles2D` and a hand-filled `MultiMesh` are both one draw call and upload 64 bytes per flake per frame. `GPUParticles2D` adds a first-use shader compile hitch on web. A tiled overlay or hashed shader costs one full-screen pass at 230,400 fragments and no CPU, but it cannot do z height, shadow dots or landing.

### Cited findings
- `scene/2d/cpu_particles_2d.cpp` [V]. Line 84: `particle_data.resize((8 + 4 + 4) * p_amount)`. Line 85: `multimesh_allocate_data(multimesh, p_amount, RSE::MULTIMESH_TRANSFORM_2D, true, true)`. Line 1295: `multimesh_set_buffer(multimesh, particle_data)`. Line 1332: `canvas_item_add_multimesh(...)`. So `CPUParticles2D` is a MultiMesh. Each particle is 16 floats (64 bytes), the buffer is re-uploaded each frame, and the node is one draw.
- `drivers/gles3/storage/particles_storage.cpp` contains 6 uses of `TransformFeedback` [V]. `GPUParticles2D` on Compatibility simulates with transform feedback.
- Godot forum, Dec 2023, Godot 4.2. A user reports "a lag spike when firing each type of GPUParticles2D" on web. Calinou (Godot contributor) advises showing every effect behind a sprite for one frame at load. The thread gives no ms figure. https://forum.godotengine.org/t/handling-particle-shader-compilation-lag-in-godot-4-web-compatibility-renderer/36170
- godotengine/godot issue #86731, "shader compilation very slow in Compatibility renderer", opened 3 Jan 2024, still open on 12 Nov 2026 [V, title and state only].
- godotengine/godot issue #120302, opened 14 Jun 2026, open. Particles are invisible on WebKit web exports when the particle node is inside a `CanvasGroup` [V, title and state only].
- Godot docs, 2D particle systems. `CPUParticles2D` has "lower performance when using large amounts of particles" and "may perform better on low-end systems". No new features are planned for it. https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html [V, through search excerpt]
- godotshaders "Multilayer Snowfall Shader" (CC0 per its page). Defaults: `num_of_layers = 40`, `size = 0.5`, `speed = 0.5`, `spread = 0.5`, `wind = 0.0`, `snow_transparency = 0.2` [V].
- godotshaders "Rain and Snow with Parallax Effect" (MIT per its page). Two layers, near and far. Defaults: `rain_amount = 200.0`, `slant = 0.2`, `base_rain_speed = 0.5`, `additional_rain_speed = 0.5`, far length 0.1, width 0.5 and transparency 0.5, near length 0.2, width 1.0 and transparency 1.0 [V].

### Inferences (all estimates, none measured)

| Method | Draw calls | CPU per frame | Upload per frame | Fragment work at 640x360 | z, shadow, landing |
|---|---|---|---|---|---|
| CPU list into `MultiMesh` or `CPUParticles2D` | 1 per texture | 600 flakes x about 8 integer ops | 600 x 64 B = 38,400 B | flake quads only, about 1% of the screen | yes |
| CPU list plotted into the palette buffer (the sandbox way) | 0 extra | same | 0 extra | 0 extra | yes |
| `GPUParticles2D` | 1 | about 0 | 0 | flake quads only | no landing logic, compile hitch on first use |
| Tiled animated cell (Stardew) | 1 | 0 | 0 | 230,400 x 1 fetch | no |
| Hashed shader, 3 layers | 1 | 0 | 0 | 230,400 x 3 x about 20 ALU = 13.8 M ALU | no |
| Hashed shader, 40 layers (Multilayer default) | 1 | 0 | 0 | 184 M ALU | no |

- 38,400 B is 4% of the 921,600 B that a full-screen RGBA8 texture upload costs. Flake upload is not the bottleneck at any count below a few thousand.
- If the game renders at 640x360 and scales up by an integer, shader cost stays at 230,400 fragments whatever the window size. That is 4 times VFX #1's cost, on a pass that was trivial.
- Recommended split [I]. Far layer as a hashed or tiled overlay inside the existing ground shader (no extra draw). Mid and near layers as a CPU list of about 300 flakes so they can have z, shadow dots and landing.

### Gaps
- I found no measured ms numbers for `CPUParticles2D` against `GPUParticles2D` on WebGL2. Searches of the Godot tracker returned no benchmark issue. This needs a test in the sandbox.
- Possible correction to VFX #1. `drivers/gles3/shaders/particles.glsl` on `master` defines `COLLIDER_TYPE_2D_SDF` and samples an SDF texture (lines 56-58, 357-363), and `particles_storage.cpp` has `particles_set_canvas_sdf_collision` (line 516). VFX #1 said Compatibility has no particle SDF collision. I did not test it. Someone should check which Godot version added it and whether it works on web.

---

## Q7. Scaling rules

### Takeaway
No shipped code scales flake count with screen pixels. Count follows visible tiles (RPG Maker, Stardew, Mindustry, CDDA) or is a fixed pool for a fixed view (Emerald, Platinum). Flake size follows the tile, and three engines sit at exactly 0.1875 tile. Peak coverage sits near 1% of screen pixels.

### Cited findings (all rows computed from the code quoted above)

| Game | Screen px | Tile px | Tiles shown | Flake px | Flake / tile | Flakes at peak | Per 100x100 px | Per tile | Fall px/s | Fall tiles/s | Screen heights/s |
|---|---|---|---|---|---|---|---|---|---|---|---|
| VFX #1 sandbox | 320x180 | 8 | 900 | 1 and 2x2 | 0.125 to 0.25 | 456 | 79.2 | 0.51 | 14 / 24 / 42 | 1.75 / 3.0 / 5.25 | 0.08 to 0.23 |
| Pokémon Emerald | 240x160 | 16 | 150 | 8x8 sprite | 0.5 at most | 16 | 4.17 | 0.107 | 30 to 37 | 1.9 to 2.3 | 0.19 to 0.23 |
| Platinum, light [U fps] | 256x192 | 16 | 192 | sprite, 4 frames | unknown | about 24 | 4.9 | 0.125 | 15 to 30 | 0.9 to 1.9 | 0.08 to 0.16 |
| Platinum, heavy [U fps] | 256x192 | 16 | 192 | sprite, 3 sizes | unknown | about 50 | 10.2 | 0.26 | 60 / 120 / 180 | 3.75 to 11.25 | 0.31 to 0.94 |
| RPG Maker VX Ace | 544x416 | 32 | 221 | 6x6 | 0.1875 | 90 | 3.98 | 0.41 | 180 | 5.6 | 0.43 |
| RPG Maker MV / MZ | 816x624 | 48 | 221 | 9x9 | 0.1875 | 90 | 1.77 | 0.41 | 176 | 3.7 | 0.28 |
| Stardew debris (winter) | 1280x720 | 64 | 225 | 12 (4 art px x 3) | 0.1875 | 16 to 63 | 0.17 to 0.68 | 0.07 to 0.28 | 30 to 41 | 0.47 to 0.64 | 0.04 to 0.06 |
| Stardew snow overlay | 1280x720 | 64 | 225 | unknown | unknown | one 16x16 cell per tile | n/a | n/a | baked, 13.3 fps | unknown | unknown |
| OTClient shader | map view 15x11 tiles [K] | 32 | 165 | texture | unknown | 512x512 texture x 10 repeats | n/a | n/a | 8% of height | 0.88 | 0.08 |
| Mindustry | any | 8 units | by zoom | 2.6 to 13 units | 0.33 to 1.6 | area / 1200 | 8.33 (units) | 0.053 | 60 to 120 units | 7.5 to 15 | by zoom |
| Cataclysm DDA | any | 1 tile | by view | 1 tile | 1.0 | 1 / 2 / 4% of tiles | n/a | 0.01 to 0.04 | re-rolled at 8 fps | n/a | n/a |
| Shattered Pixel Dungeon | n/a | 16 | n/a | 1 px [K] | 0.06 | emitter | n/a | n/a | 5 to 8 | 0.31 to 0.5 | n/a |

Camera coupling in shipped code [V]:
- World-locked: RPG Maker (flake holds world x, y), Emerald (`coordOffsetEnabled`), Stardew (grid offset by minus the camera delta, debris shifted too), Mindustry (world position wrapped into the camera rectangle), OTClient (`u_WalkOffset`).
- Screen-locked: none of the games read here.

Whole-pixel motion [V]: VX Ace moves by integers (minus 1, plus 3). Platinum light snow moves 1 px per 1 or 2 frames. MV uses floats (0.585, 2.942) on an 816x624 canvas with no pixel-art constraint. Emerald keeps y in 1/128 px fixed point and shows the integer part.

Dimming with snow [V]: MV and MZ 21% grey veil at power 9. VX Ace tone minus 54 of 255. Mindustry light minus 0.15. CDDA light modifier minus 20 (snow) and minus 30 (storm).

### Inferences for 640x360 on 32 px tiles
Three ways to carry 456 flakes over, all at the same 1.03% coverage (2,376 px of 230,400):

| Rule | Flakes | Sizes | Flake / tile | Note |
|---|---|---|---|---|
| Follow pixels | 1,824 | 1 px, 2x2 | 0.03 to 0.06 | fine dust, 4 times the CPU, reads as noise next to 24x32 characters |
| Keep the count | 456 | 2x2, 4x4 | 0.06 to 0.125 | same screen composition as VFX #1, doubled |
| Follow tiles | 114 | 4x4, 8x8 | 0.125 to 0.25 | the RPG Maker look, big soft blobs |

- Shipped games with 32 to 64 px tiles all sit in the bottom row's range (0.07 to 0.41 flakes per tile, flakes of 0.19 tile). That look is sparse and chunky.
- My pick is between rows 2 and 3, about 600 flakes: far 320 at 1 px, mid 200 at 2x2, near 64 as a 3x3 plus (5 px), and 16 "hero" flakes of about 5x5 or 6x6 with a 2-tone edge like VX Ace. That is 1,776 flake pixels, 0.77% coverage, 2.7 flakes per tile. Only the near and hero layers (80 flakes, 0.36 per tile, matching RPG Maker's 0.41) need shadow dots.
- Fall speed should keep screen heights per second, so double the px/s: 28 / 48 / 84 px/s, which is 0.9 / 1.5 / 2.6 tiles/s. This sits inside the shipped range of 0.5 (Stardew) to 3.7 (MV). Keeping tiles/s instead would give 56 / 96 / 168 px/s, which is MV's sleet.
- Step in whole pixels. 28 px/s at 60 fps is 1 px every 2.1 frames, the same cadence as Platinum's light snow. Sway 1 px every 4 to 5 frames with Platinum's shrink-then-grow period.
- World-lock every layer. Store world x and y and wrap with a modulo of a rectangle slightly larger than the camera (Mindustry), or subtract the camera delta (Stardew). Screen-locked flakes slide with the player, and no shipped game here does it.
- Intensity ladder: 1 : 2 : 4 (CDDA) for flurries, snow, storm. Dim the scene 15 to 21% at full snow.
- Ramp: add flakes over about 10 s (Emerald 1 per 36 frames, Platinum interval 24 to 14 frames, MV power lerp). Pre-roll 20 flakes so the screen is not empty (Platinum).

### Gaps
- Stardew's overlay density and the OTClient texture density are unknown because the images were not opened.
- The 1% coverage rule rests on three data points plus my own sandbox. It is a tuning target, not a law.

---

## Q8. Flakes with height, shadows and landing in shipped 2D games

### Takeaway
None of the ten 2D code bases read here gives a flake a z value or a ground shadow, and none adds a landed flake to ground snow. Two of them fake landing well enough. RPG Maker fades each flake out at a random spot after 0.7 to 1.0 s. Platinum's heavy snow slows each flake and deletes it mid-screen after 4 to 45 frames.

### Cited findings
- MV, MZ and VX Ace. Flakes spawn anywhere in the screen rectangle and are reborn when opacity drops below 40 (MV) or 64 (VX Ace). No ground contact [V].
- Platinum heavy snow. `v1[0]++ > v1[1]` ends the flake after its random lifetime. Before that its speed drops by 1 px/frame every 10 to 32 frames [V].
- SPD `SnowParticle` starts `speed.y * lifespan` above the emitter point and fades out as it arrives, so it ends on a chosen ground point [V].
- Luanti `snowdrift` uses `collision_removal = true`. That is true 3D collision [V].
- Emerald, Mindustry, Stardew and OTClient wrap or scroll. Flakes never end [V].
- VFX #1's finding stands. No shipped top-down game documented z-height snowflakes with shadow dots (`studies/vfx-snow/report.md` A4).

### Inferences
- The SPD pattern is the cheapest honest landing for a top-down view. Pick the ground point first, start the flake `speed * life` above it, and fade it out on arrival. That is VFX #1's z-height flake with z never stored. `z = speed * time_left`.
- With the landing point known at spawn, the shadow dot can sit there for the whole fall and the exposure byte can be tested once at spawn, as Luanti does.
- Platinum's slowdown before deletion is worth copying for the near layer. The last few frames at 1 px per 2 frames read as settling.

### Gaps
- Not searched: Graveyard Keeper, Kynseed, CrossCode, Eastward. They are closed source. Another researcher's angle covers them.

---

## Gems

| Name | URL | Licence | Maturity | What it saves |
|---|---|---|---|---|
| RPG Maker MV corescript `Weather.js` | https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Weather.js | MIT (LICENSE file read, "Copyright (c) 2015 KADOKAWA CORPORATION./YOJI OJIMA") | 326 stars, last push Aug 2021, ships inside every RPG Maker MV game | 200 lines. A complete world-locked rain, storm and snow layer with fade-death and dimmer. Safe to port. |
| OTClient `snow.frag` | https://github.com/mehah/otclient/blob/main/modules/game_shaders/shaders/fragment/snow.frag | MIT (LICENSE file read, "OTClient is made available under the MIT License"). GitHub API shows NOASSERTION | 541 stars, pushed 9 Nov 2026, used by OpenTibiaBR servers | 20 lines. Scrolling texture overlay with walk-offset coupling, for a Tibia-like client. |
| Mindustry `Weather.drawParticles` | https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/type/Weather.java | GPL-3.0 (GitHub API, file not read) | 29,779 stars, pushed 4 Nov 2026, shipped on Steam and mobile | The stateless seed-0 flake loop. GPL, so take the idea and write it fresh. |
| Shattered Pixel Dungeon `SnowParticle` | https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/particles/SnowParticle.java | GPL-3.0 (GitHub API, file not read) | 6,789 stars, pushed 10 Nov 2026 | The "start above the target and fade in on arrival" pattern. Idea only. |
| godotshaders Rain and Snow with Parallax | https://godotshaders.com/shader/rain-and-snow-with-parallax-scrolling-effect/ | MIT (stated on the page) | already listed in VFX #1 | Two-layer canvas shader. Defaults recorded in Q6. |
| godotshaders Multilayer Snowfall | https://godotshaders.com/shader/multilayer-snowfall-shader/ | CC0 (stated on the page). VFX #1 flagged its Shadertoy ancestry | already listed in VFX #1 | Default 40 layers is too heavy for web. Cut to 3. |
| pret/pokeplatinum weather overlay | https://github.com/pret/pokeplatinum/blob/main/src/overlay005/ov5_021D5EB8.c | none (decompilation, 609 stars, pushed 7 Nov 2026) | Shipped game logic | Whole-pixel sway and the spawn ramp. Ideas only. |

---

## Sources

RPG Maker
- https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Weather.js
- https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Spriteset_Map.js
- https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_objects/Game_Screen.js
- https://github.com/rpgtkoolmv/corescript/blob/master/LICENSE
- https://github.com/KageDesu/Alpha-NET-Z/blob/master/js/rmmz_core.js (third-party mirror of rmmz_core.js v1.3.3, `Weather` at lines 4336-4426)
- https://github.com/RMEx/buildozer/blob/master/Sample_project_1/Scripts/Sprites/Spriteset_Weather.rb (VX Ace default script)
- https://github.com/Valentine90/vxa-os/blob/master/Client/Scripts/%5BRM%5D%20Spriteset_Weather.rb (second copy)

Stardew Valley (decompilation of 1.5.x)
- https://github.com/veywrn/StardewValley/blob/master/StardewValley/Game1.cs
- https://github.com/veywrn/StardewValley/blob/master/StardewValley/WeatherDebris.cs

OTClient
- https://github.com/mehah/otclient/blob/main/modules/game_shaders/shaders/fragment/snow.frag
- https://github.com/mehah/otclient/blob/main/modules/game_shaders/shaders.lua
- https://github.com/mehah/otclient/blob/main/LICENSE

Pokémon
- https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
- https://github.com/pret/pokeplatinum/blob/main/src/overlay005/ov5_021D5EB8.c
- https://github.com/pret/pokeplatinum/blob/main/include/constants/overworld_weather.h
- https://github.com/pret/pokeplatinum/blob/main/src/field_overworld_weather.c (the yearly weather calendar)
- https://github.com/pret/pokeheartgold/blob/master/src/field/weather_manager.c (not decoded)

Other games
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/content/Weathers.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/type/weather/ParticleWeather.java
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/type/Weather.java
- https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/particles/SnowParticle.java
- https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/weather_type.json
- https://github.com/CleverRaven/Cataclysm-DDA/blob/master/src/handle_action.cpp
- https://github.com/paramat/snowdrift/blob/master/init.lua
- https://gitlab.com/veloren/veloren/-/blob/master/voxygen/src/scene/particle.rs

Godot
- https://github.com/godotengine/godot/blob/master/scene/2d/cpu_particles_2d.cpp
- https://github.com/godotengine/godot/blob/master/drivers/gles3/storage/particles_storage.cpp
- https://github.com/godotengine/godot/blob/master/drivers/gles3/shaders/particles.glsl
- https://forum.godotengine.org/t/handling-particle-shader-compilation-lag-in-godot-4-web-compatibility-renderer/36170
- https://github.com/godotengine/godot/issues/86731
- https://github.com/godotengine/godot/issues/120302
- https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html
- https://godotshaders.com/shader/multilayer-snowfall-shader/
- https://godotshaders.com/shader/rain-and-snow-with-parallax-scrolling-effect/

Earlier study (not repeated here)
- `studies/vfx-snow/report.md` sections 1 and 4 (A1 to A4)
- `studies/vfx-snow/notes/01-history-classic.md`
