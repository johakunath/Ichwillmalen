# Drawing Playground

A calm, ad-free drawing app for a toddler using a Samsung S Pen on an Android tablet.
Pure static site — no build, no server code, no accounts, no tracking, no sounds/rewards.

## Modes
- **Free Draw** (`free.html`) — crayon / pencil / marker / watercolor / chalk / neon, 6 sizes, rainbow + mirror, stamps, eraser, pen-draws / fingers-zoom, tall pannable page, in-app album. Works fully offline (even from `file://`).
- **Water Magic** (`water.html`) — a hidden colored picture revealed where you paint.
- **Coloring Book** (`coloring.html`) — tap a region to fill it with the chosen color.
- **Pixel Art** (`pixel.html`) — color a grid; supports free play and color-by-number.
- **Paint by Numbers** (`pbn.html`) — pick a number, fill the matching regions.

The Pictures panel in Water / Coloring / Pixel / PBN has an **Easy · Medium · Hard**
filter when templates declare a `"level"`. ~30 starter templates ship across the modes.

## Offline / install
A service worker (`sw.js`) caches the app shell and every template the first time you
open it, so all modes keep working with no connection afterwards. With
`manifest.webmanifest` the site can also be **installed to the home screen** as a
standalone app. (The service worker only runs over HTTPS or `localhost` — i.e. on
GitHub Pages or a local server, not from a bare `file://`. Free Draw still works from
`file://` regardless.)

## Deploy to GitHub Pages
Two supported paths — both serve the files from the repo root:

**A. Deploy from a branch (no build):**
1. Push these files to the root of the repo (not inside a subfolder).
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Open `https://<user>.github.io/<repo>/`.

**B. GitHub Actions:** set **Settings → Pages → Source: GitHub Actions**. The included
`.github/workflows/pages.yml` then deploys on every push to `main` (and via *Run
workflow*).

> Water / Coloring / Pixel / PBN load files via `fetch`, so they need to be **served**
> (GitHub Pages, or `python3 -m http.server` locally). Opening `index.html` straight
> from disk won't load templates. Free Draw is the exception — it works from `file://`.

## Add your own templates
Edit `templates/manifest.json` and drop files in `templates/<mode>/`.

### Water (`templates/water/*`)
Any colored **PNG, JPG, SVG, or text-encoded `.png.b64`** file. Whatever you draw over gets revealed. `.png.b64` stores real PNG image bytes as base64 text for workflows that cannot accept binary files.

### Pixel (`templates/pixel/*.json`)
```json
{ "name":"Heart", "cols":14, "rows":14,
  "palette":["#ffffff","#ff5a5f","#c1121f"],
  "target":[[0,0,1,...],[...]] }
```
- `palette[0]` is always the empty/background color (white).
- `target` is optional. With it → color-by-number (numbers shown = palette index). Without it → free pixel play.

### Coloring (`templates/coloring/*.svg`)
An SVG where every fillable shape has `class="region"` and a starting `fill` (usually white), with black strokes for the outlines. Tapping a region sets its fill.

### Paint by Numbers (`templates/pbn/*.svg`)
Same as coloring, but each region also carries `data-number="N"` and `data-color="#hex"`. Numbers are drawn automatically at region centers (capped in size, and tucked into a corner for full-canvas background regions so they don't cover the art). Difficulty = number of regions/colors; tag each file with a `"level"` (`easy` / `medium` / `hard`) in the manifest and it shows up under that filter in the picker.

### Difficulty levels
Add `"level":"easy" | "medium" | "hard"` to any entry in `manifest.json` (any mode). When at least one entry in a mode has a level, the picker shows an All / Easy / Medium / Hard filter row. Entries with no level only appear under **All**.

See `HANDOVER.md` for the realistic plan on generating coloring/PBN templates at scale (ChatGPT alone won't do it cleanly).
