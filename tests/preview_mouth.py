#!/usr/bin/env python3
"""Produce contact strips for visually checking PMD Charizard mouth coordinates."""
import base64,json,os,struct,subprocess,zlib
from audit_emission_pixels import png_rgba
FRAMES=[int(f) for f in os.environ.get('PMD_CONTACT_FRAMES','0,3,6,8,11,13,17').split(',')]
ATLAS=json.loads(subprocess.check_output(['node','-e',"global.window={};require('./emitter-anchors.js');console.log(JSON.stringify(window.PMD_EMISSION_ATLAS['0006']))"],text=True))
W,H,bpp,image=png_rgba("https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/"+ATLAS['source'])
def chunk(name,content):
    body=name+content
    return struct.pack(">I",len(content))+body+struct.pack(">I",zlib.crc32(body))
def encode(w,h,rgba):
    raw=b''.join(b'\x00'+rgba[y*w*4:(y+1)*w*4] for y in range(h))
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack(">IIBBBBB",w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
scale=int(os.environ.get('PMD_CONTACT_SCALE','2'))
pairs=[tuple(map(int,pair.split(','))) for pair in os.environ.get('PMD_CONTACT_PAIRS','0,1;2,3;4,5;6,7').split(';')]
for pair in pairs:
    width=len(FRAMES)*64*scale;height=2*88*scale;buf=bytearray(width*height*4)
    for Y in range(height):
        direction=pair[Y//(88*scale)]
        ly=(Y//scale)%88
        for X in range(width):
            col=X//(64*scale);frame=FRAMES[col];lx=(X//scale)%64
            px=(frame*64+lx);py=direction*88+ly
            off=px*bpp;row=image[py]
            alpha=row[off+3] if bpp==4 else 255
            r,g,b=(row[off],row[off+1],row[off+2]) if alpha>20 else (22,27,37)
            if X%(64*scale)==0 or Y%(88*scale)==0:r,g,b=(75,92,104)
            point=ATLAS['ports']['mouth']['frames'][direction][frame]
            if abs(lx-point[0])<=1 and abs(ly-point[1])<=1:r,g,b=(255,40,55)
            out=(Y*width+X)*4;buf[out:out+4]=bytes((r,g,b,255))
    label=f"DIRS_{pair[0]}_{pair[1]}_PNG="
    print(label+base64.b64encode(encode(width,height,buf)).decode())
