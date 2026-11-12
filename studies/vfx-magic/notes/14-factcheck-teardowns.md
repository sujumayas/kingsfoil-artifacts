# 14 Fact-checks and teardown holes

Researcher 14, 2026-11-11. Every row below was checked against a file or page I opened in this session unless it says SNIPPET. Raw downloads are in `scratch-14/`. The edubart/otclient links are pinned to commit dab86e6 (2024-09-14). The mehah/otclient links point at the `main` branch as read on 2026-11-11, because the commit lookup failed (the repo has moved), so their line numbers can drift.

## Part 1. Fact-checks

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| a | D2 `Overlay.txt` PreDraw. Which value draws behind the unit? | CORRECTED. `PreDraw = 1` draws the overlay before the unit, so it sits behind. `0` draws in front. The D2R guide text is wrong. | Data: https://github.com/blizzhackers/d2data/blob/master/json/overlay.json (334 rows). 36 of the 37 overlays with "back" or "rear" in the name have `PreDraw: 1`. 24 of the 26 with "front" or "fwd" have `PreDraw: 0`. Pairs: `aura_defiance_back` 1 / `aura_defiance_front` 0, `bonearmor_back` 1 / `bonearmor_front` 0. The exceptions are `sanctuaryfront` (1) and `durieldead_fwd` (1). Phrozen Keep guide agrees with the data: "1, if you want the unit graphics to take precedence" https://d2mods.info/forum/kb/viewarticle?a=465 . The Blizzard D2R guide says the opposite: "If equals 1, then display the Overlay in front of sprites" (mirrors https://d2runewizard.com/game-files/guide.html and https://locbones.github.io/D2R_DataGuide ). Trust the data. |
| b1 | Diablo I logic runs at 20 ticks per second | CONFIRMED (DevilutionX default; adjustable 20 to 50) | `tickRate("Speed", OptionEntryFlags::Invisible, "Speed", "Gameplay ticks per second.", 20)` at https://github.com/diasurgical/devilutionX/blob/master/Source/options.cpp#L843 . `gnTickDelay = 1000 / sgGameInitInfo.nTickRate;` at https://github.com/diasurgical/devilutionX/blob/master/Source/gamemenu.cpp#L277 . The speed slider runs 20 to 50 (l.177), with steps at 20, 30, 40 and 50 (l.162-168). |
| b2 | Diablo II runs at 25 frames per second | CONFIRMED | Blizzard D2R data guide, repeated across files: "(25 frames = 1 second)" https://d2runewizard.com/game-files/guide.html |
| b3 | Note 02 durations in ms | CONFIRMED as arithmetic, now on a sourced rate | Diablo I at 50 ms per tick. Big explosion 15 ticks = 750 ms. Holy bolt explosion 8 ticks = 400 ms. Fire arrow explosion 6 ticks = 300 ms. At the fastest speed (50 ticks/s, 20 ms) these become 300, 160 and 120 ms. Diablo II at 40 ms per frame. Fire Bolt Range 50 = 2,000 ms max flight. Its 12-frame explosion = 480 ms. Drop the "(estimate)" label on the rate. The frame counts are still note 02's. |
| c1 | Godot current stable is 4.7.2 | CONFIRMED | `4.7.2-stable` published 2026-08-18T16:12Z. https://github.com/godotengine/godot/releases/tag/4.7.2-stable . Earlier: 4.7-stable 2026-06-18, 4.7.1 2026-07-14. Newest pre-release is 4.8-beta3, 2026-11-09 (https://github.com/godotengine/godot-builds/releases). No 4.8 stable yet. |
| c2 | HDR 2D and 2D glow in Compatibility | CORRECTED to a precise state. Glow works (docs and source agree). HDR 2D works in the source, but the docs table still says no. | Docs table, stable (4.7), column order Compatibility / Mobile / Forward+: "Glow: Supported / Supported / Supported" and "2D HDR Viewport: Not supported / Supported / Supported". https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html . Source at the 4.7.2 tag: `TextureStorage::render_target_set_use_hdr` (l.3226) sets `rt->hdr`, and `if (rt->hdr)` (l.2554) picks the float format. https://github.com/godotengine/godot/blob/4.7.2-stable/drivers/gles3/storage/texture_storage.cpp . The `rendering/viewport/hdr_2d` text names no renderer limit and says "RGBA16 format framebuffer". https://docs.godotengine.org/en/stable/classes/class_projectsettings.html . PR 87360 "Implement glow/bloom on compatibility renderer" merged 2024-02-20, milestone 4.3. https://github.com/godotengine/godot/pull/87360 . The table row is stale. On WebGL2 the float target still needs `EXT_color_buffer_float` (note 08), so test it in the sandbox. |
| c3 | 2D instance uniforms (PR 99230) shipped in 4.4 | CONFIRMED | PR 99230 "Implement 2D instance uniforms", merged 2024-12-20, milestone 4.4. https://github.com/godotengine/godot/pull/99230 . The 4.4 release page has a "2D shader instance uniforms" section: "adds support for shader instance uniforms to CanvasItem shaders". https://godotengine.org/releases/4.4/ |
| c4 | GPUParticles2D trails and sub-emitters unsupported in Compatibility | CONFIRMED | Docs table: "Particle trails: Not supported" in Compatibility (same renderers URL). The table has no sub-emitter row. Source at 4.7.2: "does not support particle trails" (l.303, l.309), "does not support particle sub-emitters" (l.387), "does not support manually emitting particles" (l.392). https://github.com/godotengine/godot/blob/4.7.2-stable/drivers/gles3/storage/particles_storage.cpp |
| d | Terraria `Main.maxDust = 6000`, 1,000 projectile cap | CONFIRMED | tModLoader class docs for `Main`: `const int maxDust = 6000`, `static int maxDustToDraw = 6000`, `static readonly int maxProjectiles = 1000`. Also `maxGore = 600`, `maxCombatText = 100`, `maxRain = 750`. https://docs.tmodloader.net/docs/stable/class_main.html . The array has one spare slot: `public static Dust[] dust = new Dust[6001];` (context line 680) and `-public const int maxProjectiles = 1000;` (l.354) in https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/Main.cs.patch |
| e | Riot's official page states the rules quoted in note 06 (peak brightness in the first 25%, mid-value body) | UNRESOLVED | The official article URL https://nexus.leagueoflegends.com/en-us/2017/10/dev-leagues-vfx-style-guide/ now redirects to the League home page. https://www.leagueoflegends.com/en-us/news/dev/dev-leagues-vfx-style-guide/ returns 404. The Wayback Machine returned 429. The only reachable text is the VFX Apprentice summary (200) https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips . Keep the rule and credit it as "Riot, as summarised by VFX Apprentice". Two attempts made, as agreed. |
| g | WCAG 2.3.1 numbers in note 07 | CONFIRMED, with one source fix | Understanding 2.3.1: nothing that "flashes more than three times in any one second period". General flash: "relative luminance of 10% or more of the maximum relative luminance (1.0)" where the darker image "is below 0.80". Saturated red: R/(R + G + B) "greater than or equal to 0.8". A 341 x 256 block on a 1024 x 768 screen stands for the 10 degree field, and the page gives 87,296 CSS px for it. The safe area is 25% of that field (.006 steradians). https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html . The 21,824 px figure is in technique G176, not in the Understanding page: "smaller than a contiguous area of 21,824 sq pixels", at 22 to 26 inches from a 15 to 17 inch display. https://www.w3.org/WAI/WCAG22/Techniques/general/G176 . 87,296 / 4 = 21,824. Both pages read through a fetch tool that summarises, so the quotes are short on purpose. Not checked: note 07's "(R-G-B) x 320 > 20" line. |
| h1 | OTClient missile duration is `150 * sqrt(distance)` | CONFIRMED for edubart. CORRECTED for mehah, same value but built from config. | edubart, `src/client/missile.cpp` line 75: `m_duration = 150 * std::sqrt(m_delta.length());` https://github.com/edubart/otclient/blob/dab86e610991092fe8b2471f7de55a7c986b3cd2/src/client/missile.cpp#L75 . mehah, `src/client/missile.cpp` line 81: `m_duration = (g_gameConfig.getMissileTicksPerFrame() * 2) * std::sqrt(deltaLength);` https://github.com/mehah/otclient/blob/main/src/client/missile.cpp#L81 . The default is `m_missileTicksPerFrame{ 75 }` (`gameconfig.h` l.131) and `missile-ticks-per-frame: 75` (`data/setup.otml` l.35). 75 x 2 = 150. `m_delta` is in tiles at that point, since the multiply by sprite size comes on the next line. |
| h2 | `EFFECT_TICKS_PER_FRAME = 75` | CONFIRMED for edubart. CORRECTED for mehah, where the enum is gone. | edubart, `src/client/effect.h` line 34: `EFFECT_TICKS_PER_FRAME = 75` https://github.com/edubart/otclient/blob/dab86e610991092fe8b2471f7de55a7c986b3cd2/src/client/effect.h#L34 . Used at `effect.cpp` l.40 and l.68. mehah replaced it with `g_gameConfig.getEffectTicksPerFrame()` (`effect.cpp` l.56, l.117, l.138), default `m_effectTicksPerFrame{ 75 }` at https://github.com/mehah/otclient/blob/main/src/client/gameconfig.h#L130 and `effect-ticks-per-frame: 75` at https://github.com/mehah/otclient/blob/main/data/setup.otml#L34 . So a server owner can retune both clocks in one OTML file. opentibiabr/otclient not opened. |

