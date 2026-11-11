# Combat juice bench, full tables

- metal: Chromium 153.0.8010.12, WebGL `ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version)`, Apple M4 Pro 14 cores 48.0 GB, macOS 26.5.1 25F80, crossOriginIsolated=True, total 69.6 s
- metal-throttle6: Chromium 153.0.8010.12, WebGL `ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version)`, Apple M4 Pro 14 cores 48.0 GB, macOS 26.5.1 25F80, crossOriginIsolated=True, total 162.8 s
- swiftshader: Chromium 153.0.8010.12, WebGL `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0) (0x0000C0DE)), SwiftShader driver)`, Apple M4 Pro 14 cores 48.0 GB, macOS 26.5.1 25F80, crossOriginIsolated=True, total 112.3 s

Cells are median / p95 ms per frame, including clear, upscale blit and a 1-pixel readback that forces the GPU to finish. Subtract the baseline row of the same target for the effect alone.

| test | target | n | metal | metal-throttle6 | swiftshader |
|---|---|---|---|---|---|
| baseline_empty_frame | c2d_lowres320x180+upscale |  | 0.65 / 0.70 | 3.37 / 4.70 | 0.56 / 0.62 |
| dmg_glyph_blits | c2d_lowres320x180+upscale | 50 | 0.78 / 0.84 | 3.69 / 5.20 | 2.81 / 3.00 |
| dmg_fillText | c2d_lowres320x180+upscale | 50 | 0.70 / 0.74 | 3.53 / 4.91 | 2.71 / 2.91 |
| dmg_fillText_strokeText_outline | c2d_lowres320x180+upscale | 50 | 0.75 / 0.81 | 3.52 / 4.83 | 4.67 / 4.90 |
| dmg_cached_number_sprites | c2d_lowres320x180+upscale | 50 | 0.76 / 1.96 | 3.98 / 9.43 | 1.60 / 2.40 |
| dmg_glyph_blits | c2d_lowres320x180+upscale | 50 hits -> 5 agg | 0.67 / 0.70 | 3.36 / 4.09 | 1.01 / 1.06 |
| dmg_fillText | c2d_lowres320x180+upscale | 50 hits -> 5 agg | 0.66 / 0.69 | 3.29 / 4.26 | 0.96 / 1.03 |
| dmg_fillText_strokeText_outline | c2d_lowres320x180+upscale | 50 hits -> 5 agg | 0.67 / 0.71 | 3.29 / 3.98 | 1.20 / 1.29 |
| dmg_cached_number_sprites | c2d_lowres320x180+upscale | 50 hits -> 5 agg | 1.32 / 2.08 | 6.17 / 9.96 | 1.21 / 1.60 |
| dmg_glyph_blits | c2d_lowres320x180+upscale | 200 | 1.10 / 1.21 | 4.79 / 6.08 | 8.88 / 9.19 |
| dmg_fillText | c2d_lowres320x180+upscale | 200 | 0.83 / 0.91 | 3.98 / 5.23 | 8.46 / 8.98 |
| dmg_fillText_strokeText_outline | c2d_lowres320x180+upscale | 200 | 1.02 / 1.10 | 4.78 / 5.78 | 16.12 / 16.69 |
| dmg_cached_number_sprites | c2d_lowres320x180+upscale | 200 | 1.04 / 1.97 | 4.79 / 9.20 | 4.12 / 4.75 |
| dmg_glyph_blits | c2d_lowres320x180+upscale | 200 hits -> 20 agg | 0.71 / 0.76 | 3.54 / 4.84 | 1.74 / 1.87 |
| dmg_fillText | c2d_lowres320x180+upscale | 200 hits -> 20 agg | 0.68 / 0.71 | 3.42 / 4.59 | 1.66 / 1.79 |
| dmg_fillText_strokeText_outline | c2d_lowres320x180+upscale | 200 hits -> 20 agg | 0.69 / 0.76 | 3.56 / 4.58 | 2.60 / 2.78 |
| dmg_cached_number_sprites | c2d_lowres320x180+upscale | 200 hits -> 20 agg | 2.25 / 3.37 | 11.28 / 15.97 | 2.11 / 2.51 |
| dmg_glyph_blits | c2d_lowres320x180+upscale | 1000 | 3.38 / 3.48 | 13.18 / 14.90 | 41.88 / 43.93 (20f) |
| dmg_fillText | c2d_lowres320x180+upscale | 1000 | 1.59 / 1.68 | 6.93 / 7.96 | 38.90 / 39.88 |
| dmg_fillText_strokeText_outline | c2d_lowres320x180+upscale | 1000 | 2.85 / 3.00 | 10.62 / 11.83 | 77.23 / 78.59 (20f) |
| dmg_cached_number_sprites | c2d_lowres320x180+upscale | 1000 | 2.66 / 3.21 | 9.46 / 14.12 | 17.09 / 17.77 |
| dmg_glyph_blits | c2d_lowres320x180+upscale | 1000 hits -> 100 agg | 0.94 / 1.05 | 4.18 / 5.33 | 5.77 / 6.13 |
| dmg_fillText | c2d_lowres320x180+upscale | 1000 hits -> 100 agg | 0.76 / 0.81 | 3.71 / 5.08 | 5.41 / 5.76 |
| dmg_fillText_strokeText_outline | c2d_lowres320x180+upscale | 1000 hits -> 100 agg | 0.85 / 0.89 | 4.21 / 5.72 | 10.12 / 10.55 |
| dmg_cached_number_sprites | c2d_lowres320x180+upscale | 1000 hits -> 100 agg | 3.75 / 6.96 | 43.22 / 64.29 (20f) | 4.67 / 6.54 |
| part_sim_only_no_draw | c2d_lowres320x180+upscale | 500 | 0.64 / 0.68 | 3.30 / 4.21 | 0.56 / 0.59 |
| part_fillRect_2x2_4colour_buckets | c2d_lowres320x180+upscale | 500 | 0.74 / 0.77 | 3.48 / 4.47 | 7.86 / 8.17 |
| part_drawImage_3x3_sprite | c2d_lowres320x180+upscale | 500 | 1.06 / 1.11 | 4.88 / 5.55 | 8.52 / 8.87 |
| part_sim_only_no_draw | c2d_lowres320x180+upscale | 2000 | 0.67 / 0.72 | 3.42 / 4.22 | 0.59 / 0.62 |
| part_fillRect_2x2_4colour_buckets | c2d_lowres320x180+upscale | 2000 | 1.02 / 1.08 | 4.18 / 5.38 | 29.31 / 29.97 |
| part_drawImage_3x3_sprite | c2d_lowres320x180+upscale | 2000 | 2.74 / 2.93 | 10.46 / 12.07 | 31.84 / 32.48 |
| part_sim_only_no_draw | c2d_lowres320x180+upscale | 10000 | 0.69 / 0.72 | 3.60 / 4.74 | 0.63 / 0.67 |
| part_fillRect_2x2_4colour_buckets | c2d_lowres320x180+upscale | 10000 | 2.79 / 2.95 | 8.22 / 9.37 | 143.38 / 144.58 (20f) |
| part_drawImage_3x3_sprite | c2d_lowres320x180+upscale | 10000 | 10.99 / 11.77 | 44.90 / 49.48 (20f) | 158.51 / 183.28 (20f) |
| flash_none_normal_sprites | c2d_lowres320x180+upscale | 100 | 0.74 / 0.78 | 3.69 / 5.07 | 2.33 / 2.46 |
| flash_prebaked_white_sprite | c2d_lowres320x180+upscale | 100 | 0.75 / 0.80 | 3.63 / 4.60 | 2.28 / 2.43 |
| flash_source_atop_per_frame | c2d_lowres320x180+upscale | 100 | 16.02 / 17.52 | 79.61 / 86.91 (20f) | 9.86 / 10.44 |
| flash_ctx_filter_brightness0_invert1 | c2d_lowres320x180+upscale | 100 | 5.39 / 5.70 | 8.61 / 10.23 | 28.52 / 29.32 |
| shake_none | c2d_lowres320x180+upscale |  | 0.84 / 0.91 | 4.00 / 5.20 | 4.00 / 4.22 |
| shake_setTransform | c2d_lowres320x180+upscale |  | 0.86 / 0.93 | 3.94 / 5.42 | 4.18 / 4.46 |
| shake_redraw_with_offset_args | c2d_lowres320x180+upscale |  | 0.86 / 0.91 | 4.00 / 5.42 | 4.16 / 4.46 |
| shake_offset_at_upscale_blit | c2d_lowres320x180+upscale |  | 0.89 / 0.94 | 4.28 / 5.29 | 4.07 / 4.29 |
| shake_css_transform_on_element | c2d_lowres320x180+upscale |  | 0.84 / 0.89 | 3.88 / 5.36 | 4.03 / 4.16 |
| tele_real_alpha | c2d_lowres320x180+upscale | 20 | 0.72 / 0.75 | 3.42 / 4.23 | 2.87 / 3.04 |
| tele_dithered_bayer_pattern | c2d_lowres320x180+upscale | 20 | 0.77 / 0.85 | 3.60 / 4.81 | 3.06 / 3.23 |
| baseline_empty_frame | c2d_native1280x720 |  | 0.24 / 0.27 | 1.70 / 2.66 | 0.28 / 0.28 |
| dmg_glyph_blits | c2d_native1280x720 | 50 | 0.40 / 0.42 | 2.48 / 3.33 | 0.42 / 0.44 |
| dmg_fillText | c2d_native1280x720 | 50 | 0.28 / 0.31 | 1.88 / 2.99 | 0.32 / 0.33 |
| dmg_fillText_strokeText_outline | c2d_native1280x720 | 50 | 0.32 / 0.34 | 2.01 / 3.15 | 0.35 / 0.36 |
| dmg_cached_number_sprites | c2d_native1280x720 | 50 | 0.29 / 0.47 | 2.06 / 3.48 | 0.33 / 0.52 |
| dmg_glyph_blits | c2d_native1280x720 | 50 hits -> 5 agg | 0.27 / 0.29 | 1.57 / 2.61 | 0.29 / 0.30 |
| dmg_fillText | c2d_native1280x720 | 50 hits -> 5 agg | 0.25 / 0.28 | 1.58 / 2.63 | 0.28 / 0.28 |
| dmg_fillText_strokeText_outline | c2d_native1280x720 | 50 hits -> 5 agg | 0.26 / 0.28 | 1.62 / 2.37 | 0.28 / 0.29 |
| dmg_cached_number_sprites | c2d_native1280x720 | 50 hits -> 5 agg | 0.34 / 0.44 | 2.06 / 3.32 | 0.34 / 0.45 |
| dmg_glyph_blits | c2d_native1280x720 | 200 | 0.81 / 0.85 | 5.03 / 6.10 | 0.85 / 0.88 |
| dmg_fillText | c2d_native1280x720 | 200 | 0.40 / 0.42 | 2.54 / 3.29 | 0.42 / 0.44 |
| dmg_fillText_strokeText_outline | c2d_native1280x720 | 200 | 0.54 / 0.57 | 3.35 / 4.23 | 0.57 / 0.58 |
| dmg_cached_number_sprites | c2d_native1280x720 | 200 | 0.43 / 0.61 | 2.97 / 3.90 | 0.47 / 0.63 |
| dmg_glyph_blits | c2d_native1280x720 | 200 hits -> 20 agg | 0.32 / 0.34 | 1.93 / 2.89 | 0.34 / 0.35 |
| dmg_fillText | c2d_native1280x720 | 200 hits -> 20 agg | 0.27 / 0.29 | 1.69 / 2.57 | 0.29 / 0.30 |
| dmg_fillText_strokeText_outline | c2d_native1280x720 | 200 hits -> 20 agg | 0.28 / 0.31 | 1.69 / 2.75 | 0.30 / 0.32 |
| dmg_cached_number_sprites | c2d_native1280x720 | 200 hits -> 20 agg | 0.47 / 0.62 | 3.13 / 4.28 | 0.54 / 0.69 |
| dmg_glyph_blits | c2d_native1280x720 | 1000 | 3.10 / 3.25 | 18.83 / 21.58 | 3.23 / 3.33 |
| dmg_fillText | c2d_native1280x720 | 1000 | 0.99 / 1.02 | 6.20 / 7.20 | 1.05 / 1.08 |
| dmg_fillText_strokeText_outline | c2d_native1280x720 | 1000 | 1.68 / 1.72 | 10.23 / 11.22 | 1.74 / 1.77 |
| dmg_cached_number_sprites | c2d_native1280x720 | 1000 | 1.18 / 1.31 | 7.74 / 10.66 | 1.26 / 1.48 |
| dmg_glyph_blits | c2d_native1280x720 | 1000 hits -> 100 agg | 0.59 / 0.62 | 3.67 / 4.39 | 0.63 / 0.65 |
| dmg_fillText | c2d_native1280x720 | 1000 hits -> 100 agg | 0.33 / 0.36 | 2.15 / 3.04 | 0.36 / 0.38 |
| dmg_fillText_strokeText_outline | c2d_native1280x720 | 1000 hits -> 100 agg | 0.41 / 0.44 | 2.65 / 3.29 | 0.44 / 0.46 |
| dmg_cached_number_sprites | c2d_native1280x720 | 1000 hits -> 100 agg | 0.82 / 1.38 | 5.67 / 8.96 | 0.99 / 1.49 |
| part_sim_only_no_draw | c2d_native1280x720 | 500 | 0.25 / 0.27 | 1.54 / 2.33 | 0.28 / 0.29 |
| part_fillRect_2x2_4colour_buckets | c2d_native1280x720 | 500 | 0.33 / 0.36 | 2.12 / 3.00 | 0.36 / 0.37 |
| part_drawImage_3x3_sprite | c2d_native1280x720 | 500 | 0.67 / 0.69 | 4.36 / 5.19 | 0.70 / 0.72 |
| part_sim_only_no_draw | c2d_native1280x720 | 2000 | 0.26 / 0.28 | 1.60 / 2.58 | 0.28 / 0.29 |
| part_fillRect_2x2_4colour_buckets | c2d_native1280x720 | 2000 | 0.57 / 0.59 | 3.67 / 4.50 | 0.60 / 0.61 |
| part_drawImage_3x3_sprite | c2d_native1280x720 | 2000 | 1.96 / 2.02 | 12.02 / 13.40 | 2.05 / 2.10 |
| part_sim_only_no_draw | c2d_native1280x720 | 10000 | 0.29 / 0.32 | 1.77 / 2.75 | 0.32 / 0.34 |
| part_fillRect_2x2_4colour_buckets | c2d_native1280x720 | 10000 | 1.82 / 1.88 | 11.91 / 13.41 | 1.90 / 1.93 |
| part_drawImage_3x3_sprite | c2d_native1280x720 | 10000 | 8.79 / 9.13 | 53.22 / 59.94 (20f) | 9.15 / 9.59 |
| flash_none_normal_sprites | c2d_native1280x720 | 100 | 0.67 / 0.69 | 4.12 / 4.91 | 0.71 / 0.73 |
| flash_prebaked_white_sprite | c2d_native1280x720 | 100 | 0.67 / 0.69 | 4.20 / 4.88 | 0.71 / 0.73 |
| flash_source_atop_per_frame | c2d_native1280x720 | 100 | 2.31 / 2.37 | 14.23 / 15.21 | 2.44 / 2.50 |
| flash_ctx_filter_brightness0_invert1 | c2d_native1280x720 | 100 | 442.36 / 445.56 (20f) | 2739.72 / 2803.48 (20f) | 471.70 / 478.63 (20f) |
| shake_none | c2d_native1280x720 |  | 0.97 / 1.01 | 5.96 / 6.66 | 1.02 / 1.05 |
| shake_setTransform | c2d_native1280x720 |  | 0.98 / 1.01 | 6.04 / 6.92 | 1.03 / 1.11 |
| shake_redraw_with_offset_args | c2d_native1280x720 |  | 0.98 / 1.01 | 5.88 / 6.88 | 1.02 / 1.05 |
| shake_offset_at_upscale_blit | c2d_native1280x720 |  | 1.04 / 1.16 | 6.18 / 7.17 | 1.08 / 1.10 |
| shake_css_transform_on_element | c2d_native1280x720 |  | 0.98 / 1.01 | 5.94 / 6.82 | 1.03 / 1.08 |
| tele_real_alpha | c2d_native1280x720 | 20 | 0.73 / 0.76 | 4.45 / 5.39 | 0.76 / 0.78 |
| tele_dithered_bayer_pattern | c2d_native1280x720 | 20 | 1.06 / 1.11 | 6.67 / 8.24 | 1.10 / 1.16 |
| gl_baseline_clear_readback | webgl2_320x180 |  | 0.22 / 0.52 | 0.88 / 1.58 | 0.05 / 0.06 |
| gl_dmg_instanced_digit_quads_rebuild_each_frame | webgl2_320x180 | 50 | 0.21 / 0.23 | 0.94 / 1.58 | 2.08 / 2.25 |
| gl_dmg_instanced_digit_quads_rebuild_each_frame | webgl2_320x180 | 50 hits -> 5 agg | 0.21 / 0.24 | 0.81 / 1.53 | 0.37 / 0.42 |
| gl_dmg_instanced_digit_quads_rebuild_each_frame | webgl2_320x180 | 200 | 0.21 / 0.24 | 0.69 / 1.56 | 7.70 / 8.07 |
| gl_dmg_instanced_digit_quads_rebuild_each_frame | webgl2_320x180 | 200 hits -> 20 agg | 0.21 / 0.23 | 0.68 / 1.49 | 1.05 / 1.16 |
| gl_dmg_instanced_digit_quads_rebuild_each_frame | webgl2_320x180 | 1000 | 0.25 / 0.28 | 1.07 / 1.82 | 37.73 / 38.47 |
| gl_dmg_instanced_digit_quads_rebuild_each_frame | webgl2_320x180 | 1000 hits -> 100 agg | 0.21 / 0.24 | 0.84 / 1.57 | 4.72 / 4.99 |
| gl_flash_none_instanced | webgl2_320x180 | 100 | 0.20 / 0.23 | 0.82 / 1.56 | 1.54 / 1.69 |
| gl_flash_instance_attribute_1_drawcall | webgl2_320x180 | 100 | 0.21 / 0.23 | 0.72 / 1.49 | 1.55 / 1.70 |
| gl_flash_uniform_per_sprite_100_drawcalls | webgl2_320x180 | 100 | 0.28 / 0.29 | 0.88 / 1.77 | 1.62 / 1.76 |
| gl_part_points_cpu_sim_buffer_upload | webgl2_320x180 | 500 | 0.21 / 0.23 | 0.79 / 1.54 | 0.21 / 0.24 |
| gl_part_points_gpu_sim_static_buffer | webgl2_320x180 | 500 | 0.21 / 0.23 | 0.74 / 1.55 | 0.20 / 0.23 |
| gl_part_points_cpu_sim_buffer_upload | webgl2_320x180 | 2000 | 0.22 / 0.24 | 0.93 / 2.04 | 0.31 / 0.34 |
| gl_part_points_gpu_sim_static_buffer | webgl2_320x180 | 2000 | 0.21 / 0.23 | 0.78 / 1.53 | 0.30 / 0.34 |
| gl_part_points_cpu_sim_buffer_upload | webgl2_320x180 | 10000 | 0.29 / 0.41 | 1.23 / 1.82 | 0.96 / 1.04 |
| gl_part_points_gpu_sim_static_buffer | webgl2_320x180 | 10000 | 0.23 / 0.33 | 1.17 / 1.83 | 0.90 / 1.00 |
| gl_tele_real_alpha_blend | webgl2_320x180 | 20 | 0.26 / 0.29 | 0.81 / 1.54 | 0.43 / 0.49 |
| gl_tele_dither_discard | webgl2_320x180 | 20 | 0.26 / 0.30 | 0.86 / 1.60 | 0.42 / 0.50 |
| gl_baseline_clear_readback | webgl2_native1280x720 |  | 0.26 / 0.28 | 0.92 / 1.69 | 0.05 / 0.06 |
| gl_dmg_instanced_digit_quads_rebuild_each_frame | webgl2_native1280x720 | 50 | 0.28 / 0.30 | 0.84 / 1.74 | 2.29 / 2.46 |
| gl_dmg_instanced_digit_quads_rebuild_each_frame | webgl2_native1280x720 | 50 hits -> 5 agg | 0.27 / 0.29 | 0.94 / 1.67 | 0.59 / 0.66 |
| gl_dmg_instanced_digit_quads_rebuild_each_frame | webgl2_native1280x720 | 200 | 0.30 / 0.33 | 0.85 / 1.72 | 7.88 / 8.29 |
| gl_dmg_instanced_digit_quads_rebuild_each_frame | webgl2_native1280x720 | 200 hits -> 20 agg | 0.28 / 0.29 | 0.81 / 1.68 | 1.28 / 1.41 |
| gl_dmg_instanced_digit_quads_rebuild_each_frame | webgl2_native1280x720 | 1000 | 0.35 / 0.46 | 1.30 / 1.82 | 37.82 / 39.35 |
| gl_dmg_instanced_digit_quads_rebuild_each_frame | webgl2_native1280x720 | 1000 hits -> 100 agg | 0.23 / 0.25 | 0.93 / 1.77 | 4.93 / 5.27 |
| gl_flash_none_instanced | webgl2_native1280x720 | 100 | 0.22 / 0.24 | 1.07 / 1.81 | 1.72 / 1.82 |
| gl_flash_instance_attribute_1_drawcall | webgl2_native1280x720 | 100 | 0.22 / 0.23 | 1.07 / 1.78 | 1.73 / 1.81 |
| gl_flash_uniform_per_sprite_100_drawcalls | webgl2_native1280x720 | 100 | 0.28 / 0.30 | 1.18 / 1.78 | 1.77 / 1.85 |
| gl_part_points_cpu_sim_buffer_upload | webgl2_native1280x720 | 500 | 0.23 / 0.24 | 0.94 / 1.70 | 0.44 / 0.47 |
| gl_part_points_gpu_sim_static_buffer | webgl2_native1280x720 | 500 | 0.22 / 0.24 | 0.88 / 1.74 | 0.44 / 0.47 |
| gl_part_points_cpu_sim_buffer_upload | webgl2_native1280x720 | 2000 | 0.23 / 0.25 | 1.01 / 1.77 | 0.57 / 0.61 |
| gl_part_points_gpu_sim_static_buffer | webgl2_native1280x720 | 2000 | 0.22 / 0.24 | 1.02 / 1.80 | 0.56 / 0.60 |
| gl_part_points_cpu_sim_buffer_upload | webgl2_native1280x720 | 10000 | 0.30 / 0.33 | 1.24 / 1.76 | 1.24 / 1.30 |
| gl_part_points_gpu_sim_static_buffer | webgl2_native1280x720 | 10000 | 0.23 / 0.25 | 1.07 / 1.83 | 1.18 / 1.25 |
| gl_tele_real_alpha_blend | webgl2_native1280x720 | 20 | 0.24 / 0.28 | 1.06 / 1.75 | 2.29 / 2.69 |
| gl_tele_dither_discard | webgl2_native1280x720 | 20 | 0.28 / 0.32 | 1.07 / 1.81 | 2.16 / 2.54 |

