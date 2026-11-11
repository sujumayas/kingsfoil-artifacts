# 05. Telegraphs, aiming and skillshots, combat text at scale

Researcher angle: how aimed spells are previewed, how enemy attacks are warned, what a miss looks like, and how floating combat text survives a 30-player fight. MOBAs are the main source for aiming because their top-down camera matches ours.

Scratch folder: `scratch-05/` holds the OTClient source files read for Q4 (`animatedtext.cpp`, `map.cpp`).

Unit conversion used throughout (inference, not a cited fact). LoL champions have a gameplay radius of 55, 65 or 80 units, so a typical body is about 130 units wide. A Tibia-like character fills one 32 px tile. So **1 tile is roughly 130 LoL units** if we map by body size. A second mapping by move speed (LoL base run speed is about 330 units/s; an MMO walker at about 4 tiles/s) gives **1 tile is roughly 80 units**. The ratio that transfers cleanly is projectile speed divided by move speed.

---

## Q1. Skillshot indicators and projectile numbers

### Takeaway
- Ship all three LoL cast modes. Normal cast (press, see the indicator, click to confirm), quick cast (fire at the cursor on key down, no indicator) and quick cast with indicator (show on key down, fire on key up). The third mode is the best default for new players in a hybrid game, because it teaches range without adding a click.
- A fast line skillshot in LoL moves about 6x a champion's run speed (Ezreal Q 2000 u/s vs about 330 u/s). Its width is close to one body width (120 vs about 130). In tiles that is about 15 tiles/s, 0.9 tiles wide and 9 tiles of range (body-size mapping).
- Riot's rule is that the hitbox must match the effect, and a projectile must show its direction even in a still frame (blurred tail). The visual must never promise more dodge room than the hitbox gives.
- Every aimed spell has a short wind-up before it leaves the hand (LoL 0.25 s cast time, Dota "cast point"). Movement commands can cancel before that point. After it, the backswing is the cancellable leftover.

### Cited findings
- Ezreal Q Mystic Shot: cast time 0.25 s, speed 2000, width 120, range 1200, hits the first enemy, fires from the caster's position at the end of the cast time. W Essence Flux: 0.25 s, speed 1700, width 160, range 1200. R Trueshot Barrage: 1 s cast, speed 2000, width 320, global range. Ezreal gameplay radius 65, selection radius 115. https://wiki.leagueoflegends.com/en-us/Ezreal
- An older wiki revision of Mystic Shot lists a "queue threshold" of 0.05 s, a tiny input buffer on the skillshot itself. https://wiki.leagueoflegends.com/en-us/Ezreal?oldid=4025148
- "Selection radius" (115) is larger than "gameplay radius" (65). Clicking a target is easier than hitting it. Same source.
- Champion radii are standardised to 55, 65 or 80 units (dev tracker summary of a PBE datamine, April 2024, patch 14.9). https://devtrackers.gg/leagueoflegends/p/b8641c86-pbe-datamine-2024-april-25-patch-14-9-a-few-more-champion-radii-changes
- Edge range is measured from the edge of the source hitbox to the edge of the target hitbox and is used for skillshots. Bigger targets are easier to hit with edge-range spells. The wiki pages disagree on whether line skillshots are center-to-edge or edge-to-edge. https://wiki.leagueoflegends.com/en-us/Gameplay_radius , https://wiki.leagueoflegends.com/en-us/Template:Tip_data/Er
- Cast modes: quick cast fires at the cursor with no indicator. Normal cast shows the indicator and needs a confirm click. Quick cast with indicator shows on key down and casts on key up. Some players report a slight delay with the indicator variant. https://wiki.leagueoflegends.com/en-us/Hotkeys , https://www.mobachampion.com/blog/quick-cast/ , https://wecoach.gg/blog/article/quick-cast-vs-normal-cast-which-is-better-in-league-of-legends
- Guild Wars 2 (a hybrid MMO) has the same split. "Fast" ground targeting shows the indicator and casts on release. "Instant" casts on key down with no indicator. https://guildjen.com/the-best-settings-and-mechanics-for-guild-wars-2
- Riot "Clarity in League" (bananaband1t, 12 March 2021):
  - Players are frustrated when "hitboxes don't line up with their effects." Hecarim was first in line for VFX fixes for that reason.
  - "The amount of attention an ability grabs should match its level of importance." Attention scales with damage, hard CC, dodgeability and play impact.
  - "Projectiles should convey the direction they're traveling, even without motion." Usual method is blurring the tail.
  - Hard CC should have an audio wind-up and a well-defined hitbox (Taric stun). High-impact spells get an advance audio cue (Zoe Q).
  - Spells must not imply more dodgeability than they have. Arcane Comet's big ground circle is the cited bad example.
  - Skins must be at least as clear as the base kit.
  https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/
