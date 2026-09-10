# Current handover

The September 2026 improvement pass turns the existing static project into **Ich will malen**, a German creative studio for preschoolers. See [README.md](README.md) for current behavior, architecture, local setup, tests, offline behavior and content formats. See [REVIEW.md](REVIEW.md) for the initial audit and implementation decisions.

## Decisions to preserve

- Fun and independent child use lead the product decisions. The six main activities are chosen by pictures.
- Keep the app self-contained: no accounts, ads, analytics or external runtime dependencies.
- Keep feedback gentle, with no timers, scores, streaks, sounds or unlocks.
- Touch, pen and keyboard alternatives should remain usable. A pinch must not leave a drawing mark.
- Changing the viewport must not alter a saved drawing or water mask.
- Drawing, coloring, stickers and pixel creations can be saved and edited again. Old album data must not be silently deleted.
- Image templates and the app shell must work offline after the initial successful download.
- Keep the static GitHub Pages deployment; Node/Playwright are development tools only.
- Tablet use: installed fullscreen PWA plus Android app pinning with a device PIN. Parent settings require a continuous three-second hold and release. Browser fullscreen uses a persistent same-origin frame so activity navigation does not leave fullscreen; exiting keeps the active game intact. `js/tablet.js` owns this flow.

## Remaining verification

Use the actual Samsung tablet with the child's S Pen to assess pen pressure, palm rejection, dragging and ease of independent navigation. Browser tests exercise these interaction paths but do not prove hardware feel or enjoyment. Watch which activities the child revisits and simplify tools if needed.

Verify the installed app opens without browser controls, and enable/test Android app pinning with a PIN on the actual device. The web app cannot control or detect the OS setting. See the Android setup section in README.md.

## Maintenance

Run `npm test` and `npm run test:browser` when changing interaction or storage logic. Browser tests expect a local server and create ignored screenshots. Bump the cache version in `sw.js` when changing shipped assets; close existing app windows so the waiting update can activate.
