# Product requirements and backlog

Updated 2026-09-11 after the owner's hands-on tablet feedback. This is the current source of truth for product guidance and priorities. [README.md](README.md) describes current behavior and setup; [HANDOVER.md](HANDOVER.md) summarizes what future work must preserve. Earlier requests and implementation claims are preserved in the [historical log](docs/FEATURE-REQUESTS-ARCHIVE.md).

## Product direction

The primary user is the owner's approximately four-year-old child. **Fun and the child's experience come first.** Aim for a beautiful, playful, tactile creative app that feels like a high-quality native tablet app and is enjoyable to return to. Learning should emerge through colors, shapes, patterns, counting, attention, fine-motor skills and creativity, without lessons or reading requirements.

- Use a coherent visual identity, picture-led navigation and consistent interactions across activities.
- Make ordinary play independently usable by a preschooler. Parents should not need to select the child's mode, pen, color or size.
- Keep touch targets easy to hit while minimizing the space occupied by interface controls. Compact must not mean fiddly.
- Prefer satisfying direct feedback and open-ended play. Keep the experience calm; the current app has no game timers, scores, streaks, unlocks or sounds.
- Preserve local artwork, recoverable actions and offline use. No ads, accounts or tracking.
- Judge success on the tablet and through the child's use, not only through desktop screenshots or automated checks.

## Owner's tablet guidance — requirements to preserve

The owner reported that the drawing area was too small, toolbars were too large, pen/color/size choices were hidden, fullscreen was not discoverable, zoom was awkward, and the pens were too few, too thick and insufficiently realistic. The following requirements supersede earlier suggestions to hide common drawing tools or reduce the visible palette.

| Requirement                                       | Acceptance guidance                                                                                                                                                               | Current implementation and remaining evidence                                                                                                                                                                                                                                                                     |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Give drawing almost the entire screen             | Minimize header height, margins and toolbar bulk. Check landscape and portrait; don't sacrifice the canvas to decorative framing.                                                 | Implemented locally: full-bleed drawing area and compact palette. Canvas coverage is about 81–85% at 1280×800, 1024×768 and 768×1024. The browser regression guard is at least 80% at those sizes; this is a measured baseline, not a user-prescribed universal percentage. Actual-device acceptance is pending.  |
| Keep pen type, color and size permanently visible | No overflow menu, parent gate or repeated dialog for these choices. Make the selected tool obvious.                                                                               | Implemented locally: all nine tools, twelve colors and five sizes are visible without palette scrolling at the tested tablet sizes. Do not reintroduce the former three-tool/six-color toolbox design.                                                                                                            |
| Offer a discoverable fullscreen button            | Enter fullscreen directly from drawing, including after opening a saved picture. Preserve artwork, settings, camera and undo history.                                             | Implemented locally: top-right fullscreen button, persistent play frame and state transfer. Exit through the drawing control opens the parent hold gate. Installed fullscreen plus Android app pinning with a device PIN remains the recommended device setup. The website cannot lock Android navigation itself. |
| Make zoom and moving around the paper dependable  | Support two-finger zoom and pan, visible +/− buttons, a hand tool and a whole-sheet view. A gesture must not draw a stray mark or discard redo. Pen hover must not block fingers. | Implemented locally and browser-tested. Pen contact takes precedence over touch; hover permits immediate pinch gestures. Verify transitions, anchoring and palm behavior with the actual S Pen.                                                                                                                   |
| Offer more distinct, realistic and fine pens      | Fine writing/drawing must be possible. Tools should differ in pigment, nib, texture, transparency or pressure response, not merely their names.                                   | Implemented locally: colored pencil, fineliner, wax crayon, felt marker, brush, watercolor, spray and stars, plus eraser. Width choices are 1, 3, 6, 12 and 24 paper pixels. Texture, pressure, transparency and soft-edge color have browser checks; physical feel and latency remain unverified.                |

The sheet is still a fixed 1600×1100 bitmap. Filling the drawing viewport is a camera choice: some edges may be outside the view, and **Ganzes Blatt zeigen** reveals the complete sheet. Rotation, zoom and fullscreen must never resize or destroy artwork. This is not an infinite-canvas implementation.

## Status and current backlog

**Implemented locally** means code and relevant checks exist; it does not mean deployed or accepted on the device. **Needs device validation** requires observation on the owner's tablet. **Candidate** is an idea, not an approved next feature. Keep these distinctions when updating this file.

The tablet drawing revision is currently local on `codex/tablet-drawing-improvements`; deployment and device acceptance are not complete as of this update. The owner handles review, merging and deployment.

