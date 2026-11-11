# 03. Modern MMO UX for quest givers, markers, quest flow and NPC services

Researcher angle: WoW, FFXIV, Guild Wars 2, ESO, OSRS mobile. About 29 tool calls. Many fan wikis worked this time (warcraft.wiki.gg, wiki.guildwars2.com). No images copied.

---

## Q1. How many marker states do quest givers need, and what do they look like?

### Takeaway
WoW's marker set grew from 4 states in 2004 to roughly 10 today, and players complain when two states differ by colour only. FFXIV uses icon shape for category (meteor, plus, bubble) and colour for state (red = blocked). For a 32x32 pixel-art game, use shape for "what kind" and a separate cue for "can I act now". Never rely on hue alone.

### Cited findings
- WoW base set. Yellow `!` = quest available. Grey/silver `!` = available in a few levels. Grey `?` = accepted, not finished. Yellow `?` = ready to turn in. Wiki icon files are 16x16 (e.g. "Quest Avail 16x16"). https://lotro.allakhazam.com/wiki/Quests_(WoW) and https://vanilla-wow-archive.fandom.com/wiki/Quest
- WoW blue `!` and `?` = repeatable/daily. Added with The Burning Crusade (2007). https://warcraft.wiki.gg/wiki/Daily_Quest
- WoW orange `!` = Legendary or Artifact chain. https://lotro.allakhazam.com/wiki/Questgivers_(WoW)
- WoW campaign marker. Shadowlands alpha (reported 10 April 2020) put a shield-like background behind story quest markers, the first change to `!`/`?` in 16 years. The same build marked nearby objective targets in the world without addons. https://mein-mmo.de/en/after-16-years-wow-replaces-the-famous-quest-markers-and,492314
- Patch 9.0.2 (2020-11-17) split major story quests from side quests in the log. https://warcraft.wiki.gg/wiki/Quest_log
- Weekly quests had no own marker in Dragonflight and showed as a normal `!`. https://us.forums.blizzard.com/en/wow/t/can-we-please-have-separate-blue-weekly-icons-on-the-map-for-weekly-quests/1748027
- Players report the blue marks are harder to see than yellow. https://us.forums.blizzard.com/en/wow/t/difficulty-seeing-the-new-quest-marks/1946251
- Blizzard said at BlizzCon 2023 it would change icons so daily vs weekly can be told apart "without relying on shades of color", a colour-blindness fix. https://warcrafttavern.com/wow/news/interface-changes-in-the-war-within-new-spellbook-layout-and-quest-icons
- FFXIV. Main Scenario Quest (MSQ) uses a flaming meteor icon, based on ARR's opening cinematic. Feature-unlocking quests use a blue speech bubble with a `+`. Normal side quests use a speech bubble with `!`. https://trialsoffantasy.com/new-player/ and https://forum.square-enix.com/ffxiv/threads/375015-Scenario-Quest-Guide-Icon
- FFXIV red marker = requirements not met. Green-tinted marker = ready to turn in. https://kotaku.com/final-fantasy-14-ff14-quest-red-green-blue-1851593464
- FFXIV official guide. Important quests get "unique icons", icons change as you progress, red means requirements not met. https://na.finalfantasyxiv.com/uiguide/know/faq-display/interface_npc_icon.html
- GW2 renown heart NPC. Empty heart outline above the NPC and on the map, which "will fill" as contribution rises. After completion the NPC becomes a karma vendor with a filled heart. Repeatable hearts reset daily. https://wiki.guildwars2.com/wiki/Renown_Heart_NPC

### Inferences
- Counting the cited states, WoW has about 10 marker variants (yellow/grey `!`, yellow/grey `?`, blue `!`/`?`, orange `!`, campaign versions). A Tibia-like game can launch with 4 (available, locked-soon, in progress, turn-in) plus 1 repeatable variant.
- At 32x32 tiles, a 16x16 or 8x12 marker over the head fits WoW's own icon size. Use outline or shape change for the grey/locked state so it reads in greyscale.
- GW2's filling heart is a good pattern for a server-authoritative MMO. One icon shows progress without opening a log, and the progress number is already on the server.

