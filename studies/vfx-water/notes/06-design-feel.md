# 06. Design, pixel-art craft and player experience of water

Angle: what artists and players say makes pixel water read well and feel good, and how interaction with water should feel. Technical algorithms (ripple buffers, flow maps, wakes) belong to other notes. This file gives the art rules and the feel targets those algorithms must hit.

Source quality warning. Many of the named artists (Saint11, AdamCYounis, Brandon James Greer, MortMort) teach mostly through video, Patreon or social posts. My searches did not reach their water material in text form. See "Gaps". The strongest text sources were Slynyrd (Raymond Schlitter), an itch.io art thread on water depth, game wikis and the Xbox accessibility guideline.

---

## Q1. How do pixel artists draw a water surface tile?

### Takeaway
Build the surface from thin 1 px light lines that form linked wavy blobs, add a few highlights and a dark offset "drop shadow" under the bright lines, and keep the texture low in contrast. The water is a backdrop. Sprites must win.

### Cited findings
- Slynyrd builds top-down water from "wavy interconnected blob shapes" made of single-pixel lines. He breaks the lines in places so they read as flowing. https://www.slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2
- He adds a few highlights for sparkle, then "a crude drop shadow a couple pixels down" from the bright lines for depth. Same source.
- For waves seen side-on, Slynyrd chains ovals so the wave tiles. Circles give short deep waves, wide ovals give shallow wide waves. Real crests are steeper than troughs, so pair asymmetric ovals. https://www.slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion
- River flow can be shown with "simple pulsing lines", which suits rivers that twist off the tile grid. Same source.
- Waterfall anatomy per Slynyrd has three parts. The bright mouth with many reflections, the flow (vertical bands that sag and darken as they fall, breaking apart near the bottom), and the splash, which must loop in sync with the flow. Same source.
- A PixelJoint thread on water reflections found little formal guidance. One reply advises keeping it simple for the best illusion. https://pixeljoint.com/forum/printer_friendly_posts.asp?TID=4292

### Inferences
- For a 32x32 Tibia-style tile, the blob network should cross tile edges so the pattern does not reveal the grid. Draw it on a 64x64 or 96x96 canvas and cut tiles from it, or make the texture wrap.
- The "drop shadow under bright line" trick is the same as a 1 px offset outline. It costs one extra colour and gives depth for free.

