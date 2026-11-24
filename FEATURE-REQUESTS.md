# Requirements, phases and device findings

The owner's requirements, the phase plan and what was observed on the tablet. Product rules are in [AGENTS.md](AGENTS.md), the current state in [HANDOVER.md](HANDOVER.md), open ideas in [docs/BACKLOG.md](docs/BACKLOG.md). Earlier versions of this file are in git history and in `docs/archive/`.

Status words: **implemented** means code and browser checks exist; it does not mean accepted. **Needs device validation** means the owner has to try it on the Tab S9. Do not mark anything accepted because browser tests pass.

## Direction

The user is the owner's four-year-old son. Fun and his own experience come first: a beautiful, calm, tactile app that feels like a high-quality native tablet app and that he chooses on his own. Learning (pen control, planning a line, counting, colours, shapes) comes through play, without lessons or reading. Success is judged on the tablet and by what he does, not by screenshots.

## Malatelier requirements from the owner's tablet feedback (September 2026)

These stay in force. They replaced earlier attempts to simplify drawing by hiding tools.

| Requirement | Acceptance | State |
| --- | --- | --- |
| Drawing gets almost the whole screen | Slim header, compact palette, no decorative framing, in landscape and portrait | Implemented: canvas covers about 81 to 85% at 1280×800, 1024×768 and 768×1024; a browser guard holds 80%. Needs device validation. |
| Pen type, colour and size are always visible | No overflow menu, parent gate or dialog for these; the selected tool is obvious | Implemented: nine tools, twelve colours, five sizes visible without scrolling. |
| A fullscreen button that is easy to find | Works from a new and a reopened picture; keeps artwork, settings, camera and undo | Implemented with a persistent play frame. Leaving through the button asks for the parent hold. |
| Dependable zoom and moving around the paper | Two-finger zoom and pan, +/− buttons, hand tool, whole-sheet view; no stray mark, redo survives; pen hover does not block fingers | Implemented and browser-tested. Needs the real S Pen. |
| More distinct, realistic and fine pens | Fine writing is possible; pens differ in pigment, nib, texture, transparency or pressure, not only in name | Implemented: coloured pencil, fineliner, wax crayon, felt marker, brush, watercolour, spray, stars, eraser; widths 1, 3, 6, 12 and 24 paper pixels. Feel and latency unverified. |

## Phases (brief of 2026-11-24)

One PR per phase. Each phase ends with a tablet test plan; findings go into the log below.

| Phase | Item | Status |
| --- | --- | --- |
| 0 | Audit, art bible, content plan, image pipeline, style samples, backlog, agent guide | Done in PR 14; style approved by the owner on 2026-11-24 |
| 0b | First picture batch: Bunte Bilder, Zauberwasser, Bilderpuzzle (own list); export step; retire weak pictures from the pickers | Done, merged 2026-11-24; not yet seen on the tablet |
| 0c | Remaining pictures: Klebewelten stickers and stages, Suchspaß worlds and sprites | Klebewelten done (40 stickers, 10 stages, tray on the left), not yet seen on the tablet. Suchspaß not started. |
| 1 | Home screen and app feel: illustrated cards, grouping (Malen, Spielen, Entdecken), transitions, palette; ask about optional sounds | Not started; mockup first |
| 2 | Magic pens in Malatelier: Regenbogen, Glitzer, Neon, stamp brushes, Zauberstift, Kaleidoskop, pressure and tilt | Not started |
| 3 | Pen-only activities: Straßenmaler, Waschanlage, Sternbilder-Buch | Not started; mockup and a natural ending for each |
| 4 | Device test after every phase | Ongoing |

## Open device checks

| ID | Check | What to record |
| --- | --- | --- |
| TAB-01 | Accept the Malatelier workspace on the tablet | Tablet model, Android and browser version, orientation, installed app or browser. Is the canvas large enough, are all tools visible, can he hit them? |
| TAB-02 | Drawing-to-navigation transitions | Draw, lift the S Pen into hover, pinch at once, lift one finger, draw again; hand, +/− and fit-sheet. No stray marks, no lost redo, no changed bitmap. |
| TAB-03 | Pen feel and speed | Fineliner and pencil at small sizes, light and heavy pressure, slow curves, fast strokes, grain, watercolour overlap, soft edges, latency. Tune before adding pens. |
| TAB-04 | Fullscreen and protection against leaving | Fullscreen from a new and a reopened picture; tools, camera, undo and picture survive. Install the app and test Android pinning with a PIN. |
| PLAY-01 | Independent use and return visits | What he chooses, what he returns to, where he needs help, what frustrates him, whether he stops without trouble at an ending. |

## Device findings

None recorded yet. Add dated entries here: device, what was tried, what happened, what follows.

## Regression guards to keep

Canvas coverage and visible controls, one-pixel fineliner output, pressure variation, clean brush edges, zoom anchoring, gesture and redo preservation, fullscreen state transfer, and one soft-brush tint and composite per pointer event. Run `npm run check` when changing interaction, storage or rendering.