### Gaps
- No official marker draw size in pixels or world units, and no marker visibility distance for WoW or FFXIV. WoW's nameplate range is related (below) but quest markers are drawn separately.
- No primary source for the exact current TWW icon set.

---

## Q2. How far away are markers and nameplates visible?

### Takeaway
WoW caps nameplates at 60 yards in retail and 20 to 41 yards in Classic. Quest markers show at longer range and on the minimap. For Asterion, a top-down screen already bounds visibility, so the question becomes the minimap and offscreen arrows.

### Cited findings
- Retail WoW nameplate distance is hard-capped at 60 yards since patch 8.2.5, and a Blizzard reply calls that intended. https://us.forums.blizzard.com/en/wow/t/retail-hardlocked-nameplate-distance-at-60-yards/973286
- TBC Classic raised the cap to 41 yards via `nameplateMaxDistance`. https://warcrafttavern.com/wow-classic/tools/blue-tracker/t/us/961393
- Classic Anniversary is still capped at 20 yards per players. https://eu.forums.blizzard.com/en/wow/t/wow-classic-anniversary-nameplate-distance/554190
- Kaplan (GDC 2009) on the "Christmas tree effect". Hubs fill the minimap with `!` markers, players clear them one by one and lose context. https://www.gamedeveloper.com/game-platforms/gdc-learning-from-i-world-of-warcraft-i-s-quest-design-mistakes

### Inferences
- A Tibia-style screen is about 15x11 tiles. Every NPC on screen is already "in range", so the marker only needs to beat clutter, not distance.
- Kaplan's Christmas tree point argues for capping how many quest markers the minimap shows at once, or dimming low-level ones.

### Gaps
- No measured distance for WoW quest marker draw. No FFXIV numbers.

---

## Q3. How did quest flow UX evolve (Classic to retail)?

### Takeaway
WoW moved from "read text, find it yourself" to text plus map plus objective tracker over about 15 years. Each step cut the need to read. Blizzard kept the old style in Classic on purpose.

### Cited findings (dated)
- 2004 launch. Quest log cap 20. https://warcraft.wiki.gg/wiki/Quest_log
- Patch 1.3.0 (2005-03-07). Shift-click a quest to show objectives on screen under the minimap. This is the first objective tracker. Same page.
- 2007 TBC. Log cap 25. Same page.
- Patch 3.3.0 (2009-12-08). Built-in "quest helper". Quest areas highlighted on the world map, numbered POIs, a `?` at the turn-in spot, Show Map button in the log. Arrows stayed addon-only (TomTom, Cartographer). https://www.engadget.com/2009/11/14/patch-3-3-blizzard-previews-new-quest-tracking-ui/ and https://www.guiaswow.com/en/patches/new-interface-map-tracking-missions-3-3.html
- Wrath Classic (2022) left out 3.3 map tracking because it "changes how the game is played". https://www.wowhead.com/wotlk/cn/news/리치-왕의-분노-클래식에-게임-내-퀘스트-도우미-기능이-추가되지-않을-예정-327512
- Patch 6.0.2 (2014-10-14). Quest log merged into the world map. Tracker auto-sorts by proximity on zone entry. Quest items usable from the tracker. https://warcraft.wiki.gg/wiki/Quest_log
- Patch 9.0.2 (2020-11-17). Story vs side quest split. Same page.
- Dragonflight hotfix 2022-12-09. Log cap 25 to 35, retail only. Classic stays 25. https://mein-mmo.de/en/wow-your-complaining-has-helped-blizzard-increases-the-quest-log-gives-you-more-space,921568
- Dragonflight 10.0 HUD revamp rebuilt the HUD with an edit mode. It also added an icon above NPCs for interaction prompts. https://worldofwarcraft.blizzard.com/en-us/news/23841481 and https://worldofwarcraft.blizzard.com/news/23876525/
- 10.2.0 made the quest log UI customizable. https://warcraft.wiki.gg/wiki/Quest_log
- FFXIV Patch 5.3 (August 2020) cut about 13% of ARR main scenario quests. Others lost steps or became side quests. https://ffxiv.consolegameswiki.com/wiki/A_Realm_Reborn_Overhaul and https://www.gamespot.com/articles/ffxiv-53-update-is-live-with-free-trial-revamped-q/1100-6476484/
- FFXIV 7.0 (2024) lets players click Duty List icons to perform quest steps like emotes, only for 7.0 quests. https://pcgamer.com/games/final-fantasy/final-fantasy-14-dawntrail-s-preliminary-patch-notes-are-here-showing-fixes-to-those-annoying-stealth-quests-and-the-ability-to-banish-npc-crowding-players-to-the-shadow-realm