### Gaps
- No Saint11 text found. His water tutorial (#10 in his numbered series) is listed in indexes but the host blog.studiominiboss.com did not resolve. https://opengameart.org/forumtopic/pixel-art-tutorials-by-sadfacerl

---

## Q2. How many colours, and how should hue shift from deep to shallow?

### Takeaway
Use a small ramp (about 4 to 8 colours for the water body, plus 1 to 2 for foam and spray). Deeper bands get darker, less saturated and drift away from pure blue. Shallow water shows the ground below, tinted. Too-saturated blue is the most common critique.

### Cited findings
- itch.io thread "How to do water depth tile transitions?" (2D Art board) gives the most concrete depth rules found. https://itch.io/post/14590926/view-in-topic
  - Deeper bands are darker and less saturated, showing less light reaching down.
  - Shift the deep hue slightly away from green and blue to lower contrast with orange and red sprites. One poster notes "reds are quickly lost" at depth.
  - Use a lighter colour for a spray line at the shore and a darker colour for wet sand. That makes the water read as higher than the land.
  - The OP, citing the game Dauphin, found their colours too saturated. The fix was lower saturation plus opacity so the ground shows through, keeping the texture "interesting but not distracting".
  - Give shallow water the texture of the ground below it. Each shallow ground type then needs its own palette plan.
  - A dedicated transition tileset for shorelines "usually reads cleaner" than one texture doing everything.
- OpenGameArt note on depth. Shallow water shows the bottom clearly, very deep water shows none. https://opengameart.org/node/98201
- An Aseprite forum user says water needs less hue shift than fire, and both desaturate as they reach the top value. https://community.aseprite.org/t/designing-a-palatte-advice-needed/11637 (cited via search summary, thread not opened)
- General hue-shift ramp example. 9 swatches per ramp with 20 degrees of hue shift per step, positive shift warms as it brightens. https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes
- Slynyrd's sparkly sea animation used 16 colours (Patreon summary). https://www.patreon.com/posts/pixelmotion-7-20004255
- A Lospec gallery river loop is 160x80 px, 26 colours, 32 frames. https://lospec.com/gallery/pixelprinciples/flowing-river
- Lospec lists water-tagged palettes, one 8-colour all-blue. https://lospec.com/palette-list/tag/water

### Inferences
- A workable budget for Asterion at 32x32: deep (2 colours), mid (2), shallow tint over ground (1 to 2 via palette remap or 50% blend), highlight line (1), foam and spray (1), wet-sand darkening (1). About 8 to 9 colours. This matches the 8-colour Lospec blue palette and leaves room for the palette-lighting approach from study #1.
- Hue path suggestion. Shallow leans teal or green (sand shows through), mid is blue, deep shifts toward indigo or a desaturated blue-violet and drops value. This follows the "away from green and blue" advice and keeps warm sprites readable.
- Highlights should desaturate toward near-white, not go to bright cyan. Cyan highlights on saturated blue are the "too vibrant" look players and artists flag.

### Gaps
- No published colour count from Tibia, Stardew or Eastward water. A palette extraction from screenshots would answer it but is out of scope here (no image copying).

---

## Q3. How much animation is enough?

### Takeaway
Two frames can be enough if the timing is right. Most tile packs use 4 frames, sparkle loops use about 6. Timing matters more than frame count. Too fast reads as noise, too slow reads as choppy. Keep motion low contrast and avoid every tile changing on the same tick.

### Cited findings
- Slynyrd. Make a second tile with a different pattern and swap. "only 2 frames can be convincing" with good timing. https://www.slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2
- Two transition styles. A hard cut (retro), or a middle frame with the top layer at 50% opacity, borrowed from old anime. Same source.
- "Too fast, it feels like noise. Too slow, it becomes choppy." No ms or fps given. Same source.
- Rotating and mirroring the texture helps find frame pairs that "best flow together". Same source.
- Slynyrd's sparkle surface is a 6-frame loop with simple linear motion. His reflection loops on a 2-second timeline. https://www.slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion
- OpenGameArt tile packs commonly use 32x32 with 4 frames. One 16x16 flow sheet uses 8 frames in 4 directions with fast and slow variants. https://opengameart.org/content/animated-water-tiles-0 , https://opengameart.org/content/simple-water-flow
- BudgetPixel 4-frame rain reflection method shifts reflection rows by 1 px left or right on alternate frames. https://budgetpixel.com/blog/how-to-animate-pixel-art-rain-and-reflections-in-4-frames
- An itch.io dev found animating the tiles helped tell water from non-water tiles. https://itch.io/post/14590926/view-in-topic
- A PixelJoint poster dropped water animation for performance, and a commenter said the static version fit the background well. https://pixeljoint.com/forum/printer_friendly_posts.asp?TID=4061

### Inferences
- Start values for a test. 2 to 4 frames at 250 to 500 ms per frame (2 to 4 fps) for sea and lake. Rivers faster, about 100 to 150 ms per frame, because players read speed as current. These are my starting guesses, not cited numbers. Tune by eye in the demo.
- Use the 50% blend middle frame only if the renderer can blend cheaply. In palette-limited art, a dithered middle frame (checkerboard of A and B) gives the same effect with no new colours.
- Per-tile phase offset (frame index = (t + hash(x,y)) mod N) breaks the "whole sea blinks at once" look. Neighbouring tiles must still share one texture for the blob lines to connect at edges, so offset by large patches (for example 4x4 tile regions), not single tiles, or the lines will tear at seams. This is an inference. I did not find a text source that names this fix.

### Gaps
- No ms or fps figures from Slynyrd or the named YouTubers. Tibia water frame count and timing not confirmed (TibiaWiki returned HTTP 402).

---

## Q4. Readability of walkable vs blocking water in top-down games

### Takeaway
Players need to know at a glance where they can walk. The reliable cue is "can I see the ground?". Shallow water shows the ground texture through a tint, deep water hides it. Back it with a clear edge band and, ideally, an audio and sprite change when the player enters.

### Cited findings
- Shallow water with the ground texture visible, fading through "chasm" tiles to deep water where the ground disappears, is praised as readable. https://itch.io/post/14590926/view-in-topic
- Pokemon. Shallow water cannot be surfed or fished and behaves like a normal ground tile. https://m.bulbapedia.bulbagarden.net/wiki/Water_tile
- Pokemon Gen III added puddles (Route 120, 121) that make a splash sound when walked through and reflect objects north of them. https://bulbapedia.bulbagarden.net/wiki/Puddle
- Tibia. Players can fish from shallow water and in some areas swim in it. A "Shallow Water (Zao)" entry is walkable with friction 200. Shallow water tiles 630 to 634 exist. Above-ground shallow water fills containers. Underground water can be fished but gives no fish and no skill. https://tibia.fandom.com/wiki/Tiles (via search summary, direct fetch blocked by HTTP 402)
- Stardew fishing zones depend on distance from land. A bobber at least 5 tiles from land is zone 5 (best). This makes "far from shore" mean "deep" in game terms. https://stardewvalleywiki.com/Fishing_Zone

### Inferences
- For Asterion, keep three visual classes. Walkable shallow (ground visible, tinted, maybe footstep rings), blocking deep (opaque, darker, slower animation), and coast edge (foam line plus wet-sand band). The server rule (walkable vs blocking) should map 1:1 to the visual class. Never let a tile look shallow and block.
- Animation speed can carry depth too. Deep water moves slower and larger, shallow water flickers smaller and faster near the edge.
- Colour-blind check. Depth relies on value and texture visibility, not hue alone, so it survives deuteranopia.

### Gaps
- No player complaint thread found that names a specific game where shallow vs deep was unclear.

---

## Q5. What players praise and complain about

### Takeaway
Text evidence is thin. Praise clusters around reflections and life on the surface (Stardew mods, Sea of Stars' real-time reflections). Complaints cluster around busy, high-contrast tiling and saturated colour.

### Cited findings
- Sea of Stars. Reviewers note dynamic lighting and real-time reflections over 2D scenes. https://www.rpgfan.com/review/sea-of-stars/ . Characters swim automatically when they walk off a beach into water (Brisk). https://techraptor.net/gaming/news/sea-of-stars-gameplay-clip-shows-swimming-in-action
- Stardew. The Dynamic Reflections mod (water and mirror reflections, stars and comets in water on clear nights) is called "one of the best" mods by a commenter. Players want reflections the base game lacks. https://www.nexusmods.com/stardewvalley/mods/12831 , https://www.curseforge.com/stardewvalley/mods/dynamic-reflections
- Stardew swimming exists only in the spa/bathhouse. A popular mod adds swimming in ponds, rivers and ocean, a sign players want water you can enter. https://pcgamer.com/you-can-now-swim-in-ponds-rivers-and-oceans-with-this-stardew-valley-mod
- Eastward. Pixpil's engine (Maoi on MOAI) uses shader textures and lighting for atmosphere, weather and time. https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures . A deferred-lighting take on light on water is credited to Eastward in a r/computergraphics thread (secondary). https://axebps-redlib.hf.space/r/computergraphics/comments/1iwo1u4/deferred_lighting_pixelart
- r/indiegames feedback on a top-down scene. Too busy, heavy tile borders, grid-like grass pattern pulling the eye. Commenters asked for seamless tiles with slight variation, and contrast only where the player should look. https://lr.us.psf.lt/r/indiegames/comments/1arc0m5/how_does_this_game_look_from_a_first_glance
- Pokemon Emerald water (ripple, reflection, wobble) is a common target for Godot devs to recreate. https://forum.godotengine.org/t/help-to-mimic-pokemon-emerald-water-ripples/5443

### Inferences
- What players remember is response. Reflections that track the player, rings under feet, a splash on entry. A plain animated tile is accepted, not praised.

### Gaps
- No direct Reddit threads found on Eastward, Sea of Stars or Tibia water through search. Reddit itself was not reachable via search results except through mirrors.

---

## Q6. Motion sickness and attention with large animated areas

### Takeaway
A screen full of moving water is "background movement". Accessibility guidance says let players stop or reduce it. For a top-down MMO, add a "Reduce water motion" option that freezes or slows tile animation and turns off screen-wide distortion.

### Cited findings
- Xbox Accessibility Guideline 117. Players should be able to pause or stop content that scrolls, blinks or moves. Background animation behind stationary text distracts players with attention or cognitive disabilities. Offer a mechanism to "entirely disable" such content, or an opaque backing behind text. Avoid repetitive side-to-side or up-and-down movement not core to gameplay. Example given is HyperDot's "Animate Background" toggle. https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117
- XAG 117 links Game Accessibility Guidelines items "turn off / hide background movement" and "turn off / hide all non-interactive elements". http://gameaccessibilityguidelines.com/provide-an-option-to-turn-off-hide-background-movement
- Apple's reduced-motion criteria state that 2D motion can trigger reactions in motion-sensitive users. https://developer-mdn.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria
- An OS-level reduced-motion flag may not reach the game, so expose it in-game. https://guide.coherent-labs.com/polishing/localization--accessibility/accessibility/motion-sickness/

### Inferences
- Highest-risk water effects for sickness are whole-screen UV wobble (underwater view), constant uniform scroll across a large area, and synced blinking of every tile. Low risk are small 2 to 4 frame loops with low contrast.
- Chat and UI over the sea in Asterion should sit on an opaque or semi-opaque panel, per XAG 117.
- Bobbing boats and floating items repeat up-and-down motion. Keep amplitude to 1 px at native res and let the option freeze it.

### Gaps
- No guideline gives a numeric threshold (area or speed) for 2D background motion.

---

## Q7. Sound design for water

### Takeaway
Use one ambient loop per body type (sea, lake shore, river, waterfall, swamp), with near and far layers crossfaded by distance to the nearest water tile. Point sounds (splash, step in shallow, bobber plop) carry most of the feel.

### Cited findings
- Commercial packs split ocean waves into close, medium and far loops, and rivers into small, medium and large. https://assetstore.unity.com/packages/slug/283118 (vendor listing)
- CRIWARE river tutorial. Three tracks, one per distance. 3D positioning with min attenuation 3.00 and max 50.00. An area sound measures shortest distance from the river shape to the listener. https://blog.criware.com/index.php/2023/05/18/river-implementation/ (vendor)
- Lake ambience libraries centre on soft lapping and waves breaking on the shore. https://www.asoundeffect.com/sound-category/environments/water/page/3 (vendor)
- Pokemon Essentials puddle splash plays a sound plus animation at the tile, with volume scaled by distance from the player. https://www.eeveeexpo.com/resources/313
- Stardew bite cue is a bobber wiggle, an exclamation over the player and "a distinct sound". https://stardewvalleywiki.com/Fishing
- Animal Crossing hook cue is the bobber going under with a "kerplunk". https://play.nintendo.com/news-tips/tips-tricks/fishing-new-horizons-tips-and-tricks/

### Inferences
- 2D version of the CRIWARE setup. Each frame, take the BFS distance-to-water field (shared with the shore foam note) at the player's tile. Map 0 to 2 tiles to the near loop, 2 to 8 to mid, 8+ to far, with linear crossfade. Cheap and stable.
- Waterfalls should be the loudest water source and can mask others, so duck lake and river layers near them.

### Gaps
- No text source on 2D panning of water ambience in a pixel game.

---

## Q8. Anti-patterns

### Takeaway
The repeated problems are visible tile grids, everything animating in lockstep, oversaturated blue, and borders that ignore corners.

### Cited findings
- Visible grid and heavy tile borders make a scene busy. https://lr.us.psf.lt/r/indiegames/comments/1arc0m5/how_does_this_game_look_from_a_first_glance
- Tiling should avoid repeating values within the field of view. https://discourse.threejs.org/t/animated-ocean-waves/43814
- Oversaturated water colours and a distracting texture were the first critique in the itch.io depth thread. https://itch.io/post/14590926/view-in-topic
- Shoreline transitions read cleaner with dedicated transition tiles. Same source.
- Non-pixel shaders in pixel games look jarring. The pond shader pixelates UVs first to keep pixel resolution. https://godotshaders.com/shader/pond-water-shader-2d-top-down/
- Waterfall splash out of sync with the flow breaks the loop. https://www.slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion

### Inferences (my list for the study, needs demo validation)
- Synced shimmer. Every tile flips on the same frame and the whole sea blinks. Fix with patch-level phase offsets.
- Seams. Highlight lines that stop dead at tile edges. Fix by drawing on a wrap canvas.
- Foam that ignores corners. Using a 16-tile Wang set where inner corners need their own foam curl. The blob 47-tile set or dual-grid handles inner corners.
- Sub-pixel distortion. Smooth sine wobble on a 320x180 target produces mixels. Snap offsets to whole pixels.
- Bright cyan highlights on saturated blue. Desaturate toward white instead.
- Foam with the same timing as the surface. Foam should run on its own slower cycle so edges breathe separately.

---

## Q9. Interaction feel

### 9a. Wading

#### Takeaway
Clip the sprite at the waterline, draw a ring or two at the cut, and add a splash sound per step. This is the cheapest way to make shallow water feel physical.

#### Cited findings
- Pokemon Gen III puddles give splash sound and reflection when walked through. https://bulbapedia.bulbagarden.net/wiki/Puddle
- A Godot screen-space water shader clears colour above a waterline and samples snapped, distorted UV below it, snapping rows for stable pixel distortion. https://godotshaders.com/shader/2d-water-for-topdown-games/ (via search summary)
- The Emerald effect is described as ripple plus reflection plus wobble. Suggested build is an inverted, stretched copy of the player sprite, with a separate shadow animation used on bridges. https://forum.godotengine.org/t/help-to-mimic-pokemon-emerald-water-ripples/5443

#### Inferences
- Implementation. Sprite shader with a uniform `waterline_y` (in sprite pixels from the feet, for example 6 px for knee-deep at 32 px tall). Discard or tint below it. Draw a 2-frame ring sprite (about 12x4 px ellipse) at the feet, offset by 1 px every other step.
- Tint the submerged part 50% toward water colour instead of hiding it fully. It reads as "in water" and keeps the silhouette.
- Ring frequency per step, not per frame. One ring per footstep at walk speed matches the footstep sound.

### 9b. Swimming states

#### Cited findings
- Sea of Stars switches to swimming automatically when the party walks into water from a beach. https://techraptor.net/gaming/news/sea-of-stars-gameplay-clip-shows-swimming-in-action
- Stardew uses a separate swimsuit sprite in the spa. A swim mod notes a fix where the "underwater walk animation was jumpy". https://stardewvalleywiki.com/Bathhouse , https://www.curseforge.com/stardewvalley/mods/swim
- Tibia allows swimming only in some shallow areas. Walking underwater (Calassa) needs a Helmet of the Deep rented from Captain Max in Liberty Bay. https://tibia.fandom.com/wiki/Calassa (via search summary), https://wiki.realera.org/Marlassa
- Pokemon Gen I and II hide the player while surfing and show only the Pokemon. Gen III shows the player riding. https://bulbapedia.bulbagarden.net/wiki/Surf_(move)

#### Inferences
- Three states are enough. Wading (clip at knee), swimming (clip at chest, head and arms only, slower move speed, ring trail), and blocked (deep water). Auto-switch on tile type, no button.

### 9c. Splashes

#### Inferences
- Splash = 3 to 5 frame burst of 1 to 2 px droplets in foam colour, then a ring decal that grows over about 0.5 s. Size scales with object size. Reuse the rain splash and ring from study #3.

### 9d. Fishing feel

#### Takeaway
The fishing loop is wait, tease, bite, react. Anticipation comes from a random wait plus small false nibbles, then a loud, clear bite cue (visual plus sound). The bite window must be short enough to need attention but forgiving enough for a casual game.

#### Cited findings
- Stardew bite time is random between 0.6 and 30 s after the bobber lands. Bait cuts min and max by 50%, Deluxe Bait by 67%. Each Spinner lowers max by 5 s, Dressed Spinner by 10 s. Each fishing level lowers max by 0.25 s. First bite after a cast gets 25% off both bounds. Floor 0.5 s. https://stardewvalleywiki.com/Fishing
- Stardew cue is bobber wiggle, exclamation mark and distinct sound. Same source.
- Stardew zone depends on distance from land, 5+ tiles = zone 5. https://stardewvalleywiki.com/Fishing_Zone
- Animal Crossing NH. Nintendo says fish usually nibble 2 or 3 times, sometimes up to 5, then pull the bobber under with a "kerplunk". Reeling early or late loses the fish. Fish shadow size and fins hint at species. Running near water scares fish. https://play.nintendo.com/news-tips/tips-tricks/fishing-new-horizons-tips-and-tricks/
- Players often count about 4 nibbles before the bite, but the count varies. https://www.belltreeforums.com/threads/help.228834/
- Cozy Grove support page. Every nibbling fish bites within the first four attempts. https://support.spryfox.com/hc/en-us/articles/4409051363735-Fishing-difficulties-Cozy-Grove
- A dev found small bobber changes (line animation, idle bob when steady, slight drift while reeling) "make a big difference". https://practiceflip.substack.com/p/exploring-fish-catching-mechanics
- Same post. Stardew's balance meter can feel stressful in a cozy game. Dredge varies timing zones by species. Sea of Stars uses a red/white tension line and a clear catch sound. Pure RNG gives little agency. Same source.
- A visible bobber helps players time the catch. https://itch.io/post/15672238 (via search summary)

#### Inferences for Asterion (server-authoritative)
- Tibia-style fishing is one click with an instant result and a splash effect. That is fine for an MMO, but there is no tease. A cheap upgrade is to keep the server roll, but show 0 to 3 client-side nibble ripples (small ring, soft "plip") over 1 to 3 s before the result. Server decides, client animates. Latency is hidden inside the tease.
- If a reaction window is added, the server must own it. Set the window to about 0.5 to 1 s plus measured RTT. This is my estimate, not a cited number.
- Bite ripple timing. Nibble ring ~0.3 s, 1 frame bobber dip of 1 px. Bite = bobber fully under for 2 to 3 frames plus a 2-ring burst and a louder sound.
- Show fish shadows only in clear shallow water, matching the "can I see the ground" depth rule.

### 9e. Boats, rafts, floating items and buoyancy

#### Cited findings
- Tibia ship travel is NPC-driven (for example Captain Max to Calassa, gated by The Explorer Society Quest). https://tibia.fandom.com/wiki/Calassa (via search summary)
- XAG 117 advises avoiding repetitive up-and-down motion not core to gameplay, or letting players turn it off. https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117

#### Inferences
- Bobbing. Offset items and boats by 0 or 1 px on a slow sine (period 1.5 to 3 s), with per-object phase from a hash of id. 1 px is enough at 320x180. 2 px reads as bouncing.
- Clip floating items at a waterline like wading sprites, so a third of the item sits under the surface with a ring.
- Drift. Items move with the per-tile flow direction (river note) at a fraction of current speed and stop at shore tiles.
- Moored boats bob, sailing boats add a V-wake (wake note) and stop bobbing at speed, since a wake already gives motion.

### Gaps (interaction)
- No cited reaction-window number for Stardew or Animal Crossing hooks.
- No cited frame counts for Pokemon or Stardew splash or ring sprites.
- Tibia fishing rules (fish chance formula, worms, fished-out tiles) could not be fetched. TibiaWiki (fandom) returned HTTP 402 and archive.org was blocked for this tool.

---

## Overall gaps
- Saint11 water tutorial. The index lists it, but studiominiboss.com did not resolve and no mirror was found.
- AdamCYounis, Brandon James Greer, MortMort. No water-specific text found. Their teaching is mostly video. A follow-up should watch and timestamp their videos.
- No direct Reddit threads on Eastward, Sea of Stars or Tibia water praise.
- No published fps for water tile animation from any commercial game.

## Sources
- https://www.slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2
- https://www.slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion
- https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes
- https://www.patreon.com/posts/pixelmotion-7-20004255
- https://itch.io/post/14590926/view-in-topic
- https://opengameart.org/node/98201
- https://opengameart.org/forumtopic/pixel-art-tutorials-by-sadfacerl
- https://opengameart.org/content/animated-water-tiles-0
- https://opengameart.org/content/simple-water-flow
- https://community.aseprite.org/t/designing-a-palatte-advice-needed/11637
- https://lospec.com/gallery/pixelprinciples/flowing-river
- https://lospec.com/palette-list/tag/water
- https://budgetpixel.com/blog/how-to-animate-pixel-art-rain-and-reflections-in-4-frames
- https://pixeljoint.com/forum/printer_friendly_posts.asp?TID=4292
- https://pixeljoint.com/forum/printer_friendly_posts.asp?TID=4061
- https://lr.us.psf.lt/r/indiegames/comments/1arc0m5/how_does_this_game_look_from_a_first_glance
- https://discourse.threejs.org/t/animated-ocean-waves/43814
- https://godotshaders.com/shader/pond-water-shader-2d-top-down/
- https://godotshaders.com/shader/2d-water-for-topdown-games/
- https://forum.godotengine.org/t/help-to-mimic-pokemon-emerald-water-ripples/5443
- https://m.bulbapedia.bulbagarden.net/wiki/Water_tile
- https://bulbapedia.bulbagarden.net/wiki/Puddle
- https://bulbapedia.bulbagarden.net/wiki/Surf_(move)
- https://www.eeveeexpo.com/resources/313
- https://tibia.fandom.com/wiki/Tiles
- https://tibia.fandom.com/wiki/Calassa
- https://wiki.realera.org/Marlassa
- https://stardewvalleywiki.com/Fishing
- https://stardewvalleywiki.com/Fishing_Zone
- https://stardewvalleywiki.com/Bathhouse
- https://www.curseforge.com/stardewvalley/mods/swim
- https://www.nexusmods.com/stardewvalley/mods/12831
- https://www.curseforge.com/stardewvalley/mods/dynamic-reflections
- https://pcgamer.com/you-can-now-swim-in-ponds-rivers-and-oceans-with-this-stardew-valley-mod
- https://play.nintendo.com/news-tips/tips-tricks/fishing-new-horizons-tips-and-tricks/
- https://www.belltreeforums.com/threads/help.228834/
- https://support.spryfox.com/hc/en-us/articles/4409051363735-Fishing-difficulties-Cozy-Grove
- https://practiceflip.substack.com/p/exploring-fish-catching-mechanics
- https://itch.io/post/15672238
- https://www.rpgfan.com/review/sea-of-stars/
- https://techraptor.net/gaming/news/sea-of-stars-gameplay-clip-shows-swimming-in-action
- https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures
- https://axebps-redlib.hf.space/r/computergraphics/comments/1iwo1u4/deferred_lighting_pixelart
- https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117
- http://gameaccessibilityguidelines.com/provide-an-option-to-turn-off-hide-background-movement
- https://developer-mdn.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria
- https://guide.coherent-labs.com/polishing/localization--accessibility/accessibility/motion-sickness/
- https://assetstore.unity.com/packages/slug/283118
- https://blog.criware.com/index.php/2023/05/18/river-implementation/
- https://www.asoundeffect.com/sound-category/environments/water/page/3
