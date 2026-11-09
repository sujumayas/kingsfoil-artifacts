# Shared context for all ACID researchers

## The user and project
- Indie game dev (Kingsfoil Studios). Games in Godot 4 (web-first => Compatibility/WebGL2 renderer; also mobile/desktop). Small team.
- Target look: TOP-DOWN pixel art (Tibia-like MMORPG "Asterion Online", top-down RPG / dungeon). 2D tiles, low-res, palette-limited. Particles/3D allowed if they serve a pixel look.
- Series: "one research per concept" of overly simplified, super-efficient, old-school algorithms for VFX/textures. Reference = DOOM PSX fire (palette-index cellular automaton). Study #1 was SNOW (per-pixel depth byte + dither threshold, exposure mask, conserve-and-displace footprints, melt = T×sun×shade×edge, palette lighting) — published at https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel . Reuse/compare with that where it fits.
- THIS study's concept: ACID (top-down, pixel art). Must cover:
  1. Acid as a liquid/surface: pools, spills, spreading/flow, puddle shapes, bubbling/fizzing, fumes/gas, glow, stains/etch marks left behind.
  2. Interaction with MATERIALS: flesh (characters/creatures: damage over time, sizzle, tint, wounds — tasteful, game-appropriate), wood, iron/steel, stone, bone, leather, cloth, gold/glass (resistant), and equipment: swords, shields, armor, boots — corrosion stages, durability, holes, rust, dissolving, item loss.
  3. ACID-LIKE CREATURES (slimes, oozes, jellies, gelatinous cubes, acid-blooded aliens) that use the same rendering/simulation logic as the acid (metaballs/threshold fields, trails, splitting, absorbing/digesting items, bursting into pools).
  4. TIME: spreading, evaporation, neutralization (water dilution, base/lime), self-limiting reactions (acid consumed), corrosion progressing over minutes, rust after exposure, stains fading.
  5. Common acid interactions & systemic combos (acid + water, + fire, + metal => gas, + base => salt, acid gas clouds, armor reduction, item erosion).
  6. REALLY GOOD games that did something spectacular with acid/corrosion/goo — reference them with links.
- Goal: the MOST EFFICIENT and REALLY GOOD (artist/player validated) ideas that make the world feel alive and reactive.
- Final output (written later): each technique gets "In plain words", "How it works (technical)", "Cost/performance", "Games that used it" (URL), "How it feels", "Risks". Plus playable canvas demos. Collect concrete algorithms, pseudocode-level details, numbers, parameters, data tables (damage values, durations, rates).

## Rules for every researcher
- Cite a URL for every claim; include concrete numbers (damage, durations, rates, buffer sizes, ms, versions, dates).
- Separate cited findings from your inferences; list gaps honestly instead of guessing. Flag vendor-reported figures.
- Never copy/download images. For every game example collect a "see it in action" reference URL (wiki page, article, devlog, or video page).
- Quotes under 15 words.
- Keep flesh/gore content tasteful and game-design oriented (no graphic real-world injury detail beyond what a game needs).
- If a site is blocked, note it and try mirrors (archive.org, github README, author pages).
- Notes structure: per key question -> Takeaway / Cited findings / Inferences / Gaps. End with "Sources".
- Stop at about 25–35 tool calls. Save notes as markdown to the path given, then reply with a SHORT summary (<=200 words).
