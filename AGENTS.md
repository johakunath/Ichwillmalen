# Ich will malen: guide for coding agents

Read this file first. It is enough to start most tasks; open another document only when the map below says it applies. `CLAUDE.md` imports this file, so Claude Code and Codex work from the same rules.

## What this is

A German offline drawing studio (PWA) for the owner's four-year-old son on a **Samsung Galaxy Tab S9 with S Pen**, installed fullscreen with Android app pinning. Static site: HTML, CSS, vanilla JavaScript, Canvas 2D. No build step, no backend; GitHub Pages serves the repository root. Node and Playwright are development tools only.

He loves dinosaurs, vehicles of every kind and building bricks. The goal is a calm app with the polish of a commercial kids' app that he chooses on his own.

## Working with the owner

- He is not a programmer. Do all code, git, installs and builds yourself. Give him steps only for the GitHub website or the tablet.
- **Mockup first.** Before building a new visual, layout or activity whose form is not settled, show an SVG mockup with example content in the chat and let him choose.
- Work in phases, **one PR per phase**. He reviews and merges on GitHub; never merge yourself.
- Before every PR run `npm run check`. Bump `CACHE` in `sw.js` whenever shipped files change.
- At the end of a phase update `HANDOVER.md` (current state) and `FEATURE-REQUESTS.md` (phase table, device findings). New ideas go into `docs/BACKLOG.md`, not into those two files.
- Pictures are a matter of taste: make two variants, show a contact sheet, let him pick.
- Codex reviews a PR automatically when it is opened. **Fix commits pushed afterwards need no new Codex review:** do not request one and do not wait for one.
- Each phase ends with a short test plan for him on the tablet.

## Product rules

1. A digital toy, not a game: no scores, timers, streaks, unlocks, levels, stickers or stars as rewards. Reward by transformation (the drawing comes alive, the car drives off).
2. Every activity has a natural ending and never advances on its own. No "one more" prompts, idle nudges or countdowns.
3. Usable without reading. Text is for parents only.
4. No ads, accounts, analytics or external runtime dependencies. Works offline after the first load.
5. Silent until the owner decides otherwise.
6. Malatelier: pen type, colour and size stay permanently visible; the canvas keeps about 80% of the screen or more; a direct fullscreen button; finger zoom and pan that never leave a mark; fine pens. Do not hide tools in a toolbox.
7. Never delete saved artwork or old album data. Retired pictures leave the pickers but their files stay (drafts refer to pictures by file name). Rotation, zoom and fullscreen never change a drawing.
8. Parent settings sit behind a three-second hold. `js/tablet.js` owns fullscreen, installation and that gate.
9. Content: generic toy bricks only (no LEGO or Duplo name, logo or lettering), no known characters, no text in pictures, nothing scary.
10. The new pen activities are pen only (`pointerType === "pen"`); a finger navigates and otherwise gets a gentle picture hint.
11. Browser tests are not device acceptance. Do not call something accepted until the owner has tried it on the tablet.

## Map

| Path | What | Open it when |
| --- | --- | --- |
| `HANDOVER.md` | Current state, next step, last validation | Always, after this file (short) |
| `FEATURE-REQUESTS.md` | Owner requirements for the drawing screen, phase table, device checks and findings | Planning a phase or touching Malatelier |
| `docs/BACKLOG.md` | Open ideas, questions for the owner | Looking for what to do next, or parking an idea |
| `docs/ART_BIBLE.md` | Picture style and the content plan per activity | Any picture work |
| `docs/IMAGE_PIPELINE.md` | Making pictures locally with FLUX, sizes, checks, Codex hand-off | Any picture work |
| `docs/AUDIT-2026-11.md` | What looked weak on each screen in November 2026 | Redesigning a screen |
| `README.md` | Behaviour of every activity, offline and Android setup, picture formats | You need detail on how something works today |
| `docs/archive/` | The 2026-09 code review and the old request log | Almost never: history only |
| `index.html`, `js/home.js` | Home screen and album | |
| `free.html`, `js/drawing.js` (16 KB), `js/brushes.js`, `drawing.css` | Malatelier | |
| `water.html`, `coloring.html`, `pixel.html`, `pbn.html` with `js/<name>.js`, `js/flood-fill.js`, `painting.css` | Zauberwasser, Bunte Bilder, Kästchenkunst, Farbenfreunde | |
| `stickers.html`, `puzzle.html`, `find.html` with `js/<name>.js`, `js/drag.js`, `play.css` | Klebewelten, Bilderpuzzle, Suchspaß | |
| `trace.html` (27 KB, engine inline), `js/legacy-chrome.js`, `discovery.css` | Zauberspuren | Search in it; do not read it whole |
| `js/studio.js`, `js/icons.js`, `studio.css` (26 KB), `styles.css` | Shared buttons, dialogs, icons and styling | Search for the selector you need |
| `js/storage.js` | IndexedDB drafts and album | |
| `js/art.js` | Hand-coded SVG figures and backgrounds (being replaced) | |
| `gallery.js`, `templates/manifest.json`, `templates/` | Picture picker and picture library | |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline cache and installation | Shipping files |
| `tests/`, `tools/check.cjs`, `tools/serve.cjs`, `tools/audit-screens.cjs` | Checks, local server, screenshot contact sheets | |
| `tools/art/` | Picture generation (`make_art.py`) and jobs files | Picture work |

## Commands

```sh
npm run check          # everything: core tests, starts the server, three browser suites; prints one summary line each
npm start              # local server on http://127.0.0.1:8000
npm test               # core tests only (no browser)
node tools/audit-screens.cjs   # contact sheets of all screens into test-results/audit/ (server must run)
```

On this PC the browser suites use the installed Edge automatically. Python for `tools/art` is ComfyUI's own (see `docs/IMAGE_PIPELINE.md`).

## Keeping sessions cheap

- Never load pictures at full size. Look at contact sheets (`make_art.py sheet`, `tools/audit-screens.cjs`).
- Do not read `docs/archive/`, `package-lock.json`, `node_modules/`, `test-results/` or `art-work/`.
- Use `npm run check`: it prints a summary and only the failing lines. Tests compare pictures by short hash, so a failure does not print image data.
- Search the large files (`trace.html`, `studio.css`, `tests/browser.cjs`) instead of reading them from top to bottom.
- Keep the documents in step by moving text, not by copying it: a fact lives in one file.
