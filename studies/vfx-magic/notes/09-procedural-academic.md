# 09. Procedural old-school algorithms and academic roots for spell VFX

Researcher 09, VFX #10 Magic and spell VFX. Date 2026-11-11.

How to read this file.

- "Cited" means I fetched the page or the paper text in this session and the number is in it.
- "Recalled" means the fact is standard knowledge that I did not re-fetch. Check before quoting it in the study.
- All costs are my estimates unless marked measured. I found no measured ms figures for any of these at 320x180. The unit is "ops per frame", meaning inner-loop iterations (one pixel write or one particle update).
- Reference sizes. Full screen 320x180 = 57,600 px. One tile 32x32 = 1,024 px. A 3x3 tile spell area 96x96 = 9,216 px. A 64x64 effect buffer = 4,096 px.

Rule of thumb that falls out of the numbers. A per-pixel effect on a 64x64 buffer costs 4,096 ops. A full-screen one costs 57,600. Thirty casters with a 64x64 buffer each cost 122,880 ops, which is two full screens. So per-pixel effects should be baked once into a shared flipbook or a shared buffer per spell type, and only particles, lines and curves should run per caster.

---

## 1. Particle systems, origin and minimal form

### Takeaway

Reeves 1983 already has the whole design. Emit a stochastic count per frame, give each particle a mean plus variance for every attribute, move it by adding velocity, kill it on lifetime, and draw additively so dense cores turn white on their own. A spell needs 8 to 40 particles, not 750,000. The cheapest form stores nothing per particle and computes position from (seed, age).

### Cited findings

- Reeves, "Particle Systems. A Technique for Modeling a Class of Fuzzy Objects", ACM Transactions on Graphics 2(2), April 1983. PDF: https://www.cs.princeton.edu/courses/archive/spr15/cos426/papers/Reeves83.pdf . Archive page: https://history.siggraph.org/?p=106060
- The five steps per frame, from the paper text. Generate new particles, assign attributes, kill the ones past their lifetime, move the rest, render.
- Emission count formula, quoted from the paper. `NPartsf = MeanPartsf + Rand() x VarPartsf`, with Rand uniform in -1.0 to +1.0. A second form scales by screen area so far-away systems emit less. The paper says there is no need for 100,000 particles in an object that covers a few pixels. This is a 1983 level-of-detail rule and maps directly to "other players' spells emit fewer particles".
- Speed formula, quoted. `InitialSpeed = MeanSpeed + Rand() x VarSpeed`.
- Motion. Add velocity to position each frame. An acceleration term gives gravity and parabolic arcs. Colour, transparency and size change at a global rate per system.
- Death. Lifetime in frames reaches zero, or intensity falls under a threshold, or the particle leaves a region.
- Genesis effect counts, from the paper. Impact frame has 1 large system plus about 20 small ones and about 25,000 particles. Mid sequence has about 200 systems and 75,000 particles. The final frames have about 400 particle systems and over 750,000 particles.
- Hierarchy. The top-level system emits particles that are themselves particle systems, placed in expanding rings. Ring count follows circumference times a density parameter. This is the same structure as a Tibia area spell that spawns one small effect per tile in an expanding wave.
- Colour by addition. Particles are point lights and colours are "added, not matted, into a pixel". Red clamps first, green rises to orange and yellow, a small blue part makes the densest pixels white. This is the white-hot core ramp obtained with no ramp texture.
- No sorting needed, because addition is order independent.
- Motion blur. Each particle is drawn as a line from its position at frame start to its position half a frame later.
- Checkpointing. Reeves saves only the random number table, not the parameters of 750,000 particles. That is the first form of the stateless idea. State can be rebuilt from a seed.
- Sims, "Particle animation and rendering using data parallel computation", SIGGRAPH 1990, Computer Graphics 24(4), pp. 405-413. Archive page: https://history.siggraph.org/?p=122085 . Search result summary says the CM-2 has 4K to 64K processors and the paper's example is 32K particles on 8K physical processors, one virtual processor per particle. Each particle is drawn as a head and a tail. I could not fetch the PDF (403), so treat these as secondary.
- Latta, "Building a Million Particle System", GDC 2004. URL: https://gamedeveloper.com/programming/building-a-million-particle-system . The search summary gives the definition. A stateless particle is computed by a closed form function from start values and the current time. The limit is that motion must have an analytic solution, so no collisions and no reaction to moving targets.

### Algorithms

A. Struct-of-arrays pool with swap-remove (the default).

```
x[], y[], vx[], vy[], life[], maxlife[], kind[]   # fixed arrays, cap N
count = 0
spawn(px,py,vx0,vy0,l):  if count < N: i = count++; write fields
update(dt):
  i = 0
  while i < count:
    life[i] -= dt
    if life[i] <= 0:                 # swap-remove, O(1), no holes
      copy fields of [count-1] into [i]; count--; continue
    vx[i] += ax*dt; vy[i] += ay*dt
    x[i] += vx[i]*dt; y[i] += vy[i]*dt
    i++
draw: for i in 0..count: put(floor(x[i]), floor(y[i]), ramp[kind[i]][life[i]*R/maxlife[i]])
```

Parameters. Cap N (64 per own spell, 16 for others is a sensible start, my estimate). Lifetime 0.2 to 0.8 s. Ramp length R of 4 to 6 colours. Cost is 1 update plus 1 pixel write per live particle. 30 casters at 16 particles is 480 ops. Trivial next to any per-pixel effect.

B. Fixed-point particles (integer only, deterministic across clients).

```
# 8.8 fixed point in int16 or int32: 256 units = 1 px
x += vx; y += vy; vy += GRAV          # all integers
px = x >> 8; py = y >> 8              # whole-pixel position for free
```

The shift does the pixel snap, so there is no sub-pixel shimmer and no float rounding difference between a server replay and a client.

C. Stateless particles from (seed, age). Zero storage per particle.

```
hash(n): n = (n ^ 61) ^ (n >> 16); n *= 9; n ^= n >> 4; n *= 0x27d4eb2d; n ^= n >> 15; return n
draw_burst(seed, cx, cy, t, N, life, speed, grav):
  for i in 0..N:
    h   = hash(seed*131 + i)
    ang = (h & 255) * TAU/256
    spd = speed * (0.5 + ((h>>8)&255)/510)
    li  = life  * (0.6 + ((h>>16)&255)/640)
    if t > li: continue
    x = cx + cos(ang)*spd*t
    y = cy + sin(ang)*spd*t + 0.5*grav*t*t
    put(floor(x), floor(y), ramp[floor(t/li*R)])
```

