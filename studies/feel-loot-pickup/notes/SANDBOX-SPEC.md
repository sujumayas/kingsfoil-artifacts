# Loot and pickup sandbox spec (shared by the report writer and the sandbox builder)

The sandbox plays the recommended architecture of the report's §7. The report's §8 describes it. Both follow this file.
If research shows a number below is wrong, the report writer corrects it in the report and notes the change at the end of this file under "Changes from research"; the sandbox builder follows the corrected number. Numbers marked (start) are starting values; keep every tunable in one `TUNING` object at the top of the script.

The study weighs four things together: FEEL AND PIXEL ART, MMO PROBLEMS, IMPLEMENTATION, RUNTIME COST. The sandbox must feel great to loot in, show the MMO problems live (ownership, latency, races, crowds, PvP death drops), and show what each layer costs.

## Page
- `studies/feel-loot-pickup/sandbox.html`, one hand-written file, no external assets, fonts or images. All pixel art (tiles, sprites, items, icons, effects) and the bitmap font are drawn or encoded in code. Reuse the bitmap font, page chrome, HUD style, control layout and keyboard handling of `studies/feel-combat-juice/sandbox.html` (read it first; copy the font data and the cost HUD approach).
- Native canvas `<canvas id="c" width="320" height="180">`, scaled with `image-rendering: pixelated`, integer scale where it fits. Works at 390 px phone width, no horizontal overflow, no console errors. Touch: tap to move, tap an item or corpse to pick up or open, on-screen buttons for loot-all and quick loot.
- Title: "Loot and Pickup Sandbox". Links back to `feel-loot-pickup-topdown-pixel.html` and `index.html`.

