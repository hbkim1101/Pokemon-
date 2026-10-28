"""Package Aseprite's transparent Bite frames for Pixel Lab and shared battle art."""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
ASSET_DIR = Path(__file__).resolve().parent
PNG = ASSET_DIR / "rockruff-bite-sheet.png"
JSON_OUT = ASSET_DIR / "rockruff-bite.json"
JS_OUT = ROOT / "rockruff-bite-art.js"
SEED = ROOT / "assets" / "pixel-moves" / "shared.json"
PALETTE = [None, "#241d2d", "#603344", "#a64d48", "#e69b55", "#fff0c6"]
WIDTH, HEIGHT, FRAME_COUNT, FPS = 128, 96, 12, 12


def encode(values):
    output = []
    last, count = values[0], 0
    for value in values:
        if value == last:
            count += 1
        else:
            output.extend((last, count))
            last, count = value, 1
    output.extend((last, count))
    return output


def main():
    sheet = Image.open(PNG).convert("RGBA")
    if sheet.size != (WIDTH * FRAME_COUNT, HEIGHT):
        raise ValueError(f"Unexpected Aseprite sheet size: {sheet.size}")
    indices = {tuple(bytes.fromhex(color[1:])) + (255,): index for index, color in enumerate(PALETTE[1:], 1)}
    frames = []
    for frame_number in range(FRAME_COUNT):
        pixels = []
        frame = sheet.crop((frame_number * WIDTH, 0, (frame_number + 1) * WIDTH, HEIGHT))
        for pixel in frame.getdata():
            if pixel[3] == 0:
                pixels.append(0)
            elif pixel not in indices:
                raise ValueError(f"Unexpected color in frame {frame_number + 1}: {pixel}")
            else:
                pixels.append(indices[pixel])
        frames.append({"runs": encode(pixels)})
    asset = {
        "version": 1,
        "id": "bite",
        "width": WIDTH,
        "height": HEIGHT,
        "anchor": {"x": 64, "y": 48},
        "fps": FPS,
        "palette": PALETTE,
        "frames": frames,
    }
    JSON_OUT.write_text(json.dumps(asset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    JS_OUT.write_text(
        "/* Generated from the Aseprite project in assets/pixel-moves/rockruff-bite. */\n"
        "(function(root){'use strict';root.ArenaPixelPresets=root.ArenaPixelPresets||{};"
        f"root.ArenaPixelPresets.bite={json.dumps(asset, separators=(',', ':'))};"
        "})(typeof window==='undefined'?globalThis:window);\n",
        encoding="utf-8",
    )
    seed = json.loads(SEED.read_text(encoding="utf-8"))
    seed.setdefault("moves", {})["bite"] = asset
    SEED.write_text(json.dumps(seed, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Packaged {FRAME_COUNT} Aseprite frames; palette={len(PALETTE) - 1} colors; anchor=(64,48)")


if __name__ == "__main__":
    main()
