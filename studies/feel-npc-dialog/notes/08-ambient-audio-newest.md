# 08. Ambient NPC life, audio, accessibility, academic and newest work

Researcher angle: barks and schedules, voice blips and UI sound, text and subtitle accessibility, academic work, and LLM-driven NPCs as of November 2026.

Tool budget used: about 30 calls. Several fan wikis (Stardew wiki, BBC subtitle guide, Valve Developer wiki) returned 403. I worked around them where I could.

---

## Q1. How do shipped games pick which bark an NPC says, and how do they avoid repeats?

### Takeaway
Use Valve's rule database. Each line is a rule with a list of criteria. The game builds a query of facts, and the rule with the most matching criteria wins. Ties pick at random. Memory and cooldowns are just facts that the rule writes back with an expiry time. It is cheap (under 1 microsecond per lookup with bucketing) and writers can add lines without code. It fits a server-authoritative MMO well, because the server already holds all the facts.

### Cited findings
- Elan Ruskin, GDC 2012, "AI-driven Dynamic Dialog through Fuzzy Pattern Matching". Used in Left 4 Dead 2 and Dota. Slides and notes: https://cdn.fastly.steamstatic.com/apps/valve/2012/GDC2012_Ruskin_Elan_DynamicDialog.pdf . Vault page: https://gdcvault.com/play/1015528/AI-driven-Dynamic-Dialog-through
  - A fact is a key and a variant value, for example "hitpoints are 57". A query is a flat pile of facts. A rule is a list of criteria that must all be true.
  - Scoring: the best function they found was "the number of criteria in a rule". Most specific rule wins. Equal scores pick randomly.
  - One response holds several recorded variations and the engine picks one at random. Cheaper than writing parallel rules.
  - Idle barks: each character "polls itself every few seconds" for a TalkIdle line.
  - Memory: a rule can write facts back to the speaker or the world, with "automatic expiration times". That is the cooldown and the "already said" flag in one mechanism.
  - Conversations chain with "then" followups. The reply is queried when the first line ends, not when it starts. If the world changed (a zombie attacks), the reply's criteria fail and the chat ends by itself. No explicit interrupt code.
  - Followups can go to "all nearby characters within earshot". The best scorer replies.
  - Overplay control: specific lines carry an extra criterion "random number is less than 30" so they fire about 30% of the time.
  - Long monologues are cut into short lines that chain to the same speaker, so they can be broken off.
  - Performance: bucket rules by hashed constant criteria (who, concept, map). "About fifty rules per bucket", eight criteria each, gives "less than a microsecond" per lookup. Sort rules by descending criteria count and stop at the first match. Ruskin says r-trees and similar are not worth it.
  - Rules can be split by region and streamed with level data, with a global set always loaded.
