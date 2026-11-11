# 04. Mobile and casual RPG dialog, touch interaction with NPCs

Researcher angle: gacha and VN-style dialog flows, mobile MMO NPC interaction on touch, VN engine conventions (Ren'Py, plus Dialogic for Godot), touch target sizes, and evidence on skipping.

Research date: 2026-11-11. Tool budget used: about 32 calls.

---

## Q1. What is the auto-advance delay formula, and what numbers do engines ship with?

### Takeaway
Every engine I checked uses the same shape: `delay = fixed + per_char * length`, started after the typewriter finishes. Ren'Py ships about 1.5 s fixed plus 0.06 s per character. Dialogic (Godot) ships 1.0 s fixed plus 0.1 s per character. Use this shape for Asterion's single-player RPG. For the MMO, auto mode matters less, because Tibia-style NPC talk is keyword driven.

### Cited findings
- Ren'Py source, `renpy/display/behavior.py` lines 748-751: `afm_delay = (afm_bonus + afm_length) / afm_characters * preferences.afm_time`. It then adds any `{w}` dialogue pause and the text's own reveal time (`t.get_time()`), so the timer effectively starts once typing ends. https://github.com/renpy/renpy/blob/master/renpy/display/behavior.py
- Defaults: `config.afm_bonus = 25`, `config.afm_characters = 250`, `config.afm_voice_delay = 0.5` s after a voice line ends. If `afm_callback` is None, auto mode waits while voice plays. https://www.renpy.org/doc/html/config.html
- Default template `options.rpy`: `preferences.afm_time = 15`, "with 0 to 30 being the valid range". The unit is "seconds per 250 characters" (`00preferences.rpy` docstring). https://github.com/renpy/renpy/blob/master/gui/game/options.rpy , https://github.com/renpy/renpy/blob/master/renpy/common/00preferences.rpy
- `preferences.afm_after_click = False` by default. A click turns auto mode off. https://www.renpy.org/doc/html/preferences.html
- Dialogic 2 (Godot), `addons/dialogic/Modules/Text/auto_advance.gd`. Defaults are `autoadvance_fixed_delay = 1`, `autoadvance_per_character_delay = 0.1`, `autoadvance_per_word_delay = 0`. Formula is `(words*per_word + chars*per_char) * delay_modifier + fixed_delay`. Ignored characters (punctuation) can be excluded from the count. A user setting `autoadvance_delay_modifier` scales it. https://github.com/dialogic-godot/dialogic/blob/main/addons/dialogic/Modules/Text/auto_advance.gd
- Dialogic auto-skip: `autoskip_time_per_event = 0.1` s. https://github.com/dialogic-godot/dialogic/blob/main/addons/dialogic/Modules/Text/auto_skip.gd

### Worked numbers (my arithmetic from the cited defaults)
| Line length | Ren'Py default (afm_time 15) | Dialogic default |
|---|---|---|
| 20 chars | 15 x 45/250 = 2.7 s | 1 + 2.0 = 3.0 s |
| 40 chars | 15 x 65/250 = 3.9 s | 1 + 4.0 = 5.0 s |
| 80 chars | 15 x 105/250 = 6.3 s | 1 + 8.0 = 9.0 s |
| 120 chars | 15 x 145/250 = 8.7 s | 1 + 12.0 = 13.0 s |

- Ren'Py's default is 0.06 s per character plus 1.5 s fixed. That is about 16.7 characters per second of reading, roughly 165 wpm at 6 chars per word. The full slider range covers 0 to 0.12 s per char and 0 to 3 s fixed.
- Dialogic's default is 10 chars/s, noticeably slower than Ren'Py's.

### Inferences
- A good starting point for Asterion is `1.2 s + 0.05 s/char`, clamped to 2 to 10 s, scaled by a user slider from 0.5x to 2x. This sits between the two engines. It is an estimate and needs playtesting.
- Count characters after stripping BBCode/markup tags. Ren'Py does this with `filter_text_tags` (behavior.py line 742).
- Localization: per-character timing breaks for CJK. One CJK glyph carries more meaning than one Latin letter, so scale `per_char` per locale (inference, no source found).

### Gaps
- No published auto-mode formula for Genshin, HSR, Arknights, Blue Archive or FEH. Their timings would need frame counting from video.

---

## Q2. What text speed do engines and games default to?

### Takeaway
VN engines default to fast or instant reveal and let the player slow it down. Ren'Py's template ships instant text. Dialogic ships 100 cps.

### Cited findings
- Ren'Py `preferences.text_cps = 0` (instant) in the default template. The "text speed" slider range defaults to 200 cps. https://github.com/renpy/renpy/blob/master/gui/game/options.rpy , https://github.com/renpy/renpy/blob/master/renpy/common/00preferences.rpy (line 283, 355)
- Dialogic `dialogic/text/letter_speed = 0.01` s per letter, which is 100 cps. A user `text_speed` multiplier applies on top. A `[pause]` with no argument waits 0.5 s times the multiplier. https://github.com/dialogic-godot/dialogic/blob/main/addons/dialogic/Modules/Text/subsystem_text.gd (lines 441, 684)
- Ren'Py `config.skip_delay = 5` ms per line while skipping (docs say the real timing is less precise). https://www.renpy.org/doc/html/config.html

### Inferences
- On mobile, the first tap should complete the line and the second should advance. Genshin works this way ("interrupt a line and move to the next", see Q4). With that convention, a slow default typewriter costs little.

### Gaps
- Gacha text speeds are unpublished. Pokémon's Slow/Normal/Fast pattern is covered by other researchers.

---

## Q3. What controls does a mobile dialog screen carry (auto, skip, log, rollback)?

### Takeaway
The standard mobile set is tap-anywhere to advance, a small top-corner cluster (Auto, Skip, Log), and a summary card when the player skips. Ren'Py's quick menu is the desktop superset. HSR's 3.4 skip-with-summary is the current gacha reference point.

### Cited findings
- Ren'Py quick menu buttons are Back (rollback), History, Skip, Auto, Save, Q.Save, Q.Load, Prefs. https://github.com/renpy/renpy/blob/master/gui/game/screens.rpy (lines 249-256)
- Ren'Py rollback is on by default (`config.rollback_enabled = True`), with `config.hard_rollback_limit = 100` steps. https://www.renpy.org/doc/html/config.html
- Ren'Py skips only read text by default. `preferences.skip_unseen = False` means only text "already read in any session" is skipped. https://www.renpy.org/doc/html/preferences.html
- Genshin Impact added auto-play in version 1.2, with the button "on the top-left corner". It had no full skip at that time. Tapping the dialog area interrupts a line and moves on. https://theglobalgaming.com/genshin-impact/genshin-impact-how-to-skip-dialogue
- A 2026 report says Genshin made spam-tapping much faster in "Luna VIII" (1 July 2026), with the log still available. It still has no dedicated skip. I could not open the article (403) and only saw the search summary. https://esports.gg/news/genshin-impact/dialogue-skip-system/
- Honkai: Star Rail 3.4 (announced 16 June 2025) added Dialogue Skip and Story Summary. The skip button is "beside the autoplay button". The summary lists the characters who appeared and gives a short paragraph of events. Skip covers Trailblaze, Companion and Adventure missions. "Dialogues encountered during cutscenes or exploration" stay unskippable. Summaries first worked only in some regions, with more planned for 3.6. https://www.siliconera.com/?p=1095169 , https://game8.co/games/Honkai-Star-Rail/archives/530776
- Dragalia Lost (2018) showed a pop-up summary on skip, and the player could cancel the skip and watch instead. https://www.siliconera.com/the-dragalia-lost-skip-feature-still-keeps-players-caught-up/
- Arknights: Endfield shows a summary when you skip a story cutscene. Skip is a hotkey or the top-right corner. https://game8.co/games/Arknights-Endfield/archives/574738
- Girls Band Party puts Skip, Auto and fast-forward in a top-right menu. https://bandori.fandom.com/wiki/Girls_Band_Party!_In-Depth_Guide

### Inferences
- Skip-with-summary needs authoring support. Each skippable block needs a one-line `summary` field in the dialog data, and each quest step should record what the player must know. That fits Yarn/Ink node metadata.
- For the MMO, NPC talk is short and keyword driven, so a skip button matters most for single-player story scenes and long quest intros. A Log/backlog is worth more in the MMO, because players who misread a quest instruction need to see it again.
- Keep the control cluster in the top corner, away from the tap-to-advance area. A miss-tap on Skip loses story, while a miss-tap on Advance is cheap.

### Gaps
- Arknights (original), Blue Archive, FEH, Epic Seven, Another Eden and Octopath CotC skip and log details were not confirmed. Searches returned nothing usable and fan wikis blocked access.

---

## Q4. How do mobile MMOs handle NPC interaction on touch?

### Takeaway
Two patterns cover the field. In "Tap does the default, long-press opens the menu" (OSRS Mobile), a desktop right-click menu is ported to touch. "Tap the quest to auto-path" (MapleStory M auto quest, Ragnarok's `<NAVI>` links) removes walking to NPCs entirely. Asterion can use both. Tap an NPC to walk there and say "hi". Make place names in NPC text tappable navigation links.

### Cited findings
- OSRS Mobile. The Choose Option menu opens on right-click or long-press, and its top entry is the tap action. https://oldschool.runescape.wiki/w/Choose_Option
- OSRS Mobile "single-tap mode acts as the desktop's right-click". With it off, touch-and-hold brings up options. Players can set a Long Tap Delay. Minimenu Reordering changes the default tap action. A framerate limit offers 15/20/30/60. Dates: Android open beta 5 July 2018, release 30 Oct 2018, UI rework beta 21 Sept 2023. https://oldschool.runescape.wiki/w/Old_School_RuneScape_Mobile
- OSRS menu swaps had bugs where a tap opened the long-press menu instead (moderator acknowledgment, Jan 2025). https://lr.us.psf.lt/r/OSRSMobile/comments/1i18mq5/mobile_issues_acknowledgement/m75vfhe/?context=3
- MapleStory M auto quest starts when the player taps a quest in the Mini Quest Window. The character walks to the target, fights if needed and returns to the quest giver. The player only advances dialog. (Twinfinite guide, about 7 years old.) https://twinfinite.net/?p=369057
- Ragnarok M: tap-to-move plus tap-and-hold as a virtual d-pad. https://mmogames.com/articles/archives/ragnarok-m-eternal-love-a-love-letter-to-old-school-mmorpgs
- Ragnarok Online (rAthena) supports clickable navigation inside NPC text. `<NAVI>[Tool Shop]<INFO>alberta,98,154,0,000,0</INFO></NAVI>` makes the text start pathing on click. The `navigateto("<map>",x,y,flag,...)` script command routes through Kafra and airship services (default `NAV_KAFRA_AND_AIRSHIP`) and needs client 2011-10-10 or newer. `<ITEM>` links (renamed from `<ITEMLINK>` in 2015) open item info. https://github.com/rathena/rathena/blob/master/doc/script_commands.txt (lines ~1158-1194 and 11211-11240)

### Inferences
- Tibia's keyword model ("hi", then keywords) is hard on phone keyboards. On touch, show the keywords the NPC recognizes as tappable chips above the chat input. rAthena's inline link tags are one way to author this, for example `{kw:trade}` in the NPC line. The server still receives a plain keyword string, so bandwidth and authority do not change.
- Auto-pathing to an NPC is a client-side convenience if the server validates each step, as Tibia's server already does. The cost is a pathfinding call on the client and a stream of step packets.

### Gaps
- No primary source for Ragnarok M or MapleStory M interaction button sizes or the distance at which an "interact" button appears near an NPC. Albion mobile not covered.

---

## Q5. Touch target sizes, thumb zones and safe areas

### Takeaway
Hit areas should be at least 44x44 pt (Apple) or 48x48 dp (Android). Visible art can be smaller than the hit area. Players hold phones one-handed about half the time, so put Advance on a large area and keep destructive buttons out of easy reach.

### Cited findings
- Apple HIG: a button "needs a hit region of at least 44x44 pt", 60x60 pt in visionOS. https://developer.apple.com/design/human-interface-guidelines/buttons
- Apple HIG accessibility table, default and minimum control size by platform: iOS/iPadOS 44x44 / 28x28 pt, macOS 28x28 / 20x20 pt, tvOS 66x66 / 56x56 pt. https://developer.apple.com/design/human-interface-guidelines/accessibility
- Apple HIG layout: "Adhere to the screen's safe area", so the Dynamic Island and other hardware features do not cover controls. https://developer.apple.com/design/human-interface-guidelines/layout
- Android: touch target "at least 48dpx48dp. Larger is even better." https://developer.android.com/guide/topics/ui/accessibility/apps
- WCAG 2.2 SC 2.5.8 (AA): 24x24 CSS px minimum, or enough spacing. SC 2.5.5 (AAA) uses 44x44 CSS px. Relevant for the web build. https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Steven Hoober (UXmatters, Feb 2013), 1,333 observations: one-handed 49%, cradled 36%, two-handed 15%. Among one-handed users, 67% used the right thumb. The author later said his reach diagrams were inaccurate. https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php
- Ren'Py's `touch` variant enlarges quick-menu button padding from 10x4 px to 40x14 px at a 1280x720 base. https://github.com/renpy/renpy/blob/master/gui/game/gui.rpy (line 428)

### Inferences
- At Asterion's pixel scale, one 32 px tile at 2x zoom is 64 device px. On a 3x phone that is only about 21 pt, below Apple's 28 pt minimum. NPC hit areas therefore need padding beyond the sprite, around 1.5 to 2 tiles tall, or a tap should snap to the nearest NPC within a radius.
- Godot exposes `DisplayServer.get_display_safe_area()`. Inset the dialog box by it on notched phones (inference, not checked this session).

### Gaps
- Exact iPhone safe-area inset values (top and home indicator) not collected. Material 3 page did not render.

---

## Q6. Dialog box size as a fraction of the screen, and mobile font sizes

### Takeaway
Ren'Py's template is a good baseline. The box takes about 26% of screen height on desktop and 33% on phones, with text about 36% larger.

### Cited findings (Ren'Py `gui/game/gui.rpy`, base 1280x720)
| Value | Desktop | `small` (phone) variant |
|---|---|---|
| `textbox_height` | 185 px (25.7% of 720) | 240 px (33.3%) |
| `text_size` | 22 px | 30 px |
| `name_text_size` | 30 px | 36 px |
| `dialogue_width` | 744 px (58% of width) | 1100 px (86%) |
| `choice_button_width` | 790 px (62%) | 1240 px (97%) |
| `quick_button_text_size` | 14 px | 20 px |
| `history_height` | (default) | 190 px |

Source: https://github.com/renpy/renpy/blob/master/gui/game/gui.rpy (lines 70-208, 424-470). `textbox_yalign = 1.0` (bottom).

### Inferences
- On phones, choices become full-width stacked buttons. That matches the 48 dp target rule and the thumb-zone data.
- For a 640x360 pixel-art base (estimate), 33% is about 120 px. That fits 3 lines of an 8x16 font with padding.

### Gaps
- No measured box heights for gacha titles. Live2D vs static portrait cost not researched. Blue Archive uses animated 2D characters, but I found no performance figure.

---

## Q7. Do mobile players skip, and how do designers respond?

### Takeaway
I found no public skip-rate telemetry for mobile RPGs. Studios respond by making skip safe rather than by blocking it. Typical tools are skip-read-only, a summary on skip, a log, and a later replay. HSR's 3.4 change shows that even a story-heavy gacha gave in to player demand.

### Cited findings
- No published mobile skip-rate numbers found. One analytics vendor lists "cutscene skip rate" as a KPI to track, without benchmarks. https://getbruin.com/use-cases/mobile-gaming/narrative-engagement-retention-link/
- Dispatch team (GDC 2026): fewer than 1% of Telltale players chose the silent option. This is a choice-usage figure, not a skip rate, and it comes from a news report. https://thegeek.games/?p=125498
- Anecdotal: a Giant Bomb forum poll of 110 votes. https://www.giantbomb.com/forums/general-discussion-30/do-you-skip-through-the-storydialogue-in-the-games-1904642/
- Fred Z., "Why do Players Skip?" (13 July 2026). It measured one Baldur's Gate 3 conversation at about 2 actions per minute, with a 58 s passive stretch, against WoW's 40-90 APM. Known responses are hold-to-skip, renaming skip to "fast forward", blocking skip on first viewing, and vote-to-skip in groups (FFXIV suggestion). https://fredzed.substack.com/p/why-do-players-skip
- HSR 3.4 skip plus summary, and Dragalia Lost skip plus summary with a cancel option (see Q3).
- Ren'Py defaults to skipping read text only (see Q3).

### Inferences
- MMO angle: a skipped quest intro becomes a support ticket asking "where do I go?" The cheap fix is to always write the objective to the quest tracker, whether the player read the dialog or not. Then skipping costs only flavor text.
- Low APM is the real problem. Short NPC lines with a tappable choice every 2 or 3 lines keep players engaged better than a skip button does (inference from Fred Z.).

---

## Recommendations for Asterion (inferences, rated)
| Technique | Clarity | Charm | MMO fit | Authoring | Speed |
|---|---|---|---|---|---|
| Tap anywhere: 1st tap completes the line, 2nd advances | 5 | 3 | 5 | 5 | 5 |
| Auto mode `fixed + per_char` with slider (Ren'Py/Dialogic) | 4 | 3 | 3 | 5 | 4 |
| Skip with one-line summary card (HSR, Dragalia) | 4 | 2 | 4 | 3 | 5 |
| Backlog/log of NPC lines | 5 | 2 | 5 | 5 | 4 |
| Tappable keyword chips for Tibia-style NPCs | 5 | 3 | 5 | 4 | 5 |
| Inline nav links in NPC text (rAthena `<NAVI>`) | 5 | 3 | 5 | 4 | 5 |
| Tap NPC to auto-walk and greet | 4 | 3 | 5 | 5 | 5 |
| Long-press for the action menu (OSRS) | 3 | 2 | 5 | 4 | 3 |
| Padded NPC hit area or nearest-NPC snap | 5 | 3 | 5 | 5 | 5 |

---

## Sources
- Ren'Py behavior.py (AFM formula): https://github.com/renpy/renpy/blob/master/renpy/display/behavior.py
- Ren'Py config docs: https://www.renpy.org/doc/html/config.html
- Ren'Py preferences docs: https://www.renpy.org/doc/html/preferences.html
- Ren'Py options.rpy: https://github.com/renpy/renpy/blob/master/gui/game/options.rpy
- Ren'Py 00preferences.rpy: https://github.com/renpy/renpy/blob/master/renpy/common/00preferences.rpy
- Ren'Py gui.rpy: https://github.com/renpy/renpy/blob/master/gui/game/gui.rpy
- Ren'Py screens.rpy: https://github.com/renpy/renpy/blob/master/gui/game/screens.rpy
- Dialogic auto_advance.gd: https://github.com/dialogic-godot/dialogic/blob/main/addons/dialogic/Modules/Text/auto_advance.gd
- Dialogic auto_skip.gd: https://github.com/dialogic-godot/dialogic/blob/main/addons/dialogic/Modules/Text/auto_skip.gd
- Dialogic subsystem_text.gd: https://github.com/dialogic-godot/dialogic/blob/main/addons/dialogic/Modules/Text/subsystem_text.gd
- rAthena script_commands.txt: https://github.com/rathena/rathena/blob/master/doc/script_commands.txt
- Apple HIG buttons: https://developer.apple.com/design/human-interface-guidelines/buttons
- Apple HIG accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Apple HIG layout: https://developer.apple.com/design/human-interface-guidelines/layout
- Android accessibility: https://developer.android.com/guide/topics/ui/accessibility/apps
- WCAG 2.5.8: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Hoober, UXmatters 2013: https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php
- OSRS Mobile wiki: https://oldschool.runescape.wiki/w/Old_School_RuneScape_Mobile
- OSRS Choose Option: https://oldschool.runescape.wiki/w/Choose_Option
- MapleStory M auto quest: https://twinfinite.net/?p=369057
- Ragnarok M review: https://mmogames.com/articles/archives/ragnarok-m-eternal-love-a-love-letter-to-old-school-mmorpgs
- Genshin skip guide: https://theglobalgaming.com/genshin-impact/genshin-impact-how-to-skip-dialogue
- Genshin 2026 pacing (403, search summary only): https://esports.gg/news/genshin-impact/dialogue-skip-system/
- HSR 3.4 Siliconera: https://www.siliconera.com/?p=1095169
- HSR skip Game8: https://game8.co/games/Honkai-Star-Rail/archives/530776
- Dragalia Lost skip: https://www.siliconera.com/the-dragalia-lost-skip-feature-still-keeps-players-caught-up/
- Arknights Endfield skip: https://game8.co/games/Arknights-Endfield/archives/574738
- Girls Band Party guide: https://bandori.fandom.com/wiki/Girls_Band_Party!_In-Depth_Guide
- Fred Z., Why do Players Skip: https://fredzed.substack.com/p/why-do-players-skip
- Bruin skip KPI: https://getbruin.com/use-cases/mobile-gaming/narrative-engagement-retention-link/
- Dispatch silent option: https://thegeek.games/?p=125498
