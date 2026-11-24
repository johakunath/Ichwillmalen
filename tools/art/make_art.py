"""Generate picture variants with the local FLUX.2 klein and build contact sheets.

Run with ComfyUI's Python (3.12, has Pillow, numpy and scipy):

    "%USERPROFILE%\\AI projects Local\\ComfyUI\\.venv\\Scripts\\python.exe" tools/art/make_art.py gen tools/art/jobs/samples.json
    ... make_art.py sheet art-work/samples          # rebuild the sheets only (also for Codex pictures)
    ... make_art.py check art-work/samples/x_1.png  # line-art report: regions, tiny regions, grey

Jobs file: {"set": "samples", "variants": 2, "jobs": [{"id", "kind", "subject", "style"?, "width"?, "height"?}]}.
Output: art-work/<set>/<id>_<n>.png (work folder, not shipped, not in git). Existing files are
skipped, so an interrupted run can simply be started again. Line art is cleaned to pure black and
white after generation; the untouched FLUX picture is kept as <id>_<n>.raw.png.
See docs/IMAGE_PIPELINE.md for the styles and the acceptance rules.
"""
import json
import os
import sys
import time
import urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comfy_api as api  # noqa: E402
import run_flux_klein as flux  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORK = os.path.join(ROOT, "art-work")

NO_TEXT = " No text, no letters, no numbers, no logos, no watermark, no signature."
# One prompt frame per image type; {subject} comes from the jobs file. Keep these in step with docs/ART_BIBLE.md.
STYLES = {
    # Full-colour scenes (Zauberwasser, Bilderpuzzle, backgrounds, activity cards).
    "storybook": "A children's picture book illustration for preschoolers: {subject} "
                 "Bold clean dark-brown outlines, chunky rounded shapes, warm strong saturated colours, soft shading "
                 "with gentle highlights, friendly faces with big round eyes and happy smiles, rich detailed background, "
                 "bright sunny daylight, the whole scene fills the frame edge to edge. Vehicles are real-looking machines "
                 "without faces or eyes." + NO_TEXT,
    "painted": "A detailed, warm children's picture book painting for preschoolers: {subject} "
               "Soft gouache and coloured-pencil look, rich textures, strong cheerful saturated colours, warm sunny "
               "light, friendly faces with big round eyes and happy smiles, lots of small things to discover, "
               "the whole scene fills the frame edge to edge. Vehicles are real-looking machines without faces or eyes."
               + NO_TEXT,
    # Colouring pages (Bunte Bilder): cleaned to 1-bit afterwards.
    "lineart": "A black and white colouring book page for a four-year-old child: {subject} "
               "Thick, even, pure black outlines on a pure white background. Every shape is fully closed. Big simple "
               "areas to colour in, few small details. Line drawing only: no shading, no grey, no hatching, no "
               "textures, no solid black areas, no colour. Friendly faces with big round eyes." + NO_TEXT,
    # Single objects to cut out (Klebewelten stickers, Suchspaß sprites, vehicles for the pen activities).
    # Not called a "sticker" in the prompt: that word adds a white border and a drop shadow.
    "sticker": "A single cut-out picture book illustration for preschoolers: {subject} "
               "Seen from the side, the whole object is visible and centred with space around it. Bold clean "
               "dark-brown outlines, chunky rounded shapes, warm strong saturated colours, soft shading, friendly. "
               "Plain flat solid white background, no white border around the object, no ground, no shadow, nothing "
               "else in the picture. Vehicles have no faces or eyes." + NO_TEXT,
}
DEFAULT_STYLE = {"scene": "storybook", "lineart": "lineart", "sticker": "sticker"}
DEFAULT_SIZE = {"scene": (1536, 1024), "lineart": (1536, 1024), "sticker": (1024, 1024)}


def clean_lineart(path, out, threshold=150):
    """Pure black lines on pure white: removes grey shading and JPEG-like halos so flood fill has hard edges."""
    from PIL import Image
    grey = Image.open(path).convert("L")
    grey.point(lambda v: 0 if v < threshold else 255).convert("1").save(out, optimize=True)


def lineart_report(path, tiny=900):
    """Counts the areas a child can fill. Tiny areas (< `tiny` px at full size) are fiddly for a finger tap."""
    import numpy as np
    from PIL import Image
    from scipy import ndimage
    raw = np.asarray(Image.open(path).convert("L"))
    white = raw >= 150
    labels, count = ndimage.label(white)
    sizes = ndimage.sum(white, labels, range(1, count + 1))
    grey = float(((raw > 60) & (raw < 200)).mean())
    return {"regions": int((sizes >= tiny).sum()), "tiny": int(((sizes < tiny) & (sizes >= 12)).sum()),
            "largest_share": round(float(sizes.max() / white.sum()), 2) if count else 0,
            "black_share": round(float((~white).mean()), 3), "grey_share": round(grey, 3)}


