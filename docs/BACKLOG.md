# Backlog: open ideas

Everything that is not planned work yet. Planned phases and device checks are in [FEATURE-REQUESTS.md](../FEATURE-REQUESTS.md); this file is where ideas wait. Add new ideas here, one line each, and move an item out when it becomes part of a phase. Nothing here is approved until the owner says so.

Status words: **ask** (needs the owner's decision), **idea** (not decided), **planned** (already tied to a phase), **deferred** (decided: not now).

## Questions for the owner

| Item | Status | Note |
| --- | --- | --- |
| Soft, optional effect sounds (pen scratch, splash) behind a parent toggle | ask in phase 1 | The app is silent by decision. Do not decide alone. |
| Mascot or another visual thread across the app | ask in the phase 1 mockup | |
| Where the ten human-body pictures live (`tools/art/jobs/body.json`): Zauberwasser and Bilderpuzzle, or a small "Mein Körper" picture book with a parent-read sentence per page | ask, mockup first | Owner asked for them on 2026-11-24 ("explaining how it works, but for kids"). Explaining needs words a parent reads aloud; pictures carry no text. |
| Brighter colours in Bunte Bilder (real red, real yellow) instead of the soft pastels | ask | From [UI-REVIEW-CHILD-2026-11.md](UI-REVIEW-CHILD-2026-11.md), point 13. |
| Farbenfreunde, Kästchenkunst and Zauberspuren still show the old simple drawn pictures (behind "Noch mehr entdecken"). Hide them until they have new content, or redo them first? | ask | Owner asked on 2026-11-24 to get rid of simple old SVG pictures; home cards, idea box, Klebewelten and Suchspaß are done. Farbenfreunde needs vector pictures with regions, not FLUX rasters. |
| Keep or drop Sternbilder-Buch | ask after its first test | He was not interested in the paper version; drop it if the reveal does not hold him. |

## Pictures and content

| Item | Status | Note |
| --- | --- | --- |
| Remove the last stray lettering in Bilderpuzzle `baustelle-kran` (excavator) and `stadtkreuzung` (van), the small face on the bow house in Zauberwasser `hafenkran`, and fill the solid black window in colouring `rakete` | idea | FLUX edits did not remove them; try Codex or a manual paint fix. |
| Brick builds through Blender renders restyled by FLUX | idea | FLUX alone gets brick geometry wrong. Codex is the fallback. |
| Shrink the 24 MB of colouring PNGs to 1-bit images | idea | About 50 KB each. Check that tap-fill behaves the same. |
| Raise the 1100 px working canvas in Zauberwasser and Bunte Bilder | idea | The Tab S9 has 2560×1600 pixels; pictures are upscaled about two times today. |
| Fresh content for Zauberspuren, Kästchenkunst and Farbenfreunde | idea | After the main six. Kästchenkunst should open with a picture to copy. |
| Unused files: `templates/find/*.svg` (retired, still downloaded), `templates/coloring/firetruck.svg` (listed nowhere), the old `.find-*` rules in `discovery.css` | idea | Check, then remove. |
| Suchspaß: hand-placed hiding spots per world (behind the cave, the excavator, the wagon) instead of random places on the open ground | idea | Would use the world picture itself as cover. Needs spot lists per world. |

## Activities

| Item | Status | Note |
| --- | --- | --- |
| A natural ending for each existing activity | idea | Brief rule: every activity closes (the book shuts, the car parks). Zauberwasser, Bilderpuzzle, Suchspaß and Bunte Bilder have none. Mockup first. |
| Zauberwasser cover that does not give the picture away, and a picture that fills a landscape screen | idea | |
| Straßenmaler variant: wide roads to trace inside | idea | After the basic version works. |
| "Erzähl mir dein Bild": a voice note recorded with a picture in the album | idea | A role for the parent (Draw and Tell). Needs microphone permission and storage. |
| Colour riddle (object based) | idea | Different from Farbenfreunde. |
| Shadow matching, odd one out, sorting bins, simple mazes | idea | From the 2026-09 list. Counting and dots must work by picture, not by reading numerals. |
| Truly extendable paper in Malatelier (CANVAS-01) | deferred | The sheet is a fixed 1600×1100 bitmap with zoom and pan. Revisit only if real use shows a limit. |

## App feel and layout

| Item | Status | Note |
| --- | --- | --- |
| App-wide colour palette and activity headers without small text | planned, phase 1 | Set together with the home screen. |
| Gentle page transitions | planned, phase 1 | |
| Canvas and control balance in the other painting activities (UI-01) | idea | Apply what the accepted Malatelier layout taught. |

## Data

| Item | Status | Note |
| --- | --- | --- |
| Whole-album export and import for moving between devices (DATA-01) | idea | Keep artworks and drafts editable; test the round trip. Single-picture download exists. |

## Technical

| Item | Status | Note |
| --- | --- | --- |
| Remove a replaced dialog at once in `Studio.modal` | idea | A closed dialog stays in the page until its close event fires. Not visible, but it made a test flaky. |
| Move the inline tracing engine out of `trace.html` into `js/` | idea | The largest file in the repo (27 KB). |
| Merge the older `styles.css` into `studio.css` during the palette work | idea | Two base stylesheets are loaded by every page. Check what is still used first. |
| Run `npm run check` in GitHub CI | idea | CI still runs the separate commands. |
