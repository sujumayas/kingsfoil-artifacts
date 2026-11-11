# 08 Gems: Godot 4 code, tools and engine-agnostic references for combat juice

Researcher angle: GEMS. Field-validated open-source code and tools, how each trick maps to Godot 4 (GDScript, web export, Compatibility renderer).

All GitHub numbers (stars, licence, last push) come from the GitHub REST API (`gh api repos/<owner>/<repo>`) on 2026-11-11. "Pushed" is the date of the last push to any branch.

A warning before the tables. Searches for "Godot hitstop", "Godot game feel" and "damage numbers" in late 2026 return a wave of brand new repos, Asset Library entries and forum "tutorials" created between 2026-09 and 2026-11 with 0 to 6 stars. Some carry good ideas, but none is field-validated. I list them separately and mark them. The field-validated set is small: Phantom Camera, LimboAI, Beehave, Godot State Charts, Aseprite Wizard, Pandora, godot-sfxr, jsfxr, GDQuest demos, OTClient/TFS/Canary.

---

## Q1. Godot 4 addons and examples

### Takeaway
- Camera shake. Use Phantom Camera's `PhantomCameraNoiseEmitter2D` (3,657 stars, MIT). It already implements Eiserloh's trauma model (offset = noise x trauma squared) with growth, duration, decay and emitter layers. Or hand-roll the same 30 lines on a Camera2D. Nothing else in the shake space has real adoption.
- Hitstop. No mature Godot addon does per-node hitstop. The popular addon (Whumpkit Lite, formerly Wallop Lite) and most tutorials use `Engine.time_scale`, which is wrong for an MMO. Build it yourself from four native knobs: `AnimationPlayer.pause()`/`speed_scale`, `AnimatedSprite2D.speed_scale`, `GPUParticles2D.speed_scale`, and `Node.process_mode = PROCESS_MODE_DISABLED` on the struck entity's visual subtree. Freeze only the visual child, never the networked root.
- Damage numbers. Two addons exist (LabelUpX, Minos). Both spawn one Label node per number from a pool. For an MMO with 30 players the better reference is OTClient's 1,000 ms animated text with merge-on-same-tile, which is about 80 lines of C++ and ports straight to a single `_draw()` node.
- Hit flash. A 5-line canvas_item shader with a `flash_amount` uniform is the standard. Godot 4 has no per-instance uniforms for canvas_item shaders (confirmed for 4.3), so either give each entity its own ShaderMaterial (breaks batching) or encode flash in `modulate` / vertex `COLOR` so all sprites share one material.
- State machines and abilities. LimboAI (3,117 stars) and Godot State Charts (1,628 stars) are the mature options. LimboAI's GDExtension build needs custom web templates with extension support, so for web prefer its module build with its own export templates, or a pure-GDScript option (State Charts, Beehave, gd-YAFSM). No Godot GAS clone has adoption yet.

### Cited findings: field-validated addons

