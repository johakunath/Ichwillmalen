# Code Inspector Report – Ichwillmalen

### Stack: Static HTML, CSS, Canvas 2D, SVG and vanilla JavaScript; GitHub Pages PWA

### Scope: Full

## Executive Summary

The original project was a useful foundation: working drawing engines, a local picture library, no application server, and no accounts. The greatest product issue was that a child had to navigate an adult-oriented collection of separate tools. The most urgent reliability problems were coloring pixels becoming uneditable, drawings being lost when leaving an activity, and incomplete offline caching. The improvement pass keeps the static deployment and original library while addressing those issues and introducing a shared visual and interaction system.

**Subsequent owner feedback changes the drawing UI recommendation.** The first redesign made the tablet canvas too small, controls too bulky and essential tool choices too hidden. The owner explicitly wants pen type, color and size permanently visible, a discoverable fullscreen button, reliable zoom and more realistic, finer pens. This feedback overrides the initial attempt to simplify drawing by hiding controls. The audit scores below remain a historical assessment of the original checkout; [FEATURE-REQUESTS.md](FEATURE-REQUESTS.md) is the current requirements and backlog.

## Maturity Assessment

Scores describe the original checkout, before this implementation.

| Category         | Score (1–5) | Headline                                                                              |
| ---------------- | ----------- | ------------------------------------------------------------------------------------- |
| Structure        | 3           | Clear activity boundaries, but engines embedded in HTML                               |
| Coupling         | 3           | Useful shared palette and picker; duplicated chrome and input behavior                |
| Token Efficiency | 2           | Dense scripts; `free.html` mixed about 480 lines of UI, drawing, storage and gestures |
| Testing          | 1           | No reproducible checked-in test suite; historical test claims in notes                |
| Config / Env     | 4           | Simple static deployment and no secrets or runtime dependencies                       |
| Documentation    | 2           | Conflicting age, feature, offline and testing descriptions                            |
| **Overall**      | **2.5**     | **Good foundation, weak regression protection and child-facing consistency**          |

## Main Problems Found

- `coloring.html`: the fill algorithm treated dark **painted** pixels as permanent boundaries. It also used painting as its visitation marker; similar replacement colors could remain eligible for processing. The replacement uses a fixed outline mask and an explicit visited buffer.
- `free.html`: drawing dimensions depended on the current screen dimensions. The resize handler changed the bitmap; history snapshots were created asynchronously, leaving undo ordering vulnerable. The new paper has fixed dimensions and synchronous bounded history.
- `sw.js`: only shell requests were pre-cached, despite the README claiming the full library was available offline. Installation silently ignored required-file failures and activation deleted every other cache on the origin. The replacement uses an atomic shell, four bounded library workers, a readiness marker and scope-specific cache names.
- `free.html`, `coloring.html`, `pixel.html`, `water.html`: no persistent working drafts across activities. The new engines persist their drafts in IndexedDB and wait for pending writes on the home navigation path.
- `index.html`: seven text-heavy activity tiles, divided into adult categories. The original drawing review also identified difficult tool grouping. The subsequent tablet feedback clarifies the remedy: improve grouping and reduce toolbar bulk while keeping the everyday choices visible; visibility itself is not the problem.
- `pbn.html` and `pixel.html`: number labels and text prompts were central to the interaction. Color matching now uses visual colors; pixel templates show little color guides.
- `gallery.js`: every visit began with a full picture picker; clickable `div` elements lacked keyboard operation. Picture buttons, visual theme filters and remembered starting pictures replace that flow.

## Areas Already OK

- Static architecture is easy to run, inspect and host on GitHub Pages.
- The supplied illustration files are useful content and remain intact.
- Canvas drawing already included pointer input, pen pressure and gesture concepts.
- No ads, remote fonts, analytics, accounts or application-server dependencies.

## Prioritized Improvement Backlog

The entries here summarize the review's implementation outcomes. Use the maintained backlog in [FEATURE-REQUESTS.md](FEATURE-REQUESTS.md) for current priorities, especially the still-open device acceptance work.

### Critical (fix before next AI session)

- **Implemented:** deterministic drawing undo, orientation-safe drawing and water masks.
- **Implemented:** recolorable dark fills and bounded fill traversal, with regression tests.
- **Implemented:** consistent app-shell and library caching, tested with network disabled.

### Important (fix this sprint)

- **Implemented:** picture-led studio home, shared icon controls and a consistent German interface.
- **Implemented:** IndexedDB drafts and a common artwork album; original album items are imported without deleting their source.
- **Implemented:** four sticker worlds, 25 original stickers, 4/6/9-piece puzzles using the existing image library, and generated search rounds.
- **Implemented:** reproducible core and real-browser regression tests.
- **Remaining device validation:** observe a child using the actual Samsung tablet. Check S Pen hover/contact, palm rejection and two-finger gestures on that hardware.

### Nice to Have

- Extend the tracing illustrations after observing actual use. The owner-requested finer pens and distinct drawing textures have already been implemented locally and now need device validation.
- Provide a grown-up export/import of all local artwork for moving between devices.

The earlier recommendation to reduce six visible paints further is retired. The owner's explicit direction is to keep colors, pen types and sizes visible.

## Tablet feedback follow-through — 2026-09-10

- **Implemented locally:** compact header and side palette, with about 81–85% canvas coverage at the three standard tablet test sizes; all nine tools, twelve colors and five widths visible without opening a toolbox.
- **Implemented locally:** a direct fullscreen control that preserves artwork, selected tools, camera and undo; pinch zoom, visible zoom buttons, hand panning and whole-sheet view. Pen hover no longer blocks finger gestures, and a cancelled pinch preserves redo.
- **Implemented locally:** colored pencil, fineliner, wax, marker, brush, watercolor, spray and stars, plus eraser. Fine widths, pressure variation, texture and clean soft-edge color have browser regression checks.
- **Not yet accepted on device:** actual canvas comfort, tap accuracy, pen realism, latency, gesture transitions, fullscreen and PIN-protected Android pinning. These are the next priorities, ahead of adding more mini-games. A passing browser suite is not evidence of child enjoyment or physical S Pen feel.

## Suggested First Stabilization Task

The initial stabilization task was to replace the flood-fill boundary/visitation logic and exercise dark recoloring and similar-color replacement. That is now isolated in `js/flood-fill.js`, covered by `tests/core.test.cjs`, and exercised through the coloring UI in `tests/browser.cjs`.

## Files Needing Closer Inspection

- `js/drawing.js`: real-device pen pressure, palm rejection, and gesture transitions.
- `js/brushes.js`: actual-device fine strokes, pigment feel, pressure response and rendering latency.
- `trace.html`: the last retained inline engine; further extraction is possible without changing the play experience.
- `js/storage.js`: local artwork remains tied to a browser profile; clearing browser storage removes it.
- `sw.js`: bump the cache version whenever changing the shipped app shell or templates. Updates activate after existing sessions close.

Browser validation is documented in README.md. Browser automation cannot establish whether a particular child enjoys an activity or replace hands-on S Pen validation.
