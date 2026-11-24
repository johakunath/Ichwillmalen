# Handover: where the work stands

Rules, product decisions and the repository map are in [AGENTS.md](AGENTS.md). This file only says what was done last and what comes next. Keep it short: replace old state instead of adding to it.

## State on 2026-11-24

- **Phase 0 is done** (PR 14, branch `phase-0-art-plan`): visual audit, art bible with the content plan, image pipeline, local FLUX tooling, style samples, backlog, this agent guide.
- **The owner approved the picture style:** picture-book style with clear outlines, vehicles without faces, colouring pages with clear lines like the fire engine sample, landscape 3:2. Approved samples are in `docs/art-samples/`.
- **No new pictures ship yet.** The app itself is unchanged since PR 13 (September 2026, the Malatelier tablet revision).
- The Malatelier revision has **not been accepted on the tablet**. The device checks TAB-01 to TAB-04 and PLAY-01 in [FEATURE-REQUESTS.md](FEATURE-REQUESTS.md) are open.

## Next: phase 0b, the first picture batch

1. Write jobs files for Bunte Bilder (24), Zauberwasser (16) and Bilderpuzzle (12) from the content plan in [docs/ART_BIBLE.md](docs/ART_BIBLE.md).
2. Generate two variants each, show contact sheets, let the owner pick. Hard cases go to Codex ([docs/IMAGE_PIPELINE.md](docs/IMAGE_PIPELINE.md)).
3. Build the export step (convert, manifest entry, `templates/SOURCES.md`), the `retired` flag in the manifest and a separate picture list for Bilderpuzzle.
4. Bump `CACHE` in `sw.js`, run `npm run check`, open the PR, give the owner a tablet test plan.

Then phase 1 (home screen and app feel, mockup first), phase 2 (magic pens) and phase 3 (Straßenmaler, Waschanlage, Sternbilder-Buch). The phase table is in FEATURE-REQUESTS.md.

## Things that are easy to get wrong

- **Brush rendering:** add all coalesced pointer samples with `Brushes.render`, then call `Brushes.finish` once before compositing. Soft-brush tinting must not repeat for every stylus sample.
- **Fullscreen:** a persistent same-origin frame keeps fullscreen alive across activities. Entering it from Malatelier transfers artwork, camera, tools and undo history; keep that transfer intact.
- **The sheet** is a fixed 1600×1100 bitmap; filling the screen is a camera choice.
- **Service worker updates** wait until open app windows are closed; never reload a child's session.
- **GPU:** other sessions use the same ComfyUI for 3D models. `make_art.py` waits for an idle queue; do not start a second GPU job beside it.

## Last validation

2026-11-24, `npm run check` on this PC (Windows, Edge 158): 14 core checks and 33 browser checks passed. GitHub CI runs the same suites on Linux Chromium.

Two test changes in phase 0, both without app changes: the Zauberwasser reload check compares pixels with a tolerance of two colour steps (Edge 158 returns a saved mask one step off in a few pixels), and the tablet suite waits until the closed parent-gate dialog has left the page (counting at once failed on CI, also on `main` since September).
