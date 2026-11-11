# 09 Pixel art craft of dialog UI, portraits, bubbles and markers

Researcher angle: the pixel art of dialog. Fonts, box frames, portraits, bubbles, emote balloons, markers, juice and anti-patterns. Focus on sizes in pixels and frame counts.

Most hard numbers here come from source code (pret/pokeemerald, RPG Maker MV corescript, OTClient), so they are exact. Artist-tutorial sources gave little in the way of numbers. Saint11 and Slynyrd pages had no extractable figures. See Gaps.

---

## Q1. Which pixel font sizes read at 320x180 and 640x360?

### Takeaway
At 320x180 the practical floor is 3x5 glyphs in a 4x6 cell. 5x7 is the first size where every letter has its counters. At 640x360, use a 5x7 to 6x11 class font (m5x7, m6x11, Monogram, Pixel Operator). Outline the font when it sits over the world. Render at integer scale with nearest filtering and no subpixel positioning, or the pixels go uneven.

### Cited findings
- Practitioners call 3x5 "tiny" and "hard to read". PICO-8's built-in font is 3x5. One dev built a 5x7 replacement for that reason. https://omgmog.net/projects/game-design/pico8-larger-font/
- Forum consensus says 5x7 is the smallest size where letters stay fully recognisable, and that 3x5 glyphs really need a 4x6 cell with spacing. Practitioner opinion, not a study. https://www.allegro.cc/forums/thread/606221 and https://hn.svelte.dev/item/39735675
- C-Dogs SDL had to fit its font into 3x5 because a larger one broke the UI. Most pixel fonts are around 8x8. Outlines are the "really cheap solution" for busy backgrounds and can overlap the glyph so they add no width. Proportional width keeps M, N and W apart, while monospace 3x5 made M and N hard to tell apart. https://cxong.github.io/2019/09/tips-for-legible-pixel-fonts
- Pokémon Emerald font table (`sFontInfos`, src/text.c). FONT_SMALL has maxLetterWidth 5 and maxLetterHeight 12. Per a measured analysis, the fonts are small 5x12, normal 6x16, short 6x14, narrow 5x16, small-narrow 5x8 and bold 8x8. Lowercase averages 5.77 px wide, capitals 6 px, and the space is 3 px. Every font has fg, bg and shadow colour indices, so Emerald uses a 1 px drop shadow, not an outline. https://github.com/pret/pokeemerald/blob/master/src/text.c and https://blakecrosley.com/blog/pixel-art-interfaces-on-iphone
- Game Boy games used 8x8 fixed-width fonts with 16 letters per line in Pokémon Yellow. Oracle of Ages used 8x16 cells with roughly 6x9 letters, also 16 per line. https://eev.ee/blog/2018/10/09/cheezball-rising-opening-a-dialogue
- Free game fonts and their stated metrics:
  - m5x7 by Daniel Linssen (managore). CC0, "attribution appreciated". Use at size 16, 32, 48. x-height +5. https://managore.itch.io/m5x7
  - m6x11 by Daniel Linssen. Free with attribution. Use at 16, 32, 48. m6x11plus is used at 18, 36, 54 with ascender +11, x-height +8, descender -3 and average width 6. https://managore.itch.io/m6x11
  - Monogram by datagoblin. CC0, monospace, "fixed width of 5 pixels". Ships TTF, PNG+JSON bitmap and PICO-8 versions. Covers English, Spanish, Russian, Portuguese and Greek. It has no bold because bold would hurt legibility at that width. A Godot user reports the TTF distorts at some resolutions and suggests importing the PNG as an image font with integer scale. https://datagoblin.itch.io/monogram
  - Pixel Operator by Jayvee Enaguas. CC0. Built on a 16 px grid, with "8" variants (PixelOperator8, PixelOperatorMono8). https://www.dafont.com/pixel-operator.font and https://fontlibrary.org/en/font/pixel-operator
  - Press Start 2P and Silkscreen are both 8 px grid fonts with no Japanese. https://blakecrosley.com/blog/pixel-art-interfaces-on-iphone
