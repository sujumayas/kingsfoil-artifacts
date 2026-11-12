# 06 Art direction and readability for spell VFX

Researcher 06, study VFX #10 "Magic and spell VFX". Date 2026-11-11.

How to read these notes. "Cited" means I fetched the page in this session and the claim is on it. "Search snippet" means the claim came from a search result summary and I did not open the page. "Inference" is my own reasoning or general craft knowledge with no fetched source. Every number in the checklist (section 7) is tagged the same way.

Access failures that shape the gaps:
- The Riot VFX style guide PDF now redirects to the LoL home page (301). I could not read it. Everything about it here comes from VFX Apprentice's summary and from Riot's own later articles.
- web.archive.org is blocked from this environment.
- The two Notion pages with notes on GDC 2013 "The VFX of Diablo" and GDC 2017 "Visual Effects Bootcamp" returned empty bodies.
- The Steam Support copy of the Dota 2 character art guide returned only navigation.
- riotgames tech blog node/110 timed out (504). The riotgames.com mirror of the same article worked.

---

## 1. Studio style guides and talks

### Takeaway
Riot is the only studio with a readable, public rule set, and its rules transfer well to pixel art. Split each spell into a primary element (the part that carries the hitbox) and secondary elements (theme only). Give the primary element the highest contrast, the highest saturation and the sharpest shapes. Reach peak brightness within the first quarter of the effect's life, then erode. Keep effects shorter than feels natural. Match the visual weight to gameplay weight. Match the drawn shape to the hitbox.

### Cited findings

