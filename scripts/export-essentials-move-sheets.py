"""Convert the user's 128x96 pixel-editor move frames to Essentials 5x5 cels."""
import json
import argparse
import re
from pathlib import Path

from PIL import Image, ImageColor

ROOT = Path(__file__).resolve().parents[1]
SHARED_ASSETS = ROOT / "assets" / "pixel-moves" / "shared.json"
COMPLETED_ASSETS = ROOT / "assets" / "pixel-moves" / "completed"
OUTPUT = ROOT / "rpg-maker-xp" / "action-animations" / "exports" / "moves"
CELL = 192
COLUMNS = ROWS = 5
SHEET_SIZE = CELL * COLUMNS
MOVES = {
    "ember": "Arena_Ember",
    "thundershock": "Arena_ThunderShock",
    "watergun": "Arena_WaterGun",
}
PALETTES = {
    "ember": ["#9c2921", "#e74921", "#ff8429", "#ffce52"],
    "thundershock": ["#b7b02e", "#dfe54b", "#ffffff", "#f1ff86"],
    "watergun": ["#294a9c", "#427be7", "#73bdff", "#ffffff"],
}


def nearest_color(source, palette):
    rgb = source[:3]
    return min(palette, key=lambda target: sum((rgb[i] - target[i]) ** 2 for i in range(3)))


def decode(asset, move_id):
    if asset.get("version") != 1 or asset.get("width") != 128 or asset.get("height") != 96:
        raise ValueError("Expected a version 1 128x96 pixel-editor document")
    palette = asset.get("palette")
    frames = asset.get("frames")
    if not isinstance(palette, list) or not palette or palette[0] is not None:
        raise ValueError("Palette index 0 must be transparent")
    if not isinstance(frames, list) or not 1 <= len(frames) <= COLUMNS * ROWS:
        raise ValueError("Frame count must be from 1 to 25")

    source_rgba = [(0, 0, 0, 0)]
    for color in palette[1:]:
        if not isinstance(color, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?", color):
            raise ValueError(f"Invalid palette color: {color!r}")
        source_rgba.append(ImageColor.getcolor(color, "RGBA"))
    target_rgba = [ImageColor.getcolor(color, "RGBA") for color in PALETTES[move_id]]

    decoded = []
    for frame in frames:
        runs = frame.get("runs")
        if not isinstance(runs, list) or len(runs) % 2:
            raise ValueError("Malformed run-length encoded frame")
        pixels = []
        for color_index, count in zip(runs[::2], runs[1::2]):
            if (not isinstance(color_index, int) or isinstance(color_index, bool)
                    or color_index < 0 or color_index >= len(source_rgba)
                    or not isinstance(count, int) or isinstance(count, bool)
                    or count < 1 or len(pixels) + count > 128 * 96):
                raise ValueError("Invalid color or run length in frame")
            if color_index == 0:
                pixels.extend([source_rgba[0]] * count)
            else:
                pixels.extend([nearest_color(source_rgba[color_index], target_rgba)] * count)
        if len(pixels) != 128 * 96:
            raise ValueError("Decoded frame is not exactly 128x96 pixels")
        frame_image = Image.new("RGBA", (128, 96))
        frame_image.putdata(pixels)
        decoded.append(frame_image)
    used = {pixel[:3] for frame in decoded for pixel in frame.getdata() if pixel[3]}
    for target in target_rgba:
        if target[:3] in used:
            continue
        best = None
        for frame_index, frame in enumerate(decoded):
            for y in range(frame.height):
                for x in range(frame.width):
                    source = frame.getpixel((x, y))
                    if not source[3]:
                        continue
                    distance = sum((source[i] - target[i]) ** 2 for i in range(3))
                    if best is None or distance < best[0]:
                        best = (distance, frame_index, x, y)
        if best:
            _, frame_index, x, y = best
            decoded[frame_index].putpixel((x, y), target)
            used.add(target[:3])
    return decoded


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", help="Essentials project folder")
    parser.add_argument("--only", choices=tuple(MOVES), help="Export only this move and preserve other manifest entries")
    parser.add_argument("--source", type=Path, help="Read move documents from this shared JSON file instead of the repository seed")
    args = parser.parse_args()
    project = Path(args.project).expanduser().resolve()
    game_file = project / "Game.rxproj"
    animation_dir = project / "Graphics" / "Animations"
    if not game_file.is_file() or not animation_dir.is_dir():
        raise SystemExit(f"Not an RPG Maker XP + Essentials project: {project}")

    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = OUTPUT / "essentials-move-sheets.json"
    if args.only and manifest.is_file():
        catalog = json.loads(manifest.read_text(encoding="utf-8"))
    else:
        catalog = {
            "format": "Pokémon Essentials v21.1 animation sheet",
            "cellSize": {"width": CELL, "height": CELL},
            "columns": COLUMNS,
            "rows": ROWS,
            "frameOrder": "row-major; use the corresponding pattern number in the Animation Editor",
            "assets": [],
        }

    source_file = args.source.expanduser().resolve() if args.source else SHARED_ASSETS
    if not source_file.is_file():
        raise SystemExit(f"Move source file not found: {source_file}")
    shared_moves = json.loads(source_file.read_text(encoding="utf-8")).get("moves", {})
    for move_id, name in MOVES.items():
        if args.only and move_id != args.only:
            continue
        source = source_file
        try:
            asset = shared_moves.get(move_id)
            if asset is None:
                source = COMPLETED_ASSETS / f"{move_id}.json"
                if not source.is_file():
                    raise SystemExit(f"Missing shared or completed user animation: {move_id}")
                asset = json.loads(source.read_text(encoding="utf-8"))
            frames = decode(asset, move_id)
        except (json.JSONDecodeError, ValueError) as exc:
            raise SystemExit(f"Cannot export {source.name}: {exc}") from exc

        sheet = Image.new("RGBA", (SHEET_SIZE, SHEET_SIZE), (0, 0, 0, 0))
        for index, frame in enumerate(frames):
            x = (index % COLUMNS) * CELL + (CELL - 128) // 2
            y = (index // COLUMNS) * CELL + (CELL - 96) // 2
            sheet.alpha_composite(frame, (x, y))

        out_file = animation_dir / f"{name}.png"
        sheet.save(out_file, optimize=True)
        if move_id == "thundershock":
            action_config_path = project / "Plugins" / "Lappet Opening" / "arena-action.json"
            action_config = json.loads(action_config_path.read_text(encoding="utf-8"))
            move_config = action_config.setdefault("moves", {}).setdefault("ArenaStudio_ThunderShock", {})
            move_config.update({
                "graphic": name,
                "frameWidth": CELL,
                "frameHeight": CELL,
                "frames": len(frames),
                "fps": asset["fps"],
                "pivotX": CELL // 2,
                "pivotY": CELL // 2,
            })
            action_config_path.write_text(json.dumps(action_config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        entry = {
            "id": move_id,
            "graphic": f"{name}.png",
            "frames": len(frames),
            "fps": asset["fps"],
            "patterns": list(range(len(frames))),
            "source": (str(source.relative_to(ROOT)).replace("\\", "/") if source.is_relative_to(ROOT)
                       else "local pixel-art API") + (f"#{move_id}" if source == source_file else ""),
        }
        if args.only:
            catalog["assets"] = [item for item in catalog.get("assets", []) if item.get("id") != move_id]
        catalog["assets"].append(entry)
        print(f"Exported {source.name}: {len(frames)} cels -> {out_file}")

    manifest.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote animation map: {manifest}")


if __name__ == "__main__":
    main()
