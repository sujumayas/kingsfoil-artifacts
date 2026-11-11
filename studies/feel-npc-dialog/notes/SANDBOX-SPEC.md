# NPC and dialog Sandbox spec (shared by the report writer and the sandbox builder)

The sandbox plays the recommended architecture of the report's §7. The report's §8 describes it. Both follow this file.
If research shows a number below is wrong, the report writer corrects it in the report and notes the change at the end of this file; the sandbox builder follows the corrected number.

The study weighs four things together: FEEL AND PIXEL ART, MMO PROBLEMS, AUTHORING, RUNTIME COST. The sandbox must feel charming to play, it must show the MMO problems live (crowds, latency, shared NPCs), and it must show what each layer costs.

## Page
- `studies/feel-npc-dialog/sandbox.html`, one hand-written file, no external assets, no external fonts or images. All pixel art (tiles, NPC sprites, portraits, frames, icons) and the bitmap font are drawn or encoded in code.
- Native canvas `<canvas id="c" width="320" height="180">`, scaled with `image-rendering: pixelated`, integer scale where it fits. Works at 390 px phone width with no horizontal overflow and no console errors. Tap-to-move and tap-to-talk on touch.
- Copy the page chrome, HUD style, control layout and keyboard handling from `studies/vfx-fog/sandbox.html` (read it first).
- Title: "NPC Dialog Sandbox". Links back to `feel-npc-dialog-topdown-pixel.html` and `index.html`.

## Text rendering (core of the study)
- A hand-made bitmap font encoded in the file (for example 5x7 glyphs on a 6 px advance plus a 3x5 small font for bubbles), drawn by blitting from a pre-rendered glyph atlas canvas. No `fillText` on the game canvas except in the comparison toggle.
- Toggle: "bitmap atlas" vs "canvas fillText" to compare cost and crispness.
- Word wrap at a fixed pixel width, measured with the glyph advances. Text runs carry inline tags: colour (keywords), wave, shake, pause, speed change. Example syntax: `[c=key]trade[/c]`, `[wave]`, `[p=12]` (pause in frames), `[spd=2]`.

