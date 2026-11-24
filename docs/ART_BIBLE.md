# Art bible

Status: **style approved by the owner on 2026-11-24** from the phase 0 samples: picture-book style with clear outlines, vehicles without faces, colouring pages with clear lines like the fire engine sample, landscape format. The approved samples are in `docs/art-samples/`; use them as style references.

One look for the whole app, made for a four-year-old who loves dinosaurs, vehicles and building bricks. How pictures are produced, checked and exported is in [IMAGE_PIPELINE.md](IMAGE_PIPELINE.md).

## Rules for every picture

- **Landscape 3:2.** The tablet is used in landscape most of the time; portrait pictures waste two thirds of the screen.
- **No text of any kind**: no letters, numbers, signs with writing, logos or watermarks. He cannot read, and AI lettering comes out scrambled.
- **No brands or known characters.** Generic toy bricks with round studs and nothing printed on them (never LEGO or Duplo, by name or by logo). No vehicle or animal that looks like a TV or film character.
- **Friendly, never scary.** Dinosaurs smile with closed mouths or small rounded teeth. No hunting, fighting, crashes, injuries or burning houses. A fire engine sprays water at a campfire or rescues a cat.
- **Dinosaurs have faces; vehicles do not.** Vehicles look like sturdy real machines seen through a toy designer's eyes, with a visible, friendly driver. He loves real vehicles, and a face on a digger makes it a character instead of a digger.
- **Strong, warm colours**, not pastel. Vehicle colours follow the real ones: fire engine red, digger yellow, refuse truck orange, police blue and white, tractor green, ambulance white with a red stripe.
- **People** are varied children and adults with simple friendly faces.
- **One subject per picture across the app.** A subject appears in one activity only (see the content plan).

## Full-colour style: Bilderbuch with clear outlines

Rich picture-book illustration: bold, clean, dark-brown outlines, chunky rounded shapes, warm saturated colours, soft shading with gentle highlights, detailed background, bright daylight. The outlines make scenes, stickers, colouring pages and the menu read as one hand. A softer painted look without outlines was shown as an alternative and not chosen.

## Colouring pages (Bunte Bilder)

A different style on purpose:

- Clear, thick, even, pure black outlines on pure white (reference: `docs/art-samples/lineart-feuerwehr.png`). No grey, shading, hatching, texture or solid black areas.
- Every region is closed. Big areas for a finger tap or a pen fill.
- Region budget: easy about 12 areas, medium about 25, hard about 40. The main parts of the subject are big; areas smaller than a fingertip (about 30×30 px at 1536×1024) only appear as decoration inside a part.
- The subject fills at least half of the page. A simple setting (ground line, sun, two clouds), no fields of grass or flowers.

## Stickers and sprites (Klebewelten, Suchspaß, pen activities)

- One object, side view, complete (nothing cut off), in the full-colour style, with a slightly thicker outline.
- Made on a plain white background, cut out to transparency, trimmed, long side 512 px.
- Light comes from the top left in all of them, and there is no ground shadow, so they sit on any background.

## Backgrounds and worlds

- **Klebewelten stages** are calm and nearly empty in the lower two thirds, so stickers have room.
- **Suchspaß worlds** are busy Wimmelbild scenes with clear hiding places (bushes, crates, wagons, walls) at several depths.

## Content plan

A subject is used once. "Count" is the number of final pictures; two variants are generated for each and the owner picks from contact sheets.

