"""Generate the raster PWA icons from the CV-Melvin visual identity."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "web" / "icons"
SCALE = 4

COLORS = {
    "brand_dark": "#315A44",
    "brand": "#7A9E87",
    "brand_soft": "#B8CCBE",
    "paper": "#F8F4EE",
}


def font(size: int) -> ImageFont.FreeTypeFont:
    candidates = (
        Path("C:/Windows/Fonts/arialbd.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    )
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default(size=size)


def draw_master() -> Image.Image:
    size = 512 * SCALE
    image = Image.new("RGB", (size, size), COLORS["brand_dark"])
    draw = ImageDraw.Draw(image)
    unit = SCALE

    draw.rounded_rectangle(
        (126 * unit, 68 * unit, 390 * unit, 444 * unit),
        radius=24 * unit,
        fill=COLORS["paper"],
    )
    draw.polygon(
        ((322 * unit, 68 * unit), (390 * unit, 136 * unit), (322 * unit, 136 * unit)),
        fill=COLORS["brand_soft"],
    )

    label_font = font(154 * unit)
    label = "CV"
    bounds = draw.textbbox((0, 0), label, font=label_font)
    label_width = bounds[2] - bounds[0]
    label_height = bounds[3] - bounds[1]
    draw.text(
        ((size - label_width) / 2, 267 * unit - label_height / 2 - bounds[1]),
        label,
        fill=COLORS["brand_dark"],
        font=label_font,
    )
    draw.rounded_rectangle(
        (173 * unit, 334 * unit, 339 * unit, 354 * unit),
        radius=10 * unit,
        fill=COLORS["brand"],
    )
    return image


def save_png(master: Image.Image, name: str, size: int) -> None:
    target = master.resize((size, size), Image.Resampling.LANCZOS)
    target.save(OUTPUT / name, optimize=True)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    master = draw_master()
    save_png(master, "icon-192.png", 192)
    save_png(master, "icon-512.png", 512)
    save_png(master, "icon-maskable-512.png", 512)
    save_png(master, "apple-touch-icon.png", 180)

    master.save(
        OUTPUT / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )


if __name__ == "__main__":
    main()
