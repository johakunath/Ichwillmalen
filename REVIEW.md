# Code Inspector Report – Ichwillmalen

### Stack: Static HTML, CSS, Canvas 2D, SVG and vanilla JavaScript; GitHub Pages PWA
### Scope: Full

## Executive Summary

The original project was a useful foundation: working drawing engines, a local picture library, no application server, and no accounts. The greatest product issue was that a child had to navigate an adult-oriented collection of separate tools. The most urgent reliability problems were coloring pixels becoming uneditable, drawings being lost when leaving an activity, and incomplete offline caching. The improvement pass keeps the static deployment and original library while addressing those issues and introducing a shared visual and interaction system.

## Maturity Assessment

Scores describe the original checkout, before this implementation.

| Category | Score (1–5) | Headline |
|---|---|---|
| Structure | 3 | Clear activity boundaries, but engines embedded in HTML |
| Coupling | 3 | Useful shared palette and picker; duplicated chrome and input behavior |
| Token Efficiency | 2 | Dense scripts; `free.html` mixed about 480 lines of UI, drawing, storage and gestures |
| Testing | 1 | No reproducible checked-in test suite; historical test claims in notes |
| Config / Env | 4 | Simple static deployment and no secrets or runtime dependencies |
| Documentation | 2 | Conflicting age, feature, offline and testing descriptions |
| **Overall** | **2.5** | **Good foundation, weak regression protection and child-facing consistency** |

## Main Problems Found

- `coloring.html`: the fill algorithm treated dark **painted** pixels as permanent boundaries. It also used painting as its visitation marker; similar replacement colors could remain eligible for processing. The replacement uses a fixed outline mask and an explicit visited buffer.
- `free.html`: drawing dimensions depended on the current screen dimensions. The resize handler changed the bitmap; history snapshots were created asynchronously, leaving undo ordering vulnerable. The new paper has fixed dimensions and synchronous bounded history.
- `sw.js`: only shell requests were pre-cached, despite the README claiming the full library was available offline. Installation silently ignored required-file failures and activation deleted every other cache on the origin. The replacement uses an atomic shell, four bounded library workers, a readiness marker and scope-specific cache names.
- `free.html`, `coloring.html`, `pixel.html`, `water.html`: no persistent working drafts across activities. The new engines persist their drafts in IndexedDB and wait for pending writes on the home navigation path.
- `index.html`: seven text-heavy activity tiles, divided into adult categories. `free.html`: many visible tool groups. These required adult setup or reading to make useful choices.
- `pbn.html` and `pixel.html`: number labels and text prompts were central to the interaction. Color matching now uses visual colors; pixel templates show little color guides.
- `gallery.js`: every visit began with a full picture picker; clickable `div` elements lacked keyboard operation. Picture buttons, visual theme filters and remembered starting pictures replace that flow.

## Areas Already OK

- Static architecture is easy to run, inspect and host on GitHub Pages.
- The supplied illustration files are useful content and remain intact.
- Canvas drawing already included pointer input, pen pressure and gesture concepts.
- No ads, remote fonts, analytics, accounts or application-server dependencies.

## Prioritized Improvement Backlog

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

- Extend the tracing illustrations and add more drawing textures after observing actual use.
- Provide a grown-up export/import of all local artwork for moving between devices.
- Consider simplifying the palette further if observation shows six visible paints are still too many.

## Suggested First Stabilization Task

The initial stabilization task was to replace the flood-fill boundary/visitation logic and exercise dark recoloring and similar-color replacement. That is now isolated in `js/flood-fill.js`, covered by `tests/core.test.cjs`, and exercised through the coloring UI in `tests/browser.cjs`.

## Files Needing Closer Inspection

- `js/drawing.js`: real-device pen pressure, palm rejection, and gesture transitions.
- `trace.html`: the last retained inline engine; further extraction is possible without changing the play experience.
- `js/storage.js`: local artwork remains tied to a browser profile; clearing browser storage removes it.
- `sw.js`: bump the cache version whenever changing the shipped app shell or templates. Updates activate after existing sessions close.

Browser validation is documented in README.md. Browser automation cannot establish whether a particular child enjoys an activity or replace hands-on S Pen validation.