## Damage number cache stats (metal, lowres)

| hits alive | aggregated | entries | hit rate | builds | build ms total | cache KB |
|---|---|---|---|---|---|---|
| 50 | False | 126 | 0.989 | 126 | 11.58 | 39 |
| 50 | True | 185 | 0.839 | 185 | 15.01 | 69 |
| 200 | False | 191 | 0.996 | 191 | 18.23 | 61 |
| 200 | True | 590 | 0.872 | 590 | 49.68 | 222 |
| 1000 | False | 225 | 0.999 | 225 | 20.98 | 73 |
| 1000 | True | 1024 | 0.93 | 1603 | 141.23 | 391 |

## rAF shake test (120 frames, lowres scene)

| mode | metal work med/p95, rAF p95, frames>20ms | metal-throttle6 work med/p95, rAF p95, frames>20ms | swiftshader work med/p95, rAF p95, frames>20ms |
|---|---|---|---|
| none | 0.66/1.28, 16.7, 1 | 0.65/1.74, 16.7, 2 | 0.65/1.30, 16.7, 1 |
| setTransform | 0.43/1.02, 16.7, 0 | 0.65/1.51, 16.7, 0 | 0.50/1.32, 16.7, 0 |
| css | 0.53/1.14, 16.7, 0 | 0.80/1.53, 16.7, 0 | 0.68/1.33, 16.7, 0 |