### f. "See it in action" URLs that earlier notes had not opened

Checked with GET and a browser User-Agent on 2026-11-11. A 403 here means the site blocks scripts. It does not prove the page is gone.

| URL | Status | Action |
|---|---|---|
| https://store.steampowered.com/app/257850/Hyper_Light_Drifter/ | 200 | keep |
| https://store.steampowered.com/app/445980/Wizard_of_Legend/ | 200 | keep |
| https://store.steampowered.com/app/588650/Dead_Cells/ | 200 | keep |
| https://store.steampowered.com/app/1244090/Sea_of_Stars/ | 200 | keep |
| https://store.steampowered.com/app/977880/Eastward/ | 200 | keep |
| https://store.steampowered.com/app/1145360/Hades/ | 200 | keep |
| https://store.steampowered.com/app/1599340/Lost_Ark/ | 200, lands on the Steam age gate | keep, or use https://www.playlostark.com/ |
| https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_bteffect.html | 200 | keep |
| https://steamcommunity.com/app/1794680/discussions/0/3820781363199330417 | 200 | keep |
| https://tibia.fandom.com/wiki/Effects | 403 | page view blocked for scripts. The API answers 200: https://tibia.fandom.com/api.php?action=parse&page=Effects&prop=wikitext&format=json . Keep the wiki URL for readers. |
| https://tibia.fandom.com/wiki/Distance_Effects | 403 | same as above |
| https://www.uoguide.com/Magery | 200 | keep |
| https://ratemyserver.net/index.php?page=skill_db | 200 | keep |
| https://oldschool.runescape.wiki/w/Projectile | 200 | keep |
| https://sites.google.com/decagames.com/xml-documentation/xml-guide | 200 | keep |
| https://www.realmeye.com/wiki/weapon-attributes | 200 | keep |
| https://nexus.leagueoflegends.com/en-us/2017/10/dev-leagues-vfx-style-guide/ | DEAD, redirects to the League home page | replace with https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips (200) |
| https://nexus.leagueoflegends.com/en-us/2016/11/ask-riot-league-on-the-big-screen/ | DEAD, same redirect | no replacement found. Drop it. |
| https://www.awn.com/print/blog/devil-details-technical-artist-julian-love-diablo-iii-part-1 | 403 | script block. Not verified. |
| https://gdcvault.com/play/1017660 | 200 | keep |
| https://gdcvault.com/play/1015515 | 200 | keep |
| https://cookandbecker.com/en/article/378/designing-overwatch.html | 200 after redirect to www. | keep |
| https://www.slynyrd.com/blog/2023/7/21/pixelblog-45-bricks-walls-doors-and-more | 200 | keep |
| https://www.slynyrd.com/blog/2022/1/25/pixelblog-36-8-bit-adventure | 200 | keep |
| https://pcgamer.com/league-of-legends-getting-colourblind-mode-in-upcoming-patch | 200 after redirect to www. | keep |
| https://www.gamepressure.com/newsroom/lol-colorblind-mode-is-useles-for-players-suffering-from-actual-c/za2e03 | 200 | keep |
| https://www.slashgear.com/overwatch-gets-updated-colorblind-feature-with-nine-color-options-21546973 | 200 | keep |
| https://us.forums.blizzard.com/en/overwatch/t/colorblind-setting-inconsistencies-on-console-when-compared-to-pc-post-1-37-update/358349 | 200 | keep |
| https://www.epicgames.com/help/fortnite-battle-royale-c-34254770/a16825931 | 403 | script block. Not verified. |
| https://learn.microsoft.com/en-gb/gaming/accessibility/xbox-accessibility-guidelines/103 | 200, moved | use https://learn.microsoft.com/en-gb/xbox/accessibility/xbox-accessibility-guidelines/103 |
| https://mygamedesign-frontend.pages.dev/how-can-particle-effects-amplify-game-feel-without-cluttering | 200 | alive, but still an uncited site. Keep the Hades shape claim marked unverified. |

