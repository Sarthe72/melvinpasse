from PIL import Image


def luminance(rgb):
    channels = [v / 255 for v in rgb]
    linear = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in channels]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def as_hex(rgb):
    return "#" + "".join(f"{value:02x}" for value in rgb)


def palette_from_logo(path):
    with Image.open(path) as image:
        image.thumbnail((160, 160))
        pixels = [
            p[:3]
            for p in image.convert("RGBA").getdata()
            if p[3] > 100 and min(p[:3]) < 235 and max(p[:3]) - min(p[:3]) > 16
        ]
    if not pixels:
        return {"primary": "#123f73", "secondary": "#d71920", "light": "#edf3fa"}
    sample = Image.new("RGB", (len(pixels), 1))
    sample.putdata(pixels)
    candidates = [
        color
        for _, color in sorted(
            sample.quantize(colors=8).convert("RGB").getcolors(8) or [], reverse=True
        )
    ]
    primary = next(
        (color for color in candidates if luminance(color) < 0.38), min(candidates, key=luminance)
    )
    if luminance(primary) > 0.45:
        primary = tuple(round(value * 0.55) for value in primary)
    secondary = max(candidates, key=lambda color: max(color) - min(color))
    light = tuple(round(value * 0.12 + 255 * 0.88) for value in primary)
    return {"primary": as_hex(primary), "secondary": as_hex(secondary), "light": as_hex(light)}
