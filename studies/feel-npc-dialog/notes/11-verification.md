# 11. Verification of disputed numbers

Checked 2026-11-11 against raw source on GitHub (master/main branches on that date) and primary write-ups. Line numbers refer to those branch heads and will drift.

## 1. OTClient speech colours, duration, wrap, stacking

Verdict: both agents were partly right. NPC speech is cyan #5FF7F7 (95,247,247). Player say, whisper and yell are yellow #EFEF00 (239,239,0) in C++ and #FFFF00 in the Lua console table. NPC lines turn yellow only when the server sends them as a plain `Say` (for example TFS barks with `TALKTYPE_SAY`). Private NPC replies use `MessageNpcFrom` and get cyan. Monster speech, spells and barks are orange (254,101,0).

- edubart `src/client/statictext.cpp` L122-141. Say gets `m_color = Color(239, 239, 0);`. NpcFrom gets `m_color = Color(95, 247, 247);`.
- mehah `src/client/statictext.cpp` L114-117 defines `MESSAGE_COLOR1(239, 239, 0)` ... `MESSAGE_COLOR3(95, 247, 247)`. NpcFrom uses COLOR3 at L140.
- edubart `modules/game_console/console.lua` L3 `say = { ... color = '#FFFF00' }`. L11 `privateNpcToPlayer = { speakType = MessageModes.NpcFrom, color = '#5FF7F7'`. L1048-1066 creates the StaticText and strips `{keyword}` braces for NPC modes before display.

Duration. Confirmed as max(60 ms x chars, 3000 ms), doubled for yells.
- edubart `statictext.cpp` L81-83 `std::max<int>(Otc::STATIC_DURATION_PER_CHARACTER * text.length(), Otc::MIN_STATIC_TEXT_DURATION)` then `if(isYell()) delay *= 2;`
- edubart `src/client/const.h` L40-41 `STATIC_DURATION_PER_CHARACTER = 60,` and `MIN_STATIC_TEXT_DURATION = 3000,`.
- mehah reads the same values from config. `src/client/gameconfig.h` L133-134 (`m_staticDurationPerCharacter{ 60 }`, `m_minStatictextDuration{ 3000 }`), `data/setup.otml` L37-38. mehah adds `if (g_app.mustOptimize()) delay /= 2;` (statictext.cpp L78-79).

Wrap width. Confirmed 275 px. edubart L154 and mehah L153 `m_cachedText.wrapText(275);`. Note that `MAX_STATIC_TEXT_WIDTH = 200` in edubart const.h L42 is unused here.

Max stacked messages. 11 per speaker. The check is `m_messages.size() > 10` (edubart L76, mehah L69), which pops the oldest before pushing. Stacking only merges lines from the same name and same mode (L71 `m_name != name || m_mode != mode` returns false).

## 2. TFS NPC focus and timings

Verdict: the NPC faces the FIRST talker still in its focus list, not the latest.
- `data/npc/lib/npcsystem/npchandler.lua` L144 `self.focuses[#self.focuses + 1] = newFocus` appends new talkers.
- L165-173 `updateFocus()` loops `for pos, focus in pairs(self.focuses)` and calls `doNpcSetCreatureFocus(focus)` then `return` on the first hit.
- onThink calls `updateFocus()` every tick (L500-507), so the NPC snaps back to the earliest talker.
- `src/npc.cpp` L505-509 `focusCreature = creature->getID(); turnToCreature(creature);`. L396 `if (focusCreature != 0) return false;` stops the NPC walking while focused.

Timings, all confirmed in npchandler.lua L67-69:
- `idleTime = 120,` (seconds, checked against `os.time() - self.talkStart[focus]` at L504)
- `talkRadius = 3,`
- `talkDelayTime = 1, -- Seconds to delay outgoing messages.`

Chat flood rule. Confirmed with one correction to the refill wording.
- `config.lua.dist` L97 `maxMessageBuffer = 4`.
- `src/player.cpp` L1564-1567 refill. `if (MessageBufferTicks >= 1500)` then `addMessageBuffer();`, so one message credit returns every 1.5 s.
- L1632 `uint32_t muteTime = 5 * muteCount * muteCount;` (seconds). L1633 increments the count per offence. The mute triggers on the 5th message inside the window (`++MessageBufferCount > maxMessageBuffer`, L1625).
- `src/game.cpp` L3563 `player->removeMessageBuffer();` runs on every playerSay.

