# Shared context for all SPEEDRUNNER VERBS researchers

## The user and project
- Indie game dev collective, Kingsfoil Studios ("Kingsfoils Collective"), about 5 friends who playtest every build.
  Web-first games, also mobile and desktop. Small team, no budget for middleware.
- This is study #2 of the **Game mechanics** series (`mechanics`), format `mechanics-playable`
  (docs/formats/mechanics-playable.md). Library: https://kingsfoil-artifacts.netlify.app.
- **Study #1, Mechanics #1 "SpeedRunner mechanics"** (https://kingsfoil-artifacts.netlify.app/mechanics-speedrunner.html,
  report at `studies/mechanics-speedrunner/report.md`, notes in `studies/mechanics-speedrunner/notes/`) already covered the
  whole kit: the jump and its forgiveness windows, momentum, the wall kit, the roll-jump hyper, controls, the procedural rig,
  camera, audio, UI, elements on a level clock, enemies (patroller, chaser, stomp, the one-button slash), map design, medals,
  difficulty, social, timers, ghosts, replays and validation. **Do not research any of that again.** Cite it as [S4] where
  needed and read its profiles A1 to A6 and D3 to D4 before starting so you know what is settled (dash is only a reference
  in A5; the slash is settled in D4 at 100 ms, 50x40 u, momentum kept).