Parameters. N, life, speed, gravity, seed. Cost is N hash plus N trig per frame, or N table lookups with a 256-entry sine table. The network cost is the point. The server sends effect id, position and a seed, and every client draws the same burst. A burst can be scrubbed, paused for hitstop, or drawn at half rate by skipping odd i. Inference: this fits the Tibia model of "effect id + position" with no extra bytes if the seed is derived from the event tick.

### Inferences

- Reeves' screen-area emission rule is the oldest citation for effect tiers. Scale MeanParts by tier (own 1.0, party 0.5, others 0.25). The numbers are mine.
- Additive clamp to white needs a palette trick in pixel art. Count overlaps in a small integer buffer and map count to a ramp (1 = dark, 2 = mid, 3+ = white). That is the Acid study's "glow without alpha" applied to particles.
- A two-level hierarchy (emitter of emitters) is what a "UE" style area spell is. One event spawns ring k at time k times delay.

### Gaps

- Lander, "The Ocean Spray in Your Face", Game Developer, July 1998, and van der Burg, "Building an Advanced Particle System", Gamasutra, June 2000. Both recalled, not fetched. I have no working URL for either.
- Reeves and Blau 1985, "Approximate and probabilistic algorithms for shading and rendering structured particle systems" (trees and grass). Recalled, not fetched.
- No measured cost for JS or GDScript particle loops found in this session. Researcher on Godot rendering should supply CPUParticles2D numbers.

See it in action. Genesis effect history page: https://history.siggraph.org/?p=106060 .

---

## 2. Lightning

### Takeaway

Use midpoint displacement or the Hoffman "sorted random offsets" bolt. Both cost under 200 pixel writes per bolt and look right at low resolution because a pixel bolt is 1 px wide anyway. The dielectric breakdown model gives the best branching shapes but needs a Laplace solve per growth step, so it is only usable baked into frames ahead of time.

### Cited findings

