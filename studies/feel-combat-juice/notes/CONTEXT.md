# Shared context for all COMBAT JUICE researchers

## The user and project
- Indie game dev (Kingsfoil Studios). Godot 4 games, web-first (Compatibility/WebGL2 renderer), also mobile and desktop. Small team. Must run on low-end hardware.
- Target: "Asterion Online", a Tibia-like MMORPG. Top-down 3/4 pixel art, 32x32 tile grid, server-authoritative, many players share the same screen. PvE and PvP.
- This is study #2 of the **Game feel** series (`feel`). Study #1 was NPCs and dialog: https://kingsfoil-artifacts.netlify.app/feel-npc-dialog-topdown-pixel.html. Earlier VFX studies (fire, water, fog, light, acid, rain, snow, forest) cover particles and lighting; don't repeat their effect recipes, link to them.

## THIS study: combat juice, constrained to animation and game feel
Out of scope: damage formulas, balance, class design, matchmaking queues. In scope: everything a player sees, hears and feels when they attack, hit, get hit, miss, dodge, crit, kill and die.

**The combat model is HYBRID (assume it everywhere):**
- **Targeted combat** (WoW / Tibia style, soft difficulty): select a target (click or tab), auto-attack, targeted spells that home in and cannot miss through aim.
- **Aimed combat** (Hammerwatch / Diablo / MOBA skillshot style): some spells are aimed at a point or direction (lines, cones, circles, projectiles) and CAN miss; players can dodge them.
- Both live in one game, often on one hotbar. Players who like soft difficulty can lean on targeted skills; skilled players use aimed ones.

**Everything must be possible to build and test in a 2D top-down pixel-art MMORPG.** When a reference is 3D or a single-player action game, extract the part that transfers to a 32 px top-down sprite game with a server and many players, and say what does NOT transfer (for example global hitstop freezing the whole world is impossible when other players share the screen).

## Scope the user picked (all of it)
1. **Hit feedback**: hitstop/hit-pause, white flash, knockback, squash and stretch, hit sparks and particles, screen shake, camera kick, damage numbers, hit reactions.
2. **Attack animation**: anticipation / active / recovery frames, smear frames, 4 vs 8 directions, auto-attack rhythm, cast and channel animations, animation cancelling.
3. **Targeting**: tab-target, click-target, target lock, soft lock, smart cast, aim assist, target frames and markers, target cycling rules, lock-down target games vs free aim.
4. **Telegraphs and aiming**: ground decals, cast bars, aim previews, projectile readability, dodging, near-miss feedback, what a miss looks like.
5. **Latency and netcode feel**: client prediction of attacks and hits, server confirmation, how a server-rejected hit or a miss appears 100-300 ms later, lag compensation for skillshots, server tick (Tibia, OSRS 600 ms), crowds of 30 players in one fight.
6. **Action queues and PvP vs PvE** (user's words: "how PvP queues should work, because PvE and PvP are different"): spell queue windows, global cooldowns, input buffers, Tibia exhaust; then how feedback rules change in PvP: crowd control and diminishing returns, knockback and hitstop applied to a player, readability of enemy players' casts, fairness under latency, who sees whose effects.
7. **Death, crits and kills**: crit emphasis, overkill, kill confirmation, death animations, corpses, loot handoff (only the feel; the next study, "Loot and pickup", covers loot).
8. **Combat audio**: hit sounds, layering, pitch variation, voice limits and priority in big fights.

## The user's priorities (weigh together)
1. **Feel and pixel art**: timing in frames and ms, readability at 32 px, what players praise.
2. **MMO-specific problems**: shared screen, server authority, latency, crowds, PvP fairness, effect spam.
3. **Implementation**: Godot 4 (GDScript, web export), state machines, data-driven effects.
4. **Runtime cost**: many damage numbers, particles, shakes and flashes at once on low-end web. MEASURED numbers where they exist; mark estimates as estimates.

## Reference games (user picked all groups; adapt each to 2D top-down MMO)
- 2D MMOs: Tibia (OTClient/TFS source), RuneScape/OSRS, Albion Online (hybrid click + skillshot, very relevant), Ragnarok Online, MapleStory, Ultima Online, Realm of the Mad God.
- Pixel action games: Hammerwatch I/II, Hyper Light Drifter, Enter the Gungeon, Nuclear Throne, Hades, Vampire Survivors, Diablo I/II, Moonlighter, CrossCode, Children of Morta, Eastward, Sparklite.
- Modern MMO and ARPG UX: WoW, Diablo III/IV, Path of Exile 1/2, Lost Ark, Guild Wars 2 (hybrid), FFXIV, Black Desert, New World; and top-down MOBAs (League of Legends, Dota 2) for skillshot indicators.
- Fighting and brawler theory: hitstop, hitstun, frame data, GDC talks (Vlambeer "Art of Screenshake", "Juice it or lose it", Sakurai, Steve Swink "Game Feel", Squirrel Eiserloh "Juicing your cameras").

## Report shape (so you know what to collect)
Technique profiles with "In plain words", "How it works (technical)", "Cost / performance", "Games that used it" (URL), "How it feels", "Risks", ratings on **Impact · Clarity · MMO fit · Fairness · Speed**. Collect concrete parameters: hitstop frames/ms, flash frames, knockback px and duration, shake amplitude/frequency/decay, damage number rise speed and lifetime, crit scale, animation frame counts and ms per frame, cast times, GCD, queue windows in ms, server tick ms, telegraph lead time, projectile speed in tiles/s, i-frames, sound voice limits, ms costs.

## Rules for every researcher
- Cite a URL for every claim. Give concrete numbers (ms, frames, px, counts, dates, versions).
- Separate cited findings from inferences. List gaps honestly. Flag vendor-reported figures.
- Never copy or download images. For every game example collect a "see it in action" URL (wiki page, article, devlog or video page).
- Quotes under 15 words.
- Fan wikis (TibiaWiki, Fandom) often return 402/403 and archive.org may be blocked. Go to open-source code instead: TFS / Canary (Tibia server combat C++/Lua), OTClient (animated text, missiles, effects), 2009scape / RuneLite (hitsplats, ticks), rAthena (Ragnarok), Hammerwatch modding docs, decompilations, Godot plugin repos, GitHub READMEs, author pages, GDC Vault pages. The Stardew-style trick works for some MediaWiki wikis: `api.php?action=parse&prop=wikitext&page=...`.
- Notes structure: per key question -> Takeaway / Cited findings / Inferences / Gaps. End with "Sources".
- Use your own scratch folder if you need one: `studies/feel-combat-juice/notes/scratch-<your-file-number>/`. Never write outside your notes file and that folder.
- Stop at about 25-35 tool calls. Save notes as markdown to the given path, then reply with a SHORT summary (<=200 words).