- Riot VFX update priorities rank hitbox accuracy first, readability and noise reduction second, theme third (secondary coverage). https://www.altchar.com/game-news/how-league-of-legends-vfx-updates-work-aJCpL5Z3RVQy
- Dota 2: the cast animation starts at once and marks the cast point. Backswing is the leftover animation after the cast point, and the unit cannot act until it ends unless the player cancels it. Most items and all toggles have no cast point or backswing. https://liquipedia.net/dota2/Cast_backswing
- Commands can cancel only before the cast or damage point. After that point only a disable or death interrupts. https://www.hiveworkshop.com/threads/how-to-prevent-backswing-animations-cancelation.224453/
- Hero attack point, backswing and projectile speed are tabulated per hero (Zeus attack projectile 1100). https://liquipedia.net/dota2/Attack_backswing , https://dota2.gamepedia.com/Attack_backswing

### Inferences
- Tile conversions for Ezreal Q with the body-size mapping (1 tile = 130 u): 15.4 tiles/s, 0.92 tiles wide, 9.2 tiles range, 0.6 s full flight. With the move-speed mapping (1 tile = 80 u): 25 tiles/s and 15 tiles range. At 32 px tiles and 60 fps, 15 tiles/s is 8 px per frame. That is still readable as a moving sprite. At 25 tiles/s (13 px/frame) a 32 px projectile starts to strobe and needs a trail.
- A starting rule set for Asterion: fast skillshots 10-15 tiles/s, slow dodgeable orbs 5-8 tiles/s, width 0.75-1 tile, range 6-9 tiles. Keep projectile speed at 3-6x walk speed so a dodge is possible at medium range only.
- Generous hitboxes for the player's own skillshots are fine in PvE. In PvP they are unfair to the target. A safer split is a slightly larger projectile hitbox against monsters and an exact one against players. Players can also be given a smaller "hurt circle" than their sprite (see Touhou in Q3).
- The 0.25 s wind-up plus "fires from where the caster is at the end of the cast" is a free latency mask. The server can receive the cast, run the wind-up, and spawn the projectile at the cast point. Clients see the wind-up instantly.
- Selection radius larger than hit radius is a good split for hybrid combat. Click-targeting uses the generous selection shape, aimed spells use the tight one.

### Gaps
- No current Riot article on ground-indicator colours or team colours was found. The 2017 "VFX style guide" URL now redirects to the homepage.
- Mirana Sacred Arrow speed and width were not found in a fetched source.
- Exact delay of LoL "quick cast with indicator" vs quick cast is unmeasured.

---

## Q2. Enemy telegraphs

### Takeaway
- FFXIV snapshots ground AoEs when the marker disappears, not when the explosion animation plays. The animation is feedback after the result. That lets the server resolve on a fixed timestamp while the client plays the boom.
- Telegraph density is a difficulty knob. FFXIV normal content draws orange markers early. High-end content draws them "right before the attack resolves" or not at all, and players read the cast name and animation.
- Colour codes are per game, not universal. FFXIV uses orange for normal and red for late-resolving. Lost Ark uses a blue body glow for "counter now". D4 and many games use red. Pick one meaning per colour and never reuse it.
- Colour-blind safety needs a second channel. Use shape, pattern (chevrons, stripes, hatching), pulse and an edge outline. Whole-screen filters are not enough.

