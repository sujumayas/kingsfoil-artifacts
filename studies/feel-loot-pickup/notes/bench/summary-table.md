# Loot bench, full tables

- metal: Chromium 153.0.8010.12, Apple M4 Pro 14 cores 48.0 GB, macOS 26.5.1 25F80, crossOriginIsolated=True, total 60.1 s
- metal-throttle6: Chromium 153.0.8010.12, Apple M4 Pro 14 cores 48.0 GB, macOS 26.5.1 25F80, crossOriginIsolated=True, total 78 s
- swiftshader: Chromium 153.0.8010.12, Apple M4 Pro 14 cores 48.0 GB, macOS 26.5.1 25F80, crossOriginIsolated=True, total 217.6 s

Canvas rows: median / p95 ms per frame for the whole frame (clear, 240 floor tiles, the test, x4 upscale blit, 1-pixel readback that forces the GPU to finish). Subtract `baseline_floor_only` for the effect alone. `cpu_only` rows time the JS function alone. (20f) marks a case cut to 20 frames because a warm-up frame took > 40 ms. Budget is 16.7 ms per frame at 60 fps.


## Items, motion, glow, fly-to-bag

| test | n | metal | metal-throttle6 | swiftshader |
|---|---|---|---|---|
| baseline_floor_only | 0 | 0.58 / 0.69 | 1.47 / 2.35 | 7.79 / 8.20 |
| items_static_blit | 50 | 0.63 / 0.69 | 1.62 / 2.31 | 8.71 / 9.06 |
| items_poparc_bounce_shadow | 50 | 0.69 / 0.73 | 1.72 / 2.56 | 9.52 / 10.07 |
| glow_halo_sprite_alpha | 50 | 0.73 / 0.80 | 1.77 / 2.64 | 9.56 / 9.89 |
| glow_halo_sprite_prebaked_pulse | 50 | 0.68 / 0.72 | 1.75 / 2.77 | 9.49 / 9.85 |
| glow_halo_lighter_additive | 50 | 0.70 / 0.75 | 1.74 / 2.56 | 9.48 / 10.00 |
| glow_shadowBlur6 | 50 | 5.78 / 6.08 | 6.89 / 8.02 | **21.07 / 21.62** |
| fly_to_bag_tween | 50 | 0.62 / 0.66 | 1.63 / 2.48 | 8.77 / 9.06 |
| items_static_blit | 200 | 0.75 / 0.81 | 2.01 / 3.06 | 10.99 / 11.36 |
| items_poparc_bounce_shadow | 200 | 0.94 / 0.99 | 2.76 / 3.90 | 14.19 / 14.61 |
| glow_halo_sprite_alpha | 200 | 0.99 / 1.07 | 2.87 / 3.96 | 14.12 / 14.60 |
| glow_halo_sprite_prebaked_pulse | 200 | 0.94 / 0.99 | 3.19 / 4.47 | 14.16 / 14.62 |
| glow_halo_lighter_additive | 200 | 0.98 / 1.04 | 2.98 / 4.22 | 14.06 / 14.57 |
| glow_shadowBlur6 | 200 | **20.68 / 21.76** | **23.57 / 25.00** | **60.49 / 61.34 (20f)** |
| fly_to_bag_tween | 200 | 0.74 / 0.80 | 2.08 / 3.11 | 11.04 / 11.39 |
| items_static_blit | 1000 | 1.46 / 1.73 | 4.97 / 5.76 | **23.46 / 24.11** |
| items_poparc_bounce_shadow | 1000 | 2.84 / 3.33 | 9.61 / 11.18 | **39.38 / 40.08** |
| glow_halo_sprite_alpha | 1000 | 2.96 / 3.15 | 9.64 / 11.01 | **39.02 / 40.07** |
| glow_halo_sprite_prebaked_pulse | 1000 | 2.79 / 3.02 | 9.55 / 10.84 | **38.95 / 39.76** |
| glow_halo_lighter_additive | 1000 | 2.88 / 3.26 | 9.54 / 10.90 | **39.22 / 40.19** |
| glow_shadowBlur6 | 1000 | **88.17 / 89.64 (20f)** | **100.20 / 101.78 (20f)** | **273.89 / 278.09 (20f)** |
| fly_to_bag_tween | 1000 | 1.61 / 2.18 | 5.26 / 6.14 | **23.62 / 24.17** |
| items_static_blit | 3000 | 3.80 / 4.31 | 13.57 / 15.38 | **55.26 / 56.16 (20f)** |
| items_poparc_bounce_shadow | 3000 | 7.01 / 7.55 | **26.97 / 29.62** | **102.28 / 103.08 (20f)** |
| glow_halo_sprite_alpha | 3000 | 7.25 / 8.01 | **27.21 / 29.58** | **101.88 / 103.64 (20f)** |
| glow_halo_sprite_prebaked_pulse | 3000 | 6.93 / 7.71 | **26.89 / 28.94** | **102.21 / 105.41 (20f)** |
| glow_halo_lighter_additive | 3000 | 7.04 / 8.16 | **27.07 / 29.89** | **102.94 / 103.94 (20f)** |
| glow_shadowBlur6 | 3000 | **289.90 / 297.51 (20f)** | **319.06 / 339.62 (20f)** | **836.17 / 840.79 (20f)** |
| fly_to_bag_tween | 3000 | 3.88 / 4.40 | 13.99 / 15.86 | **55.06 / 55.48 (20f)** |

