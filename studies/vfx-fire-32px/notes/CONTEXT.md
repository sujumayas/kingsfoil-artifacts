# Shared context for all FIRE AT 32 PX researchers

## The user and project
- Indie game dev (Kingsfoil Studios). Godot 4 games, web-first (Compatibility / WebGL2 renderer: no compute shaders, no HDR 2D glow, limited 2D lights), also mobile and desktop. Small team. Must run without a big computer.
- Target game: "Asterion Online", a Tibia-like top-down (3/4) pixel-art MMORPG. Server-authoritative, 32x32 px tile grid, characters walk tile to tile, many players see the same fire burn the same way.
- Series "one concept per study" on simple, super-efficient, old-school VFX algorithms. Series reference: the DOOM PSX fire (https://fabiensanglard.net/doom_fire_psx/).

## Why this study exists (the user's request, 13 Nov 2026)
VFX #6 Fire (https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel) built its sandbox at 320x180 with 8 px cells and tiny sprites. That is a quarter of the game's real scale. VFX #11 Snow at 32 px (https://kingsfoil-artifacts.netlify.app/vfx-snow-32px-topdown-pixel) already redid the snow study at the real scale. The user now wants the same for fire: the fire engine at 32x32 px tiles with characters about 24x32 px.

So this study, VFX #12, does NOT research fire again. It asks one question: **what changes when the fire engine moves from 8 px cells and tiny sprites to 32 px tiles and 24x32 characters, at a 640x360 native canvas (20 x 11.25 tiles, 4 times the pixels)?**

## What VFX #6 already settled (read `studies/vfx-fire/report.md` §1, §6, §7, §8 before starting; do not repeat it)
- DOOM fire: heat 0 to 36, 37 palette entries, copy from the pixel below into a column shifted +1 to -2, minus `rand & 1`. Flames reach about 72 rows. A 16x32 torch patch is 512 updates per frame.
- Flame loops: 4 to 6 frames at 8 to 12 fps with 4 tones, base still, phase seeded per tile (Stardew `x*3047 + y*88`). Puff rate `f = 1.5 / sqrt(D)`: candle 15 Hz, campfire 2 Hz, burning house under 1 Hz. Stardew torch 4 x 100 ms, 12x11 px (at 16 px tiles).
- Spreading fire: per-cell material, fuel, moisture, state (none, igniting, burning, embers, ash), 4 Hz server tick, active list (10x faster than a full sweep in JS, 35x in GDScript), ignition `base(material) x (1 - moisture) x wind x (diag ? 0.7 : 1)`, p about 0.35 to 0.6 with 3 to 6 burn ticks, hash RNG `hash(x, y, tick, seed)` for determinism, budgets (Far Cry 2: 60 points, 8 per cell), Alexandridis wind, Minecraft rain 20% + 3% per age step. Material table in its §6b.
- Smoke: a byte field (80 x 45 at 320x180, so 4 px cells) advected by wind plus rise, decay 1 to 3 per tick, drawn through a 4x4 Bayer threshold. Grey smoke, white steam, black oil. Stardew chimney puffs rise 0.5 px per frame and fade over about 6 s. Stam fluids too slow (32 ms at 320x180 in JS).
- Embers: a 256-slot pool coloured by age through the ramp.
- Combat: Tibia fire field (TFS: 20 on entry then 7 x 10 every 10 s, three 120 s stages, last harmless), firebomb 3x3, fire wall 1x5, burn stacks (Mewgenics), strongest ground effect only (PoE). Fireball anatomy: flash, fireball, smoke, debris.
- Godot: server truth on CPU, cosmetics client-only from hashes, ignition/extinguish events instead of diffs, avoid SCREEN_TEXTURE haze on Compatibility, DrawableTexture2D (4.7) untested on web.
- Measured on an Apple M4 Pro (VFX #6 note 03): fire CA active list 0.056 ms JS at 320x180; smoke CA 0.077 ms JS; smoke advect + decay 0.31 ms JS at 320x180.
- The ten research notes are in `studies/vfx-fire/notes/01..10-*.md`. Reuse their sources by pointing to them; add only what is new.

## What VFX #11 (snow at 32 px) found that probably carries over (read `studies/vfx-snow-32px/report.md` §1, §6b, §7 and `notes/SANDBOX-SPEC.md` "As built")
- 640x360 base with whole-number scaling. A field can stay at 320x180 (1:2) and be drawn at art resolution with bilinear 9/3/3/1 weights and a threshold; nearest sampling at 1:4 looks blocky.
- A painted "art threshold map" (clusters of at least 2x2 px, dither only in a 2 to 3 px edge band) beats Bayer at 32 px. 4x4 Bayer at low levels puts isolated single pixels everywhere, which reads as noise next to hand-drawn 32 px art.
- 1 px particles read too thin at 32 px; sizes scale with the tile (1, 2, 3 px far to near; 0.1875 of a tile for big flakes).
- Characters: 4-frame walk, contacts on frames 0 and 2, 400 ms per tile, 8 px per frame.
- Godot Compatibility uploads whole textures (no sub-rectangle update): 640x360 RGBA8 is 921,600 bytes.
- The ground render was 68 to 71% of a CPU frame at 640x360; a whole snow frame was about 2 ms on an M4 Pro.

## THE TWO MAIN GOALS (equal weight, the user stresses both in every VFX study)
1. ARTISTIC QUALITY at 32 px. A 4-tone flame of 8 px, a 37-step DOOM gradient with 1 px grain, 1 px embers and Bayer-dithered smoke can look thin, noisy or "programmer art" next to hand-drawn 32 px tiles and 24x32 characters. Find what pixel artists and praised games do at this size: flame shapes and frame counts by size, tone counts, smoke puffs, embers, burnt ground, burning trees and houses, burning characters, explosions.
2. RUNTIME EFFICIENCY at 4 times the pixels. What each layer costs at 640x360 on low-end web, with MEASURED numbers where they exist (ms per frame, bytes uploaded, cells per tick, draw calls). Mark estimates as estimates. The hard question is which buffers must grow with the art resolution (flame buffers, smoke, burn fronts, light) and which can stay small (the spread grid, the server state).

## Scope of THIS study (the scale questions)
1. FLAMES AT 32 PX. Hand-drawn loops sized for 32 px tiles: torch, candle, brazier, campfire, bonfire, burning tile, burning tree, burning house. Sizes in px, frame counts, fps, tone counts, hue shift. The DOOM buffer at 32 px: run it 1:1 at art resolution (bigger buffers, 1 px grain) or 1:2 and draw 2x2 (VFX #6's cost, chunky look), how to tune decay for a flame height in px and tiles, how many palette steps survive when the art uses 4 to 6 tones, outlines or not.
2. SPREAD GRID AGAINST ART RESOLUTION. One fire cell per 32 px tile (what the server stores, 240 tiles on screen), per 16 px (the VFX #6 cell count), or per 8 px. How to draw a per-tile burn so fronts do not look like squares: a painted burn-order map per tile (the snow art threshold idea, applied to scorch and ash), the front entering a tile from the side the fire came from, dual-grid or 47-blob scorch autotiles, a mask between the normal tileset and a burnt tileset, dissolve-style burn edges with a glowing rim.
3. BURNT WORLD ART AT 32 PX. Scorched, charred and ash ground tiles, burnt trees and stumps, burning and burnt houses (which parts burn, collapse stages), regrowth, how many states an artist draws, how wide the glowing edge band is in px.
4. SMOKE, STEAM AND EMBERS AT 32 PX. Smoke field cell size (4, 8 or 16 px), drawing it with clusters against Bayer, puff sprite sizes in px, column height in tiles, chimney smoke, steam, ember and spark sizes (1, 2 or 3 px) and counts per fire.
5. CHARACTERS AT 24x32. Burning status overlay on a 24x32 sprite (how many flames, how big, tint, flash), carrying a torch through a 4-frame walk (hand offsets, flame size), warm rim light on the side facing a fire, shadows away from fire, walking through fire fields and ash, ash footprints, charred or death frames, many players with torches on one screen.
6. COMBAT FIRE AND LAVA AT 32 PX. Tibia fire effects and missiles (sprite sizes, frames and ms from open-source clients and asset data), fire field stage sprites, firebomb 3x3, fire wall 1x5, great fireball radius, explosion anatomy at 32 to 96 px (frames, ms, sizes against the tile), projectile speeds in tiles per second, scorch decals, screen shake in px at 640x360, lava at 32 px (palette cycling, crust noise scale against the tile).
7. LIGHT AT 32 PX (only the scale question; VFX #5 covered light itself). Light map resolution against art resolution (per tile, per 8 px, per 4 px), dither band width for warm pools at 32 px, Tibia light radius in tiles, cost.
8. COST. Per-pixel render work is 4x. Flame buffers that are tied to art pixels grow 4x. What the GPU path (a CanvasItem shader with noise fire quantized to the palette, or a small field texture) makes free. Texture upload size per tick in Godot. Godot 4 pixel-perfect settings for a 640x360 base, GPUParticles2D against CPUParticles2D on Compatibility, the state of `DrawableTexture2D` on the web.
9. GAMES AT THIS SIZE. How shipped games with roughly 32 px tiles or 24 to 32 px tall characters draw fire: Tibia (32 px), RPG Maker VX Ace (32 px) and MV/MZ (48 px) fire animations and tilesets, Stardew Valley (16 px tiles, 16x32 characters), Ultima Online, Ragnarok Online, Pokémon Gen 4 and 5, CrossCode, Eastward, Sea of Stars, Chained Echoes, Graveyard Keeper, Moonlighter, Children of Morta, Hyper Light Drifter, Enter the Gungeon, Nuclear Throne, Terraria, Secret of Mana, Chrono Trigger, Zelda: A Link to the Past and The Minish Cap. Sprite and tile sizes, internal resolution, flame sizes, frame counts and ms, smoke sizes, scorch sizes and lifetimes. Open-source code and decompilations give exact numbers.

- Final output (written later by others): technique profiles ("In plain words", "How it works (technical)", "Cost / performance", "Games that used it" with URL, "How it feels", "Risks") plus playable canvas demos, and a sandbox at 640x360. Collect concrete algorithms, pseudocode-level details, and numbers in px, tiles, frames, ms, bytes and counts. Always say the tile size and sprite size a number belongs to, so it can be converted.
- Rating criteria for the study: Simplicity · Speed · Pixel taste · Mood · Interactivity.

## Rules for every researcher
- Cite a URL for every claim. Give concrete numbers (px, tiles, frames, ms, bytes, counts, versions, dates).
- Separate cited findings from inferences. List gaps honestly instead of guessing. Flag vendor-reported and author-reported figures.
- Never copy or download images. For every game example collect a "see it in action" URL (wiki page, article, devlog or video page).
- Quotes under 15 words.
- Many fan wikis (TibiaWiki, Fandom, Bulbapedia) return 402/403 and archive.org may be blocked. Go to open-source code instead: OTClient / OTClientV8 / Mehah otclient (effects, missiles, `things` and `.otml` data), TFS / Canary (`items.xml`, `spells`, `const.h` effect ids), RPG Maker MV/MZ core scripts and default animation data, Stardew Valley decompilations, pret/pokeplatinum, pret/pokeheartgold, pokeemerald, roBrowser/rAthena, Shattered Pixel Dungeon, Godot source and docs, GitHub READMEs, author pages, GDC Vault pages. Some MediaWiki wikis block pages but answer `api.php?action=parse&page=<Page>&prop=wikitext&format=json`.
- If you meet a field-validated open-source tool or library that helps (fire shaders, dual-grid code, Godot pixel-perfect or particle plugins, smoke or flame generators, explosion generators), record it for the gems table: name, URL, licence read from the LICENSE file, maturity evidence (stars, last release, shipped games), what it saves.
- Notes structure: per key question, Takeaway / Cited findings / Inferences / Gaps. End with "Sources".
- Scratch files go only in `studies/vfx-fire-32px/notes/scratch-<your-file-number>/`. Never write outside your notes file and that folder.
- Stop at about 25-35 tool calls. Save notes as markdown to the given path, then reply with a SHORT summary (at most 200 words) with your 5-8 most useful numbers. In the summary, quote the label or table row each number comes from, so it is not misread.
