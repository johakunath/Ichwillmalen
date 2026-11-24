# Image pipeline

How pictures for Ich will malen are made, checked and shipped. Written for any agent working in this repository: Claude Code makes the bulk locally with FLUX; **Codex takes the hard cases listed in [Codex hand-off](#codex-hand-off)**. Style rules and the list of subjects are in [ART_BIBLE.md](ART_BIBLE.md). The owner is not a programmer: run every command yourself and show him contact sheets to choose from.

## Principle

1. **Local first.** FLUX.2 klein 4B in the owner's ComfyUI (RTX 4070, 12 GB) is free, private and fast (10 to 25 seconds per picture at 1536×1024). Licence: Apache 2.0.
2. **Two variants per picture, the owner picks** from a contact sheet. Taste is his call.
3. **Codex only where FLUX keeps failing** after two prompt attempts. Ask the owner before using it; ChatGPT/Codex image generation uses his quota.
4. **One path for every picture**, whoever made it: work folder → contact sheet → pick → export → manifest and source record.

## Setup on this PC

- ComfyUI: `%USERPROFILE%\AI projects Local\ComfyUI` (override with `COMFYUI_DIR`). Models: `flux-2-klein-4b.safetensors`, `qwen_3_4b.safetensors`, `flux2-vae.safetensors`.
- Python: use ComfyUI's own, `ComfyUI\.venv\Scripts\python.exe` (3.12 with Pillow, numpy, scipy). The system Python is too old.
- Tools: `tools/art/` (`comfy_api.py` and `run_flux_klein.py` are copies from the `local-game-assets` skill; `make_art.py` is this project's batch tool).
- Work folder: `art-work/<set>/` is ignored by git and never shipped.

One GPU job at a time. `make_art.py` waits while the ComfyUI queue is busy (another session may be building a 3D model), reuses a running ComfyUI or starts one and stops it afterwards, and skips pictures that already exist, so a broken run is simply started again.

## Commands

```powershell
$py = "$env:USERPROFILE\AI projects Local\ComfyUI\.venv\Scripts\python.exe"
& $py tools/art/make_art.py gen tools/art/jobs/<set>.json            # make the missing variants, then the sheets
& $py tools/art/make_art.py gen tools/art/jobs/<set>.json --only id1,id2
& $py tools/art/make_art.py sheet art-work/<set>                     # rebuild sheet_1.jpg ... from all PNGs in the folder
& $py tools/art/make_art.py check art-work/<set>/<id>_1.png          # line-art numbers
```

A jobs file lists pictures by `id`, `kind` (`scene`, `lineart`, `sticker`) and `subject` (what is in the picture, in English, one or two sentences). The style text is added by `make_art.py` (`STYLES`), so every picture of a kind gets the same frame. To redo a picture, delete its PNG, change the subject or set a `seed`, and run `gen` again.

Look at results only through the sheets (`art-work/<set>/sheet_N.jpg`), never by loading full-size pictures into context.

## Image types

| Kind | Generate | Export | Goes to |
| --- | --- | --- | --- |
| Scene (Zauberwasser, Bilderpuzzle) | 1536×1024 | WebP quality 82, 1536×1024, about 200 to 350 KB | `templates/water/`, `templates/puzzle/` |
| Line art (Bunte Bilder) | 1536×1024, then cleaned to black and white | 1-bit PNG, 1536×1024, about 50 KB | `templates/coloring/` |
| Sticker or sprite | 1024×1024 on plain white | cut out, trimmed, transparent WebP, long side 512 px | `templates/stickers/`, `templates/find/sprites/` |
| World or stage background | 1536×960 (16:10) | WebP quality 82 | `templates/find/`, `templates/stickers/bg/` |
| Menu card | 1152×768 | WebP quality 85, 768×512 | `icons/cards/` |

The activities scale pictures to a 1100 px working canvas today, so larger exports do not help until that limit is raised.

## Acceptance checks

Every picture:

- No text, letters, numbers, logos or watermark anywhere (zoom into signs, number plates, vehicle doors and brick studs).
- No brand or known character. Bricks are generic.
- Hands, wheels and limbs are plausible: count wheels and legs.
- Friendly, nothing scary (see the art bible).
- The subject is not already used in another activity.

Line art, in addition (`make_art.py check`):

- `grey_share` is 0 after cleaning and the lines survived the clean-up (compare with the `.raw.png`). The clean-up also removes black dust and fills white pinholes inside line junctions.
- `regions` (areas of at least 30×30 px) is near the level budget: easy about 12, medium about 25, hard about 40. The approved fire engine sample has 38.
- `tiny` counts smaller areas. They are fine as decoration inside a part (ladder rungs, wheel hubs); they are a problem when a main part of the subject is made of them. Use the number to rank variants, not as a gate: the approved sample has about 80.
- `largest_share` is not close to 1: a very large share means the background leaks into the subject through an open outline.
- Final test in the app: tap-fill the main areas in Bunte Bilder; no fill may leak.

Stickers: complete object, clean cut-out edge with no white fringe on a dark background.

## Prompt lessons from the phase 0 samples

- **Dinosaur scenes, single vehicles and single objects on white work well** in the first or second variant.
- **Two machines that work together fuse into one** ("an excavator loads a dump truck" gave a truck with a digging arm). Describe them as separate: where each stands, "a few steps away and not touching", and what each one has (tracks, six wheels).
- **Name the parts of a vehicle.** "Fire engine" alone gave a van with a ladder. List cab, ladder, hose reel, blue lights, number of wheels.
- **Never write "no faces" or anything about vehicles into a style text.** In the first batch the sentence "vehicles are machines without faces" made FLUX add little trucks to almost every scene, even the dinosaur jungle, and put faces on some of them. FLUX has no negative prompt here: naming a thing invites it. Describe what is there instead, in the subject of the one picture that needs it ("the front of the locomotive is a plain round black boiler door with one lamp").
- **Trains, tugboats and brick toys get faces most often.** Give them a described plain front.
- **Round windows on a rocket turn into eyes.** Ask for one small porthole near the tip.
- **The word "sticker" adds a white border and a drop shadow.** The sticker style says "cut-out illustration" instead.
- **Line art comes out clean** (no grey after clean-up), but detailed machines blow the region budget: the dino-in-digger samples had 50 to 65 areas and over 250 tiny ones, mostly track links; the easy brick car had 13 areas. Ask for "tracks drawn as one smooth band" and "very simple, only a few big shapes", then run `check`.
- **Excavators sometimes get a second arm.** Count arms, buckets and wheels on the sheet.
- **Dinosaur anatomy drifts in line art.** The T-Rex grew wings, the Triceratops grew ears. Name the parts positively ("two very short arms held in front of its chest", "a big round bony neck shield") and make four variants instead of two for dinosaurs.
- **Signs and vans attract scrambled lettering** even with the no-text sentence. Ask for plain walls, plain awnings and plain vans, and zoom in before picking.

## Screen, repair and offer

Screen every batch yourself before the owner sees it; in the first batch about one picture in three had a flaw.

```powershell
& $py tools/art/make_art.py sheet art-work/water --match "_[34].png$"     # screen_N.jpg: only the new variants
& $py tools/art/make_art.py edit art-work/water/zug_5.png art-work/water/zug_7.png "the round front of the locomotive is a plain yellow disc with one lamp"
& $py tools/art/make_art.py picksheet tools/art/jobs/water.json W          # wahl_water_N.jpg for the owner
```

- **More variants:** raise `variants` on the job (new files get new seeds) and rewrite the subject. Dinosaurs and anything with a described pose need four to six.
- **Repair instead of regenerating** when a picture is good except for one thing: `edit` uses the picture itself as reference and changes one detail. It removed faces from trains, a second planet Earth and scrambled lettering on signs in one try each. Say what should be there afterwards, not what to remove. It can shift colours when the instruction is broad ("all vans ..."), so name the object.
- **Offer two:** per job, `show` lists the two variants to offer and `suggest` the one you would take. `picksheet` shows them as a and b under a number (A1, W3, P7) and the German name, with a green frame around the suggestion.

## Pick, export and retire

```powershell
& $py tools/art/make_art.py pick tools/art/jobs/water.json bagger=2 rakete-start=1   # the owner's choices, stored in the jobs file
& $py tools/art/make_art.py export tools/art/jobs/water.json                           # picked variants only
& $py tools/art/make_art.py retire templates/water/cat.svg templates/water/dino.svg    # hide from the pickers
```

`export` converts each picked variant to the format in the table above, writes it to the jobs file's `target.dir`, lists it first in the manifest section `target.section` (German `name`, `file`, `level`, `theme` from the job) and records it in `templates/SOURCES.md`. Running it again replaces the same entries. A Codex variant is picked by its suffix, for example `bagger=c1`.

`retire` sets `"retired": true` on manifest entries. The pickers skip retired pictures, but the files stay in the repository and in the offline cache, and a saved draft that points to one still opens.

After a batch: bump the cache version in `sw.js` and run `npm run check`.

## Codex hand-off

Codex gets the pictures FLUX is weak at. The list combines what the phase 0 samples showed (see [Prompt lessons](#prompt-lessons-from-the-phase-0-samples)) with known FLUX limits. **Update it after each batch with what actually failed.**

| Hard case | Why FLUX struggles | What to deliver |
| --- | --- | --- |
| The same character in several poses (mascot, Suchspaß regulars) | It redesigns the character in every run | One sheet per character, then single cut-outs |
| Top-down toy vehicles for Straßenmaler | Views drift to three-quarter | Strict top-down view, nose pointing right, on white |
| A set of stickers that must match exactly in outline weight and scale | Style and scale vary between runs | Sheets of 6 to 8 objects in one picture, sliced afterwards |
| Colouring pages that fail the region check twice (seen: excavators and other tracked or ladder vehicles) | Hundreds of tiny areas in tracks and ladders, extra machine parts | Clean closed line art within the region budget that passes `check` |
| Brick builds (towers, houses, brick vehicles) | Brick geometry comes out wrong (six-sided blocks, studs in odd places) | Correct rectangular bricks with plain round studs. Alternative to try first: render the build in Blender from boxes and cylinders and restyle it with FLUX using the render as reference |
| Wimmelbild worlds with planned hiding places | Composition cannot be directed precisely | 16:10 scene with the hiding places listed in the job |
| Anything with a specific pose or relation ("the dino sits in the cab and holds the lever") | Pose control is loose | The described pose, exactly |

### Contract for Codex

- Read [ART_BIBLE.md](ART_BIBLE.md) first. Use the style text of the matching kind from `STYLES` in `tools/art/make_art.py` word for word, and attach the matching approved samples from `docs/art-samples/` (scene, line art, sticker) as style references, so Codex pictures and FLUX pictures look like one hand.
- Take the subject and `id` from the jobs file; do not invent new subjects.
- Save PNGs to `art-work/<set>/<id>_c1.png` and `_c2.png` (the `c` marks Codex variants) at the generate size in the table above. Stickers on plain white, not transparent: the cut-out is done by the pipeline.
- Run `make_art.py sheet art-work/<set>` and, for line art, `make_art.py check`. Report the sheet paths and the check numbers.
- Do not edit `templates/manifest.json`, `sw.js` or app code, and do not commit anything from `art-work/`. Picking and exporting stay with the owner and the main session.
- Record the tool and model you used for each id in your report, for `templates/SOURCES.md`.
