# Handover — Drawing Playground

## Status
- **Free Draw**: complete, the most polished mode. Reuses the standalone app.
- **Water / Pixel / Coloring / PBN**: working v0 engines with one or two sample templates each. Logic is real; they have NOT been tested on a real tablet, only syntax-checked.

## Where to continue
Continue in **Claude Code on this repo**, with screenshots from the actual tablet. Feel-dependent things (pressure curves, watercolor opacity, reveal brush softness, palm rejection) are tuned by looking, not in chat. Run locally with:
```
python3 -m http.server 8000   # then open http://localhost:8000
```

## Known limits / next tasks
1. **Palm rejection (Free Draw)**: rule is "pen draws, fingers navigate". Verify on the device; some report a small touch contact patch. May need a stricter pen-only gate.
2. **Zoom-in sharpness (Free Draw)**: bitmap canvas, soft past ~2x. Vector would fix it but is a big change.
3. **Mirror + textured brushes**: draws 12x per stroke; may lag. Cap particle density when mirror is on.
4. **Pixel zoom**: large grids just shrink to fit; consider pinch-zoom for big templates.
5. **Coloring SVGs**: tap-fill is robust IF regions are clean separate shapes. Anti-aliased gaps between regions are fine (we fill shapes, not flood-fill pixels).
6. **Paint by Numbers — the real bottleneck**: templates need machine-readable region data (number + target color per shape). ChatGPT will NOT reliably produce this from a prompt. Plan:
   - Either hand-author simple SVGs to the documented format, or
   - Build a small **generator**: input image → posterize to N colors → vectorize regions (e.g., potrace per color) → assign numbers → emit SVG with `data-number`/`data-color`. This is its own mini-project and the right way to get 30+ clean templates.
7. Label placement in PBN uses `getBBox()` center — fine for blob-ish regions, off-center for L-shapes. Consider a polylabel/pole-of-inaccessibility for concave regions.

## Architecture
Multi-page static site (one HTML per mode) so a bug in one mode can't break the others, and each is easy to iterate independently. Shared template list in `templates/manifest.json`. No framework, no build step.
