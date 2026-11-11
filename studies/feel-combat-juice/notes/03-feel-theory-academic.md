# 03 · Feel theory, fighting-game frame data, talks and academic work

Researcher angle: fighting/brawler theory, canonical game-feel talks, academic studies, accessibility limits, newest work, and what each means for a 32 px top-down MMO with a shared screen.

Frame math used below is 60 fps, so 1 frame = 16.7 ms.

---

## Q1. Hitstop, hitstun, blockstun, frame data

### Takeaway
Hitstop (hitlag, impact freeze) is a short freeze of attacker and victim on contact. It scales with damage, has a cap, and is shorter for projectiles. Fighting games sit at roughly 8 to 15 frames (133 to 250 ms) for normals. Smash uses a formula. Sakurai's own column names the multiplayer problem that matters most for an MMO. A third player can act during a freeze, so he kept hitstop shorter than he wanted. In a shared-screen MMO, hitstop must be per-entity and visual only, never a world pause and never a delay of server simulation.

### Cited findings

**Definitions (Sakurai, Famitsu vol. 490, fan translation by Source Gaming)** https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/
- Hitstop is a visual effect where both characters freeze. Hitstun is the separate period where the victim cannot act.
- Attacker and victim freeze for the same length. More damage means longer hitstop. Each attack can carry its own multiplier (Marth tipper up, blade edge down). Projectiles get less. Electric gets more. There is a cap for huge hits like Final Smashes.
- Multiplayer issue: during a freeze a third player can walk in and hit you. Sakurai held hitstop back for this reason.
- Shake during hitstop: the victim vibrates and in Smash the attacker vibrates too. Hurtboxes stay still while the sprite shakes, so shake never causes a miss. Grounded characters shake side to side, airborne ones shake vertically (vertical on the ground would clip feet into the floor). Shake amplitude scales with camera zoom and starts large then shrinks to zero over the freeze.
- Victim's first frame is a flinch pose that blends into the hurt animation over 4 frames during the freeze.
- Translator flags it as a fan translation.

**Smash formulas (SmashWiki, data-mined)** https://www.ssbwiki.com/Hitlag
- Melee: `floor(floor(floor(d/3 + 3) * e) * c)` frames, cap 20.
- Brawl / Smash 4: `floor(floor((d * 0.3846154 + 5) * h * e) * c)`, cap 30 (20 for a crouch-cancelling victim).
- Ultimate: `floor(floor(floor((d * 0.65 + 6) * h * e * s) * p) * c)`, cap 30. d = damage %, h = per-hitbox multiplier (Marth tipper 1.25, 0 means no hitlag), e = electric 1.5, c = crouch cancel 0.67, s = shielding 0.67.
- Ultimate has a player-count factor p that shortens long hitlag in bigger matches: 1.0 for 2 players, 0.925 for 3, 0.862 for 4, 0.75 for 8. It applies only above 10 frames and not to projectiles. This is the only shipped case I found of hitstop being cut because more players share the screen.
- No knockback means no hitlag. A perfect shield gives the attacker hitlag and the defender none (asymmetric freeze).
- Worked example (inference from formula): a 10% Ultimate hit is 0.65*10+6 = 12.5, so 12 frames (200 ms). A 20% hit is 19 frames (317 ms).

