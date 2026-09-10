# Ich will malen

A small creative studio for preschoolers, designed around pictures, big touch targets and open-ended play. The interface is in German. Everything runs locally in the browser: no accounts, ads, analytics, external fonts, backend or build step.

## Run

With Node.js 20 or later:

```sh
npm start
```

Open **http://127.0.0.1:8000**. Installing packages is only necessary for the optional browser tests; running the app needs no dependencies. Any other static server also works. Free drawing can still open directly from `free.html`; picture activities require HTTP/HTTPS.

## The studio

Six main choices are shown as illustrations:

- **Malatelier:** crayon, brush, marker, watercolor, star brush, rainbow colors, mirror painting, eraser, sizes, undo/redo and saved pictures. Six paints and three everyday tools are immediately visible. More tools live in a small tool box.
- **Zauberwasser:** wipe a soft cover away to discover a picture. Three big brush sizes, undo, restart, visual progress, and a next-picture button. Rotation preserves the reveal mask.
- **Bunte Bilder:** tap-to-fill coloring, undo and a full color palette. Dark painted regions can be recolored. The existing coloring library is retained.
- **Klebewelten:** four backgrounds (meadow, sea, space, town), 25 original SVG stickers, tap or drag placement, move/resize/rotate/flip, undo, and editable saved worlds.
- **Bilderpuzzle:** all 32 water-library pictures become 4-, 6- or 9-piece puzzles. Pieces snap into place; tap a piece and then its place is an alternative to dragging. Completed puzzles remain visible until the child chooses what comes next.
- **Suchspaß:** four worlds, eight large characters/objects and four visual targets per round. New rounds rearrange the scene; an optional picture hint helps without scores or time pressure.

Under **Noch mehr entdecken**:

- **Zauberspuren:** generated dotted lines, curves and shapes; letters are optional. The original tracing engine is retained, with a larger completion tolerance and a corrected U-shaped path.
- **Kästchenkunst:** chunky 8×8 free drawing and the existing pattern library. Color guides replace numeric instructions. Includes undo and saved drafts.
- **Farbenfreunde:** the existing paint-by-numbers library becomes color matching. Ghosted regions and matching paint pots provide the instructions; reading numbers is unnecessary.

There are no streaks, unlocks, scores, timers, sounds or automatic activity changes. Feedback is direct: colors appear, stickers lift, puzzle pieces settle and found characters get a small check.

## Artwork and drafts

`js/storage.js` uses IndexedDB for working drafts and finished artworks. Drawing, coloring, water reveal, sticker worlds, pixel pictures, puzzles and search rounds remember their current state. Tracing and color matching start fresh.

The bookmark button saves a creation into **Meine Bilder**. Drawing, coloring, sticker and pixel artworks can be reopened for further play. The old `kidpaint.gallery.v1` album is imported idempotently when the album opens; its original localStorage data is not deleted. The browser profile owns this data, so clearing site storage removes local artwork. Use **Mitnehmen** or the drawing tool box's download button to keep an image separately.

The drawing paper uses a fixed 1600×1100 bitmap, independent of viewport size. Its history is bounded to eight snapshots. A finger or pen draws; two fingers pan and zoom. A second finger cancels the just-started stroke so a pinch does not leave a mark. Pen input takes priority over touch. The canvas is a finite sheet; the former three-screen-tall page was replaced with a complete sheet that fits the child's view.

## Offline and home-screen installation

Open the app once over HTTPS or localhost. The service worker atomically caches the application shell, then downloads the complete template manifest with four concurrent workers. **Für die Großen** shows whether the full picture library is ready offline. Failed picture downloads are retried on a later visit. The PWA manifest includes 192px and 512px raster icons for home-screen installation.

Cache names include the service-worker scope, so sibling projects on the same origin are not deleted. An updated service worker waits until existing sessions close; it never reloads a child's drawing mid-session. **Bump the version in `sw.js` when changing shipped assets.** During development, unregister the service worker in browser devtools or use browser tests, which block it except in the dedicated offline check.

## Android tablet: fullscreen and staying in the app

Use **an installed fullscreen app plus Android app pinning with a device PIN**. Fullscreen hides browser controls; Android pinning prevents accidental switching to other apps. The website cannot enable or verify Android pinning itself.

1. Open the deployed HTTPS site in **Chrome on the tablet**. Choose **⋮ → Add to Home screen → Install** (German: **Zum Startbildschirm hinzufügen → Installieren**). Alternatively, open **Für die Großen**, hold the button for three seconds and release, then choose **App installieren** if Chrome offers it. The app never prompts a child to install automatically.
2. Launch **Malatelier using its own app icon**. The manifest requests fullscreen across every activity, with the browser's standard standalone fallback if fullscreen is unsupported. A shortcut that still opens a normal browser tab is not the installed app experience.
3. In Android Settings, search for **App pinning / App anheften**. On Samsung, look under **Security and privacy → More/Other security settings → Allow apps to be pinned / Pin app**. Enable the option to require the screen lock/PIN when unpinning. Set a device PIN if needed.
4. Open Malatelier, open **Recents**, tap its app icon above the preview, then choose **Pin this app / Diese App anheften**. Hand the tablet over after it is pinned. Pin the installed Malatelier app, rather than a Chrome tab with browser controls.
5. To finish, use Android's unpin gesture: **swipe up and hold** with gesture navigation, or **hold Back and Recents together** with three-button navigation. Enter your device PIN. Labels and gestures can vary with the Android/One UI version.