| Activity | Image type | Subjects | Count |
| --- | --- | --- | --- |
| Bunte Bilder | Line art | **Dinos (8):** T-Rex, Triceratops, Langhals, Stegosaurus, Flugsaurier, Dino-Baby im Ei, Ankylosaurus, Dino-Familie am Vulkan. **Fahrzeuge (8):** Bagger, Feuerwehrauto, Müllauto, Polizeiauto, Traktor mit Anhänger, Dampflok, Rakete, Krankenwagen. **Bausteine (4):** Turm, Haus, Auto, Roboter. **Gemischt (4):** T-Rex fährt Bagger, Triceratops bei der Feuerwehr, Langhals als Lokführer, Dino in der Rakete. | 24 |
| Zauberwasser | Full-colour scene with one big hero (the reveal should show a clear "what is it?") | Langhals am Fluss, T-Rex-Kind mit Schmetterling, Triceratops-Mama mit Baby, Flugsaurier über dem Vulkan, Bagger hebt Erde, Feuerwehrauto vor der Wache, Müllauto leert Tonnen, Polizeiauto an der Ampel, Traktor auf dem Feld, Dampflok auf der Brücke, Rakete beim Start, Krankenwagen vor dem Krankenhaus, Hafenkran mit Containerschiff, Dino-Astronaut auf dem Mond, Baustein-Burg, Baustein-Zug | 16 |
| Bilderpuzzle | Busy full-colour scene, many distinct corners so pieces are easy to tell apart | Dino-Picknick im Urwald, Dinos baden im See, Große Baustelle mit Kran, Feuerwehr rettet die Katze, Müllabfuhr in der Straße, Bauernhof mit Mähdrescher, Bahnhof, Flughafen, Hafen, Weltraumstation, Stadtkreuzung mit Bus und Polizei, Kinderzimmer voller Bausteine | 12 |
| Suchspaß | 4 Wimmelbild worlds plus 8 sprites per world, which hide behind things | Worlds: Dino-Tal, Baustelle, Bahnhof, Bausteinstadt. Sprites are small characters doing something (Dino mit Helm, Bauarbeiterin mit Schubkarre, Schaffner mit Kelle, Baustein-Hund ...) | 4 + 32 |
| Klebewelten | Transparent stickers and calm stages | Stickers: 10 dinos, 14 vehicles, 8 brick builds, 8 people and props. Stages: Urzeit-Lichtung, Straße mit Kreuzung, Mond, Bausteinplatte | 40 + 4 |
| Home screen | Activity cards and mascot | One card per activity (12 with the new ones) and the mascot in a few poses. Decided in the phase 1 mockup. | about 14 |
| Straßenmaler | Top-down map backgrounds, top-down toy vehicles, destinations | 4 maps (Wiese, Stadt, Sand, Schnee), 6 vehicles, 6 destinations (Dino-Nest, Feuerwache, Baustelle, Omas Haus, Bauernhof, Garage). View decided in the phase 3 mockup. | about 16 |
| Waschanlage | Clean customers and the wash hall | 6 customers (Bagger, Müllauto, Traktor, Feuerwehrauto, Triceratops, Langhals) and 1 hall. Mud, foam, water and shine are drawn by the app as layers, so no muddy copies are needed. | 7 |
| Sternbilder-Buch | Glowing reveal pictures on a night sky | 8 constellations (T-Rex, Bagger, Rakete, Feuerwehrauto, Triceratops, Zug, Traktor, Mond-Dino "Gute Nacht") and 1 sky. Dot positions are placed by hand on each picture. | 9 |

That is about 180 pictures, or about 360 FLUX runs at 10 to 25 seconds each: about two hours of GPU time, split into batches by activity. Checking and picking take longer than generating.

Zauberspuren, Kästchenkunst and Farbenfreunde keep their generated or data-driven content for now; they are not picture-led and come after the main six.

## Existing pictures

| Keep | Retire from the pickers (files stay, see below) |
| --- | --- |
| The detailed ChatGPT scenes in `templates/water` (kitten, duckling, baby dino, fire truck, farm tractor, submarine, sandcastle, cottage, sundae) and the 21 detailed colouring PNGs | All hand-coded SVGs and the flat WebP pictures in `templates/water` and `templates/coloring`; the blue steam engine with a face (both versions) |

Retiring means the picture no longer shows in a picker. The file stays in the repository and in the offline cache, because saved drafts and album entries refer to pictures by file name and must keep opening.
