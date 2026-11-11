# 01 Classic 2D MMOs: NPC talk, dialog and overhead text

Angle: Tibia (TFS, Canary, OTClient), RuneScape (317 client deob, OSRS wiki), Ragnarok Online (rAthena), Ultima Online (ServUO, ClassicUO). MapleStory, Albion and Lineage are mostly gaps (see the end).

Every number below comes from source code read on 2026-11-11 unless marked "inference" or "unverified". File paths refer to the repos linked in Sources.

---

## Q1. How does a Tibia-style keyword conversation start, run and end?

### Takeaway
A Tibia NPC is a chat parser in a 3-tile radius. "hi" or "hello" opens a per-player session. Typed keywords move through a keyword tree. "bye", walking past 3 tiles, closing the NPC channel or 120 s of silence ends it. NPC replies come 1 s late on purpose. The server needs no dialog UI at all. It sends text and the client puts it in a chat tab and over the NPC's head.

### Cited findings (TFS, `data/npc/lib/npcsystem/`)
- Defaults in `npchandler.lua`: `idleTime = 120` (seconds), `talkRadius = 3` (tiles), `talkDelayTime = 1` (seconds to delay outgoing messages). https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npchandler.lua
- Greet and farewell words in `modules.lua`: `FOCUS_GREETWORDS = {"hi", "hello"}`, `FOCUS_FAREWELLWORDS = {"bye", "farewell"}`, `SHOP_TRADEREQUEST = {"trade"}`, yes/no words for confirmations. https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/modules.lua
- Range is Chebyshev-style `getDistanceTo(cid) <= talkRadius`. Every `onThink`, each focused player is checked. Out of range fires `onWalkAway` ("Goodbye."). Idle past `idleTime` since the last matched keyword fires `unGreet`. Otherwise the NPC re-faces its focus. (npchandler.lua `onThink`, `isInRange`)
- The idle clock (`talkStart[cid] = os.time()`) only resets when a keyword matched or the default-message callback returned true. Saying gibberish does not keep the session alive. (npchandler.lua `onCreatureSay`)
- Once focused, the NPC only listens to the player's NPC-channel talk (`TALKTYPE_PRIVATE_PN`). Before focus it listens to normal say in range. (npchandler.lua line ~407)
- Matching is substring with a word-boundary guard. `msgcontains` returns true if the keyword appears and is not preceded by word characters. https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npc.lua
- The keyword tree is a `KeywordNode` hierarchy with `addChildKeyword` and `addAliasKeyword`. `KeywordHandler.lastNode[cid]` stores each player's position in the tree, so "yes"/"no" answer the last question. https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/keywordhandler.lua
- Default reply strings live in one table with tags `|PLAYERNAME|`, `|ITEMCOUNT|`, `|TOTALCOST|`, `|ITEMNAME|`. Examples: greet "Greetings, |PLAYERNAME|.", already focused "|PLAYERNAME|, I am already talking to you.", decline "Then not." (npchandler.lua `messages`)
- Multi-line speeches (`doNPCTalkALot`) send each line as `TALKTYPE_PRIVATE_NP` spaced `(i-1) * 4000 + 700` ms by default, or 6000 ms when called through `say(table)`. (npchandler.lua ~600, ~619)
- An NPC is a whole XML file plus a Lua script. Example: Riona is 9 lines of XML with `walkinterval="2000"` and a `shop_buyable` parameter string "backpack,1988,20;pick,2553,10;...". https://github.com/otland/forgottenserver/blob/master/data/npc/Riona.xml
- NPCs wander every `walkTicks = 1500` ms by default but stop walking while `focusCreature != 0`. NPC `canSee` uses a 3x3 tile window. https://github.com/otland/forgottenserver/blob/master/src/npc.cpp

