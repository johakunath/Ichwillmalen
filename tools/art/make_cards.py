"""Home-screen card pictures (templates/cards/<activity>.webp), built from pictures the app already ships
so that each card shows what happens inside. Run with ComfyUI's Python after an export:

    ... python.exe tools/art/make_cards.py

The Malatelier card is a FLUX picture (tools/art/jobs/cards.json, variant 1 in art-work/cards/)."""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SIZE = (680, 252)  # the card picture area is about 2.7 : 1


def cover(image, size=SIZE):
    image = image.convert("RGB")
    scale = max(size[0] / image.width, size[1] / image.height)
    image = image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)
    left, top = (image.width - size[0]) // 2, (image.height - size[1]) // 2
    return image.crop((left, top, left + size[0], top + size[1]))


def open_(path):
    return Image.open(os.path.join(ROOT, path))


def paste(canvas, path, box, flip=False):
    """Pastes a cut-out fitted into box (x, y, width, height), standing on the box's bottom edge."""
    sticker = open_(path).convert("RGBA")
    if flip:
        sticker = sticker.transpose(Image.FLIP_LEFT_RIGHT)
    sticker.thumbnail((box[2], box[3]), Image.LANCZOS)
    canvas.paste(sticker, (box[0] + (box[2] - sticker.width) // 2, box[1] + box[3] - sticker.height), sticker)


def water():
    """Half of the picture is still under the pale cover, with a wiped edge."""
    scene = cover(open_("templates/water/langhals-fluss.webp"))
    pale = Image.blend(scene, Image.new("RGB", SIZE, (222, 235, 232)), 0.78)
    mask = Image.new("L", SIZE, 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle((0, 0, 250, SIZE[1]), fill=255)
    for y in range(-20, SIZE[1] + 40, 60):
        draw.ellipse((205, y, 305, y + 80), fill=255)
    draw.rectangle((0, 0, 250, SIZE[1]), fill=255)
    scene.paste(pale, (0, 0), mask)
    return scene


def coloring():
    """The T-Rex page with a few areas already filled."""
    page = open_("templates/coloring/trex.png").convert("RGB")
    for point, colour in (((780, 520), (120, 190, 90)), ((330, 880), (95, 150, 70)), ((1180, 870), (95, 150, 70)),
                          ((200, 200), (190, 225, 245))):
        if page.getpixel(point) == (255, 255, 255):
            ImageDraw.floodfill(page, point, colour)
    page.thumbnail((SIZE[0], SIZE[1] + 40), Image.LANCZOS)  # whole page, on the same blue as its sky
    canvas = Image.new("RGB", SIZE, (190, 225, 245))
    canvas.paste(page, ((SIZE[0] - page.width) // 2, SIZE[1] - page.height + 14))
    return canvas


def stickers():
    stage = cover(open_("templates/stages/lichtung.webp")).convert("RGBA")
    paste(stage, "templates/stickers/trex.webp", (140, 92, 150, 150))
    paste(stage, "templates/stickers/bagger.webp", (350, 105, 195, 140))
    paste(stage, "templates/stickers/flugsaurier.webp", (275, 4, 120, 78))
    return stage.convert("RGB")


def puzzle():
    """A four-piece puzzle with one piece pulled out."""
    scene = cover(open_("templates/puzzle/dino-picknick.webp"))
    canvas = Image.new("RGB", SIZE, (228, 229, 237))
    half = (SIZE[0] // 2, SIZE[1] // 2)
    for i, offset in enumerate(((0, 0), (0, 0), (0, 0), (26, 18))):
        x, y = (i % 2) * half[0], (i // 2) * half[1]
        piece = scene.crop((x, y, x + half[0], y + half[1])).resize((half[0] - 8, half[1] - 8), Image.LANCZOS)
        if i == 3:
            piece = piece.rotate(-7, expand=True, fillcolor=(228, 229, 237), resample=Image.BICUBIC)
        canvas.paste(piece, (x + 4 + offset[0], y + 4 + offset[1]))
    return canvas


def find():
    """A figure peeks out from behind a crate on the construction site."""
    world = cover(open_("templates/find/baustelle.webp")).convert("RGBA")
    paste(world, "templates/find/sprites/bau-hund.webp", (262, 62, 105, 105))
    paste(world, "templates/find/props/baustelle-kiste.webp", (265, 128, 135, 100))
    paste(world, "templates/find/sprites/bau-maulwurf.webp", (462, 112, 84, 84), flip=True)
    paste(world, "templates/find/props/baustelle-fass.webp", (440, 138, 78, 104))
    return world.convert("RGB")


def main():
    out = os.path.join(ROOT, "templates", "cards")
    os.makedirs(out, exist_ok=True)
    cards = {"free": cover(open_("art-work/cards/free_1.png")), "water": water(), "coloring": coloring(),
             "stickers": stickers(), "puzzle": puzzle(), "find": find()}
    for key, image in cards.items():
        image.save(os.path.join(out, key + ".webp"), quality=84, method=6)
    sheet = Image.new("RGB", (SIZE[0] * 3 + 40, SIZE[1] * 2 + 30), (40, 40, 40))
    for i, image in enumerate(cards.values()):
        sheet.paste(image, (10 + (i % 3) * (SIZE[0] + 10), 10 + (i // 3) * (SIZE[1] + 10)))
    sheet.save(os.path.join(ROOT, "art-work", "cards", "cards_sheet.jpg"), quality=85)
    print("CARDS: " + ", ".join(cards))


if __name__ == "__main__":
    main()