Riot, League of Legends VFX style guide (2017, by art director Jin Ho Yang, per VFX Apprentice's summary).
Source: https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
- Primary elements carry the gameplay signal and the hitbox. They get high value, clear silhouette, high opacity and a sharp focal point.
- Secondary elements get lower value, lower opacity, simpler and blurrier shapes and subtle motion.
- Avoid 0% (pure black) and 100% (pure white) value. Paint the body in mid values. Keep the top value spike for the instant of the primary flash (impact point or explosion core).
- Saturation tiers across the whole game. Environment is low and muted. UI is local and controlled. VFX gets the widest and highest saturation ceiling.
- A search snippet of the same guide adds that 100% and 0% saturation should also be avoided so effects do not blend into environment or UI. Not verified against the PDF.
- With complementary hues one colour dominates. The accent is desaturated and limited to small highlights.
- Shapes are hand-drawn. No photographic textures and no noisy procedural detail. Do not stack many alpha shapes.
- Direction of travel is shown with a blurred tail, or by putting the brightest and sharpest contrast at the leading tip.
- Timing has three stages. Anticipation is rapid and brief. The impact reaches peak value and saturation within the first quarter of the lifespan. Dissipation is a smooth erosion.
- "If your FX feel long, they're waaaaay too long." Lingering particles hide enemy silhouettes and cost overdraw.
- The summary gives only two numbers: the 0%/100% value limits and the "first quarter" rule. It gives no durations in ms.

Riot, "Anatomy of a League of Legends missile, part 1" by Oli McDonald, lead VFX artist for skins (2020-01-06).
Source: https://realtimevfx.com/t/anatomy-of-a-league-of-legends-missile-part-1-creating-areas-of-focus/11614
- Priority order: communicate gameplay with little clutter, then theme, then delight.
- For a damaging missile the head is the primary element. The trail is secondary.
- The area of focus has the highest and the lowest value (so the highest contrast), the highest saturation and the most detail.
- If every part is emphasised, nothing reads. No numbers given.

Riot, "Clarity in League".
Source: https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/
- Attention should match importance. Riot judges importance on four factors: damage, crowd control, dodgeability and impact on play.
- Hitboxes must line up with their effects. Visuals must not imply more dodge room than exists (Arcane Comet's big ground circle is their bad example).
- Projectiles should show travel direction even in a still frame.
- A skin's ability must be at least as clear as the base. Each skin is checked on every map.
- Visual and audio noise "adds up quickly in teamfights". Never turn everything up to 11.
- Fix shipped: Shan Hai Scrolls Jhin's ult borders faded out early, so Riot kept them visible.

Riot, "Behind the scenes of VFX updates".
Source: https://www.leagueoflegends.com/en-us/news/dev/dev-behind-the-scenes-of-vfx-updates/
- Ranked goals: (1) fix gameplay issues, with inaccurate hitbox indicators first, (2) readability and quality, meaning less fine-detail noise and balanced brightness, (3) theme.
- Readability beats theme every time.
- Named problems in old effects: textures with too much fine detail, effects too bright, effects too dim.
- Indicators must be the same size across all skins of a champion.

Riot, "VALORANT shaders and gameplay clarity" by Brandon Wang.
Source: https://www.riotgames.com/en/news/valorant-shaders-and-gameplay-clarity
- Enemies get a red fresnel rim. Allies get a neutral blue one. The rim is stronger on the upper body.
- Distant characters are brightened and their enemy rim is enlarged, with a clamp.
- Vision-blocking smoke has a hard geometric edge so its gameplay boundary reads from any angle.
- Fixes shipped: Sova's ult changed from large translucent cylinders to a thin opaque outline. Viper's ult got a defined range edge in place of a soft blur.
- Gameplay-relevant VFX look the same on low, medium and high. Quality settings only change cosmetic extras.
- Budget: 6.9 ms per frame for 144 fps (vendor-reported target).

Blizzard, Diablo III. Julian Love interview on AWN (search snippet, page not opened).
Source: https://www.awn.com/print/blog/devil-details-technical-artist-julian-love-diablo-iii-part-1
- His first rule is that effects exist to spell out gameplay mechanics.
- Talk pages: https://gdcvault.com/play/1017660 (Technical Artist Bootcamp: The VFX of Diablo, GDC 2013) and https://gdcvault.com/play/1015515 .

GDC 2024 "Attention Overload: Creating Readable VFX", Hanno Hinkelbein, Rocksteady, on Suicide Squad.
Source: https://gdcvault.com/play/1034360/Attention-Overload-Creating-Readable-VFX
- The abstract covers team structure and a post-mortem. It lists no rules. Low value for us.

Overwatch (search snippets only).
- GDC material ties hero design to whether abilities add "too much visual complexity". Source: https://cookandbecker.com/en/article/378/designing-overwatch.html
- Blizzard's 2016 audio talk made enemy footsteps louder than ally footsteps. Source: https://gamedeveloper.com/audio/video-how-i-overwatch-i-was-designed-so-people-could-play-by-sound-

### Inferences
- "First quarter" turns into a pixel-art frame rule. An 8-frame impact at 60-75 ms per frame lasts 480-600 ms, so the brightest frame should be frame 1 or 2.
- Riot's saturation tiers map onto palette planning. Keep ground tiles low in saturation and reserve the most saturated palette entries for spells.
- VALORANT's "same VFX on every quality level" is the right rule for an MMO effect tier system. Lower tiers may drop secondary elements. They must never drop the primary element or a hostile telegraph.
- VALORANT's hard-edged smoke and thin opaque outline fixes argue for a 1 px opaque border on every area spell, with any fill kept faint or dithered.

### Gaps
- No verified text from the Riot PDF. No page numbers. The primary/secondary/tertiary naming for VFX is confirmed for goals and for skin features, and primary/secondary for VFX elements. A "tertiary element" tier for VFX is not confirmed.
- No verified numbers from Julian Love's talk (the often-repeated idea that the environment keeps to a middle value band so effects own the top band is NOT confirmed here).
- Nothing verified from the Dota 2 art guide, Hearthstone, Heroes of the Storm, or Jason Keyser's talk.
- No studio source gave an effect duration in ms.

---

## 2. Element language and friend/foe colour

### Takeaway
Hue alone is the weakest channel. Every element needs its own shape and its own motion so it survives a palette limit, a colour-blind player and a busy tile. Fire, ice, lightning and poison have near-universal hues across games. Holy, dark and arcane vary by game, so pick one and hold it.

### Cited findings
- Genshin Impact element colours from a fan wiki template (not official): Pyro #EC4923, Hydro #498FCC, Anemo #359697, Electro #6957C2, Dendro #66AD16, Cryo #35AACC, Geo #CC9046. Search snippet from https://zh.moegirl.org.cn/Template:GenshinColor . Note that Hydro, Cryo and Anemo all sit in the blue-cyan range, so Genshin relies on icons and shape to split them.
- Riot's guide lists healing as green, frost as blue and gunpowder as orange-red. Source: https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
- LoL keeps shape language fixed across skins, for example scrolling lines for spell shields. Source: https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/
- VALORANT: enemy red rim, ally neutral blue rim. Source: https://www.riotgames.com/en/news/valorant-shaders-and-gameplay-clarity
- LoL's colour-blind mode moves red danger and enemy-ability visuals to orange so they separate from green terrain (search snippet of a Riot answer). Source: https://nexus.leagueoflegends.com/en-us/2016/11/ask-riot-league-on-the-big-screen/
- Slynyrd on shmup bullets: projectiles "should always be readable across all backgrounds", outlines are "almost certainly necessary", he uses white outlines because sprites use dark ones, and a double outline (bright plus dark) is the safe option. Source: https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design
- A claim that Hades gives enemy particles rounded shapes and player attacks sharp angular ones appeared in a search snippet from an uncited site. Treat as unverified. Source: https://mygamedesign-frontend.pages.dev/how-can-particle-effects-amplify-game-feel-without-cluttering

### Proposed element table (inference, built from genre convention)
Hue is in HSV degrees. None of the hue ranges, shapes or timings below come from a fetched source except the Genshin hexes and the Riot green/blue/orange notes above.

| Element | Hue range | Ramp (core to edge) | Shape | Motion | Timing character |
|---|---|---|---|---|---|
| Fire | 10-45 | white, yellow, orange, dark red | teardrops, licking tongues, round blobs | rises, flickers, leaves smoke | fast pop, slow smoky tail |
| Ice | 180-210 | white, pale cyan, mid blue, navy | shards, hexagons, straight edges | snaps into place, then holds still | instant, long static hold, shatter |
| Lightning | 50-60 or 200-220 with white | white, pale yellow or pale blue, one dark step | thin jagged lines, forks | jumps with no in-betweens | 1-3 frames on, flicker, gone |
| Poison, nature | 80-140 | pale yellow-green, lime, olive | bubbles, drips, cloud puffs | slow drift, pops | slow, lingering |
| Earth | 25-40 low saturation | tan, brown, dark brown | chunks, wedges, dust | bursts up, falls with gravity | heavy hit, short |
| Holy | 45-55 plus white | white, pale gold, gold | vertical beams, crosses, rings, 4-point stars | descends or rises straight | soft ease-in, gentle fade |
| Death, dark | 270-300, low value | pale violet rim, purple, near-black core | skulls, wisps, inverted core (dark centre, light rim) | drifts inward, sinks | slow in, sudden out |
| Arcane | 280-320 | white, pink-magenta, violet | circles, runes, clean geometry | rotates, orbits | steady, metric rhythm |
| Physical | no hue, white or grey | white, light grey | arcs, slashes, 4-point sparks | one direction, one smear | 2-4 frames total |

### Friend/foe (inference except where marked)
- Hostile aimed spells and ground telegraphs should own one hue band that no friendly effect uses. Red-orange is the convention (VALORANT red rim, cited). LoL shifts it to orange for colour-blind players (search snippet).
- Bullet-hell convention is that enemy bullets share one high-contrast look, often a bright core with a contrasting ring. Slynyrd's double outline advice (cited) is the pixel-art form of it.
- In an element system the hue is taken by the element, so friend/foe cannot be hue. Use the outline for it. Example: own and party spells get a dark outline, hostile spells get a white or red outer outline plus a 2-frame flash.

### Gaps
- No fetched source for Pokémon type hexes, Diablo damage-type colours, WoW spell schools, Magicka or Divinity. The table is convention, not citation.
- Overwatch's rule for friendly and enemy effect colours is not confirmed from a Blizzard source.

---

## 3. Colour-blind safety

### Takeaway
Do not let hue be the only difference between two effects that mean different things. Orange against blue is the safe two-team pair. Give hostile telegraphs a shape or pattern cue and let players pick the hostile colour.

### Cited findings
Game Accessibility Guidelines. Source: https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-fixed-colour-alone/
- No essential information by colour alone. Back colour with text, symbol, pattern or shape.
- Red-green difficulty affects "around 8-10% of males".
- Red can look darker to colour-blind players, so check red-on-dark contrast in a simulator.
- Orange against blue works for the three most common types. A lightness difference on top (light blue against dark orange) covers edge cases.
- Prefer added signifiers first, then player-chosen colours, with presets for deuteranopia, protanopia and tritanopia plus a custom option. The page discourages whole-screen filters as the default.
- Test at full (100%) severity in a simulator, then with colour-blind players.
- Best-practice examples listed include Destiny, FTL, Splatoon's colour lock and Puzzle Retreat's symbol plus colour.

Shipped modes (search snippets, pages not opened).
- LoL: allied health bars green to blue, some red effects to yellow or orange, some green effects to blue. Players criticise it as too small a change. Sources: https://pcgamer.com/league-of-legends-getting-colourblind-mode-in-upcoming-patch , https://www.gamepressure.com/newsroom/lol-colorblind-mode-is-useles-for-players-suffering-from-actual-c/za2e03
- Overwatch replaced a whole-screen filter with separate enemy and friendly colour choice from nine colours, applied to UI and hero outlines. Players then reported abilities that still showed default red. Sources: https://www.slashgear.com/overwatch-gets-updated-colorblind-feature-with-nine-color-options-21546973 , https://us.forums.blizzard.com/en/overwatch/t/colorblind-setting-inconsistencies-on-console-when-compared-to-pc-post-1-37-update/358349
- Fortnite ships Protanope, Deuteranope and Tritanope modes with a strength slider. Source: https://www.epicgames.com/help/fortnite-battle-royale-c-34254770/a16825931
- Xbox Accessibility Guideline 103 uses red-outlined enemies against green-outlined allies as its bad example. Source: https://learn.microsoft.com/en-gb/gaming/accessibility/xbox-accessibility-guidelines/103

### Inferences (colour science, no fetched source)
Element pairs likely to collide:
- Deuteranopia and protanopia: fire red-orange against poison green. Arcane magenta against ice or water blue. Dark purple against blue. Holy gold against lime poison. Under protanopia, deep red on dark ground loses brightness and can vanish.
- Tritanopia: ice cyan against poison green. Holy yellow against white or pale pink. Blue against dark grey.
- Fixes that cost nothing at run time. Separate colliding pairs by value (make poison darker and more olive, fire brighter). Give each element its own silhouette and motion from the table in section 2. Check each element pair in greyscale.
- Overwatch's lesson is that a colour setting must reach the effects too, since players noticed abilities left in default red. In a palette-ramp renderer this is cheap. Hostile colour is one ramp row that a setting can swap.

### Gaps
- No verified colour-blind mode for Hades. No simulator run was done on a real Kingsfoil palette. The pair list needs a test with a tool such as Coblis or a daltonize shader.

---

## 4. Pixel-art craft

### Takeaway
Draw energy as a hard-stepped ramp with white only at the hottest point, and put an outline on anything that flies. Use few frames, held long enough to read. Fast first, slow after.

### Cited findings
Slynyrd, Pixelblog 31 (shmup design). Source: https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design
- Explosion construction. Start with circles that thin into rings as they expand, then turn them into fiery blobs that follow the ring guide. The same rings make a shockwave.
- Expansion is fast at first and slows strongly before dissipating.
- "The color starts white hot and fades to warm hues, then to gray."
- Projectiles use bright saturated colour, varied sizes (bigger means more damage), unique shapes over plain balls, and an outline.
- Flashing between two frames is enough. Too much contrast makes fast bullets harder to track.
- The design is meant for top-down projection.

Slynyrd, Pixelblog 45 (search snippet). Source: https://www.slynyrd.com/blog/2023/7/21/pixelblog-45-bricks-walls-doors-and-more
- Fire loop: 6 frames at 0.1 s each. Flickering highlights at 0.05 s.

Slynyrd, Pixelblog 36 (search snippet). Source: https://www.slynyrd.com/blog/2022/1/25/pixelblog-36-8-bit-adventure
- A 3-frame circular explosion is enough for an enemy kill. Repeat and offset it for bigger blasts.

Slynyrd, Pixelblog 8. Source: https://www.slynyrd.com/blog/2018/8/19/pixelblog-8-intro-to-animation
- 8-frame run at 80 ms per frame. 4-frame run at 160 ms per frame. His default is 6 frames.
- Keyframes must read without in-betweens. Too many in-betweens make motion sluggish.

Riot's guide (via VFX Apprentice) backs two pixel-art habits: hand-drawn shapes over noise, and few stacked alpha layers.

A search snippet from an unnamed pixel-art skill document says to keep white for the hottest core only and use hard ramp steps. Source: https://shyft.ai/skills/patch-gg-pixelfx (low authority).

### Inferences (general pixel-art practice, no fetched source)
- Ramp of 3-5 steps: white core, light tint, saturated mid, dark hue-shifted edge. Shift hue toward red or purple as value drops for warm elements and toward blue or violet for cold ones.
- No alpha gradients. Fade by eroding the shape, by dither, or by stepping down the ramp. This matches previous studies ("glow without alpha", world-locked dither).
- Smear frame for anything that moves more than its own width per frame. One stretched frame replaces three in-betweens.
- Dither only on large soft areas such as smoke or aura fills. Never on a projectile under 16 px, where it reads as noise.
- Animate effects on twos or threes at 60 fps game speed. That is 33-50 ms per frame for fast sparks and 66-100 ms for loops. The combat-juice study already uses 75 ms per frame for hit sparks.

### Gaps
- saint11, AdamCYounis, Lospec, Dead Cells, Hyper Light Drifter, Octopath, Sea of Stars and Eastward write-ups were not reached. Two searches for them returned asset-store spam.
- No source for sub-pixel animation in effects or for a cover-time limit.

---

## 5. Readability against busy ground

### Takeaway
Keep the ground in the middle values and low saturation, and let spells take the brightest values and the highest saturation. Give bright effects a dark edge so they read on light tiles too. Use motion and hard edges as the backup channel.

### Cited findings
- Riot's saturation tiers: environment low, VFX highest. Source: https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
- Riot checks every skin on every map after Freljord Taliyah read badly on a snow map. Source: https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/
- VALORANT caps the darkest and brightest ambient light per area, and treats environments as something players "mentally block out". Source: https://www.riotgames.com/en/news/valorant-shaders-and-gameplay-clarity
- Slynyrd keeps large bright areas out of backgrounds so white-outlined bullets always read, and offers the bright plus dark double outline as insurance. Source: https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design
- The area of focus should hold both the highest and the lowest value. Source: https://realtimevfx.com/t/anatomy-of-a-league-of-legends-missile-part-1-creating-areas-of-focus/11614

### Inferences
- "Highest and lowest value in the focus area" is the contrast sandwich. In pixel art that is a white or near-white core with a 1 px dark outline or dark underlay.
- Test tiles. Check each spell on the brightest tile (snow, sand), the darkest tile (cave), the most saturated tile (lava, grass) and the busiest tile (flowers, cobble). This copies Riot's every-map check.
- Scene darkening under a big spell. Dim the ground by one palette step for the peak frames of an ultimate only. It is a full-screen change, so apply the photosensitivity limits from scope item 7.
- Additive blending fails on snow and sand because the result clips to white. A palette-ramp effect with a dark edge does not.

### Gaps
- No source gave a numeric value band for ground against effects. The 30-70% ground band in the checklist is my proposal.

---

## 6. Praised and criticised examples

### Takeaway
The clutter complaints are the same in every game: other players' effects hide enemy telegraphs, friendly and hostile ground effects look alike, and there is no per-source control. The shipped answers are per-source effect settings (FFXIV) and hard-edged, outline-style hostile areas (VALORANT).

### Cited findings
- League of Legends. Praised for a published rule set, and it keeps fixing old effects. Hecarim was the first of the hitbox-driven updates. See it: https://www.leagueoflegends.com/en-us/news/dev/dev-behind-the-scenes-of-vfx-updates/
- VALORANT. Patch 11.07 shipped ability visual improvements after new agents added clutter (search snippet). See it: https://www.riotgames.com/en/news/valorant-shaders-and-gameplay-clarity
- Hades. Effects by Josh Barnett, hand-authored, shown in a Supergiant breakdown post. See it: https://80.lv/articles/a-behind-the-scenes-look-at-the-effects-in-hades . Not all praise: a critic essay argues Hades II has a legibility problem and a Steam thread says attack radius is not obvious from enemy animation (search snippets). Sources: https://nex-3.com/tag/hades , https://steamcommunity.com/app/1145350/discussions/0/591769824782233841
- Path of Exile 1 and 2. Player threads say friendly and enemy ground effects look alike and that on-death effects hide the character. Players ask for draw order enemy over self over ally, a per-group opacity setting and colour-coded outlines. I found no Grinding Gear statement. See it: https://www.pathofexile.com/forum/view-thread/3598854 , https://pathofexile.com/forum/view-thread/3626389 (search snippets).
- Diablo IV. Players ask for outline-only rendering of other players' areas and an opacity slider for their own effects. Icy Veins reports no official commitment. See it: https://www.icy-veins.com/d4/news/diablo-4-effect-toggles-players-renew-calls-for-this-feature/ (search snippet).
- FFXIV. Battle effects can be set to Show All, Show Limited or Show None separately for own, party and others. Square Enix patched Limit Break effects to keep showing under Limited in 2.2. Players warn that Show None hides gameplay-relevant effects. See it: https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_bteffect.html (search snippet).
- Vampire Survivors. Players turn off damage numbers and impact flashes to see late-game screens. One player reports 30-40% less lag after 20-25 minutes, which is an anecdote and not a measurement. See it: https://steamcommunity.com/app/1794680/discussions/0/3820781363199330417 (search snippet).

### See-it-in-action URLs for games not reached in research
These are store pages recalled from memory. I did not fetch them in this session, so check each before publishing.
- Hyper Light Drifter: https://store.steampowered.com/app/257850/Hyper_Light_Drifter/
- Wizard of Legend: https://store.steampowered.com/app/445980/Wizard_of_Legend/
- Dead Cells: https://store.steampowered.com/app/588650/Dead_Cells/
- Sea of Stars: https://store.steampowered.com/app/1244090/Sea_of_Stars/
- Eastward: https://store.steampowered.com/app/977880/Eastward/
- Hades (confirmed in the 80.lv page): https://store.steampowered.com/app/1145360/Hades/
- Lost Ark: https://store.steampowered.com/app/1599340/Lost_Ark/

### Inferences
- FFXIV's Limit Break patch is the model rule. A reduced tier must keep the effects that carry gameplay. Tag each effect layer as gameplay or cosmetic in the spell data, and let tiers cut only cosmetic layers.
- The PoE player request (enemy over self over ally, per-group opacity) is a ready-made draw-order and settings spec for a 30-player screen.

### Gaps
- No developer statements found for PoE, Diablo IV, Lost Ark or Vampire Survivors. No source reached for Wizard of Legend or Hyper Light Drifter praise. Lost Ark was not researched at all.

---

## 7. Checklist for each new spell

Tags: [C] cited number, [S] search snippet, [P] my proposal, to be tuned in the demos.

Gameplay first
1. Name the primary element (the part that is the hitbox). Everything else is secondary. [C, Riot]
2. The drawn shape matches the hitbox to within 1 px at 32 px tiles. Never draw it larger than the hitbox. [P, from Riot's hitbox rule]
3. Visual weight follows four factors: damage, crowd control, dodgeability, impact. [C, Riot] Suggested size caps: basic hit up to 16 px, standard spell up to 32 px (1 tile), big cooldown up to 3x3 tiles, ultimate larger. [P]

Value and colour
4. Ramp of 3-5 hard steps. White only on the core and only at the peak. [C for white-hot to warm to grey, Slynyrd; step count P]
5. Effect body in mid values. No pure black and no pure white as body colour. [C, Riot via VFX Apprentice]
6. Ground tiles sit in roughly 30-70% value and below about 50% saturation. Spells may use 70-100% value and the top saturation. [P, from Riot's tier rule]
7. One dominant hue per spell. The accent hue is desaturated and covers under about 10-20% of pixels. [C for the rule, percentage P]
8. Every projectile has an outline. Use a dark outline for friendly and a bright or double outline for hostile. [C for outline and double outline, Slynyrd; friend/foe split P]
9. The spell reads in greyscale and stays distinct from every other element by shape and motion. [C for no colour alone; test method P]
10. The hostile hue is a single swappable ramp. Default red-orange, with orange against blue as the safe pair. [C, Game Accessibility Guidelines]

Timing
11. Peak brightness inside the first 25% of the lifespan. [C, Riot via VFX Apprentice]
12. Impact flipbooks of 3-8 frames. A 3-frame burst is enough for a small hit. [C for 3 frames, Slynyrd; upper bound P]
13. Frame time 50-100 ms. Loops use 6 frames at 100 ms with highlights at 50 ms. Hit sparks use 75 ms. [S for the fire loop, Slynyrd; 75 ms from the combat-juice study]
14. Expansion is fast first and slow after. Cover at least half the final radius in the first 2 frames. [C for fast then slow, Slynyrd; "half in 2 frames" P]
15. The effect may hide the target sprite for at most 100-150 ms (2 frames). After that the target's silhouette must show through. [P]
16. Cut the effect until it feels slightly too short. [C, Riot]

Crowd
17. Tag layers as gameplay or cosmetic. Lower tiers drop cosmetic layers only. Hostile telegraphs always draw. [C for the principle, VALORANT and FFXIV]
18. Area spells show a 1 px opaque border. The fill is faint or dithered. [C for the fix direction, VALORANT; pixel numbers P]
19. Draw order: hostile over own over party over others. [S, PoE player request]
20. Test on four tiles: brightest, darkest, most saturated, busiest. [C for the every-map check, Riot; tile list P]

---

## Sources

Fetched and read
- https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
- https://realtimevfx.com/t/anatomy-of-a-league-of-legends-missile-part-1-creating-areas-of-focus/11614
- https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/
- https://www.leagueoflegends.com/en-us/news/dev/dev-behind-the-scenes-of-vfx-updates/
- https://www.riotgames.com/en/news/valorant-shaders-and-gameplay-clarity
- https://gdcvault.com/play/1034360/Attention-Overload-Creating-Readable-VFX
- https://realtimevfx.com/t/official-league-of-legends-vfx-style-guide/3392 (links only, includes an unofficial Google Drive mirror of the PDF)
- https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-fixed-colour-alone/
- https://80.lv/articles/a-behind-the-scenes-look-at-the-effects-in-hades
- https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design
- https://www.slynyrd.com/blog/2018/8/19/pixelblog-8-intro-to-animation

Search snippets only (not opened)
- https://nexus.leagueoflegends.com/en-us/2017/10/dev-leagues-vfx-style-guide/
- https://nexus.leagueoflegends.com/en-us/2016/11/ask-riot-league-on-the-big-screen/
- https://www.awn.com/print/blog/devil-details-technical-artist-julian-love-diablo-iii-part-1
- https://gdcvault.com/play/1017660 and https://gdcvault.com/play/1015515
- https://cookandbecker.com/en/article/378/designing-overwatch.html
- https://www.slynyrd.com/blog/2023/7/21/pixelblog-45-bricks-walls-doors-and-more
- https://www.slynyrd.com/blog/2022/1/25/pixelblog-36-8-bit-adventure
- https://zh.moegirl.org.cn/Template:GenshinColor
- https://www.slashgear.com/overwatch-gets-updated-colorblind-feature-with-nine-color-options-21546973
- https://www.epicgames.com/help/fortnite-battle-royale-c-34254770/a16825931
- https://learn.microsoft.com/en-gb/gaming/accessibility/xbox-accessibility-guidelines/103
- https://pcgamer.com/league-of-legends-getting-colourblind-mode-in-upcoming-patch
- https://www.pathofexile.com/forum/view-thread/3598854 and https://pathofexile.com/forum/view-thread/3626389
- https://www.icy-veins.com/d4/news/diablo-4-effect-toggles-players-renew-calls-for-this-feature/
- https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_bteffect.html
- https://steamcommunity.com/app/1794680/discussions/0/3820781363199330417
- https://nex-3.com/tag/hades

Failed
- Riot VFX style guide PDF (301 to home page), web.archive.org (blocked), two 3dreference Notion pages (empty), Steam Support Dota 2 art guide (navigation only), technology.riotgames.com/node/110 (504).
