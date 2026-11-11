| test | target | n | default mean/p95 | metal-throttle6 mean/p95 | metal mean/p95 | swiftshader mean/p95 |
|---|---|---|---|---|---|---|
| baseline_empty_frame | lowres3 |  | 0.45 / 0.5 | 1.01 / 1.8 | 0.35 / 0.6 | 3.66 / 3.9 |
| a_bitmap_glyph_blits | lowres3 | 100 | 0.53 / 0.6 | 1.19 / 1.8 | 0.34 / 0.4 | 5.43 / 5.7 |
| b_fillText_monospace | lowres3 | 100 | 0.46 / 0.5 | 1.14 / 1.8 | 0.28 / 0.4 | 4.95 / 5.2 |
| a_bitmap_glyph_blits | lowres3 | 500 | 0.85 / 0.9 | 2.60 / 3.4 | 0.76 / 0.9 | 11.73 / 12.2 |
| b_fillText_monospace | lowres3 | 500 | 0.48 / 0.6 | 1.14 / 1.8 | 0.32 / 0.4 | 9.82 / 10.3 |
| a_bitmap_glyph_blits | lowres3 | 2000 | 2.12 / 2.2 | 9.12 / 10.8 | 2.39 / 2.7 | 35.17 / 35.9 |
| b_fillText_monospace | lowres3 | 2000 | 0.59 / 0.7 | 1.30 / 1.9 | 0.38 / 0.5 | 27.51 / 28.4 |
| d_typewriter_static | lowres3 | 192 | 0.55 / 0.7 | 1.24 / 1.8 | 0.38 / 0.5 | 5.70 / 7.2 |
| d_typewriter_wave | lowres3 | 192 | 0.55 / 0.7 | 1.19 / 1.8 | 0.39 / 0.5 | 5.70 / 7.2 |
| e_bubbles_redraw | lowres3 | 1 bub, 14 gl | 0.47 / 0.6 | 1.11 / 1.8 | 0.30 / 0.4 | 4.20 / 4.5 |
| c_bubbles_cached_blit | lowres3 | 1 bub, 14 gl | 0.45 / 0.5 | 1.12 / 1.8 | 0.28 / 0.4 | 3.80 / 4.1 |
| e_bubbles_redraw | lowres3 | 10 bub, 392 gl | 0.85 / 0.9 | 2.31 / 3.3 | 0.76 / 0.9 | 11.42 / 11.9 |
| c_bubbles_cached_blit | lowres3 | 10 bub, 392 gl | 0.47 / 0.6 | 1.14 / 1.8 | 0.32 / 0.4 | 4.38 / 4.6 |
| e_bubbles_redraw | lowres3 | 50 bub, 1891 gl | 2.43 / 2.5 | 10.51 / 11.8 | 2.95 / 3.3 | 40.08 / 41.0 |
| c_bubbles_cached_blit | lowres3 | 50 bub, 1891 gl | 0.52 / 0.6 | 1.13 / 1.7 | 0.47 / 0.6 | 6.29 / 6.6 |
| e_bubbles_redraw | lowres3 | 200 bub, 7866 gl | 8.59 / 8.8 | 44.98 / 47.1 | 10.95 / 11.6 | 152.84 / 154.8 |
| c_bubbles_cached_blit | lowres3 | 200 bub, 7866 gl | 0.72 / 0.8 | 1.78 / 2.8 | 1.07 / 1.2 | 12.04 / 12.5 |
| baseline_empty_frame | native1 |  | 0.27 / 0.4 | 1.12 / 1.8 | 0.26 / 0.4 | 5.53 / 5.7 |
| a_bitmap_glyph_blits | native1 | 100 | 0.39 / 0.5 | 1.23 / 1.9 | 0.33 / 0.4 | 7.50 / 7.9 |
| b_fillText_monospace | native1 | 100 | 0.29 / 0.4 | 1.11 / 1.8 | 0.27 / 0.4 | 7.13 / 7.5 |
| a_bitmap_glyph_blits | native1 | 500 | 0.86 / 0.9 | 2.45 / 3.2 | 0.80 / 0.9 | 13.44 / 13.9 |
| b_fillText_monospace | native1 | 500 | 0.33 / 0.4 | 1.16 / 1.8 | 0.30 / 0.4 | 11.78 / 12.2 |
| a_bitmap_glyph_blits | native1 | 2000 | 2.67 / 2.8 | 8.41 / 9.8 | 2.51 / 2.8 | 36.41 / 37.4 |
| b_fillText_monospace | native1 | 2000 | 0.50 / 0.6 | 1.21 / 1.8 | 0.38 / 0.6 | 29.65 / 30.5 |
| d_typewriter_static | native1 | 192 | 0.54 / 0.7 | 1.19 / 1.8 | 0.42 / 0.6 | 7.98 / 9.5 |
| d_typewriter_wave | native1 | 192 | 0.54 / 0.7 | 1.27 / 1.9 | 0.43 / 0.6 | 7.95 / 9.4 |
| e_bubbles_redraw | native1 | 1 bub, 14 gl | 0.31 / 0.4 | 1.14 / 1.8 | 0.33 / 0.4 | 6.46 / 6.8 |
| c_bubbles_cached_blit | native1 | 1 bub, 14 gl | 0.28 / 0.4 | 1.07 / 1.7 | 0.30 / 0.4 | 6.09 / 6.3 |
| e_bubbles_redraw | native1 | 10 bub, 392 gl | 1.04 / 1.1 | 2.52 / 3.4 | 0.82 / 0.9 | 12.87 / 13.3 |
| c_bubbles_cached_blit | native1 | 10 bub, 392 gl | 0.39 / 0.5 | 1.15 / 1.8 | 0.31 / 0.4 | 7.14 / 7.5 |
| e_bubbles_redraw | native1 | 50 bub, 1891 gl | 4.06 / 4.2 | 10.54 / 12.0 | 3.13 / 3.4 | 39.27 / 40.2 |
| c_bubbles_cached_blit | native1 | 50 bub, 1891 gl | 0.85 / 0.9 | 1.20 / 1.8 | 0.48 / 0.7 | 11.21 / 11.7 |
| e_bubbles_redraw | native1 | 200 bub, 7866 gl | 15.85 / 16.3 | 45.46 / 48.0 | 11.61 / 12.4 | 144.57 / 147.0 |
| c_bubbles_cached_blit | native1 | 200 bub, 7866 gl | 2.63 / 2.7 | 2.51 / 4.0 | 1.16 / 1.6 | 30.43 / 31.1 |
| f_webgl2_baseline_clear_readback | webgl2_ |  | 0.05 / 0.1 | 0.80 / 1.5 | 0.20 / 0.3 | 0.05 / 0.1 |
| f_webgl2_instanced_static_buffer | webgl2_ | 500 | 7.47 / 7.8 | 0.82 / 1.5 | 0.22 / 0.3 | 7.47 / 7.8 |
| f_webgl2_instanced_rebuild_buffer_each_frame | webgl2_ | 500 | 7.42 / 7.8 | 0.82 / 1.6 | 0.21 / 0.3 | 7.45 / 7.8 |
| f_webgl2_instanced_gpu_wave | webgl2_ | 500 | 7.42 / 7.7 | 0.80 / 1.6 | 0.21 / 0.3 | 7.45 / 7.8 |
| f_webgl2_instanced_static_buffer | webgl2_ | 2000 | 29.12 / 30.1 | 0.84 / 1.6 | 0.23 / 0.3 | 29.14 / 30.0 |
| f_webgl2_instanced_rebuild_buffer_each_frame | webgl2_ | 2000 | 29.34 / 30.1 | 1.02 / 1.7 | 0.23 / 0.3 | 29.15 / 29.8 |
| f_webgl2_instanced_gpu_wave | webgl2_ | 2000 | 29.29 / 30.0 | 0.79 / 1.5 | 0.25 / 0.4 | 29.24 / 30.0 |
| f_webgl2_instanced_static_buffer | webgl2_ | 10000 | 145.56 / 147.7 | 1.11 / 1.8 | 0.41 / 0.5 | 145.51 / 147.6 |
| f_webgl2_instanced_rebuild_buffer_each_frame | webgl2_ | 10000 | 145.68 / 147.6 | 1.15 / 1.8 | 0.30 / 0.4 | 145.44 / 147.4 |
| f_webgl2_instanced_gpu_wave | webgl2_ | 10000 | 145.48 / 147.5 | 1.15 / 1.8 | 0.25 / 0.3 | 145.49 / 147.5 |
