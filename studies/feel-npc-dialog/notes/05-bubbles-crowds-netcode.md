# 05. Speech bubbles in crowds, and the MMO systems behind NPC talk

Researcher angle: bubble layout and lifetimes, clutter in crowds, many players and one NPC, server authority, anti-spam, bytes per line, Godot 4 build notes.

Most numbers below come from source code I read directly: OTClient (edubart/otclient master), TFS (otland/forgottenserver master), the Roblox legacy Lua chat (Roblox/Core-Scripts), the Roblox creator-docs repo, Nitro (billsonnn/nitro-react dev, an open-source HTML5 Habbo client) and 2006Scape (a RuneScape 2006 client deob). Code reads are cited to the file URL.

---

## Q1. How do shipped games lay out bubbles above moving speakers?

### Takeaway
There are three proven layouts, and each one costs less than proper label placement.
1. Tibia/OTClient puts the text on the tile, not on the creature. It merges lines from the same speaker and clamps the block to the viewport. It never resolves overlap.
2. RuneScape 2006 does greedy vertical push. Each overhead line moves up until it clears every line already placed this frame. The cap is 50 lines per frame.
3. Habitat (1986) and Habbo use a stream. A bubble spawns at the bottom of a chat band at the speaker's x position. Every bubble then scrolls up on a fixed clock and gets pushed up by newer ones. Bubbles don't follow walking avatars.

None of them uses force-directed or simulated-annealing placement. For a 32 px tile game with Tibia framing, greedy push (RuneScape style) plus a viewport clamp (OTClient style) is the cheapest layout that stays readable.

