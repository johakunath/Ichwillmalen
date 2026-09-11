# Current handover

The September 2026 improvement pass turns the existing static project into **Ich will malen**, a German creative studio for preschoolers. See [README.md](README.md) for current behavior, architecture, local setup, tests, offline behavior and content formats. See [REVIEW.md](REVIEW.md) for the initial audit and implementation decisions.

Read [FEATURE-REQUESTS.md](FEATURE-REQUESTS.md) before planning changes: it is the current owner guidance and backlog. The [older log](docs/FEATURE-REQUESTS-ARCHIVE.md) is historical and must not override the latest tablet feedback.

## Decisions to preserve

- Fun and independent child use lead the product decisions. The six main activities are chosen by pictures.
- The owner explicitly found the tablet drawing area too small and its toolbars too large. Preserve a canvas-first layout with compact, comfortably tappable controls in portrait and landscape.
- Pen type, color and size must remain permanently visible in drawing. Do not restore the three-tool/six-color toolbox or hide these controls as a preschool simplification. Parents should not need to configure ordinary play.
- Keep a direct fullscreen button in drawing, reliable finger zoom/pan with visible alternatives, and a useful range of distinct, realistic pens including genuinely fine widths. Tool count alone is not evidence of good pen feel.
- Keep the app self-contained: no accounts, ads, analytics or external runtime dependencies.
- Keep feedback gentle, with no timers, scores, streaks, sounds or unlocks.
- Touch, pen and keyboard alternatives should remain usable. A pinch must not leave a drawing mark.
- Changing the viewport must not alter a saved drawing or water mask.
- Drawing, coloring, stickers and pixel creations can be saved and edited again. Old album data must not be silently deleted.
- Image templates and the app shell must work offline after the initial successful download.
- Keep the static GitHub Pages deployment; Node/Playwright are development tools only.
- Tablet use: installed fullscreen PWA plus Android app pinning with a device PIN. Parent settings require a continuous three-second hold and release. Browser fullscreen uses a persistent same-origin frame so activity navigation does not leave fullscreen; exiting keeps the active game intact. `js/tablet.js` owns this flow.

The tablet drawing revision keeps all tools, colors and sizes visible in a compact side palette. The fixed-resolution sheet fills the drawing viewport by default; a fit-sheet control reveals its edges. Preserve the direct-fullscreen transfer of artwork, camera, tools and undo history, and keep finger zoom available while the pen hovers. `js/brushes.js` owns the pigment rendering.

## Remaining verification

The owner reported real tablet usability problems before this revision. Do not describe those concerns as accepted just because the revised implementation passes browser checks. Complete TAB-01 through TAB-04 in [FEATURE-REQUESTS.md](FEATURE-REQUESTS.md): actual-screen canvas/control balance, visible choices, pen-hover-to-pinch transitions, palm behavior, fine stroke and pressure feel, latency, and fullscreen state preservation. Record device/browser details and any concrete failures.

Observe which activities the child revisits and where help is needed. Improve grouping, spacing and feedback while preserving the explicitly requested visible drawing essentials. Further mini-games and content expansion are candidates after the tablet experience is accepted.

Verify the installed app opens without browser controls, and enable/test Android app pinning with a PIN on the actual device. The web app cannot control or detect the OS setting. See the Android setup section in README.md.

## Revision status

As of 2026-09-11, the tablet drawing changes and documentation are local on `codex/tablet-drawing-improvements`, not yet committed or deployed. Latest local validation: 14 core checks and 32 browser checks passed. The owner handles review, merging and deployment; device acceptance is still open. Check Git and update this dated status when work advances.

## Maintenance

Run `npm test` and `npm run test:browser` when changing interaction or storage logic. Browser tests expect a local server and create ignored screenshots. Bump the cache version in `sw.js` when changing shipped assets; close existing app windows so the waiting update can activate.
