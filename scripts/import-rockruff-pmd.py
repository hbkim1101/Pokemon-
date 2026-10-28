"""Import original PMDCollab pixels and derive arena grounding metadata.

This copies PNG bytes unchanged. Coordinates, not resized frames, remove PMD's
baked-in travel so the arena remains responsible for moving the fighter.
"""
from pathlib import Path
import json
import shutil
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/pmd/0744'
GAME = ROOT / 'rpg-maker-xp/projects/MyPokemonGame'
TARGET = GAME / 'Graphics/Arena/0744'
ACTIONS = ('Idle', 'Walk', 'Shoot', 'Charge', 'Attack', 'Hurt')
CONFIG = GAME / 'Plugins/Lappet Opening/arena-action.json'


def import_sprites():
    source_info = json.loads((SOURCE / 'source.json').read_text(encoding='utf-8'))
    config = json.loads(CONFIG.read_text(encoding='utf-8'))
    xml = ET.parse(SOURCE / 'AnimData.xml')
    anchors, origins, rows = {}, {}, {}
    for action in ACTIONS:
        node = next(a for a in xml.findall('./Anims/Anim') if a.findtext('Name') == action)
        width, height = int(node.findtext('FrameWidth')), int(node.findtext('FrameHeight'))
        sheet = Image.open(SOURCE / f'{action}-Anim.png').convert('RGBA')
        shadow = Image.open(SOURCE / f'{action}-Shadow.png').convert('RGBA')
        assert sheet.size == shadow.size and sheet.height == height * 8
        assert sheet.width % width == 0
        anchors[action], origins[action] = [], []
        for row in range(8):
            row_anchors, row_origins = [], []
            for frame in range(sheet.width // width):
                box = (frame * width, row * height, (frame + 1) * width, (row + 1) * height)
                bounds = sheet.crop(box).getchannel('A').getbbox()
                assert bounds, (action, row, frame)
                markers = [(x, y) for y in range(height) for x in range(width)
                           if shadow.getpixel((frame * width + x, row * height + y)) == (255, 255, 255, 255)]
                assert len(markers) == 1, (action, row, frame, markers)
                # Bottom edge is the visible foot line; the shadow X is the
                # authored root, even when a tail makes the alpha bounds asymmetric.
                row_anchors.append(bounds[3])
                row_origins.append(markers[0][0])
            anchors[action].append(row_anchors)
            origins[action].append(row_origins)
        rows[action] = [r[0] for r in anchors[action]]

    backup = TARGET / 'source/generated-v1'
    if not backup.exists():
        backup.mkdir(parents=True)
        for name in ['AnimData.xml'] + [a + '.png' for a in ACTIONS]:
            old = TARGET / name
            if old.exists():
                shutil.copy2(old, backup / name)
    shutil.copy2(SOURCE / 'AnimData.xml', TARGET / 'AnimData.xml')
    for action in ACTIONS:
        shutil.copy2(SOURCE / f'{action}-Anim.png', TARGET / f'{action}.png')
    for key, value in [('anchors', rows), ('frameAnchors', anchors), ('frameOriginsX', origins)]:
        config.setdefault(key, {})['0744'] = value
    config.setdefault('rushFrames', {})['0744'] = {'prepare': 2, 'travel': 7, 'recover': 0}
    config.setdefault('spriteRevisions', {})['0744'] = 'pmd-grounded-2'
    config['moves']['ArenaStudio_RockThrow']['releaseFrame'] = 4
    # The black PMD offset marker is the head/mouth attachment point.
    offsets = Image.open(SOURCE / 'Shoot-Offsets.png').convert('RGBA')
    emitters = []
    for row in range(8):
        markers = [(x, y) for y in range(48) for x in range(40)
                   if offsets.getpixel((4 * 40 + x, row * 48 + y)) == (0, 0, 0, 255)]
        assert len(markers) == 1
        emitters.append(list(markers[0]))
    config.setdefault('spriteEmitters', {})['0744'] = {'cell': [40, 48], 'points': emitters}
    CONFIG.write_text(json.dumps(config, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (TARGET / 'CREDITS.md').write_text(
        '# Rockruff / 암멍이\n\n'
        'Sprite art: **baronessfaron**; earlier contribution: **JFain**.\n\n'
        'Source: https://github.com/PMDCollab/SpriteCollab/tree/' + source_info['commit'] + '/sprite/0744\n\n'
        'Licensed by the repository under CC BY-NC 4.0: https://creativecommons.org/licenses/by-nc/4.0/\n\n'
        'Original PNG pixels and animation XML are copied unchanged. The arena uses separate foot/origin '
        'metadata to keep poses grounded and removes the original motion offset already handled by game movement. '
        'Run `scripts/import-rockruff-pmd.py` to reproduce this import. Original credits and offset sheets are '
        'preserved in `assets/pmd/0744/`.\n', encoding='utf-8')
    print('Imported Rockruff: six distinct original 8-direction sheets; grounded anchors and mouth emitters.')


if __name__ == '__main__':
    import_sprites()
