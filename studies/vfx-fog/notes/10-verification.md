# Lead verification and writer guidance (2026-11-10)

## Quilez height fog
- The article exists at https://iquilezles.org/articles/fog/ (it was 404 for researcher 05; search indexes it). It uses density d(y) = a·exp(-b·y) and integrates it along the camera ray analytically; the shader adds one division to the constant-density formula. Canonical closed form (tag [K], cite the article): fogAmount = (a/b) · exp(-ro.y·b) · (1 - exp(-t·rd.y·b)) / rd.y.
- In a top-down 2D game there is no view ray through height, so the study's practical form is Beer's law on a thickness: T = exp(-k · max(0, fogLine - tileHeight)) [I, from notes 05]. Present the Quilez formula as background, not as the recommendation.
- Supporting sources: Demofox "Analytic fog density" https://blog.demofox.org/2014/06/22/analytic-fog-density/ ; Flax Engine exponential height fog shader (clamps the falloff term at -127 to avoid overflow) https://docs.flaxengine.com/manual/graphics/fog-effects/exponential-height-fog.html

## Things the writer must label
- Note 04: burn-off of 1-3 h after sunrise is the researcher's estimate [I].
- Note 05: Godot 4.7 DrawableTexture2D release date reported as June 19, 2026; the class exists (verified for the Water study: https://docs.godotengine.org/en/4.7/classes/class_drawabletexture2d.html), Compatibility support undocumented [U].
- Note 05: the 1.4 ms (4-octave fbm) and 7 ms (2-level warp) GPU figures are estimates scaled from McEwan 2012, not measurements. Prefer note 08's measured numbers.
- Note 03: no published ms per fog-of-war update anywhere; cost figures are cell-count estimates. Prefer note 08's measurements.
- VALORANT fog-of-war 50% -> under 2% of server frame time is Riot's own figure [V, self-reported].
- Shadertoy default licence (CC BY-NC-SA 3.0) was not read on the official terms page (403) [U].
- GDQuest clouds2D: code MIT but repository art CC BY-NC-SA: flag NC.

## Emphasis from the user
Two equal goals: artistic quality AND runtime efficiency. Every profile's Cost/performance field should give a number (measured where note 08 has one, otherwise a labelled estimate), and the How it feels field should say what artists and players praise or dislike. §6 must contain a measured cost table built from note 08, and a "pretty vs cheap" matrix (techniques plotted by Pixel taste + Mood against Speed).
