# Drawing Playground

A calm, ad-free drawing app for a toddler using a Samsung S Pen on an Android tablet.
Pure static site — no build, no server code, no accounts, no tracking, no sounds/rewards.

## Modes
- **Free Draw** (`free.html`) — crayon / pencil / marker / watercolor / chalk / neon, 6 sizes, rainbow + mirror, stamps, eraser, pen-draws / fingers-zoom, tall pannable page, in-app album. Works fully offline (even from `file://`).
- **Water Magic** (`water.html`) — a hidden colored picture revealed where you paint.
- **Coloring Book** (`coloring.html`) — tap a region to fill it with the chosen color.
- **Pixel Art** (`pixel.html`) — color a grid; supports free play and color-by-number.
- **Paint by Numbers** (`pbn.html`) — pick a number, fill the matching regions.

## Deploy to GitHub Pages
1. Create a repo, push these files to the root (not inside a subfolder).
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Open `https://<user>.github.io/<repo>/`.

> Water / Coloring / Pixel / PBN load files via `fetch`, so they need to be **served** (GitHub Pages, or `python3 -m http.server` locally). Opening `index.html` straight from disk won't load templates. Free Draw is the exception — it works from `file://`.

## Add your own templates
Edit `templates/manifest.json` and drop files in `templates/<mode>/`.

### Water (`templates/water/*`)
Any colored **PNG, JPG, or SVG**. Whatever you draw over gets revealed. Easiest mode to fill with ChatGPT images.

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
Same as coloring, but each region also carries `data-number="N"` and `data-color="#hex"`. Numbers are drawn automatically at region centers. Difficulty = number of regions/colors; list easy/medium/hard as separate files with a `"level"` field.

See `HANDOVER.md` for the realistic plan on generating coloring/PBN templates at scale (ChatGPT alone won't do it cleanly).
