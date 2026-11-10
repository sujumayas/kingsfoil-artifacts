# 06 · Art, feel and player experience of fog, mist, clouds and fog of war

Researcher angle: pixel-art craft, design and player experience. Main lens is artistic quality.
Date: 2026-11-10. About 30 tool calls.

Short version for the study lead:
- Fog in pixel art is mostly a colour problem. Push far or low things toward the sky/ambient colour, drop saturation, cut contrast, use fewer colours. Slynyrd's 15-colour landscapes do this with solid bands, no dithering.
- The best cheap reference for drift speed is Pokémon Emerald. Fog moves 1 px every 4 frames (about 15 px/s on a 240 px screen). Diagonal fog moves about 20 px/s on x and 12 px/s on y. Players who see faster fog say it reads as smoke, oil or water.
- Players hate fog that takes away information *and* adds a penalty at once (Don't Starve Hamlet, Pokémon DPPt Route 210, WoW spore fog). Players like fog that rewards exploring (Civ-style fog of war, roguelike map memory).
- Give fog an off switch or a strength slider. The accessibility guides say to let players remove background visuals. A full-screen high-contrast dither may also count as a "spatial pattern" under Xbox XAG 118.

---

## Q1. How do pixel artists draw fog, haze and clouds? (colour, value, layers)

### Takeaway
Treat fog as atmospheric perspective. Each plane further away (or lower, in 3/4 view) moves toward the sky/haze hue, gets lighter in daylight, less saturated, lower in contrast and uses fewer colours. Slynyrd reaches this with banded flat colours and reuses sky colours for distant shapes. That is palette-friendly by design. Fog that is drawn this way stays on-palette, which alpha fog does not.

### Cited findings
- Slynyrd Pixelblog 62 (May 2026). Each landscape used 15 of a 16-colour limit. The closest plane is "most saturated with strongest contrast between light and shadow". Hue "shifts more to the color of the sky with each receding plane". Lightness rises with distance in daylight and haze. Distant mountains reuse sky colours. The farthest clouds are blended into the sky gradient. A valley scene uses "a band of haze along the bottom" to blend mountains into grass. No dithering is mentioned. The gradients are solid bands plus texture. https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds
- Slynyrd Pixelblog 62, forest scene. The greens shift toward warm yellow instead of blue, because the view looks toward the sun. So haze colour follows the light source, not a fixed "fog grey". Same URL.
- Slynyrd Pixelblog 11 (2018). "The further the object, the more it takes on the color of atmospheric haze." Distant objects use fewer colours and less saturation. Warm dawn reads as contemplative, blue sky as energetic. https://slynyrd.com/blog/2018/11/16/pixelblog-11-landscape-pixeling
- PixelJoint piece "A City Night Shrouded in Fog". It uses 6 colours, heavy dithering, and both height fog and distance fog. https://pixeljoint.com/pixelart/88670.htm
- Pixnote dithering guide. Dithered fades suit fog and vignettes. Dither between two colours of similar brightness. Pairing very different brightness causes flicker. https://pixnote.net/en/learn/dithering
- Sprite-AI blog on backgrounds. Distant ranges fade toward the sky colour, and dithering is suggested for sky gradients and fog transitions. (A vendor blog, so weaker.) https://www.sprite-ai.art/blog/pixel-art-backgrounds
- Godot docs on volumetric fog. Mist and fog have an albedo close to white and scatter light slightly forward. Smoke has a darker albedo and scatters light evenly. So dark, evenly lit fog reads as smoke. https://docs.godotengine.org/en/stable/tutorials/3d/volumetric_fog.html

### Inferences
- In top-down 3/4 view, "distance" is mostly height. Low tiles (valleys, water, pits) take more fog colour. Tall props (tree crowns, roofs) take less. Graveyard Keeper does exactly this (Q4).
- Fog colour should come from the time-of-day ambient. Cool blue-grey at night and before dawn, warm cream or pink at sunrise, grey-green over swamps. That matches Slynyrd's rule that haze follows the light. It links to the palette day/night ramps in study #5 (Light).
- A fog palette ramp is the honest way to do this in a limited palette. Map each base colour to 2 to 4 "fogged" entries that move toward the fog colour, much like the lighting ramps in #1 (Snow) and #5.

### Gaps
- I found no Slynyrd, Saint11, MortMort, AdamCYounis, Brandon James Greer or Lospec tutorial dedicated to *ground fog* or *mist* in top-down view. Slynyrd only covers haze in side-view landscapes. Saint11's article index at saint11.org/pixel_articles returned 404. Cloud tutorials exist (GDQuest https://gdquest.com/tutorial/art/pixel-art/chapter/4_how_to_draw_clouds_in_pixel_art/ , pixeljad https://pixeljad.itch.io/drawclouds/devlog/548281/how-to-draw-clouds-pixel-art-tutorial), but I did not read them in depth.

---

## Q2. Dithering vs alpha for semi-transparent fog. Banding.

### Takeaway
Checkerboard is the standard 50% blend. Ordered (Bayer) gives more levels. Both read as texture and noise when overused, and both soften edges. For fog over pixel art, a few hand-picked fogged palette entries plus a small dithered band at each transition beats both a smooth alpha wash and a full-screen dither. Lock the dither to world or screen pixels so it does not crawl.

### Cited findings
- Pixel Parmesan, "Dithering for Pixel Artists". Checkerboard is "most common for simple pixel blending". Too much dithering "often creates visual noise or the unwanted illusion of texture". Dithering "softens edge definition". Higher contrast between the two colours needs more dither steps. A few patterns plus intermediate colours look smoother than many patterns between only two colours. It warns against dithering animated sprites. Clouds can take a lot of dither, but too much erases their shapes. https://pixelparmesan.com/dithering-for-pixel-artists
- Megacat-style advice quoted in a search summary. Dither only where the palette lacks the mid-tone. (Weak source, a search summary.) https://divoom.com/blogs/setup-ideas/pixel-art-dithering-when-to-use-and-stop
- Retro context. Pre-PS1 "pseudo alpha" was colour averaging. A forum reply, so anecdotal. https://reddit.birdcat.cafe/r/retrogaming/comments/1l3uo9m/was_there_fauxtranslucency_through_dithering_in/mwbwx3s/?context=3
- Godot shader "2D Retro Dithered Lighting & Fog-of-War". 8x8 Bayer built recursively. Defaults are `dither_levels` 6, `dither_pixel_size` 2, `softness` 0.30, `light_curve` 1.6, `ambient` 0.05, and `darkness_color` (0.02, 0.02, 0.06), a near-black blue. Quantize step is `floor(lit*levels + bayer)/levels`. No fixed palette, so it blends `darkness_color` with screen colour, which goes off-palette. https://godotshaders.com/shader/2d-retro-dithered-lighting-fog-of-war/
- A dev on itch.io asks if fog dithering is aligned with ground dithering. There was no answer, but it shows the problem is real. https://itch.io/post/9334920
- An indie dev locks output to a 2-colour palette in a shader "to catch stray alpha pixels". https://itch.io/post/13865283

### Inferences
- Alpha fog over a 16 to 32 colour palette blends every pixel into a colour not in the palette. Small doses read as "soft". Large doses read as a grey wash and break the pixel-art look. The fix is to blend, then snap to the nearest palette ramp entry (a palette LUT, as in #1 and #2). Or skip the blend and swap to fogged palette entries.
- Six levels (the Godot default) is about the useful ceiling at 320x180. More levels make Bayer cells too fine and they shimmer. This is an estimate, not measured.
- Banding is fine and even wanted in pixel art. Slynyrd's flat bands are banding on purpose. What looks bad is accidental banding from 8-bit alpha steps in a smooth gradient that does not match the palette.
- Moving fog with a moving dither is the worst case. If the dither threshold moves with the fog texture, every pixel flips each frame. Keep the Bayer matrix fixed to screen or world pixels and move only the density field under it. The pattern then stays still while fog "flows" through it.

### Gaps
- No artist write-up compares dithered and alpha fog side by side in a top-down game. No measured player preference data.

---

## Q3. How fast should fog drift? Motion feel.

### Takeaway
Slow. Pokémon Emerald's fog scrolls about 15 px/s on a 240 px wide screen, so a feature crosses the screen in about 16 s. Its diagonal fog moves about 20 px/s horizontally and 12 px/s vertically. Fog at Emerald pace feels calm. Faster fog drifting in one direction reads as smoke, oil or a current. For dread, use still fog that creeps inward, not fast fog.

### Cited findings
- pokeemerald `src/field_weather_effect.c`, `FogHorizontal_Main`. `fogHScrollOffset++` runs when `++fogHScrollCounter > 3`, so +1 px every 4 frames. At about 59.7 fps that is about 15 px/s. Sprites are placed every 64 px and wrap with `& 0xFF`, a 256 px loop. The scroll position subtracts `gSpriteCoordOffsetX`, so fog is world-anchored and parallaxes with the camera. https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
- Same file, `UpdateFogDiagonalMovement`. X goes +1 every 3 frames (about 20 px/s), Y goes +1 every 5 frames (about 12 px/s). Same URL.
- Same file. Fog uses GBA hardware alpha blending. It starts at `Weather_SetBlendCoeffs(0, 16)` and fades to `(12, 8)`, which is fog at 12/16 plus background at 8/16, additive. That brightens and flattens the scene toward the fog colour. The same `(12, 8)` target is used for horizontal and diagonal fog. The fade-in delay argument is 3 frames per step for horizontal and 8 for diagonal. The fade-out is 1 to 3. Same URL. Pokémon used 20 fog sprites per type (`NUM_FOG_HORIZONTAL_SPRITES 20`, `NUM_FOG_DIAGONAL_SPRITES 20`, pokeemerald `include/constants/field_weather.h`) https://github.com/pret/pokeemerald/blob/master/include/constants/field_weather.h
- Maps with fog weather in Emerald include Mt. Pyre Summit and Rusturf Tunnel (GitHub code search of `data/maps`). https://github.com/pret/pokeemerald/tree/master/data/maps/MtPyre_Summit
- r/IndieDev "Does this look like a 'nightmare fog'?" (Feb 2026). Commenters said "Maybe a bit to fast". A left-down drift made it "feel more like water/the sea". Other readings were "very polite smoke" and "more like oil". The advice was still, oppressive fog that comes in from all sides, colder and desaturated colour, or purple and dark grey. https://reddit.sentinel-team.org/posts/1r8ua1j/snapshots/2026-02-20T04%3A11%3A24.594254Z

### Inferences
- Scaled to the 320 px sandbox, Emerald's screen-fraction speed is about 20 px/s. A useful range is about 4 to 20 px/s for ground fog, and 0 to 6 px/s for horror fog that "breathes" instead of flows. These are estimates from the Emerald numbers plus the Reddit feedback.
- Two layers at different speeds (for example 1x and 0.6x) with slightly different directions read as volume. One layer reads as a moving texture.
- Pixel-step motion (1 px every N frames) is on-grid and looks crisp. Sub-pixel scrolling of a filtered texture blurs. Emerald's integer counters are the right model.

### Gaps
- No artist source gives an explicit px/s rule for fog. These numbers come from one game's code and one feedback thread.

---

## Q4. Layering fog for depth in 3/4 view, and keeping characters readable.

### Takeaway
Draw ground fog as several stacked horizontal bands. Low objects are covered by more layers than the tops of tall ones, so roofs and tree crowns rise out of it (Graveyard Keeper). Never let fog cover the player, enemies or interactables to the point they vanish. Either draw characters above the fog, clear a radius around the player, or keep enemy outlines and telegraphs at full contrast.

### Cited findings
- Graveyard Keeper (Lazy Bear, top-down 3/4 pixel game). Fog is "horizontal clouds spread across all the picture". It relies on "Object altitude simulation", so "the tops of houses and trees are seen from the fog". It has a density setting. Day/night uses a blue ambient at night and LUT colour grading per time and zone. https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
- Pokémon DPPt Siren/fog complaint. A PokéCommunity user describes fog "that covers everything except the trainers". The game keeps NPCs readable by leaving them out of the fog. (From a search summary. I could not open the exact post.) https://www.pokecommunity.com/members/mgthunder.608235/recent-content
- Accessible Player Experiences "Clear Channels". Players may need to remove background details to tell important foreground objects apart. Way of the Passive Fist's High Contrast mode darkens and mutes the background so characters and attack cues stand out. https://accessible.games/accessible-player-experiences/access-patterns/clear-channels/
- Hyper Light Drifter. Alx Preston (Automaton interview, Japanese) says colour and silhouette matter most, and readability at low resolution was key. (Paraphrase of a Japanese source.) https://automaton-media.com/articles/interviewsjp/20170525-47328/

### Inferences
- Draw order for top-down fog: ground tiles, then low fog layer(s), then sprites with y-sort, then a thin high fog layer at low strength, then UI. Characters stay crisp. The high layer adds depth without hiding them.
- A clearing radius of about 2 to 3 tiles around the player (and smaller around torches) keeps play readable. It also gives the "fog parts around me" feel. This is an estimate. Study #6 covered smoke clearing masks, and #5 the light maps to reuse.
- Enemy telegraphs (attack flashes, wind-ups) should draw above fog at full contrast. Otherwise fog becomes an unfair difficulty boost (Q6).

### Gaps
- No artist guide on outline colours for sprites under fog. No player-study data on clearing radius.

---

## Q5. Mood. Horror and mystery fog, fog as level design.

### Takeaway
Fog creates mood by hiding what is next, and the hiding has to cost the player curiosity, not hit points. Silent Hill's fog is widely described as a hardware draw-distance fix that became the series' identity, though no primary Team Silent quote confirmed this. Darkest Dungeon gets the same pressure from darkness and a shrinking torch. Fog gates (Dark Souls) turn fog into a doorway: a soft, readable threshold that says "something waits beyond".

### Cited findings
- Silent Hill. Blogs and fan posts describe fog hiding PS1 draw-distance pop-in, then becoming a trademark. Several pieces call the "only hid draw distance" story a half-truth. No primary developer source was found. https://retro-replay.com/retroreplayfyi-the-accidental-horror-of-silent-hills-fog , https://dev.to/blaze_faisal/the-truth-about-silent-hill-2-fog-myth-when-hardware-limits-meet-creative-genius-7o1
- Silent Hill 2 remake. PC players mod the fog away to see hidden detail. Taking fog away shows how much of the mood it carries. https://pcgamer.com/games/horror/silent-hill-2-players-are-modding-away-the-fog-and-freeing-the-camera-to-discover-hidden-detail-in-the-remake
- Darkest Dungeon. Bourassa wanted "a melancholic, mysterious, and lonely feeling" and art that feels "old and worn". In DD2, darkness swallows all but the road and the torch. https://kotaku.com/the-art-of-darkest-dungeon-1798520287 , https://www.pcgamer.com/darkest-dungeon-2-charts-a-new-path-through-terror-in-a-roguelike-road-trip-to-save-humanity/
- Death's Door. Edge praised perspective, lighting and depth of field that make it feel like "a series of dioramas". Reviewers praised a mix of cute and dark. https://www.pressreader.com/australia/edge/20210812/283313230515167 , https://blog.unity.com/games/crafting-intricate-environments-deaths-door
- Dark Souls fog walls. They section off areas and boss rooms and keep players guessing about the other side. Passing one gives a "palpable feeling of accomplishment" (CyberPost). Some fog walls appear only once the boss fight and music start. Loading-screen motives are claimed by fans, not confirmed by FromSoftware. https://gamerant.com/fromsoftware-games-fog-walls-dark-souls-elden-ring-bloodborne/ , https://cyberpost.co/why-do-walls-fog-in-dark-souls/ , https://www.nexusmods.com/darksouls3/mods/1764

### Inferences
- Fog-gate idea for an MMO: a visible fog curtain on a tile edge marks a dungeon or boss entrance. It is cheap (one animated strip) and tells the player "commitment ahead". It also hides interest-management loading, which links to Q7 and study notes on server-side vision.
- Horror pixel fog wants cold, desaturated, dark fog that barely moves and closes in. That is the opposite of pretty morning mist, which is light, warm and drifts.

### Gaps
- No primary source on Silent Hill's intent. No 2D top-down horror fog post-mortem found.

---

## Q6. What players praise and complain about.

### Takeaway
Complaints cluster where fog hides threats while the game also adds a penalty. Players accept fog as a puzzle (find Defog) or a short event. They resent it when it is long, unavoidable, or stacked with slowdown, accuracy loss or ambush enemies.

### Cited findings
- Pokémon DPPt and BDSP Route 210. The route is "infamous" for fog hiding trainers. In battle fog cuts accuracy (TV Tropes lists it under Scrappy Mechanic). Defog clears it, but the fog returns when you leave. https://www.tvtropes.org/pmwiki/pmwiki.php/ScrappyMechanic/Pokemon , https://www.nintendolife.com/guides/pokemon-brilliant-diamond-and-shining-pearl-defog-hm-where-to-get-defog
- Don't Starve: Hamlet Heavy Fog. Lasts 1 to 3 minutes outdoors in Humid Season, shrinks view to a small radius, slows players 40 to 60% when wearing head or body items, and adds wetness. https://dontstarve.wiki.gg/wiki/Heavy_Fog . Klei forum threads include "slow in the fog sucks" and "humid season sucks too much", and players note there is no consistent counter. https://kleiforums.com/forums/topic/96732-slow-in-the-fog-sucks/ , https://kleiforums.com/forums/topic/107325-humid-season-sucks-too-much/
- World of Warcraft. A low-vision player said a spore fog made a patch zone "nearly impossible" to see. The weather console command did not reduce it. Support had no fix. https://us.forums.blizzard.com/en/wow/t/visual-setting-help/2317851
- Octopath Traveler (HD-2D). Some players want the depth-of-field blur off and use Engine.ini edits or a Switch "Visual Clarity Patch". Others reply that the game looks better with the effects. https://www.nexusmods.com/octopathtraveler/mods/29?tab=docs , https://gbatemp.net/goto/post?id=9762852
- Hyper Light Drifter. Reviews praise atmosphere and call the world "undeniably beautiful". The complaints are about unclear guidance, not visibility. https://kotaku.com/hyper-light-drifter-the-kotaku-review-1769432532 , https://pcgamer.com/hyper-light-drifter-review
- Stardew Valley. No vanilla fog overlay was found. Mods add it. Cave Weather adds mine fog with opacity 0 to 255. Ambient Light's author removed fog overlay code because it "caused more harm than good". https://www.curseforge.com/stardewvalley/mods/cave-weather-dynamic-mine-events , https://www.nexusmods.com/stardewvalley/mods/4639

### Inferences
- Design rule: fog may take away information *or* add a cost, not both, unless there is a clear counter (an item, a spell, a light source, or a timer the player can see).
- Fog that resets when you leave (Defog) feels like busywork. In an MMO with shared weather, show fog start and end times or let a player's light clear a radius. Players then always have an action to take.
- Make fog strength a setting. Modders keep exposing opacity sliders (Cave Weather 0 to 255), which shows the demand.

### Gaps
- I found no specific player discussions about fog in Dead Cells or Eastward. Eastward coverage is about lighting (hand-painted normal maps), not fog. https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures

---

## Q7. Fog of war feel. Exploration reward, memory, unfairness.

### Takeaway
Fog of war feels good when uncovering the map is itself the reward (Civ, exploration games), and when remembered terrain stays visible but dimmed. It feels unfair when it hides threats the player could not have scouted. Roguelikes settled on a convention. Remembered tiles are drawn in true colours but darker (or hatched), and monsters are not remembered.

### Cited findings
- DiGRA paper (Keerthi Sridharan). Early fog of war modelled military uncertainty. Modern games use it mainly to reward exploring unfamiliar land. https://dl.digra.org/index.php/dl/article/download/3026/3010/3069
- Chris Crawford (via Wikipedia). Fog systems got less fun as they got more realistic, so games simplified them. https://ipfs.ssi.eecc.de/ipns/en.wikipedia-on-ipfs.org/wiki/Fog_of_war
- Design patterns (Björk/Holopainen style wiki). Fog that returns over explored land pushes players to memorize it. The two core choices are shared or not, and returning or not. https://math.vu.nl/~eliens/media/pattern-fogofwar.html
- Wayward Strategy RTS101. Fog forces scouting. In StarCraft or C&C, seeing the enemy plan early can cancel it. https://waywardstrategy.com/2015/01/30/battlefield-uncertainty-and-fog-of-war/
- r/roguelikedev FAQ Friday #70 "Map memory" (2018, via search summaries, since the thread mirrors returned 403). Cogmind draws remembered areas in their colours but darker, with a semi-transparent shade on top, which became the default. It does not remember mob positions, only terrain and items. Another game multiplies tile colour by grey. Cthonic Expedition cross-hatches remembered tiles. https://redlib.hbubli.cc/r/roguelikedev/comments/84rkyv/faq_friday_70_map_memory

### Inferences
- For Asterion's 32x32 tile MMO, a three-state look fits pixel art best. Unknown is solid black or a dark palette colour. Explored is the true tiles darkened through a palette ramp, with no creatures or players. Visible is full colour. The boundary uses a 1 to 2 tile dithered fringe instead of a hard step. FOV comes from study #5.
- The reveal moment can be a short 4 to 8 frame dither dissolve per tile. That is the "satisfaction" beat players describe. This is an estimate, and no source measured it.
- Tibia has no real fog of war, only a fixed view window. Exploration fog in an MMO should be a map or minimap feature, not hide other players in view. Hiding players the server already sends would invite map-hack complaints and feel unfair.

### Gaps
- No measured data on reveal animation length or how strongly players prefer dimmed memory over hatched memory.

---

## Q8. Accessibility (motion, contrast, low vision, photosensitivity)

### Takeaway
Ship a fog strength slider (0 to 100%) and a "reduce motion" option that freezes fog drift. Keep players, enemies, loot and telegraphs out of the fog or above it. Avoid lightning-in-fog flashes over 3 per second. Avoid high-contrast full-screen dither patterns.

### Cited findings
- Xbox Accessibility Guideline 118 (photosensitivity). A flash is a 10% luminance change. It fails at more than about 3 flashes per second over about 20% or more of the screen. A spatial pattern of high-contrast bands fails at more than 10% contrast over about 20% of the screen. Red flashes have a lower threshold. https://learn.microsoft.com/en-ie/gaming/accessibility/xbox-accessibility-guidelines/118
- Accessible Player Experiences "Clear Channels". Let players remove background details and moving backgrounds. Way of the Passive Fist's High Contrast mode is the example. https://accessible.games/accessible-player-experiences/access-patterns/clear-channels/
- Game Accessibility Guidelines, "Provide an option to adjust contrast". https://gameaccessibilityguidelines.com/provide-an-option-to-adjust-contrast/
- Xbox XAG 102 contrast. Aim for 4.5:1 for standard text and 7:1 for high-contrast modes. https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/102
- WoW spore fog (Q6) is a real low-vision barrier with no setting to remove it. https://us.forums.blizzard.com/en/wow/t/visual-setting-help/2317851

### Inferences
- A full-screen 50% checkerboard of two colours far apart in value could fail the XAG spatial-pattern rule. That is another reason to dither only between close colours (also Pixnote's flicker advice).
- Scrolling fog across the whole screen may bother motion-sensitive players. A freeze option costs nothing.

---

## Q9. Sound for fog

### Takeaway
Fog makes no sound. Sell it with a low-pass on ambience whose cutoff falls as fog rolls in. Add sparse isolated distant one-shots (bell, foghorn, footsteps) with more reverb and less direct sound, plus a low drone for tension.

### Cited findings
- Automate a low-pass cutoff on ambience to simulate fog rolling in. https://www.wayline.io/blog/audio-plugins-game-atmosphere
- Unity manual suggests a subtle low-pass on the Audio Listener to go with visual fog. https://docs.unity3d.com/Manual/class-AudioLowPassFilter.html
- "Fog itself makes no noise". Muffled, isolated sounds with space around them feel foggy. https://morphic.com/resources/sounds/fog-sound-effects
- Less direct sound and more reverb send gives a distant, diffuse quality. https://designingsound.org/2012/12/creating-the-spaces-of-ambience
- One Unity asset notes its low-pass does not work in WebGL. This is Unity-specific, so check Godot's AudioEffectLowPassFilter on the web export. https://assetstore.unity.com/packages/slug/285223

### Gaps
- I did not verify the cost of Godot AudioEffectLowPassFilter on the Web export.

---

## Anti-patterns (summary with evidence)
1. Grey wash. One alpha layer of neutral grey over everything kills contrast and goes off-palette. Slynyrd's rule is to shift toward the *sky/light* hue, not grey (Pixelblog 62). The Godot dither shader blends a fixed `darkness_color` with no palette snap.
2. Alpha over pixel art makes colours that are not in the palette. Snap to a palette LUT or swap to fogged ramp entries. https://itch.io/post/13865283
3. Visible noise tiling. A 256 px loop (Emerald) works because the fog art is soft and slow. At 320x180 a 64 px repeating noise is visible within seconds. Use two layers with prime-ish sizes. This is an inference.
4. Fast one-way drift reads as smoke, oil or water (r/IndieDev thread).
5. Dither that moves with the fog crawls. Lock the matrix to screen or world pixels. This is an inference, backed by the unanswered alignment question on itch.io.
6. Fog that hides threats while also adding a penalty (Hamlet, Route 210, WoW spores).

## What is cheap and beautiful (from this angle)
- Palette-mapped fog (fog ramp per colour) with a slow 2-layer scroll at 1 px per 3 to 5 frames. It is on-palette, calm, and cheap.
- Height-aware layering (Graveyard Keeper), so tops of tall props rise out of the fog.
- Pre-drawn soft fog sprites at low strength (Emerald's 20 sprites, world-anchored).
- Cheap-but-ugly: one full-screen alpha grey quad. Pretty but expensive: per-pixel domain-warped noise plus blur at full resolution. Profile that in the efficiency notes.

## Sources
- https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds
- https://slynyrd.com/blog/2018/11/16/pixelblog-11-landscape-pixeling
- https://pixeljoint.com/pixelart/88670.htm
- https://pixnote.net/en/learn/dithering
- https://www.sprite-ai.art/blog/pixel-art-backgrounds
- https://pixelparmesan.com/dithering-for-pixel-artists
- https://divoom.com/blogs/setup-ideas/pixel-art-dithering-when-to-use-and-stop
- https://godotshaders.com/shader/2d-retro-dithered-lighting-fog-of-war/
- https://itch.io/post/9334920
- https://itch.io/post/13865283
- https://reddit.birdcat.cafe/r/retrogaming/comments/1l3uo9m/was_there_fauxtranslucency_through_dithering_in/mwbwx3s/?context=3
- https://docs.godotengine.org/en/stable/tutorials/3d/volumetric_fog.html
- https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
- https://github.com/pret/pokeemerald/blob/master/include/constants/field_weather.h
- https://github.com/pret/pokeemerald/tree/master/data/maps/MtPyre_Summit
- https://reddit.sentinel-team.org/posts/1r8ua1j/snapshots/2026-02-20T04%3A11%3A24.594254Z
- https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
- https://www.pokecommunity.com/members/mgthunder.608235/recent-content
- https://www.tvtropes.org/pmwiki/pmwiki.php/ScrappyMechanic/Pokemon
- https://www.nintendolife.com/guides/pokemon-brilliant-diamond-and-shining-pearl-defog-hm-where-to-get-defog
- https://accessible.games/accessible-player-experiences/access-patterns/clear-channels/
- https://automaton-media.com/articles/interviewsjp/20170525-47328/
- https://retro-replay.com/retroreplayfyi-the-accidental-horror-of-silent-hills-fog
- https://dev.to/blaze_faisal/the-truth-about-silent-hill-2-fog-myth-when-hardware-limits-meet-creative-genius-7o1
- https://pcgamer.com/games/horror/silent-hill-2-players-are-modding-away-the-fog-and-freeing-the-camera-to-discover-hidden-detail-in-the-remake
- https://kotaku.com/the-art-of-darkest-dungeon-1798520287
- https://www.pcgamer.com/darkest-dungeon-2-charts-a-new-path-through-terror-in-a-roguelike-road-trip-to-save-humanity/
- https://www.pressreader.com/australia/edge/20210812/283313230515167
- https://blog.unity.com/games/crafting-intricate-environments-deaths-door
- https://gamerant.com/fromsoftware-games-fog-walls-dark-souls-elden-ring-bloodborne/
- https://cyberpost.co/why-do-walls-fog-in-dark-souls/
- https://www.nexusmods.com/darksouls3/mods/1764
- https://dontstarve.wiki.gg/wiki/Heavy_Fog
- https://kleiforums.com/forums/topic/96732-slow-in-the-fog-sucks/
- https://kleiforums.com/forums/topic/107325-humid-season-sucks-too-much/
- https://us.forums.blizzard.com/en/wow/t/visual-setting-help/2317851
- https://www.nexusmods.com/octopathtraveler/mods/29?tab=docs
- https://gbatemp.net/goto/post?id=9762852
- https://kotaku.com/hyper-light-drifter-the-kotaku-review-1769432532
- https://pcgamer.com/hyper-light-drifter-review
- https://www.curseforge.com/stardewvalley/mods/cave-weather-dynamic-mine-events
- https://www.nexusmods.com/stardewvalley/mods/4639
- https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures
- https://dl.digra.org/index.php/dl/article/download/3026/3010/3069
- https://ipfs.ssi.eecc.de/ipns/en.wikipedia-on-ipfs.org/wiki/Fog_of_war
- https://math.vu.nl/~eliens/media/pattern-fogofwar.html
- https://waywardstrategy.com/2015/01/30/battlefield-uncertainty-and-fog-of-war/
- https://redlib.hbubli.cc/r/roguelikedev/comments/84rkyv/faq_friday_70_map_memory
- https://learn.microsoft.com/en-ie/gaming/accessibility/xbox-accessibility-guidelines/118
- https://gameaccessibilityguidelines.com/provide-an-option-to-adjust-contrast/
- https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/102
- https://www.wayline.io/blog/audio-plugins-game-atmosphere
- https://docs.unity3d.com/Manual/class-AudioLowPassFilter.html
- https://morphic.com/resources/sounds/fog-sound-effects
- https://designingsound.org/2012/12/creating-the-spaces-of-ambience
- https://assetstore.unity.com/packages/slug/285223
- https://gdquest.com/tutorial/art/pixel-art/chapter/4_how_to_draw_clouds_in_pixel_art/
- https://pixeljad.itch.io/drawclouds/devlog/548281/how-to-draw-clouds-pixel-art-tutorial
