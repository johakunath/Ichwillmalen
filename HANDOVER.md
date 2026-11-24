# Handover: where the work stands

Rules, product decisions and the repository map are in [AGENTS.md](AGENTS.md). This file only says what was done last and what comes next. Keep it short: replace old state instead of adding to it.

## State on 2026-11-24

- **Phases 0 and 0b are merged.** 53 new FLUX pictures ship: 25 colouring pages (with the new Space Shuttle), 16 Zauberwasser scenes, 12 Bilderpuzzle scenes (its own list now). 37 weak old pictures are retired: hidden from the pickers, files still cached so old drafts open. Sources in `templates/SOURCES.md`.
- Ten human-body pictures are made and picked (`tools/art/jobs/body.json`, files in `art-work/body/`) but not exported: where they live is a question for the owner (see docs/BACKLOG.md).
- Every screen has a fullscreen button (`js/tablet.js`, `addFullscreenButton`); it hides while fullscreen is on, so leaving stays with the parents. Malatelier keeps its own button. Hidden on phone widths.
- **Klebewelten uses pictures** (phase 0c, first half): 40 cut-out stickers and 10 stages from the manifest, tray as a left column on landscape tablets (owner chose layout B). `js/stickers.js` keeps drawing the old `js/art.js` figures and scenes for worlds saved earlier; items have either `file` (picture) or `key` (old figure).
- **Suchspaß is a hidden-picture game** (phase 0c, second half): `js/find.js` reads worlds, figures and hiding things from the manifest and places them at random on the open ground of the world picture (lower 40%). Phase 0c is complete.
- **Home screen pictures:** the six activity cards show pictures built from shipped artwork (`tools/art/make_cards.py` writes `templates/cards/`; rerun it after swapping a picture it uses), and the idea box shows a sticker. Layout and text are unchanged; that is phase 1.
- The style is approved; samples in `docs/art-samples/`.
- Device checks TAB-01 to TAB-04 and PLAY-01 in [FEATURE-REQUESTS.md](FEATURE-REQUESTS.md) are still open, plus the new pictures on the tablet.

## Next

1. Phase 1: home screen and app feel. Mockup first; start from docs/UI-REVIEW-CHILD-2026-11.md (points 1 to 5) and ask about sounds.
2. Then phase 2 (magic pens) and phase 3 (pen activities).
3. Open questions for the owner are in docs/BACKLOG.md (place for the body pictures, brighter colours in Bunte Bilder, sounds).

## Things that are easy to get wrong

- **Brush rendering:** add all coalesced pointer samples with `Brushes.render`, then call `Brushes.finish` once before compositing. Soft-brush tinting must not repeat for every stylus sample.
- **Fullscreen:** a persistent same-origin frame keeps fullscreen alive across activities. Entering it from Malatelier transfers artwork, camera, tools and undo history; keep that transfer intact.
- **The sheet** is a fixed 1600×1100 bitmap; filling the screen is a camera choice.
- **Service worker updates** wait until open app windows are closed; never reload a child's session.
- **GPU:** other sessions use the same ComfyUI for 3D models. `make_art.py` waits for an idle queue; do not start a second GPU job beside it.

## Last validation

2026-11-24, `npm run check` on this PC (Windows, Edge 158): 15 core and 34 browser checks passed. GitHub CI runs the same suites on Linux Chromium.