Status only. I did not read these pages for content, apart from the Riot, Godot, WCAG and Tibia items covered above.

## Part 2. Teardown holes

### Noita (Nolla Games, 2019 early access, 2020 release)

Takeaway. A Noita projectile is a small XML entity. It has one additive sprite, one light and three particle emitters that drop fading "material" pixels on the world grid. The trail is an emitter flag, and the engine fills the gap between the last and current position. That is the same idea as the Tibia missile plus a ring-buffer trail, written as data.

Cited findings, all READ from the game's data files (mirror https://github.com/NathanSnail/noitadata) and the shipped component docs (mirror https://github.com/phantom22/noita_docs/blob/main/additional%20helpers/component_documentation.txt).
- Spark Bolt is `data/entities/projectiles/deck/light_bullet.xml`. Component list: Velocity, Projectile, Sprite, three ParticleEmitter, Light, Audio, VariableStorage. https://github.com/NathanSnail/noitadata/blob/main/data/entities/projectiles/deck/light_bullet.xml
- `ProjectileComponent`: `speed_min="750"`, `speed_max="850"`, `lifetime="40"`, `lifetime_randomness="7"`, `damage="0.12"`, `velocity_sets_scale="1"`, `on_death_explode="1"`. The docs say lifetime is "the frame count" and that the final value is lifetime plus or minus the randomness. So 33 to 47 frames, which is 550 to 783 ms at 60 fps.
- `velocity_sets_scale`: "the sprite width is made equal to the distance traveled since last frame". A fast bolt stretches into a streak with no extra art.
- Muzzle flash is its own entity (`muzzle_flash_small_pink.xml`) plus a light flash, `shoot_light_flash_radius="64"` in RGB 255, 160, 255. The bolt carries a `LightComponent` of radius 30 in RGB 255, 40, 255.
- `SpriteComponent` has `additive="1"`. `VelocityComponent`: `gravity_y="200"`, `air_friction="1.7"`, `mass="0.04"`.
- Trail emitter 1, the tight streak: material `plasma_fading_pink`, `is_trail="1"`, `trail_gap="1.0"`, 1 to 4 particles, life 0.1 to 0.2 s, every frame, `render_on_grid="1"`, `fade_based_on_lifetime="1"`, `emit_cosmetic_particles="1"`, `create_real_particles="0"`.
- Trail emitter 2, loose sparks: 1 to 2 particles, life 0.6 to 0.8 s, every 1 to 10 frames. Emitter 3, rare embers: 1 particle, life 1.4 to 1.5 s, every 10 to 20 frames.
- Docs for the flags. `is_trail`: "will do a trail based on the previous position and current position". `trail_gap`: particles are placed "this far from each other between our old and new position". `render_on_grid`: positions "snapped to cell grid". Cosmetic particles "are culled outside camera region" and have collisions but no other physics.
- Glow. `SpriteParticleEmitterComponent.emissive`: "sprites will be rendered onto the emissive render target". `ParticleEmitterComponent.render_ultrabright`: glowing materials "will be 3x as bright as usually". So Noita keeps a separate emissive buffer and blurs it for glow. The docs prove the buffer exists. They do not give its resolution or blur cost.
- GDC 2019 talk "Exploring the Tech and Design of Noita", Petri Purho, Independent Games Summit. READ, abstract only. It covers the falling-sand simulation, large worlds and rigid bodies. The abstract says nothing about emissive pixels or glow. https://www.gdcvault.com/play/1025695/Exploring-the-Tech-and-Design

