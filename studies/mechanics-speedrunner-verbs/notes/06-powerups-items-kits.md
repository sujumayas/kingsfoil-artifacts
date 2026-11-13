# 06. Power-ups, items and verb kits

Researcher 06 for the SPEEDRUNNER VERBS study. Scope: verbs that the level hands to the player and takes back
(Mario Maker power-ups, Neon White cards, SpeedRunners pickups, Jetpack Joyride gadgets, LittleBigPlanet power-ups,
Pizza Tower transformations) and the design question of handed kits versus a fixed kit on a time-attack board.
Study #1 [S4] settled the base kit; this file never re-derives the jump or the wall kit. Markers: [V] cited,
[I] inference, [U] unverified recollection, [K] Kingsfoil build fact from `01-current-build.md`.

Unit notes. SMW and TASVideos give speeds in subpixels per frame at 60 fps, 16 subpixels = 1 px, a tile is 16 px
and big Mario is 32 px (2 tiles). SpeedRunner's hero is 46 u (1 BL), maxRun 420 u/s = 9.1 BL/s [K].

---

## 1. Super Mario Maker 1 and 2: power-ups as per-style verb kits

### Takeaway
Mario Maker is the largest shipped catalogue of "the level hands you a verb". Every power-up is a self-contained kit of
2 to 7 verbs, bound to a game style, lost on damage, and placed by the maker. The styles themselves are verb sets:
only NSMBU has wall jump, ground pound and midair spin; only SMW and NSMBU (and 3D World) have a spin jump; 3D World
adds climb, long roll and boxes [V, S1; S9]. Nintendo's own time-attack mode (Ninji Speedruns) does not ban power-ups;
it fixes the course and grades by time only [V, S1].

### Cited findings
- **Verb table per style (SMM2 v3.0.0, Super Mario Wiki)** [V, S1]:
  - SMB1 style: Super Mushroom, Fire Flower, Superball Flower ("throw Superball", bounces off walls), Master Sword
    (Link, v2.0.0: swing sword, dash attack, down thrust, shoot arrow, ready/throw/place bomb, raise shield), SMB2
    Mushroom (v3.0.0: pick up and throw enemies and items, crouching "charge jump" high jump), Big Mushroom, Weird
    Mushroom, Buzzy/Spiny Shell helmets, Goomba's Shoe and Stiletto, Dry Bones Shell, Lakitu's Cloud, Koopa Clown Car.
  - SMB3 style: Super Leaf = Raccoon Mario (tail whip; fly: "dash until arms extend, then press B repeatedly"; slow
    descent by tapping B), Frog Suit (v3.0.0: swim, swim quickly with Y, "skip across water" when the P-Meter fills).
  - SMW style: Cape Feather (cape attack; ascend by dashing until arms extend then hold B; "open cape" by releasing B;
    fly, dive, dive bomb, descend slowly), Yoshi (ride, bail, eat with Y), P-Balloon (v3.0.0: float, boost with Y/B).
    Spin jump yes, ground pound no, wall jump no.
  - NSMBU style: Propeller Mushroom (fly with a shoulder button, dive with stick down), Super Acorn (v3.0.0: glide by
    holding B, ascend once with a shoulder button, cling to walls, "high spin jump"), Yoshi with flutter jump. Spin
    jump (midair spin) yes, ground pound yes, wall jump and wall slide yes.
  - 3D World style: Super Bell = Cat Mario (climb wall, scratch, crouch slide, claw dive), Super Hammer = Builder Mario
    (swing hammer, place Builder Box), Boomerang Flower (v3.0.0), Cannon Box (fire, hold Y for a charged shot),
    Propeller Box (fly, dive), Goomba Mask (crouch to hide), Bullet Bill Mask (fly by holding B while descending),
    Red POW Box. Spin jump (B plus shoulder while holding up), ground pound and wall jump all yes.
- **Course tags**: the wiki confirms tags are searchable in Course World and names "Puzzle-solving" and "Autoscroll"
  [V, S1]. The SMM1 fan site Maker Bookmark used "Dash" and "Speedrun" as separate, often-confused tags [V, S10].
  "Precision" is not an official SMM2 tag in any source read; it is community shorthand (see Gaps).
