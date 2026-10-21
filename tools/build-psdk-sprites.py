#!/usr/bin/env python3
"""Build PSDK character sheets, battlers, and icons for the Mint League.

Pokémon Studio does not draw pixels. It registers the sheets PSDK's
Sprite_Character reads: width/4 by height/4, rows down, left, right, up
(directions 2, 4, 6, 8). These files are original silhouettes in that layout.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / 'psdk' / 'graphics'
CELL = 32
DIRS = ('down', 'left', 'right', 'up')

SPECIES = [
    ('bulbasaur', 'sprout', (106, 186, 92), (92, 64, 138), (70, 120, 60)),
    ('ivysaur', 'sprout', (92, 170, 96), (214, 92, 122), (60, 110, 64)),
    ('venusaur', 'flower', (78, 150, 86), (232, 120, 150), (48, 96, 58)),
    ('charmander', 'lizard', (240, 128, 72), (255, 196, 64), (180, 70, 40)),
    ('charmeleon', 'lizard', (220, 96, 52), (255, 150, 40), (140, 48, 32)),
    ('charizard', 'dragon', (232, 112, 58), (96, 168, 214), (120, 52, 36)),
    ('squirtle', 'turtle', (120, 186, 214), (232, 168, 92), (70, 120, 150)),
    ('wartortle', 'turtle', (96, 150, 196), (240, 176, 96), (48, 90, 130)),
    ('blastoise', 'cannon', (86, 132, 186), (196, 206, 214), (40, 72, 110)),
    ('caterpie', 'bug', (118, 176, 72), (232, 96, 72), (70, 110, 40)),
    ('metapod', 'cocoon', (120, 176, 86), (86, 140, 64), (70, 100, 48)),
    ('butterfree', 'moth', (150, 176, 214), (92, 86, 160), (240, 240, 246)),
    ('pidgey', 'bird', (214, 176, 120), (232, 96, 86), (120, 86, 60)),
    ('pidgeotto', 'bird', (196, 140, 86), (214, 72, 64), (96, 64, 42)),
    ('pidgeot', 'bird', (176, 120, 72), (232, 196, 72), (80, 52, 36)),
    ('rattata', 'rat', (196, 150, 214), (120, 72, 140), (240, 180, 190)),
    ('raticate', 'rat', (176, 120, 92), (96, 56, 48), (220, 160, 120)),
    ('pikachu', 'mouse', (246, 208, 72), (232, 96, 64), (255, 236, 140)),
    ('raichu', 'mouse', (240, 176, 64), (255, 236, 120), (176, 96, 40)),
    ('sandshrew', 'armor', (232, 196, 120), (176, 132, 72), (120, 86, 48)),
    ('sandslash', 'armor', (214, 168, 86), (120, 86, 48), (86, 60, 36)),
    ('oddish', 'plant', (96, 168, 86), (232, 96, 120), (60, 110, 60)),
    ('gloom', 'plant', (150, 120, 176), (232, 140, 64), (90, 64, 110)),
    ('vileplume', 'flower', (92, 150, 96), (214, 72, 96), (48, 90, 56)),
    ('psyduck', 'duck', (246, 214, 86), (240, 240, 232), (176, 140, 48)),
    ('golduck', 'duck', (86, 132, 196), (240, 220, 96), (40, 72, 120)),
    ('poliwag', 'frog', (120, 168, 214), (246, 246, 250), (48, 96, 140)),
    ('poliwhirl', 'frog', (96, 150, 206), (246, 246, 250), (40, 80, 130)),
    ('machop', 'fighter', (214, 176, 140), (96, 72, 160), (140, 100, 72)),
    ('machoke', 'fighter', (196, 150, 112), (72, 56, 140), (110, 72, 48)),
    ('geodude', 'rock', (150, 140, 120), (96, 86, 72), (70, 64, 52)),
    ('graveler', 'rock', (130, 122, 108), (86, 78, 64), (56, 50, 42)),
    ('voltorb', 'orb', (214, 64, 56), (246, 246, 246), (120, 32, 32)),
    ('electrode', 'orb', (232, 72, 64), (246, 246, 246), (90, 24, 28)),
    ('gastly', 'ghost', (120, 86, 160), (60, 40, 90), (180, 140, 214)),
    ('haunter', 'ghost', (150, 96, 186), (48, 32, 80), (210, 160, 230)),
    ('mewtwo', 'psychic', (214, 176, 206), (120, 86, 160), (96, 64, 120)),
]


def blank(w, h):
    return Image.new('RGBA', (w, h), (0, 0, 0, 0))


def shift_for(facing, frame):
    lean = (-1, 0, 1, 3)[frame]
    if facing == 'left':
        return -lean, 0
    if facing == 'right':
        return lean, 0
    if facing == 'up':
        return 0, -max(0, lean // 2)
    return 0, max(0, lean // 2)


def draw_creature(shape, body, accent, dark, facing, frame):
    image = blank(CELL, CELL)
    draw = ImageDraw.Draw(image)
    dx, dy = shift_for(facing, frame)
    cx, cy = 16 + dx, 18 + dy
    draw.ellipse((cx - 6, 26, cx + 6, 30), fill=(0, 0, 0, 60))
    bob = (0, -1, 0, -1)[frame]

    def blob(x, y, r, color):
        draw.ellipse((x - r, y - r + bob, x + r, y + r + bob), fill=color + (255,))

    def eyes(x, y):
        if facing == 'up':
            return
        ink = (28, 24, 32, 255)
        if facing == 'left':
            draw.point((x - 3, y), fill=ink)
        elif facing == 'right':
            draw.point((x + 3, y), fill=ink)
        else:
            draw.point((x - 3, y), fill=ink)
            draw.point((x + 3, y), fill=ink)

    if shape == 'sprout':
        blob(cx, cy, 7, body)
        draw.polygon([(cx, cy - 14 + bob), (cx - 5, cy - 6 + bob), (cx + 5, cy - 6 + bob)], fill=accent + (255,))
        eyes(cx, cy - 1)
    elif shape == 'flower':
        blob(cx, cy + 1, 8, body)
        for angle in range(0, 360, 60):
            ox = int(round(__import__('math').cos(angle * 3.14159 / 180) * 6))
            oy = int(round(__import__('math').sin(angle * 3.14159 / 180) * 5))
            blob(cx + ox, cy - 8 + oy, 3, accent)
        blob(cx, cy - 8, 3, (246, 220, 80))
        eyes(cx, cy)
    elif shape == 'lizard':
        draw.polygon([(cx - 4, cy + 6), (cx + 4, cy + 6), (cx + 8, cy + 2), (cx - 2, cy - 8)], fill=body + (255,))
        draw.polygon([(cx - 2, cy + 4), (cx - 10, cy + 8), (cx - 4, cy + 1)], fill=accent + (255,))
        eyes(cx + 1, cy - 4)
    elif shape == 'dragon':
        draw.polygon([(cx - 8, cy), (cx + 8, cy - 2), (cx + 4, cy + 8), (cx - 6, cy + 7)], fill=body + (255,))
        draw.polygon([(cx - 2, cy - 2), (cx + 6, cy - 12), (cx + 2, cy - 1)], fill=accent + (255,))
        draw.polygon([(cx - 8, cy - 2), (cx - 2, cy - 10), (cx, cy)], fill=accent + (255,))
        eyes(cx + 2, cy - 1)
    elif shape == 'turtle':
        blob(cx, cy + 1, 7, accent)
        blob(cx, cy + 2, 4, body)
        draw.ellipse((cx - 3, cy - 8 + bob, cx + 4, cy - 2 + bob), fill=body + (255,))
        eyes(cx, cy - 5)
    elif shape == 'cannon':
        blob(cx, cy + 1, 8, body)
        draw.rectangle((cx - 10, cy - 2, cx - 4, cy + 2), fill=accent + (255,))
        draw.rectangle((cx + 4, cy - 2, cx + 10, cy + 2), fill=accent + (255,))
        eyes(cx, cy - 2)
    elif shape == 'bug':
        blob(cx, cy + 2, 5, body)
        blob(cx, cy - 4, 3, accent)
        draw.line((cx - 4, cy - 6, cx - 8, cy - 10), fill=dark + (255,))
        draw.line((cx + 4, cy - 6, cx + 8, cy - 10), fill=dark + (255,))
        eyes(cx, cy - 4)
    elif shape == 'cocoon':
        draw.polygon([(cx, cy - 10), (cx + 6, cy), (cx, cy + 10), (cx - 6, cy)], fill=body + (255,))
        draw.line((cx - 3, cy - 2, cx + 3, cy - 2), fill=dark + (255,))
    elif shape == 'moth':
        blob(cx, cy, 3, dark)
        draw.polygon([(cx, cy), (cx - 12, cy - 6), (cx - 4, cy + 2)], fill=body + (255,))
        draw.polygon([(cx, cy), (cx + 12, cy - 6), (cx + 4, cy + 2)], fill=body + (255,))
        draw.polygon([(cx, cy), (cx - 8, cy + 8), (cx - 1, cy + 2)], fill=accent + (255,))
        draw.polygon([(cx, cy), (cx + 8, cy + 8), (cx + 1, cy + 2)], fill=accent + (255,))
        eyes(cx, cy - 1)
    elif shape == 'bird':
        draw.polygon([(cx - 3, cy + 4), (cx + 3, cy + 2), (cx + 1, cy - 8)], fill=body + (255,))
        wing = -8 if frame % 2 == 0 else -3
        draw.polygon([(cx, cy), (cx - 10, cy + wing), (cx - 1, cy + 3)], fill=accent + (255,))
        draw.polygon([(cx, cy), (cx + 10, cy + wing), (cx + 1, cy + 3)], fill=accent + (255,))
        eyes(cx, cy - 4)
    elif shape == 'rat':
        blob(cx, cy + 1, 6, body)
        draw.polygon([(cx - 4, cy - 6), (cx - 1, cy - 2), (cx - 7, cy - 2)], fill=body + (255,))
        draw.polygon([(cx + 4, cy - 6), (cx + 1, cy - 2), (cx + 7, cy - 2)], fill=body + (255,))
        draw.line((cx - 8, cy + 2, cx - 12, cy + 6), fill=accent + (255,))
        eyes(cx, cy)
    elif shape == 'mouse':
        blob(cx, cy + 1, 6, body)
        draw.polygon([(cx - 4, cy - 8), (cx - 1, cy - 2), (cx - 7, cy - 3)], fill=body + (255,))
        draw.polygon([(cx + 4, cy - 8), (cx + 1, cy - 2), (cx + 7, cy - 3)], fill=body + (255,))
        blob(cx - 4, cy + 1, 2, accent)
        blob(cx + 4, cy + 1, 2, accent)
        eyes(cx, cy - 1)
    elif shape == 'armor':
        draw.polygon([(cx - 7, cy + 6), (cx + 7, cy + 6), (cx + 5, cy - 6), (cx - 5, cy - 6)], fill=body + (255,))
        draw.polygon([(cx - 3, cy - 6), (cx + 3, cy - 6), (cx, cy - 12)], fill=accent + (255,))
        eyes(cx, cy - 1)
    elif shape == 'plant':
        blob(cx, cy + 2, 6, body)
        draw.ellipse((cx - 4, cy - 12 + bob, cx + 4, cy - 4 + bob), fill=accent + (255,))
        draw.rectangle((cx - 1, cy - 4, cx + 1, cy + 2), fill=dark + (255,))
        eyes(cx, cy + 1)
    elif shape == 'duck':
        blob(cx, cy + 1, 7, body)
        bill = accent
        if facing == 'left':
            draw.polygon([(cx - 2, cy - 1), (cx - 8, cy), (cx - 2, cy + 2)], fill=bill + (255,))
        elif facing == 'right':
            draw.polygon([(cx + 2, cy - 1), (cx + 8, cy), (cx + 2, cy + 2)], fill=bill + (255,))
        elif facing == 'down':
            draw.polygon([(cx - 3, cy + 2), (cx + 3, cy + 2), (cx, cy + 6)], fill=bill + (255,))
        eyes(cx, cy - 2)
    elif shape == 'frog':
        blob(cx, cy + 2, 6, body)
        blob(cx - 4, cy - 5, 3, accent)
        blob(cx + 4, cy - 5, 3, accent)
        eyes(cx, cy - 5)
    elif shape == 'fighter':
        draw.rectangle((cx - 5, cy - 4, cx + 5, cy + 7), fill=body + (255,))
        arm_y = cy - 1 if frame != 3 else cy - 6
        draw.rectangle((cx - 9, arm_y, cx - 5, arm_y + 4), fill=body + (255,))
        draw.rectangle((cx + 5, arm_y, cx + 9, arm_y + 4), fill=accent + (255,))
        blob(cx, cy - 8, 4, body)
        eyes(cx, cy - 8)
    elif shape == 'rock':
        draw.polygon([(cx - 8, cy + 6), (cx + 7, cy + 5), (cx + 5, cy - 6), (cx - 2, cy - 9), (cx - 8, cy - 2)], fill=body + (255,))
        draw.polygon([(cx - 2, cy - 2), (cx + 3, cy + 2), (cx - 1, cy + 4)], fill=dark + (255,))
        eyes(cx - 1, cy - 1)
    elif shape == 'orb':
        blob(cx, cy, 8, body)
        draw.rectangle((cx - 6, cy - 1, cx + 6, cy + 1), fill=accent + (255,))
        eyes(cx, cy - 3)
    elif shape == 'ghost':
        draw.polygon([(cx - 7, cy + 7), (cx - 7, cy - 2), (cx, cy - 10), (cx + 7, cy - 2), (cx + 7, cy + 7), (cx + 3, cy + 3), (cx, cy + 7), (cx - 3, cy + 3)], fill=body + (255,))
        eyes(cx, cy - 2)
    elif shape == 'psychic':
        blob(cx, cy + 2, 6, body)
        draw.polygon([(cx - 6, cy - 2), (cx, cy - 12), (cx + 2, cy - 2)], fill=accent + (255,))
        draw.polygon([(cx + 6, cy - 2), (cx, cy - 12), (cx - 2, cy - 2)], fill=dark + (255,))
        eyes(cx, cy)
    else:
        blob(cx, cy, 7, body)
        eyes(cx, cy - 1)
    if frame == 3 and facing != 'up':
        muzzle = {'left': (cx - 12, cy), 'right': (cx + 8, cy), 'down': (cx - 2, cy + 8)}[facing]
        draw.rectangle((muzzle[0], muzzle[1], muzzle[0] + 4, muzzle[1] + 3), fill=accent + (255,))
    return image


def sheet_for(shape, body, accent, dark):
    sheet = blank(CELL * 4, CELL * 4)
    for row, facing in enumerate(DIRS):
        for frame in range(4):
            cell = draw_creature(shape, body, accent, dark, facing, frame)
            sheet.paste(cell, (frame * CELL, row * CELL), cell)
    return sheet


def human_sheet(shirt, hair, skin=(242, 206, 176), hat=None):
    sheet = blank(CELL * 4, CELL * 4)
    for row, facing in enumerate(DIRS):
        for frame in range(4):
            image = blank(CELL, CELL)
            draw = ImageDraw.Draw(image)
            dx, dy = shift_for(facing, frame)
            x, y = 16 + dx, 19 + dy
            draw.ellipse((x - 6, 26, x + 6, 30), fill=(0, 0, 0, 60))
            draw.rectangle((x - 4, y + 1, x - 1, y + 7), fill=(36, 40, 64, 255))
            draw.rectangle((x + 1, y + 1, x + 4, y + 7), fill=(36, 40, 64, 255))
            draw.rectangle((x - 5, y - 6, x + 5, y + 2), fill=shirt + (255,))
            draw.ellipse((x - 5, y - 15, x + 5, y - 5), fill=skin + (255,))
            draw.rectangle((x - 5, y - 16, x + 5, y - 11), fill=hair + (255,))
            if hat:
                draw.rectangle((x - 6, y - 17, x + 6, y - 13), fill=hat + (255,))
            if facing != 'up':
                ink = (24, 20, 28, 255)
                ey = y - 10
                if facing == 'left':
                    draw.point((x - 2, ey), fill=ink)
                elif facing == 'right':
                    draw.point((x + 2, ey), fill=ink)
                else:
                    draw.point((x - 2, ey), fill=ink)
                    draw.point((x + 2, ey), fill=ink)
            sheet.paste(image, (frame * CELL, row * CELL), image)
    return sheet


def front_and_back(sheet):
    idle = sheet.crop((CELL, 0, CELL * 2, CELL))
    front = blank(96, 96)
    big = idle.resize((64, 64), Image.NEAREST)
    front.paste(big, (16, 22), big)
    back_cell = sheet.crop((CELL, CELL * 3, CELL * 2, CELL * 4))
    back = blank(96, 96)
    back.paste(back_cell.resize((64, 64), Image.NEAREST), (16, 22), back_cell.resize((64, 64), Image.NEAREST))
    icon = idle.resize((32, 32), Image.NEAREST)
    return front, back, icon


def save_creature(name, sheet):
    characters = ROOT / 'characters'
    front_dir = ROOT / 'pokedex' / 'front'
    back_dir = ROOT / 'pokedex' / 'back'
    icon_dir = ROOT / 'pokedex' / 'icon'
    for folder in (characters, front_dir, back_dir, icon_dir):
        folder.mkdir(parents=True, exist_ok=True)
    sheet.save(characters / f'{name}.png')
    front, back, icon = front_and_back(sheet)
    front.save(front_dir / f'{name}.png')
    back.save(back_dir / f'{name}.png')
    icon.save(icon_dir / f'{name}.png')


def tileset():
    image = blank(32 * 14, 32)
    draw = ImageDraw.Draw(image)

    def tile(index, painter):
        painter(draw, index * 32, 0)

    def grass(d, x, y, alt=False):
        d.rectangle((x, y, x + 31, y + 31), fill=(52, 158, 72, 255))
        for i in range(6):
            px = x + 4 + ((i * 9 + (4 if alt else 0)) % 24)
            py = y + 6 + (i * 5 % 18)
            d.point((px, py), fill=(236, 214, 86, 255))

    def path(d, x, y, alt=False):
        color = (214, 176, 112, 255) if not alt else (198, 160, 98, 255)
        d.rectangle((x, y, x + 31, y + 31), fill=color)
        d.rectangle((x + 2, y + 2, x + 14, y + 14), fill=(226, 196, 140, 255))
        d.rectangle((x + 16, y + 16, x + 29, y + 29), fill=(186, 146, 86, 255))

    def water(d, x, y):
        d.rectangle((x, y, x + 31, y + 31), fill=(56, 132, 196, 255))
        d.arc((x + 4, y + 8, x + 20, y + 18), 200, 340, fill=(186, 226, 246, 255))
        d.arc((x + 12, y + 16, x + 28, y + 26), 200, 340, fill=(186, 226, 246, 255))

    def tree(d, x, y):
        d.rectangle((x, y, x + 31, y + 31), fill=(28, 92, 48, 255))
        d.ellipse((x + 6, y + 4, x + 26, y + 22), fill=(48, 150, 72, 255))
        d.rectangle((x + 14, y + 18, x + 18, y + 28), fill=(92, 64, 36, 255))

    def floor(d, x, y):
        d.rectangle((x, y, x + 31, y + 31), fill=(232, 214, 170, 255))
        d.rectangle((x, y, x + 31, y), fill=(196, 170, 120, 255))
        d.rectangle((x, y, x, y + 31), fill=(210, 186, 140, 255))

    def wall(d, x, y):
        d.rectangle((x, y, x + 31, y + 31), fill=(106, 70, 50, 255))
        d.rectangle((x + 4, y + 6, x + 28, y + 12), fill=(86, 54, 38, 255))
        d.rectangle((x + 4, y + 18, x + 28, y + 24), fill=(86, 54, 38, 255))

    def door(d, x, y):
        d.rectangle((x, y, x + 31, y + 31), fill=(138, 90, 50, 255))
        d.rectangle((x + 8, y + 6, x + 23, y + 28), fill=(92, 58, 36, 255))
        d.point((x + 18, y + 16), fill=(242, 214, 110, 255))

    def sign(d, x, y):
        d.rectangle((x, y, x + 31, y + 31), fill=(214, 176, 112, 255))
        d.rectangle((x + 8, y + 6, x + 24, y + 18), fill=(244, 236, 214, 255))
        d.rectangle((x + 14, y + 18, x + 17, y + 28), fill=(92, 64, 36, 255))

    def roof(d, x, y, color):
        d.rectangle((x, y, x + 31, y + 31), fill=color + (255,))
        d.rectangle((x, y + 24, x + 31, y + 31), fill=(0, 0, 0, 40))

    tile(0, lambda d, x, y: grass(d, x, y, False))
    tile(1, lambda d, x, y: grass(d, x, y, True))
    tile(2, lambda d, x, y: path(d, x, y, False))
    tile(3, lambda d, x, y: path(d, x, y, True))
    tile(4, water)
    tile(5, tree)
    tile(6, floor)
    tile(7, wall)
    tile(8, door)
    tile(9, sign)
    tile(10, lambda d, x, y: roof(d, x, y, (196, 92, 74)))
    tile(11, lambda d, x, y: roof(d, x, y, (77, 111, 154)))
    tile(12, lambda d, x, y: roof(d, x, y, (239, 127, 155)))
    tile(13, lambda d, x, y: roof(d, x, y, (63, 154, 90)))
    out = ROOT / 'tilesets'
    out.mkdir(parents=True, exist_ok=True)
    image.save(out / 'mint.png')


def ball_and_shot():
    anim = ROOT / 'animations'
    anim.mkdir(parents=True, exist_ok=True)
    ball = blank(16, 16)
    draw = ImageDraw.Draw(ball)
    draw.ellipse((1, 1, 14, 14), fill=(226, 72, 64, 255))
    draw.rectangle((1, 7, 14, 8), fill=(32, 28, 36, 255))
    draw.pieslice((1, 1, 14, 14), 0, 180, fill=(246, 246, 246, 255))
    draw.ellipse((6, 6, 9, 9), fill=(246, 246, 246, 255))
    ball.save(anim / 'ball.png')
    shot = blank(16, 16)
    draw = ImageDraw.Draw(shot)
    draw.ellipse((2, 2, 13, 13), fill=(255, 244, 180, 255))
    draw.ellipse((5, 5, 10, 10), fill=(255, 255, 255, 255))
    shot.save(anim / 'shot.png')


def main():
    for name, shape, body, accent, dark in SPECIES:
        save_creature(name, sheet_for(shape, body, accent, dark))
    people = {
        'player': ((72, 120, 196), (64, 48, 40), (226, 72, 64)),
        'mom': ((224, 122, 154), (92, 52, 40), None),
        'prof': ((244, 241, 232), (180, 180, 186), (72, 110, 86)),
        'nurse': ((255, 143, 179), (92, 48, 48), (246, 246, 250)),
        'clerk': ((125, 186, 106), (48, 40, 32), None),
        'leader': ((240, 195, 106), (48, 36, 28), None),
        'champion': ((242, 211, 107), (48, 40, 64), (64, 48, 120)),
        'raid': ((168, 120, 214), (246, 246, 250), (96, 64, 150)),
    }
    for name, (shirt, hair, hat) in people.items():
        if name == 'raid':
            save_creature(name, sheet_for('psychic', shirt, hair, hat))
        else:
            save_creature(name, human_sheet(shirt, hair, hat=hat))
    tileset()
    ball_and_shot()
    print(f'wrote PSDK graphics under {ROOT}')


if __name__ == '__main__':
    main()