- For Japanese, Misaki is an 8x8 cell and k8x12 an 8x12 cell, and both cover all 6,879 JIS X 0208 characters. PixelMplus10 and PixelMplus12 cover 6,876. https://blakecrosley.com/blog/pixel-art-interfaces-on-iphone
- Xbox Accessibility Guideline 101 sets minimum text body height (lowest descender to highest ascender) at 26 px at 1080p for console/TV and 18 px at 1080p for PC. Coloured outline pixels count toward size only if their contrast with the background exceeds 2:1. https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-101-text-display.md
- Godot 4 font docs, for pixel fonts:
  - set the canvas texture filter to Nearest
  - use a font size that is an integer multiple of the design size, on a Control scaled by an integer
  - disable subpixel positioning, or the font "may appear to have uneven pixel sizes"
  - shadows "always have a hard edge" and work only in Label and RichTextLabel, while outlines work in most Controls
  - MSDF at small sizes "will not look as clear as rasterized fonts"
  - image fonts and BMFont .fnt are supported
  https://docs.godotengine.org/en/stable/tutorials/ui/gui_using_fonts.html
- OTClient (Tibia client) draws overhead chat in "verdana-11px-rounded", where "rounded" is the outlined variant. NPC and say text is yellow (239,239,0). Other channels are orange (254,101,0) and cyan (95,247,247). https://github.com/edubart/otclient/blob/master/src/client/statictext.cpp

### Inferences
- Map the XAG floor to low-res buffers. 1080p is 6x 320x180 and 3x 640x360. Console 26 px becomes about 4.3 px body height at 320x180 and about 8.7 px at 640x360. PC 18 px becomes 3 px and 6 px. A 3x5 font with a 1 px descender (about 6 px body) just clears the console floor at 320x180. m5x7 (about 9 px body with descenders) clears it at 640x360. For a phone in portrait on web, aim higher.
- Asterion's 32x32 tiles suggest a game buffer near 640x360 (20x11 tiles) or larger. At that size m5x7 (16 px line) or m6x11 (about 14 to 16 px line) for dialog, with m3x6 or a 3x5 font for nameplates and damage numbers, is a sound default.
- Over the busy world (bubbles, nameplates), outline beats drop shadow. A drop shadow leaves one side of each glyph unprotected. A 1 px outline costs 2 px of height and width per glyph if it does not overlap. In a solid dialog box, a 1 px shadow (Emerald) is enough and keeps letters lighter.
- Use bitmap fonts (PNG + metrics) rather than TTF. They avoid the Godot TTF distortion seen with Monogram, and draw as plain textured quads. See the runtime-cost researcher for numbers.