Inferences.
- Speed 750 to 850 is most likely px per second, which gives 12 to 14 px per frame. The docs leave the unit blank.
- Three emitters at three lifetimes (0.15 s, 0.7 s, 1.45 s) is a reusable trail recipe: a dense short streak, a mid layer and a few long embers. Per bolt that is about 1 to 4 + 0.3 + 0.07 particles per frame, so a steady state near 30 live particles. This is my arithmetic, not a Nolla number.

Gaps. No projectile cap or performance statement found. The noita.wiki.gg pages sit behind a Cloudflare check (403), and the fandom API has no Documentation pages.

### Hammerwatch engine (Heroes of Hammerwatch II mods)

Takeaway. An effect is one XML file where every animated property is a math expression of normalised time `t`. Sprites, lights and particle spawners sit side by side in the same file. One 142 px ring sprite, drawn 3 to 6 times with different expressions, makes a full shockwave. No flipbook is needed.

Cited findings, READ from mod repos that ship `.effect` files.
- File: https://github.com/Xinterp6196/Mod-Reworks---Heroes-of-Hammerwatch-II/blob/main/Unfinished%20Mod%20Reworks/Bulwark/players/bulwark/effects/guardian_pulse_area.effect
- Root: `<effect looping="false" layer="-1">`. Parameters are declared with defaults and used in expressions: `<param name="radius" default="100" />`.
- `<sprite>` attributes: `origin`, `looping`, `texture`, `material`, `scale-x`, `scale-y`, `pos-y`, `angle`, `color-r/g/b/a`, `num-sprites`. Children are `<frame time="500" x= y= w= h=/>`, with time in ms.
- Blend is a material name. `system/default.mats:default` is normal blend and `system/default.mats:add` is additive.
- Expressions see `t` (0 to 1 over the effect), `it` (looks like 1 - t) and `i` (the copy index when `num-sprites` is above 1). Example: `scale-x="(radius/60)*pow(t,(i*1.25)+1)"` with `num-sprites="3"` gives three rings that expand at different rates from one line.
- Alpha envelope from the same file: `color-a="saturate(t*4)*0.2*(1-pow(t,8))"`. That is a fade-in over the first 25% of life, a peak alpha of 0.2 and a late fast fade. Additive layers in that effect peak between 0.035 and 0.13 alpha. The whole pulse lasts 500 ms.
- `<light>` block: a light texture (`light_L.png`, 128 x 128), `overbright`, `length` (ms), `size` (here `radius*2.4`), `color-r/g/b/a` as expressions, `cast-shadows`.
- `<particle_spawner>` attributes: `spawn-rate`, `length`, `start` (ms delay, here 500, so it fires when the ring ends), `ttl="rpick(250,1000)"`, `color` as two RGBA values, `angle`, `rot-speed`, `curl-speed`, `curl-scale`, `force-damping`. Behaviours: `<spread_range radius>`, `<force_toward pos mul>`, `<fade_to>`. The particle itself is a scene in a `.unit` file.
- A lobbed mortar in 20 lines: sprite and light share `pos-y="-height+height*pow(t,4)-30"` and `color-a="sin(t*pi)"`, 550 ms. https://github.com/Xinterp6196/Mod-Reworks---Heroes-of-Hammerwatch-II/blob/main/Unfinished%20Mod%20Reworks/Arbalest/players/arbalest/effects/artillery_mortar_drop.effect
- A looping flicker light: `size="62+22*sin(tl*pi*26)+14*sin(tl*pi*58)"`, length 900 ms, with a `%replace` macro. https://github.com/NoahFrank/HammerwatchPlus/blob/main/modules/pets/effects/hwp/pet_secret.effect