| Priority / ID        | Item                                                           | Status                       | Completion evidence                                                                                                                                                                                                                                   |
| -------------------- | -------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First — TAB-01       | Accept the revised drawing workspace on the actual tablet      | Needs device validation      | Record tablet model, Android/browser version, orientation and whether it was launched as an installed app. Confirm the canvas feels large enough, all tool/color/size choices remain visible, and the child can hit them comfortably.                 |
| First — TAB-02       | Validate drawing-to-navigation transitions                     | Needs device validation      | Draw, lift the S Pen into hover, immediately pinch/drag with fingers, lift one finger, resume drawing, and test the hand, +/− and fit-sheet controls. Confirm no stray marks, lost redo or destructive bitmap changes.                                          |
| First — TAB-03       | Validate pen feel and performance                              | Needs device validation      | Try fine liner/pencil at small sizes and light/heavy S Pen pressure. Check slow curves, fast strokes, grain, watercolor overlap, clean soft edges and latency. Tune any shortcomings found before adding more pen types simply to increase the count. |
| First — TAB-04       | Validate fullscreen and accidental-exit protection             | Needs device validation      | Enter fullscreen from a new drawing and a reopened artwork; verify tool settings, camera, undo and picture survive entry/exit and activity changes. Install the app and test Android pinning with a PIN.                                              |
| Next — PLAY-01       | Observe independent child use and return visits                | Needs device validation      | Observe what the child chooses and revisits, where help is needed, and what feels frustrating. Simplify presentation or improve feedback without hiding the requested drawing essentials. No analytics instrumentation is needed.                     |
| Later — UI-01        | Review canvas/control balance in the other painting activities | Candidate                    | Apply lessons from the accepted drawing layout where relevant. This is a follow-up review, not a claim that the new drawing palette has already been applied to every activity.                                                                       |
| Later — DATA-01      | Whole-album export/import for moving between devices           | Candidate                    | Preserve editable artwork and drafts, with round-trip checks. Individual image download already exists.                                                                                                                                               |
| Later — CONTENT-01   | Curate additional pictures based on observed interest          | Candidate                    | Prioritize appealing, age-appropriate pictures with generous paintable regions. Existing manifest content remains intact; a previous target of 24 images per mode is not the current acceptance criterion.                                            |
| Deferred — CANVAS-01 | Truly extendable/infinite paper                                | Historical request; deferred | Current implementation is a finite sheet with zoom and pan. Revisit only if actual use shows the finite sheet is a limitation; do not confuse a larger visible drawing area with infinite storage.                                                    |

If the device checks reveal problems, add concrete findings and follow-up fixes under TAB-01 through TAB-04. Do not mark those items complete solely because browser tests pass.

## Existing activities and deferred ideas

Free drawing, coloring, water reveal, sticker worlds, picture puzzles and search are implemented as the six main activities. Tracing, pixel painting and color matching are available under **Noch mehr entdecken**.

- **Chunky jigsaw:** implemented as Bilderpuzzle, with 4/6/9 pieces, snap placement and a tap alternative. It is no longer an unbuilt backlog item.
- **Sticker scenes:** implemented as Klebewelten, with four backgrounds, 25 stickers and editable saved compositions. The shared drag helper already exists.
- **Color riddle:** a separate object-based color riddle remains a candidate; existing Farbenfreunde provides color matching but is not the same activity.
- **Shadow matching, odd-one-out, sorting bins, simple mazes and connect-the-dots:** remain candidates. No new mode is ahead of the tablet usability checks. Any future counting or dot activity must work primarily through visual play rather than requiring numeral reading.

## Superseded guidance

- Parents operating ordinary mode/color switches is superseded by independent child navigation and visible drawing choices.
- Hiding pen types, colors or sizes in a toolbox, or reducing the palette below the implemented visible choices as a default simplification, conflicts with the latest owner feedback.
- Large decorative paper margins and bulky toolbars must not crowd out the drawing area.
- Earlier claims of six sizes, chalk/neon pens, a three-screen-tall sheet, no shared drag helper, or puzzles/stickers still being unbuilt describe older versions. Use README.md for the current inventory.
- Earlier “done” labels for Samsung pressure, palm rejection or overall child usability are not evidence of device acceptance. The owner's reported problems are the reason the first-priority backlog above remains open.

## Regression and documentation discipline

Keep the current automated guards for canvas coverage and visible controls, one-pixel fineliner output, pressure variation, clean brush edges, zoom anchoring, gesture/redo preservation and fullscreen state transfer. Coalesced pen samples must share one soft-brush tint and composite per pointer event; retain the regression check for this rendering cost. Run `npm test` and `npm run test:browser` when changing interaction, storage or rendering. Latest local validation on 2026-09-11: 14 core checks and 33 browser checks passed using Windows Edge; this is a dated validation record, not a substitute for future runs or real-device latency testing.

Update this backlog and HANDOVER.md when owner guidance changes. Keep README.md's behavior description aligned with the code, preserve historical decisions in the archive, and avoid presenting a proposed feature or local implementation as a deployed, device-validated result.