### Cited findings
**OTClient static text (Tibia client clone)**
- Constants: `STATIC_DURATION_PER_CHARACTER = 60` ms, `MIN_STATIC_TEXT_DURATION = 3000` ms, `MAX_STATIC_TEXT_WIDTH = 200` px. `ANIMATED_TEXT_DURATION = 1000` ms is for floating damage numbers. [otc const.h](https://github.com/edubart/otclient/blob/master/src/client/const.h)
- Lifetime per message is `max(60 ms * chars, 3000 ms)`. Yells get double. A 50-char line lasts 3.0 s, a 100-char line 6.0 s, a 255-char line 15.3 s. [otc statictext.cpp](https://github.com/edubart/otclient/blob/master/src/client/statictext.cpp)
- Merging: a new message joins an existing StaticText only if it is at the same tile position with the same speaker name and the same mode. Otherwise it becomes a separate text, with no avoidance. At more than 10 queued lines the oldest one drops. Each line expires on its own timer, and the block re-composes when one does. [otc map.cpp](https://github.com/edubart/otclient/blob/master/src/client/map.cpp), [statictext.cpp](https://github.com/edubart/otclient/blob/master/src/client/statictext.cpp)
- The header line is "Name says:" / "whispers:" / "yells:". Colours are player say (239,239,0) yellow, NPC (95,247,247) cyan, and monster/spell/bark (254,101,0) orange. NPC lines carry no frame or bubble. They are outlined text in `verdana-11px-rounded`, wrapped at 275 px in `compose()`. The 200 px constant is declared but `compose()` wraps at 275. [statictext.cpp](https://github.com/edubart/otclient/blob/master/src/client/statictext.cpp)
- Anchoring: the text is placed at `transformPositionTo2D(tilePos)`, offset (+20, +5), centered and bottom-aligned. `boundRect.bind(parentRect)` clamps it inside the game view, which is how offscreen speakers are handled. Texts from other floors are skipped unless they have a message mode. [mapview.cpp](https://github.com/edubart/otclient/blob/master/src/client/mapview.cpp), [statictext.cpp](https://github.com/edubart/otclient/blob/master/src/client/statictext.cpp)
- Result: when a player speaks and walks away, the text stays on the tile where they spoke. That is Tibia's look, and it removes per-frame follow cost.

**RuneScape (2006Scape client deob)**
- Overhead chat sets `textCycle = 150` for players and `textCycle = 100` for NPC forced chat. A countdown clears the text at 0. [Game.java](https://github.com/2006-Scape/2006Scape/blob/master/2006Scape%20Client/src/main/java/Game.java) (lines ~5277, 6713, 8772, 1945-1960)
- The per-frame cap is `anInt975 = 50` overhead strings. Extra strings are not drawn. [Game.java](https://github.com/2006-Scape/2006Scape/blob/master/2006Scape%20Client/src/main/java/Game.java) (line ~12325, ~1602)
- Overlap: for each string k, the loop tests it against all earlier strings 0..k-1 with a 2 px margin. When it overlaps one, it sets y to that string's top and repeats until clear. This is an O(n²) greedy push upward, in draw order. [Game.java](https://github.com/2006-Scape/2006Scape/blob/master/2006Scape%20Client/src/main/java/Game.java) (lines ~1662-1679)
- Public chat filter modes are on, friends and off. The draw code checks `publicChatMode` and `isFriendOrSelf` before queueing a player's overhead text. [Game.java](https://github.com/2006-Scape/2006Scape/blob/master/2006Scape%20Client/src/main/java/Game.java) (line ~1600)

**Habitat and Habbo: the upward stream**
- Kurlander et al. describe Habitat's approach. The balloon appears over the latest speaker, older balloons lose their tails and scroll up, and balloons don't follow avatars. [Comic Chat, SIGGRAPH 96 PDF](https://discmaster.textfiles.com/file/16650/SIGGRAPH%201996:%20Proceedings.iso/pc/papers/kurlan/paper.pdf), [SIGGRAPH history entry](https://history.siggraph.org/?p=117000)
- Nitro (Habbo HTML5 clone), all from code:
  - A new bubble spawns at `left = speakerScreenX - width/2`, `top = chatAreaHeight - height`. [ChatWidgetMessageView.tsx](https://github.com/billsonnn/nitro-react/blob/dev/src/components/room/widgets/chat/ChatWidgetMessageView.tsx)
  - A web-worker interval moves every bubble up 15 px each tick. The tick is 3000 ms (fast), 6000 ms (normal) or 12000 ms (slow). [ChatWidgetView.tsx](https://github.com/billsonnn/nitro-react/blob/dev/src/components/room/widgets/chat/ChatWidgetView.tsx), [useChatWidget.ts](https://github.com/billsonnn/nitro-react/blob/dev/src/hooks/rooms/widgets/useChatWidget.ts)
  - Line mode shifts all bubbles up by exactly the space the new bubble needs. Free-flow mode pushes only the bubbles it overlaps, recursively, using an AABB test (`DoChatsOverlap`). [ChatWidgetView.tsx](https://github.com/billsonnn/nitro-react/blob/dev/src/components/room/widgets/chat/ChatWidgetView.tsx), [DoChatsOverlap.ts](https://github.com/billsonnn/nitro-react/blob/dev/src/api/room/widgets/DoChatsOverlap.ts)
  - A bubble is removed once `top < -2 * height`. Lifetime depends on room traffic, not text length.
  - Max bubble widths are 240 px (thin), 350 px (normal) and 2000 px (wide). The chat band height is a config percentage of the screen. [ChatWidgetMessageView.tsx](https://github.com/billsonnn/nitro-react/blob/dev/src/components/room/widgets/chat/ChatWidgetMessageView.tsx)
  - The room owner can tune mode, weight (width), speed, hearing distance and flood protection. [IRoomChatSettings.ts](https://github.com/billsonnn/nitro-react/blob/dev/src/api/navigator/IRoomChatSettings.ts), [Habbo Fandom: Guest room](https://habbo.fandom.com/wiki/Guest_room)
  - The bubble carries the speaker's head and takes its colour from their shirt. [habborator tips](https://habborator.org/tips/index.html)

**Roblox bubble chat (TextChatService)**
- `BubbleChatConfiguration` defaults: BubbleDuration 30 s, MaxBubbles 3 per user (oldest drops first), BubblesSpacing 6 px, MaxDistance 100 studs, MinimizeDistance 40 studs, TextSize 16, AdorneeName `HumanoidRootPart`. [bubble-chat.md](https://github.com/Roblox/creator-docs/blob/main/content/en-us/chat/bubble-chat.md), [BubbleChatConfiguration.yaml](https://github.com/Roblox/creator-docs/blob/main/content/en-us/reference/engine/classes/BubbleChatConfiguration.yaml)
- NPC bubbles go through `TextChatService:DisplayBubble(character, message)`. It is client-only, so the NPC bubble is a client presentation of a line. [bubble-chat.md](https://github.com/Roblox/creator-docs/blob/main/content/en-us/chat/bubble-chat.md)
- Legacy Roblox Lua BubbleChat:
  - Lifetime is `lerp(min, max, min(len/75, 1))`. That gives 8 to 15 s for your own messages and 12 to 20 s for others, so others' lines stay up longer. [BubbleChat.lua](https://github.com/Roblox/Core-Scripts/blob/master/CoreScriptsRoot/Modules/Server/ClientChat/BubbleChat/BubbleChat.lua)
  - Billboard max is 400 x 250 px. The height cap is what limits how many bubbles stack. Font 24 px, line height 34 px, tail 14 px, padding 30 px, fade speed 1.5. Messages truncate at 128 chars with "...".
  - Distance LOD: under 65 studs shows full bubbles, 65 to 100 shows the "distant" look, and beyond that is "very far".

**WoW**
- /say reaches 60 yards and /yell 400 yards on retail. Vanilla wikis list yell at 300 yards. Say and yell both show bubbles by default. [warcraft.wiki.gg Say](https://warcraft.wiki.gg/wiki/Say), [MACRO yell](https://warcraft.wiki.gg/wiki/MACRO_yell), [Vanilla wiki Chat](https://vanilla-wow-archive.fandom.com/wiki/Chat)
- The 10.0+ API is `C_ChatBubbles`, which addons like nBubble restyle. [nBubble](https://wowinterface.com/downloads/info27044-nBubble.html)

**Second Life (for range tiers)**
- LSL ranges: whisper 10 m, say 20 m, shout 100 m. [LSL wiki llSay](https://wiki.secondlife.com/wiki/LlSay)

**Comic and cartography placement**
- Comic Chat (1996) automated balloon construction and layout under reading-order rules. Microsoft later open-sourced it. I could not extract the Section 5 algorithm from the PDF. [Kurlander project page](https://www.kurlander.net/DJ/Projects/ComicChat/resources.html), [korben.info on source release](https://korben.info/en/comic-chat-irc-comic-strip-open-source.html)

### Inferences
- Lifetime rules converge on a floor plus a per-character rate. OTClient gives 3 s minimum and 60 ms/char, about 16.7 chars/s. That is close to normal adult reading speed with a margin. RuneScape uses a flat 3 s (2 s for NPCs), assuming the 317 client's 20 ms cycle. That cycle length is an inference, not verified in this file. Roblox gives 12 to 20 s, which suits casual chat but is too long for a busy MMO town.
- Tile anchoring (Tibia) versus sprite following (RuneScape, Roblox): on a 32 px grid with tile-to-tile movement, tile anchoring removes jitter and per-frame work. It also means a walking NPC's bark stays behind. For barks from walking NPCs, follow the sprite. For player chat and NPC replies in a conversation, both options work.
- Greedy push is order-dependent. Sort the queue by age (oldest first) so old bubbles keep their slots and new ones move. That avoids constant reshuffling, which reads as noise.
- Offscreen speakers: OTClient clamps to the viewport. A cheaper and clearer option for an MMO is to clamp plus draw a small edge arrow, but I found no 2D MMO source that does the arrow.

### Gaps
- No source code for Club Penguin, Animal Crossing or WoW bubble lifetimes. WoW bubble duration was not found.
- The Comic Chat Section 5 algorithm was not extracted. The cartography papers (Christensen, Marks and Shieber 1995 on simulated annealing) were not checked.
- No Minecraft mod (for example "Chat Heads" or "Chat Bubbles") source checked.

---

## Q2. How do games manage clutter in crowds?

### Takeaway
The levers are caps per speaker, caps per frame, distance tiers, channel filters and moving text to the log. Every system also keeps a full chat log, so dropping a bubble never loses the message.

### Cited findings
- Per speaker: Roblox MaxBubbles 3. OTClient keeps 10 merged lines per speaker block. [Roblox docs](https://github.com/Roblox/creator-docs/blob/main/content/en-us/chat/bubble-chat.md), [otc statictext.cpp](https://github.com/edubart/otclient/blob/master/src/client/statictext.cpp)
- Per frame: RuneScape caps at 50 overhead strings. [2006Scape Game.java](https://github.com/2006-Scape/2006Scape/blob/master/2006Scape%20Client/src/main/java/Game.java)
- Distance:
  - Roblox collapses a speaker's stack to one "..." bubble past 40 studs and hides it past 100. [Roblox docs](https://github.com/Roblox/creator-docs/blob/main/content/en-us/chat/bubble-chat.md)
  - Legacy Roblox uses three LOD tiers at 65 and 100 studs. [BubbleChat.lua](https://github.com/Roblox/Core-Scripts/blob/master/CoreScriptsRoot/Modules/Server/ClientChat/BubbleChat/BubbleChat.lua)
  - The TFS server sends `say` to spectators within the client viewport, ±8 x ±6 tiles on the same floor. It sends `yell` to ±18 x ±14 across floors. [TFS game.cpp internalCreatureSay](https://github.com/otland/forgottenserver/blob/master/src/game.cpp), [map.h](https://github.com/otland/forgottenserver/blob/master/src/map.h)
- Filters: RuneScape's public chat modes are on, friends and off. [Game.java](https://github.com/2006-Scape/2006Scape/blob/master/2006Scape%20Client/src/main/java/Game.java)
- Private channel for NPC talk: since Tibia 8.2-era protocols, players talk to NPCs on the NPC channel (`TALKTYPE_PRIVATE_PN`). NPC replies come back as `TALKTYPE_PRIVATE_NP`, sent only to that player through `doSayToPlayer`. Only the greeting is public. Five players buying potions therefore don't fill the screen with "Here you are." [TFS npc.cpp](https://github.com/otland/forgottenserver/blob/master/src/npc.cpp), [game.cpp playerSpeakToNpc](https://github.com/otland/forgottenserver/blob/master/src/game.cpp), [npchandler.lua say()](https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npchandler.lua)

### Inferences
- For Asterion, give each NPC reply two forms. The private reply goes to the focused player's dialog panel. A short public line is optional, at most 1 per NPC per few seconds, shown as a bubble so bystanders see the NPC is busy. That fixes the "wall of cyan text" seen in busy Tibia depots.
- Priority order when the cap is hit: own lines, then the NPC you are talking to, then party, then nearby players, then ambient barks. Barks should be the first thing dropped.

### Gaps
- No measured frame cost for 50+ overhead strings in any engine.

---

## Q3. Many players and one NPC: who gets the NPC?

### Takeaway
There are three models. Old Tibia used one focus plus a queue. Modern TFS uses multi-focus, where everyone talks at once in private and the NPC turns to face the first player. RuneScape and WoW use per-player private dialog. Multi-focus with private replies is the best fit for Asterion. It keeps Tibia's walk-up-and-say-hi flavour and removes queue griefing.

### Cited findings
- TFS 1.x NpcHandler:
  - `focuses` is a list, so any number of players can hold focus at once. Per-player state (`topic[cid]`, `talkStart[cid]`) is keyed by creature id. [npchandler.lua](https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npchandler.lua)
  - `updateFocus()` turns the NPC to face the first focus in the list. Facing is the only shared state.
  - Defaults: `talkRadius = 3` tiles, `idleTime = 120` s, `talkDelayTime = 1` s before each reply. Multi-line speeches (`doNPCTalkALot`) send lines at `(i-1) * interval + 700` ms. The interval is 4000 ms in the helper and 6000 ms when called through `say()` with a table.
  - Ending: walking past talkRadius triggers MESSAGE_WALKAWAY ("Goodbye.") and releases focus. Idle past 120 s triggers ungreet. "bye"/"farewell" are the default farewell words, and "hi"/"hello" the greetings. [npcsystem.lua](https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npcsystem.lua)
  - Releasing focus also closes the shop window and clears pending delayed lines and per-player shop state. That prevents a stale trade. [npchandler.lua releaseFocus](https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npchandler.lua)
  - Once focused, the NPC only processes the player's messages on the NPC channel. Before focus, public say also works, so "hi" in Default chat starts a conversation. [npchandler.lua onCreatureSay](https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npchandler.lua)
- Old Jiddo NPC system (TFS 0.3.x):
  - `NPCHANDLER_CONVBEHAVIOR` could be CONVERSATION_DEFAULT, which means one focus and a customer queue, or CONVERSATION_PRIVATE.
  - MESSAGE_PLACEDINQUEUE said roughly "please wait for your turn", with a |QUEUESIZE| tag. [otland thread, npc default lua](https://otland.net/threads/npc-default-lua.106750/), [otland 0.3.6 talk delay thread](https://otland.net/threads/8-6-tfs-0-3-6-npc-system-talk-delay-time.131786/)
- TFS has an `ALREADYFOCUSED` message ("|PLAYERNAME|, I am already talking to you.") for re-greets. [npchandler.lua](https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npchandler.lua)

### Inferences
- Queue griefing in single-focus mode: a player says "hi", then stands idle for up to idleTime and blocks everyone. With the 120 s default that is two minutes per griefer. Multi-focus removes it.
- Talking at once: in multi-focus, two players saying "yes" at the same tick each resolve against their own `topic[cid]`. No cross-talk happens because state is per player.
- Body blocking: the 3-tile talkRadius lets crowds trap an NPC behind a counter. Keep it at 3 to 4 tiles and let counters be talk-through.
- RuneScape and WoW private dialog: the NPC freezes or ignores others visually while per-player state runs on the server. I verified no RS server code this session, so this is from general knowledge and unverified.

### Gaps
- No primary source for RuneScape's server-side dialog session (2009scape dialogue plugin not read).
- No measured data on how often players blocked NPCs in old Tibia.

---

## Q4. Server authority: what goes over the wire, and how are choices validated?

### Takeaway
Tibia sends full text for every NPC line and parses free-typed keywords on the server. That is flexible and impossible to forge, since the client only sends words. It is also wasteful and blocks client-side localization. For Asterion, send line ids plus arguments and keep the session (NPC id, node id, allowed choices) on the server. Validate every choice against the node's allowed list and conditions. Use TFS's shop pattern of re-checking the item against the open merchant's list.

### Cited findings
- Client to server say (opcode 0x96): type byte, optional receiver string or channel u16, then the text string. Text over 255 chars is dropped. [TFS protocolgame.cpp parseSay](https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp)
- Server to client creature say (opcode 0xAA), in bytes:
  - opcode 1, statementId u32 4, name (u16 len + bytes), traded flag 1, level u16 2, type 1
  - position 5 (x u16, y u16, z u8), text (u16 len + bytes)
  - Fixed part: 18 bytes. Total is 18 + name length + text length. "Riona" saying "Greetings, Alice." is 18 + 5 + 17 = 40 bytes of payload. [protocolgame.cpp sendCreatureSay](https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp)
- Shop open (0x7A): NPC name, currency client id u16, currency name string, item count u16. Each item is client id u16, subtype 1, name string, weight u32, buy u32, sell u32, so 17 bytes + name. A 30-item shop with 12-char names is about 30 x 29 = 870 bytes plus a header (estimate from the layout). Close shop is 0x7C, 1 byte. [protocolgame.cpp sendShop/AddShopItem](https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp)
- Purchase (client to server): item id u16, count u8, amount u16, ignoreCap u8, inBackpacks u8, so 7 bytes after the opcode. The server rejects amount 0 or more than the stack size. It also requires `player->getShopOwner()` (an open shop with an NPC) and `hasShopItemForSale(id, subtype)`. [protocolgame.cpp parsePlayerPurchase](https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp), [game.cpp playerPurchaseItem](https://github.com/otland/forgottenserver/blob/master/src/game.cpp)
- Framing: outgoing packets are XTEA-encrypted and padded to multiples of 8 bytes, with a 4-byte checksum or sequence header and a 2-byte length. Messages are batched into a shared output buffer. Some client actions are queued with `DISPATCHER_TASK_EXPIRATION = 2000` ms, so stale actions drop after 2 s. [protocol.cpp](https://github.com/otland/forgottenserver/blob/master/src/protocol.cpp), [outputmessage.h](https://github.com/otland/forgottenserver/blob/master/src/outputmessage.h), [tasks.h](https://github.com/otland/forgottenserver/blob/master/src/tasks.h)
- Quest state in TFS NPC scripts is server Lua (storage values, `topic[cid]`). The client never sends "quest complete". It only sends text that the server matches. [npchandler.lua](https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npchandler.lua)

### Inferences
- Line-id protocol estimate for Asterion:
  - `npc_line`: opcode 1 + npc entity id u32 4 + line id u16 2 + arg count 1 + args (for example the player name as a u16-length string). That is about 8 to 20 bytes, against 40+ for full text.
  - `choice`: opcode 1 + session id u16 + choice index u8 = 4 bytes.
  - The client looks up the line in its localized string table. This also fixes text expansion, since German is +30% characters but costs 0 extra bytes.
- Session rules on the server:
  - one active session per player, with NPC id, node id, allowed choice indices and an expiry
  - drop it on distance over talkRadius, timeout, teleport or logout
  - reject choices not in the allowed set, and re-check conditions (gold, items, quest stage) when a choice is applied, not when it was offered
- Latency hiding: TFS already adds a 1 s artificial talk delay, so Tibia players expect the NPC to "think". For Asterion:
  - Play the NPC's turn-to-face and a "..." typing indicator on the client the moment "hi" or the interact key is sent. That is optimistic UI.
  - Start typewriting when the server line arrives. A 100 to 200 ms round trip then hides inside the greeting animation.
  - Never predict the result of a choice that changes state (buy, accept quest).
- The anti-spam gap in TFS: `playerSay` returns early for `TALKTYPE_PRIVATE_PN`, before the mute check and `removeMessageBuffer()`. NPC-channel messages are not counted by the chat flood buffer. Each one still costs the server a keyword parse for every NPC in view (`getSpectators`). Asterion needs its own per-player rate limit on NPC input. [game.cpp playerSay](https://github.com/otland/forgottenserver/blob/master/src/game.cpp)

### Gaps
- No Canary or CipSoft protocol diff checked (Canary 13.x may differ).
- No measured server CPU per keyword parse.

---

## Q5. Concrete chat rate limits

### Cited findings
- TFS:
  - `maxMessageBuffer = 4` in config.lua.dist. Each public message increments a counter, and the counter decays by 1 every 1500 ms in `onThink`. The 5th message inside the window mutes.
  - Mute length is `5 * n^2` seconds for the nth offense: 5, 20, 45, 80 s. Players are told "You are muted for N seconds."
  - Flag `PlayerFlag_CannotBeMuted` bypasses it.
  - [player.cpp addMessageBuffer/removeMessageBuffer](https://github.com/otland/forgottenserver/blob/master/src/player.cpp), [config.lua.dist](https://github.com/otland/forgottenserver/blob/master/config.lua.dist)
- Roblox legacy Lua chat:
  - `numberMessagesAllowed = 7` per `decayTimePeriod = 15` s, checked per channel. Bots (non-player speakers) bypass the check. [ChatFloodDetector.lua](https://github.com/Roblox/Core-Scripts/blob/master/CoreScriptsRoot/Modules/Server/ServerChat/DefaultChatModules/ChatFloodDetector.lua)
  - `MaximumMessageLength = 200`, and history keeps 50 messages per channel. [ChatSettings.lua](https://github.com/Roblox/Core-Scripts/blob/master/CoreScriptsRoot/Modules/Server/ClientChat/DefaultClientChatModules/ChatSettings.lua)
- Habbo/Nitro exposes per-room flood protection levels. [IRoomChatSettings.ts](https://github.com/billsonnn/nitro-react/blob/dev/src/api/navigator/IRoomChatSettings.ts)

### Inferences
- A starting budget for Asterion:
  - public chat: TFS-style leaky bucket, 4 messages and 1 per 1.5 s refill, with escalating mutes
  - NPC input: a separate bucket, about 3 per second with burst 5, silently dropped. NPC talk is legit-fast (hi, trade, yes), so the public limit would hurt it.
  - NPC public barks: at most 1 per NPC per 8 to 15 s, server-side

### Gaps
- No Discord or OSRS server limits checked.

---

## Q6. Building bubbles in Godot 4

### Cited findings
- `CanvasItem.get_global_transform_with_canvas()` gives the transform from local space to viewport coordinates. Use it to place a bubble on a CanvasLayer above a world sprite. [CanvasItem.xml (4.3)](https://github.com/godotengine/godot/blob/4.3-stable/doc/classes/CanvasItem.xml), [2D transforms docs](https://docs.godotengine.org/en/4.2/tutorials/2d/2d_transforms.html)
- Pixel snapping:
  - `rendering/2d/snap/snap_2d_transforms_to_pixel` and `snap_2d_vertices_to_pixel` both default to false and are read only at startup.
  - Control nodes snap by default through `gui/common/snap_controls_to_pixels`.
  - [ProjectSettings.xml (4.3)](https://github.com/godotengine/godot/blob/4.3-stable/doc/classes/ProjectSettings.xml)
- The MIT addon "Remote Transform Control" (Godot 4.2) makes a Control follow a 2D or 3D node from a separate canvas layer. Its listed uses include speech bubbles. [Asset Library](https://www.godotengine.org/asset-library/asset/edit/11561)
- A Hat in Time-style approach: compute the screen rect each frame and clamp it to the screen. [r/howdidtheycodeit thread](https://lr.eu.psf.lt/r/howdidtheycodeit/comments/1itglc1/how_did_they_made_those_speech_bubbles_in_a_hat)

### Inferences (recommended build, estimates not measured)
- One `BubbleLayer` (CanvasLayer) holds a pool of bubble nodes. Each bubble is a NinePatchRect frame, a Label (bitmap font) and a tail Sprite. Pool about 32 bubbles and never instance them at runtime.
- Use a Label, not a RichTextLabel, for overhead bubbles. RichTextLabel parses BBCode and is heavier per node. Keep it for the dialog panel.
- Each frame:
  1. Read the anchor's screen position with `get_global_transform_with_canvas().origin`, or the tile position for Tibia-style anchoring.
  2. Floor to an integer pixel.
  3. Sort active bubbles by spawn time.
  4. Run the RuneScape greedy push (O(n²), with n ≤ 32, so trivial).
  5. Clamp to the viewport minus a 4 px margin, and show an edge arrow when clamped.
- With a 640x360 SubViewport upscaled, render bubbles inside the low-res viewport so the bitmap font stays pixel-exact. A full-res UI layer gives crisper text but mixes texel densities.
- Wrap width: OTClient wraps at 275 px for a 480x352 game view, about 57% of the width. For a 32 px tile game at 640 px wide, about 160 to 200 px (5 to 6 tiles) is a sensible max.

### Gaps
- No measured draw-call or ms cost for N Labels in Godot 4 Compatibility/WebGL2. That needs a benchmark.

---

## Number sheet

| Item | Value | Source |
|---|---|---|
| OTClient lifetime | max(60 ms x chars, 3000 ms), yell x2 | otc const.h / statictext.cpp |
| OTClient wrap | 275 px (const 200 px declared) | statictext.cpp / const.h |
| OTClient lines per speaker block | 10, oldest drops | statictext.cpp |
| OTClient NPC colour | RGB 95,247,247 | statictext.cpp |
| RS overhead lifetime | 150 cycles player, 100 cycles NPC (about 3 s / 2 s at 20 ms, inferred) | 2006Scape Game.java |
| RS overhead cap | 50 strings per frame | 2006Scape Game.java |
| Habbo scroll | 15 px every 3/6/12 s | Nitro ChatWidgetView / useChatWidget |
| Habbo bubble max width | 240 / 350 / 2000 px | Nitro ChatWidgetMessageView |
| Roblox bubble | 30 s, 3 per user, 6 px gap, minimize 40, hide 100 studs | creator-docs |
| Roblox legacy lifetime | 8-15 s self, 12-20 s others, by len/75 | BubbleChat.lua |
| Roblox legacy limits | 128-char bubble, 400x250 px billboard, 7 msgs/15 s | BubbleChat.lua / ChatFloodDetector.lua |
| TFS talk radius / idle | 3 tiles / 120 s | npchandler.lua |
| TFS reply delay | 1 s; multi-line 700 ms + 4-6 s per line | npchandler.lua |
| TFS say range | ±8 x ±6 tiles; yell ±18 x ±14 | game.cpp, map.h |
| TFS flood | 4-msg bucket, -1 per 1.5 s, mute 5n² s | player.cpp, config.lua.dist |
| TFS max say length | 255 chars | protocolgame.cpp |
| TFS 0xAA say packet | 18 B + name + text | protocolgame.cpp |
| TFS shop item | 17 B + name | protocolgame.cpp |
| TFS purchase packet | 7 B + opcode | protocolgame.cpp |
| WoW say / yell | 60 yd / 400 yd | warcraft.wiki.gg |
| SL whisper/say/shout | 10 / 20 / 100 m | wiki.secondlife.com |

## Sources
- https://github.com/edubart/otclient/blob/master/src/client/statictext.cpp
- https://github.com/edubart/otclient/blob/master/src/client/const.h
- https://github.com/edubart/otclient/blob/master/src/client/map.cpp
- https://github.com/edubart/otclient/blob/master/src/client/mapview.cpp
- https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npchandler.lua
- https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npcsystem.lua
- https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
- https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- https://github.com/otland/forgottenserver/blob/master/src/npc.cpp
- https://github.com/otland/forgottenserver/blob/master/src/player.cpp
- https://github.com/otland/forgottenserver/blob/master/src/map.h
- https://github.com/otland/forgottenserver/blob/master/src/protocol.cpp
- https://github.com/otland/forgottenserver/blob/master/src/outputmessage.h
- https://github.com/otland/forgottenserver/blob/master/src/tasks.h
- https://github.com/otland/forgottenserver/blob/master/config.lua.dist
- https://otland.net/threads/npc-default-lua.106750/
- https://otland.net/threads/8-6-tfs-0-3-6-npc-system-talk-delay-time.131786/
- https://github.com/Roblox/creator-docs/blob/main/content/en-us/chat/bubble-chat.md
- https://github.com/Roblox/creator-docs/blob/main/content/en-us/reference/engine/classes/BubbleChatConfiguration.yaml
- https://github.com/Roblox/Core-Scripts/blob/master/CoreScriptsRoot/Modules/Server/ClientChat/BubbleChat/BubbleChat.lua
- https://github.com/Roblox/Core-Scripts/blob/master/CoreScriptsRoot/Modules/Server/ServerChat/DefaultChatModules/ChatFloodDetector.lua
- https://github.com/Roblox/Core-Scripts/blob/master/CoreScriptsRoot/Modules/Server/ClientChat/DefaultClientChatModules/ChatSettings.lua
- https://github.com/billsonnn/nitro-react/blob/dev/src/components/room/widgets/chat/ChatWidgetView.tsx
- https://github.com/billsonnn/nitro-react/blob/dev/src/components/room/widgets/chat/ChatWidgetMessageView.tsx
- https://github.com/billsonnn/nitro-react/blob/dev/src/hooks/rooms/widgets/useChatWidget.ts
- https://github.com/billsonnn/nitro-react/blob/dev/src/api/room/widgets/DoChatsOverlap.ts
- https://github.com/billsonnn/nitro-react/blob/dev/src/api/navigator/IRoomChatSettings.ts
- https://habbo.fandom.com/wiki/Guest_room
- https://habborator.org/tips/index.html
- https://github.com/2006-Scape/2006Scape/blob/master/2006Scape%20Client/src/main/java/Game.java
- https://discmaster.textfiles.com/file/16650/SIGGRAPH%201996:%20Proceedings.iso/pc/papers/kurlan/paper.pdf
- https://history.siggraph.org/?p=117000
- https://www.kurlander.net/DJ/Projects/ComicChat/resources.html
- https://korben.info/en/comic-chat-irc-comic-strip-open-source.html
- https://warcraft.wiki.gg/wiki/Say
- https://warcraft.wiki.gg/wiki/MACRO_yell
- https://vanilla-wow-archive.fandom.com/wiki/Chat
- https://wowinterface.com/downloads/info27044-nBubble.html
- https://wiki.secondlife.com/wiki/LlSay
- https://github.com/godotengine/godot/blob/4.3-stable/doc/classes/CanvasItem.xml
- https://github.com/godotengine/godot/blob/4.3-stable/doc/classes/ProjectSettings.xml
- https://docs.godotengine.org/en/4.2/tutorials/2d/2d_transforms.html
- https://www.godotengine.org/asset-library/asset/edit/11561
- https://lr.eu.psf.lt/r/howdidtheycodeit/comments/1itglc1/how_did_they_made_those_speech_bubbles_in_a_hat