| Addon | URL | Licence | Stars | Last push | Godot | Web / Compatibility | What it saves |
|---|---|---|---|---|---|---|---|
| Phantom Camera | https://github.com/ramokz/phantom-camera | MIT | 3,657 | 2026-11-09 (release v0.11.0.4, 2026-10-27) | min 4.4 ([FAQ](https://phantom-camera.dev/support/faq)) | Pure GDScript (C# wrappers optional), so no web blocker. Not stated in docs. | Trauma shake, follow, dead zones, camera priority, tweened transitions |
| LimboAI | https://github.com/limbonaut/limboai | MIT | 3,117 | 2026-10-30 (v1.8.1, 2026-08-20) | 1.8.x needs 4.6+ (GDExtension) or 4.7 (module) | GDExtension on web needs extension-enabled templates and cross-origin isolation headers ([Godot web docs](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)). v1.8.1 release ships prebuilt `export-templates.zip` for the module build. | Behaviour trees + hierarchical state machines (`LimboHSM`, `BTState`), visual debugger |
| Beehave | https://github.com/bitbrain/beehave | MIT | 3,325 | 2026-09-20 | 3.x and 4.x branches | Pure GDScript | Behaviour trees for mob AI (attack, flee, cast) |
| Godot State Charts | https://github.com/derkork/godot-statecharts | MIT | 1,628 | 2026-06-26 | 4.x | GDScript (C# supported) | Statecharts with parallel and nested states, delayed transitions. Fits anticipation/active/recovery + "is stunned" in parallel. |
| gd-YAFSM | https://github.com/imjp94/gd-YAFSM | MIT | 675 | 2025-11-01 | 4.x | GDScript | Visual FSM editor |
| Aseprite Wizard | https://github.com/viniciusgerevini/godot-aseprite-wizard | MIT | 1,400 | 2026-11-11 | 4.x | Editor-only, no runtime cost | Imports Aseprite tags into AnimationPlayer / SpriteFrames. Keeps attack frame timing authored in Aseprite. |
| Pandora | https://github.com/bitbrain/pandora | MIT | 1,133 | 2026-08-20 | 4.x | GDScript | RPG data (items, spells, mobs) as editable entities. Candidate home for per-skill feedback data. |
| godot-sfxr | https://github.com/tomeyro/godot-sfxr | MIT | 208 | 2023-09-18 | Asset Library listing | Generates in editor, ships as normal samples | `SfxrStreamPlayer` node, sfxr presets (hit, hurt, explosion) inside Godot |
| GDQuest godot-shaders | https://github.com/gdquest-demos/godot-shaders | "NOASSERTION" (mixed) | 4,202 | 2026-05-16 | 4.x | Check per shader | Outline, dissolve and other 2D shaders. Reference code, not a juice kit. |
| godot-demo-projects | https://github.com/godotengine/godot-demo-projects | MIT | 9,782 | 2026-10-08 | 4.x | Most run on web | Official baseline examples |
| KidsCanCode Godot Recipes | https://kidscancode.org/godot_recipes/4.x/ui/floating_text/index.html (repo https://github.com/kidscancode/godot_recipes, MIT, 271 stars) | MIT | 271 | 2024-07-15 | 4.x recipe | Tween + Label | Floating combat text and screen shake recipes |

