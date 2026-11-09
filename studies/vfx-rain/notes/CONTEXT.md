# Shared context for all RAIN researchers

## The user and project
- Indie game dev (Kingsfoil Studios). Godot 4 games, web-first (=> Compatibility/WebGL2 renderer: no compute shaders, limited GPU particles), also mobile/desktop. Small team.
- Target look: TOP-DOWN pixel art (Tibia-like MMORPG "Asterion Online", top-down RPG). 2D tiles, low-res, palette-limited.
- Series of "one concept per study" research on overly simplified, super-efficient, old-school VFX algorithms (reference: DOOM PSX fire, a palette-index cellular automaton).
  - #1 SNOW (https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel): per-pixel depth byte + dither threshold, exposure/shelter mask with wind lee rays, conserve-and-displace footprints, melt, palette lighting, z-height flakes with ground shadow dot.
  - #2 ACID (https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel): per-pixel liquid amount + flow with film threshold, material reaction table, stage colours, fumes grid, glow via palette select, metaball creatures.
  Reuse/compare with those where it fits.
- THIS study #3: WATER, focused on RAIN. SCOPE:
  - IN: rain from drizzle/low to heavy/storm (intensity tiers), WIND (slant, gusts, rain curtains/sheets, rain shadow), rain on standing water (lakes, ponds, pools, fountains, puddles: ripples, splash rings, surface roughness), how rain WETS different materials (ground/dirt→mud, grass, stone/cobble, wood, cloth/awnings, metal, sand, roofs, characters/clothes/hair, items) and how they DRY over time (sun, wind, shade), puddle formation, drips (eaves, trees, after-rain), splashes, footprints/wet prints, interaction with fire (extinguish/steam), lightning/thunder in storms, gameplay effects in top-down games (visibility, sound/stealth, fire/electric/element combos, movement/slipping, NPC behaviour, crops), and AT LEAST ONE interaction with fog/mist (e.g., rain spray haze, post-rain ground mist/evaporation, rain clearing fog).
  - OUT: rivers, sea/ocean, waterfalls, deep fog as its own topic.
- Goal: the MOST EFFICIENT and REALLY GOOD (artist/player validated) ideas that make the world feel alive.
- Final output (written later): each technique gets "In plain words", "How it works (technical)", "Cost/performance", "Games that used it" (URL), "How it feels", "Risks", plus playable canvas demos. Collect concrete algorithms, pseudocode-level details, numbers, parameters.

## Rules for every researcher
- Cite a URL for every claim; include concrete numbers (drop counts, speeds, angles, rates, mm/h, durations, ms, buffer sizes, versions, dates).
- Separate cited findings from inferences; list gaps honestly. Flag vendor-reported figures.
- Never copy/download images. For every game example collect a "see it in action" reference URL (wiki page, article, devlog or video page).
- Quotes under 15 words.
- If a site is blocked, note it and try mirrors (archive.org, github README, author pages).
- Notes structure: per key question -> Takeaway / Cited findings / Inferences / Gaps. End with "Sources".
- Stop at about 25–35 tool calls. Save notes as markdown to the given path, then reply with a SHORT summary (<=200 words).
