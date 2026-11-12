# 13. Gap pass on the art side: hit sparks, artist rules, shields, screen feedback, element language

Researcher 13, 2026-11-11. Every claim carries a label.

- READ: I opened the source in this session and read the text or code.
- SNIPPET: search summary or a page summary only.
- INFERENCE: my own reasoning or arithmetic on READ numbers.

Raw files are in `scratch-13/`. The Riot guide text is in `scratch-13/pdf/riot.txt`.

---

## 1. Hit sparks and explosions with real frame counts

### Takeaway
A stock fighting-game hit spark is 5 to 14 drawn frames and lasts 167 to 283 ms. Strength changes the art and the easing more than the length. The heavy spark does not last longer than the light one. It plays its first frames faster (1 tick each) and its tail slower (2 ticks each). Block sparks slide 1 px per step away from the defender. Almost every spark frame is drawn additive.

### Cited findings

MUGEN 1.1 stock `data/fightfx.air`. READ. https://github.com/Tunlan/mugen-1.1b1/blob/HEAD/data/fightfx.air
The file lists each frame as `group, image, offx, offy, duration, flip, drawtype`. Duration is in game ticks. `A` is additive, `A1` is a second additive mode.

| Action | Effect | Entries | Total ticks | ms at 60 ticks/s | Notes |
|---|---|---|---|---|---|
| 0 | Light hit spark | 6 | 12 | 200 | 2 ticks each, all additive |
| 1 | Medium hit spark | 5 | 10 | 167 | 2 ticks each, all additive |
| 2 | Strong hit spark | 10 | 13 | 217 | 5 frames at 1 tick, 2 at 2 ticks, then reuses medium frames 2 to 4 as the tail |
| 3 | Very strong hit spark | 8 | 10 | 167 | frame 0 drawn opaque for 1 tick, then the same frame additive |
| 10, 11 | Weak, medium blood spark | 6 | 12 | 200 | opaque, not additive |
| 12 | Strong blood spark | 11 | 22 | 367 | repeats frames 0 and 1 twice before the spray |
| 40 | Guard spark | 10 (5 sprites) | 13 | 217 | x offset steps 10 to 19 px, 1 px per entry. First 4 opaque, last 6 additive |
| 60, 61, 62 | Ground shockwave small, medium, strong | 5, 7, 11 | 10, 14, 23 | 167, 233, 383 | opaque start, additive end |
| 70, 71, 72 | Wall-hit shockwave light, medium, strong | 3, 5, 8 | 8, 10, 19 | 133, 167, 317 | light and medium ping-pong 2 or 3 sprites |
| 100, 101, 102 | Super effect level 1, 2, 3 | 12, 13, 15 | 30, 31, 31 | 500, 517, 517 | alternates 3 and 2 tick holds, loops 5 frames twice |
| 120 | Small floor dust | 9 | 27 | 450 | drifts up 1 px per frame pair, ends additive |
| 130 | Power up effect | 8 (4 sprites) | 8 | 133 | each sprite 1 tick opaque then 1 tick additive |

The same table ships unchanged in a Capcom vs SNK fan build, plus a 6-entry, 16-tick "Roman Cancel" action. READ. https://github.com/mredraith/CVS-P/blob/HEAD/data/fightfx.air

Ikemen GO screenpack `data/fightfx.air` (the modern default). READ. https://github.com/ikemen-engine/Ikemen-GO-Screenpack/blob/HEAD/data/fightfx.air

| Effect | Frames | Ticks | ms |
|---|---|---|---|
| Light, medium, strong hit spark | 14 each | 14 | 233 |
| Very strong hit spark | 17 | 17 | 283 |
| Guard spark | 12 | 12 | 200 |
| Small, medium ground shockwave | 10 | 10 | 167 |
| Strong ground shockwave | 17 | 17 | 283 |
| Wall-hit shockwaves | 15 | 15 | 250 |
| Super effects level 1, 2, 3 | 30, 31, 31 | 30, 31, 31 | 500, 517, 517 |
| Power up | 22 | 22 | 367 |
| Blood sparks weak, medium | 10, 12 | 20, 18 | 333, 300 |

Every hit spark frame in the Ikemen file holds 1 tick and is additive. The newer art uses more frames for the same wall-clock time.

Free pixel VFX packs on itch.io, what the pages state.

