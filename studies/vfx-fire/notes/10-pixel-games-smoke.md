# 10 Shipped top-down pixel games: fire, smoke and smoke columns

Scope: how shipped top-down and 3/4 pixel games draw and run fire and smoke, with code-level numbers where a source exists. Overlaps with 01 (Tibia, ALttP, Minish Cap), 02 (Eastward, Hyper Light Drifter, Sea of Stars, Into the Breach) and 06 (Nuclear Throne, Don't Starve) are kept short.

Session note. Several wikis blocked the fetcher this session: stardewvalleywiki.com (403), zeldawiki.wiki (403), spriters-resource.com (403), uoguide.com (403), corekeeper.atma.gg (403), all fandom.com wikis (402). Numbers for those games come from search snippets, other wikis, or decompiled code, as marked.

## Q1. How does Stardew Valley draw torch flames, embers and smoke puffs?

### Takeaway
Stardew Valley does everything with tiny sprites and per-frame math. No particle system, no shader. A torch is a 4-frame 12x11 flame at 10 fps, phase-shifted per tile, plus a pulsing additive-looking glow sprite and 3 one-pixel embers. A smoke puff is one 10x10 grey sprite that rises, drifts sideways under constant acceleration, grows, spins a little and fades over about 6 s. This is the cheapest credible chimney column we found in a shipped game, and it ports to Godot almost line for line.

### Cited findings (decompiled C# from an early Stardew build, https://github.com/E-riCA0/StawdewValley)
Version is not stated in the repo. The code looks like 1.0/1.1 era (uses `Game1.pixelZoom`, which later builds renamed). Treat numbers as that build.

Torch flame (`Torch.cs`, https://github.com/E-riCA0/StawdewValley/blob/HEAD/Torch.cs):
- Flame frame source rect is `Rectangle(276 + frame*12, 1985, 12, 11)`. So a flame is 12x11 art pixels.
- `frame = ((ms + x*3047 + y*88) % 400) / 100`. That is 4 frames, 100 ms each, 10 fps loop of 400 ms.
- The `x*3047 + y*88` term offsets the phase per tile, so a row of torches never flickers in sync.
- Glow sprite `Rectangle(88, 1779, 30, 30)` tinted `Color.PaleGoldenrod` at alpha 0.35 outdoors and 0.43 indoors.
- Glow scale is `pixelZoom*2 + (tileSize/2)*sin(((ms + x*777 + y*9746) % 3140)/1000)/50`.
- Embers ("ashes"): an array of 3 points. Each frame point i rises by `(i+1)*0.25` px. Odd points also wobble with `sin(y/(2*pi))/2`.
- Once an ember is above -100 px it respawns at the base with chance `3/400` per frame.
- Ember alpha is `0.5 * (-100 - y/2) / -100`, so it fades with height. Each ember is a 1x1 source pixel drawn at `pixelZoom*0.75`.
- Embers update only if the torch is within 4 tiles of the screen (`Utility.isOnScreen(..., 4*tileSize)`).

Smoke puff (`Utility.addSmokePuff`, https://github.com/E-riCA0/StawdewValley/blob/HEAD/Utility.cs, line ~4406):
- Sprite `Rectangle(372, 1956, 10, 10)` from `mouseCursors`, tinted `Color.Gray`, start alpha 0.75.
- Constructor alpha fade argument `1f/500f` (0.002 per update).
- `motion = (0, -0.5)`, `acceleration = (0.002, 0)`.
- `scale = pixelZoom/2` (2 at pixelZoom 4), `scaleChange = 0.02` per update.
- `rotationChange = random(-5..5) * pi/256` per update.
- A `delay` argument staggers spawn. `Town.cs` spawns 10 puffs in a loop with growing delay for one town event, and more puffs spaced 1500 ms apart in another branch (https://github.com/E-riCA0/StawdewValley/blob/HEAD/Locations/Town.cs).

Light sources (`Object.cs`, `initializeLightSource`): torch radius 2.5 with colour `(0,80,160)`, lamp radius 3, furnace (while smelting) and bonfire radius 1.5 `Color.DarkCyan`. Stardew uses subtractive lights, so these colours are the inverse of what you see (inference from the cyan value producing a warm glow in game).

Related: a 1.6 forum bug report says a Wilderness farm chimney "flickers from dark to light" when the player is inside, so the chimney effect ties to the house fireplace state. https://forums.stardewvalley.net/threads/1-6-bug-fireplace-flicker-on-wilderness-farm.33952

### Inferences (my arithmetic, assuming one update per 60 Hz frame)
- Puff lifetime is 0.75 / 0.002 = 375 frames, about 6.25 s.
- Over that life the puff rises 0.5 x 375 = 187 screen px, about 47 art px at pixelZoom 4. That is about 3 tiles of column.
- Sideways drift is 0.5 x 0.002 x 375^2 = 140 screen px (about 35 art px). The column bends into a curve, which reads as wind, from a single constant.
- Scale grows from 2 to 9.5, so the puff ends about 4.75 times wider than it starts. Growth plus fade plus drift gives the classic "cone that leans downwind" look.
- Glow pulse is about +-8% of size with a 3.14 s period. Slow breathing, separate from the 10 fps flame.
- One chimney emitting a puff every 600 ms keeps about 10 puffs alive. For a 320x180 view with 20 chimneys that is 200 quads. Trivial on WebGL2.
- Server-side, smoke is pure client cosmetics. Only "chimney lit yes/no" needs to sync.

### Gaps
- Chimney spawn interval and the farmhouse chimney position were not found in the files fetched. The decompile has no `chimney` string in `Building.cs` or `FarmHouse.cs`.
- No frame count for the campfire object or furnace flame was confirmed (wiki blocked).

## Q2. What other "puff" smoke columns are documented in devlogs?

### Takeaway
The pattern repeats. Spawn a puff at the stack top on a timer, give it slow upward speed plus inherited horizontal speed, decelerate, grow then shrink, fade, free it when the animation ends.

### Cited findings
- Iron Village prototype (Godot) train smoke: puff spawns at the stack on a timer, is not a child of the train, inherits the train's horizontal speed, rises slowly, decelerates "to mimic air resistance", expands then shrinks while fading. Puffs are sliced from a chimney-smoke sheet in Jamie Brownhill's World of Solaria set. Animation respects pause and 2x/4x game speed. https://lunar-chippy.itch.io/iron-village-prototype/devlog/725214/diary-14-settings-smoke
- OpenGameArt hosts CC0 "fire smoke animations" and a "chimney smoke animation". https://opengameart.org/content/fire-smoke-animations , https://opengameart.org/content/chimney-smoke-animation

### Inferences
- "Inherit emitter velocity" is a free trick. A puff from a moving cart or a running burning creature drifts behind it with no wind system.
- For an MMO, tie puff timers to the shared game clock so all clients see similar columns, but no sync per puff is needed.

### Gaps
- No shipped top-down game devlog gave an exact smoke particle count. Only Stardew's code gives per-puff numbers.

## Q3. RuneScape firemaking: rules and durations

### Takeaway
RuneScape fires are tile objects with a random lifetime, a fixed post-light step, and an ash object left behind. Good model for a server-authoritative tile fire in Asterion.

### Cited findings
OSRS (https://oldschool.runescape.wiki/w/Fire):
- A fire lasts about 1 to 2 minutes. A Jagex mod stated "60 to 119 seconds, randomly chosen".
- Log type does not change duration in OSRS.
- Burnt-out fire leaves ashes.
- After lighting, the player steps west. If blocked then east, then south, then north. If all are blocked the player stays on the fire tile.
- Cannot light on another fire, on scenery (ferns, flowers), or in front of a closed door. Open doors are fine. Most banks and many minigames block fires.
- If several players light on the same tile at once, only one fire spawns and the other logs drop.
- 45 permanent fire locations exist. Logs used on an existing fire make a Forester's Campfire.
- Gnomish firelighters make red, green, blue, purple or white fires (colour variants with the same rules).
- RuneScape Classic: logs could only be lit from the ground, one click per attempt.

RS3 (https://runescape.wiki/w/Firemaking):
- In RS3 each log type has a fixed burn timer, better logs burn longer (no seconds listed on the page).
- Same west-then-east-then-south-then-north step rule.
- Bonfires added 10 May 2012. Logs feed automatically. Multiple players add up to about 4% extra XP. Bonfires can release fire spirits. Warmth boosts max life points.
- Before bonfires, "line firemaking" rows of fires filled the Grand Exchange. The GE now blocks fires within 2 squares of the desks.

### Inferences
- The 60-119 s random life spreads burnouts so a row of fires dies one by one, not all at once. Cheap and it looks natural.
- The fixed west step turns firemaking into visible lines of fire across the map. That is emergent level art made by players.
- For Asterion, "one fire per tile, first request wins, rest drop as items" is a clean server conflict rule.

### Gaps
- No tick count is given (OSRS ticks are 0.6 s, so 60-119 s is about 100-198 ticks; not stated on the page).
- No info on the fire sprite frame count.

## Q4. Ultima Online Fire Field

### Takeaway
A 5-tile wall that burns anyone standing in it at a low flat rate, lasting tens of seconds scaled by skill. Close relative of Tibia fire fields.

### Cited findings
- UOGuide (via search snippet, page 403 to fetcher): duration "50% Magery + 4 seconds (up to 64)". Area "5 tiles in a row, perpendicular to the caster, centered on targetted tile". https://www.uoguide.com/Fire_Field
- Ultima Codex Magery list: "Deals 2 damage per second to anyone touching the field." https://wiki.ultimacodex.com/wiki/Ultima_Online_Magery_Spells , https://wiki.ultimacodex.com/wiki/Fire_Field
- UO Outlands (a private shard) uses `120 * (Magery/100)` seconds. https://wiki.uooutlands.com/Template:SpellCircles
- UOX3 emulator forum reports damage of magery/50 unresisted, magery/100 resisted (emulator, not official). https://www.forums.uox3.org/viewtopic.php?p=11950

### Inferences
- At GM Magery (100) the official field lasts 54 s. Outlands doubles that to 120 s.
- Perpendicular placement means the wall blocks a corridor between caster and target. Same tactical shape as a Tibia fire wall rune.

### Gaps
- Sources disagree; era not confirmed. No frame data for the field sprite.

## Q5. Wildfire (Sneaky Bastards, 2020): a whole game about spreading fire

### Takeaway
Wildfire is a 2D pixel-art stealth platformer (side view, not top-down) built in GameMaker. Its designer took Far Cry 2's fire spread, found that alone "can't make a whole game", and made the fire steerable plus added counter-elements. Tall grass is both a hiding place and fuel. That dual role is the lesson for us.

### Cited findings
- Release May 2020, Humble Games; about 76 on OpenCritic. https://opencritic.com/game/9522/wildfire/reviews?order=asc
- Siliconera interview with designer Daniel Hindes (26 March 2015). https://siliconera.com/?p=469568
  - Basic fire spread mechanic comes from Far Cry 2.
  - Goal is a situation that can "gradually spiral out of control".
  - Tall grass hides the player and is flammable: "every opportunity can also be a hazard".
  - Vines (climbable) catch fire. Wooden bridges burn away and force a new route. A planned level has fire spreading up a wooden structure.
  - Ice and snow melt on contact with fire.
  - Fire is light and heat, so at night it exposes the player and removes hiding spots.
  - "No direct way to kill or remove" enemies. Players use fire and terrain.
  - Built in GameMaker.
- GameCloud PAX Aus 2016 interview with Hindes. https://gamecloud.net.au/features/interviews/pax-aus-2016-wildfire-creator-dan-hindes
  - Began with "a pretty simple 2D fire propagation system".
  - Fire checks nearby wood every frame (about 60 Hz). Wood heats while touching flame.
  - Scaling that check over many fires was the main optimisation risk. Without care it could drop to roughly 10 fps.
  - Later elements: fire upgrades into smoke bombs, water into ice, earth vines trap guards and can then be burned.
- Shacknews review: fire burns wooden barricades, grass, vines; lighting the wrong bridge spreads fast and can destroy hiding spots and paths; waterfalls "immediately douse" your flame; fire can become smokebombs that stun. https://www.shacknews.com/article/118342/wildfire-review-starting-fires-its-my-desire
- Common critique: stealth is basic and guards are hard to read (reviews aggregated on OpenCritic, link above; also https://www.nme.com/reviews/wildfire-review-a-charming-2d-stealth-platformer-bursting-with-chaotic-energy-2675703).

### Inferences
- Per-frame heat checks are wasteful. A tile game should use a heat value per tile updated at a slow tick (2-5 Hz) and an active list (see 03 Q4).
- "Fuel that is also cover" (grass, hedges, wooden palisades) gives fire a meaning in PvP for Asterion: burn the hedge the archers hide in.

### Gaps
- No Wildfire devlog or code with spread rates or heat thresholds was found. The Sneaky Bastards blog was not reached.

## Q6. Fire rules in other top-down pixel games (wiki numbers)

### Cited findings
- Sigil of Kings (roguelike devlog, April 2024): fire object with fuel such as 5 turns; inert for the first 3-4 turns, then tries to ignite neighbours; a neighbouring tree has a 20% chance. Checking neighbours from turn one "burned the whole forest". Off-screen levels simulate a set number of turns then freeze. https://byte-arcane.itch.io/sigil-of-kings/devlog/712302/wildfires
- Enter the Gungeon: burning enemies take damage over time; green fire is permanent on regular enemies but time-limited on bosses; entering Bello's shop clears player burning. https://enterthegungeon.wiki.gg/wiki/Status_Effects . Fire and oil interactions live on the goop page https://enterthegungeon.wiki.gg/wiki/Goop (not fetched).
- Sea of Stars: campfires are rest and cooking points; one engineer (Jeakim Hamel) built the dynamic lighting from 2018 and "all of the assets" had to answer to its needs. https://twinfinite.net/news/sea-of-stars-camping/ , https://megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels , https://mobilesyrup.com/2023/09/11/sea-of-stars-level-design-sabotage-studio-thierry-boulanger-interview/

### Inferences
- Sigil of Kings's "inert first, contagious later" delay is the same trick as a burn state machine with an ignition delay. It stops the instant chain reaction.

## Q7. Game list with see-it-in-action URLs

URLs marked (fetched) were read this session. Others are standard reference pages that were not fetched; treat the description as my recollection, to verify before quoting in the study.

| Game | View | What is specific | See it |
|---|---|---|---|
| Stardew Valley | 3/4 | 4-frame 12x11 torch at 10 fps with per-tile phase, 3 ember pixels, grey puff smoke that grows, drifts and fades (Q1) | https://github.com/E-riCA0/StawdewValley (fetched), https://stardewvalleywiki.com/Campfire |
| RuneScape / OSRS | 3D but tile-based | 60-119 s random fire life, ash object, west-step lines of fire (Q3) | https://oldschool.runescape.wiki/w/Fire (fetched) |
| Ultima Online | isometric | 5-tile fire field, 2 dps, 50% Magery + 4 s (Q4) | https://wiki.ultimacodex.com/wiki/Fire_Field |
| Tibia | top-down | fire fields, burning condition (see 01 Q4) | https://tibia.fandom.com/wiki/Fire_Field |
| Wildfire | side view | grass is cover and fuel, bridges burn, waterfalls douse (Q5) | https://siliconera.com/?p=469568 (fetched) |
| Zelda: A Link to the Past | 3/4 | Lamp lights room torches; Fire Rod burns bushes. Torches in some rooms go out after a while (unverified) | https://zeldawiki.wiki/wiki/Fire_Rod (403) |
| Zelda: Minish Cap | 3/4 | Flame Lantern lights torches and burns bushes (see 01 Q6) | https://zeldawiki.wiki/wiki/Flame_Lantern |
| Enter the Gungeon | top-down | burn DoT, green permanent fire, fire on oil goop | https://enterthegungeon.wiki.gg/wiki/Status_Effects |
| Nuclear Throne | top-down | flame trails and explosions, heavy screenshake (see 06) | https://nuclearthrone.fandom.com/wiki/Flame_Shell |
| Hyper Light Drifter | 3/4 | stylised flat-colour fire and smoke (see 02) | https://store.steampowered.com/app/257850/ |
| Eastward | 3/4 | pixel art with 3D lighting (see 02) | https://store.steampowered.com/app/977880/ |
| Sea of Stars | 3/4 | campfire scenes under dynamic time-of-day light | https://twinfinite.net/news/sea-of-stars-camping/ (search result) |
| CrossCode | 3/4 | heat element, fire puzzles and flame attacks | https://crosscode.fandom.com/wiki/Heat |
| Chained Echoes | 3/4 | 16-bit style JRPG fire spells | https://store.steampowered.com/app/1229240/ |
| Moonlighter | top-down | fire dungeon biome, flame hazards | https://store.steampowered.com/app/606150/ |
| Children of Morta | 3/4 | hand-animated fire and lava zones | https://store.steampowered.com/app/330020/ |
| Graveyard Keeper | 3/4 | furnaces, cremation, kiln smoke | https://store.steampowered.com/app/599140/ |
| Forager | top-down | furnaces with smoke puffs | https://store.steampowered.com/app/751780/ |
| Core Keeper | top-down | burning debuff, torches, campfires, lava biome | https://corekeeper.atma.gg/en/Burning (403) |
| Songs of Conquest | 3/4 pixel strategy | fire spells on a battlefield grid | https://store.steampowered.com/app/867210/ |
| Into the Breach | isometric | fire tiles, burning units take 1 damage per turn (see 02, 06) | https://intothebreach.fandom.com/wiki/Fire |
| Wargroove | top-down | fire and explosion hit effects on a tile grid | https://store.steampowered.com/app/607050/ |
| Undertale / Deltarune | top-down | flat palette fire bullets (Grillby, Asgore) | https://undertale.fandom.com/wiki/Asgore_Dreemurr |
| Octopath Traveler | HD-2D | pixel sprites with real-time fire light and bloom | https://store.steampowered.com/app/921570/ |

## Q8. Pixel smoke styles and smoke colour vs fire state

### Takeaway
Three styles show up. Outlined puffs (Stardew-like round sprites, readable at any zoom). Soft dithered puffs (no alpha, fit strict palettes; see 08 Q4). Palette-faded puffs (step the puff through 3-4 greys toward the background colour). Stardew uses the cheapest version, one grey sprite with alpha fade and a tint.

### Cited findings
- Stardew tints a single puff sprite with `Color.Gray` and fades alpha from 0.75 at 0.002 per update (Q1).
- The Wizard cauldron smoke is green; forum users could not find it as a sprite in data files, which suggests it is a tinted temporary sprite in code. https://forums.stardewvalley.net/threads/i-want-to-remove-the-green-smokes-of-the-wizard-cauldron-how-can-i-find-the-animation-file.31140

### Inferences
- Because Stardew tints one sprite, colour is a parameter. Map fire state to tint: white for steam (water on fire), light grey for wood smoke, near black for oil or building fires, green or purple for magic. One sprite, four meanings.
- For a strict-palette game, swap alpha fade for a 3-step palette ramp plus a final dither frame. Same lifetime math.

### Gaps
- No shipped-game source spelled out a steam-vs-soot colour rule. This is a design inference.

## Sources
- https://github.com/E-riCA0/StawdewValley (Torch.cs, Utility.cs, Object.cs, Locations/Town.cs)
- https://forums.stardewvalley.net/threads/1-6-bug-fireplace-flicker-on-wilderness-farm.33952
- https://forums.stardewvalley.net/threads/i-want-to-remove-the-green-smokes-of-the-wizard-cauldron-how-can-i-find-the-animation-file.31140
- https://lunar-chippy.itch.io/iron-village-prototype/devlog/725214/diary-14-settings-smoke
- https://opengameart.org/content/fire-smoke-animations
- https://opengameart.org/content/chimney-smoke-animation
- https://oldschool.runescape.wiki/w/Fire
- https://runescape.wiki/w/Firemaking
- https://www.uoguide.com/Fire_Field
- https://wiki.ultimacodex.com/wiki/Ultima_Online_Magery_Spells
- https://wiki.ultimacodex.com/wiki/Fire_Field
- https://wiki.uooutlands.com/Template:SpellCircles
- https://www.forums.uox3.org/viewtopic.php?p=11950
- https://siliconera.com/?p=469568
- https://gamecloud.net.au/features/interviews/pax-aus-2016-wildfire-creator-dan-hindes
- https://www.shacknews.com/article/118342/wildfire-review-starting-fires-its-my-desire
- https://opencritic.com/game/9522/wildfire/reviews?order=asc
- https://www.nme.com/reviews/wildfire-review-a-charming-2d-stealth-platformer-bursting-with-chaotic-energy-2675703
- https://byte-arcane.itch.io/sigil-of-kings/devlog/712302/wildfires
- https://enterthegungeon.wiki.gg/wiki/Status_Effects
- https://enterthegungeon.wiki.gg/wiki/Goop
- https://twinfinite.net/news/sea-of-stars-camping/
- https://megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels
- https://mobilesyrup.com/2023/09/11/sea-of-stars-level-design-sabotage-studio-thierry-boulanger-interview/
