# Food demo assets

## Additional CC0 presets — Kenney Food Kit

- Official source: https://kenney.nl/assets/food-kit (version 2.0); downloaded from the download link on that page.
- Archive download: https://kenney.nl/media/pages/assets/food-kit/83086fa91c-1719418518/kenney_food-kit.zip
- License: CC0; the archive's `License.txt` explicitly allows commercial use. Its copy is `public/models/kenney-LICENSE.txt`.
- Selected GLBs: `public/models/burger.glb` from `burger-cheese.glb`, `public/models/pizza.glb` from `pizza.glb`, `public/models/cake.glb` from `cake.glb`.
- Matching model thumbnails: `public/media/burger-3d.png`, `public/media/pizza-3d.png`, `public/media/cake-3d.png` from the archive's `Previews` folder.
- The models are deliberately stylized and have no relation to the stock photographs or a restaurant's real plates. Each detail view marks the model as demonstrative. Kenney geometries use approximately 36 cm width for the burger, 42 cm for pizza, and 32 cm for the cake; these are generic dimensions.

Retrieved and checked on 2026-09-18. This folder contains one genuine 3D food asset and three photographic menu assets. The avocado is a textured mesh; the photos are not 3D assets and should not be presented as scans.

## Avocado — Microsoft / Khronos sample assets

- Model: `public/models/avocado.glb` — a smaller derivative of the 8,110,040 byte source. Its three textures were resized from 2048 to 1024 pixels and converted to JPEG quality 88 using glTF Transform. The scene was rotated to lie on the table and uniformly enlarged 2×. It is self-contained GLB with no external buffers or images.
- Matching source poster: `avocado-poster.jpg` — 130 × 130 pixels. Suitable as a loading placeholder; capture a larger poster from the live renderer for large artwork.
- Model source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Avocado
- Direct GLB source: https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Avocado/glTF-Binary/Avocado.glb
- Direct poster source: https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Avocado/screenshot/screenshot.jpg
- License evidence: https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/Avocado/LICENSE.md — explicitly covers all model text, image and binary files under CC0-1.0. Local copies: `avocado-LICENSE.md` and `avocado-readme.md`.
- License: https://creativecommons.org/publicdomain/zero/1.0/legalcode — CC0 permits commercial reuse. Attribution is not required for the asset; suggested credit: **Avocado by Microsoft, via Khronos glTF Sample Assets (CC0 1.0).**
- The source README describes a hand-painted texture. Do not call this a photogrammetry model or a scanned restaurant dish.
- Shape: one half avocado with pit. 406 vertices, 682 triangles. Includes base color, roughness/metallic and normal maps. The optimized copy is approximately 236 KB and has a scene transform to lie flat with approximate 2× size.
- Original bounds at scale 1: X 0.04256182 m, Y 0.06289579855 m, Z 0.0276180011 m (approximately 4.26 × 6.29 × 2.76 cm). A uniform scale of 2 gives approximately 8.51 × 12.58 × 5.52 cm. That is a demo adjustment, not a physically measured portion. Geometry currently stands with its long axis along Y; adjust its placement/orientation appropriately for an AR table surface.
- The original source SHA256 was `ccc9c3ce56423720b09399c2351537207cd5a65f859f9e6e2f30922762f3abd4`; the bundled optimized derivative has a different hash.
- Metadata notice: the source README/LICENSE metadata files are CC-BY-4.0; credit KhronosGroup/glTF-Sample-Assets if redistributing these copied metadata files. Model/image/binary content itself is CC0.

## Photographic menu assets — Unsplash

The images below were downloaded from the public Unsplash image CDN and visually checked. The current Unsplash license states that free images can be downloaded and used for commercial and noncommercial purposes without permission or required attribution. License evidence: https://unsplash.com/license . Do not sell unmodified photographs or compile a competing photo service. Photographer identities were not independently established in this short research pass; no author name is asserted.

| Local file | Description | Size | Exact source |
|---|---|---|---|
| `burger.jpg` | Beef cheeseburger with lettuce, tomato, onion, pickles, and sauce on dark background | 1200 × 997 | https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=85&fit=crop |
| `pizza.jpg` | Margherita-style pizza in front of a wood-fired oven | 1200 × 801 | https://images.unsplash.com/photo-1579751626657-72bc17010498?w=1200&q=85&fit=crop |
| `dessert.jpg` | Whole chocolate cake with piped frosting | 1200 × 882 | https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&q=85&fit=crop |
| `avocado.jpg` | Half avocado on pink background | 1000 × 749 | https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=1000&q=85&fit=crop |

The photos are illustrative demonstration content, not evidence of the restaurant's actual dishes, portion sizes, ingredients, or allergens. Use actual restaurant content before commercial publication.

## Additional candidate, not downloaded

Khronos MandarinOrange is genuine photogrammetry from zamdreamer, with PBR material work by Eric Chadwick / Wayfair. It is CC-BY-4.0 and permits commercial reuse with attribution. It is shipped as glTF, and uses KHR_materials_diffuse_transmission; compatibility and repackaging would need to be checked before use. Source and license evidence: https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/MandarinOrange/README.md . Not used in this folder's working GLB.