## The game: SpeedRunner
- Live: https://speedrunner-tau.vercel.app/ . Single-file Canvas2D JavaScript, 1/120 s fixed step, hero 20x46 world units
  (1 body length BL = 46 u), maxRun 420 u/s, jumpVel 830, gravity 2500, fall x1.65, coyote 100 ms, buffer 130 ms, wall
  slide 115 u/s, wall jump 440/790, roll after a 230 u fall. All constants in `notes/01-current-build.md` (copied from #1).
- Today's verbs: run, jump (variable), wall slide, wall jump (away or climb), roll on landing, flip (cosmetic). Nothing else.
  Keyboard only: A/D or arrows, Space/W/Up. The samurai carries a katana that is never used in a run.

## THIS study: new player verbs and abilities
The user asked for a complementary study of **NEW mechanics** ("dash, crawl, I don't know, what you find") from the same
games: Getting Over It, Doodle Jump, Jetpack Joyride, Solipskier, LittleBigPlanet, Cat Mario (Syobon Action), Fall Guys,
Super Mario Maker, Ultimate Chicken Horse, "and such kind of speed runners". Every verb found becomes a profile, and the
good ones become toggles in a sandbox that extends #1's sandbox (same course, a new "Verbs" panel).

A **verb** here is something the player does on purpose with an input: dash, air dash, double jump, crouch, crawl,
crouch-slide, long jump, dive, ground pound, ledge grab and mantle, wall run, wall climb with stamina, grapple and swing,
hook, glide, float, jetpack thrust, tilt steering, draw-the-ground, hammer or pole physics, grab and carry, throw, push,
spin, charge, pogo, bounce cancel, item use, placing a block or trap, switching layers, time slow, teleport, rewind. Also
the "anti-verbs" the named games are famous for (Cat Mario's fakes, UCH's traps, Fall Guys' grab) and what they teach
about trust and interruption.

For EVERY verb collect: input (button, hold, direction, combo), startup/active/recovery in ms or frames, speed and distance
numbers (in the game's units AND converted to body lengths or tiles), cooldown and resource (dash count, stamina, meter),
cancels (what it cancels into and out of), how it interacts with the jump and the wall kit, how it is animated and read
(pose, trail, sound), what it does to routing and skill ceiling in time attack (speedrun.com categories that ban or require
it), designer statements on why it exists, and 1-2 "see it in action" URLs. Then say how it would fit a samurai time attack
with a katana, two or three buttons, and deterministic input replays.

## Reference games
Named: Getting Over It (hammer/pole climbing, Foddy; also Jump King, Pogostuck, Only Up as successors and QWOP/Sexy Hiking as
lineage), Doodle Jump (tilt steering, shooting, spring and trampoline and propeller and jetpack and rocket items), Jetpack
Joyride (one-button thrust, vehicles as verb swaps, gadgets, Flash Back/Final Spin), Solipskier (draw the slope, lift the
finger to jump, gates), LittleBigPlanet (grab, swing, layer switch, three-layer depth, Grappling Hook, Power Gloves, Grabinators,
Creatinator, Brain Crane, Attract-O-Gel, Hero Cape and Pumpinator in LBP3, Oddsock's wall jump and Toggle's size switch),
Cat Mario / Syobon Action (the trick vocabulary), Fall Guys (jump, dive, grab, the physics ragdoll, pushing), Super Mario Maker
1 and 2 (power-ups as verb kits: Super Mushroom, Fire Flower, Super Leaf/cape, Propeller Mushroom, Super Acorn, Cat Suit,
Super Bell climb, Frog Suit, Super Ball Flower, Master Sword, SMB2 Mushroom pick-up-and-throw, Dry Bones Shell, Boomerang
Flower, Big Mushroom, the Cape's flight and the ground pound, spin jump, wall jump in NSMBU style, the P-Balloon, Goomba's
Shoe, Yoshi, Clear Pipes, Lakitu Cloud; the "styles" change the verb set), Ultimate Chicken Horse (place a block, traps,
dance, the Chicken's glide? verify, Sheep's? verify, item use), and "such speedrunners": Celeste (dash, super, hyper, wavedash,
climb stamina, crouch), Super Meat Boy (wall slide, no dash; Meat Boy Forever's punch/slide), N++ (nothing but jump; why),
Dustforce (dash, double jump, air dash, wall run, ceiling run, heavy/light attack), SpeedRunners (slide, grapple, items,
swing), Mirror's Edge (vault, slide, wall run, coil), Neon White (card verbs: Elevate, Purify, Godspeed, Stomp, Dominion),
Sonic (spin dash, drop dash, homing), Pizza Tower (mach run, grab, dive, super jump, taunt parry), Rayman Legends (punch,
charge punch, hover, wall run), Shovel Knight (pogo), Hollow Knight (dash, double jump, pogo), Katana ZERO (roll, slow time,
slash), Ghostrunner (dash, grapple, wall run, sensory boost), Ori (bash, dash, double/triple jump, glide), Mega Man X (dash,
wall kick), Metroid (shinespark, speed booster), Spelunky (whip, rope, bomb, ledge grab), Dead Cells (roll), Downwell
(gunboots), Jump King (charged jump), Getting Over It. Prune what does not fit a 2D side-view time attack; say why.

## Rating criteria (author judgement, 1 to 5; same as #1)
**Feel · Readability · Run fit · Cheapness · Evidence**.

## Rules for every researcher
- Cite a URL for every claim. Give concrete numbers (ms, frames, px, tiles, body lengths, u/s, counts, dates, versions).
- Separate cited findings from inferences. List gaps honestly instead of guessing. Flag vendor-reported figures.
- Never copy or download images. For every game example collect a "see it in action" URL (wiki page, article, devlog,
  GDC Vault page, or video page).
- Quotes under 15 words.
- Fandom wikis often return 402/403. Prefer source code and primary sources: Celeste's MIT Player.cs (dash, climb, crouch,
  super/hyper numbers), the nclone N++ reimplementation, SMB1 and SMW disassemblies and Mario physics docs, Hollow Knight
  HeroController constants quoted in modding docs, Dustforce's dustmaker and community physics docs, Sonic Physics Guide
  mirrors, Mega Man X frame data, Pizza Tower wiki/decomp notes, speedrun.com rules and forum threads, TASVideos, GDC Vault,
  developer blogs (Metanet, Team Meat, Hitbox Team, Foddy, Mikengreg, Halfbrick, Media Molecule, Mediatonic, Clever Endeavour,
  Nintendo interviews), Super Mario Wiki, LittleBigPlanet wiki mirrors, the Doodle Jump and Jetpack Joyride wikis.
- Notes structure: per verb (or per question) -> Takeaway / Cited findings / Inferences / Gaps. Then a list of candidate
  technique profiles (name, one line, games, key numbers). End with "Sources" (numbered, with URLs).
- Scratch files go only in `studies/mechanics-speedrunner-verbs/notes/scratch-<your-file-number>/`. Never write outside
  your notes file and that folder.
- Stop at about 25-35 tool calls. Save notes as markdown to the path you are given, then reply with a SHORT summary
  (at most 200 words) listing your 8-12 most useful numbers, each with the label it came from.