| Pack | Stated numbers | Label | URL |
|---|---|---|---|
| CodeManu, Pixelart Effect Pack | 20 effects, frame size 100x100 px, zip 1.4 MB, rated 4.9 from 69 ratings. No frame counts or fps on the page | READ | https://codemanu.itch.io/pixelart-effect-pack |
| BDragon1727, Free Effect and Bullet 16x16 | 16x16 px grid, 138 kB, rated 5.0 from 63. No counts or fps stated | READ | https://bdragon1727.itch.io/free-effect-and-bullet-16x16 |
| Pimen, Fire Spell Effect 02 | Explosion 1 is 14 frames. Explosion 2 is 5 startup frames plus 11 frames, 3 of them loopable. 11 kB. Rated 5.0 from 37 | READ | https://pimen.itch.io/fire-spell-effect-02 |
| XYEzawr, Free Pixel Effects Pack 5 (blood) | 100x100 px, authored at 30 and 60 fps, 76 kB, rated 4.9 from 25 | READ | https://xyezawr.itch.io/gif-free-pixel-effects-pack-5-blood-effects |
| Will Tice (unTied Games), Five Free Pixel Explosions | 5 explosions free, 40 in the full pack (10 styles x 4 colour themes), "designed to be played at 60 FPS", 973 kB | READ | https://untiedgames.itch.io/five-free-pixel-explosions |

### Inferences
- INFERENCE. The ms column assumes MUGEN's 60 ticks per second. That is the engine's documented rate, but I did not open the doc page in this session.
- INFERENCE. For Kingsfoil at 75 ms per Tibia-style effect frame, a 200 ms spark is 3 frames. The fighting-game data says a spark longer than about 280 ms reads as a different thing (a shockwave or a super). Keep basic hit sparks at 3 frames and give heavy hits a faster first frame instead of extra length.
- INFERENCE. The Pimen "startup + loop + end" split (5 + 3 loop + 8) is the right shape for a channelled or lingering effect. One sheet covers cast, hold and release.
- INFERENCE. The guard spark recipe is cheap and readable. Slide 1 px per step away from the defender, opaque first, additive last. A shield hit reaction can reuse it.
- INFERENCE. Ordered by canvas, the packs cluster at 16x16 for bullets and 100x100 for bursts. On a 32 px tile grid a 100 px burst covers about 3x3 tiles, which matches a Tibia area spell more than a single-target hit.

### Gaps
- No Capcom or Arc System Works primary data. I found no frame listing for Street Fighter II, III or Alpha sparks, Guilty Gear or Marvel vs Capcom. One search returned nothing usable. The MUGEN stock set is Elecbyte's own art, not a Capcom rip.
- Metal Slug explosion frame counts: not found. Search returned only unused-graphics pages without counts. https://randomhoohaas.flyingomelette.com/msmia/1/ug.html (SNIPPET, not opened).
- Spark canvas sizes are in the `.sff` sprite file, which is binary. I did not parse it.
- CodeManu and BDragon1727 pages give no per-effect frame counts. Someone has to open the sheets by eye.

---

## 2. Artist rules from primary sources

### Takeaway
I read the full Riot PDF (37 pages) from a Wayback copy. Three of the four second-hand claims are wrong or loosely worded. The guide has no "peak in the first 25%" rule, no tertiary tier, and no ranking by damage, crowd control and dodgeability. The "no 100% or 0%" rule is real and applies to both value and saturation. The 25% figure comes from VFX Apprentice's summary article, not from Riot.

### Cited findings

Riot, "The complete guide to creating visual effects within League of Legends", October 2017. READ in full via Wayback. The live link now redirects to the leagueoflegends.com home page (READ, HTTP 301).
- Original URL: https://nexus.leagueoflegends.com/wp-content/uploads/2017/10/VFX_Styleguide_final_public_hidpjqwx7lqyx0pjj3ss.pdf
- Working copy: https://web.archive.org/web/2018if_/https://nexus.leagueoflegends.com/wp-content/uploads/2017/10/VFX_Styleguide_final_public_hidpjqwx7lqyx0pjj3ss.pdf (12.5 MB)
- Thread with the link and a note that a user re-hosted it after it went down: https://realtimevfx.com/t/official-league-of-legends-vfx-style-guide/3392 (READ)

Claim check.