## Light beams (n = beams)

| test | n | metal | metal-throttle6 | swiftshader |
|---|---|---|---|---|
| beam_gradient_new_per_frame | 5 | 0.58 / 0.64 | 1.52 / 2.54 | 7.99 / 8.32 |
| beam_gradient_cached_translate | 5 | 0.57 / 0.63 | 1.50 / 2.29 | 7.98 / 8.36 |
| beam_sprite_lighter | 5 | 0.54 / 0.59 | 1.51 / 2.26 | 8.02 / 8.38 |
| beam_gradient_new_per_frame | 20 | 0.60 / 0.68 | 1.52 / 2.45 | 8.17 / 8.59 |
| beam_gradient_cached_translate | 20 | 0.61 / 0.66 | 1.53 / 2.50 | 8.27 / 8.97 |
| beam_sprite_lighter | 20 | 0.61 / 0.65 | 1.52 / 2.54 | 8.27 / 8.58 |
| beam_gradient_new_per_frame | 100 | 0.74 / 0.87 | 1.83 / 2.77 | 9.26 / 9.63 |
| beam_gradient_cached_translate | 100 | 0.71 / 0.76 | 1.59 / 2.58 | 9.15 / 9.62 |
| beam_sprite_lighter | 100 | 0.69 / 0.77 | 1.75 / 2.79 | 9.49 / 9.90 |
| beam_gradient_new_per_frame | 300 | 1.05 / 1.18 | 2.88 / 3.83 | 11.93 / 12.44 |
| beam_gradient_cached_translate | 300 | 0.93 / 1.11 | 2.12 / 3.38 | 11.56 / 12.12 |
| beam_sprite_lighter | 300 | 0.94 / 1.34 | 2.63 / 3.79 | 12.52 / 13.04 |

## Labels (all n labels drawn, no declutter)