### Cited findings (Canary, the newer system)
- Canary keeps the same handler idea but defines NPCs fully in Lua (`npcConfig.walkInterval = 2000`, `walkRadius = 3`, `speechBubble = SPEECHBUBBLE_SAILOR`, `flags.profession`). https://github.com/opentibiabr/canary/blob/main/data-otservbr-global/npc/rashid.lua
- Interaction range moved to C++: `Npc::canInteract(pos, range = 4)`, same floor only. Leaving it calls `onPlayerCloseChannel`, which ends the talk. https://github.com/opentibiabr/canary/blob/main/src/creatures/npcs/npc.cpp
- `playerInteractions` maps player id to topic id. `playerInteractionsOrder` is a list, and the NPC turns to face `.back()`, the most recent talker. "If talking, no walking": the walk timer resets while any interaction exists. (npc.cpp `onThinkWalk`, `setPlayerInteraction`, `removePlayerInteraction`)
- Canary splits delays: `talkDelay = 300` ms between messages and `talkDelayTimeForOutgoingMessages = 1` s. https://github.com/opentibiabr/canary/blob/main/data/npclib/npc_system/npc_handler.lua
- Canary stores `talkStart` and exposes `getTalkStart`, but I found no idle check in its `onThink`. Inference: Canary relies on range and channel close, not a 120 s idle timeout.
- Canary keeps a `shopPlayers` set and closes every open shop window when the NPC resets. (npc.cpp ~1260)

### Inferences
- "One talker at a time" is no longer how modern TFS works. `focuses` is a list, so many players talk to one NPC at once, each with their own topic and tree position. The old single-focus behaviour with "wait" messages and a queue came from older TFS 0.x (`NPCHANDLER_CONVBEHAVIOR`), which I did not read in this pass. The current answer to the MMO crowd problem is private replies (`TALKTYPE_PRIVATE_NP`) per player, with the NPC body facing only the latest talker.
- The 1 s reply delay makes a text NPC feel like it is "thinking" and hides server latency. A Godot client can show a typing indicator in that window.

### Gaps
- Old single-focus queue messages ("Please wait, {name}") not read.
- No measured bandwidth per NPC line. A `TALKTYPE_PRIVATE_NP` packet carries the NPC name, level, type, position and string. Estimate 20-30 bytes plus text (estimate).

---

## Q2. NPC channel, colours, and keyword highlighting in Tibia (OTClient)

### Takeaway
NPC replies are cyan, player speech is yellow, monster speech is orange. NPC text goes to an "NPCs" console tab and also floats over the NPC. Words in {curly braces} in NPC text are highlighted and clickable in the console. Clicking one sends that word back to the NPC. That turns the typed keyword system into a click-to-talk system with no server change.

### Cited findings
- Console colours, `modules/game_console/console.lua`: say/whisper/yell `#FFFF00`. Player to NPC `#9F9DFD`. NPC to player `#5FF7F7`. Monster say/yell `#FE6500` (hidden in console). GM broadcast `#F55E5E`. https://github.com/edubart/otclient/blob/master/modules/game_console/console.lua
- Talk types on the server: `TALKTYPE_PRIVATE_NP = 10` (NPC to player), `TALKTYPE_PRIVATE_NP_CONSOLE = 11` (NPC channel only, "no text on game screen"), `TALKTYPE_PRIVATE_PN = 12` (player to NPC). https://github.com/otland/forgottenserver/blob/master/src/const.h
- NPC messages route to a tab named "NPCs". Closing that tab calls `g_game.closeNpcChannel()`, which the server treats as goodbye (TFS `onPlayerCloseChannel` -> `unGreet`). (console.lua ~433, ~482)
- Keyword highlight: `getHighlightedText` finds `{([^}]+)}`. The client builds an overlay label that fills non-keyword characters with `char(127)` to line up widths, and clicking a highlighted word calls `sendMessage(word, npcTab)`. Braces are stripped from the overhead copy. (console.lua 527-621, 1050-1065)
- Option `ignoreNpcMessages` drops NPC lines entirely. Console keeps `MAX_LINES = 100` per tab and `MAX_HISTORY = 500` sent lines. (console.lua 62-76)
- Optional timestamps `%H:%M` prefix console lines. (console.lua `addTabText`)

### Inferences
- The braces convention is a cheap authoring rule. Writers mark keywords inline, the client turns them into buttons. It solves the "guess the keyword" problem new players hate, while old players can still type.

---

## Q3. Overhead text above creatures (OTClient)

### Takeaway
Tibia overhead text is anchored to the tile where it was said, not to the moving creature. It stays 60 ms per character with a 3 s minimum, doubled for yells. Repeated lines from the same speaker on the same tile stack into one block of up to about 11 lines. Wrap width is 275 px in the 11 px Verdana font.