| Second-hand claim | Verdict | What the PDF says |
|---|---|---|
| Peak brightness inside the first 25% of life | NOT in the PDF | Timing section (pp. 31 to 36) has no percentages or durations. It says all effects need "anticipation and dissipation" and praises "dynamic timing" over linear timing (Ekko R, p. 35) |
| No pure white or black in the effect body | CONFIRMED, wider than claimed | p. 13: "Avoid using 100% or 0% values". The stated reason is confusion with environment or UI. p. 19 repeats the same line for saturation |
| Primary, secondary, tertiary hierarchy | Only two tiers | pp. 6 to 7 define primary and secondary elements. The word tertiary does not appear |
| Importance ranked by damage, crowd control, dodgeability, impact | NOT in the PDF | p. 11 gives a six-step scale by spell type, listed below |

Primary and secondary traits, p. 7. READ.
- Primary: high value range, strong contrast in value or saturation, clear silhouette, high opacity, strong shape, intense movement.
- Secondary: lower value range, small size, blurry silhouette, low opacity, simple shape, subtle movement.
- p. 6: the secondary element "supports the primary element by pushing value and saturation" and may use several hues.

Scale of importance, p. 11. READ. Controlled by "size, shape, timing, value, saturation and opacity".

| Step | Traits listed |
|---|---|
| Idle particle | low opacity, blurry shapes, subtle movement |
| Basic attack | small size, low opacity, blurry shapes, subtle movement |
| Defensive spell | low saturation, high opacity, clear silhouette |
| Damage spell | high saturation, high opacity, high value range, clear silhouette, intense movement |
| Game changer | high saturation, high opacity, high value range, large size |
| Ultimate | highest saturation, highest opacity, highest value range, impactful animation |

Other rules worth keeping. READ.
- p. 10: three checks for importance are readable, emphasis, scale of importance.
- p. 8: Teemo's mushroom has a 600-unit radius but the old explosion art covered half of it. The fix was a subtle ring plus art that matches the real area.
- p. 9: draw area effects at ground level so the camera angle does not shift them (DJ Sona).
- p. 15: push value to the centre of the effect so there is a visual centre (Ziggs).
- p. 17: a manual dark backing can raise contrast, used "with caution".
- p. 20: a champion's VFX has a higher and wider value and saturation range than its model.
- p. 21: with two complementary colours, one must be secondary. Bard's Q uses desaturated low-opacity purple against bright yellow.
- p. 28: textures are hand-painted with concise detail, a mix of soft and sharp shapes.
- p. 30: fast particles without motion blur create noise and look like dropped frames.
- p. 32: outros count as a secondary effect, with lower value, saturation and opacity. Fading energy shows through value, hue, saturation, opacity or size.
- p. 36: "We intentionally minimize an effect's linger duration". The good example keeps some transparency even at its peak.
- p. 26 has an ally indicator and an enemy indicator palette, but they are images. The text gives no hex values.
- Named palette themes (pp. 22 to 25): void, poison, heal, frost, gun powder, arcane, shadow isle, nature, celestial, wind, hextech, water. Swatches are images only.

Shields in the Riot guide. READ. There is no shields section. Shields appear twice as examples.
- p. 6, Project Leona W: the primary element is the border of the shield circle, because players must read the radius. The faint electric energy inside is secondary.
- p. 21, Lulu's shield is the bad example. Two complementary colours at high opacity and high saturation fight each other.

VFX Apprentice, "10 Design Tips from the League of Legends VFX Style Guide". READ (page summary). https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
- This is where the timing number comes from. The article places the peak "within the first quarter" of the lifespan. It is the article's gloss, not Riot's text.
- It also restates no 0% black and no 100% white, and says long-lived particles cost overdraw on low-spec machines.

VFX Apprentice, "The Soul of Effects: What is Timing in VFX?". READ (page summary). https://www.vfxapprentice.com/blog/the-soul-of-effects-what-is-timing-in-vfx
- Phases named: wind-up, climax, fall-off. No durations for any phase.
- Heartbeat rule: pace under 60 BPM for heals, faster for attacks. That is one beat per 1000 ms or slower for a heal loop.
- The example timing chart spans 0 to 48 frames.
- Fireball split: buildup is a rhythm, cast is an impulse, travel is a rhythm, impact is an impulse.
- Instant effects skip anticipation and open at full intensity.

Jason Keyser timing workshop page lists windup, crescendo, follow-through, dissipation. SNIPPET. https://www.vfxapprentice.com/blog/learn-timing-for-vfx-with-jason-keyser

