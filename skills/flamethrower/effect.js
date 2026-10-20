import { R } from '../../lib/render-api.js';
export const id='flamethrower';
export const nameKo='화염방사';
export const kind='special';

export function draw(m){
 const {ctx,SPRITE_PX,SPRITE_SCALE,pxLayeredBeam,pxJaggedBurst,pxRadialLines,pxTex,pxFloorRing,arcadePal,fxQuality,snap,time}=R();
 const length=m.stream||0;if(length<SPRITE_PX*4)return;
 const vx=m.vx,vy=m.vy,t=m.age;
 const x0=m.x, y0=m.y; // already mouth-anchored in update
 const x1=(m.hitX!=null)?m.hitX:m.x+vx*length, y1=(m.hitY!=null)?m.hitY:m.y+vy*length;
 const cols={ink:'#2a0e0a', body:'#ff4a12', accent:'#ffd24a', hot:'#fff8e8'};
 const half=SPRITE_PX*(fxQuality==='low'?5:7);
 pxLayeredBeam(x0,y0,x1,y1,half,cols,{t, spiral:true, tip:false, wobble:true, alpha:1});
 // tip clash at the actual hit / stream end
 pxJaggedBurst(x1,y1, half*1.25, '#1a0a08', '#ff5a18', '#ffffff', .95);
 pxRadialLines(x1,y1, half*.25, half*2.0, fxQuality==='low'?10:14, '#fff3c8', .88, .68);
 // small mouth flare at origin
 pxJaggedBurst(x0,y0, SPRITE_PX*3, cols.ink, cols.body, cols.hot, .85);
}
