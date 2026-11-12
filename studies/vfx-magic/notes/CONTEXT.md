# Shared context for all MAGIC AND SPELL VFX researchers

## The user and project
- Indie game dev (Kingsfoil Studios). Godot 4 games, web-first (=> Compatibility/WebGL2 renderer: no compute shaders, no HDR 2D glow, limited 2D lights), also mobile/desktop. Small team; must run WITHOUT a big computer.
- Target look: TOP-DOWN (3/4) pixel art. Tibia-like MMORPG "Asterion Online" (server-authoritative, 32x32 tile grid, many players on one screen, PvE and PvP) and a top-down RPG. 2D tiles and sprites, low-res (the sandbox is 320x180), palette-limited.
- Combat model is HYBRID: targeted spells (Tibia/WoW style, cannot miss) and aimed spells (lines, cones, circles, projectiles that can miss) on the same hotbar.
- Series "one concept per study" on simple, super-efficient, old-school VFX algorithms. Series reference: the DOOM PSX fire (Fabien Sanglard: https://fabiensanglard.net/doom_fire_psx/).

## THE TWO MAIN GOALS (equal weight, the user stressed both)
1. ARTISTIC QUALITY: what makes a spell look powerful, beautiful and READABLE in pixel art, validated by artists and players (anticipation / climax / dissipation timing in frames and ms, colour ramps with a white-hot core, shape language per element, value contrast against busy ground, frame counts, whole-pixel motion, restraint). Find artist sources and praised games.
2. RUNTIME EFFICIENCY: what each technique really costs on low-end web (Godot Compatibility/WebGL2, mobile). Collect MEASURED numbers wherever they exist (ms per frame, draw calls, particle counts, overdraw, texture sizes, bytes on the network). Mark estimates as estimates. Prefer cheap AND beautiful; call out pretty-but-expensive and cheap-but-ugly. The hard case is 30 players casting on one screen.

## Previous studies (reuse, compare, do not repeat at length)
- VFX #1 Snow, #2 Acid (glow via block-sum blur + palette select; goop fields, DoT cues), #3 Rain, #4 Forest, #5 Light (Tibia light model, additive low-res light map, flicker as data, glow without alpha G2), #6 Fire & smoke (DOOM fire, fire spread grid, smoke), #7 Water, #8 Fog (noise tables, world-locked dither, measured costs), #9 Grass (pooled small life, trail maps, measured costs). URLs: https://kingsfoil-artifacts.netlify.app/vfx-<name>-topdown-pixel (snow, acid, rain, forest, light, fire, water, fog, grass).
- Game feel #2 Combat juice: https://kingsfoil-artifacts.netlify.app/feel-combat-juice-topdown-pixel . ALREADY COVERED there, link and do not repeat: hitstop, white hit flash, knockback, trauma screen shake, damage numbers (Tibia animated text), targeting, cast bars, cast modes and aim previews (E1), skillshot speed and width (E2), ground telegraph timing (E3), netcode prediction (F1-F3), effect tiers own/party/others/hostile as a rule (F5), hit sparks at 75 ms per frame as a feel rule (B4), combat audio. THIS study goes deep on how the spell EFFECTS THEMSELVES are drawn, animated, layered, budgeted and kept readable.

## THIS study #10: MAGIC AND SPELL VFX. Scope (the user wants depth on all of it)
1. PROJECTILES: missile sprites in 8 or 16 directions against run-time rotation in pixel art, flight time per tile, straight, homing, lobbed arcs with a shadow, beams and channels, chain lightning (midpoint displacement, branching), trails (ring-buffer ribbons, afterimages, particle wakes), whole-pixel motion, how Tibia/OTClient draws missiles.
2. IMPACTS AND AREAS: hit spark anatomy (flash, core, sparks, smoke), explosion flipbooks and frame timing, Tibia magic effects (one effect per tile, area masks, waves, the "UE" look), shockwave rings, residue (scorch marks, frost, lingering fields like fire, poison and energy fields).
3. AURAS, BUFFS, SHIELDS AND STATUS: effects split behind and in front of the character sprite, orbiting motes, shield bubbles, buff loops, status tints and overlays (burning, poisoned, frozen, shocked, cursed, hasted afterimages), heal sparkles, level-up bursts, outline and palette-swap shaders.
4. CAST AND CHARGE: magic circles and rune rings (hand-drawn or procedural), gathering particles, charge-up glow, channel loops, summoning, how the cast effect tells other players what is coming.
5. ELEMENT LANGUAGE: colour, shape and motion vocabulary per element (fire, ice, energy/lightning, earth/poison, holy, death, arcane, physical), friend/foe colouring, colour-blind safety with shape redundancy, how much brightness and saturation a spell may take from the scene.
6. READABILITY IN A CROWD: visual clutter with many casters, effect budgets and priorities, tiers (own / party / others / hostile), opacity and particle-count reduction for other players' spells, culling, what MMOs let players tune (FFXIV battle effects, WoW, GW2, Lost Ark, Albion, PoE), hostile telegraphs that always show.
7. SCREEN FEEDBACK AND ACCESSIBILITY: screen-edge flashes and tints, vignettes, low-health pulses, full-screen spell flashes, and the limits (photosensitivity rules such as 3 flashes per second, reduce-flash and reduce-motion settings).
8. RENDERING AT PIXEL SCALE: additive blending against palette-ramp "glow without alpha", low-res glow buffers, dithered transparency, palette cycling, flipbooks against procedural particles, CPU particles vs GPU particles vs MultiMesh in Godot 4 Compatibility on the web, pixel snapping, screen-reading shaders (distortion, shockwave) and their cost.
9. SERVER AND DATA: what the server sends for a spell (Tibia sends effect id + position, missile id + from + to), bytes per event in a 30-player fight, data-driven spell definitions (a spell as phases: cast, travel, impact, linger), throttling.
10. PROCEDURAL OLD-SCHOOL ALGORITHMS: lightning generators, particle systems since Reeves 1983, demoscene fire, plasma and palette tricks reused as spell effects, procedural sigils, noise and flow fields for arcane energy, dither dissolves.

- Final output: technique profiles ("In plain words", "How it works (technical)", "Cost/performance", "Games that used it" (URL), "How it feels", "Risks") plus playable canvas demos. Collect concrete algorithms, pseudocode-level details, numbers and parameters (frame counts, ms per frame, px sizes, missile ms per tile, trail lengths, particle counts, lifetimes, colour ramp steps, orbit radii and periods, flash durations, opacity percentages, caps, bytes, ms costs).
- Rating criteria for the study: Simplicity · Speed · Pixel taste · Mood · Readability.

## Rules for every researcher
- Cite a URL for every claim; include concrete numbers (ms, frames, px, counts, ranges, versions, dates).
- Separate cited findings from inferences; list gaps honestly. Flag vendor-reported figures.
- Never copy/download images. For every game example collect a "see it in action" reference URL (wiki page, article, devlog or video page).
- Quotes under 15 words.
- Many fan wikis (TibiaWiki, Fandom) return 402/403 and archive.org may be blocked: go to open-source code instead (OTClient, TFS/Canary, ClassicUO, rAthena/roBrowser, RuneLite/2009scape, pokeemerald and other decompilations, Shattered Pixel Dungeon, Mindustry, tModLoader, OpenDiablo2/DevilutionX, Veloren), GitHub READMEs, author pages, GDC Vault pages. Some MediaWiki wikis block pages but answer `api.php?action=parse&page=<Page>&prop=wikitext&format=json`.
- Notes structure: per key question -> Takeaway / Cited findings / Inferences / Gaps. End with "Sources".
- Scratch files go only in `studies/vfx-magic/notes/scratch-<your-file-number>/`. Never write outside your notes file and that folder.
- Stop at about 25-35 tool calls. Save notes as markdown to the given path, then reply with a SHORT summary (<=200 words) with your 5-8 most useful numbers.
