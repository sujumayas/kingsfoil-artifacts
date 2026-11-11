# 02. Single-player pixel RPG text boxes and timing

Researcher angle: decompilations and developer sources for Pokémon, Zelda, Celeste, Undertale (via a fan engine), Stardew and others.
Method: read source directly from pret/pokeemerald, pret/pokecrystal and snesrev/zelda3 on GitHub (raw files, master branch, fetched 2026-11-11). Line references are to those files on that date.

Frame-rate base used for conversions. GBA and Game Boy run at about 59.7 fps, SNES at about 60 fps (NTSC). Undertale runs at 30 fps (speedrun.com thread, https://www.speedrun.com/undertale/thread/nyca2/1). I round to 60 fps for the handhelds and SNES.

---

## Q1. How fast do the classics type, and how is speed stored?

### Takeaway
Every one of these engines stores speed as "frames to wait per character", not as characters per second. The player picks from three presets. Hold-to-fast-forward drops the wait to one frame or zero. A good default lands around 12 to 20 characters per second. Fast lands near 30 to 60.

### Cited findings

Pokémon Emerald (pokeemerald)
- `src/menu.c` lines 77-81, `sTextSpeedFrameDelays`. SLOW = 8, MID = 4, FAST = 1 frames. https://github.com/pret/pokeemerald/blob/master/src/menu.c
- New games start at MID. `src/new_game.c` line 93, `optionsTextSpeed = OPTIONS_TEXT_SPEED_MID`. https://github.com/pret/pokeemerald/blob/master/src/new_game.c
- Some scenes force MID with `gTextFlags.forceMidTextSpeed` (`menu.c` line 476).
- The printer loop is in `src/text.c` around line 940. After each character it sets `delayCounter = textSpeed`, then counts down one per frame. https://github.com/pret/pokeemerald/blob/master/src/text.c
- Fast-forward. If `canABSpeedUpPrint` is set and the player presses A or B, the counter goes to 0 and `hasPrintBeenSpedUp` is set. While A or B stays held after that, every frame zeroes the counter (`text.c` ~943-953). So a fresh press is required, then holding keeps it fast.
- Auto mode (used for demo/recorded battles) uses a fixed 3-frame delay per character (`text.c` ~958).

Pokémon Crystal (pokecrystal)
- `home/print_text.asm`, `PrintLetterDelay`. Comment in source: "fast: 1 frame, mid: 3 frames, slow: 5 frames". https://github.com/pret/pokecrystal/blob/master/home/print_text.asm
- Holding A or B cuts the delay to one frame per letter (same routine, `.checkjoypad`). An option bit `NO_TEXT_SCROLL` removes the delay entirely.
- `wDisableTextAcceleration` turns off the A/B override for scenes that must not be rushed.

Zelda: A Link to the Past (zelda3 C reimplementation)
- `src/messaging.c`. Speed is a per-message control code `kTextCmd_Speed` (19) that sets `vwf_line_speed` (frames per character). When the speed is 0 the loop jumps back and draws the next glyph in the same frame (`goto RESTART`, ~line 2396). https://github.com/snesrev/zelda3/blob/master/src/messaging.c
- So ALttP lets writers change speed mid-message instead of giving the player a setting.

Celeste
- Per-span speed tag `{>> 0.5}text{>>}` (half speed in the wiki example). Everest wiki: https://github.com/EverestAPI/Resources/wiki/Adding-Custom-Dialogue

Undertale (approximated through Create Your Frisk, a fan engine that copies Undertale's text system)
- Default `[speed:1]` is 1 character per 4 frames. Fractions such as `[speed:0.25]` are allowed. https://rhenaudthelukark.github.io/CreateYourFrisk/pages/api-text.html
- This is a fan reimplementation. Treat as close, not confirmed.

### Inferences (my math, not in source)
- Emerald period per character is `textSpeed + 1` frames by my reading of the loop (print frame, then `textSpeed` countdown frames). That gives about 6.6 cps slow, 12 cps mid, 30 cps fast. If the print frame overlaps the countdown it is 7.5 / 15 / 60. Measure in an emulator before quoting.
- Crystal: 5 / 3 / 1 frames gives roughly 12 / 20 / 60 cps (or 10 / 15 / 30 if the same off-by-one applies).
- Undertale via CYF: 1 char per 4 frames at 30 fps is 7.5 cps. Feels slow and deliberate, which fits its punctuation-heavy acting.
- For Asterion: store speed as frames or ms per character, default about 50-66 ms (15-20 cps), fast about 16 ms, plus an "instant" option for MMO veterans.

### Gaps
- No measured cps from video for any game. Link's Awakening disassembly not checked (call budget).
- ALttP default `vwf_line_speed` value per message not extracted. It lives in the message data, not the code.

---

## Q2. Punctuation and scripted pauses

### Takeaway
None of the three decompiled engines pause automatically on punctuation. Writers insert explicit pause codes. Every pause code can be cut short by holding A. Automatic comma/period pauses are a later, mostly indie habit (Undertale-style, Godot plugins).

### Cited findings
- Emerald control codes, `include/constants/characters.h` lines 175-232: `CHAR_PROMPT_SCROLL 0xFA`, `CHAR_PROMPT_CLEAR 0xFB`, `EXT_CTRL_CODE_BEGIN 0xFC` followed by a sub-code. `EXT_CTRL_CODE_PAUSE 0x08` (takes one frame-count byte), `PAUSE_UNTIL_PRESS 0x09`, `WAIT_SE 0x0A` (wait for sound to finish), `PLAY_SE 0x10`, `PAUSE_MUSIC 0x17`. https://github.com/pret/pokeemerald/blob/master/include/constants/characters.h
- Emerald authoring syntax in `charmap.txt`: `PAUSE = FC 08` ("manually print the wait byte after this"), `PAUSE_UNTIL_PRESS = FC 09`. https://github.com/pret/pokeemerald/blob/master/charmap.txt
- Crystal `home/text.asm`. `TextCommand_PAUSE` waits 30 frames (0.5 s) unless A or B is held. `TX_DOTS` prints "…" one at a time with 10 frames between each, also skippable by holding A/B. https://github.com/pret/pokecrystal/blob/master/home/text.asm
- ALttP `kTextCmd_Wait` (17) takes a 0-15 index into `kText_WaitDurations = {31, 63, 94, ... 500}` (`messaging.c` line 114). Holding A (`joypad1L_last & 0x80`) ends the wait at once (~line 2451).
- Celeste `Pause{0.5} between {0.5} words`, value in seconds (Everest wiki).
- Undertale/CYF `[w:x]` pauses for x × 4 frames. `[w:4]` is 16 frames (CYF page above).

### Inferences
- ALttP wait units are most likely frames (31 frames is about 0.5 s, 500 about 8.3 s). Not confirmed.
- A sane auto rule for us, in line with these values: comma 4-6 char-times, period/!/? 8-12 char-times, ellipsis dot 10 frames each (Crystal's number). Writers can override with an explicit tag.

---

## Q3. Box size, lines, scroll, and the advance arrow

### Takeaway
Two lines on the Game Boy family, three on SNES Zelda. Boxes span the full screen width. The "next" arrow bobs by 1-2 px on a slow cycle. Advancing plays a short select sound. Line scroll is animated a few pixels per frame, faster when text speed is faster.

### Cited findings
- Emerald standard message window, `menu.c` lines 84-96: `tilemapLeft = 2, tilemapTop = 15, width = 27, height = 4` tiles. That is 216 x 32 px of text area (8 px tiles) on a 240 x 160 screen, plus a frame tile on each side.
- Emerald down arrow, `text.c`: 8 x 16 px graphic, y offsets `{0, 1, 2, 1}`, next step every 8 frames (`downArrowDelay = 8`). One full bob is 32 frames, about 0.53 s.
- Emerald scroll, `text.c` lines 75-79 and ~1185: scroll distance is one line height. Speed is 1 / 2 / 4 px per frame for slow / mid / fast text.
- Emerald advance: on A or B, `PlaySE(SE_SELECT)` (`TextPrinterWaitWithDownArrow`). Auto mode waits 49 frames before moving on.
- Emerald string format, from `data/maps/LittlerootTown/scripts.inc`: `.string "MOM: {PLAYER}, we're here, honey!\p"`. `\n` new line, `\l` scroll one line after a press, `\p` new paragraph (clear box). https://github.com/pret/pokeemerald/blob/master/data/maps/LittlerootTown/scripts.inc
- Emerald placeholders and colour: `{PLAYER} = FD 01`, `COLOR = FC 01 <colour>`, `SHADOW = FC 03`, `FONT = FC 06 <id>`. Colour indices 0x0-0xF in `characters.h` (white 1, dark grey 2, red 4, blue 8 and more).
- Crystal textbox, `constants/text_constants.asm`: `TEXTBOX_WIDTH = SCREEN_WIDTH` (20 tiles), `TEXTBOX_HEIGHT = 6` tiles. That is 160 x 48 px at the bottom of a 160 x 144 screen. https://github.com/pret/pokecrystal/blob/master/constants/text_constants.asm
- Crystal paragraph: wait for button with blinking cursor, clear box, then 20 frames of delay before the next paragraph starts (`text.asm` ~496). Line scroll ("cont") calls `TextScroll` twice, and each blanks the bottom row then waits 5 frames (~609).
- ALttP: three text rows (`kVWF_RowPositions = {0, 2, 4}`), variable-width font with glyph widths up to 8 px (`assert(width <= 8)`). Scroll is a 16-step pixel shift per line, with `dialogue_scroll_speed` extra steps per frame (`RenderText_Draw_Scroll`).
- ALttP advance (`kTextCmd_Waitkey`): after a press, a 28-frame countdown runs before the next press is taken, and sound 36 plays as it ends. The same applies at message end.

### Inferences
- The 28-frame (about 0.47 s) lockout in ALttP is a mash guard. It stops a held or double-tapped button from skipping a page the player never saw. Emerald's yes/no 5-frame guard (Q5) does the same job. For an MMO with network latency, a 150-300 ms guard after each page reveal is worth copying.
- At Asterion scale (32 px tiles, likely 2x pixel scale on web), a full-width two- or three-line box keeps the Pokémon look.

---

## Q4. The "dialog sound": per-letter blips and voices

### Takeaway
ALttP plays a blip for every non-space glyph. Pokémon plays no per-letter sound, only a select sound on advance. Undertale assigns a voice per character and per font. Animal Crossing's animalese is the extreme form of this idea.

### Cited findings
- ALttP `VWF_RenderSingle`: `if (c != 0x59) sound_effect_2 = 12;` so every glyph except one (likely the space) triggers SFX 12 (`messaging.c` ~2513).
- ALttP `kTextCmd_Sound` (18) plays any SFX mid-message.
- Emerald has no per-glyph sound in the printer. It has `PLAY_SE` and `WAIT_SE` codes and the advance `SE_SELECT` (Q3).
- Undertale via CYF: `[voice:filename]` sets the per-letter sound, `[novoice]` mutes it, and `[font:x]` often brings a default voice. Fonts include `sans` (lower case), `papyrus` (upper case only), `monster`, `uidialog`, `wingdings`. CYF page above.
- Golden Sun's text-advance beeps are described as "overt" by a community patch author (FE Universe): https://feuniverse.us/t/veslys-asm-c/12011/334

### Inferences
- One blip per glyph at 30-60 cps is a machine-gun. ALttP gets away with it because the sound is very short. Many modern games blip every second or third character, or only on vowels. Not verified in source here.
- Per-NPC pitch plus one shared blip sample costs almost nothing in memory and gives each Asterion NPC a voice without voice acting.

### Gaps
- No primary source on animalese (developer interviews found did not cover the method). Candidate lead: Adam Norwood's post "On Animalese, Localization, and Video Game 'Beep Speech'", https://adamnorwood.com/tags/animal-crossing/
- No primary source for Undertale's exact blip spacing or which characters skip blips.

---

## Q5. Choice menus: cursor, default, cancel

### Takeaway
Pokémon puts a small Yes/No box at the right, cursor on Yes by default, and B always means No. Inputs are ignored for 5 frames after it opens. ALttP draws the choice inside the text box itself by swapping the whole message to a version with the cursor on the other line.

### Cited findings
- Emerald Yes/No window, `menu.c` lines 98-106: `tilemapLeft = 21, tilemapTop = 9, width = 5, height = 4` tiles (40 x 32 px). `CreateYesNoMenu(..., initialCursorPos)` lets scripts pick the default. The plain call passes 0 (Yes).
- Emerald `Task_HandleYesNoInput`, `src/script_menu.c` ~224: ignores input until a counter reaches 5 frames. Then `MENU_B_PRESSED` and choice 1 both give result 0 (No) with `SE_SELECT`. https://github.com/pret/pokeemerald/blob/master/src/script_menu.c
- Emerald multichoice menus take an `ignoreBPress` flag, so a script can forbid cancelling (`ScriptMenu_Multichoice(left, top, id, ignoreBPress)`). There is also a `...WithDefault` variant.
- Emerald menu input plays `SE_SELECT` on A and on each up/down move (`menu.c` ~1017-1036).
- ALttP `RenderText_Draw_Choose1Or2`: up/down sets `choice_in_multiselect_box` 0 or 1, plays SFX 32, and reloads message `t + 9` (a pre-rendered version with the cursor on that line). Confirm plays SFX 43 and closes. The same 28-frame guard and SFX 36 apply before input is read.
- GB Studio documents a similar dialogue menu model for modern Game Boy-style games: https://www.gbstudio.dev/docs/scripting/script-glossary/dialogue-menus

### Inferences
- "Cancel = the safe answer" (B = No) is the convention to copy. For shops, cancel should back out of the panel, never confirm.
- Default cursor on the safe option for destructive or costly choices (sell, travel fee). Emerald's `initialCursorPos` shows the engine supports this per call.

---

## Q6. Text effects and how they are encoded

### Takeaway
Old engines encode effects as escape bytes inline in the string (0xFC + sub-code). Modern indies use readable inline tags: Celeste uses `{~}` style braces, Undertale-likes use `[effect:shake]` brackets. Godot's RichTextLabel BBCode (`[wave]`, `[shake]`, `[color]`) maps almost one to one onto Celeste's set.

### Cited findings
- Emerald: colour, highlight, shadow, palette, font, letter spacing, shift right/down as `FC xx` codes (`characters.h` 209-232). No wave or shake.
- ALttP: `kTextCmd_Color` (16), `Name` (3, player name), `Item` (2), `Number` (5), `Position`/`Window` for box placement (`messaging.c` enum ~2159).
- Celeste dialog file syntax (Everest wiki):
  - Portrait: `[THEO left normal]`, plus attributes `upsidedown`, `flip`, `sigh`.
  - Wave `{~}...{/~}`, shake `{*}...{/*}`, drunk `{%}...{/%}`, impact `{!}...{/!}`, big `{big}...{/big}`.
  - Colour `{#F94A4A}Red{#}`, speed `{>> 0.5}...{>>}`, pause `{0.5}`, line break `{n}`.
  - Insert `{+DIALOG_ID}` (e.g. `{+MADELINE}` for the saved name), box anchor `{anchor top|middle|bottom}`, cutscene hook `{trigger #}` and `{silent_trigger #}`.
- Undertale via CYF: `[color:rrggbb]`, `[effect:shake,intensity,step]` (shake default intensity 1.0, step 48 frames), `rotate` default 1.5, `twitch` default 2.0, `[mugshot:face]`, `[name]`, `[noskip]`, `[instant]`, `[waitfor:key]`, `[func:x]`.

### Inferences
- Celeste's `{trigger #}` is the useful idea for us. It lets a line fire a gameplay event (NPC turns, gives item) at an exact point in the text. In an MMO the server would send the trigger index with the line.
- Encode Asterion lines as BBCode-like tags so Godot RichTextLabel can render them. Keep tags out of character counts used for typing speed.

---

## Q7. Portraits, emotion codes, acting with the sprite

### Cited findings
- Celeste: portrait and expression are set inline per line `[CHAR side expression]` (Everest wiki).
- Stardew Valley: numeric portrait commands index the NPC's portrait sheet from 0, top-left, counting along rows. Some NPCs have more than the standard set (forum thread): https://forums.stardewvalley.net/threads/dialogue-mods.3880/
- Undertale/CYF: `[mugshot:face]` swaps the face per line.

### Gaps (honest)
- The Stardew Modding:Dialogue wiki page returned HTTP 403 (Cloudflare) to both WebFetch and curl. I could not cite the `$h $s $u $l $a`, `#$b#`, `$e`, `$q`/`$r` codes or the 64 x 64 portrait size from a primary page. From memory, not cited: portraits are 64 x 64 px cells, `$h` happy, `$s` sad, `$u` unique, `$l` love, `$a` angry, `#$b#` box break, `$e` end. Verify at https://stardewvalleywiki.com/Modding:Dialogue before using.
- EarthBound (window flavours, text speed option), Chrono Trigger, Golden Sun (characters hop and show emote bubbles while talking), Eastward, Sea of Stars and Octopath: no primary source found in budget. Golden Sun string dump for markup study: https://goldensunwiki.net/wiki/Golden_Sun_series/String_Dump

---

## See it in action (pages to open)
- Emerald text printer source: https://github.com/pret/pokeemerald/blob/master/src/text.c
- Crystal letter delay source: https://github.com/pret/pokecrystal/blob/master/home/print_text.asm
- ALttP messaging source: https://github.com/snesrev/zelda3/blob/master/src/messaging.c
- Celeste dialog format: https://github.com/EverestAPI/Resources/wiki/Adding-Custom-Dialogue
- Undertale-style command set: https://rhenaudthelukark.github.io/CreateYourFrisk/pages/api-text.html
- Word-wrapping dialogue (typewriter reflow problem): https://eev.ee/blog/2016/10/20/word-wrapping-dialogue/
- Gap: no gameplay video URLs verified this pass. A follow-up should collect one YouTube or wiki video per game.

## Quick parameter table

| Game | Speed presets (frames/char) | Hold to fast | Box | Lines | Pause code | Per-letter sound |
|---|---|---|---|---|---|---|
| Pokémon Emerald | 8 / 4 / 1, default 4 | A/B after fresh press, 0 delay | 27x4 tiles (216x32 px) | 2 | `FC 08 <frames>` | No, SE on advance |
| Pokémon Crystal | 5 / 3 / 1 | A/B, 1 frame | 20x6 tiles (160x48 px) | 2 | TX_PAUSE 30 f | No |
| ALttP | per message `Speed` code | speed 0 = instant chain | full width | 3 | Wait 31-500 (idx 0-15) | Yes, SFX 12 per glyph |
| Celeste | `{>> x}` multiplier | n/a in source read | n/a | n/a | `{0.5}` s | n/a |
| Undertale (CYF) | 1 char / 4 f at 30 fps | X skips (unless `[noskip]`) | n/a | n/a | `[w:x]` = 4x f | Yes, per font/voice |

## Sources
- https://github.com/pret/pokeemerald/blob/master/src/menu.c
- https://github.com/pret/pokeemerald/blob/master/src/text.c
- https://github.com/pret/pokeemerald/blob/master/src/new_game.c
- https://github.com/pret/pokeemerald/blob/master/src/script_menu.c
- https://github.com/pret/pokeemerald/blob/master/include/constants/characters.h
- https://github.com/pret/pokeemerald/blob/master/charmap.txt
- https://github.com/pret/pokeemerald/blob/master/data/maps/LittlerootTown/scripts.inc
- https://github.com/pret/pokecrystal/blob/master/home/print_text.asm
- https://github.com/pret/pokecrystal/blob/master/home/text.asm
- https://github.com/pret/pokecrystal/blob/master/constants/text_constants.asm
- https://github.com/snesrev/zelda3/blob/master/src/messaging.c
- https://github.com/EverestAPI/Resources/wiki/Adding-Custom-Dialogue
- https://rhenaudthelukark.github.io/CreateYourFrisk/pages/api-text.html
- https://www.speedrun.com/undertale/thread/nyca2/1
- https://forums.stardewvalley.net/threads/dialogue-mods.3880/
- https://feuniverse.us/t/veslys-asm-c/12011/334
- https://goldensunwiki.net/wiki/Golden_Sun_series/String_Dump
- https://www.gbstudio.dev/docs/scripting/script-glossary/dialogue-menus
- https://eev.ee/blog/2016/10/20/word-wrapping-dialogue/
- https://adamnorwood.com/tags/animal-crossing/
