from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def main() -> None:
    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    files = sorted(
        [
            file
            for file in source.iterdir()
            if file.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
        ]
    )
    width = 420
    label_height = 34
    columns = 2
    thumbs = []
    for file in files:
        image = Image.open(file).convert("RGB")
        ratio = width / image.width
        image = image.resize((width, round(image.height * ratio)), Image.Resampling.LANCZOS)
        thumbs.append((file.name, image))

    cell_height = max(image.height for _, image in thumbs) + label_height
    rows = (len(thumbs) + columns - 1) // columns
    canvas = Image.new("RGB", (width * columns, cell_height * rows), "white")
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default()
    for index, (name, image) in enumerate(thumbs):
        x = (index % columns) * width
        y = (index // columns) * cell_height
        canvas.paste(image, (x, y))
        draw.text((x + 10, y + image.height + 9), name, fill="black", font=font)
    canvas.save(output, quality=90)


if __name__ == "__main__":
    main()
