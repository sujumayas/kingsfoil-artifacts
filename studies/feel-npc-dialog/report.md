# Top-down pixel NPCs and dialog: bubbles, boxes, portraits, quest givers and the feel of talking to a world

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #1 of a new series, **Game feel**. Each study takes one player interaction and researches how it feels, how it looks in pixel art, how the systems behind it work and what it costs. The eight earlier studies in the library were VFX, from snow to fog [S1]. Study #5 covered Tibia's light model. None touched UI or NPCs.

The interaction here is talking to the people of a world, from the first "hi" to bubbles, boxes, portraits, quest markers, shops, townsfolk and the small sounds that make text feel spoken.

The reference is Tibia. A Tibia NPC is a chat parser with a 3-tile radius. You say "hi", type keywords and say "bye". The server delays every reply by 1 s on purpose, and many players can talk to the same NPC at once, each with private replies [V, S4, S9]. Almost every problem in this study shows up in that one design. Keywords are hard to guess, cyan text piles up in a busy depot, and all of it lives on the server.

**Four equal priorities.**
- **Feel and pixel art.** Timing, readability at low resolution, charm and sound.
- **MMO problems.** Many players and one NPC, bubble clutter, server-authoritative quest state, latency, anti-spam and bytes per line.
- **Authoring.** Dialog formats and tools, branching, conditions, localization and text expansion.
- **Runtime cost.** Bitmap fonts against vector text, draw calls, many bubbles, memory, on a weak web build. Every cost is measured or labelled as an estimate.

**Targets.**
- Godot 4, web-first, so the **Compatibility renderer** (WebGL 2), plus mobile and desktop.
- Top-down 3/4 pixel art on 32x32 tiles for the Tibia-like MMORPG **Asterion Online**, where many players share one town and its NPCs, and for a single-player top-down RPG.
- Phones and old laptops.