### Cited findings
- `src/client/const.h`: `STATIC_DURATION_PER_CHARACTER = 60`, `MIN_STATIC_TEXT_DURATION = 3000`, `MAX_STATIC_TEXT_WIDTH = 200`, `ANIMATED_TEXT_DURATION = 1000`. https://github.com/edubart/otclient/blob/master/src/client/const.h
- `statictext.cpp`: font `verdana-11px-rounded`, centered. Delay is `max(60 * len, 3000)` ms, times 2 for yells. More than 10 queued messages pops the oldest. `compose()` writes "Name says:\n" then each message on its own line, then `wrapText(275)`. https://github.com/edubart/otclient/blob/master/src/client/statictext.cpp
- Overhead colours in `compose()`: say/whisper/yell RGB(239,239,0). Monster speech, spells and barks RGB(254,101,0). NPC speech RGB(95,247,247) with "says:". (statictext.cpp)
- Each message expires on its own timer, so a stacked block shrinks one line at a time from the top. (statictext.cpp `update`, `scheduleUpdate`)
- Draw rect is offset `+20, +5` from the tile point and clamped (`bind`) to the viewport rect, so text near the edge slides inward instead of being cut. (statictext.cpp `drawText`)
- Stacking rule in `map.cpp`: a new static text merges into an existing one only if same position, same speaker name and same mode. Otherwise a second text object is added at that tile. https://github.com/edubart/otclient/blob/master/src/client/map.cpp
- Animated (floating damage) text of the same colour on the same tile merges. A new one is pushed up to 12 px if the previous is younger than 250 ms. (map.cpp 119-145)
- Static texts on other floors are skipped unless they have a message mode. (mapview.cpp ~254)

### Inferences
- At 60 ms/char, a 40-char NPC line stays 3 s (the floor), a 100-char line 6 s. That is about 16.7 chars per second of reading time.
- Because text sits on the tile, a walking NPC leaves its words behind. That is fine for stationary shopkeepers and odd for walkers. Asterion can anchor to the creature instead.
- Different speakers on the same tile overlap. OTClient does no collision avoidance between speakers on adjacent tiles. RuneScape does (Q4).

---

## Q4. RuneScape overhead chat and chatbox dialog

### Takeaway
RuneScape keeps one line of overhead text per actor in bold font. Players' text lasts 150 client cycles, NPCs' 100. The client nudges overlapping texts upward so crowds stay readable. Conversations happen in a chatbox panel with a 3D chathead, never over heads. Overhead text is for barks and public chat.

### Cited findings (317 deob client, `src/Client.java`)
- Typed chat sets `textCycle = 150`. Server NPC overhead (`npc.spokenText = buffer.readString()`) sets `npc.textCycle = 100`. `Mob.textCycle` defaults to 100. The counter decrements once per client cycle and clears the text at 0. https://github.com/MatthewBishop/rs317/blob/master/src/Client.java
- At most `maxTextCount = 50` overhead texts render per frame.
- Overlap avoidance: for each text, the client loops over earlier texts. If the boxes intersect (2 px margin), it moves this text to sit above the other, repeating until clear. Effects get extra box height: wave/wave2/shake +10 px, slide +5 px, scroll fixed width 60 px.
- Colour table `textColours = {0xffff00, 0xff0000, 0x00ff00, 0x00ffff, 0xff00ff, 0xffffff}` (yellow, red, green, cyan, purple, white). Flash effects toggle every 10 of 20 ticks (`anInt1265 % 20 >= 10`). Glow effects ramp over 150 steps.
- Effects 1-5 animate with `150 - textCycle` as time. Shake uses that elapsed value. Scroll moves `(150 - textCycle) * (width + 100) / 150`.
- Player option `chatEffects` turns effects off for the viewer.
- The overhead filter respects public chat mode (on, friends, off) for players but always shows NPC text.

