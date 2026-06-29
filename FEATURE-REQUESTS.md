# Feature Requests & Requirements Log

Single source of truth for everything requested across the original chat, so nothing is lost
moving to Claude Code. Keep this updated each iteration.

**Status:** ✅ done · 🟡 partial · ⬜ not started · ➡️ ongoing / depends on you

---

## 1. Design constraints (apply to EVERY mode and EVERY future change)
These are hard rules, not features. Do not regress them.

| Constraint | Status | Note |
|---|---|---|
| Simple, fun, toddler-friendly | ➡️ | Big tap targets, parent operates mode/color switches |
| **NOT too addictive** (stated repeatedly) | ➡️ | The core ask. No engagement loops. |
| No ads, no accounts, no tracking | ✅ | Fully static, nothing phones home |
| No dopamine mechanics: no scores, sounds, rewards, streaks, unlockables, confetti | ✅➡️ | Satisfaction comes only from the drawing. Keep it this way. |
| Drawing must feel effortless | ✅ | Pressure + smoothing in Free Draw |
| Age-appropriate / nothing unsuitable | ➡️ | — |
| Runs in a browser on Android tablet + Samsung S Pen | ✅ | — |
| Works offline / self-contained | ✅ | Service worker (`sw.js`) caches the shell + every template after first view; installable via `manifest.webmanifest`. Free Draw still also works from `file://`. |

## 2. Input & interaction
| Request | Status | Note |
|---|---|---|
| Pressure-sensitive pen strokes | ✅ | Free Draw |
| "Disable drawing when holding a pen" (palm rejection) | ✅ | Implemented as **pen draws, fingers navigate**. Verify on device. |
| Zoom in/out with fingers | ✅ | Free Draw: two-finger pinch |
| **Unlimited zoom-out / scroll down to extend the canvas** | 🟡 | Bounded: tall page (3× screen) + zoom-out-to-fit. **Not truly infinite.** True infinite needs vector storage (bigger rebuild). |

## 3. Brushes & tools (Free Draw)
| Request | Status | Note |
|---|---|---|
| More brush sizes | ✅ | 3 → 6 |
| Brush types incl. pencil and watercolor | ✅ | crayon, pencil, marker, watercolor, chalk, neon |
| More coloring modes | ✅ | Rainbow + Mirror, as toggles that stack on any brush |
| Stamps | ✅ | tap/drag places shapes |
| Eraser | ✅ | — |
| Undo + guarded Clear | ✅ | Clear is itself undoable |

## 4. Save & collection
| Request | Status | Note |
|---|---|---|
| Save image to device (download) | ✅ | PNG |
| Save images into a local collection / album | ✅ | View, open, download, delete. Persists on the tablet; not inside the Claude preview window. |

## 5. Activity modes
| Request | Status | Note |
|---|---|---|
| Free drawing | ✅ | Most polished mode |
| Color-filling images (coloring book) | ✅ | **Flood-fill (bucket) engine** — tap inside any outlined area and it fills with the chosen colour, bounded by the black lines. Works with **real illustrated PNG coloring pages** *and* the existing vector pages. 19 pages and growing |
| Pixel coloring | ✅ | Free play + color-by-number, 12 templates |
| Water art (paint and colors appear) | ✅ | Reveal engine + 12 templates |
| Paint by numbers (Malen nach Zahlen) | ✅ | Engine + 12 templates; number labels capped + corner-placed on backgrounds |
| → **with difficulty levels** | ✅ | In-app **Easy / Medium / Hard** filter in the picker; templates tagged via `"level"` across PBN, Pixel, Coloring |
| 30+ template images | ✅ | **48** ship across the four modes (≥12 per mode). Growing toward ~24/mode in themed batches — see §7 |
| Bigger picture-selection cards | ✅ | Picker cards enlarged (≈300px, 5px frame) across all four modes for easier toddler tapping — keeps §1 "big tap targets" |
| Theme-organized picture browsing | ✅ | Gallery groups pictures into **Animals / Vehicles / Nature / Everyday / Shapes** sections (via a `theme` tag) alongside the Easy/Medium/Hard filter — a child browses visually, a parent sees curated depth |
| Calm interaction + safe reset | ✅ | Smooth fill transitions on tap; **Reset guarded by a confirm sheet** in Coloring/Pixel so a toddler can't wipe the page by accident |
| **Beyond drawing — learning play** (riddles, coordination, pen skills) | 🟡 | First two non-drawing modes added (`trace.html`, `find.html`). More planned (matching/colour riddles, dot-to-dot) — see the plan in the o4s8n3 branch |
| Trace It (pen-path practice) | ✅ | `trace.html` — follow a dotted guide (Lines · Curves · Shapes · ABC). **Procedurally generated**, so it never runs out. Gentle "well done" when ~80% covered (no score/sound); colour row + Again/Next. Directly the "learn to use the pen" ask |
| Find It (Wimmelbild / hidden-object) | ✅ | `find.html` — a picture of the target shows at the top (good for pre-readers); tap it in the scene. 3 SVG scenes (Meadow/Ocean/Town), 7–8 objects each. Calm green check on a find, gentle wobble on a wrong tap, no timer/score. One scene = many rounds → stretches content |