### Cited findings
- FFXIV markers: standard AoEs are "bright orange highlights on the ground". Shapes are circles, donuts, full-arena lines, 90-degree cones, 8-way starbursts with chevrons, and **orange squares with arrows on tile-based arenas**. Homing AoEs use trailing yellow chevrons and a pulsing circle. Some duties use red AoEs that register "substantially later than usual". Attacks generally snapshot when the telegraph disappears. In high-end content markers often appear right before the hit, and some attacks have none. https://ffxiv.consolegameswiki.com/wiki/AoE_marker
- Akh Morning "Raiding Fundamentals": cast-bar attacks snapshot position when the cast bar ends. A disappearing AoE marker can override the cast bar. Snapshot timing "is affected by ping". Players see moving objects about 1 second behind the server. Player position counts as the center of the model, so a model overlapping a marker edge can be safe. E6S fireballs snapshot about 0.5 s before the explosion animation. https://akhmorning.com/resources/raiding-fundamentals
- FFXIV slidecast: roughly the last 0.5 s of any player cast lets you move without cancelling. https://www.icy-veins.com/ffxiv/healer-combat-mechanics
- Lost Ark: counterable attacks make the boss glow blue just before the attack, and the counter works only during the glow. Some counterable attacks do not glow (Valtan grab). AoE indicator colours are red, blue, yellow and purple, and meanings change per boss. https://vulkk.com/2022/02/11/how-to-use-advanced-combat-mechanics-in-lost-ark , https://www.sportskeeda.com/esports/lost-ark-boss-monster-guide-when-counterattack , https://maxroll.gg/lost-ark/kazeros-raids/echidna-gate-2
- Mike Stout (Game Developer, 2 Sep 2015) frames telegraphs as a pre-attack delay, often a long wind-up, plus sound, VFX, voice and rumble. "The player must first know the damage is coming." No ms values given. https://www.gamedeveloper.com/design/enemy-attacks-and-telegraphing
- Hades II gets player complaints that attack radius is hard to judge from enemy animations alone. https://nex-3.com/blog/hades-ii-has-a-legibility-problem/ , https://steamcommunity.com/app/1145350/discussions/0/591769824782233841
- Exit the Gungeon designer Dave Crooks says the sequel borrowed from bullet hell by shrinking hitboxes. https://www.gamedeveloper.com/design/building-i-enter-the-gungeon-i-s-dungeon-climbing-spin-off-i-exit-the-gungeon-i-
- Colour-blind: designers recommend redundant encoding (shape, pulse, icon). One developer added patterns to objects and lasers after a palette swap was not enough. Whole-screen filters often do not fix content problems. ESO players report red AoE circles on green grass as hard to read. https://bugnet.io/blog/colorblind-friendly-game-design , https://www.filamentgames.com/blog/color-blindness-accessibility-in-video-games , https://forums.elderscrollsonline.com/en/discussion/comment/3950601

### Inferences
- Lead time is not documented in ms by any source fetched. Working numbers for Asterion, all estimates. Trash mob melee wind-up 400-600 ms. Elite ground AoE 1000-1500 ms. Boss signature 2000-3000 ms. Never under about 400 ms in PvE, because a 150 ms ping plus about 250 ms human reaction leaves nothing.
- Add latency to the lead time, do not subtract it. The server starts the timer when it sends the telegraph. A client at 150 ms sees it 150 ms late. Resolve on the server timestamp and draw a fill that ends on that timestamp (client clock synced to server), so a laggy player sees a shorter but honest fill.
- Fill-up decals (an outline that fills from center or edge until the hit) give a countdown without numbers. They suit pixel art, because the fill can step one ring of pixels per frame group.
- The FFXIV "orange squares on tile arenas" are the closest match to a 32 px grid. Tile-snapped telegraphs are exact on a grid game and make "am I in it" a yes/no question. Use them for monster AoEs. Free-form circles can stay for player skillshots.
- Avoid a red-on-green default for our grass maps. Use a warm orange-yellow fill with a dark 1 px outline, plus a pattern (diagonal hatch or chevrons) for colour-blind players.
- Enemy-player casts in PvP need a team colour on the telegraph. Ally spells draw an outline only or are hidden. Enemy spells get the full fill. This is how MOBAs keep teamfights readable (inference; no Riot source found).

### Gaps
- No official FFXIV or WoW lead-time table.
- No Hyper Light Drifter or Hades developer source on wind-up frames.
- Game Accessibility Guidelines and Xbox Accessibility Guidelines were not fetched.

---

## Q3. Miss, dodge and near-miss feedback

### Takeaway
- Touhou shrinks the player's real hitbox to about 5x5 px, far smaller than the sprite, and shows it only in focus mode. It rewards near misses with graze points. A small hurtbox plus a graze reward makes dodging feel skilful and fair.
- Tibia-style games show "miss" through a puff effect and no number. Text like "MISS", "DODGE" and "IMMUNE" belongs to the targeted half of our hybrid system, where the server rolls a miss. For aimed spells the miss is visible, the projectile flies past, so no text is needed.