**Street Fighter (Sonic Hurricane "Impact Freeze", Maj, 2010)** https://sonichurricane.com/?p=1043
- "In most games" light about 9 frames, medium about 11, heavy about 13.
- SF2 series used about 14 frames regardless of button strength.
- SFIV projectiles 8 frames of hitstop (from the Master Guide, per a comment). On projectile hits the victim freezes but the attacker does not.
- Hitstop is about the same on hit and on block.
- SF6 per-move data (SuperCombo wiki, Terry): cr.MP 11 hitstop, cr.HP 13. Manon Punish Counter raised from 11 to 14 frames in the June 2025 patch (from search snippet of https://srk.shib.live/w/Street_Fighter_6/Terry/Data, page itself blocked by bot check).

**Guilty Gear Strive attack levels (Dustloop, from search snippet, page returned 403)** https://dustloop.com/w/GGST/Attack_Attributes
- Lv0: hitstop 11, standing hitstun 12, crouching hitstun 13, blockstun 9. Lv4: hitstop 15, standing hitstun 21. Counter hits replace normal hitstop with a longer "cinematic" freeze. Treat as unverified until the table is read in full.

**Celeste (open source, NoelFB/Celeste Player.cs)** https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- `Celeste.Freeze(.05f)` (50 ms, 3 frames) at dash start, red-booster dash start and another dash event. `Celeste.Freeze(.1f)` (100 ms) when an explosion launches the player. `DirectionalShake(DashDir, .2f)`, a 0.2 s shake in the dash direction. Wall bounce shakes are 0.1 s. A dash lasts 0.15 s.
- So a precision platformer uses 50 to 100 ms freezes, a third to half of fighting-game values.

**Monster Hunter Wilds hitstop debate (2024-2025)** https://www.pcgamer.com/games/rpg/capcom-if-youre-listening-monster-hunter-wilds-needs-its-hitstop-back
- Fan frame counts (per search summary of GamesRadar coverage) put switch axe hitstop at about 1/4 s in Generations Ultimate and Rise, about 1/5 s in World, and near zero in the Wilds beta. Players said weapons felt worse. Informal measurement, not controlled.

### Mapping frame data to an action RPG / MMO
- Fighting games split a move into startup (anticipation), active (hitbox live) and recovery. Hitstun and blockstun are how long the defender is locked after contact. Frame advantage = defender stun minus attacker recovery.
- Inference for Asterion: Tibia-style auto-attack on a server tick does not need hitstun as a mechanic. Use hitstop and the 4-frame flinch blend as pure client presentation. If hitstun exists as a gameplay rule it must be server-side and short, and in PvP it is crowd control that needs diminishing returns (see the PvP researcher).

### Inferences
- A sane MMO starting point: 3 to 6 frames (50 to 100 ms) of per-sprite freeze on normal hits, 8 to 12 frames (133 to 200 ms) on crits and kills, cap at about 200 ms. Below fighting games because crowds stack hits, and because Smash Ultimate itself scales hitstop down with player count.
- Freeze only the two sprites involved (attacker anim and victim anim), on the local client. Never pause the server tick or other entities.
- Copy Sakurai's shake details directly. Shake the sprite, not the hitbox. Horizontal shake for ground units (all units in top-down). Decay from full to zero across the freeze.

### Gaps
- Full GGST and SF6 tables were blocked (403 / bot check).
- No official Sakurai numbers for total hitstop, only the formula from data-mining.

---

## Q2. Canonical talks with concrete numbers

### Takeaway
The talks agree on cheap, layered feedback. The concrete numbers come from Eiserloh's slides (trauma model) and from Nijman's trick list. Nijman's list is a list of tricks, with few numbers.

### Cited findings

**Jan Willem Nijman, "The art of screenshake", INDIGO Classes 2013** https://www.youtube.com/watch?v=AJdEqssNZ-U
Trick list in talk order, from a viewer's timestamp list (The Cozy Design Space comment) at https://theengineeringofconsciousexperience.com/jan-willem-nijman-vlambeer-the-art-of-screenshake/ (user-generated, timestamps approximate):
1. basic animations and sound (8:28)
2. lower enemy HP
3. higher rate of fire
4. more enemies
5. bigger bullets
6. muzzle flash
7. faster bullets
8. less accuracy
9. impact effects
10. hit animation (12:10)
11. enemy knockback
12. permanence (bodies and debris stay)
13. camera lerp
14. camera position (look ahead)
15. screen shake (16:36)
16. player knockback
17. sleep, a short pause when hitting an enemy (18:06)
18. gun delay
19. gun kickback
20. strafing
21. little shells
22. more bass
23. super machine gun
24. random explosions
25. faster enemies
26. more enemies
27. even higher rate of fire and camera kick (camera moves opposite the shot)
28. bigger explosions
29. even more permanence (smoke)
30. meaning (player can die, death animation)
31. game balancing
- Only number on that page is a viewer quoting Nijman, "sleep(20) when every enemy dies" (units not stated, GameMaker sleep is in ms, so likely 20 ms). Mary Rose Cook's notes describe "30 tweaks" and two rules. Make the one button as significant as possible, and give a reason not to press it. http://notebook.maryrosecook.com/Theartofscreenshake,JanWillemNijman.html

**Squirrel Eiserloh, "Math for Game Programmers: Juicing Your Cameras With Math", GDC 2016**
Slides: http://www.mathforgameprogrammers.com/gdc2016/GDC2016_Eiserloh_Squirrel_JuicingYourCameras.pdf · Vault: https://www.gdcvault.com/play/1023557/Math-for-Game-Programmers-Juicing
- Keep a trauma value in [0,1]. Damage or stress adds 0.2 or 0.5. Trauma falls linearly over time.
- Shake = trauma^2 or trauma^3. Trauma 0.30, 0.60, 0.90 gives 3%, 22%, 73% shake (cubed). So small hits barely move the camera and big hits dominate.
- 2D: rotational alone is "kinda lame", translational is nice, both together is best. 3D: rotation only. VR: tread carefully.
- 2D implementation: `angle = maxAngle * shake * noise(seed, t)`, `offsetX = maxOffset * shake * noise(seed+1, t)`, `offsetY = maxOffset * shake * noise(seed+2, t)`.
- Perlin (smoothed) noise beats random. It feels better, works with pause and slow motion, has adjustable frequency and replays deterministically.
- "Camera shake is like salt" (slide title).
- Smoothing: asymptotic average `x += (target - x) * k`. k = 0.01 slow, 0.1 fast, 0.5 very fast at 60 fps. Scale k by timeScale so it pauses. Horizontal and vertical can use different weights.

**Martin Jonasson and Petri Purho, "Juice it or lose it", GDC Europe 2012** https://gdcvault.com/play/1016487/Juice-It-or-Lose
- Starts from a plain Breakout clone and layers tweening, squash and stretch, particles, screen shake, sound. Juice is "maximum output for minimum input" (secondary summary, https://gamejuice.pages.dev/articles/juice-it-or-lose-it-lessons). Source code at https://github.com/grapefrukt/juicy-breakout (README lists no parameter values).
- Counterpoint talk, Folmer Kelly, "Don't Juice It or Lose It", GDC Europe 2014, argued polish can cost immersion. https://gdcvault.com/play/1020861/Don-t-Juice-It-or

**Steve Swink, "Game Feel" (2008)**
- Definition: real-time control of virtual objects in a simulated space, with interactions emphasized by polish (quoted via https://gamejuice.pages.dev/articles/swink-6-components-game-feel).
- Uses Card, Moran and Newell's model processor ranges. Perception 50 to 200 ms, cognition 30 to 100 ms, motor 25 to 170 ms. About 240 ms total is the line past which control stops feeling real-time (reader recap, https://redlib.hackliberty.org/r/GameDevelopment/comments/1kg51wo/better_game_design_with_a_book_club_game_feel). Course slides give 100 ms as the target for controls that feel direct. https://medienwissenschaft.uni-bayreuth.de/wp-content/uploads/GxD-07-Interfaces.pdf

**Pichlmair and Johansen, "Designing Game Feel: A Survey", IEEE Transactions on Games 14(2), 2022 (preprint 2020)** https://arxiv.org/abs/2011.09201
- Reviewed 200+ sources. Three domains of player experience with matching polish practices: physicality via tuning, amplification via juicing, support via streamlining. Juicing produces empowerment and clarity of feedback.
- Inference: for Asterion, "support/streamlining" (input buffers, queue windows, target assist) matters as much as juice, and is the part that survives latency.

**Kyle Gabler et al., "How to Prototype a Game in Under 7 Days", Gamasutra 2005** https://www.gamedeveloper.com/game-platforms/how-to-prototype-a-game-in-under-7-days
- Often credited with popularising "juicy". I could not confirm the passage in this session.

**Hunicke, LeBlanc, Zubek, "MDA" (2004)** https://users.cs.northwestern.edu/~hunicke/MDA.pdf. Not fetched this session. It frames juice as dynamics/aesthetics layered on mechanics, nothing numeric.

**Mark Brown, GMTK "Secrets of Game Feel and Juice"** (subtitle page https://amara.org/v/C3BGA). Not fetched. Use as a viewer-friendly explainer only.

### Inferences
- Nijman's tricks split cleanly for an MMO. Local-only and safe: muzzle flash, impact effects, hit animation, permanence (local corpses/debris with a cap), camera lerp, camera look-ahead, camera kick, little shells, bass, screen shake (local player only). Gameplay-changing, so server-authoritative: knockback, rate of fire, accuracy, enemy HP. "Sleep" (global pause) does not transfer at all. Replace it with per-sprite freeze.
- Eiserloh's trauma model fits an MMO well because it sums many small events into one bounded value. Thirty hits on you in one second cannot exceed trauma 1.0, and cubing keeps small hits near zero.
- For pixel art, round shake offsets to whole pixels and use small rotation or none. Rotation on a 32 px grid causes shimmering on nearest-neighbour sprites (inference, test needed).

### Gaps
- Exact Nijman pause duration in the talk unverified (one write-up claims about 0.2 s, one viewer quotes sleep(20)).
- Celeste and TowerFall talks were not reached. The Celeste source code numbers above replace them.

---

## Q3. Academic studies measuring juice

### Takeaway
Evidence is thin but consistent. Juice reliably improves how a game looks and some experience measures. It rarely changes performance. Kao (N = 3,018) found both zero juice and extreme juice hurt experience and play time, with medium and high best. Hitstop that players call pleasant in a VR study was far longer than fighting-game values, so the context and camera matter.

### Cited findings

| Study | N | Design | Result |
|---|---|---|---|
| Kao 2020, "The effects of juiciness in an action RPG", Entertainment Computing 34, 100359. https://dblp.uni-trier.de/rec/journals/entcom/Kao20.html | 3,018 | 4 versions of one ARPG: None, Medium, High, Extreme juice | None and Extreme lowered player experience, play time and performance. Medium and High raised intrinsic motivation and play time. Results via Hicks et al. 2024 literature review https://eprints.staffs.ac.uk/8527/1/3677084.pdf |
| Hicks, Gerling, Dickinson, Vanden Abeele 2019, "Juicy Game Design", CHI PLAY, pp. 185-197. https://bibtex.github.io/CHI-PLAY-2019-HicksGDA.html | 40, then 32 | Visual embellishments on/off in Cuber (Frogger clone) and Dungeon Descent (FPS), then Quake 3 Arena | Embellishments improved perceived aesthetics. Effects on competence etc. only in specific cases. Sample sizes from Hicks thesis https://core.ac.uk/download/492524999.pdf, unconfirmed against the paper |
| Hicks et al. 2019, "Understanding the effects of gamification and juiciness", IEEE CoG | not reached | Juice vs gamification, several genres | Juice raised meaning and curiosity, did not change performance or behaviour (per 2024 review) |
| Hicks et al. 2018, "Good Game Feel", DiGRA. https://dl.digra.org/index.php/dl/article/view/936 | 17 developers | Survey, affinity diagram | Framework for juicy design, juice = coherent feedback across senses |
| Juul and Begy 2016, FDG/DiGRA | not stated | Juicy vs plain puzzle UI | Players called juice important, no effect on measured experience such as ease of use (per 2024 review) |
| Smets and van der Spek 2021, "That sound's juicy!", ICEC. https://research.tue.nl/en/publications/that-sounds-juicy-exploring-juicy-audio-effects-in-video-games/ | 61 | Plain vs juicy SFX in a side-scrolling shooter, between subjects | Juicy audio raised immersion and sensory fidelity, medium effect size |
| Singhal and Schneider 2021, "Juicy haptic design", CHI. https://uwaterloo.ca/haptic-experience-lab/projects/juicy-haptic-design-vibrotactile-embellishments-can-improve | not reached | Mobile vibration embellishments | Raised enjoyment, aesthetics, immersion |
| Hicks, Rogers, Gerling, Nacke 2024, "Juicy Audio", PACM HCI 8 CHI PLAY, art. 319. https://doi.org/10.1145/3677084 | 12 audio designers | Interviews | Juicy audio = emphasis/augmentation, cohesion/coherence, synesthesia |
| Tomizawa and Ishikawa 2024, "An Evaluation Research on Dynamic Hit Stop Using Eye Gaze", VISIGRAPP/GRAPP pp. 151-158. https://scitepress.org/publishedPapers/2024/124614/pdf/index.html | 16 (15 in one scene) | Unity VR action game (FEEL asset), hitstop 0.0 to 0.7 s in 8 steps, sword, bow, mixed | Pleasant mean 0.37 to 0.39 s, unpleasant mean 0.56 to 0.57 s, boundary 0.537 to 0.55 s. Hitstop that varied with gaze duration beat a fixed 0.39 s on impact and enjoyment |
| Lin, Duan, Wen, Cai 2022, "What Features Influence Impact Feel?", arXiv 2208.06155. https://arxiv.org/abs/2208.06155 | 5,000 hand-labelled Steam comments, 96 fighting/ARPG games | NLP ranking of impact feel, 19-feature framework applied to top 8 vs bottom 8 | Hit stop, sound coherence and camera control most strongly linked to impact feel. Missing any one of the three ruins it |
| Kyushu Univ. KAKEN 22K18649, FY2023 report. https://kaken.nii.ac.jp/en/report/KAKENHI-PROJECT-22K18649/22K186492023hokoku | not stated | First-person sword attacks, strong / weak / no screen shake | Strong shake raised sense of agency. Weak shake equalled no shake |
| Claypool and Claypool 2006, "On Latency and Player Actions in Online Games". https://ftp.cs.wpi.edu/pub/techreports/pdf/06-13.pdf | meta-study | Summary of prior latency experiments | Thresholds: first-person avatar 100 ms, third-person avatar (sports, RPG) 500 ms, omnipresent (RTS) 1,000 ms. In EverQuest 2, 0 to 500 ms added latency lengthened a ~2 min fight by only ~5 s |

### Inferences
- The inverted U from Kao is the strongest argument for a juice budget and a player setting. "Extreme" is a real failure mode, not just taste.
- The Tomizawa numbers (0.37 s pleasant) come from a single-player VR game with one enemy. Do not copy them to a crowd. They do show that longer freezes than fighting-game norms can feel good on rare, heavy events (crits, kills).
- Weak shake doing nothing (KAKEN) plus cubed trauma (Eiserloh) suggests few, strong shakes on the local player's own big events rather than constant tiny jitter.
- Claypool puts a top-down, click-to-target RPG near the 500 ms tolerance. Aimed skillshots and dodges behave more like the 100 ms first-person class. That justifies treating the two halves of the hybrid combat model differently in netcode (inference).

### Gaps
- Kao full text not reached. Effect sizes per condition unknown.
- No controlled study found on damage numbers, or on hitstop in a multiplayer/crowd setting.
- No primary study found measuring screen shake vs aiming accuracy.

---

## Q4. Too much juice, nausea, photosensitivity, accessibility

### Takeaway
Hard limits exist for flashes. Shake and motion need an off switch or slider. In an MMO with 30 players casting, the sum of everyone's flashes is the risk, not any single effect.

### Cited findings
- Xbox Accessibility Guideline 118, Photosensitivity. https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/118
  - About 1 in 4,000 people can have a seizure from flashing images or patterns.
  - A flash is a 10% change in luminance, with the darker value below 0.8. Fail if more than about 3 flashes per second and covering about 20% or more of the screen. Long low-intensity flashing can also fail.
  - Red flash: either extreme saturated red, R/(R+G+B) >= 0.8, and a change in (R-G-B) x 320 greater than 20. Lower luminance threshold than a normal flash.
  - Spatial pattern: alternating bands with contrast difference over 10% covering about 20% of the screen.
  - Fixes: lower contrast, lower frequency, smaller area, desaturate red. Test with the Harding FPA tool. https://www.hardingfpa.com/
  - Removing triggers is preferred over warning screens.
- Xbox Accessibility Guideline 117, Visual distractions and motion settings (retitled in v3.2, June 2023). https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117
  - Avoid camera shake, camera bobbing, motion blur, or offer an option to turn them off. Avoid repetitive side-to-side or up-and-down motion not core to play.
  - Example: Halo Infinite has separate 0 to 100% sliders for screen shake, radial blur, full-screen effects and speed lines.
- Game Accessibility Guidelines, "Avoid flickering images and repetitive patterns". https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/
  - Flag flashing over 5 seconds, more than 3 flashes per second over 25% or more of the screen, static repeated patterns over 40% of the screen. Includes abrupt brightness changes, fast cuts and changes to or from red. If unavoidable, warn and offer an option to disable.
- Kao 2020 (Q3): Extreme juice lowered experience, play time and performance.
- Hicks et al. 2024 review cites a study where amplified feedback lowered motivation, possibly by hurting sense of agency (via search summary, not verified).

### Inferences
- White hit flash on one 32 px sprite is tiny relative to screen area, so one flash is safe. Thirty players each flashing at 10 Hz across a packed screen can approach 20% area. Add a global flash budget per frame (cap simultaneous full-white flashes, or tint instead of pure white for non-local entities).
- Full-screen red damage vignettes are the highest risk item because red has a lower threshold. Keep them low-contrast and rate-limited to under 3 per second.
- Settings to ship from day one: screen shake 0 to 100%, hit flash intensity, "reduce others' effects" (show other players' effects at lower alpha or off), damage numbers on/off for others.

### Gaps
- No MMO-specific overload post-mortem found in this pass. Lost Ark / FFXIV "other players' effects" settings are covered by other researchers.

---

## Q5. Newest work (2025-2026)

### Cited findings
- GDC session "'Battlefield 6': Game Feel is the Message", Jac Carlsson (game feel designer). On gun feel in first-person combat. Listing at https://schedule.gdconf.com/session/battlefield-6-game-feel-is-the-message/915257 (page returned 403, details from search snippet, year likely GDC 2026).
- Street Fighter 6 June 2025 patch raised Manon's Punish Counter hitstop from 11 to 14 frames, a live example of tuning hitstop for confirm readability (snippet of https://srk.shib.live/w/Street_Fighter_6/Terry/Data area, bot-blocked).
- Monster Hunter Wilds (beta late 2024, release 2025) shipped with reduced hitstop and drew player backlash. https://www.pcgamer.com/games/rpg/capcom-if-youre-listening-monster-hunter-wilds-needs-its-hitstop-back
- Godot 4.6 (released January 2026) added physics interpolation for MultiMeshInstance2D (dev snapshot note). https://godotengine.org/article/dev-snapshot-godot-4-6-dev-2/ and https://godotengine.org/releases/4.6/
- Godot asset-store game-feel kits (unvetted, not measured). JuiceBox https://jswdb2.itch.io/juicebox and "Godot 4 Combat Hit Feel Toolkit" https://mtw1man2.itch.io/godot-4-combat-hit-feel-toolkit-hitstop-screen-shake-damage-numbers
- Academic, 2024: Hicks et al. "Juicy Audio" (above). "Understanding the Design of Emotionally Impactful Game Feel" (ACM, DOI 10.1145/3665463.3678781, likely CHI PLAY 2024 companion) https://dl.acm.org/doi/fullHtml/10.1145/3665463.3678781 (403, not read).

### Gaps
- No 2025-2026 controlled study on hitstop or shake found. No CHI PLAY 2025 juice paper surfaced in search. Treat this section as thin.

---

## Q6. Translation to a top-down 32 px MMO with a shared screen

Rule of thumb (inference): anything that moves the camera or changes time is for the local player only. Anything that changes position, hit/miss or cooldowns is server-authoritative and must look the same for everyone. Decoration of other players' hits is local and should be scaled down.

| Trick | Who sees it | Rule for Asterion |
|---|---|---|
| Global hitstop / sleep (Nijman, Celeste Freeze) | nobody | Never. It pauses everyone's view and desyncs the client clock from the server tick |
| Per-sprite hitstop (freeze attacker and victim anims) | everyone, local render | OK as client presentation. 3 to 6 frames normal, up to about 12 on crit/kill. Do not hold the sprite's server position. Shorter (or none) on hits that do not involve the local player, following Smash Ultimate's player-count scaling |
| Sprite shake during hitstop (Sakurai) | everyone | OK. Shake sprite only, 1 to 2 px, horizontal, decaying. Hitbox and click target stay still |
| Screen shake / camera kick (Nijman, Eiserloh) | local player only | Only for events involving you (you hit hard, you got hit, a boss slam near you). Trauma model, cubed, whole-pixel offsets, no or minimal rotation. Slider 0 to 100% |
| White flash / hit flash | everyone | OK on the struck sprite. Budget simultaneous flashes. Others' flashes can be dimmer than yours |
| Knockback (Nijman) | everyone, server | Server decides tiles moved. Client may add a 1 to 3 px visual recoil that returns to the tile, which is pure decoration |
| Player knockback in PvP | everyone, server | Crowd control. Needs diminishing returns (PvP researcher) |
| Permanence (corpses, debris, smoke) | everyone | Local, capped count, fade after N seconds. Cost scales with crowd |
| Damage numbers | per viewer | Full size for numbers you deal or take. Others' numbers smaller, fewer or off by setting |
| Camera lerp / look-ahead (Eiserloh asymptotic average) | local | OK. k about 0.1 at 60 fps, scaled by delta. Look-ahead toward aim cursor for skillshots only |
| Slow motion | nobody | Never in shared world. Only in local-only scenes (death cam for yourself) |
| Muzzle flash / cast flare / bass | everyone, local | OK. Audio voice limits per the audio researcher |
| Hitstun as gameplay | server | Avoid or keep tiny. Fighting-game hitstun numbers (12 to 21 frames) would be heavy CC in an MMO |

---

## Sources
- Sakurai, Famitsu vol. 490 (Source Gaming translation): https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/
- SmashWiki, Hitlag: https://www.ssbwiki.com/Hitlag
- Sonic Hurricane, Impact Freeze: https://sonichurricane.com/?p=1043
- SuperCombo SF6 data (bot-blocked, snippet only): https://srk.shib.live/w/Street_Fighter_6/Terry/Data
- Dustloop GGST Attack Attributes (403, snippet only): https://dustloop.com/w/GGST/Attack_Attributes
- Celeste source: https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- PC Gamer on MH Wilds hitstop: https://www.pcgamer.com/games/rpg/capcom-if-youre-listening-monster-hunter-wilds-needs-its-hitstop-back
- Nijman talk: https://www.youtube.com/watch?v=AJdEqssNZ-U
- Nijman trick timestamps: https://theengineeringofconsciousexperience.com/jan-willem-nijman-vlambeer-the-art-of-screenshake/
- Mary Rose Cook notes: http://notebook.maryrosecook.com/Theartofscreenshake,JanWillemNijman.html
- Eiserloh slides: http://www.mathforgameprogrammers.com/gdc2016/GDC2016_Eiserloh_Squirrel_JuicingYourCameras.pdf
- Eiserloh GDC Vault: https://www.gdcvault.com/play/1023557/Math-for-Game-Programmers-Juicing
- Juice it or lose it, GDC Vault: https://gdcvault.com/play/1016487/Juice-It-or-Lose
- Juicy Breakout source: https://github.com/grapefrukt/juicy-breakout
- Don't Juice It or Lose It: https://gdcvault.com/play/1020861/Don-t-Juice-It-or
- Juice summary: https://gamejuice.pages.dev/articles/juice-it-or-lose-it-lessons
- Swink summary: https://gamejuice.pages.dev/articles/swink-6-components-game-feel
- Swink book-club recap: https://redlib.hackliberty.org/r/GameDevelopment/comments/1kg51wo/better_game_design_with_a_book_club_game_feel
- Bayreuth GxD slides: https://medienwissenschaft.uni-bayreuth.de/wp-content/uploads/GxD-07-Interfaces.pdf
- Pichlmair and Johansen: https://arxiv.org/abs/2011.09201
- Gabler et al. 2005: https://www.gamedeveloper.com/game-platforms/how-to-prototype-a-game-in-under-7-days
- MDA: https://users.cs.northwestern.edu/~hunicke/MDA.pdf
- GMTK subtitles page: https://amara.org/v/C3BGA
- Kao 2020 (dblp): https://dblp.uni-trier.de/rec/journals/entcom/Kao20.html
- Hicks et al. 2019 CHI PLAY: https://bibtex.github.io/CHI-PLAY-2019-HicksGDA.html
- Hicks thesis: https://core.ac.uk/download/492524999.pdf
- Hicks et al. 2018 DiGRA: https://dl.digra.org/index.php/dl/article/view/936
- Hicks, Rogers, Gerling, Nacke 2024: https://eprints.staffs.ac.uk/8527/1/3677084.pdf
- Smets and van der Spek 2021: https://research.tue.nl/en/publications/that-sounds-juicy-exploring-juicy-audio-effects-in-video-games/
- Singhal and Schneider 2021: https://uwaterloo.ca/haptic-experience-lab/projects/juicy-haptic-design-vibrotactile-embellishments-can-improve
- Tomizawa and Ishikawa 2024: https://scitepress.org/publishedPapers/2024/124614/pdf/index.html
- Lin et al. 2022: https://arxiv.org/abs/2208.06155
- KAKEN 22K18649: https://kaken.nii.ac.jp/en/report/KAKENHI-PROJECT-22K18649/22K186492023hokoku
- Claypool and Claypool 2006: https://ftp.cs.wpi.edu/pub/techreports/pdf/06-13.pdf
- XAG 117: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117
- XAG 118: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/118
- Harding FPA: https://www.hardingfpa.com/
- Game Accessibility Guidelines: https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/
- GDC Battlefield 6 session: https://schedule.gdconf.com/session/battlefield-6-game-feel-is-the-message/915257
- Godot 4.6: https://godotengine.org/releases/4.6/ and https://godotengine.org/article/dev-snapshot-godot-4-6-dev-2/
- JuiceBox: https://jswdb2.itch.io/juicebox
- Godot hit feel toolkit: https://mtw1man2.itch.io/godot-4-combat-hit-feel-toolkit-hitstop-screen-shake-damage-numbers
- Emotionally impactful game feel (not read): https://dl.acm.org/doi/fullHtml/10.1145/3665463.3678781
