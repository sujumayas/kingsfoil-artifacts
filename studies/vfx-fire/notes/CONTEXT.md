# Shared context for all FIRE & SMOKE researchers

## The user and project
- Indie game dev (Kingsfoil Studios). Godot 4 games, web-first (=> Compatibility/WebGL2 renderer: no compute shaders, limited 2D lights), also mobile/desktop. Small team; must run WITHOUT a big computer.
- Target look: TOP-DOWN (3/4) pixel art. Tibia-like MMORPG "Asterion Online" (server-authoritative, tile grid, many players see the same fire) and a top-down RPG. 2D tiles/sprites, low-res (sandbox is 320x180), palette-limited.
- Tibia itself has fire fields (fire field / energy field / poison field items, magic wall, firebomb rune, burning status "conditions" that deal damage per tick, campfires, lava): research its rules and numbers.
- Series "one concept per study" on simple, super-efficient, old-school VFX algorithms. Series reference: the DOOM PSX fire (Fabien Sanglard: https://fabiensanglard.net/doom_fire_psx/). Fire & smoke is the DOOM fire's own study, so go deep on it and its relatives (demoscene fire, Lode's fire, Hugo Elias, etc.).
- Previous studies (reuse, compare, do not repeat at length):
  - #1 Snow (palette lighting, dithered lamp pools): https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
  - #2 Acid (glow via block-sum blur + palette select, bubbling pools): https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel
  - #3 Rain (lightning flash palettes, firelight under rain, splashes): https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel
  - #4 Forest (shade ellipses, sunflecks, canopy, wind): https://kingsfoil-artifacts.netlify.app/vfx-forest-topdown-pixel
  - #5 Light (Tibia light model, Quake light-style flicker strings at 10 Hz, DOOM 8.75 Hz flicker, candle physics 10-12 Hz flame oscillation, polar shadow maps, carried torches): https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel
  Fire as a LIGHT SOURCE is already covered by #5. This study is about the FIRE AND SMOKE THEMSELVES: how they look, move, spread, and interact.

## THIS study #6: FIRE AND SMOKE. Scope (the user wants depth on all four):
1. SMALL FIRES & FLICKER: campfires, torches, braziers, candles, hearths, forges, the DOOM fire algorithm itself (and variants: demoscene fire, 2D fire buffers, cooling maps), palette ramps (black-red-orange-yellow-white), hand-drawn flame loops (frame counts, fps), embers and sparks, heat shimmer/distortion, flame shapes in top-down 3/4 view.
2. SPREADING FIRE: cellular-automaton fire spread over tiles (grass, trees, wood buildings), burn states (fresh -> burning -> charred/ash), fuel and moisture, wind bias, rain/water extinguishing, wildfire. Systemic-fire games (Far Cry 2, Divinity Original Sin, Breath of the Wild, Noita, Dwarf Fortress, Minecraft fire tick, Don't Starve, Terraria, Rimworld, Spelunky, Brogue/DCSS roguelike fire, Into the Breach, Teardown etc.). Classic forest-fire CA models (Drossel-Schwabl), Rothermel.
3. SMOKE & STEAM: smoke columns, chimneys, wind drift, steam from extinguished fire, smoke from burning buildings, cheap fluid/advection fakes (Jos Stam "stable fluids", curl noise, particle puffs, sprite-sheet smoke, flipbooks), smoke occluding vision (fog-of-war like), dithering for transparency in pixel art.
4. COMBAT FIRE: fireballs, explosions (pixel explosion anatomy: flash, fireball, smoke, debris), burning status on creatures (damage over time, visual), fire fields (Tibia-style), lava, flamethrowers, fire trails, screen shake/hitstop readability.

- Goal: the MOST EFFICIENT and REALLY GOOD (artist/player validated) ideas.
- Final output: technique profiles ("In plain words", "How it works (technical)", "Cost/performance", "Games that used it" (URL), "How it feels", "Risks") plus playable canvas demos. Collect concrete algorithms, pseudocode-level details, numbers, parameters (grid sizes, decay rates, palette sizes, frame counts, fps, spread probabilities, tick rates, damage per tick).
- Rating criteria for the study: Simplicity · Speed · Pixel taste · Mood · Interactivity.

## Rules for every researcher
- Cite a URL for every claim; include concrete numbers (ms, counts, ranges, rates, frame counts, palette sizes, versions, dates).
- Separate cited findings from inferences; list gaps honestly. Flag vendor-reported figures.
- Never copy/download images. For every game example collect a "see it in action" reference URL (wiki page, article, devlog or video page).
- Quotes under 15 words.
- If a site is blocked, note it and try mirrors (archive.org, github README, author pages, wikis).
- Notes structure: per key question -> Takeaway / Cited findings / Inferences / Gaps. End with "Sources".
- Stop at about 25-35 tool calls. Save notes as markdown to the given path, then reply with a SHORT summary (<=200 words).
