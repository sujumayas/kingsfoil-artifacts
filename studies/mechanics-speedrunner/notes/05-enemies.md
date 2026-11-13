# 05. Enemies and moving threats in precision platformers, runners and race platformers

Research agent 05, 13 Nov 2026. Scope: what enemies add to a solo, deterministic, restart-heavy time attack, what
they cost, and which kind fits SpeedRunner (no enemies today, a katana used only in the finish duel).

Tags: [C] cited finding with a URL, [I] inference, [R] recalled from decompiled or community sources but not
re-verified this session (treat as evidence 2 until checked), [K] Kingsfoil fact from `01-current-build.md`.

Unit notes. SMB1 moves in subpixels, 16 subpixels = 1 px [S1]. The disassembly stores speeds as signed bytes of
subpixels per frame at 60 fps. Small Mario is 16 px tall, so for SMB1 1 body length (BL) = 16 px. SpeedRunner's
hero is 46 u tall, maxRun 420 u/s = 9.1 BL/s [K].

---

## Q1. Enemies as timing puzzles

### Takeaway
Classic platformer enemies are slow clocks. A Goomba walks at one fifth of Mario's run speed, a kicked shell at
1.2x. They work as timing puzzles because their motion is fixed and readable, and because the stomp rule
("moving downward kills") is a single predicate the player can learn once. The interesting enemies in speed games
are the ones that react to the player with a telegraphed burst (N's chase drone doubles its speed on line of
sight; Celeste's Seeker winds up before a charge) because the reaction is the puzzle: trigger it on purpose, at
the right time, from the right side. Enemies that must be hit for progress (Dustforce dust, Pizza Tower combos)
turn into route markers rather than threats.

### Cited findings
- SMB1 enemy speed table `NormalXSpdData .bulk $f8,$f4`: a Goomba or Koopa walks at -8 subpx/frame (0.5 px/frame,
  30 px/s, 1.9 BL/s) in normal mode and 0.75 px/frame in "hard mode" (second quest). Read from the Doppelganger
  disassembly [S2] (addresses c30c to c316, `InitNormalEnemy` / `GetESpd`).
- SMB1 `BulletBillXSpdData $18,$e8` = 1.5 px/frame (90 px/s). `KickedShellXSpdData $30,$d0` = 3.0 px/frame (180 px/s).
  `DemotedKoopaXSpdData $08,$f8` = 0.5 px/frame (a Koopa knocked out of its shell) [S2].
- Mario for comparison: `MaxLeftXSpdData $d8,$e8,$f0` = 2.5 px/frame running, 1.5 walking, 1.0 (third row). TASVideos
  independently quotes 2.5 px/frame running [S1]. So Goomba : walk : run : shell = 0.5 : 1.5 : 2.5 : 3.0.
- SMB1 hitboxes (`BoundBoxCtrlData`, left, top, right, bottom offsets inside a 16x32 sprite cell): big Mario
  $02,$08,$0e,$20 = 12x24 px; small Mario $02,$09,$0e,$15 = 12x12 px; the enemy rows $03,$14,$0d,$20 = 10x12 px and
  $02,$14,$0e,$20 = 12x12 px (the bottom 12 px of a 16 px sprite) [S2]. The hitbox is narrower than the art by 2 to 3 px
  per side.
- SMB1 player-enemy collision runs only on frames where `FrameCounter` bit 0 is clear (`PlayerEnemyCollision: lda
  FrameCounter / lsr / bcs NoPUp`), so contact is sampled at 30 Hz [S2]. TASVideos adds that damage needs the player
  inside the enemy box for "two consecutive frames or longer", and that in 1-1 starting on frame 33 misses the first
  Goomba while frame 40 stomps it [S3].
- Stomp rule: "As long as you're moving downward as you hit the enemy, you'll kill it." A stomped enemy is briefly
  harmless. The routine compares the player's y plus 12 px against the enemy's y to pick stomp or injury [S2][S3].
- Turtle bounce: stomping an airborne Koopa while rising keeps Mario rising; max height depends on the jump frame and
  which part of the turtle is hit while holding A [S3].
- SMB1 framerule: level end times round up to the next 21-frame boundary; only the last level can gain less than 21
  frames [S3]. Enemy spawns depend on the framerule, which is why "Framerules and Enemy Spawns" is a standard
  speedrun.com explainer [S4].
- Sprite budget: with 5 or more object sprites on screen (fire bars, fireballs, platforms count) some objects fail
  to appear [S3].
- Mario Maker shell jump: throw a shell at a wall, then bounce off it in the air, "double shell jump" as the harder
  variant; never explained by Nintendo, taught by GrandPOOBear's tech-talk levels [S5][S6]. SMW-style timing: release
  the shell at about a quarter of the jump height and re-press jump [S7].
- N (Metanet): five drone types, Zap and Chase, Laser, Chaingun, Pulse. Zap drones follow one of six preset
  surface-following patterns (clockwise or counter-clockwise wandering) and kill on contact. A chase drone that
  sees the ninja "speeds up in the direction of the ninja at twice its normal speed" and resumes its path when it
  reaches a surface [S8][S9].
- Celeste Seeker: Seeker Barriers make them crash and bounce [S10]. In a TAS, Theo hitting the right side of a
  seeker moves Theo further right and repositions the seeker, so the seeker body is a usable physics object [S11].
- Dustforce: attack direction is independent of momentum direction; holding back briefly while attacking barely
  affects forward speed [S12].
- Pizza Tower: grabbing an enemy at Mach 2 or above swings it around and clears enemies and blocks it hits; at Mach 3
  or above enemies "drop their guard" and the player barrels through; a combo lasts 7 s between kills [S13]. The
  Mach Dash is Wario Land 4's dash with three speed tiers [S14].
- Neon White: "tripwire" enemies kill you on touch and kill themselves at the same time [S15].

### Inferences
- [I] Scaling SMB1 ratios to SpeedRunner (maxRun 420 u/s): a Goomba-class patroller would walk at about 85 u/s
  (1.8 BL/s), a shell-class projectile at about 500 u/s, a Bullet Bill at about 250 u/s. At 85 u/s a patroller
  crosses a 2-tile (about 92 u) gap in 1.1 s, which is a readable cycle.
- [I] SMB's 30 Hz contact sampling plus the 2-frame rule means a grazing contact under about 33 ms never kills.
  SpeedRunner steps at 120 Hz; requiring 2 consecutive overlapping steps (16.7 ms) or shrinking the enemy box 2 to
  3 u per side (as SMB does) would copy that forgiveness.
- [R] Celeste Seeker constants from the decompiled `Seeker` class, as remembered: patrol speed 25 px/s with 0.4 s
  waits, sight distance 160 px, spotted-state speed 60 px/s matching height within 24 px, attack wind-up at -60 px/s
  then a charge from 180 to 260 px/s at 300 px/s² acceleration, bounce speed 200 px/s, a 6 px circle hurtbox and a
  16x6 bounce box on top. Verify in Celeste.dll before quoting (Everest wiki warns that redistributing the
  decompiled code is illegal [S16]).
- [I] Celeste pixels run 60 speed = 1 px/frame [S17], so a 260 px/s seeker charge is 4.3 px/frame, faster than
  Madeline's 90 px/s run and slower than her 240 px/s dash. The puzzle is "bait the charge, then dash past".

### Gaps
- No numbers found for Mega Man, Shovel Knight or VVVVVV enemy speeds; Fandom wikis returned 402.
- N drone speeds (px/s), laser charge time, chaingun burst: the N wiki page was unreadable (402 via fetch, 5 KB
  shell via curl).
- Dustforce enemy hitstun and dust rules: the GitHub guide host did not resolve.

---

## Q2. Determinism: level-time enemies vs reactive AI

### Takeaway
Time attack games that live on leaderboards remove randomness. Neon White's director says the game found its
identity when he removed the randomness; Trackmania and Trials have no enemies at all; SMB1 runners build routes
around a 21-frame rule and frame-exact Goomba spawns. Reactive enemies are fine as long as the reaction is a pure
function of player state, because then the same inputs produce the same run and the ghost sees what you saw.
SpeedRunner's movers already run on level time, so a `t -> state` enemy is the natural extension.

### Cited findings
- TASVideos defines luck manipulation as "controlling how the game determines 'random' results through input".
  RNG seeds come from a hardcoded value, a save-file value, a menu-time counter, the clock, or controller input;
  RNG advances per frame, per action, or only on key events. Per-frame RNG means "delaying button presses will be
  necessary, but is also sufficient". Dragon Warrior critical hits were obtained "100% of the time" by attacking on
  one particular frame [S18].
- Speed Demos Archive: killing a bird advances the RNG 82 places, a sword enemy 6 (Zelda II example) [S19].
  Castlevania: some enemy patterns depend only on frames since the screen started and Simon's position [S20].
- SMB1 enemy spawns and level ends obey the 21-frame framerule [S3][S4].
- Neon White: early builds were "a card-based arena shooter with a lot of randomness built in" that "just wasn't
  fun"; the game found its identity once he removed the randomness and the deck-building; levels are "a hundred
  hand-designed levels that are meant to be replayed"; each encounter is blocked out in isolation then assembled
  [S21][S15].
- Super Meat Boy: a framerate bug made the Dr. Fetus and Brownie fights "run too fast", which shows those bosses are
  driven by the game clock, not by a separate AI tick [S22].
- SpeedRunner's movers and wheels are driven by run time so every attempt is deterministic [K].

### Inferences
- [I] A ghost recorded at 30 Hz (SpeedRunner) only stays meaningful if the world the ghost ran through was the same.
  Any RNG enemy makes the shadow duel unfair in both directions.
- [I] Two safe enemy classes for SpeedRunner: (a) clock enemies, `pos = f(game.time)` like the movers, (b) trigger
  enemies, whose state changes only on a deterministic event (player crosses x, player enters a box). Class (b) is
  reactive but replayable, because the ghost's recorded path implies the same triggers.
- [I] Seeded RNG per attempt (same seed every restart) looks deterministic but breaks the moment the player's
  timing changes, since the RNG consumer order changes. Avoid.

### Gaps
- No speedrun.com forum thread on "RNG enemies ruin the category" found with a quotable number this session; the
  TASVideos "Heavy Luck Manipulation" tag discussion exists [S23] but is about tagging, not design.

---

## Q3. Enemies in runners

### Takeaway
Endless runners split "enemy" into harmless set dressing and lethal obstacle. Jetpack Joyride's scientists are
props; its zappers, missiles and lasers are the hazards and they are shapes, not creatures. Rhythm runners
(Rayman Legends music stages, BIT.TRIP) make enemies into notes: they appear on the beat so the player plays the
song. In both cases the enemy never has AI; it has a schedule.

### Cited findings
- Jetpack Joyride: one-button game; the dangers are "electrical fields" and "rockets" plus "deadly fields of flying
  laser beams" with rotating and slanted zappers [S24][S25]. Luke Muscat's GDC talk "Depth in Simplicity: The Making
  of Jetpack Joyride" is the postmortem [S26].
- Rayman Legends music levels: "the stage itself was designed to match the music" [S27]; Castle Rock lists enemies
  jumping up from the background in sync with the music [S28]; the idea came from Michel Ancel [S29]. In Legends
  Retold's Macarena stage the boxes follow a rhythm pattern so "the music is a more reliable guide than the
  visuals" [S30].
- Doodle Jump: one comparison describes its threats as "enemies that kill you when you hit them" plus platforms
  that break or crumble [S24].

### Inferences
- [R] Doodle Jump monsters can be shot (tap to fire upward) or stomped by landing on them; UFOs abduct, black holes
  swallow. No primary source reached this session; treat as evidence 1.
- [R] Sonic badniks: a rolling or jumping Sonic destroys them, a running Sonic takes a hit and drops rings. They act
  as speed interruptions because they sit at running height on the main line. No primary source this session.
- [I] For SpeedRunner, the runner lesson is: an enemy on the main line at hero height is a stop sign unless the
  hero can go through it at speed. Either give the katana a run-through slash or place enemies off the main line.

### Gaps
- Doodle Jump monster speeds, Canabalt (none, by design), BIT.TRIP Runner beat grid and Gaijin interviews: nothing
  usable found.

---

## Q4. Enemies in party and race platformers

### Takeaway
Race platformers make other players the enemy. SMB35 literally mails your kills to an opponent's level, and the
timer economy (seconds gained per stomp) makes enemies a resource. Fall Guys has no enemies on purpose: its
designers talk only about an "obstacle library" and a target of about 80 percent skill, 20 percent chaos.
Ultimate Chicken Horse makes the players the level designers of each other's death. The common thread is that
the threat must be attributable to a person for it to be fun in a party game.

### Cited findings
- SMB35: 35 players; "Defeated enemies are sent over to a different player's course as enemy clones" with a white
  tint; four targeting modes (random, attackers, most coins, lowest time); Bowser can be sent and transferred
  Bowsers from 6-4 on throw hammers; timer max 400 s; stomping adds 2 to 3 s per enemy, 4 s Buzzy Beetle, 5 s
  Hammer Bro or Lakitu; POW Block gives 10 s for Bowser; Item Roulette costs 20 coins; service 1 Oct 2020 to 31 Mar
  2021 [S31].
- Fall Guys: lead designer Joe Walsh, levels start from "our suite of obstacles" and aim for "80 percent skill" and
  "20 percent sprinkling of chaos"; players compete "against a system rather than each other" [S32][S33].

### Inferences
- [R] Ultimate Chicken Horse loop: each round every player places one piece (platform, trap, enemy-like hazard),
  then everyone runs; a trap only scores if it kills someone and at least one player finishes. No designer interview
  reached this session.
- [R] SpeedRunners (DoubleDutch, 2013): no AI enemies; items (rocket, hook, ice ray, crate) are the threats and the
  screen edge eliminates the trailing player. Not verified this session.
- [I] For a solo time attack the "player as enemy" loop already exists in SpeedRunner as the shadow duel. An
  asynchronous version of SMB35 (your kills in one run spawn as extra enemies in a friend's attempt) would break
  determinism and leaderboard fairness; keep it for a party mode, not the ranked board.

### Gaps
- No UCH, Duck Game or Towerfall designer statements found within budget.

---

## Q5. Enemy as a tool for the player

### Takeaway
The strongest reason to add enemies to a speed game is that they can give something back: height (Mario stomp
bounce, Shovel Knight's 4.5-tile shovel drop), a resource refund (Dustforce's dash and double jump come back when
an attack lands; Celeste seekers refill a dash on a dash hit), or a platform (a shell you throw ahead of you). Each
of these creates a route choice: the enemy line is faster but needs a hit, the safe line is slower. That is exactly
the risk-reward texture a leaderboard needs.

### Cited findings
- Shovel Knight: the Shovel Drop bounces off the ground or foes when holding down and attacking; bounces add "about
  4.5 tiles of height"; the drop and bounce have special invulnerability rules to keep the signature move
  "frustration-free" [S34][S35].
- SMB1 stomp and Koopa bounce rules as in Q1 [S3]. `StompChainCounter` raises the points per consecutive stomp [S2].
- Dustforce: attack direction is independent of momentum, attacking barely affects forward speed [S12].
- Pizza Tower: enemy grab at Mach 2+ as a weapon, Mach 3+ plows through enemies, 7 s combo timer [S13].
- Mario Maker shell as a mid-air platform [S5][S6].
- Downwell: the gunboots were the answer to pacing and action problems in an early prototype [S36].

### Inferences
- [R] Dustforce: landing any attack on an enemy resets the air dash and the double jump, which is why speedrunners
  chain enemies instead of avoiding them. Widely stated in the Dustforce community; the wiki mirror reached [S12]
  does not include the exact sentence.
- [R] Celeste: dashing into a seeker stuns it and refills Madeline's dash; landing on its top bounces her (bounce
  speed about 200 px/s). Theo and bumpers also give a bounce. Verify in the decompiled `Seeker.OnAttack`.
- [R] Downwell: landing on an enemy's head bounces Welltaro and recharges the gunboots' ammo, so stomping is the
  main ammo economy. Not verified this session.
- [I] For SpeedRunner the analogue resources are the wall jump (a slash kill could reset the same-wall penalty,
  `wallJumpSameY` 330 vs 790 [K]) and overspeed (a kill could set vx above maxRun with the existing
  `overspeedDecay` 500 u/s² bleed, like the roll which keeps 280 u/s). A bounce enemy could be a one-way "tile"
  that gives `vy = -jumpVel` when landed on with `vy > 0`, reusing the mover landing code (feet within 3 u of top).

### Gaps
- Hollow Knight pogo frame window and bounce velocity: only unreliable Silksong sites found. Downwell recharge numbers:
  none.

---

## Q6. Troll enemies (brief)

### Takeaway
Troll enemies break the player's learned predicate. IWBTG's apples fall up; Syobon's clouds and blocks are
enemies in disguise. The design rule is one surprise per element, learnable on the first death, never random. The
player's reaction is a restart, so the troll only works where restart is near-instant.

### Cited findings
- Syobon Action: "plentiful traps scattered around that will surprise you if you go into the game with common
  sense"; players "must use trial and error" to pass the traps [S37][S38].
- IWBTG creator Kayin: the Japanese flash game Owata "stood as my main inspiration"; Syobon came to his attention
  "well into IWBTG's development" [S39][S40].

### Inferences
- [R] IWBTG's Delicious Fruit (cherries drawn as apples) fall when approached, some fall upward. Syobon has clouds
  that drop on you and blocks that fly at you. Only low-quality sources reached.
- [I] The troll rule that transfers: the first instance of a trick must be survivable or restart in under a second.
  SpeedRunner's 3.4 s death-to-control [K] makes troll enemies expensive; another agent covers restart cost.

---

## Q7. Bosses in speed games

### Takeaway
Bosses in time attack platformers are either races against a chaser (Super Meat Boy's Brownie, Celeste's Badeline
chases) or fixed-cycle pattern checks (Little Horn ends after three headbutts). Both are clock-driven, which keeps
the leaderboard fair. Health-bar bosses with RNG move selection do not fit a leaderboard, which is why Neon White
and Trackmania-style games avoid them or script them.

### Cited findings
- Little Horn (Super Meat Boy, chapter 4): kills only with fists or headbutts; the fight ends after it headbutts the
  ground three times [S41].
- Brownie (chapter 3) is a race against a clone; the fight is a chase level [S42].
- A framerate bug made the Dr. Fetus and Brownie fights run too fast [S22], consistent with clock-driven bosses.
- SMB reverse boss order route (6 Jul 2019): Little Horn unlocks after 4-5 and 4-6, Brownie after 3-5 and 3-6 [S43].

### Inferences
- [R] Celeste chapter 2 Badeline chasers replay Madeline's recorded positions with about a 1.55 s delay and kill on
  touch; the chapter 6 finale is a Badeline boss with fixed attack sets per room; the Oshiro chase at the end of
  chapter 3 is a scripted horizontal charger with a roar telegraph. Verify delays in the decompiled
  `BadelineOldsite` and `AngryOshiro` classes.
- [I] "Boss as a race against a chaser" fits SpeedRunner's duel fiction: a Samurai Trial map could spawn a chaser
  that replays your own PB path (the shadow made lethal). It is deterministic (your PB is fixed), it scales with the
  player, and it needs no new AI.

### Gaps
- Shovel Knight boss rush cycles, Katana ZERO boss frame data, Neon White boss structure: not reached.

---

## Q8. The samurai angle: a one-button attack that keeps the run flowing

### Takeaway
A katana in a time attack only earns its place if swinging never costs speed. Katana ZERO's slash deflects bullets
at full speed, Pizza Tower's grab at Mach 2 is a weapon that preserves momentum, Dustforce's attack ignores
momentum direction. The pattern: attack as a short hitbox in front of the hero, active for a few frames, cancelable
into jump, never clamping vx. The enemy then becomes a thing you cut on the way past, and a route marker.

### Cited findings
- Katana ZERO: the player can "deflect bullets with his slash, slow time with a meter that slowly refills, and dodge
  attacks using rolls"; bullets can be deflected without slow-mo if the swing is timed [S44][S45]. Speedrun mode
  unlocks after the "To Be Continued" achievement [S46].
- Dustforce: attack direction independent of momentum, forward speed kept while attacking [S12].
- Pizza Tower: Mach 2+ grab swings the enemy as a weapon, Mach 3+ passes through enemies [S13].
- Shovel Knight's drop attack is invulnerable and adds height [S34].

### Inferences
- [R] Katana ZERO runs at 60 fps; a slash is about 3 to 4 frames of active hitbox with a short recovery that cancels
  into a roll; the roll has full invulnerability. Not verified this session, treat as evidence 1.
- [I] A SpeedRunner slash spec that keeps a run flowing: hitbox about 50 u wide and 40 u tall in front of the hero
  (just over one body width), active 4 physics steps (33 ms) after a 2-step wind-up, 100 ms total before the next
  press, cancelable by jump at any time, vx untouched, usable in the air. Kills refund something (see Q5) or cut
  a block that is otherwise a wall. Readability needs one telegraph: the kimono flap spring and a white arc.
- [I] Because the ghost is pose-interpolated at 30 Hz [K], the slash animation must fit inside 2 to 3 ghost samples
  or the shadow will not show it. Record a "slash" pose flag in the ghost frame.

### Gaps
- Ghostrunner dash and kill numbers, Sonic homing attack timings, Mario cape spin frames: none reached.

---

## Candidate technique profiles

| # | Name | One line | Games | Key numbers |
|---|---|---|---|---|
| 1 | Clock patroller | Enemy position is a function of level time, like SpeedRunner's movers | SMB1 Goomba, N zap drone | Goomba 0.5 px/frame = 1/5 of Mario's run; hard mode 0.75 [S2] |
| 2 | Shell as platform | A thrown or kicked object becomes a mid-air step | SMB1, Mario Maker shell jump | shell 3.0 px/frame = 1.2x run speed [S2]; release at 1/4 jump height [S7] |
| 3 | Telegraphed charger | Idle until line of sight, then a wind-up and a fast charge | N chase drone, Celeste Seeker | chase drone 2x speed on sight [S9]; Seeker charge ~260 px/s [R] |
| 4 | Path-replay chaser | A chaser follows your own recorded path on a delay | Celeste Badeline, SMB Brownie | ~1.55 s delay [R]; Brownie race is clock-driven [S22] |
| 5 | Stomp and bounce | Downward contact kills and returns height | SMB1, Shovel Knight, Downwell | "moving downward kills" [S3]; 4.5 tiles bounce [S34] |
| 6 | Kill refunds a resource | Landing a hit resets a movement resource | Dustforce, Celeste, Downwell | Dustforce dash + double jump reset [R]; seeker dash refill [R] |
| 7 | Momentum-safe attack | Attack hitbox that never changes vx | Katana ZERO, Dustforce, Pizza Tower | attack independent of momentum [S12]; Mach 2 grab [S13] |
| 8 | Boss as race | Boss is a chase or a fixed count of cycles | SMB Little Horn, Brownie | 3 headbutts [S41] |
| 9 | Enemies on the beat | Enemies appear in sync with music | Rayman Legends music stages | stage designed to the track [S27] |
| 10 | Kill to send | Your kills become an opponent's enemies | SMB35 | 35 players, 4 target modes, +2 to +5 s per stomp [S31] |
| 11 | Sacrificial enemy | Hazard that dies when it kills you, so it can be cleared by anything | Neon White tripwire | [S15] |
| 12 | Lenient contact | Sample enemy contact below the physics rate and require consecutive hits | SMB1 | 30 Hz sampling, 2 consecutive frames [S2][S3] |

## Recommendation sketch for SpeedRunner (inference)
Add enemies only as deterministic route tools, not as health drains. Start with three: a clock patroller
(about 85 u/s, 12 u hitbox inset like SMB), a bounce enemy that gives `jumpVel` when landed on, and a cuttable
enemy or block that the katana removes without slowing the hero and that refunds the same-wall penalty or grants
overspeed. Keep everything on `game.time` or on player-position triggers so the 30 Hz shadow stays honest. Save
the chaser boss (your PB replayed as a lethal shadow) for Samurai Trial.

---

## Sources
1. [S1] TASVideos forum, SMB1 subpixels and 2.5 px/frame running speed: https://tasvideos.org/Forum/Posts/468463
2. [S2] Doppelganger's commented SMB1 disassembly (6502disassembly.com), labels NormalXSpdData, BulletBillXSpdData, KickedShellXSpdData, MaxLeftXSpdData, BoundBoxCtrlData, PlayerEnemyCollision: https://6502disassembly.com/nes-smb/SuperMarioBros.html
3. [S3] TASVideos game resources, Super Mario Bros. (framerule, stomp, hitbox timing, sprite limit): https://tasvideos.org/GameResources/NES/SuperMarioBros
4. [S4] speedrun.com, "Framerules and Enemy Spawns": https://www.speedrun.com/post/rid2d
5. [S5] Shacknews, How to shell jump in Super Mario Maker 2 (GrandPOOBear): https://shacknews.com/article/113025/how-to-shell-jump-in-super-mario-maker-2-grand-poobear-guide
6. [S6] Vice, Mario Maker expert creates easy way to learn kaizo tricks: https://www.vice.com/en/article/mario-maker-expert-creates-easy-way-to-learn-marios-secret-kaizo-tricks
7. [S7] itch.io post on SMW-style shell jump timing: https://itch.io/post/5221994
8. [S8] N wiki, Drones (five types): https://n.fandom.com/wiki/Drones
9. [S9] N wiki, Zap and Chase drones: https://n.fandom.com/wiki/Zap_and_Chase_drones
10. [S10] Celeste wiki, Seeker Barrier behaviour (via Wind page excerpt): https://celestegame.fandom.com/wiki/Wind
11. [S11] TASVideos forum, Celeste Theo and seeker positioning: https://tasvideos.org/Forum/Posts/489748
12. [S12] r/dustforce wiki mirror, Mechanics, Tricks and Terminology: https://axebps-redlib.hf.space/r/dustforce/wiki/terms
13. [S13] TV Tropes, Pizza Tower (Mach grab, Mach 3 guard break, 7 s combo): https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/PizzaTower
14. [S14] Game Developer, How Speedy Implementation... Pizza Tower postmortem: https://gamedeveloper.com/design/how-speedy-implementation-high-paced-platformer-pizza-tower
15. [S15] 80.lv, Breakdown: level design in Neon White: https://80.lv/articles/breakdown-level-design-in-annapurna-s-neon-white
16. [S16] Everest wiki, Making Code Mods (decompiling Celeste.dll): https://github-wiki-see.page/m/EverestAPI/Resources/wiki/Making-Code-Mods
17. [S17] TASVideos forum, Celeste speed units (60 speed = 1 px/frame, dash 240, hyper 325): https://tasvideos.org/Forum/Posts/489980
18. [S18] TASVideos, Luck Manipulation: https://tasvideos.org/LuckManipulation
19. [S19] Speed Demos Archive KB, Random Number Generators: https://kb.speeddemosarchive.com/Random_Number_Generators
20. [S20] Castlevania Speedruns wiki diff on frame-based enemy patterns: https://castlevaniaspeedruns.com/Special:MobileDiff/2568
21. [S21] Game Developer, Neon White and designing for player creativity: https://www.gamedeveloper.com/road-to-igf-2023/-neon-white-and-designing-for-player-creativity
22. [S22] speedrun.com SMB forum, Dr. Foetus bug (fights run too fast): https://www.speedrun.com/smb/forums/qdcck
23. [S23] TASVideos forum, The Heavy Luck Manipulation tag: https://tasvideos.org/Forum/Posts/397834
24. [S24] Adrian Crook, Design breakdown, Jetpack Joyride: https://adriancrook.com/?p=4709
25. [S25] Game Developer, Enjoyride (Jetpack Joyride design): https://gamedeveloper.com/design/enjoyride
26. [S26] GDC Vault, Depth in Simplicity: The Making of Jetpack Joyride: https://www.gdcvault.com/play/1015527/
27. [S27] Game Developer, The Musical Box 27, game music level design (Rayman Legends): https://gamedeveloper.com/audio/the-musical-box-27-game-music-level-design
28. [S28] RaymanPC wiki, Castle Rock: https://www.raymanpc.com/wiki/en/Castle_Rock
29. [S29] Designing Sound, interview with François Dumas: https://designingsound.org/2017/12/06/rayman-fun-sound-music-an-interview-with-francois-dumas/
30. [S30] allthings.how, Rayman Legends Retold Macarena level: https://allthings.how/rayman-legends-retold-macarena-music-level-walkthrough-all-zones/
31. [S31] Super Mario Wiki, Super Mario Bros. 35: https://www.mariowiki.com/Super_Mario_Bros_35
32. [S32] GamesRadar, Fall Guys interview (Joe Walsh): https://www.gamesradar.com/fall-guys-interview
33. [S33] Digitally Downloaded, Fall Guys developer Q&A: https://digitallydownloaded.net/?p=42226
34. [S34] Yacht Club Games, Plague Knight mobility design (shovel drop 4.5 tiles): https://yachtclubgames.com/blog/plague-knight-mobility-design
35. [S35] Game Developer mirror of the same post: https://www.gamedeveloper.com/design/shovel-knight-plague-of-shadows-mobility-design
36. [S36] Kill Screen, The tricky brilliance of Downwell's gunboots: https://www.killscreen.com/the-tricky-brilliance-of-downwells-gunboots.md
37. [S37] cavacopedia, Syobon Action: https://cavac.at/cavacopedia/Syobon%20action
38. [S38] Giant Bomb, Syobon Action: https://giantbomb.com/wiki/Games/Syobon_Action
39. [S39] Siliconera, I wanna interview the guy behind IWBTG: https://siliconera.com/i-wanna-interview-the-guy-behind-iwbtg
40. [S40] Kayin's itch.io IWBTG comments: https://kayin.itch.io/iwbtg/comments
41. [S41] Giant Bomb, Little Horn: https://giantbomb.com/little-horn/3005-17018/
42. [S42] LP Archive, Super Meat Boy (Brownie race): https://lparchive.org/Super-Meat-Boy
43. [S43] speedrun.com SMB category extensions, Reverse Boss Order route 6 Jul 2019: https://www.speedrun.com/smb_catext/guides/blggb
44. [S44] Wikipedia mirror, Katana Zero gameplay: https://en.wikipedia.org/wiki/Katana_Zero
45. [S45] Prima Games, Katana ZERO preview (deflect without slow-mo): https://primagames.com/featured/katana-zero-preview-bleeding-cool
46. [S46] Steam Community / steamah, Katana ZERO speedrun mode unlock: https://steamah.com/katana-zero-secret-hunter-swords-guide/
47. Trackmania and Trials have no enemies: see https://en.wikipedia.org/wiki/Trackmania and https://en.wikipedia.org/wiki/Trials_(series) (context only).
