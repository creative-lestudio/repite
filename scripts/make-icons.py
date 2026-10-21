"""Genera los iconos PNG de la PWA con la marca de Repite (círculo-sello blanco sobre azul)."""
import sys
from PIL import Image, ImageDraw

BLUE = (0x22, 0x55, 0xD6)
out = sys.argv[1] if len(sys.argv) > 1 else "public/icons"

def icon(size: int, maskable: bool) -> Image.Image:
    img = Image.new("RGB", (size, size), BLUE) if maskable else Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if not maskable:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=size // 4, fill=BLUE)
    r = size * (0.24 if maskable else 0.30)
    c = size / 2
    w = max(2, int(size * 0.075))
    d.ellipse([c - r, c - r, c + r, c + r], outline="white", width=w)
    d.line([(c, c - r * 0.6), (c, c), (c + r * 0.45, c + r * 0.3)], fill="white", width=w, joint="curve")
    return img

for size in (192, 512):
    icon(size, False).save(f"{out}/icon-{size}.png")
icon(512, True).save(f"{out}/icon-maskable-512.png")
icon(180, True).save(f"{out}/apple-touch-icon.png")