| test | n | metal | metal-throttle6 | swiftshader |
|---|---|---|---|---|
| label_bitmap_glyphs | 50 | 1.02 / 1.20 | 2.90 / 4.21 | 15.02 / 15.54 |
| label_cached_canvas_each | 50 | 0.71 / 0.77 | 1.62 / 2.44 | 9.69 / 10.07 |
| label_cached_atlas | 50 | 0.65 / 0.70 | 1.61 / 2.79 | 8.70 / 9.04 |
| label_fillText_lowres6px | 50 | 0.71 / 0.77 | 1.74 / 2.96 | 14.29 / 14.88 |
| label_fillText_measure_each | 50 | 0.74 / 0.82 | 1.76 / 2.53 | 13.80 / 14.35 |
| label_fillText_overlay1280 | 50 | 0.69 / 0.76 | 1.62 / 2.58 | **16.93 / 17.46** |
| label_bitmap_glyphs | 200 | 2.73 / 2.87 | 8.60 / 9.85 | **38.10 / 38.93** |
| label_cached_canvas_each | 200 | 0.92 / 0.97 | 2.12 / 3.17 | 12.66 / 13.06 |
| label_cached_atlas | 200 | 0.76 / 0.82 | 1.93 / 3.02 | 10.93 / 11.35 |
| label_fillText_lowres6px | 200 | 1.03 / 1.10 | 2.67 / 3.54 | **34.44 / 35.51** |
| label_fillText_measure_each | 200 | 1.14 / 1.22 | 3.19 / 4.59 | **32.98 / 33.77** |
| label_fillText_overlay1280 | 200 | 1.10 / 1.22 | 2.90 / 3.81 | **36.62 / 37.33** |
| label_bitmap_glyphs | 1000 | 11.45 / 12.40 | **43.06 / 49.28 (20f)** | **161.63 / 165.54 (20f)** |
| label_cached_canvas_each | 1000 | 1.99 / 2.52 | 5.66 / 6.82 | **25.73 / 26.38** |
| label_cached_atlas | 1000 | 1.50 / 1.60 | 5.03 / 6.29 | **23.34 / 24.00** |
| label_fillText_lowres6px | 1000 | 2.77 / 3.07 | 7.55 / 8.47 | **139.66 / 141.21 (20f)** |
| label_fillText_measure_each | 1000 | 3.03 / 3.37 | 8.56 / 10.62 | **134.37 / 136.44 (20f)** |
| label_fillText_overlay1280 | 1000 | 2.59 / 2.85 | 7.25 / 8.20 | **141.46 / 142.78 (20f)** |
| label_bitmap_glyphs | 3000 | **31.55 / 33.42** | **119.06 / 130.72 (20f)** | **467.30 / 471.21 (20f)** |
| label_cached_canvas_each | 3000 | 4.89 / 5.38 | 14.82 / 17.41 | **57.30 / 58.63 (20f)** |
| label_cached_atlas | 3000 | 3.85 / 4.27 | 13.47 / 15.48 | **54.85 / 56.32 (20f)** |
| label_fillText_lowres6px | 3000 | 6.44 / 7.10 | **19.68 / 23.14** | **402.06 / 406.81 (20f)** |
| label_fillText_measure_each | 3000 | 7.33 / 8.54 | **23.16 / 28.01** | **387.40 / 391.06 (20f)** |
| label_fillText_overlay1280 | 3000 | 6.52 / 7.38 | **19.52 / 21.04** | **401.40 / 404.87 (20f)** |

## Label overlap solver (CPU only, 320x180 screen)

| test | n | metal | metal-throttle6 | swiftshader | labels_placed | overlap_checks |
|---|---|---|---|---|---|---|
| solver_naive_On2 | 50 | 0.01 / 0.01 | 0.01 / 0.01 | 0.01 / 0.01 | 43 | 1982 |
| solver_spatial_grid | 50 | 0.01 / 0.01 | 0.01 / 0.01 | 0.01 / 0.03 | 43 | 188 |
| solver_naive_On2 | 200 | 0.04 / 0.04 | 0.04 / 1.29 | 0.04 / 0.04 | 76 | 21420 |
| solver_spatial_grid | 200 | 0.01 / 0.01 | 0.01 / 0.72 | 0.01 / 0.02 | 76 | 1746 |
| solver_naive_On2 | 1000 | 0.24 / 0.26 | 1.48 / 2.46 | 0.27 / 0.28 | 99 | 140110 |
| solver_spatial_grid | 1000 | 0.06 / 0.07 | 0.06 / 1.33 | 0.06 / 0.07 | 99 | 11324 |
| solver_naive_On2 | 3000 | 0.93 / 0.95 | 5.65 / 6.59 | 1.00 / 1.03 | 118 | 480509 |
| solver_spatial_grid | 3000 | 0.18 / 0.19 | 1.16 / 2.08 | 0.18 / 0.27 | 118 | 38149 |

## Magnet pull, 30 players (CPU only, 640x360 world, radius 64 px)