## 5b. Visual quality & app architecture
| Request | Status | Note |
|---|---|---|
| Premium visual polish | ✅ | Redesigned home screen; refined warm palette + typography + soft shadows; larger framed gallery cards; gentle entrance transitions. Looks intentionally designed, not prototype-like |
| Shared design system (de-duplication) | ✅ | Extracted **`styles.css`** (design tokens + shared components) and **`gallery.js`** (one picker used by all four modes), replacing CSS/JS that had been copy-pasted across 4–6 files. Changes now land once; `sw.js` precaches both |

## 6. Delivery / infrastructure
| Request | Status | Note |
|---|---|---|
| Package for GitHub + GitHub Pages | ✅ | Files live at repo root; `.nojekyll` + `.github/workflows/pages.yml` (Actions deploy) included alongside the classic deploy-from-branch path |
| Evaluate Vercel | ✅ | Pages chosen — pure static, no build/serverless needed |
| Iterate via deploy packages | ➡️ | Ongoing workflow |

## 7. Content library expansion (themed batches → ~24/mode)
| Request | Status | Note |
|---|---|---|
| Broader, higher-quality templates | 🟡 | Target ~**24 per mode** (~96 total), quality-first, organised by theme. New templates: more detailed & charming but never frustratingly intricate — bold outlines, strong silhouettes, few-but-clear regions, fuller palettes |
| Theme coverage | ⬜ | Animals, Vehicles, Nature, Everyday, Seasonal across all four modes (`theme` tag already wired into the gallery in §5b) |
| Phase 1 | ✅ | App quality + shared design system + theme browsing + safe reset (merged in PR #4) |
| Phase 2 — Coloring (this PR) | 🟡 | Flood-fill engine + **user-supplied illustrated coloring pages** (cat, dinosaur, rocket, excavator, sailboat) + hand-drawn pages (duck, owl, fire truck); 19 pages so far, more dropping in as the user sends art (just add the file + a manifest entry). Water / Pixel / PBN batches still to come |

---

## 8. Future game-mode backlog ("more than a drawing game")

Ideas to take the app beyond drawing into gentle *learning play* for a 3–4 year old:
little riddles, colour/matching puzzles, coordination and pen-handling practice. Every
one must keep the §1 rule — **calm, no dopamine loop** (no scores, sounds, timers,
streaks, confetti) — and favour content that **doesn't run out** (good for a flight or a
quiet hour). ✅ **Trace It** and **Find It** shipped first (§5). The rest, ranked roughly
by value-for-effort, with the input family that drives the build cost:

- **Tap** = reuses `gallery.js` + tap, cheapest. **Pen** = reuses `free.html` pointer code.
  **Drag** = needs a small shared drag-and-drop helper we don't have yet.