### Cited findings (OSRS wiki and RuneScript notes)
- Colour effects: yellow, red, green, cyan, purple, white, flash1-3, glow1-3, rainbow, pattern (1-8 colours). Text effects: wave, wave2, shake, slide, scroll. Syntax `colour:effect:Message`. https://oldschool.runescape.wiki/w/Chat_effects
- Dialog types: `chatnpc`, `chatplayer`, `messagebox`, `objectbox`, `mes`, and `say`/`npc_say` for "NPC overhead dialogue (yellow text)". https://runelibris.github.io/RuneLibris/Info/Dialogue
- Chathead expressions are animations, internally "Mes_anim", picked per line with tags like `happy`, `quiz`, `shock`. OSRS has four variants of each (e.g. `chatquiz1`-`chatquiz4`), chosen by the line count of the box. Neutral and happy are the most used. (same source)
- Overhead template on the wiki: https://oldschool.runescape.wiki/w/Template:Overhead

### Inferences
- The 317 client loop runs at 20 ms per cycle (50 Hz), so 150 cycles is about 3 s for players and 100 is about 2 s for NPCs. I did not confirm the cycle rate in this pass. Inference.
- RuneScape's duration is fixed, not per character. Long lines vanish as fast as short ones, which pushes writers toward short barks.
- Picking the chathead animation variant by line count means the mouth moves for roughly as long as the text is long. That is a cheap lip-sync trick worth copying with sprite mouth flaps.

### Gaps
- "Click here to continue" timing, chatbox pixel size (classic chatbox is about 519x142 in fixed mode, unverified), max lines per box (believed 4, unverified), option menu max (believed 5, unverified). 2009scape source not read.

---

## Q5. Ragnarok Online NPC scripts (rAthena)

### Takeaway
RO uses a modal NPC window driven by a blocking script: `mes` adds lines, `next` adds a Next button and pages, `close` ends, `select("A:B:C")` pops a menu, `input` asks for a number or string. `cutin` shows a large bitmap illustration (typically 320x480) in a screen corner. You click the NPC from up to 15 cells away. The server kills idle dialogs after 60 s at next/menu and 180 s at input.

### Cited findings
- `mes "<string>"` opens the box if needed and prints lines. Several strings print several lines. Colours are inline `^RRGGBB`, and `^FF00FF` is transparent in the client. Since 2011-10-10 clients, `<NAVI>` tags make clickable map links and item links exist. https://github.com/rathena/rathena/blob/master/doc/script_commands.txt (line ~1115)
- `next` shows a Next button and clears the window on click. Writers repeat the `mes "[Woman]"` name line at the top of each page by convention. `clear` clears without input. `close` ends the script. `close2` closes the box but keeps running (used to warp after talking). (script_commands.txt ~1248-1330)
- `menu "A:B",L_x,...` jumps to labels. `select("Yes:No")` returns the 1-based option. `prompt` returns 255 on Cancel. Options are colon-separated, empty options are hidden but keep numbering. (~1452, ~1594)
- `input(var, min, max)` opens a number or text box depending on variable type. (~1614)
- `cutin "<file>",<pos>`: positions 0 bottom-left, 1 bottom-middle, 2 bottom-right, 3 and 4 movable center windows, 255 clears. BMP with magenta transparency. "Typically the size is about 320x480". Images around 700x700 and up freeze the client briefly. One cutin at a time. Example `cutin "kafra_07",2` for the Comodo Kafra. (~8366)
- `npctalk "<msg>"` puts text over the NPC and in chat. Default colour white, targets `bc_area` (default), `bc_map`, `bc_self`, `bc_all`. (~7327)
- Also present: `emotion` (emote bubble icons), `showscript` (overhead text on a unit), `progressbar "<color>",<seconds>`, `viewpoint` (minimap marker), `navigateto`.
- Click range: `npc_checknear` rejects clicks outside `AREA_SIZE + 1` cells on each axis. `area_size: 14` by default. Class-less NPCs (`class_ < 0`) are clickable from anywhere. https://github.com/rathena/rathena/blob/master/src/map/npc.cpp , https://github.com/rathena/rathena/blob/master/conf/battle/client.conf
- Idle timeouts in `src/config/secure.hpp`: `NPC_SECURE_TIMEOUT_INPUT 180`, `NPC_SECURE_TIMEOUT_MENU 60`, `NPC_SECURE_TIMEOUT_NEXT 60`, checked every `SECURE_NPCTIMEOUT_INTERVAL 1` s. On timeout, `pc_close_npc`. https://github.com/rathena/rathena/blob/master/src/config/secure.hpp
- Chat flood limit `min_chat_delay: 0` ms by default (off). (client.conf)