| test | n | metal | metal-throttle6 | swiftshader |
|---|---|---|---|---|
| magnet_bruteforce_30p | 50 | 0.01 / 0.01 | 0.00 / 0.01 | 0.01 / 0.01 |
| magnet_grid_30p | 50 | 0.01 / 0.01 | 0.01 / 0.01 | 0.01 / 0.01 |
| magnet_bruteforce_30p | 200 | 0.01 / 0.01 | 0.01 / 0.01 | 0.01 / 0.01 |
| magnet_grid_30p | 200 | 0.01 / 0.01 | 0.01 / 0.01 | 0.01 / 0.01 |
| magnet_bruteforce_30p | 1000 | 0.03 / 0.04 | 0.03 / 1.27 | 0.04 / 0.04 |
| magnet_grid_30p | 1000 | 0.02 / 0.03 | 0.02 / 0.81 | 0.02 / 0.03 |
| magnet_bruteforce_30p | 3000 | 0.10 / 0.10 | 0.31 / 1.51 | 0.10 / 0.11 |
| magnet_grid_30p | 3000 | 0.05 / 0.06 | 0.05 / 1.34 | 0.05 / 0.06 |

## Boss drop, 30 players (n = items in the drop pool)

| test | n | metal | metal-throttle6 | swiftshader | labels_candidates | labels_placed |
|---|---|---|---|---|---|---|
| boss_drop_30p_cheap | 60 | 0.80 / 0.94 | 2.49 / 3.47 | 11.22 / 11.89 | 56 | 30 |
| boss_drop_30p_naive | 60 | 2.08 / 2.23 | 3.79 / 4.84 | **17.16 / 18.09** | 56 | 30 |
| boss_drop_30p_cheap | 200 | 1.14 / 1.25 | 3.62 / 4.83 | 16.27 / 16.84 | 179 | 49 |
| boss_drop_30p_naive | 200 | 4.85 / 5.24 | 7.63 / 8.61 | **29.45 / 30.30** | 179 | 49 |
| boss_drop_30p_cheap | 600 | 2.46 / 2.65 | 7.73 / 9.24 | **30.09 / 30.88** | 536 | 59 |
| boss_drop_30p_naive | 600 | 13.38 / 14.03 | **20.66 / 22.12** | **60.91 / 61.55 (20f)** | 536 | 59 |

## DOM labels vs canvas atlas labels (rAF loop, 120 frames, labels bob every frame)

Work = JS time inside the rAF callback (median / p95). Main = CDP Performance.getMetrics TaskDuration per frame, which adds style recalc, layout and main-thread paint. Compositor and GPU raster are not counted.

| test | n | metal work / main / style ms, frames>20ms | metal-throttle6 work / main / style ms, frames>20ms | swiftshader work / main / style ms, frames>20ms |
|---|---|---|---|---|
| raf_labels_canvas_atlas | 50 | 0.52/0.97 / 0.937 / 0.0, 0 | 0.59/1.57 / 1.05 / 0.0, 0 | 0.22/0.24 / 0.367 / 0.0, 0 |
| raf_labels_dom_spans | 50 | 0.78/0.98 / 1.574 / 0.13, 0 | 0.52/1.48 / 1.295 / 0.078, 0 | 0.21/0.24 / 0.485 / 0.032, 0 |
| raf_labels_canvas_atlas | 200 | 0.84/1.63 / 1.198 / 0.0, 0 | 1.60/2.02 / 1.875 / 0.0, 0 | 0.38/0.40 / 0.519 / 0.0, 0 |
| raf_labels_dom_spans | 200 | 0.75/1.24 / 1.824 / 0.197, 0 | 1.28/2.10 / 3.023 / 0.44, 0 | 0.35/0.38 / 0.829 / 0.085, 58 |
| raf_labels_canvas_atlas | 1000 | 2.60/3.15 / 2.791 / 0.0, 0 | 7.62/8.90 / 8.187 / 0.0, 0 | 1.50/1.55 / 1.685 / 0.0, 116 |
| raf_labels_dom_spans | 1000 | 1.33/1.44 / 3.566 / 0.414, 1 | 5.42/6.88 / 14.272 / 1.914, 2 | 1.11/1.18 / 2.862 / 0.34, 118 |
| raf_labels_canvas_atlas | 3000 | 4.81/5.12 / 4.982 / 0.0, 0 | 24.25/25.95 / 25.371 / 0.0, 61 | 4.20/4.32 / 4.516 / 0.0, 119 |
| raf_labels_dom_spans | 3000 | 3.02/3.21 / 10.443 / 1.024, 1 | 17.84/20.68 / 50.525 / 5.78, 119 | 3.08/3.16 / 12.807 / 1.035, 117 |