### Cited findings
- Touhou: the hitbox is "approximately only 5 pixels by 5 pixels", much smaller than the sprite. https://touhou.fandom.com/wiki/Imperishable_Night/Gameplay
- Other wiki pages say about 6 px or less, varying by character (Reimu smaller). https://www.giantbomb.com/grazing/3015-6614/
- Focus mode (Shift) shows a hitbox marker, but in some games it is not the true hitbox size. https://lenen.shoutwiki.com/wiki/Brilliant_Pagoda_or_Haze_Castle/Gameplay
- Embodiment of Scarlet Devil: grazing is a bullet coming close to the hitbox, worth 500 points, and each bullet can be grazed once. https://touhou.fandom.com/wiki/Embodiment_of_Scarlet_Devil:_Gameplay?oldid=2565
- FFXIV counts player position as the center of the model, so a model overlapping a marker edge can be safe. https://akhmorning.com/resources/raiding-fundamentals

### Inferences
- Near-miss feedback for aimed spells in Asterion: if a projectile passes within about 0.5 tile of a target's hurtbox, play a short "whoosh" on the target's client and a small dust puff. Trigger it only for the dodger and the caster, not for the whole screen.
- Use a small hurtbox for players in PvP (about 12-16 px circle at the feet on a 32 px sprite). Draw a subtle foot ring when the player holds a "focus" key or when a telegraph is under them.
- Miss text rules for the targeted half. Show "Miss" in grey, smaller than damage, with no rise, only fade. "Immune" and "Block" use icons or text that never looks like a number. Both should be visible only to the attacker and the target, not to bystanders.
- A graze reward fits PvE (small resource refund or a short buff) but is risky in PvP where it can be farmed. Server-side checks keep it fair.

### Gaps
- No source fetched on whiff sound design or WoW miss text styling.

---

## Q4. Floating combat text at scale

### Takeaway
- Tibia's OTClient is the model to copy for a 32 px game. Text lives 1000 ms, rises 48 px, fades in the last sixth, merges same-colour numbers on the same tile within 400 ms by summing them, and offsets new numbers by 12 px when the previous one has not moved yet. It uses one 11 px bitmap font.
- Diablo III's 2.4.0 fix for number spam is the best documented rule set. It abbreviated large numbers and coloured a hit orange only when it beat the last orange number, with a decaying benchmark.
- WoW exposes size (0.1-3), on/off, and direction spread (0 straight up to 5 scattered in 8 directions). Arc vs rise is a player option, not a fixed design.
- Path of Exile ships no floating damage numbers for normal hits. Players report numbers only on boss health bars. Vampire Survivors players turn numbers off for lag and eye strain. Numbers must be optional and must be the first thing to drop under load.

### Cited findings
- OTClient `AnimatedText`:
  - Font `verdana-11px-rounded`, centered on the 32 px tile (x offset 24 minus half the text width).
  - Lifetime `ANIMATED_TEXT_DURATION = 1000` ms, then removed by a scheduled event.
  - Y motion `8 + (-48 * t / 1000)`, a linear rise of 48 px in 1 s (1.5 tiles).
  - Optional diagonal mode (`GameDiagonalAnimatedText`) adds an x drift of `4t + 8t^2` px (normalised t), 12 px total, which gives a slight arc.
  - Alpha stays full until `t0 = 1000 / 1.2`, about 833 ms, then fades linearly to 0.
  - Merge only if same colour, same font, the existing text is younger than 400 ms (`1000 / 2.5`), and both texts parse as integers. The new value is the sum.
  - If not merged, a new text on the same tile gets a 12 px downward offset when the previous text is younger than 250 ms ("didnt move 12 pixels"), capped at 12 px.
  https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp , https://github.com/edubart/otclient/blob/master/src/client/map.cpp , https://github.com/edubart/otclient/blob/master/src/client/const.h