Phantom Camera's 2D noise resource, read from source ([phantom_camera_noise_2d.gd](https://github.com/ramokz/phantom-camera/blob/main/addons/phantom_camera/scripts/resources/phantom_camera_noise_2d.gd)):
- Defaults `amplitude = 10.0`, `frequency = 0.5`, positional noise on, rotational off, random seed per instance.
- Offset per axis = `multiplier * pow(_trauma, 2.0) * noise(seed, time) * amplitude`. Rotation = `rotational_multiplier / 100 * pow(trauma, 2) * noise`.
- The emitter ([phantom_camera_noise_emitter_2d.gd](https://github.com/ramokz/phantom-camera/blob/main/addons/phantom_camera/scripts/phantom_camera/phantom_camera_noise_emitter_2d.gd)) exposes `growth_time`, `duration` (default 1.0 s), `decay_time`, `continuous`, and `noise_emitter_layer` (2D render-layer flags). Trauma ramps as `min(elapsed / growth_time, 1)`.
- `noise_emitter_layer` matters for an MMO. A shake emitted on layer 2 only moves cameras listening to layer 2, so you can route "my hit" shake to the local player only.

### Cited findings: new or unvalidated addons (ideas only, do not depend on them)

| Addon | URL | Licence | Stars | Created / pushed | Method | Note |
|---|---|---|---|---|---|---|
| Whumpkit Lite (was Wallop Lite) | https://github.com/pnscripts/godot-whumpkit-lite, [Asset Library 5526](https://godotengine.org/asset-library/asset/5526) | MIT | 0 | 2026-10-12 / 2026-11-10 | Hitstop changes `Engine.time_scale`, restores it, overlapping freezes take longest duration and lowest scale | Global freeze. Wrong model for a shared-screen MMO. |
| Trauma (trauma-gd) | https://github.com/filipbasara/trauma-gd, [Asset Library 4933](https://godotengine.org/asset-library/asset/4933) | MIT | 6 | 2026-03-22 / 2026-07-27 | `CameraShake` child of Camera2D, `add_trauma(0..1)`, `ShakeProfile` resource | Listing example: `add_trauma(0.25)` per bullet hit |
| Cobo godot-hitstop | https://github.com/Cobo-Makes-Games/godot-hitstop | MIT | 0 | 2026-10-23 | Per-node "pose mode": pauses AnimationPlayer, AnimationTree, AnimatedSprite, particles on listed fighters only. Durations in 60 Hz frames. | Best design of the batch, but 0 stars and 3 weeks old. README table: sword 4 f (67 ms), heavy 5 f, thrust 3 f, ranged 1 f, cap 12 f. Claims that at `speed_scale = 0` Godot re-fires a method-track key on the frozen frame. Unverified, test before relying on it. |
| Cobo godot-damage-numbers / godot-screen-shake | https://github.com/Cobo-Makes-Games/godot-damage-numbers | MIT | 0 | 2026-10-23 | Combo merge into one number | Same author, same caveat |
| LabelUpX (label-up) | https://github.com/godot-x/label-up, [Asset Library 4806](https://godotengine.org/asset-library/asset/4806) | MIT | 10 | 2026-02-21 / 2026-07-28 | Pooled `Node2D` each with a child `Label`, animated by Tweens ([node source](https://github.com/godot-x/label-up/blob/main/addons/godotx_label_up/runtime/godotx_label_up_node.gd)) | Claims "thousands of labels" with no benchmark (vendor claim). Its `GodotxLabelUpStyle` Resource is a good data-driven number style (see Q3). Requires 4.5+. |
| Minos Damage Numbers | https://github.com/Minoqi/minos-damage-numbers-for-godot | MIT | 3 | 2024-03-23, not updated | Pooled, colour by damage type, 2D and 3D | Abandoned since creation day |
| GodotFeel | https://github.com/fguillen/GodotFeel | none | 13 | 2023-08-04 | Effects, autoloads, shaders | No licence, so legally unusable as code |
| godot-game-feel-flow | https://github.com/kezhihao/godot-game-feel-flow | MIT | 1 | 2026-09-18 | Claims 77 effects | Unvalidated |
| LiGameAcademy godot_ability_system | https://github.com/LiGameAcademy/godot_ability_system | MIT | 25 | 2026-01-27 / 2026-10-25 | GAS-style, abilities and effects as Resources, Godot 4.5+, v0.0.1 | Closest thing to Unreal GAS in Godot. Too young to bet on. |

Forum and tutorial posts on per-node hitstop are thin. The Godot docs define the native switch: `PROCESS_MODE_DISABLED` "Never processes. Completely disables processing, ignoring SceneTree.paused" ([Node docs](https://docs.godotengine.org/en/stable/classes/class_node.html)). `PROCESS_MODE_ALWAYS` only escapes pause, not `Engine.time_scale` ([uhiyama-lab](https://uhiyama-lab.com/en/notes/godot/hit-feedback-hitstop/)).

`Engine.time_scale` affects Timer, SceneTreeTimer, `_process` and `_physics_process` delta, does not change the physics tick rate, and "does not affect audio playback speed" ([Engine docs](https://docs.godotengine.org/en/stable/classes/class_engine.html)).

Hit flash shaders on godotshaders.com use a bool `active` plus tint ([Hit Flash Effect Shader](https://godotshaders.com/shader/hit-flash-effect-shader/), [Hit flash effect](https://godotshaders.com/shader/hit-flash-effect/)). The float version (`COLOR = mix(tex, vec4(1,1,1,tex.a), flash_amount)`, tweened to 0) is common in tutorials ([uhiyama-lab post-process](https://uhiyama-lab.com/en/notes/godot/postprocess-screen-shaders/)). A float is better than a bool, because it allows a 1 frame full white then a 2 to 3 frame fade.

Canvas_item shaders had no per-instance uniforms as of 4.3. A Godot contributor said a 2D solution "will likely arrive eventually" but not in 4.3 ([forum thread](https://forum.godotengine.org/t/ways-to-mimic-per-instance-uniforms-for-canvas-item-shaders/64971)). Workarounds from that thread are one ShaderMaterial per instance (made in `_ready()`), or packing data into vertex UV/COLOR. The canvas_item shader reference says vertex `COLOR` is "multiplied by the CanvasItem's modulate multiplied by CanvasItem's self_modulate" ([docs](https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/canvas_item_shader.html)), so `self_modulate` can carry a per-sprite flash value into a shared shader.

### Implementation recipes for Godot (inferences built from the cited APIs)

Per-entity hitstop that is safe for an MMO:
```gdscript
# On the entity's visual child only (Sprite + AnimationPlayer), never the networked root.
func hitstop(ms: int) -> void:
    _freeze_until = maxi(_freeze_until, Time.get_ticks_msec() + ms)  # extend, don't stack
    anim.pause()                      # AnimationPlayer
    sprite.speed_scale = 0.0          # AnimatedSprite2D, if used
    set_process(false)
func _physics_process(_d):            # runs on the root, unaffected
    if _frozen and Time.get_ticks_msec() >= _freeze_until:
        anim.play(); sprite.speed_scale = 1.0; set_process(true); _frozen = false
```
- Time it with `Time.get_ticks_msec()` (wall clock), not a Timer, so it never interacts with `Engine.time_scale`.
- Server position updates keep arriving and are applied to the root. The sprite holds its pose for 50 to 100 ms and then catches up through normal interpolation.
- Only freeze entities the local player is involved in (attacker = me, or target = me). Other players' hits on the same screen get flash and number only.

Shared-material hit flash (keeps batching):
```glsl
shader_type canvas_item;
// Channel convention: self_modulate = Color(1,1,1,1) is normal.
// The script lowers self_modulate.b from 1.0 to 0.0 to mean "full flash".
// Cost: the blue channel can no longer be used as a real tint on these sprites.
void fragment() {
    vec4 tex = texture(TEXTURE, UV);
    float flash = 1.0 - COLOR.b;           // inference: test on Compatibility
    COLOR = vec4(mix(tex.rgb, vec3(1.0), flash), tex.a * COLOR.a);
}
```
This is an untested inference. The simpler path is one ShaderMaterial per entity, which costs a draw-call break per flashing sprite. Measure both on the target browser.

Trauma shake without an addon. `trauma += x` per event, clamp 0..1, decay linearly about 1.0 to 1.5 per second, offset = `max_px * trauma^2 * noise(t)`. This is the model Phantom Camera uses (above).

---

## Q2. Engine-agnostic references

### Takeaway
- MoreMountains Feel is the best catalogue of what "juice" is made of. About 199 feedbacks in 21 categories. Use its list as a checklist, not its code (commercial Unity asset).
- OTClient is the single most relevant open code for this project. Its floating damage text is 1,000 ms, rises 48 px, fades in the last 1/6, and merges same-colour numbers on one tile for the first 400 ms. Effects and missiles animate at 75 ms per frame. All in C++ under a permissive-style licence (NOASSERTION in the API; the file header is MIT-style).
- Juicy Breakout (the "Juice it or lose it" source) and Celeste's Player.cs are the classic readable sources for single-player juice. Hypersomnia is open-source, multiplayer, top-down, and runs in the browser.

### Cited findings

MoreMountains Feel feedback list ([list_mmfeedbacks](https://feel-docs.moremountains.com/list_mmfeedbacks.html)), the combat-relevant subset:
- Time. Freeze Frame ("freeze the timescale for a short duration"), Timescale Modifier. Both global, needs a TimeManager.
- Pause and Holding Pause (sequence the rest of the feedback after a wait).
- Renderer. Flicker (material colour flash), Sprite swap, SpriteRenderer colour/flip.
- UI. Floating Text (damage numbers) ([MMFloatingText docs](https://feel-docs.moremountains.com/mm-floating-text.html)).
- Camera. Camera Shake (duration, amplitude, frequency), Flash.
- Transform. Scale Shake, Squash and Stretch, Squash and Stretch Spring, Position Shake, Rotation Shake, Rigidbody force (knockback).
- Audio. Sound, MMSoundManager Sound (can cap concurrent instances).
- Particles. Instantiation (from cache), Play.
- Haptics. Haptic Clip, Emphasis, Preset (Nice Vibrations).
Count of about 199 entries is my count of the page via WebFetch summary. Treat as approximate.

OTClient (opentibiabr fork, C++20 + Lua, 542 stars, pushed 2026-11-09, https://github.com/opentibiabr/otclient; original edubart/otclient 709 stars, pushed 2024-09-14):
- [gameconfig.h](https://github.com/opentibiabr/otclient/blob/main/src/client/gameconfig.h) defaults: `m_animatedTextDuration{1000}`, `m_effectTicksPerFrame{75}`, `m_missileTicksPerFrame{75}`, `m_itemTicksPerFrame{500}`, `m_shieldBlinkTicks{500}`, `m_staticDurationPerCharacter{60}`, `m_minStatictextDuration{3000}`. Number font `verdana-11px-rounded` is a bitmap font (`BitmapFontPtr`).
- [animatedtext.cpp](https://github.com/opentibiabr/otclient/blob/main/src/client/animatedtext.cpp): y offset = `8 - 48 * t / duration` (linear rise of 48 px over the duration). Optional diagonal drift `-(4t/T + 8t²/T²)` px. Alpha stays 1 until `t > T/1.2`, then fades linearly. If the client "must optimize", duration halves to 500 ms.
- `AnimatedText::merge`: same colour, same font, younger than `T / 2.5` (400 ms) and both numeric, then the numbers add into one label.
- [map.cpp `addAnimatedText`](https://github.com/opentibiabr/otclient/blob/main/src/client/map.cpp): if not merged and the previous text on that tile is younger than `T/4` (250 ms, "didnt move 12 pixels"), the new one is offset by `12 - 48 * t / T` px so they don't overlap.
- Missiles and effects have their own files (`missile.cpp`, `effect.cpp`, `attachedeffect.cpp`).

Tibia servers. TFS (otland/forgottenserver, GPL-2.0, 1,844 stars, pushed 2026-11-09, https://github.com/otland/forgottenserver) and Canary (opentibiabr/canary, GPL-2.0, 668 stars, pushed 2026-11-05, https://github.com/opentibiabr/canary). They decide which magic effect id and text colour to send. The client owns all animation timing.

Hades-format data (via a GPL-2.0 mod that reuses Supergiant's Lua weapon schema, [OlympusExtra HammerWeapon.lua](https://github.com/AlexKage69/OlympusExtra/blob/main/Weapons/HammerWeapon.lua), pushed 2026-05-19):
```lua
HitSimSlowParameters = {
  { ScreenPreWait = 0.04, Fraction = 0.1, LerpTime = 0 },
  { ScreenPreWait = 0.01, Fraction = 1.0, LerpTime = 0.03 },
},
HitRumbleParameters = { { ScreenPreWait = 0.02, RightFraction = 0.17, Duration = 0.15 } },
```
Reading: on hit, slow the sim to 10% for 40 ms, then lerp back to 100% over 30 ms. Rumble 150 ms. This is a hit slow, not a hard freeze. The mod copies the game's schema; I did not see the shipped Hades file, so the exact values are the modder's.

Classic open sources:
- Juicy Breakout, grapefrukt (Martin Jonasson), the demo from "Juice it or lose it". https://github.com/grapefrukt/juicy-breakout. Zlib, 692 stars, last push 2017-03-24. ActionScript. Each juice toggle is a separate flag, which is a good model for a debug panel.
- Celeste, NoelFB/Celeste, MIT, 4,003 stars, pushed 2022-10-23. https://github.com/NoelFB/Celeste. Contains Player.cs with timings for buffers and freeze frames.
- Hypersomnia, TeamHypersomnia/Hypersomnia, AGPL-3.0, 1,731 stars, pushed 2026-11-11. https://github.com/TeamHypersomnia/Hypersomnia. Multiplayer top-down shooter in C++, has a browser build (https://play.hypersomnia.io per repo description). The most relevant "networked top-down feel" codebase I found.
- jsfxr, chr15m/jsfxr, Unlicense, 464 stars, pushed 2026-05-05. https://github.com/chr15m/jsfxr. Browser sfxr, generates hit/hurt/explosion sounds in seconds.

Open-source MMOs:
- Ryzom Core, AGPL-3.0, 477 stars, pushed 2026-11-11. https://github.com/ryzom/ryzomcore. 3D, low transfer for pixel feel.
- Realm of the Mad God private servers. Few public repos with traction. Zolmex/alloy-server (MIT, 10 stars, pushed 2026-10-22, https://github.com/Zolmex/alloy-server), Omniraptyr/Valor-Server (13 stars, no licence). Server-only, so the client feel (hit flash, numbers) is not in them.
- Veloren, GPL-3.0, 7,689 stars. https://github.com/veloren/veloren. Voxel 3D, useful for netcode only.

### Inferences
- OTClient numbers fit a 32 px grid. 48 px rise is 1.5 tiles over 1 s, which is slow and readable in crowds. Merge-on-tile is the key MMO trick: 10 hits in 400 ms become one growing number instead of 10 overlapping labels.
- Hades' "slow to 10%" is a better fit for a game with a server than a hard 0% freeze, because the sim never stops. In Asterion it should apply to the local entity's visuals only.

---

## Q3. Data-driven effect authoring

### Takeaway
Describe each hit's feedback as a Godot `Resource` (`.tres`), referenced by skill id and by hit outcome (normal, crit, miss, block, kill). The server sends only `{skill_id, outcome, amount}`. The client looks up the resource and plays it. Designers tune in the Inspector. Every mature example (MMF_Player, Hades Lua tables, LabelUpX style, OTClient config) separates "what happened" from "how it looks".

### Cited findings
- Feel's MMF_Player is a list of feedback components with per-item timing, chance and intensity, played as one sequence ([MMF_Player docs](https://feel-docs.moremountains.com/mmf-player.html)). It is data authored in the Inspector, not code.
- Hades-format weapon tables store `HitSimSlowParameters`, `HitRumbleParameters`, `FireRumbleParameters` and `Sounds` per weapon ([OlympusExtra example](https://github.com/AlexKage69/OlympusExtra/blob/main/Weapons/HammerWeapon.lua)).
- LabelUpX's `GodotxLabelUpStyle` Resource ([source](https://github.com/godot-x/label-up/blob/main/addons/godotx_label_up/runtime/godotx_label_up_style.gd)) exposes font, `font_size = 24`, outline, shadow, glow, `distance = 80.0`, `duration = 1.2`, easing, `movement_curve`, motion style (straight, arc, wiggle) with `amplitude` and `frequency`. A ready template for a "number style" resource.
- OTClient keeps text duration and effect frame time in one config object (`gameconfig.h`), loaded per server.
- LiGameAcademy's ability system configures abilities, statuses and effects "via resource files" ([README](https://github.com/LiGameAcademy/godot_ability_system)).
- Phantom Camera's `PhantomCameraNoise2D` is itself a Resource, so a shake preset is a `.tres` file a designer can tweak.

### Proposed Godot shape (inference)
```gdscript
class_name HitFeedback extends Resource
@export var hitstop_ms := 0              # local entities only
@export var flash_frames := 2            # at 60 Hz
@export var flash_color := Color.WHITE
@export var knockback_px := 0
@export var shake: PhantomCameraNoise2D  # or trauma float
@export var shake_trauma := 0.0
@export var shake_only_if_local := true
@export var sfx: AudioStream
@export var sfx_pitch_jitter := 0.08
@export var sfx_priority := 1
@export var number_style: Resource       # LabelUpX-style
@export var spark_scene: PackedScene
class_name SkillFeedbackSet extends Resource
@export var normal: HitFeedback
@export var crit: HitFeedback
@export var miss: HitFeedback
@export var kill: HitFeedback
```
Add a global `FeedbackSettings` autoload with multipliers (shake 0 to 1, hitstop on/off, reduced motion, max numbers on screen) applied on top of every resource.

### Gaps
- No public Godot project shows this pattern end to end in a shipped MMO.

---

## Q4. Godot web gotchas

### Takeaway
- Audio. Since 4.3, web audio defaults to Sample playback through Web Audio. It has low latency but no AudioEffects, no reverb or doppler, and positional audio may be unreliable. Budget for this: pitch jitter on `AudioStreamPlayer.pitch_scale` works, bus effects do not.
- Polyphony. `AudioStreamPlayer.max_polyphony` defaults to 1. Past the limit, `play()` cuts the oldest sound. Use one player per sound category with `max_polyphony` about 4 to 8, plus your own priority and distance cull for a crowd.
- Particles. No shader precompilation on Compatibility. First emit of a new particle material stutters. Prewarm every hit spark once behind the loading screen.
- Numbers. Many Label nodes with outline and shadow are the likely bottleneck. Prefer a bitmap font and one `_draw()` node for all numbers, like OTClient.
- `Engine.time_scale`. It scales every delta and Timer, so it desyncs interpolation and cooldown display on a networked client. Do not use it for hitstop.
- Browser tabs. Inactive tabs pause `_process` and `_physics_process`. A backgrounded MMO client stops simulating and must resync on focus.

### Cited findings
- Web audio Sample mode since 4.3, missing AudioEffects, reverb, doppler, procedural audio; Stream mode restores them with more latency ([Exporting for the Web](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)).
- Single-threaded export is the default since 4.3. Threads need `SharedArrayBuffer`, COOP/COEP headers. GDExtensions must be compiled for web and need "Extension Support" plus the same headers ([same page](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)).
- Web is Compatibility (WebGL 2.0) only, WebGPU not supported, Safari has WebGL 2 issues; browsers pause the project when the tab is inactive ([same page](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)).
- `max_polyphony` default 1, "will cut off the oldest sounds" ([AudioStreamPlayer](https://docs.godotengine.org/en/stable/classes/class_audiostreamplayer.html)). `playback_type` is experimental and forces Sample or Stream per node.
- Particles. Docs recommend GPUParticles2D "unless you have an explicit reason not to", and say CPUParticles2D "may perform better on low-end systems or in GPU-bottlenecked situations" ([2D particles](https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html)).
- Pipeline precompilation (4.4+) applies to Forward+ and Mobile only. On Compatibility the docs say to preload materials, shaders and particles by showing them for at least one frame during loading ([Reducing stutter from shader compilations](https://docs.godotengine.org/en/stable/tutorials/performance/pipeline_compilations.html); forum confirmation [36170](https://forum.godotengine.org/t/handling-particle-shader-compilation-lag-in-godot-4-web-compatibility-renderer/36170)).
- `Engine.time_scale` affects Timer, SceneTreeTimer and all delta-based simulation, not physics tick rate, not audio ([Engine](https://docs.godotengine.org/en/stable/classes/class_engine.html)). The same page recommends `physics_jitter_fix = 0` "within a network game".
- Labels. Anecdotal only: a forum user saw Control nodes hurt performance fast on modest hardware, and a Reddit user traced a large hit to label outlines and shadows (summarised via search; [forum 108481](https://forum.godotengine.org/t/trying-to-improve-performance-of-2d-game-on-android/108481)). No measured benchmark found.
- OTClient draws numbers with a cached bitmap font (`BitmapFontPtr`, `m_cachedText`) ([animatedtext.cpp](https://github.com/opentibiabr/otclient/blob/main/src/client/animatedtext.cpp)).

### Inferences
- On low-end WebGL, CPUParticles2D avoids GPU transform-feedback work and is easier to cap. For short 4 to 12 particle hit sparks, CPUParticles2D or a flipbook AnimatedSprite2D is likely cheaper and has no compile hitch. This is an estimate. Measure it.
- For sparks, a pooled 4-frame AnimatedSprite2D at 75 ms per frame (OTClient timing) may beat any particle node. It is how Tibia does every hit effect.
- `Engine.time_scale` does not slow packets, since networking polls on real frames. It does slow every client-side prediction and interpolation timer driven by delta, so the local view drifts from the server for the length of the freeze. Inference from the Engine docs.
- Sample playback ignores bus effects, so "duck music on crit" via a compressor bus will not work on web. Use volume tweens instead.

### Gaps
- No measured cost per Label vs per `draw_string` vs bitmap atlas in Godot 4 Compatibility on web. Needs a sandbox benchmark (100, 300, 1,000 numbers).
- No confirmation whether canvas_item `instance uniform` landed in 4.5 to 4.7. The 4.3 answer is "no".
- No confirmation whether the Cobo claim (AnimationPlayer re-fires a method key at speed 0) is true. Test `pause()` vs `speed_scale = 0`.
- Did not verify whether Phantom Camera's noise runs in the Compatibility renderer on web, though it is pure GDScript so there is no known blocker.
- Did not find a Phaser, Defold or LÖVE juice library with real adoption. Search was brief.
- Feel's feedback count is approximate.

---

## Sources
- Phantom Camera repo https://github.com/ramokz/phantom-camera, FAQ https://phantom-camera.dev/support/faq, noise source https://github.com/ramokz/phantom-camera/blob/main/addons/phantom_camera/scripts/resources/phantom_camera_noise_2d.gd, emitter https://github.com/ramokz/phantom-camera/blob/main/addons/phantom_camera/scripts/phantom_camera/phantom_camera_noise_emitter_2d.gd
- LimboAI https://github.com/limbonaut/limboai, docs https://limboai.readthedocs.io/en/stable/getting-started/getting-limboai.html
- Beehave https://github.com/bitbrain/beehave
- Godot State Charts https://github.com/derkork/godot-statecharts
- gd-YAFSM https://github.com/imjp94/gd-YAFSM
- Aseprite Wizard https://github.com/viniciusgerevini/godot-aseprite-wizard
- Pandora https://github.com/bitbrain/pandora
- godot-sfxr https://github.com/tomeyro/godot-sfxr
- jsfxr https://github.com/chr15m/jsfxr
- GDQuest shaders https://github.com/gdquest-demos/godot-shaders
- Godot demo projects https://github.com/godotengine/godot-demo-projects
- KidsCanCode floating text https://kidscancode.org/godot_recipes/4.x/ui/floating_text/index.html
- Whumpkit Lite https://godotengine.org/asset-library/asset/5526, https://github.com/pnscripts/godot-whumpkit-lite
- Trauma https://godotengine.org/asset-library/asset/4933, https://github.com/filipbasara/trauma-gd
- Cobo hitstop https://github.com/Cobo-Makes-Games/godot-hitstop
- Cobo damage numbers https://github.com/Cobo-Makes-Games/godot-damage-numbers
- LabelUpX https://godotengine.org/asset-library/asset/4806, https://github.com/godot-x/label-up
- Minos Damage Numbers https://github.com/Minoqi/minos-damage-numbers-for-godot
- GodotFeel https://github.com/fguillen/GodotFeel
- godot-game-feel-flow https://github.com/kezhihao/godot-game-feel-flow
- LiGameAcademy ability system https://github.com/LiGameAcademy/godot_ability_system
- godotshaders hit flash https://godotshaders.com/shader/hit-flash-effect-shader/, https://godotshaders.com/shader/hit-flash-effect/
- uhiyama-lab hitstop https://uhiyama-lab.com/en/notes/godot/hit-feedback-hitstop/, post-process flash https://uhiyama-lab.com/en/notes/godot/postprocess-screen-shaders/
- Per-instance canvas uniforms thread https://forum.godotengine.org/t/ways-to-mimic-per-instance-uniforms-for-canvas-item-shaders/64971
- Godot docs: Node https://docs.godotengine.org/en/stable/classes/class_node.html, Engine https://docs.godotengine.org/en/stable/classes/class_engine.html, AudioStreamPlayer https://docs.godotengine.org/en/stable/classes/class_audiostreamplayer.html, Exporting for the Web https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html, 2D particles https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html, shader stutter https://docs.godotengine.org/en/stable/tutorials/performance/pipeline_compilations.html, CanvasItem shaders https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/canvas_item_shader.html
- Particle compile lag forum https://forum.godotengine.org/t/handling-particle-shader-compilation-lag-in-godot-4-web-compatibility-renderer/36170
- Control node perf anecdote https://forum.godotengine.org/t/trying-to-improve-performance-of-2d-game-on-android/108481
- Feel feedback list https://feel-docs.moremountains.com/list_mmfeedbacks.html, MMF_Player https://feel-docs.moremountains.com/mmf-player.html, floating text https://feel-docs.moremountains.com/mm-floating-text.html
- OTClient https://github.com/opentibiabr/otclient (gameconfig.h, animatedtext.cpp, map.cpp), https://github.com/edubart/otclient
- TFS https://github.com/otland/forgottenserver, Canary https://github.com/opentibiabr/canary
- Hades-format weapon data (mod) https://github.com/AlexKage69/OlympusExtra/blob/main/Weapons/HammerWeapon.lua
- Juicy Breakout https://github.com/grapefrukt/juicy-breakout
- Celeste https://github.com/NoelFB/Celeste
- Hypersomnia https://github.com/TeamHypersomnia/Hypersomnia
- Ryzom Core https://github.com/ryzom/ryzomcore, Veloren https://github.com/veloren/veloren, alloy-server https://github.com/Zolmex/alloy-server