| Idea | Status | Input | What it is, the skill it builds, and why it fits |
|---|---|---|---|
| **Connect-the-Dots** | ⬜ | Pen | Drag the pen 1→2→3… and the picture's outline appears as you go. Teaches **number order + counting** and is a pure pen-control drill. Dots can be auto-placed along an existing coloring/PBN outline, so it reuses art we already have. Calm payoff: the finished outline simply completes — no confetti. Good for ages ~3.5+ who recognise a few numbers. |
| **Colour Riddle** | ⬜ | Tap | A colour is shown (a swatch, later a spoken/!named colour) and a few objects sit on screen; tap the one that matches — or "tap all the **red** things" in a small scene. Teaches **colour naming + matching**. Rounds are generated from tagged art, so it barely runs out. Lowest-effort new mode after the two shipped. |
| **Shadow / Silhouette Match** | ⬜ | Tap | Match an object to its black silhouette (or match two halves of a picture). A classic toddler **visual-discrimination** riddle. The silhouette is just the same artwork rendered solid black, so **any image becomes content for free** — pairs beautifully with the growing illustration library. |
| **Odd-One-Out** | ⬜ | Tap | Four pictures, one doesn't belong (three animals + one car); tap the odd one. Gentle early **categorisation / reasoning**. Combinations drawn from the themed sets are effectively endless. Wrong taps should stay soft (a wobble, like Find It), never a buzzer. |
| **Chunky Jigsaw** | ⬜ | Drag | Reassemble one picture from 2–6 big, snap-into-place pieces. Builds **spatial reasoning + drag coordination**. Every image in the library becomes a puzzle (1:1 reuse of the new AI art). Difficulty = piece count, which slots neatly into the existing Easy/Medium/Hard filter. First mode that needs the shared drag helper — worth building that helper here so Sorting/Sticker reuse it. |
| **Sorting bins** | ⬜ | Drag | Drag items into 2–3 baskets — animals vs vehicles, big vs small, by colour. Teaches **sorting / categorising**. Generative pairings give high longevity. Depends on the drag helper from Jigsaw. |
| **Sticker Scene** | ⬜ | Drag | Drag stickers (animals, vehicles, trees…) onto a background scene. Open-ended and goal-less — like Free Draw but composed from the illustrations. Calm, creative, **never "finishes"**, so it's ideal for long stretches. Also depends on the drag helper. |
| **Simple Maze** | ⬜ | Pen | Trace a path with the pen from start to goal ("bring the bee to the flower") between soft walls. **Coordination + a little planning.** Mazes can be procedurally generated at toddler scale (wide corridors, few turns), so content is unlimited. Reuses `free.html` pointer handling. |

**Suggested next batch:** the three **Tap** riddles (Colour Riddle, Shadow Match,
Odd-One-Out) — they reuse the gallery + existing art with the least new code and directly
answer the "colour riddles / matching riddles" ask. Build the **drag helper** once when
Chunky Jigsaw comes up; Sorting and Sticker Scene then follow cheaply.

(Fuller write-up of all ten ideas — including the two shipped — lives in the plan that
accompanied this branch.)

---

## Open items / risks to carry forward
1. **Visual testing**: home + all five modes load, fill, pick templates, filter by difficulty, group by theme, and guard reset correctly in a headless browser (43-check automated smoke test + screenshots, 0 console errors) after the shared-design-system refactor. Still **not** verified on a real tablet / S Pen — pressure feel, palm rejection and reveal-brush softness are device-dependent and need a hands-on pass.
2. **PBN difficulty levels** (§5) — ✅ done: in-app Easy/Medium/Hard filter + tagged templates.
3. **Unlimited/extendable canvas** (§2) — currently bounded; decide if true-infinite is worth a vector rewrite.
4. **PBN/coloring template generation** is the real bottleneck: regions need machine-readable number+color data, which ChatGPT won't produce cleanly. Plan = a generator script (image → posterize → vectorize per color → assign numbers → emit SVG). See `HANDOVER.md`.
5. **Palm rejection** — verify the pen-draws/fingers-navigate rule holds on the specific device.
6. **Scope check**: this started as a deliberately minimal, calm toy. It has grown toward a full paint app. Decide whether the kid-facing build should stay minimal while power features (zoom, album, infinite canvas) live in a separate "grown-up" build.