## 3. Canary NPCs

Verdict: talk radius 4 confirmed. No idle timeout exists in the Lua handler. Ambient barks at 15 s with 50% chance are per-NPC data, not an engine default. Braces are standard in greetings. Unlike TFS, Canary turns to the LATEST talker.
- `data/npclib/npc_system/npc_handler.lua` L84 `talkRange = 4,`. L76-77 `talkDelay = 300, -- Delay from each messages` and `talkDelayTimeForOutgoingMessages = 1`.
- `src/creatures/npcs/npc.cpp` L535 `bool Npc::canInteract(const Position &pos, uint32_t range /* = 4 */)`. `src/lua/functions/creatures/npc/npc_functions.cpp` L364 `npc:isInTalkRange(position[, range = 4])`.
- Idle. The handler table has no `idleTime` field and `onThink` (L517-524) only runs callbacks. `talkStart` is set (L469-472) but never compared. Conversations end on farewell or walking out of range (npc.cpp L1271).
- Facing. npc.cpp L1162-1164 `playerInteractionsOrder.push_back(playerId); turnToCreature(creature);`. On release L1178-1180 turns to `playerInteractionsOrder.back()`.
- Barks. npc.cpp L1058-1067 `onThinkYell` fires when `yellTicks >= npcType->info.yellSpeedTicks`, then rolls `yellChance >= uniform_random(1, 100)`. A sample of 40 NPC files (every 25th of 1036 in `data-otservbr-global/npc/`) had 8 with voices, all `interval = 15000, chance = 50`. Example `data-otservbr-global/npc/al_dee.lua` L28-30.
- Braces. Example greeting `"Welcome on board, |PLAYERNAME|. Where can I {sail} you today?"`. The client strips braces in the overhead text (OTClient console.lua L1053-1061) and highlights them in the NPC channel.

## 4. pokeemerald text speed and down arrow

Verdict: table values 8/4/1 confirmed, default is Mid. Real cost is one frame more per character, so 9/5/2 frames. The arrow bob holds 9 frames per step with offsets 0,1,2,1.
- `src/menu.c` L77-81 `[OPTIONS_TEXT_SPEED_SLOW] = 8,` `[..._MID] = 4,` `[..._FAST] = 1`. L484-485 resets invalid values to MID.
- `src/new_game.c` L93 `gSaveBlock2Ptr->optionsTextSpeed = OPTIONS_TEXT_SPEED_MID;`
- `src/text.c` L947-961. When `delayCounter` is nonzero it decrements and returns. Otherwise it prints one glyph and sets `textPrinter->delayCounter = textPrinter->textSpeed;`. `RunTextPrinters` (L319-345) calls `RenderFont` once per frame, so speed N costs N+1 frames per char. Holding A/B after a press zeroes the delay (L944-945, L950-954). Auto-scroll forces delay 3 (L958-959).
- `src/text.c` L75 `static const u8 sDownArrowYCoords[] = { 0, 1, 2, 1 };`. L832-833 `subStruct->downArrowDelay = 8;` then `downArrowYPosIdx++`. The draw frame plus 8 countdown frames gives 9 frames per step, a 36-frame cycle (0.6 s at 60 fps). `include/text.h` L63 `u8 downArrowYPosIdx:2;` wraps the index.
- Side note. `sWindowVerticalScrollSpeeds` in text.c L76-80 (1/2/4 px per frame) is scroll speed, not text speed.

## 5. RPG Maker MV corescript (rpgtkoolmv/corescript)