- Diablo III patch 2.4.0 (January 2016): abbreviation toggle, shown as 1769M instead of 1,769,000,000. Low millions are not abbreviated because "1,000,000" felt better than "1M". Billions show as 1,000M. Orange big-hit rule: only numbers above 10,000. A number goes orange if it beats the last orange number. That benchmark decays 3% per second. The first 10 large numbers calibrate. Reset after 10 s without damage. https://blizzardwatch.com/2016/01/25/diablo-damage-numbers-changed/
- Diablo IV colours: white normal, yellow crit, cyan Overpower, orange crit Overpower. A single on/off option ("Show Damage Number"). No colour customisation found. https://us.forums.blizzard.com/en/d4/t/what-are-the-four-damage-colors-please-normal-crit-overpower-and/203037 , https://seekingtech.com/how-to-turn-off-damage-numbers-in-diablo-iv/
- D4 players ask Blizzard to keep numbers small, quoting a dev saying they did not want big numbers clogging the screen. https://us.forums.blizzard.com/en/d4/t/we-dont-want-big-numbers-clogging-up-the-screen-joe/16225
- WoW CVars after the 31 January 2026 hotfix (third-party report from player testing): `WorldTextScale_v21` 0.1-3, `floatingCombatTextCombatDamage_v21` 0/1, `floatingCombatTextCombatDamageDirectionalScale_v20` 0-5 (0 straight up, 3 at 45 degrees, 5 scatter in 8 directions), `breakUpLargeNumbers` for thousands separators. https://news.17173.com/content/02012026/022236171.shtml
- WoW addon docs list `floatingCombatTextFloatMode_v2` with Up, Down and Arc and note Blizzard does not document the animation. https://www.curseforge.com/wow/addons/forever-combat-style
- WoW players report the numbers render behind nameplates. https://us.forums.blizzard.com/en/wow/t/floating-combat-text-size/2116609
- Path of Exile 2: players report damage only shows on boss health bars. PoE 2 director Jonathan Rogers says the design should avoid D4-style runaway damage. https://steamcommunity.com/app/2694490/discussions/0/594008672803320028 , https://www.pcgamer.com/games/rpg/we-dont-have-to-worry-about-trillions-of-damage-path-of-exile-2-is-trying-to-avoid-diablo-4s-game-breaking-damage-numbers-director-says
- Vampire Survivors players report that disabling damage numbers fixes late-run lag and eye strain (player reports, no dev statement). https://steamcommunity.com/app/1794680/discussions/0/4631482569784862180 , https://steamcommunity.com/app/1794680/discussions/0/3820781363199330417
- Cozy Space Survivors moves damage numbers in the direction of the hit impulse. https://simonschreibt.itch.io/cozy-space-survivors/devlog/723638/update-126-all-events-cozy-space-survivors-events-damage-numbers-impact-push-optimization

### Inferences
- Visibility tiers for 30 players on one screen. My own numbers at full size. Numbers on me (damage taken) in red at full size. Party members' numbers at about 60% alpha or off by default. Strangers' numbers off. Tibia shows every number to everyone, which is fine at 1-on-1 scale but turns into noise at 30.
- Merge rule for Asterion: per target, per source group (mine / others), per colour, inside 300-400 ms, summed. Copy OTClient's 400 ms. Keep crits unmerged so they still pop.
- Use a hard cap per target (for example 4 live numbers) and a global cap (for example 64 live labels, an estimate). Over the cap, merge into the newest number instead of spawning.
- Use 1000 ms lifetime and a 1.5 tile linear rise as the baseline, since Tibia players are trained on it. Crits get a 2-frame scale pop (1.5x then 1x, integer scale for pixel fonts) and 1.2x lifetime.
- Pool label nodes. Draw all numbers with one bitmap font atlas so the WebGL2 batcher can merge draws. No per-label `Label` theme lookups or outlines via shader. Bake a 1 px dark outline into the font atlas. That is likely the biggest web cost saving (estimate, not measured).
- The D3 decaying-benchmark orange rule is cheap (one float per player) and solves "every hit is a crit-looking big number" in late game.
- Abbreviate past 5 digits (12.3K). Prefer short integers by design, as Tibia and PoE 2 do.

### Gaps
- No measured ms cost per floating number in Godot web. Needs a local benchmark.
- Lost Ark damage number options not researched.
- WoW CVar defaults not documented.

---

## Q5. Cast bars and target frames