Inferences. The expression-per-property format suits a data-driven spell table. A tiny expression evaluator, or a fixed set of named curves, replaces most flipbooks for rings, pulses and lobbed shots. Scaling a pixel sprite by a float breaks the pixel grid, so for Kingsfoil snap the scale to whole steps or use it only on soft additive rings.

Gaps. The official wiki did not load (no DNS answer for the two hostnames I tried). I read no first-party file from Hammerwatch 1. Field meanings come from usage, not from a spec.

### Stardew Valley TemporaryAnimatedSprite (TAS)

Takeaway. Every one-shot effect in Stardew is one class with about 80 public fields. It is a flipbook with built-in motion, fade, scale, rotation, light, sound and a start delay. The return wand builds its whole warp effect from 12 + 17 of them plus one white screen flash.

Cited findings.
- READ, decompiled mirror (an older 1.5-era build): https://github.com/WeDias/StardewValley/blob/main/TemporaryAnimatedSprite.cs . Timing fields: `interval = 200f` (ms per frame, default), `animationLength`, `totalNumberOfLoops`, `delayBeforeAnimationStart`, `pingPong`, `holdLastFrame`. Motion: `motion`, `acceleration`, `accelerationChange`, `xPeriodic` and `yPeriodic` with range and loop time, `xStopCoordinate`. Look: `alpha`, `alphaFade`, `alphaFadeFade`, `scale`, `scaleChange`, `scaleChangeChange`, `rotation`, `rotationChange`, `color`, `flicker`, `flash`, `pulse`, `pulseTime`, `pulseAmount = 1.1f`, `layerDepth`, `drawAboveAlwaysFront`. Light: `light`, `lightRadius`, `lightcolor`. Hooks: `startSound`, `endSound`, `endFunction`, `attachedCharacter`, `positionFollowsAttachedCharacter`, `local`.
- READ, same file: the class has `bombRadius` and `bombDamage = -1` fields. A placed bomb is itself a TAS that explodes when its animation ends.
- READ: main constructor takes texture name, source rect, interval, length, loops, position, flicker, flipped, layer depth, alpha fade, colour, scale, scale change, rotation, rotation change and `local`.
- READ, return wand: https://github.com/WeDias/StardewValley/blob/main/Tools/Wand.cs . 12 sparkle sprites (sheet index 354), each with a random interval of 25 to 75 ms, 6 frames, 1 loop, at random points from -256 to +192 px around the player. Then `Game1.flashAlpha = 1f` (full white flash), the player sprite is hidden and frozen for 2,000 ms, and the fade starts after 1,000 ms. A row of 17 puffs (sprite 6, 50 ms per frame) spans 8 tiles each side, each delayed 25 ms more than the last, drifting at -0.25 px. Sprites go out through `broadcastSprites`, so other players see them.
- READ, wiki API, 1.6 data model. Machines can list `TemporarySprites` with `Texture`, `SourceRect`, `PositionOffset`, `Color`, `AlphaFade`, `Loops`, `Rotation`, `RotationChange`, `ScaleChange`, `SortOffset` (default 0), `Frames`, `Scale` (default 1), `Interval` (default 100 ms), `Flicker`, `Flip` (default false). https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Modding:Machines&prop=wikitext&format=json

