# 07. Spells in a crowd, screen feedback and accessibility

Researcher 07, VFX #10 Magic and spell VFX. Date 2026-11-11.

Reading guide. "Cited" means I fetched the page or the source file this session. "Search summary" means the claim came from a search-result digest and I did not open the page. "Memory" means I did not verify it at all this session. Inferences and Asterion rules are mine.

Effect tiers as a feel rule already exist in Combat juice F5 (https://kingsfoil-artifacts.netlify.app/feel-combat-juice-topdown-pixel). This file adds the shipped option names, the engine and server budgets, and the flash limits.

---

## 1. Effect settings shipped MMOs give players

### Takeaway
Every MMO that grew large raids ended up with the same control: a per-source dial (own, party or squad, everyone else) with three steps (all, reduced, none). The two newest implementations (WoW 11.2 in 2025, GW2 in June 2023) both shipped with bugs where the dial hid something that mattered, and both needed follow-up patches. The lesson for Asterion is to tag effects as "gameplay" or "cosmetic" in the spell data from day one, so the dial never has to guess.

### Cited findings

**Final Fantasy XIV**
- Official UI guide: Character Configuration, Control Settings, Character tab, "Battle Effects" section. Options listed: "Show All", "Show Limited", "Enemy PC", "Show None". They apply separately to your own character, party members and other players. The page does not say what "Show Limited" keeps. https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_bteffect.html
- Search summary: the text command uses the word "simple" for the limited level. https://ffxiv.consolegameswiki.com/wiki/Configuration_text_commands
- Search summary, player reports that disagree with each other: one says Limited hides attacks but keeps a glow on casters, one says pet effects vanish when Others is Limited, and Square Enix's community team said Limit Break effects were wrongly hidden under Limited and would be fixed in patch 2.2. https://forum.square-enix.com/ffxiv/threads/91130-TIP-Battle-effects-can-already-be-toned-down-in-Character-Options.
- Search summary: a 2024 forum thread still complains about Dawntrail readability. https://forum.square-enix.com/ffxiv/threads/508358-Dawntrail-Battle-Effects-Readability-and-Visual-Clutter
- Memory, not verified: the common community description is that Limited keeps effects that carry gameplay meaning (ground zones such as heal bubbles, buffs applied to you) and drops pure attack animations.

**World of Warcraft**
- Search summary: the Shadowlands-era "Spell Density" setting had six levels. Essential (only essential spells, own spells always shown), Some, Half, Most (non-essential spells cut by about 75%, 50%, 25%), Dynamic (cut based on frame rate, the default), Everything. https://www.techradar.com/news/world-of-warcraft-shadowlands-should-run-more-smoothly-on-your-pc-no-matter-how-many-spells-are-flying
- Cited (Blizzard Watch, 2025-07-28): patch 11.2.0 cut six levels to three: Everything, Reduced, Essential. Reduced replaces the percentage levels and Dynamic, is described as "ideal for dungeon and raid content", and removes visuals that carry no combat information. Under Reduced, your own spells, your pets, NPC spells and enemy players in PvP are untouched. What gets reduced is spell visuals from friendly party and raid members. Blizzard said it expects to "update it continually going forward". The author estimates a raid adds "10-20 other sets" of spell effects. https://blizzardwatch.com/2025/07/28/blizzard-adding-new-ways-reduce-spell-density-better-performance-visibility-patch-11-2
- Search summary: PC Gamer framed this as WoW copying FFXIV's feature. https://www.pcgamer.com/games/world-of-warcraft/wow-snaps-up-one-of-ff14s-best-features-by-letting-players-choose-how-many-particle-effects-they-want-swamping-their-screens-during-raids
- Search summary, player reports after launch: some saw no difference between Essential and Everything, others still could not read melee range on Essential. https://us.forums.blizzard.com/en/wow/t/is-the-new-spell-density-working/2143578
- Not verified this session: "Projected Textures" and "Particle Density" option wording, and the 11.2 release date.

**Guild Wars 2**
- Search summary of the official wiki patch notes: the 2023-06-06 update added a general option "Hide Ally Visual Effects" with three levels: all players, all players outside party, all players outside squad. Enemy effects are not hidden. Group healing and boon area skills stay visible. https://wiki.guildwars2.com/wiki/Game_updates/2023-06-06 (the page returned HTTP 500 when I tried to open it directly).
- Search summary: the 2023-06-27 update fixed cases where the setting hid boss telegraphs in the Aetherblade Hideout strike and the Samarog raid. https://wiki.guildwars2.com/wiki/Game_updates/2023-06-27
- Search summary: players reported that ally "greens" (shared mechanic circles) were not covered as expected. https://en-forum.guildwars2.com/topic/131527-hide-ally-visual-effects-didnt-show-green-circles-of-others/page/2
- Search summary: "Effect LOD" is proximity based, like the character quality settings. https://en-forum.guildwars2.com/topic/93326-performance-character-model-limit-none/ . With Effect LOD on, auras on allies use an older, subtler effect. https://wiki.guildwars2.com/wiki/Light_aura
- Search summary: "Character Model Limit" and "Character Model Quality" replaced the older hard culling. Players above the quality budget draw as generic models. At the lowest limit, far players become nameplates only. https://wiki.guildwars2.com/wiki/Generic_character_models and https://wiki.guildwars2.com/wiki/Culling
- Search summary: a raid guide warns that a model limit below medium culls some enemy skill effects (walls on Soulless Horror). That is a shipped bug class: a performance dial that hides a mechanic. https://hardstuck.gg/gw2/guides/general/performance-improving-settings
- Search summary: a third-party addon "VFX Denoiser" exists, which shows the built-in options did not satisfy raiders. https://raidcore.gg/gw2/addons/vfx-denoiser
- Recommended raid settings page (see it in action): https://snowcrows.com/guides/new-player-guides/instanced-content-suggested-settings

**Black Desert**
- Search summary, player post: Settings, Display Options, Display Quality, "Remove others Effects". https://steamcommunity.com/app/582660/discussions/0/3195867945633597096

**Path of Exile 1 and 2, Diablo IV**
- Search summary: PoE2 has no such option. The official forum holds repeated requests for a transparency slider or a toggle for party members' particles. https://www.pathofexile.com/forum/view-thread/3660138
- Search summary: Diablo IV has no option either. Players call other players' effects "unplayable". Since Season 5 combat text can be hidden but effects stay. https://dexerto.com/diablo/other-player-effects-make-diablo-4-unplayable-according-to-fans-2860313 and https://www.icy-veins.com/d4/news/diablo-4-effect-toggles-players-renew-calls-for-this-feature/
- The most requested form in both communities is an opacity slider, not an on/off switch.

**Ragnarok Online**
- Search summary: `/effect` toggles non-essential visual effects and leaves basic ones. `/aura` and `/aura2` reduce or disable the level 99 and 175 aura. https://irowiki.org/wiki/Battle_mode
- `/mineffect`: no source found this session.

### Inferences
- Three levels per source is the stable shape. WoW started with six and cut to three because players could not tell the middle levels apart.
- "Reduced" works only when each effect carries a flag saying whether it conveys combat information. Games that bolted the dial on later (WoW, GW2) had to hand-tag thousands of effects and missed some.
- A top-down pixel game has an easier job than a 3D MMO. One tile-sized flipbook per effect means "reduced" can be a fixed transform (fewer frames, lower opacity, no glow) applied by tier, with no per-spell art.

### Gaps
- Not found or not searched: Lost Ark's exact option name (only a hint that it has one), Albion Online, Throne and Liberty, New World, Tibia client options for effects, Old School RuneScape.
- OSRS inference only: one small effect per spell, 0.6 s ticks and low effect counts mean it never needed a dial. No source.
- The exact content of FFXIV "Show Limited" has no official description that I could find.

---

## 2. Engine-side budgets

### Takeaway
The documented pattern is Unreal's Niagara Effect Types: every effect belongs to a class, each class has an instance cap, and a significance function decides who loses when the cap is hit. Open-source Tibia servers do none of this. TFS sends every effect to every spectator with no merge and no throttle, so the client has to carry the budget.

### Cited findings
- Unreal Niagara Effect Types, official doc: one Effect Type holds scalability settings for a group of systems. "Budget Scaling" options are Max Global Budget Usage (normal range 0 to 1, example permissive value 1.5), Max Distance Scale by Global Budget Use, Max Instance Count Scale by Global Budget Use, and Max System Instance Count Scale by Global Budget Use. The last three are linear curves. As budget use rises, cull distance shrinks and instance caps drop. https://dev.epicgames.com/documentation/unreal-engine/performance-budgeting-using-effect-types-in-niagara-for-unreal-engine
- Search summary of Unreal API pages: a significance handler ranks instances and the least significant are culled first. Built-in handlers are Distance and Age. Age favours newer systems, which suits impacts. Without a handler, the cap applies only at spawn time, so new effects past the cap do not start. Budgets are set with `fx.Budget` console variables. https://docs.unrealengine.com/4.27/en-US/API/Plugins/Niagara/UNiagaraEffectType/index.html and https://forums.unrealengine.com/t/niagara-scalability-effect-types/264959
- TFS source, read this session (`src/game.cpp`, `Game::addMagicEffect`): the server collects spectators around the position and calls `sendMagicEffect` for each player. There is no rate limit, no merge of identical effects on one tile and no priority. https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- TFS `ProtocolGame::sendMagicEffect` drops the packet only if the client cannot see the position (`canSee`). https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
- GW2's answer to "too many players" was generic models and nameplates rather than hiding players (see section 1).

### Inferences
- Significance for Asterion, highest first: hostile telegraph aimed at me, effects on my own character, my own casts, party casts, effects on my target, others near me, others far.
- "Age" significance is right for one-shot impacts: when the cap is hit, drop the oldest half-finished flipbook, never the newest.
- Merge rule: two identical effect ids on the same tile within the same server tick draw once. In a 30-player fight on one boss this removes most of the load, because most impacts land on the same one to four tiles.
- Canary: not checked this session. I assume it matches TFS but did not read its code.

### Gaps
- No Fortnite-specific source for the significance manager was found.
- No measured numbers for effect counts in any shipped MMO raid.

---

## 3. What must never be reduced

### Takeaway
Shipped rules agree: enemy effects, group heals and boon zones, and boss mechanics stay at full strength whatever the dial says. Both WoW and GW2 state this in their notes, and both still shipped bugs that broke it.

### Cited findings
- WoW 11.2 Reduced leaves own spells, own pets, NPC spells and enemy players in PvP untouched. https://blizzardwatch.com/2025/07/28/blizzard-adding-new-ways-reduce-spell-density-better-performance-visibility-patch-11-2
- GW2 Hide Ally Visual Effects: enemy effects are never hidden, group heal and boon areas stay (search summary). Three weeks later a patch fixed hidden telegraphs in two encounters. https://wiki.guildwars2.com/wiki/Game_updates/2023-06-06 and https://wiki.guildwars2.com/wiki/Game_updates/2023-06-27
- GW2 has a separate "Disable Area-of-Effect Rings" option, and a player notes it does not always hide enemy rings (search summary). https://en-forum.guildwars2.com/topic/141290-photosensitive-friendly-settings
- FFXIV Limit Break effects were wrongly hidden by Show Limited and Square Enix treated that as a bug (search summary). https://forum.square-enix.com/ffxiv/threads/91130-TIP-Battle-effects-can-already-be-toned-down-in-Character-Options.
- WoW players still ask for clearer "good against bad" ground effects after 11.2 (search summary). https://us.forums.blizzard.com/en/wow/t/spell-density-tracking-good-vs-bad-spells-on-ground/2171880

### Inferences (draw order for Asterion, bottom to top)
1. Ground tiles and residue (scorch, frost).
2. Friendly ground fields, drawn at tier opacity.
3. Hostile telegraphs and hostile fields. Always 100% opacity, always above every friendly ground effect, with an outline one palette step brighter than any spell colour.
4. Characters.
5. Impacts and missiles from others, then party, then own.
6. Effects on my own character (heals received, debuffs, shields).
7. UI.

Hostile telegraphs sit on the ground layer but above all friendly ground art, so a party fire field can never cover a boss circle. FFXIV and GW2 handle this the same way as far as I know, but I found no developer source stating the draw order, so treat it as my rule.

### Gaps
- No official source on FFXIV marker draw order, LoL ability clarity rules or WoW's telegraph layering was fetched.

---

## 4. Server and bandwidth

### Takeaway
A Tibia-style effect event is 9 to 11 bytes. Bandwidth is not the problem at 30 players. The cost is the number of sprites the client must animate, and the server-side fan-out (events times spectators).

### Cited findings (source read this session)
- TFS `sendMagicEffect`: opcode `0x83`, position (u16 x, u16 y, u8 z, 5 bytes), `MAGIC_EFFECTS_CREATE_EFFECT`, effect id, `MAGIC_EFFECTS_END_LOOP`. Total 9 bytes. https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
- TFS `sendDistanceShoot`: opcode, from position, type byte, missile id, int8 delta x, int8 delta y, end byte. Total 11 bytes. The target is sent as a signed 8-bit offset, so a missile cannot span more than 127 tiles. Same file.
- The `0x83` message is a loop. `const.h` defines sub-commands for delta (u8 offset), delay (u16 ms), create effect, create distance effect and end. One packet can carry several effects with delays between them. The current server code sends one effect per packet and does not use this. https://github.com/otland/forgottenserver/blob/master/src/const.h
- TFS area of interest: `maxViewportX = 11`, `maxViewportY = 11` for spectator search, `maxClientViewportX = 8`, `maxClientViewportY = 6` for what a client sees. https://github.com/otland/forgottenserver/blob/master/src/map.h
- TFS missiles gather spectators at both ends (`fromPos` and `toPos`) and merge the lists, so a player who sees only the landing tile still gets the missile. https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- rAthena `clif_specialeffect`: packet `0x1f3`, u16 opcode, u32 entity id, u32 effect id. Total 10 bytes, sent to an area target. The effect is attached to an entity id, not to a tile. https://github.com/rathena/rathena/blob/master/src/map/clif.cpp
- rAthena area size: `AREA_SIZE` maps to `battle_config.area_size`, default 14 cells. https://github.com/rathena/rathena/blob/master/src/map/map.hpp (value read from the `conf/battle` folder).

### Inferences (estimates, not measured)
- Assume 30 players in one viewport, one cast per second each, a targeted spell being one missile and one impact. That is 30 x (11 + 9) = 600 bytes per second per viewer, and 18 kB per second total server output for 30 viewers, before TCP and WebSocket framing.
- Area spells dominate. A 37-tile area sent tile by tile is 37 x 9 = 333 bytes per cast. Ten such casts per second is 3.3 kB per second per viewer and 370 effect sprites per second on the client.
- Better wire format for Asterion: send one "area effect" event (effect id, origin, mask id, direction) of about 9 bytes and let the client expand the mask. That cuts the 333 bytes to 9 and lets the client apply tier rules to the whole spell at once, which per-tile events cannot do because they carry no caster id.
- Add the caster id (or a 2-bit relation computed per viewer: own, party, other, hostile) to every effect event. Tibia's format has no source, so a Tibia client cannot tier effects at all. This is the key protocol change this angle asks for.
- Server throttle: merge identical (effect id, tile) pairs within one tick before fan-out.

### Gaps
- TrinityCore and AzerothCore `SMSG_SPELL_GO` and `SMSG_PLAY_SPELL_VISUAL` sizes were not checked.
- No measured packet capture from a real 30-player fight.

---

## 5. Screen feedback

### Takeaway
I found little hard data on strength and duration in shipped games. What the sources do show is that players want each screen effect on its own switch, and that a blanket "screen effects" toggle causes complaints because it removes the low-health warning along with the noise.

### Cited findings (all search summaries)
- Grim Dawn: a general "Screen Effects" checkbox also removed the low-health border. Players objected, and the developer added a separate option for border effects. https://forums.crateentertainment.com/t/grim-dawn-sunder-red-glow-zantai/135100
- Space Marine 2: players call the low-health vignette a major distraction and ask for an option. A mod splits the pulsing low-health effect from hit flashes. https://community.focus-entmt.com/focus-entertainment/space-marine-2/ideas/8114-can-we-get-an-option-to-remove-the-vignette
- Last Epoch: forum threads ask to turn off white on-hit flashes because constant flashing tires the eyes. https://forum.lastepoch.com/t/the-constant-white-flash-is-quite-draining-for-eyes-stamina/45843
- God of War Ragnarök: "Reduce flashing" option for full-screen flashes, and two 10-point sliders for camera sway and camera shake where 0 is off. https://www.playstation.com/en-ie/games/god-of-war-ragnarok/accessibility/
- Xbox guideline 117 covers motion settings and advises against repeated side-to-side or up-and-down screen movement. https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117

### Inferences (Asterion rules)
- Screen feedback is for things that happen to me. Other players' spells never trigger shake, full-screen flash, tint or vignette. With 30 casters this one rule removes the whole problem.
- Damage edge flash: red vignette on the outer 10 to 15% of the screen, peak 30 to 40% opacity, 80 ms rise, 250 to 400 ms fade. Use a red with R/(R+G+B) below 0.8 so it is not a "saturated red" under WCAG (see section 6).
- Low-health pulse: 1 Hz or slower, sine shaped, never a hard blink. 1 Hz is a third of the 3 Hz limit.
- Full-screen white flash: own ultimate only, peak 50% opacity or less, at most one per second, and replaced by a 10% tint when "reduce flashing" is on.
- Heal tint: a green edge glow at half the damage strength, one pulse.
- Skip chromatic aberration and desaturation at 320x180. Both cost a full-screen shader pass in WebGL2 and smear pixel art. A palette swap of the ground layer gives the same "dying" read for free.
- Each of these gets its own toggle or slider: screen shake (0 to 100%), damage flash, low-health pulse, spell flash.

### Gaps
- No measured vignette opacities, pulse rates or flash durations from named games. No hit-direction-indicator source. Screen shake numbers are in Combat juice already.

---

## 6. Photosensitivity and motion limits

### Takeaway
The number is three flashes in any one second, and the definition of a flash is strict: a pair of opposing luminance changes of 10% or more. A white hit frame followed by a return to normal is one flash. Thirty impacts landing 100 ms apart on neighbouring tiles is ten flashes per second over a large area, and that fails every guideline. A crowd of casters is exactly the case these rules exist for.

### Cited findings

**WCAG 2.3.1 (fetched)** https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- Pass if nothing flashes more than three times in any one-second period, or the flash is below the general and red flash thresholds.
- General flash: a pair of opposing changes in relative luminance of 10% or more of maximum (1.0), where the darker state is below 0.80.
- Red flash: any pair of opposing transitions involving a saturated red, where saturated red means R/(R+G+B) >= 0.8, and the chromaticity change exceeds 0.2 in CIE 1976 UCS.
- Small safe area: combined area of concurrent flashes no more than 0.006 steradians within any 10 degree field, which is 25% of that field.
- Screen estimate: a 341 x 256 px rectangle on a 1024 x 768 display approximates the 10 degree field (87,296 px), assuming a 15 to 17 inch screen at 22 to 26 inches.
- Technique G176 (search summary): a single flashing area under 21,824 contiguous px passes. https://www.w3.org/WAI/WCAG21/Techniques/general/G176
- Tools listed: Trace Center PEAT and Harding FPA.

**ITU-R BT.1702 and Ofcom** (WCAG page fetched, annex text from search summary)
- A harmful flash is a pair of opposing luminance changes of 20 cd/m2 or more when the darker image is below 160 cd/m2. Above that, the threshold is a Michelson contrast of 1/17.
- Failure needs more than three flashes (six luminance changes) in one second and a combined area over one quarter of the screen.
- A transition to or from saturated red counts whatever its luminance.
- Current version is BT.1702-2 (2019). https://www.itu.int/dms_pubrec/itu-r/rec/bt/R-REC-BT.1702-2-201910-S!!PDF-E.pdf and Ofcom guidance https://www.ofcom.org.uk/__data/assets/pdf_file/0021/16248/gn_flash.pdf
- The TV rule uses 25% of the whole screen. The web rule uses 25% of a 10 degree field. A desktop player sits closer, so the web rule is the stricter one for a browser game.

**Xbox Accessibility Guideline 118 (fetched)** https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/118
- About 1 in 4,000 people can have a seizure from flashing images. Removing the content is preferred over warning screens.
- Luminance flash: a 10% change with the darker value below 0.8. Fails at about more than three per second over about 20% or more of the screen. Lower intensity flashing can also fail if it continues for a long time.
- Red flash: either state is saturated red (same 0.8 ratio), and the change in (R-G-B) x 320 is greater than 20.
- Spatial pattern: high-contrast alternating bands with more than 10% contrast difference over about 20% of the screen.
- Fixes listed: lower the contrast, lower the frequency, shrink the area, desaturate red.
- Tool named: Harding FPA.

**Game Accessibility Guidelines (fetched)** https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/
- Avoid flashing sequences longer than 5 seconds.
- Avoid more than 3 flashes per second over 25% or more of the screen.
- Avoid moving repeated patterns over 25% of the screen, static ones over 40%.
- A repeated pattern is more than 8 static or 5 moving high-contrast stripes, straight or radial.
- A flash includes any change to or from red.
- Never name a setting "epilepsy safe". Use a descriptive name such as "screen flash effects".
- Best practice examples named: Even the Ocean options, TowerFall's trigger toggle.

**EA IRIS (fetched)** https://github.com/electronicarts/IRIS
- Licence BSD-3-Clause.
- Detects luminance flashes, red saturation flashes and spatial patterns in video.
- Fail: more than 3 flashes in any one second. Extended flash fail: 2 to 3 flashes per second across 5 consecutive seconds. Pattern fail: a harmful pattern for 0.5 s or more. Warning at more than 2 flashes per second.
- A luminance transition registers when accumulated difference reaches 0.1, a red transition at 20.
- C++ with CMake and vcpkg. It analyses recorded video, so it can check a capture of a 30-caster test scene.

**Dennō Senshi Porygon (fetched)** https://en.wikipedia.org/wiki/Denn%C5%8D_Senshi_Porygon
- 1997-12-16. Red and blue alternated every frame at 24 fps, so each colour flickered at 12 Hz. The worst sequence ran 4 seconds and filled the screen.
- 685 viewers went to hospital by ambulance, 208 were admitted.
- Rules adopted afterwards in Japan: red flashing no more than 3 times per second, non-red no more than 5 per second, no flashing sequence longer than 2 seconds in total, and no large areas of stripes, whirls or concentric circles.
- The page states the Harding test allows no more than one flash every 10 frames at 29.97 fps.

**Cyberpunk 2077** (search summary) https://www.cyberpunk.net/en/news/37043/hotfix-1-04
- Hotfix 1.04, 2020-12-11, changed the braindance flashing after a reviewer had a seizure. The notes say the effect was "smoothed out" and flashes reduced "in frequency and magnitude". A warning screen was added first, the content fix came days later. https://www.pcgamer.com/cyberpunk-2077-hotfix-attempts-to-address-seizure-trigger-fixes-several-quest-bugs/

**Options in shipped games**
- God of War Ragnarök: "Reduce flashing", plus 0 to 10 sliders for camera shake and sway (section 5).
- Hades: screen shake can be disabled (search summary of a third-party database). https://www.familygamingdatabase.com/accessibility/Hades
- GW2 players have asked for a photosensitive-friendly preset because flashes are spread over several unrelated options (search summary). https://en-forum.guildwars2.com/topic/141290-photosensitive-friendly-settings

### Inferences (my arithmetic, check before publishing)
- WCAG safe area as a share of a 1024 x 768 screen: 21,824 / 786,432 = 2.8%.
- Mapped onto the 320 x 180 sandbox shown full screen: 57,600 x 2.8% = about 1,600 low-res px, a 40 x 40 px block, or about 1.5 tiles of 32 x 32.
- So under the strict web reading, any flash wider than about 1.5 tiles must stay at or under 3 per second. Under the looser TV reading (25% of the screen) the limit is 14,400 px, about 14 tiles of the 56 visible.
- One Tibia-style impact with a white first frame on one tile (1,024 px) is under the safe area by itself. Two adjacent impacts flashing together are over it. This is why the limiter must count concurrent area, not single effects.
- The dangerous patterns in a spell game are: strobing flipbooks that alternate bright and dark frames, chain lightning that redraws every frame, a "UE" area spell that flashes 37 tiles at once and is cast by five players in a row, hit-flash on many monsters in one frame, and red and blue alternation (fire against ice in the same spot).
- Radial stripe patterns count too. A magic circle with more than 5 high-contrast rotating spokes covering a quarter of the screen fits the Game Accessibility Guidelines definition of a moving repeated pattern.

### Gaps
- I did not open the Ofcom PDF or the ITU PDF directly. The Harding test's own documentation was not read.
- No source for Dead Cells or Vampire Survivors flash options.

---

## 7. Rules for Asterion

All of this section is my proposal. Numbers are starting points to test in the playable demos.

### Tier table

| Tier | Who | Flipbook frames | Particles | Opacity | Glow or additive | White-hot first frame | Light on light map | Screen feedback |
|---|---|---|---|---|---|---|---|---|
| Own | my casts and anything applied to me | 100% | 100% | 100% | on | yes | yes | yes |
| Party | party members' casts | 100% | 50% | 70% | on | yes | yes | no |
| Others | friendly or neutral players outside party | 50% (every other frame, same duration) | 0 to 25% | 40% | off | no (start on frame 2) | no | no |
| Hostile | monsters, bosses, enemy players | 100% | 100% | 100% | on, plus outline | yes | yes | only if it hits me |

Notes on the table.
- Others at 40% opacity follows the request pattern from PoE and Diablo players, who ask for a slider, not a switch (section 1). Ship a slider from 0 to 100% for Party and Others with these values as defaults.
- "Others, no first frame" is the cheapest flash control available. Dropping the white-hot frame for the Others tier removes most flashes in a crowd without any limiter running.
- Glow off for Others also saves the low-res glow buffer writes from VFX #5.
- Fields that affect me (a party heal zone I stand in, a hostile fire field) take the Own or Hostile row, whoever cast them. The rule is "who does it affect", then "who cast it".
- Preset names for the options menu: "All", "Reduced" (the table above), "Minimal" (Party as Others, Others hidden except missiles as a 1 px streak). Hostile is never touched by any preset.

### Global caps (estimates to verify)

- Active one-shot effect sprites: 96 on screen, 48 on the low preset. The sandbox shows 56 tiles, so 96 is under two per tile.
- Particles: 256 total across all spells, 128 on low.
- Per tile: one impact flipbook per tier at a time. A second identical effect id on the same tile within 100 ms restarts nothing and is dropped.
- Missiles: 32 at once. Past that, Others missiles draw as a 2-frame streak.
- Reserve: 25% of every cap is held for Own and Hostile, so a crowd can never starve a telegraph.
- Eviction order when full: Others oldest first, then Party oldest first. Own and Hostile are never evicted.
- Budget scaling in the Niagara style: if the frame time averages above 20 ms for 30 frames, multiply the Others caps by 0.5. Restore after 120 good frames.

### Flash limiter design

Goal: at most 3 general flashes in any rolling second over any area larger than the safe area, whatever the players do.

1. Every effect definition declares `flash_px`, the area of its bright frame in low-res pixels, and `flash_red` if its bright frame is saturated red. A 1-tile impact is 1,024. Effects with no bright frame declare 0.
2. The client keeps a ring buffer of flash events from the last 1,000 ms, each with time and area.
3. Events closer than 50 ms merge into one flash and their areas add up. A volley landing on one tick is one flash.
4. Before starting an effect, count the merged flashes in the last 1,000 ms whose area was over the threshold (1,600 px on the strict setting, 14,400 px on the default).
5. If the count is already 3, start the effect without its bright frame. It begins on frame 2 at reduced value, so the luminance step stays under 10%. The effect still plays, only the flash is removed.
6. Order of who loses the bright frame: Others, Party, Own. Hostile telegraphs do not flash at all by design. They pulse at 2 Hz or slower with a soft ramp.
7. Full-screen flashes use a separate, stricter bucket: one per second, 50% peak opacity.
8. Red rule: no effect alternates saturated red with a dark or blue frame. Fire ramps go white, yellow, orange, and reach red only in the fading frames, so red arrives through a fade and not a flash.
9. Flipbook rule: a bright frame may appear once per effect. No authored strobing. Loops (auras, channels, chain lightning) must change luminance by less than 10% between frames or redraw at 3 Hz or slower.
10. "Reduce flashing" option: threshold drops to 0 (every bright frame counts), the limit drops from 3 to 1 per second, full-screen flashes become a 10% tint, hit-flash on sprites becomes a 1 px outline.
11. Separate options: "Screen shake" slider 0 to 100%, "Reduce motion" (no camera kick, no screen-space distortion, auras stop orbiting and show a static frame).
12. Test: record the 30-caster demo scene at each preset and run the video through IRIS (BSD-3) as a regression check.

Cost: one ring buffer of about 32 entries and a comparison per effect spawn. No shader, no readback.

### Protocol asks from this angle
- Every effect event carries a caster id or a per-viewer relation (2 bits).
- Area spells go out as one event with a mask id, not one event per tile.
- Spell data tags each effect as gameplay or cosmetic, and each phase with `flash_px`.

---

## Gaps, all in one place
- Lost Ark, Albion, Throne and Liberty, New World, Tibia client options, OSRS, `/mineffect`: no source found.
- FFXIV "Show Limited" content, WoW "Projected Textures" wording, GW2 "Effect LOD" in-game text: not officially confirmed.
- Fortnite significance manager, FFXIV and LoL draw-order rules: no developer source.
- TrinityCore and AzerothCore spell packets, Canary throttling: not checked.
- Screen feedback strengths and durations from named games: none found.
- Several patch-note pages were read only through search digests because the pages returned 403, 404 or 500.

## Sources

Fetched or read in full this session
- https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/118
- https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/
- https://github.com/electronicarts/IRIS
- https://en.wikipedia.org/wiki/Denn%C5%8D_Senshi_Porygon
- https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_bteffect.html
- https://blizzardwatch.com/2025/07/28/blizzard-adding-new-ways-reduce-spell-density-better-performance-visibility-patch-11-2
- https://dev.epicgames.com/documentation/unreal-engine/performance-budgeting-using-effect-types-in-niagara-for-unreal-engine
- https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
- https://github.com/otland/forgottenserver/blob/master/src/map.h
- https://github.com/otland/forgottenserver/blob/master/src/const.h
- https://github.com/otland/forgottenserver/blob/master/src/networkmessage.cpp
- https://github.com/rathena/rathena/blob/master/src/map/clif.cpp
- https://github.com/rathena/rathena/blob/master/src/map/map.hpp

Seen only through search digests
- https://ffxiv.consolegameswiki.com/wiki/Configuration_text_commands
- https://forum.square-enix.com/ffxiv/threads/91130-TIP-Battle-effects-can-already-be-toned-down-in-Character-Options.
- https://forum.square-enix.com/ffxiv/threads/508358-Dawntrail-Battle-Effects-Readability-and-Visual-Clutter
- https://www.techradar.com/news/world-of-warcraft-shadowlands-should-run-more-smoothly-on-your-pc-no-matter-how-many-spells-are-flying
- https://www.pcgamer.com/games/world-of-warcraft/wow-snaps-up-one-of-ff14s-best-features-by-letting-players-choose-how-many-particle-effects-they-want-swamping-their-screens-during-raids
- https://us.forums.blizzard.com/en/wow/t/is-the-new-spell-density-working/2143578
- https://us.forums.blizzard.com/en/wow/t/spell-density-tracking-good-vs-bad-spells-on-ground/2171880
- https://wiki.guildwars2.com/wiki/Game_updates/2023-06-06
- https://wiki.guildwars2.com/wiki/Game_updates/2023-06-27
- https://wiki.guildwars2.com/wiki/Generic_character_models
- https://wiki.guildwars2.com/wiki/Culling
- https://wiki.guildwars2.com/wiki/Light_aura
- https://en-forum.guildwars2.com/topic/131527-hide-ally-visual-effects-didnt-show-green-circles-of-others/page/2
- https://en-forum.guildwars2.com/topic/93326-performance-character-model-limit-none/
- https://en-forum.guildwars2.com/topic/141290-photosensitive-friendly-settings
- https://hardstuck.gg/gw2/guides/general/performance-improving-settings
- https://snowcrows.com/guides/new-player-guides/instanced-content-suggested-settings
- https://raidcore.gg/gw2/addons/vfx-denoiser
- https://steamcommunity.com/app/582660/discussions/0/3195867945633597096
- https://www.pathofexile.com/forum/view-thread/3660138
- https://dexerto.com/diablo/other-player-effects-make-diablo-4-unplayable-according-to-fans-2860313
- https://www.icy-veins.com/d4/news/diablo-4-effect-toggles-players-renew-calls-for-this-feature/
- https://irowiki.org/wiki/Battle_mode
- https://docs.unrealengine.com/4.27/en-US/API/Plugins/Niagara/UNiagaraEffectType/index.html
- https://forums.unrealengine.com/t/niagara-scalability-effect-types/264959
- https://www.w3.org/WAI/WCAG21/Techniques/general/G176
- https://www.itu.int/dms_pubrec/itu-r/rec/bt/R-REC-BT.1702-2-201910-S!!PDF-E.pdf
- https://www.ofcom.org.uk/__data/assets/pdf_file/0021/16248/gn_flash.pdf
- https://www.cyberpunk.net/en/news/37043/hotfix-1-04
- https://www.pcgamer.com/cyberpunk-2077-hotfix-attempts-to-address-seizure-trigger-fixes-several-quest-bugs/
- https://www.playstation.com/en-ie/games/god-of-war-ragnarok/accessibility/
- https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117
- https://www.familygamingdatabase.com/accessibility/Hades
- https://forums.crateentertainment.com/t/grim-dawn-sunder-red-glow-zantai/135100
- https://community.focus-entmt.com/focus-entertainment/space-marine-2/ideas/8114-can-we-get-an-option-to-remove-the-vignette
- https://forum.lastepoch.com/t/the-constant-white-flash-is-quite-draining-for-eyes-stamina/45843