## World
- A small field at 320x180 with 16x16 tiles (labelled as half of Asterion's 32 px): grass, a path, some rocks and bushes.
- The player character, 4-direction walk. A simple attack is enough to kill monsters (click a monster or press Space next to it); killing is not the point, keep it short and reuse combat juice's death flash and corpse in a cheap form.
- Monsters: a pack of 4-6 weak mobs that respawn, one elite, and a boss with a big drop (10-20 items) on a button "Spawn boss drop".
- Item art: about 16 item icons drawn in code at 8x8 or 12x12 (gold coins with stack sizes 1 / few / pile, potion, sword, shield, helmet, ring, gem, rune, scroll, bone, meat, a rare glowing item). Rarity tiers: common, uncommon, rare, epic, legendary (colours from the report; start with white, green, blue, purple, orange and pick ones readable on grass).
- Allied players: slider 0-30 simulated players who kill mobs, walk to their loot, and sometimes try to grab yours (ninja looter toggle).
- PvP mode: simulated enemy players; when you die (button "Die here" or getting killed) your character drops items per the death rules; enemies and allies react to your bag.

## Drop styles (core of the study, switchable)
- **Corpse container (Tibia)**: the corpse is a container; click to open a loot window grid; drag or click items to the bag; loot message in a chat line ("Loot of a wolf: 12 gold coins, a wolf paw").
- **Ground spill (ARPG/OSRS)**: items pop out of the corpse on arcs and land on tiles around it with labels.
- **Loot bag (RotMG)**: one bag sprite whose colour shows the best item inside; walk on it to open.
- **Direct to bag**: no world object; items fly from the corpse to the bag icon with a toast.

## Layers (must match report §7, bottom to top; writer may rename but keep the count and order)
1. **Server loot truth.** Rolls the drop on death, owns item entities with ids, positions, stack counts, timers and despawn; the only authority on who picked what. Server tick slider 50 / 100 / 600 ms (start 100). Show a small server panel in the x-ray view.
2. **Ownership, party and death rules.** Owner = top damage (start), owner-only window (start 10 s for corpses, 60 s for ground items OSRS-like) then public; party modes: free for all, round robin, personal loot (each player sees their own drops); PvP death drop rules (start: drop the backpack and a share of items, protection items save them; protection zones drop nothing).
3. **Replication and area of interest.** Items spawn, update and despawn as messages to players in range; ground item merging of stacks (gold piles) and caps. Shows messages per second and bytes per second (illustrative sizes).
4. **Client prediction and reconciliation of pickup.** Toggle: wait for server / predict pickup (item vanishes at once and flies to bag; on rejection it pops back with a small "taken" cue). Latency slider 0-400 ms. A race demo: you and a simulated player click the same item; the server decides.
5. **Drop presentation.** Pop arc (height and duration from the report), bounce count, scatter pattern (spiral or ring around the corpse, never on walls), landing dust, a short stagger between items so a big drop reads as a sequence. Corpse-open animation for container style.
6. **Rarity signalling.** Tier colour on the item outline or label, glow pulse, light beam for high tiers, a distinct drop sound per tier (WebAudio synth, no samples), minimap or edge-of-screen ping for legendaries. Own vs not-yours styling (others' items dimmed or hidden per rules).
7. **Labels and filters.** Item labels in the bitmap font, overlap solver (stack labels vertically, then hide low tiers when crowded), hold Alt to show all labels, filter presets (show all / hide junk / only rare+). Loot message log.
8. **Pickup interaction.** Click to pick up (path to it then grab), walk-over for gold, magnet radius (start 1.5 tiles) and pull speed, loot-all, quick loot hotkey (loot nearest corpse in 1 tile), fly-to-bag arc and bag icon bump, bag-full feedback (item stays, red flash on bag, message), stacking counter pop.
9. **Crowd budget and accessibility.** LOD for other players' drops (full / reduced / minimal: no beams, no arcs, labels only for own), caps on glows and labels, reduce motion, colour-blind safe tier shapes (tier shown by outline shape or icon too, not only colour), sound limits.

## Master controls
- Drop style selector (4 styles above), party mode selector, PvE / PvP.
- A "Juice" master slider 0-100% scaling arcs, glows, beams, fly-to-bag and sounds, plus per-effect toggles (arcs, bounce, glow, beams, labels, sounds, fly-to-bag, magnet).
- Preset buttons: "Tibia classic" (corpse container, no glow, chat log), "Classic ARPG" (ground spill, labels, beams), "Roguelite" (walk-over, magnet, juicy), "Asterion recommended".

## Efficiency HUD (required)
- Per-layer timing in ms with performance.now(), smoothed: simulation and server, drop motion, glow and beams, labels and overlap solver, pickup effects, UI, total; frame budget bar against 16.7 ms.
- Counters: ground items, items visible, labels drawn, labels hidden by the solver, glows, beams, items merged, pickups predicted, pickups rejected, server messages per second, bytes per second.
- Stress buttons: "Rain 200 items" and "Rain 1000 items" to show the label and glow cost.

## Controls
- Walk WASD/arrows (or tap to move). Click an item to pick it up, click a corpse to open it. E quick loot, R loot-all, hold Alt (or a toggle button on touch) to show all labels, Space attack. 
- Views (x-ray): normal, server truth (item ids, owners as coloured dots, timers, predicted vs confirmed), ownership view (tiles coloured by who may loot), cost view.
- Reset, Pause, slow motion 0.25x. Keyboard: V cycle views, P pause, M slow motion.

## Thumbnail
`study.yaml` grabs canvas `#c` after clicking `button[data-demo="showcase"]`: a frozen frame of a boss drop in ground-spill style, items mid-arc and landed, a legendary beam, tier-coloured labels stacked without overlap, gold flying toward the player, the bag icon bumping, a dimmed item owned by another player.

## Changes from research
(report writer appends here)

### From the report writer (2026-11-11)
Asterion values first, Sandbox values (16 px tiles, half the pixels) in brackets. Report §7 has the full preset table.
1. **Owner window (layer 2).** Monster corpses: owner = top damage with the first attacker's damage x1.3, owner and party for **15 s** (was 10 s), then players with ≥ 10% of the damage until **20 s**, then public. Spilled ground items stay 60 s private, then public until **180 s** total, then despawn with a **10 s blink** at the end.
2. **Bosses.** "Personal loot" party mode is the default for the boss drop; each participant's share is scored as the mean of damage dealt, damage taken and healing shares (Canary reward chest).
3. **PvP death (layer 2).** Backpack drops at 100 / 70 / 45 / 25 / 10 / 0% for 0 to 5+ blessings, each worn slot at a tenth of that; red or black skull drops everything; amulet of loss saves all once; unskulled players keep their 3 most valuable items. The corpse has a **60 s priority window** for the killer's group and the victim's party, then public; after the window outsiders loot through a **1.5 s channel** that damage interrupts and get a yellow "looter" name for 2 min. Player corpse lootable 1200 s (scale down in the Sandbox if needed).
4. **Pickup tick and races (layers 1, 4).** Pickup requests are collected per server tick and resolved in a rank that rotates every 60 s, not by arrival order. Ownership is checked at the tick that executes, before the move. Reach 1 tile; out of reach = walk there, retry after **300 ms**.
5. **Prediction (layer 4).** Recommended mode is cosmetic: on click a soft tick and a **4 px hop [2 px]**, item stays; fly to bag only on server OK; on reject settle with a **2 px [1 px] shake over 120 ms** plus the reason line. Keep "full prediction" as a third mode to show why it fails.
6. **Drop motion (layer 5).** Arc **400 ms**, apex **20 px [10 px]**, floor shadow 1.0 x 0.25 of the sprite at 60% black, **no bounce** by default (legendary only: one 4 px [2 px] hop under 120 ms). Landing sound at landing (t = 400 ms), by material, pitch jitter 0.9 to 1.1. Stagger **40 ms** per item, total sequence capped at **600 ms**, items ordered by tier ascending so the best lands last. Scatter: one item per tile, ring search outward, never on walls.
7. **Rarity (layer 6).** Colours with a 1 px dark outline: common `#E8E8E8`, uncommon `#4CE04C`, rare `#4C9BFF`, epic `#B45CFF`, legendary `#FF9A1F`. Shape ladder: common none, uncommon corner pixels, rare full outline, epic outline + sparkle, legendary beam. Glow only rare and up, halo sprite (never shadowBlur), **2 s** pulse cycle, 60% cap, phase from item id. Beam legendary only, **32 x 96 px [16 x 48 px]**, strangers see it **2 s** after landing, the owner until pickup, plus an edge chip off screen. Stings for own loot only.
8. **Labels (layer 7).** Hold key only, labels for items you may take, cap **32** sorted by tier, then own, then distance; one cached label atlas; greedy vertical stacking on a 32 x 16 px [16 x 8 px] grid, up to 7 steps then hide, "+N" when hidden. Hide labels, never sprites.
9. **Pickup (layer 8).** Magnet radius **1 tile [16 px]** (was 1.5), gold only, owner only, starts **400 ms** after landing, never in PvP combat; the server grants it and the client pulls over 150 ms. **E = loot nearby: all corpses you may open in the 3x3 around you, cap 30** (was "nearest corpse in 1 tile"); holding E repeats. Fly to bag **250 ms** ease in-out with a ±16 px [±8 px] side curve; bag icon 1.0 to 1.15 to 1.0 over 120 ms; more than 3 items in one message fly 3 sprites plus "+N". Coin pitch +1 semitone per pickup within 1.2 s, cap 8 steps. Bag-full: item stays, red bag flash, exact message, loud style at most once per **15 s**.
10. **Crowd and audio (layer 9).** Others' drops: no arc (appear landed), no glow, legendary beam 2 s only, no labels, no sound. Party: arcs and glow, no sting. Loot voice pool **8**, priority own > party > others, then tier; duck the loot bus 6 dB for 300 ms on a legendary sting. Target about 200 visible ground items per screen.
11. **Bytes (layer 3, illustrative).** item_add 20 B (op 1, guid 4, id 2, x 2, y 2, z 1, count 2, tier 1, per-viewer owner flag 1, public-in 2, despawn-in 2); item_remove 9 B (op 1, guid 4, picker 4); a corpse add about 17 B.