def outputs(spec):
    folder = os.path.join(WORK, spec["set"])
    for job in spec["jobs"]:
        for n in range(1, int(job.get("variants", spec.get("variants", 2))) + 1):
            yield job, n, os.path.join(folder, "%s_%d.png" % (job["id"], n))


def wait_for_idle_gpu():
    """Another session may be running a 3D job on the same ComfyUI; FLUX and Pixal3D don't fit in 12 GB together."""
    told = False
    while api.server_up():
        queue = api.http("/queue")
        if not queue.get("queue_running") and not queue.get("queue_pending"):
            return
        if not told:
            print("ComfyUI is busy with another job; waiting for it to finish ...", flush=True)
            told = True
        time.sleep(10)


def generate(spec):
    folder = os.path.join(WORK, spec["set"])
    os.makedirs(folder, exist_ok=True)
    for attempt in range(4):
        missing = [(j, n, o) for j, n, o in outputs(spec) if not os.path.exists(o)]
        if not missing:
            break
        wait_for_idle_gpu()
        try:
            with api.comfy_server(os.path.join(folder, "comfy_server.log")):
                for job, n, out in missing:
                    kind = job.get("kind", "scene")
                    style = job.get("style", DEFAULT_STYLE[kind])
                    width, height = job.get("width", DEFAULT_SIZE[kind][0]), job.get("height", DEFAULT_SIZE[kind][1])
                    prompt = STYLES[style].format(subject=job["subject"])
                    started = time.time()
                    seed = int(job.get("seed", 100)) + n
                    entry = api.run(flux.build(prompt, [], width, height, seed, 4, "ichwillmalen"))
                    if kind == "lineart":
                        raw = out.replace(".png", ".raw.png")
                        api.copy_images(entry, [raw])
                        clean_lineart(raw, out)
                    else:
                        api.copy_images(entry, [out])
                    print("OK %s (%.0f s)" % (os.path.basename(out), time.time() - started), flush=True)
        except (urllib.error.URLError, ConnectionError, OSError) as error:
            print("ComfyUI went away (%s); retrying the missing pictures ..." % error, flush=True)
            time.sleep(8)
    left = [o for _, _, o in outputs(spec) if not os.path.exists(o)]
    print("ART DONE: %d missing" % len(left), flush=True)
    return not left


def sheet(folder, cols=4, cell=480):
    """Labelled JPEG contact sheets (sheet_1.jpg ...), eight pictures each, small enough to look at."""
    from PIL import Image, ImageDraw
    names = sorted(f for f in os.listdir(folder) if f.endswith(".png") and not f.endswith(".raw.png"))
    made = []
    for page, start in enumerate(range(0, len(names), cols * 2)):
        part = names[start:start + cols * 2]
        thumbs = []
        for name in part:
            image = Image.open(os.path.join(folder, name)).convert("RGB")
            image.thumbnail((cell, cell))
            thumbs.append((name, image))
        row_h = max(t.height for _, t in thumbs) + 30
        rows = (len(part) + cols - 1) // cols
        canvas = Image.new("RGB", (cols * (cell + 10) + 10, rows * row_h + 10), (40, 40, 40))
        draw = ImageDraw.Draw(canvas)
        for i, (name, thumb) in enumerate(thumbs):
            x, y = 10 + (i % cols) * (cell + 10), 10 + (i // cols) * row_h
            canvas.paste(thumb, (x, y))
            draw.text((x + 2, y + thumb.height + 6), name[:-4], fill=(255, 255, 255))
        out = os.path.join(folder, "sheet_%d.jpg" % (page + 1))
        canvas.save(out, quality=82)
        made.append(out)
    print("SHEETS: " + ", ".join(made))
    return made


def main():
    if len(sys.argv) < 3 or sys.argv[1] not in ("gen", "sheet", "check"):
        raise SystemExit(__doc__)
    command, target = sys.argv[1], sys.argv[2]
    if command == "gen":
        with open(target, encoding="utf-8") as f:
            spec = json.load(f)
        if "--only" in sys.argv:
            wanted = set(sys.argv[sys.argv.index("--only") + 1].split(","))
            spec["jobs"] = [j for j in spec["jobs"] if j["id"] in wanted]
        done = generate(spec)
        sheet(os.path.join(WORK, spec["set"]))
        sys.exit(0 if done else 1)
    if command == "sheet":
        sheet(target)
    if command == "check":
        for path in sys.argv[2:]:
            print(os.path.basename(path), json.dumps(lineart_report(path)))


if __name__ == "__main__":
    main()
