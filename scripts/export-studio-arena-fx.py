"""Export RPG Maker animation sheets from the renderers used by studio.html."""
import json
import argparse
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "rpg-maker-xp" / "projects" / "MyPokemonGame"
ANIMATIONS = PROJECT / "Graphics" / "Animations"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--only', help='Export one named effect and preserve the other sheets')
    args = parser.parse_args()
    if not (PROJECT / "Game.rxproj").is_file():
        raise SystemExit(f"RPG Maker XP project not found: {PROJECT}")
    try:
        result = subprocess.run(
            ["node", str(ROOT / "scripts" / "export-studio-arena-fx.js")] + ([args.only] if args.only else []),
            cwd=ROOT, check=True, capture_output=True, text=True, encoding="utf-8",
        )
    except FileNotFoundError as error:
        raise SystemExit("Node.js is required; install Node.js and run this export again.") from error
    data = json.loads(result.stdout)
    ANIMATIONS.mkdir(parents=True, exist_ok=True)
    target = PROJECT / "Plugins" / "Lappet Opening" / "arena_fx_manifest.json"
    manifest = json.loads(target.read_text(encoding='utf-8')) if args.only and target.exists() else {"format": data["format"], "cellScale": 4, "assets": {}}
    for asset in data["assets"]:
        columns = 4
        rows = (len(asset["frames"]) + columns - 1) // columns
        sheet = Image.new("RGBA", (asset["width"] * columns, asset["height"] * rows), (0, 0, 0, 0))
        draw = ImageDraw.Draw(sheet)
        for frame_index, cells in enumerate(asset["frames"]):
            ox = (frame_index % columns) * asset["width"] + asset["pivot"]["x"]
            oy = (frame_index // columns) * asset["height"] + asset["pivot"]["y"]
            for x, y, color in cells:
                px, py = ox + x * asset["cellScale"], oy + y * asset["cellScale"]
                if 0 <= px < (frame_index % columns + 1) * asset["width"] and px >= (frame_index % columns) * asset["width"] and 0 <= py < (frame_index // columns + 1) * asset["height"] and py >= (frame_index // columns) * asset["height"]:
                    rgba = tuple(bytes.fromhex(color.lstrip("#")))
                    if len(rgba) == 3:
                        rgba += (255,)
                    draw.rectangle((px, py, px + asset["cellScale"] - 1, py + asset["cellScale"] - 1), fill=rgba)
        filename = asset["id"] + ".png"
        sheet.save(ANIMATIONS / filename, optimize=True)
        manifest["assets"][asset["id"]] = {
            "file": filename,
            "cellScale": asset["cellScale"],
            "frameWidth": asset["width"],
            "frameHeight": asset["height"],
            "frames": len(asset["frames"]),
            "fps": asset["fps"],
            "pivot": asset["pivot"],
            "palette": asset["palette"],
            "colorCount": len(asset["palette"]),
        }
        print(f"Exported {filename}: {len(asset['frames'])} frames at {asset['fps']} FPS")
    target.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {target}")


if __name__ == "__main__":
    main()
