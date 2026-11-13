# Characters for the 32 px sandboxes

The 24x32 characters of VFX #11 (snow at 32 px) and VFX #12 (fire at 32 px) come from Sprite Fusion
(https://www.spritefusion.com), made through its MCP server on 13 Nov 2026 and tagged `kingsfoil-32px` in the library.
This folder keeps the project copies of what shipped, plus the script that packs them.

Two bodies, each a 32x32 still turned into 8 directions and animated with a 4-frame walk, 15 credits per call:

| Body | Base still (asset id) | Directions | Walks S / N / E |
| --- | --- | --- | --- |
| adventurer (player, sets 0, 2, 4, 6) | `41ed1920-f0f8-4ff2-a6b6-cbd620668266` | batch `6359fef8-534b-4032-b51f-97f2d6b88fb3` | `6012104f-c62c-462b-a7db-b1c731396936`, `0b8f45cc-9b74-468b-b5d5-b53e20ccdfa7`, `f55b4d03-951b-458f-bd03-59dc4bd2c035` |
| villager (sets 1, 3, 5) | `70d7325b-fcfe-4000-9240-15524f4e1261` | batch `175138c1-0e6c-420a-a7b8-77ca2f95699b` | `6907e2ac-3b7b-4234-96ee-319ee5c4afaa`, `c1a5d412-6b4f-4df8-9c77-324674e3af45`, `965e628a-d121-4ef2-b64a-70cbfacd60c6` |

Prompts: "A young adventurer standing still and facing the viewer, seen from a 3/4 top-down RPG camera like a classic 2D
MMORPG. Chibi proportions ... dark green hooded wool coat with the hood down, a red knitted scarf, brown gloves and brown
leather boots ..." and "An elderly village woman ... brown knitted bonnet, a long mustard yellow wool dress with a cream
apron, a dark shawl over the shoulders and dark boots ...". Walks: "A calm walk cycle in place, walking toward the viewer
(seen from behind / side view to the right): the legs alternate with clear foot contacts, the arms swing gently opposite
the legs, the body bobs one pixel on the passing poses. Seamless loop, the character stays centred and keeps its exact
size, colours and outline." Of the 12 variations per still, the straightest front pose with the arms down was kept.

`make_chars.py` crops each frame to the middle 24 columns, classifies every pixel into a role (outline, skin, hair,
coat, scarf, ... by hue, lightness and row), keeps 1 to 3 shades per role (k-means), orders the walk so the two most
different frames sit at 0 and 2, and packs 2 bodies x 3 directions x 5 frames at 4 bits per pixel. The 5 crowd sets are
hue and lightness changes of the role shades. W is E flipped by the engine, as before. `preview-7-sets.png` shows the result.