Verdict: all four confirmed. Balloons are 48x48, 8 frames, 8 game frames each, plus 12 frames of hold.
- `js/rpg_windows/Window_Base.js` L114-116 `this.openness += 32;`. Openness runs 0 to 255, so opening takes 8 frames.
- `js/rpg_windows/Window_Message.js` L305-309 `case '.': this.startWait(15);` and `case '|': this.startWait(60);`. L337 the pause before the next page waits 10 frames.
- `js/rpg_windows/Window_Base.js` L28-29 `Window_Base._faceWidth  = 144;` `Window_Base._faceHeight = 144;`.
- `js/rpg_sprites/Sprite_Balloon.js` L48-49 `var w = 48; var h = 48;`. L34 `this._duration = 8 * this.speed() + this.waitTime();`. L55-61 speed 8, waitTime 12. L65 `return 7 - Math.max(Math.floor(index), 0);`. Total 76 frames per balloon.

## 6. Dialogue Manager (nathanhoad/godot_dialogue_manager)

Verdict, from the GitHub API on 2026-11-11:
- Latest release v4.2.0, published 2026-10-30. https://github.com/nathanhoad/godot_dialogue_manager/releases/tag/v4.2.0. Previous were v4.1.0 (2026-09-04) and v4.0.3 (2026-08-19).
- Licence MIT (`"spdx_id": "MIT"`).
- Stars 3,977. Last push 2026-11-06.

## 7. Recent claims

(a) PUBG Ally. The ~1.6 s figure is real but comes from Krafton's arXiv technical report, not the NVIDIA blog. Ally runs on the player's GPU, so Krafton's live cost is $0. The per-match figures are what cloud LLMs would have cost in Krafton's comparison.
- Inven Global, Doohyun Lee, 2026-09-29. https://www.invenglobal.com/articles/26592/built-a-teammate-got-a-chat-partner-kraftons-first-scorecard-for-pubg-ally. Quotes: "a single voice exchange took approximately 1.6 seconds for the on-device model", "roughly 3.4 seconds for the cloud". Median API cost per match "$5.14 to $7.10" for Claude Opus 4.8, "$3.70 to $5.17" for Claude Sonnet 4.6, "$0.02 to $0.06" for Gemma 4 31B.
- alphaxiv listing of the report, submitted 2026-09-25. https://www.alphaxiv.org/abs/2609.29837. It gives medians of 1.62 s on-device and 3.36 s cloud. I did not open the arXiv PDF itself, so the exact table is unchecked.
- NVIDIA developer blog, Phillip Singh, 2026-06-25. https://developer.nvidia.com/blog/how-krafton-built-pubg-ally-a-co-playable-character-powered-by-nvidia-ace/. Model is Mistral-NeMo-Minitron-2B, quantized, "run on GPUs with as little as 8GB of total VRAM". "NVIDIA ACE and custom AI models run on-device". It gives no latency numbers.

(b) Where Winds Meet. Confirmed that players exploited the AI chat NPCs soon after the global launch (14 Nov 2025). "Within days" is a stretch. The dated report I found is about 2.5 weeks after launch.
- Outlook Respawn, 2 Dec 2025. https://respawn.outlookindia.com/gaming/gaming-news/where-winds-meet-ai-exploit-lets-players-skip-quests
- GamesRadar. https://www.gamesradar.com/games/action-rpg/where-winds-meet-players-find-a-way-to-skip-side-quests-by-manipulating-the-mmos-ai-chatbot-npcs-into-just-giving-over-the-goods-instead. Players repeat the NPC's last line as a question ("Solid Snake method") or claim the riddle is solved, and the NPC hands over the reward.
- OpenCritic news 24007 and 24047 cover the same exploits. Date not shown in search results.

(c) Yarn Spinner for Godot (GDScript). Confirmed YSPL, version 1.0, with a no-AI-training clause.
- https://raw.githubusercontent.com/YarnSpinnerTool/YarnSpinner-Godot-GDScript/main/LICENSE.md, L1-3 "Yarn Spinner Public Licence (YSPL)", "Version 1.0". File last changed 2026-02-27.
- L95-101 "3.3 No AI Training". It bars using the code to "train, fine-tune, or otherwise improve any artificial intelligence system". It also bars datasets and scraping for code-gen tools.
- L105-109. AI tools may be used to build games and write Yarn scripts. Users must take "reasonable steps" so tools don't send the source for training.
- L82-93 "3.2 Non-Competition" is a second restriction worth flagging.
- FAQ https://yarnspinner.dev/license/ says the GDScript and Unreal ports use YSPL and the core stays MIT. The GDScript guide calls the port alpha.