Inferences. The staggered `delayBeforeAnimationStart = n * 25` row is a wave built from one flipbook, the same trick as a Tibia wave spell. A full-alpha white flash on a personal teleport would fail a reduce-flash setting if it could repeat. Stardew gets away with it because the wand has a long use time.

Gaps. `GameLocation.explode` not read (the mirror path returned a stub). The wiki search API returned nothing for the class name.

### Wizard of Legend

- SNIPPET. Wizard of Legend 2 (Dead Mage, published by Humble Games) entered Steam early access on 2024-10-03, reached 1.0 on PC, PS5 and Xbox Series on 2025-06-12, and came to Switch on 2025-11-25. https://www.gematsu.com/2025/05/wizard-of-legend-ii-launches-june-12-for-ps5-xbox-series-and-pc and https://www.gematsu.com/2025/11/wizard-of-legend-ii-for-switch-launches-november-25
- SNIPPET. The sequel dropped the first game's 2D pixel art for 3D. So it is not a pixel-art reference. Use the first game only.
- Not found: any Contingent99 statement on arcana effect authoring, elements or readability. One search, no developer source.

### Enter the Gungeon and Nuclear Throne

- READ. Dodge Roll Q&A: flipping a table "deletes enemy bullets in a small radius". That is a bullet-clear as a reward for a defensive action. https://www.gamedeveloper.com/design/q-a-the-guns-and-dungeons-of-i-enter-the-gungeon-i-
- Not found: a developer statement of an enemy-bullet colour rule, or bullet counts, for either game. Two searches returned only player comments. One player describes Nuclear Throne as round, deep red enemy shots against rectangular, bright yellow player shots (SNIPPET, https://itch.io/post/16641366 ). Treat it as an observation, and do not credit Vlambeer with a rule.

### Crowd settings that note 07 did not find

| Game | Finding | Label | Source |
|---|---|---|---|
| Tibia | "Spell Opacity" feature teaser dated 2025-10-22. A new menu under Graphics, Effects with three sliders: own spells, other players' spells and monster spells. Each runs 0% to 100% in 1% steps. Text is by CipSoft, reposted by a fan site. tibia.com returned 403. I did not confirm the release date of the update that shipped it. | READ (repost of the official news) | https://tibiaroute.com/news/Spell-Opacity-8552-Tm7c |
| Throne and Liberty | A player setting named "Effect Display Range" exists. Update 4.13.0 forces one skill to ignore it: the visual "is now always displayed, regardless of" that setting. Same pattern as FFXIV's Limit Break fix. The option's values are not documented in the notes. | READ (patch-note mirror; the official URL I guessed returned 404) | https://patchbot.io/games/throne-and-liberty/articles/1557-update-4130 |
| Lost Ark | Not found in official docs or patch notes. A community guide advises setting battle effects to "Buff Effects only", which suggests a tier that keeps buffs, heals and shields. | SNIPPET, community | https://vulkk.com/2022/02/20/lost-ark-settings-and-ui-guide-what-should-you-change/ |
| Albion Online | No player-facing effects setting found. The Radiant Wilds changelog lists engine-side spell effect optimisations for large battles. | SNIPPET | https://patched.gg/games/albion-online/changelog-radiant-wilds-update |
| New World | Not found. One combined search, no result. | n/a | n/a |

Inference. Tibia's three-way split (own / other players / monsters) with a plain opacity slider is the closest shipped model to Asterion. It differs from the Combat juice F5 tiers in one way: Tibia lets players fade monster spells too. I would not copy that for hostile telegraphs.

## What the writer should change

1. Note 05: state PreDraw 1 = behind the unit. Cite the data file, and say the D2R guide line is wrong.
2. Note 02: remove "not fetched" and "(estimate)" from the 20 and 25 rates. Add that DevilutionX can run at up to 50 ticks per second.
3. Note 08: 4.7.2 is right (2026-08-18). Say "HDR 2D works in Compatibility from 4.3 by source. The docs table still says not supported."
4. Note 10: drop the (U) on the 6000 dust cap. Add maxProjectiles 1000 and maxGore 600.
5. Note 06: replace both nexus.leagueoflegends.com links. Credit the 25% rule to VFX Apprentice's summary.
6. Note 07: cite G176 for 21,824 px, and add the Tibia Spell Opacity sliders and Throne and Liberty's Effect Display Range.
7. Notes 01 and 03: when quoting mehah/otclient, say the 150 and 75 values are config defaults (`setup.otml`).

## Sources

Primary code and data
- https://github.com/blizzhackers/d2data/blob/master/json/overlay.json
- https://github.com/diasurgical/devilutionX/blob/master/Source/options.cpp#L843
- https://github.com/diasurgical/devilutionX/blob/master/Source/gamemenu.cpp#L277
- https://github.com/edubart/otclient/blob/dab86e610991092fe8b2471f7de55a7c986b3cd2/src/client/missile.cpp#L75
- https://github.com/edubart/otclient/blob/dab86e610991092fe8b2471f7de55a7c986b3cd2/src/client/effect.h#L34
- https://github.com/mehah/otclient/blob/main/src/client/missile.cpp#L81
- https://github.com/mehah/otclient/blob/main/src/client/gameconfig.h#L130
- https://github.com/mehah/otclient/blob/main/data/setup.otml#L34
- https://github.com/godotengine/godot/blob/4.7.2-stable/drivers/gles3/storage/texture_storage.cpp
- https://github.com/godotengine/godot/blob/4.7.2-stable/drivers/gles3/storage/particles_storage.cpp
- https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/Main.cs.patch
- https://github.com/NathanSnail/noitadata/blob/main/data/entities/projectiles/deck/light_bullet.xml
- https://github.com/phantom22/noita_docs/blob/main/additional%20helpers/component_documentation.txt
- https://github.com/Xinterp6196/Mod-Reworks---Heroes-of-Hammerwatch-II (two `.effect` files)
- https://github.com/NoahFrank/HammerwatchPlus/blob/main/modules/pets/effects/hwp/pet_secret.effect
- https://github.com/WeDias/StardewValley/blob/main/TemporaryAnimatedSprite.cs
- https://github.com/WeDias/StardewValley/blob/main/Tools/Wand.cs

Official docs, releases and guides
- https://github.com/godotengine/godot/releases/tag/4.7.2-stable
- https://github.com/godotengine/godot-builds/releases
- https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html
- https://docs.godotengine.org/en/stable/classes/class_projectsettings.html
- https://github.com/godotengine/godot/pull/87360
- https://github.com/godotengine/godot/pull/99230
- https://godotengine.org/releases/4.4/
- https://docs.tmodloader.net/docs/stable/class_main.html
- https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- https://www.w3.org/WAI/WCAG22/Techniques/general/G176
- https://d2runewizard.com/game-files/guide.html and https://locbones.github.io/D2R_DataGuide (Blizzard D2R data guide mirrors)
- https://d2mods.info/forum/kb/viewarticle?a=465 (Phrozen Keep Overlay.txt guide)
- https://www.gdcvault.com/play/1025695/Exploring-the-Tech-and-Design
- https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Modding:Machines&prop=wikitext&format=json

Secondary
- https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
- https://tibiaroute.com/news/Spell-Opacity-8552-Tm7c
- https://patchbot.io/games/throne-and-liberty/articles/1557-update-4130
- https://www.gamedeveloper.com/design/q-a-the-guns-and-dungeons-of-i-enter-the-gungeon-i-
- https://www.gematsu.com/2025/05/wizard-of-legend-ii-launches-june-12-for-ps5-xbox-series-and-pc
- https://www.gematsu.com/2025/11/wizard-of-legend-ii-for-switch-launches-november-25
- https://vulkk.com/2022/02/20/lost-ark-settings-and-ui-guide-what-should-you-change/
- https://patched.gg/games/albion-online/changelog-radiant-wilds-update