- Hoffman, "How to Generate Shockingly Good 2D Lightning Effects", Envato Tuts+, 8 Jan 2013. https://code.tutsplus.com/how-to-generate-shockingly-good-2d-lightning-effects--gamedev-2681t . Constants from the article. One random position per 4 units of length, sorted. `Sway = 80` max sideways offset. `Jaggedness = 1 / Sway`. End envelope `pos > 0.95 ? 20 * (1 - pos) : 1` so the bolt lands on the target. Fade `0.03` alpha per update, so a bolt lives about 33 updates. Tint (0.9, 0.8, 1.0). Branch count `rand.Next(3, 6)`, so 3 to 5. Branches leave at 30 degrees, alternating sides. Additive blending.
- Niemeyer, Pietronero, Wiesmann, "Fractal Dimension of Dielectric Breakdown", Physical Review Letters 52(12), pp. 1033-1036, 19 March 1984. DOI 10.1103/physrevlett.52.1033. https://en.wikipedia.org/wiki/Dielectric_breakdown_model . Wikipedia describes it as DLA combined with an electric field.
- Secondary figures on eta from later arXiv papers (https://arxiv.org/pdf/cond-mat/0103312 , https://arxiv.org/pdf/cond-mat/0112218). Growth probability is proportional to local potential raised to eta. 2D fractal dimension is about 2 at eta 0, about 1.75 at eta 1, about 1.6 at eta 2, and growth stops being fractal near eta 4. Not checked against the 1984 paper.
- Kim and Lin, "Fast Animation of Lightning Using an Adaptive Mesh", IEEE TVCG 13(2), pp. 390-402, 2007. https://gamma.cs.unc.edu/FAST_LIGHTNING/ . Speeds up the DBM Poisson solve with a quadtree and conjugate gradient. 2D source code LumosQuad v0.1 at https://gamma.cs.unc.edu/FAST_LIGHTNING/lumos.html , needs FFTW and OpenEXR. The page states no licence and no timings.
- Reed and Wyvill, "Visual Simulation of Lightning", SIGGRAPH 1994, pp. 359-364. https://history.siggraph.org/?p=119719 . A particle system traces the channel path. Rendering is ray traced, glow uses implicit surfaces.

### Algorithms

A. Midpoint displacement bolt (recommended).

```
bolt(a, b, gens=5, offset=dist(a,b)/4):
  segs = [(a,b)]
  repeat gens times:
    next = []
    for (p,q) in segs:
      m = (p+q)/2 + perp(q-p).normalized * rand(-offset, offset)
      next += (p,m), (m,q)
      if is_main(p,q) and rand() < BRANCH_P:          # optional fork
        dir = rotate(m - p, rand(-25deg, 25deg))
        next += (m, m + dir*0.7)  marked dim
    segs = next; offset /= 2
  for (p,q) in segs: bresenham(p, q, colour = main ? WHITE : BLUE)
```

Parameters. 5 generations gives 32 segments. Start offset about a quarter of the length. Halve per generation. Branch probability 0.2 to 0.3, branch length 0.7, branch angle within 25 degrees. Re-roll every 2 to 3 frames and show for 4 to 8 frames. Cost for a 5-tile bolt of 160 px is 31 random numbers plus about 200 pixel writes with branches. Estimate.
The halving, 0.7 and branch angle values are recalled from the Drilian 2009 "Lightning Bolts" post. The URL I tried returned 404, so these are unverified.

B. Sorted-offset bolt (Hoffman 2013, cited above).

```
pos = sorted([rand01() for i in 0..len/4])
prev = 0; pts = [a]
for p in pos:
  scale = len * JAG * (p - prevpos)            # limits slope between neighbours
  env   = p > 0.95 ? 20*(1-p) : 1              # pin the end to the target
  d = rand(-SWAY, SWAY); d -= (d - prev)*(1 - scale); d *= env
  pts += a + (b-a)*p + normal*d; prev = d; prevpos = p
pts += b; draw lines between pts
```

At 320x180 scale Sway down to 6 to 10 px and use one point per 4 px. Cost is the same order as A. It gives smoother, less fractal bolts, which suits channelled beams.

C. Random-walk bolt on the pixel grid.

```
x,y = a
while (x,y) != b and steps++ < MAX:
  put(x,y)
  dx,dy = sign(b - (x,y))                       # one of 8 directions toward target
  if rand() < WANDER: rotate (dx,dy) by +-45deg # WANDER 0.3 to 0.5
  x += dx; y += dy
  if rand() < FORK and depth < 2: spawn walker(x, y, life = 4..10, depth+1)
```

Cost is one step per pixel of length. Every pixel is connected by construction, which is what a 1 px bolt needs. WANDER above 0.5 makes it miss the target, so clamp the remaining distance.

D. Dielectric breakdown model (bake only).

```
phi = grid, 0 on the bolt cells, 1 on the target/ground
loop until bolt touches target:
  relax Laplace: phi[c] = avg of 4 neighbours, K iterations
  cand = empty cells next to the bolt
  pick c from cand with probability phi[c]^eta / sum(phi^eta)
  add c to bolt; phi[c] = 0
```

Parameters. eta 1 to 3 (higher is straighter and less bushy). Grid 64x64. Cost estimate. 4,096 cells times about 20 relaxation sweeps is about 82,000 ops per added cell. A 64-cell bolt is about 5 million ops. Not per-frame work on low-end web. Fine as an offline generator for 4 to 8 baked bolt frames.

E. DLA (bake only). Random walkers stick when they touch the cluster. Recalled origin is Witten and Sander 1981. Gives frost and root shapes, good for ice residue decals. Cost is unbounded per walker, so bake.

F. L-system branching. Rule such as `F -> F[+F]F[-F]` with random angle. Recalled. It produces tree-like regular forks, which read as roots or coral more than lightning. I would not use it for bolts.

### Inferences

- At 1 px width the visual difference between A and D mostly disappears. What sells lightning at low res is timing (re-roll, 2 to 3 flashes, fast fade) and a white core over a coloured 1 px outline, not branch statistics.
- For chain lightning between N targets, run A per hop with gens 4 (16 segments). 5 hops is about 500 pixel writes.
- Server sends only endpoints plus a seed. Clients re-roll from seed + frame, so bolts match across clients for free.

### Gaps

- No per-frame timing found for Kim and Lin. No licence stated for LumosQuad.
- Reed and Wyvill branch parameters not retrieved.

See it in action. Hoffman's article has running demos: https://code.tutsplus.com/how-to-generate-shockingly-good-2d-lightning-effects--gamedev-2681t . Kim and Lin videos: https://gamma.cs.unc.edu/FAST_LIGHTNING/ .

---

## 3. Demoscene and palette effects reused as magic

### Takeaway

The feedback buffer and palette cycling give the most spell for the least code. Plasma, tunnel and fire are per-pixel, so run them on a 32x32 or 64x64 buffer and bake or share them. Palette cycling costs zero pixel work if the art is indexed.

### Cited findings

- DOOM PSX fire, Sanglard, 28 Dec 2018. https://fabiensanglard.net/doom_fire_psx/ . Values are in 0 to 36, so 37 palette entries. Source row is 36 (white). The spread step, quoted from the article:
  `rand = round(random()*3) & 3; to = from - FIRE_WIDTH - rand + 1; firePixels[to] = firePixels[from] - (rand & 1)`.
- Plasma, Lode Vandevenne's tutorial. https://lodev.org/cgtutor/plasma.html . Basic form quoted: `color = (128 + 128*sin(x/16) + 128 + 128*sin(y/16)) / 2`. Later versions add `sin(sqrt(x*x+y*y)/8)` and divide by 4. Palette is 256 entries. Animation is `palette[(plasma[y][x] + paletteShift) % 256]` with `paletteShift = time/10`. The plasma itself is computed once.
- Tunnel, same author. https://lodev.org/cgtutor/tunnel.html . Two tables computed once. `distance = int(ratio * texHeight / sqrt(dx*dx + dy*dy)) % texHeight`. `angle = 0.5 * texWidth * atan2(dy, dx) / PI`. Per frame, one lookup per pixel: `texture[(distance + shiftX) % texW][(angle + shiftY) % texH]`. Texture 256x256, power of two so the wrap is a mask.
- Canvas Cycle, Joseph Huckaby, July 2010, art by Mark Ferrari. https://experiments.withgoogle.com/canvas-cycle . Live demo http://www.effectgames.com/demos/canvascycle/ . An 8-bit colour cycling engine drawn to a 32-bit canvas. Secondary sources say 35 images at 640x480 and that Huckaby added linear blending between cycle steps ("BlendShift") for smoother motion. Coverage: https://80.lv/articles/color-cycling-from-the-90s-returns-with-html5 . Ferrari confirmed permission in a Q and A.

### Algorithms

A. Feedback buffer (free trails and smears). The single most reusable trick here.

```
buf = small indexed buffer (64x64), values 0..R
each frame:
  for each px: buf[x,y] = max(0, buf[x + sx, y + sy] - DECAY)   # shift and fade
  draw this frame's particles/lines into buf at value R
  blit buf through ramp[] to screen
```

Parameters. DECAY 1 per frame with an R of 6 gives a 6-frame trail. Shift (sx, sy) of (0, 1) makes sparks rise, a per-pixel shift toward the centre makes a vortex. Random decay (subtract `rand & 1`) gives the DOOM fire look, because the DOOM fire is this algorithm with a fixed source row. Cost 4,096 ops on 64x64. Inference: one shared buffer per screen, world-locked, serves every caster.

B. Fire as a projectile or aura. Use the cited spread step on a 16x24 buffer (384 ops). Replace the bottom source row with a source mask shaped like the projectile or the character's feet. For a moving fireball, set the shift opposite to velocity so the flame trails behind. Link to the Fire study, do not repeat.

C. Plasma for arcane fields.

```
init: for each px: plasma[x,y] = (sin8(x*a) + sin8(y*b) + sin8((x+y)*c) + sin8(dist(x,y)*d)) >> 2
frame: out = ramp[(plasma[x,y] + t) & (R-1)]        # only the offset changes
```

Parameters. Frequencies a to d between 1/8 and 1/32 per px. Ramp R of 8 or 16 entries, looping with no seam. Cost. Zero if the target is indexed and the palette rotates. Otherwise one add and one lookup per px, 1,024 per tile. Use for energy fields and poison pools. Threshold to 3 or 4 bands so it reads as pixel art and not as a gradient.

D. Palette cycling for hand-drawn loops.

```
cycle = {low, high, rate}                 # a contiguous run of palette slots
frame: k = floor(t * rate) % (high-low+1)
       shown[low+i] = base[low + (i + k) % n]
BlendShift variant: lerp between step k and k+1 by fract(t*rate)
```

Cost is n palette writes per frame, n of 4 to 8. In Godot this is a palette-lookup shader with a uniform offset, one draw call and no texture upload. Use for rune rings that "flow", energy fields, lava residue, channel beams. One 32x32 sprite replaces an 8-frame flipbook.

E. Tunnel and polar tables for vortex and portal.

```
init (64x64): dist[x,y] = (K / sqrt(dx*dx+dy*dy)) & 31 ; ang[x,y] = atan2(dy,dx)*32/TAU & 31
frame: out[x,y] = tex[(dist[x,y] + t*zoom) & 31][(ang[x,y] + t*spin) & 31]
```

Parameters. A 32x32 tileable texture, zoom and spin rates. Swap `K/sqrt` for plain `sqrt` to get a flat whirlpool and not a tunnel. Cost 4,096 lookups on 64x64, tables 8 KB. For top-down, squash y by 0.5 in the table so the portal lies on the ground.

F. Rotozoom for spinning sigils.

```
c = cos(a)*s; sn = sin(a)*s
for y: u = u0 - y*sn ; v = v0 + y*c          # row start
  for x: out[x,y] = tex[(u>>8)&63][(v>>8)&63]; u += c; v += sn
```

Two adds per pixel. Risk, and it is a taste risk. Nearest-neighbour rotation of a 1 px line sigil breaks the lines. Prefer redrawing the sigil with midpoint circles at the new angle (section 5), or rotate only in 90-degree steps plus palette cycling. Recalled technique, no single origin paper. Tutorial: https://lodev.org/cgtutor/ (index, not fetched for this page).

G. Metaballs thresholded into orbs.

```
for each px in box: f = sum over balls( r_i^2 / ((x-x_i)^2 + (y-y_i)^2 + 1) )
  out = f > T2 ? WHITE : f > T1 ? MID : f > T0 ? RIM : none
```

Origin recalled as Blinn 1982 "A Generalization of Algebraic Surface Drawing". 3 balls on a 24x24 box is 1,728 evaluations. Three thresholds give core, body and a 1 px rim, which is the pixel-art orb look. Use a 256-entry falloff table indexed by squared distance to avoid the divide.

H. XOR and moire for shields.

```
xor:   out = ((x ^ y) + t) & 15 through ramp, masked by a circle outline band
moire: out = (dist(x,y,c1) ^ dist(x,y,c2)) & 4 ? A : B        # two ring sets
```

One or two operations per px. Draw only in a 2 to 3 px band around the bubble edge, about 200 px for a 16 px radius. Risk: moire flickers hard when centres move. Keep the motion under 1 px per frame and check against photosensitivity limits.

I. Starfield for warp or haste.

```
stars[i] = (x, y, z); each frame z -= speed; if z <= 0 respawn
sx = cx + x/z; sy = cy + y/z; put(sx, sy, ramp[z])      # streak = line to last frame's pos
```

40 to 80 stars, 2 ops each. Top-down use is a radial streak burst on teleport arrival.

### Inferences

- Per-pixel effects A, C, E, F, G should render into a shared atlas at 10 to 15 fps. Every instance of the spell blits the same frame. Then the cost does not grow with caster count, only blits do.
- A, B, C, D and H all end in a small indexed ramp. A common "value buffer plus ramp" path covers them, which matches the Acid and Fire studies.

### Gaps

- No fetch of Ferrari's GDC 2016 talk "8 Bit and 8 Bitish Graphics, Outside the Box". Recalled, add URL from GDC Vault.
- No named shipped game for tunnel, rotozoom or XOR as spell effects. Demoscene examples only. Second Reality (Future Crew, 1993) is the recalled showcase for plasma, tunnel and rotozoom.
- Huckaby's original blog post was not fetched, only mirrors and coverage.

See it in action. DOOM fire live canvas https://fabiensanglard.net/doom_fire_psx/ . Canvas Cycle http://www.effectgames.com/demos/canvascycle/ . Plasma and tunnel https://lodev.org/cgtutor/plasma.html and https://lodev.org/cgtutor/tunnel.html .

---

## 4. Curves and motion

### Takeaway

Integer line and circle algorithms are the right drawing calls at this scale, because they hit each pixel once and never blur. Motion comes from closed-form curves of time (Bézier, Lissajous, spiral, easing), which are stateless and so cost nothing on the network.

### Cited findings

- Bridson, Hourihan, Nordenstam, "Curl-Noise for Procedural Fluid Flow", ACM Trans. Graph. 26(3), article 46, July 2007. DOI 10.1145/1239451.1239497. PDF https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf . From the paper text. Velocity is the curl of a potential, so the field is divergence free and can be "evaluated anywhere in space and time" without solving a PDE. Partial derivatives use simple finite differences. Near a solid, the potential is multiplied by a smooth ramp of distance over d0 so flow slides around obstacles. In 2D the velocity is (dpsi/dy, -dpsi/dx).

### Algorithms

A. Bresenham line (beams, bolt segments). Recalled, Bresenham 1965. https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm

```
dx = abs(x1-x0); dy = -abs(y1-y0); sx = sign(x1-x0); sy = sign(y1-y0); err = dx+dy
loop: put(x0,y0); if at end: break
  e2 = 2*err
  if e2 >= dy: err += dy; x0 += sx
  if e2 <= dx: err += dx; y0 += sy
```

Cost max(dx, dy) pixel writes. A screen-wide beam is 320 writes. For a 3 px beam draw the line three times offset along the minor axis with a ramp (dim, white, dim).

B. Midpoint circle (shockwave rings, sigil rings). Recalled. https://en.wikipedia.org/wiki/Midpoint_circle_algorithm

```
x = r; y = 0; err = 1 - r
while x >= y:
  plot 8 symmetric points (+-x,+-y), (+-y,+-x) around centre
  y++
  if err < 0: err += 2*y + 1
  else: x--; err += 2*(y - x) + 1
```

Cost about 5.7 times r pixel writes for a full ring. r of 48 px is about 270 writes. For a top-down ground ring, plot (x, y/2) for a 2:1 ellipse and skip duplicate rows. Draw-in by angle is in section 5.

C. Quadratic Bézier lob with shadow.

```
t = clamp(age/flight, 0, 1)
ground = lerp(from, to, t)                 # the shadow sits here
height = 4 * H * t * (1 - t)               # peak H at t = 0.5
sprite at (ground.x, ground.y - height); shadow at ground, smaller when height is large
```

Parameters. H of 16 to 32 px, flight 300 to 600 ms. Stateless, so from, to and start time are all the network needs.

D. Lissajous and rose curves for orbiting motes.

```
lissajous: x = cx + A*sin(a*t + phase_i); y = cy + B*sin(b*t)       # a:b = 1:2 figure eight, 3:2 knot
rose:      r = R*cos(k*th); x = cx + r*cos(th); y = cy + 0.5*r*sin(th)   # k petals (k odd) or 2k (k even)
orbit depth: draw mote behind the character when sin(th) < 0, in front otherwise
```

3 to 6 motes, 2 table lookups each. B = A/2 gives the top-down squash. The behind and in-front split by sign of sin is what makes an orbit read as 3D.

E. Logarithmic spiral for gathering particles.

```
r(t) = r0 * exp(-k * t)        # or r0 * (1 - ease_in(t/T)) for a hard finish
th(t) = th0 + w * t
x = cx + r*cos(th); y = cy + 0.5*r*sin(th)
```

Parameters. r0 of 24 to 40 px, 1 to 2 turns over the cast time, 8 to 16 particles with th0 from the hash in section 1C. Accelerating toward the centre (ease-in) reads as "charging".

F. Cheap flow field from a small noise table (curl noise at pixel scale).

```
init: N[32][32] = smooth tileable noise, 0..255        # the Fog study's table
      FX[i][j] =  (N[i][j+1] - N[i][j-1])              # curl: vx =  dN/dy
      FY[i][j] = -(N[i+1][j] - N[i-1][j])              #       vy = -dN/dx
frame, per particle: c = (x>>2 + scroll) & 31, r = (y>>2) & 31
      x += FX[r][c] * k; y += FY[r][c] * k
```

Cost is 2 lookups and 2 adds per particle, nothing per pixel. Tables are 2 KB. Because the field is a curl it has no sinks, so smoke particles do not bunch up into dots. That is the practical gain over raw noise as velocity. Scroll the table offset to animate.

G. Verlet and spring-damper ribbons for trails.

```
ring buffer P[0..N-1] of past head positions (N = 6..12), push one per frame   # simplest ribbon
verlet rope: for each node: tmp = p; p += (p - prev)*DAMP + acc; prev = tmp
             repeat 2x: for each link: pull both ends toward rest length
spring-damper follower: v += (target - p)*K - v*D; p += v
draw: bresenham between successive nodes, ramp index by node age
```

Parameters. DAMP 0.9 to 0.98, K 0.1 to 0.3, D 0.2 to 0.4, 8 nodes. Cost about 8 nodes times 3 passes plus roughly 30 pixel writes. The ring buffer needs no physics and is enough for straight missiles. Verlet is worth it for whip-like or cape-like trails. Verlet origin recalled as Jakobsen, "Advanced Character Physics", GDC 2001.

H. Easing as the timing vocabulary. Recalled, Robert Penner, 2001, https://robertpenner.com/easing/ .

```
ease_out_quad(t)  = 1 - (1-t)^2      # impact rings: fast start, soft stop
ease_in_cubic(t)  = t^3              # gathering, charge
ease_out_back(t)  = 1 + c3*(t-1)^3 + c1*(t-1)^2,  c1 = 1.70158, c3 = c1 + 1   # sigil pop with overshoot
```

Bake each into a 16-entry table. Quantise the output to whole pixels and it becomes the "frames per step" timing an animator would draw by hand.

### Inferences

- Every curve in this section is a pure function of (start params, t). Combined with seeded particles, a full cast, travel and impact sequence replays identically on all clients from one small event.
- Shockwave ring radius should follow ease_out_quad, and ring colour should step down the ramp as radius grows, so the ring fades by palette and not by alpha.

### Gaps

- Bresenham, midpoint circle, Penner and Jakobsen are recalled, not fetched this session.
- No measured cost numbers.

See it in action. Bridson's paper page has videos via the UBC link above. Easing visual reference, recalled: https://easings.net/ .

---

## 5. Procedural sigils and runes

### Takeaway

A magic circle is 2 or 3 midpoint circles, one star polygon {n/k} and a ring of glyph stamps. That is about 600 to 900 pixel writes, done once into a 64x64 texture and then palette cycled. Draw-in by angle is a compare against a precomputed angle per pixel. Do not rotate the bitmap. Redraw or cycle.

### Cited findings

- CiaccoDavide/Alchemy-Circles-Generator. https://github.com/CiaccoDavide/Alchemy-Circles-Generator . MIT licence, 445 stars, PHP and Unity C# sources, seeded by a small PRNG. The README does not describe the algorithm. The pictures show nested polygons, circles and spokes.
- MadEqua/glyph-generator. https://github.com/MadEqua/glyph-generator . MIT licence, Processing (Java). Generates random glyph alphabets from a parameter set and exports PNG. Described as a prototype.
- EliCDavis/transmutation. https://github.com/EliCDavis/transmutation . TypeScript canvas plus Unity. Draws through an interface with Line, Polygon and Circle calls. No licence file visible, so treat as not reusable. 34 stars. Inspired by r/proceduralgeneration Monthly Challenge 16, March 2017, "Procedural runes": https://www.reddit.com/r/proceduralgeneration/comments/5wzo7j/monthly_challenge_16_march_2017_procedural_runes/
- watabou Rune Generator. https://watabou.itch.io/rune-generator . Haxe and OpenFL, made for the same challenge, shows 24 glyphs as a 6x4 table. Source not released per page comments, so use as visual reference only.
- danhdox/glyph. https://github.com/danhdox/glyph . MIT, single HTML file, procedural SVG glyphs. Looser fit.
- Commercial, not open. Game Dev Goose Magic Circle Generator (paid) https://game-dev-goose.itch.io/magic-circle-generator . Sigil Core for RPG Maker MZ https://csaf.itch.io/sigil-core .

### Algorithms

A. Magic circle from a seed.

```
sigil(seed, R=28):
  rng = hash(seed)
  circle(R); circle(R-2)                               # outer double ring
  circle(R * 0.55)                                     # inner ring
  n = pick(rng, [3,4,5,6,7,8]); k = pick coprime-ish step, 1 < k < n/2, else 1
  for i in 0..n:                                       # star polygon {n/k}
    a0 = TAU*i/n + rot; a1 = TAU*(i+k)/n + rot
    line(pt(R-3, a0), pt(R-3, a1))
  if rng & 1: polygon(n, R*0.55, rot + PI/n)           # counter-rotated inner polygon
  m = pick(rng, [6,8,12])
  for j in 0..m: stamp glyph[(rng >> j) % G] at pt(R*0.78, TAU*j/m)   # glyph ring in the band
pt(r, a) = (cx + r*cos(a), cy + 0.5*r*sin(a))          # 2:1 squash for ground plane
```

Parameters. R of 24 to 40 px (a 48 to 80 px circle covers 1.5 to 2.5 tiles). n of 3 to 8. {5/2} is the pentagram, {6/2} is two triangles, {8/3} is the 8-point star. Glyph count 6 to 12. Cost for R of 28. Three circles about 400 writes, a 5-line star about 250, 8 glyphs of about 8 px each 64. Roughly 700 writes, once.
Element language hook. Use n as an element code. 3 fire, 4 earth, 5 arcane, 6 ice, 8 holy. This gives colour-blind-safe shape redundancy. The mapping is my suggestion, not a cited convention.

B. Rune glyphs on a 3x3 dot grid (fits 5x5 px with 2 px pitch).

```
rune(seed):
  edges = the 20 segments between neighbouring dots (6 horiz, 6 vert, 8 diagonal)
  cur = random dot; strokes = 3 + seed % 3            # 3..5 strokes
  repeat strokes: e = random unused edge touching cur (else any edge touching the glyph)
                  draw e; cur = other end of e        # keeps the glyph connected
  reject if width or height < 2 dots, or if equal to an earlier glyph
```

Each glyph is a 20-bit mask, so an alphabet of 24 runes is 60 bytes. A seven-segment-style variant fixes 7 to 9 segments and picks 3 to 5 lit ones, which gives a more uniform, "designed" alphabet. Vertical-stem bias (always light one vertical edge) makes them read as Futhark-like.

C. Draw-in by angle.

```
init once per sigil texture: ANG[x,y] = atan2((y-cy)*2, x-cx) * 256/TAU     # 0..255, squash corrected
frame: visible(x,y) = ((ANG[x,y] - start) & 255) < progress*256
       tip pixel: where the difference is within 6 of progress*256, draw WHITE
```

One compare per sigil pixel, or one line in a shader with ANG stored in a texture channel. The white tip is the "pen" and carries the eye. Typical draw-in of 300 to 500 ms tied to the cast bar. Inference: this tells other players how far the cast has progressed with no extra UI.

D. Animating after draw-in. Palette cycle a 4-colour ramp around the ring (section 3D) by assigning ramp index from ANG >> 6. The ring appears to rotate while every line stays crisp.

### Inferences

- Generate all sigils at load into one atlas (16 spells times 64x64 is one 256x256 page). Runtime cost is then one sprite plus a shader compare.
- The glyph ring matters less than the silhouette at 64 px. Players will read ring count and polygon n, not individual runes.

### Gaps

- I did not read the source of the two MIT repos, so their exact rules are not documented here.
- No cited artist source on how readable sigils are at this size. Researcher on cast effects should cover that.

See it in action. https://github.com/CiaccoDavide/Alchemy-Circles-Generator (README images) and https://watabou.itch.io/rune-generator (runs in the browser).

---

## 6. Dissolves and transitions

### Takeaway

Three tools cover teleport, summon, death and shield break. A Bayer threshold for an ordered, world-locked fade. An LFSR for a random-looking fizzle with no memory. A noise threshold with a two-colour rim for a burn edge. All three are one compare per pixel of the sprite, about 500 ops for a 32x32 character.

### Cited findings

- Wolfenstein 3D FizzleFade, Sanglard. https://fabiensanglard.net/fizzlefade/index.php . A 17-bit maximal-length Galois LFSR, taps mask `0x00012000`, start value 1. `y = rndval & 0x000FF`, `x = (rndval & 0x1FF00) >> 8`. Plot if x < 320 and y < 200. The register walks 131,072 values to cover 320x200 = 64,000 pixels, each exactly once. The article gives no timing.

### Algorithms

A. Fizzlefade.

```
r = 1
do:
  y = r & 0xFF; x = (r >> 8) & 0x1FF
  lsb = r & 1; r >>= 1; if lsb: r ^= 0x12000
  if x < W and y < H: plot(x, y)
while r != 1
```

For 320x180 the same 17-bit register works unchanged, since 9 bits of x and 8 bits of y cover it. It visits 57,600 valid pixels in 131,071 steps, so about 44% of steps plot. Spread over 60 frames that is about 2,200 steps per frame.
For one sprite use a smaller register. Recalled masks from standard maximal-LFSR tables, test before use: 10 bits `0x240` for 32x32 (1,023 steps), 12 bits `0xE08` for 64x64 (4,095 steps). An LFSR never outputs 0, so plot pixel (0,0) by hand.
Stateless form for a shader. Give each pixel a rank once (the step at which the LFSR reaches it) and store it in a 32x32 texture. Then `visible = rank(x,y) > progress`. That is the same as a white-noise dither threshold.

B. Bayer ordered dissolve.

```
B4 = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]
visible(x,y) = alpha*16 > B4[y & 3][x & 3]            # 17 levels, no state
```

Recalled, Bayer 1973. https://en.wikipedia.org/wiki/Ordered_dithering . Use world coordinates for x and y so the pattern does not swim when the sprite moves, as the Fog study found. 17 levels at 60 fps is a 283 ms fade if stepped every frame. Good for stealth, ghosts and "other players' spells at 50%".

C. Noise-threshold burn with a two-colour rim.

```
n = NOISE[(x + ox) & 31][(y + oy) & 31]               # 0..255, the shared noise table
if n < T - RIM2: discard                              # burnt away
elif n < T - RIM1: out = RIM_DARK                     # e.g. deep orange
elif n < T: out = RIM_HOT                             # e.g. white or yellow
else: out = sprite
T rises 0 -> 255 over the effect
```

Parameters. RIM1 about 12 and RIM2 about 28 out of 255 give rims near 1 px each with smooth noise. Add `y*k` to n for a bottom-to-top burn. Rim colours carry the element. White and cyan for a frozen shatter, purple and black for death, gold and white for holy summon. Run it backwards to summon.

D. Scanline wipes.

```
teleport out: for each row y: if y < cut: skip; else draw row shifted by ((y & 1) ? +s : -s); s grows, cut rises
beam up: scale column height down to a 1-2 px wide white vertical line, hold 2 frames, vanish
```

Row offsets are free in a shader and are one blit per row on a canvas (32 blits for a character). The 2-frame white line at the end is the "climax" beat.

### Inferences

- Shield break reads best as C with a fast T (150 to 200 ms) plus 6 to 10 stateless shard particles from section 1C.
- B is the right tool for tier dimming because it has no alpha, costs one compare and keeps the palette intact.

### Gaps

- Bayer matrix and LFSR masks for other sizes are recalled.
- No cited example of burn dissolves in a shipped pixel-art game from this session. Dead Cells and Noita are likely candidates for another researcher to confirm.

See it in action. Sanglard's page runs the fizzle live: https://fabiensanglard.net/fizzlefade/index.php .

---

## 7. Cellular automata for spreading magic

### Takeaway

Run the automaton on the 32 px tile grid, not on pixels, and tick it at 4 to 10 Hz on the server. A 20x12 visible tile grid is 240 cells, so even 9-neighbour rules cost about 2,000 ops per tick. The client only draws the per-tile state with the effects from sections 3 and 6. The cyclic CA is the one worth running at pixel scale on a small buffer, because it makes self-organising spirals that look arcane.

### Cited findings

- Cyclic cellular automaton. https://en.wikipedia.org/wiki/Cyclic_cellular_automaton . Rule developed by David Griffeath, popularised by A. K. Dewdney, Scientific American, August 1989, pp. 102-105. n states 0 to n-1 with modular succession. A cell advances to its successor state when a neighbour already holds that successor. The general form needs the count of such neighbours to reach a threshold. From a random start in 2D it passes through a random stage, a consuming stage with growing colour blocks, and a "demon" stage with rotating spirals of period n. Low thresholds give spirals, high thresholds freeze into blocks, middle values give turbulence.

### Algorithms

A. Cyclic CA as an arcane pattern (pixel scale, small buffer).

```
grid 48x48, states 0..n-1 random; each tick (double buffer):
  for each cell c: s = (grid[c] + 1) % n
    if count(neighbours == s) >= THRESH: next[c] = s else next[c] = grid[c]
  swap; draw through an n-colour looping ramp
```

Parameters. n of 8 to 14, von Neumann neighbourhood with threshold 1 for clean spirals, Moore with threshold 2 or 3 for chunkier waves. Cost 2,304 cells times 4 neighbours is about 9,200 ops per tick at 48x48. Tick at 10 Hz. It needs 50 to 150 ticks from random noise to reach spirals, so pre-warm at load or ship a saved state. Recalled warm-up range, check in the demo.

B. Frost spread over tiles (stochastic growth with decay).

```
tile state: frost 0..3
tick (5 Hz): for each tile with frost == 0 and not blocked:
               k = number of 4-neighbours with frost >= 2
               if rand() < P_SPREAD * k: frost = 1
             for each tile with frost > 0: age++; if age > HOLD: frost--   # melt
             frost 1 -> 2 -> 3 on successive ticks while fed
```

Parameters. P_SPREAD 0.15 to 0.3, HOLD 15 to 40 ticks. Diagonal-free neighbourhood gives diamond growth, which reads as crystalline. Draw the frost edge with the DLA-shaped decals from section 2E.

C. Corruption creep (biased, with fuel).

```
if tile.corrupt == 0 and tile.fuel > 0 and any neighbour corrupt:
   if rand() < P * tile.fuel / 255: tile.corrupt = 1
if tile.corrupt: tile.fuel -= BURN; if tile.fuel <= 0: tile.corrupt = 0 (leave scar decal)
```

This is the Fire study's spread grid with a different palette and slower constants. Link, do not repeat. Poison and acid fields reuse the Acid study's goop grid.

D. Energy field decay (diffuse and fade).

```
e[c] = (e[c]*4 + e[n] + e[s] + e[w] + e[e]) >> 3 ;  e[c] -= DECAY ; clamp 0
draw tile effect when e[c] > T; intensity picks 1 of 3 flipbook rows
```

One shift-and-add blur per tile per tick. Gives soft-edged fields that shrink from the outside in.

### Inferences

- The server owns the tile state and sends deltas (tile index plus new state, 3 bytes). The estimate is mine. Researcher on netcode should confirm against Tibia's field items.
- The cyclic CA is client-only decoration, so its state never touches the network. Seed it from the spell id so screenshots match.

### Gaps

- No shipped-game citation for cyclic CA as a spell visual.
- The warm-up tick count for spirals is recalled and depends on n and threshold.

See it in action. The Wikipedia page has animations of all three stages: https://en.wikipedia.org/wiki/Cyclic_cellular_automaton .

---

## 8. Recent academic and industry work (2023 to 2026)

### Takeaway

I found no peer-reviewed 2023 to 2026 paper on generating real-time game VFX flipbooks. The research that exists targets character sprite animation. Text-to-VFX exists only as vendor tools with unverified claims. For an indie today, generated flipbooks are a concept and reference aid. They do not yet give palette-locked, whole-pixel, loop-clean frames without hand cleanup. The 1983 to 2007 algorithms above remain the practical toolkit.

### Cited findings

- "Sprite Sheet Diffusion: Generate Game Character for Animation", Carnegie Mellon, arXiv 2412.03685, December 2024, v2 March 2025. https://arxiv.org/abs/2412.03685 . Project page https://chenganhsieh.github.io/spritesheet-diffusion . Adapts Animate Anyone to produce character action sequences from a reference image and a pose sequence. Dataset of 150+ paired examples. Targets characters, not effects.
- Vendor tools, all claims vendor-reported. Sorceress describes prompt-to-sprite-sheet output including fire, explosions, lightning and magic at cell sizes of 24 to 96 px: https://sorceress.games/blog/ai-sprite-generator-pixel-walk-cycles-idles-and-vfx . Unity ships a sprite generator in its editor AI tools, in beta: https://unity.com/blog/unity-ai-sprite-generator . PixelLab is already in this project's toolchain for sprites.
- Two searches for SIGGRAPH or i3D "neural flipbook", "generated VFX" or "text-to-VFX" papers returned nothing relevant.

### Inferences

- Why effects lag characters. A spell flipbook needs additive-safe values, a strict ramp, a clean loop and frame-exact timing (anticipation, climax, dissipation). General image and video models give none of these by default. Expect to quantise to the palette, re-time by hand and redraw the climax frame.
- The cheap hybrid available now. Generate a rough 8 to 12 frame explosion or swirl as reference, reduce to 4 values, map through the element ramp from this study, and fix frames by hand. The procedural routes in sections 1 to 7 need no generation at all and stay editable as numbers.
- Stateless seeded effects have a property generated flipbooks lack. They cost zero download bytes and vary per cast.

### Gaps

- I did not search the SIGGRAPH 2025 and 2026 programmes or i3D proceedings page by page. Absence of results from two web searches is weak evidence.
- No hands-on test of any vendor tool. No licence or pricing check.
- Real-time VFX industry talks (for example at GDC or the realtimevfx.com community) on machine-learned flipbooks were not searched.

---

## Cost summary (all estimates, ops per frame)

| Technique | Size | Ops per frame | Per caster or shared |
|---|---|---|---|
| Pool particles | 16 to 64 particles | 16 to 64 updates plus writes | per caster |
| Stateless burst | 24 particles | 24 hash plus trig | per caster, no storage |
| Midpoint bolt, 5 gens | 160 px long | about 200 writes on re-roll frames | per caster |
| DBM lightning | 64x64 grid | about 82,000 per growth step | bake only |
| Feedback buffer | 64x64 | 4,096 | shared |
| DOOM fire aura | 16x24 | 384 | shared |
| Plasma with palette shift | any | 0 indexed, else 1 lookup per px | shared |
| Palette cycling | 4 to 8 slots | 4 to 8 writes | shared |
| Tunnel or polar portal | 64x64 | 4,096 lookups | shared |
| Metaball orb, 3 balls | 24x24 | 1,728 | shared or baked |
| Midpoint circle ring | r = 48 | about 270 writes | per caster |
| Sigil build | R = 28 | about 700 writes, once | baked atlas |
| Sigil draw-in | 64x64 | 1 compare per sigil px | shader |
| Fizzle, full screen over 1 s | 320x180 | about 2,200 LFSR steps | one-off |
| Bayer or burn dissolve | 32x32 sprite | 1,024 compares or shader | per sprite |
| Tile CA (frost, corruption) | 20x12 tiles | about 2,000 per tick at 5 Hz | server |
| Cyclic CA | 48x48 | about 9,200 per tick at 10 Hz | shared, client only |

## Suggested ratings for the study (my opinion)

- Best value. Feedback buffer, palette cycling, stateless seeded bursts, midpoint bolt, midpoint-circle sigils with angle draw-in, Bayer and burn dissolves.
- Pretty but costly. DBM lightning, full-screen tunnel or plasma, per-caster metaballs.
- Cheap but risky for taste. Rotozoom on line art (breaks 1 px lines), XOR and moire (flicker), raw L-system lightning (too regular).

## Sources

Fetched or text-extracted in this session.

- Reeves 1983 paper PDF. https://www.cs.princeton.edu/courses/archive/spr15/cos426/papers/Reeves83.pdf
- SIGGRAPH history, Reeves. https://history.siggraph.org/?p=106060
- Sanglard, DOOM PSX fire. https://fabiensanglard.net/doom_fire_psx/
- Sanglard, FizzleFade. https://fabiensanglard.net/fizzlefade/index.php
- Vandevenne, plasma. https://lodev.org/cgtutor/plasma.html
- Vandevenne, tunnel. https://lodev.org/cgtutor/tunnel.html
- Hoffman, 2D lightning. https://code.tutsplus.com/how-to-generate-shockingly-good-2d-lightning-effects--gamedev-2681t
- Bridson et al. 2007 PDF. https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf
- Kim and Lin project and LumosQuad. https://gamma.cs.unc.edu/FAST_LIGHTNING/ and https://gamma.cs.unc.edu/FAST_LIGHTNING/lumos.html
- Wikipedia, dielectric breakdown model. https://en.wikipedia.org/wiki/Dielectric_breakdown_model
- Wikipedia, cyclic cellular automaton. https://en.wikipedia.org/wiki/Cyclic_cellular_automaton
- Canvas Cycle. https://experiments.withgoogle.com/canvas-cycle
- Alchemy-Circles-Generator. https://github.com/CiaccoDavide/Alchemy-Circles-Generator
- glyph-generator. https://github.com/MadEqua/glyph-generator
- transmutation. https://github.com/EliCDavis/transmutation

Seen in search results only (summaries, not full pages).

- Sims 1990. https://history.siggraph.org/?p=122085
- Reed and Wyvill 1994. https://history.siggraph.org/?p=119719
- Latta 2004. https://gamedeveloper.com/programming/building-a-million-particle-system
- DBM eta figures. https://arxiv.org/pdf/cond-mat/0103312 and https://arxiv.org/pdf/cond-mat/0112218
- Canvas Cycle coverage. https://80.lv/articles/color-cycling-from-the-90s-returns-with-html5
- watabou Rune Generator. https://watabou.itch.io/rune-generator
- danhdox/glyph. https://github.com/danhdox/glyph
- Sprite Sheet Diffusion. https://arxiv.org/abs/2412.03685
- Sorceress vendor blog. https://sorceress.games/blog/ai-sprite-generator-pixel-walk-cycles-idles-and-vfx
- Unity sprite generator. https://unity.com/blog/unity-ai-sprite-generator

Recalled, not fetched. Verify before citing.

- Bresenham line and midpoint circle (Wikipedia URLs above), Bayer 1973 ordered dithering, Penner easing https://robertpenner.com/easing/ , Jakobsen GDC 2001 verlet, Blinn 1982 metaballs, Witten and Sander 1981 DLA, Reeves and Blau 1985, Lander 1998, van der Burg 2000, Drilian 2009 lightning post (URL returned 404), Ferrari GDC 2016 talk, Second Reality 1993, LFSR masks 0x240 and 0xE08.