### Inferences
- RO dialog is private per player by design. No queue, any number of players can talk to a Kafra at once. That is the opposite of Tibia's public keyword chat and the default most modern MMOs copied.
- The cutin is the "portrait" of classic MMOs. It is big, painted, not animated, and sits beside the box.

### Gaps
- Exact NPC window pixel size in the RO client (no open client source). Typing speed: RO prints whole lines at once (from memory, unverified).

---

## Q6. Ultima Online overhead speech (ServUO, ClassicUO)

### Cited findings
- Speech ranges in `Server/Mobile.cs`: regular 15 tiles, whisper 1, yell 18. https://github.com/ServUO/ServUO/blob/master/Server/Mobile.cs
- ClassicUO wraps overhead text at 200 px. https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Managers/MessageManager.cs
- Lifetime: with "scale speech delay" on, `4000 * lines * SpeechDelay / 100` ms, `SpeechDelay` floored at 10. With it off, about `40 * SpeechDelay` ms whatever the length. (MessageManager.cs `CalculateTimeToLive`)
- Fade-out: with text fading on, alpha ramps from 255 to 0 over the last 1000 ms. https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Managers/TextRenderer.cs
- UO keeps a journal (the scrollback log of all speech). That is its dialog history.

### Inferences
- At the usual 100 setting that is 4 s per wrapped line. It is per line, not per character, so it sits between Tibia's per-char rule and RS's fixed rule.

---

## Q7. Anti-spam for player chat (TFS)

### Cited findings
- `maxMessageBuffer = 4` in `config.lua.dist`. Each message increments `MessageBufferCount`. Going over the buffer mutes for `5 * n^2` seconds, where n grows with each mute (5, 20, 45 s...). https://github.com/otland/forgottenserver/blob/master/src/player.cpp , https://github.com/otland/forgottenserver/blob/master/config.lua.dist
- `MessageBufferTicks` accumulates and resets every 1500 ms (player.cpp ~1564). Inference: one message of buffer comes back each 1.5 s.
- Say range: spectators within `maxClientViewportX = 8`, `maxClientViewportY = 6` tiles. Yell uses `8*2+2 = 18` by `6*2+2 = 14` and crosses floors. https://github.com/otland/forgottenserver/blob/master/src/map.h , https://github.com/otland/forgottenserver/blob/master/src/game.cpp

---

## Q8. Tibia NPC trade window handoff

### Cited findings
- TFS comment: `SHOPMODULE_MODE_TRADE = 2 -- Trade window system introduced in client version 8.2`. Before that, buying was by talking ("buy 5 rope", "yes"). Both modes exist in the module. (modules.lua line 25)
- Saying "trade" sends the window with "Of course, just browse through my wares." Closing it makes the NPC say "Thank you, come back whenever you're in need of something else." Purchases through the window log "Bought |ITEMCOUNT|x |ITEMNAME| for |TOTALCOST| gold." (npchandler.lua messages)
- OTClient window `npctrade.otui`: 550x515 px, Buy and Sell radio tabs, item grid with `cell-size: 160 90`, detail rows Name, Price, Your Money, Weight, Your Capacity, amount slider 1-100, search box, "buy with backpack" and "ignore capacity" on Buy, "ignore equipped" and "show all items" on Sell. https://github.com/edubart/otclient/blob/master/modules/game_npctrade/npctrade.otui
- Weight from server is in hundredths (`item[3] / 100`). (npctrade.lua ~402)
- Walking out of range closes the window (Canary `closeShopWindow` on reset; TFS `onWalkAway` releases focus).

### Inferences
- The chat stays open while the trade window is up. The NPC "speaks" the handoff in and out, so the panel feels like part of the conversation and not a menu swap.

---

## Q9. MapleStory, Albion, Lineage

### Unverified (from memory, no source fetched)
- MapleStory v83 emulators (OdinMS, HeavenMS) script NPCs in JavaScript with `cm.sendNext`, `sendPrev`, `sendNextPrev`, `sendOk`, `sendYesNo`, `sendSimple`, `sendGetText`, `sendGetNumber`. Inline codes `#b` blue, `#r` red, `#k` black, `#d` purple, `#e` bold, `#n` normal, `#L0#...#l` selectable list items, `#h` player name, `#p` NPC name, `#i` item icon. The window shows a large NPC portrait at the left of a fixed box. The HeavenMS repo path I tried returned nothing.
- Albion Online and Lineage: nothing collected.