- **Ninji Speedruns** (SMM2 v2.0.0): a Nintendo course, race a "Ninji Ghost" one week after release, 1 to 3 temporary
  stars (bronze, silver, gold) by finish time; 20 stamps unlock the full Ninji and Cheetah outfits [V, S1].
- **speedrun.com SMM2 "Clear" (per level)**: time = in-game timer minus 1 s; **"Using Luigi is not allowed"**; no
  checkpoint starts; video required. No power-up is banned by rule [V, S11]. Story Mode Any% is also allowed everything.
- **Cat Mario numbers**: 3D World claw dive "lasts only two seconds"; wall climb is "briefly"; SMM2 Cat Mario also
  climbs semisolid platforms and dives with ZR; cat runs at crouching height and "sprints sooner" [V, S12].
- **Spin jump**: SMW spin jump gives "less height than a standard jump", bounces off Spinies and Lava Bubbles, breaks
  Rotating Blocks from above; NSMBW/U spin jump does not protect from spiked enemies; the NSMB midair spin "ekes out
  more air time" (enough for Mini Mario to wall-jump up one wall); SMM1 lets the spin jump bounce on most spiked
  enemies but not Grinders [V, S9].
- **P-Meter**: SMB3 style only in Maker; fills while running, "P" flashes at full speed; crouch, turn or wall contact
  empties it; a running jump keeps it full except in flight forms; SMM2 v3.0.0 Frog Mario runs on water with a full
  meter even while carrying [V, S7]. SMW shows no meter but has the same mechanics [V, S7].

### The cape, with numbers from the SMW TAS resource page (frame data, not Maker-specific) [V, S2]
- Running speed cycles 36, 35, 36, 35, 37 subpx/frame (about 2.25 px/f = 135 px/s = 8.4 tiles/s = 4.2 big-Mario
  heights/s). Sprint cycles 48, 47, 48, 47, 49 (3.0 px/f = 180 px/s = 11.25 tiles/s). P-meter "peaks at 112".
- Flight: on a sprint jump "the game sets the takeoff meter to 80, and decrements it by 1 each frame" (80 frames
  = 1.33 s to climb). Flying speed cycles 51, 50, 49, 48, 47 (top 51 subpx/f = 3.19 px/f = 191 px/s), 6% above sprint.
- Catching air by holding back normally takes 11 frames; the press-release-press trick takes 3 frames.
- Dive: press forward every other frame, five presses reach the swoop animation. Dive bomb is the ground slam at the
  end of a dive that kills certain enemies and shakes the screen [V, S8].