### Quest log caps (numbers)
| Game | Cap | Source |
|---|---|---|
| WoW launch 2004 | 20 | warcraft.wiki.gg/wiki/Quest_log |
| WoW TBC to Shadowlands, all Classic | 25 | same |
| WoW retail since 2022-12-09 | 35 | same, mein-mmo |

### Inferences
- For a Tibia-like game, a cap of 20 to 25 matches WoW's long-term choice and keeps the log inside one screen on mobile.
- The FFXIV 7.0 "click the objective to do it" pattern removes a lookup step. Cheap to copy when a step is "say X to NPC Y".

### Gaps
- No objective tracker limit found for WoW (how many tracked at once).
- No source for Dragonflight-era talking head or gossip window layout changes. A source claimed 10.2 added dialog background colour choices, but it was a low-quality aggregator and I did not verify it.

---

## Q4. How many players skip quest text, and how did studios respond?

### Takeaway
No studio has published telemetry. The best numbers are a 2024 WoW poll (37.7% never read) and Kaplan's 2009 statements. Studio responses cluster around four moves. Short text caps, objectives shown separately from story, map guidance, and voice acting.

### Cited findings
- Official @Warcraft poll on X, reported 9 July 2024. 17.8% always read. 25.9% skip when rushing. 18.5% read only big quests. 37.7% "Quest text?". Self-selected, no vote total given. https://mein-mmo.de/en/wow-more-than-one-in-three-dont-read-quest-texts-barely-know-the-story,1147872
- A City of Heroes developer "allegedly" said about 80% of players skip quest descriptions. Secondhand, no primary source. https://gamesbeat.com/secrets-of-mmo-storytelling-exclusive/
- Kaplan, GDC 2009 "Cruise Director of Azeroth". Quest text capped at 511 characters, and he said "I actually wish that the number was smaller." Also: "nobody wants to read it". https://www.theregister.com/2009/03/27/gdc09_jeffrey_kaplan_session
- Kaplan rules. Keep mystery out of the action, state clear objectives (kill X, collect Y). Show instant progress feedback on screen. Quest givers easy to find with floating `!`. https://www.gamedeveloper.com/game-platforms/gdc-learning-from-i-world-of-warcraft-i-s-quest-design-mistakes
- WoW quest volume. 2,600 quests at launch (target was 600), 5,300 by TBC, 7,650 by Wrath. 8.57 billion completions from 2007-06-30 to 2009-03-05, about 16.6 million per day. https://shacknews.com/article/57891/world-of-warcraft-quests-by
- GW2. Johanson described events as not needing a long quest description to learn what to do. https://pcinvasion.com/guild-wars-2-more-on-dynamic-events . Over 1,000 scripted events at PAX East 2011. https://www.gamespot.com/articles/guild-wars-2-changes-detailed/1100-6303935/ . "Hundreds of hearts while there are thousands of events." https://www.engadget.com/2012/03/13/flameseeker-chronicles-quest-education/
- ESO started with text quests like WoW. Full voice came after Michael Zenke had worked on it 7 to 8 months. Rich Lambert said dialogue "is very, very different than reading a book". https://mein-mmo.de/en/fully-voiced-successful-mmorpg-was-originally-supposed-to-have-dull-quest-texts-like-wow,1130859/
- ESO subtitles exist for most dialogue. Generic NPC lines are typed as greetings, guard lines, overheard dialogue. https://en.uesp.net/wiki/Online:Dialogue

