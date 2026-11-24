"""Generate picture variants with the local FLUX.2 klein and build contact sheets.

Run with ComfyUI's Python (3.12, has Pillow, numpy and scipy):

    "%USERPROFILE%\\AI projects Local\\ComfyUI\\.venv\\Scripts\\python.exe" tools/art/make_art.py gen tools/art/jobs/samples.json
    ... make_art.py sheet art-work/samples          # rebuild the sheets only (also for Codex pictures)
    ... make_art.py sheet art-work/water --match "_[34].png$"   # screen_N.jpg with only the matching files
    ... make_art.py check art-work/samples/x_1.png  # line-art report: regions, tiny regions, grey
    ... make_art.py clean art-work/coloring         # redo the line-art clean-up from the .raw.png files
    ... make_art.py edit art-work/water/a_2.png art-work/water/a_7.png "the sign is a plain green board"   # small repair
    ... make_art.py edit art-work/coloring/a_2.raw.png art-work/coloring/a_7.raw.png "..."   # line art: edit the .raw.png, a_7.png is cleaned for you
    ... make_art.py picksheet tools/art/jobs/water.json W   # owner sheets: variants side by side, numbered W1, W2 ...
    ... make_art.py pick tools/art/jobs/water.json bagger=2 rakete-start=b   # note the owner's choices (variant number, or a/b from the sheet)
    ... make_art.py export tools/art/jobs/water.json   # picked variants -> templates/, manifest, SOURCES.md
    ... make_art.py retire templates/water/cat.svg ...  # hide old pictures from the pickers (files stay)

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
# Never mention vehicles or faces in a style frame, not even as "no faces": FLUX then adds little trucks to
# every scene and puts faces on them. Describe a plain front (grille, lamp) in the subject of a vehicle job instead.
# One prompt frame per image type; {subject} comes from the jobs file. Keep these in step with docs/ART_BIBLE.md.
STYLES = {
    # Full-colour scenes (Zauberwasser, Bilderpuzzle, backgrounds, activity cards). Style A, approved 2026-11-24.
    "storybook": "A children's picture book illustration for preschoolers: {subject} "
                 "Bold clean dark-brown outlines, chunky rounded shapes, warm strong saturated colours, soft shading "
                 "with gentle highlights, friendly faces with big round eyes and happy smiles, rich detailed background, "
                 "bright sunny daylight, the whole scene fills the frame edge to edge." + NO_TEXT,
    # Colouring pages (Bunte Bilder): cleaned to 1-bit afterwards.
    "lineart": "A black and white colouring book page for a four-year-old child: {subject} "
               "Clear, thick, even, pure black outlines on a pure white background. Every shape is fully closed. Big simple "
               "areas to colour in, few small details. Line drawing only: no shading, no grey, no hatching, no "
               "textures, no solid black areas, no colour. Friendly faces with big round eyes." + NO_TEXT,
    # Single objects to cut out (Klebewelten stickers, Suchspaß sprites, vehicles for the pen activities).
    # Not called a "sticker" in the prompt: that word adds a white border and a drop shadow.
    "sticker": "A single cut-out picture book illustration for preschoolers: {subject} "
               "Seen from the side, the whole object is visible and centred with space around it. Bold clean "
               "dark-brown outlines, chunky rounded shapes, warm strong saturated colours, soft shading, friendly. "
               "Plain flat solid white background, no white border around the object, no ground, no shadow, nothing "
               "else in the picture." + NO_TEXT,
}
DEFAULT_STYLE = {"scene": "storybook", "lineart": "lineart", "sticker": "sticker"}
DEFAULT_SIZE = {"scene": (1536, 1024), "lineart": (1536, 1024), "sticker": (1024, 1024)}


def clean_lineart(path, out, threshold=150, thicken=2, speck=40, pinhole=140):
    """Pure black lines on pure white, so flood fill has hard edges: removes grey shading and halos,
    thickens every line by `thicken` px on each side (clear lines, and hairline gaps close),
    drops black dust smaller than `speck` px and fills white pinholes smaller than `pinhole` px
    (gaps inside line junctions that no finger could ever hit)."""
    import numpy as np
    from PIL import Image
    from scipy import ndimage
    def small(mask, limit):
        labels, count = ndimage.label(mask)
        if not count:
            return np.zeros_like(mask)
        sizes = ndimage.sum(mask, labels, range(1, count + 1))
        return np.isin(labels, 1 + np.flatnonzero(sizes < limit))

    white = np.asarray(Image.open(path).convert("L")) >= threshold
    white = white | small(~white, speck)
    if thicken:
        white = ~ndimage.binary_dilation(~white, iterations=thicken)
    white = white & ~small(white, pinhole)
    Image.fromarray((white * 255).astype("uint8")).convert("1").save(out, optimize=True)


def cutout(path, out, size=512, white=232, margin=10):
    """Sticker with a transparent background: removes the white that is connected to the picture edge
    (white inside the dark outline, like an ambulance body, stays), trims to the figure and fits it into `size` px."""
    import numpy as np
    from PIL import Image, ImageFilter
    from scipy import ndimage
    image = Image.open(path).convert("RGB")
    light = np.asarray(image).min(axis=2) >= white
    labels, _ = ndimage.label(light)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    outside = np.isin(labels, edge[edge > 0])
    outside = ndimage.binary_dilation(outside, iterations=2)  # eat the pale halo around the outline
    alpha = Image.fromarray((~outside * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(0.8))
    image.putalpha(alpha)
    box = Image.fromarray((~outside * 255).astype("uint8")).getbbox()
    box = (max(0, box[0] - margin), max(0, box[1] - margin), min(image.width, box[2] + margin), min(image.height, box[3] + margin))
    image = image.crop(box)
    image.thumbnail((size, size), Image.LANCZOS)
    image.save(out, quality=88, method=6)


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


def sheet(folder, cols=4, cell=480, match=None):
    """Labelled JPEG contact sheets (sheet_1.jpg ...), eight pictures each, small enough to look at."""
    from PIL import Image, ImageDraw
    import re
    names = sorted(f for f in os.listdir(folder) if f.endswith(".png") and not f.endswith(".raw.png")
                   and (not match or re.search(match, f)))
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
        out = os.path.join(folder, "%s_%d.jpg" % ("screen" if match else "sheet", page + 1))
        canvas.save(out, quality=82)
        made.append(out)
    print("SHEETS: " + ", ".join(made))
    return made


def picksheet(jobs_path, letter, cell=470, per_sheet=6):
    """Sheets for the owner: two variants of a picture side by side (a and b) under a number and its German name.
    A job's "show" lists the two variants to offer (default [1, 2]), "suggest" (variant number) gets a green frame; "redo": true marks pictures still being reworked."""
    from PIL import Image, ImageDraw, ImageFont
    with open(jobs_path, encoding="utf-8") as f:
        spec = json.load(f)
    folder = os.path.join(WORK, spec["set"])
    try:
        bold = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 26)
    except OSError:
        bold = ImageFont.load_default()
    pad, cap, made = 12, 44, []
    for page, start in enumerate(range(0, len(spec["jobs"]), per_sheet)):
        part = spec["jobs"][start:start + per_sheet]
        height = round(cell * 2 / 3)
        rows = (len(part) + 1) // 2
        canvas = Image.new("RGB", (4 * (cell + pad) + pad + 16, rows * (height + cap + pad) + pad), (250, 246, 236))
        draw = ImageDraw.Draw(canvas)
        for i, job in enumerate(part):
            x0 = pad + (i % 2) * (2 * (cell + pad) + 16)
            y0 = pad + (i // 2) * (height + cap + pad)
            draw.text((x0, y0 + 6), "%s%d  %s%s" % (letter, start + i + 1, job.get("name", job["id"]),
                                                    "  (wird noch verbessert)" if job.get("redo") else ""),
                      fill=(40, 40, 40), font=bold)
            for slot, n in enumerate(job.get("show", [1, 2])[:2]):
                file = os.path.join(folder, "%s_%s.png" % (job["id"], n))
                x = x0 + slot * (cell + pad // 2)
                if os.path.exists(file):
                    image = Image.open(file).convert("RGB")
                    image.thumbnail((cell, height))
                    canvas.paste(image, (x, y0 + cap))
                if job.get("suggest") == n:
                    draw.rectangle((x - 4, y0 + cap - 4, x + cell + 3, y0 + cap + height + 3), outline=(30, 150, 60), width=6)
                draw.rectangle((x, y0 + cap, x + 38, y0 + cap + 38), fill=(255, 255, 255))
                draw.text((x + 11, y0 + cap + 4), "ab"[slot], fill=(40, 40, 40), font=bold)
        out = os.path.join(folder, "wahl_%s_%d.jpg" % (spec["set"], page + 1))
        canvas.save(out, quality=84)
        made.append(out)
    print("PICK SHEETS: " + ", ".join(made))
    return made


def edit(triples, seed=7):
    """Small repairs with FLUX using the picture itself as reference: (source, output, instruction) triples.
    Say what should be there afterwards ("the sign is a plain green board"), not what to remove."""
    from PIL import Image
    with api.comfy_server(os.path.join(WORK, "comfy_server.log")):
        for source, out, instruction in triples:
            width, height = Image.open(source).size
            ref = api.upload(source)
            prompt = "The picture in image 1, unchanged in style, colours and composition, with one change: " + instruction
            entry = api.run(flux.build(prompt, [ref], width, height, seed, 4, "ichwillmalen_edit"))
            api.copy_images(entry, [out])
            if out.endswith(".raw.png"):  # line art: repair the raw picture, then clean it like a generated one
                clean_lineart(out, out.replace(".raw.png", ".png"))
            print("EDITED " + os.path.basename(out), flush=True)


MANIFEST = os.path.join(ROOT, "templates", "manifest.json")
SOURCES = os.path.join(ROOT, "templates", "SOURCES.md")
SOURCES_HEAD = ("# Picture sources\n\nEvery picture added through `tools/art/make_art.py export`. "
                "Older pictures in these folders were made with ChatGPT image generation or drawn as SVG by hand.\n\n"
                "| File | Made with | Date | Job |\n| --- | --- | --- | --- |\n")
MADE_WITH = {"": "FLUX.2 klein 4B, local ComfyUI (Apache 2.0)", "c": "ChatGPT image generation via Codex"}


def read_manifest():
    with open(MANIFEST, encoding="utf-8") as f:
        return json.load(f)


def write_manifest(manifest):
    """One entry per line, like the hand-written file, so diffs stay readable."""
    parts = []
    for section, items in manifest.items():
        rows = ",\n".join("    " + json.dumps(i, ensure_ascii=False, separators=(",", ":")) for i in items)
        parts.append("  %s: [\n%s\n  ]" % (json.dumps(section), rows))
    with open(MANIFEST, "w", encoding="utf-8", newline="\n") as f:
        f.write("{\n" + ",\n".join(parts) + "\n}\n")


def note_source(file, made_with, job):
    lines = open(SOURCES, encoding="utf-8").read() if os.path.exists(SOURCES) else SOURCES_HEAD
    lines = "".join(l for l in lines.splitlines(True) if not l.startswith("| `%s` |" % file))
    with open(SOURCES, "w", encoding="utf-8", newline="\n") as f:
        f.write(lines + "| `%s` | %s | %s | %s |\n" % (file, made_with, time.strftime("%Y-%m-%d"), job))


def pick(jobs_path, choices):
    with open(jobs_path, encoding="utf-8") as f:
        spec = json.load(f)
    by_id = {j["id"]: j for j in spec["jobs"]}
    for choice in choices:
        job_id, variant = choice.rsplit("=", 1)
        if job_id not in by_id:
            raise SystemExit("Unknown id: " + job_id)
        if variant in ("a", "b"):  # the letters on the pick sheet: left and right picture
            variant = str(by_id[job_id].get("show", [1, 2])["ab".index(variant)])
        if not os.path.exists(os.path.join(WORK, spec["set"], "%s_%s.png" % (job_id, variant))):
            raise SystemExit("No such variant: %s_%s.png" % (job_id, variant))
        by_id[job_id]["pick"] = int(variant) if variant.isdigit() else variant
    with open(jobs_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(spec, indent=2, ensure_ascii=False) + "\n")
    print("PICKED: %d of %d" % (sum("pick" in j for j in spec["jobs"]), len(spec["jobs"])))


def export(jobs_path):
    """Writes every picked variant to its target folder and lists it first in its manifest section."""
    from PIL import Image
    with open(jobs_path, encoding="utf-8") as f:
        spec = json.load(f)
    target = spec["target"]  # {"section": "water", "dir": "templates/water"}
    manifest, entries = read_manifest(), []
    os.makedirs(os.path.join(ROOT, target["dir"]), exist_ok=True)
    for job in spec["jobs"]:
        if "pick" not in job:
            continue
        kind, variant = job.get("kind", "scene"), str(job["pick"])
        source = os.path.join(WORK, spec["set"], "%s_%s.png" % (job["id"], variant))
        width, height = job.get("width", DEFAULT_SIZE[kind][0]), job.get("height", DEFAULT_SIZE[kind][1])
        if kind == "lineart":
            file = "%s/%s.png" % (target["dir"], job["id"])
            raw = source.replace(".png", ".raw.png")
            if os.path.exists(raw):
                clean_lineart(raw, source)
            image = Image.open(source)
            if image.size != (width, height):
                image = image.convert("L").resize((width, height), Image.LANCZOS).point(lambda v: 0 if v < 128 else 255)
            image.convert("1").save(os.path.join(ROOT, file), optimize=True)
        elif kind == "sticker":
            file = "%s/%s.webp" % (target["dir"], job["id"])
            cutout(source, os.path.join(ROOT, file))
        else:
            file = "%s/%s.webp" % (target["dir"], job["id"])
            image = Image.open(source).convert("RGB")
            if image.size != (width, height):
                image = image.resize((width, height), Image.LANCZOS)
            image.save(os.path.join(ROOT, file), quality=82, method=6)
        entry = {"name": job.get("name", job["id"]), "file": file}
        entry.update({k: job[k] for k in ("level", "theme") if k in job})
        entries.append(entry)
        note_source(file, MADE_WITH["c" if variant.startswith("c") else ""], "%s: %s" % (os.path.basename(jobs_path), job["id"]))
    files = {e["file"] for e in entries}
    manifest[target["section"]] = entries + [i for i in manifest.get(target["section"], []) if i["file"] not in files]
    write_manifest(manifest)
    size = sum(os.path.getsize(os.path.join(ROOT, f)) for f in files)
    print("EXPORTED: %d pictures to %s (%d KB)" % (len(entries), target["dir"], size // 1024))


def retire(files):
    manifest, wanted, found = read_manifest(), set(files), set()
    for items in manifest.values():
        for item in items:
            if item["file"] in wanted:
                item["retired"] = True
                found.add(item["file"])
    write_manifest(manifest)
    print("RETIRED: %d%s" % (len(found), "" if found == wanted else "; not in the manifest: " + ", ".join(sorted(wanted - found))))


def main():
    if len(sys.argv) < 3 or sys.argv[1] not in ("gen", "sheet", "check", "clean", "edit", "pick", "picksheet", "export", "retire"):
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
        sheet(target, match=sys.argv[sys.argv.index("--match") + 1] if "--match" in sys.argv else None)
    if command == "check":
        for path in sys.argv[2:]:
            print(os.path.basename(path), json.dumps(lineart_report(path)))
    if command == "clean":
        for name in sorted(os.listdir(target)):
            if name.endswith(".raw.png"):
                clean_lineart(os.path.join(target, name), os.path.join(target, name.replace(".raw.png", ".png")))
    if command == "pick":
        pick(target, sys.argv[3:])
    if command == "edit":
        rest = sys.argv[2:]
        edit([tuple(rest[i:i + 3]) for i in range(0, len(rest), 3)])
    if command == "picksheet":
        picksheet(target, sys.argv[3] if len(sys.argv) > 3 else "")
    if command == "export":
        export(target)
    if command == "retire":
        retire(sys.argv[2:])


if __name__ == "__main__":
    main()