---

## Cross-game numbers table

| Item | Tibia (TFS/OTC) | Canary | RS 317 | RO (rAthena) | UO (ServUO/CUO) |
|---|---|---|---|---|---|
| Talk start | say "hi"/"hello" | same | click NPC | click NPC | click/say |
| Talk range | 3 tiles | 4 tiles | adjacent (inference) | 15 cells | speech 15 tiles |
| Idle timeout | 120 s since last keyword | none found | n/a | 60 s next/menu, 180 s input | n/a |
| Reply delay | 1 s | 1 s + 300 ms between lines | none | none | none |
| Overhead duration | max(60 ms * chars, 3 s), yell x2 | client | 150 cycles player, 100 NPC (~3 s, ~2 s inference) | n/a | 4 s per line, 1 s fade |
| Wrap width | 275 px, Verdana 11 | client | single line, bold font | n/a | 200 px |
| NPC colour | #5FF7F7 cyan | same | yellow #FFFF00 | white default | per hue |
| Player say colour | #FFFF00 | same | #FFFF00 | n/a | per hue |
| Overhead cap | 11 lines per stack | | 50 texts on screen | | |
| Chat flood | 4 msg buffer, mute 5n^2 s | | | min_chat_delay 0 | |

## Sources
- TFS npchandler.lua: https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npchandler.lua
- TFS modules.lua: https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/modules.lua
- TFS keywordhandler.lua: https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/keywordhandler.lua
- TFS npc.lua: https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npc.lua
- TFS npc.cpp: https://github.com/otland/forgottenserver/blob/master/src/npc.cpp
- TFS const.h: https://github.com/otland/forgottenserver/blob/master/src/const.h
- TFS map.h, game.cpp, player.cpp, config.lua.dist: https://github.com/otland/forgottenserver
- TFS Riona.xml: https://github.com/otland/forgottenserver/blob/master/data/npc/Riona.xml
- Canary npc_handler.lua: https://github.com/opentibiabr/canary/blob/main/data/npclib/npc_system/npc_handler.lua
- Canary npc.cpp: https://github.com/opentibiabr/canary/blob/main/src/creatures/npcs/npc.cpp
- Canary rashid.lua: https://github.com/opentibiabr/canary/blob/main/data-otservbr-global/npc/rashid.lua
- OTClient const.h, statictext.cpp, map.cpp, mapview.cpp: https://github.com/edubart/otclient/tree/master/src/client
- OTClient console.lua: https://github.com/edubart/otclient/blob/master/modules/game_console/console.lua
- OTClient npctrade: https://github.com/edubart/otclient/tree/master/modules/game_npctrade
- rs317 Client.java: https://github.com/MatthewBishop/rs317/blob/master/src/Client.java
- OSRS Chat effects: https://oldschool.runescape.wiki/w/Chat_effects
- OSRS Template:Overhead: https://oldschool.runescape.wiki/w/Template:Overhead
- RuneLibris Dialogue: https://runelibris.github.io/RuneLibris/Info/Dialogue
- rAthena script_commands.txt: https://github.com/rathena/rathena/blob/master/doc/script_commands.txt
- rAthena npc.cpp: https://github.com/rathena/rathena/blob/master/src/map/npc.cpp
- rAthena secure.hpp: https://github.com/rathena/rathena/blob/master/src/config/secure.hpp
- rAthena client.conf: https://github.com/rathena/rathena/blob/master/conf/battle/client.conf
- ServUO Mobile.cs: https://github.com/ServUO/ServUO/blob/master/Server/Mobile.cs
- ClassicUO MessageManager.cs, TextRenderer.cs: https://github.com/ClassicUO/ClassicUO/tree/main/src/ClassicUO.Client/Game/Managers

## See it in action
- Tibia NPC keyword chat and trade: https://www.tibia.com/gameguides/?subtopic=manual&section=npcs (official manual, not fetched)
- OSRS chat effects: https://oldschool.runescape.wiki/w/Chat_effects
- RO cutin and Kafra: https://github.com/rathena/rathena/blob/master/doc/script_commands.txt (cutin example)