### Inferences
- With 511 chars as WoW's ceiling, a 32px-tile game with a small text box should aim lower. About 200 to 300 chars per offer screen is my estimate, split into pages.
- Put the objective line in a separate, always-visible field (tracker or bold first line). Players who skip still know what to do.
- Voice is out of reach for a small team. ESO's lesson is that spoken-style writing is shorter and punchier. That applies to text too.

### Gaps
- No telemetry from any studio. No FFXIV numbers. The Waterloo thesis on WoW skip behaviour has no percentage in the abstract. https://libuwspaceprd02.uwaterloo.ca/handle/10012/17454

---

## Q5. FFXIV dialog settings (text speed, auto-advance)

### Takeaway
FFXIV exposes a slider for unvoiced auto-advance speed and, since Dawntrail, a "Voiced Dialogue Only" option. No source states the delay in seconds.

### Cited findings
- Official guide. Text Auto-advance Settings has an Auto-advance Speed slider for unvoiced dialogue. https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_cs_av2.html
- Dawntrail-era guides. Auto-advance can apply to voiced dialogue only. Jump button toggles auto-advance in cutscenes. https://www.mmogah.com/sv/news/ffxiv/ffxiv-dawntrail-12-hidden-qol-features-you-might-have-missed
- Older forum post. Space toggles auto-advance in cutscenes, Tab and Shift+Tab change speed. https://forum.square-enix.com/ffxiv/threads/318109-Cutscene-dialogue-automatically-progressing
- Normal NPC "Talk" windows do not auto-advance by default. Players built the TextAdvance plugin for that. https://github.com/Eternita-S/TextAdvance and https://forum.square-enix.com/ffxiv/threads/476400-Auto-Advance-talking-to-NPCs

### Inferences
- Copy two settings. An auto-advance toggle and a speed slider. Keep the toggle off by default for NPC talk and on for scripted scenes.

### Gaps
- No seconds-per-line or chars-per-second numbers. No primary Yoshida statement on why the MSQ is only partly voiced.

---

## Q6. Gossip windows, vendors, banks, flight masters. How do services open?

### Takeaway
WoW routes all NPC interaction through one "gossip" window, but the client skips it when the NPC has only one service option. Right-clicking a banker opens the bank directly. Players install addons to skip even more. GW2 merges quest giver and vendor into one NPC whose service unlocks after the task.

### Cited findings
- WoW client skips gossip text when there is only one non-gossip option, e.g. the Banker. `C_GossipInfo.ForceGossip()` stops that skip. Moved to that name in 9.0.1 (2020-10-13). https://warcraft.wiki.gg/wiki/API:C_GossipInfo.ForceGossip
- A newer API field `selectOptionWhenOnlyOption` appears in 12.0.0 gossip data (secondary source). https://skills.sh/jburlison/wowaddonapiagents/wow-api-misc-systems
- Addon demand. Aboutis skips gossip and picks the standard action, Shift shows the full window. https://www.wowace.com/projects/aboutis . Auto Gossip picks the single option but stops if the NPC has quests. https://www.curseforge.com/wow/addons/auto-gossip . AutoSelect existed by 2007. https://www.engadget.com/2007-01-08-addon-spotlight-autoselect.html
- GW2 heart NPCs. Vendor locked or partial until the heart is done, then sells themed items for karma. https://wiki.guildwars2.com/wiki/Renown_Heart_NPC
- GW2 scouts. Talking opens a map cinematic that marks hearts, towns, points of interest. Esc or M skips it. The scout icon stays until you talk to it or find all hearts. https://wiki.guildwars2.com/wiki/Scout
- Kaplan listed long travel time (flights at session start) as a design mistake. https://www.gamedeveloper.com/game-platforms/gdc-learning-from-i-world-of-warcraft-i-s-quest-design-mistakes

### Inferences
- Rule for Asterion. If an NPC has exactly one service and no quest, open the panel on interact. If it has a quest or more than one service, show a short menu. Add a modifier to force the menu. This is WoW's rule plus the Auto Gossip guard.
- For a Tibia-style keyword NPC, a clickable keyword list ("trade", "bank", "travel") gives the same one-click path while keeping the keyword flavour.
- GW2's scout is a cheap onboarding NPC. One talk reveals the zone's quest givers on the minimap.

