# Shared context for all NPC AND DIALOG researchers

## The user and project
- Indie game dev (Kingsfoil Studios). Godot 4 games, web-first (Compatibility/WebGL2 renderer), also mobile and desktop. Small team. Must run on low-end hardware.
- Target: "Asterion Online", a Tibia-like MMORPG. Top-down 3/4 pixel art, 32x32 tile grid, server-authoritative, many players share the same town and the same NPCs. Also a single-player top-down RPG.
- This is study #1 of a new series, **Game feel** (`feel`): one player interaction per study, researched for feel, art, systems and cost. Earlier studies in the library are VFX (snow, acid, rain, forest, light, fire, water, fog) at https://kingsfoil-artifacts.netlify.app. The VFX #5 Light study covered Tibia's light model; nothing so far covered UI or NPCs.

## THIS study: NPCs and dialog management
Everything about the experience of interacting with the NPCs of the world. The user put ALL of these in scope:
1. **Talking**: how a conversation starts (walk up, click, keyword "hi", interact key, proximity prompt), runs and ends (walk away, "bye", timeout).
2. **Speech bubbles and overhead text**: barks, chat bubbles above heads, player chat vs NPC chat, stacking, clutter in crowds, anchoring to moving sprites, offscreen speakers.
3. **Dialog boxes**: typewriter text, speed, punctuation pauses, skip/fast-forward, text effects (wave, shake, colour), 9-slice frames, open/close animation, choice menus, keyword highlighting, history/log.
4. **Portraits**: bust sizes, expressions, mouth flaps, blinks, emote icons, acting with the overworld sprite instead of a portrait.
5. **Quest givers**: overhead markers (! ? and their states), minimap pins, offer / accept / progress / turn-in flow, quest log and tracker, rewards presentation.
6. **Shops and services**: trade windows, bank, travel, training, the handoff from talk to a panel and back.
7. **Ambient NPC life**: barks, idle chatter, schedules, head-turn and reactions to proximity, reputation-aware lines.
8. **Audio**: voice blips, per-character pitch, UI sounds for open/advance/close.

## The user's priorities (all four, weigh them together)
1. **Feel and pixel art**: timing, readability at low resolution, charm, sound. What artists and players praise.
2. **MMO-specific problems**: many players talking to one NPC (Tibia's NPC focus and queue vs private instanced dialog), bubble clutter in crowds, server-authoritative quest state, latency (a dialog round trip to the server), anti-spam, bandwidth per line.
3. **Authoring pipeline**: dialog data formats and tools (Ink, Yarn Spinner, Dialogic, Dialogue Manager, Tibia/TFS Lua NPC scripts, rAthena scripts), branching, conditions, variables, localization and text expansion.
4. **Runtime cost**: bitmap fonts vs vector text, draw calls, many bubbles at once, memory, on low-end web. MEASURED numbers where they exist; mark estimates as estimates.

## Reference games (user picked all four groups)
- Classic 2D MMOs: Tibia, RuneScape/OSRS, Ragnarok Online, MapleStory, Ultima Online, Albion Online, Lineage.
- Single-player pixel RPGs: Zelda, Pokémon, Chrono Trigger, EarthBound, Stardew Valley, Undertale, Eastward, Sea of Stars (and others where useful: Octopath, Golden Sun, Celeste, Animal Crossing).
- Modern 3D MMOs for UX: WoW, FFXIV, Guild Wars 2, ESO, OSRS mobile.
- Mobile and casual RPGs: gacha and idle RPG dialog flows, tap-to-advance, auto, skip, log.

## Report shape (so you know what to collect)
Technique profiles with "In plain words", "How it works (technical)", "Cost / performance", "Games that used it" (URL), "How it feels", "Risks", and ratings on: **Clarity · Charm · MMO fit · Authoring · Speed**. Collect concrete parameters: characters per second, pause lengths in frames or ms, box sizes in pixels, font sizes, portrait sizes, marker sizes, bubble lifetimes in seconds per character, chat ranges in tiles, message rate limits, packet sizes, ms costs.

## Rules for every researcher
- Cite a URL for every claim. Give concrete numbers (ms, counts, sizes, rates, frames, dates, versions).
- Separate cited findings from inferences. List gaps honestly. Flag vendor-reported figures.
- Never copy or download images. For every game example collect a "see it in action" URL (wiki page, article, devlog or video page).
- Quotes under 15 words.
- Fan wikis (TibiaWiki, Fandom) often return 402/403 and archive.org may be blocked. Go to open-source code instead: TFS / Canary (Tibia server NPC Lua and C++), OTClient (NPC dialog, trade window, speech bubbles), rAthena / Hercules (Ragnarok NPC script commands like mes/next/menu/cutin), 2009scape / RuneLite (RuneScape dialog), decompilations (pokeemerald, pokecrystal, zelda3, Link's Awakening disassembly), Godot plugin repos, GitHub READMEs, author pages, GDC Vault pages.
- Notes structure: per key question -> Takeaway / Cited findings / Inferences / Gaps. End with "Sources".
- Stop at about 25-35 tool calls. Save notes as markdown to the given path, then reply with a SHORT summary (<=200 words).