### Takeaway
- WoW tells you whether you can interrupt with one boolean, `notInterruptible`. The default UI draws a shield frame around the spell icon on enemy cast bars. Addons also recolour the bar (grey or red) for uninterruptible casts. Use two cues (shield icon plus bar colour) so it is colour-blind safe.
- Cast-bar end is the snapshot moment in FFXIV, unless a ground marker overrides it. Pick one rule per spell type and keep it.

### Cited findings
- `UnitCastingInfo` returns name, startTimeMs, endTimeMs, castID, notInterruptible and more. The default UI shows a shield frame around the icon on enemy cast bars when notInterruptible is true. `UnitChannelInfo` has the same flag for channels. Classic returns nil for it. https://warcraft.wiki.gg/wiki/API:UnitCastingInfo , https://warcraft.wiki.gg/wiki/API:UnitChannelInfo
- Addons colour uninterruptible bars red or another colour and recolour the icon border. https://www.curseforge.com/wow/addons/nugscastbars , https://www.wowinterface.com/forums/showthread.php?p=231888
- A forum report says the shield was missing from the default UI for a while (a regression risk). https://us.forums.blizzard.com/en/wow/t/no-shield-icon-for-uninterruptable-spell-casts/1594905
- FFXIV: cast-bar attacks snapshot at bar end. Aggro snapshots when the bar starts. Slidecast window is about 0.5 s. https://akhmorning.com/resources/raiding-fundamentals , https://www.icy-veins.com/ffxiv/healer-combat-mechanics

### Inferences
- Send start and end as server timestamps, the same shape as WoW's `startTimeMs`/`endTimeMs`. The client draws the bar from its synced clock. Late packets then shorten the bar instead of desyncing it.
- At 32 px, a cast bar above a monster can be 24x3 px with a 1 px outline. Interruptible uses a yellow fill. Uninterruptible uses a grey fill with a 5x6 px shield glyph at the left. Show the full bar with spell name only in the target frame.
- In PvP, show enemy player cast bars only for the selected target and for casts aimed at you. Thirty floating bars is noise.

### Gaps
- No source fetched on cast bar pushback or channel tick rules.

---

## Q6. What transfers to 32 px pixel art

### Takeaway
- Snap monster telegraphs to tiles (FFXIV already uses square markers in tile arenas). Draw free-form player skillshot indicators as pixel-perfect lines at integer positions.
- One bitmap font, integer scales only, 1 px baked outline. OTClient's 11 px rounded Verdana on 32 px tiles is a proven ratio (about 1/3 tile height).
- Transparency on ground decals: real alpha is cheap on WebGL2, but blended edges look soft next to crisp sprites. Use a dithered (checkerboard or Bayer) fill at 50% with a solid 1 px outline. It reads as pixel art, also works as a colour-blind pattern, and avoids sorting many blended quads.

### Cited findings
- FFXIV tile-arena markers are orange squares with arrows in 8 directions. https://ffxiv.consolegameswiki.com/wiki/AoE_marker
- OTClient uses one 11 px bitmap font, centered on a 32 px tile, rising 48 px. https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp
- Projectiles must read direction without motion. https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/
- Patterns, not only palettes, fix colour-blind issues. https://www.filamentgames.com/blog/color-blindness-accessibility-in-video-games