## World
- A small town square at 320x180, 16x16 px tiles in the sandbox (labelled as half of Asterion's 32 px for the low-res canvas): cobbles, a fountain, a shop front with a counter, a notice board, a tavern door, trees, a bench, lamp posts.
- The player (walk with arrows/WASD or tap). Interaction prompt appears when facing an NPC within 1 tile (and a "Talk" button on touch).
- NPCs (each shows one style; the reader can switch styles globally too):
  1. **Quest giver** (elder by the notice board) with an overhead marker whose state changes: available `!`, in progress grey `?`, ready to turn in gold `?`. A short fetch quest: bring 3 herbs from the planters. Offer card, accept/decline, tracker line on screen, turn-in with a reward popup.
  2. **Shopkeeper** behind the counter: greeting, then the handoff to a small trade panel (buy/sell, 4-6 items, gold counter), and back to dialog on close.
  3. **Keyword NPC** (Tibia style, the guard or a sailor): the reader types or clicks keywords (hi, name, job, travel, bye). The NPC answers in an overhead yellow-ish line and in a chat log pane; highlighted keywords in replies can be clicked. Focus rule: the NPC turns to whoever said hi and says "wait" to a second talker (simulated players) unless the mode is "private sessions".
  4. **Ambient villagers** (2-3) on simple schedules (walk between points, sit on the bench), barking short lines when the player passes within ~3 tiles, with a cooldown, and turning their head toward the player.
- **Simulated players** (0-30 slider): little sprites that wander, chat with bubbles (random short lines) and sometimes walk up to the keyword NPC and say "hi". This is the crowd stress test.

## Layers (must match report §7, bottom to top)
1. **Server conversation truth (gameplay).** Dialog graphs and quest state live on the server. Each player has a conversation session (npc id, node id, variables). The client sends intents (talk, choose option N, keyword text); the server replies with line ids and arguments. Show it as a small "server" panel in the x-ray view.
2. **Speech channels and interest.** Say / yell / whisper ranges in tiles (labelled illustrative, e.g. say 7 tiles), who receives which line, a per-player chat rate limit, and the NPC focus model: Tibia-style shared focus + queue vs private per-player sessions (toggle).
3. **Dialog content and authoring.** Lines come from a small data table in the file written in a Yarn/Ink-like text format (nodes, options, conditions like `<<if $herbs >= 3>>`, keywords), parsed at load. A string table with an English and a second-language column (for example Spanish) and a toggle to show text expansion in boxes and bubbles.
4. **World presentation.** NPC sprite acting: face the talker, idle bob, emote icons (! ? ... heart anger) popping above heads with a small squash, quest markers with state colours and a gentle bob, the interaction prompt.
5. **Overhead text layer.** Speech bubbles and barks: 9-slice bubble with a tail, word-wrapped small font, lifetime from length (base + per character, labelled illustrative), fade or pop-out. Clutter strategy toggle: none (overlap) / stack upward / priority (your NPC conversation > party > nearby players > ambient) with a cap / collapse distant chat into the log only. Bubbles of offscreen speakers clamp to the screen edge with an arrow.
6. **Dialog UI.** Dialog style toggle: (a) JRPG box with portrait (bust about 32x32 or 40x40, expression swaps, mouth flap while text types, blink), (b) bubble-only conversation over the NPC's head, (c) Tibia keyword chat (log pane + overhead line). Typewriter with characters-per-second slider, punctuation pauses (longer at . ! ? , labelled), press-to-complete then press-to-advance, a blinking advance arrow, choice menu with a cursor, open/close animation (grow from the speaker or slide up, 6-10 frames), keyword colouring, a dialog history log (L key).
7. **Panels and handoff.** Quest offer card with reward icons, accept/decline. Trade panel. Reward popup and tracker update on turn-in. Movement is locked or free during dialog (toggle) and walking out of range closes the conversation politely.
8. **Ambient life.** Villager schedules on a compressed clock, proximity barks with cooldowns and priorities (a bark never covers an active conversation), head-turn toward the player.
9. **Audio and accessibility.** Voice blips via WebAudio (a short square or triangle blip every Nth character, pitch per NPC, small random variation; off by default until the first user gesture), UI sounds (open, advance, choice, close). Accessibility: text speed presets including instant, auto-advance with a delay, larger text (2x font for the dialog box), reduce motion (no wave/shake/bob).

## Network and latency (MMO problems shown live)
- Latency slider 0-400 ms (illustrative). Toggle "wait for server" vs "optimistic open": with optimistic, the box opens and plays the speaker's greeting animation at once while the line is in flight; without it, the reader feels the delay.
- Counters: bytes per dialog step (line id + args vs full text, illustrative sizes), messages per second in the crowd, lines dropped by the rate limit.

## Efficiency HUD (required)
- Per-layer timing in ms, measured with performance.now() around each layer every frame, smoothed: world + sprites, overhead text, dialog UI, panels, ambient logic, total. Frame budget bar against 16.7 ms.
- Counters: glyphs drawn this frame, bubbles alive, bubbles hidden by the clutter rule, draw calls (blits) this frame.

## Controls
- Walk (arrows/WASD or tap), interact (E / Space / Enter or tap NPC), advance (same key), choose (up/down + key, or tap), type a keyword (text field below the canvas for the keyword NPC; clickable keyword chips too).
- Toggles: dialog style (box+portrait / bubble / keyword chat), text renderer (bitmap / fillText), clutter strategy, focus model (shared+queue / private), optimistic open, movement lock, language (EN / second language), blips on/off, reduce motion, large text.
- Sliders: chars per second, simulated players 0-30, latency 0-400 ms.
- Views (x-ray): normal, chat ranges (circles), server sessions, cost view.
- Reset, Pause. Keyboard: E/Space interact, L log, 1-3 dialog style, V cycle views, P pause.

## Thumbnail
`study.yaml` grabs canvas `#c` after a scripted step: provide `button[data-demo="showcase"]` that sets a nice frame: the player talking to the quest giver with the portrait box open mid-sentence (a wave word visible), a gold `?` over another NPC, two or three bubbles over villagers and players, the shopkeeper behind the counter.

## Changes from research (report writer, 2026-11-11)
The sandbox builder follows these numbers. Sources are in report §6 and §12.
- **Keyword NPC colour.** NPC replies are cyan `#5FF7F7`, not "yellow-ish". Yellow (239, 239, 0) is player say. OTClient shows NPC text yellow only when the server sends it as a plain Say (barks).
- **Focus modes.** "Shared focus + queue" is the old TFS 0.3 behaviour ("wait for your turn"). "Private sessions" is modern TFS 1.x multi-focus with private replies; the NPC faces the FIRST talker still in focus (Canary faces the latest; we use TFS).
- **Ranges.** Say reaches a box of ±8 x ±6 tiles and yell ±18 x ±14 (TFS), not a 7-tile circle. Conversation range is 3 tiles (TFS; Canary 4); walking past it ends the talk with "Goodbye." Labelled illustrative.
- **Bubble lifetime.** `max(3000 ms, 60 ms x chars)`, doubled for yells (OTClient). Caps 3 per speaker, about 12 on screen.
- **Rate limits.** Public chat: 4-message bucket, one credit back every 1.5 s, mute 5·n² s. NPC input: separate bucket, 3 per second, burst 5 (estimate).
- **Typewriter.** Default 20 cps (50 ms per glyph); presets 12 / 20 / 33 cps and instant. Comma 5 glyph-times, `. ! ?` 10. A 200 ms guard after a line completes (early presses shave 50 ms).
- **Advance arrow.** Offsets 0, 1, 2, 1 px, 9 frames per step, 36-frame cycle (pokeemerald).
- **Open/close.** 8 frames (RPG Maker MV), inside the spec's 6 to 10.
- **Portrait.** Keep 32x32 at sandbox scale (64x64 at Asterion scale, Stardew's size); 40x40 would be 80x80 at Asterion scale, larger than any reference.
- **Bytes counter.** Tibia-style text line = 18 bytes + name + text; line id = 8 bytes (+2 + name length per name argument); choice = 4 bytes.
- **Quest marker.** The in-progress grey `?` is also hollow, so state never depends on colour alone.
