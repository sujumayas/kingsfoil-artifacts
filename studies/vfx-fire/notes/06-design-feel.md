# 06 Design, art craft and player experience (fire and smoke)

Researcher angle: how artists draw fire and smoke in pixel art, how explosions read, how combat fire stays legible, when spreading fire is fun, smoke as gameplay, and the anti-patterns. About 31 tool calls.

Access notes:
- Pedro Medeiros (Saint11) fire, smoke, explosion and impact tutorials are GIF-only. The index page lists them as `#Fire`, `#SmokeSheet`, `#Explosion`, `#Impact` with no text (https://saint11.art/blog/pixel-art-tutorials/). Per the rules I did not download the images, so their frame counts are not cited here.
- tibia.fandom.com returned HTTP 402, tibiawiki.com.br returned 403, archive.org is blocked for my fetch tool. Tibia fire field visuals are not verified in this file.
- Slynyrd has no fire or smoke post in the Pixelblog catalogue (https://www.slynyrd.com/pixelblog-catalogue). His explosion method is in Pixelblog 31. Explosion micro tutorials in Pixelblog 63/64 are Patreon-only.
- I could not reach a written summary of "Juice It or Lose It" (search returned only unrelated pages).

---

## Q1. How do pixel artists draw and animate a flame loop?

### Takeaway
Use 4 colours and 4 to 6 frames for a small flame, played at 8 to 12 fps. Keep the base still and change the silhouette above it. New tongues form at the top and break away. Bigger fires move slower. Give every torch its own start frame.

### Cited findings
- Ramp of 4 tones, hottest in the core: near-white, yellow, orange, deep red at the edge. Avoid brown because it "reads as smoke or as dirt" (https://www.sprite-ai.art/gallery/fire).
- The white core can be only 2 or 3 pixels but carries the sprite (https://www.sprite-ai.art/gallery/fire).
- Loop length 4 to 6 frames. Keep the base nearly still so the fire stays anchored. Change silhouette, don't slide the sprite up. Tongues form at the top and detach (https://www.sprite-ai.art/gallery/fire).
- "Big fire moves slower than small fire." Large blazes such as a burning building carry much more dark smoke above (https://www.sprite-ai.art/gallery/fire).
- A general pixel animation guide gives 8 to 12 fps as common and 3 to 6 frames for effect animations, with effects following "expansion, dispersion, fade" (https://pixnote.net/en/learn/animation).
- Asset-store numbers as a sanity check: a 48x48 fire with 10 frames at 100 ms each (10 fps), Apollo palette (https://toldigames.itch.io/fire-animation); a 9-frame fire at 16, 32 and 64 px (https://opengameart.org/content/9-frame-fire-animation-16x-32x-64x); a pack using Endesga 32 with 6 to 10 frames per loop (https://stealthix.itch.io/fire-animations).
- Wesnoth's fire tutorial builds flames as a vertically tiling strip that shifts up 1 or 2 px per frame under a fixed mask blurred at the top, because fire "expires from the bottom upwards" (https://wiki.wesnoth.org/Fire_Animation). The DOOM-style buffer fire also rises about 2 px per frame (https://invisiblewater.github.io/MattGraphicsTutorials/effects/fire.html).
- Hue shifting in ramps: shadows toward blue/purple, highlights toward yellow (https://ziva.sh/tools/pixel-art-palette-generator). Build 3 to 4 values per hue and shift the hue, not only brightness (https://pixelpaletteswap.pages.dev/guides/color-theory-for-pixel-art.html).
- A PixelJoint artist says their flame mixes Rappanem's, Saint11's and ke2uke's fire tutorials (https://pixeljoint.com/pixelart/161988.htm).
- Desync: many engines offer a random start frame. Phaser has `randomFrame` (https://editor.phaser.io/examples-show/1577). A Godot thread suggests a random start delay of 0.05 to 0.2 s, or a per-instance shader uniform for the frame offset (https://forum.godotengine.org/t/frame-syncing-problem/126383). A Unity user reports torches that "all reset" and play in unison at runtime (https://forums.unrealengine.com/t/animation-offset/103243). Construct users warn that one shared random value gives every instance the same frame (https://construct.net/en/forum/construct-3/how-do-i-8/whats-good-sync-randomization-181736).

### Inferences
- For fire, the ramp runs opposite to a normal material ramp. Hottest colour is the lightest and yellowest. Cool edges move toward red, then dark purple or maroon, never brown. This flip is my reading of the hue-shift sources, not a quote.
- In Godot, `AnimatedSprite2D.frame = randi() % frame_count` at spawn, plus a per-instance `speed_scale` between 0.9 and 1.1, breaks sync at no runtime cost. For a tile-grid MMO, seed the offset from the tile coordinate (hash(x, y)) so every client sees the same torch phase without network traffic.
- Matching the 10 Hz flicker found in study #5 (Quake light styles, candle physics 10 to 12 Hz) to a 10 fps flame loop keeps light and sprite in step.
- Top-down 3/4 view: the flame is drawn in side view as in most top-down RPGs, because flames rise toward the camera's "up". The base sits on an ellipse (the burning object or ground scorch) drawn in the floor plane. This matches the convention of study #4 shade ellipses.

### Gaps
- Saint11's own frame counts for fire and smoke (GIF content, not read).
- Brandon James Greer, MortMort and AdamCYounis fire videos were not reached as text. Only SEO title pages surfaced.

---

## Q2. How should smoke look and move?

### Cited findings
- Slynyrd's explosion method ends with blobs that "slowly rise and fade into smoke", going from white-hot to warm hues to grey (https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design).
- A Reddit breakdown of a pixel explosion layers large and small explosion animations, large smoke, and smoke emitters. Smoke starts as fire, turns black, then dissolves (https://redlib.hbubli.cc/r/PixelArtTutorials/comments/1hkuqv1/breakdown_of_this_pixel_art_explosion_effect).
- A PixelJoint critique says smoke should get darker or desaturated before it dies, and warns that the same bright pixels on every frame look flat (https://pixeljoint.com/pixelart/10886.htm).
- Saint11 has a "SmokeSheet" tutorial tagged "smoke, vapor, effect" (https://saint11.art/blog/pixel-art-tutorials/#SmokeSheet). Content unread.

### Inferences
- Smoke puff life cycle for a 320x180 game: spawn small and warm-grey near the flame, grow and rise, drift with wind, then break into dithered pixels instead of alpha-fading. The dither dissolve keeps pixel crispness (see Q8).
- Use darker, more numerous smoke for big fires and a thin wisp for a candle. This follows the "bigger fire, more dark smoke" rule above.

---

## Q3. What is the anatomy of a pixel explosion and its feel layer?

### Takeaway
Bright first, then warm, then grey. Expansion is fast at the start and slows down. Add a ring for the shockwave. Pair the visual with 2 to 4 frames of hitstop for small hits and up to about 10 for big ones, plus 1 to 2 px shake for light events and 4 to 8 px for heavy ones.

### Cited findings
- Slynyrd Pixelblog 31: start with circles that become "thinner rings as they expand", add the main colours, then turn the circle guide into fiery blobs. Colour goes white-hot, warm, grey smoke. Expansion is "rapid at first" then "slows significantly". Rings can become a shockwave. Designed for top-down; symmetric expansion suits aerial units best (https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design).
- Slynyrd Pixelblog 36: a 3-frame circular "vaporize" effect for destroyed enemies and a 2-frame explosion that hurts the player if close (https://www.slynyrd.com/blog/2022/1/25/pixelblog-36-8-bit-adventure). Pixelblog 38 uses a single 32x32 explosion frame (https://www.slynyrd.com/blog/2022/5/24/pixelblog-38-metroid-study).
- An OpenGameArt 96x96 explosion runs 12 frames (https://opengameart.org/content/pixel-explosion-12-frames).
- Vlambeer "Art of Screenshake" (Jan Willem Nijman, about 40 minutes): 30 small tweaks to a dull shooter. Later steps include sleep on hit, camera kick opposite the shot, bigger explosions, smoke permanence and slow motion (talk https://www.youtube.com/watch?v=AJdEqssNZ-U, sequence from a course handout https://medienwissenschaft.uni-bayreuth.de/wp-content/uploads/GxD-10-Game-Feel.pdf).
- Street Fighter 2 freezes both characters for about 10 frames on hit (https://critpoints.net/2017/05/17/hitstophitfreezehitlaghitpausehitshit/). Smash scales hitlag with damage (https://www.ssbwiki.com/Hitlag). Freeze both attacker and target, or the target looks like it hiccupped (https://uhiyama-lab.com/en/notes/unity/unity-game-feel-hit-feedback/).
- Shake amounts from a game-feel article: light 1 to 2 px over 100 ms, heavy 4 to 8 px over 250 ms, Nuclear Throne 8 px on player death (https://gamejuice.pages.dev/articles/screen-shake-guide). Treat as unverified secondary data.
- At high frame rates a fixed frame count of hitstop shrinks, so count in 1/60 s units (https://dev.to/saltmire/godot-4-screen-shake-and-hit-stop-in-one-script-11eh).

### Inferences
- A practical 10 fps pixel explosion: frame 1 pure white or palette-inverted flash (1 frame, about 100 ms, or 2 frames at 60 Hz game time), frames 2 to 4 fast expansion yellow-orange, frames 5 to 7 slower growth with dark edges eating in, frames 8 to 12 grey smoke puffs rising and dithering out. Optional ring sprite on frames 2 to 5. Debris as 2 to 6 single-pixel particles with gravity. The white flash frame is a common convention I could not cite to a written source.
- In a 320x180 game, 1 px of shake is already 0.55% of screen width. Keep light shake at 1 px, heavy at 2 to 4 px, and snap shake to whole pixels to avoid shimmer.
- For an MMO, do not shake the camera for other players' explosions. Shake only for hits on yourself or blasts you cast.

### Gaps
- Saint11 Explosion and Impact GIF frame counts.
- No primary measurement of Vlambeer shake amplitudes.

---

## Q4. How do players read combat fire (fields, burning status, DoT)?

### Takeaway
Ground hazards need a look that says "area" and a clear edge. Players struggle most when their own fire looks like enemy fire, or when fog and foliage cover the field. Burning status should show flame particles on the body and a short, fixed tick.

### Cited findings
- Path of Exile players cannot tell their own harmless burning ground from enemy ground effects, and ask for coloured outlines of the true hit area with ally and enemy colours (https://www.pathofexile.com/forum/view-thread/3598854).
- PoE2 foliage and fog hide ground effects; one poster dropped firewall builds over unseen hazards (https://pathofexile.com/forum/view-thread/3626389). Party particle overload hides enemy telegraphs, players ask for an ally transparency slider (https://www.pathofexile.com/forum/view-thread/3660138). Cold ground degen looks like the player's own chill (https://webcdn.pathofexile.com/forum/view-thread/3884952).
- General advice: persistent fire or poison clouds need a language that reads as "area hazard", not "active effect" (https://mygamedesign-frontend.pages.dev/how-can-particle-effects-amplify-game-feel-without-cluttering).
- Hades enemy attacks stay legible through pose, timing and silhouette more than detail (https://gamineai.com/blog/enemy-telegraph-shape-language-top-down-boss-fights-fast-visual-consistency-audit-2026). A Hades II player says attack radius is hard to read compared with the first game (https://steamcommunity.com/app/1145350/discussions/0/591769824782233841). Effects artist Josh Barnett made the Hades VFX (https://80.lv/articles/a-behind-the-scenes-look-at-the-effects-in-hades).
- Terraria "On Fire!": 4 HP per second, shown as 1 damage every 0.25 s, blocks regeneration. Afflicted entities emit fire particles and a little light. Any non-lava liquid removes it. Lava gives 7 s (normal), 14 s (Expert), 17.5 s (Master) (https://terraria.wiki.gg/wiki/On_Fire!).

### Inferences
- For Asterion: draw fire fields with a dark scorched ring at the tile edge plus flames inside, so the hazard's extent is the tile. Tibia's one-tile-per-field grid already gives perfect readability, so keep each field inside its tile.
- Colour coding: orange-yellow fire, green poison (study #2 acid), cyan-violet energy. Never share hue between friendly and hostile hazards. If you must, add a second cue (outline, flicker pattern).
- Burning creature: 2 to 3 small flame sprites at random offsets on the body, plus a red or orange tint flash on each damage tick, plus a damage number. One tick per second or two is readable in a server-tick game.

### Gaps
- Tibia Burning condition visuals and fire field decay stages (wiki blocked, see access notes). Another researcher may have these numbers.
- Diablo ground fire design notes were not reached.

---

## Q5. When is spreading fire fun and when is it frustrating?

### Takeaway
Cap the spread. Far Cry 2's programmer says unlimited spread was "just not fun". Let fuel and moisture change speed, give players water and terrain to control it, and make it work against them sometimes. In multiplayer, fire becomes a griefing tool unless you limit who can light what.

### Cited findings
- Far Cry 2 (Jean-Francois Levesque, about 18 months on the fire system): the first plan limited fire to grass patches no bigger than 10 by 10 m; management then wanted the whole savanna to burn. Spread is capped. Wind sets direction, fire runs faster uphill, jungle humidity resists, recent rain delays ignition. Fire acts as an area fear effect on AI. An uncapped test burned miles of terrain in about 2 minutes and slowed the PC to a crawl (https://www.gamedeveloper.com/game-platforms/interview-how-i-far-cry-2-i-s-fire-fuels-spreads).
- Players losing control to wind is treated as a feature by the developer (same source). PC Gamer lists watching Far Cry 2 fire spread as a "great moment" (https://www.pcgamer.com/great-moments-in-pc-gaming-watching-fire-spread-in-far-cry-2).
- I found praise but no fire-specific complaints for Far Cry 2. The loudest complaints were malaria and respawning checkpoints (https://shacknews.com/article/72606/far-cry-3-team-talks-lessons-learned-from-far-cry, https://kotaku.com/the-far-cry-series-needs-to-let-things-break-again-1825110327).
- BotW: fire is an "element" in a rule-based state calculator ("chemistry engine") from the GDC 2017 talk (https://gamesbeat.com/the-legend-of-zelda-breath-of-the-wild-makes-chemistry-just-as-important-as-physics/). Burning grass makes an updraft the paraglider can ride (https://zeldawiki.wiki/wiki/Updraft). One player crossed about 7,600 m in a glide using over 300 fire arrows (https://www.shacknews.com/article/99542/the-legend-of-zelda-breath-of-the-wild-player-glides-more-than-7600m).
- Divinity Original Sin 2 reviewers praised blood, poison, ice and fire surfaces as "an ally and an enemy" (https://techradar.com/gaming/pc-gaming/im-playing-divinity-original-sin-ii-at-last-i-cant-get-enough-of-its-terrain-based-tactical-battles). Constant burning was "a very familiar situation" to one reviewer (https://www.trustedreviews.com/reviews/divinity-original-sin-2-definitive-edition). Players argue fire is overused in Baldur's Gate 3 (https://forums.beamdog.com/discussion/comment/1147690).
- Minecraft Java 1.21.11 (25w44a) replaced `doFireTick` with `fire_spread_radius_around_player`; 0 stops spread. Since 1.21.5, fire stops when no player is within 8 chunks. Fire updates every 30 to 40 ticks (1.5 to 2 s). Rain puts out fire with 20 to 65% chance per tick (https://minecraft.wiki/w/Fire). Servers commonly disable spread or use WorldGuard to stop it (https://xgamingserver.com/blog/how-to-disable-fire-spread-in-your-minecraft-server/).
- Don't Starve Together: a base burned on a server with wildfires disabled, from Willow fireballs or red hounds (https://forums.kleientertainment.com/forums/topic/162945-burnt-base-after-returning-from-caves-wildfire-disabled-ps4-485-day-server/). Players use fire staffs to grief; community servers broadcast every fire lit and allow vote kick (https://kleiforums.com/forums/topic/61624-wondering-which-kind-of-people-grief/). Mods add Base_Protect and lock lighting gunpowder to members (https://steamcommunity.com/sharedfiles/filedetails/changelog/2723294081?p=4).

### Inferences
- For Asterion (server-authoritative, shared world):
  - Spread only on natural tiles (grass, bushes, trees) outside towns. Town and protection-zone tiles never ignite. Player houses do not burn.
  - Cap total burning tiles per area and per source. Tie the fire to the caster for PvP rules so fire set by a player follows the same PvP/skull logic as a direct attack.
  - Burned tiles turn to ash for a few minutes, then regrow. Temporary change keeps the map readable and stops permanent griefing, while still letting players clear brush or make firebreaks.
  - Rain and water (bucket, spell) put fire out. This links to study #3.
- In single-player RPG, permanent charring of a forest is fine and more memorable.

### Gaps
- Direct Divinity OS2 complaints about surface clutter were not found. The cited criticism is about BG3.
- No hard data on how often Far Cry 2 players died to their own fire.

---

## Q6. How does smoke work as gameplay and mood?

### Cited findings
- Into the Breach: damaged sand becomes smoke. Units in smoke cannot attack or repair, and an enemy that ends its turn in smoke loses its attack (https://intothebreach.fandom.com/wiki/Weapons, https://www.gamepressure.com/into-the-breach/combat/z1aa78). Smoke also puts out burning tiles and units per a 2018 article (https://gameranx.com/?p=142114). Rusting Hulks turn smoke electric (https://intothebreach.gamepedia.com/Rusting_Hulks).
- Vlambeer lists "smoke permanence" (smoke that stays) as one of its feel steps (https://medienwissenschaft.uni-bayreuth.de/wp-content/uploads/GxD-10-Game-Feel.pdf).
- Big fires carry heavy dark smoke (https://www.sprite-ai.art/gallery/fire).

### Inferences
- A tile with smoke can block line of sight or remote targeting in a Tibia-like game, the way Tibia's magic wall blocks paths. This is a design idea, not a cited Tibia rule.
- Chimney smoke on a house is a cheap "someone lives here" cue, and a smoke column on the horizon tells players where a fight or event is. A 4 to 6 frame puff loop with random offsets is enough.
- Black smoke for burning buildings, white steam for extinguished fire. The colour tells the player the fire's state change.

### Gaps
- No cited source for smoke signalling in a specific game. Worth checking Valheim, Rust, or Ultima Online.

---

## Q7. Anti-patterns

### Cited findings
- Synced animation: torches that all start on frame 0 play in unison (https://forums.unrealengine.com/t/animation-offset/103243).
- Mixels: pixels of different sizes combined, often from improper scaling or rotation; they feel "uncanny" and unprofessional. Some artists accept them for small effects like hearts or sweat drops (https://yari-pixels.github.io/Articles/mixels.html, https://community.flowlab.io/t/mini-rant-stop-using-mixels/38287).
- Flat explosions: the same bright pixels on every frame look flat; fade brightness over time (https://pixeljoint.com/pixelart/10886.htm).
- Noisy screens: PoE ground effects hidden by fog, foliage and party particles (see Q4 sources).
- Brown in the fire ramp reads as smoke or dirt (https://www.sprite-ai.art/gallery/fire).

### Inferences
- Too much alpha: semi-transparent smoke over pixel art blends to colours outside the palette. Use dithering or palette-stepped fades instead (study #1 and #2 approach).
- Overbright additive blobs: additive glows saturate to white and wash out the palette. Keep the glow inside the palette, as study #2 did with block-sum blur plus palette select.
- Rotated or scaled flame sprites (for example a fireball rotated to its flight angle) create mixels. Draw 8 directions, or use a round projectile that does not need rotation.

---

## Game examples (see it in action)

| # | Game | What to look at | URL |
|---|------|-----------------|-----|
| 1 | DOOM PSX | Buffer fire on title screen | https://fabiensanglard.net/doom_fire_psx/ |
| 2 | Far Cry 2 | Capped savanna spread, wind, uphill | https://www.gamedeveloper.com/game-platforms/interview-how-i-far-cry-2-i-s-fire-fuels-spreads |
| 3 | Far Cry 2 | Player view of spreading fire | https://www.pcgamer.com/great-moments-in-pc-gaming-watching-fire-spread-in-far-cry-2 |
| 4 | Zelda: Breath of the Wild | Grass fire updrafts | https://zeldawiki.wiki/wiki/Updraft |
| 5 | Minecraft | Fire age, rain extinguish, spread gamerule | https://minecraft.wiki/w/Fire |
| 6 | Terraria | On Fire! debuff, particles, liquid cure | https://terraria.wiki.gg/wiki/On_Fire! |
| 7 | Don't Starve Together | Fire griefing on shared servers | https://kleiforums.com/forums/topic/61624-wondering-which-kind-of-people-grief/ |
| 8 | Into the Breach | Smoke tiles cancel attacks | https://www.gamepressure.com/into-the-breach/combat/z1aa78 |
| 9 | Divinity: Original Sin 2 | Fire and other surfaces in combat | https://techradar.com/gaming/pc-gaming/im-playing-divinity-original-sin-ii-at-last-i-cant-get-enough-of-its-terrain-based-tactical-battles |
| 10 | Baldur's Gate 3 | Debate on fire overuse | https://forums.beamdog.com/discussion/comment/1147690 |
| 11 | Path of Exile 1/2 | Ground effect readability complaints | https://www.pathofexile.com/forum/view-thread/3598854 |
| 12 | Hades | Stylized god effects (Josh Barnett) | https://80.lv/articles/a-behind-the-scenes-look-at-the-effects-in-hades |
| 13 | Vlambeer shooter demo / Nuclear Throne | Screenshake, smoke permanence | https://www.youtube.com/watch?v=AJdEqssNZ-U |
| 14 | Street Fighter 2 | About 10 frames hitstop | https://critpoints.net/2017/05/17/hitstophitfreezehitlaghitpausehitshit/ |
| 15 | Super Smash Bros. | Hitlag scales with damage | https://www.ssbwiki.com/Hitlag |
| 16 | Battle for Wesnoth | Tiling flame strip technique | https://wiki.wesnoth.org/Fire_Animation |
| 17 | Tibia | Fire field item (page blocked for me) | https://tibia.fandom.com/wiki/Fire_Field |
| 18 | Celeste / TowerFall artist (Saint11) | Fire, smoke, explosion GIF tutorials | https://saint11.art/blog/pixel-art-tutorials/#Fire |
| 19 | Slynyrd shmup | Top-down explosion construction | https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design |
| 20 | Dark Souls 2 | Cited as lacking hitstop, hits feel weak | https://critpoints.net/2017/05/17/hitstophitfreezehitlaghitpausehitshit/ |

---

## Sources
- https://saint11.art/blog/pixel-art-tutorials/
- https://www.slynyrd.com/pixelblog-catalogue
- https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design
- https://www.slynyrd.com/blog/2022/1/25/pixelblog-36-8-bit-adventure
- https://www.slynyrd.com/blog/2022/5/24/pixelblog-38-metroid-study
- https://www.sprite-ai.art/gallery/fire
- https://pixnote.net/en/learn/animation
- https://toldigames.itch.io/fire-animation
- https://opengameart.org/content/9-frame-fire-animation-16x-32x-64x
- https://stealthix.itch.io/fire-animations
- https://opengameart.org/content/pixel-explosion-12-frames
- https://wiki.wesnoth.org/Fire_Animation
- https://invisiblewater.github.io/MattGraphicsTutorials/effects/fire.html
- https://ziva.sh/tools/pixel-art-palette-generator
- https://pixelpaletteswap.pages.dev/guides/color-theory-for-pixel-art.html
- https://pixeljoint.com/pixelart/161988.htm
- https://pixeljoint.com/pixelart/10886.htm
- https://redlib.hbubli.cc/r/PixelArtTutorials/comments/1hkuqv1/breakdown_of_this_pixel_art_explosion_effect
- https://editor.phaser.io/examples-show/1577
- https://forum.godotengine.org/t/frame-syncing-problem/126383
- https://forums.unrealengine.com/t/animation-offset/103243
- https://construct.net/en/forum/construct-3/how-do-i-8/whats-good-sync-randomization-181736
- https://www.youtube.com/watch?v=AJdEqssNZ-U
- https://medienwissenschaft.uni-bayreuth.de/wp-content/uploads/GxD-10-Game-Feel.pdf
- https://critpoints.net/2017/05/17/hitstophitfreezehitlaghitpausehitshit/
- https://www.ssbwiki.com/Hitlag
- https://uhiyama-lab.com/en/notes/unity/unity-game-feel-hit-feedback/
- https://gamejuice.pages.dev/articles/screen-shake-guide
- https://dev.to/saltmire/godot-4-screen-shake-and-hit-stop-in-one-script-11eh
- https://www.pathofexile.com/forum/view-thread/3598854
- https://pathofexile.com/forum/view-thread/3626389
- https://www.pathofexile.com/forum/view-thread/3660138
- https://webcdn.pathofexile.com/forum/view-thread/3884952
- https://mygamedesign-frontend.pages.dev/how-can-particle-effects-amplify-game-feel-without-cluttering
- https://gamineai.com/blog/enemy-telegraph-shape-language-top-down-boss-fights-fast-visual-consistency-audit-2026
- https://steamcommunity.com/app/1145350/discussions/0/591769824782233841
- https://80.lv/articles/a-behind-the-scenes-look-at-the-effects-in-hades
- https://terraria.wiki.gg/wiki/On_Fire!
- https://www.gamedeveloper.com/game-platforms/interview-how-i-far-cry-2-i-s-fire-fuels-spreads
- https://www.pcgamer.com/great-moments-in-pc-gaming-watching-fire-spread-in-far-cry-2
- https://shacknews.com/article/72606/far-cry-3-team-talks-lessons-learned-from-far-cry
- https://kotaku.com/the-far-cry-series-needs-to-let-things-break-again-1825110327
- https://gamesbeat.com/the-legend-of-zelda-breath-of-the-wild-makes-chemistry-just-as-important-as-physics/
- https://zeldawiki.wiki/wiki/Updraft
- https://www.shacknews.com/article/99542/the-legend-of-zelda-breath-of-the-wild-player-glides-more-than-7600m
- https://techradar.com/gaming/pc-gaming/im-playing-divinity-original-sin-ii-at-last-i-cant-get-enough-of-its-terrain-based-tactical-battles
- https://www.trustedreviews.com/reviews/divinity-original-sin-2-definitive-edition
- https://forums.beamdog.com/discussion/comment/1147690
- https://minecraft.wiki/w/Fire
- https://xgamingserver.com/blog/how-to-disable-fire-spread-in-your-minecraft-server/
- https://forums.kleientertainment.com/forums/topic/162945-burnt-base-after-returning-from-caves-wildfire-disabled-ps4-485-day-server/
- https://kleiforums.com/forums/topic/61624-wondering-which-kind-of-people-grief/
- https://steamcommunity.com/sharedfiles/filedetails/changelog/2723294081?p=4
- https://intothebreach.fandom.com/wiki/Weapons
- https://www.gamepressure.com/into-the-breach/combat/z1aa78
- https://gameranx.com/?p=142114
- https://intothebreach.gamepedia.com/Rusting_Hulks
- https://yari-pixels.github.io/Articles/mixels.html
- https://community.flowlab.io/t/mini-rant-stop-using-mixels/38287
- https://fabiensanglard.net/doom_fire_psx/
- https://tibia.fandom.com/wiki/Fire_Field (blocked, HTTP 402)
