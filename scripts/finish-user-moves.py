"""Build deterministic cell animations from the user's preserved pixel drafts."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'assets/pixel-moves'

def load(name):
    return json.loads((BASE / 'user-drafts' / (name + '.json')).read_text())

def cells(asset, frame=0):
    flat = []
    runs = asset['frames'][frame]['runs']
    for value, count in zip(runs[::2], runs[1::2]):
        flat.extend([value] * count)
    return {(i % 128, i // 128): v for i, v in enumerate(flat) if v}

def encode(c):
    flat = [c.get((x, y), 0) for y in range(96) for x in range(128)]
    runs = []
    for v in flat:
        if runs and runs[-2] == v:
            runs[-1] += 1
        else:
            runs.extend([v, 1])
    return {'runs': runs}

def shape(rows, x=60, bottom=50):
    return {(x+i, bottom-len(rows)+1+j): int(v)
            for j, row in enumerate(rows) for i, v in enumerate(row) if v != '.'}

assets = {}
a = load('ember')
small, tall = cells(a), cells(a, 10)
mid = shape(['...11...', '..151...', '..1521..', '.152221.', '1234321.', '1233321.', '.12221..', '..111...'])
rise = shape(['....1...', '...151..', '..1521..', '..15221.', '.1523221', '12343321', '12344321', '12333321', '.122221.', '..1111..'])
tip = dict(tall)
for p in [(63,40),(64,40),(62,41)]: tip.pop(p, None)
tip[(65,39)] = 1; tip[(65,40)] = 5; tip[(64,41)] = 5
tip[(63,46)] = 4
tiny = dict(small); tiny[(63,44)] = 1; tiny[(62,46)] = 2
# The first and peak frames retain the user's drawing verbatim. No blank beat.
a['frames'] = list(map(encode, [small,tiny,mid,rise,tall,tip,tall,tip,tall,rise,mid,tiny,small,small]))
a['fps'] = 16
assets[a['id']] = a

a = load('thundershock'); bolt = cells(a)
frames = []
for i in range(8):
    c = dict(bolt)
    # Light runs along the existing zigzag; the silhouette stays recognizable.
    if i in (1,2,5,6):
        for p in [(64,41),(63,43),(62,45),(61,47),(63,47),(65,48),(66,49),(65,51),(64,54)]:
            if p in c: c[p] = 3 if i in (2,6) else 4
    if i in (2,3,6):
        for x,y in ([(57,43),(56,42),(71,52),(72,53)] if i != 6 else [(58,52),(57,53),(70,42),(71,41)]):
            c[(x,y)] = 4
    frames.append(encode(c))
a['frames'] = frames; a['fps'] = 16; assets[a['id']] = a

a = load('watergun'); drop = cells(a); frames = []
for i in range(8):
    c = dict(drop)
    # Keep the compact head; separated drops form a short directional jet.
    if i not in (0,7):
        tailx = 57 - (i % 3)
        for dx,dy,v in [(0,0,3),(1,-1,3),(1,0,2),(2,0,1),(1,1,4),(2,1,3)]:
            c[(tailx+dx,48+dy)] = v
    if i in (2,3,4,5):
        c[(51+i%2,49)] = 2; c[(52+i%2,49)] = 3
    if i in (2,3,6):
        c[(63,47)] = 1; c[(64,48)] = 2
    frames.append(encode(c))
a['frames'] = frames; a['fps'] = 16; assets[a['id']] = a

for name, asset in assets.items():
    (BASE / 'completed' / (name+'.json')).write_text(json.dumps(asset,separators=(',',':'))+'\n')
(ROOT/'pixel-presets.js').write_text('/* Completed from user-authored drafts; regenerate with scripts/finish-user-moves.py. */\nwindow.ArenaPixelPresets='+json.dumps(assets,separators=(',',':'))+';\n')