- Valve's L4D2 response system can be extended with VScript rules: https://developer.valvesoftware.com/wiki/Left_4_Dead_2/Scripting/Response_System (page returned 403 on fetch; title and summary from search only).
- Firewatch, GDC 2017, "Do You Copy? Dialog Systems and Tools in Firewatch" (Patrick Ewing, William Armstrong). Started as an "interrupt-heavy bark system". The player can interrupt at any time. https://gdcvault.com/play/1024000/Do-You-Copy-Dialog-System . Emily Short notes Firewatch drew on Ruskin's salience matching: https://emshort.blog/tag/firewatch/
- Hades: no developer document of the selection logic was found. Kasavin said he wanted players not to "quickly run into" repeated dialogue (https://culturedvultures.com/?p=142587). Some talks have three versions keyed to relationship with Megaera (https://gamerant.com/hades-writer-meg-detail/). Script size: Hades 1 over 300,000 words. Hades 2 over 400,000 words and 30,000 voice lines (https://www.gamesradar.com/games/hades/hades-2-has-an-epic-script-of-over-400-000-words-and-30-000-voice-lines-around-50-percent-more-than-the-original-roguelike). A Steam player describes two pools, unique lines with priority and recycled filler (https://steamcommunity.com/app/1145360/discussions/0/2987539784417139179). That is a player claim, not a dev statement.

### Inferences
- For Asterion Online, run the rule match on the server. The query is cheap and the server already knows quest state, reputation, time of day and who is nearby. Send only a line ID (2 to 4 bytes) to clients in range, not the text. Clients look the text up locally. This also solves localization.
- Suggested starting numbers for an MMO town (estimates, not cited): idle bark poll every 8 to 15 s per NPC, only while a player is within about 8 tiles. Per-NPC "speaking" fact with 4 to 6 s expiry. Per-line "said" fact with 2 to 5 min expiry per player or per area. 20 to 40% random gate on flavour lines. Stagger poll times so a crowd of NPCs does not bark on the same tick.
- Reputation-aware lines fall out for free. Add facts like `rep_faction_x=12` and write more specific rules.

### Gaps
- No primary source for Hades' exact priority or cooldown fields. The game's Lua data (NPCData.lua and similar under Content/Scripts) would show it. I did not open it.
- No Firewatch timing numbers (choice timeout, restart rules). Only in the GDC video.

---

## Q2. NPC schedules. What formats and granularity did shipped games use?

### Takeaway
Ultima VII proves you need very little. Eight 3-hour slots per day, each slot one activity type at one map position, packed into 4 bytes. Stardew uses a slash-separated string of "time map x y facing" entries with keys for season, weekday, weather and hearts. For an MMO, schedules are cheap because they are deterministic from the game clock. Clients can predict them without per-move packets.

### Cited findings
- Ultima VII SCHEDULE.DAT (https://www.wiki.ultimacodex.com/wiki/Ultima_VII_internal_formats_%E2%80%93_SCHEDULE.DAT):
  - 256 NPCs. Up to 8 schedules per NPC. 4 bytes per record.
  - Byte 1 holds a 5-bit activity type and a 3-bit time slot. Bytes 2 to 4 hold x, y inside a superchunk and the superchunk number.
  - 8 slots of 3 hours: 0AM, 3AM, 6AM, 9AM, 12PM, 3PM, 6PM, 9PM.
  - 32 activity types including Tend Shop, Sleep, Eat, Eat at Inn, Wander, Loiter, Patrol, Preach, Bake, Sew, Blacksmith, Waiter, Kid Games, Duel, Desk Work.
  - Scripts can override a schedule (Exult forum: https://exult.sourceforge.io/forum/viewtopic.php?p=27807).
- Ultima design essay (https://lycaeum.ultimacodex.com/npc-schedules/):
  - Ultima V was the first with schedules for all characters. Ultima IX dropped them and was received worse.
  - Keep shopkeepers reachable about 14 hours a day. Example 6am to 9pm with a 1-hour lunch.
  - Shopkeepers open about an hour before sunrise and close just after sunset.
  - Use a shared base routine plus unique add-ons (idle actions, weekend routines). A detailed routine for every NPC "would overcrowd the cemetery".
  - Add 1 to 60 min daily jitter to sleep and wake times. Idle actions start after a couple of minutes without talk, and must not block talk.
- Stardew Valley: schedules live in Content/Characters/schedules, one per NPC. Entries are slash-separated and start with a 24-hour time with no colon, then map and tile. Dialogue for schedule stops goes in Strings/schedule/<NPC>. Animation keys have entry, repeat and leaving frames. 1.6 uses unique string IDs. Summary from search snippets of https://stardewvalleywiki.com/Modding:Schedule_data and https://stardewvalleywiki.com/Modding:NPC_data (both 403 on direct fetch).
- Oblivion Radiant AI: NPCs run a package stack updated by schedule and package conditions (https://ck.uesp.net/wiki/Package_Stack, https://en.uesp.net/wiki/Oblivion:Radiant). Modders note packages are processed in sequence, so heavy scripts delay AI (https://forums.nexusmods.com/topic/13476947-npc-schedule-time-lag).

### Inferences
- An Asterion schedule entry can be `{slot, activity, x, y, z}`. Server walks the NPC along precomputed paths. Clients only need the schedule table and the game clock, plus a correction when a player blocks a path.
- Shop and quest NPCs in an MMO must stay reachable. Tibia's NPCs stand still for good reason. Give key NPCs a stand-in (night clerk) or keep them in place and put schedules only on ambient townsfolk.

### Gaps
- Majora's Mask three-day schedule data not found in this pass. The zelda decomp projects would have it.
- Did not confirm Stardew's exact key priority order (date, weekday, rain, hearts) from the primary page.

---

## Q3. Proximity head-turn and greet

### Takeaway
Ruskin's model handles it. A "player entered radius" event fires a query and the best greet rule plays, with a "greeted this player" fact that expires. No game-specific source with numbers was found in this pass.

### Cited findings
- Concept-driven queries and expiring facts as above (Ruskin slides).

### Inferences
- In a 32x32 tile game the head-turn is a sprite direction change, so it costs nothing. Suggested numbers (estimate): turn to face a player within 2 tiles, hold 2 to 3 s after they leave, greet bark once per player per 5 to 10 min. In a crowd, face the nearest or the one who clicked last. Do not greet every passer-by on a busy street.

### Gaps
- No measured head-turn radius from Stardew, Zelda or OSRS.

---

## Q4. Voice blips. How are they made and played?

### Takeaway
Two families. Per-letter blips (Undertale, Animal Crossing style) play a short sample on revealed characters, skip spaces and punctuation, often throttle to every Nth letter or a minimum interval, and vary pitch per speaker plus small random jitter. Continuous voices (Celeste) loop one designed vocal sound per speaker while text prints and jump to an emotion region. Per-letter is easier and fits a 32x32 game.

### Cited findings
- Undertale: modified Comic Sans for Sans and Papyrus for Papyrus. Battle dialogue uses modified DotumChe (https://fontsinuse.com/uses/51307/undertale-dialogue-and-interfaces). A blog argues text speed and rhythm create the voice as much as the blip (https://thesolarprincess.org/blog/en/undertaledialogue.html, fetched only via search summary).
- Create Your Frisk, the open Undertale-engine clone (https://rhenaudthelukark.github.io/CreateYourFrisk/pages/api-text.html):
  - Default speed is "1 character every 4 frames", so 15 cps at 60 fps.
  - `[w:x]` waits x times 4 frames. `[w:10]` is 40 frames, about 0.67 s.
  - `[voice:file]` sets a sound per letter. `[novoice]` silences. `[lettersperframe:x]`, `[instant]` and `[noskip]` also exist.
  - These are CYF values. They approximate Undertale, not confirmed from Undertale's code.
- Animalese clones:
  - Acedio's animalese.js synthesizes villager-style speech (https://github.com/Acedio/animalese.js).
  - A rewrite uses 26 letter samples of 150 ms each, sliced from one file, and changes pitch through playback rate instead of index stepping (summary via https://www.pkgstats.com/pkg:animalese-web).
  - Rust port: rate = 2^(semitones/12), plus random per-letter pitch, 0.8 to 1.2 range "more organic" (https://docs.rs/crate/animalese/0.2.0/source/README.md).
  - Nintendo's own method is undocumented. A CEDEC 2020 talk on New Horizons says emotion expression is the same across all 35 species (https://www.siliconera.com/?p=850169).
- Generic recipes:
  - Roblox dev forum: counter modulo frequency, skip whitespace and punctuation, pitch chosen from the character (https://devforum.roblox.com/t/think-it-would-be-possible-to-make-speech-bubbles-have-pixel-voices/3055854/10).
  - RPG Maker MZ "Dialogue Bleep": minimum 30 ms between blips, random pick from a list, visible characters only (https://winterbitestudios.itch.io/plugin-rpg-maker-mz-dialogue-bleep).
  - RPG Maker MZ "Flexible Message SE": per-NPC sound, volume, pitch, pan, interval and pitch randomization (https://sirogamesdev.itch.io/flexible-message-se-mz).
- Celeste (Kevin Regamey, Power Up Audio):
  - Each voice starts as a synth tone per character. Formant peaks are automated to mimic vowel changes (https://www.thegamer.com/celeste-sound-designer-reveals-how-the-games-dialogue-audio-was-created/).
  - One FMOD event per character plays for the whole conversation. It loops on silence until that character speaks. The game sends portrait or emotion info and FMOD jumps to that emotion on the timeline (https://threadreaderapp.com/thread/1416483583053602816.html).
  - The FMOD project is public for non-commercial study (https://fmod.com/docs/studio/appendix-a-celeste.html).
  - Emotion design questions: is the emotion high or low in pitch, and is speech "slow and careful, or is it rapid and pointed?"
- Godot web caveat. Web exports default to Sample playback since 4.3, to stop crackle in single-threaded builds. Only static WAV, Ogg and MP3 streams qualify, and effects are not supported (https://godotengine.org/article/progress-report-web-export-in-4-3/). One developer reports pitch changes stopped working in sample mode (https://forum.godotengine.org/t/pitchshift-doesnt-work-in-web-build/139949). Stream mode restores features but adds latency, worse without threads (https://forum.godotengine.org/t/last-try-with-web-build-before-changing-to-unity-help-needed/103719).

### Inferences
- Recommended blip recipe for Asterion (estimate, to be prototyped):
  - One 30 to 60 ms sample per voice family (4 to 6 families). Per-NPC base pitch from a hash of the NPC ID, within plus or minus 4 semitones. Random jitter of plus or minus 0.5 to 1 semitone per blip.
  - Play on every 2nd visible letter, minimum 40 to 60 ms apart. Skip spaces and punctuation. Stop instantly on skip.
  - Only play blips for the dialog the local player has open, never for overhead barks of other players' NPC chats. Otherwise a busy town is a wall of chirps.
- Because sample mode may block `pitch_scale` on web, bake 3 to 5 pitch variants per voice into separate WAV files. Pick by index instead of shifting at runtime. That is a few KB per voice and has no runtime cost. Test pitch_scale in the target Godot version first.
- UI sounds: one open, one advance tick, one close per frame style. No numbers found. Keep them under 150 ms and quieter than the blip.

### Gaps
- Undertale's actual frames per character and blip throttle are unconfirmed. Datamined GameMaker scripts would answer it.
- Banjo-Kazooie gibberish method not researched in this pass.
- No measured web audio latency for short blips in Godot 4.4 or 4.5.

---

## Q5. Accessibility rules for dialog text

### Takeaway
Hard numbers exist. Xbox XAG 101 says 18 px body height at 1080p on PC and mobile-equivalent, 26 px on console, scalable to 200%. XAG 102 says 4.5:1 contrast for normal text. XAG 104 says subtitles at most 40 characters per line and 2 lines. Let players advance at their own pace, offer an instant-text option, and never use colour alone for keywords. Dyslexia fonts have no proven benefit.

### Cited findings
- XAG 101 Text display (https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/101):
  - Size is body height, lowest descender to highest ascender.
  - Minimum default: console 26 px at 1080p (52 at 4K). PC 18 px at 1080p (36 at 4K). Mobile 18 px at 100 DPI, 36 at 200, 72 at 400. A 5.5" 1080p phone is about 400 DPI.
  - Text scaling to 200% without loss of content. Scaling smaller is allowed as a player choice.
  - At least one sans serif option. A plain option if the font is stylized.
  - Line width at most 80 characters (40 for CJK). Line spacing at least 1.5. Paragraph spacing at least 2x line spacing. Letter spacing at least 0.12x font size. Word spacing at least 0.16x.
  - Sentence case option. Left or right aligned by language, not centred.
  - Outlines count toward height only where the pixel has over 2:1 contrast with the background.
- XAG 102 Contrast: 4.5:1 for standard text, 3:1 for large text (https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102).
- XAG 104 Subtitles (https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/104):
  - Covers "in-game non-player chatter", so barks count.
  - Name the speaker on each change of speaker. Colour may mark speakers only alongside another cue. Use `<` or `>` for offscreen speakers.
  - Lines at most 40 characters. At most 2 lines (3 in exceptional cases). Manual line breaks preferred. Mixed case.
  - Player-set background with 0 to 100% opacity. Larger default than menu text is encouraged.
  - The Outer Worlds toggles conversation, bark and cinematic subtitles separately.
- Game Accessibility Guidelines (https://gameaccessibilityguidelines.com/full-list/):
  - Basic: "Allow players to progress through text prompts at their own pace". "Use an easily readable default font size". "Ensure no essential information is conveyed by a fixed colour alone". "Provide high contrast between text/UI and background".
  - Intermediate: "Highlight important words". "Provide a visual indication of who is currently speaking". "Provide subtitles for supplementary speech".
  - Advanced: "Allow the font size to be adjusted". "Allow all narrative and instructions to be replayed".
- Dyslexia fonts. Wery and Diliberto, Annals of Dyslexia 67 (2017), 12 students. OpenDyslexic gave no gain in reading rate or accuracy versus Arial and Times. No participant preferred it (https://pmc.ncbi.nlm.nih.gov/articles/PMC5629233). Small single-site sample.

### Inferences
- Pixel-art conflict. An 8 px bitmap font scaled 2x on a 1080p canvas is about 16 px body height, just under XAG's 18 px PC floor. At 3x it is 24 px. The game renders at native res and scales up, so a 6 to 8 px font at 3x integer scale meets XAG on desktop. On a 400 DPI phone you need 72 px, so mobile needs a larger UI scale or a separate font size setting.
- Keyword highlighting (Tibia-style blue keywords) should also use brackets, underline or a glyph so colour-blind players can see them.
- Ship these options: text speed (slow, normal, fast, instant), hold-to-fast-forward, auto-advance off by default, dialog log, font scale 100/150/200%, bark subtitles toggle, background opacity slider.
- A sans pixel font is a better accessibility option than OpenDyslexic.

### Gaps
- BBC subtitle words-per-minute figure not retrieved (site blocked). Commonly cited at 160 to 180 wpm, unverified here.

---

## Q6. Academic work

### Takeaway
Little hard research on game dialog UI exists. Nothing tests the typewriter effect on reading or comprehension. Comic balloon placement has a useful algorithm literature. The 2025 and 2026 papers focus on LLM NPCs and find small or no player-experience gains from heavier prompt design.

### Cited findings
- Typewriter reveal: no study found. Nearest is general reading fluency research. Lower fluency gives poorer processing and comprehension (Frontiers in Psychology 2023, https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1107839/full). It does not test letter-by-letter reveal.
- Speech balloon placement:
  - Chun et al. 2006, "An Automated Procedure for Word Balloon Placement in Cinema Comics". Uses cartographic label placement per speaker, then a layout quality pass (https://www.springerprofessional.de/en/an-automated-procedure-for-word-balloon-placement-in-cinema-comi/1275664).
  - Kurlander et al. 1996, Comic Chat. Greedy, balloons at panel top in reading order, often far from speakers. Summarised in Cao et al. SIGGRAPH 2014 (https://www.cs.cityu.edu.hk/~rynson/papers/sigg14.pdf).
  - Reading order by centroid sorting (Omori 2022, https://catalog.lib.kyushu-u.ac.jp/opac_download_md/6781038/6781038.pdf).
- LLM NPC studies:
  - "Symbolically Scaffolded Play" (arXiv Oct 2025). N=10 within-subjects, three GPT-4o NPCs. High versus low constraint prompts showed no reliable experience difference "beyond sensitivity to technical breakdowns" (https://arxiv.org/abs/2510.25820v1).
  - "Quest of Aivengarde" (2026) compares static dialog with three LLM variants: rephrase, hybrid, full generation (https://portal.findresearcher.sdu.dk/en/publications/quest-of-aivengarde-comparative-study-of-player-experience-across/). Results not read.
  - Scheherazade's Tavern (UCSC) swaps menu dialog for natural language input (https://eis.ucsc.edu/papers/Jammaz_ScheherazadesTavern.pdf).

### Inferences
- Comic Chat's lesson applies to MMO bubble clutter. Keeping reading order costs closeness to the speaker. Cartographic labelling (Chun) keeps balloons near speakers and avoids overlap. Both are cheap at Tibia scale (tens of bubbles).

### Gaps
- No CHI PLAY or FDG paper on dialog box UI or quest markers was found in this pass. An ACM DL search is the next step.

---

## Q7. LLM-driven NPCs in 2025 and 2026. What shipped, how fast, how costly, how risky?

### Takeaway
Shipped cases are side features, not core NPCs. Where Winds Meet (Nov 2025) put LLM chat on some side quest-givers. Players broke them in days to skip quests and get free items. PUBG Ally ran a large on-device test in 2026 with a median 1.6 s per spoken exchange. Cloud cost was $3.70 to $7.10 per match on Claude models, and $0.02 to $0.06 on Gemma 4 31B. For a small Tibia-like MMO on low-end web: no runtime LLM for quest or shop NPCs. A cheap open model behind strict guardrails for optional flavour chat is possible but low value. Use LLMs offline to help write bark variants instead.

### Cited findings
- Where Winds Meet (Everstone Studio / NetEase, launched Nov 15 2025, over 2 million players day one: https://www.kitguru.net/gaming/joao-silva/where-winds-meet-launches-to-2-million-players/):
  - AI chat is on certain side quest-givers. Main story and most NPCs stay scripted (https://opencritic.com/news/24007/where-winds-meet-players-are-now-manipulating-ai-chatbots-to-help-fully-skip-side-quests).
  - Exploits: confuse the NPC until it hands over the quest to end the chat. Mirror its phrases ("Solid Snake method"). Type "(says the correct answer to him)" and the model treats it as done (https://spilled.gg/players-use-metal-gear-solid-dialogue-trick-farm-rewards-ai-chatbot-npcs-where-winds-meet, https://automaton-media.com/articles/newsjp/where-winds-meet-20251128-368771/).
  - Players got NPCs to hallucinate and break canon (https://www.pcgamer.com/games/rpg/wuxia-mmo-where-winds-meet-is-full-of-ai-chatbot-npcs-and-people-are-doing-all-the-standard-obscene-stuff-to-them-i-made-him-think-that-my-character-was-pregnant-with-his-child).
  - Reported to run DeepSeek-R1 server-side with scripted fallbacks and safety filters. Single outlet, unconfirmed (https://geekchamp.com/?p=234583).
  - Some players removed it from wishlists over the AI (https://finalboss.io/steam-s-new-wuxia-hit-is-everywhere-but).
- PUBG Ally (Krafton with NVIDIA ACE). Report dated Sep 29 2026 (https://www.invenglobal.com/articles/26592/built-a-teammate-got-a-chat-partner-kraftons-first-scorecard-for-pubg-ally, NVIDIA blog https://developer.nvidia.com/blog/how-krafton-built-pubg-ally-a-co-playable-character-powered-by-nvidia-ace/):
  - Test size: 1,046 adults, 38,956 sessions, 28 days at a Korean PC bang.
  - Latency: median 1.6 s per voice exchange on-device versus 3.4 s cloud, on RTX 4060-class PCs. LLM step 0.80 s local versus 2.54 s cloud (search summary of the paper). Six inference rounds: under 5 s local, over 10 s cloud.
  - Model: 2B parameters, 4-bit, 1.6 to 2.1 GB VRAM, 8 GB recommended. NVIDIA-only.
  - Median API cost per match: Claude Opus 4.8 $5.14 to $7.10. Claude Sonnet 4.6 $3.70 to $5.17. Gemma 4 31B $0.02 to $0.06. On-device $0 to Krafton.
  - Perception: 50% saw it as a tool, 31.5% a companion, 18.5% a teammate. Combat skill 2.58/5. When cloud latency was matched, the cloud model won 52.4% to 31.1%.
  - Failures: said "Okay" without acting. Talked over footsteps in late combat. Push-to-talk only.
  - Vendor and studio reported figures.
- inZOI "Smart Zoi" uses NVIDIA ACE with an on-device small model, opt-in and experimental (https://www.dsogaming.com/news/inzoi-is-the-first-game-with-ai-powered-npcs-using-nvidia-ace/).
- Ubisoft Teammates (Nov 2025), built on the NEO NPC research from GDC 2024. Short Snowdrop FPS with voice assistant Jaspar and two AI squadmates. Closed playtest of "a few hundred players". Not shipped (https://news.ubisoft.com/en-au/article/3mWlITIuWuu0MoVuR6o8ps, https://overclock3d.net/news/misc/ubisoft-reveals-ai-powered-teammates-rd-project/).
- Inworld voice pricing (vendor page summary): Realtime TTS-2 $25 per million characters on demand, down to $10 at enterprise. TTS 1.5 Mini $5 per million, about 100 ms median, under 130 ms P90 (https://howaiworks.ai/blog/inworld-realtime-tts-2-launch-2026). About 1,000 characters per audio minute, so roughly $0.005 to $0.025 per minute of speech. Vendor figures.
- Sentiment:
  - GDC 2026 survey via CNET: 52% of developers call generative AI bad for the industry, up from 30% (summary via https://letsdatascience.com/news/gamers-push-back-against-ai-generated-game-content-020ccc28).
  - Steam requires disclosure of runtime-generated content. In one week, 120 of 338 releases had AI disclosures (https://www.inkl.com/news/steam-week-in-review-more-than-300-games-released-on-steam-last-week-and-120-of-them-had-ai-disclosures).
  - MassivelyOP readers debated when they would accept AI in MMOs (https://massivelyop.com/2026/06/25/massively-overthinking-under-what-conditions-if-any-would-you-accept-ai-use-in-an-mmorpg/).
- No 2026 MMO launch built around LLM NPCs was found.

### Inferences (viability for Asterion Online)
- Latency. Tibia-style keyword NPCs answer in one server tick (estimate under 100 ms plus network). A cloud LLM adds 1 to 3 s before the first word. That breaks the "hi, trade, bye" rhythm that MMO players repeat thousands of times.
- Low-end web clients cannot run a 2B model. On-device is out. It would have to be server-side or third-party API.
- Cost. Take a cheap open model at Gemma-class prices (Krafton's $0.02 to $0.06 per match, a match being many exchanges). Optional flavour chat for 1,000 daily players might run single-digit to tens of dollars a day. That is an estimate, and it grows with abuse and spam.
- Moderation. Where Winds Meet shows players will extract rewards and make NPCs say off-canon or sexual content within days. In a shared MMO, a screenshot of a town NPC saying something vile is a brand risk. Any LLM output must never grant items, change quest state or teach facts the server does not hold.
- Shared world problem. Many players talk to the same NPC. Free LLM text means each player's NPC "remembers" different things, which conflicts with server-authoritative quest state.
- Disclosure and audience. Runtime AI content needs a Steam disclosure. Retro MMO players are a core audience likely to push back.
- Verdict:
  - Do not use runtime LLM for quest, shop, bank or travel NPCs.
  - If tried at all, use an opt-in "chatter" mode on two or three flavour NPCs. Strict output limits, no reward hooks, server-side filter, rate limit per player, and a scripted fallback.
  - Better value: use LLMs offline to draft bark variants that writers edit, then ship them as Ruskin-style rules.

### Gaps
- No independent time-to-first-token figures for cheap hosted models in 2026 found in this pass.
- Convai pricing and NVIDIA ACE 2026 updates not checked.
- No official NetEase statement on Where Winds Meet model, cost or moderation.

---

## Sources
- https://cdn.fastly.steamstatic.com/apps/valve/2012/GDC2012_Ruskin_Elan_DynamicDialog.pdf
- https://gdcvault.com/play/1015528/AI-driven-Dynamic-Dialog-through
- https://www.blog.radiator.debacle.us/2012/07/rule-databases-for-contextual-narrative.html
- https://developer.valvesoftware.com/wiki/Left_4_Dead_2/Scripting/Response_System
- https://gdcvault.com/play/1024000/Do-You-Copy-Dialog-System
- https://emshort.blog/tag/firewatch/
- https://culturedvultures.com/?p=142587
- https://gamerant.com/hades-writer-meg-detail/
- https://www.gamesradar.com/games/hades/hades-2-has-an-epic-script-of-over-400-000-words-and-30-000-voice-lines-around-50-percent-more-than-the-original-roguelike
- https://steamcommunity.com/app/1145360/discussions/0/2987539784417139179
- https://www.wiki.ultimacodex.com/wiki/Ultima_VII_internal_formats_%E2%80%93_SCHEDULE.DAT
- https://lycaeum.ultimacodex.com/npc-schedules/
- https://exult.sourceforge.io/forum/viewtopic.php?p=27807
- https://stardewvalleywiki.com/Modding:Schedule_data
- https://stardewvalleywiki.com/Modding:NPC_data
- https://ck.uesp.net/wiki/Package_Stack
- https://en.uesp.net/wiki/Oblivion:Radiant
- https://forums.nexusmods.com/topic/13476947-npc-schedule-time-lag
- https://fontsinuse.com/uses/51307/undertale-dialogue-and-interfaces
- https://thesolarprincess.org/blog/en/undertaledialogue.html
- https://rhenaudthelukark.github.io/CreateYourFrisk/pages/api-text.html
- https://github.com/Acedio/animalese.js
- https://www.pkgstats.com/pkg:animalese-web
- https://docs.rs/crate/animalese/0.2.0/source/README.md
- https://www.siliconera.com/?p=850169
- https://devforum.roblox.com/t/think-it-would-be-possible-to-make-speech-bubbles-have-pixel-voices/3055854/10
- https://winterbitestudios.itch.io/plugin-rpg-maker-mz-dialogue-bleep
- https://sirogamesdev.itch.io/flexible-message-se-mz
- https://www.thegamer.com/celeste-sound-designer-reveals-how-the-games-dialogue-audio-was-created/
- https://threadreaderapp.com/thread/1416483583053602816.html
- https://fmod.com/docs/studio/appendix-a-celeste.html
- https://godotengine.org/article/progress-report-web-export-in-4-3/
- https://forum.godotengine.org/t/pitchshift-doesnt-work-in-web-build/139949
- https://forum.godotengine.org/t/last-try-with-web-build-before-changing-to-unity-help-needed/103719
- https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/101
- https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102
- https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/104
- https://gameaccessibilityguidelines.com/full-list/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC5629233
- https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1107839/full
- https://www.springerprofessional.de/en/an-automated-procedure-for-word-balloon-placement-in-cinema-comi/1275664
- https://www.cs.cityu.edu.hk/~rynson/papers/sigg14.pdf
- https://catalog.lib.kyushu-u.ac.jp/opac_download_md/6781038/6781038.pdf
- https://arxiv.org/abs/2510.25820v1
- https://portal.findresearcher.sdu.dk/en/publications/quest-of-aivengarde-comparative-study-of-player-experience-across/
- https://eis.ucsc.edu/papers/Jammaz_ScheherazadesTavern.pdf
- https://www.kitguru.net/gaming/joao-silva/where-winds-meet-launches-to-2-million-players/
- https://opencritic.com/news/24007/where-winds-meet-players-are-now-manipulating-ai-chatbots-to-help-fully-skip-side-quests
- https://spilled.gg/players-use-metal-gear-solid-dialogue-trick-farm-rewards-ai-chatbot-npcs-where-winds-meet
- https://automaton-media.com/articles/newsjp/where-winds-meet-20251128-368771/
- https://www.pcgamer.com/games/rpg/wuxia-mmo-where-winds-meet-is-full-of-ai-chatbot-npcs-and-people-are-doing-all-the-standard-obscene-stuff-to-them-i-made-him-think-that-my-character-was-pregnant-with-his-child
- https://geekchamp.com/?p=234583
- https://finalboss.io/steam-s-new-wuxia-hit-is-everywhere-but
- https://www.invenglobal.com/articles/26592/built-a-teammate-got-a-chat-partner-kraftons-first-scorecard-for-pubg-ally
- https://developer.nvidia.com/blog/how-krafton-built-pubg-ally-a-co-playable-character-powered-by-nvidia-ace/
- https://www.dsogaming.com/news/inzoi-is-the-first-game-with-ai-powered-npcs-using-nvidia-ace/
- https://news.ubisoft.com/en-au/article/3mWlITIuWuu0MoVuR6o8ps
- https://overclock3d.net/news/misc/ubisoft-reveals-ai-powered-teammates-rd-project/
- https://howaiworks.ai/blog/inworld-realtime-tts-2-launch-2026
- https://letsdatascience.com/news/gamers-push-back-against-ai-generated-game-content-020ccc28
- https://www.inkl.com/news/steam-week-in-review-more-than-300-games-released-on-steam-last-week-and-120-of-them-had-ai-disclosures
- https://massivelyop.com/2026/06/25/massively-overthinking-under-what-conditions-if-any-would-you-accept-ai-use-in-an-mmorpg/
