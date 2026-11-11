# 10. Gap fill: Stardew format, EarthBound codes, NPC facing, 9-slice, offscreen speakers, GW2/ESO

Round-two notes. They fill gaps left by 02 and 09 and don't repeat them. Budget was about 30 tool calls. Several games on the list (Chrono Trigger, Golden Sun, Sea of Stars, Eastward, Chained Echoes) got no primary source this round. They are listed under Gaps.

Access tip for later agents. The Stardew wiki blocks normal page loads with Cloudflare, but the MediaWiki API answers. `https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Modding:Dialogue&prop=wikitext&format=json` returned the full wikitext (90 KB).

---

## Q1. Stardew Valley dialogue format, box and portraits

### Takeaway
Stardew packs a whole conversation into one string. `#` separates commands, `$b` breaks to a new box, `$e` ends the talk, and the next talk continues after it. A trailing `$h`, `$s` or similar picks the portrait for that line. Questions are `$q` plus `$r` answers that carry a friendship delta. The box is 1200x384 screen px (300x96 art px at 4x). It types one character every 30 ms (about 33 cps) and has a 750 ms anti-mash guard. Portraits are 64x64 cells, six standard expressions, then any number of custom ones.

### Cited findings
Format (Modding:Dialogue, via the API URL above, page https://stardewvalleywiki.com/Modding:Dialogue)
- `#` separates two commands in a string. `$b` is a pause where "the player will need to click" for a new box. `$e` ends the dialogue and closes the box, and text after `$e` needs a new interaction. `$k` drops all remaining messages.
- Example from the page: `"I'm sorry to make things uncomfortable for you...$u#$e#Anyway... How's the farming life going?"`.
- `%` at the start turns the box into a generic text box with no speaker, e.g. `"%Abigail is lost in her music."`.
- `@` is replaced with the farmer's name in dialogue and `speak`, but not in event `textAboveHead` bubbles.
- `||` rotates lines by in-game week number. `${male^female}$` switches by player gender.
- `$c 0.9#A#B` picks A with 90% chance. `$d kent#A|B` branches on a world state. `$query <game state query>#A|B` branches on a query, but the page warns the query is checked at parse time, not live.
- `$1 <letterID>#first-time#$e#nth-time` shows a line once. `$t` adds a conversation topic for N days (default 4). `$v <event>` starts a cutscene. `$action AddMoney 500` runs a trigger action. `[(O)198 (O)202]` gives a random item from the list.
- Questions. `$q 305/306 fallbackKey#Question?` then one `$r <responseID> <friendship> <reactionKey>#Answer` per option. If a listed response ID was already given, the question is skipped and the fallback key is used. `$p 305#if-chose|if-not` checks old answers later. The wiki example uses friendship deltas +15, 0 and -10.
- `$y 'answer_reply'` is a lightweight question with no IDs and no friendship change. It can repeat forever.

Portraits
- Commands go at the end of a line. Portraits are numbered left to right, top to bottom from `$0`. The first six are standard. `$0` neutral, `$1`/`$h` happy, `$2`/`$s` sad, `$3`/`$u` unique (grumpy for Abigail, football for Alex, sick for the Governor), `$4`/`$l` love, `$5`/`$a` angry, `$6+` custom. The page notes Caroline has only four. https://stardewvalleywiki.com/Modding:Dialogue
- "Each frame is exactly 64x64 per portrait", stored in `Portraits/NpcName`. https://stardewvalleywiki.com/Modding:NPC_data
- Decompiled `DialogueBox.cs` reads the cell with `getSourceRectForStandardTileSheet(..., portraitIndex, 64, 64)`. https://github.com/E-riCA0/StawdewValley/blob/HEAD/Menus/DialogueBox.cs

Box and timing (decompiled `Menus/DialogueBox.cs`, same URL. Old decompile, pre-1.5 by its `pixelZoom` constants. Recheck against 1.6.)
- Character box `width = 1200`, `height = 6 * Game1.tileSize` (6x64 = 384). Question boxes and plain boxes size to their text, capped at 1200 or 1240.
- `portraitBoxSize = 74` and `portraitPlateWidth = 115` in art px, so a 64x64 portrait plus a 5 px frame each side. It is drawn at 4x.
- `characterAdvanceDelay = 30` ms. One character per 30 ms is about 33 cps. The first character waits 90 ms after the box finishes opening.
- Sounds. `breathin` on open, `breathout` on close, `dialogueCharacter` per letter (only if the Typing option is on), `dialogueCharacterClose` when the line finishes, `smallSelect` on advance.
- Open animation grows the box from its centre. Width grows by elapsed ms x 6 per frame (3 px each side), height in proportion. A 1200 px box opens in about 200 ms.
- `safetyTimer = 750` ms after a new box appears. Clicks inside that window only shave 200 ms off the timer instead of advancing. This blocks mashing through a fresh line.
- A click while typing reveals the full line. A second click advances.
- Portrait jiggle. When the portrait index changes, `newPortaitShakeTimer` is set to 250 ms for index 1 (happy) or 50 ms otherwise. A hard-coded list (Pam 3, Abigail 7, Haley 5, Maru ...) shakes ±1 px every frame for "shaking" expressions.
- A friendship jewel (44x44 screen px, 11x11 art) sits at the box's right edge and shows heart level. Its colour runs blue 0-1 hearts, green 2-3, yellow 4-5, red 6-7, purple 8-9, then a purple star at 10-14. https://stardewvalleywiki.com/Friendship

Hearts and heart events
- One heart is 250 friendship points. Talking once a day gives +20. Not talking decays -2 per day for friends (-20 per day for a spouse). Garbage rummaging within 7 tiles costs -25. https://stardewvalleywiki.com/Friendship
- Dialogue keys gate by heart level, checked in order 10, 8, 6, 4, 2, e.g. `Sun4`, `Saloon8`. https://stardewvalleywiki.com/Modding:Dialogue
- Heart events are scripted cutscenes, slash-separated commands with preconditions like `f Penny 1000` (1000 points, 4 hearts). Acting commands are `speak`, `emote <actor> <id>`, `faceDirection <actor> <0-3>`, `move`, `showFrame`, `animate`, `textAboveHead`, `pause <ms>`. https://stardewvalleywiki.com/Modding:Event_data
- Emote IDs come in steps of 4 (4 frames each). 4 empty can, 8 ?, 12 angry, 16 !, 20 heart, 24 sleep, 28 sad, 32 happy, 36 x, 40 pause. NPC data has an `EmoteOffset` pixel point per NPC. https://stardewvalleywiki.com/Modding:Event_data and https://stardewvalleywiki.com/Modding:NPC_data
- `Strings/SpeechBubbles` holds overhead bubble lines that fire when the player enters a location. `<location>_Entry` has a 50% chance to show a line above the NPC as they enter a location.

### Inferences
- Stardew's split between `$b` (same talk, new box) and `$e` (end talk, rest waits for the next click on the NPC) is a cheap way to drip-feed lore without a dialogue tree. It maps well to Tibia-style "talk again" NPCs.
- The 750 ms guard plus "first click completes, second advances" is worth copying. On a laggy MMO, a server-pushed line that lands under a mash would otherwise be skipped unread.
- Response IDs that are shared across answers and checked later with `$p` give lightweight memory without a full variable system. On a server, store them as a per-player set.

### Gaps
- Not checked against the 1.6 decompile. Sizes may now use `Game1.tileSize` differently on mobile.

---

## Q2. EarthBound, Chrono Trigger, Golden Sun, Octopath, CrossCode and others

### Takeaway
EarthBound's text engine is a byte-code interpreter. Pauses are in 1/60 s units, prompts come with and without the blinking triangle, and the text speed setting changes how prompts behave. Octopath turns NPC interaction into a verb menu (eight path actions in four noble/rogue pairs), which suits an MMO well.

### Cited findings
EarthBound / MOTHER 2
- CCScript standard library (CoilSnake). `pause(len)` is `[10 len]`. `next` is `[03 00]` (halt with prompt). `wait` is `[13]` (halt, no prompt). `prompt` is `[14]`. `newline` is `[01]` (breaks only if the line isn't blank) and `linebreak` is `[00]`. `eob` is `[02]`. `window_open(n)` is `[18 01 n]`, `window_closeall` is `[18 04]`. `text_blips(n)` is `[1F 04 n]`. `sound(n)` is `[1F 02 n]`. `font_saturn` is `[1F 31]` (Mr. Saturn font). https://github.com/pk-hack/CoilSnake/blob/master/coilsnake/assets/mobile-sprout/lib/std.ccs
- Data Crystal control codes. `[10 XX]` waits XX units "1/60th of a second long", so `[10 3C]` is 1 s and the max is about 4.25 s. `[03]` shows the blinking triangle, but "when text speed is set to medium or fast, it will simply act as a short delay". `[1F 60 XX]` waits up to XX frames or a button, and XX = 0 means 30 frames on fast, 60 on medium, 0 on slow. `[1F 04]` blips: 01 default (sound outside battle, silent in battle), 02 always, 03 never. https://datacrystal.tcrf.net/wiki/EarthBound/Control_Codes
- The `@` bullet. Line breaks are "commonly" followed by a bullet symbol (typed `@` in editors) or two spaces so lines align. The engine capitalizes "the" after a bullet. Same Data Crystal page.
- Window flavours. MOTHER 2 has Plain, Mint, Strawberry, Banana and Nut. EarthBound renamed Nut to Peanut. The player picks text speed, then stereo/mono, then flavour at new game. https://legendsoflocalization.com/?p=301
- The text speed menu is a 16x10 tile window at (3, 14). https://datacrystal.tcrf.net/wiki/EarthBound/Standard_Arguments

Octopath Traveler (path actions as an NPC interaction model)
- Eight verbs in four pairs, each pair having a noble and a rogue version. Inquire (Alfyn) and Scrutinize (Cyrus) get information. Purchase (Tressa) and Steal (Therion) get items. Challenge (Olberic) and Provoke (H'aanit) fight the NPC. Guide (Ophilia) and Allure (Primrose) make the NPC follow you. https://primagames.com/tips/octopath-traveler-characters-talents-path-actions
- Noble actions never fail. Rogue actions (Scrutinize, Allure, Provoke, Steal) have a success chance, and failure lowers town reputation. https://twinfinite.net/guides/octopath-traveler-noble-rogue-path-actions-explained/
- In Octopath Traveler II, some actions need a character level that beats the NPC's. https://gamerant.com/octopath-traveler-2-every-path-action-ranked/

CrossCode
- The 2013 recap describes a "side message system" in the lower left of the screen, where characters talk during play without stopping it. https://www.moddb.com/games/crosscode/news/crosscode-recap-2013
- Demo 0.0.5 added a Dialog Log to reread skipped messages, opened from the menu or the pause menu during combat and cutscenes (per the search summary of the same devblog era).

### Inferences
- EarthBound's flavours are palette swaps of one frame graphic. That gives a free, player-chosen cosmetic. In an MMO it's a client-only setting, so it costs no bandwidth.
- EarthBound's speed setting changing the meaning of a prompt (wait on slow, short delay on medium and fast) is an idea worth taking. Barks and ambient lines could auto-advance for fast readers.
- CrossCode's side messages are the single-player version of an MMO's non-blocking NPC chat. A corner panel with a portrait lets an NPC talk while the player keeps moving. That fits a shared town better than a modal box.
- Octopath's verbs fit Asterion as a context menu on NPCs (Talk, Trade, Ask about, Steal), with rogue verbs gated by reputation on the server.

### Gaps
- Chrono Trigger. No primary source found for the message speed values (1-8 from memory, not cited) or for top/bottom box placement logic. Next, try the Chrono Compendium or a CT disassembly.
- Golden Sun. No source this round for Psynergy emote bubbles or acting with sprites. 02 lists a string dump: https://goldensunwiki.net/wiki/Golden_Sun_series/String_Dump
- Sea of Stars, Eastward, Chained Echoes. No devlog on dialog presentation found in budget.
- EarthBound's base frames per character for each speed weren't found. Only the prompt delays (30/60/0) are cited.

---

## Q3. NPCs turning to face the player and turning back

### Takeaway
RPG Maker MV handles this in 12 lines. When the player starts an event, it saves the NPC's facing, turns it toward the player, and locks it. When the event ends, it restores the old facing. "Direction Fix" makes `setDirection` do nothing, so statues and busy NPCs stay put. Stardew's events use explicit `faceDirection` commands.

### Cited findings
- `Game_Event.lock()` saves `_prelockDirection = this.direction()`, calls `turnTowardPlayer()`, then sets `_locked = true`. `unlock()` calls `setDirection(this._prelockDirection)`. While locked, `updateStop` resets the stop count, so the NPC won't wander mid-talk. https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_objects/Game_Event.js
- `start()` only locks for triggers 0, 1 and 2 (action button, player touch, event touch). Autorun and parallel events don't turn. Same file.
- `setDirection(d)` returns early if `isDirectionFixed()`. That flag is the "Direction Fix" checkbox and move-route command. https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_objects/Game_CharacterBase.js
- Idle animation is "Stepping" (`_stepAnime`). Pattern change wait is `(9 - realMoveSpeed) * 3` frames, so 15 frames at the default speed 4. Same file.
- Stardew events turn actors with `faceDirection <actor> <0-3> [continue]`. Without `continue`, the script waits while the NPC turns. https://stardewvalleywiki.com/Modding:Event_data
- Pokémon Emerald's emote hop and `MovementAction_Emote*` are in 09.

### Inferences
- For Asterion, run turn-to-face on the client only. The server says "NPC X is talking to player Y", and each client turns the sprite. If several players talk to one NPC (Tibia focus), face the player who holds focus. Restore the old facing after an idle timeout of about 2-4 s (estimate), not right away, so the NPC doesn't snap during a pause.
- A per-NPC `direction_fix` flag in data (guards, shopkeepers behind counters) costs nothing and avoids odd turns.

---

## Q4. 9-slice frames for pixel dialog boxes

### Takeaway
Stretching ruins pixel borders. Tile the edges, or size boxes in whole multiples of the edge tile. RPG Maker MV's windowskin stretches its 48 px frame edges, which only looks right because MV skins use plain gradients. Godot's NinePatchRect defaults to stretch. Set both axes to Tile, or Tile Fit if the size may not divide evenly.

### Cited findings
RPG Maker MV windowskin (192x192), from `Window.js`. https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Window.js
- Background. `(0,0)-(96,96)` is stretched to the whole window. `(0,96)-(96,192)` is tiled on top as a 96x96 pattern.
- Frame. `(96,0)-(192,96)` with 24 px corners (`m = 24`). The four corners are copied 1:1. The four edges are copied with `blt` from a 48 px source strip to `w - 48` or `h - 48`, so they are stretched, not tiled.
- Scroll arrows sit at `x = 96+24`. Pause sign (the "next" arrow) is four 24x24 frames at `(144,96)`. The frame switches every 16 frames (2x2 grid), and alpha fades in by 0.1 per frame.
- RPG Maker's own blog post on windowskin parts: https://www.rpgmakerweb.com/blog/what-makes-up-a-windowskin

Godot 4 `NinePatchRect`. https://github.com/godotengine/godot/blob/master/doc/classes/NinePatchRect.xml
- `patch_margin_left/top/right/bottom` are ints in texture px, default 0. `region_rect` picks the atlas region. `draw_center` defaults to true.
- `axis_stretch_horizontal/vertical` default to 0, STRETCH ("may cause the texture to be distorted"). TILE (1) repeats with no distortion but "must be seamless". TILE_FIT (2) repeats and also stretches so each tile shows in full, which is less distortion than stretch.
- `StyleBoxTexture` has the same three modes, so a Theme-based Panel works the same way.

GBA and SNES (by hardware, from 09's sources). Frames are 8x8 tilemap cells, so edges always tile and box sizes are always multiples of 8. Emerald's `message_box.png` is 14 tiles. https://github.com/pret/pokeemerald/blob/master/src/menu.c

### Inferences (my rules, not from a single source)
- Stretched edges smear a 1 px highlight into a blurry band at non-integer scales. With a dither or rivet pattern, they make uneven gaps.
- In TILE mode the last tile gets cut off when the size isn't a multiple of the edge period. Fix it by snapping the box width and height to that period (8 or 16 px) or by using a flat-colour edge. TILE_FIT avoids the cut but stretches a few px, which shows on patterned edges.
- Odd sizes. A centred box with an odd width on an even viewport lands on half pixels. Round the position to integers after centring. Keep the NinePatchRect at 1x in a pixel-perfect viewport, never scale the Control.
- A bubble tail should be a separate sprite placed on the bottom edge, not part of the 9-slice. Then it can slide along the edge to point at the speaker (see Q5).
- Cost. One NinePatchRect is one draw with 9 quads, and the same texture batches. Tile mode adds quads, not draw calls (estimate, not measured).

---

## Q5. Offscreen speakers and edge-clamped bubbles

### Takeaway
No game studio wrote up its method in what I found. The engine-forum consensus is that an edge indicator and a clamped bubble are separate problems. Clamp the bubble body into the screen, but let the tail slide or flip so it still points at the speaker. Show an arrow or a small portrait chip on the edge once the speaker leaves the view.

### Cited findings
- Common method. Each target owns a hidden indicator that appears when the target leaves the camera rect and is clamped to the camera bounds. https://forum.godotengine.org/t/putting-an-indicator-on-the-edge-of-the-screen-for-an-off-screen-target/29020
- Edge position from the line between screen centre and target, with slope-intercept math. https://code.tutsplus.com/positioning-on-screen-indicators-to-point-to-off-screen-targets--gamedev-6644t
- Unreal UDK. A target behind the camera pins the indicator to the bottom edge. Targets outside the frustum stay on the edges, pointing at the target. https://udn.epicgames.com/Three/DevelopmentKitGemsAddingOnScreenIndicators.html
- Known failure. Adventure Creator pushes a bubble fully on screen near the edge, and then the tail "no longer appears under the speaking character". https://adventurecreator.org/forum/discussion/comment/59784/
- Opposite failure. An AGS bubble module crops bubbles when a character stands too far right. https://new-site.adventuregamestudio.co.uk/forums/modules-plugins-tools/module-speechbubble-v0-8-0/100
- Callout rule from tooltip design. Measure the gap to each viewport edge, place the callout on the side with the most room, and flip when the preferred side is full. https://bugnet.io/blog/how-to-fix-tutorial-prompt-overlapping-the-element-it-describes

### Inferences
- For a top-down 2D MMO the camera is fixed and axis-aligned, so the simple four-edge clamp is enough. The "behind the camera" case doesn't exist.
- Proposed rule set for Asterion (estimate):
  1. On screen: bubble above the head, body clamped to a 4 px inset, tail slides along the bottom edge to stay over the speaker, and flips below the speaker near the top edge.
  2. Off screen but in hearing range (Tibia "say" reaches about one screen): put a 16x16 chip at the edge on the speaker's bearing, with a name and the first words, for NPCs and party members only.
  3. Never show chips for random players' chat in crowds. That belongs in the chat log.
- No source found for Overwatch, MOBA, Roblox or Among Us speaker indicators. Roblox's BillboardGui bubble chat has edge behaviour, but I didn't verify it.

---

## Q6. Guild Wars 2 renown hearts and ESO conversation camera

### Cited findings
- GW2 renown hearts are fixed task areas anchored by an NPC. Each gives a list of optional actions that all count toward one bar. The map icon is an empty heart that fills with yellow from the bottom as a progress bar, then shows as filled. The exact % is hidden except in one squad UI view. https://wiki.guildwars2.com/wiki/Renown_heart
- Rewards are XP, a completion popup with karma and coin, and the heart NPC then becomes a karma vendor. Karma starts at 90 at level 2 and rises by about 7.5 per level. Same page.
- From Living World Season 3 on, hearts are repeatable and reset daily. Janthir Wilds added tiered hearts. Some zones (Heart of Maguuma, the Icebrood Saga zones) dropped hearts for meta event chains. Same page.
- ESO zooms the camera in to frame the NPC during dialogue. Players have asked for years to turn it off ("Removal of Dialogue/Conversation camera"), and addons such as TorigaCam add a "Dialogue" camera state. I found no official toggle. https://forums.elderscrollsonline.com/en/discussion/166287/removal-of-dialogue-conversation-camera and https://forums.elderscrollsonline.com/en/discussion/390916/3rd-person-camera-pans-way-out-after-disengaging-from-npc
- A known ESO side effect: after banker or merchant dialogue, the third-person camera stays zoomed out and creeps back. Same second thread.

### Inferences
- The renown heart is the MMO answer to "quest giver with no dialogue". You walk into an area, do any mix of tasks, and a bar fills. For Asterion, a filling heart or bar icon on an NPC (16x16, filled in 1 px steps from the bottom) shows progress without a quest log. The progress lives on the server, and each update is about one byte.
- The ESO camera shows a cost of cinematic dialogue in a shared world. Players dislike losing camera control near other players. A 2D game gets the same "focus" with a dim plus a portrait and no camera move.

---

## See it in action
- Stardew dialogue format: https://stardewvalleywiki.com/Modding:Dialogue
- Stardew portraits and emotes: https://stardewvalleywiki.com/Modding:NPC_data and https://stardewvalleywiki.com/Modding:Event_data
- Stardew DialogueBox (old decompile): https://github.com/E-riCA0/StawdewValley/blob/HEAD/Menus/DialogueBox.cs
- EarthBound control codes: https://datacrystal.tcrf.net/wiki/EarthBound/Control_Codes
- CCScript library: https://github.com/pk-hack/CoilSnake/blob/master/coilsnake/assets/mobile-sprout/lib/std.ccs
- EarthBound window flavours (with screenshots): https://legendsoflocalization.com/?p=301
- Octopath path actions: https://primagames.com/tips/octopath-traveler-characters-talents-path-actions
- RPG Maker MV turn-to-face: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_objects/Game_Event.js
- RPG Maker windowskin layout: https://www.rpgmakerweb.com/blog/what-makes-up-a-windowskin
- Godot NinePatchRect modes: https://docs.godotengine.org/en/stable/classes/class_ninepatchrect.html
- GW2 renown heart: https://wiki.guildwars2.com/wiki/Renown_heart
- Gap: no gameplay video URLs were verified this round.

## Quick parameter table

| Item | Value | Source |
|---|---|---|
| Stardew char delay | 30 ms (about 33 cps), first char after 90 ms | DialogueBox.cs |
| Stardew box | 1200x384 screen px (300x96 at 4x) | DialogueBox.cs |
| Stardew portrait | 64x64 cell, 74 px plate, drawn 4x | NPC_data, DialogueBox.cs |
| Stardew anti-mash | 750 ms, each early click shaves 200 ms | DialogueBox.cs |
| Stardew open | about 200 ms grow from centre | DialogueBox.cs (my math) |
| Stardew heart | 250 points, +20 per daily talk, -2 per day decay | Friendship |
| EarthBound pause unit | 1/60 s, max 255 (4.25 s) | Data Crystal |
| EarthBound auto-prompt | 30 f fast, 60 f medium, wait on slow | Data Crystal |
| RPG Maker MV windowskin | 192x192, 24 px frame corners, edges stretched | Window.js |
| RPG Maker MV pause sign | 4 x 24x24 frames, 16 f each | Window.js |
| RPG Maker MV idle step | (9 - speed) x 3 f, 15 f at speed 4 | Game_CharacterBase.js |
| Godot NinePatchRect | STRETCH default, TILE, TILE_FIT | NinePatchRect.xml |

## Sources
- https://stardewvalleywiki.com/Modding:Dialogue (via MediaWiki API)
- https://stardewvalleywiki.com/Modding:NPC_data (via API)
- https://stardewvalleywiki.com/Modding:Event_data (via API)
- https://stardewvalleywiki.com/Friendship (via API)
- https://github.com/E-riCA0/StawdewValley/blob/HEAD/Menus/DialogueBox.cs
- https://github.com/pk-hack/CoilSnake/blob/master/coilsnake/assets/mobile-sprout/lib/std.ccs
- https://datacrystal.tcrf.net/wiki/EarthBound/Control_Codes
- https://datacrystal.tcrf.net/wiki/EarthBound/Standard_Arguments
- https://legendsoflocalization.com/?p=301
- https://primagames.com/tips/octopath-traveler-characters-talents-path-actions
- https://twinfinite.net/guides/octopath-traveler-noble-rogue-path-actions-explained/
- https://gamerant.com/octopath-traveler-2-every-path-action-ranked/
- https://www.moddb.com/games/crosscode/news/crosscode-recap-2013
- https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_objects/Game_Event.js
- https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_objects/Game_CharacterBase.js
- https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Window.js
- https://www.rpgmakerweb.com/blog/what-makes-up-a-windowskin
- https://github.com/godotengine/godot/blob/master/doc/classes/NinePatchRect.xml
- https://github.com/godotengine/godot/blob/master/doc/classes/StyleBoxTexture.xml
- https://forum.godotengine.org/t/putting-an-indicator-on-the-edge-of-the-screen-for-an-off-screen-target/29020
- https://code.tutsplus.com/positioning-on-screen-indicators-to-point-to-off-screen-targets--gamedev-6644t
- https://udn.epicgames.com/Three/DevelopmentKitGemsAddingOnScreenIndicators.html
- https://adventurecreator.org/forum/discussion/comment/59784/
- https://new-site.adventuregamestudio.co.uk/forums/modules-plugins-tools/module-speechbubble-v0-8-0/100
- https://bugnet.io/blog/how-to-fix-tutorial-prompt-overlapping-the-element-it-describes
- https://wiki.guildwars2.com/wiki/Renown_heart
- https://forums.elderscrollsonline.com/en/discussion/166287/removal-of-dialogue-conversation-camera
- https://forums.elderscrollsonline.com/en/discussion/390916/3rd-person-camera-pans-way-out-after-disengaging-from-npc