### Inferences
- Telegraph recipe, 32 px. A dark 1 px outline traces the tile border. The fill is a 2x2 checker at 50% in the danger colour. A fill ring expands from the center in steps of 2 px every frame group until resolution, then the decal flashes white for 2 frames and disappears exactly on the server's resolve tick.
- Aim preview recipe. A line of 4x4 px dots every 8 px (dotted beats solid for overlap with other effects), an end marker at max range, and the width shown as two thin side lines only when the width is above 1 tile.
- Projectile sprites at 15 tiles/s need a 2-3 frame smear or a trail of 2-3 afterimages so the direction reads (matches Riot's tail-blur rule).
- Global hitstop and screen-wide flashes do not transfer to shared screens. Telegraphs and numbers are local per client, so they do transfer, as long as visibility is filtered per viewer.

### Gaps
- No measured cost of shader dithering vs baked dithered textures in Godot Compatibility renderer.

---

## Sources
- https://wiki.leagueoflegends.com/en-us/Ezreal
- https://wiki.leagueoflegends.com/en-us/Ezreal?oldid=4025148
- https://wiki.leagueoflegends.com/en-us/Gameplay_radius
- https://wiki.leagueoflegends.com/en-us/Template:Tip_data/Er
- https://wiki.leagueoflegends.com/en-us/Hotkeys
- https://devtrackers.gg/leagueoflegends/p/b8641c86-pbe-datamine-2024-april-25-patch-14-9-a-few-more-champion-radii-changes
- https://www.mobachampion.com/blog/quick-cast/
- https://wecoach.gg/blog/article/quick-cast-vs-normal-cast-which-is-better-in-league-of-legends
- https://guildjen.com/the-best-settings-and-mechanics-for-guild-wars-2
- https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/
- https://www.altchar.com/game-news/how-league-of-legends-vfx-updates-work-aJCpL5Z3RVQy
- https://liquipedia.net/dota2/Cast_backswing
- https://liquipedia.net/dota2/Attack_backswing
- https://dota2.gamepedia.com/Attack_backswing
- https://www.hiveworkshop.com/threads/how-to-prevent-backswing-animations-cancelation.224453/
- https://ffxiv.consolegameswiki.com/wiki/AoE_marker
- https://akhmorning.com/resources/raiding-fundamentals
- https://www.icy-veins.com/ffxiv/healer-combat-mechanics
- https://vulkk.com/2022/02/11/how-to-use-advanced-combat-mechanics-in-lost-ark
- https://www.sportskeeda.com/esports/lost-ark-boss-monster-guide-when-counterattack
- https://maxroll.gg/lost-ark/kazeros-raids/echidna-gate-2
- https://www.gamedeveloper.com/design/enemy-attacks-and-telegraphing
- https://nex-3.com/blog/hades-ii-has-a-legibility-problem/
- https://steamcommunity.com/app/1145350/discussions/0/591769824782233841
- https://www.gamedeveloper.com/design/building-i-enter-the-gungeon-i-s-dungeon-climbing-spin-off-i-exit-the-gungeon-i-
- https://bugnet.io/blog/colorblind-friendly-game-design
- https://www.filamentgames.com/blog/color-blindness-accessibility-in-video-games
- https://forums.elderscrollsonline.com/en/discussion/comment/3950601
- https://touhou.fandom.com/wiki/Imperishable_Night/Gameplay
- https://touhou.fandom.com/wiki/Embodiment_of_Scarlet_Devil:_Gameplay?oldid=2565
- https://www.giantbomb.com/grazing/3015-6614/
- https://lenen.shoutwiki.com/wiki/Brilliant_Pagoda_or_Haze_Castle/Gameplay
- https://github.com/edubart/otclient/blob/master/src/client/animatedtext.cpp
- https://github.com/edubart/otclient/blob/master/src/client/map.cpp
- https://github.com/edubart/otclient/blob/master/src/client/const.h
- https://blizzardwatch.com/2016/01/25/diablo-damage-numbers-changed/
- https://us.forums.blizzard.com/en/d4/t/what-are-the-four-damage-colors-please-normal-crit-overpower-and/203037
- https://seekingtech.com/how-to-turn-off-damage-numbers-in-diablo-iv/
- https://us.forums.blizzard.com/en/d4/t/we-dont-want-big-numbers-clogging-up-the-screen-joe/16225
- https://news.17173.com/content/02012026/022236171.shtml
- https://www.curseforge.com/wow/addons/forever-combat-style
- https://us.forums.blizzard.com/en/wow/t/floating-combat-text-size/2116609
- https://steamcommunity.com/app/2694490/discussions/0/594008672803320028
- https://www.pcgamer.com/games/rpg/we-dont-have-to-worry-about-trillions-of-damage-path-of-exile-2-is-trying-to-avoid-diablo-4s-game-breaking-damage-numbers-director-says
- https://steamcommunity.com/app/1794680/discussions/0/4631482569784862180
- https://steamcommunity.com/app/1794680/discussions/0/3820781363199330417
- https://simonschreibt.itch.io/cozy-space-survivors/devlog/723638/update-126-all-events-cozy-space-survivors-events-damage-numbers-impact-push-optimization
- https://warcraft.wiki.gg/wiki/API:UnitCastingInfo
- https://warcraft.wiki.gg/wiki/API:UnitChannelInfo
- https://www.curseforge.com/wow/addons/nugscastbars
- https://www.wowinterface.com/forums/showthread.php?p=231888
- https://us.forums.blizzard.com/en/wow/t/no-shield-icon-for-uninterruptable-spell-casts/1594905
