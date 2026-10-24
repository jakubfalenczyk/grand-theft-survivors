# Phaser art pipeline

Reviewed 2026-10-24 against the game running on Phaser 3.90.

## How the game renders

| Responsibility                                                  | Implementation                                                           | When it runs                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Seeded city data, dimensions and footprints                     | `src/game/features/world/generateCity.ts`, `config.ts`, shared contracts | On scene creation; no rendering dependencies                  |
| Roads, crossings, parks, street text and decorative parked cars | `createGroundTexture.ts`                                                 | Painted once into a 2520 × 2520 CanvasTexture                 |
| Individual roofs and rooftop equipment                          | `createRoofTexture.ts`                                                   | Painted once per building; keys include seed and building ID  |
| Tree silhouette and leaves                                      | `createPropTextures.ts`                                                  | One shared CanvasTexture, reused by tree Images               |
| Character animation frames                                      | `features/player/createPlayerTextures.ts`                                | One 72 × 24 texture, split into three 24 × 24 frames          |
| Roof placement and projected facades/windows                    | `BuildingRenderer.ts`                                                    | Each update for visible buildings; depends on camera position |
| World object composition                                        | `WorldRenderer.ts`                                                       | Owns Phaser objects without mutating the layout               |
| Minimap/full map                                                | `features/map/drawMap.ts`                                                | Canvas 2D UI projection from snapshots                        |

These `.ts` files define the drawing operations. The generator produces geometry data, the drawing functions create textures and the renderer displays them. We do not yet have external sprite packs, SVG building definitions, a tileset or a visual map editor. Cars painted into the ground are scenery, so making them destructible later requires independent entities.

`createCanvasTexture` creates a Phaser CanvasTexture. After painting, `refresh()` uploads the modified texture for WebGL. Images and Sprites reference textures from the global manager. With `Phaser.AUTO`, Phaser chooses WebGL when available and otherwise Canvas. Consequently, drawing a source bitmap using Canvas does not mean replaying those drawing instructions every frame. [Phaser textures](https://docs.phaser.io/phaser/concepts/textures).

The exception is our facade Graphics: their projected points change with the camera, so they remain dynamic geometry. Phaser documents that complex Graphics rendering is comparatively expensive and recommends baking shapes that stay static. A single flat building image would lose our changing roof/wall perspective. [Phaser Graphics](https://docs.phaser.io/phaser/concepts/gameobjects/graphics).

## External assets in production

Externally authored sprites and atlases are a normal Phaser workflow. The TexturePacker vendor documents its Phaser 3 export and animation pipeline; using atlases can reduce texture switching, though frame rate gains depend on actual draw order and rendering workload. [TexturePacker Phaser 3 workflow](https://www.codeandweb.com/texturepacker/tutorials/how-to-create-sprite-sheets-for-phaser3).

| Authoring source                  | Runtime export                                           | Phaser consumption                                                               |
| --------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Raster editor or rendered artwork | PNG with alpha; browser-supported WebP where appropriate | `load.image`, then Image for static art                                          |
| Animation editor                  | Uniform PNG sheet + frame size                           | `load.spritesheet`, then Sprite and animation frames                             |
| Multiple separate sprite frames   | Packed PNG + Phaser-compatible JSON atlas                | `load.atlas` or `load.multiatlas`; named frames                                  |
| Vector editor                     | SVG or raster export                                     | `load.svg` rasterizes SVG; it is not kept as a live vector scene                 |
| Tiled map editor                  | JSON map + tileset images                                | `load.tilemapTiledJSON`, tile layers plus separately interpreted object metadata |

Original editable sources belong in an art source directory if we adopt this pipeline; they are not all browser assets. PNG/JSON is the conservative interchange choice for alpha sprites and atlases. Pre-rendered 3D art can also become 2D frames without adding a 3D engine. Phaser documents the loader formats and shared cache lifecycle. [Loader](https://docs.phaser.io/phaser/concepts/loader), [Tiled JSON export](https://doc.mapeditor.org/en/stable/manual/export-generic/).

Once loaded, Phaser renders a textured Image/Sprite with position, rotation, scale and a selected frame. A Sprite supports animation; an Image is suitable for static textures. Collision bodies are separate from the visible pixels and still require explicit configuration. [Phaser Sprite](https://docs.phaser.io/phaser/concepts/gameobjects/sprite).

## Recommendation for this game

Use a hybrid pipeline. Retain procedural road layout, simple surfaces, projection and collision data. Keep code-generated placeholder art while proving combat. When visual content grows, author character/enemy animations, vehicles, weapon silhouettes, portraits and recognizable props externally and export atlases. Visual editing would help control their silhouettes and animation frames. Try a small character/car/prop sample before committing the entire game to a style.

Keep the projected walls unless measurements justify replacing them. An atlas of roof details and repeated facade modules is a possible later optimization; a flat full-building sprite cannot reproduce our current camera-dependent projection. Measure facade CPU time and texture switches before deciding how to optimize them.

The current ground texture exceeds 2048 px on a side and uses roughly 24.2 MiB for one uncompressed RGBA copy alone. This is acceptable for the current desktop version but should not become the multi-map design. Query device texture limits and use bounded ground chunks or tiles for larger/mobile maps. Many unique roof textures also deserve measurement before content expands. PNG compression reduces download size, not uncompressed GPU memory.

Before importing external graphics, define: pixel/world scale, anchors, frame names, animation timing, atlas padding/extrusion, filtering and maximum atlas dimensions; collision footprints separate from artwork; stable asset IDs and loading-error behavior; licenses and editable source ownership. Current `pixelArt: true` and disabled antialiasing favor crisp small rasters; a smoother illustration direction would need an explicit rendering decision.

The project still uses code-generated graphics. The latest material colors are documented in `THEMING.md`.