The parent panel includes these setup instructions offline. The three-second hold is a guard against accidental settings changes, not a security lock. A website cannot disable Android's Home button, system gestures, or the browser's fullscreen escape controls.

**Vollbild spielen** also works without installation in browsers supporting the Fullscreen API. A same-origin frame keeps the fullscreen document alive while the child changes activities. Exiting fullscreen preserves the live activity and its artwork; use the home button, **Für die Großen**, and another deliberate hold to resume fullscreen. The parent can also choose **Vollbild beenden** there. Fullscreen play suppresses long-press picture/link menus and pull-to-refresh overscroll. This browser fallback still needs Android pinning to restrict leaving the app.

After deploying an update, close existing app windows so the waiting service worker can activate. An already installed Android app may take time to pick up a changed display manifest; meanwhile the in-app fullscreen button is available. Do not clear site storage to refresh the app, as that removes saved pictures.

Official references: [Chrome app installation](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=en-LR), [Android app pinning](https://support.google.com/android/answer/9455138), [Samsung pinning setup](https://www.samsung.com/us/support/answer/ANS10004865/), [Samsung PIN-protected unpinning](https://www.samsung.com/us/support/troubleshoot/TSG10004580/), and [fullscreen manifest behavior](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display).

## Tests

Core checks have no dependencies:

```sh
npm test
```

These cover dark recoloring, similar-color traversal, outline boundaries, source syntax, local references, template consistency and offline-shell coverage.

For browser regressions:

```sh
npm ci
npx playwright install chromium
npm start
# In another terminal:
npm run test:browser
```

On Windows, installed Edge can be used instead of downloading Chromium:

```powershell
$env:BROWSER_CHANNEL = 'msedge'
npm run test:browser
```

`APP_URL` can point tests at another local server. Tests cover real mouse and multi-touch input, undo, navigation persistence, album reopening, sticker manipulation, puzzle completion, coloring, water masks, search, color matching, pixel play, three viewport sizes and offline access to every template. Screenshots and a result summary go into ignored `test-results/`.

The browser command also runs the tablet suite (`npm run test:tablet` to run it alone): short/interrupted holds, real touch and keyboard parent access, phone layout, rejected fullscreen requests, all activity navigation in fullscreen, uninterrupted artwork after leaving fullscreen, resuming without nested frames, deferred installation, and simulated installed-display detection. Installing a real Android app and PIN-protected system pinning require a hands-on tablet check.

The automated checks use a Chromium browser. Physical Samsung S Pen pressure, palm rejection and a child's independent use still need hands-on observation; these have not been verified on the actual tablet.

## Structure

| Location                                                        | Responsibility                                                                    |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `index.html`, `js/home.js`                                      | Studio home, inspiration cards and artwork album                                  |
| `studio.css`, `js/studio.js`, `js/icons.js`                     | Shared navigation, controls, dialogs, feedback and styling                        |
| `js/tablet.js`                                                  | Fullscreen session, installation, parent hold gate and Android setup instructions |
| `js/art.js`                                                     | Original vector characters and four backgrounds                                   |
| `js/storage.js`                                                 | Transactional drafts and artwork storage                                          |
| `js/drawing.js`, `js/coloring.js`, `js/water.js`, `js/pixel.js` | Painting activities                                                               |
| `js/flood-fill.js`                                              | Independently tested coloring algorithm                                           |
| `js/drag.js`, `js/stickers.js`, `js/puzzle.js`                  | Shared drag lifecycle and composition/spatial play                                |
| `js/find.js`, `js/pbn.js`, `trace.html`                         | Search, color matching and tracing                                                |
| `gallery.js`, `templates/manifest.json`                         | Visual picture library and its metadata                                           |
| `templates/`                                                    | Existing picture library; original illustration files are preserved               |
| `sw.js`, `manifest.webmanifest`, `icons/`                       | Offline caching and installation                                                  |
| `tests/`, `tools/serve.cjs`                                     | Validation and local serving                                                      |

## Adding pictures

Add a file and a corresponding entry to `templates/manifest.json` with `name`, `file`, optional `level` (`easy`, `medium`, `hard`) and `theme` (`animals`, `vehicles`, `nature`, `everyday`, `shapes`). Run tests and bump the cache version.

- **Water/puzzle:** PNG, JPG, WebP or SVG. Existing water entries automatically become puzzles.
- **Coloring:** PNG or clean SVG line art, with closed, dark outlines and generous regions.
- **Pixel:** JSON with `cols`, `rows`, `palette` and an optional rectangular `target` matrix. Index zero is empty.
- **Color matching:** SVG elements with `class="region"`, `data-number` and `data-color`. The number groups regions internally; children use color cues.

## Deploy

The app remains a root-hosted static GitHub Pages site. Either deploy `main` from `/ (root)`, or select **GitHub Actions** as the Pages source and use `.github/workflows/pages.yml`. No application build is required. The test workflow runs separately before changes are merged.

The initial review and changes are recorded in [REVIEW.md](REVIEW.md). Earlier requests are preserved as historical context in [FEATURE-REQUESTS.md](FEATURE-REQUESTS.md).