### Gaps
- No source on flight master UI specifics (map picker vs list). No measured open latency.

---

## Q7. Chat bubbles and overhead text settings

### Takeaway
WoW's built-in bubble options are coarse. All, None, or exclude party. Players ask for NPC-only toggles. Raid and instance bubbles were missing until the Midnight pre-patch announcement.

### Cited findings
- Options are All, None, Exclude party chat. https://us.forums.blizzard.com/en/wow/t/chat-bubble-options/261312
- Raid and instance chat had no bubbles. Icy Veins reports party and raid bubbles arrive in the Midnight pre-patch. https://www.icy-veins.com/wow/news/party-and-raid-chat-bubbles-are-coming-in-the-midnight-pre-patch/
- nBubble supports Say, Yell, Party, Monster Say/Yell/Party bubbles separately, which shows demand for per-source control. https://www.curseforge.com/wow/addons/nbubble

### Inferences
- Give separate toggles for NPC bubbles and player bubbles from day one. Crowded Tibia-style towns will need it.

### Gaps
- No bubble range in yards, no bubble lifetime. The Say range page on warcraft.wiki.gg was not fetched. https://warcraft.wiki.gg/wiki/Say

---

## Q8. OSRS mobile, ESO camera, Lost Ark, New World, BDO

### Takeaway
Not covered well in this pass. Searches for OSRS mobile dialog changes and ESO's conversation camera returned nothing usable.

### Gaps
- OSRS mobile dialog adaptations (tap to continue, option sizing). Try 2009scape or RuneLite source, or OSRS wiki "Mobile" update pages.
- ESO conversation camera framing and dialog option layout. UESP Online:Dialogue is the next stop.
- Lost Ark, New World, BDO not searched.

---

## Ratings (draft, for the report)

Scale 1 to 5. Clarity · Charm · MMO fit · Authoring · Speed.

| Technique | Clarity | Charm | MMO fit | Authoring | Speed | Note |
|---|---|---|---|---|---|---|
| WoW `!`/`?` with grey and yellow states | 5 | 3 | 5 | 5 | 5 | Universal, needs a non-colour cue for colour-blind players |
| FFXIV shape-per-category icons (meteor, plus) | 4 | 4 | 5 | 4 | 5 | Category and state on separate channels |
| GW2 filling heart marker, NPC turns vendor | 4 | 5 | 5 | 3 | 5 | Shows progress in the marker itself |
| Objective tracker with progress counts | 5 | 2 | 5 | 4 | 5 | Kaplan's "instant feedback" |
| Map POI / quest helper (WoW 3.3) | 5 | 1 | 4 | 3 | 5 | Cuts reading and exploration, Classic left it out |
| Gossip auto-skip on single service | 4 | 2 | 5 | 5 | 5 | Fewer clicks for bank and shop |
| Text cap (511 chars in WoW) | 4 | 3 | 5 | 5 | 5 | Kaplan wanted it smaller |
| Full voice (ESO) | 4 | 5 | 3 | 1 | 2 | Not realistic for a small team |

All ratings are my inference.

---

