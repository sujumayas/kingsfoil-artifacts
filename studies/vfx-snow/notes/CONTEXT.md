# Shared context for all snow researchers

## The user and project
- Indie game dev (Kingsfoil Studios). Games built in Godot 4 (web-first, also mobile/desktop). Small team.
- Target look: TOP-DOWN pixel art (Tibia-like MMORPG "Asterion Online", top-down RPG). 2D tiles, low-res, palette-limited. 3D/particles allowed if they serve a pixel look.
- Series: "one research per concept" of overly simplified, super-efficient, old-school algorithms for VFX/textures. Reference case: the DOOM PSX fire algorithm (Fabien Sanglard write-up https://fabiensanglard.net/doom_fire_psx/ ; Filipe Deschamps playground https://github.com/filipedeschamps/doom-fire-algorithm): a tiny cellular automaton over a palette-index buffer that looks great.
- THIS study's concept: SNOW (top-down, pixel art). Must cover:
  1. Falling snow (layers, wind, parallax in top-down view, flakes landing).
  2. Accumulation: covering exposed places more than sheltered ones (under roofs/trees, lee side of walls, drifts), snow on objects (roofs, trees, fences).
  3. Interaction with characters/objects: footprints, trails, depth (characters sink, slow down), kicked-up puffs, carts/sleds, plowed paths, filling back in.
  4. Time: snow generates itself when snowing (gradual build-up), slowly melts/evaporates on a sunny day (edges first, sun vs shade), slush/wet ground, refreezing.
- Goal: find the MOST EFFICIENT and REALLY GOOD (taste, artist-validated) ideas that make the world feel alive.
- Final output (written later by others): a study where each technique gets "In plain words", "How it works (technical)", "Cost/performance", "Games that used it" (with URL), "How it feels", "Risks". Plus playable canvas demos. So collect concrete algorithms, pseudocode-level details, numbers, and parameters.

## Rules for every researcher
- Cite a URL for every claim; include concrete numbers (ms, buffer sizes, resolutions, cell counts, rates, dates, versions).
- Separate cited findings from your inferences; list gaps honestly instead of guessing.
- Flag vendor-reported figures.
- Never copy/download images. For every game example collect a "see it in action" reference URL (wiki page, article, devlog, or video page).
- Quotes under 15 words.
- If a site is blocked, note it and try mirrors (archive.org, author pages, github README).
- Notes structure: per key question -> Takeaway / Cited findings / Inferences / Gaps. End with a "Sources" list.
- Stop at about 25–35 tool calls. Save your notes as markdown to the path given in your brief, then reply with a SHORT summary (<=200 words) of the top findings.
