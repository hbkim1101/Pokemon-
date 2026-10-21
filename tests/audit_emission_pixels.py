#!/usr/bin/env python3
"""Check stored per-frame emitter landmarks against alpha pixels in the actual
PMDCollab source PNGs. Geometric proximity is diagnostic: it cannot infer
anatomical correctness of a mouth or cannon.
"""
import json, struct, subprocess, urllib.request, zlib
def png_rgba(url):
    raw=urllib.request.urlopen(url, timeout=25).read()
    assert raw[:8]==b'\x89PNG\r\n\x1a\n'
    off=8; idat=[]; width=height=bpp=0
    while off<len(raw):
        length=struct.unpack('>I',raw[off:off+4])[0];typ=raw[off+4:off+8]
        data=raw[off+8:off+8+length];off+=length+12
        if typ==b'IHDR':
            width,height,depth,mode,*_=struct.unpack('>IIBBBBB',data)
            assert depth==8 and mode in (2,6), 'expected RGB or RGBA source'
            bpp=4 if mode==6 else 3
        elif typ==b'IDAT':idat.append(data)
        elif typ==b'IEND':break
    scan=zlib.decompress(b''.join(idat))
    stride=width*bpp;src=0;prev=bytearray(stride);result=[]
    for y in range(height):
        filt=scan[src];src+=1
        row=bytearray(scan[src:src+stride]);src+=stride
        for i in range(stride):
            a=row[i-bpp] if i>=bpp else 0
            b=prev[i]
            c=prev[i-bpp] if i>=bpp else 0
            if filt==1:row[i]=(row[i]+a)&255
            elif filt==2:row[i]=(row[i]+b)&255
            elif filt==3:row[i]=(row[i]+(a+b)//2)&255
            elif filt==4:
                pred=a+b-c;pa=abs(pred-a);pb=abs(pred-b);pc=abs(pred-c)
                row[i]=(row[i]+(a if pa<=pb and pa<=pc else b if pb<=pc else c))&255
            elif filt!=0:raise ValueError('unknown PNG filter '+str(filt))
        result.append(row)
        prev=row
    return width,height,bpp,result

def main():
    raw=subprocess.check_output(['node','-e',"global.window={};require('./emitter-anchors.js');process.stdout.write(JSON.stringify(window.PMD_EMISSION_ATLAS))"],text=True)
    atlas=json.loads(raw)
    all_bad=0
    for id,item in atlas.items():
        url='https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/'+item['source']
        try: W,H,bpp,pixels=png_rgba(url)
        except Exception as exc:
            print('SOURCE LOAD ERROR',id,str(exc))
            continue
        cw,ch=item['cell'];frame_count=W//cw
        print(f'\n{id} {item["species"]}: source {W}x{H}, cell {cw}x{ch}, frames={frame_count}, directions={H//ch}')
        bad=[]
        for name,port in item['ports'].items():
            for direction,frames in enumerate(port['frames']):
                for f,(cx,cy) in enumerate(frames):
                    if not (0<=cx<=cw and 0<=cy<=ch and f<frame_count):
                        bad.append((name,direction,f,'out-of-range'));continue
                    center_x=int(f*cw+cx);center_y=int(direction*ch+cy)
                    nearest=50
                    for dy in range(-12,13):
                        y=center_y+dy
                        if not (direction*ch<=y<(direction+1)*ch):continue
                        row=pixels[y]
                        for dx in range(-12,13):
                            x=center_x+dx
                            if not (f*cw<=x<(f+1)*cw):continue
                            if bpp!=4 or row[x*bpp+3]>48:
                                nearest=min(nearest,(dx*dx+dy*dy)**.5)
                    if nearest>9:bad.append((name,direction,f,round(nearest,1)))
        all_bad+=len(bad)
        print('  Anchors farther than 9px from opaque sprite:',len(bad))
        for issue in bad[:24]:print(' ',issue)
    print('\nAUDIT: landmarks outside visual-pixel proximity:',all_bad)
if __name__=='__main__':main()