## Audio

- metal audioInfo: `{"state": "running", "sampleRate": 48000, "baseLatency_ms": 5.333333333333333, "outputLatency_ms": 0, "has_playbackStats": true, "has_playoutStats": false, "render_quantum_ms": 2.6666666666666665, "state_end": "running"}`
- metal-throttle6 audioInfo: `{"state": "running", "sampleRate": 48000, "baseLatency_ms": 5.333333333333333, "outputLatency_ms": 0, "has_playbackStats": true, "has_playoutStats": false, "render_quantum_ms": 2.6666666666666665, "state_end": "running"}`
- swiftshader audioInfo: `{"state": "running", "sampleRate": 48000, "baseLatency_ms": 5.333333333333333, "outputLatency_ms": 0, "has_playbackStats": true, "has_playoutStats": false, "render_quantum_ms": 2.6666666666666665, "state_end": "running"}`

| test | hits/s | metal | metal-throttle6 | swiftshader |
|---|---|---|---|---|
| audio_offline_osc_gain | 8 | 4.38 ms/audio-s (0.44% core), sched 0.0767 ms/trig | 2.81 ms/audio-s (0.28% core), sched 0.1469 ms/trig | 4.5 ms/audio-s (0.45% core), sched 0.1028 ms/trig |
| audio_offline_osc_gain | 32 | 11.51 ms/audio-s (1.15% core), sched 0.0172 ms/trig | 9.06 ms/audio-s (0.91% core), sched 0.065 ms/trig | 11.6 ms/audio-s (1.16% core), sched 0.0181 ms/trig |
| audio_offline_osc_gain | 128 | 35.68 ms/audio-s (3.57% core), sched 0.0081 ms/trig | 36.45 ms/audio-s (3.64% core), sched 0.0442 ms/trig | 37.17 ms/audio-s (3.72% core), sched 0.008 ms/trig |
| audio_offline_osc_gain | 512 | 145.66 ms/audio-s (14.57% core), sched 0.0061 ms/trig | 150.9 ms/audio-s (15.09% core), sched 0.0383 ms/trig | 154.81 ms/audio-s (15.48% core), sched 0.0065 ms/trig |
| audio_offline_buffer_gain | 8 | 1.99 ms/audio-s (0.2% core), sched 0.0088 ms/trig | 2.23 ms/audio-s (0.22% core), sched 0.0636 ms/trig | 2.12 ms/audio-s (0.21% core), sched 0.0092 ms/trig |
| audio_offline_buffer_gain | 32 | 8.58 ms/audio-s (0.86% core), sched 0.0065 ms/trig | 8.99 ms/audio-s (0.9% core), sched 0.0377 ms/trig | 8.93 ms/audio-s (0.89% core), sched 0.0073 ms/trig |
| audio_offline_buffer_gain | 128 | 35.89 ms/audio-s (3.59% core), sched 0.0063 ms/trig | 36.74 ms/audio-s (3.67% core), sched 0.0361 ms/trig | 37.44 ms/audio-s (3.74% core), sched 0.007 ms/trig |
| audio_offline_buffer_gain | 512 | 147.73 ms/audio-s (14.77% core), sched 0.0058 ms/trig | 151.57 ms/audio-s (15.16% core), sched 0.0341 ms/trig | 154.19 ms/audio-s (15.42% core), sched 0.006 ms/trig |
| audio_realtime_osc_gain | 8 | trig 0.155/0.66 ms, clock 0.9839, underruns 0, avgLat 27.1 ms | trig 0.025/3.34 ms, clock 0.9866, underruns 0, avgLat 27.2 ms | trig 0.16/0.66 ms, clock 0.983, underruns 0, avgLat 27.1 ms |
| audio_realtime_osc_gain | 32 | trig 0.095/0.17 ms, clock 1.0007, underruns 0, avgLat 27.2 ms | trig 0.015/0.05 ms, clock 1.0008, underruns 0, avgLat 27.3 ms | trig 0.11/0.145 ms, clock 1.0007, underruns 0, avgLat 27.2 ms |
| audio_realtime_osc_gain | 128 | trig 0.065/0.115 ms, clock 0.9987, underruns 0, avgLat 27.3 ms | trig 0.01/0.035 ms, clock 0.9991, underruns 0, avgLat 27.3 ms | trig 0.065/0.11 ms, clock 0.9986, underruns 0, avgLat 27.3 ms |
| audio_realtime_osc_gain | 512 | trig 0.035/0.075 ms, clock 0.9989, underruns 0, avgLat 27.3 ms | trig 0.005/0.015 ms, clock 1.0007, underruns 0, avgLat 27.3 ms | trig 0.02/0.06 ms, clock 0.9999, underruns 0, avgLat 27.3 ms |
| audio_realtime_buffer_gain | 8 | trig 0.16/0.265 ms, clock 1.0002, underruns 0, avgLat 27.3 ms | trig 0.02/0.225 ms, clock 0.9996, underruns 0, avgLat 27.3 ms | trig 0.165/0.23 ms, clock 0.9996, underruns 0, avgLat 27.3 ms |
| audio_realtime_buffer_gain | 32 | trig 0.12/0.185 ms, clock 0.9993, underruns 0, avgLat 27.3 ms | trig 0.01/0.045 ms, clock 1.0006, underruns 0, avgLat 27.3 ms | trig 0.115/0.17 ms, clock 1.0019, underruns 0, avgLat 27.3 ms |
| audio_realtime_buffer_gain | 128 | trig 0.07/0.115 ms, clock 0.999, underruns 0, avgLat 27.3 ms | trig 0.01/0.025 ms, clock 0.9993, underruns 0, avgLat 27.3 ms | trig 0.07/0.105 ms, clock 1.0012, underruns 0, avgLat 27.3 ms |
| audio_realtime_buffer_gain | 512 | trig 0.035/0.075 ms, clock 0.9985, underruns 0, avgLat 27.3 ms | trig 0.005/0.015 ms, clock 0.9999, underruns 0, avgLat 27.3 ms | trig 0.025/0.075 ms, clock 0.9995, underruns 0, avgLat 27.3 ms |
