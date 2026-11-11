# 06 Authoring pipeline and gems

Angle: dialog data formats and tools, MMO server scripting, localization, pixel text tools, writing references.
Data pulled 2026-11-11 from the GitHub API, raw LICENSE files, npm and official docs. Stars and dates move. Re-check before publishing.

## Q1. Which dialog tool fits a Godot 4 web-first MMO plus a single-player RPG?

### Takeaway
Dialogue Manager (Nathan Hoad) is the best default for the Godot client. It is pure GDScript, MIT, web-exportable, and has PO/CSV translation built in. For the MMO server, Ink is the strongest candidate as a data format, because the same compiled JSON runs in C# (inklecate/ink runtime) and in JavaScript (inkjs, 31 KB gzip) and its whole state saves to one JSON string per player. Every C#-only Godot integration (godot-ink, YarnSpinner-Godot C#, Febucci Text Animator for Godot) is ruled out for the web build, because Godot 4 C# projects cannot export to web.

### Cited findings

Comparison table (stars, licence and release from the GitHub API and the repo LICENSE file on 2026-11-11):

| Tool | Licence (flag) | Stars | Latest release | Godot 4 web export | Notes |
|---|---|---|---|---|---|
| ink (inkle/ink) runtime + inklecate | MIT (Low) | 5,015 | v1.2.1, 2026-05-05 | n/a (engine-agnostic) | [repo](https://github.com/inkle/ink) |
| Inky editor | GitHub detects no licence file (check manually) | 2,756 | 0.15.2, 2026-05-05 | n/a | [repo](https://github.com/inkle/inky) |
| inkjs | MIT (Low) | 666 | v2.4.0, 2026-02-17 | yes in a browser, but not inside Godot | [repo](https://github.com/y-lohse/inkjs) |
| godot-ink (paulloz) | MIT (Low) | 791 | v1.1.2, 2024-02-12 | No. Needs .NET | [repo](https://github.com/paulloz/godot-ink) |
| inkgd (ephread) | MIT (Low) | 398 | no Godot 4 release, `godot4` branch only | Yes (pure GDScript) | [repo](https://github.com/ephread/inkgd) |
| Yarn Spinner core | MIT (Low) | 2,875 | v3.2.1, 2026-05-05 | n/a | [repo](https://github.com/YarnSpinnerTool/YarnSpinner) |
| YarnSpinner-Godot (C#) | MIT (Low) | 218 | v0.3.23, 2026-10-06 | No. Needs .NET | [repo](https://github.com/YarnSpinnerTool/YarnSpinner-Godot) |
| YarnSpinner-Godot-GDScript | Yarn Spinner Public Licence 1.0 (custom, source-available, not OSI). Flag as "None/custom" | 95 | Early Access 3.3, repo created 2026-02-25 | Yes (pure GDScript, Godot 4.6+) | [repo](https://github.com/YarnSpinnerTool/YarnSpinner-Godot-GDScript) |
| Dialogic 2 | MIT (Low) | 6,163 | 2.0-alpha-20, 2026-07-21 (still alpha) | Yes (GDScript), Godot 4.5+ | [repo](https://github.com/dialogic-godot/dialogic) |
| Dialogue Manager 4 | MIT (Low) | 3,977 | v4.2.0, 2026-10-30 | Yes (GDScript), Godot 4.6+ | [repo](https://github.com/nathanhoad/godot_dialogue_manager) |
| Twine 2 (editor) | GPL-3.0 (Copyleft, editor only; story output is yours) | 2,946 | 2.12.1, 2026-10-07 | n/a | [repo](https://github.com/klembot/twinejs) |
| LimboAI (BT + HSM, C++ module/GDExtension) | MIT (Low) | 3,117 | v1.8.1, 2026-08-20 | not checked | [repo](https://github.com/limbonaut/limboai) |
| Beehave (behaviour trees, GDScript) | MIT (Low) | 3,324 | v2.9.3, 2026-08-18 | Yes (GDScript) | [repo](https://github.com/bitbrain/beehave) |

- Godot docs say "projects written in C# cannot be exported to the web platform" ([C# platform support](https://github.com/godotengine/godot-docs/blob/master/tutorials/scripting/c_sharp/index.rst), [Exporting for web](https://github.com/godotengine/godot-docs/blob/master/tutorials/export/exporting_for_web.rst)).
- godot-ink install requires a `.csproj` and a .NET build ([README](https://github.com/paulloz/godot-ink)).
- inkgd says it is "slower than the original C# implementation" but is "used in commercial games". Godot 4.2+ is on the `godot4` branch with no official release ([README](https://github.com/ephread/inkgd)).
- Yarn GDScript is "a complete reimplementation of the Yarn Spinner runtime in pure GDScript". It supports node groups, saliency, detours, smart variables, localisation and voice over. A paid "Yarn Spinner+" tier adds a Classic RPG presenter ([README](https://github.com/YarnSpinnerTool/YarnSpinner-Godot-GDScript)). Its YSPL forbids redistributing unmodified source and building a rival dialog tool. It allows shipping games for free ([LICENSE.md](https://github.com/YarnSpinnerTool/YarnSpinner-Godot-GDScript/blob/HEAD/LICENSE.md)).
- YarnSpinner-Godot (C#) is labelled "work-in-progress" with no official support. It generates its own CSV for localisation and converts it to Godot `.translation` files ([README](https://github.com/YarnSpinnerTool/YarnSpinner-Godot)).
- Dialogue Manager calls itself a "stateless branching dialogue editor and runtime". Version 4 needs Godot 4.6+. v3.10 covers 4.4/4.5 ([README](https://github.com/nathanhoad/godot_dialogue_manager)). It ships example projects for portraits, speech balloons, voices and translations (same README).
- Dialogue Manager conditions use `if/elif/else`, `match/when`, `while`, inline `[if x]...[/if]`, conditional responses `[if cond /]`, weighted random lines `%2`, and mutations with `$>` ([Conditions_Mutations.md](https://github.com/nathanhoad/godot_dialogue_manager/blob/HEAD/docs/Conditions_Mutations.md)). Example line: `You have {{num_apples}} [if num_apples == 1]apple[else]apples[/if]`.
- Dialogue Manager runs all lines through Godot `tr()`. It supports CSV or PO, static IDs `[ID:HI_IM_NATHAN]`, and `##` translator notes that become `#. TRANSLATORS:` in POT ([Translations.md](https://github.com/nathanhoad/godot_dialogue_manager/blob/HEAD/docs/Translations.md)).
- ink saves the full story state with `story.state.ToJson()` and restores with `LoadJson()`. Variables are read and written through `variablesState`, observed with `ObserveVariable`, and game calls are bound with `BindExternalFunction` ([RunningYourInk.md](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md)).
- inkjs 2.4.0 sizes, measured from jsDelivr on 2026-11-11: `dist/ink.js` runtime 128,278 bytes raw, 31,392 bytes gzip -9. `dist/ink-full.js` with compiler 248,826 raw, 60,876 gzip ([npm](https://www.npmjs.com/package/inkjs)).
- ink has no built-in localisation. A community write-up uses ink tags as keys into a string database and notes choices could not be tagged at the time ([John Nemann, Medium](https://johnnemann.medium.com/localizing-ink-with-unity-42a4cf3590f3)).
- Shipped games. Yarn Spinner showcase lists Night in the Woods (Feb 2017) ([showcase](https://yarnspinner.dev/showcase/night-in-the-woods/)). Its timeline lists A Short Hike and DREDGE ([timeline](https://yarnspinner.dev/timeline/)). ink powers inkle's 80 Days, Sorcery! and Heaven's Vault ([Game Developer](https://gamedeveloper.com/design/open-sourcing-80-days-narrative-scripting-language-ink), [Heaven's Vault talk](https://gamedeveloper.com/design/video-how-inkle-created-a-dynamic-detective-story-in-i-heaven-s-vault-i-)). Nathan Hoad's own Bravest Coconut uses Dialogue Manager ([README](https://github.com/nathanhoad/godot_dialogue_manager)).
- Commercial and hosted tools. articy:draft X has official Unity and Unreal importers and a "Generic Engine Export" for engines like Godot. articy:draft X FREE is free for commercial use ([articy integrations](https://www.articy.com/help/Integrations_Overview.html), [FAQ](https://www.articy.com/en/support/frequently-asked-questions/)). A third-party Godot exporter exists ([itch](https://aimarzhang.itch.io/articy-exporter-for-godot)). Arcweave has a free Godot 4 plugin that reads JSON export (all workspaces) or the web API (Team workspaces only) ([repo](https://github.com/arcweave/arcweave-godot-plugin)).

### Server-side fit (headless, deterministic)
- ink. Runtime runs in .NET or Node with no engine. One JSON state blob per player and conversation. It has `SEED_RANDOM` in the language for deterministic randomness. Good fit for a server. Cited state API above.
- Yarn Spinner core. MIT C# library, VM-based, runs headless in .NET. The GDScript port carries the YSPL licence.
- Dialogue Manager. GDScript only. It could run inside a headless Godot server build, which is an inference I have not tested. It reads state from autoload globals, so per-player state needs a wrapper.
- Dialogic 2. Built around scenes, portraits and a timeline editor. Heavy for a server. Still alpha.
- Twine/Harlowe/SugarCube. Browser story formats. Poor fit for a game server.

### Inferences
- Recommended split. Write NPC dialog in one text format that both client and server can parse. Keep the server authoritative for conditions (quest storage, gold, items) and send the client only line IDs plus arguments. The client resolves IDs to localized strings. This turns a 60-byte English line into a few bytes on the wire, and the same packet serves every language.
- Dialogue Manager on both sides is the lowest-friction option if the server is a headless Godot build. Ink is the better option if the server is not Godot (Node, Go, C#).
- Avoid YarnSpinner-Godot-GDScript for a commercial MMO until you read the YSPL clause on AI tooling. It requires you to stop AI tools from sending its source for training. That clause is unusual and may clash with an AI-assisted workflow.

### Gaps
- No measured runtime cost for Dialogue Manager, Dialogic or inkgd per line. No Dialogue Manager shipped-game list beyond the author's own.
- Inky licence not detected by GitHub. Read the repo manually before bundling.
- Chat Mapper and Talkit not researched (both look dormant, not verified).

## Q2. How do Tibia-style and Ragnarok-style servers script NPCs?

### Takeaway
TFS/Canary and rAthena put dialog, conditions and side effects in one script per NPC. That makes quests fast to write and impossible to localize or validate without running them. Copy their runtime parameters (talk radius, idle timeout, focus list, per-player topic). Do not copy the mixing of text and logic.

### Cited findings
- TFS NPC = XML shell + Lua script. `Captain.xml` sets `walkinterval="2000"` and a `message_greet` with `|PLAYERNAME|` ([Captain.xml](https://github.com/otland/forgottenserver/blob/master/data/npc/Captain.xml)).
- Keyword tree. `keywordHandler:addKeyword({'trekolt'}, StdModule.say, {..., text = 'Do you seek a passage to Trekolt for 100 gold?'})`, then `node1:addChildKeyword({'yes'}, StdModule.travel, {cost = 100, ...})` ([ship.lua](https://github.com/otland/forgottenserver/blob/master/data/npc/scripts/ship.lua)).
- TFS NpcHandler defaults. `idleTime = 120` s, `talkRadius = 3` tiles, `talkDelayTime = 1` s outgoing delay, `focuses = {}` list (several players at once), `topic[player]` per-player state reset to 0 on focus. Messages include `MESSAGE_WALKAWAY`, `MESSAGE_IDLETIMEOUT = "Goodbye."`, `MESSAGE_ALREADYFOCUSED` ([npchandler.lua](https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npchandler.lua)).
- Canary moves to a single Lua file per NPC with `npcConfig` (walkInterval 2000, walkRadius 2, `speechBubble = SPEECHBUBBLE_TRADE`), `npcConfig.voices = { interval = 15000, chance = 50, {text = ...} }` for ambient barks, and `npcConfig.shop` rows like `{ itemName = "axe", clientId = 3274, buy = 20, sell = 7 }` ([sam.lua](https://github.com/opentibiabr/canary/blob/main/data-otservbr-global/npc/sam.lua)). Greetings mark clickable keywords with braces, as in `I {trade} with weapons and armor.` (same file).
- Quest state is integer storage values per player. `player:getStorageValue(Storage.Quest.U7_8.KnightOutfits.AddonHelmet)`, set to 6, plus a timer storage set to `os.time() + 7200` (2 h) (same file). Sam has 13 storage calls in 285 lines. Rashid has 27 in 448 (counted 2026-11-11).
- The Canary NPC folder has more than 1,000 Lua files (GitHub contents API caps the listing at 1,000) ([folder](https://github.com/opentibiabr/canary/tree/main/data-otservbr-global/npc)).
- Licences. TFS GPL-2.0, 1,844 stars, v1.6 2024-06-05. Canary GPL-2.0, 668 stars, v3.6.1 2026-07-01. rAthena GPL-3.0, 3,648 stars. All Copyleft. Read for ideas, do not paste code.
- rAthena commands. `mes "<string>"` opens a box. `next;` adds a next button. `close;` ends. `select("Yes:No")` returns 1-based index, `prompt` returns 255 on cancel. Colour codes `^FF0000` inline, `^FF00FF` acts as transparent. `cutin "<file>",<pos>` shows a portrait ([script_commands.txt](https://github.com/rathena/rathena/blob/master/doc/script_commands.txt)).
- rAthena variable scopes by prefix. None = permanent character (`char_reg_num`). `@` temp character. `$` global permanent (`mapreg`). `$@` global temp. `.` NPC variable lost on reload. `.@` scope. `'` instance. `#` account. `##` global account on the login server (same doc, lines 513-550).
- Hercules (rAthena fork, GPL-3.0) can extract script strings with `--generate-translations` into PO files pointed at by `db/translations.conf` ([translations.conf](https://github.com/HerculesWS/Hercules/blob/stable/db/translations.conf)).

### Pros and cons vs a data format (inference)
- Pros of script. Any condition is possible. One file holds an NPC. TFS shows a big world can ship this way.
- Cons of script. Strings are inline so translation needs extraction tools. A writer must know Lua. No static graph for a quest tracker or a "?" marker, so markers must be computed by running logic. Hard to unit-test.
- Middle road. A data file (Dialogue Manager `.dialogue` or ink) for text and branching. Conditions call a small whitelist of server functions (`has_item`, `quest_stage`, `gold >= n`). Quest storage stays as typed keys per player, like Tibia's storage values, but named.

### Gaps
- OTClient code for the NPC channel and the trade window not read in this pass (see other notes).

## Q3. Localization in Godot for dialog

### Takeaway
Use PO (gettext) as the primary format with static line IDs. CSV supports plurals and context too since Godot added `?plural` and `?context` columns, but PO merges better in Git. Budget for 30% expansion on long lines and 200-300% on short labels. Turn on pseudolocalization with `expansion_ratio = 0.3` and `fake_bidi` in CI screenshots.

### Cited findings
- Godot says PO files "work better with version control systems like Git" than CSV ([localization_using_gettext](https://github.com/godotengine/godot-docs/blob/master/tutorials/i18n/localization_using_gettext.rst)).
- Plurals with `tr_n("There is %d apple", "There are %d apples", n)`, optional context argument. Positive integers only ([internationalizing_games](https://github.com/godotengine/godot-docs/blob/master/tutorials/i18n/internationalizing_games.rst)).
- CSV plurals use a `?plural` column and a `?pluralrule` row. Context uses `?context`. Automatic Control translation does not work with plural forms ([localization_using_spreadsheets](https://github.com/godotengine/godot-docs/blob/master/tutorials/i18n/localization_using_spreadsheets.rst)).
- Pseudolocalization options. `double_vowels`, `fake_bidi` (fake RTL), `override` (all `*`), `expansion_ratio` where "0.3 is sufficient for most practical cases" ([pseudolocalization](https://github.com/godotengine/godot-docs/blob/master/tutorials/i18n/pseudolocalization.rst)).
- RTL. Godot mirrors anchors and margins and swaps alignment for RTL locales. Break-iterator data for languages without spaces (Thai, Japanese line breaks) adds about 4 MB and is off by default in exports ([internationalizing_games](https://github.com/godotengine/godot-docs/blob/master/tutorials/i18n/internationalizing_games.rst)). The 4 MB matters for a web build.
- Expansion rates (IBM, via W3C). Up to 10 chars 200-300%. 11-20 180-200%. 21-30 160-180%. 31-50 140-160%. 51-70 151-170%. Over 70 130%. Flickr "views" in German is 2.8x ([W3C text size](https://www.w3.org/International/articles/article-text-size.en)). The +20-35% rule of thumb holds only for paragraph-length lines.

### Inferences
- A 32x32 tile game with a 5x7 font fits about 40-50 characters per line at 320 px wide. Budget dialog boxes for 3 lines English so German fits in 4, or allow auto-paging.
- Keyword highlighting in the Tibia style (`{trade}`) breaks under translation if the typed keyword is English. Use click-to-send keywords tied to IDs, and accept localized typed aliases on the server.
- Variable insertion. Use named placeholders (`{player}`, `{{gold}}`) never string concatenation, so translators can reorder.

### Gaps
- No measured German/Spanish expansion for game dialog specifically, only UI averages.

## Q4. Pixel text tools and gems

### Takeaway
Use Monogram or m5x7 (both CC0) as a bitmap or pixel TTF at integer sizes, Nearest filtering, subpixel positioning off. Use Godot's built-in RichTextLabel effects and `visible_characters` for the typewriter. Skip Febucci for the web build (C# only).

### Cited findings
- Godot imports BMFont `.fnt` or any image as "Font Data (Image Font)". Bitmap fonts cannot do ligatures ([gui_using_fonts](https://github.com/godotengine/godot-docs/blob/master/tutorials/ui/gui_using_fonts.rst)). Tools named there are [BMFont](https://www.angelcode.com/products/bmfont/), BMGlyph and fontcutter.
- Pixel fonts need Default Texture Filter = Nearest, font size an integer multiple of design size, and integer Control scale. Dynamic pixel fonts need subpixel positioning Disabled (same doc).
- m5x7 by Daniel Linssen. CC0 on the itch asset licence field, "free to use but attribution appreciated". Includes "many accented letters". x-height 5, use size 16/32/48. TTF is 33 kB ([itch](https://managore.itch.io/m5x7)).
- m6x11 by Daniel Linssen. Page says "free to use with attribution". x-height 8. m6x11plus has more characters and uses size 18/36/54 ([itch](https://managore.itch.io/m6x11)). Treat as attribution-required.
- Monogram by datagoblin. CC0, fixed width 5 px, zip 50 kB, author says the charset "has grown quite large over the years". No bold version ([itch](https://datagoblin.itch.io/monogram)).
- RichTextLabel built-in effects with defaults. `[wave amp=50.0 freq=5.0]`, `[shake rate=20.0 level=5]`, `[tornado radius=10.0 freq=1.0]`, `[pulse freq=1.0 ...]`, `[fade]`, `[rainbow freq=1.0 sat=0.8 val=0.8]` ([bbcode_in_richtextlabel](https://github.com/godotengine/godot-docs/blob/master/tutorials/ui/bbcode_in_richtextlabel.rst)).
- RichTextLabel performance. Use `append_text()` (parses only new text), `push_[tag]()`/`pop()`, or the Threaded property for big logs (same doc). Relevant for a chat log or dialog history.
- Febucci Text Animator for Godot. Early Access, $10+ on itch, needs Godot .NET, written in C#, no direct GDScript support ([requirements](https://docs.febucci.com/text-animator-godot/other/requirements-and-limitations), [itch](https://febucci.itch.io/godot-textanimator)). Licence text not found.

### Inferences
- Wave amp 50 is for large text. At 7 px glyph height, 1-2 px amplitude reads better. Estimate.
- Font coverage is the limit for localization. m5x7 and Monogram cover Latin with accents. CJK and Arabic need a separate fallback font, which kills the pixel look and adds MBs. Decide supported languages before picking a font.

### Gaps
- Exact glyph counts for m5x7, m6x11plus and Monogram not verified. Hiero not checked.

## Q5. Writing and structure references

### Cited findings
- Elan Ruskin, "AI-driven Dynamic Dialog through Fuzzy Pattern Matching", GDC 2012, Valve. Picks lines by matching many world facts against thousands of rules, most specific rule wins ([GDC Vault](https://gdcvault.com/play/1015528/AI-driven-Dynamic-Dialog-through), [slides PDF](https://cdn.fastly.steamstatic.com/apps/valve/2012/GDC2012_Ruskin_Elan_DynamicDialog.pdf), [Emily Short summary](https://emshort.blog/2012/03/16/gdc-2012-talk-on-dynamic-dialogue/)).
- Emily Short, "Beyond Branching". Contrasts quality-based narrative (player picks from unlocked storylets) with salience-based (engine picks the best fit, like Ruskin's system, later used in Firewatch) ([post](https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/)). Storylets post ([tag](https://emshort.blog/tag/quality-based-narrative/)).
- Jon Ingold, "Introduction to Ink" ([Medium](https://medium.com/game-writing-guide/introduction-to-ink-3e6c224865f8)). GDC 2018 Heaven's Vault talk on dynamic detective story and automated tests in the writing workflow ([Game Developer](https://gamedeveloper.com/design/video-how-inkle-created-a-dynamic-detective-story-in-i-heaven-s-vault-i-)). Joe Humfrey's GDC 2016 ink talk ([Game Developer](https://gamedeveloper.com/design/video-dipping-into-ink-i-80-days-i-narrative-scripting-language)).

### Inferences
- Ambient barks in an MMO town map well onto Ruskin's rule matching. Facts are time of day, weather, player reputation, nearby player count. Yarn Spinner 3's "saliency" and "node groups" implement this pattern ([Yarn GDScript README](https://github.com/YarnSpinnerTool/YarnSpinner-Godot-GDScript)). Dialogue Manager's weighted `%` lines with conditions cover a simpler version.
- Run barks on the server with a seeded RNG and broadcast a line ID, so every player in range sees the same line.

### Gaps
- GDC Vault video may be behind login. Slides PDF is public.

## Sources
- https://github.com/inkle/ink
- https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md
- https://github.com/inkle/inky
- https://github.com/y-lohse/inkjs
- https://www.npmjs.com/package/inkjs
- https://github.com/paulloz/godot-ink
- https://github.com/ephread/inkgd
- https://github.com/YarnSpinnerTool/YarnSpinner
- https://github.com/YarnSpinnerTool/YarnSpinner-Godot
- https://github.com/YarnSpinnerTool/YarnSpinner-Godot-GDScript
- https://github.com/YarnSpinnerTool/YarnSpinner-Godot-GDScript/blob/HEAD/LICENSE.md
- https://yarnspinner.dev/showcase/night-in-the-woods/
- https://yarnspinner.dev/timeline/
- https://github.com/dialogic-godot/dialogic
- https://github.com/nathanhoad/godot_dialogue_manager
- https://github.com/nathanhoad/godot_dialogue_manager/blob/HEAD/docs/Conditions_Mutations.md
- https://github.com/nathanhoad/godot_dialogue_manager/blob/HEAD/docs/Translations.md
- https://github.com/klembot/twinejs
- https://github.com/limbonaut/limboai
- https://github.com/bitbrain/beehave
- https://www.articy.com/help/Integrations_Overview.html
- https://www.articy.com/en/support/frequently-asked-questions/
- https://aimarzhang.itch.io/articy-exporter-for-godot
- https://github.com/arcweave/arcweave-godot-plugin
- https://johnnemann.medium.com/localizing-ink-with-unity-42a4cf3590f3
- https://gamedeveloper.com/design/open-sourcing-80-days-narrative-scripting-language-ink
- https://github.com/godotengine/godot-docs/blob/master/tutorials/scripting/c_sharp/index.rst
- https://github.com/godotengine/godot-docs/blob/master/tutorials/export/exporting_for_web.rst
- https://github.com/godotengine/godot-docs/blob/master/tutorials/i18n/localization_using_gettext.rst
- https://github.com/godotengine/godot-docs/blob/master/tutorials/i18n/localization_using_spreadsheets.rst
- https://github.com/godotengine/godot-docs/blob/master/tutorials/i18n/internationalizing_games.rst
- https://github.com/godotengine/godot-docs/blob/master/tutorials/i18n/pseudolocalization.rst
- https://github.com/godotengine/godot-docs/blob/master/tutorials/ui/gui_using_fonts.rst
- https://github.com/godotengine/godot-docs/blob/master/tutorials/ui/bbcode_in_richtextlabel.rst
- https://www.w3.org/International/articles/article-text-size.en
- https://github.com/otland/forgottenserver/blob/master/data/npc/Captain.xml
- https://github.com/otland/forgottenserver/blob/master/data/npc/scripts/ship.lua
- https://github.com/otland/forgottenserver/blob/master/data/npc/lib/npcsystem/npchandler.lua
- https://github.com/opentibiabr/canary/blob/main/data-otservbr-global/npc/sam.lua
- https://github.com/rathena/rathena/blob/master/doc/script_commands.txt
- https://github.com/HerculesWS/Hercules/blob/stable/db/translations.conf
- https://managore.itch.io/m5x7
- https://managore.itch.io/m6x11
- https://datagoblin.itch.io/monogram
- https://www.angelcode.com/products/bmfont/
- https://febucci.itch.io/godot-textanimator
- https://docs.febucci.com/text-animator-godot/other/requirements-and-limitations
- https://gdcvault.com/play/1015528/AI-driven-Dynamic-Dialog-through
- https://cdn.fastly.steamstatic.com/apps/valve/2012/GDC2012_Ruskin_Elan_DynamicDialog.pdf
- https://emshort.blog/2012/03/16/gdc-2012-talk-on-dynamic-dialogue/
- https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/
- https://medium.com/game-writing-guide/introduction-to-ink-3e6c224865f8
- https://gamedeveloper.com/design/video-how-inkle-created-a-dynamic-detective-story-in-i-heaven-s-vault-i-