- Float (P-Balloon or Lakitu's Cloud) oscillates 52 to 36 subpx/f holding both directions; wall jump needs speed 33
  toward the wall; corner clip needs x speed 49 and y speed 33.
- In SpeedRunner units: Mario's sprint (5.6 heights/s) is slower than our hero (9.1 BL/s). A cape flight at 1.33 s of
  climb at 191 px/s covers 254 px = 16 tiles, about 8 big-Mario heights [I].

### Inferences
- A power-up is a *bundle*, never a single verb: Cape = attack + glide + flight + dive + slam. That is why makers
  reach for it: one pickup changes the whole level's read [I].
- The Luigi ban on the SMM2 Clear board is a verb ban in disguise: Luigi's higher jump and lower friction are a
  different kit, and the board chose one kit for comparability. Power-ups are not banned because the maker already
  chose them; the level *is* the allowed-verbs list [I].
- Flight needs a run-up (P-meter or sprint), so the maker controls it with floor length. Our maps are 4,580 to 8,700 u
  wide [K]; a 1.3 s flight at maxRun would be 550 u or 12 BL, which skips most of a section. If we ever hand a glide,
  cap it to the cape's 80-frame class and give no climb [I].

### Gaps
- No official source for a "no power-up" convention or a "precision" tag among Maker speedrunners; two searches found
  only general level-design advice. Treat the convention as unverified [U]. Maker Bookmark's "Dash" tag is the only
  confirmed community split.
- SMM2 Cat climb limit, Propeller spin height, Acorn glide speed and Frog swim speed were not published anywhere read.
- SMW Central's thread returned a copyright notice; the SMWDisX disassembly (https://github.com/IsoFrieze/SMWDisX)
  is the place to pull exact cape tables if the sandbox ever models one.

---

## 2. Neon White: a card is a shoot verb plus a discard verb

### Takeaway
Each card has a fire verb and a one-shot movement verb that costs the whole card. The level hands out exactly the
cards its route needs, so the route and the kit are the same object. Medals, shortcuts and the gold "hint" are all
built on the discard decision [V, S3; S4; S5; S6].

### Cited findings (TheGamer card table) [V, S3]
| Card | Fire verb | Ammo | Discard verb |
|---|---|---|---|
| Katana (grey, default) | sword swing, parries projectiles for a speed boost | 30 | none |
| Fists | punch; the 10th punch kills you | 10 | none |
| Elevate (yellow) | semi-auto pistol | 9 | vertical boost, a double jump when airborne |
| Purify (purple) | machine gun | 35 | sticky grenade; kills groups or "opens new areas" (bomb jump) |
| Godspeed (blue) | rifle, +3 damage | 4 | forward launch, breaks barriers, slices enemies |
| Stomp (green) | SMG | 30 | ground slam, breaks floors, shockwave |
| Dominion (teal) | rocket launcher | 4 | grapple to surfaces and enemies |
| Fireball (red) | 12-pellet shotgun | 4 | aimable air dash |
- Six of eight cards discard. A card leaves the hand when its ammo hits 0 or when discarded. Enemy colour tells you
  which card it carries. "Cards are stage-specific, and you can't bring your own deck" [V, S3].
- Designer rules (Esposito, IGF write-up) [V, S4]: random decks "wasn't fun at all"; discarding was added as
  "risk/reward"; "The player always has the right tool for the next encounter"; "The shortcut path must only use cards
  from the main path"; "The shortcut path cannot be hidden"; levels are "intentionally misleading", the obvious path
  "won't get a great score"; gifts appear after a clear so players learn the level before speedrunning it.
- Level build (Game Informer, "Smackdown") [V, S5]: more than 50 iterations from March 2019 to March 2022; fastest
  known run 9.56 s; a Bomb card that existed only for a shortcut was cut, giving the rule "every card has to have an
  obvious purpose in the moment that you pick it up"; an Elevate card with nothing to act on was removed; the game
  shipped with over 100 levels and scrapped about twice that.
- Medals (Vice interview) [V, S6]: "it was important for our Ace medal times that each level had at least one
  shortcut that saved a significant amount of time even if you didn't execute it perfectly"; Red medal = beat the dev
  ("torahhorse"). Gold or better unlocks the in-level shortcut hint, a floating golden hand that shows a trail
  [V, S13].

### Inferences
- Numbers that matter for a board: 4 ammo on the three strongest movement cards (Godspeed, Dominion, Fireball) versus
  30 to 35 on the weak ones. Movement value is priced in ammo, so firing a Godspeed round is a visible route cost [I].
- The medal ladder is a verb ladder: Bronze/Silver = main path with the handed cards, Gold = one discard shortcut,
  Ace = all intended discards clean, Red = discards the designer did not plan. That is a per-map "allowed verbs" list
  expressed as times, not as rules [I].

### Gaps
- speedrun.com category API for Neon White returned 404 under the guessed slug; categories not read.
- Discard startup/active frames, dash distance and double-jump height were not published in any source read.

---

## 3. SpeedRunners: pickups and the boost meter

### Takeaway
SpeedRunners items are all *against the opponent*, not for traversal. Only InvinciDrill speeds you up. The verb kit
stays fixed (run, slide, jump, grapple, boost) and items are a one-button use with one target [V, S14].

### Cited findings [V, S14]
- Eight pickups: Golden Hook (grabs the opponent in front and **swaps positions**; dodged by sliding, blocked by
  Crates and Shockwaves), Homing Missile (stuns on contact, slow turning), Crates (1 or 3, dropped one at a time even
  mid-air; stun anyone including you), Time Bomb (two-stage: place, then the item becomes a detonate Button; pushes
  but does not stun), InvinciDrill (rare; speed boost plus invulnerability, breaks crates), Shockwave (radial push;
  boosting through it avoids the push), Freeze Ray (straight beam "a few seconds"; frozen player slides slowly),
  Fireball (rolling boulder, follows ramps, dies only on a wall).
- No published durations beyond "a few seconds"; no button map on the wiki page.

### Inferences and gaps
- Boost meter: recollection says it refills over time and faster when behind, and spends on hold [U]. Not confirmed
  on the pickups page; the wiki's mechanics pages were not fetched. Slide and swing were covered in #1 [S4].
- Item hitting a *ghost* is meaningless, so none of these fit a solo time attack; the one lesson is the two-stage item
  (place, then trigger) which costs no extra button [I].

---

## 4. Jetpack Joyride: two equipped gadgets change the whole run

### Cited findings
- v1.3 (26 April 2012) added 15 gadgets in five sectors, 2,000 to 6,500 coins each; "mix and match any two"; Halfbrick
  claims "more than 100 potential combinations" (vendor figure) [V, S15].
- Movement gadgets with community-measured effects [V, S16]: Gravity Belt raises descent rate "about 50%" at all
  altitudes (helps ceiling riding); Air Barrys lets Barry jump "about three times his height" but only from the floor;
  Turbo Boost spawns a portal that opens three gateways each worth about 100 m (about 300 m total) and clears zappers,
  missiles and lasers on screen; Insta-Ball and Freeze-O-Matic extend the corpse slide by "a few dozen" metres; Free
  Ride starts the run in a random vehicle; Dezapinator randomly disables zappers; Gemology converts 10 to 20% of
  coins into gems; Nerd Repellant removes scientists (cosmetic for score).
- Halfbrick's own blurbs are jokes with no numbers ("Makes the ground approach much faster") [V, S15].

### Inferences and gaps
- The two-slot rule is the cleanest "loadout" model in the set: two passive modifiers, chosen before the run, no
  in-run input. On a leaderboard this is a self-chosen handicap, and the Air Barrys author warns it "can carry him
  into mid-level traps", i.e. a verb that changes the level's read [V, S16; I].
- Flash Back was not described in any source read [U]. Lil Stomper is a vehicle, not a gadget.

---

## 5. LittleBigPlanet: the level hands and removes the power-up

### Cited findings
- Grappling Hook (LBP2): "will automatically launch itself towards the nearest material that it can take hold of";
  swing and climb with the left stick; designers must place grabbable points ("make sure there are enough grapple
  points") [V, S17].
- Grabinators (LBP2): L1 picks up and sets down; hold forward to "throw it forward like a rocket" [V, S17; S18].
- Creatinator (LBP2): a helmet emitter; designer sets the emitted object, ammo "between 1 and 1,000, or set to ∞",
  and a max on screen [V, S17].
- LBP3: Pumpinator blows and sucks air to move light objects; Blink Ball teleports on a set material; Hook Hat grinds
  on bendy rails; Boost Boots give a double jump; Hero Cape (DC DLC) glides and swoops; a Power-up Creator lets makers
  build their own; 70 tools in total. OddSock runs faster than Sackboy and wall-jumps; Toggle switches big (heavy,
  holds plates) and little (runs on water, fits gaps); Swoop flies and carries [V, S17; S19].
- Removal: a wiki note on the remover tool says "to forcefully remove any powerups, use this to unequip them"
  [V, S17]. Giving is by placing the power-up object itself in the level [I].

### Inferences and gaps
- LBP's rule is the same as Neon White's and Mario Maker's: the maker decides where a verb starts and where it stops,
  and the engine supports it with a giver (the pickup) and a remover (a gate). That is a two-object vocabulary we can
  copy into a tile set: a "verb gate" that sets the allowed-verbs mask for the next section [I].
- Brain Crane, Attract-O-Gel, Power Gloves and Paintinator were not fetched (Fandom 402). Illumination not covered.

---

## 6. Ultimate Chicken Horse, Pizza Tower, Rayman

### Ultimate Chicken Horse
- Cited [V, S20]: wall jump trajectory depends on sprint ("sprinting sends them further, and not sprinting sends
  them higher"); the "quick-jump" is a no-sprint wall jump followed by sprint; a wall jump next to a spring adds
  height. A Dance input exists: the Treehouse cheat sequence is "Dance Dance Run Run Dance Dance RotateRight" [V, S21].
- Inference: during the run phase the player only moves; items (Black Hole, Spring, Honey, Trap) are *placed*
  objects, not carried verbs. Dance is a taunt with no mechanical effect [I; U]. Chicken glide and Sheep verbs: no
  evidence found; treat as none [U].

### Pizza Tower transformations [U, see-it: https://pizzatower.fandom.com/wiki/Transformation_Blocks]
- Both wiki fetches failed (402/404). From recollection: Knight (sword, breaks Super Metal Blocks, slides down
  slopes), Firemouth (fire breath), Mort (carry the chicken, flap), Ball (roll), Rocket (fast flight, breaks Super
  Metal Blocks), Boxxed Pep (box, limited jump), Cheeseball/Sticky Cheese (wall stick), Ghost (phase), Barrel (roll,
  originally carry-and-throw [V, S22]), Weenie Mount, Bomb (unused asset [V, S22]). Each is granted by a block or
  pickup and ended by a specific wall or timer; the level forces the kit. Confirmed by TCRF only for Barrel and Bomb.

### Rayman Legends
- Punch, charged punch, hover (helicopter hair) and wall run are a fixed kit, not handed per level; Murfy is a second
  player, not a power-up. Not researched further; out of scope for handed kits [I].

---

## 7. Handed kits versus a fixed kit on a leaderboard

### Cited findings
- Celeste's speedrun.com board has no dash-restricted category; the only dash rule is the **DTS variable** (Dash
  Trigger Skip, "set Madeline's dash count to 1") which every full-game run must declare Yes or No [V, S23]. The
  community's reason: "tech restriction categories are very unlikely to be added" because they are "arbitrary and hard
  to enforce" [V, S24].
- SMM2's per-level Clear board bans Luigi, not power-ups; Ninji Speedruns fix the course and grade by time [V, S1; S11].
- Neon White ships the restriction inside the level (cards) and the ranking inside the medal (Ace needs a shortcut
  "even if you didn't execute it perfectly") [V, S6].
- Esposito: "If you just play to win each level without going back to optimize your time, you're not really playing
  Neon White" [V, S6].

### Inferences: how a per-map allowed-verbs list could work on our board
- A board compares equal kits. Three ways to keep them equal: (a) a fixed kit for every map (Celeste, Meat Boy, N++:
  one leaderboard, rules enforce nothing about verbs); (b) the map carries its kit (Neon White, LBP, Mario Maker: the
  level file is the rule, enforcement is free because the verb does not exist outside its pickup); (c) the player
  picks a loadout (Jetpack Joyride: a handicap, needs a separate board per loadout or a tag) [I].
- For SpeedRunner, (b) costs the least. The map header already holds `top`, `floorView`, checkpoints and the finish
  [K]; add `verbs: ["run","jump","wall","roll"]` plus optional pickups `{x, y, verb, until}` that set and clear a
  mask. The replay stays deterministic because the mask is data. The ghost needs one extra per-frame flag per handed
  verb [I].
- Category split by verb only when the verb is binary and visible in the replay (Celeste's DTS, "Dashless"): the
  validator can count dash inputs in the submitted input log and set a tag, so one board can show "any%" and
  "no-dash" filters without two leaderboards [I].
- Neon White's pricing lesson: a handed verb that also costs something in the clock (ammo you could have fired) reads
  better than a free verb. In a game without weapons, the cost can be the pickup's position off the straight line [I].

---

## Candidate technique profiles
1. **Verb gate**: a tile that sets or clears an allowed-verbs mask for the next section (LBP giver/remover, Mario
   Maker power-up loss on hit). Numbers: 1 mask byte in map data, 1 ghost flag per verb.
2. **Handed glide, cape class**: hold jump in the air after a pickup to fall at a capped speed; no climb. Cape numbers:
   80 frames of climb, flight 6% above sprint, 11-frame air catch [V, S2]. Our cap candidate: fall at 25% maxFall.
3. **One-shot movement card**: a pickup grants one dash or double jump that is spent on use (Elevate 9, Godspeed 4,
   Dominion 4 [V, S3]). Reads as a card icon in the HUD, discard = the verb input itself.
4. **Loadout slots**: two passive modifiers chosen before the run (Jetpack Joyride, 2 slots, 15 gadgets, Gravity Belt
   about +50% fall, Air Barrys about 3x jump [V, S15; S16]). Board tag per loadout.
5. **Two-stage item**: place then trigger on the same button (SpeedRunners Time Bomb [V, S14]). Fits a 2-button scheme.
6. **Spin jump**: a lower jump that is safe on spikes and breaks blocks below (SMW [V, S9]); candidate for a
   katana-down-thrust that pogo-bounces on spike strips, since our spikes are 16 u hitboxes [K].
7. **Medal ladder as verb ladder**: Gold = one shortcut, Ace = all intended discards, Red = beat the dev (Neon White
   [V, S6]). Pairs with #1's medal profile.
8. **Luigi rule**: a board bans an alternate kit, never a technique (SMM2 Clear [V, S11]; Celeste "arbitrary and hard
   to enforce" [V, S24]).

## Sources
- S1 Super Mario Wiki, Super Mario Maker 2: https://www.mariowiki.com/Super_Mario_Maker_2
- S2 TASVideos, Super Mario World game resources (speeds, takeoff meter 80, air catch): https://tasvideos.org/GameResources/SNES/SuperMarioWorld
- S3 TheGamer, Neon White soul cards guide (card table, ammo): https://www.thegamer.com/neon-white-soul-cards-tips-tricks-guide/
- S4 Game Developer, Road to IGF 2023, Neon White and designing for player creativity: https://www.gamedeveloper.com/road-to-igf-2023/-neon-white-and-designing-for-player-creativity
- S5 Game Informer, How a Neon White level is made: https://gameinformer.com/feature/2022/11/25/how-a-neon-white-level-is-made
- S6 Vice, Neon White's developers being too good at their own game: https://www.vice.com/en/article/neon-whites-developers-being-too-good-at-their-own-game-caused-real-problems
- S7 Super Mario Wiki, P-Meter: https://www.mariowiki.com/P_Meter
- S8 Wikibooks, Super Mario World/Caped status: https://en.wikibooks.org/wiki/Super_Mario_World/Caped_status
- S9 Super Mario Wiki, Spin Jump: https://www.mariowiki.com/Spin_Jump
- S10 GameSkinny, Maker Bookmark tag guide ("Dash" vs "Speedrun"): https://gameskinny.com/?p=32298
- S11 speedrun.com API, SMM2 categories (Clear rules, Luigi ban): https://www.speedrun.com/api/v1/games/smm2/categories
- S12 Super Mario Wiki, Cat Mario: https://www.mariowiki.com/Cat_Mario
- S13 Prima Games, Neon White tips (gold hand shortcut hint): https://primagames.com/tips/neon-white-tips-and-tricks-for-going-fast
- S14 SpeedRunners wiki.gg, Pickups: https://speedrunners.wiki.gg/wiki/Pickups
- S15 Halfbrick blog, In depth: Jetpack Joyride gadgets: https://www.halfbrick.com/blog/in-depth-jetpack-joyride-gadgets
- S16 Top Tier Tactics, Get Good: Jetpack Joyride gadgets and gear: https://toptiertactics.com/?p=17687
- S17 LittleBigPlanet wiki, Character Enhancements (402 on fetch; snippets via search): https://littlebigplanet.fandom.com/wiki/Character_Enhancements
- S18 Wikipedia, LittleBigPlanet 2: https://en.wikipedia.org/wiki/LittleBigPlanet_2
- S19 Wikipedia, LittleBigPlanet 3: https://en.wikipedia.org/wiki/LittleBigPlanet_3
- S20 Ultimate Chicken Horse wiki, movement notes (wall jump and sprint): https://ultimate-chicken-horse.fandom.com/wiki/File:Black_Hole_Jump.gif
- S21 UCH unlock-everything cheat code (dance input): https://crystaltoast.pages.dev/posts/what-is-the-unlock-everything-cheat-code-in-ultimate-chicken-horse-answered-164882
- S22 TCRF, Pizza Tower unused objects (Barrel history, Bomb): https://new.tcrf.net/Pizza_Tower/Unused_Objects
- S23 speedrun.com API, Celeste categories (DTS variable): https://www.speedrun.com/api/v1/games/celeste/categories
- S24 speedrun.com Celeste forum, dashless category discussion: https://www.speedrun.com/posts/zsk2a
- S25 Super Mario Wiki, Ninji Speedruns: https://www.mariowiki.com/Ninji_Speedruns
- S26 SMWDisX disassembly (not read, for future cape tables): https://github.com/IsoFrieze/SMWDisX