### Inferences
- INFERENCE. The MUGEN data in section 1 supports the "first quarter" idea with real numbers. The strong spark spends 5 of 13 ticks on its 5 fastest frames and reuses weaker frames for the tail.
- INFERENCE. For a pixel-art palette ramp, "avoid 100% and 0%" means the top ramp step is an off-white tinted to the element and the bottom step is a dark tinted colour. Reserve true white for the 1-frame hit flash that the combat juice study already covers.
- INFERENCE. The six-step scale maps onto Kingsfoil's tiers. Buffs and shields sit at "defensive spell" (low saturation, clear silhouette), which is the reverse of what many indie games do with loud shield bubbles.

### Gaps
- Dota 2 Character Art Guide: not read. The Valve PDF URL now serves a 1-page stub that points to a support page (READ: https://media.steampowered.com/apps/dota2/workshop/Dota2CharacterArtGuide.pdf). The support page is JavaScript-only (1.3 kB of text). A 7 MB Wayback copy of the old PDF downloaded, but its text layer is empty, so the value and saturation rules need a human reader. Wayback URL: https://web.archive.org/web/2014if_/http://media.steampowered.com/apps/dota2/workshop/Dota2CharacterArtGuide.pdf
- No Keyser source gave anticipation or dissipation in ms. His numbers sit behind paid courses.
- Riot's palette swatches and value-range bars are images. Nobody has sampled them.

---

## 3. Shields and barriers in shipped games

### Takeaway
The classic games draw a shield in one of three ways and none of them is expensive. Tibia draws nothing persistent and shows the shield only when it is hit. Diablo II loops a 24-frame overlay split into a back half and a front half, and plays a separate 9-frame hit overlay picked from 8 directions. Shattered Pixel Dungeon uses one soft additive disc that grows and fades when the shield ends. Riot's rule for a shield is that the rim is the message.

### Cited findings

| Game | Form | Loop | Hit reaction | Break or end | Source |
|---|---|---|---|---|---|
| Tibia (TFS) Magic Shield | No bubble. Status icon only | none | `CONST_ME_LOSEENERGY` effect on the target tile plus a blue damage number, sent per absorbed hit | condition removed, no dedicated effect in this code path | READ https://github.com/otland/forgottenserver/blob/master/src/game.cpp (lines 4288 to 4328) |
| Tibia (Canary) | same | none | same effect id and `TEXTCOLOR_BLUE`. Shield has a capacity counter and is removed at 0 | removed when capacity or mana hits 0 | READ https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp (lines 8592 to 8634) |
| Tibia, player-facing | Icon in the conditions bar. Capacity = 7 x magic level + 7.6 x level + max(300, 0.4 x level). Lasts 180 s, cooldown 14 s | n/a | n/a | "the spell effect disappears" when the mana is used up | READ https://tibia.fandom.com/api.php?action=parse&page=Magic_Shield&prop=wikitext&format=json |
| OTClient | `IconManaShield = 16` in the player icon enum | n/a | n/a | n/a | READ https://github.com/edubart/otclient/blob/master/src/client/const.h |
| Diablo II Energy Shield | `ManaShieldBall`, 8 frames, AnimRate 8, Trans 5, light colour 255 red channel listed | 8 frames | `energyshieldhit0` to `hit7`, 9 frames each, AnimRate 16, sprite files `ManaShieldDir00` to `Dir14`. Hits 3, 4, 5 are PreDraw 1 (behind the body), the other five in front | none listed | READ https://github.com/fabd/diablo2/blob/master/code/d2_113_data/Overlay.txt |
| Diablo II Bone Armor | `bonearmor_cast` 12 frames (`BoneShieldEmerge`), then `bonearmor_front` 24 frames and `bonearmor_back` 24 frames (PreDraw 1), AnimRate 16 | 24 frames | none listed | none listed | READ same file |
| Diablo II Frozen, Shiver, Chill Armor | all three reuse `FrozenArmor`, 24 frames, AnimRate 16, light radius 1 growing to 13 | 24 frames | `*_hit` overlays reuse `AuraResistColdCast`, 11 frames, AnimRate 24, PreDraw 1, offsets 14, -14, -60 | none listed | READ same file |
| Diablo II Cyclone Armor | three tiers A, B, C, each a front and a back overlay of 11 frames, AnimRate 16 | 11 frames | none listed | tier swap as the shield weakens (INFERENCE from the A, B, C naming) | READ same file |
| Ragnarok Kyrie Eleison | effect 112, a `STR` layered animation `kyrie` attached to the entity, with a reduced variant `kyrie_min` and a cast sound | file not parsed | n/a | n/a | READ https://github.com/vthibault/roBrowser/blob/master/src/DB/Effects/EffectTable.js and https://github.com/vthibault/roBrowser/blob/master/src/DB/Skills/SkillEffect.js |
| Ragnarok Energy Coat | effect 169, `STR` `energycoat`, attached to the entity | file not parsed | n/a | n/a | READ same |
| Ragnarok Safety Wall | effect 315, `STR` `safetywall`, not attached (stays on the ground cell) | file not parsed | n/a | n/a | READ same |
| Ragnarok Pneuma | ground effect 141, picks 1 of 3 files at random (`pneuma1` to `pneuma3`) | file not parsed | n/a | n/a | READ same |
| Shattered Pixel Dungeon `ShieldHalo` | one additive disc, colour 0xBBAACC, radius = half the sprite's diagonal, centred on the sprite | static, no animation | none | `putOut()`: over about 1 s the disc scales from 1x to 2x radius while alpha falls to 0 | READ https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/ShieldHalo.java |
| SPD `Halo` texture | 257x257 px, built once from 64 stacked filled circles at alpha 8 of 255 | n/a | n/a | n/a | READ https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/SPD-classes/src/main/java/com/watabou/noosa/Halo.java |
| League of Legends | rim of the shield circle is the primary element, interior energy is secondary | n/a | n/a | n/a | READ Riot PDF p. 6 (section 2) |
| Magicka | Shield is its own element, key E, typed "Shield", "can be boosted", and is its own opposite | n/a | n/a | n/a | READ https://magicka.fandom.com/api.php?action=parse&page=Elements&prop=wikitext&format=json |

Related detail. RO's `kyrie_min` entry shows that the 2002 client already shipped a low-effect variant per spell (READ, same EffectTable file).

### Inferences
- INFERENCE. If note 05 is right that Overlay `AnimRate` is frames per second, the 24-frame armor loops last 1.5 s, the 9-frame Energy Shield hit lasts 0.56 s, the 8-frame shield ball at rate 8 lasts 1.0 s and the 12-frame Bone Armor cast lasts 0.75 s. Other D2 modding docs give other units, so treat the seconds as provisional.
- INFERENCE. The Energy Shield hit set is the best cheap hit reaction I found. Eight directional 9-frame flashes, drawn behind the body when the hit comes from behind. For Kingsfoil a 4-direction, 3-frame version costs 12 small frames.
- INFERENCE. Tibia's choice (no persistent bubble, effect only on hit) is the crowd-safe option for 30 players. A persistent loop per shielded player is 30 extra animated overlays. A hit-only spark costs nothing while idle.
- INFERENCE. The SPD break (scale 1x to 2x while fading over 1 s) is a 2-line tween and reads as a pop. At 75 ms steps that is about 13 steps. 4 to 6 steps over 300 to 450 ms fits the spark timings in section 1 better.
- INFERENCE. Cyclone Armor's three art tiers show remaining strength without a bar. Three states is enough.

### Gaps
- WoW Power Word: Shield, Hades shields and League's shield bar convention: no source opened. Wayback returned 429 for the WoW wiki. The 80.lv Hades effects article served only its introduction (READ: https://80.lv/articles/a-behind-the-scenes-look-at-the-effects-in-hades).
- What the official Tibia client draws around a shielded character in 12.x and later (the capacity display beside the mana bar) is SNIPPET only: https://www.tibiaqa.com/20726/how-does-the-magic-shield-work-after-vocation-adjustments
- RO `.str` files are binary. Layer counts and frame counts for Kyrie and Safety Wall were not extracted.
- D2 Overlay `Trans` values (3 and 5) were not decoded to blend modes.

---

## 4. Screen feedback strengths and durations

### Takeaway
Shipped damage flashes are weaker and shorter than most people guess. Luanti caps the red flash at 50% alpha and clears it in 0.33 s. Quake's smallest hit is a 12% red blend gone in 0.2 s and its cap is 59% for 1.0 s. Veloren's low-health vignette starts under 10% health and pulses at 0.23 to 0.53 Hz, far below the 3 Hz photosensitivity line. Flash strength scales with damage in all three first-person examples.

### Cited findings

| Game | Trigger | Colour | Strength | Duration or rate | Source |
|---|---|---|---|---|---|
| Luanti (Minetest) damage flash | any damage while alive, if `hurt_flash_enabled` | RGB 180, 0, 0 full-screen rectangle | alpha += 95 + 64 x (damage / max HP), capped at 127 of 255 (50%) | decays 384 alpha units per second. Smallest hit lasts 0.25 s, capped flash 0.33 s | READ https://github.com/luanti-org/luanti/blob/master/src/client/game.cpp (lines 2209 to 2226, 3573 to 3577, 3717 to 3724) |
| Luanti hurt tilt | same | camera tilt | strength = damage ratio x 5, clamped 1 to 4 | timer 1.5 falling at 6 per second = 0.25 s | READ same file |
| Quake damage blend | damage message | 255, 0, 0 with no armor. 220, 50, 50 with some armor. 200, 100, 100 when armor took more than health | percent += 3 x max(10, (blood + armor) / 2), capped at 150. Alpha = percent / 255, so 12% minimum and 59% cap | falls 150 per second. 0.2 s minimum, 1.0 s at cap | READ https://github.com/id-Software/Quake/blob/master/WinQuake/view.c (lines 316 to 361, 497, 557) |
| Quake pickup flash | item pickup | 215, 186, 69 | 50 of 255 (20%) | falls 100 per second = 0.5 s | READ same file (lines 405 to 408, 562) |
| Quake steady tints | powerups and liquids | quad 0, 0, 255 at 30 (12%). Suit 0, 255, 0 at 20 (8%). Invulnerability 255, 255, 0 at 30. Invisibility grey 100 at 100 (39%). Water 130, 80, 50 at 128. Slime 0, 25, 5 at 150. Lava 255, 80, 0 at 150 | constant | while active | READ same file (lines 254 to 257, 440 to 473) |
| DOOM damage palette | `damagecount` += damage, capped at 100 | 8 pre-tinted red palettes (indices 1 to 8) | palette index = (count + 7) >> 3, capped at 8 | count ticks down in player code I did not open | READ https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/st_stuff.c (lines 71 to 76, 1000 to 1049) and https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/p_inter.c (lines 51, 875 to 878) |
| DOOM pickup palette | each pickup adds `BONUSADD` = 6 | 4 bonus palettes (indices 9 to 12) | same shift rule | short | READ same files |
| Shattered Pixel Dungeon `GameScene.flash(color)` | boss events, big spells | caller's colour, additive by default | full-screen block starts at alpha 1.0 | linear fade over `FADE_TIME` = 1 s | READ https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/scenes/GameScene.java (lines 1548 to 1566) and https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/scenes/PixelScene.java (lines 374, 423 to 465) |
| SPD sprite hit flash | `CharSprite.flash()` | sprite goes full white | n/a | `FLASH_INTERVAL` = 0.05 s (50 ms) | READ https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/CharSprite.java (lines 74, 359 to 362) |
| Veloren low-health frame | health under 10% and not dead | full-window `hurt_bg` image | alpha = sin(phase) x 0.5 + 0.6, so 0.1 to 1.0 after clamping | phase advances 10 / clamp(health %, 3, 7) rad per second. 0.23 Hz at 7 to 10% health, 0.53 Hz at 3% or less | READ https://github.com/veloren/veloren/blob/master/voxygen/src/hud/mod.rs (lines 1606 to 1618) |
| Veloren low-HP colour | HUD constant `LOW_HP_COLOR` | RGB 0.93, 0.59, 0.03 (amber, not red) | n/a | n/a | READ same file (line 165) |
| DOOM + DOOM II (2024 release) | accessibility menu has "Screen Flash Effects" to turn most full-screen flashes off | n/a | n/a | n/a | SNIPPET https://slayersclub.bethesda.net/en-NZ/article/doom-doomii-accessibility-guide |

### Inferences
- INFERENCE. A safe default for Kingsfoil from these numbers. Damage vignette alpha 0.12 to 0.5 scaled by damage over max health, cleared in 200 to 330 ms. Pickup or heal tint 0.2 alpha for 500 ms. Low-health pulse below 10% health at 0.25 to 0.5 Hz. All of these stay one flash per event and well under 3 flashes per second.
- INFERENCE. SPD's 1 s full-alpha additive flash is the strongest value in the table. It works there because the game is turn-based and uses it for rare events. In real-time PvP with 30 casters it would breach the limits in note 07 if two players could trigger it.
- INFERENCE. Quake tints the flash by what absorbed the hit (pure red for flesh, pink for armor). The same idea gives a free shield cue. Tint the damage vignette blue when a mana shield took the hit, to match Tibia's blue damage number.
- INFERENCE. Veloren speeds the pulse as health drops (period 4.4 s down to 1.9 s). Rate carries the urgency, so the alpha can stay moderate.
- INFERENCE. DOOM's whole flash is a palette swap among 13 prebuilt palettes. On a palette-indexed renderer the full-screen tint costs zero overdraw.

### Gaps
- Hades, Dead Cells, Vampire Survivors and Halls of Torment flash options: no source confirmed a setting name or a value. One search, nothing usable.
- DevilutionX, Mindustry, OpenRA and Xonotic were not opened. I downloaded DevilutionX `player.cpp` and found no flash code in it.
- Heal tint: no shipped number found. The Quake pickup flash is the nearest proxy.
- The DOOM per-tic decrement of `damagecount` lives in `p_user.c`, not opened.

---

## 5. Cast circles and element language in games the others skipped

### Takeaway
This is the weakest section. The wikis that answer `api.php` describe mechanics, not colours, and the art-facing pages were blocked. Two things are solid. Magicka ties each element to a delivery shape (spray, beam, projectile, lightning, shield), which is shape language by rule. Riot names its palette themes but publishes the colours only as images.

### Cited findings

| Game | Element | Hue | Shape or delivery | Motion | Label and source |
|---|---|---|---|---|---|
| Magicka | Water | not stated | spray | wets, knockback | READ https://magicka.fandom.com/api.php?action=parse&page=Elements&prop=wikitext&format=json |
| Magicka | Fire | not stated | spray | damage over time, causes panic | READ same |
| Magicka | Cold | not stated | spray | chills, freezes wet targets | READ same |
| Magicka | Lightning | not stated | lightning arc | "jumps to nearby units" | READ same |
| Magicka | Life | not stated | beam | locks on, heals | READ same |
| Magicka | Arcane | not stated | beam | locks on, explosive | READ same |
| Magicka | Earth | not stated | single projectile | knockdown | READ same |
| Magicka | Ice (water + cold) | not stated | projectile, "multiple shards" | piercing | READ same |
| Magicka | Steam (water + fire), Poison (water + arcane) | not stated | spray | wets, or damage over time | READ same |
| Magicka | Shield | not stated | shield | static barrier, can be boosted | READ same |
| Golden Sun | Mars (fire), Venus (earth), Mercury (water and ice), Jupiter (wind). Opposed pairs are Mars and Mercury, Venus and Jupiter | not stated in the text | not stated | not stated | READ https://goldensunwiki.net/w/api.php?action=parse&page=Element&prop=wikitext&format=json |
| Wizard of Legend | Fire, Air, Earth, Lightning, Water, Chaos. Signature arcana charge by attacking and drain when idle | not stated | not stated | not stated | SNIPPET https://en.wikipedia.org/wiki/Wizard_of_Legend |
| League of Legends | palette themes named: void, poison, heal, frost, gun powder, arcane, shadow isle, nature, celestial, wind, hextech, water, plus ally and enemy indicator | swatches are images | n/a | n/a | READ Riot PDF pp. 22 to 26 |
| League (via VFX Apprentice) | healing greener, frost bluer, gunpowder orange-red | green, blue, orange-red | n/a | n/a | READ (page summary) https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips |

Magicka precedence. READ, same page. When elements combine, one delivery type wins. Arcane's beam beats water's spray, and Earth's single projectile beats Ice's shard barrage.

### Inferences
- INFERENCE. Magicka's rule is the useful part for Kingsfoil. Give each element one delivery shape and keep it across every spell of that element. Then a colour-blind player reads "spray means fire or cold, beam means holy or arcane" from motion alone.
- INFERENCE. Golden Sun's opposed pairs (fire against water, earth against wind) suggest picking opposed elements from opposite sides of the hue wheel, so that a resisted hit looks different from a strong one.

### Gaps
- Hues for every game in this section are unsourced. Genshin (Fandom API returned 402, the Wayback copy had no usable text), Wizard of Legend (wiki.gg returned a 403 challenge), Secret of Mana and Trials of Mana were not reached.
- No cast-circle source at all. Nothing found on Golden Sun psynergy cast rings, Genshin element sigils or Wizard of Legend's signature charge visuals.
- The Golden Sun wiki page has more sections than I scanned. A colour table may sit lower on the page.

---

## Sources

Opened and read (READ)
- MUGEN 1.1 stock fightfx: https://github.com/Tunlan/mugen-1.1b1/blob/HEAD/data/fightfx.air
- Ikemen GO screenpack fightfx: https://github.com/ikemen-engine/Ikemen-GO-Screenpack/blob/HEAD/data/fightfx.air
- CVS-P fightfx: https://github.com/mredraith/CVS-P/blob/HEAD/data/fightfx.air
- Riot VFX style guide PDF, Wayback copy: https://web.archive.org/web/2018if_/https://nexus.leagueoflegends.com/wp-content/uploads/2017/10/VFX_Styleguide_final_public_hidpjqwx7lqyx0pjj3ss.pdf
- Real-Time VFX thread: https://realtimevfx.com/t/official-league-of-legends-vfx-style-guide/3392
- Riot art education, VFX episode (no rules on the page): https://www.riotgames.com/en/artedu/visual-effects
- VFX Apprentice, 10 tips: https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
- VFX Apprentice, timing: https://www.vfxapprentice.com/blog/the-soul-of-effects-what-is-timing-in-vfx
- CodeManu pack: https://codemanu.itch.io/pixelart-effect-pack
- BDragon1727 pack: https://bdragon1727.itch.io/free-effect-and-bullet-16x16
- Pimen pack: https://pimen.itch.io/fire-spell-effect-02
- XYEzawr pack: https://xyezawr.itch.io/gif-free-pixel-effects-pack-5-blood-effects
- Will Tice pack: https://untiedgames.itch.io/five-free-pixel-explosions
- The Forgotten Server game.cpp: https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- Canary game.cpp: https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp
- OTClient const.h: https://github.com/edubart/otclient/blob/master/src/client/const.h
- TibiaWiki Magic Shield via API: https://tibia.fandom.com/api.php?action=parse&page=Magic_Shield&prop=wikitext&format=json
- Diablo II 1.13 Overlay.txt: https://github.com/fabd/diablo2/blob/master/code/d2_113_data/Overlay.txt
- roBrowser EffectTable and SkillEffect: https://github.com/vthibault/roBrowser/blob/master/src/DB/Effects/EffectTable.js , https://github.com/vthibault/roBrowser/blob/master/src/DB/Skills/SkillEffect.js
- Shattered Pixel Dungeon ShieldHalo, Halo, GameScene, PixelScene, CharSprite (URLs in sections 3 and 4)
- Luanti game.cpp: https://github.com/luanti-org/luanti/blob/master/src/client/game.cpp
- Quake view.c: https://github.com/id-Software/Quake/blob/master/WinQuake/view.c
- DOOM st_stuff.c and p_inter.c: https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/st_stuff.c , https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/p_inter.c
- Veloren hud/mod.rs: https://github.com/veloren/veloren/blob/master/voxygen/src/hud/mod.rs
- Magicka Elements via API: https://magicka.fandom.com/api.php?action=parse&page=Elements&prop=wikitext&format=json
- Golden Sun Element via API: https://goldensunwiki.net/w/api.php?action=parse&page=Element&prop=wikitext&format=json

Tried and failed
- Riot PDF live URL (301 to home page). Scribd mirror (landing page only): https://www.scribd.com/document/384307037/LoL-Guide
- Dota 2 Character Art Guide (stub PDF, JS-only support page, Wayback PDF with no text layer)
- 80.lv Hades effects article (intro only)
- Genshin Fandom API (402), Wizard of Legend wiki.gg (403), Wayback for several Fandom pages (429)

Search summaries only (SNIPPET)
- https://www.tibiaqa.com/20726/how-does-the-magic-shield-work-after-vocation-adjustments
- https://www.vfxapprentice.com/blog/learn-timing-for-vfx-with-jason-keyser
- https://slayersclub.bethesda.net/en-NZ/article/doom-doomii-accessibility-guide
- https://en.wikipedia.org/wiki/Wizard_of_Legend
- https://randomhoohaas.flyingomelette.com/msmia/1/ug.html