## Sources
- https://lotro.allakhazam.com/wiki/Quests_(WoW)
- https://lotro.allakhazam.com/wiki/Questgivers_(WoW)
- https://vanilla-wow-archive.fandom.com/wiki/Quest
- https://warcraft.wiki.gg/wiki/Daily_Quest
- https://warcraft.wiki.gg/wiki/Quest_log
- https://warcraft.wiki.gg/wiki/API:C_GossipInfo.ForceGossip
- https://mein-mmo.de/en/after-16-years-wow-replaces-the-famous-quest-markers-and,492314
- https://mein-mmo.de/en/wow-more-than-one-in-three-dont-read-quest-texts-barely-know-the-story,1147872
- https://mein-mmo.de/en/wow-your-complaining-has-helped-blizzard-increases-the-quest-log-gives-you-more-space,921568
- https://mein-mmo.de/en/fully-voiced-successful-mmorpg-was-originally-supposed-to-have-dull-quest-texts-like-wow,1130859/
- https://us.forums.blizzard.com/en/wow/t/difficulty-seeing-the-new-quest-marks/1946251
- https://us.forums.blizzard.com/en/wow/t/can-we-please-have-separate-blue-weekly-icons-on-the-map-for-weekly-quests/1748027
- https://us.forums.blizzard.com/en/wow/t/retail-hardlocked-nameplate-distance-at-60-yards/973286
- https://us.forums.blizzard.com/en/wow/t/chat-bubble-options/261312
- https://eu.forums.blizzard.com/en/wow/t/wow-classic-anniversary-nameplate-distance/554190
- https://warcrafttavern.com/wow-classic/tools/blue-tracker/t/us/961393
- https://warcrafttavern.com/wow/news/interface-changes-in-the-war-within-new-spellbook-layout-and-quest-icons
- https://www.gamedeveloper.com/game-platforms/gdc-learning-from-i-world-of-warcraft-i-s-quest-design-mistakes
- https://www.theregister.com/2009/03/27/gdc09_jeffrey_kaplan_session
- https://shacknews.com/article/57891/world-of-warcraft-quests-by
- https://www.engadget.com/2009/11/14/patch-3-3-blizzard-previews-new-quest-tracking-ui/
- https://www.guiaswow.com/en/patches/new-interface-map-tracking-missions-3-3.html
- https://www.wowhead.com/wotlk/cn/news/리치-왕의-분노-클래식에-게임-내-퀘스트-도우미-기능이-추가되지-않을-예정-327512
- https://worldofwarcraft.blizzard.com/en-us/news/23841481
- https://worldofwarcraft.blizzard.com/news/23876525/
- https://www.icy-veins.com/wow/news/party-and-raid-chat-bubbles-are-coming-in-the-midnight-pre-patch/
- https://www.curseforge.com/wow/addons/nbubble
- https://www.curseforge.com/wow/addons/auto-gossip
- https://www.wowace.com/projects/aboutis
- https://www.engadget.com/2007-01-08-addon-spotlight-autoselect.html
- https://skills.sh/jburlison/wowaddonapiagents/wow-api-misc-systems
- https://gamesbeat.com/secrets-of-mmo-storytelling-exclusive/
- https://libuwspaceprd02.uwaterloo.ca/handle/10012/17454
- https://trialsoffantasy.com/new-player/
- https://forum.square-enix.com/ffxiv/threads/375015-Scenario-Quest-Guide-Icon
- https://kotaku.com/final-fantasy-14-ff14-quest-red-green-blue-1851593464
- https://na.finalfantasyxiv.com/uiguide/know/faq-display/interface_npc_icon.html
- https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_cs_av2.html
- https://www.mmogah.com/sv/news/ffxiv/ffxiv-dawntrail-12-hidden-qol-features-you-might-have-missed
- https://forum.square-enix.com/ffxiv/threads/318109-Cutscene-dialogue-automatically-progressing
- https://forum.square-enix.com/ffxiv/threads/476400-Auto-Advance-talking-to-NPCs
- https://github.com/Eternita-S/TextAdvance
- https://ffxiv.consolegameswiki.com/wiki/A_Realm_Reborn_Overhaul
- https://www.gamespot.com/articles/ffxiv-53-update-is-live-with-free-trial-revamped-q/1100-6476484/
- https://pcgamer.com/games/final-fantasy/final-fantasy-14-dawntrail-s-preliminary-patch-notes-are-here-showing-fixes-to-those-annoying-stealth-quests-and-the-ability-to-banish-npc-crowding-players-to-the-shadow-realm
- https://wiki.guildwars2.com/wiki/Renown_Heart_NPC
- https://wiki.guildwars2.com/wiki/Scout
- https://pcinvasion.com/guild-wars-2-more-on-dynamic-events
- https://www.gamespot.com/articles/guild-wars-2-changes-detailed/1100-6303935/
- https://www.engadget.com/2012/03/13/flameseeker-chronicles-quest-education/
- https://en.uesp.net/wiki/Online:Dialogue