### Gaps
- No controlled legibility study at 320x180. Advice is from practitioners.
- No first-party source found for fonts in Eastward, Sea of Stars, Chained Echoes or CrossCode. One design blog says Sea of Stars uses an unnamed custom bitmap font (https://madegooddesigns.com/?p=11177). Unverified.

---

## Q2. How big is a dialog box, and how is it built?

### Takeaway
Classic handheld boxes take about 30% of screen height and the full width, with two lines of text. The frame is a tiny 9-slice tile set (6 to 14 tiles of 8x8). Text starts 4 to 16 px in from the frame edge. The advance arrow bobs 0-1-2-1 px on a 36-frame (0.6 s) cycle.

### Cited findings
- Pokémon Emerald, GBA 240x160:
  - the standard text window template is at tilemapLeft 2, tilemapTop 15, width 27, height 4 tiles, so 216x32 px of text area (src/menu.c, `sStandardTextBox_WindowTemplates`)
  - the frame is 30x6 tiles (240x48 px), which is 30% of the height, with two 16 px lines
  - the dialog frame graphic is message_box.png at 56x16 px (14 tiles), and there are 20 menu frame styles at 24x24 px
  - script lines have a median of 29 chars (150 px) and a maximum of 53 chars (208 px) in a 216 px window
  - only 6.5% of paragraphs name the speaker, and the box has no name field
  https://github.com/pret/pokeemerald/blob/master/src/menu.c and https://blakecrosley.com/blog/pixel-art-interfaces-on-iphone
- Emerald advance arrow (src/text.c). The sprite is 8x16. `sDownArrowYCoords = {0, 1, 2, 1}`. `downArrowDelay = 8` per step, so 9 frames per step and 36 frames per cycle. There is a normal and a dark variant for different box colours. https://github.com/pret/pokeemerald/blob/master/src/text.c
- FireRed's text window is 26x4 tiles. Crystal (160x144) has a 20x6 tile box (33% of height), an 18x4 text area, 18 chars per line and 2 lines with a blank row between them, with an 8x8 font. Crystal's frame styles are 8 options of 24x16 px, 6 one-bit tiles each. Pokémon Red's message box is 20x6 tiles at the bottom. https://blakecrosley.com/blog/pixel-art-interfaces-on-iphone
- Final Fantasy VI has 8 window styles of 28 tiles (8x8, 4bpp) and 7 editable colours per window. The dialog line is 220 px wide and the box sits at row 1 or row 18 (top or bottom). https://blakecrosley.com/blog/pixel-art-interfaces-on-iphone
- Homebrew Game Boy box (Cheezball Rising): 20x4 tiles (160x32 px), 2 lines in 8x16 cells, one 4-colour palette, text inset 4 px from the left. It opens by sliding up one tile row per vblank over 4 frames. https://eev.ee/blog/2018/10/09/cheezball-rising-opening-a-dialogue
- RPG Maker MV (816x624 default) Window_Message:
  - 4 visible rows, lineHeight 36, standardPadding 18, so the box is 4x36+36 = 180 px tall, about 29% of 624
  - font size 28 and textPadding 6
  - faces are 144x144
  - openness rises by 32 per frame out of 255, so open and close take 8 frames (about 133 ms) as a vertical squash
  - `\.` waits 15 frames, `\|` waits 60 frames, and `\!` waits for input
  https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_windows/Window_Base.js and https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_windows/Window_Message.js
- A small-screen devlog (Knight George) found a 3-line box "covering too much of the screen". It kept 2 lines and scrolled them up instead. Scrolling also clipped a few pixels of the outline, a common bug when you clip text with a surface. https://linky439.itch.io/knight-george/devlog/864056/devlog-4-improving-dialog-boxes-on-a-small-screen
- Saint11 has a 9-slice UI tutorial, UI-9-Slice with named parts, on the tutorial index. No numbers could be extracted. https://saint11.art/blog/pixel-art-tutorials/

### Inferences
- For a 640x360 buffer, a box about 33% tall (about 112 to 120 px) fits 3 lines of a 16 px line font plus 16 px padding, or 2 lines plus a name tab. On a 320x180 buffer, copy Emerald's ratio of a 48 to 56 px box with 2 lines.
- A 9-slice frame with 8x8 corners and a 1 to 2 px border is the norm on 8x8 tile hardware. On a 32x32 tile game, keep the frame at 1x pixel scale (8x8 or 16x16 corners) so it matches world pixels. Never author it at a different scale (see mixels, Q7).
- Opaque boxes read best over a busy MMO town. Translucency needs a dim or blur behind it, which costs fill rate on low-end web. The 2:1 outline contrast rule from XAG supports using solid plates.

### Gaps
- Exact pixel padding inside the Emerald frame between frame tile and text window was not computed. The template puts the text at tile column 2, so about 8 to 16 px in from the screen edge.
- No source found for EarthBound, Chrono Trigger or Undertale box sizes from code.

---

## Q3. Portraits: size, expressions, mouth flaps, blinks

### Takeaway
Portrait sizes cluster at 48x48 (indie, small screens) and 64x64 (Stardew). RPG Maker goes up to 144x144 at a higher resolution. Cheap animation is a 2-frame mouth flap and a blink whose closed frame is about 2 px tall. Expressions per character vary from about 4 to 7 or more. Portraits made by scaling the overworld sprite are cheap and some players like them, but they are usually redone.

### Cited findings
- Stardew Valley vanilla portraits are 64x64 per cell. Sheets are 2 portraits wide and the game picks cells by index. An expanded 7-expression sheet is 128x256 (4 rows). Portraits that are not 64x64 need a mod loader (HD Portraits, Portraiture). https://forums.stardewvalley.net/threads/sprite-size-first-time-modding-sv.7128/ and https://nexusmods.com/stardewvalley/articles/1459
- Village Monsters uses 48x48 base portraits for 32+ villagers plus nearly as many minor NPCs. Large features may break the frame. Early portraits were the overworld sprite scaled up and touched up. Some players liked that low-fi look, but the dev redid them all for 1.0. Lip sync was the only portrait animation. Commenters found the portrait bounce charming but a little distracting. https://josh-bossie.itch.io/village-monsters/devlog/249628/building-a-village-a-portrait-is-worth-a-thousand-words
- RPG Maker MV faces are 144x144 on an 816x624 screen (about 23% of screen height). https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_windows/Window_Base.js
- Fire Emblem GBA portrait hacking has mouth and eye frames on an 8x8-aligned grid, so they must sit inside their 8x8 section. Fully closed eye frames should be "about 2 px tall" including both lids. https://feuniverse.us/t/how-do-i-correctly-do-blinking-mouth-animations/33245
- Mouth-flap timing example (Ren'Py): 3 mouth frames held 0.25 s, 0.3 s and 0.2 s on a loop. Simple talking portraits are often a 2-frame flap. https://blog.argentgames.co/post/2021-03-08-renpy-animation-while-talking and https://humbird0.com/makes/experiments/character_portraits/content.htm
- Engines often need a separate "blink while talking" slot or the blink overrides the talk state. https://itch.io/post/16284770
- Celeste sends the current portrait emotion to FMOD, which switches the voice-gibberish loop to the matching emotion. Speech stops when the text finishes drawing. The portrait, the text and the audio share one emotion tag. https://shacknews.com/article/125697/devs-share-insight-into-celestes-dialogue-design-process

### Inferences
- For Asterion (32x32 overworld sprites), a 48x48 or 64x64 bust drawn at the same pixel scale keeps proportion with the world. 96x96 needs a 640x360+ buffer and a box about 112 px tall.
- A budget per NPC of 4 expressions (neutral, happy, angry/sad, surprised), a 2-frame mouth and a 1-frame blink is about 7 small frames, or 4 if the mouth and eyes are overlay layers on a base. Overlays on an 8x8 grid (the FE method) keep the atlas tiny.
- Blink starting values (estimate) hold the closed frame 3 to 6 frames (50 to 100 ms), every 2 to 6 s with random jitter. Mouth flap at 100 to 150 ms per frame, paused on punctuation, and stopped when text ends, as in Celeste.
- For an MMO with hundreds of NPCs, palette swaps of a few base busts (hair, skin, clothing ramps) give variety for one drawing. Shopkeeper archetypes can share a bust with a recoloured outfit.
- Acting with the overworld sprite (Pokémon's emote plus facing turn) has no portrait cost and fits shared-town NPCs where a portrait box would cover other players.

### Gaps
- No first-party portrait sizes for Eastward, Sea of Stars or Chained Echoes. Searches returned nothing.
- No artist source with a full blink and mouth timing chart. Values above are starting estimates.

---

## Q4. Emote balloons and overhead icons

### Takeaway
Pokémon's "!", "?" and heart are 16x16 sprites that sit 16 px above the NPC. They hop about 15 px on a gravity curve in about 10 frames and live 60 frames (1 s). RPG Maker's balloons are 48x48, 8 frames at 8 ticks each, plus a 12-frame hold, for 76 frames total.

### Cited findings
- Pokémon Emerald (src/trainer_see.c):
  - emotion_exclamation.png, emotion_question.png and emotion_heart.png are 16x16 sprites (`SPRITE_SIZE(16x16)`), 4bpp, priority 1
  - animation is 1 frame held 60 frames, then the sprite is removed
  - the sprite follows the NPC at x, y-16
  - the hop starts at `sYVelocity = -5` and adds +1 each frame, so offsets run -5, -9, -12, -14, -15, -15, -14, -12, -9, -5, 0. That is a 15 px peak, landing after about 10 frames
  - the heart uses palette 2, while ! and ? share the default palette
  https://github.com/pret/pokeemerald/blob/master/src/trainer_see.c
- Emerald triggers emotes from movement scripts as `MovementAction_EmoteExclamationMark`, `...QuestionMark` and `...Heart`. https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
- RPG Maker MV Sprite_Balloon has 48x48 frames, 8 frames per balloon, speed 8 ticks per frame and waitTime 12. Duration is 8x8+12 = 76 frames (about 1.27 s). Frames 0 to 7 play with the last frame held. https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Balloon.js

### Inferences
- For 32x32 characters, a 16x16 emote (half a tile) is the right size. Place it 2 to 4 px above the head and give it a 1 px dark outline so it reads on any floor.
- Quest markers can reuse the same art. A persistent marker bobs instead of hopping. A starting estimate is 2 to 3 px amplitude on a 0.8 to 1.2 s sine, stepped to whole pixels so it does not shimmer. Colour-code state as yellow ! (available), grey ? (in progress) and yellow ? (turn in). See the quest-marker researcher for MMO conventions.
- The Emerald hop is a cheap juice pattern. It is integer velocity with +1 gravity and no tween library, which makes it deterministic and suits server-replayed emotes.

### Gaps
- No code-level data found for MOTHER/EarthBound, Chrono Trigger or Zelda emote icons. Link's Awakening disassembly posts did not cover the text engine (https://zladx.github.io).
- No measured bob amplitude from a shipped 2D quest marker.

---

## Q5. Speech bubbles: shape, tail, outline, pop-in

### Takeaway
There is little first-party data. The craft rules are a 1 px dark outline, a 2 to 3 px stair-stepped corner radius, and a tail 3 to 6 px long pointing at the speaker. Pop in over 3 to 6 frames, ideally with a slight overshoot. Tibia/OTClient skips the bubble and uses outlined coloured text.

### Cited findings
- OTClient overhead text has no bubble. It uses outlined Verdana 11 px in a per-channel colour, with max width 200 px, and stays max(60 ms x chars, 3000 ms). https://github.com/edubart/otclient/blob/master/src/client/statictext.cpp and https://github.com/edubart/otclient/blob/master/src/client/const.h
- Saint11's tutorial index includes squash-and-stretch and impact pieces that apply to bubble pop-in. No frame counts could be extracted. https://saint11.art/blog/pixel-art-tutorials/
- Free CC0 bubble sets exist for reference (no sizes extracted). https://opengameart.org/content/pixel-speech-bubbles and https://icelivin.itch.io/dialog-bubbles

### Inferences
- Pixel-perfect rounded corners come from 9-slicing a hand-drawn bubble (corner 4x4 or 6x6, edge 1 px tile, centre fill) and drawing the tail as a separate sprite placed on the bottom edge. Never scale a rounded rectangle, because scaled corners make mixels.
- A pop-in with no tween needs 3 to 4 drawn frames (dot, small, overshoot, final). Or scale the 9-slice by whole-pixel sizes per frame. Fractional scale on a bubble breaks the pixel grid during the 100 ms animation. Most players will not notice that, but artists will.
- In crowds, outlined coloured text (Tibia) is cheaper and lower-clutter than bubbles. Bubbles read better for a few speakers.

### Gaps
- No shipped game's bubble sizes or pop frame counts were found in code.

---

## Q6. Juice: open/close, text pop, dim, camera, shake, sound

### Takeaway
Classic boxes open in 4 to 8 frames. That is 4 frames for the GB slide-up (one row per frame) and 8 frames for RPG Maker's vertical squash. Text appears one glyph per frame at the fast setting. Punctuation adds 15 frames for a short pause and 60 for a long one. The arrow bobs 0-1-2-1 px. Celeste ties portrait emotion to voice audio.

### Cited findings
- Box open is a 4-frame slide-up on GB homebrew (https://eev.ee/blog/2018/10/09/cheezball-rising-opening-a-dialogue) and an 8-frame openness ramp in RPG Maker MV (+32 out of 255 per frame) (https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_windows/Window_Base.js).
- Text speeds:

  | Game | Setting | Frames per char | Chars per second |
  |---|---|---|---|
  | Emerald / FireRed | Slow / Mid / Fast | 8 / 4 / 1 | 7.5 / 15 / 60 |
  | Emerald / FireRed | A or B held | 1 | 60 |
  | Crystal / Red | Slow / Medium / Fast | 5 / 3 / 1 | 12 / 20 / 60 |
  | Final Fantasy VI | Field | 1 | 60 |

  Emerald scrolls a line in 16, 8 or 4 frames at 1, 2 or 4 px per frame. https://blakecrosley.com/blog/pixel-art-interfaces-on-iphone
- RPG Maker wait codes are 15 frames (`\.`) and 60 frames (`\|`). https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_windows/Window_Message.js
- Celeste plays one looping voice event per character with emotion parameters taken from the portrait. The voice stops when text finishes drawing. https://shacknews.com/article/125697/devs-share-insight-into-celestes-dialogue-design-process
- Feedback for the character should appear on the sprite, not only in the HUD, because busy UI pulls focus. https://slynyrd.com/blog/2020/2/23/pixelblog-26-uxui-design-basics

### Inferences
- In a shared MMO world, avoid a full-screen dim and a camera nudge. They take control of a view other things are happening in, and the dim costs a full-screen blend pass. Use a local spotlight or a soft vignette only for single-player.
- A 1 to 2 px box shake for 4 to 6 frames on "!" lines is cheap and reads at low res. Keep it integer-stepped.
- Pair each juice beat with a sound, as Celeste does. The beats are box open, letter blips (every 2nd or 3rd glyph at 60 cps so the sound is not a buzz), arrow ready and box close.

### Gaps
- No frame data for Eastward, Sea of Stars or CrossCode dialog open/close.

---

## Q7. Anti-patterns players and artists complain about

### Takeaway
The main complaints are mixels from non-integer UI scale, text that cannot be resized, and text speed or skip that cannot be changed. Guidelines back the first two with numbers. Skip and speed have strong precedent (Emerald's 1 char per frame when holding A or B) more than formal rules.

### Cited findings
- Mixels are pixels of different sizes, usually from UI scaled by non-integer factors (x1.5) or from mixing art at different resolutions. All art in one game layer should share pixels per unit. Some devs deliberately mix (Celeste uses HD UI and fonts). https://forum.godotengine.org/t/low-res-pixel-art-diffrent-sized-pixel-stretching/21463 and https://itch.io/post/11504687 and https://tmaeg.itch.io/pixelarch/devlog/545570/fixed-uncomfortable-scaled-pixels
- Godot says pixel fonts look blurry or uneven unless size and scale are integer multiples and subpixel positioning is off. https://docs.godotengine.org/en/stable/tutorials/ui/gui_using_fonts.html
- The Game Accessibility Guidelines recommend a readable default font size and an option to resize text. XAG 101 says all text should be resizable, with minimum sizes given in Q1. https://gameaccessibilityguidelines.com/ and https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-101-text-display.md
- AFB recommends adjustable text speed for players with dyslexia or low vision. https://www.afb.org/aw/24/6/18367
- Emerald lets held A or B jump to 1 frame per char at any speed setting, so a fast-forward is built in. https://blakecrosley.com/blog/pixel-art-interfaces-on-iphone

### Inferences
- A pixel-font UI can break the XAG "resizable" rule. One fix is a 1x or 2x UI scale toggle, which stays integer and avoids mixels. Another is a separate high-res font path for a large-text mode.
- Bubbles covering combat matter in an MMO. Bubbles should fade or shrink when the player is in combat, or draw on a layer under combat numbers. This needs testing.

### Gaps
- No player-review data or survey on unskippable or slow text was found in this pass.

---

## Sources
- https://github.com/pret/pokeemerald/blob/master/src/menu.c
- https://github.com/pret/pokeemerald/blob/master/src/text.c
- https://github.com/pret/pokeemerald/blob/master/src/trainer_see.c
- https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
- https://blakecrosley.com/blog/pixel-art-interfaces-on-iphone
- https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_windows/Window_Base.js
- https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_windows/Window_Message.js
- https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Balloon.js
- https://github.com/edubart/otclient/blob/master/src/client/statictext.cpp
- https://github.com/edubart/otclient/blob/master/src/client/const.h
- https://eev.ee/blog/2018/10/09/cheezball-rising-opening-a-dialogue
- https://managore.itch.io/m5x7
- https://managore.itch.io/m6x11
- https://datagoblin.itch.io/monogram
- https://www.dafont.com/pixel-operator.font
- https://fontlibrary.org/en/font/pixel-operator
- https://cxong.github.io/2019/09/tips-for-legible-pixel-fonts
- https://omgmog.net/projects/game-design/pico8-larger-font/
- https://www.allegro.cc/forums/thread/606221
- https://hn.svelte.dev/item/39735675
- https://docs.godotengine.org/en/stable/tutorials/ui/gui_using_fonts.html
- https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-101-text-display.md
- https://gameaccessibilityguidelines.com/
- https://www.afb.org/aw/24/6/18367
- https://forums.stardewvalley.net/threads/sprite-size-first-time-modding-sv.7128/
- https://nexusmods.com/stardewvalley/articles/1459
- https://josh-bossie.itch.io/village-monsters/devlog/249628/building-a-village-a-portrait-is-worth-a-thousand-words
- https://feuniverse.us/t/how-do-i-correctly-do-blinking-mouth-animations/33245
- https://blog.argentgames.co/post/2021-03-08-renpy-animation-while-talking
- https://humbird0.com/makes/experiments/character_portraits/content.htm
- https://itch.io/post/16284770
- https://shacknews.com/article/125697/devs-share-insight-into-celestes-dialogue-design-process
- https://linky439.itch.io/knight-george/devlog/864056/devlog-4-improving-dialog-boxes-on-a-small-screen
- https://saint11.art/blog/pixel-art-tutorials/
- https://slynyrd.com/blog/2020/2/23/pixelblog-26-uxui-design-basics
- https://forum.godotengine.org/t/low-res-pixel-art-diffrent-sized-pixel-stretching/21463
- https://itch.io/post/11504687
- https://tmaeg.itch.io/pixelarch/devlog/545570/fixed-uncomfortable-scaled-pixels
- https://opengameart.org/content/pixel-speech-bubbles
- https://icelivin.itch.io/dialog-bubbles
- https://madegooddesigns.com/?p=11177 (secondary, unverified)
- https://zladx.github.io (checked, no text-engine data)