**Sources.** Eleven research notes, our **NPC Dialog Sandbox** [S2] and our text benchmark [S3]. Most hard numbers come from source code (Tibia servers and client, rAthena, RuneScape and UO clients, Pokémon and Zelda decompilations, RPG Maker, Stardew, Ren'Py, Dialogic, Roblox and Habbo chat). Note 11 re-checked every disputed number against raw source, and this report follows it. The benchmark ran on an Apple M4 Pro in Chromium 153. **No phone was measured.**

---

## 1. Executive summary

**Feel and pixel art.**

1. **Speed is stored as frames per glyph, and the real cost is one frame more than the table says.** Emerald's table holds 8, 4 and 1, but the printer spends 9, 5 and 2 frames, so Slow, Mid and Fast print about 6.7, 12 and 30 glyphs per second [V, S57, S56]. Stardew types one character per 30 ms, about 33 cps [V, S73]. A default near 20 cps with hold-to-fast-forward and an instant option covers every reader [I].
2. **First press completes, second advances, and a guard stops mashing.** ALttP waits 28 frames after a page [V, S66], Stardew 750 ms after a new box [V, S73]. On a laggy MMO this keeps a line that lands under a mash from being skipped unread [I].
3. **Charm lives in small integer motions.** Emerald's arrow bobs 0, 1, 2, 1 px at 9 frames per step [V, S56], its `!` emote hops 15 px on integer gravity [V, S61], and RPG Maker opens a window in 8 frames [V, S88]. None of it costs a measurable millisecond.
4. **Portraits are cheap when small and layered.** 48x48 and 64x64 are common [V, S85, S71]; in a shared town, acting with the overworld sprite covers less of other players' view [I].

**MMO problems.**

5. **Modern Tibia servers are multi-focus with private replies.** TFS keeps a focus list with a topic per player and answers privately, so five shoppers do not flood the screen [V, S4, S9]. TFS faces the first talker in focus, Canary the latest [V, S4, S20]. The old single-focus queue let one idle player block an NPC for up to 120 s [V, S17; I].
6. **Bubble clutter has cheap answers and no clever one.** OTClient pins text to the tile [V, S24], RuneScape pushes lines up until clear, capped at 50 [V, S31], and Habbo scrolls bubbles up 15 px per tick [V, S45]. A short lifetime, a per-speaker cap, a priority order and the log as overflow are enough [I].
7. **Send line ids, not text.** A Tibia NPC line costs 18 bytes plus name and text, 86 bytes for a 62-character greeting [V, S15, S22]. A line id with a small argument is 8 bytes [I]. The win is localization and authority, not bandwidth [I].
8. **TFS does not rate-limit NPC talk.** Public chat has a 4-message bucket with a credit back every 1.5 s and mutes of 5n² seconds [V, S12], but NPC-channel messages skip that check [V, S11]. Asterion needs its own NPC bucket [I].

**Authoring.**

9. **Dialogue Manager is the client default.** MIT, pure GDScript, web-exportable, PO and CSV built in, v4.2.0 on 2026-10-30 [V, S150, S151]. Ink suits a non-Godot server, saving each player's state as one JSON string [V, S141]. C# Godot integrations are out, because C# projects cannot export to web [V, S155]. Yarn's GDScript port carries the custom YSPL [V, S148].
10. **Short text, objective first.** Kaplan capped WoW quest text at 511 characters and wanted less [V, S107]; 37.7% in a 2024 WoW poll answered "Quest text?" [V, S102]. Budget 30% expansion on long lines and up to 300% on short labels [V, S160].

**Runtime cost.**

11. **Text is cheap until thousands of glyphs redraw every frame.** On the M4 GPU, 2,000 glyph blits cost 2.39 ms at 320x180, 9.12 ms with a 6x CPU throttle. A 192-glyph typewriter box with a wave costs the same as a static one [V, S3].
12. **Cache each bubble once.** 50 redrawn bubbles cost 2.95 ms (10.51 ms throttled); cached, 0.47 ms (1.13 ms) [V, S3]. In Godot, keep RichTextLabel effects on the one open box, because they redraw every frame [V, S196].

**Recommendation for Asterion** [I]. One server session per player answers intents with line ids. NPCs are multi-focus, face the first talker and reply privately, with an optional short public line. The client opens the box at once and plays the greeting while the line is in flight. A typewriter at 20 cps with punctuation pauses, a press guard and a 0, 1, 2, 1 arrow. Cached bubbles placed by a priority-sorted greedy push, clamped with edge chips. Markers use shape for kind and a second cue for state. Barks are server rules with expiring facts. Section 7 has the layers, §8 the Sandbox.

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: code, docs, wiki or article, or our own measurement [S3]. "[V, vendor]" and "[V, self-reported]" mark figures reported by their own authors. |
| **[I]** | Author inference or design proposal. Untested unless it says "Sandbox", and then tested only in our JavaScript prototype. |
| **[U]** | Unverified: memory, a search snippet, or a page that could not be fetched. Treat it as a lead. |
| **[K]** | Textbook or canonical knowledge (release years, console frame rates). |

- [S#] refers to §14. "[I, note 0X]" is an inference made by the researcher in that note.
- Ratings (1 to 5) are author judgement, in this order: **Clarity · Charm · MMO fit · Authoring · Speed**.
- **Clarity** is how fast a player reads it and acts. **Charm** covers pixel art, motion and sound. **MMO fit** is how it holds up with many players, a server and latency. **Authoring** is how cheap it is for a small team to write and localize for. **Speed** is runtime cost on low-end web.
- **Speed follows the measurements** [S3]. 5 is a few hundred blits, a cached image or server work; 4 needs care at crowd scale; 1 to 3 means seconds of latency or missing hardware.
- **Measured numbers are desktop numbers.** The 6x throttle slows only the CPU and SwiftShader has no GPU. Trust ratios over milliseconds.
- Frame counts assume 60 fps for GBA, Game Boy and SNES [K]; Undertale runs at 30 fps [V, S69]. Sandbox numbers are illustrative.

---

## 3. Generations: a timeline

**Gen 1: words in a box and words over heads (1986–1999)**
- **1986** Habitat scrolls older balloons up, away from the avatars [V, S49]. **1991** A Link to the Past blips on every glyph and sets speed per message [K; V, S66].
- **1994** MOTHER 2 ships window flavours and pauses counted in 1/60 s [K; V, S76, S75]. **1997** Tibia and Ultima Online launch with overhead speech; UO keeps a journal [K; V, S42, S43].

**Gen 2: MMO towns and handheld polish (2000–2008)**
- **2000** Pokémon Crystal stores text speed as 5, 3 and 1 frames [K; V, S63]. **2002** Ragnarok Online opens NPCs as modal script windows with painted cutins [K; V, S37].
- **2004** Pokémon Emerald's printer, emote hop and bobbing arrow [K; V, S56, S61]; WoW launches with yellow and grey `!` and `?` and a log of 20 [K; V, S97, S100].
- **2005** WoW 1.3.0 adds the first objective tracker [V, S100]. **2007** Blue daily markers; the AutoSelect addon skips gossip [V, S99, S111].
- TFS 0.3 offers one NPC focus with a queue or private talk (2008 onward) [V, S17; U on date].

**Gen 3: guidance, voice and indie acting (2009–2017)**
- **2009** Kaplan caps quest text at 511 characters; WoW 3.3 maps quest areas [V, S107, S108]. **2011** rAthena clients add clickable place links in NPC text [V, S37].
- **2012** Ruskin presents rule-matched barks at GDC; Guild Wars 2 ships renown hearts [V, S163; K; V, S119]. **2014** ESO launches, later fully voiced [K; V, S120].
- **2016** Stardew's one-string dialog and 64x64 portraits [K; V, S70].
- **2017** Night in the Woods ships on Yarn Spinner; Firewatch explains its interruptible dialog [V, S149, S165].

**Gen 4: mobile, skip and summary (2018–2024)**
- **2018** Celeste's text tags and looping voices [K; V, S67, S172]. **Oct 2018** OSRS Mobile with long-press menus [V, S35].
- **Apr 2020** WoW changes `!` and `?` for the first time in 16 years [V, S101]. **Aug 2020** FFXIV 5.3 cuts about 13% of ARR's main quests [V, S116].
- **Dec 2022** WoW raises the quest log to 35 [V, S103]. **2023** Blizzard promises icons that do not rely on colour shades [V, S105].
- **Jul 2024** A WoW poll finds 37.7% answer "Quest text?" [V, S102]. **2024** FFXIV 7.0 performs quest steps from the duty list [V, S117].

**Gen 5: current tools, measured costs and LLM NPCs (2025–2026)**
- **Mar 2025** Godot merges the two-pass Label shadow fix for 4.5 [V, S193]. **Jun 2025** Honkai: Star Rail announces skip with a story summary [V, S132].
- **Nov 2025** Where Winds Meet ships LLM chat on side quest-givers; a dated exploit report follows 2.5 weeks later [V, S198, S200]. **Feb 2026** Yarn's GDScript port opens under the YSPL [V, S147].
- **Sep 2026** Krafton's PUBG Ally scorecard, a median 1.6 s per exchange on-device [V, S204]. **Oct 2026** Dialogue Manager v4.2.0 [V, S151]. **Nov 2026** Our text benchmark [V, S3].

---

## 4. Technique profiles

There are eight families:

- **A.** Classic roots
- **B.** Overhead text and speech bubbles
- **C.** The dialog box
- **D.** Portraits and acting
- **E.** Quest givers
- **F.** Shops and services
- **G.** Ambient life, audio and accessibility
- **H.** Systems and authoring

Each profile ends with ratings for **Clarity · Charm · MMO fit · Authoring · Speed** (1 = poor, 5 = excellent; author judgement). A is the history we copy from, B to D what the player sees and hears, E and F the jobs NPCs do, G the town around them, and H the server and writing pipeline. Measured figures come from our benchmark [S3].

### Family A: Classic roots

### A1. Tibia keyword NPCs: "hi", keywords and "bye" in a 3-tile radius

*In plain words.* You walk up and type "hi". The NPC greets you by name, and you type words from its replies ("trade", "job", "passage") to move through a keyword tree. "bye", walking away or two minutes of silence ends the talk.

*How it works (technical).*
- **Session** [V, S4, S5]. Greet `{"hi", "hello"}`, farewell `{"bye", "farewell"}`, `talkRadius = 3` tiles (Chebyshev), `idleTime = 120` s, `talkDelayTime = 1` s before every reply. The idle clock resets only when a keyword matched.
- **Matching** [V, S7, S6]. `msgcontains` is a substring match with a word-boundary guard; a `KeywordNode` tree with `lastNode[cid]` lets "yes" answer the last question.
- **Channel** [V, S10, S28]. After focus the NPC only hears the NPC channel (`TALKTYPE_PRIVATE_PN = 12`) and answers privately (`TALKTYPE_PRIVATE_NP = 10`). Closing the "NPCs" tab counts as goodbye.
- **Keyword links** [V, S28, S21]. "I {trade} with weapons and armor." OTClient makes `{trade}` clickable and strips the braces from the overhead copy.

*Cost / performance.* A string match per message per NPC in view, on the server. A reply is one packet of 18 bytes plus name plus text [V, S15].

*Games that used it.*
- Tibia (TFS NPC handler): https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npchandler.lua
- Tibia manual, NPCs: https://www.tibia.com/gameguides/?subtopic=manual&section=npcs

*How it feels.* Like talking, not clicking. The 1 s delay makes the NPC seem to think and hides latency [I, note 01]. New players hate guessing keywords; the brace links fix that with no server change [I].

*Risks.* English keywords break under translation, phones make typing slow (F4), and NPC talk has no rate limit in TFS (H3).

*Ratings 1–5 (author judgement):* Clarity 3 · Charm 3 · MMO fit 5 · Authoring 3 · Speed 5

### A2. RuneScape: chatbox dialog with chatheads, overhead lines for barks

*In plain words.* Conversations run in a chatbox panel with an animated head of the speaker. Overhead text is only for public chat and short NPC barks, one line per character.

*How it works (technical).*
- **Dialog types** [V, S34]. `chatnpc`, `chatplayer`, `messagebox`, `mes`, and `npc_say` for yellow overhead text.
- **Chatheads** [V, S34]. Expressions (`happy`, `quiz`, `shock`) come in four variants picked by the box's line count, so the mouth moves about as long as the text is long.
- **Lifetime** [V, S30, S31]. `textCycle = 150` for typed chat and 100 for NPC lines, about 3 s and 2 s if a cycle is 20 ms [I, note 01; cycle unconfirmed].
- **Effects** [V, S32, S33]. Wave, shake, slide, scroll, flash, glow, rainbow as `colour:effect:Message`; a viewer option turns them off.

*Cost / performance.* At most 50 overhead texts per frame and one head model in the panel [V, S30].

*Games that used it.*
- RuneScape 317 client: https://github.com/MatthewBishop/rs317/blob/master/src/Client.java
- OSRS chat effects: https://oldschool.runescape.wiki/w/Chat_effects

*How it feels.* Clear and private, with chathead acting as the charm. Picking the animation by line count is a cheap lip-sync trick [I, note 01].

*Risks.* A fixed 2 to 3 s lifetime is too short for a 60-character line. Chatbox size and option limits were not verified [U, note 01].

*Ratings 1–5 (author judgement):* Clarity 4 · Charm 4 · MMO fit 4 · Authoring 3 · Speed 5

### A3. Ragnarok Online: `mes`, `next`, `select` and a painted cutin

*In plain words.* Clicking an NPC opens a private modal window. The script prints lines, waits for Next, offers a menu, and can show a large painted portrait in a screen corner.

*How it works (technical).*
- **Commands** [V, S37]. `mes` prints, `next` pages, `close` ends, `close2` closes and keeps running, `select("Yes:No")` returns 1-based, `input` asks for a value, `^RRGGBB` colours.
- **Cutin** [V, S37]. `cutin "<file>",<pos>`, typically about 320x480; images near 700x700 freeze the client briefly.
- **Range and timeouts** [V, S40, S38, S39]. Clicks up to `area_size + 1` cells (14 by default). Idle dialogs close after 60 s at `next` or a menu, 180 s at `input`.

*Cost / performance.* One window and one bitmap per player [V, S37].

*Games that used it.*
- Ragnarok Online (rAthena script commands): https://github.com/rathena/rathena/blob/master/doc/script_commands.txt
- Ragnarok Online (rAthena timeouts): https://github.com/rathena/rathena/blob/master/src/config/secure.hpp

*How it feels.* Private and clear, with a big painted face. Cutins are the portraits of classic MMOs [I, note 01].

*Risks.* Text, logic and side effects share one script, so translation needs extraction tools [V, S41]. Whole lines appear at once [U, note 01].

*Ratings 1–5 (author judgement):* Clarity 4 · Charm 3 · MMO fit 5 · Authoring 4 · Speed 5

### A4. Pokémon and Zelda text printers: frames per glyph and control bytes

*In plain words.* One letter at a time on a fixed clock, with speed stored as frames to wait. Pauses, colours, the player's name and sounds are bytes inside the string.

*How it works (technical).*
- **Emerald** [V, S57, S56, S58]. Table Slow 8, Mid 4, Fast 1, default Mid. The printer prints, then counts down, so a glyph costs N+1 frames, that is 9, 5 and 2. A held A or B runs 1 glyph per frame after a fresh press.
- **Crystal** [V, S63, S64]. "fast: 1 frame, mid: 3 frames, slow: 5 frames". Pause 30 frames; "…" 10 frames per dot.
- **ALttP** [V, S66]. Speed is a per-message code; 0 chains glyphs in one frame. Waits run 31 to 500. Every glyph but one plays SFX 12.

*Cost / performance.* A 192-glyph box costs 0.38 ms per frame on the M4 GPU, the same as an empty frame within timer noise [V, S3].

*Games that used it.*
- Pokémon Emerald text printer: https://github.com/pret/pokeemerald/blob/master/src/text.c
- A Link to the Past messaging: https://github.com/snesrev/zelda3/blob/master/src/messaging.c

*How it feels.* Mid at 12 cps reads calm; held A at 60 reads as impatience the game respects [I].

*Risks.* None of these engines pauses on punctuation by itself [V, S60, S66]. A modal box freezes one player in a world that keeps moving.

*Ratings 1–5 (author judgement):* Clarity 5 · Charm 4 · MMO fit 3 · Authoring 4 · Speed 5

### A5. Ultima Online: overhead speech by line, and the journal

*In plain words.* Everyone talks over their head. Text lives a few seconds per wrapped line, fades, and lands in a journal of everything you heard.

*How it works (technical).*
- **Ranges** [V, S42]. Say 15 tiles, whisper 1, yell 18. Second Life uses the same three tiers at 10, 20 and 100 m [V, S55].
- **Lifetime** [V, S43]. Wrap at 200 px; `4000 · lines · SpeechDelay / 100` ms, so 4 s per line at the usual 100.
- **Fade** [V, S44]. Alpha 255 to 0 over the last 1000 ms.
- **Journal** [K]. A scrollback of all speech, the dialog history.

*Cost / performance.* One text object per message; tens of lines are cheap (§6d) [V, S3].

*Games that used it.*
- Ultima Online (ServUO speech ranges): https://github.com/ServUO/ServUO/blob/master/Server/Mobile.cs
- Ultima Online (ClassicUO messages): https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Managers/MessageManager.cs

*How it feels.* Honest and noisy. The journal makes dropped lines acceptable [I].

*Risks.* A 15-tile say range without a cap fills a bank with text. Per-line timing gives a long single line the same 4 s as a short one [I, note 01].

*Ratings 1–5 (author judgement):* Clarity 3 · Charm 2 · MMO fit 4 · Authoring 4 · Speed 5

### Family B: Overhead text and speech bubbles

### B1. Tile-pinned overhead text with a per-character lifetime (OTClient)

*In plain words.* Tibia draws speech as coloured, outlined text above the tile where it was said. A walking speaker leaves the words behind, and one speaker's lines on one tile merge into a block.

*How it works (technical).*
- **Lifetime** [V, S25, S24]. `max(60 ms · chars, 3000 ms)`, doubled for yells, so 3.0 s for 50 characters and 15.3 s for 255. About 16.7 characters per second of reading.
- **Colour** [V, S24, S28]. NPC replies cyan `#5FF7F7`; player say yellow (239, 239, 0); monsters, spells and barks orange (254, 101, 0). An NPC line is yellow only when sent as plain `Say`.
- **Merge** [V, S26, S24]. Same tile, name and mode only. `size() > 10` pops the oldest, so a block holds 11 lines, each on its own timer.
- **Layout** [V, S24, S27]. Outlined Verdana 11, wrapped at 275 px in a 480x352 view, offset (+20, +5), clamped inside the view.

*Cost / performance.* No follow cost, since the anchor never moves. A redrawn glyph costs about 1.1 µs on the M4 and 4 to 4.5 µs throttled; a cached block almost nothing (§6d) [V, S3; I arithmetic].

*Games that used it.*
- OTClient static text: https://github.com/edubart/otclient/blob/master/src/client/statictext.cpp
- OTClient timing constants: https://github.com/edubart/otclient/blob/master/src/client/const.h

*How it feels.* Tibia's look. Cyan reads as "an NPC said this" at a glance. Tile anchoring suits shopkeepers and looks odd on walkers [I, note 01].

*Risks.* Speakers on adjacent tiles overlap with no avoidance, and a busy depot becomes a wall of cyan [V, S26; I].

*Ratings 1–5 (author judgement):* Clarity 4 · Charm 3 · MMO fit 5 · Authoring 5 · Speed 5

### B2. Greedy push-up stacking (RuneScape)

*In plain words.* Each overhead line is drawn above its speaker. If it overlaps one already placed this frame, it moves up until clear.

*How it works (technical).*
- **Loop** [V, S31]. Test string k against strings 0 to k−1 with a 2 px margin; on overlap, move above that string and repeat. O(n²) in draw order.
- **Caps and filter** [V, S31]. 50 strings per frame. Public chat mode (on, friends, off) filters players; NPC lines always show.
- **Order** [I, note 05]. Sort oldest first so old lines keep their slots and only new ones move.

*Cost / performance.* Under 1,000 rectangle tests for 32 bubbles [I]. The text costs more than the layout, with 50 redrawn bubbles at 2.95 ms on the M4 and 0.47 ms cached [V, S3].

*Games that used it.*
- RuneScape 2006 client (2006Scape): https://github.com/2006-Scape/2006Scape/blob/master/2006Scape%20Client/src/main/java/Game.java
- RuneScape 317 client: https://github.com/MatthewBishop/rs317/blob/master/src/Client.java

*How it feels.* Readable and busy. Dense spots grow a tall column of lines [I].

*Risks.* Unsorted input jitters. A dense crowd pushes the column off the screen, so cap it and send the rest to the log (B4).

*Ratings 1–5 (author judgement):* Clarity 4 · Charm 3 · MMO fit 5 · Authoring 5 · Speed 4

### B3. The upward stream (Habitat and Habbo)

*In plain words.* Bubbles spawn in a band near the bottom at the speaker's x position and scroll up on a fixed clock, pushed by newer ones. They never follow walking avatars.

*How it works (technical).*
- **Habitat, 1986** [V, S49]. The balloon appears over the latest speaker; older balloons lose their tails and scroll up.
- **Nitro** [V, S46, S45, S47]. Spawn at `speakerX − width/2` at the bottom of the band; every bubble moves up 15 px per tick of 3, 6 or 12 s; removed once `top < −2 · height`. Widths 240, 350 or 2000 px.
- **Modes** [V, S45, S48]. Line mode shifts everything up; free-flow pushes only overlapped bubbles with an AABB test.

*Cost / performance.* One timer per room and one AABB pass per new bubble [I].

*Games that used it.*
- Habbo (Nitro client): https://github.com/billsonnn/nitro-react/blob/dev/src/components/room/widgets/chat/ChatWidgetView.tsx
- Habitat (Comic Chat paper): https://discmaster.textfiles.com/file/16650/SIGGRAPH%201996:%20Proceedings.iso/pc/papers/kurlan/paper.pdf

*How it feels.* A room conversation with clear reading order [I].

*Risks.* Bubbles drift away from speakers on a 15x11 tile screen. It suits a tavern room better than an open town [I].

*Ratings 1–5 (author judgement):* Clarity 3 · Charm 4 · MMO fit 3 · Authoring 5 · Speed 4

### B4. Caps, distance tiers, priority and the log as overflow

*In plain words.* When too many people talk, show fewer bubbles. Limit them per speaker, shrink distant ones, rank what matters, and send the rest to the chat log.

*How it works (technical).*
- **Per speaker** [V, S50, S51]. Roblox keeps 3 per user with 6 px spacing and a 30 s lifetime. OTClient merges 11 lines per block [V, S24].
- **Distance** [V, S50, S52]. Roblox collapses a stack to "..." past 40 studs and hides it past 100. Legacy Roblox capped bubbles at 128 characters and lived 8 to 20 s by length.
- **Server interest** [V, S11, S14, S112]. TFS sends say within ±8 x ±6 tiles and yell within ±18 x ±14. WoW say reaches 60 yards.
- **Priority** [I, note 05]. Own lines, the NPC you talk to, party, nearby players, then ambient barks, which drop first.

*Cost / performance.* A sort and a counter. Each hidden bubble saves its draw, and 50 redrawn bubbles cost 10.51 ms on the throttled CPU [V, S3].

*Games that used it.*
- Roblox bubble chat: https://github.com/Roblox/creator-docs/blob/main/content/en-us/chat/bubble-chat.md
- WoW bubble options: https://us.forums.blizzard.com/en/wow/t/chat-bubble-options/261312

*How it feels.* Calm crowds where your own conversation never gets buried [I].

*Risks.* Hidden lines must still reach the log. Roblox's 30 s lifetime is far too long for a busy town [I, note 05].

*Ratings 1–5 (author judgement):* Clarity 5 · Charm 2 · MMO fit 5 · Authoring 4 · Speed 5

### B5. Offscreen speakers: clamp the body, keep the tail, add an edge chip

*In plain words.* Near the edge, push the bubble back on screen but keep its tail on the speaker. Once the speaker leaves the screen, show a small chip on the edge in their direction.

*How it works (technical).*
- **Clamp** [V, S24]. OTClient's `bind()` slides text inward instead of cutting it.
- **Failures** [V, S186, S187]. In Adventure Creator the clamped tail "no longer appears under the speaking character"; an AGS module crops bubbles instead.
- **Indicator** [V, S184, S185]. A hidden marker per target, shown and clamped on the line from screen centre to the target when it leaves the view. XAG 104 marks offscreen speakers with `<` or `>` [V, S177].
- **Rules** [I, note 10]. 4 px inset; the tail slides along the bottom edge and flips near the top; a 16x16 chip with name and first words for NPCs and party only.

*Cost / performance.* Four comparisons per bubble and one sprite per chip [I].

*Games that used it.*
- OTClient (clamp to view): https://github.com/edubart/otclient/blob/master/src/client/statictext.cpp
- Adventure Creator (tail lost after clamp): https://adventurecreator.org/forum/discussion/comment/59784/

*How it feels.* You never lose the NPC you are talking to [I].

*Risks.* No 2D MMO source with edge arrows was found [I, note 05]. Chips for everyone move the clutter to the edges.

*Ratings 1–5 (author judgement):* Clarity 4 · Charm 3 · MMO fit 4 · Authoring 4 · Speed 5

### Family C: The dialog box

### C1. Typewriter timing and hold-to-fast-forward

*In plain words.* Letters appear at a speed the player can set. Holding the button runs them fast, and an instant option shows the whole line.

*How it works (technical).*
- **Stored as time per glyph** [V, S57, S63, S73, S129, S126]. Emerald 9, 5, 2 real frames; Crystal 5, 3, 1; Stardew 30 ms; Dialogic 10 ms; Ren'Py's template instant.
- **Fast-forward** [V, S56, S63]. Held A or B drops to 1 frame per glyph. Crystal's `wDisableTextAcceleration` blocks it in scenes that must not be rushed.
- **Ours** [I]. Slow 83 ms (12 cps), Normal 50 ms (20 cps), Fast 30 ms (33 cps), Instant; count glyphs after stripping tags.

*Cost / performance.* Free; see A4 [V, S3].

*Games that used it.*
- Pokémon Emerald speed table: https://github.com/pret/pokeemerald/blob/master/src/menu.c
- Stardew Valley dialogue box: https://github.com/E-riCA0/StawdewValley/blob/HEAD/Menus/DialogueBox.cs

*How it feels.* Slow text with pauses reads as acting, fast text as information. No study tests letter-by-letter reveal against reading [V, S183; I, note 08].

*Risks.* A slow default with no fast-forward is the classic complaint; AFB asks for adjustable speed [V, S179]. Words that jump lines mid-type look broken, so wrap the full line first [V, S84].

*Ratings 1–5 (author judgement):* Clarity 4 · Charm 5 · MMO fit 4 · Authoring 5 · Speed 5

### C2. Punctuation and scripted pauses

*In plain words.* Text stops briefly at commas and full stops, and longer where the writer asks, like a breath.

*How it works (technical).*
- **By code only in the classics** [V, S60, S64, S66]. Emerald `FC 08`, Crystal 30 frames, ALttP 31 to 500, all skippable by holding A.
- **RPG Maker and EarthBound** [V, S89, S75]. `\.` 15 frames, `\|` 60 frames. EarthBound waits in 1/60 s up to 4.25 s, and its auto prompt waits 30 frames on Fast, 60 on Medium, for a press on Slow.
- **Indie tags** [V, S67, S68, S129]. Celeste `{0.5}` s, CYF `[w:x]` = 4x frames, Dialogic `[pause]` 0.5 s.
- **Auto rule** [I, note 02]. Comma 4 to 6 glyph-times, `.`, `!`, `?` 8 to 12, overridable, scaled with the speed preset.

*Cost / performance.* A table lookup per glyph [I].

*Games that used it.*
- EarthBound control codes: https://datacrystal.tcrf.net/wiki/EarthBound/Control_Codes
- RPG Maker MV message window: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_windows/Window_Message.js

*How it feels.* The difference between a printer and a voice. Nobody notices a 15-frame stop; everybody notices its absence [I].

*Risks.* Auto pauses trip on "Mr." and "3.5" and on other languages' punctuation; give writers an escape [I].

*Ratings 1–5 (author judgement):* Clarity 4 · Charm 5 · MMO fit 4 · Authoring 4 · Speed 5

### C3. Complete-then-advance, and guards against mashing

*In plain words.* The first press finishes the line, the second goes on. For a moment after new text appears, presses do not advance.

*How it works (technical).*
- **Stardew** [V, S73]. A click while typing completes; a second advances. `safetyTimer = 750` ms per new box; early clicks shave 200 ms off it.
- **ALttP** [V, S66]. A 28-frame countdown after a page before the next press counts.
- **Emerald** [V, S59]. The yes/no box ignores input for 5 frames.
- **Mobile** [V, S130, S131]. Genshin's tap interrupts a line and moves on; a 2026 change reportedly made spam-tapping faster [U on the 2026 report].
- **For an MMO** [I, note 02]. 150 to 300 ms after each page reveal, so a server line that lands under a mash stays readable.

*Cost / performance.* A timer [I].

*Games that used it.*
- Stardew Valley safety timer: https://github.com/E-riCA0/StawdewValley/blob/HEAD/Menus/DialogueBox.cs
- A Link to the Past wait-for-key: https://github.com/snesrev/zelda3/blob/master/src/messaging.c

*How it feels.* Without it, players skip quest instructions by accident and blame the game [I].

*Risks.* 750 ms feels sticky; shave rather than block [V, S73].

*Ratings 1–5 (author judgement):* Clarity 5 · Charm 3 · MMO fit 5 · Authoring 5 · Speed 5

### C4. Inline text tags: colour, wave, shake, speed and triggers

*In plain words.* Writers mark words inside the line to colour them, make them wobble, change speed, or fire a game event at an exact word.

*How it works (technical).*
- **Celeste** [V, S67]. `{~}` wave, `{*}` shake, `{!}` impact, `{#F94A4A}` colour, `{>> 0.5}` speed, `{0.5}` pause, `{trigger #}` for a cutscene hook mid-line.
- **Undertale-style** [V, S68]. `[color:rrggbb]`, `[effect:shake,…]`, `[voice:file]`, `[noskip]`.
- **Godot** [V, S162]. RichTextLabel `[wave amp=50.0 freq=5.0]`, `[shake rate=20.0 level=5]`, `[rainbow]`. Amplitude 50 suits large text; 1 to 2 px suits a 7 px glyph [I, note 06].

*Cost / performance.* A wave on the 192-glyph box is free [V, S3]. In Godot, an effect makes RichTextLabel redraw every frame and run per glyph [V, S196], fine for one box and wrong for crowds.

*Games that used it.*
- Celeste dialog tags: https://github.com/EverestAPI/Resources/wiki/Adding-Custom-Dialogue
- Undertale-style tags (Create Your Frisk): https://rhenaudthelukark.github.io/CreateYourFrisk/pages/api-text.html

*How it feels.* A wobbling word is the cheapest acting there is. A trigger lets the NPC hand over the item on the exact word; the server sends the trigger index with the line [I, note 02].

*Risks.* Tags must not count toward speed or length. Colour-only keywords fail colour-blind players [V, S178]. Reduce motion must stop wave and shake.

*Ratings 1–5 (author judgement):* Clarity 4 · Charm 5 · MMO fit 4 · Authoring 4 · Speed 4

### C5. The box: size, 9-slice frame, advance arrow and open animation

*In plain words.* A full-width box about a third of the screen tall, two or three lines, a frame of small tiles, a bobbing arrow, and a quick open.

*How it works (technical).*
- **Size** [V, S57, S65, S88, S127]. Emerald 240x48 on 240x160 (30%), two 16 px lines in a 216x32 text area. Crystal 160x48 on 160x144 (33%). RPG Maker MV about 29%. Ren'Py 25.7% on desktop, 33.3% on phones. Stardew 300x96 art px at 4x [V, S73].
- **Arrow** [V, S56]. 8x16 px, offsets `{0, 1, 2, 1}`, 9 frames per step, 36-frame (0.6 s) cycle.
- **Frame** [V, S189, S93]. Godot's NinePatchRect defaults to STRETCH, which smears pixel borders; use TILE and snap sizes to the edge period. RPG Maker's stretched 48 px edges work only on gradients.
- **Open** [V, S88, S83, S73]. RPG Maker 8 frames (openness +32 of 255), a Game Boy slide-up 4 frames, Stardew about 200 ms from the centre.

*Cost / performance.* One 9-slice is 9 quads from one texture [I, note 10]. An opaque box avoids a full-screen blend [I, note 09].

*Games that used it.*
- Pokémon Emerald window templates: https://github.com/pret/pokeemerald/blob/master/src/menu.c
- EarthBound window flavours: https://legendsoflocalization.com/?p=301

*How it feels.* The frame is the game's handwriting. One small-screen devlog cut a heavy 3-line box back to 2 [V, S86].

*Risks.* Non-integer UI scale makes mixels [V, S180]. An odd-width box centred on an even view lands on half pixels [I, note 10].

*Ratings 1–5 (author judgement):* Clarity 5 · Charm 5 · MMO fit 4 · Authoring 4 · Speed 5

### C6. Choice menus: default cursor and cancel as the safe answer

*In plain words.* A small menu whose cursor starts on the safe answer, where cancel always means no.

*How it works (technical).*
- **Emerald** [V, S57, S59]. A 40x32 px yes/no box; `initialCursorPos` sets the default. B and "No" both return 0. Input waits 5 frames. `ignoreBPress` forbids cancel.
- **rAthena and Stardew** [V, S37, S70]. `select` is 1-based and `prompt` returns 255 on cancel. Stardew's `$q`/`$r` answers carry friendship deltas, and `$p` checks old answers later.
- **Phones** [V, S127, S136, S137]. Ren'Py's phone choices span 97% of the width; targets of 44x44 pt or 48x48 dp.

*Cost / performance.* A few sprites [I].

*Games that used it.*
- Pokémon Emerald script menus: https://github.com/pret/pokeemerald/blob/master/src/script_menu.c
- GB Studio dialogue menus: https://www.gbstudio.dev/docs/scripting/script-glossary/dialogue-menus

*How it feels.* Safe. Mashing B never sells your sword [I].

*Risks.* The server must re-check the choice when applied (F3). A default on "Buy 100" is a trap [I, note 02].

*Ratings 1–5 (author judgement):* Clarity 5 · Charm 3 · MMO fit 5 · Authoring 4 · Speed 5

### C7. The dialog log, auto-advance and skip with a summary

*In plain words.* A log to reread what an NPC said, auto-advance with a delay that grows with the text, and skip that leaves a summary behind.

*How it works (technical).*
- **Auto** [V, S124, S125, S128]. Ren'Py's defaults give 1.5 s plus 0.06 s per character after typing ends; Dialogic 1.0 s plus 0.1 s. A 40-character line waits 3.9 s and 5.0 s [I, note 04 arithmetic].
- **Log** [V, S28, S81]. OTClient keeps 100 lines per tab; CrossCode added a log for skipped messages.
- **Skip** [V, S132, S133, S134]. Honkai: Star Rail 3.4 lists who appeared and a short paragraph; exploration dialogue stays unskippable. Dragalia Lost let you cancel the skip.
- **Ours** [I, note 04]. `1.2 s + 0.05 s/char`, clamped 2 to 10 s, scaled 0.5x to 2x, off by default for NPC talk.

*Cost / performance.* A ring buffer of line ids; Godot's `append_text()` parses only new text [V, S162].

*Games that used it.*
- Honkai: Star Rail skip and summary: https://www.siliconera.com/?p=1095169
- Ren'Py auto-forward: https://github.com/renpy/renpy/blob/master/renpy/display/behavior.py

*How it feels.* A log turns a missed quest line from a support ticket into a keypress [I].

*Risks.* Summaries need a writer per skippable block. Per-character timing breaks for CJK [I, note 04].

*Ratings 1–5 (author judgement):* Clarity 5 · Charm 2 · MMO fit 5 · Authoring 3 · Speed 5

### Family D: Portraits and acting

### D1. Busts: sizes and expression sets

*In plain words.* A face beside the text, swapped for another expression when the line needs it.

*How it works (technical).*
- **Sizes** [V, S71, S74, S85, S88]. Stardew 64x64 on a 74 px plate at 4x; Village Monsters 48x48 for 32+ villagers; RPG Maker MV 144x144 on 816x624.
- **Expressions** [V, S70]. Stardew's standard six (neutral, happy, sad, unique, love, angry) then any custom ones; Caroline has four.
- **Per line** [V, S67, S68]. Celeste `[THEO left normal]`, Undertale-style `[mugshot:face]`.
- **Budget** [I, note 09]. Four expressions, a 2-frame mouth and a blink as overlays on one base, about 7 small frames; palette swaps for minor NPCs.

*Cost / performance.* A 64x64 RGBA frame is 16 KB; 7 frames for 100 NPCs is about 11 MB uncompressed, much less as overlays [I].

*Games that used it.*
- Stardew Valley portraits: https://stardewvalleywiki.com/Modding:NPC_data
- Village Monsters portrait devlog: https://josh-bossie.itch.io/village-monsters/devlog/249628/building-a-village-a-portrait-is-worth-a-thousand-words

*How it feels.* Where players fall for characters. Village Monsters began with scaled-up sprites that some players liked, then redrew all for 1.0 [V, S85].

*Risks.* Art grows with NPCs times expressions, the worst authoring curve here [I]. A portrait box covers other players' view (D5).

*Ratings 1–5 (author judgement):* Clarity 4 · Charm 5 · MMO fit 3 · Authoring 2 · Speed 5

### D2. Mouth flaps and blinks

*In plain words.* The mouth moves while text types and stops when it ends. The eyes blink every few seconds.

*How it works (technical).*
- **Eyes** [V, S94]. Fire Emblem GBA keeps eye and mouth frames in 8x8 cells; closed eyes are "about 2 px tall".
- **Mouth** [V, S95]. A Ren'Py example loops 3 frames held 0.25, 0.3 and 0.2 s; 2 frames is common.
- **Tied to text** [V, S96]. Celeste stops speech when text finishes; portrait, text and audio share one emotion tag.
- **Starting values** [I, note 09]. Mouth 100 to 150 ms per frame, paused on punctuation; blink 3 to 6 frames every 2 to 6 s.

*Cost / performance.* Two overlays and two timers [I].

*Games that used it.*
- Fire Emblem GBA portrait frames: https://feuniverse.us/t/how-do-i-correctly-do-blinking-mouth-animations/33245
- Celeste dialogue design: https://shacknews.com/article/125697/devs-share-insight-into-celestes-dialogue-design-process

*How it feels.* A mouth that stops with the text turns a picture into a person. Players found Village Monsters' bounce charming and a little distracting [V, S85].

*Risks.* Flapping while waiting for input looks broken. Bounce needs a reduce-motion switch [I].

*Ratings 1–5 (author judgement):* Clarity 3 · Charm 5 · MMO fit 4 · Authoring 4 · Speed 5

### D3. Emote balloons: `!`, `?`, heart, anger, "..."

*In plain words.* A small icon pops above a head with a hop and says "surprised" or "pleased" without a word.

*How it works (technical).*
- **Emerald** [V, S61, S62]. 16x16 sprites at y − 16, held 60 frames. The hop starts at −5 and adds +1 per frame: −5, −9, −12, −14, −15, −15, −14, −12, −9, −5, 0, a 15 px peak in about 10 frames.
- **RPG Maker MV** [V, S90]. 48x48, 8 frames at 8 ticks plus a 12-frame hold, 76 frames (1.27 s).
- **Stardew** [V, S72, S71]. Ids step by 4: 8 `?`, 12 angry, 16 `!`, 20 heart, 28 sad, 32 happy; an `EmoteOffset` per NPC.

*Cost / performance.* One sprite and an integer counter; every client plays the same hop from one event byte [I, note 09].

*Games that used it.*
- Pokémon Emerald emotes: https://github.com/pret/pokeemerald/blob/master/src/trainer_see.c
- RPG Maker MV balloons: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Balloon.js

*How it feels.* The best charm per byte in this study. A trainer's `!` is a whole scene in 60 frames [I].

*Risks.* Emotes over every head add clutter; give them bark priority (B4). Outline them 1 px so they read on any floor [I, note 09].

*Ratings 1–5 (author judgement):* Clarity 5 · Charm 5 · MMO fit 5 · Authoring 4 · Speed 5

### D4. Turn to face, lock, and restore

*In plain words.* The NPC turns to you, stops wandering, and turns back when you finish.

*How it works (technical).*
- **RPG Maker MV** [V, S91, S92]. `lock()` saves the facing, turns toward the player and stops wandering; `unlock()` restores it. "Direction Fix" makes turning a no-op.
- **TFS** [V, S4, S9]. `updateFocus()` turns to the first player still in focus every tick; a focused NPC does not walk.
- **Canary** [V, S20]. Faces the latest talker and the previous one on release.
- **Ours** [I, note 10]. Clients turn the sprite from a "talks to" event; restore after 2 to 4 s idle; a `direction_fix` flag for guards and clerks.

*Cost / performance.* A direction byte [I].

*Games that used it.*
- RPG Maker MV event lock: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_objects/Game_Event.js
- Tibia (Canary interaction order): https://github.com/opentibiabr/canary/blob/main/src/creatures/npcs/npc.cpp

*How it feels.* Being noticed, for the price of a byte [I].

*Risks.* With many talkers the NPC faces one. First-in-focus is stable; latest snaps around in a crowd [I].

*Ratings 1–5 (author judgement):* Clarity 4 · Charm 4 · MMO fit 5 · Authoring 5 · Speed 5

### D5. Acting with the overworld sprite, no portrait

*In plain words.* The character in the world does the acting, turning, hopping, emoting, while the text runs with no face picture.

*How it works (technical).*
- **Pokémon** [V, S62, S82]. Movement scripts chain turns, emotes and steps; only 6.5% of Emerald paragraphs name the speaker.
- **Stardew** [V, S72]. Heart events use `speak`, `emote`, `faceDirection`, `move`, `textAboveHead`, `pause`.
- **Side messages** [V, S81]. CrossCode's characters talk in a lower-left panel during play.

*Cost / performance.* Reuses sprites that exist; no art per expression [I].

*Games that used it.*
- Stardew Valley heart events: https://stardewvalleywiki.com/Modding:Event_data
- CrossCode side messages: https://www.moddb.com/games/crosscode/news/crosscode-recap-2013

*How it feels.* A shopkeeper who hops when you buy reads better from across the room than any portrait, and it covers nothing other players need [I].

*Risks.* Subtle emotion is hard at 32x32; lean on emotes. Golden Sun's talking hops have no primary source [U, note 02].

*Ratings 1–5 (author judgement):* Clarity 4 · Charm 4 · MMO fit 5 · Authoring 4 · Speed 5

### Family E: Quest givers

### E1. Marker states: shape for the kind of quest, a second cue for the state

*In plain words.* `!` over a head means "I have a quest", `?` means "come back to me". Colour or shape says whether you can act now.

*How it works (technical).*
- **WoW base set** [V, S97, S98]. Yellow `!` available, grey `!` in a few levels, grey `?` unfinished, yellow `?` turn in. Wiki icon files are 16x16.
- **Colour trouble** [V, S104, S105]. Players find the blue marks hard to see; in 2023 Blizzard promised icons that differ "without relying on shades of color".
- **FFXIV** [V, S113, S114, S115]. Shape for category (a meteor for the main story, `+` for unlocks, `!` for side quests), colour for state (red when requirements are not met).
- **At 32 px** [I, notes 03 and 09]. A 16x16 marker with a 1 px outline and a 2 to 3 px whole-pixel bob; a hollow grey `?` so it reads in greyscale.

*Cost / performance.* One sprite and a state byte on change [I].

*Games that used it.*
- World of Warcraft quest markers: https://lotro.allakhazam.com/wiki/Quests_(WoW)
- Final Fantasy XIV NPC icons: https://na.finalfantasyxiv.com/uiguide/know/faq-display/interface_npc_icon.html

*How it feels.* Universal. A yellow `!` is read before anything else on screen [I].

*Risks.* Kaplan's "Christmas tree effect", a hub of markers cleared without context [V, S106]. WoW grew to about 10 variants; launch with 4 states and a repeatable one [I, note 03].

*Ratings 1–5 (author judgement):* Clarity 5 · Charm 3 · MMO fit 5 · Authoring 5 · Speed 5

### E2. Offer, accept, progress and turn-in, with a tracker

*In plain words.* An offer card with the task and reward, accept or decline, a progress line on screen ("Herbs 2/3"), then a hand-in and a reward popup.

*How it works (technical).*
- **Tracker history** [V, S100, S108]. WoW's first tracker came in 1.3.0 (2005-03-07); 3.3 (2009-12-08) put quest areas and turn-ins on the map; 6.0.2 sorted the tracker by proximity.
- **Log caps** [V, S100, S103]. 20 at launch, 25 from TBC, 35 on retail since 2022-12-09.
- **Kaplan's rules** [V, S106]. Clear objectives, instant progress feedback, quest givers easy to find.
- **Server truth** [V, S21]. Canary keeps quest progress in integer storage values per player, with timers like `os.time() + 7200`.

*Cost / performance.* A tracker line per quest and a byte or two per update [I].

*Games that used it.*
- WoW quest log history: https://warcraft.wiki.gg/wiki/Quest_log
- Guild Wars 2 scouts: https://wiki.guildwars2.com/wiki/Scout

*How it feels.* Progress you can see is its own reward. A line ticking to 3/3 with a small sound is half the fun of a fetch quest [I].

*Risks.* Full map guidance removes exploration; Wrath Classic left it out because it "changes how the game is played" [V, S108].

*Ratings 1–5 (author judgement):* Clarity 5 · Charm 3 · MMO fit 5 · Authoring 4 · Speed 5

### E3. Renown hearts: markers that fill with progress

*In plain words.* No quest to accept. The NPC's heart fills as you help in its area in any mix of ways, and when full the NPC becomes a vendor.

*How it works (technical).*
- **GW2** [V, S119, S118]. An empty heart over the NPC and on the map fills from the bottom; the exact percentage is hidden. Afterwards the NPC sells for karma.
- **Rewards** [V, S119]. XP and a popup with karma (90 at level 2, about 7.5 more per level) and coin.
- **Ours** [I, note 10]. A 16x16 heart filled in 1 px steps; one progress byte per update.

*Cost / performance.* A clip rect on one sprite [I].

*Games that used it.*
- Guild Wars 2 renown hearts: https://wiki.guildwars2.com/wiki/Renown_heart
- Guild Wars 2 heart NPCs: https://wiki.guildwars2.com/wiki/Renown_Heart_NPC

*How it feels.* Generous. You help however you like and watch the heart fill, with nothing to read [I].

*Risks.* More world design per quest (task objects, area triggers) than a fetch quest [I].

*Ratings 1–5 (author judgement):* Clarity 4 · Charm 5 · MMO fit 5 · Authoring 3 · Speed 5

### E4. Short quest text, objective first

*In plain words.* Keep quest text short and put the task in one plain line that also goes to the tracker.

*How it works (technical).*
- **Cap** [V, S107]. WoW capped quest text at 511 characters, and Kaplan said "I actually wish that the number was smaller."
- **Skip data** [V, S102, S123]. In a self-selected 2024 Warcraft poll, 17.8% always read and 37.7% answered "Quest text?". An 80% City of Heroes figure is secondhand.
- **Studio moves** [V, S116, S120, S121]. FFXIV 5.3 cut about 13% of ARR's main quests. ESO went fully voiced and types generic lines as greetings, guard lines and overheard talk.
- **Our rule** [I, notes 03 and 04]. 200 to 300 characters per offer screen, a bold objective line, a choice every 2 or 3 lines.

*Cost / performance.* Fewer glyphs and less to translate [I].

*Games that used it.*
- WoW quest text cap: https://www.theregister.com/2009/03/27/gdc09_jeffrey_kaplan_session
- FFXIV A Realm Reborn overhaul: https://ffxiv.consolegameswiki.com/wiki/A_Realm_Reborn_Overhaul

*How it feels.* Readers get flavour, skippers get the task, nobody asks "where do I go" [I].

*Risks.* Over-trimmed text loses the world's voice. No studio publishes skip telemetry [I, note 03].

*Ratings 1–5 (author judgement):* Clarity 5 · Charm 2 · MMO fit 5 · Authoring 4 · Speed 5

### Family F: Shops and services

### F1. One service, skip the gossip

*In plain words.* An NPC that does one thing, like banking, opens it straight away. Quests or several services get a short menu first.

*How it works (technical).*
- **WoW** [V, S109]. The client skips gossip when there is one non-gossip option; `ForceGossip()` stops the skip.
- **Verbs** [V, S79, S80]. Octopath turns NPC interaction into verbs (Inquire, Purchase, Steal, Allure); rogue verbs can fail and cost reputation.
- **Ours** [I, note 03]. One service and no quest opens the panel; otherwise a menu; a modifier forces it.

*Cost / performance.* One fewer round trip per visit [I].

*Games that used it.*
- WoW ForceGossip API: https://warcraft.wiki.gg/wiki/API:C_GossipInfo.ForceGossip
- Octopath Traveler path actions: https://primagames.com/tips/octopath-traveler-characters-talents-path-actions

*How it feels.* A bank you visit ten times a session should cost one click [I].

*Risks.* Skipping can hide new quests; never skip when one is available [V, S110].

*Ratings 1–5 (author judgement):* Clarity 5 · Charm 2 · MMO fit 5 · Authoring 5 · Speed 5

### F2. Keyword to trade window, and back

*In plain words.* Say "trade" and a shop window opens beside the chat. The NPC speaks you in and out, so the panel stays part of the conversation.

*How it works (technical).*
- **Modes** [V, S5]. The trade window came with client 8.2; buying by talking ("buy 5 rope", "yes") remains.
- **Lines** [V, S4]. "Of course, just browse through my wares." on open, "Thank you, come back whenever you're in need of something else." on close.
- **Window** [V, S29]. 550x515 px, Buy and Sell tabs, 160x90 cells, price, weight and capacity rows, an amount slider 1 to 100, search.
- **Closing** [V, S4, S20]. Walking away releases focus and closes the window.

*Cost / performance.* Shop open is 17 bytes plus the name per item, about 870 bytes for 30 items; close is 1 byte [V, S15; I].

*Games that used it.*
- Tibia (OTClient trade window): https://github.com/edubart/otclient/blob/master/modules/game_npctrade/npctrade.otui
- Tibia (TFS shop module): https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/modules.lua

*How it feels.* The NPC stays a person while you use a menu [I, note 01].

*Risks.* 550x515 does not fit a 640x360 buffer; Asterion needs a compact panel [I].

*Ratings 1–5 (author judgement):* Clarity 4 · Charm 4 · MMO fit 5 · Authoring 4 · Speed 5

### F3. Server re-validation: never trust the menu

*In plain words.* Whatever the client shows, the server checks again when you act. Is the shop open, is the item for sale, do you have the gold, are you in range?

*How it works (technical).*
- **Purchase** [V, S15, S11]. 7 bytes after the opcode. Rejects amount 0 or over the stack size; requires an open shop owner and `hasShopItemForSale`.
- **Release** [V, S4]. Ending focus closes the shop and clears pending lines and shop state.
- **Rule** [I, note 05]. Re-check gold, items and stage when a choice is applied; never predict a state change on the client.

*Cost / performance.* A few lookups per action [I].

*Games that used it.*
- Tibia (TFS purchase handling): https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- Tibia (TFS protocol): https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp

*How it feels.* Invisible until someone dupes gold [I].

*Risks.* Every check needs a failure line the writers must cover [I].

*Ratings 1–5 (author judgement):* Clarity 3 · Charm 1 · MMO fit 5 · Authoring 4 · Speed 5

### F4. Touch flows: tap to walk and greet, keyword chips, place links, long press

*In plain words.* On a phone, tap the NPC to walk over and greet it, tap highlighted words to send them, tap a place name to walk there, long-press for more.

*How it works (technical).*
- **Long press** [V, S36, S35]. OSRS Mobile (30 Oct 2018) opens the action menu on long press; the top entry is the tap action, with a settable delay.
- **Auto path** [V, S135, S37]. MapleStory M walks to a tapped quest and back; rAthena's `<NAVI>` links and `navigateto` start pathing on click.
- **Chips** [V, S28; I, note 04]. Show the NPC's keywords as chips; the server still gets a plain keyword.
- **Targets** [V, S136, S137, S138, S139]. 44 pt, 48 dp, 24 CSS px minimum; 49% of observed users hold the phone one-handed.
- **Hit area** [I, note 04]. A 32 px tile at 2x on a 3x phone is about 21 pt; pad NPCs to 1.5 to 2 tiles or snap taps to the nearest NPC.

*Cost / performance.* A pathfinding call and normal step packets [I, note 04].

*Games that used it.*
- OSRS Mobile: https://oldschool.runescape.wiki/w/Old_School_RuneScape_Mobile
- MapleStory M auto quest: https://twinfinite.net/?p=369057

*How it feels.* A keyword NPC becomes a one-thumb conversation that keeps its flavour [I].

*Risks.* Taps opening the long-press menu by mistake [U, note 04]. Auto-pathing everywhere removes the walk through town [I].

*Ratings 1–5 (author judgement):* Clarity 5 · Charm 3 · MMO fit 5 · Authoring 4 · Speed 5

### Family G: Ambient life, audio and accessibility

### G1. Rule-based barks with expiring facts

*In plain words.* Townsfolk say short lines on their own. A rule picks the best fit for the moment, and the NPC remembers what it said.

*How it works (technical).*
- **Ruskin, GDC 2012** [V, S163, S164]. A query is a set of facts; the rule with the most matching criteria wins, ties at random. Left 4 Dead 2 and Dota used it.
- **Memory** [V, S163]. Rules write facts back with expiry times, so cooldowns and "already said" are one mechanism. Followups are queried when the first line ends.
- **Speed** [V, S163]. About 50 rules per bucket, 8 criteria each, under 1 µs per lookup.
- **Canary voices** [V, S20, S21]. `interval = 15000, chance = 50` in the 8 of 40 sampled NPC files with voices; per-NPC data.
- **Ours** [I, note 08]. Poll every 8 to 15 s when a player is within 8 tiles; "speaking" for 4 to 6 s; "said" for 2 to 5 min; a 20 to 40% gate. Server-side, broadcast a line id.

*Cost / performance.* Under 1 µs per lookup and a few bytes per bark [V, S163; I].

*Games that used it.*
- Left 4 Dead 2 and Dota (Ruskin slides): https://cdn.fastly.steamstatic.com/apps/valve/2012/GDC2012_Ruskin_Elan_DynamicDialog.pdf
- Firewatch dialog system: https://gdcvault.com/play/1024000/Do-You-Copy-Dialog-System

*How it feels.* A town that notices weather, hour and reputation without anyone writing branches [I]. Hades 2 runs on the same appetite, over 400,000 words [V, S166].

*Risks.* A bark over an active conversation; give barks the lowest priority (B4) [I].

*Ratings 1–5 (author judgement):* Clarity 3 · Charm 4 · MMO fit 5 · Authoring 4 · Speed 5

### G2. Schedules from the clock

*In plain words.* Townsfolk follow routines from a small table driven by the game clock.

*How it works (technical).*
- **Ultima VII** [V, S167]. Up to 8 records of 4 bytes per NPC: a 5-bit activity, a 3-bit slot (eight 3-hour slots) and a position. 32 activities from Tend Shop to Bake.
- **Design rules** [V, S168]. Shopkeepers reachable about 14 hours a day; a shared base routine plus add-ons; 1 to 60 min jitter; idle actions never block talk.
- **For an MMO** [I, note 08]. Deterministic from the clock, so clients predict routines with no per-move packets.

*Cost / performance.* Four bytes per entry, one lookup per slot change [V, S167; I].

*Games that used it.*
- Ultima VII schedules: https://www.wiki.ultimacodex.com/wiki/Ultima_VII_internal_formats_%E2%80%93_SCHEDULE.DAT
- Ultima schedule design essay: https://lycaeum.ultimacodex.com/npc-schedules/

*How it feels.* Finding the smith in the tavern at night is a small story [I].

*Risks.* A needed NPC asleep across town is friction, which is why Tibia's NPCs stand still. Keep schedules for ambient folk [I, note 08].

*Ratings 1–5 (author judgement):* Clarity 3 · Charm 5 · MMO fit 4 · Authoring 3 · Speed 5

### G3. Voice blips and UI sounds

*In plain words.* A short beep plays as letters appear, pitched per character, so text sounds spoken. Small sounds mark open, page turn and close.

*How it works (technical).*
- **Per glyph and per voice** [V, S66, S68]. ALttP plays SFX 12 per glyph; Undertale-style engines set `[voice:file]` per character.
- **Throttles** [V, S169, S170]. At most one blip per 30 ms, visible characters only, or every Nth letter skipping spaces.
- **Continuous voice** [V, S171, S172]. Celeste loops one FMOD event per character and jumps to the portrait's emotion.
- **UI** [V, S73]. Stardew plays `breathin` on open, a sound per letter, one when a line ends, `smallSelect` on advance, `breathout` on close.
- **Godot web** [V, S173, S174]. Sample playback is the web default since 4.3; one report says pitch changes stopped working.
- **Ours** [I, note 08]. 30 to 60 ms samples, per-NPC pitch within ±4 semitones, ±0.5 jitter, every 2nd glyph at least 40 ms apart, only for your own dialog; bake pitch variants if needed.

*Cost / performance.* A few KB per voice; web audio latency was not measured [I].

*Games that used it.*
- Celeste voices: https://www.thegamer.com/celeste-sound-designer-reveals-how-the-games-dialogue-audio-was-created/
- Animal Crossing style (animalese.js): https://github.com/Acedio/animalese.js

*How it feels.* Voice acting for a team with no actors. Golden Sun's beeps get called "overt", so keep them soft [V, S78].

*Risks.* One blip per glyph at 30 cps is a machine gun; blips from a whole crowd are a wall of chirps [I, notes 02 and 08].

*Ratings 1–5 (author judgement):* Clarity 3 · Charm 5 · MMO fit 4 · Authoring 5 · Speed 4

### G4. Accessibility: text size, speed, motion and colour plus shape

*In plain words.* Bigger, slower, faster or instant text, no forced wobble, and nothing marked by colour alone.

*How it works (technical).*
- **Size** [V, S175]. Body height 26 px at 1080p on console, 18 px on PC and mobile at 100 DPI; scaling to 200%.
- **Contrast and subtitles** [V, S176, S177]. 4.5:1 for text; at most 40 characters per line and 2 lines; barks count as chatter.
- **Pace and colour** [V, S178, S179]. Players progress "at their own pace"; no information by colour alone; adjustable speed for low vision and dyslexia.
- **Pixel maths** [I, notes 08 and 09]. An 8 px font at 2x on 1080p is 16 px, under the PC floor; at 3x it is 24. Offer an integer 1x or 2x UI scale.

*Cost / performance.* A second atlas page for the 2x font; reduce motion removes work [I].

*Games that used it.*
- Xbox Accessibility Guideline 101: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/101
- Game Accessibility Guidelines: https://gameaccessibilityguidelines.com/full-list/

*How it feels.* Nobody notices good accessibility; plenty quit over its absence [I].

*Risks.* Pixel fonts cannot scale freely, so plan an integer large-text mode early [I, note 09].

*Ratings 1–5 (author judgement):* Clarity 5 · Charm 2 · MMO fit 5 · Authoring 4 · Speed 5

### Family H: Systems and authoring

### H1. Server conversation sessions and the focus model

*In plain words.* The server tracks who talks to which NPC and where each conversation stands. An NPC either serves one player with a queue, or everyone at once in private.

*How it works (technical).*
- **TFS 1.x multi-focus** [V, S4]. `focuses` is a list; `topic[cid]` is per player; facing is the only shared state.
- **Ending** [V, S4, S8]. Out of range says "Goodbye."; 120 s idle ungreets; a re-greet gets "|PLAYERNAME|, I am already talking to you."
- **Old single focus** [V, S17, S18]. TFS 0.3 had `CONVERSATION_DEFAULT` (one focus and a queue with `|QUEUESIZE|`) or `CONVERSATION_PRIVATE`.
- **Session** [I, note 05]. NPC id, node id, allowed choices and expiry; dropped on range, timeout, teleport or logout.

*Cost / performance.* One small record per conversation [I].

*Games that used it.*
- Tibia (TFS NPC handler): https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npchandler.lua
- Tibia (TFS 0.3 queue): https://otland.net/threads/npc-default-lua.106750/

*How it feels.* Multi-focus keeps walk-up-and-say-hi and drops the queue [I].

*Risks.* In queue mode one idle player blocks the NPC up to 120 s [I, note 05]. Keep queues for set pieces.

*Ratings 1–5 (author judgement):* Clarity 4 · Charm 3 · MMO fit 5 · Authoring 4 · Speed 5

### H2. Line ids over the wire

*In plain words.* The server sends a short number for the line plus a few values like your name, and the client looks the text up in its own language.

*How it works (technical).*
- **Tibia today** [V, S15, S22]. Creature say is 18 fixed bytes plus name plus text; "Riona" saying "Greetings, Alice." is 40 bytes. Client say over 255 characters is dropped.
- **Framing** [V, S16, S23]. XTEA padded to 8 bytes, 2-byte length, 4-byte header, zlib in sequence mode.
- **Proposal** [I, notes 05 and 07]. `npc_line` = opcode, entity id, line id, arg count and args, 8 bytes bare and about 15 with a name. `choice` = 4 bytes.
- **Strings** [I, note 07]. 2,000 lines at 60 bytes is about 120 KB per language, about 40 KB gzipped.

*Cost / performance.* One line to 30 players costs 2.6 KB as text and 240 B as ids (§6c) [I, note 07].

*Games that used it.*
- Tibia (TFS protocol): https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
- Tibia (Canary protocol): https://github.com/opentibiabr/canary/blob/main/src/server/network/protocol/protocolgame.cpp

*How it feels.* To the team, German costs zero extra bytes [I].

*Risks.* Typed keywords still travel as text. Version the string table or clients show the wrong line [I].

*Ratings 1–5 (author judgement):* Clarity 3 · Charm 2 · MMO fit 5 · Authoring 3 · Speed 5

### H3. Rate limits for chat and NPC input

*In plain words.* Players can send only so many messages in a short time, spammers get longer mutes, and NPC talk gets its own looser limit.

*How it works (technical).*
- **TFS** [V, S13, S12]. A 4-message buffer, one credit back every 1.5 s, the 5th message mutes for `5 · n²` s (5, 20, 45, 80).
- **The gap** [V, S11]. NPC-channel messages return before the mute check, yet each costs a keyword parse for every NPC in view.
- **Roblox legacy** [V, S53, S54]. 7 messages per 15 s per channel, 200 characters each.
- **Ours** [I, note 05]. TFS for chat; NPC input 3 per second with a burst of 5; public barks at most one per NPC per 8 to 15 s.

*Cost / performance.* A counter and a timestamp per player [I].

*Games that used it.*
- Tibia (TFS message buffer): https://github.com/otland/forgottenserver/blob/master/src/player.cpp
- Roblox legacy flood detector: https://github.com/Roblox/Core-Scripts/blob/master/CoreScriptsRoot/Modules/Server/ServerChat/DefaultChatModules/ChatFloodDetector.lua

*How it feels.* Unnoticed if the NPC bucket is generous; "hi, trade, yes" in two seconds is normal play [I].

*Risks.* One shared bucket punishes shoppers [I, note 05].

*Ratings 1–5 (author judgement):* Clarity 3 · Charm 1 · MMO fit 5 · Authoring 5 · Speed 5

### H4. Dialog tools: Dialogue Manager, Ink, Yarn Spinner, Dialogic

*In plain words.* Writers write branches and conditions in a text format, not in code. Which tool fits depends on whether the server runs Godot.

*How it works (technical).*
- **Dialogue Manager** [V, S150, S151, S152, S153]. MIT, GDScript, Godot 4.6+, v4.2.0. Inline `[if x]…[/if]`, conditional responses, weighted `%2` lines, `$>` mutations; `tr()` with static ids and translator notes.
- **Ink** [V, S140, S141, S142, S154]. MIT. `story.state.ToJson()` saves everything; external functions bind game calls; inkjs is 31 KB gzipped; no built-in localization.
- **Ink in Godot** [V, S143, S144, S155]. godot-ink needs .NET, and C# projects cannot export to web; inkgd is GDScript on an unreleased branch.
- **Yarn Spinner** [V, S145, S146, S147, S148]. MIT core runs headless in .NET; the C# Godot port cannot export to web; the GDScript port has saliency and node groups under the custom YSPL.

*Cost / performance.* No per-line runtime figures exist for any of them [U, note 06].

*Games that used it.*
- Night in the Woods (Yarn Spinner): https://yarnspinner.dev/showcase/night-in-the-woods/
- 80 Days (ink): https://gamedeveloper.com/design/open-sourcing-80-days-narrative-scripting-language-ink

*How it feels.* Writers who see a whole conversation in one file write better conversations [I].

*Risks.* Script-in-code NPCs (TFS, rAthena) cannot drive a marker without running the logic. Dialogue Manager reads autoload globals, so per-player server state needs a wrapper [I, note 06].

*Ratings 1–5 (author judgement):* Clarity 3 · Charm 3 · MMO fit 4 · Authoring 5 · Speed 4

### H5. Localization and text expansion

*In plain words.* Every line gets translated, translations run longer, and short labels can triple.

*How it works (technical).*
- **Expansion** [V, S160]. Up to 10 characters 200 to 300%, 31 to 50 characters 140 to 160%, over 70 about 130%. "Views" in German is 2.8x.
- **Formats** [V, S156, S157, S159]. PO merges better in Git; CSV has plural and context columns; pseudolocalization at 0.3 "is sufficient for most practical cases".
- **Web weight** [V, S158]. Line-break data for languages without spaces adds about 4 MB.
- **Rules** [I, note 06]. Named placeholders; boxes for 3 English lines so German fits 4; keyword chips tied to ids with localized aliases on the server.

*Cost / performance.* CJK fills 2 MiB atlas pages instead of one 128 KiB page [V, S197; I, note 07].

*Games that used it.*
- Dialogue Manager translations: https://github.com/nathanhoad/godot_dialogue_manager/blob/HEAD/docs/Translations.md
- Hercules script translations: https://github.com/HerculesWS/Hercules/blob/stable/db/translations.conf

*How it feels.* A word falling off the frame makes a Spanish player feel like an afterthought [I].

*Risks.* English typed keywords, English-sized bubbles, Latin-tuned timing. Pick languages before fonts [I].

*Ratings 1–5 (author judgement):* Clarity 4 · Charm 2 · MMO fit 5 · Authoring 3 · Speed 4

### H6. LLM-driven NPCs: what shipped, and whether Asterion should

*In plain words.* A few 2025 and 2026 games let players chat freely with model-driven NPCs. Players broke them, and the latency and cost do not suit a keyword NPC.

*How it works (technical).*
- **Where Winds Meet** [V, S198, S199, S200, S201]. Launched 14 Nov 2025 to over 2 million players, with AI chat on some side quest-givers. A report about 2.5 weeks later shows players repeating the NPC's line as a question or claiming the riddle solved to get rewards. The model claim (DeepSeek-R1) is one outlet [U, S203].
- **PUBG Ally** [V, S204, S206, S205, S207]. A quantized 2B model on the player's GPU, median 1.6 s per voice exchange (3.4 s cloud). Krafton pays $0 live; $3.70 to $7.10 per match is what Claude models would have cost in the cloud, $0.02 to $0.06 on Gemma 4 31B [V, self-reported]. inZOI also runs a small on-device model.
- **Audience** [V, S208, S209]. 120 of 338 Steam releases in one week disclosed AI; 52% of surveyed developers call generative AI bad for the industry.
- **Verdict** [I, note 08]. No runtime LLM on quest, shop, bank or travel NPCs. Use LLMs offline to draft bark variants for writers.

*Cost / performance.* 1 to 3 s before the first word, against one tick for a keyword match; a weak web client cannot run a 2B model [I, note 08].

*Games that used it.*
- Where Winds Meet AI NPC exploit: https://www.gamesradar.com/games/action-rpg/where-winds-meet-players-find-a-way-to-skip-side-quests-by-manipulating-the-mmos-ai-chatbot-npcs-into-just-giving-over-the-goods-instead
- PUBG Ally scorecard: https://www.invenglobal.com/articles/26592/built-a-teammate-got-a-chat-partner-kraftons-first-scorecard-for-pubg-ally

*How it feels.* Novel for ten minutes, then a puzzle to exploit, and each player's NPC "remembers" different things [I, note 08].

*Risks.* Reward extraction and off-canon output in a shared town [V, S202], plus disclosure rules and a retro audience likely to push back [I].

*Ratings 1–5 (author judgement):* Clarity 2 · Charm 3 · MMO fit 1 · Authoring 2 · Speed 1

---

## 5. Comparison scorecard

Author judgement, copied from the profiles: Clarity · Charm · MMO fit · Authoring · Speed.

| # | Technique | Clarity | Charm | MMO fit | Authoring | Speed | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Tibia keyword NPCs | 3 | 3 | 5 | 3 | 5 | 19 |
| A2 | RuneScape chatbox and chatheads | 4 | 4 | 4 | 3 | 5 | 20 |
| A3 | Ragnarok mes, next, cutin | 4 | 3 | 5 | 4 | 5 | 21 |
| A4 | Pokémon and Zelda printers | 5 | 4 | 3 | 4 | 5 | 21 |
| A5 | Ultima Online speech and journal | 3 | 2 | 4 | 4 | 5 | 18 |
| B1 | Tile-pinned overhead text | 4 | 3 | 5 | 5 | 5 | 22 |
| B2 | Greedy push-up stacking | 4 | 3 | 5 | 5 | 4 | 21 |
| B3 | Habbo upward stream | 3 | 4 | 3 | 5 | 4 | 19 |
| B4 | Caps, tiers, priority, log | 5 | 2 | 5 | 4 | 5 | 21 |
| B5 | Offscreen clamp and edge chip | 4 | 3 | 4 | 4 | 5 | 20 |
| C1 | Typewriter timing | 4 | 5 | 4 | 5 | 5 | 23 |
| C2 | Punctuation pauses | 4 | 5 | 4 | 4 | 5 | 22 |
| C3 | Complete-then-advance guard | 5 | 3 | 5 | 5 | 5 | 23 |
| C4 | Inline text tags | 4 | 5 | 4 | 4 | 4 | 21 |
| C5 | Box, 9-slice, arrow, open | 5 | 5 | 4 | 4 | 5 | 23 |
| C6 | Choice menus | 5 | 3 | 5 | 4 | 5 | 22 |
| C7 | Log, auto-advance, skip | 5 | 2 | 5 | 3 | 5 | 20 |
| D1 | Busts and expressions | 4 | 5 | 3 | 2 | 5 | 19 |
| D2 | Mouth flaps and blinks | 3 | 5 | 4 | 4 | 5 | 21 |
| D3 | Emote balloons | 5 | 5 | 5 | 4 | 5 | 24 |
| D4 | Turn to face and restore | 4 | 4 | 5 | 5 | 5 | 23 |
| D5 | Sprite acting, no portrait | 4 | 4 | 5 | 4 | 5 | 22 |
| E1 | Marker states | 5 | 3 | 5 | 5 | 5 | 23 |
| E2 | Offer, tracker, turn-in | 5 | 3 | 5 | 4 | 5 | 22 |
| E3 | Renown hearts | 4 | 5 | 5 | 3 | 5 | 22 |
| E4 | Short text, objective first | 5 | 2 | 5 | 4 | 5 | 21 |
| F1 | One service skips gossip | 5 | 2 | 5 | 5 | 5 | 22 |
| F2 | Keyword to trade window | 4 | 4 | 5 | 4 | 5 | 22 |
| F3 | Server re-validation | 3 | 1 | 5 | 4 | 5 | 18 |
| F4 | Touch flows | 5 | 3 | 5 | 4 | 5 | 22 |
| G1 | Rule-based barks | 3 | 4 | 5 | 4 | 5 | 21 |
| G2 | Schedules | 3 | 5 | 4 | 3 | 5 | 20 |
| G3 | Voice blips and UI sounds | 3 | 5 | 4 | 5 | 4 | 21 |
| G4 | Accessibility | 5 | 2 | 5 | 4 | 5 | 21 |
| H1 | Sessions and focus models | 4 | 3 | 5 | 4 | 5 | 21 |
| H2 | Line ids over the wire | 3 | 2 | 5 | 3 | 5 | 18 |
| H3 | Rate limits | 3 | 1 | 5 | 5 | 5 | 19 |
| H4 | Dialog tools | 3 | 3 | 4 | 5 | 4 | 19 |
| H5 | Localization | 4 | 2 | 5 | 3 | 4 | 18 |
| H6 | LLM NPCs | 2 | 3 | 1 | 2 | 1 | 9 |

**Reading the table.** Speed barely separates the rows, and that is the main runtime finding. Once bubbles are cached, text and markers are cheap at Tibia scale, so 33 of 40 rows score a 5 [V, S3]. Charm, clarity and authoring decide. Emote balloons (D3) win at 24 with one 16x16 sprite, an integer hop and a byte on the wire. Typewriter timing (C1), the press guard (C3), the box (C5), turn-to-face (D4) and markers (E1) follow at 23. LLM NPCs (H6) score 9. Re-validation (F3) and line ids (H2) score 18 because players never see them, yet §7 rests on both [I].

---

## 6. Deep dives

### 6a. Typewriter timing across games

Every engine we read stores speed as a wait per glyph. The table converts each to glyphs per second at 60 fps unless stated; Emerald's real frames include the print frame [V, S56].

| Game | Setting | Frames or ms per glyph | Glyphs per second | Pauses and guards | Source |
|---|---|---|---|---|---|
| Pokémon Emerald | Slow / Mid / Fast, default Mid | 9 / 5 / 2 frames (table 8 / 4 / 1) | 6.7 / 12 / 30 | `FC 08` pause byte; yes/no ignores input 5 frames | [V, S57, S56, S59] |
| Pokémon Emerald | A or B held | 1 frame | 60 | Needs a fresh press first | [V, S56] |
| Pokémon Crystal | Slow / Mid / Fast | 5 / 3 / 1 frames (source comment) | 12 / 20 / 60, or 10 / 15 / 30 with an extra print frame | Pause 30 frames; "…" 10 frames per dot; 20 frames before a new paragraph | [V, S63, S64; U on cps] |
| A Link to the Past | Per message code | Writer-set; speed 0 chains glyphs in one frame | n/a | Waits 31 to 500 by index; 28-frame guard after a page | [V, S66] |
| Undertale (via Create Your Frisk) | Default | 4 frames | 7.5 at Undertale's 30 fps (15 at 60) | `[w:x]` waits 4x frames | [V, S68, S69; U on Undertale itself] |
| Stardew Valley | Fixed | 30 ms (about 1.8 frames) | 33 | First glyph after 90 ms; 750 ms guard per new box | [V, S73] |
| Dialogic 2 | Default | 10 ms (0.6 frames) | 100 | `[pause]` 0.5 s times the speed multiplier | [V, S129] |
| Ren'Py | Template default | 0 (instant) | Instant; slider default range 200 | Auto-forward 1.5 s plus 0.06 s per character | [V, S126, S124] |
| OTClient overhead text | Lifetime, not typing | 60 ms per character | 16.7 of reading time | 3 s floor, yells doubled | [V, S25, S24] |
| Asterion proposal | Slow / Normal / Fast / Instant | 83 / 50 / 30 ms / 0 | 12 / 20 / 33 / instant | Comma 5 glyph-times, sentence end 10; 200 ms guard | [I] |

**What the table says.** Handhelds default to 12 to 20 glyphs per second and let a held button reach 60. Modern engines start at 33 to instant and assume a click completes the line. Reading floors meet at one number from two sides. OTClient keeps overhead text 60 ms per character and Ren'Py's auto mode waits 0.06 s per character, both 16.7 per second [V, S25, S124]. Faster than that outruns a slow reader, so it needs press-to-complete (C3); slower than 12 feels like waiting. Hence Normal at 20 and Fast at Stardew's 33 [I]. Our pause rule gives 250 ms after a comma and 500 ms after a sentence at Normal, close to RPG Maker's 15 frames and Crystal's 30 [V, S89, S64; I].

### 6b. Bubble clutter in crowds

| Game | Anchor | Overlap rule | Lifetime | Caps | Source |
|---|---|---|---|---|---|
| Tibia (OTClient) | Tile where it was said | None between speakers; same speaker, tile and mode merge | max(60 ms × chars, 3 s), yell ×2 | 11 lines per block; clamped to view | [V, S24, S26] |
| RuneScape 2006 | Moving actor | Greedy push up, 2 px margin, O(n²) | 150 / 100 cycles (about 3 s / 2 s) | 50 strings per frame | [V, S31; I on cycle length] |
| Habbo (Nitro) | Speaker x at spawn, then free | Line mode shifts all; free-flow pushes overlaps | Scrolls off at 15 px per 3 / 6 / 12 s | Max width 240 / 350 / 2000 px | [V, S45, S46] |
| Roblox (current) | Character root part | Stack per user, 6 px spacing | 30 s | 3 per user; "..." past 40 studs, hidden past 100 | [V, S50, S51] |

**Lifetime matters more than layout.** Count how many bubbles are alive at once. Say 30 players each speak a 30-character line every 20 s. With OTClient's 3 s floor, about 30 × 3 / 20 = 4.5 bubbles are alive on average. With Roblox's 30 s, 45 are. Under TFS's flood limit a spammer can sustain one line per 1.5 s, so 30 spammers keep 30 × 3 / 1.5 = 60 bubbles alive even at 3 s [I, arithmetic from V, S25, S51, S12]. A short per-character lifetime does more for crowds than any placement algorithm.

**Clever placement buys little.** Comic research places balloons by cartographic labelling or reading order [V, S182, S181]. At tens of bubbles, a sorted greedy push is enough [I].

**The pipeline we recommend** [I]. Server interest first (say ±8 x ±6 tiles, yell ±18 x ±14) [V, S11]. Lifetime `max(3000, 60 × chars)` ms [V, S25]. Render each bubble once into a cached image (§6d). Sort by priority, then age. Cap at 3 per speaker and about 12 per 320x180 view, overflow to the log. Greedy push with a 2 px margin, clamp to a 4 px inset with the tail on the speaker, edge chips for offscreen NPCs and party. Section 7 has the code.

### 6c. Many players and one NPC: focus, authority and bytes

**Three focus models.**

| Model | Who uses it | Queue griefing | What bystanders see | NPC facing | Source |
|---|---|---|---|---|---|
| Single focus plus queue | TFS 0.3 `CONVERSATION_DEFAULT` | Yes, up to the 120 s idle limit | "Wait for your turn" with a queue size | The one focused player | [V, S17; I] |
| Multi-focus, private replies | TFS 1.x, Canary | None; topic per player | The greeting only; replies are private | First in focus (TFS), latest (Canary) | [V, S4, S20] |
| Private dialog window | Ragnarok, RuneScape, WoW | None | Nothing | Not part of the model | [V, S37; U for RuneScape and WoW servers] |

The middle row is Tibia without the griefing, and the NPC turning to someone tells bystanders it is busy. We add an optional public line, at most one per NPC per 8 to 15 s, so a crowd sees it working [I, note 05].

**Bytes per dialog step.** Sizes before framing. Tibia frames each packet with XTEA padding to 8-byte blocks, a 2-byte length and a 4-byte checksum or sequence header, and batches several messages per buffer [V, S16, S23].

| Message | Layout | Bytes | Source |
|---|---|---|---|
| Tibia NPC say, "Riona": "Greetings, Alice." | 18 fixed + name 5 + text 17 | 40 | [V, S15] |
| Tibia NPC say, "Al Dee" with a 62-character greeting | 18 + 6 + 62 | 86 | [V, S22; I] |
| Tibia shop open, 30 items with 12-character names | header + 30 × (17 + 12) | about 870 plus header | [V, S15; I] |
| Tibia purchase | opcode + 7 | 8 | [V, S15] |
| Proposed `npc_line`, no argument | opcode 1 + entity 4 + line id 2 + arg count 1 | 8 | [I] |
| Proposed `npc_line` with a 5-character name | 8 + length 2 + 5 | 15 | [I] |
| Proposed `choice` | opcode 1 + session 2 + index 1 | 4 | [I] |
| One NPC line to 30 players, text against id | 30 × 86 against 30 × 8 | 2,580 against 240 | [I, note 07] |

Bandwidth is not why ids win; 2.6 KB per line is small next to movement [I, note 07]. Ids win because the client holds its own language, the server never trusts what the client shows, and markers can read the same graph the server runs [I]. The client sends intents only, the server re-checks every choice when applied, and ending focus clears pending trades [V, S4, S11].

**Latency.** TFS delays every reply by 1 s, so Tibia players expect the NPC to think [V, S4]. Play the turn, the box open and a "..." the moment talk is pressed, and a 100 to 200 ms round trip hides inside the 8-frame open (133 ms) plus the greeting animation. Never predict a state change [I, note 05].

### 6d. Runtime cost: what text really costs

Our benchmark draws on a 320x180 canvas and upscales once with nearest filtering [V, S3]. Mean ms per frame including a 1 px readback; subtract the empty frame for text alone. The timer is clamped to 0.1 ms.

| Test (320x180, upscaled to 720p) | M4 GPU | M4, 6x CPU throttle | SwiftShader (software) | Profiles |
|---|---|---|---|---|
| Empty frame (baseline) | 0.35 | 1.01 | 3.66 | n/a |
| 2,000 bitmap glyph blits | 2.39 | 9.12 | 35.17 | B1 |
| 2,000 glyphs by `fillText` (40 calls) | 0.38 | 1.30 | 27.51 | H5 |
| Typewriter box, 192 glyphs, static | 0.38 | 1.24 | 5.70 | C1, C5 |
| Typewriter box, 192 glyphs, wave | 0.39 | 1.19 | 5.70 | C4 |
| 50 bubbles redrawn (1,891 glyphs) | 2.95 | 10.51 | 40.08 | B4 |
| 50 bubbles cached | 0.47 | 1.13 | 6.29 | B4 |
| 200 bubbles redrawn (7,866 glyphs) | 10.95 | 44.98 | 152.84 | B4 |
| 200 bubbles cached | 1.07 | 1.78 | 12.04 | B4 |
| WebGL2 instanced, 10,000 glyphs, one draw | 0.41 | 1.11 | 145.51 | H5 |

**Machine.** Apple M4 Pro (14 cores, 48 GB), macOS 26.5.1, Chromium 153.0.8010.12 under Playwright; ANGLE Metal for the GPU runs, a DevTools 6x CPU throttle that slows JavaScript but not the GPU, and SwiftShader in software. A bubble is 9 frame blits plus one per glyph. No phone and no Godot build were measured [V, S3].

**What it means.**
- **Cost tracks draw commands, not pixels.** A blit costs about 1.1 µs on the M4 and 4 to 4.5 µs throttled [I, arithmetic]. One `fillText` per line beat per-glyph blits 6x at 2,000 glyphs [V, S3].
- **Cache bubbles.** 200 redrawn bubbles cost 44.98 ms throttled, nearly three frames; cached, 1.78 ms, holding about 1.1 MB of RGBA [V, S3].
- **The dialog box is free.** Static and wave measure the same [V, S3].
- **Software GL is the floor.** On SwiftShader each glyph quad costs about 14.5 µs however it is batched. Detect "SwiftShader" in `WEBGL_debug_renderer_info` and fall back to cached, fewer bubbles [I, note 07].

**What Godot adds** (published, not measured by us).
- Compatibility has batched 2D since 4.0; a batch breaks on a texture, blend, repeat or command change [V, S190, S195].
- A Label with shadows went from about 2 ms to 30 ms [V, S192]; one with 23,412 characters took 40,332 draw calls [V, S191]. PR 103471 (4.5) draws shadows then text in two calls, "almost 2x faster" [V, S193].
- RichTextLabel effects redraw every frame, per glyph [V, S196]; a 100k-character Label reprocesses everything each frame [V, S194].
- A font atlas page is at least 256x256 LA8 (128 KiB), so a Latin pixel font at 2 or 3 sizes is under 0.5 MB [V, S197; I, note 07].
- NinePatchRect plus Label bubbles alternate two textures, about 2N draw calls for N bubbles; put frames on one layer and text above, or bake each bubble [I, note 07].

### 6e. Authoring tools compared

Read from the GitHub API and LICENSE files on 2026-11-11 [V, note 06, note 11]. C# integrations (godot-ink, YarnSpinner-Godot) are left out because C# projects cannot export to web [V, S155].

| Tool | Licence | Godot 4 web export | Headless server | Localization | Latest release | Verdict |
|---|---|---|---|---|---|---|
| Dialogue Manager | MIT | Yes, GDScript, Godot 4.6+ | Inside a headless Godot build (untested) | `tr()`, PO or CSV, static ids, translator notes | v4.2.0, 2026-10-30 | Default for the client [I] |
| Dialogic 2 | MIT | Yes, GDScript, Godot 4.5+ | Poor fit, scene-based | Built in | 2.0-alpha-20, 2026-07-21 | Single-player scenes only [I] |
| ink + inkgd | MIT | Yes, GDScript, `godot4` branch only | n/a in Godot | None built in; tags as keys | No Godot 4 release | Risky until released [I] |
| ink runtime / inkjs | MIT | inkjs in a browser, not inside Godot | Yes, .NET or Node, state as one JSON string | None built in | ink v1.2.1; inkjs v2.4.0 (31 KB gzip) | Best server format if the server is not Godot [I] |
| Yarn Spinner core | MIT | n/a | Yes, .NET | Own CSV | v3.2.1 | Good server format [I] |
| YarnSpinner-Godot-GDScript | YSPL 1.0 (custom) | Yes, Godot 4.6+ | Inside Godot | Built in | Early access, repo created 2026-02-25 | Read the licence first [V, S148] |
| TFS / Canary Lua | GPL-2.0 | n/a | Yes, it is the server | Inline strings, no extraction | TFS v1.6; Canary v3.6.1 | Copy the rules, not the code [I] |
| rAthena script | GPL-3.0 | n/a | Yes | Hercules extracts to PO | Active | Copy the commands' ideas [I] |

**What we would do** [I]. Dialogue Manager files if the server is headless Godot, ink if not. Conditions call a whitelist of server functions (`has_item`, `quest_stage`, `gold >= n`), quest storage stays as named keys per player, and every line gets a static id from day one, because retrofitting ids into thousands of lines is the job nobody finishes.

---

## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)

All of this section is design proposal [I], built from the cited parts. The NPC Dialog Sandbox (§8) plays it.

**Layers, bottom to top.**
1. **Server conversation truth (gameplay).** Dialog graphs and quest state live on the server. One session per player (NPC id, node, allowed choices, variables, expiry); the client sends intents and the server answers with line ids and arguments (A1, F3, H1, H2).
2. **Speech channels and interest.** Say ±8 x ±6 tiles and yell ±18 x ±14, as TFS sends them; conversation range 3 tiles. A chat bucket of 4 with a credit back every 1.5 s, a separate NPC bucket. Multi-focus with private replies, or shared focus with a queue for comparison (B4, H1, H3).
3. **Dialog content and authoring.** A Yarn- or Dialogue Manager-like text format with nodes, options, conditions such as `<<if $herbs >= 3>>` and keywords, parsed at load, plus an English and Spanish string table (H4, H5).
4. **World presentation.** NPCs face the first talker and restore after a short idle; emotes hop on integer gravity; markers show `!`, a hollow grey `?` and a gold `?` with a whole-pixel bob; a prompt when facing an NPC (D3, D4, D5, E1).
5. **Overhead text layer.** Cached 9-slice bubbles with a sliding tail, alive `max(3 s, 60 ms × chars)`, placed by the clutter pass below, with edge chips and the log as overflow (B1, B2, B4, B5).
6. **Dialog UI.** Box with portrait, bubble only, or keyword chat. A 20 cps typewriter with pauses and tags, press to complete, a 200 ms guard, a 0, 1, 2, 1 arrow, a safe-default choice menu, an 8-frame open and a log (C1 to C7, D1, D2).
7. **Panels and handoff.** Offer card, tracker line, reward popup, and a trade panel the NPC speaks you into and out of; walking out of range ends the talk politely (E2, F1, F2).
8. **Ambient life.** Schedules on a compressed clock and rule-based barks with cooldowns that never cover an active conversation (G1, G2).
9. **Audio and accessibility.** Blips on every second glyph with a per-NPC pitch, UI sounds, speed presets including instant, auto-advance, a 2x font and reduce motion (G3, G4).

**Pseudocode.**

Server session and intents (H1, H2, H3, F3), GDScript-like:
```
const TALK_RADIUS := 3          # tiles (TFS; Canary 4)
const IDLE_S := 120.0           # TFS
const NPC_RATE := 3.0           # tokens/s, estimate
const NPC_BURST := 5.0

func take_token(b: Bucket, t: float) -> bool:          # leaky bucket
    b.tokens = min(NPC_BURST, b.tokens + (t - b.t) * NPC_RATE)
    b.t = t
    if b.tokens < 1.0: return false
    b.tokens -= 1.0
    return true

func on_intent(p: Player, m: Intent) -> void:
    if not take_token(p.npc_bucket, now()): return
    var npc: Npc = npcs[m.npc_id]
    if p.pos.z != npc.pos.z or chebyshev(p.pos, npc.pos) > TALK_RADIUS: return
    var s: Session = sessions.get(p.id)
    match m.kind:
        TALK:
            if s == null:
                s = Session.new(npc.id)
                sessions[p.id] = s
                npc.focus.append(p.id)                  # multi-focus list
            run_node(p, s, npc, npc.graph.start)
        CHOOSE:
            if s == null or not m.index in s.allowed: return
            var opt = npc.graph.nodes[s.node].options[m.index]
            if not eval_cond(opt.cond, p, s): return    # re-check on apply
            apply_mutations(opt.mutations, p, s)
            run_node(p, s, npc, opt.next)
        KEYWORD:
            if s != null:
                var next = npc.graph.match_keyword(s.node, m.text)
                if next: run_node(p, s, npc, next)
    if s != null: s.last_t = now()

func run_node(p: Player, s: Session, npc: Npc, node: Node) -> void:
    s.node = node.id
    var line = node.first_line_passing(p, s)
    s.allowed = node.option_indices_passing(p, s)
    send(p, NPC_LINE, npc.id, line.id, line.args(p), s.allowed)    # 8 to 20 bytes
    if line.public_id != 0 and now() - npc.last_public > 10.0:
        broadcast_say_range(npc, NPC_BARK, npc.id, line.public_id)
        npc.last_public = now()

func tick_1s() -> void:
    for pid in sessions.keys():
        var s: Session = sessions[pid]
        var npc: Npc = npcs[s.npc_id]
        if chebyshev(players[pid].pos, npc.pos) > TALK_RADIUS: end_session(pid, &"walk_away")
        elif now() - s.last_t > IDLE_S: end_session(pid, &"idle")
    for npc in npcs_with_focus():
        npc.face(npc.focus[0])                          # TFS: first talker still in focus
```

Client typewriter with inline tags (C1 to C4, G3). Tags never count as glyphs:
```
const BASE_MS := 50.0                       # Normal, 20 glyphs/s
const GUARD_MS := 200.0
const PUNCT := {",": 5, ".": 10, "!": 10, "?": 10}   # extra glyph-times after

func parse(src: String) -> Array:           # "[c=key]trade[/c]", "[wave]", "[p=12]", "[spd=2]"
    var out := []
    var col := COL_TEXT; var wave := false; var spd := 1.0; var pend_f := 0
    var i := 0
    while i < src.length():
        if src[i] == "[":
            var j := src.find("]", i)
            var tag := src.substr(i + 1, j - i - 1)
            if tag == "c=key": col = COL_KEY
            elif tag == "/c": col = COL_TEXT
            elif tag == "wave": wave = true
            elif tag == "/wave": wave = false
            elif tag.begins_with("p="): pend_f += int(tag.substr(2))
            elif tag.begins_with("spd="): spd = float(tag.substr(4))
            i = j + 1
            continue
        out.append({ch = src[i], col = col, wave = wave, spd = spd, pause_f = pend_f})
        pend_f = 0
        i += 1
    return out                                  # word-wrap the full list before typing

func update(dt_ms: float) -> void:
    guard_ms = max(0.0, guard_ms - dt_ms)
    if shown >= glyphs.size(): return
    t_ms += dt_ms
    while shown < glyphs.size():
        var g = glyphs[shown]
        var need: float = BASE_MS * speed_mult / g.spd + g.pause_f * 1000.0 / 60.0
        if t_ms < need: break
        t_ms -= need
        shown += 1
        t_ms -= PUNCT.get(g.ch, 0) * BASE_MS * speed_mult / g.spd   # pause after punctuation
        if g.ch != " " and shown % 2 == 0: play_blip(voice, pitch + randf_range(-0.5, 0.5))
    if shown == glyphs.size(): guard_ms = GUARD_MS; mouth_open = false

func on_press() -> void:
    if shown < glyphs.size():                   # first press completes
        shown = glyphs.size(); guard_ms = GUARD_MS; return
    if guard_ms > 0.0:                          # early press shaves, Stardew-style
        guard_ms = max(0.0, guard_ms - 50.0); return
    advance()                                   # second press goes on

func draw_glyph(k: int) -> void:
    var g = glyphs[k]
    var dy := 0
    if g.wave and not reduce_motion: dy = roundi(sin(time_s * 6.0 + k * 0.6))   # 1 px, whole pixels
    blit(atlas, g.ch, pos[k] + Vector2i(0, dy), g.col)
```
`speed_mult` is 1.67 for Slow, 1.0 for Normal, 0.6 for Fast, and 0 for Instant, so Slow waits 83 ms and Fast 30 ms per glyph. At Normal a comma adds 250 ms and a full stop 500 ms. `[p=12]` adds 12 frames, 200 ms, before the next glyph.

Bubble clutter pass (B1, B2, B4, B5), run every frame on bubbles already cached as images:
```
const MARGIN := 2           # px between bubbles, RuneScape
const INSET := 4            # px from the view edge
const PER_SPEAKER := 3      # Roblox MaxBubbles
const MAX_VISIBLE := 12     # estimate for a 320x180 view
# prio: 0 my conversation, 1 party, 2 nearby players, 3 ambient barks

func life_ms(chars: int, yell: bool) -> int:
    return max(3000, 60 * chars) * (2 if yell else 1)            # OTClient

func layout(bubbles: Array, view: Rect2i) -> void:
    bubbles.sort_custom(func(a, b): return a.prio < b.prio or (a.prio == b.prio and a.born < b.born))
    var placed: Array[Rect2i] = []
    var per := {}
    for b in bubbles:
        per[b.speaker] = per.get(b.speaker, 0) + 1
        var head: Vector2i = Vector2i(b.speaker_screen_pos.floor())
        b.visible = per[b.speaker] <= PER_SPEAKER and placed.size() < MAX_VISIBLE
        if b.visible and not view.has_point(head):
            b.visible = false
            if b.prio <= 1: show_edge_chip(b, head, view)        # NPC or party only
        if not b.visible:
            chat_log.add_once(b.line)                            # never lost
            continue
        var r := Rect2i(head.x - b.w / 2, head.y - b.h - TAIL_H, b.w, b.h)
        var moved := true
        while moved:                                             # greedy push up
            moved = false
            for q in placed:
                if r.grow(MARGIN).intersects(q):
                    r.position.y = q.position.y - r.size.y - MARGIN
                    moved = true
        r.position.x = clampi(r.position.x, view.position.x + INSET, view.end.x - INSET - r.size.x)
        r.position.y = clampi(r.position.y, view.position.y + INSET, view.end.y - INSET - r.size.y)
        b.tail_x = clampi(head.x, r.position.x + 3, r.end.x - 4)  # tail stays over the speaker
        b.rect = r
        placed.append(r)
```
The push loop ends because each move only goes up and `placed` is finite. Oldest-first sorting keeps old bubbles in their slots so the crowd does not reshuffle. The clamp can reintroduce an overlap at the top edge; at 12 bubbles we accept that.

---

## 8. Reference implementation: the NPC Dialog Sandbox

`feel-npc-dialog-sandbox.html` [S2] is one hand-written page of plain JavaScript on a **320×180** canvas, scaled with pixelated rendering at an integer scale where it fits. It plays the nine layers of §7 and shows each layer's cost live. Its design choices are ours [I], every number on it is illustrative, and it loads no external assets; tiles, sprites, portraits, frames, icons and the bitmap font are drawn in code.

**The world.** A town square on 16x16 px tiles, half of Asterion's 32 px, so every pixel size in the sandbox is half the Asterion value. Cobbles, a fountain, a shop counter, a notice board, a tavern door, trees, a bench and lamp posts. Walk with arrows, WASD or a tap; a prompt (and a Talk button on touch) appears when facing an NPC within 1 tile.

**The NPCs.**
- **Quest giver.** An elder by the notice board whose marker moves from `!` to a hollow grey `?` to a gold `?`. Bring 3 herbs from the planters, with an offer card, a tracker line and a reward popup.
- **Shopkeeper.** A greeting, a handoff to a trade panel with 4 to 6 items and a gold counter, and back to dialog on close.
- **Keyword guard.** Typed or clicked keywords (hi, name, job, travel, bye). Replies show as a cyan overhead line, as OTClient draws NPC replies, and in a chat log with clickable keywords. "Shared focus" serves one talker and tells others to wait (TFS 0.3); "private sessions" talks to all and faces the first talker in focus (TFS 1.x).
- **Villagers.** Two or three townsfolk on schedules who bark within about 3 tiles, with a cooldown, and turn their heads.
- **Simulated players.** A 0 to 30 slider of wandering sprites that chat in bubbles and sometimes say "hi" to the guard, the crowd stress test.

**Text.** A 5x7 font on a 6 px advance for the box and a 3x5 font in a 4x6 cell for bubbles, blitted from an atlas built at load, with a `fillText` toggle for comparison. Tags `[c=key]…[/c]`, `[wave]`, `[p=12]` and `[spd=2]` drive colour, motion, pauses and speed.

**Controls.** Dialog style (box with a 32x32 portrait, bubble only, keyword chat; keys 1 to 3), renderer, clutter strategy (overlap, stack, priority with caps, collapse to log), focus model, optimistic open, movement lock, English or Spanish, blips, reduce motion and large text. Sliders for characters per second, simulated players and 0 to 400 ms of latency. V cycles normal, chat ranges, server sessions and cost views; L opens the log; P pauses.

**The efficiency HUD.** Smoothed `performance.now()` timings for world and sprites, overhead text, dialog UI, panels and ambient logic against a 16.7 ms bar. Counters for glyphs, bubbles alive and hidden, blits per frame, bytes per dialog step (ids against text), crowd messages per second and lines dropped by the rate limit.

**What it demonstrates.**
- Sessions and line ids in the server panel; "wait for server" against optimistic open on the latency slider.
- Bubbles alive `max(3 s, 60 ms × chars)`, capped at 3 per speaker and 12 on screen, pushed up and clamped with edge arrows.
- A 20 cps typewriter with pauses, a 200 ms guard, an 8-frame open, a 0, 1, 2, 1 arrow at 9 frames per step, and a mouth that stops with the text.
- A chat bucket of 4 refilled every 1.5 s beside an NPC bucket of 3 per second; Spanish expansion; blips for your own conversation after the first gesture.

**Thumbnail.** The `data-demo="showcase"` button sets the player talking to the quest giver with the portrait box mid-sentence and a wave word visible, a gold `?` over another NPC, two or three bubbles in the square, and the shopkeeper at the counter.

**Simplifications (honest list)** [I].
- Canvas 2D on the CPU; HUD times are JavaScript costs comparable with §6d, not Godot.
- "Server" and "client" share one page; bytes are counted, latency is a timer.
- Ranges, limits, cooldowns and the compressed clock are illustrative.

---

## 9. Gem findings

Licences were read from LICENSE files, raw licence text or asset pages on 2026-11-11 [V, note 06, note 11]. The GPL servers are the best NPC references we found and the worst code to paste. **Flags:** **Low** = MIT/BSD/Apache/CC0; **LGPL** = fine as a separate library; **Copyleft** = GPL/AGPL/CC BY-SA, study and re-implement; **None** = no licence, study only.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| Dialogue Manager | https://github.com/nathanhoad/godot_dialogue_manager | MIT | v4.2.0 (2026-10-30), 3,977 stars | GDScript dialog with PO/CSV and balloon examples, Godot 4.6+ | Low |
| Dialogic 2 | https://github.com/dialogic-godot/dialogic | MIT | 2.0-alpha-20, 6,163 stars | Timeline editor, portraits, auto-advance | Low |
| ink and inkjs | https://github.com/inkle/ink ; https://www.npmjs.com/package/inkjs | MIT | ink v1.2.1; inkjs v2.4.0, 31 KB gzip | Server dialog with state as one JSON string | Low |
| inkgd | https://github.com/ephread/inkgd | MIT | `godot4` branch, no release | Pure GDScript ink | Low |
| Yarn Spinner core | https://github.com/YarnSpinnerTool/YarnSpinner | MIT | v3.2.1, 2,875 stars | Headless .NET dialog for a server | Low |
| YarnSpinner-Godot-GDScript | https://github.com/YarnSpinnerTool/YarnSpinner-Godot-GDScript ; https://raw.githubusercontent.com/YarnSpinnerTool/YarnSpinner-Godot-GDScript/main/LICENSE.md | Yarn Spinner Public Licence 1.0, custom, source-available | Early access, alpha, repo from 2026-02-25 | GDScript Yarn with saliency and localization | None (custom YSPL: games may ship, but section 3.3 bars AI training on the code and asks users to keep AI tools from sending it; 3.2 bars rival tools) |
| Twine 2 | https://github.com/klembot/twinejs | GPL-3.0 | 2.12.1 | Branch prototyping; output is yours | Copyleft (editor only) |
| The Forgotten Server | https://github.com/otland/forgottenserver | GPL-2.0 | v1.6, 1,844 stars | NPC handler, multi-focus, flood buffer, shop checks | Copyleft |
| Canary | https://github.com/opentibiabr/canary/tree/main/data-otservbr-global/npc | GPL-2.0 | v3.6.1, 668 stars | Lua NPC configs with voices and shops | Copyleft |
| rAthena | https://github.com/rathena/rathena/blob/master/doc/script_commands.txt | GPL-3.0 | 3,648 stars | Modal script commands, timeouts, place links | Copyleft |
| OTClient | https://github.com/edubart/otclient/blob/master/src/client/statictext.cpp | Not read | Reference Tibia client | Overhead text, keyword links, trade window | None until checked |
| pokeemerald | https://github.com/pret/pokeemerald/blob/master/src/text.c | Decompilation, no licence read | Complete | Printer timings, emote hop, menus | None (study only) |
| Beehave | https://github.com/bitbrain/beehave | MIT | v2.9.3, 3,324 stars | GDScript behaviour trees for villagers | Low |
| Remote Transform Control | https://www.godotengine.org/asset-library/asset/edit/11561 | MIT | Godot 4.2 asset | A Control that follows a 2D node, for bubbles | Low |
| m5x7 | https://managore.itch.io/m5x7 | CC0, attribution appreciated | 33 kB TTF, accents | Dialog font at 16/32/48 | Low |
| m6x11 | https://managore.itch.io/m6x11 | Free with attribution | m6x11plus at 18/36/54 | Larger dialog font | Low (attribution required) |
| Monogram | https://datagoblin.itch.io/monogram | CC0 | 5 px fixed width, TTF and PNG | Monospace font, five languages | Low |
| Pixel Operator | https://fontlibrary.org/en/font/pixel-operator | CC0 | 16 px grid plus 8 px variants | Plain sans pixel font for accessibility | Low |
| Febucci Text Animator for Godot | https://docs.febucci.com/text-animator-godot/other/requirements-and-limitations | Paid, licence text not found | Early access, C# only | Text effects; no web export | None (licence not found) |

**Picks.** Dialogue Manager for the client, ink or Yarn core for a non-Godot server, Monogram or m5x7 for text, Pixel Operator as the plain option. Read TFS and rAthena for rules and numbers, and write our own code [I].

---

## 10. Learnings and anti-patterns

**Learnings.**
1. **The server owns the conversation; the client owns the feel.** Optimism stops at a state change [I].
2. **Multi-focus with private replies answers the busy NPC.** Face the first talker so the NPC does not snap around [V, S4; I].
3. **Lifetime beats layout.** A 3 s floor plus 60 ms per character keeps crowds at a few bubbles [I, §6b].
4. **Cache every bubble.** 10.51 ms becomes 1.13 ms for 50 bubbles on a throttled CPU [V, S3].
5. **Four speed presets and hold-to-fast-forward**, with first press completing and a short guard [V, S56, S73; I].
6. **Charm is integer motion.** A 0, 1, 2, 1 arrow, a 15 px hop, an 8-frame open [V, S56, S61, S88].
7. **Shape for kind, a second cue for state.** Blizzard is still fixing colour-only markers [V, S105].
8. **Objective first, and static line ids from the first line** [V, S107; I].
9. **Barks are rules with expiring facts**, under a microsecond per lookup [V, S163].
10. **Blips only for your own conversation** [I, note 08].

**Anti-patterns.**
1. **Colour-only keywords and markers** [V, S178, S104].
2. **One rate limit for chat and NPC talk**, or none for NPC talk as in TFS [V, S11].
3. **Trusting the menu** instead of re-checking when the choice is applied [V, S11].
4. **RichTextLabel effects on crowd bubbles, and Label shadows before Godot 4.5** [V, S196, S192].
5. **Stretched 9-slice edges and non-integer UI scale** [V, S189, S180].
6. **A cinematic camera in a shared world.** ESO players have asked for years to turn it off [V, S122].
7. **Typed English keywords as the only way in** [I].
8. **Runtime LLMs on reward-giving NPCs** [V, S200].

---

## 11. "See it in action" index

| # | Game | Interaction idea | URL |
|---|---|---|---|
| 1 | Tibia | Keyword NPC handler, 3-tile radius, 1 s reply delay | https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npchandler.lua |
| 2 | Tibia | Official manual on talking to NPCs | https://www.tibia.com/gameguides/?subtopic=manual&section=npcs |
| 3 | Tibia | Cyan NPC replies and clickable `{keyword}` links | https://github.com/edubart/otclient/blob/master/modules/game_console/console.lua |
| 4 | Tibia | Overhead text on the tile, 60 ms per character | https://github.com/edubart/otclient/blob/master/src/client/statictext.cpp |
| 5 | Tibia | NPC trade window | https://github.com/edubart/otclient/blob/master/modules/game_npctrade/npctrade.otui |
| 6 | Tibia | Canary NPC with voices, shop rows and storage | https://github.com/opentibiabr/canary/blob/main/data-otservbr-global/npc/sam.lua |
| 7 | RuneScape | Overhead chat effects | https://oldschool.runescape.wiki/w/Chat_effects |
| 8 | RuneScape | Chatbox dialog and chathead expressions | https://runelibris.github.io/RuneLibris/Info/Dialogue |
| 9 | RuneScape | Greedy push-up of overhead text | https://github.com/2006-Scape/2006Scape/blob/master/2006Scape%20Client/src/main/java/Game.java |
| 10 | Old School RuneScape Mobile | Long-press menus on touch | https://oldschool.runescape.wiki/w/Old_School_RuneScape_Mobile |
| 11 | Ragnarok Online | `mes`, `next`, `select`, `cutin`, place links | https://github.com/rathena/rathena/blob/master/doc/script_commands.txt |
| 12 | Ultima Online | Speech by line, fade and journal | https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Managers/MessageManager.cs |
| 13 | Habbo | Upward bubble stream | https://github.com/billsonnn/nitro-react/blob/dev/src/components/room/widgets/chat/ChatWidgetView.tsx |
| 14 | Roblox | Bubble caps and distance tiers | https://github.com/Roblox/creator-docs/blob/main/content/en-us/chat/bubble-chat.md |
| 15 | Pokémon Emerald | Text printer and bobbing arrow | https://github.com/pret/pokeemerald/blob/master/src/text.c |
| 16 | Pokémon Emerald | Emote hop | https://github.com/pret/pokeemerald/blob/master/src/trainer_see.c |
| 17 | The Legend of Zelda: A Link to the Past | Per-glyph blip and 28-frame guard | https://github.com/snesrev/zelda3/blob/master/src/messaging.c |
| 18 | EarthBound | Window flavours | https://legendsoflocalization.com/?p=301 |
| 19 | Stardew Valley | One-string dialog format and portraits | https://stardewvalleywiki.com/Modding:Dialogue |
| 20 | Stardew Valley | 30 ms typing and 750 ms guard | https://github.com/E-riCA0/StawdewValley/blob/HEAD/Menus/DialogueBox.cs |
| 21 | Celeste | Wave, shake and trigger tags | https://github.com/EverestAPI/Resources/wiki/Adding-Custom-Dialogue |
| 22 | Celeste | One looping voice per character | https://www.thegamer.com/celeste-sound-designer-reveals-how-the-games-dialogue-audio-was-created/ |
| 23 | Undertale | Fonts and voices per character | https://fontsinuse.com/uses/51307/undertale-dialogue-and-interfaces |
| 24 | Octopath Traveler | NPC verbs | https://primagames.com/tips/octopath-traveler-characters-talents-path-actions |
| 25 | CrossCode | Side messages during play | https://www.moddb.com/games/crosscode/news/crosscode-recap-2013 |
| 26 | Village Monsters | 48x48 portraits | https://josh-bossie.itch.io/village-monsters/devlog/249628/building-a-village-a-portrait-is-worth-a-thousand-words |
| 27 | RPG Maker MV | Turn to face and restore | https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_objects/Game_Event.js |
| 28 | World of Warcraft | Quest marker states | https://lotro.allakhazam.com/wiki/Quests_(WoW) |
| 29 | World of Warcraft | Gossip skipped for one service | https://warcraft.wiki.gg/wiki/API:C_GossipInfo.ForceGossip |
| 30 | Final Fantasy XIV | Icon shape by category | https://na.finalfantasyxiv.com/uiguide/know/faq-display/interface_npc_icon.html |
| 31 | Guild Wars 2 | Renown hearts that fill | https://wiki.guildwars2.com/wiki/Renown_heart |
| 32 | Honkai: Star Rail | Skip with story summary | https://www.siliconera.com/?p=1095169 |
| 33 | Left 4 Dead 2 | Rule-matched barks | https://cdn.fastly.steamstatic.com/apps/valve/2012/GDC2012_Ruskin_Elan_DynamicDialog.pdf |
| 34 | Where Winds Meet | LLM NPCs talked out of rewards | https://www.gamesradar.com/games/action-rpg/where-winds-meet-players-find-a-way-to-skip-side-quests-by-manipulating-the-mmos-ai-chatbot-npcs-into-just-giving-over-the-goods-instead |

---

## 12. What remains unverified (and corrections)

**Corrections made during research** (note 11 checked each against raw source)
1. **OTClient NPC colour.** Note 09 said yellow. NPC replies are cyan `#5FF7F7`; player say is yellow; an NPC line is yellow only when sent as plain `Say` [V, S24, S28]. The Sandbox spec said "yellow-ish"; we changed it.
2. **TFS facing.** TFS faces the first talker still in focus, Canary the latest; earlier notes disagreed [V, S4, S20].
3. **Emerald.** Notes 02 and 09 gave 7.5, 15 and 60 cps and a 32-frame arrow. The printer spends 9, 5 and 2 frames (6.7, 12, 30 cps), and the arrow holds 9 frames per step, a 36-frame cycle [V, S56].
4. **Canary.** Radius 4; no idle timeout; the 15 s, 50% bark is per-NPC data [V, S19, S20].
5. **TFS flood.** One credit back every 1.5 s; the 5th message mutes [V, S12].
6. **Where Winds Meet.** Not "within days"; the dated report is about 2.5 weeks after launch [V, S200].
7. **PUBG Ally.** It runs on-device, so Krafton pays $0; the dollar figures were the cloud alternative [V, S204].
8. **Per-blit cost.** Note 07 said 1.3 and 5.5 µs; its own table gives about 1.1 and 4 to 4.5 µs [I].

**Estimates and derived values.** Every cps in §6a is derived, and Crystal's would be 10 / 15 / 30 with an extra print frame [U]. RuneScape's lifetimes assume a 20 ms cycle [I, note 01]. Byte counts are arithmetic, not captures, and timing, cap and cooldown proposals are design estimates [I, notes 02 to 09].

**Still unverified [U]**
- **Chrono Trigger, Golden Sun, Sea of Stars, Eastward, Chained Echoes.** No primary source for speed, layout, portraits or acting; Chrono Trigger's 1 to 8 speeds are memory; the Sea of Stars font claim is one blog [U, S87, S77].
- **Marker pixel sizes.** No official WoW or FFXIV marker size or draw distance; 16x16 is the wiki icon file [U, note 03].
- **Undertale.** Timings come from a fan engine. At 30 fps, 4 frames per glyph is 7.5 cps; note 08 assumed 60 fps and 15 [U, S68, S69].
- **EarthBound** base speeds and **Stardew** 1.6 timings (our decompile is pre-1.5) [U, S75, S73].
- **RuneScape** chatbox size and server sessions; **MapleStory, Albion, Lineage** NPC systems [U, notes 01 and 05].
- **Godot.** No web build measured; no Label against RichTextLabel figure; PR 103471 in 4.4.x unconfirmed; web pitch issues rest on one report [U, note 07, S174].
- **Phones.** None measured [S3]. **Skip telemetry.** None published [U, S123].
- **Dates and licences.** Tibia 8.2's year and TFS 0.3's dates are memory; OTClient, Ren'Py, Nitro, Roblox, 2006Scape and RPG Maker MV licences were not read [U, note 06].

---

## 13. Prototype roadmap for Godot 4 (web, Compatibility)

1. **Measure first.** Run `textbench.html` [S3] on a low-end Android phone and an older iPhone. Then a 320x180 Compatibility web export with 1, 10, 50 and 200 NinePatchRect plus Label bubbles, reading `RENDER_TOTAL_DRAW_CALLS_IN_FRAME`, and again with baked bubbles.
2. **Pixel text.** Monogram or m5x7 as an image font, Nearest filtering, integer sizes, subpixel positioning off, no Label shadows below 4.5 [V, S161, S193].
3. **Server session.** Sessions with NPC id, node, allowed choices and expiry; multi-focus NPCs facing the first talker; line ids; re-checks on apply; a separate NPC bucket.
4. **Dialog data.** Dialogue Manager files with static ids and translator notes, server condition functions, PO in Git, pseudolocalization at 0.3 in CI [V, S153, S159].
5. **Dialog box.** `visible_characters` typewriter, RichTextLabel only for tagged lines, four presets, pauses, a 200 ms guard, the 0, 1, 2, 1 arrow, an 8-frame open, a TILE NinePatchRect, an `append_text()` log.
6. **Bubbles.** A pool of 32 in the low-res viewport, anchored with `get_global_transform_with_canvas()` and floored [V, S188]; priority, caps, push, clamp, chips, log.
7. **Acting and markers.** Turn and restore, emote hops, 16x16 markers with a hollow `?`, filling hearts, 48x48 or 64x64 overlay busts.
8. **Town and sound.** Server bark rules, schedules for ambient folk, blips with baked pitches if web `pitch_scale` fails, the G4 options. Test optimistic open at 100, 200 and 400 ms.

---

## 14. Sources

Numbered for [S#] references. All URLs come from research notes 01 to 11 and the shared context. "Not fetched", "403" or "snippet" means our researchers did not read the page in full. Line numbers quoted in the text refer to the branch heads read on 2026-11-11 and will drift.

**Series and our own work**
1. Kingsfoil Artifacts library: https://kingsfoil-artifacts.netlify.app
2. NPC Dialog Sandbox: `feel-npc-dialog-sandbox.html` (companion page)
3. Kingsfoil text benchmark, our own measurement (November 2026): `studies/feel-npc-dialog/notes/bench/textbench.html`, with `run.py`, `summary-table.md` and `results-*.json`. Apple M4 Pro (14 cores, 48 GB), macOS 26.5.1, Chromium 153.0.8010.12 under Playwright; ANGLE Metal, Metal with a 6x CPU throttle, and SwiftShader; 300 timed frames (150 throttled). No phone was measured.

**Tibia: TFS, Canary and OTClient**
4. TFS `npchandler.lua`: https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npchandler.lua
5. TFS `modules.lua`: https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/modules.lua
6. TFS `keywordhandler.lua`: https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/keywordhandler.lua
7. TFS `npc.lua`: https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npc.lua
8. TFS `npcsystem.lua`: https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npcsystem.lua
9. TFS `src/npc.cpp`: https://github.com/otland/forgottenserver/blob/master/src/npc.cpp
10. TFS `src/const.h`: https://github.com/otland/forgottenserver/blob/master/src/const.h
11. TFS `src/game.cpp`: https://github.com/otland/forgottenserver/blob/master/src/game.cpp
12. TFS `src/player.cpp`: https://github.com/otland/forgottenserver/blob/master/src/player.cpp
13. TFS `config.lua.dist`: https://github.com/otland/forgottenserver/blob/master/config.lua.dist
14. TFS `src/map.h`: https://github.com/otland/forgottenserver/blob/master/src/map.h
15. TFS `protocolgame.cpp`: https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
16. TFS `protocol.cpp`: https://github.com/otland/forgottenserver/blob/master/src/protocol.cpp
17. OTLand, "npc default lua": https://otland.net/threads/npc-default-lua.106750/
18. OTLand, TFS 0.3.6 NPC talk delay thread: https://otland.net/threads/8-6-tfs-0-3-6-npc-system-talk-delay-time.131786/
19. Canary `npc_handler.lua`: https://github.com/opentibiabr/canary/blob/main/data/npclib/npc_system/npc_handler.lua
20. Canary `npc.cpp`: https://github.com/opentibiabr/canary/blob/main/src/creatures/npcs/npc.cpp
21. Canary `sam.lua`: https://github.com/opentibiabr/canary/blob/main/data-otservbr-global/npc/sam.lua
22. Canary `protocolgame.cpp`: https://github.com/opentibiabr/canary/blob/main/src/server/network/protocol/protocolgame.cpp
23. Canary `protocol.cpp`: https://github.com/opentibiabr/canary/blob/main/src/server/network/protocol/protocol.cpp
24. OTClient `statictext.cpp`: https://github.com/edubart/otclient/blob/master/src/client/statictext.cpp
25. OTClient `const.h`: https://github.com/edubart/otclient/blob/master/src/client/const.h
26. OTClient `map.cpp`: https://github.com/edubart/otclient/blob/master/src/client/map.cpp
27. OTClient `mapview.cpp`: https://github.com/edubart/otclient/blob/master/src/client/mapview.cpp
28. OTClient `console.lua`: https://github.com/edubart/otclient/blob/master/modules/game_console/console.lua
29. OTClient `npctrade.otui`: https://github.com/edubart/otclient/blob/master/modules/game_npctrade/npctrade.otui

**RuneScape, Ragnarok Online, Ultima Online, Habbo and Roblox**
30. rs317 `Client.java`: https://github.com/MatthewBishop/rs317/blob/master/src/Client.java
31. 2006Scape client `Game.java`: https://github.com/2006-Scape/2006Scape/blob/master/2006Scape%20Client/src/main/java/Game.java
32. OSRS Wiki, Chat effects: https://oldschool.runescape.wiki/w/Chat_effects
33. OSRS Wiki, Template:Overhead: https://oldschool.runescape.wiki/w/Template:Overhead
34. RuneLibris, Dialogue: https://runelibris.github.io/RuneLibris/Info/Dialogue
35. OSRS Wiki, Old School RuneScape Mobile: https://oldschool.runescape.wiki/w/Old_School_RuneScape_Mobile
36. OSRS Wiki, Choose Option: https://oldschool.runescape.wiki/w/Choose_Option
37. rAthena `script_commands.txt`: https://github.com/rathena/rathena/blob/master/doc/script_commands.txt
38. rAthena `npc.cpp`: https://github.com/rathena/rathena/blob/master/src/map/npc.cpp
39. rAthena `secure.hpp`: https://github.com/rathena/rathena/blob/master/src/config/secure.hpp
40. rAthena `client.conf`: https://github.com/rathena/rathena/blob/master/conf/battle/client.conf
41. Hercules `translations.conf`: https://github.com/HerculesWS/Hercules/blob/stable/db/translations.conf
42. ServUO `Mobile.cs`: https://github.com/ServUO/ServUO/blob/master/Server/Mobile.cs
43. ClassicUO `MessageManager.cs`: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Managers/MessageManager.cs
44. ClassicUO `TextRenderer.cs`: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Managers/TextRenderer.cs
45. Nitro (Habbo HTML5 client) `ChatWidgetView.tsx`: https://github.com/billsonnn/nitro-react/blob/dev/src/components/room/widgets/chat/ChatWidgetView.tsx
46. Nitro `ChatWidgetMessageView.tsx`: https://github.com/billsonnn/nitro-react/blob/dev/src/components/room/widgets/chat/ChatWidgetMessageView.tsx
47. Nitro `useChatWidget.ts`: https://github.com/billsonnn/nitro-react/blob/dev/src/hooks/rooms/widgets/useChatWidget.ts
48. Nitro `DoChatsOverlap.ts`: https://github.com/billsonnn/nitro-react/blob/dev/src/api/room/widgets/DoChatsOverlap.ts
49. Kurlander et al., Comic Chat, SIGGRAPH 96: https://discmaster.textfiles.com/file/16650/SIGGRAPH%201996:%20Proceedings.iso/pc/papers/kurlan/paper.pdf
50. Roblox creator docs, bubble chat: https://github.com/Roblox/creator-docs/blob/main/content/en-us/chat/bubble-chat.md
51. Roblox `BubbleChatConfiguration.yaml`: https://github.com/Roblox/creator-docs/blob/main/content/en-us/reference/engine/classes/BubbleChatConfiguration.yaml
52. Roblox legacy `BubbleChat.lua`: https://github.com/Roblox/Core-Scripts/blob/master/CoreScriptsRoot/Modules/Server/ClientChat/BubbleChat/BubbleChat.lua
53. Roblox legacy `ChatFloodDetector.lua`: https://github.com/Roblox/Core-Scripts/blob/master/CoreScriptsRoot/Modules/Server/ServerChat/DefaultChatModules/ChatFloodDetector.lua
54. Roblox legacy `ChatSettings.lua`: https://github.com/Roblox/Core-Scripts/blob/master/CoreScriptsRoot/Modules/Server/ClientChat/DefaultClientChatModules/ChatSettings.lua
55. Second Life wiki, llSay: https://wiki.secondlife.com/wiki/LlSay

**Single-player pixel RPGs and engines**
56. pokeemerald `src/text.c`: https://github.com/pret/pokeemerald/blob/master/src/text.c
57. pokeemerald `src/menu.c`: https://github.com/pret/pokeemerald/blob/master/src/menu.c
58. pokeemerald `src/new_game.c`: https://github.com/pret/pokeemerald/blob/master/src/new_game.c
59. pokeemerald `src/script_menu.c`: https://github.com/pret/pokeemerald/blob/master/src/script_menu.c
60. pokeemerald `characters.h`: https://github.com/pret/pokeemerald/blob/master/include/constants/characters.h
61. pokeemerald `trainer_see.c`: https://github.com/pret/pokeemerald/blob/master/src/trainer_see.c
62. pokeemerald `event_object_movement.c`: https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
63. pokecrystal `print_text.asm`: https://github.com/pret/pokecrystal/blob/master/home/print_text.asm
64. pokecrystal `text.asm`: https://github.com/pret/pokecrystal/blob/master/home/text.asm
65. pokecrystal `text_constants.asm`: https://github.com/pret/pokecrystal/blob/master/constants/text_constants.asm
66. zelda3 `messaging.c`: https://github.com/snesrev/zelda3/blob/master/src/messaging.c
67. Everest wiki, Adding Custom Dialogue: https://github.com/EverestAPI/Resources/wiki/Adding-Custom-Dialogue
68. Create Your Frisk text API (Undertale-style tags, fan engine): https://rhenaudthelukark.github.io/CreateYourFrisk/pages/api-text.html
69. speedrun.com thread, Undertale runs at 30 fps: https://www.speedrun.com/undertale/thread/nyca2/1
70. Stardew Valley Wiki, Modding:Dialogue (via MediaWiki API): https://stardewvalleywiki.com/Modding:Dialogue
71. Stardew Valley Wiki, Modding:NPC_data: https://stardewvalleywiki.com/Modding:NPC_data
72. Stardew Valley Wiki, Modding:Event_data: https://stardewvalleywiki.com/Modding:Event_data
73. Stardew `DialogueBox.cs`, old decompile (pre-1.5): https://github.com/E-riCA0/StawdewValley/blob/HEAD/Menus/DialogueBox.cs
74. Stardew forums, portrait sprite size: https://forums.stardewvalley.net/threads/sprite-size-first-time-modding-sv.7128/
75. Data Crystal, EarthBound control codes: https://datacrystal.tcrf.net/wiki/EarthBound/Control_Codes
76. Legends of Localization, EarthBound window flavours: https://legendsoflocalization.com/?p=301
77. Golden Sun string dump: https://goldensunwiki.net/wiki/Golden_Sun_series/String_Dump
78. FE Universe, Golden Sun text beeps called "overt": https://feuniverse.us/t/veslys-asm-c/12011/334
79. Prima Games, Octopath path actions: https://primagames.com/tips/octopath-traveler-characters-talents-path-actions
80. Twinfinite, Octopath noble and rogue actions: https://twinfinite.net/guides/octopath-traveler-noble-rogue-path-actions-explained/
81. CrossCode recap 2013: https://www.moddb.com/games/crosscode/news/crosscode-recap-2013
82. Blake Crosley, pixel art interfaces: https://blakecrosley.com/blog/pixel-art-interfaces-on-iphone
83. eev.ee, Cheezball Rising, opening a dialogue: https://eev.ee/blog/2018/10/09/cheezball-rising-opening-a-dialogue
84. eev.ee, word-wrapping dialogue: https://eev.ee/blog/2016/10/20/word-wrapping-dialogue/
85. Village Monsters devlog, portraits: https://josh-bossie.itch.io/village-monsters/devlog/249628/building-a-village-a-portrait-is-worth-a-thousand-words
86. Knight George devlog, dialog boxes on a small screen: https://linky439.itch.io/knight-george/devlog/864056/devlog-4-improving-dialog-boxes-on-a-small-screen
87. madegooddesigns, Sea of Stars font (secondary, unverified): https://madegooddesigns.com/?p=11177
88. RPG Maker MV `Window_Base.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_windows/Window_Base.js
89. RPG Maker MV `Window_Message.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_windows/Window_Message.js
90. RPG Maker MV `Sprite_Balloon.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Balloon.js
91. RPG Maker MV `Game_Event.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_objects/Game_Event.js
92. RPG Maker MV `Game_CharacterBase.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_objects/Game_CharacterBase.js
93. RPG Maker MV `Window.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Window.js
94. FE Universe, blinking and mouth animations: https://feuniverse.us/t/how-do-i-correctly-do-blinking-mouth-animations/33245
95. Argent Games, Ren'Py animation while talking: https://blog.argentgames.co/post/2021-03-08-renpy-animation-while-talking
96. Shacknews, Celeste dialogue design: https://shacknews.com/article/125697/devs-share-insight-into-celestes-dialogue-design-process

**Modern MMOs**
97. Allakhazam, Quests (WoW) marker states: https://lotro.allakhazam.com/wiki/Quests_(WoW)
98. Allakhazam, Questgivers: https://lotro.allakhazam.com/wiki/Questgivers_(WoW)
99. warcraft.wiki.gg, Daily Quest: https://warcraft.wiki.gg/wiki/Daily_Quest
100. warcraft.wiki.gg, Quest log: https://warcraft.wiki.gg/wiki/Quest_log
101. mein-mmo, WoW replaces quest markers after 16 years: https://mein-mmo.de/en/after-16-years-wow-replaces-the-famous-quest-markers-and,492314
102. mein-mmo, more than one in three don't read quest text: https://mein-mmo.de/en/wow-more-than-one-in-three-dont-read-quest-texts-barely-know-the-story,1147872
103. mein-mmo, quest log raised to 35: https://mein-mmo.de/en/wow-your-complaining-has-helped-blizzard-increases-the-quest-log-gives-you-more-space,921568
104. Blizzard forums, difficulty seeing the new quest marks: https://us.forums.blizzard.com/en/wow/t/difficulty-seeing-the-new-quest-marks/1946251
105. Warcraft Tavern, TWW icons without shades of colour: https://warcrafttavern.com/wow/news/interface-changes-in-the-war-within-new-spellbook-layout-and-quest-icons
106. Game Developer, Kaplan GDC 2009, WoW quest design mistakes: https://www.gamedeveloper.com/game-platforms/gdc-learning-from-i-world-of-warcraft-i-s-quest-design-mistakes
107. The Register, Kaplan GDC 2009: https://www.theregister.com/2009/03/27/gdc09_jeffrey_kaplan_session
108. Engadget, patch 3.3 quest tracking: https://www.engadget.com/2009/11/14/patch-3-3-blizzard-previews-new-quest-tracking-ui/
109. warcraft.wiki.gg, API C_GossipInfo.ForceGossip: https://warcraft.wiki.gg/wiki/API:C_GossipInfo.ForceGossip
110. CurseForge, Auto Gossip: https://www.curseforge.com/wow/addons/auto-gossip
111. Engadget, AutoSelect addon (2007): https://www.engadget.com/2007-01-08-addon-spotlight-autoselect.html
112. warcraft.wiki.gg, Say: https://warcraft.wiki.gg/wiki/Say
113. Trials of Fantasy, FFXIV quest icons: https://trialsoffantasy.com/new-player/
114. Kotaku, FFXIV red, green and blue quest markers: https://kotaku.com/final-fantasy-14-ff14-quest-red-green-blue-1851593464
115. FFXIV official UI guide, NPC icons: https://na.finalfantasyxiv.com/uiguide/know/faq-display/interface_npc_icon.html
116. Console Games Wiki, A Realm Reborn overhaul: https://ffxiv.consolegameswiki.com/wiki/A_Realm_Reborn_Overhaul
117. PC Gamer, Dawntrail notes: https://pcgamer.com/games/final-fantasy/final-fantasy-14-dawntrail-s-preliminary-patch-notes-are-here-showing-fixes-to-those-annoying-stealth-quests-and-the-ability-to-banish-npc-crowding-players-to-the-shadow-realm
118. Guild Wars 2 Wiki, Renown Heart NPC: https://wiki.guildwars2.com/wiki/Renown_Heart_NPC
119. Guild Wars 2 Wiki, Renown heart: https://wiki.guildwars2.com/wiki/Renown_heart
120. mein-mmo, ESO was going to have plain quest text: https://mein-mmo.de/en/fully-voiced-successful-mmorpg-was-originally-supposed-to-have-dull-quest-texts-like-wow,1130859/
121. UESP, Online:Dialogue: https://en.uesp.net/wiki/Online:Dialogue
122. ESO forums, removal of the dialogue camera: https://forums.elderscrollsonline.com/en/discussion/166287/removal-of-dialogue-conversation-camera
123. GamesBeat, MMO storytelling: https://gamesbeat.com/secrets-of-mmo-storytelling-exclusive/

**Mobile, visual novels and touch**
124. Ren'Py `behavior.py`: https://github.com/renpy/renpy/blob/master/renpy/display/behavior.py
125. Ren'Py config docs: https://www.renpy.org/doc/html/config.html
126. Ren'Py `options.rpy`: https://github.com/renpy/renpy/blob/master/gui/game/options.rpy
127. Ren'Py `gui.rpy`: https://github.com/renpy/renpy/blob/master/gui/game/gui.rpy
128. Dialogic `auto_advance.gd`: https://github.com/dialogic-godot/dialogic/blob/main/addons/dialogic/Modules/Text/auto_advance.gd
129. Dialogic `subsystem_text.gd`: https://github.com/dialogic-godot/dialogic/blob/main/addons/dialogic/Modules/Text/subsystem_text.gd
130. The Global Gaming, Genshin Impact dialogue skip: https://theglobalgaming.com/genshin-impact/genshin-impact-how-to-skip-dialogue
131. esports.gg, Genshin dialogue pacing 2026 (403, search summary): https://esports.gg/news/genshin-impact/dialogue-skip-system/
132. Siliconera, Honkai: Star Rail 3.4 skip and summary: https://www.siliconera.com/?p=1095169
133. Game8, Honkai: Star Rail skip: https://game8.co/games/Honkai-Star-Rail/archives/530776
134. Siliconera, Dragalia Lost skip summary: https://www.siliconera.com/the-dragalia-lost-skip-feature-still-keeps-players-caught-up/
135. Twinfinite, MapleStory M auto quest: https://twinfinite.net/?p=369057
136. Apple HIG, buttons: https://developer.apple.com/design/human-interface-guidelines/buttons
137. Android accessibility: https://developer.android.com/guide/topics/ui/accessibility/apps
138. WCAG 2.2, SC 2.5.8 target size: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
139. Hoober, how users hold phones (UXmatters 2013): https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php

**Authoring tools, localization and fonts**
140. inkle/ink: https://github.com/inkle/ink
141. ink, RunningYourInk: https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md
142. inkjs: https://www.npmjs.com/package/inkjs
143. godot-ink: https://github.com/paulloz/godot-ink
144. inkgd: https://github.com/ephread/inkgd
145. Yarn Spinner core: https://github.com/YarnSpinnerTool/YarnSpinner
146. YarnSpinner-Godot: https://github.com/YarnSpinnerTool/YarnSpinner-Godot
147. YarnSpinner-Godot-GDScript: https://github.com/YarnSpinnerTool/YarnSpinner-Godot-GDScript
148. YSPL 1.0 licence text: https://raw.githubusercontent.com/YarnSpinnerTool/YarnSpinner-Godot-GDScript/main/LICENSE.md
149. Yarn Spinner, Night in the Woods: https://yarnspinner.dev/showcase/night-in-the-woods/
150. Dialogue Manager: https://github.com/nathanhoad/godot_dialogue_manager
151. Dialogue Manager v4.2.0 release (2026-10-30): https://github.com/nathanhoad/godot_dialogue_manager/releases/tag/v4.2.0
152. Dialogue Manager, conditions and mutations: https://github.com/nathanhoad/godot_dialogue_manager/blob/HEAD/docs/Conditions_Mutations.md
153. Dialogue Manager, translations: https://github.com/nathanhoad/godot_dialogue_manager/blob/HEAD/docs/Translations.md
154. John Nemann, localizing ink: https://johnnemann.medium.com/localizing-ink-with-unity-42a4cf3590f3
155. Godot docs, C# platform support: https://github.com/godotengine/godot-docs/blob/master/tutorials/scripting/c_sharp/index.rst
156. Godot docs, localization using gettext: https://github.com/godotengine/godot-docs/blob/master/tutorials/i18n/localization_using_gettext.rst
157. Godot docs, localization using spreadsheets: https://github.com/godotengine/godot-docs/blob/master/tutorials/i18n/localization_using_spreadsheets.rst
158. Godot docs, internationalizing games: https://github.com/godotengine/godot-docs/blob/master/tutorials/i18n/internationalizing_games.rst
159. Godot docs, pseudolocalization: https://github.com/godotengine/godot-docs/blob/master/tutorials/i18n/pseudolocalization.rst
160. W3C, text size in translation: https://www.w3.org/International/articles/article-text-size.en
161. Godot docs, using fonts: https://docs.godotengine.org/en/stable/tutorials/ui/gui_using_fonts.html
162. Godot docs, BBCode in RichTextLabel: https://github.com/godotengine/godot-docs/blob/master/tutorials/ui/bbcode_in_richtextlabel.rst

**Ambient life, audio and accessibility**
163. Ruskin, AI-driven Dynamic Dialog, GDC 2012 slides: https://cdn.fastly.steamstatic.com/apps/valve/2012/GDC2012_Ruskin_Elan_DynamicDialog.pdf
164. Ruskin, GDC Vault page: https://gdcvault.com/play/1015528/AI-driven-Dynamic-Dialog-through
165. GDC 2017, Do You Copy? Dialog in Firewatch: https://gdcvault.com/play/1024000/Do-You-Copy-Dialog-System
166. GamesRadar, Hades 2 script size: https://www.gamesradar.com/games/hades/hades-2-has-an-epic-script-of-over-400-000-words-and-30-000-voice-lines-around-50-percent-more-than-the-original-roguelike
167. Ultima Codex, Ultima VII SCHEDULE.DAT: https://www.wiki.ultimacodex.com/wiki/Ultima_VII_internal_formats_%E2%80%93_SCHEDULE.DAT
168. Lycaeum, NPC schedules essay: https://lycaeum.ultimacodex.com/npc-schedules/
169. RPG Maker MZ Dialogue Bleep plugin: https://winterbitestudios.itch.io/plugin-rpg-maker-mz-dialogue-bleep
170. Roblox devforum, pixel voices for bubbles: https://devforum.roblox.com/t/think-it-would-be-possible-to-make-speech-bubbles-have-pixel-voices/3055854/10
171. TheGamer, Celeste dialogue audio: https://www.thegamer.com/celeste-sound-designer-reveals-how-the-games-dialogue-audio-was-created/
172. Celeste FMOD voice thread: https://threadreaderapp.com/thread/1416483583053602816.html
173. Godot, web export progress report 4.3: https://godotengine.org/article/progress-report-web-export-in-4-3/
174. Godot forum, pitch shift not working on web: https://forum.godotengine.org/t/pitchshift-doesnt-work-in-web-build/139949
175. Xbox Accessibility Guideline 101, text display: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/101
176. Xbox Accessibility Guideline 102, contrast: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102
177. Xbox Accessibility Guideline 104, subtitles: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/104
178. Game Accessibility Guidelines, full list: https://gameaccessibilityguidelines.com/full-list/
179. AFB AccessWorld, adjustable text speed: https://www.afb.org/aw/24/6/18367
180. Godot forum, mixed pixel sizes: https://forum.godotengine.org/t/low-res-pixel-art-diffrent-sized-pixel-stretching/21463
181. Cao et al., SIGGRAPH 2014 (comic balloon layout summary): https://www.cs.cityu.edu.hk/~rynson/papers/sigg14.pdf
182. Chun et al. 2006, word balloon placement: https://www.springerprofessional.de/en/an-automated-procedure-for-word-balloon-placement-in-cinema-comi/1275664
183. Frontiers in Psychology 2023, reading fluency: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1107839/full

**Offscreen speakers and Godot runtime**
184. Godot forum, edge indicator for offscreen targets: https://forum.godotengine.org/t/putting-an-indicator-on-the-edge-of-the-screen-for-an-off-screen-target/29020
185. Envato Tuts+, on-screen indicators for off-screen targets: https://code.tutsplus.com/positioning-on-screen-indicators-to-point-to-off-screen-targets--gamedev-6644t
186. Adventure Creator forum, tail lost after clamp: https://adventurecreator.org/forum/discussion/comment/59784/
187. AGS forum, speech bubble module crops at the edge: https://new-site.adventuregamestudio.co.uk/forums/modules-plugins-tools/module-speechbubble-v0-8-0/100
188. Godot `CanvasItem.xml` 4.3: https://github.com/godotengine/godot/blob/4.3-stable/doc/classes/CanvasItem.xml
189. Godot `NinePatchRect.xml`: https://github.com/godotengine/godot/blob/master/doc/classes/NinePatchRect.xml
190. Godot 4.4 dev 3, batching in all renderers: https://godotengine.org/article/dev-snapshot-godot-4-4-dev-3/
191. passivestar's text batching test on PR 92797: https://github.com/godotengine/godot/pull/92797#issuecomment-2309051165
192. Godot issue 104751, Label shadow 2 ms to 30 ms: https://github.com/godotengine/godot/issues/104751
193. Godot PR 103471, shadow drawn in two passes: https://github.com/godotengine/godot/pull/103471
194. Godot issue 80127, huge Label slow: https://github.com/godotengine/godot/issues/80127
195. Godot GLES3 canvas renderer: https://github.com/godotengine/godot/blob/master/drivers/gles3/rasterizer_canvas_gles3.cpp
196. Godot `rich_text_label.cpp`: https://github.com/godotengine/godot/blob/master/scene/gui/rich_text_label.cpp
197. Godot `text_server_adv.cpp`: https://github.com/godotengine/godot/blob/master/modules/text_server_adv/text_server_adv.cpp

**LLM NPCs, 2025 to 2026**
198. KitGuru, Where Winds Meet launches to 2 million players: https://www.kitguru.net/gaming/joao-silva/where-winds-meet-launches-to-2-million-players/
199. OpenCritic, players manipulate AI chatbots to skip side quests: https://opencritic.com/news/24007/where-winds-meet-players-are-now-manipulating-ai-chatbots-to-help-fully-skip-side-quests
200. Outlook Respawn, AI exploit lets players skip quests (2 Dec 2025): https://respawn.outlookindia.com/gaming/gaming-news/where-winds-meet-ai-exploit-lets-players-skip-quests
201. GamesRadar, Where Winds Meet AI NPC exploit: https://www.gamesradar.com/games/action-rpg/where-winds-meet-players-find-a-way-to-skip-side-quests-by-manipulating-the-mmos-ai-chatbot-npcs-into-just-giving-over-the-goods-instead
202. PC Gamer, Where Winds Meet chatbot NPCs: https://www.pcgamer.com/games/rpg/wuxia-mmo-where-winds-meet-is-full-of-ai-chatbot-npcs-and-people-are-doing-all-the-standard-obscene-stuff-to-them-i-made-him-think-that-my-character-was-pregnant-with-his-child
203. GeekChamp, Where Winds Meet model claim (single outlet): https://geekchamp.com/?p=234583
204. Inven Global, Krafton's first scorecard for PUBG Ally (29 Sep 2026): https://www.invenglobal.com/articles/26592/built-a-teammate-got-a-chat-partner-kraftons-first-scorecard-for-pubg-ally
205. alphaxiv listing of Krafton's PUBG Ally report: https://www.alphaxiv.org/abs/2609.29837
206. NVIDIA developer blog, how Krafton built PUBG Ally: https://developer.nvidia.com/blog/how-krafton-built-pubg-ally-a-co-playable-character-powered-by-nvidia-ace/
207. DSOGaming, inZOI on-device NPCs: https://www.dsogaming.com/news/inzoi-is-the-first-game-with-ai-powered-npcs-using-nvidia-ace/
208. inkl, Steam week in review, 120 of 338 releases with AI disclosures: https://www.inkl.com/news/steam-week-in-review-more-than-300-games-released-on-steam-last-week-and-120-of-them-had-ai-disclosures
209. Let's Data Science, GDC 2026 survey summary: https://letsdatascience.com/news/gamers-push-back-against-ai-generated-game-content-020ccc28
