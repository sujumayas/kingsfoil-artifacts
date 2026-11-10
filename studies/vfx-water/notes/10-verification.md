# Lead verification of newest claims (2026-11-10)

- Godot 4.7 DrawableTexture2D: confirmed. Class reference https://docs.godotengine.org/en/4.7/classes/class_drawabletexture2d.html and tutorial https://docs.godotengine.org/en/4.7/tutorials/rendering/drawable_textures.html. A Texture2D changed with blit calls on the GPU (blit_rect, blit_rect_multi), formats RGBA8, RGBA8 sRGB, RGBAH, RGBAF. Several methods are marked experimental. The docs found do not state Compatibility/web support: keep that [U].
- "Pixel Water - Godot Shader" by fcidade: confirmed on the Godot Asset Store https://store.godotengine.org/asset/fcidade/pixel-water-godot-shader/ . v1.0.0 changelog dated 2026-10-07, CC0, lists GL Compatibility, Mobile and Forward+, CanvasItem shader.
- godotshaders.com "Pixel Water for Godot 4.3" https://godotshaders.com/shader/pixel-water/ : CC0, noise water plus pixel highlights. No explicit Compatibility claim on the page.
- TileMapDual https://github.com/pablogila/TileMapDual : MIT, v5 rewritten from scratch, Asset Library 5.0.2 for Godot 4.4 (May 2, 2026). Star count disagrees between sources: note 07 read 1,310 from the GitHub API on 2026-11-10; a third-party tracker shows about 303 (likely stale). Use the GitHub API figure and say where it came from.
- Kyle Dunbar, "Implementing auto tiling with just 5 tiles" (Feb 2026): https://www.kyledunbar.dev/2026/02/05/Implementing-auto-tiling-with-just-5-tiles.html , a newer rotation-based dual-grid variant (newest-year source).

# Conflicts the writer must resolve or label
- Tibia drowning: TFS code note (08) says 20 damage every 2 s while on the tile; note 01 cites a fan Q&A for 5 x 20. Prefer TFS, label it as emulator code, not CipSoft.
- Tibia water animation: OTClient 500 ms per frame (01) vs forum "16 steps of 8 sprites" (03). Label the loop length as inferred.
- Mei 2007 virtual pipes pseudocode in 04 is from memory: tag [U] unless re-derived from another cited source.
